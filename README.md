# Kundali Astro Chat — Web Application

Invite-only **private beta** of the Astro Chat web app. Native mobile is on hold.

Targets the FigCraft extract in [`UI_SPEC.md`](./UI_SPEC.md). Not every screen is pixel-identical; known gaps are listed in [`docs/superpowers/plans/2026-11-16-webapp-beta-prototype.md`](./docs/superpowers/plans/2026-11-16-webapp-beta-prototype.md).

## Beta behaviour

- **Invite gate:** code `KUNDALI-BETA` (override with `REACT_APP_BETA_INVITE_CODE`) + email, stored in `localStorage`.
- **First run:** Splash → Invite → Birth details → Creating chart → Chat.
- **Returning users:** open Chat directly when onboarding is complete; same invite email restores language, birth details and chart from the Worker.
- **Chart:** real Lahiri / whole-sign natal chart in **North Indian diamond** layout, computed on-device (`astronomy-engine`).
- **Language:** English / Hindi (Settings). Preference syncs across devices via `/api/settings` + `/api/account`.
- **Place of birth:** autocomplete via Worker `/api/places/*` (Google Places when `GOOGLE_PLACES_API_KEY` is set; otherwise OpenStreetMap Nominatim). Selected place passes lat/lon/tz into the chart.
- **Answers:** `/api/chat` on the Worker uses anonymised chart context + rolling summary + last N turns; optional `OPENAI_API_KEY` Worker secret for LLM replies (otherwise chart-aware local replies). No provider key in the browser.
- **Providers:** Chart / Answer / Billing adapters under `src/providers/` so Swiss Ephemeris, OpenAI/Claude, and Razorpay can slot in without rewriting screens. See [`docs/PROVIDERS.md`](./docs/PROVIDERS.md).
- **Persistence:** birth details, chart, chats, family and settings survive refresh; account snapshot syncs to the Worker for cross-device recall.
- **Subscription:** local usage meter + low-balance banner are live; payment gateway is a stub until Phase C (no real charges).
- **Feedback:** Support → Send feedback (`REACT_APP_FEEDBACK_EMAIL`, default owner inbox).

## Features / routes

- Splash, invite, birth details, chart creation, chat
- Side panel: Chat, Kundali Chart, Family Members, Services, Subscription, Support, Settings
- Responsive shell (mobile drawer / desktop rail)

## Getting started

```bash
npm ci
npm start          # http://localhost:3000
CI=true npm test -- --watchAll=false
CI=true npm run build
```

## Deploy / beta testing

**Primary beta host (Cloudflare Workers):** https://kundali-webapp.asmaurya-in.workers.dev  

Tester checklist: [`docs/BETA_SMOKE.md`](./docs/BETA_SMOKE.md).  
In-repo Worker assets config: [`wrangler.toml`](./wrangler.toml) (CRA `build/` as SPA).

Workers Builds should run `CI=true npm run build` and publish via `wrangler.toml` (Worker + `build/` assets). Optional Cloudflare secrets:

| Secret | Purpose |
|--------|---------|
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Live LLM answers (default model `gpt-4o-mini`) |
| `GOOGLE_PLACES_API_KEY` | Google Places Autocomplete + Place Details + Time Zone |
| `BETA_INVITE_CODE` | Server-side invite check for sync/Places routes |

Optional KV namespace bound as `SETTINGS` makes account sync durable across colos; without it the Worker uses the Cache API best-effort store.

Raspberry Pi Docker deploy ([`DEPLOY.md`](./DEPLOY.md)) is legacy and **not** used for beta testing.

This repo is the `webapp/` child of [asmaurya/kundali-proj](https://github.com/asmaurya/kundali-proj).
