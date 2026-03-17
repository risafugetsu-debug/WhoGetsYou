# Product Strategy
*Maintained by Risa / Cowork. Claude Code reads this when building new features or UI.*

## What WhoGetsYou Is

P2P bridal gown rental marketplace. Post-brides list their dress. Pre-brides rent it.
Lender-set pricing. Try-on fee model (deductible from rental). No AI body scanning — fit via measurements.

## Current Phase

**Phase 1 — March/April 2026.** Core marketplace live. Community building. Demand intelligence data collection.

## Brand Voice

Witness/observer framing — never personal bride experience. *"I kept hearing the same story from post-brides."*
Problem-first: name the problem before the product. Warm, specific, community-first.

## Brand Colors

Defined as CSS variables in `app/globals.css`. See `docs/conventions.md` for the full table.
- Rose `#c4848a` — primary CTAs
- Ivory `#faf8f5` — backgrounds
- Charcoal `#2d2d2d` — body text

## The Demand Intelligence Loop

Collect dress requests → once 50+ → publish "Most Wanted" monthly data → show lenders which dresses are in demand → drive targeted listings → match notification when a match lists. Starts Day 1. Core growth mechanic, not a future feature.

## Instagram Strategy

Problem-first viral content. Every post opens on the problem. "Most Wanted" monthly data series is the signature format — launches when 50+ requests collected.

## Lender Pricing Philosophy

Sweet spot: 10–20% of retail. Above 30% = significantly fewer inquiries. Market self-corrects.

**Listing page copy (implement in `/edit/listing`):**

Heading: *Set Your Rental Price*

Guidance card:
> Dresses priced at 10–20% of retail tend to rent. At that range, a $2,000 dress lists at $200–$400 — competitive enough to attract serious pre-brides, while putting money back in your pocket from something sitting in a bag.

Tooltip:
> We can't set your price for you — but here's what we've seen: dresses priced above 30% of retail get significantly fewer inquiries. Pricing competitively is your best visibility tool.

Confirmation screen after listing submit:
> Your dress is listed. 🤍
> Pre-brides who match your measurements will see it first.
> One thing to know: renters won't be able to alter the dress, so the fit match matters. We've already handled that — anyone who reaches out will be within your size range.

## Phase 2: Group Wardrobe Coordination (Bridesmaid)

**Do NOT build in Phase 1.** Trigger: 100+ completed rentals + ~200 bridesmaid listings.

Three-step flow: Bride sets brief (color, style, budget) → each bridesmaid shops within brief using her own measurements → bride reviews and approves selections → individual bookings confirmed per bridesmaid.

Key decisions already made: no group cart, no group pickup, bride approval required before booking locks.

New DB tables needed: `wedding_parties`, `party_members`, `party_briefs`, `bridesmaid_selections`
