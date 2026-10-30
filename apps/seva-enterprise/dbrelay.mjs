/**
 * SEVA DBRELAY Phase II: durable same-origin, tenant-scoped change log.
 * No cross-project calls, credentials, Stripe charges or remote data replication.
 * SQLite triggers capture writes atomically even when callers use the existing APIs.
 */
export function installDBRelay(db) {
 db.exec(`
 CREATE TABLE IF NOT EXISTS dbrelay_changes(
   seq INTEGER PRIMARY KEY AUTOINCREMENT,
   user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   resource TEXT NOT NULL CHECK(resource IN ('goal','campaign')),
   resource_id TEXT NOT NULL,
   action TEXT NOT NULL CHECK(action IN ('created','updated','deleted')),
   created INTEGER NOT NULL
 );
 CREATE INDEX IF NOT EXISTS dbrelay_owner_cursor ON dbrelay_changes(user_id,seq);
 CREATE TRIGGER IF NOT EXISTS dbrelay_goal_created AFTER INSERT ON goals BEGIN
   INSERT INTO dbrelay_changes(user_id,resource,resource_id,action,created)
   VALUES (NEW.user_id,'goal',NEW.id,'created',CAST(strftime('%s','now') AS INTEGER));
 END;
 CREATE TRIGGER IF NOT EXISTS dbrelay_goal_updated AFTER UPDATE ON goals BEGIN
   INSERT INTO dbrelay_changes(user_id,resource,resource_id,action,created)
   VALUES (NEW.user_id,'goal',NEW.id,'updated',CAST(strftime('%s','now') AS INTEGER));
 END;
 CREATE TRIGGER IF NOT EXISTS dbrelay_goal_deleted AFTER DELETE ON goals BEGIN
   INSERT INTO dbrelay_changes(user_id,resource,resource_id,action,created)
   VALUES (OLD.user_id,'goal',OLD.id,'deleted',CAST(strftime('%s','now') AS INTEGER));
 END;
 CREATE TRIGGER IF NOT EXISTS dbrelay_campaign_created AFTER INSERT ON campaign_drafts BEGIN
   INSERT INTO dbrelay_changes(user_id,resource,resource_id,action,created)
   VALUES (NEW.user_id,'campaign',NEW.id,'created',CAST(strftime('%s','now') AS INTEGER));
 END;
 CREATE TRIGGER IF NOT EXISTS dbrelay_campaign_updated AFTER UPDATE ON campaign_drafts BEGIN
   INSERT INTO dbrelay_changes(user_id,resource,resource_id,action,created)
   VALUES (NEW.user_id,'campaign',NEW.id,'updated',CAST(strftime('%s','now') AS INTEGER));
 END;
 CREATE TRIGGER IF NOT EXISTS dbrelay_campaign_deleted AFTER DELETE ON campaign_drafts BEGIN
   INSERT INTO dbrelay_changes(user_id,resource,resource_id,action,created)
   VALUES (OLD.user_id,'campaign',OLD.id,'deleted',CAST(strftime('%s','now') AS INTEGER));
 END;
 `);
}
function requireOwner(owner) {
 if(typeof owner!=='string'||!/^[a-f0-9-]{36}$/.test(owner))
   throw Object.assign(Error('Invalid authenticated owner'),{status:401});
}
function parseCursor(cursor) {
 const raw=String(cursor ?? '0');
 if(!/^(0|[1-9][0-9]{0,15})$/.test(raw) || !Number.isSafeInteger(Number(raw)))
   throw Object.assign(Error('Invalid DBRELAY cursor'),{status:400});
 return Number(raw);
}
function parseLimit(limit) {
 const raw=String(limit ?? '50');
 if(!/^(?:[1-9]|[1-9][0-9]|100)$/.test(raw))
   throw Object.assign(Error('DBRELAY limit must be 1–100'),{status:400});
 return Number(raw);
}
export function dbrelayStatus(store,owner) {
 requireOwner(owner);
 const cursor=store.db.prepare('SELECT COALESCE(MAX(seq),0) AS n FROM dbrelay_changes WHERE user_id=?').get(owner).n;
 const goals=store.db.prepare('SELECT COUNT(*) AS n FROM goals WHERE user_id=?').get(owner).n;
 const campaigns=store.db.prepare('SELECT COUNT(*) AS n FROM campaign_drafts WHERE user_id=?').get(owner).n;
 return {service:'SEVA-DBRELAY',version:'2.0.0',database:'ready',
  mode:'authenticated-same-origin',persistent:store.persistent===true,
  cursor,goals,campaigns,externalRelayConnected:false,externalDataTransfer:false,
  paymentsExecuted:false,offlinePrivateApiCache:false};
}
/** Full initial data snapshot; caller must be authenticated by the HTTP layer. */
export function dbrelaySnapshot(store,owner) {
 requireOwner(owner);
 const db=store.db;
 db.exec('BEGIN');
 try {
   const count=db.prepare('SELECT (SELECT COUNT(*) FROM goals WHERE user_id=?)+(SELECT COUNT(*) FROM campaign_drafts WHERE user_id=?) AS n').get(owner,owner).n;
   if(count>5000)throw Object.assign(Error('Snapshot too large: use standard resource APIs'),{status:413});
   const cursor=db.prepare('SELECT COALESCE(MAX(seq),0) AS n FROM dbrelay_changes WHERE user_id=?').get(owner).n;
   const goals=store.listGoals(owner);
   const campaigns=db.prepare('SELECT id,quote_json,terms_json,snapshot_sha256,status,created FROM campaign_drafts WHERE user_id=? ORDER BY created DESC').all(owner)
    .map(row=>({id:row.id,quote:JSON.parse(row.quote_json),terms:JSON.parse(row.terms_json),snapshotSha256:row.snapshot_sha256,status:row.status,created:row.created}));
   db.exec('COMMIT');
   return {cursor,goals,campaigns,source:'SEVA-owned server SQLite',externalRelayConnected:false};
 } catch(error) {db.exec('ROLLBACK');throw error;}
}
/** The feed contains ONLY IDs/tombstones; fetch fresh data with authenticated resource APIs. */
export function dbrelayChanges(store,owner,cursor,limit) {
 requireOwner(owner);
 const after=parseCursor(cursor),size=parseLimit(limit);
 const rows=store.db.prepare('SELECT seq,resource,resource_id AS resourceId,action,created FROM dbrelay_changes WHERE user_id=? AND seq>? ORDER BY seq ASC LIMIT ?').all(owner,after,size+1);
 const changes=rows.slice(0,size);
 return {after,changes,hasMore:rows.length>size,nextCursor:changes.length?changes[changes.length-1].seq:after,
  dataIncluded:false,externalRelayConnected:false};
}
