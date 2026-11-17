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

test('anonymizeChartContext redacts birth place lines', () => {
  const out = anonymizeChartContext('Lagna: Mesha\nBirth place: Jaipur, Rajasthan, India\nMoon: Karka');
  expect(out).toMatch(/Birth place: \[redacted\]/i);
  expect(out).not.toMatch(/Jaipur/);
  expect(out).toMatch(/Lagna: Mesha/);
});
