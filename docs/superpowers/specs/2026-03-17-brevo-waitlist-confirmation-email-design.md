# Brevo Waitlist Confirmation Email — Design Spec
*Date: 2026-03-17*

## Overview

When a post-bride submits the "list my dress" lender form on the homepage, send a confirmation email via Brevo using a pre-configured transactional template.

## Scope

- **In scope:** Lender waitlist form in `HeroCTAs.tsx` (homepage hero, Card 1)
- **Out of scope:** `/dress-request` form (pre-bride), future signup wizard emails

## Prerequisites

- Confirm Brevo template ID 1 exists and is active in the Brevo account
- Confirm `first_name` column exists in the live `waitlist_submissions` table (it is in `supabase/waitlist-submissions.sql` — apply migration if not yet run)
- Add `BREVO_API_KEY` to Vercel environment variables (already in `.env.local` for local dev)

## Flow

1. User fills out first name (optional) + email (required) in the lender card and submits
2. Client POSTs `{ first_name, email }` to `/api/waitlist`
3. API route inserts record into `waitlist_submissions` (Supabase)
4. If insert succeeds, API route calls Brevo transactional email API with template ID 1
5. If Brevo call fails, log the error server-side but do not surface to user (DB write is source of truth)
6. API route returns `200` — client shows success message

## Files Changed

### New: `app/api/waitlist/route.ts`
- POST handler
- Validates `email` is present; returns `400` if missing
- Inserts `{ email, first_name, role: 'lender' }` into `waitlist_submissions` using the existing `supabase` client from `@/lib/supabase` (anon key; RLS policy already allows anonymous inserts)
- Calls `https://api.brevo.com/v3/smtp/email` with:
  - `api-key` header: `process.env.BREVO_API_KEY`
  - Body: `{ templateId: 1, to: [{ email, name: first_name || '' }] }`
- Returns `500` on DB error, `200` on success (Brevo failure is logged to console but non-blocking)

### Modified: `components/HeroCTAs.tsx`
- Replace `supabase.from('waitlist_submissions').insert(...)` with `fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first_name, email }) })`
- Check `response.ok`; show existing error state if not
- Remove the `supabase` import and the `import { supabase } from '@/lib/supabase'` line (no other usages in the file)

## Supabase Client

Use `@/lib/supabase` (anon key, `NEXT_PUBLIC_` vars). This is safe server-side because:
- The anon key is already public
- RLS insert policy allows anonymous inserts with no conditions

## Duplicate Emails

No deduplication. The same email can be submitted multiple times — each insert succeeds and triggers a new confirmation email. Acceptable for pre-launch waitlist.

## Environment Variables

| Variable | Where needed |
|----------|-------------|
| `BREVO_API_KEY` | `.env.local` (already present) + Vercel environment variables |
| `NEXT_PUBLIC_SUPABASE_URL` | Already configured everywhere |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Already configured everywhere |

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Missing email | `400` — client shows "Email is required" |
| Supabase insert fails | `500` — client shows "Something went wrong" |
| Brevo API fails | `200` returned to client, error logged to console server-side |
| Network error from client | Client shows "Something went wrong" |

## No New Dependencies

Brevo API is called with native `fetch` — no SDK required.
