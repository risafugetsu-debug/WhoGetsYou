'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HeaderNav() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const [profileRes, unreadRes] = await Promise.all([
          supabase.from('profiles').select('first_name').eq('id', session.user.id).single(),
          supabase.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', session.user.id),
        ]);
        setFirstName(profileRes.data?.first_name ?? null);
        setUnreadCount(unreadRes.count ?? 0);
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
          className="relative text-sm text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          Hi, {firstName}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2.5 flex h-2 w-2 rounded-full bg-[var(--color-rose)]" />
          )}
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
