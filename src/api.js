import { chartContextForPrompt } from './lib/chartEngine';
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
 * Local astronomy-engine is sync today; remote adapters may return a Promise.
 * Callers that already `await` keep working either way.
 */
export function createChart(birthDetails) {
  const provider = getChartProvider();
  const result = provider.computeNatal(birthDetails);
  const meter = () => {
    try {
      getUsageMeter().recordChart({ provider: provider.id });
    } catch {
      /* metering must never block chart creation */
    }
  };
  if (result && typeof result.then === 'function') {
    return result.then((chart) => {
      meter();
      return chart;
    });
  }
  meter();
  return result;
}

/**
 * Ask the AnswerProvider with anonymisation + rolling context.
 * Returns `{ text, provider, used_llm, usage, warning? }` for chatStore.
 */
export async function askOracle({
  question,
  chart,
  history = [],
  locale = 'en',
  extraContext = '',
  people = {},
  modelTier = 'flash',
}) {
  const chartContext = `${chartContextForPrompt(chart)}${extraContext || ''}`;
  const result = await askWithPrivacy({
    question,
    chartContext,
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
