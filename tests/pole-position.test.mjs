import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../apps/web/pole-position.js';
const {windowState,addSlot,requestVisit,transition}=globalThis.PolePosition;
const now=Date.parse('2026-10-23T08:00:00Z');
const input={start:'2026-10-24T10:00:00+02:00',minutes:30,feeCents:1500,terms:'Accompagnamento 30 minuti. Annullamento gratuito prima della visita.'};
test('24-hour window is scheduled before start and ends exactly at 24 hours',()=>{
 const start='2026-10-23T08:00:00Z';
 assert.equal(windowState(start,now-1).state,'SCHEDULED');
 assert.equal(windowState(start,now).state,'EARLY_24H');
 assert.equal(windowState(start,now+86400000-1).state,'EARLY_24H');
 assert.equal(windowState(start,now+86400000).state,'GENERAL');
 assert.throws(()=>windowState('invalid',now));
});
test('slot validation rejects overlapping or expired slots, malformed fees and missing terms',()=>{
 const slots=addSlot([],input,now);
 assert.equal(slots[0].start,'2026-10-24T08:00:00.000Z');
 assert.throws(()=>addSlot(slots,{...input,start:'2026-10-24T08:15:00Z'},now),/sovrappone/);
 assert.equal(addSlot(slots,{...input,start:slots[0].end},now).length,2);
 for(const bad of [{start:'2026-10-22T08:00Z'},{feeCents:-1},{feeCents:1.5},{feeCents:NaN},{terms:''},{minutes:0}])assert.throws(()=>addSlot([],{...input,...bad},now));
});
test('request snapshots terms and never equates a simulated visit to payment',()=>{
 const slot=addSlot([],input,now)[0];
 const requests=requestVisit([],slot,now);
 assert.throws(()=>requestVisit(requests,slot,now),/già richiesto/);
 assert.throws(()=>requestVisit([],slot,Date.parse(slot.start)),/scaduto/);
 slot.terms='changed';assert.equal(requests[0].terms,input.terms);
 assert.throws(()=>transition(requests[0],'COMPLETED'),/non consentito/);
 let r=transition(requests[0],'CONFIRMED');r=transition(r,'CHECKED_IN');r=transition(r,'COMPLETED');
 assert.equal(r.paymentStatus,'NOT_PROCESSED');assert.equal(r.realBooking,false);
 assert.throws(()=>transition(r,'CONFIRMED'),/non consentito/);
 const cancelled=transition(requests[0],'CANCELLED');
 assert.equal(requestVisit([cancelled],slot,now).length,2);
});
test('Web and local-first mobile ship identical preview assets',()=>{
 for(const name of ['pole-position.js','pole-position.html'])assert.equal(readFileSync(new URL('../apps/web/'+name,import.meta.url),'utf8'),readFileSync(new URL('../apps/mobile/www/'+name,import.meta.url),'utf8'));
});
