/** SEVA opt-in, owner-scoped in-app inbox.
 * No auto WhatsApp, SMS or background Web Push delivery.
 */
import {randomUUID} from 'node:crypto';
const now=()=>Math.floor(Date.now()/1000);
const fail=(message,status=400)=>Object.assign(Error(message),{status});
export function createNotificationCenter(store){
 const db=store.db;
 db.exec([
  "CREATE TABLE IF NOT EXISTS seva_notification_preferences (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,in_app INTEGER NOT NULL DEFAULT 0 CHECK(in_app IN (0,1)),browser INTEGER NOT NULL DEFAULT 0 CHECK(browser IN (0,1)),updated INTEGER NOT NULL);",
  "CREATE TABLE IF NOT EXISTS seva_notifications (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,message TEXT NOT NULL,source_id TEXT NOT NULL,created INTEGER NOT NULL,read_at INTEGER);",
  "CREATE INDEX IF NOT EXISTS seva_notifications_owner ON seva_notifications(user_id,created);"
 ].join('\n'));
 function prefs(owner){
  const row=db.prepare('SELECT in_app AS inApp,browser FROM seva_notification_preferences WHERE user_id=?').get(owner);
  return {inApp:row?.inApp===1,browser:row?.browser===1,whatsAppAutomatic:false,backgroundPush:false};
 }
 function setPrefs(owner,data){
  if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.inApp!=='boolean'||typeof data.browser!=='boolean')
   throw fail('Explicit boolean inApp/browser preferences required');
  if(data.browser&&!data.inApp)throw fail('Browser notifications require in-app opt-in');
  db.prepare('INSERT INTO seva_notification_preferences VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET in_app=excluded.in_app,browser=excluded.browser,updated=excluded.updated')
   .run(owner,Number(data.inApp),Number(data.browser),now());
  return prefs(owner);
 }
 function publishGoal(owner,goalId,status){
  if(!['done','blocked'].includes(status)||!prefs(owner).inApp)return false;
  if(typeof goalId!=='string'||!/^[0-9a-f-]{36}$/.test(goalId))throw fail('Invalid goal ID');
  const kind=status==='done'?'goal_done':'goal_blocked';
  const message=status==='done'?'Un obiettivo è stato contrassegnato come verificato.':'Un obiettivo necessita attenzione.';
  db.prepare('INSERT INTO seva_notifications VALUES(?,?,?,?,?,?,NULL)')
   .run(randomUUID(),owner,kind,message,goalId,now());
  db.prepare('DELETE FROM seva_notifications WHERE user_id=? AND id NOT IN (SELECT id FROM seva_notifications WHERE user_id=? ORDER BY created DESC, rowid DESC LIMIT 50)')
   .run(owner,owner);
  return true;
 }
 function list(owner){
  if(!prefs(owner).inApp)return {notifications:[],unread:0};
  const notifications=db.prepare('SELECT id,kind,message,created,read_at AS readAt FROM seva_notifications WHERE user_id=? ORDER BY created DESC,rowid DESC LIMIT 50').all(owner);
  return {notifications,unread:notifications.filter(x=>x.readAt==null).length};
 }
 function acknowledge(owner,id){
  if(typeof id!=='string'||!/^[0-9a-f-]{36}$/.test(id))throw fail('Invalid notification ID');
  const r=db.prepare('UPDATE seva_notifications SET read_at=COALESCE(read_at,?) WHERE user_id=? AND id=?').run(now(),owner,id);
  if(!r.changes)throw fail('Notification not found',404);
  return {ok:true};
 }
 function erase(owner){
  db.exec('BEGIN IMMEDIATE');
  try{
   db.prepare('DELETE FROM seva_notifications WHERE user_id=?').run(owner);
   db.prepare('DELETE FROM seva_notification_preferences WHERE user_id=?').run(owner);
   db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
  return {deleted:true,notificationsSent:0,automaticWhatsAppMessages:0};
 }
 return {prefs,setPrefs,publishGoal,list,acknowledge,erase};
}
