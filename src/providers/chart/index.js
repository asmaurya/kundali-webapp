import { localChartProvider } from './localChartProvider';
import { createRemoteChartProvider } from './remoteChartProvider';
import { CHART_PROVIDER_IDS } from './types';

let override = null;

/**
 * Resolve the active ChartProvider.
 * Prefer remote when REACT_APP_CHART_API_URL is set; else local astronomy-engine.
 * Tests / future DI can call setChartProvider().
 */
export function getChartProvider() {
  if (override) return override;
  if (process.env.REACT_APP_CHART_API_URL) {
    return createRemoteChartProvider();
  }
  return localChartProvider;
}

export function setChartProvider(provider) {
  override = provider;
}

export function resetChartProvider() {
  override = null;
}

export { CHART_PROVIDER_IDS, localChartProvider, createRemoteChartProvider };
