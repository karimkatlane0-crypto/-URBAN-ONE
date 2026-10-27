// SEVA PSDM — deterministic, client-side decision support. No AI/API/payment calls.
// Scores are supplied by the person using the tool, not independently verified.
const fail=(message)=>{throw new Error(message);};
const label=(v,max=100,multiline=false)=>{const s=typeof v==='string'?v.trim():'';if(!s||s.length>max||(/[\u0000-\u001f\u007f]/.test(s)&&!multiline)||(/[\u0000-\u0009\u000b-\u001f\u007f]/.test(s)))fail('Testo mancante o non valido');return s;};
const number=(v,min,max)=>{if(!(['number','string'].includes(typeof v))||(typeof v==='string'&&!/^[0-9]+$/.test(v.trim())))fail('Punteggio mancante o non valido');const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)fail('Punteggio o peso fuori intervallo');return n;};
export function rankDecisions(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('Richiesta non valida');
 const problem=label(input.problem,500,true);
 if(problem.length<8)fail('Descrivi il problema con almeno 8 caratteri');
 if(!Array.isArray(input.criteria)||input.criteria.length<2||input.criteria.length>6)fail('Servono da 2 a 6 criteri');
 if(!Array.isArray(input.options)||input.options.length<2||input.options.length>5)fail('Servono da 2 a 5 alternative');
 const criteria=input.criteria.map(c=>({name:label(c?.name,70),weight:number(c?.weight,1,5)}));
 const unique=(arr)=>new Set(arr.map(x=>x.toLocaleLowerCase('it'))).size===arr.length;
 if(!unique(criteria.map(c=>c.name)))fail('I criteri devono essere distinti');
 const maxPoints=criteria.reduce((a,c)=>a+c.weight*5,0);
 const options=input.options.map((o,i)=>{
  const name=label(o?.name,100);
  if(!Array.isArray(o?.scores)||o.scores.length!==criteria.length)fail('Tutti i criteri richiedono un punteggio');
  const scores=o.scores.map(s=>number(s,0,5));
  const evidence=typeof o.evidence==='string'?o.evidence.trim():'';
  if(evidence.length>500)fail('Evidenze troppo lunghe');
  const weightedPoints=scores.reduce((sum,s,j)=>sum+s*criteria[j].weight,0);
  return {name,scores,evidence,weightedPoints,score:Math.round(weightedPoints/maxPoints*100),evidenceMissing:!evidence,index:i};
 });
 if(!unique(options.map(o=>o.name)))fail('Le alternative devono avere nomi distinti');
 const ranking=options.slice().sort((a,b)=>b.weightedPoints-a.weightedPoints||a.index-b.index);
 const tied=ranking.length>1&&ranking[0].weightedPoints===ranking[1].weightedPoints;
 return {
  problem,criteria,ranking,
  leader:tied?null:ranking[0].name,
  tied,
  allEvidencePresent:ranking.every(o=>!o.evidenceMissing),
  status:'SIMULAZIONE_NON_VERIFICATA',
  paymentExecuted:false,externalActionExecuted:false,
  disclaimer:'Confronto basato esclusivamente sui tuoi pesi e punteggi. Non dimostra fatti, ricavi, autorizzazioni o risultati e non prende decisioni per te.'
 };
}
