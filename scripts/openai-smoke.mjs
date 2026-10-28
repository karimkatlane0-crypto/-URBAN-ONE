const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL?.trim();
const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '');

function isLocalTestEndpoint(candidate) {
  try {
    const url = new URL(candidate);
    return process.env.NODE_ENV === 'test' && url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      url.pathname === '/v1' && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
}
if (!apiKey) {
  console.error('OPENAI_API_KEY_REQUIRED');
  process.exit(2);
}
if (!model) {
  console.error('OPENAI_MODEL_REQUIRED');
  process.exit(2);
}
if (baseUrl !== 'https://api.openai.com/v1' && !isLocalTestEndpoint(baseUrl)) {
  console.error('OPENAI_BASE_URL_REJECTED');
  process.exit(2);
}

let response;
try {
  response = await fetch(`${baseUrl}/responses`, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${apiKey}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model,
    input: 'Reply with exactly: URBAN_ONE_OPENAI_OK',
    max_output_tokens: 32,
    store: false,
  }),
  signal: AbortSignal.timeout(30000),
  });
} catch {
  console.error('OPENAI_REQUEST_FAILED');
  process.exit(1);
}

const payload = await response.json().catch(() => ({}));

if (!response.ok) {
  const errorType = payload?.error?.type || 'OPENAI_API_ERROR';
  const errorCode = payload?.error?.code || response.status;
  console.error(`${errorType}:${errorCode}`);
  process.exit(1);
}

const outputText = typeof payload.output_text === 'string'
  ? payload.output_text
  : (payload.output || [])
      .flatMap((item) => item?.content || [])
      .map((part) => part?.text)
      .filter(Boolean)
      .join('');

if (!outputText.includes('URBAN_ONE_OPENAI_OK')) {
  console.error('OPENAI_SMOKE_UNEXPECTED_OUTPUT');
  process.exit(1);
}

if (typeof payload.id !== 'string' || !payload.id.trim()) {
  console.error('OPENAI_RESPONSE_ID_REQUIRED');
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  provider: 'openai',
  model: payload.model || model,
  responseId: payload.id,
  output: 'URBAN_ONE_OPENAI_OK',
}));
