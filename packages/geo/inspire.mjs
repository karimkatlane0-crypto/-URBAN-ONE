export const DATA_EUROPA_SEARCH_API='https://data.europa.eu/api/hub/search/search';
export const DATA_EUROPA_PORTAL='https://data.europa.eu/';
export const INSPIRE_KNOWLEDGE_BASE='https://knowledge-base.inspire.ec.europa.eu/';

export const INSPIRE_THEMES=Object.freeze([
  {key:'AD',label:'Addresses',annex:1,realEstate:true},
  {key:'AU',label:'Administrative units',annex:1,realEstate:true},
  {key:'CP',label:'Cadastral parcels',annex:1,realEstate:true},
  {key:'RS',label:'Coordinate reference systems',annex:1,realEstate:false},
  {key:'GG',label:'Geographical grid systems',annex:1,realEstate:false},
  {key:'GN',label:'Geographical names',annex:1,realEstate:true},
  {key:'HY',label:'Hydrography',annex:1,realEstate:true},
  {key:'PS',label:'Protected sites',annex:1,realEstate:true},
  {key:'TN',label:'Transport networks',annex:1,realEstate:true},
  {key:'EL',label:'Elevation',annex:2,realEstate:true},
  {key:'GE',label:'Geology',annex:2,realEstate:true},
  {key:'LC',label:'Land cover',annex:2,realEstate:true},
  {key:'OI',label:'Orthoimagery',annex:2,realEstate:true},
  {key:'AF',label:'Agricultural and aquaculture facilities',annex:3,realEstate:false},
  {key:'AM',label:'Area management / restriction / regulation zones & reporting units',annex:3,realEstate:true},
  {key:'AC',label:'Atmospheric conditions',annex:3,realEstate:false},
  {key:'BR',label:'Bio-geographical regions',annex:3,realEstate:false},
  {key:'BU',label:'Buildings',annex:3,realEstate:true},
  {key:'ER',label:'Energy Resources',annex:3,realEstate:false},
  {key:'EF',label:'Environmental monitoring Facilities',annex:3,realEstate:false},
  {key:'HB',label:'Habitats and biotopes',annex:3,realEstate:false},
  {key:'HH',label:'Human health and safety',annex:3,realEstate:true},
  {key:'LU',label:'Land use',annex:3,realEstate:true},
  {key:'MF',label:'Meteorological geographical features',annex:3,realEstate:false},
  {key:'MR',label:'Mineral Resources',annex:3,realEstate:false},
  {key:'NZ',label:'Natural risk zones',annex:3,realEstate:true},
  {key:'OF',label:'Oceanographic geographical features',annex:3,realEstate:false},
  {key:'PD',label:'Population distribution and demography',annex:3,realEstate:true},
  {key:'PF',label:'Production and industrial facilities',annex:3,realEstate:true},
  {key:'SR',label:'Sea regions',annex:3,realEstate:false},
  {key:'SO',label:'Soil',annex:3,realEstate:true},
  {key:'SD',label:'Species distribution',annex:3,realEstate:false},
  {key:'SU',label:'Statistical units',annex:3,realEstate:true},
  {key:'US',label:'Utility and governmental services',annex:3,realEstate:true}
]);

const THEME_BY_KEY=new Map(INSPIRE_THEMES.map(t=>[t.key,t]));
const clean=v=>String(v??'').normalize('NFKC').trim();
const quote=v=>`"${clean(v).replace(/["\\]/g,' ')}"`;

export function resolveInspireThemes(input='real_estate'){
  if(input==='all') return INSPIRE_THEMES;
  if(input==='real_estate'||input==null) return INSPIRE_THEMES.filter(t=>t.realEstate);
  const keys=Array.isArray(input)?input:[input];
  const seen=new Set();
  return keys.map(k=>THEME_BY_KEY.get(clean(k).toUpperCase())).filter(t=>t&&!seen.has(t.key)&&seen.add(t.key));
}

export function buildDataEuropaSpatialSearch({country,city,street,number,postalCode,themes='real_estate',page=0,limit=25}={}){
  const selected=resolveInspireThemes(themes);
  const locationTerms=[country,city,street,number,postalCode].map(clean).filter(Boolean).map(quote);
  const themeTerms=selected.map(t=>quote(t.label));
  const q=[locationTerms.join(' AND '),themeTerms.length?`(${themeTerms.join(' OR ')})`:'' ].filter(Boolean).join(' AND ');
  const url=new URL(DATA_EUROPA_SEARCH_API);
  url.searchParams.set('page',String(Math.max(0,Number(page)||0)));
  url.searchParams.set('limit',String(Math.min(100,Math.max(1,Number(limit)||25))));
  url.searchParams.set('q',q);
  url.searchParams.set('filters','catalogue,dataset,resource');
  url.searchParams.set('resource','editorial-content');
  url.searchParams.set('facets',JSON.stringify({source_type:['geospatial']}));
  return {
    provider:'European Data Portal / INSPIRE catalogues',
    endpoint:DATA_EUROPA_SEARCH_API,
    url:url.toString(),
    query:q,
    themeCount:selected.length,
    themes:selected,
    access:{mode:'public-metadata-read',networkAction:'user-initiated',providerTermsControlReuse:true},
    privacy:{ownerIdentityLookup:false,personalDataEnrichment:false,certificateIdLookup:false}
  };
}

const FORBIDDEN_PUBLIC_KEYS=/^(owner|ownername|proprietor|personname|firstname|lastname|givenname|familyname|taxcode|fiscalcode|codicefiscale|certificateid|documentid|passport|identitydocument)$/i;

export function sanitizePublicSpatialRecord(record={}){
  if(!record||typeof record!=='object'||Array.isArray(record)) return {};
  return Object.fromEntries(Object.entries(record).filter(([key])=>!FORBIDDEN_PUBLIC_KEYS.test(String(key).replace(/[_\-\s]/g,''))));
}

export function publicSpatialPolicy(){
  return {
    directive:'2007/2/EC INSPIRE',
    catalogue:'data.europa.eu',
    themeCount:INSPIRE_THEMES.length,
    rules:[
      'Use public spatial metadata and provider-published services only.',
      'Respect dataset-specific licences, access restrictions, charges and attribution requirements.',
      'Do not infer or expose natural-person ownership, tax identifiers or identity-document data from cadastral geometry.',
      'Treat address and cadastral geometry as location data, not proof of title or legal ownership.'
    ]
  };
}
