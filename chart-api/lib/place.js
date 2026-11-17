/** Shared birth-place resolution (mirrors webapp chartEngine city table). */

const CITY_COORDS = {
  jaipur: { lat: 26.9124, lon: 75.7873, tzOffsetHours: 5.5 },
  delhi: { lat: 28.6139, lon: 77.209, tzOffsetHours: 5.5 },
  'new delhi': { lat: 28.6139, lon: 77.209, tzOffsetHours: 5.5 },
  mumbai: { lat: 19.076, lon: 72.8777, tzOffsetHours: 5.5 },
  bengaluru: { lat: 12.9716, lon: 77.5946, tzOffsetHours: 5.5 },
  bangalore: { lat: 12.9716, lon: 77.5946, tzOffsetHours: 5.5 },
  hyderabad: { lat: 17.385, lon: 78.4867, tzOffsetHours: 5.5 },
  chennai: { lat: 13.0827, lon: 80.2707, tzOffsetHours: 5.5 },
  kolkata: { lat: 22.5726, lon: 88.3639, tzOffsetHours: 5.5 },
  pune: { lat: 18.5204, lon: 73.8567, tzOffsetHours: 5.5 },
  ahmedabad: { lat: 23.0225, lon: 72.5714, tzOffsetHours: 5.5 },
  lucknow: { lat: 26.8467, lon: 80.9462, tzOffsetHours: 5.5 },
  chandigarh: { lat: 30.7333, lon: 76.7794, tzOffsetHours: 5.5 },
  kanpur: { lat: 26.4499, lon: 80.3319, tzOffsetHours: 5.5 },
  india: { lat: 28.6139, lon: 77.209, tzOffsetHours: 5.5 },
};

export function estimateTzOffsetHours(lat, lon, countryCode) {
  const cc = String(countryCode || '').toUpperCase();
  if (cc === 'IN' || cc === 'IND') return 5.5;
  if (cc === 'NP') return 5.75;
  if (cc === 'LK') return 5.5;
  if (cc === 'BD') return 6;
  if (cc === 'PK') return 5;
  if (cc === 'AE') return 4;
  if (cc === 'GB') return 0;
  if (cc === 'US') {
    if (lon < -112.5) return -8;
    if (lon < -97.5) return -7;
    if (lon < -82.5) return -6;
    return -5;
  }
  const rough = Math.round((Number(lon) || 0) / 15);
  return Math.max(-12, Math.min(14, rough));
}

export function resolvePlace(place, coords = {}) {
  if (Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lon))) {
    const lat = Number(coords.lat);
    const lon = Number(coords.lon);
    const tzOffsetHours = Number.isFinite(Number(coords.tzOffsetHours))
      ? Number(coords.tzOffsetHours)
      : estimateTzOffsetHours(lat, lon, coords.countryCode);
    return {
      lat,
      lon,
      tzOffsetHours,
      label: place || coords.label || 'Selected place',
      approx: false,
      placeId: coords.placeId || null,
      source: coords.source || 'places',
    };
  }

  const key = String(place || '')
    .toLowerCase()
    .split(',')[0]
    .trim();
  if (CITY_COORDS[key]) return { ...CITY_COORDS[key], label: place };
  const matched = Object.keys(CITY_COORDS).find((city) =>
    String(place || '')
      .toLowerCase()
      .includes(city)
  );
  if (matched) return { ...CITY_COORDS[matched], label: place };
  return { ...CITY_COORDS.delhi, label: place || 'Delhi, India', approx: true };
}

export function parseBirthDateTime(dateInput, timeInput) {
  const dateStr = String(dateInput || '').trim();
  const rawTime = String(timeInput || '12:00').trim();

  let year;
  let month;
  let day;
  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const slash = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    year = Number(slash[3]);
    if (a > 12) {
      day = a;
      month = b;
    } else if (b > 12) {
      month = a;
      day = b;
    } else {
      day = a;
      month = b;
    }
  } else {
    throw new Error('Enter date of birth as YYYY-MM-DD.');
  }

  let timeStr = rawTime.toLowerCase().replace(/\s+/g, '');
  const ampm = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(am|pm)?$/);
  if (!ampm) throw new Error('Enter time of birth as HH:MM.');
  let hour = Number(ampm[1]);
  const minute = Number(ampm[2]);
  const meridiem = ampm[3];
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error('Birth date or time looks invalid.');
  }

  return { year, month, day, hour, minute };
}

export function formatTzOffset(hours) {
  const sign = hours < 0 ? '-' : '+';
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
