// Account-scoped records; academic status is declared, never inferred from email.
export const STUDENT_NOTICE_VERSION='2026-10-26';
const studentError=(message,status=400)=>Object.assign(Error(message),{status});
const studentJson=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const studentFields=['displayName','university','course','academicYear','universityEmail','studentNumber','consent','declaration','noticeVersion','version'];
export function validateStudent(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!studentFields.includes(k)))throw studentError('Campi del profilo non validi');
 if(input.consent!==true||input.declaration!==true||input.noticeVersion!==STUDENT_NOTICE_VERSION)throw studentError('Conferma informativa e dichiarazione studente');
 if(!Number.isSafeInteger(input.version)||input.version<0)throw studentError('Versione del profilo non valida');
 const text=(key,max,required=true)=>{const v=input[key]??'';if(typeof v!=='string'||v.length>max||/[\u0000-\u001f\u007f]/.test(v)||required&&!v.trim())throw studentError('Campo non valido: '+key);return v.trim();};
 const profile={displayName:text('displayName',120),university:text('university',200),course:text('course',200),academicYear:text('academicYear',9),universityEmail:text('universityEmail',254,false).toLowerCase(),studentNumber:text('studentNumber',50,false)};
 const years=/^(20\d{2})\/(20\d{2})$/.exec(profile.academicYear);
 if(!years||Number(years[2])!==Number(years[1])+1)throw studentError('Anno accademico nel formato 2026/2027');
 if(profile.universityEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.universityEmail))throw studentError('Email universitaria non valida');
 return profile;
}
function requireStudentOwner(owner){if(typeof owner!=='string'||!owner.trim()||owner.length>200)throw studentError('Accedi per gestire il tuo profilo',401);}
export async function readStudent(db,owner){
 requireStudentOwner(owner);if(!db)throw studentError('Database studenti non disponibile',503);
 const row=await db.prepare('SELECT id,profile_json,version,created_at,updated_at FROM seva_student_profiles WHERE owner_id=?').bind(owner).first();
 return row?{...JSON.parse(row.profile_json),studentId:row.id,version:row.version,createdAt:row.created_at,updatedAt:row.updated_at,verificationStatus:'self_declared',universityEmailVerified:false,noticeVersion:JSON.parse(row.profile_json).noticeVersion}:null;
}
export async function saveStudent(db,owner,input){
 requireStudentOwner(owner);if(!db)throw studentError('Database studenti non disponibile',503);
 const validated=validateStudent(input),now=new Date().toISOString(),profile={...validated,noticeVersion:STUDENT_NOTICE_VERSION,declarationAcceptedAt:now},id='SEVA-STU-'+crypto.randomUUID();
 const row=await db.prepare(`INSERT INTO seva_student_profiles(owner_id,id,profile_json,version,created_at,updated_at) SELECT ?,?,?,1,?,? WHERE ?=0 ON CONFLICT(owner_id) DO UPDATE SET profile_json=excluded.profile_json,version=seva_student_profiles.version+1,updated_at=excluded.updated_at WHERE seva_student_profiles.version=? RETURNING id`).bind(owner,id,JSON.stringify(profile),now,now,input.version,input.version).first();
 // An UPDATE-only save must still work when version is greater than zero.
 if(!row&&input.version>0){const updated=await db.prepare('UPDATE seva_student_profiles SET profile_json=?,version=version+1,updated_at=? WHERE owner_id=? AND version=? RETURNING id').bind(JSON.stringify(profile),now,owner,input.version).first();if(!updated)throw studentError('Profilo modificato: ricarica prima di salvare',409);}
 else if(!row)throw studentError('Profilo già presente: ricarica prima di salvare',409);
 return readStudent(db,owner);
}
export async function deleteStudent(db,owner,version){
 requireStudentOwner(owner);if(!db)throw studentError('Database studenti non disponibile',503);
 if(!Number.isSafeInteger(version)||version<1)throw studentError('Versione del profilo non valida');
 const deleted=await db.prepare('DELETE FROM seva_student_profiles WHERE owner_id=? AND version=? RETURNING id').bind(owner,version).first();
 if(!deleted)throw studentError('Profilo modificato o già eliminato: ricarica',409);
 return {deleted:true};
}
export async function handleStudent(request,env){
 const owner=request.headers.get('oai-authenticated-user-id');
 try{
 requireStudentOwner(owner);
 if(request.method==='GET')return studentJson({profile:await readStudent(env.DB,owner)});
 if(!['PUT','DELETE'].includes(request.method))return studentJson({error:'Metodo non consentito'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return studentJson({error:'Origine non autorizzata'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return studentJson({error:'È richiesto JSON'},415);
 const reader=request.body?.getReader();if(!reader)return studentJson({error:'Richiesta vuota'},400);
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();return studentJson({error:'Richiesta troppo lunga'},413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let input;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{return studentJson({error:'JSON non valido'},400);}
 if(request.method==='PUT')return studentJson({profile:await saveStudent(env.DB,owner,input)});
 return studentJson(await deleteStudent(env.DB,owner,input?.version));
 }catch(e){return studentJson({error:e.status?e.message:'Profilo temporaneamente non disponibile'},e.status||503);}
}
