import { localChartProvider } from './localChartProvider';
import { createRemoteChartProvider } from './remoteChartProvider';
import { CHART_PROVIDER_IDS } from './types';

let override = null;

/**
 * Resolve the active ChartProvider.
 * Production always uses Swiss Ephemeris via Worker/Vercel (no astronomy-engine).
 * Tests may set REACT_APP_CHART_LOCAL_ONLY=1 for offline fixtures.
 */
export function getChartProvider() {
  if (override) return override;
  if (process.env.REACT_APP_CHART_LOCAL_ONLY === '1') {
    return localChartProvider;
  }
  if (process.env.REACT_APP_CHART_API_URL) {
    return createRemoteChartProvider({
      baseUrl: process.env.REACT_APP_CHART_API_URL,
    });
  }
  // Same-origin Worker proxy → Vercel Swiss Ephemeris.
  return createRemoteChartProvider();
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
};
