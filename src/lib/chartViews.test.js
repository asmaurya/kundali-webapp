import { generateChart } from './chartEngine';
import {
  buildDashaPanel,
  buildSecondaryViews,
  deriveChandraChart,
  deriveNavamsaChart,
  expandVimshottariCascade,
} from './chartViews';

const chart = generateChart({
  date: '1988-08-14',
  time: '12:45',
  place: 'Jaipur, Rajasthan, India',
});

test('builds secondary views including Chandra and Navamsa kundalis', () => {
  const views = buildSecondaryViews(chart);
  expect(views.map((v) => v.id)).toEqual(
    expect.arrayContaining(['chandra', 'navamsa', 'chalit', 'grah-sthiti', 'gochara', 'shadbala'])
  );
  const chandra = deriveChandraChart(chart);
  expect(chandra.houses).toHaveLength(12);
  expect(deriveNavamsaChart(chart).houses).toHaveLength(12);
});

test('expands vimshottari cascade with antar and sookshma', () => {
  const cascade = expandVimshottariCascade(chart.dasha);
  expect(cascade.maha.lordName).toBeTruthy();
  expect(cascade.antar.lordName).toBeTruthy();
  expect(cascade.pratyantar.lordName).toBeTruthy();
  expect(cascade.sookshma.lordName).toBeTruthy();
  const panel = buildDashaPanel(chart);
  expect(panel.yogini.current.lordName).toBeTruthy();
});
