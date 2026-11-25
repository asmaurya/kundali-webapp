import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlaceOfBirthField from './PlaceOfBirthField';
import * as api from '../api';

jest.mock('../api', () => {
  const actual = jest.requireActual('../api');
  return {
    ...actual,
    placesAutocomplete: jest.fn(),
    placesDetails: jest.fn(),
  };
});

function Harness() {
  const [place, setPlace] = useState('');
  const [meta, setMeta] = useState(null);
  return (
    <div>
      <PlaceOfBirthField
        label="Place of Birth"
        value={place}
        onChange={setPlace}
        onResolved={setMeta}
      />
      <div data-testid="place-value">{place}</div>
      <div data-testid="place-meta">{meta ? meta.label || meta.placeId : ''}</div>
    </div>
  );
}

test('picking a suggestion resolves place immediately for parent form binding', async () => {
  api.placesAutocomplete.mockResolvedValue({
    provider: 'nominatim',
    predictions: [
      {
        placeId: 'delhi-1',
        description: 'Delhi, India',
        lat: 28.6139,
        lon: 77.209,
        provider: 'nominatim',
      },
    ],
  });
  api.placesDetails.mockResolvedValue({
    placeId: 'delhi-1',
    label: 'Delhi, India',
    lat: 28.6139,
    lon: 77.209,
    countryCode: 'IN',
    source: 'nominatim',
  });

  render(<Harness />);
  fireEvent.change(screen.getByLabelText(/place of birth/i), {
    target: { value: 'Delhi' },
  });

  const suggestion = await screen.findByText('Delhi, India');
  fireEvent.click(suggestion);

  await waitFor(() => {
    expect(screen.getByTestId('place-value')).toHaveTextContent('Delhi, India');
    expect(screen.getByTestId('place-meta')).toHaveTextContent('Delhi, India');
  });
});
