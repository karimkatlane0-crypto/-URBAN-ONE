/**
 * Isolated Developer API provider adapter.
 * Only the explicit, consented request prompt is sent; no private goals,
 * Lastre CRM intents, photos, user identifiers, student data or message history.
 * This is distinct from the SEVA first-party in-app assistant.
 */
export async function developerAI(_user, prompt, config = process.env, send = fetch) {
  if (!config.OPENAI_API_KEY)
    throw Object.assign(Error('OpenAI provider unavailable'), { status: 503 });
  const endpoint = config.OPENAI_BASE_URL || 'https://api.openai.com/v1/responses';
  // Fail closed: arbitrary URLs must never receive provider credentials.
  if (endpoint !== 'https://api.openai.com/v1/responses')
    throw Object.assign(Error('Nonstandard AI endpoint requires a separate security review'), { status: 503 });
  let response;
  try {
    response = await send(endpoint, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + config.OPENAI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.OPENAI_MODEL || 'gpt-5.1',
        instructions: 'Act as SEVA: turn the supplied objective into a practical plan. Include actions, criteria and evidence, and distinguish proposed work from work actually completed. Never claim provider operations or payment execution.',
        input: prompt,
        store: false,
        max_output_tokens: 900
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
    const code = body?.error?.code;
    if (response.status === 429 || code === 'credit_balance_exhausted')
      throw Object.assign(Error('AI provider credit or quota unavailable'), { status: 503 });
    throw Object.assign(Error('AI provider request failed'), { status: 502 });
  }
  const text = body.output_text ||
    body.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text')
      .map(item => item.text).join('\n');
  if (!text) throw Object.assign(Error('AI provider returned no output'), { status: 502 });
  return { text, provider:'OpenAI', model: body.model || config.OPENAI_MODEL || 'gpt-5.1', id: body.id, verified: true };
}
