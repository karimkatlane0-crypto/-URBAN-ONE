import test from 'node:test';
import assert from 'node:assert/strict';
import {rankDecisions} from '../public/psdm-engine.js';
const sample={
 problem:'Scegliere una soluzione tecnologica con rischi contenuti',
 criteria:[{name:'Fattibilità',weight:5},{name:'Beneficio',weight:3}],
 options:[
  {name:'A',scores:[5,3],evidence:'Test sintetico A'},
  {name:'B',scores:[3,5],evidence:'Test sintetico B'}
 ]
};
test('PSDM: transparent weighted scoring and no actions/payments',()=>{
 const r=rankDecisions(sample);
 assert.equal(r.ranking[0].name,'A');
 assert.equal(r.ranking[0].score,85);
 assert.equal(r.ranking[1].score,75);
 assert.equal(r.status,'SIMULAZIONE_NON_VERIFICATA');
 assert.equal(r.paymentExecuted,false);
 assert.equal(r.externalActionExecuted,false);
});
test('PSDM: exact tie requires decision by human',()=>{
 const r=rankDecisions({...sample,options:[sample.options[0],{...sample.options[1],scores:[5,3]}]});
 assert.equal(r.tied,true);assert.equal(r.leader,null);
});
test('PSDM: missing evidence is disclosed, not silently verified',()=>{
 const r=rankDecisions({...sample,options:[sample.options[0],{...sample.options[1],evidence:''}]});
 assert.equal(r.allEvidencePresent,false);assert.equal(r.ranking.some(x=>x.evidenceMissing),true);
});
test('PSDM: invalid scores, duplicate labels and missing problem fail closed',()=>{
 const bad=[
  {...sample,problem:'short'},
  {...sample,options:[sample.options[0],{...sample.options[1],name:'a'}]},
  {...sample,options:[sample.options[0],{...sample.options[1],scores:[3,6]}]},
  {...sample,options:[sample.options[0],{...sample.options[1],scores:[3,'']}]},
  {...sample,criteria:[sample.criteria[0],{...sample.criteria[1],name:'FATTIBILITÀ'}]},
  {...sample,criteria:[]},
  {...sample,options:[sample.options[0]]},
 ];
 for(const value of bad)assert.throws(()=>rankDecisions(value));
});
