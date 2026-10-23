import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {normalizeHouseNumber,normalizeAddress,addressKey,searchProperties,
  initialPropertyStatus,allowedPropertyStatusTransition,statusLabels,europeCountryCodes} from '../packages/real-estate/property.mjs';
import {PoleStore} from '../services/api/pole-store.mjs';

test('simple suffix variants canonicalize but complex national house numbers remain distinct',()=>{
  for(const item of ['12A','12 A','12-A','12/A'])assert.equal(normalizeHouseNumber(item),'12/A');
  assert.equal(normalizeHouseNumber('8 bis'),'8 BIS');
  assert.equal(normalizeHouseNumber('12/1'),'12/1');
  assert.equal(normalizeHouseNumber('12-14'),'12-14');
  assert.equal(normalizeHouseNumber('12 Stg 2'),'12 STG 2');
  assert.notEqual(normalizeHouseNumber('12/1'),normalizeHouseNumber('12A'));
  assert.notEqual(normalizeHouseNumber('12-14'),normalizeHouseNumber('12/A'));
  assert.equal(normalizeHouseNumber(' 3 c '),'3/C');
});
test('country separation, postal spacing and null coordinates avoid false civic matches',()=>{
  const records=[
    {id:'de',country:'DE',city:'Berlin',street:'Musterstraße',number:'12 a',postalCode:'10115',status:'sale'},
    {id:'it',country:'IT',city:'Trieste',street:'Via Esempio',number:'12/A',postalCode:'34100',status:'rent'},
    {id:'fr',country:'FR',city:'Paris',street:'Rue Exemple',number:'8 bis',postalCode:'75001',status:'sold'},
    {id:'gb',country:'GB',city:'London',street:'Example Road',number:'12/1',postalCode:'SW1A 1AA',status:'rented'},
    {id:'range',country:'ES',city:'Madrid',street:'Calle Ejemplo',number:'12-14',postalCode:'28001',status:'reserved'}
  ];
  assert.equal(searchProperties(records,{country:'DE',number:'12A'}).matches[0].id,'de');
  assert.equal(searchProperties(records,{country:'GB',postalCode:'SW1A1AA',status:'rented'}).count,1);
  assert.equal(searchProperties(records,{country:'IT',number:'12A',status:'sale'}).count,0);
  assert.equal(searchProperties(records,{country:'FR',number:'8 bis'}).count,1);
  assert.equal(searchProperties(records,{country:'ES',number:'12/14'}).count,0);
  assert.equal(searchProperties(records,{country:'ES',number:'12-14'}).count,1);
  const empty=normalizeAddress({lat:null,lng:''});
  assert.equal(Object.hasOwn(empty,'lat'),false);
  assert.equal(Object.hasOwn(empty,'lng'),false);
  assert.notEqual(addressKey(records[0]),addressKey({...records[0],country:'IT'}));
  assert.equal(searchProperties(records,{country:'DE'}).registryCoverageVerified,false);
  assert.equal(searchProperties(records,{country:'DE'}).countryCoverage,'USER_SUPPLIED_RECORDS_ONLY');
});
test('sale/rental statuses enforce purpose and terminal owner-declared states',()=>{
  assert.equal(initialPropertyStatus('Vendita'),'sale');
  assert.equal(initialPropertyStatus('Locazione'),'rent');
  assert.equal(allowedPropertyStatusTransition('Vendita','sale','sold'),true);
  assert.equal(allowedPropertyStatusTransition('Locazione','rent','rented'),true);
  assert.equal(allowedPropertyStatusTransition('Vendita','sale','rented'),false);
  assert.equal(allowedPropertyStatusTransition('Locazione','rented','rent'),false);
  assert.equal(allowedPropertyStatusTransition('Vendita','reserved','sale'),true);
  assert.equal(statusLabels.sold,'Venduto (dichiarato)');
  assert.ok(europeCountryCodes.includes('GB'));
  assert.ok(europeCountryCodes.includes('IT'));
});
test('staging owner updates European civic and status with owner declaration, no financial proof',()=>{
  const db=new PoleStore();
  const now=Date.parse('2026-10-23T10:00:00Z');
  const owner={id:'ownerA',role:'owner',ownerVerified:true};
  const visitor={id:'visitorA',role:'visitor'};
  const d=db.execute('dossier.create',owner,{title:'Test',description:'Sintetico',purpose:'Vendita',publishedAt:new Date(now).toISOString()},now);
  const stored=db.execute('listing.update',owner,{dossierId:d.id,address:{country:'DE',city:'Berlin',street:'Musterstraße',number:'12a',postalCode:'10115'},status:'reserved'},now);
  assert.equal(stored.status,'reserved');
  assert.equal(stored.address.number,'12/A');
  assert.equal(stored.transactionVerified,false);
  assert.throws(()=>db.execute('listing.update',visitor,{dossierId:d.id,status:'sold'},now),/FORBIDDEN/);
  assert.throws(()=>db.execute('listing.update',owner,{dossierId:d.id,status:'rented',ownerDeclaration:true},now),/INVALID_PROPERTY_TRANSITION/);
  assert.throws(()=>db.execute('listing.update',owner,{dossierId:d.id,status:'sold'},now),/OWNER_DECLARATION_REQUIRED/);
  const sold=db.execute('listing.update',owner,{dossierId:d.id,status:'sold',ownerDeclaration:true},now);
  assert.equal(sold.status,'sold');
  assert.throws(()=>db.execute('listing.update',owner,{dossierId:d.id,status:'sale'},now),/INVALID_PROPERTY_TRANSITION/);
  assert.equal(db.execute('dossier.read',visitor,{dossierId:d.id},now).listingStatus,'sold');
  assert.throws(()=>db.execute('slot.create',owner,{dossierId:d.id,start:new Date(now+86400000).toISOString(),minutes:30,feeCents:0,terms:'Test'},now),/LISTING_NOT_OPEN/);
  db.close();
});
test('Web/Capacitor EU catalogue pages have identical, syntactically valid script and local-only claims',()=>{
  const web=readFileSync(new URL('../apps/web/europe-immobili.html',import.meta.url),'utf8');
  const mobile=readFileSync(new URL('../apps/mobile/www/europe-immobili.html',import.meta.url),'utf8');
  assert.equal(web,mobile);
  const script=web.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new Script(script));
  for(const status of ['sale','sold','rent','rented','reserved'])assert.match(web,new RegExp(status));
  assert.match(web,/Demo con immobili e indirizzi inventati/);
  for(const path of ['apps/web/index.html','apps/mobile/www/index.html','apps/web/pole-position.html','apps/mobile/www/pole-position.html']){
    assert.match(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/europe-immobili\.html/);
  }
});
