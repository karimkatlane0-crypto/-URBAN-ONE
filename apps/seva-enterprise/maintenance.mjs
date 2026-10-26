/** SEVA production candidate: consistent SQLite backup / isolated restore.
 * This prepares G.4 recovery; it does not configure an offsite store or verify hosted recovery.
 */
import {DatabaseSync, backup} from 'node:sqlite';
import {mkdir, stat, link, chmod, rm, copyFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve, dirname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

const publicRoot = resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const requiredTables = [
  'users','sessions','goals','entitlements','checkout_sessions','webhook_events',
  'campaign_drafts','dbrelay_changes','seva_student_profiles'
];
function privatePath(input) {
  if(typeof input!=='string'||!input.trim()||input===':memory:')
    throw Error('A real SQLite file path is required');
  const path=resolve(input);
  if(path===publicRoot||path.startsWith(publicRoot+sep))
    throw Error('SEVA databases must not be inside the public web directory');
  return path;
}
function verify(db) {
  const check=db.prepare('PRAGMA integrity_check').all();
  if(check.length!==1||check[0].integrity_check!=='ok')
    throw Error('SQLite integrity_check failed');
  const tables=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row=>row.name));
  for(const name of requiredTables)if(!tables.has(name))throw Error('Missing SEVA table: '+name);
  return true;
}
export async function backupSeva(sourcePath,destinationPath) {
  const source=privatePath(sourcePath),target=privatePath(destinationPath);
  if(source===target)throw Error('Backup target must differ from source');
  await stat(source);
  await mkdir(dirname(target),{recursive:true,mode:0o700});
  const pending=target+'.pending-'+randomUUID();
  const db=new DatabaseSync(source,{readOnly:true});
  try {
    verify(db);
    await backup(db,pending);
    await chmod(pending,0o600);
    const check=new DatabaseSync(pending,{readOnly:true});
    try{verify(check);}finally{check.close();}
    // Atomic no-clobber publication: existing backups cannot be replaced.
    await link(pending,target);
    await chmod(target,0o600);
    return {verified:true,destination:target,existingFileOverwritten:false};
  } finally {db.close();await rm(pending,{force:true});}
}
export async function restoreSeva(backupPath,newDatabasePath) {
  const source=privatePath(backupPath),target=privatePath(newDatabasePath);
  if(source===target)throw Error('Restore target must differ from backup');
  const old=new DatabaseSync(source,{readOnly:true});
  try{verify(old);}finally{old.close();}
  await mkdir(dirname(target),{recursive:true,mode:0o700});
  // The destination must not exist: never overwrite the operating database.
  await copyFile(source,target,constants.COPYFILE_EXCL);
  try {
    await chmod(target,0o600);
    const restored=new DatabaseSync(target,{readOnly:true});
    try{verify(restored);}finally{restored.close();}
    return {verified:true,destination:target,existingDatabaseOverwritten:false};
  }catch(err){await rm(target,{force:true});throw err;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [command,src,dst]=process.argv.slice(2);
  try {
    let result;
    if(command==='backup') result=await backupSeva(src,dst);
    else if(command==='restore') result=await restoreSeva(src,dst);
    else throw Error('Usage: node --experimental-sqlite maintenance.mjs backup|restore <source> <new-destination>');
    console.log(JSON.stringify(result));
  }catch(err){console.error('SEVA maintenance refused: '+err.message);process.exitCode=1;}
}
