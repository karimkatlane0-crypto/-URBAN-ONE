import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../core.mjs';
import {validateIntent,validateVisionInput,analyzeLastre} from '../lastre.mjs';
test('Lastre CRM requires voluntary explicit consent',()=>{
 assert.throws(()=>validateIntent({category:'buy',description:'Bike',budgetCents:20000,consent:false}));
 assert.deepEqual(validateIntent({category:'buy',description:' Bike ',budgetCents:20000,consent:true}),{category:'buy',description:'Bike',budgetCents:20000});
});
test('Lastre CRM restricts budgets and categories',()=>{
 for(const category of ['gambling',''])assert.throws(()=>validateIntent({category,description:'Item',budgetCents:1,consent:true}));
 for(const budgetCents of [-1,2.3,Infinity])assert.throws(()=>validateIntent({category:'lease',description:'Car',budgetCents,consent:true}));
});
test('Lastre CRM stores owner-only drafts with no image bytes',()=>{
 const s=createStore(),a=s.register('lastre-a@example.com','VerySecurePassword-123'),b=s.register('lastre-b@example.com','VerySecurePassword-123');
 const id=s.createIntent(a.id,{category:'buy',description:'Notebook for study',budgetCents:70000,consent:true});
 assert.equal(s.listIntents(b.id).length,0);assert.equal(s.listIntents(a.id)[0].id,id);
 assert.equal(s.listIntents(a.id)[0].description,'Notebook for study');
 assert.equal(s.deleteIntent(b.id,id),false);
 assert.equal(s.deleteIntent(a.id,id),true);assert.equal(s.listIntents(a.id).length,0);s.db.close();
});
test('Lastre rejects image transfer without explicit AI consent',()=>{
 assert.throws(()=>validateVisionInput({consentToAI:false,imageDataUrl:'data:image/jpeg;base64,AA==',purpose:'Bike'}));
});
test('Lastre blocks invalid JPEG headers and malicious base64',()=>{
 for(const imageDataUrl of ['data:image/png;base64,AA==','data:image/jpeg;base64,YWJjZA==','data:image/jpeg;base64,AAAA*AAA'])
 assert.throws(()=>validateVisionInput({consentToAI:true,imageDataUrl,purpose:'Bike'}));
});
test('Lastre vision backend requires server key and never fakes success',async()=>{
 const b=Buffer.concat([Buffer.from([0xff,0xd8,0xff]),Buffer.alloc(20),Buffer.from([0xff,0xd9])]).toString('base64');
 const input={consentToAI:true,imageDataUrl:'data:image/jpeg;base64,'+b,purpose:'Buy desk'};
 await assert.rejects(()=>analyzeLastre(input,{}));
 const calls=[];
 const response=await analyzeLastre(input,{apiKey:'test-api-key',request:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({id:'resp_test',model:'mock',output_text:'Scrivania visibile; prezzo da verificare.'})}}});
 assert.equal(response.imageSaved,false);assert.equal(response.externalPurchaseExecuted,false);assert.equal(response.id,'resp_test');
 const payload=JSON.parse(calls[0].options.body);
 assert.equal(payload.store,false);assert.equal(payload.input[0].content[1].type,'input_image');
});
