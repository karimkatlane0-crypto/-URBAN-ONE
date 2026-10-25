import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {discover} from '../packages/discovery/search.mjs';
import {route} from '../services/api/router.mjs';
const at='2026-10-25T08:00:00Z', now=Date.parse(at);
const query={mode:'rent',city:'Trieste',budget:1500};
const row={mode:'rent',city:'Trieste',title:'Synthetic test fixture',sourceName:'Test only',sourceUrl:'https://source.example/listing',inquiryUrl:'https://source.example/visit',publicationAuthorized:true,authorizationObservedAt:at,observedAt:at,price:{currency:'EUR',basis:'month',amount:1000,mandatoryFees:100}};
const catalog=()=>({allowedHosts:['source.example'],records:[structuredClone(row)]});

test('no inventory is fabricated and client catalog or approval flags are ignored',()=>{
 assert.equal(discover(query,{},now).status,'SOURCE_REQUIRED');
 const result=route({method:'POST',path:'/api/public/discovery/search',body:{...query,records:[row],catalog:catalog(),advertiser:'joined'}});
 assert.equal(result.body.status,'SOURCE_REQUIRED');assert.deepEqual(result.body.items,[]);
 assert.equal(discover({mode:'tourism'}, {}, now).status,'NEEDS_DETAILS');
});
test('mandatory fees affect filtering and only public fields leave the server',()=>{
 const c=catalog();c.records[0].secret='never-output';
 assert.equal(discover({...query,budget:1050},c,now).items.length,0);
 const result=discover(query,c,now);assert.equal(result.items[0].price.total,1100);
 assert.equal(result.items[0].action.url,'https://source.example/visit');
 assert.doesNotMatch(JSON.stringify(result),/never-output|publicationAuthorized/);
});
test('stale, future, unauthorized, unsafe and malformed records are withheld',()=>{
 for(const change of [{observedAt:'2026-10-23T08:00:00Z'},{observedAt:'2026-10-26T08:00:00Z'},{publicationAuthorized:false},{authorizationObservedAt:null},{sourceUrl:'javascript:alert(1)'},{sourceUrl:'https://source.example.attacker.test/'},{sourceUrl:'https://user:pass@source.example/'},{price:{...row.price,mandatoryFees:null}},{price:{...row.price,amount:-1}},{price:{...row.price,basis:'stay'}}]){
 const c=catalog();Object.assign(c.records[0],change);assert.equal(discover(query,c,now).items.length,0,JSON.stringify(change));
 }
 const c=catalog();c.records[0].inquiryUrl='https://attacker.test';assert.equal(discover(query,c,now).items[0].action,null);
});
test('tourism matches exact quote and advertiser evidence gates the tracking link',()=>{
 const q={...query,mode:'tourism',arrival:'2026-11-01',departure:'2026-11-04',guests:2};
 const c=catalog();Object.assign(c.records[0],q,{price:{...row.price,basis:'stay'},advertiser:'booking',linkKey:'stay'});
 c.advertisers={booking:{links:{stay:'https://source.example/authorized-test-link'},disclosure:'Link affiliato: possiamo ricevere una commissione.',evidence:{}}};
 assert.equal(discover(q,c,now).items[0].action,null);
 for(const [gate,status] of Object.entries({network:'active',advertiser:'joined',property:'active',terms:'accepted',channel:'authorized',trackingLink:'verified',disclosure:'ready'}))c.advertisers.booking.evidence[gate]={status,observedAt:at};
 assert.ok(discover(q,c,now).items[0].action);
 c.advertisers.booking.evidence.advertiser.status='pending';assert.equal(discover(q,c,now).items[0].action,null);
 assert.equal(discover({...q,guests:3},c,now).items.length,0);
});
test('configured catalog is loaded server-side and failures do not leak paths',()=>{
 const dir=mkdtempSync(join(tmpdir(),'discovery-'));try{
 const file=join(dir,'catalog.json');writeFileSync(file,JSON.stringify({allowedHosts:[],records:[]}));
 const request={method:'POST',path:'/api/public/discovery/search',body:query};
 assert.equal(route(request,{DISCOVERY_CATALOG_FILE:file}).body.status,'SOURCE_REQUIRED');
 writeFileSync(file,'not json');const failed=route(request,{DISCOVERY_CATALOG_FILE:file});assert.equal(failed.status,503);assert.doesNotMatch(JSON.stringify(failed),new RegExp(dir));
 }finally{rmSync(dir,{recursive:true,force:true})}
});
