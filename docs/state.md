# Codebase State
*Updated by Claude Code after each session. Last updated: Mar 17 2026*

## Routes

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ | Hero: two waitlist CTA cards (lender inline email → `/api/waitlist` → `waitlist_submissions` + Brevo email, renter → `/dress-request`) |
| `/dress-request` | ✅ | Standalone form, no auth, saves to `dress_requests` table |
| `/sign-in` | ✅ | Supabase email/password auth, redirects to `/dashboard` |
| `/sign-up` | ✅ | Entry point to role-based signup wizard |
| `/signup` | ✅ | New 5-step wizard (role → basic info → measurements → style → review) |
| `/sign-up/pre-bride` | ✅ | Pre-bride signup flow |
| `/sign-up/post-bride` | ✅ | Post-bride signup flow |
| `/sign-up/success` | ✅ | Post-signup confirmation |
| `/dashboard` | ✅ | Auth-protected; shows profile, measurements, photos, listing |
| `/dashboard/settings` | ✅ | Account settings |
| `/dashboard/delete-account` | ✅ | Account deletion flow |
| `/edit/listing` | ✅ | Edit gown listing details |
| `/edit/measurements` | ✅ | Edit body measurements |
| `/edit/preferences` | ✅ | Edit style preferences (pre-bride only) |
| `/matches` | ⚠️ | Filter/sort/scoring done. Card rendering UI incomplete. |
| `/interests` | ⚠️ | Data fetching done. Interest list UI incomplete. |
| `/listings/[id]` | ⚠️ | Scoring + helpers done. Detail display + action buttons incomplete. |

## Database (Supabase — RLS enabled on all tables)

| Table | Key Columns |
|-------|-------------|
| `profiles` | id (FK → auth.users), first_name, role, created_at |
| `measurements` | user_id, unit_system, height, neck_to_waist, shoulder_width, bust_top, under_bust, waist, high_hip, low_hip, arm_length |
| `gown_listings` | user_id, neckline, silhouette, materials[], condition, condition_notes, city, borough, wedding_date, price_1day, price_3day, price_7day |
| `gown_photos` | listing_id, storage_path |
| `style_preferences` | user_id, necklines[], silhouettes[], materials[], city, borough, wedding_date, date_undecided, profile_photo_path |
| `waitlist_submissions` | email, first_name, role, created_at |
| `dress_requests` | first_name, email, wedding_date, borough, size_range, silhouettes[], necklines[], budget, designer_vibe, created_at |
| `interests` | pre_bride_id, listing_id, status, created_at *(confirm applied in Supabase)* |

SQL migrations in `supabase/`: `interests.sql`, `accept-interest.sql`, `availability.sql`, `pricing.sql`, `waitlist-submissions.sql`, `dress-requests.sql`, `measurements-v2.sql`, `rename-location-columns.sql`

Edge Functions in `supabase/functions/`: `notify-interest/`, `notify-accepted/`

## Known Issues

- `/matches`, `/interests`, `/listings/[id]` — UI rendering incomplete
- `interests` table — exists in SQL but unconfirmed if applied in live Supabase project
- `pricing.sql` fields (`price_1day` etc.) — unconfirmed if applied to live `gown_listings` table
- `PhotoUploadStep.tsx` — unclear if Supabase Storage is fully wired

## Recent Changes

| Date | What changed |
|------|-------------|
| Mar 17 2026 | Added Brevo transactional email on lender waitlist submit. New `/api/waitlist` route handles Supabase insert + Brevo template ID 1. `BREVO_API_KEY` must be added to Vercel env before deploy. |
| Mar 17 2026 | Pushed to GitHub. Restructured docs into docs/. Added /handoff slash command and Stop hook. Updated CLAUDE.md and CLAUDE BASICS.md with CSS variables and read-order. |
| Mar 2026 | Homepage hero CTAs replaced with two waitlist cards. Built /dress-request. SQL: waitlist-submissions, dress-requests, measurements-v2. |
| Mar 2026 | Renamed wedding_city/wedding_borough → city/borough across all TS/TSX files. Build verified clean. |
| Mar 2026 | Restored full project — dashboard, matches, listings, interests, supabase, edit pages. |
| Mar 2026 | Initial build — signup wizard, dashboard settings, delete account, images. |
