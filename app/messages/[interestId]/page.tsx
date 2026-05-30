'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface ThreadData {
  currentUserId: string;
  otherName: string;
  role: 'pre-bride' | 'post-bride';
}

export default function MessageThreadPage() {
  const { interestId } = useParams<{ interestId: string }>();
  const router = useRouter();
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (currentUserId?: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at, read_at')
      .eq('interest_id', interestId)
      .order('created_at', { ascending: true });

    const msgs = (data ?? []) as Message[];
    setMessages(msgs);

    const uid = currentUserId;
    if (!uid) return;
    const unreadIds = msgs.filter(m => m.sender_id !== uid && !m.read_at).map(m => m.id);
    if (unreadIds.length > 0) {
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
    }
  }, [interestId]);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/sign-in'); return; }
      const userId = session.user.id;

      const { data: interest } = await supabase
        .from('interests')
        .select('pre_bride_id, post_bride_id')
        .eq('id', interestId)
        .single();

      if (!interest) { router.replace('/dashboard'); return; }

      const isPreBride = interest.pre_bride_id === userId;
      const isPostBride = interest.post_bride_id === userId;
      if (!isPreBride && !isPostBride) { router.replace('/dashboard'); return; }

      const otherUserId = isPreBride ? interest.post_bride_id : interest.pre_bride_id;
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', otherUserId)
        .single();

      setThread({
        currentUserId: userId,
        otherName: otherProfile?.first_name ?? 'Other party',
        role: isPreBride ? 'pre-bride' : 'post-bride',
      });

      await loadMessages(userId);
      setLoading(false);
    }
    init();
  }, [interestId, router, loadMessages]);

  // Poll every 6 seconds for new messages
  useEffect(() => {
    if (!thread) return;
    const interval = setInterval(() => loadMessages(thread.currentUserId), 6000);
    return () => clearInterval(interval);
  }, [thread, loadMessages]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !thread || sending) return;
    setSending(true);

    const { data: newMsg } = await supabase
      .from('messages')
      .insert({ interest_id: interestId, sender_id: thread.currentUserId, body: body.trim() })
      .select('id, sender_id, body, created_at, read_at')
      .single();

    if (newMsg) {
      setMessages(prev => [...prev, newMsg as Message]);
      setBody('');
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  }

  if (!thread) return null;

  const backHref = thread.role === 'post-bride' ? '/interests' : '/matches';

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 65px)' }}>
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--color-border)] px-6 py-4 flex items-center gap-4">
        <Link
          href={backHref}
          className="text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          ←
        </Link>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Conversation</p>
          <p className="text-sm font-medium text-[var(--color-charcoal)]">{thread.otherName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[var(--color-muted)] mt-16">
            No messages yet — say hello to {thread.otherName}!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === thread.currentUserId;
          const time = new Date(msg.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit',
          });
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                isMe
                  ? 'bg-[var(--color-charcoal)] text-white rounded-br-sm'
                  : 'bg-[var(--color-blush)] text-[var(--color-charcoal)] rounded-bl-sm'
              }`}>
                <p className="text-sm leading-relaxed break-words">{msg.body}</p>
                <p className={`mt-1 text-xs ${isMe ? 'text-white/60' : 'text-[var(--color-muted)]'}`}>{time}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-[var(--color-border)] px-6 py-4 flex gap-3 bg-[var(--background)]"
      >
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Message ${thread.otherName}…`}
          className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)] transition-colors"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="rounded-full bg-[var(--color-rose)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-rose-dark)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
