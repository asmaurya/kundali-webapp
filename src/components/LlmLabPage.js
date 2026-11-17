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
import { fetchLlmLab, resetLlmLab, saveLlmLab } from '../api';
import { getSession } from '../betaSession';

const PROVIDERS = [
  {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    models: [
      'nvidia/nemotron-3.5-bolt-e4b',
      'meta/llama-3.1-70b-instruct',
      'nvidia/llama-3.1-nemotron-70b-instruct',
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
  },
];

const emptyForm = {
  masterPrompt: '',
  provider: 'nvidia',
  baseUrl: '',
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

function LlmLabPage({ onBack }) {
  const [form, setForm] = useState(emptyForm);
  const [meta, setMeta] = useState({ apiKeyMasked: '', apiKeySet: false, defaults: null });
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('kundali.adminToken') || '');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const session = getSession();
  const providerMeta = PROVIDERS.find((p) => p.id === form.provider) || PROVIDERS[0];

  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = async () => {
    setLoading(true);
    setError('');
    const result = await fetchLlmLab(session, adminToken);
    if (!result.ok) {
      setError(result.error || 'Could not load LLM lab settings.');
      setLoading(false);
      return;
    }
    const lab = result.lab || {};
    setForm({
      masterPrompt: lab.masterPrompt || '',
      provider: lab.provider || 'nvidia',
      baseUrl: lab.baseUrl || '',
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
      updatedAt: lab.updatedAt || null,
    });
    setStatus(lab.updatedAt ? `Last saved ${new Date(lab.updatedAt).toLocaleString()}` : 'Using Worker defaults');
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
      ...form,
      // omit blank apiKey so server keeps existing override
      apiKey: form.apiKey.trim() ? form.apiKey.trim() : undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || 'Save failed.');
      return;
    }
    setStatus('Saved. New chats will use these LLM settings.');
    setForm((prev) => ({ ...prev, apiKey: '' }));
    if (result.lab) {
      setMeta({
        apiKeyMasked: result.lab.apiKeyMasked || '',
        apiKeySet: Boolean(result.lab.apiKeySet),
        defaults: result.lab.defaults || null,
        updatedAt: result.lab.updatedAt || null,
      });
    }
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
    setStatus('Reset to Worker defaults.');
  };

  return (
    <Box className="stack-page">
      <Box className="hill-deco" sx={{ opacity: 0.7 }} />
      <Box sx={{ position: 'relative', zIndex: 1, width: 'min(820px, 100%)', margin: '0 auto', padding: '28px 32px 48px' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#1E1B2E', pl: 0, mb: 2 }}>
          Back to Settings
        </Button>

        <Typography component="h2" sx={{ fontSize: 26, fontWeight: 700, color: '#1E1B2E' }}>
          LLM Lab
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 15, color: '#3A3550' }}>
          Tune the master chat prompt, provider, model, and generation parameters. Thinking can be
          captured separately so only the final reading reaches the chat.
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
                    const next = PROVIDERS.find((p) => p.id === e.target.value) || PROVIDERS[0];
                    setForm((prev) => ({
                      ...prev,
                      provider: next.id,
                      baseUrl: prev.baseUrl || next.baseUrl,
                      model: prev.model || next.models[0],
                    }));
                  }}
                >
                  {PROVIDERS.map((p) => (
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
                  placeholder={providerMeta.models[0]}
                  helperText="Type a model id or pick a common one below."
                />
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {providerMeta.models.map((model) => (
                  <Button
                    key={model}
                    size="small"
                    variant={form.model === model ? 'contained' : 'outlined'}
                    onClick={() => patch('model', model)}
                    sx={{
                      textTransform: 'none',
                      bgcolor: form.model === model ? '#6B4FA0' : undefined,
                      borderColor: '#CFC4EA',
                    }}
                  >
                    {model}
                  </Button>
                ))}
              </Box>

              <TextField
                label="API base URL"
                size="small"
                value={form.baseUrl}
                onChange={(e) => patch('baseUrl', e.target.value)}
                placeholder={providerMeta.baseUrl}
                fullWidth
              />

              <TextField
                label="API key override"
                type="password"
                size="small"
                value={form.apiKey}
                onChange={(e) => patch('apiKey', e.target.value)}
                fullWidth
                helperText={
                  meta.apiKeySet
                    ? `Currently set (${meta.apiKeyMasked || '••••'}). Enter a new key to replace, or leave blank to keep.`
                    : 'Optional override. Worker NVIDIA_API_KEY / OPENAI_API_KEY is used when empty.'
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
                <Typography sx={{ fontSize: 12, color: '#6A6580' }}>
                  Lower is steadier Jyotish wording; higher is more varied.
                </Typography>
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
                  inputProps={{ min: 64, max: 8192 }}
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
                  label="Include thinking in API output (chat still shows the final answer only)"
                />
                <Typography sx={{ fontSize: 12, color: '#6A6580' }}>
                  When capture is on and show is off, reasoning stays on the Worker side / response
                  metadata and does not replace the user-facing reading.
                </Typography>
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
      </Box>
    </Box>
  );
}

export default LlmLabPage;
