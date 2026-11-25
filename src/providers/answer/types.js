/**
 * AnswerProvider contract — swap Worker mock / OpenAI / Claude without touching UI.
 *
 * @typedef {object} AnswerRequest
 * @property {string} question          Anonymised question text
 * @property {string} chartContext      Anonymised chart summary for the model
 * @property {string} [summary]         Rolling conversation summary
 * @property {Array<{role:string,content:string}>} [history]
 * @property {string} [locale]
 * @property {string} [anonymousId]     Opaque session/request id (no PII)
 * @property {string} [modelTier]       e.g. 'flash' | 'pro'
 *
 * @typedef {object} AnswerResult
 * @property {string} answer
 * @property {string} [provider]
 * @property {object} [usage]           tokens / estimated cost for metering
 */

export const ANSWER_PROVIDER_IDS = {
  worker: 'worker-chat',
  localHeuristic: 'local-heuristic',
};
