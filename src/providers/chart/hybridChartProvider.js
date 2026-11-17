import { localChartProvider } from './localChartProvider';
import { createRemoteChartProvider } from './remoteChartProvider';
import { CHART_PROVIDER_IDS } from './types';

/**
 * Prefer Swiss Ephemeris via Worker/Vercel; fall back to local astronomy-engine.
 */
export function createHybridChartProvider({
  remote = createRemoteChartProvider(),
  local = localChartProvider,
} = {}) {
  return {
    id: CHART_PROVIDER_IDS.hybrid,
    async computeNatal(birth) {
      try {
        const health = remote.health ? await remote.health() : { ok: true };
        if (health.ok === false) {
          return local.computeNatal(birth);
        }
        return await remote.computeNatal(birth);
      } catch {
        return local.computeNatal(birth);
      }
    },
    async health() {
      const remoteHealth = remote.health ? await remote.health() : { ok: false };
      if (remoteHealth.ok) return { ok: true, detail: `remote:${remoteHealth.detail}` };
      const localHealth = local.health ? await local.health() : { ok: true };
      return { ok: localHealth.ok, detail: `local:${localHealth.detail || 'ok'}` };
    },
  };
}
