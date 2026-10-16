import test from 'node:test';
import assert from 'node:assert/strict';
import {certificateFingerprint,prepareContactImport} from '../packages/contacts/contact.mjs';
import {normalizeHouseNumber,searchProperties} from '../packages/real-estate/property.mjs';
import {route} from '../services/api/router.mjs';

test('contact import keeps names but replaces raw certificate id with fingerprint',()=>{
  const out=prepareContactImport([{id:'1',name:'Anna',surname:'Rossi',phoneNumber:'+393331234567',email:'ANNA@example.com',certificateId:'CERT-123'}]);
  assert.equal(out.acceptedCount,1);
  assert.equal(out.accepted[0].givenName,'Anna');
  assert.equal(out.accepted[0].familyName,'Rossi');
  assert.equal(out.accepted[0].email,'anna@example.com');
  assert.equal(out.accepted[0].certificateIdHash,certificateFingerprint('CERT-123'));
  assert.equal(Object.hasOwn(out.accepted[0],'certificateId'),false);
  assert.equal(out.consentInferred,false);
});

test('contact import detects duplicates and invalid recipients',()=>{
  const out=prepareContactImport([
    {id:'7',phoneNumber:'+393331234567'},
    {id:'7',phoneNumber:'+393339999999'},
    {name:'No Recapito'}
  ]);
  assert.equal(out.acceptedCount,1);
  assert.equal(out.duplicateCount,1);
  assert.equal(out.rejectedCount,1);
});

test('house number canonicalization treats 12A and 12/A as the same civic',()=>{
  assert.equal(normalizeHouseNumber('12 a'),'12/A');
  assert.equal(normalizeHouseNumber('12-A'),'12/A');
});

test('property search is accent-insensitive but exact on civic number',()=>{
  const records=[
    {id:'a',country:'IT',city:'Trieste',street:'Via San Nicolò',number:'12A',postalCode:'34121',status:'sale'},
    {id:'b',country:'IT',city:'Trieste',street:'Via San Nicolo',number:'12/B',postalCode:'34121',status:'sale'}
  ];
  const out=searchProperties(records,{country:'it',city:'TRIESTE',street:'Via San Nicolo',number:'12/a',postalCode:'34121'});
  assert.equal(out.count,1);
  assert.equal(out.matches[0].id,'a');
  assert.equal(out.exactHouseNumber,true);
  assert.match(out.mapQuery,/Via San Nicolo/i);
});

test('private endpoints fail closed without auth scopes',()=>{
  assert.equal(route({method:'POST',path:'/api/contacts/import-preview',body:{records:[]}}).status,403);
  assert.equal(route({method:'POST',path:'/api/properties/search',body:{records:[],query:{}}}).status,403);
});

test('private endpoints work with owner scopes',()=>{
  const auth={userId:'owner-1',scopes:['contacts:read','properties:read']};
  const contacts=route({method:'POST',path:'/api/contacts/import-preview',auth,body:{records:[{email:'x@example.com'}]}});
  assert.equal(contacts.status,200);
  assert.equal(contacts.body.acceptedCount,1);
  const properties=route({method:'POST',path:'/api/properties/search',auth,body:{records:[{id:'x',country:'IT',city:'Trieste',street:'Via Roma',number:'1'}],query:{country:'IT',city:'Trieste',street:'Via Roma',number:'1'}}});
  assert.equal(properties.status,200);
  assert.equal(properties.body.count,1);
});
