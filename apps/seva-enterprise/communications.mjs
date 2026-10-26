/** SEVA professional communications: draft-only, human approval and consent first. */
const channels=new Set(['whatsapp','email','in_app']);
const intents=new Set(['customer_support','offer','after_sale']);
const fail=(m,status=400)=>Object.assign(Error(m),{status});
function clean(v,max,label){
 if(typeof v!=='string'||!v.trim()||v.length>max)throw fail(label+' must be provided within character limit');
 return v.trim().replace(/[\u0000-\u001F\u007F]/g,' ');
}
export function validateCommercialDraft(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw fail('Invalid draft input');
 if(!channels.has(input.channel))throw fail('Unsupported communication channel');
 if(!intents.has(input.purpose))throw fail('Unsupported communication purpose');
 const subject=clean(input.subject,120,'Goods or services topic');
 const context=clean(input.context,900,'Factual description');
 if(input.purpose==='offer'&&input.recipientPermissionConfirmed!==true)
  throw fail('Marketing draft requires declared recipient permission',403);
 const locale=input.language==='en'?'en':'it';
 return {channel:input.channel,purpose:input.purpose,subject,context,language:locale,
  recipientPermissionConfirmed:input.recipientPermissionConfirmed===true};
}
export function professionalDraftRequest(data){
 const d=validateCommercialDraft(data);
 const instruction=[
  'You are a professional service communications assistant for SEVA.',
  'Write ONE ready-to-review concise message in the requested language, appropriate to the chosen channel.',
  'Make a clear professional value proposition and one optional next step. Prefer respectful, non-manipulative language.',
  'Use ONLY facts explicitly provided by the user. Never invent prices, available stock, supplier identity, official partnerships, discounts, guaranteed free purchases, customer testimonials or refunds.',
  'Do not promise action completed, shipping, savings or payouts. Never mention private SEVA goal data.',
  'If the provided facts are incomplete, use neutral wording and explicitly say what should be confirmed.',
  'For an offer, include unobtrusive promotional transparency and an opt-out sentence suitable to channel.',
  'Do not claim that any external communication has been delivered. Return only the message body.'
 ].join(' ');
 const input=JSON.stringify({language:d.language,channel:d.channel,purpose:d.purpose,
  topic:d.subject,providedFacts:d.context});
 return {instructions:instruction,input,max_output_tokens:500};
}
export async function produceDraft(request,{apiKey,fetchImpl=fetch,model='gpt-5.1',baseUrl='https://api.openai.com/v1/responses'}={}){
 const prompt=professionalDraftRequest(request);
 if(!apiKey)throw fail('OpenAI server credentials not configured',503);
 const res=await fetchImpl(baseUrl,{method:'POST',headers:{
   Authorization:'Bearer '+apiKey,'Content-Type':'application/json'
 },body:JSON.stringify({...prompt,model,store:false}),signal:AbortSignal.timeout(30000)});
 const out=await res.json();
 if(!res.ok)throw fail('OpenAI generation unavailable',502);
 const text=out.output_text||out.output?.flatMap(x=>x.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n');
 if(typeof text!=='string'||!text.trim())throw fail('OpenAI returned no usable draft',502);
 return {draft:text.trim().slice(0,4000),provider:'OpenAI',model:out.model||model,
  id:out.id||null,generatedAt:new Date().toISOString(),
  reviewed:false,approved:false,sent:false,externalDelivery:false,channel:request.channel};
}
