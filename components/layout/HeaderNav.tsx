'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HeaderNav() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', session.user.id)
          .single();
        setFirstName(data?.first_name ?? null);
      }

      setLoading(false);
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setFirstName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setFirstName(null);
    router.push('/');
    router.refresh();
  }

  if (loading) return <div className="h-8 w-32" />;

  if (firstName) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          Hi, {firstName}
        </Link>
        <button
          onClick={handleSignOut}
          className="rounded-full border border-[var(--color-border)] px-5 py-2 text-sm text-[var(--color-charcoal)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/sign-in"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
      >
        Log in
      </Link>
      <Link
        href="/sign-up"
        className="rounded-full bg-[var(--color-charcoal)] px-5 py-2 text-sm text-[var(--color-ivory)] hover:bg-[var(--color-rose-dark)] transition-colors"
      >
        Sign up
      </Link>
    </div>
  );
}
