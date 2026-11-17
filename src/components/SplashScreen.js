import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useLocale } from '../i18n/LocaleContext';

function SplashScreen({ onNext }) {
  const { t } = useLocale();

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
      }}
    >
      <Box className="hill-deco" sx={{ opacity: 0.8 }} />

      <Box className="floaty" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          component="span"
          aria-hidden="true"
          sx={{ position: 'absolute', top: 4, left: -26, fontSize: 22, color: '#F2B84B' }}
        >
          ✦
        </Box>
        <Box
          component="span"
          aria-hidden="true"
          sx={{ position: 'absolute', top: -14, right: -18, fontSize: 34, color: '#F2B84B' }}
        >
          ✦
        </Box>
        <Box
          component="span"
          aria-hidden="true"
          sx={{ position: 'absolute', bottom: 6, right: 6, fontSize: 14, color: '#F2B84B' }}
        >
          ✦
        </Box>
        <img src="/images/planet-logo.png" alt={t('appName')} width={190} />
      </Box>

      <Typography
        component="h2"
        sx={{
          position: 'relative',
          zIndex: 1,
          mt: 3,
          fontSize: { xs: 42, sm: 58 },
          fontWeight: 700,
          lineHeight: 1.05,
          color: '#1E1B2E',
        }}
      >
        {t('splashTitle')}
      </Typography>
      <Typography
        sx={{
          position: 'relative',
          zIndex: 1,
          mt: 1.5,
          fontSize: 17,
          color: '#1E1B2E',
          maxWidth: 420,
        }}
      >
        {t('splashSubtitle')}
      </Typography>

      <Box sx={{ position: 'relative', zIndex: 1, my: { xs: 2, sm: 3 } }}>
        <img src="/images/telescope.png" alt="" width={290} style={{ opacity: 0.92 }} />
      </Box>

      <Button
        variant="contained"
        onClick={onNext}
        sx={{
          position: 'relative',
          zIndex: 1,
          minWidth: 260,
          px: 4,
          py: 1.6,
          fontSize: 19,
          bgcolor: '#6B4FA0',
          '&:hover': { bgcolor: '#5B3FA0' },
        }}
      >
        {t('splashCta')} →
      </Button>
    </Box>
  );
}

export default SplashScreen;
