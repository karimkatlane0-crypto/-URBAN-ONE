import test from 'node:test';
import assert from 'node:assert/strict';
import {ingestPropertyBatch,deduplicatePropertyRecords,propertyIngestionPolicy} from '../packages/discovery/property-ingestion.mjs';

const now=Date.parse('2026-11-25T12:00:00.000Z');
const source={id:'agency-feed-01',accessMethod:'licensed_feed',allowedHosts:['feed.example.it'],authorization:{status:'APPROVED',reviewedAt:'2026-11-20T10:00:00.000Z',agreementRef:'CONTRACT-REF-2026-01',purposes:['sale','rent']}};
const row=(overrides={})=>({externalId:'A-100',purpose:'sale',country:'IT',city:'Trieste',title:'Appartamento test',propertyType:'residential',sourceUrl:'https://feed.example.it/listings/A-100',observedAt:'2026-11-25T11:00:00.000Z',price:{currency:'EUR',amountCents:18500000},areaSqm:82,address:{street:'Via Roma',number:'12/A'},...overrides});

test('ingests only records from a recently approved source and approved purpose',()=>{
 const result=ingestPropertyBatch({source,records:[row()],now});
 assert.equal(result.status,'PROCESSED');assert.equal(result.accepted.length,1);assert.equal(result.accepted[0].price.amountCents,18500000);
 assert.equal(result.accepted[0].provenance.authorizationRef,'CONTRACT-REF-2026-01');
});
test('fails closed when source approval is absent, stale or method is prohibited',()=>{
 assert.equal(ingestPropertyBatch({source:{...source,authorization:{...source.authorization,status:'PENDING'}},records:[row()],now}).status,'SOURCE_BLOCKED');
 assert.equal(ingestPropertyBatch({source:{...source,authorization:{...source.authorization,reviewedAt:'2026-01-01T00:00:00.000Z'}},records:[row()],now}).status,'SOURCE_BLOCKED');
 assert.equal(ingestPropertyBatch({source:{...source,accessMethod:'html_scrape'},records:[row()],now}).status,'SOURCE_BLOCKED');
});
test('rejects unsafe URLs, unauthorized purposes, stale records and invalid prices',()=>{
 const result=ingestPropertyBatch({source,records:[
  row({sourceUrl:'http://feed.example.it/a'}),
  row({purpose:'holiday_let'}),
  row({observedAt:'2026-11-01T00:00:00.000Z'}),
  row({price:{currency:'EUR',amountCents:0}}),
  row({sourceUrl:'https://feed.example.it.attacker.test/a'})
 ],now});
 assert.equal(result.accepted.length,0);assert.equal(result.rejected,5);
});
test('deduplicates exact property identity across sources using newest observation',()=>{
 const a={...row(),identity:'same-property',observedAt:'2026-11-25T10:00:00.000Z'};
 const b={...row({externalId:'B-200'}),identity:'same-property',observedAt:'2026-11-25T11:00:00.000Z'};
 const result=deduplicatePropertyRecords([a,b]);
 assert.equal(result.length,1);assert.equal(result[0].externalId,'B-200');
});
test('does not expose owner identity fields and declares non-operational scheduler/persistence',()=>{
 const result=ingestPropertyBatch({source,records:[row({ownerName:'Private Person',ownerEmail:'private@example.it'})],now});
 assert.equal('ownerName' in result.accepted[0],false);assert.equal('ownerEmail' in result.accepted[0],false);
 assert.equal(propertyIngestionPolicy.backgroundScheduling,false);assert.equal(propertyIngestionPolicy.persistence,false);
});
