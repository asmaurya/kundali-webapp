import { chartContextForPrompt, generateChart } from './lib/chartEngine';

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
export async function askOracle({ question, chart, history = [] }) {
  const chartContext = chartContextForPrompt(chart);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question,
        chartContext,
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
    // Offline / assets-only fallback
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
