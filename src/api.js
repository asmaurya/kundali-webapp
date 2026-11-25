import { chartContextForPrompt, generateChart } from './lib/chartEngine';
import { BETA_INVITE_CODE, buildAccountSnapshot } from './betaSession';

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Bad JSON from API (${response.status})`);
  }
}

/** Compute a real natal chart in the browser (no API key). */
export function createChart(birthDetails) {
  return generateChart(birthDetails);
}

/**
 * Ask the Worker for an answer grounded in the chart.
 * Falls back to a local chart-aware reply if /api/chat is unavailable.
 */
export async function askOracle({ question, chart, history = [], locale = 'en', extraContext = '' }) {
  const chartContext = `${chartContextForPrompt(chart)}${extraContext || ''}`;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question,
        chartContext,
        locale,
        history: history.map((m) => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.text,
        })),
      }),
    });
    if (!response.ok) {
      const err = await readJson(response).catch(() => ({}));
      throw new Error(err.error || `API ${response.status}`);
    }
    const data = await readJson(response);
    if (!data.text) throw new Error('Empty reply');
    return data;
  } catch (error) {
    const { scriptedReplyFor } = await import('./scriptedReplies');
    return {
      text: scriptedReplyFor(question),
      provider: 'client-fallback',
      used_llm: false,
      warning: String(error.message || error),
    };
  }
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
export async function fetchLlmLab(session, adminToken = '') {
  try {
    const response = await fetch('/api/admin/llm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...authBody(session),
        adminToken,
        action: 'get',
      }),
    });
    const data = await readJson(response);
    if (!response.ok) {
      return { ok: false, error: data.detail || data.error || 'unauthorized' };
    }
    return { ok: true, lab: data.lab, trace: data.trace || null };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}

/** Persist Worker LLM lab overrides. */
export async function saveLlmLab(session, adminToken = '', lab = {}) {
  try {
    const response = await fetch('/api/admin/llm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...authBody(session),
        adminToken,
        action: 'put',
        ...lab,
      }),
    });
    const data = await readJson(response);
    if (!response.ok) {
      return { ok: false, error: data.detail || data.error || 'save_failed' };
    }
    return {
      ok: true,
      lab: data.lab,
      secretSaved: Boolean(data.secretSaved),
      secretName: data.secretName || null,
      note: data.note || null,
    };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}

/** Run a one-off LLM probe and return the color-console trace. */
export async function probeLlmLab(session, adminToken = '', { question, chartContext, locale } = {}) {
  try {
    const response = await fetch('/api/admin/llm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...authBody(session),
        adminToken,
        action: 'probe',
        question,
        chartContext,
        locale,
      }),
    });
    const data = await readJson(response);
    if (!response.ok) {
      return { ok: false, error: data.detail || data.error || 'probe_failed', trace: data.trace || null };
    }
    return { ok: true, reply: data.reply, trace: data.trace || null, lab: data.lab };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}

/** Clear lab overrides back to Worker env defaults. */
export async function resetLlmLab(session, adminToken = '') {
  try {
    const response = await fetch('/api/admin/llm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...authBody(session),
        adminToken,
        action: 'reset',
      }),
    });
    const data = await readJson(response);
    if (!response.ok) {
      return { ok: false, error: data.detail || data.error || 'reset_failed' };
    }
    return { ok: true, lab: data.lab, note: data.note || null };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}

/** Remove a custom provider from the lab list (Cloudflare secret left in place). */
export async function deleteCustomLlmProvider(session, adminToken = '', providerId) {
  try {
    const response = await fetch('/api/admin/llm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...authBody(session),
        adminToken,
        action: 'deleteCustom',
        providerId,
      }),
    });
    const data = await readJson(response);
    if (!response.ok) {
      return { ok: false, error: data.detail || data.error || 'delete_failed' };
    }
    return { ok: true, lab: data.lab };
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
}


