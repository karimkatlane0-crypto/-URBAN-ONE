/** SEVA database resilience: consistent SQLite backup and offline-safe restore to a NEW path. */
import {DatabaseSync,backup} from 'node:sqlite';
import {copyFile,chmod,link,mkdir,rm,stat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const publicRoot=resolve(fileURLToPath(new URL('./public/',import.meta.url)));
function privateFile(p){
 if(typeof p!=='string'||!p.trim()||p===':memory:')throw Error('A real SQLite file path is required');
 const full=resolve(p);
 if(full===publicRoot||full.startsWith(publicRoot+sep))throw Error('Never store private databases in the public web directory');
 return full;
}
export function assertHealthy(db){
 const results=db.prepare('PRAGMA integrity_check').all();
 if(results.length!==1||results[0].integrity_check!=='ok')throw Error('SQLite integrity check failed');
 const required=['users','goals','campaign_drafts','dbrelay_changes','lastre_intents'];
 const rows=db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
 const names=new Set(rows.map(r=>r.name));
 for(const table of required)if(!names.has(table))throw Error('Missing SEVA table: '+table);
 return true;
}
export async function backupSeva(sourcePath,destinationPath){
 const source=privateFile(sourcePath),target=privateFile(destinationPath);
 if(source===target)throw Error('Backup target must differ from source');
 await stat(source);
 await mkdir(dirname(target),{recursive:true,mode:0o700});
 const temp=target+'.pending-'+randomUUID();
 const db=new DatabaseSync(source,{readOnly:true});
 try {
  assertHealthy(db);
  await backup(db,temp);
  await chmod(temp,0o600);
  const test=new DatabaseSync(temp,{readOnly:true});
  try{assertHealthy(test);}finally{test.close();}
  // Atomic no-clobber publication on the same directory/filesystem.
  await link(temp,target);
  await chmod(target,0o600);
  return {verified:true,destination:target};
 } finally {db.close();await rm(temp,{force:true});}
}
export async function restoreSeva(backupPath,newDatabasePath){
 const source=privateFile(backupPath),target=privateFile(newDatabasePath);
 if(source===target)throw Error('Restore target must differ from backup');
 const db=new DatabaseSync(source,{readOnly:true});
 try{assertHealthy(db);}finally{db.close();}
 await mkdir(dirname(target),{recursive:true,mode:0o700});
 await copyFile(source,target,constants.COPYFILE_EXCL);
 try {
  await chmod(target,0o600);
  const verified=new DatabaseSync(target,{readOnly:true});
  try{assertHealthy(verified);}finally{verified.close();}
  return {verified:true,destination:target,existingDatabaseOverwritten:false};
 } catch(error){await rm(target,{force:true});throw error;}
}
const file=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===file){
 const [command,source,destination]=process.argv.slice(2);
 try{
  let result;
  if(command==='backup')result=await backupSeva(source,destination);
  else if(command==='restore')result=await restoreSeva(source,destination);
  else throw Error('Usage: node --experimental-sqlite maintenance.mjs backup|restore <source> <new-destination>');
  console.log(JSON.stringify(result));
 }catch(e){console.error('SEVA database maintenance refused: '+e.message);process.exitCode=1;}
}
