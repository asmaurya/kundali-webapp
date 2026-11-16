import { generateChart, lahiriAyanamsa, parseBirthDateTime, resolvePlace } from './chartEngine';

test('resolves known Indian cities', () => {
  expect(resolvePlace('Jaipur, Rajasthan, India').lat).toBeCloseTo(26.91, 1);
  expect(resolvePlace('Bengaluru').tzOffsetHours).toBe(5.5);
});

test('lahiri ayanamsa is in a sensible range for modern dates', () => {
  const aya = lahiriAyanamsa(new Date('1988-08-14T07:15:00Z'));
  expect(aya).toBeGreaterThan(22);
  expect(aya).toBeLessThan(26);
});

test('parseBirthDateTime accepts ISO and 12-hour clock strings', () => {
  expect(parseBirthDateTime('1988-08-14', '12:45')).toMatchObject({
    year: 1988,
    month: 8,
    day: 14,
    hour: 12,
    minute: 45,
  });
  expect(parseBirthDateTime('14/08/1988', '12:45pm')).toMatchObject({
    hour: 12,
    minute: 45,
    day: 14,
    month: 8,
  });
});

test('generateChart rejects incomplete birth details', () => {
  expect(() => generateChart({ date: '', time: '12:45', place: 'Jaipur' })).toThrow(/required/i);
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
