/**
 * SEVA Developer AI: server-only, consented OpenAI Responses adapter.
 * The caller must enforce authenticated identity and per-account quotas.
 * Never expose this module or its credentials in a browser bundle.
 */
export async function developerAI(_user, prompt, config = process.env, send = fetch) {
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 12000)
    throw Object.assign(Error('Invalid AI input'), { status: 400 });
  const key = config.OPENAI_API_KEY?.trim();
  const model = config.OPENAI_MODEL?.trim();
  if (!key || !model)
    throw Object.assign(Error('OpenAI configuration required'), { status: 503 });
  if (!/^[a-zA-Z0-9._:-]{1,160}$/.test(model))
    throw Object.assign(Error('Invalid AI model configuration'), { status: 503 });
  const endpoint = 'https://api.openai.com/v1/responses';
  if (config.OPENAI_BASE_URL && config.OPENAI_BASE_URL !== endpoint)
    throw Object.assign(Error('Nonstandard AI endpoint requires security review'), { status: 503 });
  let response;
  try {
    response = await send(endpoint, {
      method: 'POST',
      redirect: 'error',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        instructions: 'Act as SEVA. Distinguish proposals from verified execution. Never claim payments, deployments or provider operations without evidence.',
        input: prompt,
        store: false,
        max_output_tokens: 1024
      }),
      signal: AbortSignal.timeout(30000)
    });
  } catch {
    throw Object.assign(Error('AI provider connection failed'), { status: 502 });
  }
  let body;
  try { body = await response.json(); }
  catch { throw Object.assign(Error('AI provider returned invalid data'), { status: 502 }); }
  if (!response.ok) {
    if (response.status === 429 || body?.error?.code === 'credit_balance_exhausted')
      throw Object.assign(Error('AI provider credit or quota unavailable'), { status: 503 });
    throw Object.assign(Error('AI provider request failed'), { status: 502 });
  }
  const text = body.output_text ||
    body.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text')
      .map(item => item.text).join('\n');
  if (body.status !== 'completed' || typeof text !== 'string' || !text.trim())
    throw Object.assign(Error('AI response not completed'), { status: 502 });
  if (typeof body.id !== 'string' || !/^resp_[A-Za-z0-9_-]+$/.test(body.id))
    throw Object.assign(Error('AI provider returned invalid response ID'), { status: 502 });
  return { text, provider: 'OpenAI', model: body.model || model, id: body.id, verified: true };
}
