import {initialPropertyStatus,allowedPropertyStatusTransition,normalizeAddress} from '../../packages/real-estate/property.mjs';
// Pole Position multi-user STAGING API: private SQLite, never bundled into GitHub Pages.
// Production requires an independently certified identity/consent provider and external DB deployment.
import {DatabaseSync} from 'node:sqlite';
import {createHash, randomUUID, timingSafeEqual} from 'node:crypto';

export class PoleError extends Error {
  constructor(code,status=400){super(code);this.status=status;}
}
function requiredString(v,limit=500){
  if(typeof v!=='string'||!v.trim()||v.length>limit)throw new PoleError('INVALID_TEXT');
  return v.trim();
}
function isoMs(v){
  if(typeof v!=='string'||!Number.isFinite(Date.parse(v)))throw new PoleError('INVALID_TIME');
  return Date.parse(v);
}
function cents(v){
  if(!Number.isSafeInteger(v)||v<0||v>100000)throw new PoleError('INVALID_FEE');
  return v;
}
function actorId(actor){
  if(!actor||!/^[A-Za-z0-9_-]{3,90}$/.test(actor.id||'')||!['owner','visitor'].includes(actor.role))
    throw new PoleError('AUTH_REQUIRED',401);
  return actor.id;
}
function get(db,table,id){
  if(!/^(dossiers|slots|visits)$/.test(table))throw new PoleError('INVALID_TABLE',500);
  const found=db.prepare('SELECT * FROM '+table+' WHERE id=?').get(id);
  if(!found)throw new PoleError('NOT_FOUND',404);
  return found;
}
function mustOwner(record,actor){
  if(actor.role!=='owner'||record.owner_id!==actor.id)throw new PoleError('FORBIDDEN',403);
}
function mustParticipant(db,dossier,actor,visitId){
  if(actor.role==='owner'&&dossier.owner_id===actor.id)return;
  if(actor.role!=='visitor'||!visitId)throw new PoleError('FORBIDDEN',403);
  const visit=db.prepare('SELECT id FROM visits WHERE id=? AND dossier_id=? AND visitor_id=?')
    .get(visitId,dossier.id,actor.id);
  if(!visit)throw new PoleError('FORBIDDEN',403);
}
function tx(db,fn){
  db.exec('BEGIN IMMEDIATE');
  try{const result=fn();db.exec('COMMIT');return result;}
  catch(e){db.exec('ROLLBACK');throw e;}
}
function insertAudit(db,kind,actor,id){
  db.prepare('INSERT INTO audit(id,kind,actor_id,object_id,created_at) VALUES(?,?,?,?,?)')
    .run(randomUUID(),kind,actor.id,id,new Date().toISOString());
}
export class PoleStore {
  constructor(file=':memory:'){
    this.db=new DatabaseSync(file);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    if(file!==':memory:')this.db.exec('PRAGMA journal_mode=WAL;');
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS dossiers (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, title TEXT NOT NULL, purpose TEXT NOT NULL, description TEXT NOT NULL, published_ms INTEGER NOT NULL, created_at TEXT NOT NULL);'+
      'CREATE TABLE IF NOT EXISTS slots (id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL REFERENCES dossiers(id), start_ms INTEGER NOT NULL, end_ms INTEGER NOT NULL, fee_cents INTEGER NOT NULL, terms TEXT NOT NULL, visit_id TEXT, created_at TEXT NOT NULL);'+
      'CREATE INDEX IF NOT EXISTS pole_slot_dates ON slots(dossier_id,start_ms,end_ms);'+
      'CREATE TABLE IF NOT EXISTS visits (id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL REFERENCES dossiers(id), slot_id TEXT NOT NULL REFERENCES slots(id), visitor_id TEXT NOT NULL, state TEXT NOT NULL, payment_status TEXT NOT NULL DEFAULT \'NOT_PROCESSED\', created_at TEXT NOT NULL);'+
      'CREATE INDEX IF NOT EXISTS pole_visits_actor ON visits(dossier_id,visitor_id);'+
      'CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL REFERENCES dossiers(id), visit_id TEXT NOT NULL REFERENCES visits(id), sender_id TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL);'+
      'CREATE INDEX IF NOT EXISTS pole_messages_visit ON messages(visit_id,created_at);'+
      'CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, kind TEXT NOT NULL, actor_id TEXT NOT NULL, object_id TEXT NOT NULL, created_at TEXT NOT NULL);'+
      'CREATE TABLE IF NOT EXISTS listing_profiles (dossier_id TEXT PRIMARY KEY REFERENCES dossiers(id), status TEXT NOT NULL, address_json TEXT, status_source TEXT NOT NULL, updated_at TEXT NOT NULL);'
    );
  }
  close(){this.db.close();}
  execute(op,actor,body={},now=Date.now()){
    actorId(actor);
    if(!Number.isFinite(now))throw new PoleError('CLOCK_INVALID');
    const db=this.db;
    if(op==='dossier.create'){
      if(actor.role!=='owner'||actor.ownerVerified!==true)throw new PoleError('OWNER_AUTHORITY_REQUIRED',403);
      const title=requiredString(body.title,120),description=requiredString(body.description,1500);
      if(!['Vendita','Locazione'].includes(body.purpose))throw new PoleError('INVALID_PURPOSE');
      const publishedMs=isoMs(body.publishedAt);
      if(publishedMs<now-86400000||publishedMs>now+365*86400000)throw new PoleError('INVALID_PUBLICATION_WINDOW');
      return tx(db,()=>{
        const id=randomUUID();
        db.prepare('INSERT INTO dossiers VALUES(?,?,?,?,?,?,?)').run(id,actor.id,title,body.purpose,description,publishedMs,new Date(now).toISOString());
        db.prepare('INSERT INTO listing_profiles VALUES(?,?,?,?,?)').run(id,initialPropertyStatus(body.purpose),null,'OWNER_DECLARED_UNVERIFIED',new Date(now).toISOString());
        insertAudit(db,'dossier.created',actor,id);
        return {id,title,purpose:body.purpose,publishedAt:new Date(publishedMs).toISOString(),state:'STAGING_ONLY'};
      });
    }
    if(op==='dossier.read'){
      const d=get(db,'dossiers',requiredString(body.dossierId,90));
      if(d.owner_id!==actor.id&&now<d.published_ms)throw new PoleError('NOT_AVAILABLE',403);
      const listing=db.prepare('SELECT status,address_json,status_source FROM listing_profiles WHERE dossier_id=?').get(d.id);
      const slots=db.prepare('SELECT id,start_ms,end_ms,fee_cents,terms,visit_id FROM slots WHERE dossier_id=? AND start_ms>? ORDER BY start_ms LIMIT 100').all(d.id,now);
      return {id:d.id,title:d.title,purpose:d.purpose,description:d.description,
        listingStatus:listing?.status||initialPropertyStatus(d.purpose),statusSource:listing?.status_source||'OWNER_DECLARED_UNVERIFIED',
        address:listing?.address_json?JSON.parse(listing.address_json):null,
        early24h:now>=d.published_ms&&now<d.published_ms+86400000,
        slots:slots.map(s=>({id:s.id,start:new Date(s.start_ms).toISOString(),end:new Date(s.end_ms).toISOString(),feeCents:s.fee_cents,terms:s.terms,available:s.visit_id===null})),
        stagingOnly:true};
    }
    if(op==='listing.update'){
      const d=get(db,'dossiers',requiredString(body.dossierId,90));mustOwner(d,actor);
      if(actor.ownerVerified!==true)throw new PoleError('OWNER_AUTHORITY_REQUIRED',403);
      const existing=db.prepare('SELECT status,address_json FROM listing_profiles WHERE dossier_id=?').get(d.id);
      if(!existing)throw new PoleError('LISTING_NOT_FOUND',404);
      const next=body.status===undefined?existing.status:requiredString(body.status,30);
      if(!allowedPropertyStatusTransition(d.purpose,existing.status,next))throw new PoleError('INVALID_PROPERTY_TRANSITION',409);
      if((next==='sold'||next==='rented')&&body.ownerDeclaration!==true)throw new PoleError('OWNER_DECLARATION_REQUIRED',403);
      let address=existing.address_json;
      if(body.address!==undefined){
        const a=body.address;
        if(!a||typeof a!=='object'||Array.isArray(a))throw new PoleError('INVALID_ADDRESS');
        const country=requiredString(a.country,2).toUpperCase();
        if(!/^[A-Z]{2}$/.test(country))throw new PoleError('INVALID_COUNTRY');
        const city=requiredString(a.city,140),street=requiredString(a.street,160),number=requiredString(a.number,50);
        const postalCode=a.postalCode==null?'':String(a.postalCode).trim().slice(0,32);
        address=JSON.stringify(normalizeAddress({country,city,street,number,postalCode}));
      }
      return tx(db,()=>{
        const updated=db.prepare('UPDATE listing_profiles SET status=?,address_json=?,status_source=?,updated_at=? WHERE dossier_id=? AND status=?')
          .run(next,address,'OWNER_DECLARED_UNVERIFIED',new Date(now).toISOString(),d.id,existing.status);
        if(updated.changes!==1)throw new PoleError('STATE_CONFLICT',409);
        insertAudit(db,'listing.status.'+next,actor,d.id);
        return {dossierId:d.id,status:next,address:address?JSON.parse(address):null,
          statusSource:'OWNER_DECLARED_UNVERIFIED',transactionVerified:false,stagingOnly:true};
      });
    }
    if(op==='slot.create'){
      const d=get(db,'dossiers',requiredString(body.dossierId,90));mustOwner(d,actor);
      const listing=db.prepare('SELECT status FROM listing_profiles WHERE dossier_id=?').get(d.id);
      if(!['sale','rent','reserved'].includes(listing?.status))throw new PoleError('LISTING_NOT_OPEN',409);
      const start=isoMs(body.start),minutes=body.minutes;
      if(!Number.isInteger(minutes)||minutes<15||minutes>180||start<=now)throw new PoleError('INVALID_SLOT');
      const end=start+minutes*60000;
      const fee=cents(body.feeCents),terms=requiredString(body.terms,1500);
      return tx(db,()=>{
        if(db.prepare('SELECT id FROM slots WHERE dossier_id=? AND start_ms<? AND end_ms>? LIMIT 1')
          .get(d.id,end,start))throw new PoleError('SLOT_OVERLAP',409);
        const id=randomUUID();
        db.prepare('INSERT INTO slots VALUES(?,?,?,?,?,?,NULL,?)')
          .run(id,d.id,start,end,fee,terms,new Date(now).toISOString());
        insertAudit(db,'slot.created',actor,id);
        return {id,start:new Date(start).toISOString(),end:new Date(end).toISOString(),feeCents:fee,paid:false};
      });
    }
    if(op==='visit.request'){
      if(actor.role!=='visitor')throw new PoleError('VISITOR_REQUIRED',403);
      const s=get(db,'slots',requiredString(body.slotId,90)),d=get(db,'dossiers',s.dossier_id);
      const listing=db.prepare('SELECT status FROM listing_profiles WHERE dossier_id=?').get(d.id);
      if(!['sale','rent','reserved'].includes(listing?.status))throw new PoleError('LISTING_NOT_OPEN',409);
      if(now<d.published_ms)throw new PoleError('NOT_AVAILABLE',403);
      if(s.start_ms<=now)throw new PoleError('SLOT_EXPIRED',409);
      return tx(db,()=>{
        const current=get(db,'slots',s.id);
        if(current.visit_id)throw new PoleError('SLOT_TAKEN',409);
        const id=randomUUID();
        db.prepare('INSERT INTO visits(id,dossier_id,slot_id,visitor_id,state,payment_status,created_at) VALUES(?,?,?,?,?,?,?)')
          .run(id,d.id,s.id,actor.id,'REQUESTED','NOT_PROCESSED',new Date(now).toISOString());
        const updated=db.prepare('UPDATE slots SET visit_id=? WHERE id=? AND visit_id IS NULL').run(id,s.id);
        if(updated.changes!==1)throw new PoleError('SLOT_TAKEN',409);
        insertAudit(db,'visit.requested',actor,id);
        return {id,state:'REQUESTED',paymentStatus:'NOT_PROCESSED',realPayment:false};
      });
    }
    if(op==='visit.transition'){
      const v=get(db,'visits',requiredString(body.visitId,90)),d=get(db,'dossiers',v.dossier_id);
      const next=requiredString(body.nextState,20);
      const permitted={REQUESTED:['CONFIRMED','CANCELLED'],CONFIRMED:['CHECKED_IN','CANCELLED'],CHECKED_IN:['COMPLETED'],COMPLETED:[],CANCELLED:[]};
      if(!permitted[v.state]?.includes(next))throw new PoleError('INVALID_TRANSITION',409);
      // Only the owner can confirm arrival or completion; visitor can cancel own request.
      if(!(actor.role==='owner'&&d.owner_id===actor.id)&&!(next==='CANCELLED'&&v.visitor_id===actor.id))
        throw new PoleError('FORBIDDEN',403);
      return tx(db,()=>{
        if(db.prepare('UPDATE visits SET state=? WHERE id=? AND state=?').run(next,v.id,v.state).changes!==1)
          throw new PoleError('STATE_CONFLICT',409);
        if(next==='CANCELLED')db.prepare('UPDATE slots SET visit_id=NULL WHERE id=? AND visit_id=?').run(v.slot_id,v.id);
        insertAudit(db,'visit.'+next.toLowerCase(),actor,v.id);
        return {id:v.id,state:next,paymentStatus:'NOT_PROCESSED',realPayment:false};
      });
    }
    if(op==='message.send'||op==='message.list'){
      const v=get(db,'visits',requiredString(body.visitId,90)),d=get(db,'dossiers',v.dossier_id);
      mustParticipant(db,d,actor,v.id);
      if(op==='message.list'){
        const m=db.prepare('SELECT id,sender_id,body,created_at FROM messages WHERE visit_id=? ORDER BY created_at,id LIMIT 100').all(v.id);
        return {messages:m,stagingOnly:true};
      }
      const message=requiredString(body.message,1000);
      return tx(db,()=>{
        const id=randomUUID(),at=new Date(now).toISOString();
        db.prepare('INSERT INTO messages VALUES(?,?,?,?,?,?)').run(id,d.id,v.id,actor.id,message,at);
        insertAudit(db,'message.sent',actor,id);
        return {id,createdAt:at,stagingOnly:true,externalNotificationSent:false};
      });
    }
    if(op==='visit.read'){
      const v=get(db,'visits',requiredString(body.visitId,90)),d=get(db,'dossiers',v.dossier_id);
      mustParticipant(db,d,actor,v.id);
      return {id:v.id,state:v.state,slotId:v.slot_id,visitorId:v.visitor_id,paymentStatus:v.payment_status,realPayment:false};
    }
    throw new PoleError('NOT_FOUND',404);
  }
}
export function resolvePoleActor(header,env={}){
  if(env.POLE_STAGING_ENABLED!=='true')throw new PoleError('STAGING_DISABLED',503);
  const token=/^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(String(header||''))?.[1];
  if(!token)throw new PoleError('AUTH_REQUIRED',401);
  let actors;
  try{actors=JSON.parse(env.POLE_STAGING_ACTORS_JSON||'[]');}catch{throw new PoleError('ACTORS_NOT_CONFIGURED',503);}
  if(!Array.isArray(actors))throw new PoleError('ACTORS_NOT_CONFIGURED',503);
  const hash=Buffer.from(createHash('sha256').update(token).digest('hex'),'hex');
  for(const a of actors){
    if(!/^[a-f0-9]{64}$/i.test(a.tokenHash||''))continue;
    const saved=Buffer.from(a.tokenHash,'hex');
    if(timingSafeEqual(hash,saved)){
      const actor={id:a.id,role:a.role,ownerVerified:a.ownerVerified===true};
      actorId(actor);return actor;
    }
  }
  throw new PoleError('AUTH_REQUIRED',401);
}
export function poleReadiness(env={}){
  return {mode:env.POLE_STAGING_ENABLED==='true'&&env.POLE_DB_PATH?.startsWith('/')?'STAGING_CONFIGURED_NOT_CERTIFIED':'DISABLED',
    externalDbRelay:'NOT_CONFIGURED',payments:'NOT_PROCESSED',production:false,
    auth:'SERVER_ISSUED_STAGING_TOKENS_ONLY',mobileRemoteApi:'NOT_CONFIGURED',
    whatsappBroadcast:'OPT_IN_MANUAL_SHARE_ONLY'};
}
