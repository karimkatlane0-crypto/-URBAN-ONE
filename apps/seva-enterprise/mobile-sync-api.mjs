import {stayFields,validateStay} from './mobile-sync-stay.mjs';
import {createHash, createHmac, timingSafeEqual} from 'node:crypto';

// Additive, disabled-by-default API. Provision subjects/sources OUTSIDE this API.
export function initMobileSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mobile_subjects (
      subject TEXT PRIMARY KEY, tenant TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner','operator','viewer')),
      active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0,1)));
    CREATE TABLE IF NOT EXISTS mobile_sources (
      tenant TEXT NOT NULL, source_id TEXT NOT NULL, rights_ref TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
      PRIMARY KEY(tenant,source_id));
    CREATE TABLE IF NOT EXISTS mobile_records (
      tenant TEXT NOT NULL, id TEXT NOT NULL, kind TEXT NOT NULL,
      payload TEXT NOT NULL CHECK(json_valid(payload)), version INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL,
      PRIMARY KEY(tenant,id));
    CREATE TABLE IF NOT EXISTS mobile_changes (
      seq INTEGER PRIMARY KEY AUTOINCREMENT, tenant TEXT NOT NULL,
      record_id TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL,
      version INTEGER NOT NULL, deleted INTEGER NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS mobile_changes_scope ON mobile_changes(tenant,seq);
    CREATE TABLE IF NOT EXISTS mobile_operations (
      tenant TEXT NOT NULL, operation_id TEXT NOT NULL, actor TEXT NOT NULL,
      request_hash TEXT NOT NULL, response TEXT NOT NULL,
      PRIMARY KEY(tenant,operation_id));
    CREATE TABLE IF NOT EXISTS mobile_audit (
      tenant TEXT NOT NULL, seq INTEGER NOT NULL, event TEXT NOT NULL,
      previous_mac TEXT NOT NULL, mac TEXT NOT NULL, PRIMARY KEY(tenant,seq));
    CREATE TABLE IF NOT EXISTS mobile_audit_heads (
      tenant TEXT PRIMARY KEY, seq INTEGER NOT NULL, mac TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS mobile_audit_no_update BEFORE UPDATE ON mobile_audit
      BEGIN SELECT RAISE(ABORT,'audit_append_only'); END;
    CREATE TRIGGER IF NOT EXISTS mobile_audit_no_delete BEFORE DELETE ON mobile_audit
      BEGIN SELECT RAISE(ABORT,'audit_append_only'); END;
  `);
}
const fault = (status, code) => Object.assign(new Error(code), {status, code});
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x)
  && Object.getPrototypeOf(x) === Object.prototype;
const id = x => typeof x === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/.test(x);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const mac = (key, purpose, text) => createHmac('sha256',key).update(purpose+'\0'+text).digest('hex');
function equal(a,b) {
  if(typeof a!=='string'||typeof b!=='string')return false;
  const left=Buffer.from(a),right=Buffer.from(b);
  return left.length===right.length && timingSafeEqual(left,right);
}
function keys(value, allowed) {
  if(!plain(value)) throw fault(400,'invalid_object');
  if(Object.keys(value).some(k => /^(tenant|tenant_id|tenantId|roles?|user_id|subject)$/i.test(k)))
    throw fault(403,'client_identity_claim_forbidden');
  if(Object.keys(value).some(k=>!allowed.includes(k))) throw fault(400,'unexpected_field');
}
const fields = {
  stay:stayFields,
  crm:['displayName','email','phone','company','country','region','province','municipality'],
  partner:['organization','contactEmail','country'],
  task:['title','status'], evidence:['title','reference'], device:['label','platform']
};
function payload(kind, value) {
  if(!Object.hasOwn(fields,kind)) throw fault(400,'unsupported_record_kind');
  keys(value, fields[kind]);
  if(!Object.keys(value).length) throw fault(400,'empty_payload');
  for(const text of Object.values(value))
    if(typeof text!=='string'||text.length>512||/[\u0000-\u001f]/.test(text))
      throw fault(400,'invalid_payload_value');
  return value;
}
function mutation(value) {
  keys(value,['operationId','recordId','kind','operation','baseVersion','payload']);
  if(!id(value.operationId)||!id(value.recordId)||!Object.hasOwn(fields,value.kind)
    ||!['upsert','delete'].includes(value.operation)||!Number.isSafeInteger(value.baseVersion)
    ||value.baseVersion<0) throw fault(400,'invalid_mutation');
  if(value.operation==='upsert') payload(value.kind,value.payload);
  else if(value.payload!==undefined) throw fault(400,'delete_payload_forbidden');
  return value;
}
function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {const result=fn();db.exec('COMMIT');return result;}
  catch(error) {db.exec('ROLLBACK');throw error;}
}
export function verifyMobileAudit(db,key,tenant) {
  let seq=0, previous='';
  for(const row of db.prepare('SELECT * FROM mobile_audit WHERE tenant=? ORDER BY seq').all(tenant)) {
    if(row.seq!==seq+1 || row.previous_mac!==previous
      || !equal(row.mac,mac(key,'audit',tenant+'\0'+row.seq+'\0'+previous+'\0'+row.event)))
      throw fault(503,'audit_integrity_failed');
    seq=row.seq;previous=row.mac;
  }
  const head=db.prepare('SELECT * FROM mobile_audit_heads WHERE tenant=?').get(tenant);
  if((!head&&seq)||(head&&(head.seq!==seq||!equal(head.mac,previous))))
    throw fault(503,'audit_integrity_failed');
  return {seq,mac:previous};
}
function audit(db,key,principal,type,details,now) {
  const head=verifyMobileAudit(db,key,principal.tenant);
  const seq=head.seq+1;
  const event=JSON.stringify({actor:principal.subject,type,details,at:new Date(now()).toISOString()});
  const signature=mac(key,'audit',principal.tenant+'\0'+seq+'\0'+head.mac+'\0'+event);
  db.prepare('INSERT INTO mobile_audit VALUES(?,?,?,?,?)').run(principal.tenant,seq,event,head.mac,signature);
  db.prepare('INSERT INTO mobile_audit_heads VALUES(?,?,?) ON CONFLICT(tenant) DO UPDATE SET seq=excluded.seq,mac=excluded.mac')
    .run(principal.tenant,seq,signature);
}
async function body(req) {
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))
    throw fault(415,'json_required');
  let bytes=0;const chunks=[];
  for await(const chunk of req) {
    bytes+=chunk.length;if(bytes>65536)throw fault(413,'body_too_large');chunks.push(chunk);
  }
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  catch {throw fault(400,'invalid_json');}
}

export function createMobileHandler({db,authenticate,enabled=false,signingKey,
  allowedOrigin,now=Date.now,rateLimit=120,requireScopeBinding=false}={}) {
  if(!db || typeof authenticate!=='function') throw new TypeError('db and authenticate required');
  initMobileSchema(db);
  const keyOK=Buffer.isBuffer(signingKey)&&signingKey.length>=32;
  let origin;
  try {origin=new URL(allowedOrigin).origin;} catch {origin=null;}
  const limits=new Map();
  function cursor(tenant,after) {
    const text=Buffer.from(JSON.stringify({v:1,tenant,after,expires:now()+86400000})).toString('base64url');
    return text+'.'+mac(signingKey,'cursor',text);
  }
  function decode(token,tenant) {
    if(!token)return 0;
    if(token.length>1024)throw fault(400,'invalid_cursor');
    const parts=token.split('.');
    if(parts.length!==2||!equal(parts[1],mac(signingKey,'cursor',parts[0])))throw fault(400,'invalid_cursor');
    let value;try {value=JSON.parse(Buffer.from(parts[0],'base64url').toString());}catch {throw fault(400,'invalid_cursor');}
    if(!plain(value)||value.v!==1||!Number.isSafeInteger(value.after)||value.after<0)throw fault(400,'invalid_cursor');
    if(value.tenant!==tenant)throw fault(403,'cursor_scope_mismatch');
    if(!Number.isSafeInteger(value.expires)||value.expires<now())throw fault(410,'cursor_expired');
    return value.after;
  }
  function scopeToken(principal) {
    const text=Buffer.from(JSON.stringify({subject:principal.subject,tenant:principal.tenant,
      role:principal.role,expires:now()+900000})).toString('base64url');
    return text+'.'+mac(signingKey,'browser-scope',text);
  }
  function checkScope(token,principal) {
    if(typeof token!=='string'||token.length>2048)throw fault(403,'scope_binding_required');
    const [text,signature,...extra]=token.split('.');
    if(extra.length||!equal(signature,mac(signingKey,'browser-scope',text)))throw fault(403,'scope_binding_invalid');
    let value;try{value=JSON.parse(Buffer.from(text,'base64url').toString());}catch{throw fault(403,'scope_binding_invalid');}
    if(!value||value.subject!==principal.subject||value.tenant!==principal.tenant||value.role!==principal.role)
      throw fault(403,'scope_binding_changed');
    if(!Number.isSafeInteger(value.expires)||value.expires<now())throw fault(403,'scope_binding_expired');
  }
  function apply(principal, sourceId, operations, action='mobile_sync') {
    return transaction(db,()=>{
      const fresh=db.prepare('SELECT * FROM mobile_subjects WHERE subject=? AND active=1').get(principal.subject);
      if(!fresh||fresh.tenant!==principal.tenant||!['owner','operator'].includes(fresh.role))
        throw fault(403,'membership_changed');
      const source=db.prepare('SELECT * FROM mobile_sources WHERE tenant=? AND source_id=? AND enabled=1')
        .get(principal.tenant,sourceId);
      if(!source?.rights_ref?.trim())throw fault(403,'source_not_authorized');
      verifyMobileAudit(db,signingKey,principal.tenant);
      const results=[];
      for(const op of operations) {
        const hash=digest({sourceId,op,action});
        const old=db.prepare('SELECT * FROM mobile_operations WHERE tenant=? AND operation_id=?')
          .get(principal.tenant,op.operationId);
        if(old) {
          if(old.actor!==principal.subject)throw fault(403,'operation_owner_mismatch');
          if(old.request_hash!==hash)throw fault(409,'idempotency_key_reused');
          results.push({...JSON.parse(old.response),duplicate:true});continue;
        }
        const current=db.prepare('SELECT * FROM mobile_records WHERE tenant=? AND id=?')
          .get(principal.tenant,op.recordId);
        let result;
        if((current?.version||0)!==op.baseVersion || current?.deleted
          || (current&&current.kind!==op.kind) || (!current&&op.operation==='delete')) {
          result={operationId:op.operationId,recordId:op.recordId,status:'conflict',currentVersion:current?.version||0};
        } else {
          if(op.kind==='stay')validateStay(current?JSON.parse(current.payload):null,op.payload,op.operation);
          const version=(current?.version||0)+1, deleted=Number(op.operation==='delete');
          const text=JSON.stringify(deleted?{}:op.payload), at=new Date(now()).toISOString();
          db.prepare(`INSERT INTO mobile_records VALUES(?,?,?,?,?,?,?)
            ON CONFLICT(tenant,id) DO UPDATE SET payload=excluded.payload,version=excluded.version,
            deleted=excluded.deleted,updated_at=excluded.updated_at`)
            .run(principal.tenant,op.recordId,op.kind,text,version,deleted,at);
          db.prepare('INSERT INTO mobile_changes(tenant,record_id,kind,payload,version,deleted,updated_at) VALUES(?,?,?,?,?,?,?)')
            .run(principal.tenant,op.recordId,op.kind,text,version,deleted,at);
          result={operationId:op.operationId,recordId:op.recordId,status:'accepted',version};
        }
        db.prepare('INSERT INTO mobile_operations VALUES(?,?,?,?,?)')
          .run(principal.tenant,op.operationId,principal.subject,hash,JSON.stringify(result));
        audit(db,signingKey,principal,action,{operationId:op.operationId,recordId:op.recordId,
          result:result.status,sourceId,rightsRef:source.rights_ref,requestHash:hash},now);
        results.push(result);
      }
      return {results,mode:'staging',livePayments:false};
    });
  }
  return async function handle(req,res) {
    const reply=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));return true;};
    try {
      const url=new URL(req.url||'/', 'http://localhost');
      if(!url.pathname.startsWith('/api/v1/mobile/'))return false;
      if(!enabled||!keyOK||!origin)throw fault(503,'mobile_not_ready');
      if(req.headers['sec-fetch-site']==='cross-site')throw fault(403,'cross_origin_rejected');
      if(req.headers.origin && req.headers.origin!==origin)throw fault(403,'cross_origin_rejected');
      if(req.method==='POST'&&req.headers.origin!==origin)throw fault(403,'origin_required');
      if(['x-tenant-id','x-user-id','x-roles'].some(h=>req.headers[h]!==undefined))
        throw fault(403,'client_identity_claim_forbidden');
      const user=await authenticate(req);
      if(!user||!id(user.id))throw fault(401,'authentication_required');
      const principal=db.prepare('SELECT * FROM mobile_subjects WHERE subject=? AND active=1').get(user.id);
      if(!principal)throw fault(403,'membership_required');
      if(req.headers['x-seva-mobile-scope']!==undefined||(requireScopeBinding&&req.method==='POST'))
        checkScope(req.headers['x-seva-mobile-scope'],principal);
      const time=now();
      for(const [k,v] of limits)if(v.until<=time)limits.delete(k);
      let window=limits.get(principal.subject);
      if(!window){if(limits.size>=10000)throw fault(503,'rate_limiter_full');window={n:0,until:time+60000};limits.set(principal.subject,window);}
      if(++window.n>rateLimit)throw fault(429,'rate_limited');
      verifyMobileAudit(db,signingKey,principal.tenant);
      if([...url.searchParams.keys()].some(k=>k!=='cursor'))throw fault(403,'query_scope_forbidden');
      if(url.searchParams.getAll('cursor').length>1)throw fault(400,'duplicate_cursor');
      if(req.method==='GET'&&url.pathname==='/api/v1/mobile/me') {
        const data=transaction(db,()=>{
          audit(db,signingKey,principal,'mobile_identity_read',{},now);
          return {subject:principal.subject,tenant:principal.tenant,role:principal.role,scopeToken:scopeToken(principal),mode:'staging',livePayments:false};
        });return reply(200,data);
      }
      if(req.method==='GET'&&url.pathname==='/api/v1/mobile/sync') {
        const after=decode(url.searchParams.get('cursor'),principal.tenant);
        const data=transaction(db,()=>{
          const rows=db.prepare('SELECT * FROM mobile_changes WHERE tenant=? AND seq>? ORDER BY seq LIMIT 101')
            .all(principal.tenant,after);
          const page=rows.slice(0,100);
          const changes=page.map(r=>({id:r.record_id,kind:r.kind,payload:JSON.parse(r.payload),version:r.version,
            deleted:Boolean(r.deleted),updatedAt:r.updated_at}));
          audit(db,signingKey,principal,'mobile_sync_read',{count:changes.length,after},now);
          return {changes,cursor:cursor(principal.tenant,page.at(-1)?.seq||after),hasMore:rows.length>100,serverVersion:1};
        });return reply(200,data);
      }
      if(req.method==='POST' && ['/api/v1/mobile/sync','/api/v1/mobile/partners/applications'].includes(url.pathname)) {
        if(!['owner','operator'].includes(principal.role))throw fault(403,'write_forbidden');
        const input=await body(req);
        if(url.pathname==='/api/v1/mobile/sync') {
          keys(input,['sourceId','mutations']);
          if(!id(input.sourceId)||!Array.isArray(input.mutations)||!input.mutations.length||input.mutations.length>100)
            throw fault(400,'invalid_batch');
          const ops=input.mutations.map(mutation);
          if(new Set(ops.map(o=>o.operationId)).size!==ops.length)throw fault(400,'duplicate_operation_in_batch');
          return reply(200,apply(principal,input.sourceId,ops));
        }
        keys(input,['sourceId','operationId','applicationId','organization','contactEmail','country','consent']);
        if(input.consent!==true)throw fault(400,'explicit_consent_required');
        if(!id(input.sourceId)||typeof input.organization!=='string'||!input.organization.trim()
          ||typeof input.contactEmail!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail))
          throw fault(400,'invalid_application');
        const op=mutation({operationId:input.operationId,recordId:input.applicationId,kind:'partner',operation:'upsert',baseVersion:0,
          payload:{organization:input.organization,contactEmail:input.contactEmail,...(input.country?{country:input.country}:{})}});
        const result=apply(principal,input.sourceId,[op],'partner_application_consent_v1');
        const accepted=result.results[0].status==='accepted';
        return reply(accepted?202:409,{...result,state:accepted?'pending_review':'conflict',agreementAccepted:false,chargeCreated:false});
      }
      return reply(404,{error:'mobile_route_not_found'});
    } catch(error) {
      const expected=Number.isInteger(error.status)&&error.status>=400&&error.status<600;
      return reply(expected?error.status:503,{error:expected?error.code:'mobile_storage_unavailable'});
    }
  };
}
