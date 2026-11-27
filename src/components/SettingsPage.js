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
  TextField,
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
import {
  DEFAULT_CHAT_CONTINUE_MESSAGE_LIMIT,
  DEFAULT_CHAT_CONTINUE_TOKEN_LIMIT,
  parseLimit,
  readChatContinueLimits,
} from '../lib/chatContinueLimits';

function SettingsPage({ onBack }) {
  const navigate = useNavigate();
  const { locale, setLocale, t, locales, syncStatus } = useLocale();
  const [matrix, setMatrix] = useState(() =>
    normalizeChartTopicMatrix(getSettings()?.chartTopicMatrix)
  );
  const [matrixStatus, setMatrixStatus] = useState('');
  const [savingMatrix, setSavingMatrix] = useState(false);
  const initialLimits = readChatContinueLimits(getSettings());
  const [messageLimitDraft, setMessageLimitDraft] = useState(String(initialLimits.messageLimit));
  const [tokenLimitDraft, setTokenLimitDraft] = useState(String(initialLimits.tokenLimit));
  const [limitsStatus, setLimitsStatus] = useState('');

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

  const persistContinueLimits = async (partial) => {
    const settings = saveSettings({ ...getSettings(), ...partial });
    setLimitsStatus('Applied immediately on this device.');
    const session = getSession();
    if (session?.email && session?.inviteCode) {
      const ok = await pushRemoteSettings(session, settings);
      setLimitsStatus(
        ok ? 'Applied immediately and synced.' : 'Applied locally; sync failed.'
      );
    }
  };

  const commitMessageLimit = (raw) => {
    const next = parseLimit(raw, -1);
    setMessageLimitDraft(String(next));
    if (next === getSettings().chatContinueMessageLimit) return;
    persistContinueLimits({ chatContinueMessageLimit: next });
  };

  const commitTokenLimit = (raw) => {
    const next = parseLimit(raw, -1);
    setTokenLimitDraft(String(next));
    if (next === getSettings().chatContinueTokenLimit) return;
    persistContinueLimits({ chatContinueTokenLimit: next });
  };

  const onLimitDraftChange = (raw, setDraft, commit) => {
    setDraft(raw);
    setLimitsStatus('');
    // Commit as soon as the field holds a complete integer (incl. -1) — live, no refresh.
    if (/^-?\d+$/.test(String(raw).trim())) {
      commit(raw);
    }
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
            Start new chat from summary
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: '#4A4560' }}>
            Soft nudge in Astro Chat when a thread gets long. Changes apply immediately — no page
            refresh. Set either value to <strong>−1</strong> to disable that trigger (both are −1 by
            default right now).
          </Typography>
          <Box
            sx={{
              mt: 2,
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <TextField
              label="User message count"
              type="number"
              size="small"
              value={messageLimitDraft}
              onChange={(e) =>
                onLimitDraftChange(e.target.value, setMessageLimitDraft, commitMessageLimit)
              }
              onBlur={() => commitMessageLimit(messageLimitDraft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              helperText={`−1 disables. Suggested when on: ${DEFAULT_CHAT_CONTINUE_MESSAGE_LIMIT}.`}
              inputProps={{ step: 1 }}
              fullWidth
            />
            <TextField
              label="Token limit"
              type="number"
              size="small"
              value={tokenLimitDraft}
              onChange={(e) =>
                onLimitDraftChange(e.target.value, setTokenLimitDraft, commitTokenLimit)
              }
              onBlur={() => commitTokenLimit(tokenLimitDraft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              helperText={`−1 disables. Suggested when on: ${DEFAULT_CHAT_CONTINUE_TOKEN_LIMIT}. Uses recorded LLM usage.`}
              inputProps={{ step: 1 }}
              fullWidth
            />
          </Box>
          {limitsStatus && (
            <Typography sx={{ mt: 1.5, fontSize: 13, color: '#2F6B52' }}>{limitsStatus}</Typography>
          )}
        </Box>

        <Box className="panel" sx={{ mt: 2.5 }}>
          <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>
            Charts submitted per topic
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 14, color: '#4A4560' }}>
            Each row is a topic. On a chat turn we use the chips you tap (or we infer the topic from
            your question; otherwise the <em>General guidance</em> row). Only the checked charts on
            those rows are sent — not the whole matrix. Lagna is always included. Family charts need
            the Family column checked <em>and</em> an @mention. Download raw → MATRIX_MANIFEST shows
            requested vs actually included charts for that reply.
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
