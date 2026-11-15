import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {EUROPE_SOURCES} from '../src/europe-sources.js';
import {europeDirectoryIndex,europeDirectoryNormalize,filterEuropeDirectory,europeDirectoryBrowserScript,renderEuropeDirectory} from '../src/europe-directory.js';

const indexes=EUROPE_SOURCES.map(europeDirectoryIndex);
const unescape=value=>value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match=>[match[1],unescape(match[2])]));

function harness(language='it'){
 const html=renderEuropeDirectory(language),nodes=new Map(),events=new Map();
 class Element{
  constructor(attributes={}){this.attributes=attributes;this.value='';this.hidden=false;this.dataset={};this.listeners=new Map();this.textContent='';this.focused=false;for(const [key,value] of Object.entries(attributes))if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]=value;}
  addEventListener(name,fn){this.listeners.set(name,fn);}
  emit(name,event={}){return this.listeners.get(name)?.(event);}
  focus(){this.focused=true;}
  querySelector(selector){return selector==='[data-ed-group-count]'?this.count:null;}
  set innerHTML(value){throw Error('Do not render input through HTML');}
 }
 for(const match of html.matchAll(/<[^>]+\bid="ed-[^"]+"[^>]*>/g)){const at=attrs(match[0]);nodes.set(at.id,new Element(at));}
 const cards=[...html.matchAll(/<article class="ed-card"[^>]*>/g)].map(match=>nodes.get(attrs(match[0]).id));
 const groups=[...html.matchAll(/<section class="ed-group"[^>]*>/g)].map(match=>{const group=nodes.get(attrs(match[0]).id);group.count=new Element();return group;});
 const jumps=[...html.matchAll(/<a\b[^>]+data-ed-jump="[^"]+"[^>]*>/g)].map(match=>new Element(attrs(match[0])));
 nodes.get('ed-directory').querySelectorAll=selector=>({'[data-ed-source]':cards,'[data-ed-group]':groups,'[data-ed-jump]':jumps}[selector]||[]);
 const forbidden=()=>{throw Error('Directory must not access network, URL, storage or sensors');};
 const window={addEventListener:(name,fn)=>events.set(name,fn)};
 for(const key of ['location','localStorage','sessionStorage','navigator'])Object.defineProperty(window,key,{get:forbidden});
 const context=vm.createContext({document:{getElementById:id=>nodes.get(id)||null},window,fetch:forbidden,navigator:new Proxy({},{get:forbidden}),localStorage:new Proxy({},{get:forbidden}),sessionStorage:new Proxy({},{get:forbidden})});
 vm.runInContext(europeDirectoryBrowserScript(language).replace(/^<script>|<\/script>$/g,''),context);
 return {html,cards,groups,jumps,events,node:id=>nodes.get('ed-'+id),visible:()=>cards.filter(card=>!card.hidden),
  input(value){const input=nodes.get('ed-query');input.value=value;input.emit('input');},
  change(id,value){const node=nodes.get('ed-'+id);node.value=value;node.emit('change');}};
}

test('all real source cards and dated external links are present before JavaScript, in both languages',()=>{
 for(const language of ['it','en']){
  const html=renderEuropeDirectory(language),cards=[...html.matchAll(/<article class="ed-card"[^>]*>([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length,EUROPE_SOURCES.length);
  assert.equal(EUROPE_SOURCES.filter(row=>row.category==='students').length,12);
  assert.match(html,new RegExp('<html lang="'+language+'">'));
  assert.match(html,/<main id="ed-main"/);assert.match(html,/href="#ed-main"/);
  assert.match(html,/role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html,/<noscript>[^<]+<\/noscript>/);
  for(let i=0;i<cards.length;i++){
   const source=EUROPE_SOURCES[i],article=cards[i][0];
   assert.equal(/<article[^>]+\bhidden\b/.test(article),false);
   assert.ok(unescape(article).includes(source.description[language]));
   assert.ok(unescape(article).includes(source.action[language]));
   assert.ok(unescape(article).includes(new URL(source.url).href));
   assert.match(article,/target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer"/);
   assert.match(article,/<time datetime="2026-11-15">/);
  }
  assert.doesNotMatch(html,/<header\b|noindex|\/api\/crm|contactId|mailto:|tel:/);
 }
 assert.match(renderEuropeDirectory('unsupported'),/<html lang="it">/);
});

test('filters combine country, category and accent-insensitive words without changing the records',()=>{
 const before=JSON.stringify(indexes);
 assert.equal(europeDirectoryNormalize('  ÖVI — ÉTUDIANTS  '),'ovi etudiants');
 assert.deepEqual(filterEuropeDirectory(indexes,{query:'ERDISU Trieste'}).map(row=>row.id),['ardis-fvg']);
 assert.deepEqual(filterEuropeDirectory(indexes,{query:'ovi',country:'AT',category:'associations'}).map(row=>row.id),['ovi-austria']);
 assert.deepEqual(filterEuropeDirectory(indexes,{country:'NL',category:'students'}).map(row=>row.id),['study-nl-housing']);
 assert.equal(filterEuropeDirectory(indexes,{category:'students'}).length,12);
 assert.equal(filterEuropeDirectory(indexes,{query:'paesi bassi',category:'students'}).length,1);
 assert.equal(filterEuropeDirectory(indexes,{query:'universita trieste',category:'students'}).some(row=>row.id==='units-housing'),true);
 assert.equal(JSON.stringify(indexes),before);
});

test('invalid or overlong criteria cannot widen the result set',()=>{
 for(const criteria of [{query:'x'.repeat(121)},{query:{value:'Trieste'}},{country:'it'},{country:'IT<script>'},{country:'ZZ'},{category:'all-malicious'},null,[]])assert.equal(filterEuropeDirectory(indexes,criteria).length,0);
 assert.equal(filterEuropeDirectory(indexes,{query:'<img src=x onerror=alert(1)>'}).length,0);
 assert.equal(filterEuropeDirectory(indexes,{}).length,EUROPE_SOURCES.length);
 assert.throws(()=>europeDirectoryIndex({...EUROPE_SOURCES[0],id:'injected" onclick="alert(1)'}));
 assert.throws(()=>europeDirectoryIndex({...EUROPE_SOURCES[0],category:'unknown'}));
});

test('the actual browser script initializes with all cards and does not read URL, storage, sensors or make requests',()=>{
 const h=harness();
 assert.equal(h.visible().length,EUROPE_SOURCES.length);
 assert.equal(h.node('filters').hidden,false);
 assert.equal(h.node('query').value,'');assert.equal(h.node('country').value,'');assert.equal(h.node('category').value,'');
 assert.match(h.node('count').textContent,/36 di 36/);
 assert.equal(h.node('empty').hidden,true);
 let prevented=false;h.node('filters').emit('submit',{preventDefault(){prevented=true;}});assert.equal(prevented,true);
 assert.doesNotMatch(europeDirectoryBrowserScript(),/fetch\s*\(|localStorage|sessionStorage|location\.|history\.|geolocation|innerHTML|eval\s*\(/);
});

test('interactive filters hide entire empty categories, show an empty state and reset every control',()=>{
 const h=harness();h.change('category','students');h.change('country','NL');
 assert.deepEqual(h.visible().map(card=>card.dataset.edSource),['study-nl-housing']);
 assert.equal(h.groups.filter(group=>!group.hidden).length,1);assert.match(h.node('count').textContent,/1 di 36/);
 h.input('nessun risultato inventato');assert.equal(h.visible().length,0);assert.equal(h.node('empty').hidden,false);assert.equal(h.groups.every(group=>group.hidden),true);
 h.node('empty-reset').emit('click');assert.equal(h.visible().length,36);assert.equal(h.node('query').value,'');assert.equal(h.node('country').value,'');assert.equal(h.node('category').value,'');assert.equal(h.node('empty').hidden,true);assert.equal(h.node('query').focused,true);
});

test('hero paths clear unrelated filters while preserving normal anchor navigation and source URLs',()=>{
 const h=harness(),originalLinks=h.cards.map(card=>card.attributes.id);
 h.change('country','DE');h.input('testo precedente');
 const jump=h.jumps.find(link=>link.dataset.edJump==='associations');jump.emit('click');
 assert.equal(jump.attributes.href,'#ed-associations');assert.equal(h.node('category').value,'associations');assert.equal(h.node('country').value,'');assert.equal(h.node('query').value,'');
 assert.equal(h.visible().length,18);assert.equal(h.visible().every(card=>card.dataset.edCategory==='associations'),true);
 assert.deepEqual(h.cards.map(card=>card.attributes.id),originalLinks);
});

test('English live counts, reset and page-cache restoration remain local and accessible',()=>{
 const h=harness('en');h.input('ERDISU');assert.match(h.node('count').textContent,/1 of 36/);
 assert.equal(h.visible()[0].dataset.edSource,'ardis-fvg');
 h.events.get('pagehide')();assert.equal(h.node('query').value,'');assert.equal(h.visible().length,36);
 h.change('category','networks');assert.equal(h.visible().length,3);h.events.get('pageshow')({persisted:true});assert.equal(h.node('category').value,'');assert.equal(h.visible().length,36);
 h.input('<script>alert(1)</script>');assert.equal(h.node('empty').hidden,false);assert.doesNotMatch(h.node('count').textContent,/<script>|alert/);
 h.node('reset').emit('click');assert.equal(h.node('query').focused,true);
});

test('directory entry points only navigate and keep unknown availability and affiliations explicit',()=>{
 for(const language of ['it','en']){
  const html=renderEuropeDirectory(language);
  assert.match(html,/href="\/account(?:\?lang=en)?"/);assert.match(html,/href="\/premium(?:\?lang=en)?"/);assert.match(html,/href="\/app\?section=goals(?:&amp;lang=en)?"/);
  assert.match(html,/ARDiS/);assert.match(html,/2014/);assert.match(html,/2021/);
  assert.ok(html.includes(language==='it'?'non attesta convenzioni o affiliazioni':'does not establish a partnership or affiliation'));
  assert.doesNotMatch(html,/createGoal|submitCandidate|\/api\/|<iframe|<form[^>]*action=/);
 }
});
