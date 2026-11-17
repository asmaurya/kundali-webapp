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

| Secret / var | Purpose |
|--------------|---------|
| `NVIDIA_API_KEY` or `OPENAI_API_KEY` | Live LLM answers (**Worker secret only** — never in the browser / CRA `.env`) |
| `OPENAI_BASE_URL` | OpenAI-compatible base (default `https://api.openai.com/v1`; NVIDIA NIM: `https://integrate.api.nvidia.com/v1`) |
| `OPENAI_MODEL` | Model id (e.g. `nvidia/nemotron-3.5-bolt-e4b`) |
| `MASTER_PROMPT` | Optional master instructions appended to every LLM system prompt |
| `GOOGLE_PLACES_API_KEY` | Google Places Autocomplete + Place Details + Time Zone |
| `BETA_INVITE_CODE` | Server-side invite check for sync/Places routes |

**NVIDIA NIM:** in the Cloudflare dashboard → Workers → `kundali-webapp` → Settings → Variables and Secrets, add:

1. Secret `NVIDIA_API_KEY` = your NVIDIA key  
2. Var `OPENAI_BASE_URL` = `https://integrate.api.nvidia.com/v1`  
3. Var `OPENAI_MODEL` = the model id from the NIM playground  

Or via CLI from `webapp/`:

```bash
npx wrangler secret put NVIDIA_API_KEY
npx wrangler secret put OPENAI_BASE_URL   # paste https://integrate.api.nvidia.com/v1
npx wrangler secret put OPENAI_MODEL      # paste your NIM model id
```

Optional KV namespace bound as `SETTINGS` makes account sync durable across colos; without it the Worker uses the Cache API best-effort store.

Raspberry Pi Docker deploy ([`DEPLOY.md`](./DEPLOY.md)) is legacy and **not** used for beta testing.

This repo is the `webapp/` child of [asmaurya/kundali-proj](https://github.com/asmaurya/kundali-proj).
