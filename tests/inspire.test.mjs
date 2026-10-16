import test from 'node:test';import assert from 'node:assert/strict';
import {INSPIRE_THEMES,buildDataEuropaSpatialSearch,resolveInspireThemes,sanitizePublicSpatialRecord} from '../packages/geo/inspire.mjs';

test('INSPIRE catalogue exposes all 34 official themes',()=>{
  assert.equal(INSPIRE_THEMES.length,34);
  const keys=new Set(INSPIRE_THEMES.map(t=>t.key));
  for(const key of ['AD','CP','BU','LU','TN','OI','NZ','US']) assert.equal(keys.has(key),true);
});

test('real-estate preset is useful but narrower than all themes',()=>{
  const realEstate=resolveInspireThemes('real_estate');
  assert.ok(realEstate.length>10);
  assert.ok(realEstate.length<34);
  assert.equal(realEstate.some(t=>t.key==='CP'),true);
});

test('data.europa.eu search plan uses geospatial catalogue facet',()=>{
  const out=buildDataEuropaSpatialSearch({country:'IT',city:'Trieste',street:'Via San Nicolo',number:'23',themes:['AD','CP']});
  const url=new URL(out.url);
  assert.equal(url.origin,'https://data.europa.eu');
  assert.equal(url.pathname,'/api/hub/search/search');
  assert.match(url.searchParams.get('facets'),/geospatial/);
  assert.equal(out.privacy.personalDataEnrichment,false);
});

test('public spatial sanitizer removes direct identity fields',()=>{
  const out=sanitizePublicSpatialRecord({parcelId:'A-1',ownerName:'Mario Rossi',codice_fiscale:'ABC',certificateId:'DOC-9',area:100});
  assert.deepEqual(out,{parcelId:'A-1',area:100});
});
