export const COPERNICUS_STAC_API='https://stac.dataspace.copernicus.eu/v1/';
export const COPERNICUS_STAC_SEARCH=`${COPERNICUS_STAC_API}search`;
export const COPERNICUS_STAC_BROWSER='https://browser.stac.dataspace.copernicus.eu/';

export const COPERNICUS_COLLECTIONS=Object.freeze([
  {id:'sentinel-1-grd',label:'Sentinel-1 Ground Range Detected',sensor:'SAR',cloudFilter:false},
  {id:'sentinel-2-l1c',label:'Sentinel-2 Level-1C',sensor:'optical',cloudFilter:true},
  {id:'sentinel-2-l2a',label:'Sentinel-2 Level-2A',sensor:'optical',cloudFilter:true}
]);

const COLLECTION_BY_ID=new Map(COPERNICUS_COLLECTIONS.map(c=>[c.id,c]));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

function normalizedCollection(value='sentinel-2-l2a'){
  const id=String(value||'sentinel-2-l2a').trim().toLowerCase();
  const collection=COLLECTION_BY_ID.get(id);
  if(!collection) throw new RangeError(`Unsupported Copernicus collection: ${id}`);
  return collection;
}

function normalizedBbox(value){
  if(!Array.isArray(value)||value.length!==4) throw new RangeError('bbox must be [west,south,east,north]');
  const bbox=value.map(Number);
  if(bbox.some(v=>!Number.isFinite(v))) throw new RangeError('bbox values must be finite numbers');
  const [west,south,east,north]=bbox;
  if(west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north){
    throw new RangeError('bbox is outside WGS84 bounds or has invalid ordering');
  }
  return bbox;
}

function normalizedDate(value,name){
  if(value==null||value==='') return null;
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) throw new RangeError(`${name} must be an ISO-8601 date/time`);
  return date.toISOString();
}

export function buildCopernicusStacSearch({
  collection='sentinel-2-l2a',
  bbox,
  start,
  end,
  cloudCoverMax=20,
  limit=25
}={}){
  const selected=normalizedCollection(collection);
  const normalizedBox=normalizedBbox(bbox);
  const startIso=normalizedDate(start,'start');
  const endIso=normalizedDate(end,'end');
  if(startIso&&endIso&&startIso>endIso) throw new RangeError('start must be before or equal to end');

  const body={
    collections:[selected.id],
    bbox:normalizedBox,
    limit:clamp(Math.trunc(Number(limit)||25),1,100)
  };

  if(startIso||endIso) body.datetime=`${startIso||'..'}/${endIso||'..'}`;
  if(selected.cloudFilter){
    const cloud=clamp(Number(cloudCoverMax),0,100);
    if(!Number.isFinite(cloud)) throw new RangeError('cloudCoverMax must be a number between 0 and 100');
    body.query={'eo:cloud_cover':{lte:cloud}};
  }

  return {
    provider:'Copernicus Data Space Ecosystem',
    service:'STAC product catalogue',
    endpoint:COPERNICUS_STAC_SEARCH,
    method:'POST',
    collection:selected,
    request:body,
    access:{mode:'catalogue-metadata-search',networkAction:'user-initiated',credentialsEmbedded:false},
    privacy:{naturalPersonLookup:false,ownerIdentityLookup:false},
    usage:{downloadAutomatic:false,providerTermsControlReuse:true,quotaAware:true}
  };
}

export function copernicusSatellitePolicy(){
  return {
    provider:'Copernicus Data Space Ecosystem',
    catalogue:'STAC 1.1',
    endpoint:COPERNICUS_STAC_API,
    browser:COPERNICUS_STAC_BROWSER,
    collections:COPERNICUS_COLLECTIONS,
    rules:[
      'Use the official Copernicus Data Space catalogue for Earth Observation discovery.',
      'Keep catalogue discovery separate from product download and processing.',
      'Respect provider quotas, licences, attribution and authentication requirements.',
      'Do not infer natural-person identity or property ownership from satellite observations.',
      'Treat satellite imagery as observational evidence, not cadastral or legal proof.'
    ]
  };
}
