import Link from 'next/link';
import Image from 'next/image';
import HeroCTAs from '@/components/HeroCTAs';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-28 text-center">
        <p className="mb-4 text-xs uppercase tracking-widest text-[var(--color-rose)]">
          New York City
        </p>
        <h1 className="max-w-2xl text-5xl font-light leading-tight tracking-wide text-[var(--color-charcoal)] md:text-6xl">
          Your dream dress is already out there.
        </h1>
        <p className="mt-6 max-w-lg text-lg text-[var(--color-muted)] leading-relaxed">
          WhoGetsYou connects brides who&apos;ve worn their gown with brides who are ready to wear
          one — matched by fit, style, and story.
        </p>
        <HeroCTAs />
        <p className="mt-6 text-xs text-[var(--color-muted)]">
          Currently serving New York City — Manhattan, Brooklyn, Queens, The Bronx &amp; Staten Island
        </p>
      </section>

      <div className="mx-auto max-w-6xl border-t border-[var(--color-border)] px-6" />

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-16 text-center text-3xl font-light tracking-wide text-[var(--color-charcoal)]">
            How it works
          </h2>
          <div className="grid gap-12 md:grid-cols-3">
            <HowItWorksStep
              number="01"
              title="Create your profile"
              description="Share your measurements and style preferences. We use them to find gowns that will actually fit — not just look good on a hanger."
            />
            <HowItWorksStep
              number="02"
              title="Get matched"
              description="Our matching algorithm pairs pre-brides with post-brides based on body measurements, height, and aesthetic sensibility."
            />
            <HowItWorksStep
              number="03"
              title="Meet &amp; try on"
              description="Connect within the city, meet in person, and try on the gown. Rent for your wedding, return it, and let it live another love story."
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl border-t border-[var(--color-border)] px-6" />

      {/* For post-brides */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 text-xs uppercase tracking-widest text-[var(--color-rose)]">
                Post-brides
              </p>
              <h2 className="text-3xl font-light leading-snug tracking-wide text-[var(--color-charcoal)]">
                Your gown deserves another moment.
              </h2>
              <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
                You wore it once — perfectly — and now it&apos;s sitting in a garment bag in your
                closet. List it on WhoGetsYou and let another bride have her moment in your dress.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--color-muted)]">
                <FeatureItem>Earn rental income from your gown</FeatureItem>
                <FeatureItem>Matched only with brides who fit your measurements</FeatureItem>
                <FeatureItem>You set the rental fee and availability</FeatureItem>
                <FeatureItem>Sustainable fashion — one dress, many love stories</FeatureItem>
              </ul>
              <Link
                href="/sign-up?role=post-bride"
                className="mt-8 inline-flex rounded-full bg-[var(--color-charcoal)] px-7 py-3 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)]"
              >
                List your gown
              </Link>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image src="/images/dress-try-on-image.png" alt="Bride trying on a gown" fill className="object-cover object-top" />
            </div>
          </div>
        </div>
      </section>

      {/* For pre-brides */}
      <section className="bg-[var(--color-blush)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image src="/images/friends-rooftop-wedding-party.png" alt="Friends at a rooftop wedding party" fill className="object-cover" />
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-widest text-[var(--color-rose)]">
                Pre-brides
              </p>
              <h2 className="text-3xl font-light leading-snug tracking-wide text-[var(--color-charcoal)]">
                Find a gown that was meant to be loved again.
              </h2>
              <p className="mt-4 text-[var(--color-muted)] leading-relaxed">
                Skip the months-long search and the four-figure price tag. Rent a gown that was worn
                with love — and fits like it was made for you.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--color-muted)]">
                <FeatureItem>Matched by your exact measurements</FeatureItem>
                <FeatureItem>Filtered by neckline, silhouette, and fabric</FeatureItem>
                <FeatureItem>Meet the original bride, hear the dress&apos;s story</FeatureItem>
                <FeatureItem>A fraction of retail — more money for your honeymoon</FeatureItem>
              </ul>
              <Link
                href="/sign-up?role=pre-bride"
                className="mt-8 inline-flex rounded-full border border-[var(--color-charcoal)] px-7 py-3 text-sm text-[var(--color-charcoal)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]"
              >
                Find a gown
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-28 text-center">
        <h2 className="text-4xl font-light tracking-wide text-[var(--color-charcoal)]">
          Ready to get started?
        </h2>
        <p className="mt-4 text-[var(--color-muted)]">
          Join a growing community of NYC brides making sustainable choices.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up?role=post-bride"
            className="rounded-full bg-[var(--color-charcoal)] px-8 py-3.5 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-rose-dark)]"
          >
            I have a gown to list
          </Link>
          <Link
            href="/sign-up?role=pre-bride"
            className="rounded-full border border-[var(--color-charcoal)] px-8 py-3.5 text-sm text-[var(--color-charcoal)] transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]"
          >
            I&apos;m looking for a gown
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] px-6 py-8 text-center text-xs text-[var(--color-muted)]">
        © {new Date().getFullYear()} WhoGetsYou. New York City.
      </footer>
    </div>
  );
}

function HowItWorksStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-3xl text-[var(--color-blush-dark)]">{number}</p>
      <h3 className="mb-2 text-lg font-medium text-[var(--color-charcoal)]">{title}</h3>
      <p className="text-sm text-[var(--color-muted)] leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-[var(--color-rose)]">→</span>
      <span>{children}</span>
    </li>
  );
}
