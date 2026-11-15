import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {SEVA_SEO_ORIGIN,sevaPublicSEOEntries,sevaCanonicalURL,renderSevaSitemap,withSevaSEO,withSevaSEOHeaders} from '../src/seo.js';
import {renderSynapsyHomePage} from '../src/synapsy-home.js';
import {sevaSearchCatalog} from '../src/site-search.js';
import {sevaLanguageURL,renderSevaCommand} from '../src/experience.js';

const decode=value=>value.replace(/&amp;/g,'&');
const canonicals=html=>[...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/g)].map(match=>decode(match[1]));
const locs=xml=>[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>decode(match[1]));
const get=(path,method='GET')=>worker.fetch(new Request('https://untrusted-host.test'+path,{method}),{});

test('canonicals use the verified origin, supported content language and no personal query fields',()=>{
 assert.equal(sevaCanonicalURL('https://untrusted-host.test/europa?lang=en&email=PRIVATE&scope=SECRET#contact'),SEVA_SEO_ORIGIN+'/europa?lang=en');
 assert.equal(sevaCanonicalURL('/superapp?lang=en&returnTo=https://untrusted-host.test'),SEVA_SEO_ORIGIN+'/superapp?lang=en');
 assert.equal(sevaCanonicalURL('/europa?lang=fr'),SEVA_SEO_ORIGIN+'/europa');
 assert.equal(sevaCanonicalURL('/music?lang=en'),SEVA_SEO_ORIGIN+'/music');
 assert.equal(sevaCanonicalURL('/global?lang=fr'),SEVA_SEO_ORIGIN+'/studio?lang=fr');
 assert.equal(sevaCanonicalURL('/studio?lang=zh'),SEVA_SEO_ORIGIN+'/studio?lang=zh');
 for(const path of ['/account','/premium','/app','/api/account','/registration','/checkout/servizio-50','/not-a-page'])assert.equal(sevaCanonicalURL(path),null,path);
});

test('sitemap adds the public entry and Europe without publishing account or operational paths',()=>{
 const entries=sevaPublicSEOEntries(),urls=locs(renderSevaSitemap());
 assert.equal(urls.length,99);assert.equal(new Set(urls).size,urls.length);
 assert.deepEqual(urls,entries.map(entry=>entry.url));
 for(const path of ['/superapp','/europa','/kkubera/booking'])for(const suffix of ['','?lang=en'])assert(urls.includes(SEVA_SEO_ORIGIN+path+suffix));
 assert.equal(entries.filter(entry=>entry.path==='/studio').length,8);
 for(const url of urls){
  const parsed=new URL(url);assert.equal(parsed.origin,SEVA_SEO_ORIGIN);
  assert(!/^\/(?:account|premium|app|api|checkout|registration)(?:\/|$)/.test(parsed.pathname));
  assert(!['/titans/operazioni','/titans/manifesto','/studio/diritti','/studio/trattative','/identita'].includes(parsed.pathname));
 }
});

test('SEO replaces duplicate metadata while preserving RSS and existing privacy directives',()=>{
 const original='<html lang="en"><head><title>Europe</title><meta name="description" content="Official sources"><meta name="robots" content="noindex, follow"><link rel="canonical" href="https://old.test"><link rel="canonical" href="https://old2.test"><link rel="alternate" hreflang="en" href="https://old.test/en"><link rel="alternate" type="application/rss+xml" href="/alerts.xml"><meta property="og:url" content="https://old.test"></head><body>Content</body></html>';
 const html=withSevaSEO(original,'https://untrusted-host.test/europa?scope=PRIVATE');
 assert.deepEqual(canonicals(html),[SEVA_SEO_ORIGIN+'/europa?lang=en']);
 assert.equal((html.match(/property="og:url"/g)||[]).length,1);
 assert.equal((html.match(/hreflang=/g)||[]).length,3);
 for(const lang of ['it','en','x-default'])assert(html.includes('hreflang="'+lang+'"'));
 assert(html.includes('type="application/rss+xml" href="/alerts.xml"'));
 assert(html.includes('name="robots" content="noindex, follow"'));assert(!html.includes('PRIVATE'));
 assert.equal(withSevaSEO(html,'/europa'),html);
});

test('every sitemap location returns indexable HTML in its declared language with one matching canonical',async()=>{
 const originalFetch=globalThis.fetch;let calls=0;
 globalThis.fetch=()=>{calls++;throw Error('Public HTML must not contact a provider');};
 try{
  for(const entry of sevaPublicSEOEntries()){
   const url=new URL(entry.url),response=await get(url.pathname+url.search),html=await response.text();
   assert.equal(response.status,200,entry.url);
   assert.match(response.headers.get('Content-Type')||'',/text\/html/,entry.url);
   assert(!/noindex/i.test(response.headers.get('X-Robots-Tag')||''),entry.url);
   assert(!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html),entry.url);
   assert.match(html,new RegExp('<html[^>]*lang="'+entry.language+'"'),entry.url);
   assert.deepEqual(canonicals(html),[entry.url],entry.url);
   assert.equal((html.match(/property="og:url"/g)||[]).length,1,entry.url);
  }
  assert.equal(calls,0);
 }finally{globalThis.fetch=originalFetch;}
});

test('private pages, API errors and sign-in redirects expose noindex without an indexable canonical',async()=>{
 for(const path of ['/account','/account?lang=en','/premium','/premium?lang=en','/app','/api/account']){
  const response=await get(path),html=await response.text();
  assert.match(response.headers.get('X-Robots-Tag')||'',/noindex/,path);
  assert.equal(canonicals(html).length,0,path);
  if(response.headers.get('Content-Type')?.includes('text/html'))assert.match(html,/<meta name="robots" content="noindex/,path);
 }
});

test('registration aliases preserve the language and cannot carry personal parameters into the destination',async()=>{
 for(const path of ['/registration','/register','/registrati']){
  const response=await get(path+'?lang=en&email=PRIVATE&next=https://untrusted-host.test');
  assert.equal(response.status,302);assert.equal(response.headers.get('Location'),'/account?lang=en');
  assert.match(response.headers.get('X-Robots-Tag'),/noindex/);assert.equal(await response.text(),'');
 }
});

test('robots advertises the verified sitemap and lets crawlers read account noindex directives',async()=>{
 const response=await get('/robots.txt'),text=await response.text();
 assert.equal(response.status,200);assert.match(text,/Disallow: \/api\//);
 assert(text.includes('Sitemap: '+SEVA_SEO_ORIGIN+'/sitemap.xml'));
 assert(!text.includes('Disallow: /account'));assert(!text.includes('Disallow: /app'));
 assert(!text.includes('sevaintelligencestudio.com'));
});

test('sitemap, robots and Europe accept GET and HEAD with bounded method handling',async()=>{
 for(const path of ['/sitemap.xml','/robots.txt','/europa','/europa?lang=en']){
  const response=await get(path,'HEAD');assert.equal(response.status,200,path);assert.equal(await response.text(),'',path);
  const rejected=await get(path,'POST');assert.equal(rejected.status,405,path);assert.equal(rejected.headers.get('Allow'),'GET, HEAD',path);
 }
});

test('noindex header wrapping preserves the response status, body, cookies, caching and existing directives',async()=>{
 const original=new Response('private body',{status:409,statusText:'Conflict',headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':'synthetic=1; Secure; HttpOnly'}});
 const result=withSevaSEOHeaders(original,'/api/account');
 assert.equal(result.status,409);assert.equal(result.statusText,'Conflict');assert.equal(await result.text(),'private body');
 assert.equal(result.headers.get('Content-Type'),'application/json');assert.equal(result.headers.get('Cache-Control'),'no-store');assert.equal(result.headers.get('Set-Cookie'),'synthetic=1; Secure; HttpOnly');assert.equal(result.headers.get('X-Robots-Tag'),'noindex, nofollow');
 const protectedResponse=new Response('body',{headers:{'X-Robots-Tag':'noindex, follow'}});
 assert.equal(withSevaSEOHeaders(protectedResponse,'/account'),protectedResponse);
 const publicResponse=new Response('body');assert.equal(withSevaSEOHeaders(publicResponse,'/europa'),publicResponse);
});

test('public home presents four starting paths and retains established tools in closed details',()=>{
 for(const language of ['it','en']){
  const suffix=language==='en'?'?lang=en':'',html=renderSynapsyHomePage(language);
  const hero=html.match(/<section class="sy-home-hero"[\s\S]*?<\/section>/)?.[0];assert(hero);
  const links=[...hero.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(links,['/account'+suffix,'/premium'+suffix,'/europa'+suffix,'/cms'+suffix]);
  assert.equal((html.match(/<details class="sy-secondary-tools">/g)||[]).length,3);
  assert.equal((html.match(/data-home-area=/g)||[]).length,6);
  assert(html.includes('id="how"'));assert(html.includes('id="strumenti"'));
  assert(!html.includes('sy-work-rail"'));
 }
 const signed=renderSynapsyHomePage('en',{scope:'PRIVATE_SCOPE',isOwner:false});assert(signed.includes('href="/app?section=home"'));assert(!signed.includes('PRIVATE_SCOPE'));
});

test('Europe is discoverable in search and the shared tools, and language switching remains on its public page',()=>{
 for(const language of ['it','en']){
  const path='/europa'+(language==='en'?'?lang=en':'');
  const entry=sevaSearchCatalog(language).find(item=>item.path===path);assert(entry);
  assert.equal(entry.language,language);assert(renderSevaCommand(language==='en').includes(path));
 }
 assert.equal(sevaLanguageURL('https://untrusted-host.test/europa?scope=PRIVATE#ed-students',false),'/europa?lang=en');
});
