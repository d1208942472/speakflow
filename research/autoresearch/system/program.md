# SpeakFlow Autoresearch — System / Backend Optimization

## Goal

Improve the backend's operational efficiency and reliability while keeping the public API behavior stable.

## Project Context

- Service name: SpeakFlow API
- Stack: FastAPI + Supabase + NVIDIA services
- Primary metric: p99_latency_ms
- Secondary metrics: request_success_rate, fallback_hit_rate, estimated_nvidia_cost_per_session
- Mutable file(s): `apps/api/routers/*.py`, `apps/api/services/*.py`, `apps/api/main.py`
- Current baseline: pending first measurement

## Current system state

- `POST /sessions/complete` is the critical synchronous path.
- `POST /voicechat/turn` is a Pro-only low-latency path.
- `POST /vision/analyze-*` is a Pro-only heavy path that should be moved toward async job handling.
- Lessons are static enough to cache, but access control still matters.

## Directions to Explore

### Latency and Cost
1. Cache lesson catalog and other static reads.
2. Reduce repeated Supabase lookups in auth-heavy flows.
3. Precompute or persist embeddings for lesson recommendation.
4. Keep failure-tolerant fallbacks for NVIDIA calls.
5. Split heavy analysis into async job submission and polling.

### Reliability
1. Add request IDs and structured logging around all AI paths.
2. Record fallback usage when NVIDIA services time out or fail.
3. Make billing and entitlement updates idempotent.
4. Keep free-path failures isolated from Pro-heavy paths.

### API Shape
1. Preserve current response contracts where possible.
2. Add new endpoints only when they separate long-running work from user-facing latency.
3. Expose quota and entitlement state explicitly to clients.

## Constraints

- Do not break existing authenticated lesson/session flows.
- No new runtime dependencies unless absolutely required.
- Production secrets and payment provider wiring are human-gated.
- Keep `sessions/complete` working while refactoring surrounding paths.

## Metric Extraction

```bash
# Smoke test the API
curl -sS https://speakflow-api.onrender.com/health

# Local latency profiling should be added per endpoint during experiments
```

## Output Format

```text
p99_latency_ms:        XXX.X
request_success_rate:   XX.XX
fallback_hit_rate:      XX.XX
estimated_cost:         X.XX
status:                 keep | discard | crash
```

## Experiment Loop

1. Pick one backend hypothesis.
2. Modify only the allowed backend files.
3. Run the relevant tests or smoke checks.
4. Keep only changes that improve the chosen metric without regressions.
5. Append the result to `results.tsv`.

