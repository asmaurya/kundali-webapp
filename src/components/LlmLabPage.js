import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { fetchLlmLab, probeLlmLab, resetLlmLab, saveLlmLab } from '../api';
import { getSession } from '../betaSession';

const FALLBACK_PROVIDERS = [
  {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    secretName: 'NVIDIA_API_KEY',
    defaultModel: 'nvidia/nemotron-3.5-bolt-e4b',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    secretName: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'claude',
    label: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    secretName: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-20250514',
  },
];

const emptyForm = {
  masterPrompt: '',
  provider: 'nvidia',
  model: '',
  apiKey: '',
  temperature: 0.4,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: 280,
  captureThinking: true,
  showThinking: false,
};

const CONSOLE_COLORS = {
  master: '#C4B5FD',
  context: '#7DD3FC',
  question: '#FCD34D',
  params: '#A7F3D0',
  thinking: '#F9A8D4',
  output: '#86EFAC',
  metrics: '#FDBA74',
  error: '#FCA5A5',
  meta: '#94A3B8',
};

function ConsoleBlock({ label, color, children }) {
  if (children == null || children === '') return null;
  return (
    <Box sx={{ mb: 1.25 }}>
      <Typography
        component="div"
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color,
          mb: 0.35,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}
      >
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.25,
          borderRadius: 1,
          bgcolor: 'rgba(15, 23, 42, 0.72)',
          borderLeft: `3px solid ${color}`,
          color: '#E2E8F0',
          fontSize: 12,
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function formatUsage(usage) {
  if (!usage) return '';
  const lines = [];
  if (usage.promptTokens != null) lines.push(`prompt_tokens: ${usage.promptTokens}`);
  if (usage.completionTokens != null) lines.push(`completion_tokens: ${usage.completionTokens}`);
  if (usage.totalTokens != null) lines.push(`total_tokens: ${usage.totalTokens}`);
  const raw = usage.raw || {};
  Object.keys(raw).forEach((key) => {
    if (['prompt_tokens', 'completion_tokens', 'total_tokens', 'input_tokens', 'output_tokens'].includes(key)) {
      return;
    }
    lines.push(`${key}: ${JSON.stringify(raw[key])}`);
  });
  return lines.join('\n');
}

function LlmLabPage({ onBack }) {
  const [form, setForm] = useState(emptyForm);
  const [meta, setMeta] = useState({
    apiKeyMasked: '',
    apiKeySet: false,
    defaults: null,
    providers: FALLBACK_PROVIDERS,
    baseUrl: '',
    secretName: '',
    cloudflareSecretsWritable: false,
  });
  const [trace, setTrace] = useState(null);
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('kundali.adminToken') || '');
  const [probeQuestion, setProbeQuestion] = useState('What does my 10th house suggest for career pace?');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [probing, setProbing] = useState(false);

  const session = getSession();
  const providers = meta.providers?.length ? meta.providers : FALLBACK_PROVIDERS;
  const providerMeta = providers.find((p) => p.id === form.provider) || providers[0];

  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const applyLab = (lab, nextTrace) => {
    setForm({
      masterPrompt: lab.masterPrompt || '',
      provider: lab.provider || 'nvidia',
      model: lab.model || '',
      apiKey: '',
      temperature: Number(lab.temperature ?? 0.4),
      topP: Number(lab.topP ?? 1),
      frequencyPenalty: Number(lab.frequencyPenalty ?? 0),
      presencePenalty: Number(lab.presencePenalty ?? 0),
      maxTokens: Number(lab.maxTokens ?? 280),
      captureThinking: lab.captureThinking !== false,
      showThinking: Boolean(lab.showThinking),
    });
    setMeta({
      apiKeyMasked: lab.apiKeyMasked || '',
      apiKeySet: Boolean(lab.apiKeySet),
      defaults: lab.defaults || null,
      providers: lab.providers?.length ? lab.providers : FALLBACK_PROVIDERS,
      baseUrl: lab.baseUrl || '',
      secretName: lab.secretName || '',
      cloudflareSecretsWritable: Boolean(lab.cloudflareSecretsWritable),
      updatedAt: lab.updatedAt || null,
    });
    if (nextTrace !== undefined) setTrace(nextTrace);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    const result = await fetchLlmLab(session, adminToken);
    if (!result.ok) {
      setError(result.error || 'Could not load LLM lab settings.');
      setLoading(false);
      return;
    }
    applyLab(result.lab || {}, result.trace || null);
    setStatus(
      result.lab?.updatedAt
        ? `Last saved ${new Date(result.lab.updatedAt).toLocaleString()}`
        : 'Using Worker defaults'
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    setSaving(true);
    setError('');
    sessionStorage.setItem('kundali.adminToken', adminToken || '');
    const result = await saveLlmLab(session, adminToken, {
      masterPrompt: form.masterPrompt,
      provider: form.provider,
      model: form.model,
      temperature: form.temperature,
      topP: form.topP,
      frequencyPenalty: form.frequencyPenalty,
      presencePenalty: form.presencePenalty,
      maxTokens: form.maxTokens,
      captureThinking: form.captureThinking,
      showThinking: form.showThinking,
      apiKey: form.apiKey.trim() ? form.apiKey.trim() : undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || 'Save failed.');
      return;
    }
    setForm((prev) => ({ ...prev, apiKey: '' }));
    if (result.lab) applyLab(result.lab, trace);
    setStatus(
      result.note ||
        (result.secretSaved
          ? `API key stored as Cloudflare secret ${result.secretName}.`
          : 'Saved. New chats will use these LLM settings.')
    );
  };

  const onReset = async () => {
    setSaving(true);
    setError('');
    const result = await resetLlmLab(session, adminToken);
    setSaving(false);
    if (!result.ok) {
      setError(result.error || 'Reset failed.');
      return;
    }
    await load();
    setStatus('Reset lab defaults (Cloudflare API secrets were left unchanged).');
  };

  const onProbe = async () => {
    setProbing(true);
    setError('');
    sessionStorage.setItem('kundali.adminToken', adminToken || '');
    const result = await probeLlmLab(session, adminToken, { question: probeQuestion });
    setProbing(false);
    if (result.trace) setTrace(result.trace);
    if (!result.ok) {
      setError(result.error || 'Probe failed.');
      return;
    }
    setStatus('Probe complete — console updated with the last LLM exchange.');
  };

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(920px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}>
          Back to Settings
        </Button>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          LLM Lab
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          Choose a provider (base URL is fixed per provider). API keys are written to Cloudflare Worker
          secrets and never kept in this page’s storage.
        </Typography>

        <Box className="panel" sx={{ mt: 3, display: 'grid', gap: 2.5 }}>
          <TextField
            label="Admin token (if required)"
            type="password"
            size="small"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            helperText="Needed only when ADMIN_TOKEN is set on the Worker. Leave blank for open beta admin."
            fullWidth
          />

          {loading ? (
            <Typography sx={{ color: '#6A6580' }}>Loading lab settings…</Typography>
          ) : (
            <>
              <TextField
                label="Master chat prompt"
                value={form.masterPrompt}
                onChange={(e) => patch('masterPrompt', e.target.value)}
                multiline
                minRows={5}
                fullWidth
                helperText={
                  meta.defaults?.masterPrompt
                    ? 'Leave blank to use the Worker MASTER_PROMPT default.'
                    : 'Instructs every Astro Chat answer.'
                }
                placeholder={meta.defaults?.masterPrompt || 'Ground every answer in the querent kundali JSON…'}
              />

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <TextField
                  select
                  label="Provider"
                  size="small"
                  value={form.provider}
                  onChange={(e) => {
                    const next = providers.find((p) => p.id === e.target.value) || providers[0];
                    setForm((prev) => ({
                      ...prev,
                      provider: next.id,
                      model: prev.model || next.defaultModel || '',
                      apiKey: '',
                    }));
                  }}
                  helperText={`${providerMeta?.label || form.provider} · ${providerMeta?.baseUrl || meta.baseUrl || ''}`}
                >
                  {providers.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Model"
                  size="small"
                  value={form.model}
                  onChange={(e) => patch('model', e.target.value)}
                  placeholder={providerMeta?.defaultModel || 'model-id'}
                  helperText="Exact model id for the selected provider."
                />
              </Box>

              <TextField
                label={`API key → Cloudflare secret (${providerMeta?.secretName || '…'})`}
                type="password"
                size="small"
                value={form.apiKey}
                onChange={(e) => patch('apiKey', e.target.value)}
                fullWidth
                helperText={
                  meta.cloudflareSecretsWritable
                    ? meta.apiKeySet
                      ? `Already set as ${meta.apiKeyMasked || providerMeta?.secretName}. Enter a new key to replace it in Cloudflare; the value is not stored on this page.`
                      : `On Save, the key is written to Cloudflare secret ${providerMeta?.secretName} and cleared from this form.`
                    : 'Cloudflare secret write is not configured (CF_ACCOUNT_ID / CF_API_TOKEN missing on Worker).'
                }
              />

              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E1B2E' }}>
                  Temperature · {form.temperature.toFixed(2)}
                </Typography>
                <Slider
                  min={0}
                  max={2}
                  step={0.05}
                  value={form.temperature}
                  onChange={(_e, value) => patch('temperature', value)}
                  sx={{ color: '#6B4FA0' }}
                />
              </Box>

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E1B2E' }}>
                    Top P · {form.topP.toFixed(2)}
                  </Typography>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={form.topP}
                    onChange={(_e, value) => patch('topP', value)}
                    sx={{ color: '#6B4FA0' }}
                  />
                </Box>
                <TextField
                  label="Max tokens"
                  type="number"
                  size="small"
                  value={form.maxTokens}
                  onChange={(e) => patch('maxTokens', Number(e.target.value))}
                  slotProps={{ htmlInput: { min: 64, max: 8192 } }}
                />
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E1B2E' }}>
                    Frequency penalty · {form.frequencyPenalty.toFixed(2)}
                  </Typography>
                  <Slider
                    min={-2}
                    max={2}
                    step={0.05}
                    value={form.frequencyPenalty}
                    onChange={(_e, value) => patch('frequencyPenalty', value)}
                    sx={{ color: '#6B4FA0' }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E1B2E' }}>
                    Presence penalty · {form.presencePenalty.toFixed(2)}
                  </Typography>
                  <Slider
                    min={-2}
                    max={2}
                    step={0.05}
                    value={form.presencePenalty}
                    onChange={(_e, value) => patch('presencePenalty', value)}
                    sx={{ color: '#6B4FA0' }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.captureThinking}
                      onChange={(e) => patch('captureThinking', e.target.checked)}
                      color="secondary"
                    />
                  }
                  label="Capture model thinking separately from the answer"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.showThinking}
                      onChange={(e) => patch('showThinking', e.target.checked)}
                      color="secondary"
                      disabled={!form.captureThinking}
                    />
                  }
                  label="Include thinking in chat API payload (console always shows captured thinking)"
                />
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveOutlinedIcon />}
                  onClick={onSave}
                  disabled={saving}
                  sx={{ bgcolor: '#6B4FA0', '&:hover': { bgcolor: '#5B3FA0' } }}
                >
                  {saving ? 'Saving…' : 'Save LLM settings'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={onReset}
                  disabled={saving}
                  sx={{ borderColor: '#CFC4EA', color: '#5B3FA0' }}
                >
                  Reset defaults
                </Button>
                <Button size="small" onClick={load} disabled={loading || saving} sx={{ color: '#6A6580' }}>
                  Reload
                </Button>
              </Box>

              {status && (
                <Typography sx={{ fontSize: 13, color: '#2F6B52' }}>{status}</Typography>
              )}
              {error && (
                <Typography sx={{ fontSize: 13, color: '#9A4A63' }}>{error}</Typography>
              )}
            </>
          )}
        </Box>

        <Box className="panel" sx={{ mt: 2.5, display: 'grid', gap: 1.5 }}>
          <Typography component="h3" sx={{ fontWeight: 700, color: '#1E1B2E', fontSize: 18 }}>
            LLM console
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#4A4560' }}>
            Color-coded view of the last request submitted to the model and the response received
            (including thinking and token metrics). Updated by live chats and by Probe below.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              label="Probe question"
              value={probeQuestion}
              onChange={(e) => setProbeQuestion(e.target.value)}
              sx={{ flex: '1 1 260px' }}
            />
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={onProbe}
              disabled={probing || loading}
              sx={{ bgcolor: '#2F6B52', '&:hover': { bgcolor: '#245540' } }}
            >
              {probing ? 'Running…' : 'Probe LLM'}
            </Button>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={load}
              disabled={loading}
              sx={{ color: '#6A6580' }}
            >
              Refresh console
            </Button>
          </Box>

          <Box
            sx={{
              mt: 0.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: '#0F172A',
              minHeight: 220,
              maxHeight: 520,
              overflow: 'auto',
            }}
          >
            {!trace && (
              <Typography sx={{ color: CONSOLE_COLORS.meta, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>
                No LLM exchange captured yet. Send a chat message or run Probe.
              </Typography>
            )}
            {trace && (
              <>
                <ConsoleBlock label="Meta" color={CONSOLE_COLORS.meta}>
                  {[
                    `at: ${trace.at || '—'}`,
                    `ok: ${trace.ok ? 'yes' : 'no'}`,
                    `provider: ${trace.provider || '—'}`,
                    `model: ${trace.model || '—'}`,
                    `base_url: ${trace.baseUrl || '—'}`,
                    `api: ${trace.api || '—'}`,
                    trace.latencyMs != null ? `latency_ms: ${trace.latencyMs}` : null,
                    trace.finishReason ? `finish: ${trace.finishReason}` : null,
                    trace.historyTurns != null ? `history_turns: ${trace.historyTurns}` : null,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                </ConsoleBlock>
                <ConsoleBlock label="Parameters" color={CONSOLE_COLORS.params}>
                  {trace.params ? JSON.stringify(trace.params, null, 2) : ''}
                </ConsoleBlock>
                <ConsoleBlock label="Master prompt" color={CONSOLE_COLORS.master}>
                  {trace.masterPrompt}
                </ConsoleBlock>
                <ConsoleBlock label="Context submitted" color={CONSOLE_COLORS.context}>
                  {trace.context}
                </ConsoleBlock>
                <ConsoleBlock label="Question asked" color={CONSOLE_COLORS.question}>
                  {trace.question}
                </ConsoleBlock>
                {trace.error && (
                  <ConsoleBlock label="Error" color={CONSOLE_COLORS.error}>
                    {trace.error}
                  </ConsoleBlock>
                )}
                <ConsoleBlock label="Thinking received" color={CONSOLE_COLORS.thinking}>
                  {trace.thinking || (trace.ok ? '(none captured)' : '')}
                </ConsoleBlock>
                <ConsoleBlock label="Output response" color={CONSOLE_COLORS.output}>
                  {trace.output}
                </ConsoleBlock>
                <ConsoleBlock label="Tokens & metrics" color={CONSOLE_COLORS.metrics}>
                  {formatUsage(trace.usage) || (trace.ok ? '(provider did not return usage)' : '')}
                </ConsoleBlock>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default LlmLabPage;
