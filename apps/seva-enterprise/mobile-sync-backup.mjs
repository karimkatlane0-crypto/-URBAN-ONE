import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
const aad=Buffer.from('SEVA-MOBILE-BACKUP-v1');
function checkKey(key){if(!Buffer.isBuffer(key)||key.length!==32)throw new TypeError('32-byte backup key required');}
// Snapshot of the explicitly supplied database, NOT all SEVA/Drive/cloud data.
export function encryptedSnapshot(db,destination,key) {
  checkKey(key);const dir=mkdtempSync(join(tmpdir(),'seva-snapshot-'));
  try {
    const plain=join(dir,'snapshot.sqlite');db.prepare('VACUUM INTO ?').run(plain);
    const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
    const ciphertext=Buffer.concat([cipher.update(readFileSync(plain)),cipher.final()]);
    const result=Buffer.concat([aad,iv,cipher.getAuthTag(),ciphertext]);
    writeFileSync(destination,result,{flag:'wx',mode:0o600});return {bytes:result.length,encrypted:true};
  }finally{rmSync(dir,{recursive:true,force:true});}
}
export function restoreEncryptedSnapshot(source,destination,key) {
  checkKey(key);const sealed=readFileSync(source),offset=aad.length;
  if(sealed.length<offset+29||!sealed.subarray(0,offset).equals(aad))throw Error('Invalid backup format');
  const decipher=createDecipheriv('aes-256-gcm',key,sealed.subarray(offset,offset+12));
  decipher.setAAD(aad);decipher.setAuthTag(sealed.subarray(offset+12,offset+28));
  const plaintext=Buffer.concat([decipher.update(sealed.subarray(offset+28)),decipher.final()]);
  writeFileSync(destination,plaintext,{flag:'wx',mode:0o600});
  let db;
  try {db=new DatabaseSync(destination);const result=db.prepare('PRAGMA integrity_check').get();
    if(Object.values(result)[0]!=='ok')throw Error('Restored database integrity check failed');
    return {integrity:'ok',bytes:plaintext.length};
  }catch(error){if(db){db.close();db=null;}rmSync(destination,{force:true});throw error;}
  finally{db?.close();}
}
