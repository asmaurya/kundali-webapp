import { anonymizeChartContext, anonymizeText } from './anonymize';

test('anonymizeText strips emails and phones', () => {
  const out = anonymizeText('Write to me at abhi@example.com or +91 98765 43210 please');
  expect(out).toContain('[email]');
  expect(out).toContain('[phone]');
  expect(out).not.toMatch(/abhi@example/);
  expect(out).not.toMatch(/98765/);
});

test('anonymizeText maps self and family names to relationship labels', () => {
  const out = anonymizeText('Is @Ramesh Sharma compatible with Abhishek for career?', {
    selfName: 'Abhishek',
    family: [{ name: 'Ramesh Sharma', relation: 'Father' }],
  });
  expect(out.toLowerCase()).toContain("the querent's father");
  expect(out.toLowerCase()).toContain('the querent');
  expect(out).not.toMatch(/Ramesh/i);
  expect(out).not.toMatch(/Abhishek/i);
});

test('anonymizeChartContext keeps birth place, time and chart for Jyotish', () => {
  const raw =
    'Birth: 1990-05-15 10:30 at Jaipur, Rajasthan, India (lat 26.9, lon 75.8)\nLagna: Mesha\nMoon: Karka';
  const out = anonymizeChartContext(raw);
  expect(out).toContain('Jaipur');
  expect(out).toContain('1990-05-15');
  expect(out).toContain('10:30');
  expect(out).toContain('lat 26.9');
  expect(out).toMatch(/Lagna: Mesha/);
});

test('names in chart labels are scrubbed but birth stamp remains', () => {
  const raw =
    'Family chart — Ramesh Sharma (Father):\nBirth: 1962-03-12 06:15 at Jaipur\nLagna: Simha';
  const out = anonymizeText(raw, {
    family: [{ name: 'Ramesh Sharma', relation: 'Father' }],
  });
  expect(out).not.toMatch(/Ramesh/i);
  expect(out.toLowerCase()).toContain("the querent's father");
  expect(out).toContain('Jaipur');
  expect(out).toContain('1962-03-12');
});
