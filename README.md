# Kundali Astro Chat — Web Application

Invite-only **private beta** of the Astro Chat web app. Native mobile is on hold.

Targets the FigCraft extract in [`UI_SPEC.md`](./UI_SPEC.md). Not every screen is pixel-identical; known gaps are listed in [`docs/superpowers/plans/2026-11-16-webapp-beta-prototype.md`](./docs/superpowers/plans/2026-11-16-webapp-beta-prototype.md).

## Beta behaviour

- **Invite gate:** code `KUNDALI-BETA` (override with `REACT_APP_BETA_INVITE_CODE`) + email, stored in `localStorage`.
- **First run:** Splash → Invite → Birth details → Creating chart → Chat.
- **Returning users:** open Chat directly when onboarding is complete.
- **Chart:** real Lahiri / whole-sign natal chart computed on-device (`astronomy-engine`).
- **Answers:** `/api/chat` on the Worker uses the chart context; optional `OPENAI_API_KEY` Worker secret for LLM replies (otherwise chart-aware local replies). No provider key in the browser.
- **Persistence:** birth details, chart, chats and family members survive refresh until logout.
- **Subscription:** UI preview only — no billing.
- **Feedback:** Support → Send feedback (`REACT_APP_FEEDBACK_EMAIL`, default owner inbox).

## Features / routes

- Splash, invite, birth details, chart creation, chat
- Side panel: Chat, Kundali Chart, Family Members, Services, Subscription, Support
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

Workers Builds should run `CI=true npm run build` and publish via `wrangler.toml` (Worker + `build/` assets). Optional Cloudflare secret: `OPENAI_API_KEY` (and `OPENAI_MODEL`, default `gpt-4o-mini`). Raspberry Pi Docker deploy ([`DEPLOY.md`](./DEPLOY.md)) is legacy and **not** used for beta testing.

This repo is the `webapp/` child of [asmaurya/kundali-proj](https://github.com/asmaurya/kundali-proj).
