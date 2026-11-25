/** Per-profile memory facts for the beta webapp (local until server memory API ships). */

const KEYS = {
  facts: 'kundali.beta.memoryFacts',
  shared: 'kundali.beta.memorySharedLog',
  declines: 'kundali.beta.memoryDeclines',
};

export const MEMORY_TYPES = ['decision', 'concern', 'remedy', 'event', 'preference'];

export const MEMORY_AREAS = [
  'career',
  'relationships',
  'finance',
  'remedies',
  'vitality',
  'general',
];

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function defaultExpiry(from = Date.now()) {
  return new Date(from + THREE_MONTHS_MS).toISOString();
}

function normalizeFact(fact) {
  const type = MEMORY_TYPES.includes(fact.type) ? fact.type : 'preference';
  const area = MEMORY_AREAS.includes(fact.area) ? fact.area : 'general';
  return {
    id: fact.id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    profileId: fact.profileId || 'self',
    type,
    area,
    summary: String(fact.summary || '').trim().slice(0, 280),
    status: fact.status === 'archived' ? 'archived' : 'active',
    createdAt: fact.createdAt || new Date().toISOString(),
    expiresAt: fact.expiresAt || defaultExpiry(),
    origin: fact.origin || 'user_saved',
    chartAnchor: fact.chartAnchor || null,
  };
}

export function loadMemoryFacts(profileId = 'self') {
  const all = read(KEYS.facts, []);
  if (!Array.isArray(all)) return [];
  return all
    .filter((item) => (item.profileId || 'self') === profileId)
    .map(normalizeFact)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function saveMemoryFacts(facts, profileId = 'self') {
  const others = read(KEYS.facts, []).filter((item) => (item.profileId || 'self') !== profileId);
  const next = [...facts.map(normalizeFact), ...others];
  write(KEYS.facts, next);
  return loadMemoryFacts(profileId);
}

export function countActiveMemory(profileId = 'self') {
  const now = Date.now();
  return loadMemoryFacts(profileId).filter(
    (fact) => fact.status === 'active' && new Date(fact.expiresAt).getTime() > now
  ).length;
}

export function upsertMemoryFact(fact, profileId = 'self') {
  const current = loadMemoryFacts(profileId);
  const nextFact = normalizeFact({ ...fact, profileId });
  const without = current.filter((item) => item.id !== nextFact.id);
  return saveMemoryFacts([nextFact, ...without], profileId);
}

export function deleteMemoryFact(id, profileId = 'self') {
  const next = loadMemoryFacts(profileId).filter((item) => item.id !== id);
  return saveMemoryFacts(next, profileId);
}

export function clearMemory(profileId = 'self') {
  return saveMemoryFacts([], profileId);
}

export function loadSharedLog(profileId = 'self') {
  const all = read(KEYS.shared, []);
  if (!Array.isArray(all)) return [];
  return all
    .filter((item) => (item.profileId || 'self') === profileId)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function addSharedLogEntry(entry, profileId = 'self') {
  const all = read(KEYS.shared, []);
  const next = [
    {
      id: entry.id || `s-${Date.now()}`,
      profileId,
      summary: String(entry.summary || '').slice(0, 280),
      astrologerName: entry.astrologerName || 'Astrologer',
      at: entry.at || new Date().toISOString(),
    },
    ...all,
  ].slice(0, 100);
  write(KEYS.shared, next);
  return loadSharedLog(profileId);
}

/** Seed a few remembered details once so the Memory screen is not empty after onboarding. */
export function ensureMemorySeeds(profileId = 'self') {
  const existing = loadMemoryFacts(profileId);
  if (existing.length > 0) return existing;
  const now = Date.now();
  const seeds = [
    {
      id: 'seed-career-decision',
      profileId,
      type: 'decision',
      area: 'career',
      summary: 'Considering a steady skill-building path rather than an abrupt job leap this dasha.',
      status: 'active',
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      expiresAt: defaultExpiry(now),
      origin: 'user_saved',
    },
    {
      id: 'seed-relationship-concern',
      profileId,
      type: 'concern',
      area: 'relationships',
      summary: 'Wants clearer communication before family introductions around marriage timing.',
      status: 'active',
      createdAt: new Date(now - 5 * 86400000).toISOString(),
      expiresAt: defaultExpiry(now - 5 * 86400000),
      origin: 'user_saved',
    },
    {
      id: 'seed-remedy',
      profileId,
      type: 'remedy',
      area: 'remedies',
      summary: 'Tracking a Saturday donation habit suggested for Saturn transit support.',
      status: 'active',
      createdAt: new Date(now - 10 * 86400000).toISOString(),
      expiresAt: defaultExpiry(now - 10 * 86400000),
      origin: 'astrologer',
    },
  ];
  saveMemoryFacts(seeds, profileId);
  const shared = loadSharedLog(profileId);
  if (shared.length === 0) {
    addSharedLogEntry(
      {
        id: 'seed-shared-1',
        summary: 'Shared career transition notes with Acharya Rajiv Sharma',
        astrologerName: 'Acharya Rajiv Sharma',
        at: new Date(now - 8 * 86400000).toISOString(),
      },
      profileId
    );
  }
  return loadMemoryFacts(profileId);
}

export function groupFactsByArea(facts) {
  const groups = {};
  MEMORY_AREAS.forEach((area) => {
    groups[area] = [];
  });
  facts.forEach((fact) => {
    const key = MEMORY_AREAS.includes(fact.area) ? fact.area : 'general';
    groups[key].push(fact);
  });
  return groups;
}

export function isExpired(fact, now = Date.now()) {
  return new Date(fact.expiresAt).getTime() <= now;
}
