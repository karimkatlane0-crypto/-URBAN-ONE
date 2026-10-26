import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCommercialDraft,professionalDraftRequest,produceDraft} from '../communications.mjs';
const valid={channel:'whatsapp',purpose:'customer_support',subject:'Supporto prenotazione',
 context:'Rispondere alle domande sulla disponibilità; dati su prezzi e disponibilità non forniti',language:'it'};
test('communications: requires supported channel, topic and factual input',()=>{
 assert.equal(validateCommercialDraft(valid).channel,'whatsapp');
 assert.throws(()=>validateCommercialDraft({...valid,channel:'sms'}),/Unsupported/);
 assert.throws(()=>validateCommercialDraft({...valid,subject:''}),/topic/);
 assert.throws(()=>validateCommercialDraft({...valid,context:'A'.repeat(901)}),/limit/);
});
test('communications: marketing messages require recipient permission explicitly',()=>{
 assert.throws(()=>validateCommercialDraft({...valid,purpose:'offer'}),e=>e.status===403);
 assert.equal(validateCommercialDraft({...valid,purpose:'offer',recipientPermissionConfirmed:true}).purpose,'offer');
 assert.throws(()=>validateCommercialDraft({...valid,purpose:'offer',recipientPermissionConfirmed:'true'}),e=>e.status===403);
});
test('communications: instruction prohibits invented prices and makes no sending claim',()=>{
 const r=professionalDraftRequest(valid);
 assert.match(r.instructions,/Never invent prices/);
 assert.match(r.instructions,/Do not claim that any external communication has been delivered/);
 assert.doesNotMatch(r.input,/example@/);
});
test('communications: no OpenAI credential fails closed without network call',async()=>{
 await assert.rejects(()=>produceDraft(valid,{apiKey:''}),e=>e.status===503);
});
test('communications: mocked OpenAI provider returns DRAFT only, no external side effects',async()=>{
 let calls=0;const fake=async(url,opts)=>{
  calls++;assert.match(url,/responses$/);const req=JSON.parse(opts.body);
  assert.equal(req.store,false);
  assert.equal(req.model,'test-model');
  return {ok:true,json:async()=>({id:'resp_synthetic_1',model:'test-model',output_text:'Buongiorno, grazie per la richiesta.'})};
 };
 const r=await produceDraft(valid,{apiKey:'synthetic-test-key',model:'test-model',fetchImpl:fake});
 assert.equal(calls,1);assert.equal(r.sent,false);assert.equal(r.externalDelivery,false);
 assert.equal(r.approved,false);assert.equal(r.reviewed,false);
 assert.equal(r.draft,'Buongiorno, grazie per la richiesta.');
});
test('communications: provider errors never become fabricated drafts',async()=>{
 const fail=async()=>({ok:false,json:async()=>({error:{message:'provider unavailable'}})});
 await assert.rejects(()=>produceDraft(valid,{apiKey:'synthetic-test-key',fetchImpl:fail}),e=>e.status===502);
});
