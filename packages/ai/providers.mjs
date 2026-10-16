export function providerStatus(env={}){
  return {
    openai: Boolean(env.OPENAI_API_KEY),
    gemini: Boolean(env.GEMINI_API_KEY),
    mode: 'fail-closed'
  };
}
export async function executeProvider(){
  throw new Error('PROVIDER_EXECUTION_REQUIRES_CERTIFIED_RUNTIME');
}
