/**
 * Cloudflare Worker: SPA assets + chat + settings sync + Places proxy +
 * optional chart proxy to the Vercel Swiss Ephemeris service.
 */

const TONE = `Be accurate and neutral. State only what the chart supports. Do not add reassurance or positivity the chart does not support. Do not give exact dates, amounts, scores or exact outcomes; give periods and tendencies. Do not discuss death, lifespan, pregnancy, medical or psychological diagnoses. Do not promise outcomes. Religion-neutral: no deities or temple prescriptions; practical habits are fine. Keep answers under 120 words. Output ONLY the final user-facing answer — no planning, no rule checklists, no phrases like "The user wants" or "Constraints to follow".`;

/** Built-in default; dashboard/wrangler MASTER_PROMPT is appended on every LLM call. */
const DEFAULT_MASTER_PROMPT = `Always use the querent kundali JSON in context. Chat history and the rolling summary are for coherence only — natal facts come from the JSON. If a family kundali JSON is present, include both charts in the reading.`;

const DEFAULT_INVITE = 'KUNDALI-BETA';

function masterPrompt(env) {
  const fromEnv = String(env.MASTER_PROMPT || '').trim();
  return fromEnv || DEFAULT_MASTER_PROMPT;
}

/**
 * Vercel chart service config.
 * - CHART_API_URL: https://….vercel.app
 * - CHART_API_KEY: shared bearer (preferred)
 * - VERCEL_CHART: if https → URL; else treated as bearer when CHART_API_KEY unset
 */
function chartRemoteConfig(env) {
  const vercelChart = String(env.VERCEL_CHART || '').trim();
  let baseUrl = String(env.CHART_API_URL || '').trim();
  let apiKey = String(env.CHART_API_KEY || '').trim();
  if (!baseUrl && /^https?:\/\//i.test(vercelChart)) {
    baseUrl = vercelChart;
  } else if (!apiKey && vercelChart && !/^https?:\/\//i.test(vercelChart)) {
    apiKey = vercelChart;
  }
  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey,
  };
}

async function proxyChartUpstream(env, path, bodyText) {
  const { baseUrl, apiKey } = chartRemoteConfig(env);
  if (!baseUrl) {
    return json(
      {
        error: 'chart_remote_unconfigured',
        detail: 'Set CHART_API_URL to your Vercel chart deployment.',
      },
      503
    );
  }
  const headers = { 'content-type': 'application/json' };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  try {
    const upstream = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: bodyText || '{}',
      signal: AbortSignal.timeout(15000),
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      },
    });
  } catch (error) {
    return json(
      {
        error: 'chart_upstream_failed',
        detail: String(error?.message || error).slice(0, 160),
      },
      502
    );
  }
}

async function handleChartProxy(request, env) {
  let bodyText = '';
  try {
    bodyText = await request.text();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  return proxyChartUpstream(env, '/api/v1/chart', bodyText);
}

async function handleGocharaProxy(request, env) {
  let bodyText = '';
  try {
    bodyText = await request.text();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  return proxyChartUpstream(env, '/api/v1/gochara', bodyText);
}

async function probeChartRemote(env) {
  const { baseUrl, apiKey } = chartRemoteConfig(env);
  if (!baseUrl) return { ok: false, detail: 'unconfigured' };
  try {
    const headers = {};
    if (apiKey) headers.authorization = `Bearer ${apiKey}`;
    const response = await fetch(`${baseUrl}/api/health`, { headers });
    return { ok: response.ok, detail: response.ok ? 'swiss-ephemeris' : `status_${response.status}` };
  } catch (error) {
    return { ok: false, detail: String(error?.message || error).slice(0, 80) };
  }
}



function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, OPTIONS, GET',
    },
  });
}

function crisisReply(locale) {
  if (locale === 'hi') {
    return {
      text:
        'यह समय भारी लग रहा है। संकट सहायता के लिए मैं सही जगह नहीं हूँ। कृपया अभी स्थानीय आपातकालीन सेवाओं या किसी विश्वसनीय व्यक्ति से संपर्क करें। भारत में आप iCall पर 9152987821 कॉल कर सकते हैं। जब आप सुरक्षित हों, हम कुंडली पर फिर बात कर सकते हैं।',
      provider: 'guardrail',
      used_llm: false,
    };
  }
  return {
    text:
      'I hear that this feels heavy. I am not the right place for crisis support. Please contact local emergency services or a trusted person now. In India you can call iCall at 9152987821. When you are safer, we can talk about the chart again.',
    provider: 'guardrail',
    used_llm: false,
  };
}

function chartAwareFallback(question, chartContext, locale) {
  const q = String(question || '').toLowerCase();
  const ctx = String(chartContext || '');
  const lagna = (ctx.match(/Lagna:\s*(.+)/i) || [])[1] || (locale === 'hi' ? 'आपका लग्न' : 'your lagna');
  const moon = (ctx.match(/Moon:\s*(.+)/i) || [])[1] || (locale === 'hi' ? 'आपकी चंद्र राशि' : 'your Moon sign');
  const dasha = (ctx.match(/Current dasha:\s*(.+)/i) || [])[1] || (locale === 'hi' ? 'वर्तमान दशा' : 'the current dasha');

  if (locale === 'hi') {
    if (/career|job|work|promotion|business|करियर|नौकरी|व्यापार/.test(q)) {
      return `कुंडली (${lagna} लग्न; ${dasha}) के अनुसार दशम भाव स्थिर कौशल बढ़ाने के पक्ष में है। इस दशा में प्रगति क्रमशः दिखेगी। चाहें तो आगे उपाय या समय-विषय पर बात करें।`;
    }
    if (/marriage|relationship|partner|love|compatibility|विवाह|रिश्ता|प्रेम/.test(q)) {
      return `चंद्र ${moon} और लग्न ${lagna} के साथ सप्तम भाव जल्दबाज़ी से अधिक स्पष्ट संवाद का पक्षधर है। दोनों कुंडलियों की तुलना से अनुकूलता बेहतर समझ आती है।`;
    }
    if (/health|sleep|stress|anxiety|स्वास्थ्य|नींद|तनाव/.test(q)) {
      return `चंद्र ${moon} अक्सर संवेदनशील तंत्रिका तंत्र का संकेत देता है। नियमित नींद और हल्का रात्रि भोजन अनुमानित रत्नों से अधिक सहायक है। यह कुंडली मार्गदर्शन है, चिकित्सा निदान नहीं।`;
    }
    if (/remedy|remedies|donation|mantra|gemstone|उपाय|दान|मंत्र/.test(q)) {
      return `इस कुंडली के लिए शांत शनिवार की आदतें और घर पर दीपक के लिए तेल या अन्न का सादा दान उपयुक्त आरंभिक उपाय हैं। इन्हें अनुशासन का सहारा मानें, गारंटी नहीं।`;
    }
    return `आपकी कुंडली (${lagna} लग्न; चंद्र ${moon}; ${dasha}) के आधार पर नोट किया। करियर, संबंध, स्वास्थ्य या उपाय पूछें — उत्तर इन्हीं स्थितियों पर आधारित होंगे।`;
  }

  if (/career|job|work|promotion|business/.test(q)) {
    return `From the chart (${lagna} lagna; ${dasha}), the 10th-house picture favours steady skill-building over abrupt leaps. Progress is likely to feel gradual while this dasha runs. I can speak to remedies or timing themes next if you want.`;
  }
  if (/marriage|relationship|partner|love|compatibility/.test(q)) {
    return `With Moon as ${moon} and lagna in ${lagna}, the 7th-house themes favour clear communication over haste. Compatibility improves when both charts are compared. Family introductions often land better than rushed self-driven moves in this stretch.`;
  }
  if (/health|sleep|stress|anxiety/.test(q)) {
    return `Moon as ${moon} often marks a sensitive nervous system. Regular sleep and a lighter evening meal help more than speculative gemstones. This is chart guidance, not a medical diagnosis.`;
  }
  if (/remedy|remedies|donation|mantra|gemstone/.test(q)) {
    return `For this chart, calm Saturday habits and a simple act of giving (dark grains or oil for a lamp at home) are suitable starter remedies. Treat them as discipline supports, not guaranteed outcomes.`;
  }
  return `Noted against your chart (${lagna} lagna; Moon ${moon}; ${dasha}). Ask about career, relationships, health, or remedies for a more focused reading grounded in these placements.`;
}

/**
 * OpenAI-compatible chat (OpenAI, NVIDIA NIM, etc.).
 * Secrets / vars on the Worker only — never in the CRA browser bundle:
 *   OPENAI_API_KEY or NVIDIA_API_KEY
 *   OPENAI_BASE_URL  (default OpenAI; NVIDIA: https://integrate.api.nvidia.com/v1)
 *   OPENAI_MODEL     (OpenAI default gpt-4o-mini; set to your NIM model id)
 */
function llmConfig(env) {
  const key = env.OPENAI_API_KEY || env.NVIDIA_API_KEY || '';
  if (!key) return null;
  const baseUrl = String(env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const isNvidia = /nvidia\.com/i.test(baseUrl) || Boolean(env.NVIDIA_API_KEY && !env.OPENAI_API_KEY);
  const model =
    env.OPENAI_MODEL ||
    (isNvidia ? 'meta/llama-3.1-70b-instruct' : 'gpt-4o-mini');
  return {
    key,
    baseUrl,
    model,
    provider: isNvidia ? 'nvidia' : 'openai',
  };
}

/** NIM (and some OpenAI-compat hosts) want strict user/assistant alternation after system. */
function normalizeChatHistory(history) {
  const out = [];
  (Array.isArray(history) ? history : []).slice(-8).forEach((turn) => {
    if (!turn || !turn.content) return;
    const role = turn.role === 'assistant' ? 'assistant' : 'user';
    if (out.length && out[out.length - 1].role === role) {
      out[out.length - 1].content += `\n${turn.content}`;
      return;
    }
    out.push({ role, content: String(turn.content) });
  });
  return out;
}

async function openAiReply(env, question, chartContext, history, locale, summary = '') {
  const cfg = llmConfig(env);
  if (!cfg) return null;

  const langLine =
    locale === 'hi'
      ? 'Reply in clear Hindi (Devanagari). Keep Jyotish terms (lagna, dasha, nakshatra) as commonly used.'
      : 'Reply in clear English.';

  const summaryBlock = summary
    ? `\n\nRolling conversation summary (stateless context; trust this over raw history when they disagree):\n${summary}`
    : '';

  const messages = [
    {
      role: 'system',
      content: [
        TONE,
        langLine,
        `Master prompt:\n${masterPrompt(env)}`,
        `Kundali + context (querent JSON is always present; family JSON only when relevant):\n${chartContext || 'No chart provided.'}`,
        summaryBlock.trim(),
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
    ...normalizeChatHistory(history),
    {
      role: 'user',
      content: `${question}\n\n(Reply with the final answer only — one short reading, no planning.)`,
    },
  ];

  // muse-glimmer / similar reasoning models: low temp + tiny max_tokens often yields empty
  // content because reasoning shares the token budget (NVIDIA docs).
  const isReasoningNim = cfg.provider === 'nvidia' && /glimmer|muse|reason/i.test(cfg.model);
  const body = {
    model: cfg.model,
    messages,
    stream: false,
    temperature: isReasoningNim ? 0.95 : 0.4,
    max_tokens: isReasoningNim ? 4096 : 280,
  };
  if (isReasoningNim) {
    body.top_p = 1;
    body.reasoning_effort = 'minimal';
  }

  const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${cfg.key}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`LLM ${response.status}: ${raw.slice(0, 280)}`);
  }
  if (response.status === 202) {
    throw new Error(`LLM 202 pending: ${raw.slice(0, 200)}`);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`LLM non-JSON body: ${raw.slice(0, 200)}`);
  }

  const message = payload.choices?.[0]?.message || {};
  const text = finalizeAssistantText(extractMessageText(message));
  if (!text) {
    const finish = payload.choices?.[0]?.finish_reason || 'unknown';
    throw new Error(
      `Empty LLM response (${finish}): ${JSON.stringify(payload).slice(0, 280)}`
    );
  }
  return { text, provider: cfg.provider, used_llm: true };
}

/** Drop leaked chain-of-thought / planning when the model puts it in content. */
function finalizeAssistantText(raw) {
  let text = String(raw || '').trim();
  if (!text) return '';
  const leaked =
    /^the user wants\b/i.test(text) ||
    /\bconstraints to (?:follow|check)\b/i.test(text) ||
    /\bi (?:should|need to) keep it\b/i.test(text);
  if (!leaked) return text;

  const quoted = [...text.matchAll(/"([^"\n]{20,400})"/g)].map((m) => m[1].trim());
  if (quoted.length) return quoted[quoted.length - 1];

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && /lagna|moon|dasha|house|chart|mesha|career|initiative/i.test(s));
  if (sentences.length) return sentences[sentences.length - 1];

  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(
      (p) =>
        p.length >= 40 &&
        !/^the user wants\b/i.test(p) &&
        !/\bconstraints to (?:follow|check)\b/i.test(p) &&
        !/\bi (?:should|need to)\b/i.test(p)
    );
  return (parts[parts.length - 1] || text).trim();
}

function extractMessageText(message) {
  if (!message || typeof message !== 'object') return '';
  const direct = message.content ?? message.reasoning_content ?? message.text;
  if (typeof direct === 'string') return direct.trim();
  if (Array.isArray(direct)) {
    return direct
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        if (part && typeof part.content === 'string') return part.content;
        return '';
      })
      .join('')
      .trim();
  }
  return '';
}

function expectedInvite(env) {
  return String(env.BETA_INVITE_CODE || DEFAULT_INVITE).trim().toUpperCase();
}

function authorizeBeta(body, env) {
  const email = String(body?.email || '')
    .trim()
    .toLowerCase();
  const invite = String(body?.inviteCode || '')
    .trim()
    .toUpperCase();
  if (!email.includes('@')) return null;
  if (invite !== expectedInvite(env)) return null;
  return email;
}

function accountCacheKey(email) {
  return new Request(`https://kundali-beta.internal/account/${encodeURIComponent(email)}`);
}

async function readAccountStore(env, email) {
  if (env.SETTINGS) {
    const raw = await env.SETTINGS.get(`account:${email}`, 'json');
    if (raw) return raw;
  }
  try {
    const cached = await caches.default.match(accountCacheKey(email));
    if (cached) return cached.json();
  } catch {
    // ignore
  }
  return null;
}

async function writeAccountStore(env, email, account) {
  const payload = { ...account, email, updatedAt: new Date().toISOString() };
  if (env.SETTINGS) {
    await env.SETTINGS.put(`account:${email}`, JSON.stringify(payload));
  }
  try {
    await caches.default.put(
      accountCacheKey(email),
      new Response(JSON.stringify(payload), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'max-age=31536000',
        },
      })
    );
  } catch {
    // Cache API may be unavailable in some runtimes; KV path still works.
  }
  return payload;
}

async function handleChat(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.question) {
    return json({ error: 'question is required' }, 400);
  }

  const question = String(body.question).trim();
  const locale = body.locale === 'hi' ? 'hi' : 'en';
  if (/suicide|kill myself|self-harm|end my life|want to die|आत्महत्या|मरना चाहता/i.test(question)) {
    return json(crisisReply(locale));
  }

  const chartContext = body.chartContext || 'No chart provided.';
  const summary = String(body.summary || '').slice(0, 1200);
  // Prefer client-assembled history (already windowed + anonymised); fall back to raw.
  const history = Array.isArray(body.history) ? body.history : [];
  try {
    const llm = await openAiReply(env, question, chartContext, history, locale, summary);
    if (llm) {
      return json({
        ...llm,
        usage: {
          modelTier: body.modelTier || 'flash',
          anonymousId: body.anonymousId || '',
        },
      });
    }
  } catch (error) {
    return json({
      text: chartAwareFallback(question, chartContext, locale),
      provider: 'chart-fallback',
      used_llm: false,
      warning: String(error.message || error),
    });
  }

  return json({
    text: chartAwareFallback(question, chartContext, locale),
    provider: 'chart-local',
    used_llm: false,
    usage: {
      modelTier: body.modelTier || 'flash',
      anonymousId: body.anonymousId || '',
    },
  });
}

async function handleSettings(request, env) {
  const body = await request.json().catch(() => null);
  const email = authorizeBeta(body, env);
  if (!email) return json({ error: 'unauthorized' }, 401);

  const existing = (await readAccountStore(env, email)) || {};
  if (body.action === 'get') {
    return json({
      settings: existing.settings || { locale: 'en' },
      updatedAt: existing.updatedAt || null,
    });
  }
  if (body.action === 'put') {
    const locale = body.settings?.locale === 'hi' ? 'hi' : 'en';
    const settings = { locale, updatedAt: new Date().toISOString() };
    const saved = await writeAccountStore(env, email, { ...existing, settings });
    return json({ ok: true, settings: saved.settings });
  }
  return json({ error: 'action must be get or put' }, 400);
}

async function handleAccount(request, env) {
  const body = await request.json().catch(() => null);
  const email = authorizeBeta(body, env);
  if (!email) return json({ error: 'unauthorized' }, 401);

  if (body.action === 'get') {
    const account = await readAccountStore(env, email);
    return json({ account: account || null });
  }
  if (body.action === 'put') {
    if (!body.account || typeof body.account !== 'object') {
      return json({ error: 'account is required' }, 400);
    }
    const saved = await writeAccountStore(env, email, body.account);
    return json({ ok: true, account: saved });
  }
  return json({ error: 'action must be get or put' }, 400);
}

function estimateTzOffsetHours(lat, lon, countryCode) {
  const cc = String(countryCode || '').toUpperCase();
  if (cc === 'IN' || cc === 'IND') return 5.5;
  if (cc === 'NP') return 5.75;
  if (cc === 'LK') return 5.5;
  if (cc === 'BD') return 6;
  if (cc === 'PK') return 5;
  if (cc === 'AE') return 4;
  if (cc === 'GB') return 0;
  const rough = Math.round((Number(lon) || 0) / 15);
  return Math.max(-12, Math.min(14, rough));
}

async function googleTimezone(env, lat, lon) {
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${key}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 'OK') return null;
  const seconds = Number(data.rawOffset || 0) + Number(data.dstOffset || 0);
  return seconds / 3600;
}

async function googleAutocomplete(env, input) {
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', input);
  url.searchParams.set('types', '(cities)');
  url.searchParams.set('key', key);
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return null;
  return (data.predictions || []).map((item) => ({
    placeId: item.place_id,
    description: item.description,
    provider: 'google',
  }));
}

async function googleDetails(env, placeId) {
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'formatted_address,geometry,address_component,name');
  url.searchParams.set('key', key);
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 'OK' || !data.result) return null;
  const result = data.result;
  const lat = result.geometry?.location?.lat;
  const lon = result.geometry?.location?.lng;
  const country = (result.address_components || []).find((c) =>
    (c.types || []).includes('country')
  );
  const countryCode = country?.short_name || '';
  const tzOffsetHours =
    (await googleTimezone(env, lat, lon)) ?? estimateTzOffsetHours(lat, lon, countryCode);
  return {
    placeId,
    label: result.formatted_address || result.name,
    lat,
    lon,
    countryCode,
    tzOffsetHours,
    source: 'google',
  };
}

async function nominatimAutocomplete(input) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', input);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  const response = await fetch(url.toString(), {
    headers: {
      'user-agent': 'KundaliWebappBeta/1.0 (birth-place lookup)',
      accept: 'application/json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return (data || []).map((item) => ({
    placeId: `nominatim:${item.place_id}`,
    description: item.display_name,
    provider: 'nominatim',
    lat: Number(item.lat),
    lon: Number(item.lon),
    countryCode: item.address?.country_code?.toUpperCase() || '',
  }));
}

async function nominatimDetails(placeId, hint) {
  if (hint?.lat != null && hint?.lon != null) {
    const lat = Number(hint.lat);
    const lon = Number(hint.lon);
    return {
      placeId,
      label: hint.description || hint.label,
      lat,
      lon,
      countryCode: hint.countryCode || '',
      tzOffsetHours: estimateTzOffsetHours(lat, lon, hint.countryCode),
      source: 'nominatim',
    };
  }
  const id = String(placeId || '').replace(/^nominatim:/, '');
  const url = new URL('https://nominatim.openstreetmap.org/lookup');
  url.searchParams.set('osm_ids', `N${id}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  // Nominatim place_id lookup via details endpoint
  const searchUrl = new URL('https://nominatim.openstreetmap.org/details');
  searchUrl.searchParams.set('place_id', id);
  searchUrl.searchParams.set('format', 'json');
  const response = await fetch(searchUrl.toString(), {
    headers: {
      'user-agent': 'KundaliWebappBeta/1.0 (birth-place lookup)',
      accept: 'application/json',
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  const lat = Number(data.centroid?.coordinates?.[1] ?? data.lat);
  const lon = Number(data.centroid?.coordinates?.[0] ?? data.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const countryCode = data.country_code?.toUpperCase() || '';
  return {
    placeId,
    label: data.localname || data.names?.name || data.addresstags?.city || 'Selected place',
    lat,
    lon,
    countryCode,
    tzOffsetHours: estimateTzOffsetHours(lat, lon, countryCode),
    source: 'nominatim',
  };
}

async function handlePlacesAutocomplete(request, env) {
  const body = await request.json().catch(() => null);
  const email = authorizeBeta(body, env);
  if (!email) return json({ error: 'unauthorized' }, 401);
  const input = String(body.input || '').trim();
  if (input.length < 2) return json({ predictions: [], provider: 'none' });

  const google = await googleAutocomplete(env, input);
  if (google) {
    return json({
      predictions: google,
      provider: 'google',
      placesConfigured: true,
    });
  }

  const nominatim = await nominatimAutocomplete(input);
  return json({
    predictions: nominatim,
    provider: 'nominatim',
    placesConfigured: Boolean(env.GOOGLE_PLACES_API_KEY),
  });
}

async function handlePlacesDetails(request, env) {
  const body = await request.json().catch(() => null);
  const email = authorizeBeta(body, env);
  if (!email) return json({ error: 'unauthorized' }, 401);
  const placeId = String(body.placeId || '').trim();
  if (!placeId) return json({ error: 'placeId is required' }, 400);

  if (!placeId.startsWith('nominatim:') && env.GOOGLE_PLACES_API_KEY) {
    const place = await googleDetails(env, placeId);
    if (place) return json({ place });
  }

  const place = await nominatimDetails(placeId, body);
  if (!place) return json({ error: 'place not found' }, 404);
  return json({ place });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return json({ ok: true });
    }

    if (url.pathname === '/api/health') {
      const cfg = llmConfig(env);
      const chartRemote = await probeChartRemote(env);
      return json({
        ok: true,
        llm: Boolean(env.OPENAI_API_KEY || env.NVIDIA_API_KEY),
        llmProvider: cfg?.provider || null,
        llmModel: cfg?.model || null,
        masterPrompt: Boolean(String(env.MASTER_PROMPT || DEFAULT_MASTER_PROMPT).trim()),
        places: Boolean(env.GOOGLE_PLACES_API_KEY),
        settingsStore: Boolean(env.SETTINGS),
        chartRemote: chartRemote.ok,
        chartRemoteDetail: chartRemote.detail,
        chartApiConfigured: Boolean(chartRemoteConfig(env).baseUrl),
        service: 'kundali-webapp',
        build: env.WORKER_BUILD || null,
      });
    }

    if (url.pathname === '/api/chart' && request.method === 'POST') {
      return handleChartProxy(request, env);
    }
    if (url.pathname === '/api/gochara' && request.method === 'POST') {
      return handleGocharaProxy(request, env);
    }


    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }
    if (url.pathname === '/api/settings' && request.method === 'POST') {
      return handleSettings(request, env);
    }
    if (url.pathname === '/api/account' && request.method === 'POST') {
      return handleAccount(request, env);
    }
    if (url.pathname === '/api/places/autocomplete' && request.method === 'POST') {
      return handlePlacesAutocomplete(request, env);
    }
    if (url.pathname === '/api/places/details' && request.method === 'POST') {
      return handlePlacesDetails(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'not found' }, 404);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Assets binding missing', { status: 500 });
  },
};
