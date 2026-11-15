import {isSevaToolAvailable} from '../src/functional-status.js';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {Script} from 'node:vm';

// Runs against the compiled application. It never opens providers, signs in,
// reads real accounts, or invokes transactions. Used before each publication.
const origin='https://seva.karimkatlane0.chatgpt.site';
const decode=value=>value.replaceAll('&amp;','&').replaceAll('&#39;',"'");
const responses=new Map();let linksChecked=0,anchorsChecked=0,scriptsChecked=0;
async function read(path){
 if(!responses.has(path)){
  const response=await worker.fetch(new Request(origin+path));
  const html=await response.text();
  if((response.headers.get('Content-Type')||'').includes('text/html'))for(const [tag,attributes,script] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
   if(/type=["']application\/(?:ld\+)?json["']/i.test(attributes))continue;
   assert.doesNotThrow(()=>new Script(script||''),path+' has a broken interaction script');scriptsChecked++;
  }
  responses.set(path,{status:response.status,type:response.headers.get('Content-Type')||'',body:html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')});
 }
 return responses.get(path);
}
const sitemap=(await read('/sitemap.xml')).body;
const pages=[...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([,href])=>{const url=new URL(decode(href));return url.pathname+url.search;}))];
pages.push('/start','/start?lang=en','/start?path=business','/start?path=research','/start?path=data');
pages.push('/kkubera/1','/kkubera/3','/kkubera/confronto','/titans/operazioni');
pages.push('/studio/diritti','/studio/trattative','/galleria','/titans/manifesto');
pages.push('/gmas','/cerca','/cerca?lang=en','/cerca?q=AURA');
pages.push('/bisogni');
pages.push('/premium','/premium?lang=en','/europa','/europa?lang=en');
pages.push('/superapp','/matching','/engage','/aggiornamenti','/aggiornamenti?lang=en','/tavoli','/kkubera/2','/kkubera/visite','/mobile','/kkubera/immobili','/kkubera','/kkubera?lang=en','/migrazione','/migrazione?lang=en','/titans','/titans?lang=en','/titans/calcolo-cac.html','/titans/pianificatore.html','/creator-commissions','/automation','/automation?lang=en','/senses','/senses?lang=en','/decisioni','/decisioni?lang=en','/arena','/arena?lang=en','/databaseunitary','/databaseunitary?lang=en','/infrastructure','/infrastructure?lang=en');
pages.push('/funzionalita','/integrazioni','/integrazioni?lang=en');
for(const path of pages.filter(isSevaToolAvailable)){
 const page=await read(path);assert.equal(page.status,200,path);
 for(const [,value] of page.body.matchAll(/\bhref="([^"]+)"/g)){
  const url=new URL(decode(value),origin+path);
  if(url.origin!==origin||/^\/(?:signin|signout)-with-chatgpt$/.test(url.pathname))continue;
  const target=await read(url.pathname+url.search);linksChecked++;
  assert([200,302,308].includes(target.status),path+' → '+url.pathname+' returned '+target.status);
  if(url.hash&&target.status===200&&target.type.includes('text/html')){
   const ids=new Set([...target.body.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>id));
   assert(ids.has(decodeURIComponent(url.hash.slice(1))),path+' → missing anchor '+url.pathname+url.hash);anchorsChecked++;
  }
 }
}
console.log(JSON.stringify({pages:pages.length,linksChecked,anchorsChecked,scriptsChecked,failed:0,externalProvidersChecked:false,personalAccountsRead:false}));
