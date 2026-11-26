import {
  buildLlmChartContext,
  chartContextForPrompt,
  chartJsonForPrompt,
  generateChart,
  lahiriAyanamsa,
  parseBirthDateTime,
  resolvePlace,
} from './chartEngine';

test('resolves known Indian cities', () => {
  expect(resolvePlace('Jaipur, Rajasthan, India').lat).toBeCloseTo(26.91, 1);
  expect(resolvePlace('Bengaluru').tzOffsetHours).toBe(5.5);
});

test('prefers explicit Places coordinates over city lookup', () => {
  const loc = resolvePlace('Custom Hamlet', {
    lat: 18.52,
    lon: 73.85,
    tzOffsetHours: 5.5,
    placeId: 'google:abc',
    source: 'google',
  });
  expect(loc.lat).toBeCloseTo(18.52, 2);
  expect(loc.lon).toBeCloseTo(73.85, 2);
  expect(loc.approx).toBe(false);
  expect(loc.source).toBe('google');
});

test('generateChart uses provided lat/lon from Places', () => {
  const chart = generateChart({
    date: '1988-08-14',
    time: '12:45',
    place: 'Pune, Maharashtra, India',
    lat: 18.5204,
    lon: 73.8567,
    tzOffsetHours: 5.5,
    placeId: 'test-place',
    source: 'google',
  });
  expect(chart.birth.lat).toBeCloseTo(18.52, 1);
  expect(chart.birth.place_approx).toBe(false);
  expect(chart.birth.placeId).toBe('test-place');
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

test('chartContextForPrompt includes birth stamp for Jyotish', () => {
  const chart = generateChart({
    date: '1988-08-14',
    time: '12:45',
    place: 'Jaipur, Rajasthan, India',
    lat: 26.9124,
    lon: 75.7873,
    tzOffsetHours: 5.5,
  });
  const ctx = chartContextForPrompt(chart);
  expect(ctx).toMatch(/1988-08-14/);
  expect(ctx).toMatch(/12:45/);
  expect(ctx).toMatch(/Jaipur/);
  expect(ctx).toMatch(/Lagna:/);
});

test('buildLlmChartContext always includes querent JSON and optional family', () => {
  const querent = generateChart({
    date: '1988-08-14',
    time: '12:45',
    place: 'Jaipur, Rajasthan, India',
    lat: 26.9124,
    lon: 75.7873,
    tzOffsetHours: 5.5,
  });
  const father = generateChart({
    date: '1962-03-12',
    time: '06:15',
    place: 'Jaipur, Rajasthan, India',
    lat: 26.9124,
    lon: 75.7873,
    tzOffsetHours: 5.5,
  });
  const json = chartJsonForPrompt(querent);
  expect(json.birth.date).toBe('1988-08-14');
  expect(json.grahas.length).toBe(9);

  const alone = buildLlmChartContext({ querentChart: querent });
  expect(alone).toMatch(/Querent kundali/);
  expect(alone).not.toMatch(/Family kundali/);

  const withFamily = buildLlmChartContext({
    querentChart: querent,
    familyCharts: [{ label: 'Father', chart: father }],
  });
  expect(withFamily).toMatch(/Querent kundali/);
  expect(withFamily).toMatch(/Family kundali — Father \(JSON\)/);

  const matrixOnly = buildLlmChartContext({
    querentChart: querent,
    familyCharts: [{ label: 'Father', chart: father }],
    chartIds: ['lagna', 'navamsa'],
  });
  expect(matrixOnly).toMatch(/navamsa/);
  expect(matrixOnly).not.toMatch(/Family kundali/);
});

test('buildLlmChartContext with vimshottari matrix ids', () => {
  const querent = generateChart({
    date: '1988-08-14',
    time: '12:45',
    place: 'Jaipur, Rajasthan, India',
    lat: 26.9124,
    lon: 75.7873,
    tzOffsetHours: 5.5,
  });
  const ctx = buildLlmChartContext({
    querentChart: querent,
    chartIds: ['lagna', 'vimshottari', 'family'],
  });
  expect(ctx).toMatch(/lagna|Querent kundali/i);
  expect(ctx).toMatch(/vimshottari/i);
});
