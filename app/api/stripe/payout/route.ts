import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient, getUserFromToken } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId } = await req.json() as { bookingId: string };
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('post_bride_id', user.id)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.status !== 'booked') return NextResponse.json({ error: 'Booking is not in booked state' }, { status: 400 });

  const { data: stripeAccount } = await admin
    .from('stripe_accounts')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .single();

  if (!stripeAccount) return NextResponse.json({ error: 'No Stripe account found' }, { status: 400 });

  const payoutCents = booking.amount_cents - booking.platform_fee_cents;

  const transfer = await stripe.transfers.create({
    amount: payoutCents,
    currency: 'usd',
    destination: stripeAccount.stripe_account_id,
    transfer_group: bookingId,
    metadata: { booking_id: bookingId },
  });

  await admin.from('bookings').update({
    status: 'completed',
    stripe_transfer_id: transfer.id,
    completed_at: new Date().toISOString(),
  }).eq('id', bookingId);

  return NextResponse.json({ ok: true });
}
