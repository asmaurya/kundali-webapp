import { scriptedReplyFor } from './scriptedReplies';

test('career questions get a 10th-house style reply', () => {
  expect(scriptedReplyFor('I need career advice')).toMatch(/10th-house|gradual progress/i);
});

test('unknown topics still get a calm fallback', () => {
  expect(scriptedReplyFor('Tell me something random')).toMatch(/noted this against your chart/i);
});
