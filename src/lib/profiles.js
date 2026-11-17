/**
 * Unified self + family profile list for Kundali tabs, Family page, and chat chips.
 */
import { createChart } from '../api';
import {
  getBirthDetails,
  getChart,
  getSession,
  loadFamilyMembers,
  saveFamilyMembers,
} from '../betaSession';

export const SELF_ID = 'self';

function displayNameFromEmail(email) {
  if (!email) return 'You';
  const local = String(email).split('@')[0] || 'You';
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getSelfProfile() {
  const birth = getBirthDetails();
  const chart = getChart();
  const session = getSession();
  const name = displayNameFromEmail(session?.email);
  return {
    id: SELF_ID,
    name,
    relation: 'Self',
    isSelf: true,
    chartReady: Boolean(chart),
    date: birth?.date || '',
    time: birth?.time || '',
    place: birth?.place || '',
    birth: birth || null,
    chart: chart || null,
  };
}

export function getFamilyOnly(fallback = []) {
  const stored = loadFamilyMembers(null);
  if (Array.isArray(stored)) {
    return stored.filter((m) => m && m.relation !== 'Self' && m.id !== SELF_ID);
  }
  return (Array.isArray(fallback) ? fallback : []).filter(
    (m) => m && m.relation !== 'Self' && m.id !== SELF_ID
  );
}

/** Self first, then family members (never duplicates Self). */
export function listProfiles({ includePending = true } = {}) {
  const self = getSelfProfile();
  const family = getFamilyOnly().map((member) => ({
    ...member,
    isSelf: false,
    chartReady: Boolean(member.chart) || Boolean(member.chartReady),
  }));
  const all = [self, ...family];
  if (includePending) return all;
  return all.filter((p) => p.chartReady && (p.chart || p.isSelf));
}

export function getProfileById(id) {
  return listProfiles().find((p) => String(p.id) === String(id)) || null;
}

export function ensureMemberChart(member) {
  if (member?.chart) return { ...member, chartReady: true };
  if (!member?.date || !member?.time || !member?.place) {
    return { ...member, chartReady: false };
  }
  try {
    const chart = createChart({
      date: member.date,
      time: member.time,
      place: member.place,
      lat: member.lat,
      lon: member.lon,
      tzOffsetHours: member.tzOffsetHours,
      countryCode: member.countryCode,
      placeId: member.placeId,
      source: member.source,
    });
    return { ...member, chart, chartReady: true };
  } catch {
    return { ...member, chartReady: false };
  }
}

export function persistFamilyMembers(members) {
  const cleaned = members
    .filter((m) => m && !m.isSelf && m.id !== SELF_ID && m.relation !== 'Self')
    .map((m) => {
      const { isSelf, ...rest } = m;
      return rest;
    });
  saveFamilyMembers(cleaned);
  return cleaned;
}
