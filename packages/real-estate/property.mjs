export const statuses=['sale','sold','rent','rented','reserved','unavailable','off_market'];

const text=v=>String(v??'').normalize('NFKC').trim();
const fold=v=>text(v).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('und');
const words=v=>fold(v).replace(/[’'`]/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');

export function normalizeHouseNumber(value){
  let v=text(value).toUpperCase().replace(/\s+/g,'');
  v=v.replace(/[–—-]/g,'/').replace(/\/{2,}/g,'/');
  const m=v.match(/^(\d+)(?:\/?([A-Z]))?$/u);
  if(m) return m[2]?`${m[1]}/${m[2]}`:m[1];
  return v;
}

export function normalizeAddress({country,city,street,number,postalCode,lat,lng}={}){
  const address={
    country:text(country).toUpperCase(),
    city:text(city),
    street:text(street),
    number:normalizeHouseNumber(number),
    postalCode:text(postalCode).toUpperCase()
  };
  if(Number.isFinite(Number(lat))) address.lat=Number(lat);
  if(Number.isFinite(Number(lng))) address.lng=Number(lng);
  return address;
}

export function addressKey(address={}){
  const a=normalizeAddress(address);
  return [a.country,words(a.city),words(a.street),a.number,a.postalCode].join('|');
}

export function buildMapQuery(address={}){
  const a=normalizeAddress(address);
  return [a.street,a.number,a.postalCode,a.city,a.country].filter(Boolean).join(', ');
}

export function propertyMatches(record={},query={}){
  const r=normalizeAddress(record);
  const q=normalizeAddress(query);
  if(q.country&&r.country!==q.country) return false;
  if(q.city&&words(r.city)!==words(q.city)) return false;
  if(q.postalCode&&r.postalCode!==q.postalCode) return false;
  if(q.street&&words(r.street)!==words(q.street)) return false;
  // If a house number is supplied, matching is deliberately exact after canonicalization.
  if(q.number&&r.number!==q.number) return false;
  if(query.status&&query.status!=='all'&&record.status!==query.status) return false;
  if(query.minAreaSqm!=null&&Number(record.areaSqm)<Number(query.minAreaSqm)) return false;
  if(query.maxPriceCents!=null&&Number(record.priceCents)>Number(query.maxPriceCents)) return false;
  return true;
}

export function searchProperties(records=[],query={}){
  if(!Array.isArray(records)) throw new TypeError('records must be an array');
  const matches=records.filter(r=>propertyMatches(r,query));
  return {
    query:normalizeAddress(query),
    mapQuery:buildMapQuery(query),
    exactHouseNumber:Boolean(text(query.number)),
    count:matches.length,
    matches
  };
}
