import { assembleAnswerContext, buildRollingSummary, takeRecentHistory } from './contextAssembly';

test('buildRollingSummary extracts topics from user turns', () => {
  const summary = buildRollingSummary([
    { role: 'user', text: 'Tell me about my career path' },
    { role: 'bot', text: '…' },
    { role: 'user', text: 'What marriage timing looks likely?' },
  ]);
  expect(summary).toMatch(/career/i);
  expect(summary).toMatch(/relationships/i);
});

test('takeRecentHistory windows and maps bot→assistant', () => {
  const history = takeRecentHistory(
    [
      { role: 'bot', text: 'hi' },
      { role: 'user', text: 'q1' },
      { role: 'bot', text: 'a1' },
      { role: 'user', text: 'q2' },
    ],
    3
  );
  expect(history).toHaveLength(3);
  expect(history[0]).toEqual({ role: 'user', content: 'q1' });
  expect(history[1]).toEqual({ role: 'assistant', content: 'a1' });
  expect(history[2]).toEqual({ role: 'user', content: 'q2' });
});

test('assembleAnswerContext bundles question, summary, history', () => {
  const bundle = assembleAnswerContext({
    question: 'Career advice?',
    chartContext: 'Lagna: Mesha',
    messages: [
      { role: 'user', text: 'Career advice?' },
      { role: 'bot', text: 'Steady progress.' },
    ],
    locale: 'en',
  });
  expect(bundle.question).toBe('Career advice?');
  expect(bundle.chartContext).toMatch(/Mesha/);
  expect(bundle.history.length).toBeGreaterThan(0);
  expect(bundle.summary).toMatch(/career/i);
});
