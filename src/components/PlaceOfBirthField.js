import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import { getSession } from '../betaSession';
import { placesAutocomplete, placesDetails } from '../api';
import { birthFieldSx } from './birthFieldSx';

function PlaceOfBirthField({
  label,
  placeholder,
  hint,
  value,
  onChange,
  onResolved,
}) {
  const [query, setQuery] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('none');
  const debounceRef = useRef(null);
  const blurTimer = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => () => {
    clearTimeout(debounceRef.current);
    clearTimeout(blurTimer.current);
  }, []);

  const search = (text) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const trimmed = text.trim();
      if (trimmed.length < 2) {
        setPredictions([]);
        setProvider('none');
        return;
      }
      setLoading(true);
      const session = getSession();
      const result = await placesAutocomplete(trimmed, session);
      setPredictions(result.predictions || []);
      setProvider(result.provider || 'none');
      setOpen(true);
      setLoading(false);
    }, 280);
  };

  const handleInput = (event) => {
    const next = event.target.value;
    setQuery(next);
    onChange?.(next);
    // Typing freely clears a previous precise selection until a suggestion is picked.
    onResolved?.(null);
    search(next);
  };

  const pick = async (prediction) => {
    setOpen(false);
    const label = prediction.description || prediction.label || '';
    setQuery(label);
    // Update parent immediately so Create chart can enable before details resolve.
    onChange?.(label);
    if (prediction.lat != null && prediction.lon != null) {
      onResolved?.({
        placeId: prediction.placeId,
        label,
        lat: prediction.lat,
        lon: prediction.lon,
        countryCode: prediction.countryCode || '',
        tzOffsetHours: prediction.tzOffsetHours,
        source: prediction.provider || 'nominatim',
      });
    } else {
      // Mark as selected even before lat/lon arrive so the wizard is not stuck.
      onResolved?.({
        placeId: prediction.placeId,
        label,
        lat: undefined,
        lon: undefined,
        countryCode: prediction.countryCode || '',
        source: prediction.provider || 'pending',
      });
    }
    setLoading(true);
    const session = getSession();
    const place = await placesDetails(prediction.placeId, session, {
      ...prediction,
      provider: prediction.provider,
    });
    setLoading(false);
    if (place) {
      const resolvedLabel = place.label || label;
      onResolved?.(place);
      setQuery(resolvedLabel);
      onChange?.(resolvedLabel);
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        label={label}
        value={query}
        onChange={handleInput}
        onFocus={() => predictions.length && setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 160);
        }}
        placeholder={placeholder}
        fullWidth
        autoComplete="off"
        slotProps={{
          // Always shrink when a placeholder is shown so the label never
          // sits on top of "Start typing a city…" / the typed value.
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <PlaceIcon sx={{ color: '#5B3FA0' }} />
              </InputAdornment>
            ),
            endAdornment: loading ? (
              <InputAdornment position="end">
                <CircularProgress size={18} sx={{ color: '#5B3FA0' }} />
              </InputAdornment>
            ) : null,
          },
          htmlInput: label ? { 'aria-label': label } : undefined,
        }}
        sx={birthFieldSx}
      />
      {hint && (
        <Typography sx={{ mt: 0.75, fontSize: 13, color: '#6A6580' }}>{hint}</Typography>
      )}
      {open && predictions.length > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            zIndex: 60,
            left: 0,
            right: 0,
            mt: 0.5,
            maxHeight: 260,
            overflow: 'auto',
            border: '1px solid #E6DEEF',
          }}
        >
          <List dense disablePadding>
            {predictions.map((item) => (
              <ListItemButton key={item.placeId} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(item)}>
                <ListItemText
                  primary={item.description}
                  primaryTypographyProps={{ fontSize: 14, color: '#1E1B2E' }}
                />
              </ListItemButton>
            ))}
          </List>
          <Typography sx={{ px: 1.5, py: 0.75, fontSize: 11, color: '#8A849E' }}>
            {provider === 'google' ? 'Google Places' : 'Place search'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default PlaceOfBirthField;
