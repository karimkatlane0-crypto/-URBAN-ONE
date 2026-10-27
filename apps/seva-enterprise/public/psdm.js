import {rankDecisions} from './psdm-engine.js';
const byId=(id)=>document.getElementById(id);
const state={options:[],criteria:[],result:null};
const text=(value)=>document.createTextNode(String(value));
const node=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.append(text(content));return el;};
function error(message=''){byId('error').textContent=message;}
function configure(){
 const problem=byId('problem').value.trim();
 if(problem.length<8||problem.length>500)throw Error('Descrivi il problema con almeno 8 caratteri');
 const names=byId('options').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(names.length<2||names.length>5||new Set(names.map(s=>s.toLocaleLowerCase('it'))).size!==names.length||names.some(n=>n.length>100))throw Error('Inserisci da 2 a 5 alternative distinte, una per riga');
 const criteria=[...document.querySelectorAll('[data-criterion]')].map(x=>({name:x.dataset.criterion,weight:Number(x.value)}));
 if(criteria.some(c=>!Number.isInteger(c.weight)||c.weight<1||c.weight>5))throw Error('Pesi validi: da 1 a 5');
 state.options=names;state.criteria=criteria;state.result=null;
 const matrix=byId('matrix');matrix.replaceChildren();
 for(let i=0;i<names.length;i++){
  const article=node('article','matrixItem');article.append(node('h3','',String(i+1)+'. '+names[i]));
  const grid=node('div','ratings');
  for(let j=0;j<criteria.length;j++){
   const label=node('label','',criteria[j].name+' (0–5)');
   const input=document.createElement('input');input.type='number';input.min='0';input.max='5';input.step='1';input.required=true;
   input.dataset.option=String(i);input.dataset.score=String(j);input.setAttribute('aria-label',names[i]+' — '+criteria[j].name);input.placeholder='0–5';
   label.append(input);grid.append(label);
  }
  article.append(grid);
  const l=node('label','','Evidenze o fonti (facoltative, massimo 500 caratteri)');
  const evidence=document.createElement('textarea');evidence.rows=2;evidence.maxLength=500;evidence.dataset.evidence=String(i);
  evidence.placeholder='Quali dati concreti sostengono questa valutazione?';
  l.append(evidence);article.append(l);matrix.append(article);
 }
 byId('matrixSection').hidden=false;byId('resultsSection').hidden=true;
 byId('matrixSection').scrollIntoView({behavior:'smooth',block:'start'});
}
function evaluate(){
 const scores=state.options.map(()=>Array(state.criteria.length).fill(null));
 for(const field of document.querySelectorAll('[data-score]'))scores[Number(field.dataset.option)][Number(field.dataset.score)]=field.value;
 const options=state.options.map((name,i)=>({
  name,scores:scores[i],evidence:document.querySelector('[data-evidence="'+i+'"]').value
 }));
 const result=rankDecisions({problem:byId('problem').value,criteria:state.criteria,options});
 state.result=result;
 const container=byId('results');container.replaceChildren();
 const table=node('table');const head=node('thead');const tr=node('tr');
 for(const col of ['Alternativa','Punteggio','Evidenze'])tr.append(node('th','',col));head.append(tr);table.append(head);
 const body=node('tbody');
 for(const item of result.ranking){
  const row=node('tr');row.append(node('td','',item.name));row.append(node('td','score',item.score+'/100'));
  row.append(node('td','small',item.evidenceMissing?'Da documentare':item.evidence));body.append(row);
 }
 table.append(body);container.append(table);
 const summary=result.tied?'Parità al primo posto: ulteriori informazioni necessarie.':'Prima alternativa per punteggio: '+result.leader+'.';
 const caution=result.allEvidencePresent?'Le fonti dichiarate non sono state verificate.':'Mancano evidenze per una o più alternative.';
 byId('resultStatus').textContent=summary+' '+caution;
 byId('resultsSection').hidden=false;byId('resultsSection').scrollIntoView({behavior:'smooth',block:'start'});
}
byId('prepare').addEventListener('click',()=>{try{error();configure();}catch(e){error(e.message);}});
byId('calculate').addEventListener('click',()=>{try{error();evaluate();}catch(e){error(e.message);}});
byId('reset').addEventListener('click',()=>{state.options=[];state.criteria=[];state.result=null;byId('matrixSection').hidden=true;byId('resultsSection').hidden=true;error();byId('problem').focus();});
byId('export').addEventListener('click',()=>{
 if(!state.result)return;
 const json=JSON.stringify({...state.result,exportedAt:new Date().toISOString()},null,2);
 const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
 const anchor=document.createElement('a');anchor.href=url;anchor.download='SEVA-PSDM-decisione.json';document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
