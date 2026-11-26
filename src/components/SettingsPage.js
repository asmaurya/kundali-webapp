import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TuneIcon from '@mui/icons-material/Tune';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleContext';
import { getSession, getSettings, saveSettings } from '../betaSession';
import { pushRemoteSettings } from '../api';
import {
  DEFAULT_CHART_TOPIC_MATRIX,
  LLM_CHART_OPTIONS,
  LLM_TOPICS,
  normalizeChartTopicMatrix,
} from '../lib/chartTopicMatrix';

function SettingsPage({ onBack }) {
  const navigate = useNavigate();
  const { locale, setLocale, t, locales, syncStatus } = useLocale();
  const [matrix, setMatrix] = useState(() =>
    normalizeChartTopicMatrix(getSettings()?.chartTopicMatrix)
  );
  const [matrixStatus, setMatrixStatus] = useState('');
  const [savingMatrix, setSavingMatrix] = useState(false);

  const statusLabel =
    syncStatus === 'synced'
      ? t('savedSynced')
      : syncStatus === 'syncing'
        ? t('syncing')
        : syncStatus === 'error'
          ? t('syncFailed')
          : t('savedLocal');

  const checkedCount = useMemo(
    () =>
      LLM_TOPICS.reduce(
        (sum, topic) => sum + (matrix[topic.id] || []).length,
        0
      ),
    [matrix]
  );

  const toggleCell = (topicId, chartId) => {
    setMatrix((prev) => {
      const current = new Set(prev[topicId] || []);
      if (current.has(chartId)) {
        // Keep at least lagna so the model always has a chart.
        if (chartId === 'lagna' && current.size <= 1) return prev;
        current.delete(chartId);
      } else {
        current.add(chartId);
      }
      return { ...prev, [topicId]: [...current] };
    });
    setMatrixStatus('');
  };

  const saveMatrix = async () => {
    setSavingMatrix(true);
    const next = normalizeChartTopicMatrix(matrix);
    setMatrix(next);
    const settings = saveSettings({ ...getSettings(), chartTopicMatrix: next });
    const session = getSession();
    if (session?.email && session?.inviteCode) {
      const ok = await pushRemoteSettings(session, settings);
      setMatrixStatus(ok ? 'Chart matrix saved and synced.' : 'Saved locally; sync failed.');
    } else {
      setMatrixStatus('Chart matrix saved on this device.');
    }
    setSavingMatrix(false);
  };

  const resetMatrix = () => {
    setMatrix(normalizeChartTopicMatrix(DEFAULT_CHART_TOPIC_MATRIX));
    setMatrixStatus('Defaults restored — click Save to keep them.');
  };

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(960px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
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
          <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>
            Charts submitted per topic
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: '#4A4560' }}>
            When you select topic chips in chat (career, relationships, health, …), only the checked
            Kundali charts are sent to the LLM for that turn. Lagna stays available as a baseline.
            Family charts are included when checked and someone is @mentioned.
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 12, color: '#6A6580' }}>
            {checkedCount} selections across {LLM_TOPICS.length} topics
          </Typography>

          <Box sx={{ mt: 2, overflowX: 'auto', border: '1px solid #E6DEEF', borderRadius: 2 }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F7F4FB' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1E1B2E', position: 'sticky', left: 0, bgcolor: '#F7F4FB', zIndex: 1 }}>
                    Topic \\ Chart
                  </TableCell>
                  {LLM_CHART_OPTIONS.map((chart) => (
                    <TableCell
                      key={chart.id}
                      align="center"
                      sx={{ fontWeight: 600, color: '#3A3550', fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      {chart.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {LLM_TOPICS.map((topic) => (
                  <TableRow key={topic.id} hover>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: '#1E1B2E',
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        left: 0,
                        bgcolor: '#FFFFFF',
                        zIndex: 1,
                      }}
                    >
                      {topic.label}
                    </TableCell>
                    {LLM_CHART_OPTIONS.map((chart) => {
                      const on = (matrix[topic.id] || []).includes(chart.id);
                      return (
                        <TableCell key={chart.id} align="center" padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={on}
                            onChange={() => toggleCell(topic.id, chart.id)}
                            inputProps={{
                              'aria-label': `${topic.label} · ${chart.label}`,
                            }}
                            sx={{ color: '#5B3FA0', '&.Mui-checked': { color: '#5B3FA0' } }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<SaveOutlinedIcon />}
              onClick={saveMatrix}
              disabled={savingMatrix}
              sx={{ bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' }, textTransform: 'none' }}
            >
              {savingMatrix ? 'Saving…' : 'Save chart matrix'}
            </Button>
            <Button
              variant="outlined"
              onClick={resetMatrix}
              disabled={savingMatrix}
              sx={{ borderColor: '#CFC4EA', color: '#5B3FA0', textTransform: 'none' }}
            >
              Reset defaults
            </Button>
            {matrixStatus && (
              <Typography sx={{ fontSize: 13, color: '#2F6B52' }}>{matrixStatus}</Typography>
            )}
          </Box>
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
