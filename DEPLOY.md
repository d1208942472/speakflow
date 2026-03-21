# SpeakFlow Deployment Guide

Complete step-by-step guide to launching SpeakFlow from zero to production.

---

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `speakflow-prod`
3. Choose region closest to your primary user base (recommend `us-east-1` for North America)
4. Generate and **save** the database password

### Get Keys
From Project Settings → API:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server-only)

### Run Migrations
```bash
cd speakflow/
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### Enable Auth
- Project Settings → Auth → Enable Email/Password
- Enable "Confirm email" (disable for dev)
- Set Site URL to your Vercel domain
- Add redirect URLs: `https://yourdomain.com/**`

---

## 2. NVIDIA API Keys

### Register for NVIDIA Developer Access
1. Go to [build.nvidia.com](https://build.nvidia.com) → Sign Up
2. Create an account with your company email
3. Navigate to **API Catalog** → Find `NVIDIA Riva` (Speech AI)
4. Also find `Meta Llama 3.1` for the AI coach

### Generate API Key
1. Click your profile → **API Keys**
2. Generate new key → Name it `speakflow-prod`
3. Copy the key → `NVIDIA_API_KEY=nvapi-...`

### NVIDIA Inception Program
- Apply at [nvidia.com/inception](https://www.nvidia.com/en-us/startups/)
- In your description, mention:
  > "SpeakFlow is an AI-powered business English speaking coach that uses NVIDIA Riva for real-time phoneme-level pronunciation scoring and Meta Llama 3.1 (via build.nvidia.com) for adaptive conversation coaching. We serve non-native English professionals preparing for high-stakes business scenarios. Our technology stack requires NVIDIA's speech and LLM inference capabilities to deliver sub-200ms feedback in mobile environments."
- Benefits: $5K cloud credits, go-to-market support, NVIDIA branding rights

---

## 3. Railway Backend Deployment

### Connect Repository
1. Go to [railway.app](https://railway.app) → New Project
2. **Deploy from GitHub repo** → Select `speakflow`
3. Choose the `apps/api` root directory

### Configure Service
1. Service Settings → Root Directory: `apps/api`
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Set Environment Variables
In Railway Dashboard → Variables:
```
NVIDIA_API_KEY=nvapi-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REVENUECAT_WEBHOOK_SECRET=...
ENVIRONMENT=production
```

### Custom Domain (Optional)
- Settings → Domains → Add custom domain
- Point `api.speakflow.ai` CNAME to Railway-provided domain

---

## 4. Vercel Web Deployment

### Connect Repository
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import from GitHub → Select `speakflow`
3. **Root Directory**: `apps/web`
4. Framework Preset: **Next.js** (auto-detected)

### Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_ANNUAL_PRICE_ID=price_xxx
NEXT_PUBLIC_SITE_URL=https://speakflow.ai
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Custom Domain
1. Settings → Domains → Add `speakflow.ai`
2. Update DNS at your registrar:
   - A record: `76.76.21.21`
   - CNAME `www` → `cname.vercel-dns.com`

### Verify Deployment
```bash
curl https://speakflow.ai/api/create-checkout -X POST \
  -H "Content-Type: application/json"
# Should return: {"error":"Payment service is not configured"} (until Stripe keys are set)
```

---

## 5. RevenueCat Setup

### Create Account
1. [revenuecat.com](https://www.revenuecat.com) → Create Account
2. New Project → Name: `SpeakFlow`

### Configure iOS App
1. Apps → + New App → iOS
2. App name: `SpeakFlow`
3. Bundle ID: `ai.speakflow.app` (must match App Store)
4. In-App Purchase Key: Upload `.p8` file from App Store Connect

### Configure Android App
1. Apps → + New App → Android
2. Package: `ai.speakflow.android`
3. Service Account Credentials: Upload `google-play-service-account.json`

### Create Products
1. **Entitlements** → Create `pro` entitlement
2. **Products** → Create:
   - `speakflow_monthly`: $12.99/month with 7-day free trial
   - `speakflow_annual_web`: $79.99/year (web only, via Stripe)
3. **Offerings** → Default offering → Attach both products

### Webhook (for backend sync)
1. Project Settings → Integrations → Webhooks
2. URL: `https://api.speakflow.ai/webhooks/revenuecat`
3. Copy the signing secret → `REVENUECAT_WEBHOOK_SECRET` in Railway

### Get API Keys
- Public API Key → `REVENUECAT_PUBLIC_KEY` (mobile apps)
- Secret API Key → `REVENUECAT_SECRET_KEY` (backend)

---

## 6. App Store Submission Checklist

### Prerequisites
- [ ] Apple Developer Account ($99/yr) — [developer.apple.com](https://developer.apple.com)
- [ ] Xcode 15+ on macOS
- [ ] App icons: 1024×1024 PNG (no alpha, no rounded corners)
- [ ] Screenshots for iPhone 6.7" (1290×2796), 6.5" (1242×2688), iPad Pro 12.9" (2048×2732)

### App Store Connect Setup
- [ ] Create new app at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- [ ] Bundle ID: `ai.speakflow.app`
- [ ] SKU: `SPEAKFLOW-001`
- [ ] Primary language: English (U.S.)

### Metadata
- [ ] App name: **SpeakFlow — Business English**
- [ ] Subtitle: **AI Speaking Coach · NVIDIA Powered**
- [ ] Description: Include "NVIDIA Riva", "pronunciation scoring", "business English", "job interview"
- [ ] Keywords: `business english,pronunciation,speaking,ai coach,interview prep,esl,fluency`
- [ ] Category: Education
- [ ] Secondary Category: Business

### In-App Purchases
- [ ] Create subscription group: `SpeakFlow Pro`
- [ ] Monthly: `speakflow_monthly` — $12.99 — 7-day free trial
- [ ] Localize pricing for key markets (JP, DE, UK, CA, AU)

### Review Information
- [ ] Demo account credentials for App Review team
- [ ] Notes: "This app uses microphone for pronunciation analysis. NVIDIA AI processes audio in real-time."
- [ ] Sign in required: Yes — provide test account

### Build & Submit
```bash
# In apps/mobile/
npx expo build:ios --profile production
# or using EAS:
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 7. Go-Live Checklist (24 items)

### Infrastructure
- [ ] 1. Supabase project created and migrations pushed
- [ ] 2. Railway API deployed and responding to health check
- [ ] 3. Vercel web deployed at custom domain with HTTPS
- [ ] 4. All environment variables set in both Vercel and Railway
- [ ] 5. DNS propagated for speakflow.ai (verify with `dig speakflow.ai`)

### Stripe
- [ ] 6. Stripe account in live mode (not test)
- [ ] 7. Annual price created: `price_xxx` — $79.99 recurring yearly
- [ ] 8. `STRIPE_ANNUAL_PRICE_ID` set in Vercel
- [ ] 9. Stripe webhook configured: `https://speakflow.ai/api/webhooks/stripe`
- [ ] 10. Test checkout flow end-to-end with real card (use $0.50 test)

### NVIDIA Integration
- [ ] 11. NVIDIA API key active and tested
- [ ] 12. Riva ASR endpoint responding
- [ ] 13. Llama 3.1 endpoint responding
- [ ] 14. NVIDIA Inception application submitted

### RevenueCat & Mobile
- [ ] 15. RevenueCat products configured and entitlements mapped
- [ ] 16. iOS app submitted to App Store Review
- [ ] 17. Android app published to Google Play (internal testing first)
- [ ] 18. Test subscription purchase on TestFlight

### Analytics & Monitoring
- [ ] 19. Google Analytics 4 property created and tracking code active
- [ ] 20. Stripe Dashboard showing revenue (test transactions)
- [ ] 21. Error monitoring configured (Sentry or Vercel Analytics)
- [ ] 22. Railway health check endpoint at `/health` responding 200

### Legal & Compliance
- [ ] 23. Privacy Policy published at `speakflow.ai/privacy` (required for App Store)
- [ ] 24. Terms of Service published at `speakflow.ai/terms`

---

## Quick Reference: Environment Variables

### Vercel (apps/web)
| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_ANNUAL_PRICE_ID` | Stripe Dashboard → Products → Annual Plan → Price ID |
| `NEXT_PUBLIC_SITE_URL` | Your domain: `https://speakflow.ai` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics → Admin → Data Streams |

### Railway (apps/api)
| Variable | Where to get it |
|---|---|
| `NVIDIA_API_KEY` | build.nvidia.com → API Keys |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `REVENUECAT_WEBHOOK_SECRET` | RevenueCat → Project Settings → Integrations |
| `REVENUECAT_SECRET_KEY` | RevenueCat → Project Settings → API Keys |

---

## Support

- Technical issues: Check Vercel/Railway build logs first
- Stripe issues: `stripe logs tail` in CLI for real-time webhook logs
- NVIDIA API: [forums.developer.nvidia.com](https://forums.developer.nvidia.com)
- RevenueCat: [community.revenuecat.com](https://community.revenuecat.com)
