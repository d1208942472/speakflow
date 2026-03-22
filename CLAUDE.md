# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpeakFlow is an NVIDIA-powered business English speaking coach. It's a monorepo with three apps:
- **`apps/web`** — Next.js 14 marketing/subscription site (deployed on Vercel)
- **`apps/api`** — FastAPI backend with 7 NVIDIA services (deployed on Render)
- **`apps/mobile`** — Expo React Native app (iOS/Android)

## Commands

### Web (Next.js)
```bash
cd apps/web && npm run dev        # dev server on :3000
cd apps/web && npm run build      # production build
```

### API (FastAPI)
```bash
cd apps/api
python -m venv .venv && pip install -r requirements.txt  # first time
.venv/bin/uvicorn main:app --reload --port 8000           # dev server
```

### Run API Tests
```bash
cd apps/api
.venv/bin/pytest tests/                        # all tests
.venv/bin/pytest tests/test_gamification.py    # single test file
.venv/bin/pytest tests/ -k "test_fp_calculation"  # single test
```

### Mobile (Expo)
```bash
cd apps/mobile
npx expo start        # dev with Expo Go
npx expo run:ios      # native iOS build
npx expo run:android  # native Android build
```

### Database Migrations
```bash
cd speakflow/
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push   # push migrations in supabase/migrations/
```

## Architecture

### NVIDIA Services (7 total)
| Service | Model | Purpose |
|---------|-------|---------|
| Riva ASR | parakeet-ctc-0.6b-en | Pronunciation scoring (en) |
| Riva ASR Multilingual | parakeet-1.1b-rnnt-multilingual | 25-language transcription |
| NIM LLM | meta/llama-3.1-70b-instruct | Conversation coaching + feedback |
| Magpie TTS | nvidia/magpie-tts-flow | Max's voice (male-1) |
| Riva Translate | nvidia/riva-translate-4b-instruct-v1_1 | 12-language coaching translation |
| NIM Embeddings | nvidia/nv-embedqa-e5-v5 | Semantic lesson recommendations |
| VoiceChat (Pro) | chained Riva→NIM→TTS | Full speech-to-speech for Pro |

### API Routes
- `POST /speech/transcribe` — pronunciation scoring via Riva
- `POST /speech/transcribe-multilingual` — 25-language ASR
- `POST /speech/synthesize` — TTS (returns `audio/mpeg` bytes)
- `GET /translate/languages` + `POST /translate/text` + `POST /translate/coaching`
- `POST /voicechat/turn` — Pro speech-to-speech pipeline
- `GET /recommend/next-lesson` — NIM Embedding semantic recommendations
- `POST /sessions/complete` — core scoring pipeline
- `GET /lessons/` + `GET /lessons/{id}`
- `POST /webhooks/revenuecat` + `POST /api/webhooks/stripe` (web)

### Session Completion Pipeline (Critical Path)
`POST /sessions/complete` is the core flow — it chains three services in sequence:
1. **NVIDIA Riva** (`services/nvidia_riva.py`) — ASR transcription + pronunciation scoring via `score_pronunciation()`
2. **NVIDIA NIM** (`services/nvidia_nim.py`) — Llama 3.1 70B conversation feedback via `get_conversation_response()`, returns structured JSON with grammar feedback, vocabulary suggestions, and `fp_multiplier`
3. **Gamification** (`services/gamification.py`) — FP = `max(1, int(base_fp * max(0.5, score/100) * nim_multiplier))`, streak logic, league standings update in Supabase

NIM failure is non-blocking — the session router catches NIM exceptions and falls back to defaults so Riva scoring always completes.

### Auth Pattern
All protected API endpoints use `Depends(get_current_user)` from `dependencies.py`. This validates a Supabase Bearer JWT and returns the Supabase user object. The `supabase` client in `dependencies.py` uses `SUPABASE_SERVICE_KEY` (server-side). Never use the anon key on the backend.

### Lesson Access Control
Lessons have an `is_pro_only` flag. The API enforces access at two levels:
- `GET /lessons/` — non-pro users only receive free lessons
- `POST /sessions/complete` — returns 403 if lesson is pro-only and user lacks `profiles.is_pro = true`

Pro status is managed exclusively through RevenueCat webhooks (`/webhooks/revenuecat`) and Stripe webhooks (`/api/webhooks/stripe` on the web app).

### Gamification Engine
`GamificationService.process_session_completion()` in `services/gamification.py`:
- Streak shields (max 3): earned every 7-day streak milestone, consumed when missing exactly 2 days
- League standings: weekly FP tracked in `league_standings` table, ranked within same league per week
- Leagues: bronze → silver → gold → platinum → diamond (300 FP/week to promote, <50 to demote)

### Database Schema
Single migration file: `supabase/migrations/001_initial_schema.sql`
Key tables: `profiles` (user data + streak + fp + league), `lessons`, `session_results`, `league_standings`

### NIM Response Parsing
`NvidiaNimService._parse_structured_response()` has a regex fallback in case Llama returns malformed JSON (strips markdown fences, then falls back to individual field extraction). `fp_multiplier` is clamped to [0.5, 2.0].

## Required Environment Variables

### API (Railway)
- `NVIDIA_API_KEY` — for both Riva ASR and NIM (or set `NVIDIA_NIM_API_KEY` separately)
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- `REVENUECAT_WEBHOOK_SECRET` (optional — disables signature verification if absent)

### Web (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_ANNUAL_PRICE_ID`
