import Image from 'next/image';
import Link from 'next/link';
import HeaderNav from './HeaderNav';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo/whogetsyou-wordmark.png"
            alt="WhoGetsYou"
            width={3182}
            height={384}
            priority
            className="h-7 w-auto"
          />
        </Link>
        <nav>
          <HeaderNav />
        </nav>
      </div>
    </header>
  );
}
