import {
  chartIdsForTopics,
  DEFAULT_CHART_TOPIC_MATRIX,
  inferTopicIdsFromText,
  resolveTopicsForTurn,
} from './chartTopicMatrix';

test('empty chips fall back to general row charts', () => {
  const ids = chartIdsForTopics(DEFAULT_CHART_TOPIC_MATRIX, []);
  expect(ids).toEqual(expect.arrayContaining(['lagna', 'vimshottari', 'family']));
  expect(ids).not.toContain('navamsa');
});

test('career chips pull career matrix charts', () => {
  const ids = chartIdsForTopics(DEFAULT_CHART_TOPIC_MATRIX, ['career']);
  expect(ids).toEqual(expect.arrayContaining(['lagna', 'vimshottari', 'shadbala', 'family']));
});

test('inferTopicIdsFromText detects career language', () => {
  expect(inferTopicIdsFromText('I feel stuck in my career')).toContain('career');
});

test('resolveTopicsForTurn prefers chips over inference', () => {
  expect(
    resolveTopicsForTurn({ chipTopicIds: ['health'], question: 'career promotion soon?' })
  ).toEqual(['health']);
  expect(resolveTopicsForTurn({ chipTopicIds: [], question: 'career promotion soon?' })).toEqual([
    'career',
  ]);
  expect(resolveTopicsForTurn({ chipTopicIds: [], question: 'hello' })).toEqual(['general']);
});
