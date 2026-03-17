# WhoGetsYou — Claude Code

## First: Read HANDOFF.md
Before doing anything, read `HANDOFF.md` in this directory.
It contains the current state of every route, component, and database table,
plus open product decisions and the strategic context for the app.

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

## Coding Rules (see also CLAUDE BASICS.md)
- Read existing files before editing or creating anything
- Extend patterns — never rebuild or replace working code
- Server Components by default; `"use client"` only when hooks/browser APIs needed
- No `any` types. No inline styles. Tailwind classes only.
- `next/image` for all images with proper `alt` text
- Minimal changes — only touch what the task requires

## After Every Session
Update `HANDOFF.md`:
- Mark completed routes as ✅ in the status table
- Add your session to "Recent Changes"
- Add any product questions to "Open Decisions Needed"
