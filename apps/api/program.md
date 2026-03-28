# SpeakFlow API Autoresearch Program

## Goal

Minimize the synthetic critical-path latency reported by `scripts/autoresearch_baseline.py`
while keeping the full API test suite green.

This loop exists to improve SpeakFlow's own orchestration and entitlement logic, not to
benchmark NVIDIA's public endpoints. External service latency must be mocked out.

## Project Context

- Service: SpeakFlow API (`apps/api`)
- Stack: FastAPI + Supabase + NVIDIA-backed service adapters
- Primary metric: `primary_metric` from `scripts/autoresearch_baseline.py`
- Secondary metrics:
  - `session_complete_p95_ms`
  - `voicechat_turn_p95_ms`
  - `vision_slide_p95_ms`
  - `lessons_list_p95_ms`
  - `pytest_pass_count`
- Mutable files:
  - `routers/sessions.py`
  - `routers/voicechat.py`
  - `routers/vision.py`
  - `routers/lessons.py`
  - `services/access_control.py`
  - `services/recommendation_cache.py`
  - `services/*.py` when the change reduces duplicate work or simplifies fallbacks

## Product Boundaries

- Standard lesson practice (`POST /sessions/complete`) is the core sync path.
- Voice chat is a premium fast path and can tolerate slightly higher latency than standard practice.
- Vision analysis is a premium deep-analysis path; optimize validation and orchestration first.
- Billing and entitlements are provider-aware already. Do not collapse them back to Stripe-only logic.

## Directions to Explore

1. Remove duplicate Supabase reads on the lesson and entitlement paths.
2. Keep lesson access checks and free-tier quota checks cheap and deterministic.
3. Push non-critical work to background tasks only when user-visible scoring is already complete.
4. Simplify failure-open logic for NIM, reward, and guardrails so the sync path does less branching.
5. Keep the cached lesson list hot and avoid re-shaping the same response multiple times.
6. Preserve provider-aware entitlement flow (`stripe`, `revenuecat`, `airwallex`, `system`).

## Constraints

- Do not change request/response contracts for public endpoints.
- Do not add new Python dependencies.
- Do not edit migrations during autoresearch loops.
- Do not remove the fallback behavior that keeps lesson scoring usable when premium models fail.
- Never optimize by bypassing entitlement checks or quota enforcement.

## Baseline Command

```bash
.venv/bin/python scripts/autoresearch_baseline.py
```

## Output Format

The baseline script prints:

```text
primary_metric:       <ms>
session_complete_p95_ms: <ms>
voicechat_turn_p95_ms:   <ms>
vision_slide_p95_ms:     <ms>
lessons_list_p95_ms:     <ms>
pytest_pass_count:       <int>
pytest_fail_count:       <int>
```

Lower `primary_metric` is better. Any non-zero `pytest_fail_count` is an automatic discard.

## Human Gates

- Changes that touch billing or entitlements require human review even if metrics improve.
- Changes that add async queues, workers, or new infrastructure do not auto-merge.
- Any optimization that changes safety posture or free/pro access rules must stop for review.

## Notes from Runs

- Baseline recorded on 2026-03-28 at commit `8d751f1`.
