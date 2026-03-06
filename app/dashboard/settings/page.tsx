'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Role = 'pre-bride' | 'post-bride';

export default function SettingsPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/sign-in');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setRole((data?.role as Role) ?? null);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/dashboard"
        className="text-xs text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
      >
        ← Dashboard
      </Link>

      <h1 className="mt-6 text-3xl font-light tracking-wide text-[var(--color-charcoal)]">
        Settings
      </h1>

      <div className="mt-10">
        <div className="rounded-2xl border border-[var(--color-border)] p-6">
          <h2 className="mb-1 text-xs uppercase tracking-widest text-[var(--color-muted)]">Account</h2>
          <p className="mt-3 mb-5 text-sm text-[var(--color-muted)]">
            {role === 'pre-bride'
              ? 'Found your gown and ready to say goodbye?'
              : 'Your gown has found its new home?'}
          </p>
          <Link
            href={`/dashboard/delete-account?role=${role}`}
            className="inline-block rounded-full border border-[var(--color-rose)] px-5 py-2.5 text-sm text-[var(--color-rose)] transition-colors hover:bg-[var(--color-blush)]"
          >
            Just got married! 🎯
          </Link>
        </div>
      </div>
    </div>
  );
}
