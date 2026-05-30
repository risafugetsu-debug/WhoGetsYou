'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ConversationRow {
  interestId: string;
  otherName: string;
  listingLabel: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export default function MessagesIndexPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/sign-in'); return; }
      const userId = session.user.id;

      // Get all accepted interests the user is part of
      const { data: interests } = await supabase
        .from('interests')
        .select('id, pre_bride_id, post_bride_id, listing_id, accepted_at')
        .not('accepted_at', 'is', null)
        .or(`pre_bride_id.eq.${userId},post_bride_id.eq.${userId}`);

      if (!interests || interests.length === 0) {
        setLoading(false);
        return;
      }

      // Get other party names and listing labels
      const otherIds = interests.map((i) =>
        i.pre_bride_id === userId ? i.post_bride_id : i.pre_bride_id
      );
      const listingIds = interests.map((i) => i.listing_id);

      const [profilesRes, listingsRes] = await Promise.all([
        supabase.from('profiles').select('id, first_name').in('id', otherIds),
        supabase.from('gown_listings').select('id, neckline, silhouette').in('id', listingIds),
      ]);

      const profileMap = new Map(
        (profilesRes.data ?? []).map((p: { id: string; first_name: string }) => [p.id, p.first_name])
      );
      const listingMap = new Map(
        (listingsRes.data ?? []).map((l: { id: string; neckline: string; silhouette: string }) => [
          l.id, `${l.neckline} · ${l.silhouette}`
        ])
      );

      // Get last message and unread count per interest
      const interestIds = interests.map((i) => i.id);
      const { data: messages } = await supabase
        .from('messages')
        .select('id, interest_id, sender_id, body, created_at, read_at')
        .in('interest_id', interestIds)
        .order('created_at', { ascending: false });

      const msgsByInterest = new Map<string, typeof messages>();
      for (const msg of messages ?? []) {
        if (!msgsByInterest.has(msg.interest_id)) msgsByInterest.set(msg.interest_id, []);
        msgsByInterest.get(msg.interest_id)!.push(msg);
      }

      const rows: ConversationRow[] = interests.map((interest) => {
        const otherId = interest.pre_bride_id === userId ? interest.post_bride_id : interest.pre_bride_id;
        const msgs = msgsByInterest.get(interest.id) ?? [];
        const last = msgs[0];
        const unread = msgs.filter((m) => m.sender_id !== userId && !m.read_at).length;
        return {
          interestId: interest.id,
          otherName: profileMap.get(otherId) ?? 'Bride',
          listingLabel: listingMap.get(interest.listing_id) ?? 'Gown',
          lastMessage: last?.body ?? null,
          lastMessageAt: last?.created_at ?? null,
          unreadCount: unread,
        };
      });

      // Sort: unread first, then by last message date
      rows.sort((a, b) => {
        if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      setConversations(rows);
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
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-light tracking-wide text-[var(--color-charcoal)]">Messages</h1>

      {conversations.length === 0 ? (
        <div className="mt-16 text-center space-y-2">
          <p className="text-sm text-[var(--color-muted)]">No conversations yet.</p>
          <p className="text-xs text-[var(--color-muted)]">
            Messages appear here once a post-bride accepts your interest.
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-[var(--color-border)]">
          {conversations.map((conv) => (
            <Link
              key={conv.interestId}
              href={`/messages/${conv.interestId}`}
              className="flex items-center gap-4 py-4 hover:opacity-70 transition-opacity"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-blush)] text-sm font-medium text-[var(--color-rose)]">
                {conv.otherName[0]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${conv.unreadCount > 0 ? 'font-semibold text-[var(--color-charcoal)]' : 'font-medium text-[var(--color-charcoal)]'}`}>
                    {conv.otherName}
                  </p>
                  {conv.lastMessageAt && (
                    <p className="shrink-0 text-xs text-[var(--color-muted)]">
                      {new Date(conv.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <p className="text-xs text-[var(--color-muted)] truncate">{conv.listingLabel}</p>
                {conv.lastMessage && (
                  <p className={`mt-0.5 text-xs truncate ${conv.unreadCount > 0 ? 'font-medium text-[var(--color-charcoal)]' : 'text-[var(--color-muted)]'}`}>
                    {conv.lastMessage}
                  </p>
                )}
              </div>

              {/* Unread badge */}
              {conv.unreadCount > 0 && (
                <div className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-rose)] text-[10px] font-medium text-white">
                  {conv.unreadCount}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
