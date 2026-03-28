# SpeakFlow Autoresearch — iOS App Optimization

## Goal

Improve the iOS user journey from onboarding to paid retention without destabilizing the current Expo app.

## Project Context

- App name: SpeakFlow Mobile
- Target: iOS-first Expo React Native app
- Primary metric: funnel_completion_rate
- Secondary metrics: crash_rate, restore_success_rate, startup_time_s
- Mutable file(s): `apps/mobile/app/**/*.tsx`, `apps/mobile/hooks/*.ts`, `apps/mobile/services/*.ts`, `apps/mobile/store/*.ts`
- Current baseline: pending first measurement

## Current iOS state

- The critical funnel is `onboarding -> lesson -> session -> paywall -> restore`.
- Voice chat and slide analysis are Pro-heavy paths.
- Client state should reflect authoritative backend entitlements and quota state.

## Directions to Explore

### Funnel Completion
1. Make onboarding short and deterministic.
2. Ensure lesson entry and paywall entry are obvious.
3. Keep restore purchase easy to find.
4. Reduce dead ends when Pro access is missing.

### Reliability
1. Keep auth/session synchronization simple.
2. Preserve graceful fallback when API or AI services are unavailable.
3. Do not let Pro-only failures block free learning paths.

### UX Clarity
1. Keep free vs Pro messaging aligned with the web app.
2. Surface quota and subscription state clearly.
3. Keep the core speaking flow simple for first-time users.

## Constraints

- The app must continue to build.
- No new npm dependencies.
- Do not modify native project files unless unavoidable.
- Payment provider accounts may still be pending; keep those flows configurable.

## Metric Extraction

```bash
npm run ios
```

## Output Format

```text
funnel_completion_rate: XX.XX
restore_success_rate:   XX.XX
startup_time_s:         XX.X
status:                 keep | discard | crash
```

## Experiment Loop

1. Pick one funnel or reliability hypothesis.
2. Modify only the allowed mobile files.
3. Run the relevant checks or local smoke tests.
4. Keep only changes that improve the chosen metric.
5. Append the result to `results.tsv`.

