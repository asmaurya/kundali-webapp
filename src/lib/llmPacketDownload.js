/**
 * Format and download the full LLM request/response packet as a .txt file.
 */

function section(title, body) {
  const text = body == null || body === '' ? '(none)' : String(body);
  return `===== ${title} =====\n${text}\n`;
}

function pretty(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatLlmPacketText(packet = {}, fallbackOutput = '') {
  const p = packet || {};
  const parts = [
    section('META', pretty({
      at: p.at || new Date().toISOString(),
      provider: p.provider || null,
      model: p.model || null,
      api: p.api || null,
      baseUrl: p.baseUrl || null,
      latencyMs: p.latencyMs ?? null,
      finishReason: p.finishReason || null,
      topics: p.topics || [],
      chartIds: p.chartIds || [],
    })),
    section('PARAMS', pretty(p.params || null)),
    section('MASTER_PROMPT', p.masterPrompt || ''),
    section('SYSTEM', p.system || ''),
    section('CHART_CONTEXT_AND_JSON', p.context || p.chartContext || ''),
    section('QUESTION', p.question || ''),
    section('HISTORY', pretty(p.history || [])),
    section('REQUEST_BODY_SANITIZED', pretty(p.request || null)),
    section('THINKING', p.thinking || ''),
    section('OUTPUT', p.output || fallbackOutput || ''),
    section('TOKEN_USAGE', pretty(p.usage || null)),
    section('CHART_INFERENCE', pretty(p.chartInference || null)),
  ];
  return parts.join('\n');
}

export function downloadLlmPacket(packet, fallbackOutput = '', filenameHint = 'llm-packet') {
  const text = formatLlmPacketText(packet, fallbackOutput);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `${String(filenameHint || 'llm-packet').replace(/[^\w.-]+/g, '_').slice(0, 48)}-${stamp}.txt`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
