/**
 * Build LLM chart-context slices from the topic→chart matrix.
 * Kept separate from chartEngine to avoid circular imports with chartViews.
 */
import { chartJsonForPrompt } from './chartEngine';
import {
  buildDashaPanel,
  deriveChalitChart,
  deriveChandraChart,
  deriveGochara,
  deriveGrahSthiti,
  deriveNavamsaChart,
  deriveShadbala,
} from './chartViews';

export function chartSliceForLlm(chart, chartId) {
  if (!chart || !chartId) return null;
  if (chartId === 'lagna') return chartJsonForPrompt(chart);

  if (chartId === 'chandra') {
    const v = deriveChandraChart(chart);
    return v
      ? {
          id: v.id,
          title: v.title,
          lagnaRashi: v.lagnaRashi,
          houses: v.houses,
          grahas: (v.grahas || []).map((g) => ({
            name: g.name,
            rashi: g.rashiName || g.rashi,
            degree: g.degree,
            house: g.house,
          })),
        }
      : null;
  }
  if (chartId === 'navamsa') {
    const v = deriveNavamsaChart(chart);
    return v
      ? {
          id: v.id,
          title: v.title,
          lagnaRashi: v.lagnaRashi,
          houses: v.houses,
          grahas: (v.grahas || []).map((g) => ({
            name: g.name,
            rashi: g.rashiName || g.rashi,
            degree: g.degree,
            house: g.house,
          })),
        }
      : null;
  }
  if (chartId === 'chalit') {
    const v = deriveChalitChart(chart);
    return v
      ? {
          id: v.id,
          title: v.title,
          houses: v.houses,
          grahas: (v.grahas || []).map((g) => ({
            name: g.name,
            rashi: g.rashiName || g.rashi,
            degree: g.degree,
            house: g.house,
          })),
        }
      : null;
  }
  if (chartId === 'grah-sthiti') {
    const v = deriveGrahSthiti(chart);
    return v ? { id: v.id, title: v.title, rows: v.rows } : null;
  }
  if (chartId === 'gochara') {
    const v = deriveGochara(chart);
    return v
      ? {
          id: v.id,
          title: v.title,
          natalByPlanet: v.natalByPlanet,
          note: 'Live Swiss gochara not embedded; natal rashi map included.',
        }
      : null;
  }
  if (chartId === 'shadbala') {
    const v = deriveShadbala(chart);
    return v ? { id: v.id, title: v.title, rows: v.rows } : null;
  }
  if (chartId === 'vimshottari') {
    const panel = buildDashaPanel(chart);
    if (!panel?.vimshottari) return null;
    return {
      id: 'vimshottari',
      title: 'Vimshottari dasha',
      current: chart.dasha?.current || null,
      cascade: (panel.vimshottari.cascade || []).slice(0, 24),
      periods: (panel.vimshottari.periods || []).slice(0, 12),
    };
  }
  if (chartId === 'yogini') {
    const panel = buildDashaPanel(chart);
    return panel?.yogini ? { id: 'yogini', title: 'Yogini dasha', ...panel.yogini } : null;
  }
  return null;
}

/**
 * Build LLM chart context from the topic→chart matrix.
 * Family charts only when `family` is selected and familyCharts were resolved.
 */
export function buildLlmChartContextFromMatrix({
  querentChart,
  familyCharts = [],
  chartIds = null,
} = {}) {
  const blocks = [];
  const ids = Array.isArray(chartIds) && chartIds.length ? chartIds : ['lagna', 'family'];
  const includeFamily = ids.includes('family');

  if (ids.includes('lagna') || !chartIds) {
    const querent = chartJsonForPrompt(querentChart);
    if (querent) {
      blocks.push(`Querent kundali · lagna / D1 (JSON):\n${JSON.stringify(querent)}`);
    } else {
      blocks.push('Querent kundali (JSON): null');
    }
  }

  ids
    .filter((id) => id !== 'lagna' && id !== 'family')
    .forEach((id) => {
      const slice = chartSliceForLlm(querentChart, id);
      if (!slice) return;
      blocks.push(`Querent chart · ${id} (JSON):\n${JSON.stringify(slice)}`);
    });

  if (includeFamily) {
    (familyCharts || []).forEach((entry) => {
      const json = chartJsonForPrompt(entry.chart);
      if (!json) return;
      const label = entry.label || entry.relation || 'family';
      blocks.push(`Family kundali — ${label} (JSON):\n${JSON.stringify(json)}`);
    });
  }

  return blocks.join('\n\n');
}
