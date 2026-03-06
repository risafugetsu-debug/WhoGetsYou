import { createClient } from 'npm:@supabase/supabase-js@2';

interface InterestRecord {
  id: string;
  pre_bride_id: string;
  post_bride_id: string;
  listing_id: string;
  created_at: string;
  accepted_at: string | null;
}

interface WebhookPayload {
  type: 'UPDATE';
  table: string;
  schema: string;
  record: InterestRecord;
  old_record: InterestRecord;
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();

  // Only fire when accepted_at transitions from null → a value (first acceptance only)
  if (!payload.record.accepted_at || payload.old_record.accepted_at) {
    return new Response('Not an acceptance event', { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const [postBrideRes, preBrideRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, email')
      .eq('id', payload.record.post_bride_id)
      .single(),
    supabase
      .from('profiles')
      .select('first_name, email')
      .eq('id', payload.record.pre_bride_id)
      .single(),
  ]);

  const postBride = postBrideRes.data;
  const preBride = preBrideRes.data;

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return new Response('RESEND_API_KEY not set', { status: 500 });
  }

  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev';
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://whogetsyou.com';

  const sends: Promise<Response>[] = [];

  // Notify pre-bride: her interest was accepted
  if (preBride?.email && postBride) {
    sends.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `WhoGetsYou <${fromEmail}>`,
          to: preBride.email,
          subject: `${postBride.first_name} accepted your interest`,
          html: preBrideAcceptedEmail(preBride.first_name, postBride.first_name, postBride.email ?? '', siteUrl),
        }),
      })
    );
  }

  // Notify post-bride: confirmation she accepted, with pre-bride's contact
  if (postBride?.email && preBride) {
    sends.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `WhoGetsYou <${fromEmail}>`,
          to: postBride.email,
          subject: `You accepted ${preBride.first_name}'s interest`,
          html: postBrideAcceptedEmail(postBride.first_name, preBride.first_name, preBride.email ?? '', siteUrl),
        }),
      })
    );
  }

  const results = await Promise.all(sends);
  const failed = results.filter((r) => !r.ok);

  if (failed.length > 0) {
    for (const r of failed) console.error('Resend error:', await r.text());
    return new Response('One or more emails failed', { status: 500 });
  }

  return new Response('OK', { status: 200 });
});

function preBrideAcceptedEmail(
  preBrideName: string,
  postBrideName: string,
  postBrideEmail: string,
  siteUrl: string,
): string {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; padding: 48px 24px; background: #faf8f5; color: #2d2d2d;">
      <p style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #b76e79; margin: 0 0 12px;">WhoGetsYou</p>
      <h1 style="font-size: 26px; font-weight: 300; letter-spacing: 0.04em; margin: 0 0 28px; line-height: 1.3;">
        She said yes, ${preBrideName}
      </h1>
      <p style="font-size: 15px; line-height: 1.75; color: #5a5050; margin: 0 0 20px;">
        <strong style="color: #2d2d2d;">${postBrideName}</strong> accepted your interest in her gown.
        You can now reach out to her directly.
      </p>
      <div style="background: #f5e6e8; border-radius: 12px; padding: 20px 24px; margin: 0 0 28px;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #b76e79; margin: 0 0 6px;">Contact</p>
        <a href="mailto:${postBrideEmail}"
           style="font-size: 16px; color: #2d2d2d; text-decoration: underline; font-weight: 500;">
          ${postBrideEmail}
        </a>
      </div>
      <a href="${siteUrl}/matches"
         style="display: inline-block; background: #b76e79; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 100px; font-size: 14px; letter-spacing: 0.05em;">
        View your matches →
      </a>
      <hr style="border: none; border-top: 1px solid #e8dede; margin: 48px 0 24px;" />
      <p style="font-size: 12px; color: #9a9080; line-height: 1.6; margin: 0;">
        You're receiving this because you expressed interest in a gown on WhoGetsYou.
      </p>
    </div>
  `;
}

function postBrideAcceptedEmail(
  postBrideName: string,
  preBrideName: string,
  preBrideEmail: string,
  siteUrl: string,
): string {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; padding: 48px 24px; background: #faf8f5; color: #2d2d2d;">
      <p style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #b76e79; margin: 0 0 12px;">WhoGetsYou</p>
      <h1 style="font-size: 26px; font-weight: 300; letter-spacing: 0.04em; margin: 0 0 28px; line-height: 1.3;">
        Hi, ${postBrideName}
      </h1>
      <p style="font-size: 15px; line-height: 1.75; color: #5a5050; margin: 0 0 20px;">
        You accepted <strong style="color: #2d2d2d;">${preBrideName}</strong>'s interest in your gown.
        She's been notified and can now reach out to you.
      </p>
      <div style="background: #f5e6e8; border-radius: 12px; padding: 20px 24px; margin: 0 0 28px;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #b76e79; margin: 0 0 6px;">${preBrideName}'s contact</p>
        <a href="mailto:${preBrideEmail}"
           style="font-size: 16px; color: #2d2d2d; text-decoration: underline; font-weight: 500;">
          ${preBrideEmail}
        </a>
      </div>
      <a href="${siteUrl}/interests"
         style="display: inline-block; background: #b76e79; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 100px; font-size: 14px; letter-spacing: 0.05em;">
        See all interested brides →
      </a>
      <hr style="border: none; border-top: 1px solid #e8dede; margin: 48px 0 24px;" />
      <p style="font-size: 12px; color: #9a9080; line-height: 1.6; margin: 0;">
        You're receiving this because you have a gown listed on WhoGetsYou.
      </p>
    </div>
  `;
}
