import { CHART_PROVIDER_IDS } from './types';

/**
 * Future Swiss Ephemeris / astrology-insights / Vedika chart API.
 * Enabled when REACT_APP_CHART_API_URL is set; otherwise unused.
 * Drop-in replacement — same canonical chart JSON out.
 */
export function createRemoteChartProvider({
  baseUrl = process.env.REACT_APP_CHART_API_URL || '',
  fetchImpl = fetch,
} = {}) {
  return {
    id: CHART_PROVIDER_IDS.remoteApi,
    async computeNatal(birth) {
      if (!baseUrl) {
        throw new Error('Remote chart API URL is not configured.');
      }
      const response = await fetchImpl(`${String(baseUrl).replace(/\/$/, '')}/v1/chart`, {
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
      if (!baseUrl) return { ok: false, detail: 'not configured' };
      try {
        const response = await fetchImpl(`${String(baseUrl).replace(/\/$/, '')}/health`);
        return { ok: response.ok, detail: 'remote' };
      } catch (error) {
        return { ok: false, detail: String(error.message || error) };
      }
    },
  };
}
