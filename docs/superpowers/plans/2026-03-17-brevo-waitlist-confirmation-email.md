# Brevo Waitlist Confirmation Email Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a Brevo transactional confirmation email when a post-bride submits the homepage "list my dress" lender waitlist form.

**Architecture:** Replace the client-side direct Supabase insert in `HeroCTAs.tsx` with a POST to a new Next.js API route (`/api/waitlist`). The route handles both the DB insert and the Brevo email call sequentially — Supabase first, then Brevo. The API key stays server-side only.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (anon key), Brevo Transactional Email API (native fetch, no SDK)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/api/waitlist/route.ts` | POST handler — validate, insert to Supabase, send Brevo email |
| Modify | `components/HeroCTAs.tsx` | Replace direct Supabase call with fetch to `/api/waitlist` |

---

### Task 1: Create the API route

**Files:**
- Create: `app/api/waitlist/route.ts`

- [ ] **Step 1: Create the file with the POST handler**

```ts
// app/api/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { email, first_name } = await req.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const { error: dbError } = await supabase.from('waitlist_submissions').insert({
    email: email.trim(),
    first_name: first_name?.trim() || null,
    role: 'lender',
  });

  if (dbError) {
    console.error('[waitlist] Supabase insert error:', dbError);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      templateId: 1,
      to: [{ email: email.trim(), name: first_name?.trim() || '' }],
    }),
  });

  if (!brevoRes.ok) {
    const brevoErr = await brevoRes.text();
    console.error('[waitlist] Brevo email error:', brevoErr);
    // Do not return error to client — DB write succeeded
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify the build compiles cleanly**

```bash
npm run build
```

Expected: No TypeScript errors. (Dev server not required — just a compile check.)

- [ ] **Step 3: Commit**

```bash
git add app/api/waitlist/route.ts
git commit -m "feat: add /api/waitlist route with Supabase insert and Brevo email"
```

---

### Task 2: Update HeroCTAs to use the API route

**Files:**
- Modify: `components/HeroCTAs.tsx`

- [ ] **Step 1: Replace the Supabase call with a fetch**

In `handleLenderSubmit`, replace:

```ts
const { error: dbError } = await supabase.from('waitlist_submissions').insert({
  email: email.trim(),
  first_name: firstName.trim() || null,
  role: 'lender',
});

setSubmitting(false);
if (dbError) { setError('Something went wrong. Please try again.'); return; }
setSubmitted(true);
```

With:

```ts
const res = await fetch('/api/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: email.trim(), first_name: firstName.trim() || null }),
});

setSubmitting(false);
if (!res.ok) { setError('Something went wrong. Please try again.'); return; }
setSubmitted(true);
```

- [ ] **Step 2: Remove the supabase import**

Delete the line:

```ts
import { supabase } from '@/lib/supabase';
```

- [ ] **Step 3: Verify the build compiles cleanly**

```bash
npm run build
```

Expected: No TypeScript or lint errors.

- [ ] **Step 4: Smoke test manually**

```bash
npm run dev
```

1. Open `http://localhost:3000`
2. Click "List my dress →" in the hero
3. Enter a first name and email, submit
4. Confirm the success message appears: "You're on the list. We'll reach out when we launch."
5. Check Supabase `waitlist_submissions` table — new row should be present
6. Check Brevo sent emails — confirmation email should appear in the send log

- [ ] **Step 5: Commit**

```bash
git add components/HeroCTAs.tsx
git commit -m "feat: wire lender waitlist form to /api/waitlist, trigger Brevo confirmation email"
```

---

## Prerequisites (confirm before starting)

- [ ] Brevo template ID 1 exists and is active in the Brevo account
- [ ] `first_name` column exists in the live `waitlist_submissions` table (apply `supabase/waitlist-submissions.sql` migration if not yet run)
- [ ] `BREVO_API_KEY` added to Vercel environment variables for production use
