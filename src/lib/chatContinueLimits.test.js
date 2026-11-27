import {
  DISABLED_LIMIT,
  isLimitEnabled,
  parseLimit,
  readChatContinueLimits,
  shouldShowContinueNudge,
  totalChatTokens,
} from './chatContinueLimits';

test('parseLimit truncates and falls back', () => {
  expect(parseLimit(5.9)).toBe(5);
  expect(parseLimit('12')).toBe(12);
  expect(parseLimit('nope', DISABLED_LIMIT)).toBe(DISABLED_LIMIT);
  expect(parseLimit(-1)).toBe(-1);
});

test('isLimitEnabled treats -1 and 0 as off', () => {
  expect(isLimitEnabled(-1)).toBe(false);
  expect(isLimitEnabled(0)).toBe(false);
  expect(isLimitEnabled(5)).toBe(true);
});

test('shouldShowContinueNudge respects disabled defaults', () => {
  expect(
    shouldShowContinueNudge({
      userMessageCount: 20,
      tokenTotal: 50000,
      messageLimit: -1,
      tokenLimit: -1,
    })
  ).toBe(false);
});

test('shouldShowContinueNudge triggers on message or token threshold', () => {
  expect(
    shouldShowContinueNudge({
      userMessageCount: 5,
      tokenTotal: 0,
      messageLimit: 5,
      tokenLimit: -1,
    })
  ).toBe(true);
  expect(
    shouldShowContinueNudge({
      userMessageCount: 1,
      tokenTotal: 9000,
      messageLimit: -1,
      tokenLimit: 8000,
    })
  ).toBe(true);
  expect(
    shouldShowContinueNudge({
      userMessageCount: 4,
      tokenTotal: 100,
      messageLimit: 5,
      tokenLimit: 8000,
    })
  ).toBe(false);
});

test('totalChatTokens sums bot usage', () => {
  const total = totalChatTokens([
    { role: 'user', text: 'hi' },
    { role: 'bot', usage: { promptTokens: 100, completionTokens: 40 } },
    { role: 'bot', llmPacket: { usage: { totalTokens: 200 } } },
  ]);
  expect(total).toBe(340);
});

test('readChatContinueLimits defaults to disabled', () => {
  expect(readChatContinueLimits({})).toEqual({ messageLimit: -1, tokenLimit: -1 });
});
