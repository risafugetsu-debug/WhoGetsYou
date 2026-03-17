# WhoGetsYou — Cowork ↔ Claude Code Shared Memory

This file is the single source of truth between two AI tools working on this project:
- **Claude Code** (terminal) — reads and **updates this file** after every session
- **Cowork** (desktop) — reads this file before giving any advice about the codebase

---

## PROTOCOL

**Claude Code:** At the end of every working session, update the sections below to reflect reality.
Fill in what you built, what changed, what's broken, and what decisions are needed.
Never delete prior entries — prepend new ones under each section.

**Cowork:** Read this entire file before touching anything related to the codebase.
Never write CLAUDE.md task lists. Add strategic/product decisions to the "Decisions" section only.

---

## CURRENT CODEBASE STATE
*Last updated by: [Claude Code — update this with date and what changed]*

### Stack
- Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4
- Supabase (auth + Postgres database + storage)
- Path alias: `@/*` → project root

### Routes — What Exists and Works

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ Complete | Hero updated: two waitlist CTA cards (lender inline email capture → `waitlist_submissions`, renter → /dress-request) |
| `/dress-request` | ✅ Complete | Standalone dress request form, no auth, saves to `dress_requests` table |
| `/sign-in` | ✅ Complete | Supabase email/password auth, redirects to `/dashboard` |
| `/sign-up` | ✅ Complete | Entry point to role-based signup wizard |
| `/sign-up/pre-bride` | ✅ Complete | Pre-bride signup flow |
| `/sign-up/post-bride` | ✅ Complete | Post-bride signup flow |
| `/sign-up/success` | ✅ Complete | Post-signup confirmation |
| `/dashboard` | ✅ Complete | Auth-protected; shows profile, measurements, photos, listing |
| `/dashboard/settings` | ✅ Complete | User account settings |
| `/dashboard/delete-account` | ✅ Complete | Account deletion flow |
| `/edit/listing` | ✅ Complete | Edit gown listing details |
| `/edit/measurements` | ✅ Complete | Edit body measurements |
| `/edit/preferences` | ✅ Complete | Edit style preferences (pre-bride) |
| `/matches` | ⚠️ Incomplete | Filter/sort/scoring logic done. Card rendering UI cut off. |
| `/interests` | ⚠️ Incomplete | Data fetching done. UI rendering for interest list cut off. |
| `/listings/[id]` | ⚠️ Incomplete | Scoring + helpers done. Detail display + action buttons cut off. |

### Components — What Exists

| Path | Status | Notes |
|------|--------|-------|
| `components/layout/Header.tsx` | ✅ | Page header wrapper |
| `components/layout/HeaderNav.tsx` | ✅ | Auth-aware nav (shows name/sign-out or login/signup) |
| `components/signup/SignupWizard.tsx` | ✅ | 5-step wizard controller |
| `components/signup/Step1Role.tsx` | ✅ | Role selection |
| `components/signup/Step2BasicInfo.tsx` | ✅ | Name, email, age, ZIP, ethnicity |
| `components/signup/Step3Measurements.tsx` | ✅ | Height + measurements |
| `components/signup/Step4Style.tsx` | ✅ | Dress style preferences |
| `components/signup/MeasurementStep.tsx` | ✅ | Reusable measurement input step |
| `components/signup/PhotoUploadStep.tsx` | ✅ | Photo upload UI (check if Supabase storage wired) |
| `components/signup/StepIndicator.tsx` | ✅ | Step progress indicator |
| `components/signup/StepListingLocation.tsx` | ✅ | NYC borough + location input |
| `components/signup/StepWeddingDetails.tsx` | ✅ | Wedding date input |
| `components/signup/StyleStep.tsx` | ✅ | Style multi-select |
| `components/signup/NavigationButtons.tsx` | ✅ | Back/next/submit buttons |
| `components/signup/types.ts` | ✅ | Shared TypeScript types for signup |

### Library / Utilities

| Path | Status | Notes |
|------|--------|-------|
| `lib/supabase.ts` | ✅ | Supabase client init (reads env vars) |
| `lib/matching.ts` | ✅ | Fit + style scoring algorithm |
| `lib/signup-pre-bride.ts` | ✅ | Pre-bride signup data handlers |
| `lib/signup-post-bride.ts` | ✅ | Post-bride signup data handlers |
| `lib/signup-wizard.ts` | ✅ | Shared wizard utilities |
| `types/user.ts` | ✅ | Domain types: roles, silhouettes, necklines, materials, measurements |

### Database (Supabase)

Tables (all with RLS enabled):
- `profiles` — id (auth.users FK), first_name, role, created_at
- `measurements` — user_id, unit_system, height, neck_to_waist, shoulder_width, bust_top, under_bust, waist, high_hip, low_hip, arm_length
- `gown_listings` — user_id, neckline, silhouette, materials[], condition, condition_notes, wedding_city, wedding_borough, wedding_date
- `gown_photos` — listing_id, storage_path
- `style_preferences` — user_id, necklines[], silhouettes[], materials[], wedding_city, wedding_borough, wedding_date, date_undecided, profile_photo_path

Additional SQL files in `supabase/`:
- `interests.sql` — interest/inquiry tracking between pre and post brides
- `accept-interest.sql` — acceptance workflow
- `availability.sql` — date availability
- `pricing.sql` — price fields (price_1day, price_3day, price_7day — check if applied to schema)

Edge Functions in `supabase/functions/`:
- `notify-interest/` — sends notification when pre-bride expresses interest
- `notify-accepted/` — sends notification when post-bride accepts interest

### Public Assets
- `public/images/friends-rooftop-wedding-party.png`
- `public/images/dress-try-on-image.png`
- `public/images/pre-bride-opening-the-box.png`
- `public/images/bride-with-bridesmaids-image.png`

### Known Issues / Unknowns
- `/matches`, `/interests`, `/listings/[id]` — rendering sections are incomplete (see above)
- Photo upload: `PhotoUploadStep.tsx` exists — unclear if Supabase Storage is fully wired
- Pricing fields (`price_1day` etc.) — in `pricing.sql` but unclear if added to `gown_listings` table
- `interests` table — exists in SQL but confirm it's applied in Supabase dashboard

---

## RECENT CHANGES
*Claude Code prepends new entries here after each session.*

| Date | Changed by | What happened |
|------|-----------|---------------|
| Mar 2026 | Claude Code | Homepage hero CTAs replaced with two waitlist cards. Built /dress-request page. SQL migrations: waitlist-submissions.sql, dress-requests.sql, measurements-v2.sql |
| Mar 2026 | Claude Code | Restored full project — dashboard, matches, listings, interests, supabase, edit pages |
| Mar 2026 | Claude Code | Initial build — signup wizard, dashboard settings, delete account, images |

---

## OPEN DECISIONS NEEDED
*Either tool adds questions here. Either tool (or Risa) answers them.*

- [ ] **Waitlist + dress_requests tables**: Run `waitlist-submissions.sql`, `dress-requests.sql`, and `measurements-v2.sql` in the Supabase SQL editor before testing the homepage or /dress-request.
- [ ] **Pricing fields**: Are `price_1day`, `price_3day`, `price_7day` already live in the Supabase `gown_listings` table, or still only in `pricing.sql`?
- [ ] **Photo upload**: Is Supabase Storage connected and working in the signup flow, or is it still a UI placeholder?
- [ ] **Interests table**: Is the `interests` SQL applied in the live Supabase project?
- [ ] **Matches page**: Should the match score (e.g., 87%) be shown to the pre-bride, or only shown internally for ranking? (Product decision — Cowork/Risa to answer)
- [ ] **Listing detail page**: When a pre-bride views `/listings/[id]`, what action should the CTA trigger — send a message, express interest, or request a try-on? (Product decision)
- [x] **Dress request form**: **BUILD as standalone `/dress-request` page** — lightweight, no auth required, email capture only. This is the pre-launch priority. See "Pre-Launch Strategy" in Strategic Context for full copy and fields.

---

## STRATEGIC CONTEXT
*Cowork maintains this. Claude Code reads it for product understanding — do not edit this section.*

### What WhoGetsYou Is
P2P bridal gown rental marketplace. Post-brides list their dress. Pre-brides rent it.
Lender-set pricing. Try-on fee model (deductible from rental). No AI body scanning — fit via measurements.

### Current Phase
**Phase 1 — March/April 2026.** Core marketplace live. Community building. Demand intelligence data collection.

### The Demand Intelligence Loop
Collect dress requests from pre-brides → once 50+ requests → publish "Most Wanted" monthly data →
show lenders which dresses are in demand → drive targeted listings → match notification when a match lists.
This data pipeline starts on Day 1. It is a core growth mechanic, not a future feature.

### Brand Voice
Witness/observer framing — never personal bride experience. "I kept hearing the same story from post-brides."
Problem-first: name the problem before the product. Warm, specific, community-first.

### Brand Colors (for any UI work)
- Dusty Rose `#C9877A` — primary, CTAs
- Ivory `#FAF7F4` — page backgrounds
- Blush `#F0DDD5` — light accent
- Sage `#8A9E8E` — secondary accent
- Charcoal `#2C2C2C` — body text
- Gold `#B8963E` — highlights

### Instagram Growth Strategy
Problem-first viral content (Dropmap model). Every post opens on the problem.
"Most Wanted" monthly data series is the signature content format — launches when 50+ requests collected.

### Pre-Launch Strategy
**Decision: Waitlist-first, not full marketplace launch.**
The site stays up and is findable, but the homepage CTAs drive to email capture + dress request form — not the full signup/matching flow.
Reason: /matches, /interests, /listings/[id] are incomplete. More importantly, cold traffic to an empty marketplace creates bad first impressions on both sides.

**Homepage — Hero Section (Claude Code: update the existing `/` page CTAs)**

Headline: `Your dress deserves a second wedding.`
Subheadline: `WhoGetsYou matches pre-brides with post-brides by fit — not just style. Launching soon in NYC.`

Two side-by-side CTA cards:

**Card 1 — Post-bride (lender)**
Heading: `I wore my dress once.`
Body: `It's been in a bag since the wedding. I'd love for someone else to wear it.`
Button: `List my dress →`
Action: email capture only, tag user as `role: lender` in submissions table

**Card 2 — Pre-bride (renter)**
Heading: `I'm still looking for my dress.`
Body: `Tell us what you're looking for — we'll notify you when a match lists.`
Button: `Submit my dress request →`
Action: navigate to `/dress-request`

---

**New page: `/dress-request` — Dress Request Form**
No auth required. Lightweight form. Feeds the Demand Intelligence Loop from Day 1.

Page headline: `Tell us about your dress.`
Subheadline: `We'll match you when a post-bride lists something that fits.`

Fields (in order):
1. First name — text input — required
2. Email — email input — required
3. Wedding date — month/year picker — optional — helper text: "Approximate is fine"
4. NYC borough — dropdown — required — options: Manhattan / Brooklyn / Queens / Bronx / Staten Island / Outside NYC
5. Dress size range — dropdown — required — options: 0–2 / 4–6 / 8–10 / 12–14 / 16+
   NOTE: Body measurements are intentionally NOT collected here. Friction is too high for a cold form.
   Measurements will be requested in the match notification email, after a match is found and motivation is highest.
6. Silhouette — multi-select — required — options: A-line / Ball gown / Mermaid / Sheath / Tea-length
7. Neckline — multi-select — optional — options: V-neck / Sweetheart / Strapless / High neck / Off-shoulder
8. Rental budget — dropdown — required — options: Under $200 / $200–$400 / $400–$600 / $600+
9. Dream designer or vibe — free text — optional — placeholder: "Vera Wang, minimalist, lacy, etc."

Submit button: `Notify me when there's a match →`

Confirmation copy (after submit):
> You're on the list. 🤍
> We'll email you the moment a dress that matches yours lists in NYC.
> Know a post-bride with a beautiful dress sitting in a bag? Send her here.
> [Share WhoGetsYou] button

**Data storage:** Save to a `dress_requests` table in Supabase (no auth FK needed — just email + form fields + created_at). This table feeds the Demand Intelligence Loop.

---

### Phase 2 Feature: Group Wardrobe Coordination (Bridesmaid)

**What it is:**
A collaborative bridesmaid dress coordination flow built on top of WhoGetsYou's existing measurement-first matching. This is NOT a simple "bridesmaid rental" feature — it is a group coordination product that ByRotation and Pickle cannot replicate because their architecture is individual-rental-only.

**Why it's defensible:**
ByRotation and Pickle have more bridesmaid inventory. WhoGetsYou wins on coordination, not inventory. The measurement-first data model enables group fit matching at a level no incumbent offers. One bride orchestrating her whole bridal party = 4–8 new user measurement profiles acquired automatically.

**The 3-Step Product Flow:**

**Step 1 — Bride Sets the Brief**
- Bride selects: color palette (color family or specific hex), style vibe, budget ceiling
- Bride inputs each bridesmaid's name + email (or phone)
- Platform sends each bridesmaid a personalized invite link
- Bride's job at this step: creative direction only, not individual dress selection

**Step 2 — Each Bridesmaid Shops Within the Brief**
- Bridesmaid opens her invite link → prompted to submit measurements (acquisition moment)
- She sees ONLY dresses matching her measurements AND bride's color/style parameters
- Filter is invisible to her — it just feels like a curated shortlist made for her
- She selects her top choice and "flags" it (confirms + optional note e.g. "I love this one")
- She cannot go off-brief — the constraint is silent

**Step 3 — Bride Reviews and Approves**
- Bride gets a dashboard: each bridesmaid shown with their selected dress
- Visual grid showing all selections together so bride can confirm color coherence
- Bride approves each selection (or nudges a bridesmaid toward a different option)
- Once bride approves → each bridesmaid receives individual booking confirmation
- Each bridesmaid handles her own pickup and payment independently (no group cart — individual transactions)

**Key product decisions already made:**
- NO single group cart checkout (bride pays for everyone) — bridesmaids pay individually
- NO single pickup scheduled by bride — each bridesmaid schedules her own
- YES to bride's final approval before any booking is locked
- YES to bridesmaid confirmation/flagging step before it reaches bride
- Measurement submission is the gate to seeing options — this is intentional (acquisition mechanic)

**What needs to be built (for Claude Code when Phase 2 begins):**
- Bridesmaid invite system (email/link generation, measurement profile creation via invite)
- Color/style filter that applies bride's brief to each bridesmaid's individual measurement match
- Group coordination dashboard for bride (view all bridesmaids + their selections in one place)
- "Flag" / confirm UI for bridesmaid (select dress + confirm)
- Bride approval flow (approve/suggest alternatives per bridesmaid)
- Individual booking confirmation sent per bridesmaid post-bride-approval
- New DB tables: `wedding_parties`, `party_members`, `party_briefs`, `bridesmaid_selections`

**Do NOT build this in Phase 1.** Trigger: 100+ completed gown rentals on the platform + sufficient bridesmaid dress inventory (estimated 200+ bridesmaid listings). Build the core P2P gown flow first.

---

### Lender Pricing Philosophy
Lenders set their own price — WhoGetsYou never caps it. But the platform guides them toward competitive pricing through copy, not rules.
Sweet spot: **10–20% of retail**. Above 30% = significantly fewer inquiries. Market self-corrects (overpriced dresses don't rent).
The "alteration restriction" (renters can't alter the dress) is handled by measurement-first matching — the fit is already close before they ever see the listing.

### Lender Listing Flow — UI Copy (implement in /edit/listing or listing creation step)

**Heading:** Set Your Rental Price

**Subtext (below price input):**
> You set the price. We'll tell you what tends to work.

**Guidance card (always visible):**
> Dresses priced at 10–20% of retail tend to rent.
> At that range, a $2,000 dress lists at $200–$400 — competitive enough to attract serious pre-brides, while putting money back in your pocket from something sitting in a bag.

**Tooltip text (info icon):**
> We can't set your price for you — but here's what we've seen: dresses priced above 30% of retail get significantly fewer inquiries. Pre-brides comparing options will choose the dress that fits and makes financial sense. Pricing competitively is your best visibility tool.

**Expandable "Pricing Tips" section — body copy:**
What renters are thinking about:
Pre-brides on WhoGetsYou are comparing rental cost to alterations + dry cleaning on a secondhand dress — typically $300–$600. Your rental price competes with that math. The closer you are to that range, the easier the decision is for her.

Fit is already handled — price is the last variable:
Because WhoGetsYou matches by measurements first, pre-brides who see your dress already fit your dress. You're not competing against 200 listings. You're the shortlist. A competitive price closes it.

You keep the dress:
This isn't consignment. Your dress comes back to you. Whatever you earn is clear profit from something you weren't using.

**Listing confirmation screen (after submit):**
> Your dress is listed. 🤍
> Pre-brides who match your measurements will see it first.
>
> One thing to know: renters won't be able to alter the dress, so the fit match matters. We've already handled that — anyone who reaches out will be within your size range.

**High-price soft nudge (future feature — trigger if price > 30% of retail):**
> Heads up — dresses at this price point tend to get fewer matches. You can always adjust later from your dashboard.

---

## INSTRUCTIONS SUMMARY

### For Claude Code
1. Read this file at the start of every session.
2. Check "Open Decisions Needed" — if a decision is answered, act on it.
3. When you finish a session, update "Current Codebase State" and "Recent Changes" to reflect reality.
4. If you hit a decision that needs product input, add it to "Open Decisions Needed."
5. **Never delete completed work.** Always read the relevant existing files before editing.
6. Follow `CLAUDE BASICS.md` for coding conventions: minimal changes, extend don't rebuild.

### For Cowork (me)
1. Read this entire file before giving any advice about the codebase.
2. Never write Claude Code task lists or CLAUDE.md instructions from a codebase snapshot.
3. Add product/strategic decisions to "Strategic Context" or answer items in "Open Decisions Needed."
4. If Risa asks me to plan a feature, describe WHAT and WHY — let Claude Code decide HOW.
5. If I need to understand current code state, ask Risa what Claude Code last changed rather than re-scanning.
