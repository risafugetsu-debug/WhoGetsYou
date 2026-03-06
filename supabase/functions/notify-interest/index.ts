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
  type: 'INSERT';
  table: string;
  schema: string;
  record: InterestRecord;
  old_record: null;
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();

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
      .select('first_name')
      .eq('id', payload.record.pre_bride_id)
      .single(),
  ]);

  const postBride = postBrideRes.data;
  const preBrideName = preBrideRes.data?.first_name ?? 'Someone';

  if (!postBride?.email) {
    return new Response('No email on file', { status: 200 });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return new Response('RESEND_API_KEY not set', { status: 500 });
  }

  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev';
  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://whogetsyou.com';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `WhoGetsYou <${fromEmail}>`,
      to: postBride.email,
      subject: `${preBrideName} is interested in your gown`,
      html: interestEmail(postBride.first_name, preBrideName, siteUrl),
    }),
  });

  if (!res.ok) {
    console.error('Resend error:', await res.text());
    return new Response('Email send failed', { status: 500 });
  }

  return new Response('OK', { status: 200 });
});

function interestEmail(postBrideName: string, preBrideName: string, siteUrl: string): string {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; padding: 48px 24px; background: #faf8f5; color: #2d2d2d;">
      <p style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #b76e79; margin: 0 0 12px;">WhoGetsYou</p>
      <h1 style="font-size: 26px; font-weight: 300; letter-spacing: 0.04em; margin: 0 0 28px; line-height: 1.3;">
        Hi, ${postBrideName}
      </h1>
      <p style="font-size: 15px; line-height: 1.75; color: #5a5050; margin: 0 0 28px;">
        <strong style="color: #2d2d2d;">${preBrideName}</strong> just expressed interest in your gown.
        Log in to see her fit and style compatibility, then decide whether to accept.
      </p>
      <a href="${siteUrl}/interests"
         style="display: inline-block; background: #b76e79; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 100px; font-size: 14px; letter-spacing: 0.05em;">
        See her profile →
      </a>
      <hr style="border: none; border-top: 1px solid #e8dede; margin: 48px 0 24px;" />
      <p style="font-size: 12px; color: #9a9080; line-height: 1.6; margin: 0;">
        You're receiving this because you have a gown listed on WhoGetsYou.
      </p>
    </div>
  `;
}
