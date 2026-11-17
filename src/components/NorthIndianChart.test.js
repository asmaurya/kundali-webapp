import React from 'react';
import { render, screen } from '@testing-library/react';
import NorthIndianChart, { HOUSE_POLYGONS } from './NorthIndianChart';

test('defines twelve North Indian house polygons', () => {
  expect(Object.keys(HOUSE_POLYGONS).map(Number).sort((a, b) => a - b)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);
});

test('renders rashi numbers and planet abbreviations in the diamond chart', () => {
  const houses = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    sign: 'Aries',
    planets: i === 0 ? ['Sun', 'Moon'] : i === 6 ? ['Saturn'] : [],
  }));

  render(<NorthIndianChart houses={houses} lagnaRashi={5} lang="en" />);

  expect(screen.getByLabelText(/north indian natal chart/i)).toBeInTheDocument();
  expect(screen.getByText('Su Mo')).toBeInTheDocument();
  expect(screen.getByText('Sa')).toBeInTheDocument();
});
