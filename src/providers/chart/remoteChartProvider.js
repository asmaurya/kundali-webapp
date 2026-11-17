import { CHART_PROVIDER_IDS } from './types';

/**
 * Swiss Ephemeris / Vercel chart API (or Worker proxy).
 * - Explicit REACT_APP_CHART_API_URL → call that host's /v1/chart
 * - Empty baseUrl → same-origin Worker proxy POST /api/chart
 */
export function createRemoteChartProvider({
  baseUrl = process.env.REACT_APP_CHART_API_URL || '',
  fetchImpl = fetch,
} = {}) {
  const root = String(baseUrl || '').replace(/\/$/, '');
  const chartUrl = root ? `${root}/v1/chart` : '/api/chart';
  const healthUrl = root ? `${root}/health` : '/api/health';

  return {
    id: CHART_PROVIDER_IDS.remoteApi,
    async computeNatal(birth) {
      const response = await fetchImpl(chartUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ birth }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Chart API ${response.status}: ${detail.slice(0, 160)}`);
      }
      const chart = await response.json();
      if (!chart?.lagna || !Array.isArray(chart?.grahas)) {
        throw new Error('Chart API returned a non-canonical payload.');
      }
      return chart;
    },
    async health() {
      try {
        const response = await fetchImpl(healthUrl);
        if (!response.ok) return { ok: false, detail: `status_${response.status}` };
        const data = await response.json().catch(() => ({}));
        if (root) {
          return { ok: Boolean(data.ok), detail: data.provider || 'remote' };
        }
        if (data.chartRemote) {
          return { ok: true, detail: data.chartRemoteDetail || 'worker-proxy' };
        }
        return {
          ok: false,
          detail: data.chartApiConfigured
            ? data.chartRemoteDetail || 'down'
            : 'unconfigured',
        };
      } catch (error) {
        return { ok: false, detail: String(error.message || error) };
      }
    },
  };
}
