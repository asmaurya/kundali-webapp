import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeNatalChart } from '../lib/natal.js';

test('Swiss Ephemeris returns canonical kundali JSON', async () => {
  const chart = await computeNatalChart({
    date: '1990-05-15',
    time: '14:30',
    place: 'Jaipur, India',
    lat: 26.9124,
    lon: 75.7873,
    tzOffsetHours: 5.5,
  });

  assert.equal(chart.schema_version, 1);
  assert.equal(chart.ayanamsa, 'lahiri');
  assert.equal(chart.house_system, 'whole_sign');
  assert.ok(chart.lagna?.rashiName);
  assert.ok(Array.isArray(chart.grahas) && chart.grahas.length >= 9);
  assert.ok(chart.summary?.currentDasha);
  assert.equal(chart.provenance.provider, 'swiss-ephemeris-wasm');
});
