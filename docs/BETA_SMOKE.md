# Beta smoke checklist (Cloudflare Workers)

**Beta URL:** https://kundali-webapp.asmaurya-in.workers.dev

(Local: `npm start` at http://localhost:3000.)

Default invite code: `KUNDALI-BETA` (or `REACT_APP_BETA_INVITE_CODE`).

Raspberry Pi / `:8082` is **not** used for beta testing.

## First-run

1. Open the app in a private window (empty storage).
2. Confirm Splash shows **Get Started** (or redirect to Splash if you open `/chat` while logged out).
3. Continue to invite; wrong code shows a calm message; correct code + email continues.
4. Enter birth date, time, place → Creating chart → Chat with a greeting.

## Chat

5. Send three messages (e.g. career, relationship, health) and confirm scripted, chart-flavoured replies.
6. Start **New chat**; confirm the previous thread stays in history.
7. Refresh the page; birth session, chats and active thread survive.

## Shell pages

8. Open **Kundali Chart**, **Family Members**, **Services**, **Subscription**, **Support** from the side panel.
9. Add a family member; refresh; member still listed.
10. Subscription shows a **Beta — coming soon** notice; billing buttons disabled/preview.
11. Support **Send feedback** opens a mailto draft.

## Logout

12. Log out from the side panel account block.
13. Confirm return to Splash and that `/chat` no longer opens the app until invite + onboarding again.

## Regressions

14. `CI=true npm test -- --watchAll=false` and `CI=true npm run build` pass before push.
