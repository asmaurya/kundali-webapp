import { createUsageMeter } from './usageMeter';
import { USAGE_KINDS } from './types';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('usage meter deducts chart and llm costs and flags low balance', () => {
  const meter = createUsageMeter({
    storage: memoryStorage(),
    costs: {
      [USAGE_KINDS.chartCompute]: 10,
      [USAGE_KINDS.llmFlash]: 40,
      [USAGE_KINDS.llmPro]: 80,
      [USAGE_KINDS.humanReport]: 500,
    },
  });
  meter.resetDemo();
  meter.recordChart();
  meter.recordLlm({ promptTokens: 100, completionTokens: 100, modelTier: 'flash' });
  const snap = meter.snapshot();
  expect(snap.balance).toBeLessThan(100);
  expect(snap.recent.length).toBeGreaterThanOrEqual(2);
  // Force low
  while (!meter.snapshot().isLow) {
    meter.recordLlm({ promptTokens: 500, completionTokens: 500, modelTier: 'flash' });
  }
  expect(meter.snapshot().isLow).toBe(true);
  const credited = meter.credit(50);
  expect(credited.balance).toBeGreaterThan(20);
});
