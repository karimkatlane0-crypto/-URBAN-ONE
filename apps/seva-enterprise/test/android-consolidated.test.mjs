import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../../seva-android/app/src/main/assets/seva-offline.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if(!js)throw Error('SEVA bundled logic missing');
function makeApp(allow=true){
 const nodes=new Map(),store=new Map(),whats=[];
 const node=()=>({value:'',checked:false,hidden:true,children:[],events:{},style:{},appendChild(x){this.children.push(x)},replaceChildren(){this.children=[]},addEventListener(k,v){this.events[k]=v},focus(){}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
 const natives={exportJson:()=>{},exportIntentJson:x=>whats.push({type:'export',json:JSON.parse(x)}),openWhatsApp:x=>whats.push({type:'whatsapp',message:x})};
 const context={document:{getElementById:get,createElement:node},window:{SevaAndroid:natives},
   localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
   confirm:()=>allow,Date,Number,JSON,Math,Set,Map};
 vm.runInNewContext(js,context);
 return {get,store,whats};
}
test('SEVA 2.5 Android contains local KPI, Lastre, Flywheel and volunteer WhatsApp controls',()=>{
 for(const id of ['kpi-completion','intent-list','intent-consent','fly-output','whatsapp-open'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/MODALITÀ LOCALE DISPONIBILE/);
});
test('SEVA 2.5 CRM requires explicit opt-in and stores only own local intention',()=>{
 const a=makeApp();
 a.get('intent-description').value='Affitto di tre mesi';
 a.get('intent-budget').value='500';
 a.get('intent-category').value='rent';
 a.get('intent-save').events.click();
 assert.equal(a.store.has('seva-local-intents-v25'),false);
 a.get('intent-consent').checked=true;
 a.get('intent-save').events.click();
 const x=JSON.parse(a.store.get('seva-local-intents-v25'));
 assert.equal(x.intents.length,1);
 assert.equal(x.intents[0].category,'rent');
 assert.equal(x.intents[0].budgetCents,50000);
 assert.equal(a.get('kpi-intents').textContent,1);
});
test('SEVA 2.5 marketing preview is not cashback or a payment',()=>{
 const a=makeApp();
 a.get('fly-purchase').value='100';
 a.get('fly-budget').value='100';
 a.get('fly-calc').events.click();
 assert.match(a.get('fly-output').textContent,/POTENZIALE/);
 assert.match(a.get('fly-output').textContent,/€0/);
 a.get('fly-agreement').checked=true;
 a.get('fly-calc').events.click();
 assert.match(a.get('fly-output').textContent,/Costo netto IPOTETICO/);
 assert.match(a.get('fly-output').textContent,/Nessun pagamento avviato/);
});
test('SEVA 2.5 manual WhatsApp share requires explicit user tap and confirmation',()=>{
 const a=makeApp();
 assert.equal(a.whats.length,0);
 a.get('share-text').value='Informazioni su un servizio';
 a.get('whatsapp-open').events.click();
 assert.equal(a.whats.length,1);
 assert.equal(a.whats[0].type,'whatsapp');
 assert.equal(a.whats[0].message,'Informazioni su un servizio');
 const b=makeApp(false);
 b.get('share-text').value='Non inviare';
 b.get('whatsapp-open').events.click();
 assert.equal(b.whats.length,0);
});
test('SEVA 2.5 native source grants only user-initiated WhatsApp and no Internet permission',()=>{
 const manifest=readFileSync(new URL('../../seva-android/app/src/main/AndroidManifest.xml',import.meta.url),'utf8');
 const activity=readFileSync(new URL('../../seva-android/app/src/main/java/ai/seva/enterprise/MainActivity.java',import.meta.url),'utf8');
 assert.doesNotMatch(manifest,/android.permission.INTERNET/);
 assert.match(activity,/void openWhatsApp/);
 assert.match(activity,/Intent.ACTION_VIEW/);
 assert.match(activity,/void exportIntentJson/);
});
