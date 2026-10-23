export const statuses=Object.freeze(['sale','sold','rent','rented','reserved','unavailable','off_market']);
export const statusLabels=Object.freeze({sale:'In vendita',sold:'Venduto (dichiarato)',rent:'In affitto',rented:'Affittato (dichiarato)',reserved:'In trattativa',unavailable:'Non disponibile',off_market:'Ritirato'});
export const europeCountryCodes=Object.freeze('AL AD AT BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO SM RS SK SI ES SE CH TR UA GB VA BY RU'.split(' '));

const text=v=>String(v??'').normalize('NFKC').trim();
const fold=v=>text(v).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('und');
const words=v=>fold(v).replace(/[’'`]/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');

export function normalizeHouseNumber(value){
  const v=text(value).toLocaleUpperCase('und').replace(/\s+/g,' ').replace(/[–—]/g,'-');
  // Conflate only a simple numeric civic with a single-letter suffix.
  const simple=v.match(/^(\d+)\s*(?:[-/]\s*)?([A-Z])$/u);
  if(simple)return simple[1]+'/'+simple[2];
  // Preserve country-specific numbers: 12 bis, 12/1, 12-14, 12 Stg 2.
  return v;
}
export function normalizeAddress({country,city,street,number,postalCode,lat,lng}={}){
  const address={
    country:text(country).toUpperCase(),
    city:text(city),
    street:text(street),
    number:normalizeHouseNumber(number),
    postalCode:text(postalCode).toUpperCase().replace(/\s+/g,'')
  };
  if(lat!=null&&String(lat).trim()!==''&&Number.isFinite(Number(lat))) address.lat=Number(lat);
  if(lng!=null&&String(lng).trim()!==''&&Number.isFinite(Number(lng))) address.lng=Number(lng);
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

export function initialPropertyStatus(purpose){
  if(purpose==='Vendita')return 'sale';
  if(purpose==='Locazione')return 'rent';
  throw new Error('INVALID_PROPERTY_PURPOSE');
}
export function allowedPropertyStatusTransition(purpose,current,next){
  const start=initialPropertyStatus(purpose),done=start==='sale'?'sold':'rented';
  if(!statuses.includes(current)||!statuses.includes(next))return false;
  if(current===done)return next===done;
  if(current===start)return [start,'reserved',done,'unavailable','off_market'].includes(next);
  if(current==='reserved')return ['reserved',start,done,'unavailable','off_market'].includes(next);
  if(current==='unavailable')return ['unavailable',start,'off_market'].includes(next);
  if(current==='off_market')return ['off_market',start].includes(next);
  return false;
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
  if(query.minAreaSqm!=null&&(!Number.isFinite(Number(record.areaSqm))||Number(record.areaSqm)<Number(query.minAreaSqm))) return false;
  if(query.maxPriceCents!=null&&(!Number.isFinite(Number(record.priceCents))||Number(record.priceCents)>Number(query.maxPriceCents))) return false;
  return true;
}

export function searchProperties(records=[],query={}){
  if(!Array.isArray(records)) throw new TypeError('records must be an array');
  if(records.length>10000)throw new RangeError('SEARCH_RESULT_LIMIT');
  const matches=records.filter(r=>propertyMatches(r,query));
  return {
    query:normalizeAddress(query),
    mapQuery:buildMapQuery(query),
    exactHouseNumber:Boolean(text(query.number)),
    countryCoverage:'USER_SUPPLIED_RECORDS_ONLY',registryCoverageVerified:false,
    count:matches.length,
    matches
  };
}
