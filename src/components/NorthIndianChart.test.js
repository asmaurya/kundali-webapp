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
  expect(within(chart).getByTestId('planet-glyph-Sun')).toBeInTheDocument();
  expect(within(chart).getByTestId('planet-glyph-Moon')).toBeInTheDocument();
  expect(within(chart).getByTestId('planet-glyph-Saturn')).toBeInTheDocument();
  const labels = Array.from(chart.querySelectorAll('text')).map((n) => n.textContent || '');
  expect(labels.some((t) => t.includes('Su'))).toBe(true);
  expect(labels.some((t) => t.includes('Mo'))).toBe(true);
  expect(labels.some((t) => t.includes('Sa'))).toBe(true);
  const symbols = screen.getByLabelText(/planet symbols/i);
  ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].forEach(
    (planet) => {
      expect(within(symbols).getByTestId(`planet-glyph-${planet}`)).toBeInTheDocument();
    }
  );
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
  expect(screen.getByTestId('planet-glyph-Sun')).toBeInTheDocument();
  const labels = Array.from(document.querySelectorAll('text')).map((n) => n.textContent || '');
  expect(labels.some((t) => t.includes('सू'))).toBe(true);
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

test('renders Rahu and Ketu glyphs in the diamond chart', () => {
  const houses = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    sign: 'Aries',
    planets: i === 0 ? ['Rahu'] : i === 6 ? ['Ketu'] : [],
  }));
  render(
    <NorthIndianChart
      houses={houses}
      grahas={[
        { name: 'Rahu', rashi: 5, rashiName: 'Leo', longitude: 125, degree: 5, house: 1 },
        { name: 'Ketu', rashi: 11, rashiName: 'Aquarius', longitude: 305, degree: 5, house: 7 },
      ]}
      lagnaRashi={5}
      showLegend={false}
    />
  );
  const chart = screen.getByLabelText(/north indian natal chart/i);
  expect(within(chart).getByTestId('planet-glyph-Rahu')).toBeInTheDocument();
  expect(within(chart).getByTestId('planet-glyph-Ketu')).toBeInTheDocument();
  const labels = Array.from(chart.querySelectorAll('text')).map((n) => n.textContent || '');
  expect(labels.some((t) => t.includes('Ra'))).toBe(true);
  expect(labels.some((t) => t.includes('Ke'))).toBe(true);
});
