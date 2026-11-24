import React from 'react';
import { render, screen, within } from '@testing-library/react';
import NorthIndianChart, { HOUSE_POLYGONS } from './NorthIndianChart';

test('defines twelve North Indian house polygons', () => {
  expect(Object.keys(HOUSE_POLYGONS).map(Number).sort((a, b) => a - b)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);
});

test('renders planet glyphs and short names in the diamond chart', () => {
  const houses = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    sign: 'Aries',
    planets: i === 0 ? ['Sun', 'Moon'] : i === 6 ? ['Saturn'] : [],
  }));

  render(
    <NorthIndianChart
      houses={houses}
      grahas={[
        { name: 'Sun', rashi: 1, rashiName: 'Aries', longitude: 10, degree: 10 },
        { name: 'Moon', rashi: 1, rashiName: 'Aries', longitude: 15, degree: 15 },
        { name: 'Saturn', rashi: 7, rashiName: 'Libra', longitude: 185, degree: 5, retrograde: true },
      ]}
      lagnaRashi={5}
      lang="en"
    />
  );

  const chart = screen.getByLabelText(/north indian natal chart/i);
  expect(chart).toBeInTheDocument();
  expect(within(chart).getByText(/☉\uFE0E?\s*Su/)).toBeInTheDocument();
  expect(within(chart).getByText(/☽\uFE0E?\s*Mo/)).toBeInTheDocument();
  expect(within(chart).getByText(/♄\uFE0E?\s*Sa/)).toBeInTheDocument();
  const legend = screen.getByLabelText(/chart legend/i);
  expect(legend).toBeInTheDocument();
  expect(within(legend).getByText(/Uchch/i)).toBeInTheDocument();
});

test('Hindi locale uses Hindi planet names with glyphs', () => {
  const houses = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    sign: 'Leo',
    planets: i === 0 ? ['Sun'] : [],
  }));
  render(
    <NorthIndianChart
      houses={houses}
      grahas={[{ name: 'Sun', rashi: 5, rashiName: 'Leo', longitude: 125, degree: 5 }]}
      lagnaRashi={5}
      lang="hi"
      showLegend={false}
    />
  );
  expect(screen.getByText(/☉\uFE0E?\s*सू/)).toBeInTheDocument();
});

test('sign label mode shows sign abbreviations', () => {
  const houses = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    sign: i === 0 ? 'Leo' : 'Aries',
    planets: i === 0 ? ['Sun'] : [],
  }));
  const { container } = render(
    <NorthIndianChart
      houses={houses}
      grahas={[{ name: 'Sun', rashiName: 'Leo', rashi: 5, longitude: 125, degree: 5 }]}
      lagnaRashi={5}
      labelMode="sign"
      showLegend={false}
    />
  );
  const labels = Array.from(container.querySelectorAll('text')).map((n) => n.textContent || '');
  expect(labels.some((t) => t.includes('Le'))).toBe(true);
});
