// URBAN ONE / Pole Position - offline decision support, NOT legal advice,
// an autonomous LLM, a certified valuation, or a live paid entitlement.
export const workflowTypes=Object.freeze(['listing_sale','rental','succession','judicial_auction']);
export const modelRegistry=Object.freeze({
  syntheticRanking:{kind:'trained_linear_ml',training:'SYNTHETIC_ONLY',version:'v0.1',productionValidated:false},
  deepLearning:{kind:'provider_adapter',state:'NOT_CONNECTED',humanApprovalRequired:true},
  llm:{kind:'provider_adapter',state:'NOT_CONNECTED',humanApprovalRequired:true},
  deepMind:{kind:'third_party_brand',state:'NOT_A_PARTNER_OR_INTEGRATION'}
});
export const premiumFeatures=Object.freeze(['verified_civic_walk_alerts','private_listing_advisory','owner_document_review','premium_listing_workflows']);
const legalSteps={
  listing_sale:['Identificare Paese e autorità competente','Accertare titolarità e poteri di chi pubblica','Verificare catasto, urbanistica, ipoteche e vincoli presso fonti competenti','Far verificare condizioni di vendita, caparre e mediazione da professionista abilitato','Approvazione umana prima di invio, firma o pubblicazione'],
  rental:['Identificare Paese e disciplina locale di locazione','Verificare titolarità, destinazione d’uso e requisiti del locatore','Verificare canone, durata, deposito e obblighi informativi e fiscali locali','Far validare il testo del contratto e la registrazione ove necessaria','Acquisire consenso separato prima della firma'],
  succession:['Determinare collegamenti transfrontalieri, residenza abituale, nazionalità e autorità competente','Verificare se il Regolamento (UE) 650/2012 si applica (Irlanda e Danimarca non partecipano)','Valutare con notaio/legale il Certificato Successorio Europeo e la documentazione richiesta','Verificare separatamente titoli immobiliari, imposte e adempimenti nazionali','Non attribuire eredi, quote, validità testamentaria o proprietà senza controllo umano'],
  judicial_auction:['Identificare il portale e l’autorità giudiziaria ufficiali per lo Stato interessato','Convalidare avviso e numero procedura dalla fonte primaria','Far esaminare perizia, vincoli, gravami, occupazione e condizioni della vendita','Verificare requisiti di partecipazione, cauzione, scadenze e regole locali','Nessuna offerta, cauzione, pagamento o rappresentanza senza mandato e autorizzazione puntuale']
};
const agentNames=Object.freeze(['Civic Data Steward','Listing Operations','LEX Legal Review','Auction & Succession Triage','ML Evaluation','Payments & Consent','Privacy & Safety','Human Approval']);
export function planAdvisoryWorkflow({type,country,purpose='informational'}={}){
  if(!workflowTypes.includes(type))throw new Error('UNSUPPORTED_WORKFLOW');
  if(typeof country!=='string'||!/^[A-Z]{2}$/.test(country.toUpperCase()))throw new Error('COUNTRY_REQUIRED');
  const approved=country.toUpperCase();
  return {
    type,country:approved,purpose,mode:'REVIEW_PREPARATION_ONLY',documentStatus:'NOT_LEGALLY_BINDING',
    steps:legalSteps[type].slice(),roles:agentNames.slice(),aiProviderVerified:false,
    executor:'HUMAN_PROFESSIONAL_REVIEW_REQUIRED',
    actions:{draft:true,sign:false,bid:false,file:false,makePayment:false,send:false},
    noAutomaticDelegation:true
  };
}
export function previewDossierMemo({type,country,propertyReference}={}){
  const plan=planAdvisoryWorkflow({type,country});
  if(typeof propertyReference!=='string'||propertyReference.length>120)throw new Error('INVALID_REFERENCE');
  const safeRef=propertyReference.replace(/[\r\n\t]/g,' ').trim()||'[riferimento interno]';
  return [
    'BOZZA ISTRUTTORIA NON VINCOLANTE — NON È UN CONTRATTO',
    'Tipo: '+plan.type+' | Paese: '+plan.country+' | Riferimento: '+safeRef,
    'Non contiene nomi, dati bancari, prezzi concordati, clausole nazionali, dichiarazioni di titolarità o firme.',
    'Verifiche per un professionista competente:',
    ...plan.steps.map((s,i)=>(i+1)+'. '+s),
    'Nessun atto firmato, deposito, iscrizione ad asta, vendita o locazione è generato.'
  ].join('\n');
}
export function featureDecision({feature,platform,entitlement,providerApproved=false}={}){
  if(!premiumFeatures.includes(feature))return {enabled:false,reason:'UNKNOWN_FEATURE'};
  if(!['web','ios','android'].includes(platform))return {enabled:false,reason:'PLATFORM_REQUIRED'};
  if(!providerApproved)return {enabled:false,reason:'PROVIDER_AND_COMPLIANCE_GATE'};
  if(entitlement?.verified!==true||entitlement?.feature!==feature||entitlement?.source==='client_flag')
    return {enabled:false,reason:'SERVER_ENTITLEMENT_REQUIRED'};
  if(['ios','android'].includes(platform)&&entitlement?.storePolicyApproved!==true)
    return {enabled:false,reason:'APP_STORE_BILLING_POLICY_REQUIRED'};
  return {enabled:true,reason:'VERIFIED_BY_CALLER_BACKEND_REQUIRED'};
}
function sigmoid(x){return 1/(1+Math.exp(-Math.max(-30,Math.min(30,x))));}
function features(x){
  if(!x||typeof x!=='object')throw new Error('INVALID_FEATURES');
  const a=['budgetMatch','civicMatch','purposeMatch','sourceTrust'].map(k=>{
    if(typeof x[k]!=='number'||!Number.isFinite(x[k])||x[k]<0||x[k]>1)throw new Error('INVALID_FEATURE_'+k);
    return x[k];
  });
  return a;
}
// Real gradient-descent training, but intentionally only on a small synthetic training set.
export function trainSyntheticRanker(samples,{epochs=200,rate=.3}={}){
  if(!Array.isArray(samples)||samples.length<4||samples.length>200||!Number.isInteger(epochs)||epochs<1||epochs>500||
    typeof rate!=='number'||rate<=0||rate>1)throw new Error('INVALID_SYNTHETIC_TRAINING');
  const weights=[0,0,0,0],offset={value:0};
  for(const record of samples){
    if(record.origin!=='synthetic'||![0,1].includes(record.label))throw new Error('REAL_DATA_TRAINING_BLOCKED');
    features(record.features);
  }
  for(let i=0;i<epochs;i++){
    const gradient=[0,0,0,0];let bias=0;
    for(const record of samples){
      const x=features(record.features);
      const p=sigmoid(offset.value+weights.reduce((sum,w,j)=>sum+w*x[j],0));
      const delta=p-record.label;
      bias+=delta;
      for(let j=0;j<4;j++)gradient[j]+=delta*x[j];
    }
    for(let j=0;j<4;j++)weights[j]-=rate*gradient[j]/samples.length;
    offset.value-=rate*bias/samples.length;
  }
  return Object.freeze({
    version:'synthetic-ranking-v0.1',productionValidated:false,trainingData:'SYNTHETIC_ONLY',
    weights:Object.freeze(weights),bias:offset.value
  });
}
export function scoreSyntheticMatch(model,record){
  if(model?.trainingData!=='SYNTHETIC_ONLY')throw new Error('MODEL_NOT_VERIFIED');
  const x=features(record);
  return {score:Number(sigmoid(model.bias+model.weights.reduce((s,w,i)=>s+w*x[i],0)).toFixed(4)),
    type:'RANKING_DEMO_ONLY',noLegalOrFinancialDecision:true,trainingData:'SYNTHETIC_ONLY'};
}
