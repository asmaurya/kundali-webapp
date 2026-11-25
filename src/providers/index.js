/**
 * Provider façade — single import surface for the app.
 * Chart / Answer / Billing adapters can change without touching screens.
 */
export {
  getChartProvider,
  setChartProvider,
  resetChartProvider,
  CHART_PROVIDER_IDS,
} from './chart';
export {
  getAnswerProvider,
  setAnswerProvider,
  resetAnswerProvider,
  askWithPrivacy,
  anonymizeText,
  anonymizeChartContext,
  assembleAnswerContext,
  ANSWER_PROVIDER_IDS,
} from './answer';
export {
  getUsageMeter,
  setUsageMeter,
  createUsageMeter,
  getPaymentGateway,
  setPaymentGateway,
  createNoopPaymentGateway,
  createRazorpayPaymentGateway,
  USAGE_KINDS,
} from './billing';
