# SpeakFlow Autoresearch Operating System

> Updated: 2026-03-28

## Why this exists

SpeakFlow is no longer a single codebase with one optimization target. It now has four
distinct optimization surfaces:

1. `~/Projects/autoresearch/mlx` for pure ML experimentation.
2. `apps/api` for service orchestration, entitlements, and latency discipline.
3. `apps/web` for acquisition, checkout readiness, and shipping weight.
4. `apps/mobile` for bundle discipline and store-ready user flows.

Running one infinite loop against the whole product is the wrong shape. Each surface needs
its own `program.md`, `results.tsv`, baseline command, and review gates.

## Current loop map

| Surface | Type | Primary metric | Command |
| --- | --- | --- | --- |
| `~/Projects/autoresearch/mlx` | `ml` | `val_bpb` | `uv run train.py > run.log 2>&1` |
| `speakflow/apps/api` | `system` | synthetic worst-path p95 | `.venv/bin/python scripts/autoresearch_baseline.py` |
| `speakflow/apps/web` | `webapp` | `build_time_s` | `bash scripts/autoresearch-baseline.sh` |
| `speakflow/apps/mobile` | `ios-app` | TypeScript validation time | `bash scripts/autoresearch-baseline.sh` |

## How to start each loop

### API

```bash
cd /Users/dengjianfa/Desktop/1.工作文件-2026/2.2026工作/1.2026工作文件/16.内容驱动的教育工具开发-202603/speakflow/apps/api
bash ~/Projects/autoresearch/scripts/project-autoopt.sh --type system --project "$PWD"
```

### Web

```bash
cd /Users/dengjianfa/Desktop/1.工作文件-2026/2.2026工作/1.2026工作文件/16.内容驱动的教育工具开发-202603/speakflow/apps/web
bash ~/Projects/autoresearch/scripts/project-autoopt.sh --type webapp --project "$PWD"
```

### Mobile

```bash
cd /Users/dengjianfa/Desktop/1.工作文件-2026/2.2026工作/1.2026工作文件/16.内容驱动的教育工具开发-202603/speakflow/apps/mobile
bash ~/Projects/autoresearch/scripts/project-autoopt.sh --type ios-app --project "$PWD"
```

## Human-gated vs. auto-ratchet

### Safe to auto-ratchet

- Pure ML config changes inside `~/Projects/autoresearch/mlx`
- API orchestration simplification with mocked external dependencies
- Web bundle and render-path reductions
- Mobile bundle and type-safe refactors

### Must stop for review

- Stripe, RevenueCat, Airwallex, Apple, and Google account setup
- Production keys, webhooks, domains, and store submission settings
- Pricing, guarantees, public claims, and legal copy
- Entitlement rule changes and any free/pro boundary changes
- Infrastructure additions such as queues, workers, or microservice splits

## Billing architecture status

SpeakFlow already has provider-aware billing primitives:

- Web: `apps/web/lib/billing.ts`
- API: `apps/api/routers/billing.py`
- Access control: `apps/api/services/access_control.py`

This means Stripe can stay as the active web checkout path now while Airwallex is wired in
later without changing the entitlement model. The correct long-term source of truth is the
`entitlements` and `subscriptions` tables, with `profiles.is_pro` kept as a sync convenience.

## Immediate next experiments

1. Record API synthetic baseline and lock the current worst-path latency.
2. Record web build baseline and keep checkout metadata intact while reducing shipped weight.
3. Record mobile validation baseline and isolate premium-only paths from the default bundle.
4. Resume MLX experiments only when the machine is thermally clean.
