import React, { useState } from 'react';
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlaceOfBirthField from './PlaceOfBirthField';
import { useLocale } from '../i18n/LocaleContext';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FDFBFF',
    borderRadius: 2.5,
  },
  '& .MuiInputLabel-root': {
    backgroundColor: '#FCF8F3',
    px: 0.5,
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)',
  },
};

function BirthDetailsScreen({ onSubmit, onBack }) {
  const { t } = useLocale();
  const [details, setDetails] = useState({
    date: '',
    time: '',
    place: '',
  });
  const [placeMeta, setPlaceMeta] = useState(null);

  const handleChange = (field) => (event) => {
    setDetails((current) => ({ ...current, [field]: event.target.value }));
  };

  const canSubmit = details.date && details.time && details.place;

  const submit = () => {
    const payload = { ...details };
    if (placeMeta && Number.isFinite(Number(placeMeta.lat)) && Number.isFinite(Number(placeMeta.lon))) {
      payload.lat = Number(placeMeta.lat);
      payload.lon = Number(placeMeta.lon);
      payload.tzOffsetHours = placeMeta.tzOffsetHours;
      payload.countryCode = placeMeta.countryCode;
      payload.placeId = placeMeta.placeId;
      payload.source = placeMeta.source;
      payload.place = placeMeta.label || details.place;
    }
    onSubmit(payload);
  };

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(720px, 100%)', margin: '0 auto', padding: '28px 32px 40px' }}>
        {onBack && (
          <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}>
            {t('back')}
          </Button>
        )}

        <Typography component="h2" sx={{ fontSize: 28, fontWeight: 700, color: '#1E1B2E' }}>
          {t('birthTitle')}
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 17, color: '#3A3550' }}>{t('birthSubtitle')}</Typography>

        <Box sx={{ display: 'grid', gap: 2.5, mt: 4 }}>
          <TextField
            label={t('dateOfBirth')}
            type="date"
            value={details.date}
            onChange={handleChange('date')}
            fullWidth
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonthIcon sx={{ color: '#5B3FA0' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={fieldSx}
          />

          <TextField
            label={t('timeOfBirth')}
            type="time"
            value={details.time}
            onChange={handleChange('time')}
            fullWidth
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ScheduleIcon sx={{ color: '#5B3FA0' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={fieldSx}
          />

          <PlaceOfBirthField
            label={t('placeOfBirth')}
            placeholder={t('placePlaceholder')}
            hint={t('placeHint')}
            value={details.place}
            onChange={(place) => setDetails((current) => ({ ...current, place }))}
            onResolved={setPlaceMeta}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
            mt: 4,
            p: 2,
            bgcolor: '#EFE9F7',
            borderRadius: 3,
          }}
        >
          <LockIcon sx={{ color: '#5B3FA0', fontSize: 20 }} />
          <Typography sx={{ fontSize: 14, color: '#3A3550' }}>{t('placePrivate')}</Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          disabled={!canSubmit}
          onClick={submit}
          sx={{ mt: 3, py: 1.6, fontSize: 19, bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } }}
        >
          {t('createChart')}
        </Button>
      </Box>
    </Box>
  );
}

export default BirthDetailsScreen;
