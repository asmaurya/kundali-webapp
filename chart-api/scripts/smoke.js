import { computeNatalChart } from '../lib/natal.js';

const chart = await computeNatalChart({
  date: '1990-05-15',
  time: '14:30',
  place: 'Jaipur, India',
  lat: 26.9124,
  lon: 75.7873,
  tzOffsetHours: 5.5,
});

console.log(
  JSON.stringify(
    {
      lagna: chart.summary.lagna,
      moon: chart.summary.moonSign,
      nakshatra: chart.summary.nakshatra,
      dasha: chart.summary.currentDasha,
      provider: chart.provenance.provider,
      ephemeris: chart.provenance.ephemeris,
      ayanamsa_deg: chart.ayanamsa_deg,
    },
    null,
    2
  )
);
