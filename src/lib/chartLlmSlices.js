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
    const cascade = panel.vimshottari.cascade;
    // cascade is an object { maha, antar, pratyantar, sookshma, … } — not an array
    const cascadeSummary =
      cascade && typeof cascade === 'object' && !Array.isArray(cascade)
        ? {
            maha: cascade.maha || null,
            antar: cascade.antar || null,
            pratyantar: cascade.pratyantar || null,
            sookshma: cascade.sookshma || null,
          }
        : Array.isArray(cascade)
          ? cascade.slice(0, 24)
          : null;
    const periods = Array.isArray(panel.vimshottari.periods)
      ? panel.vimshottari.periods.slice(0, 12)
      : [];
    return {
      id: 'vimshottari',
      title: 'Vimshottari dasha',
      current: chart.dasha?.current || null,
      cascade: cascadeSummary,
      periods,
    };
  }
  if (chartId === 'yogini') {
    try {
      const panel = buildDashaPanel(chart);
      return panel?.yogini ? { id: 'yogini', title: 'Yogini dasha', ...panel.yogini } : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Build LLM chart context from the topic→chart matrix.
 * Returns { context, manifest } so callers can prove which charts were embedded.
 * Family charts only when `family` is selected and familyCharts were resolved.
 */
export function buildLlmChartContextWithManifest({
  querentChart,
  familyCharts = [],
  chartIds = null,
} = {}) {
  const blocks = [];
  const included = [];
  const skipped = [];
  const ids = Array.isArray(chartIds) && chartIds.length ? chartIds : ['lagna', 'family'];
  const includeFamily = ids.includes('family');

  if (ids.includes('lagna') || !chartIds) {
    const querent = chartJsonForPrompt(querentChart);
    if (querent) {
      blocks.push(`Querent kundali · lagna / D1 (JSON):\n${JSON.stringify(querent)}`);
      included.push('lagna');
    } else {
      blocks.push('Querent kundali (JSON): null');
      skipped.push({ id: 'lagna', reason: 'no_querent_chart' });
    }
  }

  ids
    .filter((id) => id !== 'lagna' && id !== 'family')
    .forEach((id) => {
      try {
        const slice = chartSliceForLlm(querentChart, id);
        if (!slice) {
          skipped.push({ id, reason: 'slice_null' });
          return;
        }
        blocks.push(`Querent chart · ${id} (JSON):\n${JSON.stringify(slice)}`);
        included.push(id);
      } catch (error) {
        skipped.push({ id, reason: String(error?.message || error).slice(0, 120) });
        blocks.push(
          `Querent chart · ${id}: unavailable (${String(error?.message || error).slice(0, 120)})`
        );
      }
    });

  if (includeFamily) {
    const familyList = familyCharts || [];
    if (!familyList.length) {
      skipped.push({ id: 'family', reason: 'no_@mention_match' });
    }
    familyList.forEach((entry) => {
      const json = chartJsonForPrompt(entry.chart);
      if (!json) {
        skipped.push({ id: 'family', reason: 'empty_family_chart' });
        return;
      }
      const label = entry.label || entry.relation || 'family';
      blocks.push(`Family kundali — ${label} (JSON):\n${JSON.stringify(json)}`);
      if (!included.includes('family')) included.push('family');
    });
  }

  return {
    context: blocks.join('\n\n'),
    manifest: { requested: ids, included, skipped },
  };
}

/** String-only helper for older call sites / tests. */
export function buildLlmChartContextFromMatrix(options = {}) {
  return buildLlmChartContextWithManifest(options).context;
}
