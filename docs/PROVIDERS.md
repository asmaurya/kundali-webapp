# Provider abstractions (web beta)

How the beta stays swappable for chart engines, LLMs, and billing without rewriting screens.

## ChartProvider

- **Contract:** `computeNatal(birth) → canonical chart JSON` (lagna, grahas, houses, dasha…).
- **Today:** `local-astronomy-engine` (`src/providers/chart/localChartProvider.js`).
- **Later:** set `REACT_APP_CHART_API_URL` or `setChartProvider(...)` to use Swiss Ephemeris / astrology-insights / Vedika behind `remoteChartProvider`.
- **Call site:** `createChart()` in `src/api.js` only. UI (`CreatingChartScreen`, `profiles`) never imports an ephemeris library.

## AnswerProvider + chat context (stateless LLM)

LLMs do not remember prior turns. The **host** must resend context every request.

| Kept where | What |
|------------|------|
| Browser (`chatStore` / localStorage) | Full conversation for the UI |
| Outbound to AnswerProvider | Anonymised question + anonymised chart context + **rolling summary** + **last N turns** (`contextAssembly.js`) |

Flow: `askOracle` → `askWithPrivacy` → anonymise → assemble → Worker `/api/chat` (or local fallback).

Swapping OpenAI / Claude / a private model = new `AnswerProvider` adapter only. The Worker already accepts `summary`, `history`, `anonymousId`, `modelTier`.

## Anonymisation

Before any provider call (`anonymize.js`):

- Emails / phones → `[email]` / `[phone]`
- Self name → `the querent`
- Family names → `the querent's {relation}`
- Birth place line in chart context → `[redacted]`

Canonical charts and chats stay identified **on-device / in our account store**; only the outbound LLM payload is scrubbed.

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
| `REACT_APP_CHART_API_URL` | Prefer remote ChartProvider |
| `REACT_APP_API_BASE` | Prefix for Worker AnswerProvider (usually empty — same origin) |
| Worker `NVIDIA_API_KEY` or `OPENAI_API_KEY` | Real LLM behind `/api/chat` (never in the browser) |
| Worker `OPENAI_BASE_URL` | OpenAI-compatible host; NVIDIA NIM → `https://integrate.api.nvidia.com/v1` |
| Worker `OPENAI_MODEL` | Model id for that host |
