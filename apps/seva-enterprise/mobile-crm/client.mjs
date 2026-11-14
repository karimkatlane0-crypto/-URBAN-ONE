// Same-origin browser client. Session cookies and scope tokens never enter durable storage.
const prefix='/api/v1/mobile';
const copy=value=>structuredClone(value);
const id=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/.test(value);
const fields={crm:['displayName','email','phone','company','country','region','province','municipality'],
  task:['title','status'],partner:['organization','contactEmail','country'],
  stay:['bookingReference','unit','guestReference','arrivalDate','departureDate','status']};
const error=(code,status=0)=>Object.assign(Error(code),{code,status});
const same=(a,b)=>a?.subject===b?.subject&&a?.tenant===b?.tenant;
const safePayload=(kind,payload)=>{
  if(!Object.hasOwn(fields,kind)||!payload||Array.isArray(payload)||typeof payload!=='object'
    ||!Object.keys(payload).length||Object.keys(payload).some(k=>!fields[kind].includes(k))
    ||Object.values(payload).some(v=>typeof v!=='string'||v.length>512||/[\u0000-\u001f]/.test(v)))throw error('invalid_fields');
  return copy(payload);
};
export class MobileClient {
  constructor({fetchImpl=globalThis.fetch,origin=globalThis.location?.origin,cryptoImpl=globalThis.crypto}={}) {
    this.fetch=fetchImpl;this.origin=origin;this.crypto=cryptoImpl;
    this.identity=null;this.records=new Map();this.outbox=[];this.cursor=null;this.busy=false;
    if(!/^https?:\/\//.test(origin||''))throw error('http_origin_required');
  }
  snapshot(){return {identity:this.identity?{subject:this.identity.subject,tenant:this.identity.tenant,role:this.identity.role}:null,
    records:copy([...this.records.values()]),outbox:copy(this.outbox),busy:this.busy};}
  clear(){this.identity=null;this.records.clear();this.outbox=[];this.cursor=null;}
  async exclusive(fn){if(this.busy)throw error('operation_in_progress');this.busy=true;try{return await fn();}finally{this.busy=false;}}
  async request(path,{method='GET',data,scope=true}={}){
    if(!/^\/(me|sync(?:\?cursor=[A-Za-z0-9_.%-]+)?|partners\/applications)$/.test(path))throw error('route_forbidden');
    const response=await this.fetch(new URL(prefix+path,this.origin).href,{method,
      mode:'same-origin',credentials:'same-origin',cache:'no-store',redirect:'error',referrerPolicy:'same-origin',
      signal:AbortSignal.timeout(15000),headers:{Accept:'application/json',...(data?{'Content-Type':'application/json'}:{}),
        ...(scope&&this.identity?.scopeToken?{'X-SEVA-Mobile-Scope':this.identity.scopeToken}:{})},
      ...(data?{body:JSON.stringify(data)}:{})});
    if(!(response.headers.get('content-type')||'').includes('application/json'))throw error('unexpected_response',response.status);
    const value=await response.json();
    if(!response.ok){
      const code=typeof value?.error==='string'?value.error:'request_failed';
      if(response.status===401||['scope_binding_changed','scope_binding_invalid','membership_required','membership_changed'].includes(code))this.clear();
      throw error(code,response.status);
    }
    return value;
  }
  async identify(){
    const value=await this.request('/me',{scope:false});
    if(!id(value.subject)||!id(value.tenant)||!['owner','operator','viewer'].includes(value.role)
      ||typeof value.scopeToken!=='string'||value.mode!=='staging')throw error('identity_not_verified');
    if(this.identity&&!same(this.identity,value)){this.clear();throw error('account_changed');}
    this.identity=value;return value;
  }
  async pull(){
    let pages=0,reset=false;const staged=new Map(this.records);let cursor=this.cursor;
    while(true){
      if(++pages>100)throw error('sync_page_limit');
      let value;
      try{value=await this.request('/sync'+(cursor?'?cursor='+encodeURIComponent(cursor):''));}
      catch(e){if(e.status===410&&!reset){reset=true;staged.clear();cursor=null;continue;}throw e;}
      if(!Array.isArray(value.changes)||value.changes.length>100||typeof value.cursor!=='string'
        ||typeof value.hasMore!=='boolean')throw error('invalid_sync_response');
      for(const record of value.changes){
        if(!id(record.id)||!Number.isSafeInteger(record.version)||record.version<1)throw error('invalid_record');
        if(record.deleted)staged.delete(record.id);else staged.set(record.id,copy(record));
      }
      if(value.hasMore&&value.cursor===cursor)throw error('nonadvancing_cursor');
      cursor=value.cursor;if(!value.hasMore)break;
    }
    this.records=staged;this.cursor=cursor;
  }
  async connect(){return this.exclusive(async()=>{await this.identify();await this.pull();return this.snapshot();});}
  writable(){if(!this.identity||!['owner','operator'].includes(this.identity.role))throw error('write_forbidden');}
  queue({kind,payload,sourceId,recordId,operation='upsert'}){
    if(this.busy)throw error('operation_in_progress');this.writable();
    if(!id(sourceId)||!['upsert','delete'].includes(operation))throw error('invalid_source');
    if(!Object.hasOwn(fields,kind))throw error('invalid_kind');
    if(typeof this.crypto?.randomUUID!=='function')throw error('secure_browser_required');
    const rid=recordId||this.crypto.randomUUID();if(!id(rid))throw error('invalid_record_id');
    if(this.outbox.length>=100||this.outbox.some(x=>x.mutation.recordId===rid))throw error('record_already_queued_or_limit');
    const current=this.records.get(rid);
    if(operation==='delete'&&(!current||kind==='stay'))throw error('deletion_forbidden');
    const mutation={operationId:this.crypto.randomUUID(),recordId:rid,kind,operation,baseVersion:current?.version||0,
      ...(operation==='upsert'?{payload:safePayload(kind,payload)}:{})};
    this.outbox.push({sourceId,mutation,status:'pending'});return copy(mutation);
  }
  discard(operationId){if(this.busy)throw error('operation_in_progress');this.outbox=this.outbox.filter(x=>x.mutation.operationId!==operationId);}
  async synchronize(){return this.exclusive(async()=>{
    await this.identify();this.writable();await this.pull();
    // A lost response keeps the exact operation ID. No silent overwrite or rebase.
    for(const item of [...this.outbox].filter(x=>x.status==='pending')){
      const data={sourceId:item.sourceId,mutations:[item.mutation]};
      if(new TextEncoder().encode(JSON.stringify(data)).length>65536)throw error('body_too_large');
      const value=await this.request('/sync',{method:'POST',data});
      const result=value.results?.[0];
      if(value.results?.length!==1||result?.operationId!==item.mutation.operationId
        ||result.recordId!==item.mutation.recordId||!['accepted','conflict'].includes(result.status))throw error('invalid_write_response');
      if(result.status==='conflict'){item.status='conflict';item.currentVersion=result.currentVersion;}
      else this.outbox=this.outbox.filter(x=>x!==item);
    }
    await this.pull();return this.snapshot();
  });}
  async applyPartner(input){return this.exclusive(async()=>{
    await this.identify();this.writable();
    // Caller retains this descriptor to retry the SAME idempotent application.
    const value=await this.request('/partners/applications',{method:'POST',data:input});
    if(value.state!=='pending_review'||value.chargeCreated!==false||value.agreementAccepted!==false)
      throw error('unexpected_application_response');
    await this.pull();return value;
  });}
  async exportQueue(passphrase){
    if(this.busy||!this.identity)throw error('connect_before_export');
    if(!this.crypto?.subtle)throw error('secure_browser_required');
    return encrypt({schema:'seva-private-outbox',version:1,origin:this.origin,
      subject:this.identity.subject,tenant:this.identity.tenant,items:this.outbox},passphrase,this.crypto);
  }
  async importQueue(envelope,passphrase){return this.exclusive(async()=>{
    await this.identify();this.writable();
    if(!this.crypto?.subtle)throw error('secure_browser_required');
    const value=await decrypt(envelope,passphrase,this.crypto);
    if(value.schema!=='seva-private-outbox'||value.version!==1||value.origin!==this.origin
      ||!same(this.identity,value)||!Array.isArray(value.items)||value.items.length>100)throw error('archive_scope_mismatch');
    const next=copy(this.outbox),seen=new Map(next.map(x=>[x.mutation.operationId,x]));
    for(const item of value.items){
      const m=item?.mutation;
      if(!id(item?.sourceId)||!m||!id(m.operationId)||!id(m.recordId)||!Number.isSafeInteger(m.baseVersion)||m.baseVersion<0
        ||!Object.hasOwn(fields,m.kind)||!['upsert','delete'].includes(m.operation)||!['pending','conflict'].includes(item.status)
        ||Object.keys(m).some(k=>!['operationId','recordId','kind','operation','baseVersion','payload'].includes(k)))throw error('invalid_archive');
      if(m.operation==='upsert')safePayload(m.kind,m.payload);
      else if(m.payload!==undefined||m.kind==='stay')throw error('invalid_archive');
      if(seen.has(m.operationId)){
        if(JSON.stringify(seen.get(m.operationId))!==JSON.stringify(item))throw error('archive_id_collision');
        continue;
      }
      if(next.some(x=>x.mutation.recordId===m.recordId))throw error('archive_record_collision');
      next.push(copy(item));seen.set(m.operationId,item);
    }
    if(next.length>100)throw error('queue_limit');this.outbox=next;return next.length;
  });}
}
const b64=bytes=>btoa(String.fromCharCode(...bytes));
function bytes(text,max){if(typeof text!=='string'||text.length>max||!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw error('invalid_archive');
  try{return Uint8Array.from(atob(text),c=>c.charCodeAt(0));}catch{throw error('invalid_archive');}}
async function key(passphrase,salt,crypto){
  if(typeof passphrase!=='string'||passphrase.length<12||passphrase.length>1024)throw error('passphrase_min_12');
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},material,
    {name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encrypt(value,passphrase,crypto){
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const text=new TextEncoder().encode(JSON.stringify(value));if(text.length>1048576)throw error('archive_too_large');
  const data=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(passphrase,salt,crypto),text));
  // Chunk encoding avoids argument-limit failures for larger authorized queues.
  let raw='';for(let i=0;i<data.length;i+=8192)raw+=String.fromCharCode(...data.subarray(i,i+8192));
  return {format:'seva-outbox-aes256gcm-v1',salt:b64(salt),iv:b64(iv),ciphertext:btoa(raw)};
}
async function decrypt(value,passphrase,crypto){
  if(value?.format!=='seva-outbox-aes256gcm-v1')throw error('invalid_archive');
  const salt=bytes(value.salt,32),iv=bytes(value.iv,24),data=bytes(value.ciphertext,1500000);
  if(salt.length!==16||iv.length!==12||data.length<16)throw error('invalid_archive');
  try{return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},await key(passphrase,salt,crypto),data)));}
  catch{throw error('archive_decryption_failed');}
}
