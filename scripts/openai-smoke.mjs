const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL?.trim() || 'gpt-6-luna';
const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '');

if (!apiKey) {
  console.error('OPENAI_API_KEY_REQUIRED');
  process.exit(2);
}

const response = await fetch(`${baseUrl}/responses`, {
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
});

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

console.log(JSON.stringify({
  ok: true,
  provider: 'openai',
  model: payload.model || model,
  responseId: payload.id || null,
  output: 'URBAN_ONE_OPENAI_OK',
}));
