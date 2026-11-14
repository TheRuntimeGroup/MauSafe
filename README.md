# MauSafe

A calm, privacy-first safety companion for people living in and visiting Mauritius. MauSafe brings emergency help, journey tracking, scam detection, trusted contacts and community safety alerts into one accessible, multilingual app.

Built for the **Powered to Protect** challenge.

## Features

- **Emergency SOS & Safety Alarm** — a reassuring SOS screen with the verified **999** number, secondary emergency numbers, a panic alarm and step-by-step guidance. Includes an SOS map for nearby help.
- **Safe journey tracking** — start a check-in, share an expiring read-only guest link with someone you trust, and track server-clock status: *On the way*, *Arrived safely*, *Overdue* or *Cancelled*. Voluntary live-location sharing is available and can be stopped at any time.
- **Scam & suspicious-link check** — AI-assisted scoring (via a Supabase Edge Function using DeepSeek) with an on-device explainable-rules fallback, in English and French.
- **Crime & incident reporting** — submit and review community reports with role-based access.
- **Community safety alerts** — district-based alerts, incident map and a searchable help directory of official services.
- **Trusted contacts** — save the people you trust and send a check-in or SOS in one tap.
- **Child & guardian accounts** — OTP-verified child accounts with a dedicated kids zone and guardian journey monitoring.
- **Disaster & safety tips** — practical, localized guidance for journeys, transit, natural disasters and online safety.
- **Accessibility-first** — elderly-friendly controls, high-contrast and monochrome modes, adjustable text, and full EN/FR support.
- **PWA** — installable and works offline via a service worker.

## Tech stack

- **React 19 + TypeScript** (Vite)
- **React Router** — all routes live in `src/App.tsx`
- **Tailwind CSS** + shadcn/ui primitives
- **Supabase** — authentication, Postgres database and Edge Functions
- **Nitro** server layer (`server/`) with **better-sqlite3** for local journey persistence
- **PWA** — manifest + service worker for install & offline support
- **i18n** — English / French dictionaries via `src/i18n/`

## Getting started

```bash
npm install
npm run dev
```

The Vite dev server runs on port **8080** by default. The Nitro API server runs alongside Vite through the `nitro/vite` plugin, so no separate process is required.

Supabase credentials are configured in `src/integrations/supabase/client.ts`. Edge Functions are deployed to Supabase automatically and receive their secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) from the project's Edge Function secrets.

## Project structure

```
src/
  App.tsx            app routes
  pages/             feature pages (Emergency, SafeWalk, ScamCheck, Community, …)
  components/        shared UI (AppShell, Logo, AccountMenu, JourneyStatusCard, …)
  lib/               API clients, scam rules, storage, formatting, types
  i18n/              EN / FR dictionaries + provider
  integrations/      Supabase client

server/
  lib/               SQLite schema, journey logic, security, guards
  routes/api/        journeys, guest links, quick shares, reputation, weather, alerts

supabase/
  functions/         ai-scam-check, verify-signup, verify-login, send-otp,
                     create-child-account, verify-child-account, upload-community-media, …
```

## Server API

The Nitro server exposes the journey and helper endpoints used by the app, including:

- `POST /api/journeys`, `GET /api/journeys` — create / list journeys
- `GET /api/journeys/:id` — journey detail with server-clock status
- `POST /api/journeys/:id/arrive|cancel|extend|revoke|notify|location` — journey actions
- `GET /api/guest/:token` — public guest view (expiring, revocable)
- `GET /api/weather`, `GET /api/reputation`, `GET /api/disaster-alerts` — safety data helpers

Journey records are stored in a local SQLite file at `.data/anou.db` (gitignored), so no external database or secrets are required for local development of the journey flow.

## Supabase

Authentication, profiles, community reports, announcements and Edge Functions run on Supabase. All database tables have Row Level Security enabled, and client-side grants follow the principle of least privilege.

Edge Functions include:

- `ai-scam-check` — AI scam risk scoring
- `verify-signup` / `verify-login` — OTP and account verification
- `send-otp` — OTP delivery
- `create-child-account` / `verify-child-account` — child account setup
- `upload-community-media` — authenticated community media uploads
- `validate-name` — name validation helper
- `speak-text` — speech synthesis helper

## Security & privacy model

- **Authentication-first.** Most features require a signed-in user; admin features are role-gated.
- **Device-bound owner identity for journeys.** The client generates a high-entropy secret on first use, sends it as `Authorization: Bearer`, and the server stores only its SHA-256 hash.
- **Guest links.** High-entropy tokens with a 48-hour TTL, revocable, and rate-limited. Guest endpoints return only agreed fields.
- **Voluntary location sharing.** Live location requires explicit consent and browser permission, and can be stopped at any time.
- **Scam check.** When AI ranking is used, the pasted text/link is sent to the `ai-scam-check` Edge Function for scoring; the local fallback runs entirely on-device and pasted content is never stored.
- **Row Level Security** on all Supabase tables ensures users can only access their own data.

## Deployment

The app builds as a static Vite SPA. `vercel.json` provides SPA fallback rewrites, and the PWA manifest/service worker are served from `public/`.

```bash
npm run build
```
