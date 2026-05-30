# WhoGetsYou Platform Policies

Internal reference document. These are the decisions behind what's published in the FAQ.
Last updated: 2026-05-30

---

## Fees & Revenue

| Item | Value |
|---|---|
| Platform fee | 20% of each completed rental |
| Lender payout | 80% of rental price set |
| Fee disclosure | Once, in the listing pricing section. Not repeated on dashboard. |
| Approach reference | ByRotation — disclose at listing setup, never surface again |

---

## Security Deposit

- **Required on every booking** — authorization hold placed at checkout via Stripe
- **Amount** — declared retail value of the gown, capped at $3,000
- **This is a hold, not a charge** — released automatically on safe return
- **Captured if** — confirmed damage, non-return after 7 days, or lost/stolen
- **Stripe mechanism** — requires saved payment method with off-session charge authorization (to be implemented at checkout)

---

## Late Returns

| Situation | Policy |
|---|---|
| 1–7 days late | 2× daily rental rate charged per day |
| 7+ days, no contact | Treated as lost item — security deposit captured |
| Renter unresponsive | WhoGetsYou Support intervenes; deposit capture authorized |

Daily rate = the per-day price the renter booked at (e.g. 3-day booking at $300 = $100/day, late fee = $200/day).

---

## Cleaning

- **Responsibility** — Lender (post-bride)
- **Rationale** — Bridal gown dry cleaning ($150–$400) requires a specialist. Post-brides know their trusted cleaner. Renters don't.
- **Platform action** — Reminder shown on listing dashboard: *"Factor in dry cleaning costs when setting your rental price."*
- **Renter obligation** — Return the gown in the same condition it was received. Do not attempt cleaning without lender permission.
- **Approach reference** — ByRotation and Pickle both put cleaning on the lender for P2P fashion rental.

---

## Condition Documentation

- **Required** — both parties document condition together at pickup (photos)
- **What to capture** — front, back, any pre-existing wear, stains, alterations, embellishments
- **Why** — bridal gowns are high-value and sentimental; clear documentation protects both sides
- **Platform enforcement** — policy stated in FAQ and T&Cs; no in-app feature yet (Phase 2)
- **Approach reference** — Pickle requires arrival condition report; ByRotation requires same-day damage reporting

---

## Damage Policy

### What counts as normal wear (NOT charged to renter)
- Light creasing
- Minor deodorant marks
- Slight natural wear consistent with a single event

### What renter is liable for
- Large or permanent stains
- Rips, tears
- Broken or missing hardware
- Missing embellishments
- Unauthorized alterations
- Bodily fluid contact (treated as unrepairable)

### Process
1. Report to lender and WhoGetsYou Support immediately
2. Do NOT attempt cleaning or repairs without lender approval
3. WhoGetsYou reviews pickup + return condition photos
4. Decision within 48 hours
5. Renter liable for repair cost or replacement value if beyond repair

### Direct resolution first
Parties have 7 days to resolve between themselves. If unresolved after 7 days → escalate to Support.

---

## Lost or Stolen Items

- Renter is responsible for full replacement value
- Replacement value = **current resale market value** (not original retail)
- Security deposit is captured to cover this
- After 7 days unreturned with no contact → automatically treated as lost
- Platform covers any gap up to lender protection caps (see below)

---

## Lender Protection (Platform Coverage)

Automatic on every rental. Funded by the 20% platform fee. No opt-in required.

| Declared retail value | Max WhoGetsYou payout |
|---|---|
| Under $1,000 | Full declared value |
| $1,000 – $4,000 | Up to $1,000 |
| $4,000 – $8,000 | Up to $2,000 |
| Over $8,000 | Up to $2,500 |

### Claim requirements
- **Under $500** — photos only, no docs needed
- **$500–$1,500** — photo of purchase receipt OR professional appraisal
- **Over $1,500** — receipt/appraisal + WhoGetsYou manual review
- **Deadline** — claim must be submitted within 48 hours of scheduled return date

### Payout basis
- Resale market value, not original retail
- Cross-referenced against known market prices for the designer/style
- Declared retail value used as reference if no receipt available

### Comparison
- Pickle caps at $500 max payout regardless of item value — too low for bridal
- WhoGetsYou caps are significantly higher given the average value of bridal gowns

---

## Cancellations

| Who cancels | When | Renter receives |
|---|---|---|
| Renter | 48+ hours before start | Full refund |
| Renter | Under 48 hours | No refund |
| Post-bride (lender) | Any time | Renter gets full refund |

- Refunds processed within 8 business days
- If post-bride cancels, no penalty to renter

---

## Off-Platform Transactions

Strongly prohibited. Any agreement made outside WhoGetsYou (cash, direct payment, side deposits) is:
- Not eligible for WhoGetsYou protection
- Not eligible for dispute resolution or refunds
- A violation of Terms of Service

---

## Gown Alterations by Renter

**Prohibited.** Renters may not alter the gown in any way — cutting, dyeing, pinning, or any modification — without explicit written consent from the lender. Unauthorized alteration is treated as damage.

---

## Dispute Resolution Timeline

| Step | Timeline |
|---|---|
| Direct resolution between parties | Up to 7 days |
| Escalate to WhoGetsYou Support | After 7 days, or if other party is unresponsive |
| WhoGetsYou decision | Within 48 hours of escalation |

---

## Refunds

| Situation | Renter receives |
|---|---|
| Item not as described / undisclosed damage | Full refund (report within 24 hours of pickup) |
| Post-bride cancels | Full refund |
| Renter cancels 48+ hours before start | Full refund |
| Renter cancels under 48 hours | No refund |
| Fit issue (try-on, no booking yet) | No charge — payment not collected until booking confirmed |

---

## Reviews

- Both parties can leave a review after each completed rental
- Reviews are public on profiles
- Reviews help build community trust and inform future matches
- Future: verified lender status for post-brides with 3+ reviews and 4+ star average (Phase 2)

---

## Policy References

| Platform | What we adopted |
|---|---|
| ByRotation | Fee disclosure approach (once, at listing setup) |
| ByRotation | 7-day direct resolution before escalation |
| ByRotation | 48-hour Support review on escalated disputes |
| Pickle | Condition documentation at pickup |
| Pickle | Normal wear vs. damage definitions |
| Pickle | 48-hour claim deadline for lenders |
| Pickle | Tiered doc requirements for claims |
| WhoGetsYou original | Higher lender protection caps (bridal-specific) |
| WhoGetsYou original | Cleaning on lender with dashboard reminder |
| WhoGetsYou original | 2× daily rate late fee (vs. Pickle's fixed lost-item threshold) |
| WhoGetsYou original | Security deposit hold model |

---

## Open Questions / Future Decisions

- [ ] In-app condition report feature (photo upload at pickup/return) — Phase 2
- [ ] First-time risk-free rental offer (like Pickle) — consider for launch marketing
- [ ] Verified lender badge for post-brides with strong review history
- [ ] Optional high-value insurance add-on (Option B) — revisit once platform has volume
- [ ] Referral program ($X give, $X get) — ByRotation does $25/$25
