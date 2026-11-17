/** Reports, remedies, and astrologer ratings — local library for beta. */

const KEYS = {
  reports: 'kundali.beta.reports',
  remedies: 'kundali.beta.remedies',
  ratings: 'kundali.beta.astrologerRatings',
  lastUsed: 'kundali.beta.astrologerLastUsed',
};

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

export function loadReports() {
  return read(KEYS.reports, []);
}

export function saveReports(reports) {
  write(KEYS.reports, reports);
  return reports;
}

export function addReport(report) {
  const next = [
    {
      id: report.id || `r-${Date.now()}`,
      title: report.title,
      memberId: report.memberId || 'self',
      memberName: report.memberName || 'You',
      kind: report.kind || 'chat',
      createdAt: report.createdAt || new Date().toISOString(),
      summary: report.summary || '',
      source: report.source || 'chat',
      generatedBy: report.generatedBy || 'Astro Chat',
      generatedByType: report.generatedByType || 'ai',
    },
    ...loadReports(),
  ].slice(0, 80);
  return saveReports(next);
}

export function loadRemedies() {
  return read(KEYS.remedies, []);
}

export function saveRemedies(remedies) {
  write(KEYS.remedies, remedies);
  return remedies;
}

export function addRemedy(remedy) {
  const next = [
    {
      id: remedy.id || `rm-${Date.now()}`,
      text: remedy.text,
      source: remedy.source || 'ai', // ai | human
      astrologerName: remedy.astrologerName || 'Astro Chat',
      memberId: remedy.memberId || 'self',
      memberName: remedy.memberName || 'You',
      createdAt: remedy.createdAt || new Date().toISOString(),
    },
    ...loadRemedies(),
  ].slice(0, 80);
  return saveRemedies(next);
}

export function loadAstrologerRatings() {
  return read(KEYS.ratings, {});
}

export function setAstrologerRating(astrologerId, rating) {
  const all = loadAstrologerRatings();
  all[astrologerId] = {
    rating: Math.max(1, Math.min(5, Number(rating) || 0)),
    updatedAt: new Date().toISOString(),
  };
  write(KEYS.ratings, all);
  return all[astrologerId];
}

export function loadAstrologerLastUsed() {
  return read(KEYS.lastUsed, {});
}

export function markAstrologerUsed(astrologerId) {
  const all = loadAstrologerLastUsed();
  all[astrologerId] = new Date().toISOString();
  write(KEYS.lastUsed, all);
  return all[astrologerId];
}

/** Seed a few library items once so empty states are not barren after onboarding. */
export function ensureLibrarySeeds({ memberName = 'You' } = {}) {
  const existing = loadReports();
  const chatOnly = existing.filter(
    (r) => r.kind === 'chat' || r.source === 'chat' || r.source === 'ai' || r.source === 'human'
  );
  if (existing.length === 0 || (existing.length > 0 && chatOnly.length === 0 && existing.every((r) => r.kind === 'kundali' || r.source === 'chart' || r.source === 'kundali' || r.source === 'family'))) {
    saveReports([
      {
        id: 'seed-career',
        title: 'Career transition guidance',
        memberId: 'self',
        memberName,
        kind: 'chat',
        createdAt: new Date().toISOString(),
        summary: 'Steady skill-building favoured over abrupt leaps in the current dasha.',
        source: 'ai',
        generatedBy: 'Astro Chat',
        generatedByType: 'ai',
      },
      {
        id: 'seed-marriage',
        title: 'Marriage timing note',
        memberId: 'self',
        memberName,
        kind: 'chat',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        summary: 'Seventh-house themes favour clear communication over haste.',
        source: 'human',
        generatedBy: 'Acharya Meera Verma',
        generatedByType: 'live',
      },
      ...chatOnly,
    ]);
  }
  if (loadRemedies().length === 0) {
    saveRemedies([
      {
        id: 'seed-remedy',
        text: 'Keep Saturday evenings quieter; a simple lamp with sesame oil at home supports Saturn themes without overclaiming outcomes.',
        source: 'ai',
        astrologerName: 'Astro Chat',
        memberId: 'self',
        memberName,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

export function clearLibrary() {
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
}

/** Detect remedy-like bot replies and archive them. */
export function maybeCaptureRemedyFromReply({ text, astrologer, memberName }) {
  if (!text) return null;
  if (!/remedy|remedies|donation|mantra|habit|saturday|lamp|upay/i.test(text)) {
    return null;
  }
  return addRemedy({
    text: text.length > 280 ? `${text.slice(0, 277)}…` : text,
    source: astrologer?.type === 'live' ? 'human' : 'ai',
    astrologerName: astrologer?.name || 'Astro Chat',
    memberName: memberName || 'You',
  });
}

export function maybeCaptureReportFromChat({ question, reply, memberName, astrologer }) {
  if (!question || !reply) return null;
  if (!/report|career|marriage|health|finance|compatibility|timing/i.test(question)) {
    return null;
  }
  const isHuman = astrologer?.type === 'live';
  return addReport({
    title: question.length > 48 ? `${question.slice(0, 45)}…` : question,
    memberName: memberName || 'You',
    kind: 'chat',
    summary: reply.length > 160 ? `${reply.slice(0, 157)}…` : reply,
    source: isHuman ? 'human' : 'ai',
    generatedBy: astrologer?.name || 'Astro Chat',
    generatedByType: isHuman ? 'live' : 'ai',
  });
}
