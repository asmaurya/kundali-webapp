import { assembleAnswerContext } from './contextAssembly';
import { anonymizeChartContext, anonymizeText, makeAnonymousRequestId } from './anonymize';
import { localAnswerProvider } from './localAnswerProvider';
import { createWorkerAnswerProvider } from './workerAnswerProvider';
import { ANSWER_PROVIDER_IDS } from './types';

let override = null;

export function getAnswerProvider() {
  if (override) return override;
  // Prefer Worker (same origin in prod; CRA proxy / absolute API URL in dev).
  return createWorkerAnswerProvider({
    baseUrl: process.env.REACT_APP_API_BASE || '',
  });
}

export function setAnswerProvider(provider) {
  override = provider;
}

export function resetAnswerProvider() {
  override = null;
}

/**
 * High-level facade used by the app:
 * anonymise → assemble context → call provider → return answer + usage.
 *
 * Swapping OpenAI/Claude later = new AnswerProvider only; this path stays.
 */
export async function askWithPrivacy({
  question,
  chartContext,
  chartVars = null,
  messages = [],
  locale = 'en',
  people = {},
  modelTier = 'flash',
  provider = getAnswerProvider(),
  fallback = localAnswerProvider,
}) {
  const safeQuestion = anonymizeText(question, people);
  const safeChart = anonymizeChartContext(anonymizeText(chartContext, people));
  const safeMessages = messages.map((m) => ({
    ...m,
    text: anonymizeText(m.text, people),
  }));

  const assembled = assembleAnswerContext({
    question: safeQuestion,
    chartContext: safeChart,
    messages: safeMessages,
    locale,
  });

  const request = {
    ...assembled,
    chartVars: chartVars && typeof chartVars === 'object' ? chartVars : undefined,
    anonymousId: makeAnonymousRequestId(),
    modelTier,
  };

  try {
    return await provider.ask(request);
  } catch (error) {
    if (!fallback) throw error;
    return fallback.ask(request);
  }
}

export {
  ANSWER_PROVIDER_IDS,
  assembleAnswerContext,
  anonymizeText,
  anonymizeChartContext,
  makeAnonymousRequestId,
  localAnswerProvider,
  createWorkerAnswerProvider,
};
