import { buildLlmChartContext } from './lib/chartEngine';
import { BETA_INVITE_CODE, buildAccountSnapshot } from './betaSession';
import {
  askWithPrivacy,
  getChartProvider,
  getUsageMeter,
} from './providers';

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Bad JSON from API (${response.status})`);
  }
}

/**
 * Compute a natal chart via the active ChartProvider.
 * Always returns a Promise — remote Swiss Ephemeris and local engines both work.
 */
export async function createChart(birthDetails) {
  const provider = getChartProvider();
  const chart = await Promise.resolve(provider.computeNatal(birthDetails));
  try {
    getUsageMeter().recordChart({
      provider: chart?.provenance?.provider || provider.id,
    });
  } catch {
    /* metering must never block chart creation */
  }
  return chart;
}

/**
 * Ask the AnswerProvider with anonymisation + rolling context.
 * Returns `{ text, provider, used_llm, usage, warning? }` for chatStore.
 */
/** Ask the LLM for a short chat title (3–6 words). */
export async function suggestChatTitle({ question, reply, history = [] }) {
  const result = await askWithPrivacy({
    question: `Propose a concise chat title (3 to 6 words, Title Case, no quotes) for this astrology conversation. Question: ${question}. Reply excerpt: ${String(reply || '').slice(0, 180)}`,
    chartContext: 'Title helper only — ignore chart detail.',
    messages: history.slice(-4),
    locale: 'en',
    people: {},
    modelTier: 'flash',
  });
  const raw = String(result.answer || '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .split('\n')[0]
    .trim();
  if (!raw || raw.length > 60) return '';
  return raw;
}

/** Executive summary of a conversation for the user or a human handoff. */
export async function summarizeConversation({ messages = [], chart }) {
  const transcript = messages
    .slice(-16)
    .map((m) => `${m.role === 'user' ? 'User' : 'Astrologer'}: ${m.text}`)
    .join('\n');
  const result = await askWithPrivacy({
    question: `Write an executive summary (max 120 words) of this astrology chat for a human reader. Cover topics asked and guidance given. Transcript:\n${transcript}`,
    chartContext: buildLlmChartContext({ querentChart: chart }),
    messages: [],
    locale: 'en',
    people: {},
    modelTier: 'flash',
  });
  return String(result.answer || '').trim();
}

export async function askOracle({
  question,
  chart,
  chartContext,
  history = [],
  locale = 'en',
  familyCharts = [],
  people = {},
  modelTier = 'flash',
}) {
  // Querent kundali is always in context; family charts are additive when provided.
  const resolvedContext =
    chartContext ||
    buildLlmChartContext({
      querentChart: chart,
      familyCharts,
    });
  const result = await askWithPrivacy({
    question,
    chartContext: resolvedContext,
    messages: history,
    locale,
    people,
    modelTier,
  });

  try {
    getUsageMeter().recordLlm(result.usage || {}, {
      provider: result.provider,
    });
  } catch {
    /* ignore */
  }

  return {
    text: result.answer,
    provider: result.provider,
    used_llm: result.provider !== 'local-heuristic',
    usage: result.usage,
  };
}

export async function health() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) return { ok: false };
    return readJson(response);
  } catch {
    return { ok: false };
  }
}

function authBody(session) {
  return {
    email: session?.email || '',
    inviteCode: session?.inviteCode || BETA_INVITE_CODE,
  };
}

/** Load synced account settings (language etc.) for this beta email. */
export async function fetchRemoteSettings(session) {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...authBody(session), action: 'get' }),
    });
    if (!response.ok) return null;
    const data = await readJson(response);
    return data.settings || null;
  } catch {
    return null;
  }
}

/** Push language settings to the Worker for cross-device recall. */
export async function pushRemoteSettings(session, settings) {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...authBody(session),
        action: 'put',
        settings,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Pull full account snapshot (settings + birth + chart) after invite. */
export async function fetchRemoteAccount(session) {
  try {
    const response = await fetch('/api/account', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...authBody(session), action: 'get' }),
    });
    if (!response.ok) return null;
    const data = await readJson(response);
    return data.account || null;
  } catch {
    return null;
  }
}

/** Push full account snapshot so charts/settings follow the user across devices. */
export async function pushRemoteAccount(session, account = buildAccountSnapshot()) {
  try {
    const response = await fetch('/api/account', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...authBody(session),
        action: 'put',
        account,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Google Places (or Nominatim fallback) autocomplete via Worker proxy. */
export async function placesAutocomplete(input, session) {
  const query = String(input || '').trim();
  if (query.length < 2) return { predictions: [], provider: 'none' };
  try {
    const response = await fetch('/api/places/autocomplete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...authBody(session),
        input: query,
      }),
    });
    if (!response.ok) return { predictions: [], provider: 'error' };
    return readJson(response);
  } catch {
    return { predictions: [], provider: 'error' };
  }
}

/** Resolve a place id to lat/lon/tz via Worker. */
export async function placesDetails(placeId, session, hint = {}) {
  try {
    const response = await fetch('/api/places/details', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...authBody(session),
        placeId,
        ...hint,
      }),
    });
    if (!response.ok) return null;
    const data = await readJson(response);
    return data.place || null;
  } catch {
    return null;
  }
}
