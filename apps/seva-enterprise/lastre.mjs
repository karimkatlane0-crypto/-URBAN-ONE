/**
 * SEVA Lastre CRM + optional OpenAI visual analysis.
 * No image bytes are persisted. AI provider sees a photo ONLY with explicit consent.
 */
const CATEGORIES=new Set(['buy','rent','lease','credit','other']);
function invalid(message,status=400){return Object.assign(new Error(message),{status});}
export function validateIntent(payload) {
 if(!payload || typeof payload!=='object'||Array.isArray(payload))throw invalid('Invalid Lastre request');
 const category=payload.category;
 const description=String(payload.description??'').trim();
 const budgetCents=payload.budgetCents;
 if(payload.consent!==true)throw invalid('Explicit voluntary CRM consent required');
 if(!CATEGORIES.has(category))throw invalid('Unknown transaction category');
 if(!description||description.length>800)throw invalid('Description must be 1–800 characters');
 if(!Number.isSafeInteger(budgetCents)||budgetCents<0||budgetCents>100_000_000)throw invalid('Budget must be valid euro cents');
 return {category,description,budgetCents};
}
export function validateVisionInput(payload) {
 if(!payload || payload.consentToAI!==true)throw invalid('Explicit photo transmission consent required');
 if(typeof payload.imageDataUrl!=='string'||!payload.imageDataUrl.startsWith('data:image/jpeg;base64,'))
  throw invalid('Only local JPEG photo previews are supported');
 const raw=payload.imageDataUrl.slice('data:image/jpeg;base64,'.length);
 if(raw.length<8||raw.length>1_500_000||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(raw))
  throw invalid('Malformed or oversized photo');
 const bytes=Buffer.from(raw,'base64');
 if(bytes.length<16||bytes.length>1_048_576||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff||
    bytes[bytes.length-2]!==0xff||bytes[bytes.length-1]!==0xd9 || bytes.toString('base64')!==raw)
  throw invalid('Invalid or oversized JPEG image');
 const purpose=String(payload.purpose??'').trim().slice(0,350);
 if(!purpose)throw invalid('Describe the requested product or service');
 return {imageUrl:payload.imageDataUrl,purpose,bytes:bytes.length};
}
export async function analyzeLastre(payload,{apiKey,model='gpt-5.1',endpoint='https://api.openai.com/v1/responses',request=fetch}={}) {
 const {imageUrl,purpose}=validateVisionInput(payload);
 if(!apiKey)throw invalid('AI server credentials not configured',503);
 const response=await request(endpoint,{
  method:'POST',
  headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
  body:JSON.stringify({
   model,store:false,max_output_tokens:850,
   instructions:'You are SEVA Lastre product-intent assistant. Reply in Italian. Describe only visible product/object characteristics and clearly distinguish uncertainty. Never identify a person, infer sensitive personal traits, recognize faces, claim real-time prices, financing approval, specific seller offers or product availability. Suggest clarifying questions for buy/rent/lease/credit requests. No external purchase is executed.',
   input:[{role:'user',content:[
    {type:'input_text',text:'Voluntary buyer requirement: '+purpose+'; Describe possible item/service, observable characteristics, missing purchasing information and how to verify supplier/price.'},
    {type:'input_image',image_url:imageUrl,detail:'low'}
   ]}]
  }),signal:AbortSignal.timeout(30000)
 });
 if(!response?.ok)throw invalid('AI visual provider request failed',502);
 const body=await response.json();
 const text=body.output_text||body.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n');
 if(typeof text!=='string'||!text.trim())throw invalid('AI vision response empty',502);
 return {text,provider:'OpenAI',id:body.id||null,model:body.model||model,
  imageSaved:false,crmSaved:false,externalPurchaseExecuted:false};
}
