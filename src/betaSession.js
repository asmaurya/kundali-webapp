/** Invite-only beta session helpers (localStorage). No server auth yet. */

export const BETA_INVITE_CODE =
  process.env.REACT_APP_BETA_INVITE_CODE || 'KUNDALI-BETA';

export const STORAGE_KEYS = {
  session: 'kundali.beta.session',
  birth: 'kundali.beta.birth',
  onboarding: 'kundali.beta.onboardingComplete',
  conversations: 'kundali.beta.conversations',
  activeId: 'kundali.beta.activeId',
  family: 'kundali.beta.family',
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
  window.localStorage.setItem(key, JSON.stringify(value));
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

/** Seed a completed beta session for tests. */
export function seedCompletedBetaSession({
  email = 'beta@example.com',
  birth = { date: '1990-01-15', time: '10:30', place: 'Jaipur, Rajasthan, India' },
} = {}) {
  saveSession({ email, inviteCode: BETA_INVITE_CODE });
  saveBirthDetails(birth);
  markOnboardingComplete();
}
