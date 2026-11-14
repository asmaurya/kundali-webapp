import React, { useEffect, useState } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

const STEPS = [
  'Calculating planetary positions',
  'Generating birth chart (Kundli)',
  'Saving your profile',
];

function CreatingChartScreen({ onNext }) {
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((value) => (value >= 100 ? 100 : value + 20));
    }, 450);

    const finish = setTimeout(() => onNext(), 2800);

    return () => {
      clearInterval(timer);
      clearTimeout(finish);
    };
  }, [onNext]);

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
    </Box>
  );
}

export default CreatingChartScreen;
