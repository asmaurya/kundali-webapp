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

/** Demo family used when the device has never saved a family list. */
export const DEMO_FAMILY_MEMBERS = [
  {
    id: 1,
    name: 'Ramesh Sharma',
    relation: 'Father',
    date: '1962-03-12',
    time: '06:15',
    place: 'Jaipur, Rajasthan, India',
    chartReady: false,
  },
  {
    id: 2,
    name: 'Sunita Sharma',
    relation: 'Mother',
    date: '1965-11-02',
    time: '09:40',
    place: 'Jaipur, Rajasthan, India',
    chartReady: false,
  },
  {
    id: 3,
    name: 'Aman Sharma',
    relation: 'Brother',
    chartReady: false,
  },
];

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

export function isValidChart(chart) {
  return Boolean(chart && chart.lagna && Array.isArray(chart.grahas));
}

export function getSelfProfile() {
  const birth = getBirthDetails();
  const chart = getChart();
  const session = getSession();
  const name = displayNameFromEmail(session?.email);
  const ready = isValidChart(chart);
  return {
    id: SELF_ID,
    name,
    relation: 'Self',
    isSelf: true,
    chartReady: ready,
    date: birth?.date || '',
    time: birth?.time || '',
    place: birth?.place || '',
    birth: birth || null,
    chart: ready ? chart : null,
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

/** Normalize chartReady from a stored member without recomputing. */
export function withChartStatus(member) {
  if (!member) return member;
  if (member.isSelf || member.id === SELF_ID) return member;
  const ready = isValidChart(member.chart);
  return {
    ...member,
    isSelf: false,
    chart: ready ? member.chart : null,
    chartReady: ready,
  };
}

/**
 * Persist demo family once when the family key is missing.
 * Does not overwrite an intentional empty list (`[]`).
 */
export function ensureFamilySeeds() {
  const stored = loadFamilyMembers(null);
  if (Array.isArray(stored)) return getFamilyOnly();
  const seeded = DEMO_FAMILY_MEMBERS.map((member) => ({ ...member, chartReady: false }));
  return persistFamilyMembers(seeded);
}

/** Self first, then family members (never duplicates Self). */
export function listProfiles({ includePending = true } = {}) {
  const self = getSelfProfile();
  const family = getFamilyOnly().map(withChartStatus);
  const all = [self, ...family];
  if (includePending) return all;
  return all.filter((p) => p.chartReady && (p.chart || p.isSelf));
}

export function getProfileById(id) {
  return listProfiles().find((p) => String(p.id) === String(id)) || null;
}

export async function ensureMemberChart(member) {
  const normalized = withChartStatus(member);
  if (isValidChart(normalized?.chart)) {
    return { ...normalized, chartReady: true };
  }
  if (!normalized?.date || !normalized?.time || !normalized?.place) {
    return { ...normalized, chart: null, chartReady: false };
  }
  try {
    const chart = await createChart({
      date: normalized.date,
      time: normalized.time,
      place: normalized.place,
      lat: normalized.lat,
      lon: normalized.lon,
      tzOffsetHours: normalized.tzOffsetHours,
      countryCode: normalized.countryCode,
      placeId: normalized.placeId,
      source: normalized.source,
    });
    const ready = isValidChart(chart);
    return { ...normalized, chart: ready ? chart : null, chartReady: ready };
  } catch {
    return { ...normalized, chart: null, chartReady: false };
  }
}

export function persistFamilyMembers(members) {
  const cleaned = members
    .filter((m) => m && !m.isSelf && m.id !== SELF_ID && m.relation !== 'Self')
    .map((m) => {
      const { isSelf, ...rest } = m;
      const ready = isValidChart(rest.chart);
      return {
        ...rest,
        chart: ready ? rest.chart : null,
        chartReady: ready,
      };
    });
  saveFamilyMembers(cleaned);
  return cleaned;
}
