# SpeakFlow Web Autoresearch Program

## Goal

Improve the web acquisition path without waiting for live analytics.

For now the loop optimizes build discipline and shipped weight by using:

- `primary_metric`: `build_time_s`
- `secondary_metric`: `first_load_shared_kb`

Once GA4 / product analytics is live, human review can promote checkout-start and
checkout-success metrics to the primary KPI.

## Project Context

- Surface: `apps/web`
- Stack: Next.js 14 App Router static export + API-driven billing
- Critical user journey:
  1. Landing page trust
  2. `/subscribe` paywall clarity
  3. `api.speakmeteor.win/billing/checkout-session` handoff integrity
  4. `/success` confirmation
- Mutable files:
  - `app/page.tsx`
  - `app/subscribe/page.tsx`
  - `app/success/page.tsx`
  - `components/*.tsx`
  - `app/layout.tsx`
  - `lib/api.ts`

## Directions to Explore

1. Reduce initial JS and unnecessary client boundaries on marketing pages.
2. Keep the checkout path explicit: email capture, annual plan framing, trust copy, and success state.
3. Preserve billing handoff metadata required for provider-aware entitlements and future Airwallex parity.
4. Improve SEO surfaces without adding rendering complexity.
5. Prefer smaller, clearer components over big all-in-one sections.

## Constraints

- `scripts/autoresearch-baseline.sh` must succeed.
- Do not add new npm dependencies.
- Keep the checkout payload fields intact for billing reconciliation.
- Do not remove support for Stripe web checkout while payment provider setup is in flight.
- Do not hardcode claims that require external proof.

## Baseline Command

```bash
bash scripts/autoresearch-baseline.sh
```

## Output Format

```text
primary_metric: <build_time_s>
secondary_metric: <first_load_shared_kb>
status: <keep|discard|crash>
```

Lower is better for both metrics. If build fails, the run is a crash.

## Human Gates

- Any copy change that affects pricing, guarantees, or social proof requires review.
- Any change to billing payload shape or provider return URLs requires review.
- Live conversion experiments require analytics before auto-ratcheting.

## Notes from Runs

- Baseline recorded on 2026-03-28 at commit `8d751f1`.
