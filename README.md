# Kundali Astro Chat — Web Application

Invite-only **private beta** of the Astro Chat web app. Native mobile is on hold.

Targets the FigCraft extract in [`UI_SPEC.md`](./UI_SPEC.md). Not every screen is pixel-identical; known gaps are listed in [`docs/superpowers/plans/2026-11-16-webapp-beta-prototype.md`](./docs/superpowers/plans/2026-11-16-webapp-beta-prototype.md).

## Beta behaviour

- **Invite gate:** code `KUNDALI-BETA` (override with `REACT_APP_BETA_INVITE_CODE`) + email, stored in `localStorage`.
- **First run:** Splash → Invite → Birth details → Creating chart → Chat.
- **Returning users:** open Chat directly when onboarding is complete.
- **Answers:** scripted / keyword-based on-device (no provider API key in the client).
- **Persistence:** birth details, chats and family members survive refresh until logout.
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

## Deploy

Raspberry Pi self-hosted Actions → Docker/nginx on **:8082**. See [`DEPLOY.md`](./DEPLOY.md) and the tester checklist [`docs/BETA_SMOKE.md`](./docs/BETA_SMOKE.md).

This repo is the `webapp/` child of [asmaurya/kundali-proj](https://github.com/asmaurya/kundali-proj).
