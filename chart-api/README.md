# Kundali Chart API (Vercel + Swiss Ephemeris)

Serverless natal chart service for the Kundali web beta.

- **Engine:** `@kuntay/swisseph` (Swiss Ephemeris 2.10 WASM; Moshier fallback without `.se1` files)
- **Ayanamsa:** Lahiri
- **Houses:** Whole sign
- **Nodes:** Mean Rahu / Ketu
- **Output:** Same canonical chart JSON as the webapp (`lagna`, `grahas`, `houses`, `dasha`, …)

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/health` | Liveness |
| `POST` | `/v1/chart` | Body `{ "birth": { date, time, place, lat?, lon?, tzOffsetHours? } }` |

Optional auth: set `CHART_API_KEY` and send `Authorization: Bearer <key>`.

## Deploy

```bash
cd chart-api
npm install
npx vercel --token "$VERCEL_TOKEN" --yes --prod
npx vercel env add CHART_API_KEY production   # same value as Cloudflare secret
```

Then on Cloudflare Worker:

- `CHART_API_URL` = `https://<your-deployment>.vercel.app`
- `CHART_API_KEY` or reuse `VERCEL_CHART` as the bearer shared with Vercel

The Worker proxies `POST /api/chart` → Vercel `/v1/chart`. The SPA prefers that remote engine and falls back to local astronomy-engine if remote is down.

## License note

`@kuntay/swisseph` is AGPL-3.0. For a closed-source commercial network service, obtain a Swiss Ephemeris Professional License from Astrodienst, or keep this API open-source.
