import {createHash} from 'node:crypto';

const text=v=>String(v??'').normalize('NFKC').trim();
const compact=v=>text(v).replace(/\s+/g,' ');

export function normalizePhone(value){
  let v=text(value).replace(/[().\s-]/g,'');
  if(v.startsWith('00')) v='+'+v.slice(2);
  return /^\+[1-9]\d{6,14}$/.test(v)?v:'';
}

export function normalizeEmail(value){
  const v=text(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?v:'';
}

export function certificateFingerprint(value){
  const v=text(value);
  return v?createHash('sha256').update(v,'utf8').digest('hex'):null;
}

export function normalizeContact(record={}, {source='skebby'}={}){
  const givenName=compact(record.givenName??record.name);
  const familyName=compact(record.familyName??record.surname);
  const displayName=compact(record.displayName??[givenName,familyName].filter(Boolean).join(' '));
  const phone=normalizePhone(record.phone??record.phoneNumber);
  const email=normalizeEmail(record.email);
  const city=compact(record.city);
  const province=compact(record.province);
  const zone=compact(record.zone??[city,province].filter(Boolean).join(' · '));
  const sourceContactId=compact(record.sourceContactId??record.id);
  const certificateIdHash=certificateFingerprint(record.certificateId??record.certificate_id??record.certId);
  return {
    source:compact(source)||'skebby',
    sourceContactId,
    givenName,
    familyName,
    displayName,
    phone,
    email,
    city,
    province,
    zone,
    certificateIdHash,
    certificateIssuer:compact(record.certificateIssuer??record.certificate_issuer),
    certificateValidTo:compact(record.certificateValidTo??record.certificate_valid_to),
    consentStatus:['granted','denied','revoked'].includes(record.consentStatus)?record.consentStatus:'unknown',
    consentEvidenceRef:compact(record.consentEvidenceRef??record.consent_evidence),
    rpoStatus:['clear','opposed'].includes(record.rpoStatus)?record.rpoStatus:'not_checked',
    directOpposition:Boolean(record.directOpposition??record.direct_opposition),
    // Never persist the raw certificate/document identifier from this normalized object.
  };
}

export function contactDedupKey(contact){
  if(contact.sourceContactId) return `${contact.source}:${contact.sourceContactId}`;
  if(contact.phone) return `phone:${contact.phone}`;
  if(contact.email) return `email:${contact.email}`;
  return '';
}

export function prepareContactImport(records=[], {source='skebby',maxRecords=500}={}){
  if(!Array.isArray(records)) throw new TypeError('records must be an array');
  if(records.length>maxRecords) throw new RangeError(`record limit exceeded: ${maxRecords}`);
  const accepted=[];const rejected=[];const duplicateIndexes=[];const seen=new Set();
  records.forEach((raw,index)=>{
    const contact=normalizeContact(raw,{source});
    if(!contact.phone&&!contact.email){rejected.push({index,reason:'VALID_PHONE_OR_EMAIL_REQUIRED'});return;}
    const key=contactDedupKey(contact);
    if(key&&seen.has(key)){duplicateIndexes.push(index);return;}
    if(key) seen.add(key);
    accepted.push(contact);
  });
  return {
    source,
    inputCount:records.length,
    acceptedCount:accepted.length,
    rejectedCount:rejected.length,
    duplicateCount:duplicateIndexes.length,
    consentInferred:false,
    certificateStorage:'sha256_fingerprint_only',
    accepted,
    rejected,
    duplicateIndexes
  };
}
