import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { interest_id } = session.metadata ?? {};
    if (!interest_id) return NextResponse.json({ ok: true });

    await admin.from('bookings').update({
      status: 'booked',
      stripe_payment_intent_id: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null,
      paid_at: new Date().toISOString(),
    }).eq('stripe_checkout_session_id', session.id);
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    if (account.details_submitted) {
      await admin.from('stripe_accounts').update({
        onboarding_complete: true,
      }).eq('stripe_account_id', account.id);
    }
  }

  return NextResponse.json({ ok: true });
}
