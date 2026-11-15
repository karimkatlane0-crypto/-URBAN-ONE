import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext,Script} from 'node:vm';
import {withSevaExperience,sevaLanguageURL,sevaExperienceScript,bindSevaLanguagePreference} from '../src/experience.js';
import {withSynapsyChrome} from '../src/synapsy-brand.js';
import {STUDIO_LANGUAGES} from '../src/studio-languages.js';
import {sevaWebManifest} from '../src/mobile-shortcut.js';
import {superAppWebManifest} from '../src/superapp-manifest.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const archive='assets/brand-history/2026-11-15-v281/';
const page=language=>'<html lang="'+language+'"><head><title>Existing page</title></head><body><main><button id="existing-operation">Continue</button></main></body></html>';

test('approved artwork stays byte-identical in the archive and all served raster assets have honest formats and sizes',()=>{
 const original=read(archive+'approved-original-01-9164.jpg');
 assert.equal(hash(original),'9a72dc877cf2d3e5cf891338a2c974299cfb3cb89b6d9421c51597f2b88cace3');
 assert.deepEqual([...original.subarray(0,3)],[255,216,255]);
 const svg=read('assets/synapsy-icon.svg').toString();
 const embedded=svg.match(/href="data:image\/jpeg;base64,([A-Za-z0-9+/=]+)"/);
 assert(embedded);assert.deepEqual(Buffer.from(embedded[1],'base64'),original);
 assert.doesNotMatch(svg,/<(?:path|rect|circle|script)\b|https?:\/\/(?!www\.w3\.org)/);
 for(const [name,size] of [['seva-logo.png',1536],['seva-icon-192.png',192],['seva-icon-512.png',512]]){
  const bytes=read('assets/'+name);assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
 }
 const proof=JSON.parse(read(archive+'provenance.json'));
 for(const item of proof.previousAssets)assert.equal(hash(read(archive+item.name)),item.sha256);
 assert.equal(read(archive+'seva-logo.png').readUInt32BE(16),1312);
});

test('shared chrome uses the approved logo and one Apple icon while preserving existing controls and app identities',()=>{
 for(const language of ['it','en']){
  const html=withSynapsyChrome(withSevaExperience(page(language),'https://seva.test/global'),'https://seva.test/global');
  assert.match(html,/<img src="\/assets\/seva-logo\.png" width="1536" height="1536" alt=""/);
  assert.match(html,/<link rel="icon" href="\/assets\/seva-icon-192\.png" type="image\/png"/);
  assert.equal((html.match(/rel="apple-touch-icon"/g)||[]).length,1);
  assert.match(html,/id="existing-operation"/);assert.equal(withSynapsyChrome(html,'https://seva.test/global'),html);
 }
 const existing=page('it').replace('</head>','<link rel="apple-touch-icon" href="/assets/seva-icon-192.png"></head>');
 assert.equal((withSynapsyChrome(existing,'https://seva.test/account').match(/rel="apple-touch-icon"/g)||[]).length,1);
 for(const [manifest,id,start] of [[superAppWebManifest(),'/superapp','/app?section=home'],[sevaWebManifest(),'/global','/global'],[sevaWebManifest(true,'en'),'/account','/account?lang=en']]){
  assert.equal(manifest.id,id);assert.equal(manifest.start_url,start);assert.equal(manifest.scope,'/');
  assert.deepEqual(manifest.icons.map(item=>item.sizes),['192x192','512x512']);assert(manifest.icons.every(item=>item.type==='image/png'));
 }
});

test('language choices combine flags with real names and keep untranslated operational screens explicit',()=>{
 for(const [language,flag,name,other] of [['it','🇮🇹','Italiano','en'],['en','🇬🇧','English','it']]){
  const html=withSevaExperience(page(language),'https://seva.test/global?private=DO_NOT_SHARE#draft');
  const header=html.match(/<header id="seva-experience"[\s\S]*?<\/header>/)[0];
  assert(header.includes('aria-hidden="true">'+flag));assert(header.includes('<bdi lang="'+language+'">'+name+'</bdi>'));
  assert(header.includes('data-seva-locale="'+other+'"'));assert(header.includes('hreflang="'+other+'"'));
  assert.match(header,/Studio (?:e compositore · 8 lingue|and composer · 8 languages)/);
  assert(!header.includes('id="seva-languages"'));assert(!header.includes('DO_NOT_SHARE'));assert(!header.includes('#draft'));
 }
 for(const path of ['/app','/territorio/azioni','/gmas']){
  assert.equal(sevaLanguageURL('https://seva.test'+path+'?record=PRIVATE#review',false),'/global?lang=en');
  const html=withSevaExperience(page('it'),'https://seva.test'+path);
  assert(html.includes('English · panoramica pubblica'));assert(html.includes('Alcune aree operative restano in italiano'));
 }
 assert.doesNotThrow(()=>new Script(sevaExperienceScript()));
});

function preferenceHarness({lang='it',href='https://seva.test/app?record=PRIVATE#draft',stored=null,blocked=false}={}){
 const keys=['seva-experience','seva-studio-language-link','seva-studio-language-name','seva-studio-language-flag','seva-language-preference'];
 const nodes=Object.fromEntries(keys.map(key=>[key,{href:'',textContent:'',hidden:true}])),events={},reads=[],writes=[];
 const document={documentElement:{lang},getElementById:id=>nodes[id]||null};
 const location={href,assign(){throw Error('Language memory must not navigate');},replace(){throw Error('Language memory must not navigate');}};
 const localStorage={getItem(key){reads.push(key);if(blocked)throw Error('blocked');return stored;},setItem(key,value){if(blocked)throw Error('blocked');writes.push([key,value]);}};
 runInNewContext('('+bindSevaLanguagePreference.toString()+')(languages)',{document,location,localStorage,languages:STUDIO_LANGUAGES,URL,window:{addEventListener:(event,fn)=>events[event]=fn},fetch(){throw Error('No provider request is allowed');}});
 return {nodes,events,reads,writes,document,location};
}

test('saved language is reused through an explicit Studio link without navigating or reflecting private context',()=>{
 const h=preferenceHarness({stored:'fr'});
 assert.deepEqual(h.reads,['synapsy-language-v1']);assert.deepEqual(h.writes,[]);
 assert.equal(h.nodes['seva-studio-language-link'].href,'/studio?lang=fr');assert.equal(h.nodes['seva-studio-language-name'].textContent,'Français');assert.equal(h.nodes['seva-studio-language-flag'].textContent,'🇫🇷');
 assert.equal(h.document.documentElement.lang,'it');assert.equal(h.nodes['seva-language-preference'].hidden,false);assert.match(h.nodes['seva-language-preference'].textContent,/Français/);
 assert(!JSON.stringify(h.nodes).includes('PRIVATE'));
});

test('preference is stored only after the selected language actually renders, preserving cancelled or unsupported navigation',()=>{
 const english=preferenceHarness({lang:'en',href:'https://seva.test/global?lang=en',stored:'fr'});
 assert.deepEqual(english.writes,[['synapsy-language-v1','en']]);assert.equal(english.nodes['seva-studio-language-link'].href,'/studio?lang=en');assert.match(english.nodes['seva-language-preference'].textContent,/Language saved on this device: English/);
 for(const href of ['https://seva.test/app?lang=en','https://seva.test/global?lang=it&lang=en','https://seva.test/global?lang=unsupported']){
  const h=preferenceHarness({href,stored:'fr'});assert.deepEqual(h.writes,[]);assert.equal(h.nodes['seva-studio-language-link'].href,'/studio?lang=fr');
 }
});

test('blocked storage and forged locale values retain working links without selecting an unsupported language',()=>{
 for(const stored of ['https://evil.test/','en&account=SECRET','constructor','__proto__','xx',null]){
  const h=preferenceHarness({stored});assert.equal(h.nodes['seva-studio-language-link'].href,'/studio?lang=it');assert.equal(h.nodes['seva-language-preference'].hidden,true);assert.deepEqual(h.writes,[]);
 }
 const blocked=preferenceHarness({blocked:true,lang:'en',href:'https://seva.test/global?lang=en'});
 assert.equal(blocked.nodes['seva-studio-language-link'].href,'/studio?lang=en');assert.equal(blocked.nodes['seva-language-preference'].hidden,true);
});

test('cross-tab preference changes update only the explicit language link, and clearing the setting restores the page language',()=>{
 const h=preferenceHarness({stored:'en'});
 h.events.storage({key:'unrelated-private-key',newValue:'ar'});assert.equal(h.nodes['seva-studio-language-link'].href,'/studio?lang=en');
 h.events.storage({key:'synapsy-language-v1',newValue:'ar'});assert.equal(h.nodes['seva-studio-language-link'].href,'/studio?lang=ar');assert.equal(h.nodes['seva-studio-language-name'].textContent,'العربية');assert.equal(h.document.documentElement.lang,'it');
 h.events.storage({key:null,newValue:null});assert.equal(h.nodes['seva-studio-language-link'].href,'/studio?lang=it');assert.equal(h.nodes['seva-language-preference'].hidden,true);assert.deepEqual(h.writes,[]);
});
