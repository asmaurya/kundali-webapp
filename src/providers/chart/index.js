import { localChartProvider } from './localChartProvider';
import { createRemoteChartProvider } from './remoteChartProvider';
import { createHybridChartProvider } from './hybridChartProvider';
import { CHART_PROVIDER_IDS } from './types';

let override = null;

/**
 * Resolve the active ChartProvider.
 * Prefer Swiss Ephemeris (Worker → Vercel); fall back to local astronomy-engine
 * so Safari / flaky networks still get a chart.
 * Tests may set REACT_APP_CHART_LOCAL_ONLY=1 for offline fixtures.
 */
export function getChartProvider() {
  if (override) return override;
  if (process.env.REACT_APP_CHART_LOCAL_ONLY === '1') {
    return localChartProvider;
  }
  if (process.env.REACT_APP_CHART_API_URL) {
    return createHybridChartProvider({
      remote: createRemoteChartProvider({
        baseUrl: process.env.REACT_APP_CHART_API_URL,
      }),
    });
  }
  // Same-origin Worker proxy → Vercel Swiss Ephemeris, with local fallback.
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
