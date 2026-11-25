import {createHash, randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

export const TITANS_REQUEST_PURPOSES=Object.freeze([
  'service_access','data_sharing','partner_collaboration','skill_installation','analytics_access'
]);
export const TITANS_REQUEST_SCOPES=Object.freeze([
  'profile:read','contacts:read','calendar:read','analytics:read','marketplace:read','skill:execute'
]);

export class TitansRequestError extends Error{
  constructor(code,status=400){super(code);this.name='TitansRequestError';this.code=code;this.status=status;}
}
const actorPattern=/^[A-Za-z0-9_-]{3,90}$/;
function actor(value,code='INVALID_ACTOR'){
  if(typeof value!=='string'||!actorPattern.test(value))throw new TitansRequestError(code);
  return value;
}
function required(value,code,max=500){
  if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new TitansRequestError(code);
  return value.trim();
}
function purpose(value){
  if(!TITANS_REQUEST_PURPOSES.includes(value))throw new TitansRequestError('INVALID_PURPOSE');
  return value;
}
function scopes(value){
  if(!Array.isArray(value)||value.length<1||value.length>10||new Set(value).size!==value.length||
    value.some(v=>!TITANS_REQUEST_SCOPES.includes(v)))throw new TitansRequestError('INVALID_SCOPE_SET');
  return [...value].sort();
}
function time(value,code='INVALID_TIME'){
  const n=value instanceof Date?value.getTime():typeof value==='number'?value:Date.parse(value);
  if(!Number.isFinite(n))throw new TitansRequestError(code);
  return n;
}
function iso(n){return new Date(n).toISOString();}
function canonical(v){
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
function digest(previous,payload){
  return createHash('sha256').update(previous+'\n'+canonical(payload)).digest('hex');
}
function transaction(db,fn){
  db.exec('BEGIN IMMEDIATE');
  try{const value=fn();db.exec('COMMIT');return value;}
  catch(error){db.exec('ROLLBACK');throw error;}
}
function appendAudit(db,requestId,actorId,eventType,data,at){
  const prior=db.prepare('SELECT event_hash FROM titans_request_audit WHERE request_id=? ORDER BY rowid DESC LIMIT 1').get(requestId);
  const previousHash=prior?.event_hash||'GENESIS';
  const event={id:randomUUID(),requestId,actorId,eventType,data,occurredAt:at,previousHash};
  const eventHash=digest(previousHash,event);
  db.prepare('INSERT INTO titans_request_audit(id,request_id,actor_id,event_type,data_json,occurred_at,previous_hash,event_hash) VALUES(?,?,?,?,?,?,?,?)')
    .run(event.id,requestId,actorId,eventType,canonical(data),at,previousHash,eventHash);
  return {auditEventId:event.id,auditHash:eventHash};
}

/** Durable request/decision/grant ledger. No network or provider side effects. */
export class TitansRequestStore{
  constructor(file=':memory:'){
    this.db=new DatabaseSync(file);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    if(file!==':memory:')this.db.exec('PRAGMA journal_mode=WAL;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS titans_requests(
        id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, recipient_id TEXT NOT NULL,
        purpose TEXT NOT NULL, scopes_json TEXT NOT NULL, note TEXT NOT NULL DEFAULT '',
        state TEXT NOT NULL CHECK(state IN ('PENDING','ACCEPTED','DECLINED','EXPIRED')),
        created_at TEXT NOT NULL, expires_at TEXT NOT NULL, decided_at TEXT, decision_by TEXT,
        grant_id TEXT UNIQUE
      );
      CREATE INDEX IF NOT EXISTS titans_requests_inbox_idx ON titans_requests(recipient_id,state,created_at);
      CREATE TABLE IF NOT EXISTS titans_grants(
        id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE REFERENCES titans_requests(id),
        grantee_id TEXT NOT NULL, subject_id TEXT NOT NULL, purpose TEXT NOT NULL,
        scopes_json TEXT NOT NULL, granted_at TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT, revoked_by TEXT
      );
      CREATE INDEX IF NOT EXISTS titans_grants_subject_idx ON titans_grants(subject_id,grantee_id);
      CREATE TABLE IF NOT EXISTS titans_request_audit(
        id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES titans_requests(id),
        actor_id TEXT NOT NULL, event_type TEXT NOT NULL, data_json TEXT NOT NULL,
        occurred_at TEXT NOT NULL, previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL UNIQUE
      );
      CREATE INDEX IF NOT EXISTS titans_request_audit_idx ON titans_request_audit(request_id,occurred_at);
    `);
    const grantColumns=this.db.prepare('PRAGMA table_info(titans_grants)').all();
    if(!grantColumns.some(column=>column.name==='expires_at')){
      this.db.exec('ALTER TABLE titans_grants ADD COLUMN expires_at TEXT');
      this.db.exec('UPDATE titans_grants SET expires_at=(SELECT expires_at FROM titans_requests WHERE id=titans_grants.request_id) WHERE expires_at IS NULL');
    }
  }
  close(){this.db.close();}
  create({requesterId,recipientId,purpose:purposeValue,scopes:scopeValues,note='',expiresAt,now=Date.now()}){
    const requester=actor(requesterId),recipient=actor(recipientId);
    if(requester===recipient)throw new TitansRequestError('SELF_REQUEST_NOT_ALLOWED');
    const p=purpose(purposeValue),s=scopes(scopeValues),at=time(now);
    const noteText=note===''?'':required(note,'INVALID_NOTE',500);
    const expiry=expiresAt===undefined?at+7*86400000:time(expiresAt,'INVALID_EXPIRY');
    if(expiry<at+60000||expiry>at+30*86400000)throw new TitansRequestError('INVALID_EXPIRY');
    const createdAt=iso(at),expires=iso(expiry),id=randomUUID();
    transaction(this.db,()=>{
      this.db.prepare('INSERT INTO titans_requests(id,requester_id,recipient_id,purpose,scopes_json,note,state,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)')
        .run(id,requester,recipient,p,JSON.stringify(s),noteText,'PENDING',createdAt,expires);
      appendAudit(this.db,id,requester,'REQUEST_CREATED',{recipientId:recipient,purpose:p,scopes:s,expiresAt:expires},createdAt);
    });
    return this.receipt({requestId:id,actorId:requester});
  }
  inbox(recipientId,now=Date.now()){
    const recipient=actor(recipientId),at=iso(time(now));
    transaction(this.db,()=>{
      const expired=this.db.prepare("SELECT id FROM titans_requests WHERE recipient_id=? AND state='PENDING' AND expires_at<=?").all(recipient,at);
      for(const row of expired){
        const updated=this.db.prepare("UPDATE titans_requests SET state='EXPIRED',decided_at=?,decision_by=? WHERE id=? AND state='PENDING'").run(at,recipient,row.id);
        if(updated.changes===1)appendAudit(this.db,row.id,recipient,'REQUEST_EXPIRED',{},at);
      }
    });
    return this.db.prepare(`SELECT id,requester_id AS requesterId,recipient_id AS recipientId,purpose,
      scopes_json AS scopes,note,state,created_at AS createdAt,expires_at AS expiresAt
      FROM titans_requests WHERE recipient_id=? AND state='PENDING' AND expires_at>?
      ORDER BY created_at DESC LIMIT 100`).all(recipient,at)
      .map(r=>({...r,scopes:JSON.parse(r.scopes)}));
  }
  decide({requestId,actorId,decision,now=Date.now()}){
    const id=required(requestId,'INVALID_REQUEST_ID',80),recipient=actor(actorId),at=time(now),stamp=iso(at);
    if(!['accept','decline'].includes(decision))throw new TitansRequestError('INVALID_DECISION');
    return transaction(this.db,()=>{
      const r=this.db.prepare('SELECT * FROM titans_requests WHERE id=?').get(id);
      if(!r||r.recipient_id!==recipient)throw new TitansRequestError('REQUEST_NOT_FOUND',404);
      if(r.state!=='PENDING')throw new TitansRequestError('REQUEST_ALREADY_DECIDED',409);
      if(Date.parse(r.expires_at)<=at){
        this.db.prepare("UPDATE titans_requests SET state='EXPIRED',decided_at=?,decision_by=? WHERE id=? AND state='PENDING'").run(stamp,recipient,id);
        appendAudit(this.db,id,recipient,'REQUEST_EXPIRED',{},stamp);
        return {state:'EXPIRED',requestId:id};
      }
      let grantId=null;
      if(decision==='accept'){
        grantId=randomUUID();
        this.db.prepare('INSERT INTO titans_grants(id,request_id,grantee_id,subject_id,purpose,scopes_json,granted_at,expires_at) VALUES(?,?,?,?,?,?,?,?)')
          .run(grantId,id,r.requester_id,r.recipient_id,r.purpose,r.scopes_json,stamp,r.expires_at);
      }
      const next=decision==='accept'?'ACCEPTED':'DECLINED';
      const updated=this.db.prepare('UPDATE titans_requests SET state=?,decided_at=?,decision_by=?,grant_id=? WHERE id=? AND recipient_id=? AND state=\'PENDING\' AND expires_at>?')
        .run(next,stamp,recipient,grantId,id,recipient,stamp);
      if(updated.changes!==1)throw new TitansRequestError('REQUEST_STATE_CONFLICT',409);
      appendAudit(this.db,id,recipient,next,{grantId, purpose:r.purpose,scopes:JSON.parse(r.scopes_json)},stamp);
      return this.receipt({requestId:id,actorId:recipient});
    });
  }
  revoke({grantId,actorId,now=Date.now()}){
    const id=required(grantId,'INVALID_GRANT_ID',80),recipient=actor(actorId),stamp=iso(time(now));
    return transaction(this.db,()=>{
      const g=this.db.prepare('SELECT * FROM titans_grants WHERE id=?').get(id);
      if(!g||g.subject_id!==recipient)throw new TitansRequestError('GRANT_NOT_FOUND',404);
      if(g.revoked_at)throw new TitansRequestError('GRANT_ALREADY_REVOKED',409);
      const updated=this.db.prepare('UPDATE titans_grants SET revoked_at=?,revoked_by=? WHERE id=? AND subject_id=? AND revoked_at IS NULL')
        .run(stamp,recipient,id,recipient);
      if(updated.changes!==1)throw new TitansRequestError('GRANT_STATE_CONFLICT',409);
      appendAudit(this.db,g.request_id,recipient,'GRANT_REVOKED',{grantId:id},stamp);
      return {grantId:id,requestId:g.request_id,revoked:true,revokedAt:stamp};
    });
  }
  receipt({requestId,actorId,now=Date.now()}){
    const id=required(requestId,'INVALID_REQUEST_ID',80),who=actor(actorId);
    const r=this.db.prepare('SELECT * FROM titans_requests WHERE id=?').get(id);
    if(!r||(r.requester_id!==who&&r.recipient_id!==who))throw new TitansRequestError('REQUEST_NOT_FOUND',404);
    const g=r.grant_id?this.db.prepare('SELECT * FROM titans_grants WHERE id=?').get(r.grant_id):null;
    const last=this.db.prepare('SELECT id,event_hash FROM titans_request_audit WHERE request_id=? ORDER BY rowid DESC LIMIT 1').get(id);
    return {
      requestId:r.id,requesterId:r.requester_id,recipientId:r.recipient_id,purpose:r.purpose,
      scopes:JSON.parse(r.scopes_json),note:r.note,state:r.state,createdAt:r.created_at,expiresAt:r.expires_at,
      decidedAt:r.decided_at,decisionBy:r.decision_by,
      grant:g?{grantId:g.id,granteeId:g.grantee_id,subjectId:g.subject_id,purpose:g.purpose,
        scopes:JSON.parse(g.scopes_json),grantedAt:g.granted_at,expiresAt:g.expires_at,revokedAt:g.revoked_at,
        active:g.revoked_at===null&&Date.parse(g.expires_at)>time(now)}:null,
      auditEventId:last?.id||null,auditHash:last?.event_hash||null
    };
  }
  verifyAudit(requestId){
    const id=required(requestId,'INVALID_REQUEST_ID',80);
    const rows=this.db.prepare('SELECT * FROM titans_request_audit WHERE request_id=? ORDER BY rowid ASC').all(id);
    let previous='GENESIS';
    for(const row of rows){
      const event={id:row.id,requestId:id,actorId:row.actor_id,eventType:row.event_type,
        data:JSON.parse(row.data_json),occurredAt:row.occurred_at,previousHash:previous};
      if(row.previous_hash!==previous||digest(previous,event)!==row.event_hash)return false;
      previous=row.event_hash;
    }
    return rows.length>0;
  }
}
