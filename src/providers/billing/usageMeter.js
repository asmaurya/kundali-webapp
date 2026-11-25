import { DEFAULT_UNIT_COSTS, USAGE_KINDS } from './types';

const STORAGE_KEY = 'kundali.usage.v1';
const WALLET_KEY = 'kundali.wallet.v1';

const DEFAULT_WALLET = {
  balance: 100,
  lowBalanceThreshold: 20,
  currency: 'INR_UNITS',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

function createId() {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Local UsageMeter + Wallet facade.
 * Later: swap persistence to Workers KV / Postgres; keep the same methods.
 */
export function createUsageMeter({
  costs = DEFAULT_UNIT_COSTS,
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
} = {}) {
  const loadEvents = () => {
    if (!storage) return [];
    return readJson(STORAGE_KEY, []);
  };
  const saveEvents = (events) => {
    if (!storage) return;
    writeJson(STORAGE_KEY, events.slice(-200));
  };
  const loadWallet = () => {
    if (!storage) return { ...DEFAULT_WALLET };
    return { ...DEFAULT_WALLET, ...readJson(WALLET_KEY, {}) };
  };
  const saveWallet = (wallet) => {
    if (!storage) return;
    writeJson(WALLET_KEY, wallet);
  };

  return {
    record(kind, { units = 1, meta = {} } = {}) {
      const unitCost = costs[kind] ?? 1;
      const cost = unitCost * units;
      const event = {
        id: createId(),
        kind,
        units,
        cost,
        at: new Date().toISOString(),
        meta,
      };
      const events = loadEvents();
      events.push(event);
      saveEvents(events);

      const wallet = loadWallet();
      wallet.balance = Math.max(0, Number(wallet.balance) - cost);
      saveWallet(wallet);
      return { event, wallet: this.snapshot() };
    },

    recordChart(meta = {}) {
      return this.record(USAGE_KINDS.chartCompute, { meta });
    },

    recordLlm(usage = {}, meta = {}) {
      const tier = usage.modelTier === 'pro' ? USAGE_KINDS.llmPro : USAGE_KINDS.llmFlash;
      const tokens = Number(usage.promptTokens || 0) + Number(usage.completionTokens || 0);
      const units = Math.max(1, Math.ceil(tokens / 500));
      return this.record(tier, { units, meta: { ...meta, tokens } });
    },

    snapshot() {
      const wallet = loadWallet();
      const recent = loadEvents().slice(-20).reverse();
      return {
        balance: wallet.balance,
        lowBalanceThreshold: wallet.lowBalanceThreshold,
        currency: wallet.currency,
        isLow: wallet.balance <= wallet.lowBalanceThreshold,
        recent,
      };
    },

    /** Dev / preview top-up until PaymentGateway is live. */
    credit(amount) {
      const wallet = loadWallet();
      wallet.balance = Number(wallet.balance) + Number(amount || 0);
      saveWallet(wallet);
      return this.snapshot();
    },

    resetDemo() {
      if (!storage) return;
      storage.removeItem(STORAGE_KEY);
      writeJson(WALLET_KEY, { ...DEFAULT_WALLET });
    },
  };
}

let singleton = null;

export function getUsageMeter() {
  if (!singleton) singleton = createUsageMeter();
  return singleton;
}

export function setUsageMeter(meter) {
  singleton = meter;
}
