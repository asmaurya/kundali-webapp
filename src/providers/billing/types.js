/**
 * Billing / wallet contracts — stub now, wire Razorpay (or Stripe) later without UI churn.
 *
 * Timing (product):
 * - Phase B (now): UsageMeter records every chart + LLM call locally (and later to API).
 * - Phase C: Wallet + PaymentGateway deduct / top-up; LowBalanceBanner goes live on real balance.
 *
 * Implement charging only after AnswerProvider is real and you have a signed-in account model.
 * Building the gateway before metering is premature; metering before the gateway is cheap insurance.
 */

export const USAGE_KINDS = {
  chartCompute: 'chart_compute',
  llmFlash: 'llm_flash',
  llmPro: 'llm_pro',
  humanReport: 'human_report',
};

/** Rough unit costs for local metering previews (INR paise-equivalent units). */
export const DEFAULT_UNIT_COSTS = {
  [USAGE_KINDS.chartCompute]: 1,
  [USAGE_KINDS.llmFlash]: 5,
  [USAGE_KINDS.llmPro]: 25,
  [USAGE_KINDS.humanReport]: 500,
};

/**
 * @typedef {object} UsageEvent
 * @property {string} id
 * @property {string} kind
 * @property {number} units
 * @property {number} cost
 * @property {string} at
 * @property {object} [meta]
 *
 * @typedef {object} WalletSnapshot
 * @property {number} balance
 * @property {number} lowBalanceThreshold
 * @property {boolean} isLow
 * @property {UsageEvent[]} recent
 */
