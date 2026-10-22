import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

for(const path of ['apps/web/index.html','apps/mobile/www/index.html'])test(path+' integration check works without modern DOM or AbortSignal APIs',async()=>{
  const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id)){
      let text='';
      elements.set(id,{value:({bnbFee:'1000',bnbNights:'4.2',bnbPayout:'120',country:'IT',euPreset:'real_estate'})[id]||'',children:[],
        get textContent(){return text},set textContent(v){text=v;this.children=[]},
        addEventListener(name,fn){this[name]=fn},appendChild(child){this.children.push(child)}});
    }
    return elements.get(id);
  };
  const context={document:{getElementById:get,createElement:()=>({})},location:{hash:'',protocol:'https:'},window:{addEventListener(){},open(){}},Intl,URL,setTimeout,clearTimeout,
    fetch:async()=>({ok:true,json:async()=>({version:'7.0.0',liveProvidersVerified:false,items:[{label:'OpenAI',state:'configuration_required'}]})})};
  vm.runInNewContext(script,context);
  await get('checkIntegrations').click();
  assert.match(get('integrationStatus').textContent,/Server raggiungibile/);
  assert.equal(get('integrationItems').children.length,1);
  context.fetch=async()=>{throw Error('offline')};
  await get('checkIntegrations').click();
  assert.match(get('integrationStatus').textContent,/non disponibile/);
  assert.equal(get('integrationItems').children.length,0);
  assert.equal(get('checkIntegrations').disabled,false);
  assert.match(get('bnbPool').textContent,/720/);
});
