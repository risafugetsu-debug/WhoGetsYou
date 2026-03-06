# WhoGetsYou — Claude Code Instructions

## What This App Is

WhoGetsYou is a **peer-to-peer bridal gown rental marketplace** connecting two groups:

- **Post-brides (Lenders)** — Women who own a wedding dress they've already worn and want to rent it out, recoup cost, and give it a second story.
- **Pre-brides (Renters)** — Engaged women looking to rent their dream dress at a fraction of the purchase price.

The business model is P2P: lenders set their own prices. The platform charges a transaction/try-on fee. No AI body scanning — fit is guided by real measurements and community data.

The core viral growth mechanic is the **Demand Intelligence Loop**: collect dress requests from pre-brides → surface aggregated data ("Most Wanted" series) → show lenders which dresses are in demand → drive listings. This data pipeline starts on Day 1.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint 9 with next/core-web-vitals
- **Path alias**: `@/*` maps to project root

## Commands

```bash
npm run dev      # start local dev server (localhost:3000)
npm run build    # production build
npm run start    # start production server
npm run lint     # run ESLint
```

---

## What Already Exists — DO NOT REBUILD

Before doing anything, understand what is already done:

### Pages
| Route | File | Status |
|-------|------|--------|
| `/` | `app/page.tsx` | ⚠️ Default Next.js boilerplate — replace entirely |
| `/signup` | `app/signup/page.tsx` | ✅ Done — entry to 5-step wizard |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | ⚠️ Exists with mock data — wire to real auth later |
| `/dashboard/delete-account` | `app/dashboard/delete-account/page.tsx` | ✅ Done — do not touch |

### Components
All signup wizard components are **complete and working**. Do not rewrite them:
- `components/signup/SignupWizard.tsx` — 5-step wizard controller
- `components/signup/Step1Role.tsx` — role selection (pre-bride / post-bride)
- `components/signup/Step2BasicInfo.tsx` — name, email, age, ZIP, ethnicity
- `components/signup/Step3Measurements.tsx` — height + measurements
- `components/signup/Step4Style.tsx` — dress style preferences
- `components/signup/Step5Review.tsx` — review before submit
- `components/signup/ProgressBar.tsx` — step progress indicator
- `components/signup/NavigationButtons.tsx` — back/next/submit buttons
- `components/signup/types.ts` — shared TypeScript types

### Public Images (already available)
- `public/images/friends-rooftop-wedding-party.png`
- `public/images/dress-try-on-image.png`
- `public/images/pre-bride-opening-the-box.png`
- `public/images/bride-with-bridesmaids-image.png`

---

## Brand Design System

Apply this design system consistently across all new pages and components.

### Color Palette

```css
/* Brand tokens — add to globals.css */
--color-ivory:       #FAF7F4;   /* page backgrounds */
--color-blush:       #F0DDD5;   /* light accent backgrounds */
--color-dusty-rose:  #C9877A;   /* primary brand color, CTAs */
--color-rose-dark:   #9E5A50;   /* hover states, headings */
--color-charcoal:    #2C2C2C;   /* body text */
--color-mid-gray:    #6B6B6B;   /* secondary text */
--color-light-gray:  #E8E4E0;   /* borders, dividers */
--color-sage:        #8A9E8E;   /* secondary accent */
--color-sage-dark:   #5C7261;   /* sage hover */
--color-gold:        #B8963E;   /* highlights, badges */
--color-white:       #FFFFFF;
```

### Tailwind CSS v4 — Extend with Custom Colors

In `globals.css`, under `@theme inline`, add:

```css
@theme inline {
  --color-ivory:      #FAF7F4;
  --color-blush:      #F0DDD5;
  --color-dusty-rose: #C9877A;
  --color-rose-dark:  #9E5A50;
  --color-charcoal:   #2C2C2C;
  --color-mid-gray:   #6B6B6B;
  --color-light-gray: #E8E4E0;
  --color-sage:       #8A9E8E;
  --color-sage-dark:  #5C7261;
  --color-gold:       #B8963E;
}
```

Then use in JSX as: `bg-ivory`, `text-dusty-rose`, `bg-blush`, `border-light-gray`, etc.

### Typography

- **Font**: Geist Sans (already loaded in `app/layout.tsx`) — keep as-is
- **Page titles**: `text-3xl md:text-4xl font-bold text-charcoal`
- **Section headings**: `text-xl font-semibold text-charcoal`
- **Body text**: `text-base text-charcoal leading-relaxed`
- **Secondary/meta text**: `text-sm text-mid-gray`
- **Brand tagline**: italic, `text-mid-gray`

### Component Patterns

```tsx
// Primary CTA button
<button className="bg-dusty-rose hover:bg-rose-dark text-white font-medium px-6 py-3 rounded-full transition-colors">
  Submit Your Dress Request
</button>

// Secondary / ghost button
<button className="border border-dusty-rose text-dusty-rose hover:bg-blush font-medium px-6 py-3 rounded-full transition-colors">
  Learn How It Works
</button>

// Card
<div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">

// Section container
<section className="bg-ivory px-4 py-16 md:py-24">
  <div className="max-w-5xl mx-auto">

// Input field
<input className="w-full border border-light-gray rounded-lg px-4 py-3 text-charcoal placeholder-mid-gray focus:outline-none focus:ring-2 focus:ring-dusty-rose" />
```

### UX Principles — Follow These Strictly

1. **Mobile-first always.** Most users arrive from Instagram on mobile. Every page must look excellent at 375px before desktop. Use `md:` prefix for desktop enhancements, never the reverse.

2. **Problem-first content.** Pages open with the problem the user is living, not the product name or features. The brand name earns attention after the problem is named.

3. **One primary CTA per page.** Do not present multiple equally-weighted CTAs. One main action per page/section.

4. **Never block with signup.** Users can browse dress listings before creating an account. Gate only transactional actions (sending a request, listing a dress).

5. **Honest empty states.** When there are no dresses listed yet, show a warm, honest empty state — not a broken-looking grid. "We're just getting started. Be the first to list yours." with a CTA.

6. **Warm tone in all UI copy.** No cold marketplace language. Every micro-copy touchpoint should feel like a friend who knows the problem you're facing.

---

## Phase 1 Build Tasks — In Priority Order

Complete these tasks in the order listed. Do not skip ahead. Each task has an acceptance criteria section — a task is not done until its criteria are fully met.

---

### TASK 1 — Redesign the Home Page

**File:** `app/page.tsx`
**Replace entirely.** The current file is the default Next.js boilerplate and must be completely replaced.

#### Page Structure (in order, top to bottom)

**1a. Navigation Bar**
Create `components/layout/Navbar.tsx` (Server Component). Use on this page and all future pages.
- Left: Logo text "WhoGetsYou" in `font-semibold text-charcoal`
- Right (desktop): Links — "How it works" | "Browse Dresses" | "List Your Dress" | "Sign Up" (dusty-rose CTA button, rounded-full)
- Right (mobile): Hamburger menu icon — opens a slide-down or drawer menu
- Sticky on scroll: `sticky top-0 bg-white/95 backdrop-blur z-50 border-b border-light-gray`

**1b. Hero Section**
- Full-width, `bg-ivory`, padding `py-20 md:py-32`
- Above-the-fold hook (bold, large): something direct and problem-naming. Do not use "Welcome to WhoGetsYou." Use copy like: *"Your dream dress exists. Someone already owns it."* or *"She wore it once. Now it's looking for you."*
- Subtitle (1–2 sentences): warm, human, explains the P2P concept simply
- Two CTAs side by side on mobile (stacked) and desktop:
  - Primary: "Submit Your Dress Request" → links to `/dress-request`
  - Secondary (ghost): "Browse Dresses" → links to `/browse`
- Hero image: use `public/images/bride-with-bridesmaids-image.png` or `dress-try-on-image.png` — displayed to the right on desktop, below text on mobile. Use `next/image` with proper `alt` text.

**1c. The Two Problems Section**
Two cards side by side (stack on mobile), each naming one problem:
- **Card 1 (Lender):** "Your dress cost $X,000. You wore it once. It's been in a bag ever since." → CTA: "List Your Dress"
- **Card 2 (Renter):** "You found the dress. You saw the price tag. You closed the tab." → CTA: "Submit a Request"
- Card style: `bg-white rounded-2xl border border-light-gray shadow-sm`
- Lender card accent: sage left border (`border-l-4 border-sage`)
- Renter card accent: dusty-rose left border (`border-l-4 border-dusty-rose`)

**1d. How It Works Section**
`bg-blush` background. Title: "How WhoGetsYou Works"
Three steps in a horizontal row (stack on mobile):
1. "Submit your dress request — tell us your style, size, and budget"
2. "We match you — browse dresses listed by real brides in your area"
3. "Try it on — a small try-on fee lets you say yes before you commit"
Each step: numbered circle (dusty-rose background, white number), title, short description.

**1e. Demand Intelligence Teaser — "What NYC Brides Are Looking For"**
Only show once you have real request data. Until then, show a warm placeholder:
- Title: "Most Wanted This Month"
- Body: "We're collecting dress requests from NYC brides right now. Submit yours and we'll notify you when a match is listed."
- CTA: "Submit Your Dress Request"
- Style: `bg-ivory` with a subtle `border border-light-gray rounded-2xl` container

**1f. Footer**
Create `components/layout/Footer.tsx`
- Brand name + tagline: *"Sharing a little happiness, one dress at a time."*
- Links: How it works | Browse | List Your Dress | Submit a Request | About
- Copyright line: `© 2026 WhoGetsYou`
- `bg-charcoal text-white` background

#### Acceptance Criteria — Task 1
- [ ] No default Next.js boilerplate remains in `app/page.tsx`
- [ ] Navbar and Footer are reusable components used from `components/layout/`
- [ ] Page opens with a problem-naming headline, NOT the product name
- [ ] Both CTAs ("Submit Your Dress Request" and "Browse Dresses") are present above the fold on mobile
- [ ] Hero image loads with `next/image`, has `alt` text, and does not cause layout shift
- [ ] Page looks correct at 375px (iPhone SE) AND 1280px (desktop)
- [ ] All links point to the correct routes (even if those pages don't exist yet — use correct hrefs)
- [ ] `npm run build` passes with no errors

---

### TASK 2 — Dress Request Form Page

**File:** `app/dress-request/page.tsx` (create new)
**Component:** `components/dress-request/DressRequestForm.tsx` (create new, `"use client"`)

This is the **most important data collection feature** for Phase 1. Every submission feeds the Demand Intelligence Loop.

#### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| First name | text input | Yes | |
| Email | email input | Yes | Used to notify when a match is listed |
| Dress silhouette | multi-select chips | Yes | Options: A-line, Ballgown, Mermaid, Minimalist/Slip, Princess, Boho — select up to 3 |
| Size | select dropdown | Yes | Options: 0, 2, 4, 6, 8, 10, 12, 14, 16, Custom |
| Max rental budget | select dropdown | Yes | Options: Under $200 / $200–400 / $400–700 / $700–1,000 / $1,000+ |
| Wedding date range | select dropdown | Yes | Options: Within 3 months / 3–6 months / 6–12 months / 12+ months |
| NYC ZIP code | text input | Yes | 5-digit validation |
| Additional details | textarea | No | "Anything else? A specific designer, neckline, color, era?" max 300 chars |

#### UX Requirements

- **Page header:** Problem-first — *"Your dream dress is out there. Tell us what you're looking for."* Subtitle: *"We'll notify you the moment it's listed."*
- **Silhouette selector:** Render as visual chip buttons with the style name. Active state: `bg-dusty-rose text-white`. Inactive: `bg-white border border-light-gray`. Allow multi-select up to 3.
- **Validation:** Show inline errors beneath each field. Do not block submit until the user has attempted to submit once (don't show errors on first load).
- **Submit button:** `"Submit My Dress Request"` — full width on mobile, centered on desktop
- **Success state:** After submit, replace the form with a warm confirmation message:
  - Heading: *"You're on the list. 🤍"*
  - Body: *"We'll notify you at [email] the moment a matching dress is listed. In the meantime, browse what's already available."*
  - CTA: "Browse Dresses" → `/browse`
  - Secondary: "Share with a friend getting married" (copy shareable text to clipboard)

#### API Route

Create `app/api/dress-request/route.ts`:

```typescript
// POST /api/dress-request
// Receives form data, validates, stores (or logs for now), returns success
// Use Zod for validation if available; otherwise manual validation
// For Phase 1: console.log the submission + return 200.
// Add a TODO comment: "// TODO: persist to database and send confirmation email"
// Do NOT use any email service yet — just log and return success
```

#### Acceptance Criteria — Task 2
- [ ] Route `/dress-request` exists and renders the form
- [ ] All 8 fields present with correct types and validation
- [ ] Silhouette field renders as visual chip buttons, multi-select up to 3
- [ ] Inline validation errors shown after first submit attempt only
- [ ] Successful submit shows warm confirmation state (no page reload)
- [ ] API route at `POST /api/dress-request` accepts JSON, validates, returns `{ success: true }`
- [ ] Form is fully usable on mobile (375px)
- [ ] `npm run build` passes

---

### TASK 3 — Site-Wide Navigation & Layout Shell

Before building more pages, establish the layout shell used by all pages.

**Files to create/update:**
- `components/layout/Navbar.tsx` — if not done in Task 1
- `components/layout/Footer.tsx` — if not done in Task 1
- `app/layout.tsx` — update root layout to include Navbar and Footer on all pages

#### Layout Spec

```tsx
// app/layout.tsx — wrap children with layout
<html>
  <body className="bg-ivory min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </body>
</html>
```

Exception: The `/signup` and `/dress-request` pages should have a **minimal layout** (no full footer, simplified nav showing only logo + "Sign in" link). Use a conditional layout or route group `(auth)` to achieve this.

#### Acceptance Criteria — Task 3
- [ ] Navbar appears on all pages except during the signup wizard steps
- [ ] Footer appears on all public pages
- [ ] Active nav link is visually highlighted (use `usePathname()`)
- [ ] Mobile hamburger menu opens and closes correctly
- [ ] Layout does not cause horizontal scroll at any viewport

---

### TASK 4 — Browse / Marketplace Page (Empty State First)

**File:** `app/browse/page.tsx` (create new — Server Component)

Phase 1 launches with no inventory. Build the page to handle both the empty state and future populated state gracefully.

#### Page Structure

**4a. Page header**
- Title: "Find Your Dress"
- Subtitle: "Real wedding dresses, listed by real brides in NYC."
- Pill filters row (scrollable on mobile): All | A-line | Ballgown | Mermaid | Minimalist | Princess | Boho
- Sort dropdown (right-aligned): "Newest" | "Price: Low to High" | "Price: High to Low"

**4b. Empty State (when no listings exist)**

Do NOT show a broken grid. Show this instead:

```
[Icon: dress emoji or SVG]
"We're just getting started."
"Be one of the first brides to list her dress on WhoGetsYou —
and be seen by NYC brides who are actively searching."

[CTA button: "List Your Dress →"]
[Secondary text: "Already looking for a dress? Submit your request and
we'll notify you when a match goes live."]
[Link: "Submit a Dress Request"]
```

Empty state card: `bg-white rounded-2xl border border-light-gray p-12 text-center max-w-lg mx-auto`

**4c. Populated State (future — scaffold now)**

Build the listing card component `components/browse/DressCard.tsx` even if it won't render yet:

```tsx
// DressCard props:
interface DressCardProps {
  id: string;
  imageUrl: string;
  style: string;           // "A-line", "Ballgown", etc.
  size: string;            // "Size 6", "Size 8", etc.
  pricePerDay: number;     // in USD
  location: string;        // "Brooklyn, NY"
  lenderFirstName: string; // "Sarah"
}
```

Card layout: image (aspect-ratio 3:4, `rounded-xl object-cover`), then below: style badge (sage pill), size, price/day, location, "View Details" button.

Grid layout: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`

#### Acceptance Criteria — Task 4
- [ ] Route `/browse` exists and renders
- [ ] Pill filters are present and scrollable on mobile
- [ ] Empty state renders a warm, branded message with CTAs (not a blank page or error)
- [ ] `DressCard` component exists with correct TypeScript interface
- [ ] `npm run build` passes

---

### TASK 5 — List Your Dress Page (Lender Onboarding)

**File:** `app/list-your-dress/page.tsx` (create new)
**Component:** `components/list/ListDressForm.tsx` (create new, `"use client"`)

This is the supply side of the marketplace. Lenders fill this out to list their dress.

#### Form Fields (2 sections)

**Section 1 — About the Dress**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Dress silhouette | single-select chips | Yes | Same 6 options as dress request |
| Dress size | select dropdown | Yes | 0, 2, 4, 6, 8, 10, 12, 14, 16, Custom |
| Dress measurements | 3 number inputs | Yes | Bust / Waist / Hips in inches |
| Dress condition | radio buttons | Yes | Pristine (never worn) / Like New (worn once, cleaned) / Good (minor wear) |
| Dress era / style | select | No | Classic / Modern Minimal / Vintage / Boho / Princess |
| Designer (if known) | text input | No | |
| Rental price per day | number input | Yes | Lender sets this. Show guidance: "Most dresses in NYC rent for $150–400/day" |
| Try-on fee | number input | Yes | Pre-fill with $50. Editable. Show tooltip: "The try-on fee lets renters come see the dress before committing. If they rent, this fee comes off the total." |
| Description | textarea | No | Max 500 chars. Placeholder: "Tell the story of your dress — where it was made, what the day was like, any details a renter should know." |

**Section 2 — Contact & Pickup**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| First name | text | Yes | |
| Email | email | Yes | |
| NYC ZIP code | text | Yes | 5-digit |
| Availability start | date input | Yes | "From when is the dress available?" |
| Availability end | date input | No | "Do you have a last available date?" |

#### UX Requirements

- **Page header:** Problem-first — *"Your dress has been in a bag long enough."* Subtitle: *"List it in 5 minutes. Set your own price. Help a bride find her dress."*
- **Section headers:** `text-lg font-semibold text-charcoal border-b border-light-gray pb-2 mb-4`
- Photo upload field: Add a placeholder `<div>` UI for drag-and-drop photo upload with the label "Add photos of your dress (up to 8)". Show 8 empty slots as dashed boxes (`border-2 border-dashed border-light-gray rounded-xl`). Add a TODO comment: `// TODO: wire to Cloudinary or S3 in Phase 2`. Do NOT implement actual upload logic now.
- **Submit button:** "List My Dress" — same styling as primary CTA
- **Success state:** *"Your dress is listed! 🤍 We'll review it shortly and send you a confirmation at [email]."* Include note: "You'll be notified when a pre-bride requests a try-on."

#### API Route

Create `app/api/list-dress/route.ts`:

```typescript
// POST /api/list-dress
// Validate required fields, log submission, return success
// TODO: persist to database, send lender confirmation email, notify matching pre-brides
```

#### Acceptance Criteria — Task 5
- [ ] Route `/list-your-dress` exists and renders
- [ ] All required fields present with validation
- [ ] Photo upload placeholder UI rendered with 8 dashed slots (no actual upload)
- [ ] Try-on fee field pre-fills to $50 and is editable
- [ ] Rental price guidance text is visible near the price field
- [ ] Success state shows after submit
- [ ] API route at `POST /api/list-dress` accepts and validates JSON
- [ ] `npm run build` passes

---

### TASK 6 — Auth: Login Page + Wire Signup to Backend

**File:** `app/login/page.tsx` (create new)

#### 6a. Login Page

Simple, clean login form:
- Email input
- Password input
- "Sign in" primary button
- "Forgot password?" text link (route: `/forgot-password` — create placeholder page)
- "Don't have an account? Sign up →" link → `/signup`

Page header: Logo centered, no full navbar. Use minimal layout.

For Phase 1, implement login as a **mock auth** — on submit, store a fake session token in `localStorage` (key: `wgy_session`) and redirect to `/dashboard/settings`. Add clear TODO comments:

```typescript
// TODO: Replace mock auth with real NextAuth.js / Supabase auth in Phase 2
// TODO: Validate credentials against database
// TODO: Use httpOnly cookies instead of localStorage for production
```

#### 6b. Wire Signup Wizard to API

Update `SignupWizard.tsx` `handleSubmit()` function to call `POST /api/signup` instead of `console.log`.

Create `app/api/signup/route.ts`:

```typescript
// POST /api/signup
// Receives full form data from SignupWizard
// Validate required fields
// For Phase 1: log data, return { success: true, userId: "mock-id-123" }
// TODO: Hash password, persist user to database, send welcome email
```

After successful API response, redirect to `/dashboard/settings`.

#### Acceptance Criteria — Task 6
- [ ] `/login` page renders with email + password form
- [ ] Login form uses minimal layout (no full Navbar/Footer)
- [ ] Successful login (any credentials for now) stores mock session and redirects to `/dashboard/settings`
- [ ] SignupWizard `handleSubmit` calls `POST /api/signup` (not just console.log)
- [ ] `POST /api/signup` returns `{ success: true }` with proper HTTP 200
- [ ] All TODO comments about real auth are present
- [ ] `npm run build` passes

---

### TASK 7 — About / Our Story Page

**File:** `app/about/page.tsx` (create new — Server Component)

#### Page Content

**7a. Founder section**
- Heading: "Why WhoGetsYou Exists"
- 2–3 paragraphs using the brand voice (witness/observer, not personal bride story):
  - Para 1: The pattern observed — post-brides with expensive dresses in bags, pre-brides who found their dream dress and closed the tab.
  - Para 2: The P2P solution — what WhoGetsYou does and how it works.
  - Para 3: The community vision — the Demand Intelligence Loop, why data helps both sides.
- Image: use `public/images/friends-rooftop-wedding-party.png` — `rounded-2xl`

**7b. The Numbers Section**
Three stat cards in a row (stack on mobile):
- "1 day" — "The average bride wears her dress for one day"
- "$2,800" — "The average cost of a wedding dress in the US"
- "∞" — "The number of love stories one dress can have"
Card style: `bg-blush rounded-2xl p-6 text-center`
Stat number: `text-4xl font-bold text-dusty-rose`

**7c. How It Works (detailed)**
Expand on the 3-step overview from the home page. Same visual style but with more detail for each step. Use `bg-ivory` section background.

#### Acceptance Criteria — Task 7
- [ ] `/about` page exists and renders
- [ ] Founder section uses witness/observer voice — no "I wore a wedding dress" or personal bride experience
- [ ] Three stat cards present with dusty-rose numbers
- [ ] Image renders via `next/image`
- [ ] Page is mobile-responsive

---

## Conventions & Code Quality

- **Server vs Client components**: Default to React Server Components. Only add `"use client"` when component uses hooks, event handlers, browser APIs, or form state.
- **No inline styles**: Use Tailwind classes only. No `style={{}}` props.
- **TypeScript**: No `any` types. All props and API response shapes must be typed.
- **Image optimization**: Always use `next/image`. Always provide `alt` text. Provide `width` and `height` or use `fill` with a sized parent.
- **API routes**: All API routes must return proper HTTP status codes. Validation errors return 400. Success returns 200. Unhandled errors return 500.
- **No placeholder/lorem ipsum copy**: All UI copy should reflect the WhoGetsYou brand voice (see UX Principles above). Write real copy, not "Lorem ipsum" or "Heading goes here."
- **TODO comments**: Any feature intentionally deferred to Phase 2 must have a `// TODO Phase 2:` comment explaining what needs to happen. This includes: real database persistence, authentication, email sending, image uploads, payments.

---

## Phase 1 Completion Checklist

When all 7 tasks are complete, verify:

- [ ] `npm run build` completes with 0 errors and 0 TypeScript errors
- [ ] `npm run lint` passes with 0 errors
- [ ] All 7 routes exist: `/`, `/browse`, `/dress-request`, `/list-your-dress`, `/login`, `/about`, `/signup`
- [ ] All pages render correctly at 375px mobile viewport
- [ ] No default Next.js boilerplate copy remains anywhere
- [ ] All images use `next/image`
- [ ] No `console.error` output during `npm run dev` page loads
- [ ] Every form has working validation and a success state
- [ ] Navigation links work between all pages

---

## What Phase 2 Will Add (Do NOT build now)

- Real database (Supabase or PlanetScale + Prisma)
- Real authentication (NextAuth.js or Supabase Auth)
- Image uploads (Cloudinary)
- Stripe payment integration for try-on fees and rentals
- In-app messaging between lenders and renters
- Email notifications (Resend or Postmark)
- Individual dress detail pages (`/dress/[id]`)
- User dashboard with rental history
- Admin moderation panel
