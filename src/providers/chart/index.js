import { createHybridChartProvider } from './hybridChartProvider';
import { localChartProvider } from './localChartProvider';
import { createRemoteChartProvider } from './remoteChartProvider';
import { CHART_PROVIDER_IDS } from './types';

let override = null;

/**
 * Resolve the active ChartProvider.
 * - Explicit REACT_APP_CHART_API_URL → remote only
 * - Production / Worker-hosted SPA → hybrid (remote via /api/chart, local fallback)
 * - Tests can setChartProvider()
 */
export function getChartProvider() {
  if (override) return override;
  if (process.env.REACT_APP_CHART_API_URL) {
    return createRemoteChartProvider();
  }
  if (process.env.REACT_APP_CHART_LOCAL_ONLY === '1') {
    return localChartProvider;
  }
  return createHybridChartProvider();
}

export function setChartProvider(provider) {
  override = provider;
}

export function resetChartProvider() {
  override = null;
}

export {
  CHART_PROVIDER_IDS,
  localChartProvider,
  createRemoteChartProvider,
  createHybridChartProvider,
};
