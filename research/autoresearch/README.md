# SpeakFlow Research Mesh

This directory contains the SpeakFlow-specific autoresearch workspaces.

## Workspaces

- `system` - API latency, cost, fallback behavior, and backend reliability
- `webapp` - landing -> subscribe -> checkout accessibility and performance
- `ios-app` - onboarding -> lesson -> paywall -> restore purchase funnel

## Current operating assumptions

- The production API is the FastAPI backend in `apps/api`.
- The web app is the Next.js app in `apps/web`.
- The mobile app is the Expo app in `apps/mobile`.
- The public domain should be a cheap temporary canonical domain first; preview URLs are internal only.
- Payment and entitlement work must respect the current staged state of Stripe, RevenueCat, Apple Developer, and Airwallex accounts.

## Rules

- Keep each workspace isolated.
- Record one hypothesis per experiment.
- Prefer low-risk changes first: caching, routing, UI clarity, accessibility, and observability.
- Treat payments, domains, production secrets, app store assets, and pricing claims as human-gated decisions.

