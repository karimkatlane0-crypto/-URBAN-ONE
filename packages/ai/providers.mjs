export function providerStatus(env={}) {
  return {
    primary: 'openai',
    openai: Boolean(env.OPENAI_API_KEY?.trim() && env.OPENAI_MODEL?.trim()),
    gemini: Boolean(env.GEMINI_API_KEY?.trim()),
    mode: 'fail-closed',
    liveVerified: false
  };
}
export async function executeProvider() {
  throw new Error('PROVIDER_EXECUTION_REQUIRES_CERTIFIED_RUNTIME');
}
