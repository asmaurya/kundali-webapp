import React, { useEffect, useMemo, useState } from 'react';
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
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { deleteCustomLlmProvider, fetchLlmLab, probeLlmLab, resetLlmLab, saveLlmLab } from '../api';
import { getSession } from '../betaSession';

const FALLBACK_PROVIDERS = [
  {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    secretName: 'NVIDIA_API_KEY',
    defaultModel: 'nvidia/nemotron-3.5-bolt-e4b',
    keyLocked: true,
    custom: false,
    apiKeySet: true,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    secretName: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
    keyLocked: false,
    custom: false,
  },
  {
    id: 'claude',
    label: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    secretName: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-5-5',
    keyLocked: false,
    custom: false,
  },
];

const ADD_CUSTOM = '__add_custom__';

const emptyForm = {
  masterPrompt: '',
  provider: 'nvidia',
  model: '',
  baseUrl: '',
  apiKey: '',
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: 512,
  captureThinking: true,
  showThinking: false,
  thinkingEffort: 'high',
};

const emptyChartInference = {
  enabled: false,
  mode: 'llm_only',
  baseUrl: '',
  method: 'POST',
  headersJson: '{\n  "Content-Type": "application/json"\n}',
  bodyTemplate:
    '{\n  "date": "{{birth.date}}",\n  "time": "{{birth.time}}",\n  "lat": {{birth.lat}},\n  "lon": {{birth.lon}},\n  "tz": "{{birth.tz}}",\n  "place": "{{birth.place}}",\n  "question": "{{question}}"\n}',
  responseJsonPath: '',
  answerJsonPath: '',
  secretName: 'CHART_INFERENCE_KEY',
};

const PIPELINE_MODE_OPTIONS = [
  {
    value: 'llm_only',
    label: 'LLM only',
    help: 'Skip inference. Answer with the Lab LLM only.',
  },
  {
    value: 'inference_then_llm',
    label: 'Inference → LLM',
    help: 'Call the inference API first, append its result into chart context, then call the Lab LLM.',
  },
  {
    value: 'inference_only',
    label: 'Inference only (no Lab LLM)',
    help: 'Call the inference API (it may be an LLM itself) and use its reply as the chat answer. Lab LLM is not called.',
  },
];

function normalizePipelineMode(cfg) {
  const mode = String(cfg?.mode || '').trim();
  if (PIPELINE_MODE_OPTIONS.some((o) => o.value === mode)) return mode;
  if (cfg?.enabled) return 'inference_then_llm';
  return 'llm_only';
}

function pickProviderParams(form) {
  return {
    model: form.model,
    topP: form.topP,
    frequencyPenalty: form.frequencyPenalty,
    presencePenalty: form.presencePenalty,
    maxTokens: form.maxTokens,
    captureThinking: form.captureThinking,
    showThinking: form.showThinking,
    thinkingEffort: form.thinkingEffort || 'high',
  };
}

function profileDefaults(providerId) {
  if (providerId === 'claude') {
    return {
      model: 'claude-sonnet-5-5',
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      maxTokens: 4096,
      captureThinking: true,
      showThinking: false,
      thinkingEffort: 'high',
    };
  }
  if (providerId === 'openai') {
    return {
      model: 'gpt-4o-mini',
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      maxTokens: 1024,
      captureThinking: true,
      showThinking: false,
      thinkingEffort: 'high',
    };
  }
  return {
    model: '',
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxTokens: 512,
    captureThinking: true,
    showThinking: false,
    thinkingEffort: 'high',
  };
}

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
  if (usage.thinkingTokens != null) lines.push(`thinking_tokens: ${usage.thinkingTokens}`);
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
    apiKeyRequired: false,
    keyLocked: true,
    providerCustom: false,
    defaults: null,
    providers: FALLBACK_PROVIDERS,
    baseUrl: '',
    secretName: 'NVIDIA_API_KEY',
    cloudflareSecretsWritable: false,
  });
  const [addingCustom, setAddingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState({
    label: '',
    baseUrl: '',
    api: 'openai',
    defaultModel: '',
    apiKey: '',
  });
  const [trace, setTrace] = useState(null);
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('kundali.adminToken') || '');
  const [probeQuestion, setProbeQuestion] = useState('What does my 10th house suggest for career pace?');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [probing, setProbing] = useState(false);
  const [providerProfiles, setProviderProfiles] = useState({});
  const [chartInference, setChartInference] = useState(emptyChartInference);

  const session = getSession();
  const providers = meta.providers?.length ? meta.providers : FALLBACK_PROVIDERS;
  const selected = useMemo(
    () => providers.find((p) => p.id === form.provider) || providers[0],
    [providers, form.provider]
  );
  const isNvidia = selected?.id === 'nvidia' || selected?.keyLocked;
  const isCustom = Boolean(selected?.custom || meta.providerCustom);
  const isClaude = selected?.id === 'claude' || selected?.api === 'anthropic';
  const supportsOpenAiPenalties = !isClaude;

  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const patchChart = (key, value) => setChartInference((prev) => ({ ...prev, [key]: value }));

  const applyLab = (lab, nextTrace) => {
    setAddingCustom(false);
    const profiles = lab.providerProfiles && typeof lab.providerProfiles === 'object' ? lab.providerProfiles : {};
    setProviderProfiles(profiles);
    {
      const ci = { ...emptyChartInference, ...(lab.chartInference || {}) };
      ci.mode = normalizePipelineMode(ci);
      ci.enabled = ci.mode !== 'llm_only';
      setChartInference(ci);
    }
    setForm({
      masterPrompt: lab.masterPrompt || '',
      provider: lab.provider || 'nvidia',
      model: lab.model || '',
      baseUrl: lab.providerCustom ? lab.baseUrl || '' : '',
      apiKey: '',
      topP: Number(lab.topP ?? 1),
      frequencyPenalty: Number(lab.frequencyPenalty ?? 0),
      presencePenalty: Number(lab.presencePenalty ?? 0),
      maxTokens: Number(lab.maxTokens ?? 512),
      captureThinking: lab.captureThinking !== false,
      showThinking: Boolean(lab.showThinking),
      thinkingEffort: lab.thinkingEffort || 'high',
    });
    setMeta({
      apiKeyMasked: lab.apiKeyMasked || '',
      apiKeySet: Boolean(lab.apiKeySet),
      apiKeyRequired: Boolean(lab.apiKeyRequired),
      keyLocked: Boolean(lab.keyLocked),
      providerCustom: Boolean(lab.providerCustom),
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

  const onProviderChange = (value) => {
    if (value === ADD_CUSTOM) {
      setAddingCustom(true);
      setForm((prev) => ({ ...prev, apiKey: '' }));
      return;
    }
    setAddingCustom(false);
    const next = providers.find((p) => p.id === value) || providers[0];
    setForm((prev) => {
      const savedProfiles = {
        ...providerProfiles,
        [prev.provider]: pickProviderParams(prev),
      };
      setProviderProfiles(savedProfiles);
      const profile = {
        ...profileDefaults(next.id),
        ...(savedProfiles[next.id] || {}),
        model: savedProfiles[next.id]?.model || next.defaultModel || profileDefaults(next.id).model,
      };
      return {
        ...prev,
        provider: next.id,
        baseUrl: next.custom ? next.baseUrl || '' : '',
        apiKey: '',
        ...profile,
      };
    });
    setMeta((prev) => ({
      ...prev,
      apiKeySet: Boolean(next.apiKeySet),
      apiKeyRequired: next.id !== 'nvidia' && !next.apiKeySet,
      keyLocked: Boolean(next.keyLocked),
      providerCustom: Boolean(next.custom),
      baseUrl: next.baseUrl || '',
      secretName: next.secretName || '',
      apiKeyMasked: next.apiKeySet
        ? next.id === 'nvidia'
          ? '•••• permanent Cloudflare secret (NVIDIA_API_KEY)'
          : `•••• Cloudflare secret (${next.secretName})`
        : '',
    }));
  };

  const onSave = async () => {
    setSaving(true);
    setError('');
    sessionStorage.setItem('kundali.adminToken', adminToken || '');

    if (addingCustom) {
      if (!customDraft.label.trim() || !customDraft.baseUrl.trim() || !customDraft.apiKey.trim()) {
        setSaving(false);
        setError('Custom provider needs a name, base URL, and API key.');
        return;
      }
      const result = await saveLlmLab(session, adminToken, {
        masterPrompt: form.masterPrompt,
        model: customDraft.defaultModel || form.model,
        topP: form.topP,
        frequencyPenalty: form.frequencyPenalty,
        presencePenalty: form.presencePenalty,
        maxTokens: form.maxTokens,
        captureThinking: form.captureThinking,
        showThinking: form.showThinking,
        apiKey: customDraft.apiKey.trim(),
        customProvider: {
          label: customDraft.label.trim(),
          baseUrl: customDraft.baseUrl.trim(),
          api: customDraft.api,
          defaultModel: customDraft.defaultModel.trim(),
        },
      });
      setSaving(false);
      if (!result.ok) {
        setError(result.error || 'Save failed.');
        return;
      }
      setCustomDraft({ label: '', baseUrl: '', api: 'openai', defaultModel: '', apiKey: '' });
      if (result.lab) applyLab(result.lab, trace);
      setStatus(result.note || 'Custom provider added. Key stored in Cloudflare.');
      return;
    }

    if (!isNvidia && meta.apiKeyRequired && !form.apiKey.trim()) {
      setSaving(false);
      setError(`API key required for ${selected?.label || 'this provider'} before saving.`);
      return;
    }

    const profiles = {
      ...providerProfiles,
      [form.provider]: pickProviderParams(form),
    };
    setProviderProfiles(profiles);

    const payload = {
      masterPrompt: form.masterPrompt,
      provider: form.provider,
      model: form.model,
      topP: form.topP,
      frequencyPenalty: form.frequencyPenalty,
      presencePenalty: form.presencePenalty,
      maxTokens: form.maxTokens,
      captureThinking: form.captureThinking,
      showThinking: form.showThinking,
      thinkingEffort: form.thinkingEffort,
      providerProfiles: profiles,
      chartInference,
    };
    if (isCustom) payload.baseUrl = form.baseUrl.trim();
    // NVIDIA: never send a key. Others: only send when user pastes a new one.
    if (!isNvidia && form.apiKey.trim()) payload.apiKey = form.apiKey.trim();

    const result = await saveLlmLab(session, adminToken, payload);
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
          : 'Saved. Keys were left unchanged.')
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
    setStatus(result.note || 'Reset lab defaults. Keys and custom providers kept.');
  };

  const onDeleteCustom = async () => {
    if (!isCustom || !form.provider) return;
    setSaving(true);
    setError('');
    const result = await deleteCustomLlmProvider(session, adminToken, form.provider);
    setSaving(false);
    if (!result.ok) {
      setError(result.error || 'Could not remove custom provider.');
      return;
    }
    if (result.lab) applyLab(result.lab, trace);
    setStatus('Custom provider removed. Reverted selection to NVIDIA.');
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

  const providerHelper = isNvidia
    ? 'Permanent NVIDIA key from Cloudflare — no key entry needed. Switch back here anytime.'
    : isCustom
      ? `${selected?.label || 'Custom'} · set base URL below`
      : `${selected?.label || ''} · ${selected?.baseUrl || meta.baseUrl || ''}`;

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
          NVIDIA uses the permanent Cloudflare secret. Other providers keep a saved key until you paste a
          new one. Custom providers also store their own base URL.
        </Typography>

        <Box className="panel" sx={{ mt: 3, display: 'grid', gap: 2.5 }}>
          <TextField
            label="Admin token (if required)"
            type="password"
            size="small"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            helperText="Needed only when ADMIN_TOKEN is set on the Worker."
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
                  value={addingCustom ? ADD_CUSTOM : form.provider}
                  onChange={(e) => onProviderChange(e.target.value)}
                  helperText={providerHelper}
                >
                  {providers.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.label}
                      {p.apiKeySet ? ' · key saved' : p.id === 'nvidia' ? '' : ' · key needed'}
                    </MenuItem>
                  ))}
                  <MenuItem value={ADD_CUSTOM}>
                    <AddIcon sx={{ fontSize: 16, mr: 0.75 }} />
                    Add custom provider…
                  </MenuItem>
                </TextField>
                <TextField
                  label="Model"
                  size="small"
                  value={addingCustom ? customDraft.defaultModel : form.model}
                  onChange={(e) =>
                    addingCustom
                      ? setCustomDraft((prev) => ({ ...prev, defaultModel: e.target.value }))
                      : patch('model', e.target.value)
                  }
                  placeholder={selected?.defaultModel || 'model-id'}
                  helperText="Exact model id for the selected provider."
                />
              </Box>

              {addingCustom && (
                <Box sx={{ display: 'grid', gap: 1.5, p: 2, borderRadius: 2, border: '1px dashed #CFC4EA', bgcolor: '#F7F4FB' }}>
                  <Typography sx={{ fontWeight: 700, color: '#1E1B2E' }}>New custom provider</Typography>
                  <TextField
                    label="Display name"
                    size="small"
                    value={customDraft.label}
                    onChange={(e) => setCustomDraft((prev) => ({ ...prev, label: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="LLM API base URL"
                    size="small"
                    value={customDraft.baseUrl}
                    onChange={(e) => setCustomDraft((prev) => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                    fullWidth
                    helperText="OpenAI-compatible hosts use /chat/completions under this base."
                  />
                  <TextField
                    select
                    label="API style"
                    size="small"
                    value={customDraft.api}
                    onChange={(e) => setCustomDraft((prev) => ({ ...prev, api: e.target.value }))}
                  >
                    <MenuItem value="openai">OpenAI-compatible</MenuItem>
                    <MenuItem value="anthropic">Anthropic Messages</MenuItem>
                  </TextField>
                  <TextField
                    label="API key (saved to Cloudflare on Save)"
                    type="password"
                    size="small"
                    value={customDraft.apiKey}
                    onChange={(e) => setCustomDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
                    fullWidth
                    required
                  />
                </Box>
              )}

              {!addingCustom && isCustom && (
                <TextField
                  label="LLM API base URL"
                  size="small"
                  value={form.baseUrl}
                  onChange={(e) => patch('baseUrl', e.target.value)}
                  placeholder="https://api.example.com/v1"
                  fullWidth
                  helperText="Shown only for custom providers."
                />
              )}

              {!addingCustom && isNvidia && (
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#EDF4F0', border: '1px solid #C5DCCF' }}>
                  <Typography sx={{ fontSize: 13, color: '#2F6B52', fontWeight: 600 }}>
                    NVIDIA key is permanent
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 13, color: '#3A3550' }}>
                    Using Cloudflare secret <code>NVIDIA_API_KEY</code>
                    {meta.apiKeySet ? ` (${meta.apiKeyMasked})` : ' — not detected on Worker'}.
                    It cannot be changed from this page. Select NVIDIA anytime to revert to it without
                    submitting a key.
                  </Typography>
                </Box>
              )}

              {!addingCustom && !isNvidia && (
                <TextField
                  label={
                    meta.apiKeySet
                      ? `Replace API key (optional) → ${meta.secretName || selected?.secretName}`
                      : `API key required → ${meta.secretName || selected?.secretName}`
                  }
                  type="password"
                  size="small"
                  value={form.apiKey}
                  onChange={(e) => patch('apiKey', e.target.value)}
                  fullWidth
                  helperText={
                    meta.apiKeySet
                      ? `Saved key on file (${meta.apiKeyMasked}). Leave blank to keep it; paste a new key only to override.`
                      : 'Required once. Saved as a Cloudflare secret and reused on later saves until you replace it.'
                  }
                />
              )}

              {isClaude && (
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F7F4FB', border: '1px solid #E6DEEF' }}>
                  <Typography sx={{ fontSize: 13, color: '#3A3550' }}>
                    Claude mapping: <code>max_tokens</code>, thinking via{' '}
                    <code>thinking.type.adaptive</code> (or <code>enabled</code> +{' '}
                    <code>budget_tokens</code> on older models). Frequency/presence penalties are not
                    sent. <code>top_p</code> is omitted while thinking is on. Use Max tokens ≥ 4096
                    when capturing thinking.
                  </Typography>
                </Box>
              )}

              <Typography sx={{ fontSize: 12, color: '#6A6580' }}>
                Settings below are stored per provider — switch NVIDIA / OpenAI / Claude without
                losing each profile.
              </Typography>

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1E1B2E' }}>
                    Top P · {form.topP.toFixed(2)}
                    {isClaude && form.captureThinking ? ' (ignored while thinking)' : ''}
                  </Typography>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={form.topP}
                    disabled={isClaude && form.captureThinking}
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
                  helperText={isClaude ? 'Raised automatically if thinking needs more headroom' : undefined}
                  slotProps={{ htmlInput: { min: 64, max: 16384 } }}
                />
                {supportsOpenAiPenalties && (
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
                )}
                {supportsOpenAiPenalties && (
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
                )}
                {isClaude && (
                  <TextField
                    select
                    label="Thinking effort (adaptive)"
                    size="small"
                    value={form.thinkingEffort || 'high'}
                    onChange={(e) => patch('thinkingEffort', e.target.value)}
                    disabled={!form.captureThinking}
                    helperText="Maps to output_config.effort on Claude 4.7+ / 5.x"
                  >
                    {['low', 'medium', 'high', 'xhigh', 'max'].map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
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
                  label={
                    isClaude
                      ? 'Show thinking text (Claude display: summarized vs omitted)'
                      : 'Include thinking in chat API payload (console always shows captured thinking)'
                  }
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
                  {saving ? 'Saving…' : addingCustom ? 'Save custom provider' : 'Save LLM settings'}
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
                {!addingCustom && isCustom && (
                  <Button
                    color="inherit"
                    startIcon={<DeleteOutlinedIcon />}
                    onClick={onDeleteCustom}
                    disabled={saving}
                    sx={{ color: '#9A4A63' }}
                  >
                    Remove custom
                  </Button>
                )}
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
            Answer pipeline &amp; chart inference
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#4A4560' }}>
            Choose how chat answers are produced. Map birth/chart fields with{' '}
            <code>{'{{birth.date}}'}</code>, <code>{'{{birth.time}}'}</code>,{' '}
            <code>{'{{birth.lat}}'}</code>, <code>{'{{birth.lon}}'}</code>,{' '}
            <code>{'{{birth.tz}}'}</code>, <code>{'{{birth.place}}'}</code>,{' '}
            <code>{'{{chart.lagna}}'}</code>, <code>{'{{chart.moonSign}}'}</code>,{' '}
            <code>{'{{chart.dasha}}'}</code>, <code>{'{{question}}'}</code>,{' '}
            <code>{'{{locale}}'}</code>. Secrets: <code>{'{{secret.NAME}}'}</code>.
          </Typography>
          <TextField
            select
            label="Pipeline mode"
            size="small"
            value={normalizePipelineMode(chartInference)}
            onChange={(e) => {
              const mode = e.target.value;
              setChartInference((prev) => ({
                ...prev,
                mode,
                enabled: mode !== 'llm_only',
              }));
            }}
            fullWidth
            helperText={
              PIPELINE_MODE_OPTIONS.find((o) => o.value === normalizePipelineMode(chartInference))
                ?.help
            }
          >
            {PIPELINE_MODE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Inference API URL"
            size="small"
            value={chartInference.baseUrl}
            onChange={(e) => patchChart('baseUrl', e.target.value)}
            fullWidth
            placeholder="https://api.example.com/v1/chart"
            disabled={normalizePipelineMode(chartInference) === 'llm_only'}
          />
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField
              select
              label="Method"
              size="small"
              value={chartInference.method || 'POST'}
              onChange={(e) => patchChart('method', e.target.value)}
              disabled={normalizePipelineMode(chartInference) === 'llm_only'}
            >
              <MenuItem value="POST">POST</MenuItem>
              <MenuItem value="GET">GET</MenuItem>
            </TextField>
            <TextField
              label="Cloudflare secret name"
              size="small"
              value={chartInference.secretName || ''}
              onChange={(e) => patchChart('secretName', e.target.value)}
              disabled={normalizePipelineMode(chartInference) === 'llm_only'}
              helperText="Referenced as {{secret.<name>}} in headers/body"
            />
          </Box>
          <TextField
            label="Headers JSON"
            size="small"
            value={chartInference.headersJson}
            onChange={(e) => patchChart('headersJson', e.target.value)}
            fullWidth
            multiline
            minRows={3}
            disabled={normalizePipelineMode(chartInference) === 'llm_only'}
            sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
          />
          <TextField
            label="Body template"
            size="small"
            value={chartInference.bodyTemplate}
            onChange={(e) => patchChart('bodyTemplate', e.target.value)}
            fullWidth
            multiline
            minRows={5}
            disabled={normalizePipelineMode(chartInference) === 'llm_only'}
            sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
          />
          <TextField
            label="Context JSON path (Inference → LLM)"
            size="small"
            value={chartInference.responseJsonPath}
            onChange={(e) => patchChart('responseJsonPath', e.target.value)}
            fullWidth
            disabled={normalizePipelineMode(chartInference) !== 'inference_then_llm'}
            helperText="Slice of the inference response appended into LLM chart context (e.g. data.chart)"
          />
          <TextField
            label="Answer JSON path (Inference only)"
            size="small"
            value={chartInference.answerJsonPath}
            onChange={(e) => patchChart('answerJsonPath', e.target.value)}
            fullWidth
            disabled={normalizePipelineMode(chartInference) !== 'inference_only'}
            helperText="Where the reply text lives (e.g. answer or choices.0.message.content). Empty auto-detects common keys."
          />
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
