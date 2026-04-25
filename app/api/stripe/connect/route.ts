import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient, getUserFromToken } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('stripe_accounts')
    .select('stripe_account_id, onboarding_complete')
    .eq('user_id', user.id)
    .single();

  let accountId = existing?.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({ type: 'express' });
    accountId = account.id;
    await admin.from('stripe_accounts').insert({
      user_id: user.id,
      stripe_account_id: accountId,
      onboarding_complete: false,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/dashboard?stripe=refresh`,
    return_url: `${appUrl}/dashboard?stripe=connected`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: link.url });
}
