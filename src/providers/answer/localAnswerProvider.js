import { ANSWER_PROVIDER_IDS } from './types';

/** Offline fallback when the Worker is unreachable. */
export const localAnswerProvider = {
  id: ANSWER_PROVIDER_IDS.localHeuristic,
  async ask(request) {
    const q = String(request.question || '').toLowerCase();
    let answer =
      'Your chart holds a clear signal here. Stay grounded this week, favour steady routines, and revisit this question after the current dasha shift settles.';
    if (/career|job|work|promotion/.test(q)) {
      answer =
        'Career timing looks constructive if you move with patience. Prefer collaborative moves over abrupt jumps; a review window in the next 2–3 weeks is favourable.';
    } else if (/marriage|relationship|partner|love/.test(q)) {
      answer =
        'Relationship themes ask for clarity over drama. Name one need out loud; avoid decisions driven only by short-term lunar mood.';
    } else if (/health|sleep|stress/.test(q)) {
      answer =
        'Health guidance from the chart favours rhythm: earlier sleep, lighter evenings, and one protective habit you can keep for 21 days.';
    } else if (/remedy|remedies|donation|mantra/.test(q)) {
      answer =
        'A simple remedy path: one weekly donation aligned with the lagna lord, and a short mantra practice at dawn. Consistency matters more than intensity.';
    }
    return {
      answer,
      provider: ANSWER_PROVIDER_IDS.localHeuristic,
      usage: {
        promptTokens: 0,
        completionTokens: Math.ceil(answer.length / 4),
        modelTier: 'local',
      },
    };
  },
};
