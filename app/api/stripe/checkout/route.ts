import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient, getUserFromToken } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId, rentalDays, rentalStartDate } = await req.json() as {
    listingId: string;
    rentalDays: 3 | 7 | 14;
    rentalStartDate: string; // ISO date string e.g. '2026-09-15'
  };

  if (!listingId || ![3, 7, 14].includes(rentalDays) || !rentalStartDate) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const startDate = new Date(rentalStartDate + 'T12:00:00');
  if (isNaN(startDate.getTime()) || startDate < new Date()) {
    return NextResponse.json({ error: 'Invalid rental start date' }, { status: 400 });
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + rentalDays - 1);
  const rentalEndDate = endDate.toISOString().split('T')[0];

  const admin = createAdminClient();

  const [listingRes, interestRes] = await Promise.all([
    admin.from('gown_listings').select('*').eq('id', listingId).single(),
    admin.from('interests')
      .select('id, accepted_at, listing_id')
      .eq('pre_bride_id', user.id)
      .eq('listing_id', listingId)
      .not('accepted_at', 'is', null)
      .single(),
  ]);

  if (!listingRes.data || !interestRes.data) {
    return NextResponse.json({ error: 'Listing or interest not found' }, { status: 404 });
  }

  const listing = listingRes.data as {
    id: string; user_id: string;
    price_3day: number | null; price_7day: number | null; price_14day: number | null;
    available_from: string | null; available_until: string | null;
  };

  // Validate dates fall within lender's availability window
  if (listing.available_from && rentalStartDate < listing.available_from) {
    return NextResponse.json({ error: 'Rental start date is before the gown is available' }, { status: 400 });
  }
  if (listing.available_until && rentalEndDate > listing.available_until) {
    return NextResponse.json({ error: 'Rental end date is after the gown availability window' }, { status: 400 });
  }

  const priceMap: Record<number, number | null> = {
    3: listing.price_3day,
    7: listing.price_7day,
    14: listing.price_14day,
  };
  const priceUsd = priceMap[rentalDays];
  if (!priceUsd) return NextResponse.json({ error: 'Price not set for this duration' }, { status: 400 });

  const amountCents = priceUsd * 100;
  const platformFeeCents = Math.round(amountCents * 0.20);

  const { data: stripeAccount } = await admin
    .from('stripe_accounts')
    .select('stripe_account_id, onboarding_complete')
    .eq('user_id', listing.user_id)
    .single();

  if (!stripeAccount?.onboarding_complete) {
    return NextResponse.json({ error: 'Seller has not set up payouts yet' }, { status: 400 });
  }

  const { data: existingBooking } = await admin
    .from('bookings')
    .select('id, status, stripe_checkout_session_id')
    .eq('interest_id', interestRes.data.id)
    .single();

  if (existingBooking?.status === 'booked' || existingBooking?.status === 'completed') {
    return NextResponse.json({ error: 'Already booked' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Wedding gown rental — ${rentalDays} days (${rentalStartDate} – ${rentalEndDate})`,
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${appUrl}/booking/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/listings/${listingId}`,
    metadata: {
      interest_id: interestRes.data.id,
      listing_id: listingId,
      pre_bride_id: user.id,
      post_bride_id: listing.user_id,
      rental_days: rentalDays.toString(),
      rental_start_date: rentalStartDate,
      rental_end_date: rentalEndDate,
      amount_cents: amountCents.toString(),
      platform_fee_cents: platformFeeCents.toString(),
    },
  });

  const bookingData = {
    interest_id: interestRes.data.id,
    listing_id: listingId,
    pre_bride_id: user.id,
    post_bride_id: listing.user_id,
    rental_days: rentalDays,
    rental_start_date: rentalStartDate,
    rental_end_date: rentalEndDate,
    amount_cents: amountCents,
    platform_fee_cents: platformFeeCents,
    stripe_checkout_session_id: session.id,
    status: 'pending_payment',
  };

  if (existingBooking) {
    await admin.from('bookings').update({
      stripe_checkout_session_id: session.id,
      rental_start_date: rentalStartDate,
      rental_end_date: rentalEndDate,
      status: 'pending_payment',
    }).eq('id', existingBooking.id);
  } else {
    await admin.from('bookings').insert(bookingData);
  }

  return NextResponse.json({ url: session.url });
}
