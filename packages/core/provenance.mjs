import crypto from 'node:crypto';
export function canonical(value){
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value && typeof value==='object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
export function sha256(value){return crypto.createHash('sha256').update(canonical(value)).digest('hex');}
export function envelope({sourceRef,purpose,scope,data}){
  if(!sourceRef||!purpose||!scope) throw new Error('PROVENANCE_REQUIRED');
  const body={sourceRef,purpose,scope,data};
  return {...body,sha256:sha256(body),createdAt:new Date().toISOString()};
}
