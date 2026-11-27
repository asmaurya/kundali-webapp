/**
 * Settings for the soft "start new chat from summary" nudge.
 * Values ≤ 0 (convention: -1) disable that trigger.
 */

/** Suggested product default when re-enabling the message nudge. */
export const DEFAULT_CHAT_CONTINUE_MESSAGE_LIMIT = 5;

/** Suggested product default when re-enabling the token nudge (approx prompt+completion). */
export const DEFAULT_CHAT_CONTINUE_TOKEN_LIMIT = 8000;

/** Shipped default: both disabled until set in Settings. */
export const DISABLED_LIMIT = -1;

export function parseLimit(value, fallback = DISABLED_LIMIT) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

/** True when the numeric limit is active (positive). -1 / 0 / negative → off. */
export function isLimitEnabled(value) {
  return parseLimit(value) > 0;
}

export function readChatContinueLimits(settings = {}) {
  return {
    messageLimit: parseLimit(settings.chatContinueMessageLimit, DISABLED_LIMIT),
    tokenLimit: parseLimit(settings.chatContinueTokenLimit, DISABLED_LIMIT),
  };
}

/** Sum recorded LLM tokens on bot turns (usage or llmPacket.usage). */
export function totalChatTokens(messages = []) {
  return (messages || []).reduce((sum, message) => {
    if (!message || message.role !== 'bot') return sum;
    const usage = message.usage || message.llmPacket?.usage || null;
    if (!usage || typeof usage !== 'object') return sum;
    const total = Number(usage.totalTokens);
    if (Number.isFinite(total) && total > 0) return sum + total;
    const prompt = Number(usage.promptTokens) || 0;
    const completion = Number(usage.completionTokens) || 0;
    const thinking = Number(usage.thinkingTokens) || 0;
    return sum + prompt + completion + thinking;
  }, 0);
}

/**
 * Whether to show the continue-from-summary nudge.
 * Message and token limits are independent; either enabled threshold can trigger.
 */
export function shouldShowContinueNudge({
  userMessageCount = 0,
  tokenTotal = 0,
  messageLimit = DISABLED_LIMIT,
  tokenLimit = DISABLED_LIMIT,
} = {}) {
  const byMessages = isLimitEnabled(messageLimit) && userMessageCount >= messageLimit;
  const byTokens = isLimitEnabled(tokenLimit) && tokenTotal >= tokenLimit;
  return byMessages || byTokens;
}
