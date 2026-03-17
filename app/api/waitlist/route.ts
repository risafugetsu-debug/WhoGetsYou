// app/api/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { email, first_name } = await req.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const { error: dbError } = await supabase.from('waitlist_submissions').insert({
    email: email.trim(),
    first_name: first_name?.trim() || null,
    role: 'lender',
  });

  if (dbError) {
    console.error('[waitlist] Supabase insert error:', dbError);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      templateId: 1,
      to: [{ email: email.trim(), name: first_name?.trim() || '' }],
    }),
  });

  if (!brevoRes.ok) {
    const brevoErr = await brevoRes.text();
    console.error('[waitlist] Brevo email error:', brevoErr);
    // Do not return error to client — DB write succeeded
  }

  return NextResponse.json({ ok: true });
}
