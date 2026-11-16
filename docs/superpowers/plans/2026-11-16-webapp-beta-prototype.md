# Plan: Invite-only webapp beta prototype

> **For agentic workers:** implement task-by-task. Checkboxes track progress.

**Goal:** Ship an invite-only Astro Chat beta on the Pi (:8082) with local persistence and scripted answers. Native mobile stays on hold.

**Architecture:** React SPA. Beta session (invite code + email), birth details, chats and family members live in `localStorage`. No provider keys in the browser. Deploy via existing self-hosted Actions → Docker/nginx.

**Tech Stack:** React 18, MUI, React Router, CRA. Spec: `UI_SPEC.md`.

**Supersedes:** `2026-11-14-kundali-app-improvements.md` (archived — design-fidelity tasks already reflected in the current UI; that plan is not a beta plan).

## Global constraints

- Invite code default `KUNDALI-BETA` (override with `REACT_APP_BETA_INVITE_CODE`).
- Splash is the public entry; other app routes require invite + completed onboarding.
- Scripted replies only — no real AI/provider calls in beta.
- No billing; Subscription is preview UI.
- Soften temple/deity framing in user-facing copy; Jyotish terms OK.
- Drive visuals from `UI_SPEC.md`, not from the superseded fidelity plan.

## Baseline gaps vs `UI_SPEC.md` (2026-11-16)

Recorded after `npm test` / `npm run build` green on `main` tip before beta work:

1. Artboard in spec is 375×812; shell is full-viewport responsive (desktop side rail) — intentional for web beta.
2. Some screens use MUI defaults where the spec lists exact px/type styles — polish only when testers stumble.
3. Live-astrologer booking and real chart math are previews, not FigCraft-complete product flows.
4. Hill/telescope imagery remains decorative; copy audit removed explicit temple/deity remedy wording from scripted answers.

## Tasks

### Task 1: Beta session module — DONE

- [x] `src/betaSession.js` — invite, birth, onboarding, conversations, family keys; `seedCompletedBetaSession` for tests.
- [x] Invite code validation; `clearBetaSession` on logout.

### Task 2: Invite gate + first-run routing — DONE

- [x] `InviteGateScreen` at `/invite`.
- [x] Splash → invite or birth/chart/chat based on session.
- [x] Returning users with completed onboarding land on Chat.
- [x] Logout clears storage and returns to Splash.

### Task 3: Persistence + scripted answers — DONE

- [x] `chatStore` persists conversations/active id.
- [x] `scriptedReplies.js` keyword replies (career, relationships, health, remedies, week).
- [x] Family list persists locally; beta banner on Family and Subscription.
- [x] Support “Send feedback” `mailto:` (`REACT_APP_FEEDBACK_EMAIL`).

### Task 4: Tests + smoke checklist — DONE

- [x] RTL: invite gate, persistence, logout, first-run onboarding.
- [x] `docs/BETA_SMOKE.md` checklist for Pi testers.
- [x] README updated for beta reality (targets `UI_SPEC.md`; not “pixel-perfect everywhere”).

## Explicitly out of beta

Real OpenID, server broker, payments, live calls, ads, Flutter parity, mother-repo PRODUCT rewrite.

## Smoke / deploy

See `docs/BETA_SMOKE.md`. Push `main` → Pi runner builds and serves `:8082`.
