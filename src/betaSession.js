/** Invite-only beta session helpers (localStorage). No server auth yet. */

export const BETA_INVITE_CODE =
  process.env.REACT_APP_BETA_INVITE_CODE || 'KUNDALI-BETA';

export const STORAGE_KEYS = {
  session: 'kundali.beta.session',
  birth: 'kundali.beta.birth',
  chart: 'kundali.beta.chart',
  onboarding: 'kundali.beta.onboardingComplete',
  conversations: 'kundali.beta.conversations',
  activeId: 'kundali.beta.activeId',
  family: 'kundali.beta.family',
  settings: 'kundali.beta.settings',
  reports: 'kundali.beta.reports',
  remedies: 'kundali.beta.remedies',
  ratings: 'kundali.beta.astrologerRatings',
  lastUsed: 'kundali.beta.astrologerLastUsed',
};

function readJson(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Safari private mode / quota — surface clearly rather than failing later.
    throw new Error(
      `Could not save locally (${error?.name || 'storage'}). Turn off Private Browsing or free some space, then try again.`
    );
  }
}

export function getSession() {
  return readJson(STORAGE_KEYS.session, null);
}

export function isInvited() {
  const session = getSession();
  return Boolean(session && session.email && session.inviteCode);
}

export function saveSession({ email, inviteCode }) {
  const session = {
    email: String(email || '').trim().toLowerCase(),
    inviteCode: String(inviteCode || '').trim(),
    invitedAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.session, session);
  return session;
}

export function validateInviteCode(code) {
  return String(code || '').trim().toUpperCase() === BETA_INVITE_CODE.toUpperCase();
}

export function getBirthDetails() {
  return readJson(STORAGE_KEYS.birth, null);
}

export function saveBirthDetails(details) {
  writeJson(STORAGE_KEYS.birth, details);
  return details;
}

export function getChart() {
  return readJson(STORAGE_KEYS.chart, null);
}

export function saveChart(chart) {
  writeJson(STORAGE_KEYS.chart, chart);
  return chart;
}

export function isOnboardingComplete() {
  return window.localStorage.getItem(STORAGE_KEYS.onboarding) === 'true';
}

export function markOnboardingComplete() {
  window.localStorage.setItem(STORAGE_KEYS.onboarding, 'true');
}

export function clearBetaSession() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function loadConversations() {
  return readJson(STORAGE_KEYS.conversations, null);
}

export function saveConversations(conversations) {
  writeJson(STORAGE_KEYS.conversations, conversations);
}

export function loadActiveId() {
  return window.localStorage.getItem(STORAGE_KEYS.activeId);
}

export function saveActiveId(id) {
  if (id) window.localStorage.setItem(STORAGE_KEYS.activeId, id);
}

export function loadFamilyMembers(fallback) {
  return readJson(STORAGE_KEYS.family, fallback);
}

export function saveFamilyMembers(members) {
  writeJson(STORAGE_KEYS.family, members);
}

export function getSettings() {
  const raw = readJson(STORAGE_KEYS.settings, { locale: 'en' });
  return {
    locale: raw?.locale === 'hi' ? 'hi' : 'en',
    chartTopicMatrix: raw?.chartTopicMatrix || null,
    updatedAt: raw?.updatedAt || null,
  };
}

export function saveSettings(settings) {
  const prev = getSettings();
  const next = {
    locale: settings?.locale === 'hi' ? 'hi' : settings?.locale === 'en' ? 'en' : prev.locale,
    chartTopicMatrix:
      settings?.chartTopicMatrix !== undefined ? settings.chartTopicMatrix : prev.chartTopicMatrix,
    updatedAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.settings, next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kundali-settings', { detail: next }));
  }
  return next;
}

/** Apply a remote account snapshot onto this device (cross-device restore). */
export function applyRemoteAccount(remote) {
  if (!remote || typeof remote !== 'object') return;
  if (remote.settings) saveSettings(remote.settings);
  if (remote.birth) saveBirthDetails(remote.birth);
  if (remote.chart) saveChart(remote.chart);
  if (remote.onboardingComplete) markOnboardingComplete();
  if (Array.isArray(remote.conversations)) saveConversations(remote.conversations);
  if (remote.activeId) saveActiveId(remote.activeId);
  if (Array.isArray(remote.family)) saveFamilyMembers(remote.family);
}

/** Snapshot of account data to sync to the Worker. */
export function buildAccountSnapshot() {
  return {
    settings: getSettings(),
    birth: getBirthDetails(),
    chart: getChart(),
    onboardingComplete: isOnboardingComplete(),
    conversations: loadConversations(),
    activeId: loadActiveId(),
    family: loadFamilyMembers(null),
    updatedAt: new Date().toISOString(),
  };
}

/** Seed a completed beta session for tests. */
export function seedCompletedBetaSession({
  email = 'beta@example.com',
  birth = { date: '1990-01-15', time: '10:30', place: 'Jaipur, Rajasthan, India' },
  locale = 'en',
} = {}) {
  saveSession({ email, inviteCode: BETA_INVITE_CODE });
  saveBirthDetails(birth);
  saveSettings({ locale });
  markOnboardingComplete();
}
