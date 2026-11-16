import { generateChart, lahiriAyanamsa, resolvePlace } from './chartEngine';

test('resolves known Indian cities', () => {
  expect(resolvePlace('Jaipur, Rajasthan, India').lat).toBeCloseTo(26.91, 1);
  expect(resolvePlace('Bengaluru').tzOffsetHours).toBe(5.5);
});

test('lahiri ayanamsa is in a sensible range for modern dates', () => {
  const aya = lahiriAyanamsa(new Date('1988-08-14T07:15:00Z'));
  expect(aya).toBeGreaterThan(22);
  expect(aya).toBeLessThan(26);
});

test('generateChart returns lagna, nine grahas and dasha', () => {
  const chart = generateChart({
    date: '1988-08-14',
    time: '12:45',
    place: 'Jaipur, Rajasthan, India',
  });
  expect(chart.lagna.rashiName).toBeTruthy();
  expect(chart.grahas).toHaveLength(9);
  expect(chart.houses).toHaveLength(12);
  expect(chart.summary.moonSign).toBeTruthy();
  expect(chart.dasha.current.lordName).toBeTruthy();
  expect(chart.provenance.provider).toMatch(/astronomy-engine/);
});
