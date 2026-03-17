# Product Decisions
*This file is for Risa. Answer open questions directly below each one.*
*Claude Code: read this when making product choices. Add new questions as they arise. Never remove answered decisions — they're the record.*

---

## ❓ Needs Your Answer

**Should the match score (e.g. 87%) be shown to the pre-bride on `/matches`?**
> Context: The scoring algorithm runs internally to rank listings. Question is whether to surface it as a visible "87% fit" badge, or just use it silently for ordering.
> Blocked: `/matches` UI design

Your answer:

---

**What action should the CTA trigger on `/listings/[id]`?**
> Context: When a pre-bride views a listing detail page, there needs to be a primary action button. Options: send a message, express interest (queued), or request a try-on.
> Blocked: `/listings/[id]` completion

Your answer:

---

**Are the Supabase SQL migrations applied to the live project?**
> Context: `interests.sql`, `pricing.sql` exist locally but it's unclear if they've been run in the Supabase dashboard. If not, `/matches` and `/listings/[id]` will break.
> Blocked: testing any incomplete routes

Your answer:

---

**Is Supabase Storage connected for photo uploads?**
> Context: `PhotoUploadStep.tsx` exists in the signup flow but may be a UI placeholder only.
> Blocked: testing end-to-end signup

Your answer:

---

## ✅ Decided

**Waitlist-first launch (not full marketplace)**
Homepage drives to email capture + dress request form. Full signup/matching flow is built but not promoted until marketplace has supply. *(Mar 2026)*

**No name/email on gown listings**
Already available via JOIN on `profiles` table using `user_id`. No need to duplicate. *(Mar 2026)*

**Dress request form collects size range, not measurements**
Measurement friction too high for cold traffic. Full measurements requested in match notification email when motivation is highest. *(Mar 2026)*

**Lender pricing is self-set, never capped**
Platform guides with copy (10–20% of retail sweet spot) but does not enforce. See `docs/strategy.md` for full pricing copy. *(Mar 2026)*
