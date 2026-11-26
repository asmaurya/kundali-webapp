# Provider abstractions (web beta)

How the beta stays swappable for chart engines, LLMs, and billing without rewriting screens.

## ChartProvider

- **Contract:** `computeNatal(birth) → canonical chart JSON` (lagna, grahas, houses, dasha…).
- **Production (Swiss only):** Worker `POST /api/chart` (+ `/api/gochara`) → Vercel Swiss Ephemeris (`chart-api/`, `@kuntay/swisseph`). No astronomy-engine fallback in the live app.
- **Remote URL override:** set `REACT_APP_CHART_API_URL` to the Vercel origin.
- **Local-only (tests):** set `REACT_APP_CHART_LOCAL_ONLY=1` for offline Jest fixtures.
- **Call site:** `createChart()` in `src/api.js` only. UI never imports an ephemeris library.

Deploy notes: see `chart-api/README.md`. Cloudflare needs `CHART_API_URL` (+ optional `CHART_API_KEY` / `VERCEL_CHART` bearer).

## AnswerProvider + chat context (stateless LLM)

LLMs do not remember prior turns. The **host** must resend context every request.

| Kept where | What |
|------------|------|
| Browser (`chatStore` / localStorage) | Full conversation for the UI |
| Outbound to AnswerProvider | Anonymised question + **querent kundali JSON (always)** + optional family kundali JSON + **rolling summary** + **last N turns** |

Kundali is sent as **JSON** (not XML) — same shape as our canonical chart, compacted for the model (`chartJsonForPrompt` / `buildLlmChartContext`).

Flow: `askOracle` → `askWithPrivacy` → anonymise → assemble → Worker `/api/chat` (uses Lab master prompt, seeded from **MASTER_PROMPT**) → LLM.

Swapping OpenAI / Claude / a private model = new `AnswerProvider` adapter only. The Worker already accepts `summary`, `history`, `anonymousId`, `modelTier`.

## Anonymisation

Before any provider call (`anonymize.js`) — **names only**, so the model cannot link answers to a real person:

- Self name → `the querent`
- Family names → `the querent's {relation}`
- Emails / phones → `[email]` / `[phone]` (not needed for Jyotish)

**Not redacted** (required for Jyotish): birth date, time, place, lat/lon/tz, full chart placements, and the user’s query text (aside from embedded names).

Canonical charts and chats stay identified **on-device / in our account store**; the outbound LLM payload drops personal names only.

## Billing — when to implement what

Aligned with mother-repo `docs/ARCHITECTURE.md` Phase B (providers) → Phase C (money):

| Piece | When | Status in this beta |
|-------|------|---------------------|
| **UsageMeter** | **Now** — record every chart + LLM call | Local wallet + events (`src/providers/billing/usageMeter.js`) |
| **LowBalanceBanner** | **Now** as UI seam; real money later | Wired in `App.js`; shows when local balance ≤ threshold |
| **PaymentGateway** | **Phase C** — after signed-in accounts + real LLM costs are known | `NoopPaymentGateway` + Razorpay skeleton; Subscription “Top up” exercises the stub |
| Real charging / Razorpay | After spike S3 (billing legality) and OpenID | Not started |

**Rule of thumb:** meter before you charge; abstract the gateway before you pick Razorpay vs Stripe; do not block provider work on payment integration.

## Env knobs

| Variable | Effect |
|----------|--------|
| `REACT_APP_CHART_API_URL` | Remote-only ChartProvider (Vercel origin) |
| `REACT_APP_CHART_LOCAL_ONLY` | Force local astronomy-engine |
| Worker `CHART_API_URL` | Vercel chart API origin for `/api/chart` proxy |
| Worker `CHART_API_KEY` / `VERCEL_CHART` | Bearer shared with Vercel `CHART_API_KEY` |
| `REACT_APP_API_BASE` | Prefix for Worker AnswerProvider (usually empty — same origin) |
| Worker `NVIDIA_API_KEY` or `OPENAI_API_KEY` | Real LLM behind `/api/chat` (never in the browser) |
| Worker `OPENAI_BASE_URL` | OpenAI-compatible host; NVIDIA NIM → `https://integrate.api.nvidia.com/v1` |
| Worker `OPENAI_MODEL` | Model id for that host |
| LLM Lab master prompt | Editable system text for every LLM call; seeded from `MASTER_PROMPT` / code default, fully overridable (including clear) |
