export const metadata = {
  title: 'FAQ — WhoGetsYou',
  description: 'Answers to common questions about renting and listing bridal gowns on WhoGetsYou.',
};

const sections = [
  {
    heading: 'How it works',
    items: [
      {
        q: 'What is WhoGetsYou?',
        a: 'WhoGetsYou is a peer-to-peer bridal gown rental platform connecting post-brides — women who\'ve already worn their gown — with pre-brides who are looking for one. Matching is based on body measurements and style preferences, so every dress a pre-bride sees has already been filtered for fit.',
      },
      {
        q: 'Is WhoGetsYou available outside New York City?',
        a: 'Right now we\'re focused on New York City — Manhattan, Brooklyn, Queens, The Bronx, and Staten Island. Rentals are handled in person, so keeping it local means smoother handovers and try-ons. We\'re working on expanding to more cities.',
      },
      {
        q: 'How does the handover work?',
        a: 'Once a booking is confirmed, the post-bride and pre-bride coordinate directly to arrange pickup and return. WhoGetsYou handles the payment — you handle the meeting. We recommend meeting somewhere convenient in your borough.',
      },
    ],
  },
  {
    heading: 'For post-brides (listing your gown)',
    items: [
      {
        q: 'How do I list my gown?',
        a: 'Sign up as a post-bride, complete your measurements, and create a listing. You\'ll add photos, describe the condition, set your rental price, and mark your availability window. Your gown will then appear in matches for pre-brides whose measurements are compatible with yours.',
      },
      {
        q: 'Can I set my own rental price?',
        a: 'Yes — you set the price for 1-day, 3-day, and 7-day rentals. Gowns priced at 10–20% of their retail value tend to get the most interest. You can also enter the original retail price so renters can see how much they\'re saving.',
      },
      {
        q: 'Do I keep my dress?',
        a: 'Yes. This is a rental, not consignment. Your dress comes back to you after each rental. Whatever you earn is clear profit from something that would otherwise be sitting in a bag.',
      },
      {
        q: 'Can I pause my listing?',
        a: 'Yes — you can pause and unpause your listing at any time from your dashboard. Pausing means your gown won\'t show up in new matches until you reactivate it.',
      },
    ],
  },
  {
    heading: 'For pre-brides (renting a gown)',
    items: [
      {
        q: 'How does matching work?',
        a: 'When you sign up, you enter your measurements and style preferences. Our algorithm scores every available gown against your profile — factoring in bust, waist, hips, height, and aesthetic. You see your top matches ranked by compatibility, not just availability.',
      },
      {
        q: 'Can I try on the dress before committing?',
        a: 'Yes. Expressing interest doesn\'t lock you into anything. Once a post-bride accepts your interest, you can arrange a try-on before completing your booking and payment.',
      },
      {
        q: 'What if the dress doesn\'t fit when I try it on?',
        a: 'If it doesn\'t work for you after a try-on, you simply don\'t proceed with the booking — no payment has been made yet. Payment is only collected when you confirm your booking through the platform.',
      },
    ],
  },
  {
    heading: 'Payments & fees',
    items: [
      {
        q: 'How does payment work?',
        a: 'Once your interest is accepted, you\'ll see a "Complete booking" option on the listing page. You\'ll be taken to a secure checkout powered by Stripe. Payment is held by WhoGetsYou until the rental is complete, then released to the post-bride.',
      },
      {
        q: 'Does WhoGetsYou charge a fee?',
        a: 'Yes. WhoGetsYou takes a 20% service fee from each completed rental. This covers payment processing, platform maintenance, and ongoing support for both sides. Post-brides keep 80% of the rental price they set. The price a renter pays is always the price the post-bride listed — no hidden fees for either party.',
      },
      {
        q: 'When does the post-bride receive payment?',
        a: 'Once the gown has been returned and the rental is complete, the post-bride can release the payment from her dashboard. Funds are then transferred directly to her connected bank account via Stripe.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. All payments are processed by Stripe — WhoGetsYou never stores your card details. Stripe is PCI DSS compliant and used by millions of businesses worldwide.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-light tracking-wide text-[var(--color-charcoal)]">
        Frequently asked questions
      </h1>
      <p className="mt-3 text-sm text-[var(--color-muted)] leading-relaxed">
        Can&apos;t find what you&apos;re looking for? Email us at{' '}
        <a href="mailto:hello@whogetsyou.com" className="text-[var(--color-rose)] hover:underline">
          hello@whogetsyou.com
        </a>
      </p>

      <div className="mt-12 space-y-12">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="mb-6 text-xs uppercase tracking-widest text-[var(--color-rose)]">
              {section.heading}
            </h2>
            <div className="space-y-px">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="group border-t border-[var(--color-border)] last:border-b"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-sm font-medium text-[var(--color-charcoal)] hover:text-[var(--color-rose)] transition-colors list-none">
                    {item.q}
                    <span className="shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-sm text-[var(--color-muted)] leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
