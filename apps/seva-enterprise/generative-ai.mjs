/**
 * SEVA first-party generative inference router.
 * Strict opt-in, server-only credentials and an explicit provider per request.
 * No model training, private goal upload, provider fallback, tool execution or
 * automatic financial transactions. The caller enforces auth, consent and plan.
 */
import {developerAI} from './developer-ai.mjs';

const problem=(message,status)=>Object.assign(new Error(message),{status});

export function selectProvider(value='openai') {
  if(value==='openai'||value==='gemini')return value;
  throw problem('Unsupported AI provider. Choose openai or gemini.',400);
}
export function providerStatus(env=process.env) {
  return {
    openai:Boolean(env.OPENAI_API_KEY),
    gemini:env.SEVA_GEMINI_ENABLED==='true' &&
      Boolean(env.GEMINI_API_KEY) &&
      /^gemini-[A-Za-z0-9._-]{1,80}$/.test(env.GEMINI_MODEL||'')
  };
}
export async function generateWithProvider(user,prompt,provider='openai',env=process.env,send=fetch) {
  const selected=selectProvider(provider);
  if(selected==='openai')return developerAI(user,prompt,env,send);
  if(!providerStatus(env).gemini)throw problem('Gemini server provider is not enabled or configured',503);

  const model=env.GEMINI_MODEL;
  // Fixed official API host, never a URL provided by the browser or config.
  const endpoint='https://generativelanguage.googleapis.com/v1beta/models/'+
    encodeURIComponent(model)+':generateContent';
  let response;
  try {
    response=await send(endpoint,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-goog-api-key':env.GEMINI_API_KEY
      },
      body:JSON.stringify({
        systemInstruction:{parts:[{text:'You are SEVA. Turn only the provided objective into a practical plan with actions, evidence and acceptance criteria. Distinguish recommendations from completed actions. Never claim to have made purchases, deployed services or contacted other systems.'}]},
        contents:[{role:'user',parts:[{text:prompt}]}],
        generationConfig:{maxOutputTokens:900,candidateCount:1}
      }),
      signal:AbortSignal.timeout(30000)
    });
  } catch {
    throw problem('Gemini provider connection failed',502);
  }
  let body;
  try {body=await response.json();}
  catch {throw problem('Gemini provider returned invalid data',502);}
  if(!response.ok) {
    if(response.status===429||body?.error?.status==='RESOURCE_EXHAUSTED')
      throw problem('Gemini provider quota unavailable',503);
    throw problem('Gemini provider request failed',502);
  }
  const candidate=body.candidates?.[0];
  if(body.promptFeedback?.blockReason||candidate?.finishReason!=='STOP')
    throw problem('Gemini response blocked or incomplete',502);
  const output=(candidate?.content?.parts||[])
    .filter(part=>typeof part.text==='string')
    .map(part=>part.text).join('\n').trim();
  if(!output)throw problem('Gemini provider returned no text',502);
  if(typeof body.responseId!=='string'||
    !/^[A-Za-z0-9._:-]{4,180}$/.test(body.responseId))
    throw problem('Gemini provider returned no trace ID',502);
  return {
    text:output,provider:'Gemini',model:body.modelVersion||model,
    id:body.responseId,verified:true
  };
}
