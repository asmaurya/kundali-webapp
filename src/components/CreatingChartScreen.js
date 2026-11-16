import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, LinearProgress, Typography } from '@mui/material';
import { createChart } from '../api';
import { getBirthDetails, saveChart } from '../betaSession';

const STEPS = [
  'Calculating planetary positions',
  'Generating birth chart (Kundli)',
  'Saving your profile',
];

const MIN_VISIBLE_MS = 1200;

function CreatingChartScreen({ onNext }) {
  const [progress, setProgress] = useState(8);
  const [error, setError] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    let cancelled = false;
    let progressTimer;
    let finishTimer;
    const startedAt = Date.now();

    const birth = getBirthDetails();
    if (!birth?.date || !birth?.time || !birth?.place) {
      setError('Birth details are missing. Go back and enter them again.');
      return undefined;
    }

    setError('');
    setProgress(8);
    progressTimer = setInterval(() => {
      setProgress((value) => (value >= 90 ? 90 : value + 8));
    }, 200);

    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const chart = createChart(birth);
        if (cancelled) return;

        saveChart(chart);
        setProgress(100);
        clearInterval(progressTimer);

        const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt));
        finishTimer = setTimeout(() => {
          if (!cancelled) onNextRef.current(chart);
        }, wait);
      } catch (err) {
        if (cancelled) return;
        clearInterval(progressTimer);
        setError(String(err.message || err || 'Could not prepare your chart.'));
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(progressTimer);
      clearTimeout(finishTimer);
    };
  }, [retryToken]);

  return (
    <Box
      className="stack-page"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        px: 4,
        py: 6,
        textAlign: 'center',
        background: 'linear-gradient(180deg, #FBF6F2 0%, #E6DAF6 100%)',
      }}
    >
      <Box className="hill-deco" sx={{ opacity: 0.8 }} />

      <Box className="zodiac-wheel" sx={{ position: 'relative', zIndex: 1 }}>
        <img src="/images/zodiac-wheel.png" alt="Zodiac wheel" width={300} height={300} />
      </Box>

      <Typography
        component="h2"
        sx={{
          position: 'relative',
          zIndex: 1,
          mt: 4,
          fontSize: 28,
          fontWeight: 700,
          color: '#1E1B2E',
        }}
      >
        Creating Your
        <br />
        Astrology Chart...
      </Typography>

      {error ? (
        <Box sx={{ position: 'relative', zIndex: 1, mt: 3, maxWidth: 480, width: '100%' }}>
          <Alert severity="info" sx={{ textAlign: 'left' }}>
            {error}
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setRetryToken((value) => value + 1)}
            sx={{ mt: 2, bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } }}
          >
            Try again
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ position: 'relative', zIndex: 1, width: 'min(520px, 100%)', mt: 3 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#CFC4EA',
                '& .MuiLinearProgress-bar': { bgcolor: '#6B4FA0', borderRadius: 4 },
              }}
            />
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1, mt: 3, textAlign: 'left' }}>
            {STEPS.map((step, index) => (
              <Typography key={step} sx={{ fontSize: 16, color: '#1E1B2E', lineHeight: 2 }}>
                {progress > index * 30 ? '✓' : '○'} &nbsp;{step}
              </Typography>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

export default CreatingChartScreen;
