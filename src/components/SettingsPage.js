import React from 'react';
import { Box, Button, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TuneIcon from '@mui/icons-material/Tune';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext';

function SettingsPage({ onBack }) {
  const navigate = useNavigate();
  const { locale, setLocale, t, locales, syncStatus } = useLocale();

  const statusLabel =
    syncStatus === 'synced'
      ? t('savedSynced')
      : syncStatus === 'syncing'
        ? t('syncing')
        : syncStatus === 'error'
          ? t('syncFailed')
          : t('savedLocal');

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(720px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}>
          {t('backHome')}
        </Button>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          {t('settingsTitle')}
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>{t('settingsSubtitle')}</Typography>

        <Box className="panel" sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>{t('language')}</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: '#4A4560' }}>{t('languageHelp')}</Typography>

          <ToggleButtonGroup
            exclusive
            value={locale}
            onChange={(_event, value) => value && setLocale(value)}
            sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}
          >
            {locales.map((item) => (
              <ToggleButton
                key={item.code}
                value={item.code}
                sx={{
                  px: 2.5,
                  py: 1,
                  textTransform: 'none',
                  borderColor: '#D8CFE6',
                  color: '#3A3550',
                  '&.Mui-selected': {
                    bgcolor: '#EFE9F7',
                    color: '#5B3FA0',
                    borderColor: '#5B3FA0',
                  },
                }}
              >
                {item.nativeLabel}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Typography sx={{ mt: 2, fontSize: 13, color: '#6A6580' }}>{statusLabel}</Typography>
        </Box>

        <Box className="panel" sx={{ mt: 2.5 }}>
          <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>LLM Lab</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: '#4A4560' }}>
            Edit the master chat prompt, choose provider and model, capture thinking separately, and
            tweak generation parameters.
          </Typography>
          <Button
            startIcon={<TuneIcon />}
            onClick={() => navigate('/settings/llm')}
            sx={{ mt: 2, textTransform: 'none', color: '#5B3FA0' }}
          >
            Open LLM Lab
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default SettingsPage;
