# SpeakFlow Mobile Autoresearch Program

## Goal

Keep the Expo mobile app shippable while reducing validation time and preserving the
core monetization and learning flows.

- `primary_metric`: TypeScript validation time in seconds
- `secondary_metric`: app source size in KB

This loop is a pre-native optimization loop. It is useful before Apple/Google account
activation is complete. Once App Store / Play build pipelines are live, add real device
startup and crash metrics under human review.

## Project Context

- Surface: `apps/mobile`
- Stack: Expo Router + React Native + Supabase + RevenueCat
- Critical user journey:
  1. Auth bootstrap
  2. Home scenario discovery
  3. Lesson practice session
  4. Paywall / restore purchase
  5. Premium voice chat and premium vision analysis gating
- Mutable files:
  - `app/_layout.tsx`
  - `app/(tabs)/*.tsx`
  - `app/lesson/[id].tsx`
  - `app/paywall.tsx`
  - `hooks/*.ts`
  - `services/purchases.ts`
  - `services/api.ts`
  - `components/*.tsx`

## Directions to Explore

1. Reduce initial bundle pressure from large lesson and premium feature code paths.
2. Keep paywall, restore purchase, and entitlement sync explicit and resilient.
3. Avoid loading premium-only hooks and analysis flows before they are needed.
4. Simplify the lesson screen without weakening recording, scoring, or fallback behavior.
5. Preserve Expo compatibility until native store pipelines are active.

## Constraints

- `scripts/autoresearch-baseline.sh` must succeed.
- No new npm dependencies.
- Do not remove RevenueCat initialization or restore purchase flow.
- Do not weaken free/pro gating for voice chat, vision analysis, or advanced scenarios.
- Do not change Apple / Google product IDs in code during autoresearch loops.

## Baseline Command

```bash
bash scripts/autoresearch-baseline.sh
```

## Output Format

```text
primary_metric: <typecheck_time_s>
secondary_metric: <source_kb>
status: <keep|discard|crash>
```

Lower is better for both metrics. Any TypeScript failure is a crash. Native export remains
human-gated until the current React Native codegen issue is upgraded away.

## Human Gates

- Changes to paywall copy, price presentation, or subscription restoration require review.
- Native build config changes (`app.json`, `eas.json`) require review.
- Store-review-sensitive permission changes require review.

## Notes from Runs

- Baseline recorded on 2026-03-28 at commit `8d751f1`.
