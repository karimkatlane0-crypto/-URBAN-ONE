import {DatabaseSync} from 'node:sqlite';
import {lstatSync} from 'node:fs';
import {isAbsolute,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {randomUUID} from 'node:crypto';
import {initMobileSchema} from './mobile-sync-api.mjs';

const identifier=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/.test(value);
const reference=value=>typeof value==='string'&&value.trim()&&value.length<=512&&!/[\u0000-\u001f]/.test(value);
const exists=(db,name)=>Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name));

// Local operator utility, never an HTTP route. No user registration or silent rights grant.
export function provisionMobileAccess({database,subject,tenant,role,sourceId,rightsRef,authorizationRef,apply=false}) {
  if(!isAbsolute(database||'')||!lstatSync(database).isFile())throw Error('existing_absolute_database_required');
  if(!identifier(subject)||!identifier(tenant)||!identifier(sourceId))throw Error('invalid_identifier');
  if(!['owner','operator','viewer'].includes(role))throw Error('invalid_role');
  if(!reference(rightsRef)||!reference(authorizationRef))throw Error('explicit_authorization_and_source_references_required');
  const db=new DatabaseSync(database,{readOnly:!apply});
  function inspect() {
    if(!exists(db,'users')||!exists(db,'audit'))throw Error('existing_seva_database_required');
    if(!db.prepare('SELECT id FROM users WHERE id=?').get(subject))throw Error('existing_seva_user_required');
    const member=exists(db,'mobile_subjects')?db.prepare('SELECT * FROM mobile_subjects WHERE subject=?').get(subject):null;
    if(member&&(member.tenant!==tenant||member.role!==role||member.active!==1))throw Error('existing_membership_conflict');
    const source=exists(db,'mobile_sources')?db.prepare('SELECT * FROM mobile_sources WHERE tenant=? AND source_id=?').get(tenant,sourceId):null;
    if(source&&(source.rights_ref!==rightsRef||source.enabled!==1))throw Error('existing_source_conflict');
    return {addMembership:!member,addSource:!source};
  }
  try {
    let changes=inspect(),schemaChanged=false;
    if(apply) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const before=db.prepare('PRAGMA schema_version').get().schema_version;
        initMobileSchema(db);schemaChanged=db.prepare('PRAGMA schema_version').get().schema_version!==before;
        changes=inspect();
        if(changes.addMembership)db.prepare('INSERT INTO mobile_subjects VALUES(?,?,?,1)').run(subject,tenant,role);
        if(changes.addSource)db.prepare('INSERT INTO mobile_sources VALUES(?,?,?,1)').run(tenant,sourceId,rightsRef);
        if(changes.addMembership||changes.addSource||schemaChanged)db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(
          randomUUID(),subject,'mobile_access_provisioned',
          JSON.stringify({actorType:'local_operator',tenant,role,sourceId,authorizationRef,rightsRef,schemaChanged}),
          Math.floor(Date.now()/1000));
        db.exec('COMMIT');
      }catch(error){db.exec('ROLLBACK');throw error;}
    }
    return {status:apply?(changes.addMembership||changes.addSource||schemaChanged?'APPLIED':'ALREADY_CONFIGURED'):'PROPOSED',
      subject,tenant,role,sourceId,changes,schemaChanged,configurationWritten:apply&&(changes.addMembership||changes.addSource||schemaChanged),
      referencesIndependentlyVerified:false,consentRecordsChanged:false,providerRequestsMade:0};
  }finally{db.close();}
}

export function main(args=process.argv.slice(2)) {
  try {
    const {values}=parseArgs({args,options:{database:{type:'string'},subject:{type:'string'},tenant:{type:'string'},
      role:{type:'string'},source:{type:'string'},'rights-ref':{type:'string'},'authorization-ref':{type:'string'},
      apply:{type:'boolean',default:false},help:{type:'boolean',short:'h'}}});
    if(values.help){console.log('Usage: node --experimental-sqlite mobile-sync-install.mjs --database /absolute/existing.sqlite --subject EXISTING_USER_ID --tenant TENANT --role owner|operator|viewer --source SOURCE_ID --rights-ref SOURCE_EVIDENCE --authorization-ref MEMBERSHIP_EVIDENCE [--apply]\nDefault: read-only proposal. --apply atomically adds reviewed membership/source only; conflicting existing entries are refused.');return 0;}
    const result=provisionMobileAccess({database:values.database,subject:values.subject,tenant:values.tenant,
      role:values.role,sourceId:values.source,rightsRef:values['rights-ref'],authorizationRef:values['authorization-ref'],apply:values.apply});
    console.log(JSON.stringify(result));return 0;
  }catch(error){console.error(JSON.stringify({status:'INPUT_ERROR',error:error.code==='ENOENT'?'existing_absolute_database_required':error.message}));return 2;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)process.exitCode=main();
