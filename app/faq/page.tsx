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
      {
        q: 'Can I complete a transaction outside of WhoGetsYou?',
        a: 'We strongly advise against this. Any agreement made outside the platform — direct payments, cash deposits, side arrangements — is not eligible for WhoGetsYou\'s protection, dispute resolution, or refund policy. Both parties are unprotected if something goes wrong. Always keep your transaction on the platform.',
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
        q: 'Who is responsible for cleaning the gown?',
        a: 'The post-bride (lender) is responsible for ensuring the gown is clean and ready to wear before each rental. Bridal gown dry cleaning requires a specialist — typically $150–$400 depending on fabric and construction. We recommend factoring that cost into your rental pricing so each rental still makes financial sense for you.',
      },
      {
        q: 'Can I pause my listing?',
        a: 'Yes — you can pause and unpause your listing at any time from your dashboard. Pausing means your gown won\'t show up in new matches until you reactivate it.',
      },
      {
        q: 'Can a renter alter the gown?',
        a: 'No. Renters are not permitted to alter the gown in any way — cutting, dyeing, pinning, or any other modification — without your explicit written consent. Items must be returned in their original condition. Any unauthorized alteration is treated as damage.',
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
      {
        q: 'What if the gown doesn\'t match its listing?',
        a: 'If the gown arrives in a condition materially different from what was described or photographed — undisclosed damage, wrong style, significantly altered — contact WhoGetsYou Support within 24 hours of pickup. You will be eligible for a full refund. Please document the discrepancy with photos at the time of pickup.',
      },
      {
        q: 'Can I cancel my booking?',
        a: 'You can cancel up to 48 hours before the rental start date for a full refund. Cancellations within 48 hours of the start date are not eligible for a refund. If the post-bride cancels, you will receive a full refund automatically.',
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
        q: 'Is a security deposit required?',
        a: 'Yes. At checkout, a security authorization hold is placed on your payment method in addition to the rental fee. This hold equals the declared retail value of the gown (capped at $3,000) and is not a charge — it\'s a temporary authorization, like a hotel hold. It is released automatically when the gown is returned in its original condition. You will never be charged from this hold unless there is confirmed damage or non-return.',
      },
      {
        q: 'Does WhoGetsYou charge a fee?',
        a: 'Yes. WhoGetsYou takes a 20% service fee from each completed rental. This covers payment processing, platform maintenance, and lender protection. Post-brides keep 80% of the rental price they set. The price a renter pays is always the price the post-bride listed — no hidden fees added at checkout.',
      },
      {
        q: 'When does the post-bride receive payment?',
        a: 'Once the gown has been returned and the rental is complete, the post-bride can release the payment from her dashboard. Funds are then transferred directly to her connected bank account via Stripe.',
      },
      {
        q: 'What happens if the gown is returned late?',
        a: 'Late returns are charged at 2× the daily rental rate for each additional day. If the gown is not returned after 7 days past the agreed return date and the lender cannot be reached, the rental is treated as a lost item and the renter\'s security deposit is captured to cover the replacement value.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. All payments are processed by Stripe — WhoGetsYou never stores your card details. Stripe is PCI DSS compliant and used by millions of businesses worldwide.',
      },
    ],
  },
  {
    heading: 'Condition, damage & loss',
    items: [
      {
        q: 'Should I document the gown\'s condition at pickup?',
        a: 'Yes — and we strongly encourage both parties to do this together. Before the renter leaves with the gown, take photos of the front, back, and any existing wear, stains, or alterations. Both parties should agree on the documented condition at pickup. This protects the renter from being held responsible for pre-existing issues and protects the lender if damage occurs during the rental.',
      },
      {
        q: 'What counts as normal wear vs. damage?',
        a: 'Normal wear — not charged to the renter — includes light creasing, minor deodorant marks, and slight natural wear consistent with a single event. Damage the renter is responsible for includes: large or permanent stains, rips or tears, broken or missing hardware, missing embellishments, unauthorized alterations, and any bodily fluid contact which is considered unrepairable. When in doubt, document at pickup.',
      },
      {
        q: 'What happens if the gown is damaged during my rental?',
        a: 'Report damage to the lender and WhoGetsYou Support immediately — do not attempt to clean or repair the item without the lender\'s permission. WhoGetsYou will review condition photos from both pickup and return to determine responsibility. The renter is liable for repair costs or, if the item is beyond repair, the current resale replacement value of the gown.',
      },
      {
        q: 'What if the gown is lost or stolen during my rental?',
        a: 'If the gown is lost or stolen while in your care, you are responsible for the full replacement value, based on the gown\'s current resale value. WhoGetsYou will capture the security deposit hold to cover this. If you return the gown more than 7 days late with no contact, it will also be treated as lost.',
      },
      {
        q: 'How are damage disputes resolved?',
        a: 'First, reach out directly to the other party and try to resolve it between yourselves. If you cannot reach a resolution within 7 days, escalate to WhoGetsYou Support with photos and documentation. We will review the evidence and make a final decision within 48 hours.',
      },
      {
        q: 'Does WhoGetsYou offer any protection for lenders if their gown is damaged or lost?',
        a: 'Yes. WhoGetsYou offers automatic lender protection on every rental, funded by the platform fee. If a renter damages or loses your gown and is unable or unwilling to pay, WhoGetsYou will cover the loss up to the following caps based on your declared retail value:\n\n• Under $1,000: full declared value\n• $1,000–$4,000: up to $1,000 (requires photos and purchase receipt or professional appraisal)\n• $4,000–$8,000: up to $2,000 (requires documentation)\n• Over $8,000: up to $2,500 (requires documentation and manual review)\n\nPayouts are based on current resale value, not original retail. Claims must be submitted within 48 hours of the scheduled return date.',
      },
      {
        q: 'How is replacement value determined?',
        a: 'Replacement value is based on the gown\'s current resale market value — not the original retail price. For claims under $500, no documentation is required. For claims above $500, we require a photo of the original purchase receipt or a professional appraisal. If no receipt is available, the declared retail value on your listing is used as a reference, cross-checked against known market prices for the designer and style.',
      },
    ],
  },
  {
    heading: 'Trust & safety',
    items: [
      {
        q: 'How does the review system work?',
        a: 'After each completed rental, both parties can leave a review. Reviews are visible on profiles and help build trust across the community. We recommend reviewing every transaction — positive or negative — to help other users make informed decisions.',
      },
      {
        q: 'How does WhoGetsYou protect my personal information?',
        a: 'Your contact details and personal information are never shared publicly. Communication between lenders and renters happens through the platform. WhoGetsYou does not sell your data to third parties. See our Privacy Policy for full details.',
      },
      {
        q: 'What if I have a safety concern about another user?',
        a: 'Contact WhoGetsYou Support immediately at hello@whogetsyou.com. You can also block a user from your account settings. We take all safety concerns seriously and will respond within 24 hours.',
      },
    ],
  },
  {
    heading: 'Getting help',
    items: [
      {
        q: 'How do I contact WhoGetsYou?',
        a: 'Email us at hello@whogetsyou.com. We aim to respond within 48 hours, Monday through Friday.',
      },
      {
        q: 'What if the other party is unresponsive?',
        a: 'If you\'ve tried reaching the other party through the platform and received no response for more than 48 hours, contact WhoGetsYou Support. We can intervene, cancel the order if needed, and ensure the appropriate refund or payout is processed.',
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
                  <p className="pb-5 text-sm text-[var(--color-muted)] leading-relaxed whitespace-pre-line">
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
