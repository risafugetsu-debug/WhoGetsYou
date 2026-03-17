# WhoGetsYou — Claude Code

## Every Session: Read First
- `docs/state.md` — live route/DB/component state

## Read When Relevant
- `docs/conventions.md` — architecture, patterns, CSS variables, file structure
- `docs/decisions.md` — open product questions + decision log
- `docs/strategy.md` — brand, growth model, pricing philosophy, Phase 2 plans *(read when building new features or UI)*

## Tech Stack
- Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4
- Supabase for auth, database, and storage
- Path alias: `@/*` → project root

## Commands
```bash
npm run dev      # localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

## Coding Rules
- Read existing files before editing or creating anything
- Extend patterns — never rebuild or replace working code
- Server Components by default; `"use client"` only when hooks/browser APIs needed
- No `any` types. No inline styles. Tailwind classes only.
- `next/image` for all images with proper `alt` text
- Minimal changes — only touch what the task requires

## After Every Session
Run `/handoff` to update `docs/state.md` with routes, DB changes, and recent changes.
