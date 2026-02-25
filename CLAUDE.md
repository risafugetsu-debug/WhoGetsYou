# WhoGetsYou

## Project Overview
Next.js 16 web app using the App Router pattern.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint 9 with next/core-web-vitals

## Commands
- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint

## Project Structure
- `app/` — App Router pages and layouts
- `app/layout.tsx` — root layout (Geist font, global styles)
- `app/page.tsx` — home page
- `app/globals.css` — Tailwind base styles + CSS custom properties
- `public/` — static assets
- `next.config.ts` — Next.js config

## Conventions
- Path alias `@/*` maps to project root
- Dark mode via CSS custom properties (`--background`, `--foreground`)
- Use Tailwind utility classes for styling
- Components go in `app/` or a `components/` directory
- Keep components as React Server Components by default; add `"use client"` only when needed
