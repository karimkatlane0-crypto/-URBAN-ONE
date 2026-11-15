import {requestIdentity,browserIdentity} from './identity.js';
import {PREMIUM_POLICY,PREMIUM_COUNTRIES,PREMIUM_SECTORS,PREMIUM_INTENTS,premiumError,premiumText,premiumCity,premiumValidateCandidate,premiumOfferCatalog,premiumOwnCandidate,premiumCard,premiumConsultationView,premiumOpenAPI} from './premium-model.js';

const premiumReply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const premiumHash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const premiumCanonical=value=>JSON.stringify((function sort(item){return item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,sort(item[key])])):item;})(value));
const premiumUUID=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const premiumId=value=>typeof value==='string'&&/^pr[cr]_[a-f0-9]{32}$/.test(value);
async function premiumReadBody(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))throw premiumError('È richiesto JSON.',415);
 const reader=request.body?.getReader();if(!reader)throw premiumError('Richiesta vuota.');let size=0;const parts=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>6000){await reader.cancel();throw premiumError('Richiesta troppo grande.',413);}parts.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 try{const body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!body||Array.isArray(body)||typeof body!=='object')throw Error();return body;}catch{throw premiumError('JSON non valido.');}
}
async function premiumWorkspace(DB,identity,scope,now){
 const [candidate,incoming,outgoing]=await Promise.all([
 DB.prepare('SELECT * FROM synapsy_premium_candidates WHERE owner_id=?').bind(identity.id).first(),
 DB.prepare('SELECT r.* FROM synapsy_premium_requests r JOIN synapsy_premium_candidates c ON c.id=r.candidate_id WHERE c.owner_id=? ORDER BY r.created_at DESC LIMIT 50').bind(identity.id).all(),
 DB.prepare('SELECT * FROM synapsy_premium_requests WHERE professional_id=? ORDER BY created_at DESC LIMIT 50').bind(identity.id).all()]);
 return {schema:'synapsy-premium-workspace',version:1,scope,candidate:premiumOwnCandidate(candidate,now),incoming:incoming.results.map(row=>premiumConsultationView(row,now)),outgoing:outgoing.results.map(row=>premiumConsultationView(row,now)),automaticMessages:false,automaticCharges:false,checkedAt:now};
}
// Data past its stated lifetime is hidden immediately and removed when this
// authenticated service is next used. This is not a scheduled background job.
async function premiumExpire(DB,now){
 await DB.batch([
 DB.prepare("UPDATE synapsy_premium_candidates SET data_json='{}',listed=0,revision=revision+1,updated_at=? WHERE expires_at<=? AND data_json!='{}'").bind(now,now),
 DB.prepare("UPDATE synapsy_premium_requests SET status='revoked',revision=revision+1,updated_at=? WHERE status IN ('requested','approved') AND (expires_at<=? OR candidate_id IN (SELECT id FROM synapsy_premium_candidates WHERE listed=0 OR expires_at<=?))").bind(now,now,now),
 DB.prepare('DELETE FROM synapsy_premium_requests WHERE created_at<?').bind(new Date(Date.parse(now)-90*86400000).toISOString()),
 DB.prepare('DELETE FROM synapsy_premium_operations WHERE created_at<?').bind(new Date(Date.parse(now)-90*86400000).toISOString())]);
}
export async function handlePremium(request,env={},clock=()=>new Date().toISOString()){
 try{
  const url=new URL(request.url),path=url.pathname,method=request.method;
  if(['/api/premium/offers','/api/premium/openapi.json'].includes(path)){
   if(!['GET','HEAD'].includes(method))throw premiumError('Metodo non consentito.',405);
   const value=path.endsWith('openapi.json')?premiumOpenAPI():premiumOfferCatalog();return method==='HEAD'?new Response(null,{headers:{'Cache-Control':'no-store'}}):premiumReply(value);
  }
  if(!['/api/premium','/api/premium/catalog','/api/premium/checkout','/api/premium/contact'].includes(path))throw premiumError('Percorso non trovato.',404);
  if(!['GET','POST'].includes(method)||((path==='/api/premium/catalog'||path==='/api/premium/contact')&&method!=='GET')||(path==='/api/premium/checkout'&&method!=='POST'))throw premiumError('Metodo non consentito.',405);
  const identity=requestIdentity(request);if(!identity)throw premiumError('Accedi con ChatGPT per gestire le tue richieste.',401,'sign_in_required');
  const scope=(await browserIdentity(identity)).scope;
  if(request.headers.get('X-SEVA-Workspace')!==scope)throw premiumError('La sessione è cambiata. Riapri la pagina.',409,'workspace_changed');
  if(method==='POST'&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))throw premiumError('Origine non autorizzata.',403);
  // No setting, client flag, manual receipt or owner privilege can open paid
  // contact access before a dedicated billing/verification release is tested.
  if(path==='/api/premium/checkout'||path==='/api/premium/contact')throw premiumError('Consultazione a pagamento in preparazione: verifica del recapito, condizioni e pagamento devono essere completati. Nessun addebito o recapito condiviso.',409,'premium_not_activated');
  if(!env.DB)throw premiumError('Archivio temporaneamente non disponibile.',503);
  const now=clock();await premiumExpire(env.DB,now);
  if(method==='GET'&&path==='/api/premium/catalog'){
   if([...url.searchParams.keys()].some(k=>!['sector','intent','country','city'].includes(k)))throw premiumError('Filtro non consentito.');
   const filters=[];const values=[now,identity.id];
   for(const [key,allowed]of [['sector',PREMIUM_SECTORS],['intent',PREMIUM_INTENTS],['country',PREMIUM_COUNTRIES]]){const value=url.searchParams.get(key);if(value){if(!allowed.includes(value))throw premiumError('Filtro non valido.');filters.push("json_extract(data_json,'$."+key+"')=?");values.push(value);}}
   const city=url.searchParams.get('city');if(city){filters.push("lower(json_extract(data_json,'$.city'))=lower(?)");values.push(premiumCity(city));}
   const rows=await env.DB.prepare('SELECT * FROM synapsy_premium_candidates WHERE listed=1 AND expires_at>? AND owner_id!=?'+(filters.length?' AND '+filters.join(' AND '):'')+' ORDER BY updated_at DESC,id LIMIT 50').bind(...values).all();
   return premiumReply({schema:'synapsy-premium-catalog',version:1,scope,candidates:rows.results.map(premiumCard),totalReturned:rows.results.length,noTotal:true,source:'voluntary_self_declarations',checkedAt:now});
  }
  if(method==='GET')return premiumReply(await premiumWorkspace(env.DB,identity,scope,now));
  const body=await premiumReadBody(request),fields={save_candidate:['revision','firstName','lastName','phone','sector','intent','country','city','budgetBand','horizon','listed','serviceConsent','marketing'],withdraw:['revision'],revoke_marketing:['revision'],request_consultation:['candidateId','professionalName','company','purpose'],approve:['requestId','revision','consent'],decline:['requestId','revision'],revoke:['requestId','revision']};
  if(!fields[body.action]||Object.keys(body).some(k=>!['action','operationId',...fields[body.action]].includes(k))||!premiumUUID(body.operationId))throw premiumError('Azione, campi o identificativo non validi.');
  // Canonical key order ensures transport key order does not change idempotency.
  const canonical=premiumCanonical(body),hash=await premiumHash(canonical);
  const replay=await env.DB.prepare('SELECT request_hash FROM synapsy_premium_operations WHERE actor_id=? AND operation_id=?').bind(identity.id,body.operationId).first();
  if(replay){if(replay.request_hash!==hash)throw premiumError('Identificativo già usato per una richiesta diversa.',409);return premiumReply(await premiumWorkspace(env.DB,identity,scope,now));}
  const privacyAction=['withdraw','revoke','decline','revoke_marketing'].includes(body.action),dayStart=new Date(Date.parse(now)-86400000).toISOString(),quotaSQL=privacyAction?'':' AND (SELECT COUNT(*) FROM synapsy_premium_operations WHERE actor_id=? AND created_at>?)<100',quotaValues=privacyAction?[]:[identity.id,dayStart];
  const recent=await env.DB.prepare('SELECT COUNT(*) AS count FROM synapsy_premium_operations WHERE actor_id=? AND created_at>?').bind(identity.id,new Date(Date.parse(now)-86400000).toISOString()).first();
  if(!privacyAction&&recent.count>=100)throw premiumError('Limite giornaliero raggiunto. Riprova domani.',429);
  const own=await env.DB.prepare('SELECT * FROM synapsy_premium_candidates WHERE owner_id=?').bind(identity.id).first();
  let statements=[],targetId,expectedRevision;
  if(['save_candidate','withdraw','revoke_marketing'].includes(body.action)){
   if(!Number.isSafeInteger(body.revision)||body.revision!==(own?.revision||0))throw premiumError('La tua scheda è cambiata. Aggiorna prima di salvare.',409);
   if(body.action!=='save_candidate'&&!own)throw premiumError('Non è presente una candidatura.',404);
   const prior=own?JSON.parse(own.data_json):{};
   if(body.action==='revoke_marketing'&&!prior.firstName)throw premiumError('Non è presente una candidatura attiva.',409);
   const data=body.action==='save_candidate'?premiumValidateCandidate(body,now):body.action==='revoke_marketing'?{...prior,marketing:{email:false,whatsapp:false,messenger:false},marketingRecordedAt:now}:{},expiresAt=body.action==='save_candidate'?new Date(Date.parse(now)+90*86400000).toISOString():body.action==='revoke_marketing'?own.expires_at:now;
   const listed=body.action==='save_candidate'?(body.listed?1:0):body.action==='revoke_marketing'?own.listed:0;
   targetId=own?.id||'prc_'+crypto.randomUUID().replaceAll('-','');expectedRevision=(own?.revision||0)+1;
   if(own)statements.push(env.DB.prepare('UPDATE synapsy_premium_candidates SET revision=revision+1,data_json=?,listed=?,expires_at=?,last_operation_id=?,updated_at=? WHERE owner_id=? AND revision=?'+quotaSQL).bind(JSON.stringify(data),listed,expiresAt,body.operationId,now,identity.id,own.revision,...quotaValues));
   else statements.push(env.DB.prepare('INSERT OR IGNORE INTO synapsy_premium_candidates(id,owner_id,revision,data_json,listed,expires_at,last_operation_id,created_at,updated_at) SELECT ?,?,1,?,?,?,?,?,? WHERE 1=1'+quotaSQL).bind(targetId,identity.id,JSON.stringify(data),body.listed?1:0,expiresAt,body.operationId,now,now,...quotaValues));
   // Consent always refers to a particular version of the person's details.
   statements.push(env.DB.prepare("UPDATE synapsy_premium_requests SET status='revoked',revision=revision+1,updated_at=? WHERE candidate_id=? AND status IN ('requested','approved') AND EXISTS(SELECT 1 FROM synapsy_premium_candidates WHERE id=? AND revision=? AND last_operation_id=?)").bind(now,targetId,targetId,expectedRevision,body.operationId));
  }else if(body.action==='request_consultation'){
   if(!premiumId(body.candidateId))throw premiumError('Scheda non disponibile.',404);
   const candidate=await env.DB.prepare('SELECT * FROM synapsy_premium_candidates WHERE id=? AND listed=1 AND expires_at>?').bind(body.candidateId,now).first();
   if(!candidate||candidate.owner_id===identity.id)throw premiumError('Scheda non disponibile.',404);
   if(!PREMIUM_SECTORS.includes(body.purpose)||JSON.parse(candidate.data_json).sector!==body.purpose)throw premiumError('La finalità deve corrispondere alla candidatura.');
   const professionalName=premiumText(body.professionalName,140),company=premiumText(body.company,160);
   const existing=await env.DB.prepare('SELECT id FROM synapsy_premium_requests WHERE candidate_id=? AND professional_id=?').bind(candidate.id,identity.id).first();
   if(existing)throw premiumError('Hai già presentato una richiesta per questa candidatura. Consulta il suo stato.',409);
   const count=await env.DB.prepare('SELECT (SELECT COUNT(*) FROM synapsy_premium_requests WHERE professional_id=?) AS outgoing,(SELECT COUNT(*) FROM synapsy_premium_requests WHERE candidate_id=?) AS incoming').bind(identity.id,candidate.id).first();
   if(count.outgoing>=50||count.incoming>=50)throw premiumError('Limite di richieste raggiunto.',409);
   targetId='prr_'+crypto.randomUUID().replaceAll('-','');expectedRevision=1;
   const expiresAt=new Date(Math.min(Date.parse(now)+30*86400000,Date.parse(candidate.expires_at))).toISOString();
   statements.push(env.DB.prepare("INSERT OR IGNORE INTO synapsy_premium_requests(id,candidate_id,professional_id,professional_name,company,purpose,status,revision,candidate_revision,expires_at,last_operation_id,created_at,updated_at) SELECT ?,id,?,?,?,?, 'requested',1,revision,?,?,?,? FROM synapsy_premium_candidates WHERE id=? AND revision=? AND listed=1 AND expires_at>? AND (SELECT COUNT(*) FROM synapsy_premium_requests WHERE professional_id=?)<50 AND (SELECT COUNT(*) FROM synapsy_premium_requests WHERE candidate_id=?)<50"+quotaSQL).bind(targetId,identity.id,professionalName,company,body.purpose,expiresAt,body.operationId,now,now,candidate.id,candidate.revision,now,identity.id,candidate.id,...quotaValues));
  }else{
   if(!premiumId(body.requestId))throw premiumError('Richiesta non disponibile.',404);
   const row=await env.DB.prepare('SELECT r.*,c.owner_id,c.revision AS current_candidate_revision,c.listed,c.expires_at AS candidate_expires_at FROM synapsy_premium_requests r JOIN synapsy_premium_candidates c ON c.id=r.candidate_id WHERE r.id=?').bind(body.requestId).first();
   if(!row||row.owner_id!==identity.id)throw premiumError('Richiesta non disponibile.',404);
   if(!Number.isSafeInteger(body.revision)||body.revision!==row.revision)throw premiumError('La richiesta è cambiata. Aggiorna prima di decidere.',409);
   if(row.expires_at<=now||!row.listed||row.candidate_expires_at<=now||row.candidate_revision!==row.current_candidate_revision)throw premiumError('La candidatura o la richiesta non è più valida.',409);
   if(body.action==='approve'&&(body.consent!==true||row.status!=='requested'))throw premiumError('Conferma la condivisione con il professionista indicato soltanto per una richiesta in attesa.',409);
   if(body.action==='decline'&&row.status!=='requested')throw premiumError('Puoi rifiutare soltanto una richiesta in attesa.',409);
   if(body.action==='revoke'&&!['requested','approved'].includes(row.status))throw premiumError('Autorizzazione già chiusa.',409);
   targetId=row.id;expectedRevision=row.revision+1;const status={approve:'approved',decline:'declined',revoke:'revoked'}[body.action];
   statements.push(env.DB.prepare('UPDATE synapsy_premium_requests SET status=?,revision=revision+1,approved_at=?,policy=?,last_operation_id=?,updated_at=? WHERE id=? AND revision=? AND EXISTS(SELECT 1 FROM synapsy_premium_candidates WHERE id=? AND revision=? AND listed=1 AND expires_at>?)'+quotaSQL).bind(status,body.action==='approve'?now:row.approved_at||null,PREMIUM_POLICY,body.operationId,now,row.id,row.revision,row.candidate_id,row.candidate_revision,now,...quotaValues));
  }
  const table=targetId.startsWith('prc_')?'synapsy_premium_candidates':'synapsy_premium_requests';
  statements.push(env.DB.prepare('INSERT INTO synapsy_premium_operations(actor_id,operation_id,request_hash,target_id,action,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM '+table+' WHERE id=? AND revision=? AND last_operation_id=?)').bind(identity.id,body.operationId,hash,targetId,body.action,now,targetId,expectedRevision,body.operationId));
  let results;try{results=await env.DB.batch(statements);}catch{throw premiumError('Modifica concorrente: aggiorna la pagina e verifica lo stato.',409);}
  if(results[0].meta.changes!==1)throw premiumError('Modifica concorrente: aggiorna la pagina.',409);
  return premiumReply(await premiumWorkspace(env.DB,identity,scope,now));
 }catch(error){return premiumReply({error:error.premiumStatus?error.message:'Servizio temporaneamente non disponibile. I dati già salvati restano conservati.',code:error.premiumCode||'service_unavailable'},error.premiumStatus||503);}
}
