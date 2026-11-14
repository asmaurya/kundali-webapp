import React, { useState } from 'react';
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlaceIcon from '@mui/icons-material/Place';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function BirthDetailsScreen({ onSubmit, onBack }) {
  const [details, setDetails] = useState({
    date: '',
    time: '',
    place: '',
  });

  const handleChange = (field) => (event) => {
    setDetails((current) => ({ ...current, [field]: event.target.value }));
  };

  const canSubmit = details.date && details.time && details.place;

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(720px, 100%)', margin: '0 auto', padding: '28px 32px 40px' }}>
        {onBack && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}
          >
            Back
          </Button>
        )}

        <Typography component="h2" sx={{ fontSize: 28, fontWeight: 700, color: '#1E1B2E' }}>
          Your Birth Details
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 17, color: '#3A3550' }}>
          Help us create your personal astrology chart.
        </Typography>

        <Box sx={{ display: 'grid', gap: 2, mt: 4 }}>
          <TextField
            label="Date of Birth"
            type="date"
            value={details.date}
            onChange={handleChange('date')}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonthIcon sx={{ color: '#5B3FA0' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF', borderRadius: 2.5 } }}
          />

          <TextField
            label="Time of Birth"
            type="time"
            value={details.time}
            onChange={handleChange('time')}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ScheduleIcon sx={{ color: '#5B3FA0' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF', borderRadius: 2.5 } }}
          />

          <TextField
            label="Place of Birth"
            value={details.place}
            onChange={handleChange('place')}
            placeholder="City, State, Country"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PlaceIcon sx={{ color: '#5B3FA0' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FDFBFF', borderRadius: 2.5 } }}
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
          <Typography sx={{ fontSize: 14, color: '#3A3550' }}>
            Your birth details stay private and are only used to compute your chart.
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          disabled={!canSubmit}
          onClick={() => onSubmit(details)}
          sx={{ mt: 3, py: 1.6, fontSize: 19, bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } }}
        >
          Create My Chart
        </Button>
      </Box>
    </Box>
  );
}

export default BirthDetailsScreen;
