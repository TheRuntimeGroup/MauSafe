# MauSafe

A mobile-first safety companion for the **Powered to Protect** challenge in Mauritius. It brings together three calm, privacy-first tools:

1. **Journey check-in** — start a check-in, share an expiring, read-only guest link with someone you trust, and let them see server-clock status: *On the way*, *Arrived safely*, *Overdue*, or *Cancelled*.
2. **Get Help** — a searchable directory built from cleaned, official Mauritius Police data (Family Protection Unit, stations, 999, MAUCORS+). Works offline from the bundled dataset.
3. **Scam check** — an on-device checker with explainable rules in English, French and Kreol Morisien. Pasted content never leaves the device.
4. **Emergency** — a calm, reassuring SOS screen with the verified 999 number, secondary emergency numbers, and step-by-step guidance.
5. **Trusted contacts** — save the people you trust locally and send a check-in to them in one tap via WhatsApp, SMS or email.
6. **Safety tips** — practical, localized guidance for journeys, transit, meeting someone new and online safety.

The interface is a calm light design: deep ink text, violet primary action, green arrivals, amber overdue, and red reserved strictly for emergencies. Bottom navigation on mobile, a compact sidebar on desktop, and full i18n (EN / FR / KM).

## The team

Our project is based on the 1st Title given which is **POWERED TO PROTECT**.

Group name: **DEAD SIGNAL**

- SULAKSHNA DEVI CHINIAH — Team Leader
- VENCATASEN VRISHNI
- LALLBEEHARRY KAUSHAL
- MANDHUB DIVESH

Our aim is to change the way people stay safe in their daily lives — empowering individuals at risk with rapid emergency alerts, trusted-contact safety tools, and proactive fraud and crime prevention.

## Stack

- **React 19 + TypeScript** (Vite)
- **React Router** — routes live in `src/App.tsx`
- **Tailwind CSS** + shadcn/ui primitives
- **Nitro** server layer (`server/`) with **better-sqlite3** for local persistence
- **PWA** manifest + service worker for offline support

## Getting started

```bash
npm install
npm run dev
```

The app runs on the Vite dev server (port 8080 by default). Journey data is stored in a local SQLite file at `.data/anou.db` (gitignored), so no external database or secrets are required for local development.

## Architecture

```
server/
  lib/
    db.ts         SQLite schema + connection (journeys table)
    security.ts   SHA-256, token generation, in-memory rate limiter
    journey.ts    journey CRUD + server-clock status computation
    guard.ts      owner authorization helper
  routes/api/
    journeys.post.ts            create journey
    journeys.get.ts             list my journeys
    journeys/[id].get.ts        get my journey
    journeys/[id]/arrive.post.ts
    journeys/[id]/extend.post.ts
    journeys/[id]/cancel.post.ts
    journeys/[id]/revoke.post.ts
    guest/[token].get.ts        public guest view

src/
  pages/         Index, CheckIns, StartCheckIn, JourneyDetail, GuestView, Emergency, Contacts, SafetyTips, ScamCheck, GetHelp, NotFound
  components/    AppShell, JourneyStatusCard, SharePanel, StatusPill, Logo, LanguageSwitcher
  lib/           api client, scam rules engine, storage, formatting, types
  i18n/          EN / FR / KM dictionaries + provider
  data/          bundled help-directory.json + search helpers
```

## Security & privacy model

- **Device-bound owner identity.** The client generates a high-entropy secret on first use (`localStorage` key `anou.ownerSecret`), sends it as `Authorization: Bearer`, and the server stores only its SHA-256 hash. Journeys are listed and fetched by secret hash.
- **Guest links.** High-entropy `base64url` tokens, 48-hour TTL, revocable. The guest endpoint returns only agreed fields and is rate-limited in memory.
- **Server-clock status.** `arrived_at` / `cancelled_at` are stored, and *overdue* is computed server-side (`now > expected_arrival_at`). The client never sends absolute arrival times — only a duration in minutes.
- **Voluntary location sharing.** A check-in can optionally share live location; the owner must enable it and grant browser permission first, and can stop sharing at any time.
- **Scam check runs on-device.** Pasted content is never sent or stored; suspicious links are rendered as plain text and are never clickable.

## Help directory data

The directory ships as a versioned dataset at `src/data/help-directory.json` so it works offline. It is a cleaned seed dataset from public Mauritius Police Force pages. Phone numbers are marked `phoneVerified: false` (and tap-to-call stays disabled) except for the national emergency number 999, until the team confirms each number against a current official source. Always confirm against official sources before relying on it.

## Demo timer

For presentations, **Check-ins** has a *Start demo check-in* button that creates a 1-minute journey with `isDemo: true`. Demo records are clearly labelled and kept separate from real records, and no live alerts are sent.

## Language note

English, French and Kreol Morisien are wired throughout via `t()`. The Kreol Morisien wording should be reviewed by a fluent speaker before any public release.

## AI tooling disclosure

The scam checker uses transparent, explainable pattern rules (not a black-box model): urgency/pressure, one-time-code requests, unexpected payment/prize, and suspicious links. Rules are human-readable in `src/lib/scamCheck.ts` and the matched words are highlighted for the user.
