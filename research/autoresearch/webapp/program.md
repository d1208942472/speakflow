# SpeakFlow Autoresearch — Web App Optimization

## Goal

Improve the public web funnel so the anonymous visitor path is fast, accessible, and conversion-ready.

## Project Context

- App name: SpeakFlow Web
- Stack: Next.js 14 + React
- Primary metric: checkout_start_success_rate
- Secondary metrics: lighthouse_perf, ttfb_ms, build_time_s, bundle_size_kb
- Mutable file(s): `apps/web/app/*.tsx`, `apps/web/components/*.tsx`, `apps/web/app/api/*.ts`
- Current baseline: pending first measurement

## Current web state

- The public site must not rely on a protected preview URL.
- `landing -> subscribe -> checkout -> success` is the core conversion path.
- The pricing copy must stay aligned with backend quota and entitlement rules.

## Directions to Explore

### Funnel Access
1. Ensure the canonical domain is public and stable.
2. Keep checkout links working from all entry points.
3. Make success and cancel flows explicit and reliable.
4. Avoid auth walls on pages that should be discoverable.

### Performance
1. Reduce client-side waterfalls on the landing page.
2. Keep subscription pages fast and lightweight.
3. Preserve image and font optimization.
4. Avoid unnecessary client components where static rendering is enough.

### Conversion Clarity
1. Make the free vs Pro story consistent everywhere.
2. Keep pricing, FAQ, and legal copy aligned with actual quota rules.
3. Surface clear next steps after checkout.

## Constraints

- Build must succeed.
- No new npm dependencies.
- Do not change payment provider credentials in this workspace.
- Do not turn this into a redesign exercise unless it improves the funnel.

## Metric Extraction

```bash
npm run build
```

## Output Format

```text
checkout_start_success_rate: XX.XX
lighthouse_perf:            XX
bundle_size_kb:             XXX.X
status:                     keep | discard | crash
```

## Experiment Loop

1. Pick one funnel or performance hypothesis.
2. Change only the minimum web files needed.
3. Rebuild and verify the public path.
4. Keep only improvements that preserve correctness.
5. Log the experiment in `results.tsv`.

