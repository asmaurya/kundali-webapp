/**
 * Cloudflare Worker: SPA assets + chat + settings sync + Places proxy +
 * optional chart proxy to the Vercel Swiss Ephemeris service.
 */

const TONE = `Be accurate and neutral. State only what the chart supports. Do not add reassurance or positivity the chart does not support. Do not give exact dates, amounts, scores or exact outcomes; give periods and tendencies. Do not discuss death, lifespan, pregnancy, medical or psychological diagnoses. Do not promise outcomes. Religion-neutral: no deities or temple prescriptions; practical habits are fine. Keep answers under 120 words. Output ONLY the final user-facing answer — no planning, no rule checklists, no phrases like "The user wants" or "Constraints to follow".`;

/** Built-in default; dashboard/wrangler MASTER_PROMPT is appended on every LLM call. */
const DEFAULT_MASTER_PROMPT = `Always use the querent kundali JSON in context. Chat history and the rolling summary are for coherence only — natal facts come from the JSON. If a family kundali JSON is present, include both charts in the reading.`;

const DEFAULT_INVITE = 'KUNDALI-BETA';

function masterPrompt(env, lab = null) {
  const fromLab = String(lab?.masterPrompt || '').trim();
  if (fromLab) return fromLab;
  const fromEnv = String(env.MASTER_PROMPT || '').trim();
  return fromEnv || DEFAULT_MASTER_PROMPT;
}

const LLM_LAB_KEY = 'llm:lab';
const LLM_TRACE_KEY = 'llm:lastTrace';

/** Provider implies base URL + which Cloudflare secret holds the API key. */
const LLM_PROVIDERS = {
  nvidia: {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    secretName: 'NVIDIA_API_KEY',
    api: 'openai',
    defaultModel: 'nvidia/nemotron-3.5-bolt-e4b',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    secretName: 'OPENAI_API_KEY',
    api: 'openai',
    defaultModel: 'gpt-4o-mini',
  },
  claude: {
    id: 'claude',
    label: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    secretName: 'ANTHROPIC_API_KEY',
    api: 'anthropic',
    defaultModel: 'claude-sonnet-5-5',
  },
};

/** Retired Anthropic IDs → current replacements (404 not_found_error otherwise). */
const RETIRED_ANTHROPIC_MODELS = {
  'claude-sonnet-4-20250514': 'claude-sonnet-5-5',
  'claude-sonnet-4': 'claude-sonnet-5-5',
  'claude-opus-4-20250514': 'claude-opus-4-8',
  'claude-opus-4': 'claude-opus-4-8',
  'claude-sonnet-4-5-20250929': 'claude-sonnet-5-5',
  'claude-sonnet-4-5': 'claude-sonnet-5-5',
  'claude-3-7-sonnet-20250219': 'claude-sonnet-5-5',
  'claude-3-5-sonnet-20241022': 'claude-sonnet-5-5',
  'claude-3-5-sonnet-latest': 'claude-sonnet-5-5',
};

function resolveAnthropicModelId(model) {
  const raw = String(model || '').trim();
  if (!raw) return LLM_PROVIDERS.claude.defaultModel;
  return RETIRED_ANTHROPIC_MODELS[raw] || RETIRED_ANTHROPIC_MODELS[raw.toLowerCase()] || raw;
}

const DEFAULT_PROVIDER_PROFILE = {
  model: '',
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: 512,
  captureThinking: true,
  showThinking: false,
  thinkingEffort: 'high',
};

/**
 * Answer pipeline modes:
 * - llm_only: skip inference; call configured LLM only
 * - inference_then_llm: call inference, append into chart context, then LLM
 * - inference_only: call inference (may be an LLM itself); skip our LLM
 */
const CHART_PIPELINE_MODES = ['llm_only', 'inference_then_llm', 'inference_only'];

const DEFAULT_CHART_INFERENCE = {
  /** @deprecated prefer `mode`; kept for older saved Lab configs */
  enabled: false,
  mode: 'llm_only',
  baseUrl: '',
  method: 'POST',
  /** JSON object string; values may use {{var}} and {{secret.NAME}} */
  headersJson: '{\n  "Content-Type": "application/json"\n}',
  /**
   * Request body template. Placeholders map from chart/birth vars, e.g.
   * {{birth.date}} {{birth.time}} {{birth.lat}} {{birth.lon}} {{birth.tz}}
   * {{birth.place}} {{chart.lagna}} {{chart.moonSign}} {{chart.dasha}}
   * {{question}} {{locale}} {{summary}}
   */
  bodyTemplate:
    '{\n  "date": "{{birth.date}}",\n  "time": "{{birth.time}}",\n  "lat": {{birth.lat}},\n  "lon": {{birth.lon}},\n  "tz": "{{birth.tz}}",\n  "place": "{{birth.place}}",\n  "question": "{{question}}"\n}',
  /** Dot path into JSON response to append (inference_then_llm); empty = whole JSON body */
  responseJsonPath: '',
  /** Dot path for the reply text when mode is inference_only; falls back to responseJsonPath / common keys */
  answerJsonPath: '',
  /** Optional Cloudflare secret name referenced as {{secret.<name>}} in headers/body */
  secretName: 'CHART_INFERENCE_KEY',
};

const DEFAULT_LLM_LAB = {
  masterPrompt: '',
  provider: 'nvidia',
  model: '',
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: 512,
  captureThinking: true,
  showThinking: false,
  thinkingEffort: 'high',
  /** Per-provider generation params — switching provider restores that slot. */
  providerProfiles: {},
  /** Optional third-party chart / Jyotish inference API (template-mapped vars). */
  chartInference: { ...DEFAULT_CHART_INFERENCE },
  /** @type {Array<{id:string,label:string,baseUrl:string,api:string,secretName:string,defaultModel?:string}>} */
  customProviders: [],
  /** Booleans only — never store key material. Tracks non-NVIDIA secrets written from Lab. */
  keysConfigured: {},
};

const PROVIDER_PROFILE_KEYS = [
  'model',
  'topP',
  'frequencyPenalty',
  'presencePenalty',
  'maxTokens',
  'captureThinking',
  'showThinking',
  'thinkingEffort',
];

function defaultProfileForProvider(providerId) {
  if (providerId === 'claude') {
    return {
      ...DEFAULT_PROVIDER_PROFILE,
      model: LLM_PROVIDERS.claude.defaultModel,
      maxTokens: 4096,
      captureThinking: true,
      showThinking: false,
      thinkingEffort: 'high',
      // Claude ignores these; kept for profile shape only
      frequencyPenalty: 0,
      presencePenalty: 0,
      topP: 1,
    };
  }
  if (providerId === 'openai') {
    return {
      ...DEFAULT_PROVIDER_PROFILE,
      model: LLM_PROVIDERS.openai.defaultModel,
      maxTokens: 1024,
    };
  }
  if (providerId === 'nvidia') {
    return {
      ...DEFAULT_PROVIDER_PROFILE,
      model: LLM_PROVIDERS.nvidia.defaultModel,
      maxTokens: 512,
    };
  }
  return { ...DEFAULT_PROVIDER_PROFILE };
}

function readProviderProfile(lab, providerId) {
  const id = String(providerId || '').trim() || 'nvidia';
  const profiles = lab?.providerProfiles && typeof lab.providerProfiles === 'object' ? lab.providerProfiles : {};
  const stored = profiles[id] && typeof profiles[id] === 'object' ? profiles[id] : null;
  const defaults = defaultProfileForProvider(id);
  // One-time migrate flat Lab fields into the active provider's profile when empty.
  const migrated = {};
  if (!stored && lab && (lab.provider === id || (!lab.provider && id === 'nvidia'))) {
    PROVIDER_PROFILE_KEYS.forEach((key) => {
      if (lab[key] != null && lab[key] !== '') migrated[key] = lab[key];
    });
  }
  return { ...defaults, ...migrated, ...(stored || {}) };
}

function syncFlatFromProfile(lab, providerId, profile) {
  const next = { ...lab, provider: providerId, providerProfiles: { ...(lab.providerProfiles || {}) } };
  next.providerProfiles[providerId] = { ...profile };
  PROVIDER_PROFILE_KEYS.forEach((key) => {
    if (profile[key] != null) next[key] = profile[key];
  });
  return next;
}

function resolveChartPipelineMode(raw) {
  const explicit = String(raw?.mode || '').trim().toLowerCase();
  if (CHART_PIPELINE_MODES.includes(explicit)) return explicit;
  // Legacy: enabled true → inference before LLM
  if (raw && raw.enabled === true) return 'inference_then_llm';
  return 'llm_only';
}

function sanitizeChartInference(raw) {
  const base = { ...DEFAULT_CHART_INFERENCE, ...(raw && typeof raw === 'object' ? raw : {}) };
  const mode = resolveChartPipelineMode(base);
  return {
    enabled: mode !== 'llm_only',
    mode,
    baseUrl: String(base.baseUrl || '')
      .trim()
      .replace(/\/$/, '')
      .slice(0, 400),
    method: String(base.method || 'POST').toUpperCase() === 'GET' ? 'GET' : 'POST',
    headersJson: String(base.headersJson || DEFAULT_CHART_INFERENCE.headersJson).slice(0, 4000),
    bodyTemplate: String(base.bodyTemplate || DEFAULT_CHART_INFERENCE.bodyTemplate).slice(0, 12000),
    responseJsonPath: String(base.responseJsonPath || '').trim().slice(0, 200),
    answerJsonPath: String(base.answerJsonPath || '').trim().slice(0, 200),
    secretName: String(base.secretName || 'CHART_INFERENCE_KEY')
      .trim()
      .replace(/[^A-Za-z0-9_]/g, '_')
      .slice(0, 64),
  };
}

function extractInferenceAnswerText(parsed, cfg) {
  const path = cfg.answerJsonPath || cfg.responseJsonPath || '';
  if (path) {
    const at = valueAtPath(parsed, path);
    if (typeof at === 'string' && at.trim()) return at.trim();
    if (at != null && typeof at !== 'object') return String(at);
  }
  if (typeof parsed === 'string') return parsed.trim();
  if (!parsed || typeof parsed !== 'object') return '';
  for (const key of ['answer', 'text', 'message', 'reply', 'content', 'output']) {
    const v = parsed[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object' && typeof v.text === 'string' && v.text.trim()) return v.text.trim();
  }
  // OpenAI-compat choices
  const choiceText = parsed.choices?.[0]?.message?.content;
  if (typeof choiceText === 'string' && choiceText.trim()) return choiceText.trim();
  return '';
}

function slugifyProviderId(label) {
  const slug = String(label || 'custom')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return `custom_${slug || 'provider'}`;
}

function customSecretName(providerId) {
  const safe = String(providerId || 'custom')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return `LLM_${safe || 'CUSTOM'}_KEY`;
}

function normalizeBuiltInProviderId(value) {
  const p = String(value || '').toLowerCase().trim();
  if (p === 'anthropic' || p === 'claude') return 'claude';
  if (p === 'openai') return 'openai';
  if (p === 'nvidia' || p === 'nim') return 'nvidia';
  return null;
}

function listCustomProviders(lab) {
  return Array.isArray(lab?.customProviders) ? lab.customProviders.filter((p) => p && p.id && p.baseUrl) : [];
}

function resolveProviderMeta(providerId, lab = null) {
  const builtIn = normalizeBuiltInProviderId(providerId);
  if (builtIn) {
    return {
      ...LLM_PROVIDERS[builtIn],
      custom: false,
      keyLocked: builtIn === 'nvidia',
    };
  }
  const customs = listCustomProviders(lab);
  const found = customs.find((p) => p.id === providerId);
  if (found) {
    return {
      id: found.id,
      label: found.label || found.id,
      baseUrl: String(found.baseUrl || '').replace(/\/$/, ''),
      secretName: found.secretName || customSecretName(found.id),
      api: found.api === 'anthropic' ? 'anthropic' : 'openai',
      defaultModel: found.defaultModel || '',
      custom: true,
      keyLocked: false,
    };
  }
  // Fall back to permanent NVIDIA provider.
  return { ...LLM_PROVIDERS.nvidia, custom: false, keyLocked: true };
}

function normalizeProviderId(value, lab = null) {
  const builtIn = normalizeBuiltInProviderId(value);
  if (builtIn) return builtIn;
  if (value && listCustomProviders(lab).some((p) => p.id === value)) return value;
  return 'nvidia';
}

function providerMeta(providerId, lab = null) {
  return resolveProviderMeta(providerId, lab);
}

function keyIsConfigured(env, lab, meta) {
  if (!meta) return false;
  if (meta.id === 'nvidia') {
    return secretPresent(env, 'NVIDIA_API_KEY') || secretPresent(env, 'OPENAI_API_KEY');
  }
  if (secretPresent(env, meta.secretName)) return true;
  return Boolean(lab?.keysConfigured?.[meta.id]);
}

function llmLabCacheKey() {
  return new Request('https://kundali-beta.internal/llm-lab');
}

async function readLlmLab(env) {
  if (env.SETTINGS) {
    const raw = await env.SETTINGS.get(LLM_LAB_KEY, 'json');
    if (raw && typeof raw === 'object') return { ...DEFAULT_LLM_LAB, ...raw };
  }
  try {
    const cached = await caches.default.match(llmLabCacheKey());
    if (cached) {
      const raw = await cached.json();
      if (raw && typeof raw === 'object') return { ...DEFAULT_LLM_LAB, ...raw };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_LLM_LAB };
}

async function writeLlmLab(env, lab) {
  // Never persist API keys in lab storage — keys live only as Cloudflare secrets.
  const merged = { ...DEFAULT_LLM_LAB, ...lab };
  delete merged.apiKey;
  const profiles =
    merged.providerProfiles && typeof merged.providerProfiles === 'object' ? merged.providerProfiles : {};
  const normalizedProfiles = {};
  Object.keys(profiles).forEach((id) => {
    const p = profiles[id];
    if (!p || typeof p !== 'object') return;
    normalizedProfiles[id] = {
      model: String(p.model || '').slice(0, 200),
      topP: clampNumber(p.topP, 0, 1, 1),
      frequencyPenalty: clampNumber(p.frequencyPenalty, -2, 2, 0),
      presencePenalty: clampNumber(p.presencePenalty, -2, 2, 0),
      maxTokens: clampNumber(p.maxTokens, 64, 16384, 512),
      captureThinking: p.captureThinking !== false,
      showThinking: Boolean(p.showThinking),
      thinkingEffort: ['low', 'medium', 'high', 'xhigh', 'max'].includes(String(p.thinkingEffort || ''))
        ? String(p.thinkingEffort)
        : 'high',
    };
  });
  const payload = {
    ...merged,
    providerProfiles: normalizedProfiles,
    chartInference: sanitizeChartInference(merged.chartInference),
    customProviders: listCustomProviders(merged).map((p) => ({
      id: p.id,
      label: String(p.label || p.id).slice(0, 80),
      baseUrl: String(p.baseUrl || '').replace(/\/$/, '').slice(0, 300),
      api: p.api === 'anthropic' ? 'anthropic' : 'openai',
      secretName: p.secretName || customSecretName(p.id),
      defaultModel: String(p.defaultModel || '').slice(0, 200),
    })),
    keysConfigured:
      merged.keysConfigured && typeof merged.keysConfigured === 'object' ? { ...merged.keysConfigured } : {},
    updatedAt: new Date().toISOString(),
  };
  // NVIDIA key is permanent Cloudflare secret — never track Lab overrides for it.
  delete payload.keysConfigured.nvidia;
  if (env.SETTINGS) {
    await env.SETTINGS.put(LLM_LAB_KEY, JSON.stringify(payload));
  }
  try {
    await caches.default.put(
      llmLabCacheKey(),
      new Response(JSON.stringify(payload), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'max-age=31536000',
        },
      })
    );
  } catch {
    // Cache API may be unavailable; KV path still works.
  }
  return payload;
}

function llmTraceCacheKey() {
  return new Request('https://kundali-beta.internal/llm-trace');
}

async function readLlmTrace(env) {
  if (env.SETTINGS) {
    const raw = await env.SETTINGS.get(LLM_TRACE_KEY, 'json');
    if (raw) return raw;
  }
  try {
    const cached = await caches.default.match(llmTraceCacheKey());
    if (cached) return cached.json();
  } catch {
    // ignore
  }
  return null;
}

async function writeLlmTrace(env, trace) {
  const payload = { ...trace, at: trace.at || new Date().toISOString() };
  if (env.SETTINGS) {
    await env.SETTINGS.put(LLM_TRACE_KEY, JSON.stringify(payload));
  }
  try {
    await caches.default.put(
      llmTraceCacheKey(),
      new Response(JSON.stringify(payload), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'max-age=31536000',
        },
      })
    );
  } catch {
    // ignore
  }
  return payload;
}

/** Push an API key into a Cloudflare Worker secret (removed from lab storage). */
async function putWorkerSecret(env, secretName, secretValue) {
  const accountId = String(env.CF_ACCOUNT_ID || '').trim();
  const token = String(env.CF_API_TOKEN || '').trim();
  const scriptName = String(env.CF_SCRIPT_NAME || 'kundali-webapp').trim();
  if (!accountId || !token) {
    return {
      ok: false,
      error:
        'CF_ACCOUNT_ID / CF_API_TOKEN missing on Worker — cannot write Cloudflare secrets from LLM Lab.',
    };
  }
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${encodeURIComponent(scriptName)}/secrets`,
    {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: secretName,
        text: secretValue,
        type: 'secret_text',
      }),
    }
  );
  const raw = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success === false) {
    const detail =
      payload?.errors?.[0]?.message || raw.slice(0, 200) || `status_${response.status}`;
    return { ok: false, error: detail };
  }
  return { ok: true, secretName };
}

function secretPresent(env, secretName) {
  return Boolean(String(env[secretName] || '').trim());
}

function authorizeAdmin(body, env) {
  const email = authorizeBeta(body, env);
  if (!email) return null;
  const required = String(env.ADMIN_TOKEN || '').trim();
  if (!required) return email;
  const provided = String(body?.adminToken || body?.adminPin || '').trim();
  if (provided && provided === required) return email;
  return null;
}

function publicLlmLabView(lab, env) {
  const resolvedProvider = normalizeProviderId(lab.provider || inferProviderFromEnv(env), lab);
  const resolvedMeta = resolveProviderMeta(resolvedProvider, lab);
  const activeProfile = readProviderProfile(lab, resolvedProvider);
  const keySet = keyIsConfigured(env, lab, resolvedMeta);
  const builtInProviders = Object.values(LLM_PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    baseUrl: p.baseUrl,
    secretName: p.secretName,
    defaultModel: p.defaultModel,
    api: p.api,
    custom: false,
    keyLocked: p.id === 'nvidia',
    apiKeySet:
      p.id === 'nvidia'
        ? secretPresent(env, 'NVIDIA_API_KEY') || secretPresent(env, 'OPENAI_API_KEY')
        : keyIsConfigured(env, lab, { id: p.id, secretName: p.secretName }),
  }));
  const customProviders = listCustomProviders(lab).map((p) => {
    const meta = resolveProviderMeta(p.id, lab);
    return {
      id: meta.id,
      label: meta.label,
      baseUrl: meta.baseUrl,
      secretName: meta.secretName,
      defaultModel: meta.defaultModel || '',
      api: meta.api,
      custom: true,
      keyLocked: false,
      apiKeySet: keyIsConfigured(env, lab, meta),
    };
  });
  return {
    masterPrompt: lab.masterPrompt || '',
    provider: resolvedProvider,
    providerLabel: resolvedMeta.label,
    providerCustom: Boolean(resolvedMeta.custom),
    keyLocked: Boolean(resolvedMeta.keyLocked),
    baseUrl: resolvedMeta.baseUrl,
    secretName: resolvedMeta.secretName,
    model: (() => {
      const profile = readProviderProfile(lab, resolvedProvider);
      const raw =
        profile.model ||
        lab.model ||
        (resolvedMeta.id === 'claude' ? '' : env.OPENAI_MODEL) ||
        resolvedMeta.defaultModel ||
        '';
      return resolvedMeta.api === 'anthropic' ? resolveAnthropicModelId(raw) : raw;
    })(),
    providerProfiles: lab.providerProfiles || {},
    chartInference: sanitizeChartInference(lab.chartInference),
    thinkingEffort: activeProfile.thinkingEffort || 'high',
    apiKeySet: keySet,
    apiKeyMasked: keySet
      ? resolvedMeta.id === 'nvidia'
        ? '•••• permanent Cloudflare secret (NVIDIA_API_KEY)'
        : `•••• Cloudflare secret (${resolvedMeta.secretName})`
      : '',
    apiKeyRequired: resolvedMeta.id !== 'nvidia' && !keySet,
    cloudflareSecretsWritable: Boolean(env.CF_ACCOUNT_ID && env.CF_API_TOKEN),
    topP: Number(activeProfile.topP ?? lab.topP ?? DEFAULT_LLM_LAB.topP),
    frequencyPenalty: Number(activeProfile.frequencyPenalty ?? lab.frequencyPenalty ?? 0),
    presencePenalty: Number(activeProfile.presencePenalty ?? lab.presencePenalty ?? 0),
    maxTokens: Number(activeProfile.maxTokens ?? lab.maxTokens ?? DEFAULT_LLM_LAB.maxTokens),
    captureThinking: activeProfile.captureThinking !== false,
    showThinking: Boolean(activeProfile.showThinking),
    updatedAt: lab.updatedAt || null,
    providers: [...builtInProviders, ...customProviders],
    customProviders,
    defaults: {
      masterPrompt: String(env.MASTER_PROMPT || DEFAULT_MASTER_PROMPT),
      model: env.OPENAI_MODEL || LLM_PROVIDERS.nvidia.defaultModel,
      provider: 'nvidia',
    },
  };
}

function maskSecret(value) {
  const s = String(value || '');
  if (s.length < 8) return '••••';
  return `${s.slice(0, 3)}••••${s.slice(-4)}`;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Vercel chart service config.
 * - CHART_API_URL: https://….vercel.app
 * - CHART_API_KEY: shared bearer (preferred)
 * - VERCEL_CHART: if https → URL; else treated as bearer when CHART_API_KEY unset
 */
function chartRemoteConfig(env) {
  const vercelChart = String(env.VERCEL_CHART || '').trim();
  let baseUrl = String(env.CHART_API_URL || '').trim();
  let apiKey = String(env.CHART_API_KEY || '').trim();
  if (!baseUrl && /^https?:\/\//i.test(vercelChart)) {
    baseUrl = vercelChart;
  } else if (!apiKey && vercelChart && !/^https?:\/\//i.test(vercelChart)) {
    apiKey = vercelChart;
  }
  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey,
  };
}

async function proxyChartUpstream(env, path, bodyText) {
  const { baseUrl, apiKey } = chartRemoteConfig(env);
  if (!baseUrl) {
    return json(
      {
        error: 'chart_remote_unconfigured',
        detail: 'Set CHART_API_URL to your Vercel chart deployment.',
      },
      503
    );
  }
  const headers = { 'content-type': 'application/json' };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  try {
    const upstream = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: bodyText || '{}',
      signal: AbortSignal.timeout(15000),
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      },
    });
  } catch (error) {
    return json(
      {
        error: 'chart_upstream_failed',
        detail: String(error?.message || error).slice(0, 160),
      },
      502
    );
  }
}

async function handleChartProxy(request, env) {
  let bodyText = '';
  try {
    bodyText = await request.text();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  return proxyChartUpstream(env, '/api/v1/chart', bodyText);
}

async function handleGocharaProxy(request, env) {
  let bodyText = '';
  try {
    bodyText = await request.text();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  return proxyChartUpstream(env, '/api/v1/gochara', bodyText);
}

async function probeChartRemote(env) {
  const { baseUrl, apiKey } = chartRemoteConfig(env);
  if (!baseUrl) return { ok: false, detail: 'unconfigured' };
  try {
    const headers = {};
    if (apiKey) headers.authorization = `Bearer ${apiKey}`;
    const response = await fetch(`${baseUrl}/api/health`, { headers });
    return { ok: response.ok, detail: response.ok ? 'swiss-ephemeris' : `status_${response.status}` };
  } catch (error) {
    return { ok: false, detail: String(error?.message || error).slice(0, 80) };
  }
}



function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, OPTIONS, GET',
    },
  });
}

function crisisReply(locale) {
  if (locale === 'hi') {
    return {
      text:
        'यह समय भारी लग रहा है। संकट सहायता के लिए मैं सही जगह नहीं हूँ। कृपया अभी स्थानीय आपातकालीन सेवाओं या किसी विश्वसनीय व्यक्ति से संपर्क करें। भारत में आप iCall पर 9152987821 कॉल कर सकते हैं। जब आप सुरक्षित हों, हम कुंडली पर फिर बात कर सकते हैं।',
      provider: 'guardrail',
      used_llm: false,
    };
  }
  return {
    text:
      'I hear that this feels heavy. I am not the right place for crisis support. Please contact local emergency services or a trusted person now. In India you can call iCall at 9152987821. When you are safer, we can talk about the chart again.',
    provider: 'guardrail',
    used_llm: false,
  };
}

function chartAwareFallback(question, chartContext, locale) {
  const q = String(question || '').toLowerCase();
  const ctx = String(chartContext || '');
  const lagna = (ctx.match(/Lagna:\s*(.+)/i) || [])[1] || (locale === 'hi' ? 'आपका लग्न' : 'your lagna');
  const moon = (ctx.match(/Moon:\s*(.+)/i) || [])[1] || (locale === 'hi' ? 'आपकी चंद्र राशि' : 'your Moon sign');
  const dasha = (ctx.match(/Current dasha:\s*(.+)/i) || [])[1] || (locale === 'hi' ? 'वर्तमान दशा' : 'the current dasha');

  if (locale === 'hi') {
    if (/career|job|work|promotion|business|करियर|नौकरी|व्यापार/.test(q)) {
      return `कुंडली (${lagna} लग्न; ${dasha}) के अनुसार दशम भाव स्थिर कौशल बढ़ाने के पक्ष में है। इस दशा में प्रगति क्रमशः दिखेगी। चाहें तो आगे उपाय या समय-विषय पर बात करें।`;
    }
    if (/marriage|relationship|partner|love|compatibility|विवाह|रिश्ता|प्रेम/.test(q)) {
      return `चंद्र ${moon} और लग्न ${lagna} के साथ सप्तम भाव जल्दबाज़ी से अधिक स्पष्ट संवाद का पक्षधर है। दोनों कुंडलियों की तुलना से अनुकूलता बेहतर समझ आती है।`;
    }
    if (/health|sleep|stress|anxiety|स्वास्थ्य|नींद|तनाव/.test(q)) {
      return `चंद्र ${moon} अक्सर संवेदनशील तंत्रिका तंत्र का संकेत देता है। नियमित नींद और हल्का रात्रि भोजन अनुमानित रत्नों से अधिक सहायक है। यह कुंडली मार्गदर्शन है, चिकित्सा निदान नहीं।`;
    }
    if (/remedy|remedies|donation|mantra|gemstone|उपाय|दान|मंत्र/.test(q)) {
      return `इस कुंडली के लिए शांत शनिवार की आदतें और घर पर दीपक के लिए तेल या अन्न का सादा दान उपयुक्त आरंभिक उपाय हैं। इन्हें अनुशासन का सहारा मानें, गारंटी नहीं।`;
    }
    return `आपकी कुंडली (${lagna} लग्न; चंद्र ${moon}; ${dasha}) के आधार पर नोट किया। करियर, संबंध, स्वास्थ्य या उपाय पूछें — उत्तर इन्हीं स्थितियों पर आधारित होंगे।`;
  }

  if (/career|job|work|promotion|business/.test(q)) {
    return `From the chart (${lagna} lagna; ${dasha}), the 10th-house picture favours steady skill-building over abrupt leaps. Progress is likely to feel gradual while this dasha runs. I can speak to remedies or timing themes next if you want.`;
  }
  if (/marriage|relationship|partner|love|compatibility/.test(q)) {
    return `With Moon as ${moon} and lagna in ${lagna}, the 7th-house themes favour clear communication over haste. Compatibility improves when both charts are compared. Family introductions often land better than rushed self-driven moves in this stretch.`;
  }
  if (/health|sleep|stress|anxiety/.test(q)) {
    return `Moon as ${moon} often marks a sensitive nervous system. Regular sleep and a lighter evening meal help more than speculative gemstones. This is chart guidance, not a medical diagnosis.`;
  }
  if (/remedy|remedies|donation|mantra|gemstone/.test(q)) {
    return `For this chart, calm Saturday habits and a simple act of giving (dark grains or oil for a lamp at home) are suitable starter remedies. Treat them as discipline supports, not guaranteed outcomes.`;
  }
  return `Noted against your chart (${lagna} lagna; Moon ${moon}; ${dasha}). Ask about career, relationships, health, or remedies for a more focused reading grounded in these placements.`;
}

/**
 * OpenAI-compatible chat (OpenAI, NVIDIA NIM, etc.).
 * Secrets / vars on the Worker only — never in the CRA browser bundle:
 *   OPENAI_API_KEY or NVIDIA_API_KEY
 *   OPENAI_BASE_URL  (default OpenAI; NVIDIA: https://integrate.api.nvidia.com/v1)
 *   OPENAI_MODEL     (OpenAI default gpt-4o-mini; set to your NIM model id)
 */
function inferProviderFromEnv(env) {
  if (/nvidia\.com/i.test(String(env.OPENAI_BASE_URL || ''))) return 'nvidia';
  if (env.NVIDIA_API_KEY && !env.OPENAI_API_KEY) return 'nvidia';
  if (env.ANTHROPIC_API_KEY && !env.NVIDIA_API_KEY && !env.OPENAI_API_KEY) return 'claude';
  if (env.OPENAI_API_KEY) return 'openai';
  if (env.NVIDIA_API_KEY) return 'nvidia';
  if (env.ANTHROPIC_API_KEY) return 'claude';
  return 'nvidia';
}

/** Resolve provider → base URL + Cloudflare secret key + lab params. */
function llmConfig(env, lab = null) {
  const provider = normalizeProviderId(lab?.provider || inferProviderFromEnv(env), lab);
  const meta = resolveProviderMeta(provider, lab);
  let resolvedKey = String(env[meta.secretName] || '').trim();
  // Permanent NVIDIA fallback for older NIM setups that only set OPENAI_API_KEY.
  if (!resolvedKey && meta.id === 'nvidia') {
    resolvedKey = String(env.OPENAI_API_KEY || '').trim();
  }
  if (!resolvedKey) return null;

  const profile = readProviderProfile(lab, meta.id);
  let model =
    String(profile.model || lab?.model || '').trim() ||
    (meta.id === 'nvidia' || meta.id === 'openai' ? String(env.OPENAI_MODEL || '').trim() : '') ||
    meta.defaultModel ||
    '';
  if (meta.api === 'anthropic') {
    model = resolveAnthropicModelId(model);
  }

  return {
    key: resolvedKey,
    baseUrl: meta.baseUrl,
    model,
    provider: meta.id,
    api: meta.api,
    secretName: meta.secretName,
    topP: clampNumber(profile.topP ?? lab?.topP, 0, 1, 1),
    // OpenAI-compat only — Anthropic rejects these fields.
    frequencyPenalty: clampNumber(profile.frequencyPenalty ?? lab?.frequencyPenalty, -2, 2, 0),
    presencePenalty: clampNumber(profile.presencePenalty ?? lab?.presencePenalty, -2, 2, 0),
    maxTokens: clampNumber(profile.maxTokens ?? lab?.maxTokens, 64, 16384, meta.id === 'claude' ? 4096 : 512),
    captureThinking: lab ? profile.captureThinking !== false : true,
    showThinking: Boolean(profile.showThinking ?? lab?.showThinking),
    thinkingEffort: profile.thinkingEffort || lab?.thinkingEffort || 'high',
  };
}

/** NIM (and some OpenAI-compat hosts) want strict user/assistant alternation after system. */
function normalizeChatHistory(history) {
  const out = [];
  (Array.isArray(history) ? history : []).slice(-8).forEach((turn) => {
    if (!turn || !turn.content) return;
    const role = turn.role === 'assistant' ? 'assistant' : 'user';
    if (out.length && out[out.length - 1].role === role) {
      out[out.length - 1].content += `\n${turn.content}`;
      return;
    }
    out.push({ role, content: String(turn.content) });
  });
  return out;
}

function buildPromptParts(env, lab, question, chartContext, locale, summary, cfg) {
  const langLine =
    locale === 'hi'
      ? 'Reply in clear Hindi (Devanagari). Keep Jyotish terms (lagna, dasha, nakshatra) as commonly used.'
      : 'Reply in clear English.';
  const thinkingInstruction = cfg.captureThinking
    ? 'If you reason internally, keep that separate from the user-facing answer. The answer content must be the final reading only.'
    : 'Do not include chain-of-thought; output only the final user-facing answer.';
  const master = masterPrompt(env, lab);
  const context = [
    `Kundali + context (querent JSON is always present; family JSON only when relevant):\n${chartContext || 'No chart provided.'}`,
    summary
      ? `Rolling conversation summary (stateless context; trust this over raw history when they disagree):\n${summary}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const system = [TONE, langLine, thinkingInstruction, `Master prompt:\n${master}`, context]
    .filter(Boolean)
    .join('\n\n');
  const userQuestion = `${question}\n\n(Reply with the final answer only — one short reading, no planning.)`;
  return { master, context, question: userQuestion, system, langLine, thinkingInstruction };
}

function usageFromPayload(payload) {
  const u = payload?.usage || {};
  const thinkingTokens =
    u.output_tokens_details?.thinking_tokens ??
    u.thinking_tokens ??
    u.completion_tokens_details?.reasoning_tokens ??
    null;
  return {
    promptTokens: u.prompt_tokens ?? u.input_tokens ?? null,
    completionTokens: u.completion_tokens ?? u.output_tokens ?? null,
    thinkingTokens,
    totalTokens:
      u.total_tokens ??
      (u.prompt_tokens != null && u.completion_tokens != null
        ? u.prompt_tokens + u.completion_tokens
        : u.input_tokens != null && u.output_tokens != null
          ? u.input_tokens + u.output_tokens
          : null),
    raw: u,
  };
}

async function callOpenAiCompatible(cfg, system, history, userQuestion) {
  const isReasoningNim = cfg.provider === 'nvidia' && /glimmer|muse|reason/i.test(cfg.model);
  const body = {
    model: cfg.model,
    messages: [
      { role: 'system', content: system },
      ...normalizeChatHistory(history),
      { role: 'user', content: userQuestion },
    ],
    stream: false,
    max_tokens: isReasoningNim ? Math.max(cfg.maxTokens, 4096) : cfg.maxTokens,
    top_p: cfg.topP,
  };
  if (cfg.frequencyPenalty) body.frequency_penalty = cfg.frequencyPenalty;
  if (cfg.presencePenalty) body.presence_penalty = cfg.presencePenalty;
  if (isReasoningNim) {
    body.reasoning_effort = cfg.captureThinking ? 'medium' : 'minimal';
  }

  const started = Date.now();
  const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${cfg.key}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  const latencyMs = Date.now() - started;
  if (!response.ok) throw new Error(`LLM ${response.status}: ${raw.slice(0, 280)}`);
  if (response.status === 202) throw new Error(`LLM 202 pending: ${raw.slice(0, 200)}`);
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`LLM non-JSON body: ${raw.slice(0, 200)}`);
  }
  const message = payload.choices?.[0]?.message || {};
  return {
    text: finalizeAssistantText(extractMessageText(message)),
    thinking: extractThinkingText(message),
    usage: usageFromPayload(payload),
    latencyMs,
    requestBody: { ...body, messages: undefined, messageCount: body.messages.length },
    finishReason: payload.choices?.[0]?.finish_reason || null,
  };
}

/**
 * Claude 4.6+ / 5.x reject thinking.type.enabled (need adaptive + output_config.effort).
 * Claude 4 / 4.1 / 4.5 reject adaptive (need enabled + budget_tokens).
 */
function anthropicUsesAdaptiveThinking(model) {
  const m = String(model || '').toLowerCase();
  if (!m) return true;
  if (/claude-(?:opus|sonnet|haiku)-5(?:[-.]|$)/.test(m)) return true;
  if (/\b(?:fable|mythos)\b/.test(m)) return true;
  // 4.6, 4.7, 4.8 … (adaptive-only)
  if (/claude-(?:opus|sonnet|haiku)-4-[6-9]/.test(m)) return true;
  if (/claude-(?:opus|sonnet|haiku)-4\.[6-9]/.test(m)) return true;
  // Dated Sonnet/Opus/Haiku 4 / 4.1 / 4.5 — fixed-budget extended thinking only
  if (/claude-(?:opus|sonnet|haiku)-4(?:[-.]|$)/.test(m)) return false;
  // Unknown / Lab-entered aliases: prefer adaptive (matches current Anthropic defaults)
  return true;
}

function anthropicEffortLevel(cfg) {
  const raw = String(cfg.effort || cfg.thinkingEffort || '').toLowerCase();
  if (['low', 'medium', 'high', 'xhigh', 'max'].includes(raw)) return raw;
  return cfg.captureThinking ? 'high' : 'medium';
}

async function callAnthropic(cfg, system, history, userQuestion) {
  const messages = [
    ...normalizeChatHistory(history).map((turn) => ({
      role: turn.role === 'assistant' ? 'assistant' : 'user',
      content: turn.content,
    })),
    { role: 'user', content: userQuestion },
  ];
  // Anthropic requires alternating roles starting with user.
  const normalized = [];
  messages.forEach((turn) => {
    if (normalized.length && normalized[normalized.length - 1].role === turn.role) {
      normalized[normalized.length - 1].content += `\n${turn.content}`;
    } else {
      normalized.push({ ...turn });
    }
  });
  if (!normalized.length || normalized[0].role !== 'user') {
    normalized.unshift({ role: 'user', content: userQuestion });
  }

  // Claude counts thinking toward max_tokens. Lab defaults of 512 are too low once
  // thinking is on — raise the floor and never send frequency/presence (unsupported).
  const answerBudget = Math.max(Number(cfg.maxTokens) || 512, cfg.captureThinking ? 1024 : 400);
  const useAdaptive = anthropicUsesAdaptiveThinking(cfg.model);
  // Manual extended thinking: budget_tokens ≥ 1024 and strictly < max_tokens.
  const thinkingBudget = Math.max(1024, Math.min(10000, Math.max(1536, answerBudget * 2)));
  const maxTokens = Math.min(
    16384,
    cfg.captureThinking
      ? useAdaptive
        ? Math.max(answerBudget + 4096, answerBudget * 4, 4096)
        : Math.max(answerBudget + thinkingBudget + 256, thinkingBudget + 1024)
      : answerBudget
  );

  const body = {
    model: cfg.model,
    max_tokens: maxTokens,
    system,
    messages: normalized,
  };
  // Never send frequency_penalty / presence_penalty — Claude has no equivalents.
  // Never send top_p (or non-default temperature) while thinking is active.

  if (cfg.captureThinking) {
    const display = cfg.showThinking ? 'summarized' : 'omitted';
    if (useAdaptive) {
      // Claude 4.7+ / 5.x (and preferred on 4.6): adaptive + output_config.effort
      body.thinking = { type: 'adaptive', display };
      body.output_config = { effort: anthropicEffortLevel(cfg) };
    } else {
      // Claude 4 / 4.1 / 4.5: fixed-budget extended thinking only
      const budget = Math.min(thinkingBudget, maxTokens - 512);
      body.thinking = {
        type: 'enabled',
        budget_tokens: Math.max(1024, budget),
      };
    }
  } else if (cfg.topP != null && Number(cfg.topP) < 1) {
    body.top_p = Number(cfg.topP);
  }

  const started = Date.now();
  const response = await fetch(`${cfg.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': cfg.key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  const latencyMs = Date.now() - started;
  if (!response.ok) throw new Error(`LLM ${response.status}: ${raw.slice(0, 280)}`);
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`LLM non-JSON body: ${raw.slice(0, 200)}`);
  }
  const blocks = Array.isArray(payload.content) ? payload.content : [];
  let thinking = blocks
    .filter((b) => b && (b.type === 'thinking' || b.type === 'redacted_thinking'))
    .map((b) => {
      if (b.type === 'redacted_thinking') return '[redacted thinking]';
      return b.thinking || b.data || b.text || '';
    })
    .filter(Boolean)
    .join('\n\n');
  const usage = usageFromPayload(payload);
  if (!thinking && usage.thinkingTokens) {
    thinking = `(internal/adaptive thinking used ${usage.thinkingTokens} tokens; no thinking content block returned)`;
  }
  const text = finalizeAssistantText(
    blocks
      .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text)
      .join('\n')
      .trim()
  );
  return {
    text,
    thinking,
    usage,
    latencyMs,
    requestBody: {
      ...body,
      system: undefined,
      messages: undefined,
      messageCount: body.messages.length,
      answerBudget,
      thinkingMode: body.thinking?.type || null,
      thinkingBudget: body.thinking?.budget_tokens || thinkingBudget,
      effort: body.output_config?.effort || null,
    },
    finishReason: payload.stop_reason || null,
  };
}

async function openAiReply(env, question, chartContext, history, locale, summary = '', lab = null) {
  const cfg = llmConfig(env, lab);
  if (!cfg) return null;

  const parts = buildPromptParts(env, lab, question, chartContext, locale, summary, cfg);
  const params = {
    topP: cfg.topP,
    frequencyPenalty: cfg.frequencyPenalty,
    presencePenalty: cfg.presencePenalty,
    maxTokens: cfg.maxTokens,
    // Claude path expands this further so thinking cannot starve the answer.
    captureThinking: cfg.captureThinking,
    showThinking: cfg.showThinking,
  };

  const baseTrace = {
    provider: cfg.provider,
    model: cfg.model,
    baseUrl: cfg.baseUrl,
    api: cfg.api,
    params,
    masterPrompt: parts.master,
    context: parts.context,
    question: String(question || ''),
    historyTurns: Array.isArray(history) ? history.length : 0,
  };

  try {
    const reply =
      cfg.api === 'anthropic'
        ? await callAnthropic(cfg, parts.system, history, parts.question)
        : await callOpenAiCompatible(cfg, parts.system, history, parts.question);

    if (!reply.text) {
      throw new Error(`Empty LLM response (${reply.finishReason || 'unknown'})`);
    }

    const trace = {
      ...baseTrace,
      ok: true,
      thinking: cfg.captureThinking ? reply.thinking || '' : '',
      output: reply.text,
      usage: reply.usage,
      latencyMs: reply.latencyMs,
      finishReason: reply.finishReason,
      request: reply.requestBody,
    };
    await writeLlmTrace(env, trace);

    const result = {
      text: reply.text,
      provider: cfg.provider,
      used_llm: true,
      model: cfg.model,
      usage: reply.usage,
      latencyMs: reply.latencyMs,
    };
    if (cfg.captureThinking && reply.thinking) {
      result.thinkingCaptured = true;
      if (cfg.showThinking) result.thinking = reply.thinking;
    }
    return result;
  } catch (error) {
    await writeLlmTrace(env, {
      ...baseTrace,
      ok: false,
      error: String(error?.message || error).slice(0, 400),
      thinking: '',
      output: '',
      usage: null,
    });
    throw error;
  }
}

/** Drop leaked chain-of-thought / planning when the model puts it in content. */
function finalizeAssistantText(raw) {
  let text = String(raw || '').trim();
  if (!text) return '';
  const leaked =
    /^the user wants\b/i.test(text) ||
    /\bconstraints to (?:follow|check)\b/i.test(text) ||
    /\bi (?:should|need to) keep it\b/i.test(text);
  if (!leaked) return text;

  const quoted = [...text.matchAll(/"([^"\n]{20,400})"/g)].map((m) => m[1].trim());
  if (quoted.length) return quoted[quoted.length - 1];

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && /lagna|moon|dasha|house|chart|mesha|career|initiative/i.test(s));
  if (sentences.length) return sentences[sentences.length - 1];

  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(
      (p) =>
        p.length >= 40 &&
        !/^the user wants\b/i.test(p) &&
        !/\bconstraints to (?:follow|check)\b/i.test(p) &&
        !/\bi (?:should|need to)\b/i.test(p)
    );
  return (parts[parts.length - 1] || text).trim();
}

function extractMessageText(message) {
  if (!message || typeof message !== 'object') return '';
  // Prefer visible content; do not fall back to reasoning into the user answer.
  const direct = message.content ?? message.text;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  if (Array.isArray(direct)) {
    return direct
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        if (part && typeof part.content === 'string') return part.content;
        return '';
      })
      .join('')
      .trim();
  }
  // Last resort for hosts that only return reasoning_content.
  if (typeof message.reasoning_content === 'string') return message.reasoning_content.trim();
  return '';
}

function extractThinkingText(message) {
  if (!message || typeof message !== 'object') return '';
  const parts = [];
  if (typeof message.reasoning_content === 'string') parts.push(message.reasoning_content.trim());
  if (typeof message.reasoning === 'string') parts.push(message.reasoning.trim());
  if (Array.isArray(message.content)) {
    message.content.forEach((part) => {
      if (part && part.type === 'thinking' && typeof part.text === 'string') {
        parts.push(part.text.trim());
      }
    });
  }
  return parts.filter(Boolean).join('\n\n').trim();
}

function expectedInvite(env) {
  return String(env.BETA_INVITE_CODE || DEFAULT_INVITE).trim().toUpperCase();
}

function authorizeBeta(body, env) {
  const email = String(body?.email || '')
    .trim()
    .toLowerCase();
  const invite = String(body?.inviteCode || '')
    .trim()
    .toUpperCase();
  if (!email.includes('@')) return null;
  if (invite !== expectedInvite(env)) return null;
  return email;
}

function accountCacheKey(email) {
  return new Request(`https://kundali-beta.internal/account/${encodeURIComponent(email)}`);
}

async function readAccountStore(env, email) {
  if (env.SETTINGS) {
    const raw = await env.SETTINGS.get(`account:${email}`, 'json');
    if (raw) return raw;
  }
  try {
    const cached = await caches.default.match(accountCacheKey(email));
    if (cached) return cached.json();
  } catch {
    // ignore
  }
  return null;
}

async function writeAccountStore(env, email, account) {
  const payload = { ...account, email, updatedAt: new Date().toISOString() };
  if (env.SETTINGS) {
    await env.SETTINGS.put(`account:${email}`, JSON.stringify(payload));
  }
  try {
    await caches.default.put(
      accountCacheKey(email),
      new Response(JSON.stringify(payload), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'max-age=31536000',
        },
      })
    );
  } catch {
    // Cache API may be unavailable in some runtimes; KV path still works.
  }
  return payload;
}

function renderTemplate(template, vars) {
  return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_m, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      const v = vars[key];
      return v == null ? '' : String(v);
    }
    return '';
  });
}

function valueAtPath(obj, path) {
  if (!path) return obj;
  return String(path)
    .split('.')
    .filter(Boolean)
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function buildChartInferenceVars(chartVars, env, secretName) {
  const vars = { ...(chartVars && typeof chartVars === 'object' ? chartVars : {}) };
  if (secretName && env[secretName]) {
    vars[`secret.${secretName}`] = String(env[secretName]);
  }
  // Common aliases
  if (vars['birth.date'] == null && vars.date != null) vars['birth.date'] = vars.date;
  if (vars['birth.time'] == null && vars.time != null) vars['birth.time'] = vars.time;
  if (vars['birth.lat'] == null && vars.lat != null) vars['birth.lat'] = vars.lat;
  if (vars['birth.lon'] == null && vars.lon != null) vars['birth.lon'] = vars.lon;
  return vars;
}

/**
 * Optional third-party chart/Jyotish (or inference-LLM) call using Lab template mapping.
 * mode llm_only → no-op; inference_then_llm → enrich context; inference_only → answer text.
 */
async function runChartInference(env, lab, { chartContext, chartVars, question, locale, summary }) {
  const cfg = sanitizeChartInference(lab?.chartInference);
  if (cfg.mode === 'llm_only') {
    return { mode: cfg.mode, chartContext, answerText: null, inference: null };
  }
  if (!cfg.baseUrl) {
    return { mode: cfg.mode, chartContext, answerText: null, inference: { error: 'missing_base_url' } };
  }
  if (!/^https?:\/\//i.test(cfg.baseUrl)) {
    return { mode: cfg.mode, chartContext, answerText: null, inference: { error: 'invalid_base_url' } };
  }

  const vars = buildChartInferenceVars(
    {
      ...(chartVars && typeof chartVars === 'object' ? chartVars : {}),
      question: question || '',
      locale: locale || 'en',
      summary: summary || '',
    },
    env,
    cfg.secretName
  );
  let headers = {};
  try {
    headers = JSON.parse(renderTemplate(cfg.headersJson || '{}', vars));
  } catch {
    return { mode: cfg.mode, chartContext, answerText: null, inference: { error: 'invalid_headers_json' } };
  }
  if (!headers || typeof headers !== 'object') headers = {};

  const init = {
    method: cfg.method,
    headers: { accept: 'application/json', ...headers },
  };
  let url = cfg.baseUrl;
  if (cfg.method === 'GET') {
    const rendered = renderTemplate(cfg.bodyTemplate || '', vars);
    try {
      const q = JSON.parse(rendered);
      const params = new URLSearchParams();
      Object.entries(q || {}).forEach(([k, v]) => {
        if (v != null && v !== '') params.set(k, String(v));
      });
      url = `${cfg.baseUrl}${cfg.baseUrl.includes('?') ? '&' : '?'}${params.toString()}`;
    } catch {
      /* leave URL as-is */
    }
  } else {
    init.body = renderTemplate(cfg.bodyTemplate || '{}', vars);
    if (!init.headers['content-type'] && !init.headers['Content-Type']) {
      init.headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await fetch(url, init);
    const raw = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    if (!response.ok) {
      return {
        mode: cfg.mode,
        chartContext,
        answerText: null,
        inference: { error: `chart_inference_${response.status}`, detail: String(raw).slice(0, 400) },
      };
    }

    if (cfg.mode === 'inference_only') {
      const answerText =
        extractInferenceAnswerText(parsed, cfg) ||
        (typeof parsed === 'string' ? parsed.trim() : JSON.stringify(parsed).slice(0, 8000));
      return {
        mode: cfg.mode,
        chartContext,
        answerText,
        inference: { ok: true, status: response.status, mode: cfg.mode, bytes: answerText.length },
      };
    }

    // inference_then_llm — append into chart context for the Lab LLM
    const extracted = valueAtPath(typeof parsed === 'object' ? parsed : { raw: parsed }, cfg.responseJsonPath);
    const snippet =
      typeof extracted === 'string' ? extracted : JSON.stringify(extracted ?? parsed, null, 0);
    const enriched = `${chartContext || ''}\n\nExternal chart inference (JSON):\n${String(snippet).slice(0, 8000)}`;
    return {
      mode: cfg.mode,
      chartContext: enriched,
      answerText: null,
      inference: { ok: true, status: response.status, mode: cfg.mode, bytes: String(snippet).length },
    };
  } catch (error) {
    return {
      mode: cfg.mode,
      chartContext,
      answerText: null,
      inference: { error: String(error?.message || error).slice(0, 240) },
    };
  }
}

async function handleChat(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.question) {
    return json({ error: 'question is required' }, 400);
  }

  const question = String(body.question).trim();
  const locale = body.locale === 'hi' ? 'hi' : 'en';
  if (/suicide|kill myself|self-harm|end my life|want to die|आत्महत्या|मरना चाहता/i.test(question)) {
    return json(crisisReply(locale));
  }

  let chartContext = body.chartContext || 'No chart provided.';
  const summary = String(body.summary || '').slice(0, 1200);
  // Prefer client-assembled history (already windowed + anonymised); fall back to raw.
  const history = Array.isArray(body.history) ? body.history : [];
  const lab = await readLlmLab(env);
  const pipeline = await runChartInference(env, lab, {
    chartContext,
    chartVars: body.chartVars || body.birth,
    question,
    locale,
    summary,
  });
  chartContext = pipeline.chartContext;

  // Mode: inference provider is the answer (often an LLM of its own) — skip Lab LLM.
  if (pipeline.mode === 'inference_only') {
    if (pipeline.answerText) {
      return json({
        text: finalizeAssistantText(pipeline.answerText),
        provider: 'chart-inference',
        used_llm: false,
        used_inference: true,
        chartInference: pipeline.inference || undefined,
        usage: {
          modelTier: body.modelTier || 'flash',
          anonymousId: body.anonymousId || '',
        },
      });
    }
    return json({
      text: chartAwareFallback(question, chartContext, locale),
      provider: 'chart-inference-fallback',
      used_llm: false,
      used_inference: true,
      chartInference: pipeline.inference || undefined,
      warning: pipeline.inference?.error || 'inference_empty_answer',
      usage: {
        modelTier: body.modelTier || 'flash',
        anonymousId: body.anonymousId || '',
      },
    });
  }

  try {
    const llm = await openAiReply(env, question, chartContext, history, locale, summary, lab);
    if (llm) {
      return json({
        ...llm,
        used_inference: pipeline.mode === 'inference_then_llm',
        chartInference: pipeline.inference || undefined,
        usage: {
          ...(llm.usage || {}),
          modelTier: body.modelTier || 'flash',
          anonymousId: body.anonymousId || '',
        },
      });
    }
  } catch (error) {
    return json({
      text: chartAwareFallback(question, chartContext, locale),
      provider: 'chart-fallback',
      used_llm: false,
      used_inference: pipeline.mode === 'inference_then_llm',
      chartInference: pipeline.inference || undefined,
      warning: String(error.message || error),
    });
  }

  return json({
    text: chartAwareFallback(question, chartContext, locale),
    provider: 'chart-local',
    used_llm: false,
    used_inference: pipeline.mode === 'inference_then_llm',
    usage: {
      modelTier: body.modelTier || 'flash',
      anonymousId: body.anonymousId || '',
    },
  });
}

async function handleSettings(request, env) {
  const body = await request.json().catch(() => null);
  const email = authorizeBeta(body, env);
  if (!email) return json({ error: 'unauthorized' }, 401);

  const existing = (await readAccountStore(env, email)) || {};
  if (body.action === 'get') {
    return json({
      settings: existing.settings || { locale: 'en' },
      updatedAt: existing.updatedAt || null,
    });
  }
  if (body.action === 'put') {
    const locale = body.settings?.locale === 'hi' ? 'hi' : 'en';
    const settings = { locale, updatedAt: new Date().toISOString() };
    const saved = await writeAccountStore(env, email, { ...existing, settings });
    return json({ ok: true, settings: saved.settings });
  }
  return json({ error: 'action must be get or put' }, 400);
}

async function handleAccount(request, env) {
  const body = await request.json().catch(() => null);
  const email = authorizeBeta(body, env);
  if (!email) return json({ error: 'unauthorized' }, 401);

  if (body.action === 'get') {
    const account = await readAccountStore(env, email);
    return json({ account: account || null });
  }
  if (body.action === 'put') {
    if (!body.account || typeof body.account !== 'object') {
      return json({ error: 'account is required' }, 400);
    }
    const saved = await writeAccountStore(env, email, body.account);
    return json({ ok: true, account: saved });
  }
  return json({ error: 'action must be get or put' }, 400);
}

function estimateTzOffsetHours(lat, lon, countryCode) {
  const cc = String(countryCode || '').toUpperCase();
  if (cc === 'IN' || cc === 'IND') return 5.5;
  if (cc === 'NP') return 5.75;
  if (cc === 'LK') return 5.5;
  if (cc === 'BD') return 6;
  if (cc === 'PK') return 5;
  if (cc === 'AE') return 4;
  if (cc === 'GB') return 0;
  const rough = Math.round((Number(lon) || 0) / 15);
  return Math.max(-12, Math.min(14, rough));
}

async function googleTimezone(env, lat, lon) {
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${key}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 'OK') return null;
  const seconds = Number(data.rawOffset || 0) + Number(data.dstOffset || 0);
  return seconds / 3600;
}

async function googleAutocomplete(env, input) {
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', input);
  url.searchParams.set('types', '(cities)');
  url.searchParams.set('key', key);
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return null;
  return (data.predictions || []).map((item) => ({
    placeId: item.place_id,
    description: item.description,
    provider: 'google',
  }));
}

async function googleDetails(env, placeId) {
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'formatted_address,geometry,address_component,name');
  url.searchParams.set('key', key);
  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 'OK' || !data.result) return null;
  const result = data.result;
  const lat = result.geometry?.location?.lat;
  const lon = result.geometry?.location?.lng;
  const country = (result.address_components || []).find((c) =>
    (c.types || []).includes('country')
  );
  const countryCode = country?.short_name || '';
  const tzOffsetHours =
    (await googleTimezone(env, lat, lon)) ?? estimateTzOffsetHours(lat, lon, countryCode);
  return {
    placeId,
    label: result.formatted_address || result.name,
    lat,
    lon,
    countryCode,
    tzOffsetHours,
    source: 'google',
  };
}

async function nominatimAutocomplete(input) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', input);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  const response = await fetch(url.toString(), {
    headers: {
      'user-agent': 'KundaliWebappBeta/1.0 (birth-place lookup)',
      accept: 'application/json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return (data || []).map((item) => ({
    placeId: `nominatim:${item.place_id}`,
    description: item.display_name,
    provider: 'nominatim',
    lat: Number(item.lat),
    lon: Number(item.lon),
    countryCode: item.address?.country_code?.toUpperCase() || '',
  }));
}

async function nominatimDetails(placeId, hint) {
  if (hint?.lat != null && hint?.lon != null) {
    const lat = Number(hint.lat);
    const lon = Number(hint.lon);
    return {
      placeId,
      label: hint.description || hint.label,
      lat,
      lon,
      countryCode: hint.countryCode || '',
      tzOffsetHours: estimateTzOffsetHours(lat, lon, hint.countryCode),
      source: 'nominatim',
    };
  }
  const id = String(placeId || '').replace(/^nominatim:/, '');
  const url = new URL('https://nominatim.openstreetmap.org/lookup');
  url.searchParams.set('osm_ids', `N${id}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  // Nominatim place_id lookup via details endpoint
  const searchUrl = new URL('https://nominatim.openstreetmap.org/details');
  searchUrl.searchParams.set('place_id', id);
  searchUrl.searchParams.set('format', 'json');
  const response = await fetch(searchUrl.toString(), {
    headers: {
      'user-agent': 'KundaliWebappBeta/1.0 (birth-place lookup)',
      accept: 'application/json',
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  const lat = Number(data.centroid?.coordinates?.[1] ?? data.lat);
  const lon = Number(data.centroid?.coordinates?.[0] ?? data.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const countryCode = data.country_code?.toUpperCase() || '';
  return {
    placeId,
    label: data.localname || data.names?.name || data.addresstags?.city || 'Selected place',
    lat,
    lon,
    countryCode,
    tzOffsetHours: estimateTzOffsetHours(lat, lon, countryCode),
    source: 'nominatim',
  };
}

async function handlePlacesAutocomplete(request, env) {
  const body = await request.json().catch(() => null);
  const email = authorizeBeta(body, env);
  if (!email) return json({ error: 'unauthorized' }, 401);
  const input = String(body.input || '').trim();
  if (input.length < 2) return json({ predictions: [], provider: 'none' });

  const google = await googleAutocomplete(env, input);
  if (google) {
    return json({
      predictions: google,
      provider: 'google',
      placesConfigured: true,
    });
  }

  const nominatim = await nominatimAutocomplete(input);
  return json({
    predictions: nominatim,
    provider: 'nominatim',
    placesConfigured: Boolean(env.GOOGLE_PLACES_API_KEY),
  });
}

async function handlePlacesDetails(request, env) {
  const body = await request.json().catch(() => null);
  const email = authorizeBeta(body, env);
  if (!email) return json({ error: 'unauthorized' }, 401);
  const placeId = String(body.placeId || '').trim();
  if (!placeId) return json({ error: 'placeId is required' }, 400);

  if (!placeId.startsWith('nominatim:') && env.GOOGLE_PLACES_API_KEY) {
    const place = await googleDetails(env, placeId);
    if (place) return json({ place });
  }

  const place = await nominatimDetails(placeId, body);
  if (!place) return json({ error: 'place not found' }, 404);
  return json({ place });
}

async function handleLlmLab(request, env) {
  const body = await request.json().catch(() => null);
  const email = authorizeAdmin(body, env);
  if (!email) {
    return json(
      {
        error: 'unauthorized',
        detail: env.ADMIN_TOKEN
          ? 'Beta session plus ADMIN_TOKEN required.'
          : 'Valid beta invite session required.',
      },
      401
    );
  }

  if (body.action === 'get') {
    const lab = await readLlmLab(env);
    const trace = await readLlmTrace(env);
    return json({ ok: true, lab: publicLlmLabView(lab, env), trace, admin: email });
  }

  if (body.action === 'trace') {
    const trace = await readLlmTrace(env);
    return json({ ok: true, trace });
  }

  if (body.action === 'probe') {
    const lab = await readLlmLab(env);
    const question = String(body.question || 'Give a one-sentence career note from this chart.').trim();
    const chartContext = String(body.chartContext || 'Lagna: Mesha. Moon: Karka. Current dasha: Saturn–Mercury.').slice(
      0,
      4000
    );
    try {
      const llm = await openAiReply(env, question, chartContext, [], body.locale === 'hi' ? 'hi' : 'en', '', lab);
      const trace = await readLlmTrace(env);
      return json({ ok: true, reply: llm, trace, lab: publicLlmLabView(lab, env) });
    } catch (error) {
      const trace = await readLlmTrace(env);
      return json({ ok: false, error: String(error?.message || error), trace }, 502);
    }
  }

  if (body.action === 'put') {
    const existing = await readLlmLab(env);
    const next = {
      ...existing,
      customProviders: listCustomProviders(existing),
      keysConfigured: { ...(existing.keysConfigured || {}) },
    };
    delete next.apiKey;
    if (typeof body.masterPrompt === 'string') next.masterPrompt = body.masterPrompt.slice(0, 12000);
    if (typeof body.model === 'string') next.model = body.model.trim().slice(0, 200);
    if (body.topP != null) next.topP = clampNumber(body.topP, 0, 1, existing.topP);
    if (body.frequencyPenalty != null) {
      next.frequencyPenalty = clampNumber(body.frequencyPenalty, -2, 2, existing.frequencyPenalty);
    }
    if (body.presencePenalty != null) {
      next.presencePenalty = clampNumber(body.presencePenalty, -2, 2, existing.presencePenalty);
    }
    if (body.maxTokens != null) next.maxTokens = clampNumber(body.maxTokens, 64, 16384, existing.maxTokens);
    if (typeof body.captureThinking === 'boolean') next.captureThinking = body.captureThinking;
    if (typeof body.showThinking === 'boolean') next.showThinking = body.showThinking;
    if (typeof body.thinkingEffort === 'string') {
      const effort = body.thinkingEffort.toLowerCase().trim();
      if (['low', 'medium', 'high', 'xhigh', 'max'].includes(effort)) next.thinkingEffort = effort;
    }
    if (body.chartInference && typeof body.chartInference === 'object') {
      next.chartInference = sanitizeChartInference({
        ...sanitizeChartInference(existing.chartInference),
        ...body.chartInference,
      });
    }
    // Merge incoming per-provider profiles (partial updates allowed).
    if (body.providerProfiles && typeof body.providerProfiles === 'object') {
      next.providerProfiles = { ...(existing.providerProfiles || {}) };
      Object.entries(body.providerProfiles).forEach(([id, profile]) => {
        if (!profile || typeof profile !== 'object') return;
        next.providerProfiles[id] = {
          ...readProviderProfile(existing, id),
          ...profile,
        };
      });
    }

    // Upsert / update a custom provider definition (no key material stored here).
    if (body.customProvider && typeof body.customProvider === 'object') {
      const cp = body.customProvider;
      const label = String(cp.label || cp.name || '').trim().slice(0, 80);
      const baseUrl = String(cp.baseUrl || '').trim().replace(/\/$/, '').slice(0, 300);
      if (!label || !baseUrl) {
        return json({ error: 'custom_provider_invalid', detail: 'Custom provider needs a name and base URL.' }, 400);
      }
      if (!/^https?:\/\//i.test(baseUrl)) {
        return json({ error: 'custom_provider_invalid', detail: 'Base URL must start with http:// or https://.' }, 400);
      }
      let id = String(cp.id || '').trim();
      if (!id || normalizeBuiltInProviderId(id)) id = slugifyProviderId(label);
      // Ensure unique id.
      const taken = next.customProviders.some((p) => p.id === id && p.id !== cp.id);
      if (taken) id = `${id}_${Date.now().toString(36).slice(-4)}`;
      const entry = {
        id,
        label,
        baseUrl,
        api: cp.api === 'anthropic' ? 'anthropic' : 'openai',
        secretName: customSecretName(id),
        defaultModel: String(cp.defaultModel || cp.model || '').slice(0, 200),
      };
      const idx = next.customProviders.findIndex((p) => p.id === id);
      if (idx >= 0) next.customProviders[idx] = { ...next.customProviders[idx], ...entry };
      else next.customProviders.push(entry);
      next.provider = id;
      if (entry.defaultModel) next.model = entry.defaultModel;
    }

    if (typeof body.provider === 'string' && body.provider !== '__add_custom__') {
      next.provider = normalizeProviderId(body.provider, next);
    }

    // Keep active provider's profile in sync with the flat Lab fields just saved.
    {
      const activeId = next.provider || 'nvidia';
      const activeProfile = {
        ...readProviderProfile(next, activeId),
        model: next.model,
        topP: next.topP,
        frequencyPenalty: next.frequencyPenalty,
        presencePenalty: next.presencePenalty,
        maxTokens: next.maxTokens,
        captureThinking: next.captureThinking,
        showThinking: next.showThinking,
        thinkingEffort: next.thinkingEffort || 'high',
      };
      Object.assign(next, syncFlatFromProfile(next, activeId, activeProfile));
    }

    // Custom providers may update base URL when selected.
    const selectedMeta = resolveProviderMeta(next.provider, next);
    if (selectedMeta.custom && typeof body.baseUrl === 'string' && body.baseUrl.trim()) {
      const baseUrl = body.baseUrl.trim().replace(/\/$/, '').slice(0, 300);
      if (!/^https?:\/\//i.test(baseUrl)) {
        return json({ error: 'custom_provider_invalid', detail: 'Base URL must start with http:// or https://.' }, 400);
      }
      next.customProviders = next.customProviders.map((p) =>
        p.id === selectedMeta.id ? { ...p, baseUrl } : p
      );
    }

    next.updatedBy = email;

    let secretResult = null;
    const incomingKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    const meta = resolveProviderMeta(next.provider, next);

    // NVIDIA key is permanent — never overwrite from Lab.
    if (meta.id === 'nvidia') {
      // ignore incomingKey
    } else if (incomingKey && !incomingKey.includes('•')) {
      secretResult = await putWorkerSecret(env, meta.secretName, incomingKey.slice(0, 400));
      if (!secretResult.ok) {
        return json(
          {
            error: 'secret_write_failed',
            detail: secretResult.error,
            lab: publicLlmLabView(existing, env),
          },
          502
        );
      }
      next.keysConfigured = { ...next.keysConfigured, [meta.id]: true };
    } else if (!keyIsConfigured(env, next, meta)) {
      return json(
        {
          error: 'api_key_required',
          detail: `API key required for ${meta.label}. Paste a key once — it is saved as Cloudflare secret ${meta.secretName} and reused until you replace it.`,
          lab: publicLlmLabView({ ...existing, ...next, provider: next.provider }, env),
        },
        400
      );
    }

    const saved = await writeLlmLab(env, next);
    return json({
      ok: true,
      lab: publicLlmLabView(saved, env),
      secretSaved: Boolean(secretResult?.ok),
      secretName: secretResult?.secretName || null,
      note: secretResult?.ok
        ? `API key stored as Cloudflare secret ${secretResult.secretName}. It stays until you paste a new key for this provider.`
        : meta.id === 'nvidia'
          ? 'Using permanent NVIDIA Cloudflare secret. Other settings saved.'
          : undefined,
    });
  }

  if (body.action === 'deleteCustom') {
    const existing = await readLlmLab(env);
    const id = String(body.providerId || body.id || '').trim();
    if (!id || normalizeBuiltInProviderId(id)) {
      return json({ error: 'invalid_custom_provider' }, 400);
    }
    const next = {
      ...existing,
      customProviders: listCustomProviders(existing).filter((p) => p.id !== id),
      keysConfigured: { ...(existing.keysConfigured || {}) },
    };
    delete next.keysConfigured[id];
    if (next.provider === id) next.provider = 'nvidia';
    const saved = await writeLlmLab(env, next);
    return json({ ok: true, lab: publicLlmLabView(saved, env) });
  }

  if (body.action === 'reset') {
    const existing = await readLlmLab(env);
    // Keep custom providers + key flags; never touch Cloudflare secrets (incl. NVIDIA).
    const saved = await writeLlmLab(env, {
      ...DEFAULT_LLM_LAB,
      customProviders: listCustomProviders(existing),
      keysConfigured: { ...(existing.keysConfigured || {}) },
      provider: 'nvidia',
    });
    return json({
      ok: true,
      lab: publicLlmLabView(saved, env),
      note: 'Lab defaults reset. Provider keys and custom providers were kept; NVIDIA secret untouched.',
    });
  }

  return json({ error: 'action must be get, put, reset, trace, probe, or deleteCustom' }, 400);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return json({ ok: true });
    }

    if (url.pathname === '/api/health') {
      const lab = await readLlmLab(env);
      const cfg = llmConfig(env, lab);
      const chartRemote = await probeChartRemote(env);
      return json({
        ok: true,
        llm: Boolean(cfg?.key || env.OPENAI_API_KEY || env.NVIDIA_API_KEY),
        llmProvider: cfg?.provider || null,
        llmModel: cfg?.model || null,
        masterPrompt: Boolean(String(masterPrompt(env, lab) || '').trim()),
        places: Boolean(env.GOOGLE_PLACES_API_KEY),
        settingsStore: Boolean(env.SETTINGS),
        llmLab: true,
        chartRemote: chartRemote.ok,
        chartRemoteDetail: chartRemote.detail,
        chartApiConfigured: Boolean(chartRemoteConfig(env).baseUrl),
        service: 'kundali-webapp',
        build: env.WORKER_BUILD || null,
      });
    }

    if (url.pathname === '/api/chart' && request.method === 'POST') {
      return handleChartProxy(request, env);
    }
    if (url.pathname === '/api/gochara' && request.method === 'POST') {
      return handleGocharaProxy(request, env);
    }


    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }
    if (url.pathname === '/api/settings' && request.method === 'POST') {
      return handleSettings(request, env);
    }
    if (url.pathname === '/api/account' && request.method === 'POST') {
      return handleAccount(request, env);
    }
    if (url.pathname === '/api/places/autocomplete' && request.method === 'POST') {
      return handlePlacesAutocomplete(request, env);
    }
    if (url.pathname === '/api/places/details' && request.method === 'POST') {
      return handlePlacesDetails(request, env);
    }
    if (url.pathname === '/api/admin/llm' && request.method === 'POST') {
      return handleLlmLab(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'not found' }, 404);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response('Assets binding missing', { status: 500 });
  },
};
