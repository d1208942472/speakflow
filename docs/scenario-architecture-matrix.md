# SpeakFlow Scenario Architecture Matrix

> Updated: 2026-03-28

## Decision

Different product scenarios should not share the exact same technical architecture.
The user-facing experience is one product, but the backend execution model should be split by
latency sensitivity, payload size, and failure tolerance.

## Matrix

| Product surface | Current path | User latency expectation | Recommended architecture | Notes |
| --- | --- | --- | --- | --- |
| Lesson discovery | `GET /lessons`, `GET /recommend/next-lesson` | sub-second | synchronous API + cache | Keep on the main API path. Cache lesson payloads and recommendation artifacts. |
| Standard practice session | `POST /sessions/complete` | low seconds | synchronous orchestrator + fast fallbacks | This is the core product loop. Keep it sync, but push profile refresh and non-critical writes out of the critical path. |
| Pronunciation-only utilities | `POST /speech/transcribe`, `POST /speech/score`, `POST /speech/synthesize` | sub-second to low seconds | synchronous utility endpoints | These are fast building blocks and should stay simple. |
| Premium voice chat | `POST /voicechat/turn` | low seconds, slightly higher tolerance | dedicated premium fast path | Keep separate from the standard session path. It is premium, audio-heavy, and more likely to justify isolated optimization. |
| Premium vision analysis | `POST /vision/analyze-slide`, `POST /vision/analyze-document` | users tolerate longer waits | migrate toward async job model as volume grows | Synchronous is fine for early launch. When usage rises, switch to upload -> job -> poll/result to avoid tying up API workers. |
| Entitlements and billing | web Stripe route + API billing webhooks | near-real-time, not interactive | provider webhooks + entitlement tables | Already provider-aware. Keep Stripe / RevenueCat / Airwallex unified at the entitlement layer. |
| Notifications and reminders | scheduled workflows | minutes are acceptable | background jobs / cron | Do not place this on request-critical paths. |
| Recommendation profile refresh | background task after scoring | eventual consistency is acceptable | background task now, queue later if needed | Current background-task model is correct. |
| Future enterprise reports and team analytics | not launched | minutes are acceptable | async worker / report pipeline | Do not serve this through the synchronous lesson API. |

## Architecture tiers

### Tier 1: Core synchronous paths

- Lesson discovery
- Standard practice session
- Speech utilities

These paths drive daily active usage and must remain fast, predictable, and cheap.

### Tier 2: Premium synchronous paths

- Voice chat

This path should stay separate from standard practice so premium audio features do not degrade
the free and core experience.

### Tier 3: Async-capable deep analysis

- Slide analysis
- Document analysis
- Future enterprise reporting

These flows have larger payloads, weaker latency requirements, and a natural fit for background
job execution when volume increases.

## Implications for operations

1. Do not prematurely microservice the whole app.
2. Do isolate premium heavy paths when they start affecting the core session SLA.
3. Keep billing and entitlements provider-aware so payment-provider rollout does not ripple into lesson access code.
4. Use `apps/api-worker` or a future queue/worker layer for the first async migrations instead of splitting every feature into a new service.
