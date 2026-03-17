# WhoGetsYou — Agent Instructions

## Project Overview

WhoGetsYou is a peer-to-peer bridal gown rental and matchmaking platform — connecting **post-brides** (who want to re-home their worn gown) with **pre-brides** (who are searching for one). Think ByRotation or Pickle, but exclusively for bridal gowns and with a community-first focus.

Matching is driven by **body measurements and height**, ensuring fit compatibility between lender and renter. Both user types go through a guided, step-by-step measurement flow on sign-up, plus a style preference questionnaire to match gown aesthetics.

### Key Concepts
- **Post-bride**: a user listing their gown for rent after their wedding
- **Pre-bride**: a user searching to rent a gown for their upcoming wedding
- **Matching criteria**: bust, waist, hips, height, and dress style preferences
- **Sign-up flow**: measurement guide (step-by-step, tailored per user type) + style profile
- **Platform model**: peer-to-peer rental with community features

---

## Platform Architecture

This codebase separates concerns so that server-side logic handles data and routing while client components handle interaction. That separation is what keeps the system reliable and performant.

**Layer 1: Product (The Mission)**
- Connect post-brides and pre-brides through measurement-driven matching
- Both user types go through a guided sign-up: measurement guide + style profile questionnaire
- Community-first, peer-to-peer rental model

**Layer 2: Agent (The Decision-Maker)**
- Read existing code before modifying it. Understand patterns before introducing new ones.
- Connect product intent to implementation — without over-engineering or going beyond what was asked
- If a new sign-up step is needed, check `app/` for existing flow patterns first, then extend — don't rebuild

**Layer 3: Tech Stack (The Execution)**
- **Framework**: Next.js 16.1.6 (App Router) — all pages live in `app/`
- **UI**: React 19.2.3 — prefer Server Components; use `"use client"` only when necessary
- **Language**: TypeScript 5 (strict mode) — explicit types, interfaces over type aliases, no `any`
- **Styling**: Tailwind CSS v4 — utility classes only; avoid custom CSS unless unavoidable
- **Linting**: ESLint 9 with next/core-web-vitals
- **Package Manager**: npm

> React Server Components handle data; client components handle interactivity. Mixing them carelessly degrades both.

---

## Commands

- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint

---

## File Structure

| Path | Purpose |
|---|---|
| `app/` | App Router pages and layouts |
| `app/layout.tsx` | Root layout (Geist font, global styles) |
| `app/page.tsx` | Home page |
| `app/globals.css` | Tailwind base styles + CSS custom properties |
| `components/` | Reusable UI components |
| `public/` | Static assets |
| `next.config.ts` | Next.js config |
| `tsconfig.json` | TypeScript config (strict mode, `@/*` alias) |
| `.env.local` | Environment variables (never commit secrets) |

---

## Conventions

### TypeScript
- Strict mode enabled (`tsconfig.json`)
- Use explicit types; avoid `any`
- Prefer interfaces over `type` aliases for object shapes
- Path alias `@/*` maps to project root

### React / Next.js
- Use the App Router (`app/` directory) — do not use Pages Router
- Prefer React Server Components; use `"use client"` only when necessary
- Keep components focused and single-purpose
- Components go in `app/` or `components/`

### Styling
- Use Tailwind CSS utility classes; avoid custom CSS unless unavoidable
- Dark mode via CSS custom properties (`--background`, `--foreground`)
- **Always use the project's CSS variables for color** — never hardcode hex values

| Variable | Value | Use |
|---|---|---|
| `--color-rose` | `#c4848a` | Primary CTAs, active states |
| `--color-rose-dark` | `#a96a70` | Hover states on CTAs |
| `--color-ivory` | `#faf8f5` | Page backgrounds |
| `--color-charcoal` | `#2d2d2d` | Body text, headings |
| `--color-blush` | `#f5e6e8` | Light accent backgrounds |
| `--color-blush-dark` | `#e8c5ca` | Darker blush accents |
| `--color-muted` | `#6b6b6b` | Secondary/helper text |
| `--color-border` | `#e8e0db` | Borders, dividers |

### Code Style
- Keep files small and focused — one responsibility per file
- Prefer editing existing files over creating new ones
- No comments unless logic is non-obvious

---

## How to Operate

**1. Look for existing components first**
Before building anything new, check `app/` and `components/`. Only create new files when nothing exists for that task.

**2. Adapt when things fail**
- Read the full error message and trace
- Fix and verify with `npm run lint` or `npm run build`
- Identify whether it's a type error, missing `"use client"`, or a Tailwind issue before changing anything

**3. Keep changes minimal**
When you find a better pattern, flag it — but don't refactor surrounding code that wasn't part of the task.

### Development Loop
1. Read the relevant existing code
2. Make the minimal change required
3. Verify with lint/build
4. Stop — don't add extras

---

## Workflow

### Before Suggesting Changes
- Run or verify tests/lint before proposing changes
- Read existing code before modifying it
- Understand patterns in use before introducing new ones

### Commits
- Never commit without explicit user instruction
- Never use `--no-verify` or bypass git hooks

### File Management
- Prefer editing existing files over creating new ones
- Do not create documentation files unless explicitly requested

---

## Do's and Don'ts

### Do
- Ask before taking irreversible or shared-state actions
- Reuse existing utilities and components before creating new ones
- Keep solutions minimal — only change what's necessary

### Don't
- Don't add features, refactoring, or comments beyond what was asked
- Don't over-engineer — avoid abstractions for one-off operations
- Don't auto-commit, auto-push, or modify shared infrastructure
- Don't use `npm run` without checking if the user prefers a different runner

---

## Bottom Line

You sit between what the product needs (matching brides by fit and style) and what actually gets built (Next.js components, routes, and logic). Read the existing code, make smart focused changes, respect the conventions, and keep the codebase clean.

Stay minimal. Stay reliable. Only build what's asked.
