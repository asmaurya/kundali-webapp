import { ANSWER_PROVIDER_IDS } from './types';

/**
 * Calls the Cloudflare Worker /api/chat (today: mock; later: real LLM behind same route).
 */
export function createWorkerAnswerProvider({
  baseUrl = '',
  fetchImpl = fetch,
} = {}) {
  return {
    id: ANSWER_PROVIDER_IDS.worker,
    async ask(request) {
      const origin = String(baseUrl || '').replace(/\/$/, '');
      const response = await fetchImpl(`${origin}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: request.question,
          locale: request.locale || 'en',
          chartContext: request.chartContext || '',
          summary: request.summary || '',
          history: request.history || [],
          anonymousId: request.anonymousId || '',
          modelTier: request.modelTier || 'flash',
        }),
      });
      if (!response.ok) {
        throw new Error(`Answer provider HTTP ${response.status}`);
      }
      const data = await response.json();
      // Worker historically returns `text`; accept `answer` for future adapters.
      const answer = data.answer || data.text || '';
      if (!answer) {
        throw new Error('Empty reply from answer provider');
      }
      return {
        answer,
        provider: data.provider || ANSWER_PROVIDER_IDS.worker,
        usage: data.usage || {
          promptTokens: estimateTokens(request),
          completionTokens: Math.ceil(String(answer).length / 4),
          modelTier: request.modelTier || 'flash',
        },
      };
    },
  };
}

function estimateTokens(request) {
  const blob = [
    request.question,
    request.chartContext,
    request.summary,
    ...(request.history || []).map((h) => h.content),
  ].join(' ');
  return Math.ceil(blob.length / 4);
}
