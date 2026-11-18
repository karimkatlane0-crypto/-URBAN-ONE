import {createHash, randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

export const CONSENT_SCHEMA_VERSION = 1;
export const OPTIONAL_PURPOSES = Object.freeze(['analytics','personal','email','mobile','partners']);
const PRODUCT = /^[a-z0-9][a-z0-9._-]{1,63}$/;

export class ConsentError extends Error {
  constructor(code, status = 400) { super(code); this.name='ConsentError'; this.code=code; this.status=status; }
}
function required(value, code, max=190) {
  if(typeof value!=='string'||!value.trim()||value.trim().length>max) throw new ConsentError(code);
  return value.trim();
}
function validateProduct(value) {
  if(typeof value!=='string'||!PRODUCT.test(value)) throw new ConsentError('INVALID_PRODUCT');
  return value;
}
function validateChoices(choices) {
  if(!choices||typeof choices!=='object'||Array.isArray(choices)) throw new ConsentError('INVALID_PREFERENCES');
  for(const [key,value] of Object.entries(choices)) {
    if(key==='essential') throw new ConsentError('ESSENTIAL_IS_NOT_A_TOGGLE');
    if(!OPTIONAL_PURPOSES.includes(key)) throw new ConsentError('UNKNOWN_PURPOSE');
    if(typeof value!=='boolean') throw new ConsentError('PREFERENCE_MUST_BE_BOOLEAN');
  }
}
function canonical(value) {
  if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
function hashEvent(previousHash,payload) {
  return createHash('sha256').update(previousHash+'\n'+canonical(payload)).digest('hex');
}
function iso(value) {
  const date=value instanceof Date?value:new Date(value);
  if(!Number.isFinite(date.getTime())) throw new ConsentError('INVALID_TIMESTAMP');
  return date.toISOString();
}

/** SQLite reference ledger. Use encrypted durable storage and an authenticated service boundary in deployment. */
export class ConsentLedger {
  constructor(file=':memory:') {
    this.db=new DatabaseSync(file);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    if(file!==':memory:') this.db.exec('PRAGMA journal_mode=WAL;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS consent_state (
        subject_id TEXT NOT NULL, product TEXT NOT NULL, schema_version INTEGER NOT NULL,
        notice_version TEXT NOT NULL, revision INTEGER NOT NULL,
        analytics INTEGER NOT NULL DEFAULT 0 CHECK(analytics IN (0,1)),
        personal INTEGER NOT NULL DEFAULT 0 CHECK(personal IN (0,1)),
        email INTEGER NOT NULL DEFAULT 0 CHECK(email IN (0,1)),
        mobile INTEGER NOT NULL DEFAULT 0 CHECK(mobile IN (0,1)),
        partners INTEGER NOT NULL DEFAULT 0 CHECK(partners IN (0,1)),
        updated_at TEXT NOT NULL, PRIMARY KEY(subject_id,product)
      );
      CREATE TABLE IF NOT EXISTS consent_audit (
        id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, product TEXT NOT NULL,
        revision INTEGER NOT NULL, event_type TEXT NOT NULL, actor_id TEXT NOT NULL,
        notice_version TEXT NOT NULL, choices_json TEXT NOT NULL, occurred_at TEXT NOT NULL,
        previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL UNIQUE,
        UNIQUE(subject_id,product,revision)
      );
      CREATE INDEX IF NOT EXISTS consent_audit_subject_idx ON consent_audit(subject_id,product,revision);
    `);
  }
  close(){this.db.close();}
  get(subjectId,product) {
    const subject=required(subjectId,'INVALID_SUBJECT'), app=validateProduct(product);
    const row=this.db.prepare('SELECT * FROM consent_state WHERE subject_id=? AND product=?').get(subject,app);
    if(!row) return {subjectId:subject,product:app,schemaVersion:CONSENT_SCHEMA_VERSION,noticeVersion:null,
      revision:0,essential:true,analytics:false,personal:false,email:false,mobile:false,partners:false,updatedAt:null};
    return {subjectId:row.subject_id,product:row.product,schemaVersion:row.schema_version,
      noticeVersion:row.notice_version,revision:row.revision,essential:true,
      analytics:Boolean(row.analytics),personal:Boolean(row.personal),email:Boolean(row.email),
      mobile:Boolean(row.mobile),partners:Boolean(row.partners),updatedAt:row.updated_at};
  }
  update({subjectId,product,choices,noticeVersion,actorId=subjectId,occurredAt=new Date()}) {
    const subject=required(subjectId,'INVALID_SUBJECT'), actor=required(actorId,'INVALID_ACTOR');
    const app=validateProduct(product), notice=required(noticeVersion,'NOTICE_VERSION_REQUIRED',100), at=iso(occurredAt);
    validateChoices(choices);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const previous=this.get(subject,app);
      const next=Object.fromEntries(OPTIONAL_PURPOSES.map(key=>[key,
        Object.prototype.hasOwnProperty.call(choices,key)?choices[key]:previous[key]]));
      const revision=previous.revision+1;
      const last=this.db.prepare('SELECT event_hash FROM consent_audit WHERE subject_id=? AND product=? ORDER BY revision DESC LIMIT 1').get(subject,app);
      const previousHash=last?.event_hash||'GENESIS';
      const event={id:randomUUID(),subjectId:subject,product:app,revision,eventType:'PREFERENCES_UPDATED',
        actorId:actor,noticeVersion:notice,choices:next,occurredAt:at,previousHash};
      const eventHash=hashEvent(previousHash,event);
      this.db.prepare(`INSERT INTO consent_audit
        (id,subject_id,product,revision,event_type,actor_id,notice_version,choices_json,occurred_at,previous_hash,event_hash)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(event.id,subject,app,revision,event.eventType,actor,notice,
          canonical(next),at,previousHash,eventHash);
      this.db.prepare(`INSERT INTO consent_state
        (subject_id,product,schema_version,notice_version,revision,analytics,personal,email,mobile,partners,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(subject_id,product) DO UPDATE SET schema_version=excluded.schema_version,
        notice_version=excluded.notice_version,revision=excluded.revision,analytics=excluded.analytics,
        personal=excluded.personal,email=excluded.email,mobile=excluded.mobile,partners=excluded.partners,
        updated_at=excluded.updated_at`).run(subject,app,CONSENT_SCHEMA_VERSION,notice,revision,
          Number(next.analytics),Number(next.personal),Number(next.email),Number(next.mobile),Number(next.partners),at);
      this.db.exec('COMMIT');
      return {...this.get(subject,app),eventId:event.id,eventHash};
    } catch(error) { this.db.exec('ROLLBACK'); throw error; }
  }
  withdraw({subjectId,product,purposes=OPTIONAL_PURPOSES,noticeVersion,actorId=subjectId,occurredAt=new Date()}) {
    if(!Array.isArray(purposes)||purposes.length===0||purposes.some(p=>!OPTIONAL_PURPOSES.includes(p))||
      new Set(purposes).size!==purposes.length) throw new ConsentError('INVALID_WITHDRAWAL_SCOPE');
    return this.update({subjectId,product,noticeVersion,actorId,occurredAt,
      choices:Object.fromEntries(purposes.map(p=>[p,false]))});
  }
  isAllowed({subjectId,product,purpose}) {
    if(!OPTIONAL_PURPOSES.includes(purpose)) throw new ConsentError('UNKNOWN_PURPOSE');
    return this.get(subjectId,product)[purpose]===true;
  }
  assertAllowed(context) {
    if(!this.isAllowed(context)) throw new ConsentError('CONSENT_REQUIRED',403);
    return true;
  }
  audit(subjectId,product) {
    const subject=required(subjectId,'INVALID_SUBJECT'),app=validateProduct(product);
    return this.db.prepare(`SELECT id,revision,event_type AS eventType,actor_id AS actorId,
      notice_version AS noticeVersion,choices_json AS choices,occurred_at AS occurredAt,
      previous_hash AS previousHash,event_hash AS eventHash
      FROM consent_audit WHERE subject_id=? AND product=? ORDER BY revision ASC`).all(subject,app)
      .map(row=>({...row,choices:JSON.parse(row.choices)}));
  }
  verifyAudit(subjectId,product) {
    let previousHash='GENESIS';
    for(const row of this.audit(subjectId,product)) {
      const payload={id:row.id,subjectId,product,revision:row.revision,eventType:row.eventType,
        actorId:row.actorId,noticeVersion:row.noticeVersion,choices:row.choices,
        occurredAt:row.occurredAt,previousHash};
      if(row.previousHash!==previousHash||hashEvent(previousHash,payload)!==row.eventHash) return false;
      previousHash=row.eventHash;
    }
    return true;
  }
}
