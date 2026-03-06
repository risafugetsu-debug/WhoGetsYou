import Link from 'next/link';
import HeaderNav from './HeaderNav';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-light tracking-widest text-[var(--color-charcoal)] uppercase">
          WhoGetsYou
        </Link>
        <nav>
          <HeaderNav />
        </nav>
      </div>
    </header>
  );
}
