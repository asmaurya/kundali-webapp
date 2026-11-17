import { generateChart } from '../../lib/chartEngine';
import { CHART_PROVIDER_IDS } from './types';

/** On-device Lahiri / whole-sign engine (current beta default). */
export const localChartProvider = {
  id: CHART_PROVIDER_IDS.localAstronomy,
  computeNatal(birth) {
    return generateChart(birth);
  },
  async health() {
    return { ok: true, detail: 'astronomy-engine+lahiri' };
  },
};
