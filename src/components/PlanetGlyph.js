import React from 'react';
import { canonicalPlanetName } from '../lib/grahaMeta';

/**
 * Drawn navagraha marks for the kundali chart.
 * Paths follow the Hindu planet symbol sheet (Sun–Saturn plus Rahu/Ketu).
 * Outer planets on that sheet are unused in the Vedic natal chart.
 */

export const GRAHA_ORDER = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
];

export const GRAHA_SANSKRIT = {
  Sun: 'Surya',
  Moon: 'Chandra',
  Mars: 'Mangal',
  Mercury: 'Budha',
  Jupiter: 'Guru',
  Venus: 'Shukra',
  Saturn: 'Shani',
  Rahu: 'Rahu',
  Ketu: 'Ketu',
};

const PATHS = {
  Sun: (
    <g>
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" />
    </g>
  ),
  Moon: (
    <path
      fill="currentColor"
      d="M15.2 4.2 A8.4 8.4 0 1 0 15.2 19.8 A6.5 6.5 0 1 1 15.2 4.2 Z"
    />
  ),
  Mars: (
    <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.2" cy="13.8" r="5.6" />
      <path d="M14.2 9.8 L19.2 4.8" />
      <path d="M13.6 4.8 H19.2 V10.4" />
    </g>
  ),
  Mercury: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.2 5.2 A4.8 4.8 0 0 1 16.8 5.2" />
      <circle cx="12" cy="11.2" r="4.4" />
      <path d="M12 15.6 V20.4" />
      <path d="M8.4 18 H15.6" />
    </g>
  ),
  Jupiter: (
    <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.4 3.6 V20.4" />
      <path d="M4.8 13.2 H18" />
      <path d="M14.8 8.4 C14.2 4.8 8.8 4.2 7 7.4 C5.6 10.2 8.2 13 12 13.2" />
    </g>
  ),
  Venus: (
    <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5.2" />
      <path d="M12 14.2 V20.2" />
      <path d="M8.2 17.2 H15.8" />
    </g>
  ),
  Saturn: (
    <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.6 6.4 H13.6" />
      <path d="M9.6 3.6 V20.4" />
      <path d="M9.8 12.2 C14.2 10.4 19.2 12.2 18.6 16.6 C18.1 20.2 13.8 21.4 11.4 19.2" />
    </g>
  ),
  Rahu: (
    <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.2 17.2 C5.2 8.8 18.8 8.8 18.8 17.2" />
      <path d="M5.2 17.2 C3.2 17.2 3.2 14.4 5.4 14.8" />
      <path d="M18.8 17.2 C20.8 17.2 20.8 14.4 18.6 14.8" />
    </g>
  ),
  Ketu: (
    <g fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.2 6.8 C5.2 15.2 18.8 15.2 18.8 6.8" />
      <path d="M5.2 6.8 C3.2 6.8 3.2 9.6 5.4 9.2" />
      <path d="M18.8 6.8 C20.8 6.8 20.8 9.6 18.6 9.2" />
    </g>
  ),
};

/** Inline SVG mark for use inside another SVG (chart houses). */
export function PlanetGlyphMark({ planet, size = 12 }) {
  const key = canonicalPlanetName(planet);
  const body = PATHS[key];
  if (!body) return null;
  const scale = size / 24;
  return (
    <g transform={`scale(${scale})`} data-testid={`planet-glyph-${key}`} aria-hidden="true">
      {body}
    </g>
  );
}

/** Standalone glyph for HTML layouts (tables, legends, keys). */
function PlanetGlyph({ planet, size = 18, title }) {
  const key = canonicalPlanetName(planet);
  const body = PATHS[key];
  if (!body) return null;
  const label = title || GRAHA_SANSKRIT[key] || key;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      data-testid={`planet-glyph-${key}`}
      style={{ display: 'block', flexShrink: 0, color: 'currentColor' }}
    >
      <title>{label}</title>
      {body}
    </svg>
  );
}

export default PlanetGlyph;
