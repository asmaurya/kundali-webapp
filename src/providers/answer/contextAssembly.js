/**
 * Stateless LLM needs the host to send context each turn.
 * We keep full chat history locally for the UI, and send a bounded bundle:
 *   rolling summary + last N turns + anonymised chart context.
 */

export const DEFAULT_HISTORY_WINDOW = 8;

/**
 * Compact rolling summary from recent user turns (deterministic, no extra LLM).
 * Server v1 can replace this with a richer summary_enc field.
 */
export function buildRollingSummary(messages = [], { maxTopics = 5 } = {}) {
  const userTurns = messages.filter((m) => m.role === 'user').map((m) => m.text);
  if (!userTurns.length) return '';
  const topics = [];
  const patterns = [
    [/career|job|work|promotion|business/i, 'career'],
    [/marriage|relationship|partner|love|compatibility/i, 'relationships'],
    [/health|sleep|stress|anxiety/i, 'health'],
    [/remedy|remedies|donation|mantra/i, 'remedies'],
    [/finance|money|wealth|income/i, 'finance'],
  ];
  userTurns.forEach((text) => {
    patterns.forEach(([re, label]) => {
      if (re.test(text) && !topics.includes(label)) topics.push(label);
    });
  });
  const recent = userTurns.slice(-3).map((t) => (t.length > 80 ? `${t.slice(0, 77)}…` : t));
  const parts = [];
  if (topics.length) parts.push(`Topics so far: ${topics.slice(0, maxTopics).join(', ')}.`);
  if (recent.length) parts.push(`Recent questions: ${recent.join(' | ')}`);
  return parts.join(' ');
}

export function takeRecentHistory(messages = [], limit = DEFAULT_HISTORY_WINDOW) {
  return messages.slice(-limit).map((m) => ({
    role: m.role === 'bot' ? 'assistant' : 'user',
    content: m.text,
  }));
}

/**
 * Assemble the outbound answer-provider payload (pre-anonymise chart/question separately).
 */
export function assembleAnswerContext({
  question,
  chartContext,
  messages = [],
  locale = 'en',
  historyWindow = DEFAULT_HISTORY_WINDOW,
}) {
  const summary = buildRollingSummary(messages);
  const history = takeRecentHistory(messages, historyWindow);
  return {
    question,
    locale,
    chartContext,
    summary,
    history,
  };
}
