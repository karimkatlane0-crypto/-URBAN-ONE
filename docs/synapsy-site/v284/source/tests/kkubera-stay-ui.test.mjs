import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {renderKkuberaStayPage,kkStayUIBrowserScript,KK_STAY_STORAGE_KEY} from '../src/kkubera-stay-page.js';

const snapshot=h=>JSON.parse(JSON.stringify(h.ui.snapshot()));
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const block=(n,unitId='Camera A',source='Booking.com',start='2090-04-10',end='2090-04-12')=>({id:'ksb_'+n.toString(16).padStart(32,'0'),unitId,source,start,end,importedAt:'2026-11-15T12:00:00.000Z',batchId:'ksbatch_'+n.toString(16).padStart(32,'0')});
const backup=blocks=>JSON.stringify({schema:'kkubera-stay-backup',version:1,blocks});
const ics=(ranges=[['2090-04-10','2090-04-12']],extra='')=>'BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'+ranges.map(([start,end])=>'BEGIN:VEVENT\r\nUID:private-guest-uid\r\nSUMMARY:Private Guest\r\nDESCRIPTION:Secret booking notes\r\nURL:https://provider.invalid/feed?token=SECRET\r\nDTSTART;VALUE=DATE:'+start.replaceAll('-','')+'\r\nDTEND;VALUE=DATE:'+end.replaceAll('-','')+'\r\n'+extra+'END:VEVENT\r\n').join('')+'END:VCALENDAR\r\n';
const file=(text,options={})=>({name:'private-guest-calendar.ics',size:new TextEncoder().encode(text).byteLength,text:async()=>text,...options});

function harness(language='it',initialStorage={}){
 const nodes=new Map(),calls=[],downloads=[],blobs=new Map(),storage=new Map(Object.entries(initialStorage)),storageCalls=[],timers=[];let nextBlob=0;
 const failures={read:false,write:false,remove:false};
 class Node{
  constructor(id=''){this.id=id;this.type='';this._value='';this.files=[];this.checked=false;this.hidden=false;this.disabled=false;this.textContent='';this.events=new Map();this.attrs={};this.dataset={};this.children=[];this.html='';}
  set value(value){this._value=String(value);if(this.type==='file'&&!value)this.files=[];}
  get value(){return this._value;}
  addEventListener(name,fn){const list=this.events.get(name)||[];list.push(fn);this.events.set(name,list);}
  setAttribute(key,value){this.attrs[key]=String(value);}
  getAttribute(key){return this.attrs[key]??null;}
  focus(){this.focused=true;}
  replaceChildren(){this.children=[];this.html='';}
  set innerHTML(value){this.html=String(value);this.children=[...this.html.matchAll(/data-ks-remove="([^"]+)"/g)].map(match=>{const node=new Node();node.dataset.ksRemove=match[1];return node;});}
  get innerHTML(){return this.html;}
  querySelectorAll(selector){return selector==='[data-ks-remove]'?this.children:[];}
  fire(type,extra={}){const event={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};this.lastEvent=event;return Promise.all((this.events.get(type)||[]).map(fn=>fn(event)));}
  click(){if(this.download){downloads.push({name:this.download,blob:blobs.get(this.href)});return Promise.resolve();}return this.disabled?Promise.resolve():this.fire('click');}
 }
 const html=renderKkuberaStayPage(language);
 for(const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){
  if(!match[1].startsWith('ks-'))continue;
  const node=new Node(match[1]);node.type=/\btype="([^"]+)"/.exec(match[0])?.[1]||'';node.hidden=/\bhidden(?:\s|>)/.test(match[0]);node.disabled=/\bdisabled(?:\s|>)/.test(match[0]);nodes.set(node.id,node);
 }
 nodes.get('ks-source').value='Booking.com';
 const document=new Node('document');document.getElementById=id=>nodes.get(id)||null;document.createElement=()=>new Node();
 const window=new Node('window');window.open=(...args)=>calls.push({kind:'open',args});
 class BrowserURL extends URL{static createObjectURL(blob){const id='blob:stay-'+(++nextBlob);blobs.set(id,blob);return id;}static revokeObjectURL(id){blobs.delete(id);}}
 const context={document,window,crypto:webcrypto,TextEncoder,Uint8Array,Intl,Date,Blob,URL:BrowserURL,
  navigator:{geolocation:{getCurrentPosition(){calls.push({kind:'gps'});}},mediaDevices:{getUserMedia(){calls.push({kind:'media'});}}},
  localStorage:{getItem(key){storageCalls.push({kind:'get',key});if(failures.read)throw Error('opaque browser error');return storage.get(key)??null;},setItem(key,value){storageCalls.push({kind:'set',key});if(failures.write)throw Error('opaque browser error');storage.set(key,value);},removeItem(key){storageCalls.push({kind:'remove',key});if(failures.remove)throw Error('opaque browser error');storage.delete(key);}},
  fetch(...args){calls.push({kind:'fetch',args});throw Error('No provider request expected');},setTimeout(fn,ms){timers.push({fn,ms});return timers.length;},clearTimeout(){}};
 let script=kkStayUIBrowserScript(language).replace(/^<script>/,'').replace(/<\/script>$/,'');
 const at=script.lastIndexOf('\nbindKkuberaStay(');assert(at>0);script=script.slice(0,at)+script.slice(at).replace('\nbindKkuberaStay(','\nglobalThis.__stay=bindKkuberaStay(');
 vm.runInNewContext(script,context);
 const h={nodes,html,context,window,document,ui:context.__stay,calls,downloads,storage,storageCalls,failures,
  node:id=>nodes.get('ks-'+id),click:id=>nodes.get('ks-'+id).click(),
  async change(id,value){const node=h.node(id);if(typeof value==='boolean')node.checked=value;else node.value=value;await node.fire(id==='source'||id==='confirm'||id==='storage-consent'?'change':'input');},
  read(kind,value){const node=h.node(kind==='ics'?'ics-file':'json-file');node.files=[typeof value==='string'?file(value):value];return node.fire('change');},
  async apply(){await h.change('confirm',true);await h.click('apply');},
  async seed(blocks){await h.read('json',backup(blocks));await h.apply();},
  async manual(unit,start,end){await h.change('unit',unit);await h.change('start',start);await h.change('end',end);await h.node('manual-form').fire('submit');},
  async exportJSON(){await h.click('export-json');return JSON.parse(await h.downloads.at(-1).blob.text());}
 };
 return h;
}

test('the complete IT/EN page starts empty without reading storage, providers or sensors',()=>{
 for(const language of ['it','en']){
  const h=harness(language,{[KK_STAY_STORAGE_KEY]:backup([block(1)])});
  assert.match(h.html,new RegExp('<html lang="'+language+'">'));assert.equal(snapshot(h).length,0);assert.equal(h.storageCalls.length,0);assert.equal(h.calls.length,0);assert.equal(h.downloads.length,0);
  assert.equal(h.node('empty').hidden,false);assert.equal(h.node('apply').disabled,true);assert.equal(h.node('save').disabled,true);assert.equal(h.node('export-ics').disabled,true);
  assert(h.html.includes('https://admin.booking.com/'));assert(h.html.includes('https://connect.booking.com/'));assert(h.html.includes(language==='en'?'Connection to be verified':'Collegamento da verificare'));
  assert.match(h.node('memory-status').textContent,language==='en'?/No backup has been read or saved/:/Nessuna copia letta o salvata/);
  for(const [,script] of h.html.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new vm.Script(script));
 }
});

test('ICS preview requires a local unit and explicit apply; guest metadata never enters the state',async()=>{
 const h=harness();let reads=0;
 await h.read('ics',file(ics(),{text:async()=>{reads++;return ics();}}));assert.equal(reads,0);assert.equal(h.ui.hasPreview(),false);assert.match(h.node('status').textContent,/nome locale/);
 await h.change('unit','Camera A');await h.read('ics',ics());assert.equal(snapshot(h).length,0);assert.equal(h.node('preview').hidden,false);assert.equal(h.node('apply').disabled,true);
 await h.click('apply');assert.equal(snapshot(h).length,0);await h.apply();
 assert.equal(snapshot(h).length,1);assert.equal(snapshot(h)[0].source,'Booking.com');assert.equal(snapshot(h)[0].start,'2090-04-10');assert.equal(snapshot(h)[0].end,'2090-04-12');assert.match(h.node('rows').innerHTML,/>2<\/td>/);
 const data=await h.exportJSON();assert.doesNotMatch(JSON.stringify(data),/Private Guest|private-guest|Secret booking|SECRET|provider\.invalid|SUMMARY|DESCRIPTION/);assert.deepEqual(Object.keys(data.blocks[0]).sort(),['id','unitId','source','start','end','importedAt','batchId'].sort());assert.equal(h.storageCalls.length,0);
});

test('ICS replacement preserves other units and sources, reuses matching block IDs and supports undo',async()=>{
 const h=harness(),initial=[block(1),block(2,'Camera A','Booking.com','2090-04-14','2090-04-15'),block(3,'Camera A','Altro calendario'),block(4,'Camera A','Manuale'),block(5,'Camera B')];
 await h.seed(initial);await h.change('unit','Camera A');await h.read('ics',ics([['2090-04-10','2090-04-12'],['2090-04-20','2090-04-23']]));
 assert.match(h.node('preview-diff').textContent,/1 aggiunti · 1 rimossi · 4 invariati/);assert.deepEqual(snapshot(h),initial);await h.apply();
 const after=snapshot(h);assert.equal(after.length,5);assert(after.some(x=>x.id===initial[0].id));assert(!after.some(x=>x.id===initial[1].id));for(const old of initial.slice(2))assert.deepEqual(after.find(x=>x.id===old.id),old);
 await h.click('undo');assert.deepEqual(snapshot(h),initial);assert.equal(h.node('undo').disabled,true);assert.equal(h.storageCalls.length,0);
});

test('two distinct ICS events with identical dates remain two local blocks and reimport is stable',async()=>{
 const h=harness(),text=ics([['2090-04-10','2090-04-12'],['2090-04-10','2090-04-12']]);await h.change('unit','Camera A');await h.read('ics',text);await h.apply();const first=snapshot(h);assert.equal(first.length,2);assert.notEqual(first[0].id,first[1].id);
 await h.read('ics',text);assert.match(h.node('preview-diff').textContent,/0 aggiunti · 0 rimossi · 2 invariati/);await h.apply();assert.deepEqual(snapshot(h),first);
});

test('rejected or oversized files clear an earlier preview and leave all applied blocks untouched',async()=>{
 const h=harness();await h.seed([block(1)]);await h.change('unit','Camera A');await h.read('ics',ics([['2090-05-10','2090-05-12']]));assert.equal(h.ui.hasPreview(),true);
 await h.read('ics','PRIVATE GUEST INVALID FILE');assert.equal(h.ui.hasPreview(),false);assert.equal(h.node('apply').disabled,true);assert.deepEqual(snapshot(h),[block(1)]);assert.doesNotMatch(h.node('status').textContent,/PRIVATE GUEST/);
 let read=false;await h.read('ics',file('',{size:262145,text:async()=>{read=true;return ics();}}));assert.equal(read,false);assert.equal(h.ui.hasPreview(),false);assert.match(h.node('status').textContent,/256 KiB/);assert.deepEqual(snapshot(h),[block(1)]);
});

test('a late file read cannot replace a newer file preview or applied data',async()=>{
 const h=harness();await h.change('unit','Camera A');let finish;
 const first=h.read('ics',file('',{size:200,text:()=>new Promise(resolve=>{finish=resolve;})}));await flush();
 await h.read('ics',ics([['2090-06-10','2090-06-13']]));await h.apply();const current=snapshot(h);finish(ics([['2090-01-10','2090-01-12']]));await first;
 assert.deepEqual(snapshot(h),current);assert.equal(current[0].start,'2090-06-10');assert.equal(h.ui.hasPreview(),false);
});

test('unit, source and date changes invalidate file previews and pending reads; silent field changes are checked at apply',async()=>{
 const h=harness();await h.change('unit','Camera A');let finish;
 const pending=h.read('ics',file('',{size:200,text:()=>new Promise(resolve=>{finish=resolve;})}));await flush();await h.change('unit','Camera B');finish(ics());await pending;assert.equal(h.ui.hasPreview(),false);
 for(const [field,value] of [['source','Altro calendario'],['start','2090-07-01'],['end','2090-07-03']]){await h.read('ics',ics());await h.change('confirm',true);await h.change(field,value);assert.equal(h.ui.hasPreview(),false);assert.equal(h.node('confirm').checked,false);assert.equal(h.node('apply').disabled,true);}
 await h.read('ics',ics());await h.change('confirm',true);h.node('unit').value='Camera C';await h.click('apply');assert.equal(snapshot(h).length,0);assert.equal(h.ui.hasPreview(),false);
});

test('complete JSON restore has a separate preview and confirmation; restore and clear are undoable',async()=>{
 const h=harness(),initial=[block(1),block(2,'Camera B')],replacement=[block(3,'Appartamento C','Manuale')];await h.seed(initial);
 await h.read('json',backup(replacement));assert.match(h.node('preview-scope').textContent,/tutti i blocchi/);assert.match(h.node('preview-diff').textContent,/1 aggiunti · 2 rimossi/);assert.deepEqual(snapshot(h),initial);await h.apply();assert.deepEqual(snapshot(h),replacement);
 await h.click('undo');assert.deepEqual(snapshot(h),initial);await h.click('clear-page');assert.equal(snapshot(h).length,0);await h.click('undo');assert.deepEqual(snapshot(h),initial);assert.equal(h.storageCalls.length,0);
});

test('all cancelled events can remove only the selected ICS scope after review, never other units or Manual blocks',async()=>{
 const h=harness(),initial=[block(1),block(2,'Camera B'),block(3,'Camera A','Manuale')];await h.seed(initial);await h.change('unit','Camera A');await h.read('ics',ics(undefined,'STATUS:CANCELLED\r\n'));
 assert.match(h.node('preview-diff').textContent,/0 aggiunti · 1 rimossi/);assert.match(h.node('preview-note').textContent,/1 annullati/);assert.deepEqual(snapshot(h),initial);await h.apply();assert.deepEqual(snapshot(h),initial.slice(1));
});

test('manual periods check same-unit overlaps with an exclusive checkout boundary and never claim availability',async()=>{
 const h=harness('en');await h.seed([block(1),block(2,'Other room')]);await h.change('unit','Camera A');await h.change('start','2090-04-12');await h.change('end','2090-04-14');await h.click('check');assert.match(h.node('check-result').textContent,/No overlaps/);assert.match(h.node('check-result').textContent,/2 nights/);assert.match(h.node('check-result').textContent,/does not establish commercial availability/);
 await h.manual('Camera A','2090-04-11','2090-04-13');assert.match(h.node('preview-note').textContent,/Overlaps with existing blocks: 1/);await h.apply();assert.equal(snapshot(h).filter(x=>x.source==='Manuale').length,1);assert.equal(snapshot(h).length,3);
 await h.manual('Camera A','2090-04-12','2090-04-12');assert.equal(h.ui.hasPreview(),false);assert.match(h.node('status').textContent,/end\/check-out must follow/);assert.equal(snapshot(h).length,3);
});

test('device save is explicit opt-in, never autosaves later edits, and handles a failed save without losing the page',async()=>{
 const h=harness();await h.manual('Camera A','2090-04-10','2090-04-12');await h.apply();await h.click('save');assert.equal(h.storageCalls.length,0);
 await h.change('storage-consent',true);await h.click('save');assert.deepEqual(h.storageCalls,[{kind:'set',key:KK_STAY_STORAGE_KEY}]);const saved=h.storage.get(KK_STAY_STORAGE_KEY);assert.equal(h.ui.isDirty(),false);
 await h.manual('Camera A','2090-04-15','2090-04-16');await h.apply();assert.equal(h.storage.get(KK_STAY_STORAGE_KEY),saved);assert.equal(h.ui.isDirty(),true);
 h.failures.write=true;await h.click('save');assert.equal(snapshot(h).length,2);assert.equal(h.storage.get(KK_STAY_STORAGE_KEY),saved);assert.equal(h.ui.isDirty(),true);assert.match(h.node('storage-status').textContent,/Salvataggio non riuscito/);assert.doesNotMatch(h.node('storage-status').textContent,/opaque browser error/);
});

test('device load previews valid data, while malformed or inaccessible storage leaves current data and stored bytes untouched',async()=>{
 const other=backup([block(9,'Saved room')]),h=harness('it',{[KK_STAY_STORAGE_KEY]:other,'another-app':'keep'});await h.seed([block(1)]);assert.equal(h.storageCalls.length,0);
 await h.click('load');assert.deepEqual(snapshot(h),[block(1)]);assert.equal(h.ui.hasPreview(),true);await h.apply();assert.deepEqual(snapshot(h),[block(9,'Saved room')]);assert.equal(h.storage.get(KK_STAY_STORAGE_KEY),other);await h.click('undo');assert.deepEqual(snapshot(h),[block(1)]);
 h.storage.set(KK_STAY_STORAGE_KEY,'{malformed');await h.click('load');assert.equal(h.ui.hasPreview(),false);assert.deepEqual(snapshot(h),[block(1)]);assert.equal(h.storage.get(KK_STAY_STORAGE_KEY),'{malformed');assert.match(h.node('storage-status').textContent,/non è valida/);
 h.failures.read=true;await h.click('load');assert.deepEqual(snapshot(h),[block(1)]);assert.match(h.node('storage-status').textContent,/Lettura non disponibile/);assert.equal(h.storage.get('another-app'),'keep');
});

test('deleting the device copy does not clear current blocks or unrelated keys',async()=>{
 const h=harness('it',{[KK_STAY_STORAGE_KEY]:backup([block(1)]),'another-app':'keep'});await h.click('load');await h.apply();await h.click('delete-storage');assert.equal(h.storage.has(KK_STAY_STORAGE_KEY),false);assert.deepEqual(snapshot(h),[block(1)]);assert.equal(h.storage.get('another-app'),'keep');assert.equal(h.ui.isDirty(),true);
 h.storage.set(KK_STAY_STORAGE_KEY,'retained');h.failures.remove=true;await h.click('delete-storage');assert.equal(h.storage.get(KK_STAY_STORAGE_KEY),'retained');assert.match(h.node('storage-status').textContent,/Eliminazione non riuscita/);
});

test('ICS export includes only the chosen unit across its sources and stable local UIDs; JSON backup includes all units',async()=>{
 const h=harness(),all=[block(1),block(2,'Camera A','Manuale','2090-04-14','2090-04-16'),block(3,'Camera B','Booking.com','2090-05-01','2090-05-04')];await h.seed(all);await h.change('unit','Camera A');await h.click('export-ics');const first=await h.downloads.at(-1).blob.text();await h.click('export-ics');const second=await h.downloads.at(-1).blob.text();
 assert.equal((first.match(/BEGIN:VEVENT/g)||[]).length,2);assert(!first.includes(all[2].id));assert(!first.includes('20900501'));assert.deepEqual(first.match(/UID:[^\r\n]+/g),second.match(/UID:[^\r\n]+/g));assert.equal(h.ui.isDirty(),true);
 const exported=await h.exportJSON();assert.deepEqual(exported.blocks,all);assert.equal(h.ui.isDirty(),true);const restored=harness();await restored.read('json',JSON.stringify(exported));await restored.apply();assert.deepEqual(snapshot(restored),all);assert.equal(h.calls.length,0);
});

test('backups reject unexpected or sensitive properties and ICS export cannot silently truncate more than 500 blocks',async()=>{
 const h=harness();await h.seed([block(1)]);await h.read('json',backup([{...block(2),guest:'SECRET GUEST'}]));assert.equal(h.ui.hasPreview(),false);assert.deepEqual(snapshot(h),[block(1)]);assert.doesNotMatch(h.node('status').textContent,/SECRET GUEST/);
 const many=Array.from({length:501},(_,i)=>block(i+1));await h.seed(many);await h.change('unit','Camera A');assert.equal(h.node('export-ics').disabled,true);await h.node('export-ics').fire('click');assert.equal(h.downloads.length,0);assert.match(h.node('status').textContent,/500 eventi/);assert.equal(snapshot(h).length,501);
});

test('unsaved changes and pending reads warn before leaving; pagehide rejects late reads and pageshow resumes without reading storage',async()=>{
 const h=harness();await h.manual('Camera A','2090-04-10','2090-04-12');await h.apply();await h.window.fire('beforeunload');assert.equal(h.window.lastEvent.defaultPrevented,true);await h.exportJSON();await h.window.fire('beforeunload');assert.equal(h.window.lastEvent.defaultPrevented,false);
 let finish;const read=h.read('ics',file('',{size:200,text:()=>new Promise(resolve=>{finish=resolve;})}));await flush();await h.window.fire('beforeunload');assert.equal(h.window.lastEvent.defaultPrevented,true);await h.window.fire('pagehide');finish(ics([['2090-08-01','2090-08-02']]));await read;assert.equal(h.ui.hasPreview(),false);assert.equal(snapshot(h)[0].start,'2090-04-10');
 await h.window.fire('pageshow',{persisted:true});await h.read('ics',ics());assert.equal(h.ui.hasPreview(),true);assert.equal(h.storageCalls.length,0);
});

test('a device copy changed in another tab invalidates its preview without loading new data automatically',async()=>{
 const h=harness('it',{[KK_STAY_STORAGE_KEY]:backup([block(1)])});await h.click('load');assert.equal(h.ui.hasPreview(),true);const reads=h.storageCalls.length;await h.window.fire('storage',{key:KK_STAY_STORAGE_KEY,newValue:backup([block(2,'Other room')])});assert.equal(h.ui.hasPreview(),false);assert.equal(snapshot(h).length,0);assert.equal(h.storageCalls.length,reads);assert.match(h.node('storage-status').textContent,/altra scheda/);
});


test('saving current blocks invalidates a loaded device preview so an older copy cannot be falsely marked saved',async()=>{
 const saved=[block(1,'Saved A')],current=[block(2,'Current B')],h=harness('it',{[KK_STAY_STORAGE_KEY]:backup(saved)});
 await h.seed(current);await h.click('load');await h.change('confirm',true);assert.equal(h.ui.hasPreview(),true);
 await h.change('storage-consent',true);await h.click('save');assert.equal(h.ui.hasPreview(),false);assert.equal(h.node('apply').disabled,true);assert.deepEqual(JSON.parse(h.storage.get(KK_STAY_STORAGE_KEY)).blocks,current);
 await h.apply();assert.deepEqual(snapshot(h),current);assert.equal(h.ui.isDirty(),false);assert.match(h.node('status').textContent,/Caricala di nuovo/);
 await h.click('load');h.failures.write=true;await h.click('save');assert.equal(h.ui.hasPreview(),true);await h.apply();assert.deepEqual(snapshot(h),current);
});

test('save and JSON export preserve the warning for unapplied manual fields, including unrelated edits and undo',async()=>{
 for(const action of ['save','export-json']){
  const h=harness('en');await h.manual('Room A','2090-04-10','2090-04-12');await h.apply();await h.change('storage-consent',true);await h.click('save');assert.equal(h.ui.isDirty(),false);
  await h.change('unit','Room B');await h.change('start','2090-05-01');await h.change('end','2090-05-03');await h.click(action);
  assert.equal(h.ui.isDirty(),true);assert.match(h.node('memory-status').textContent,/Changed fields are not included/);await h.window.fire('beforeunload');assert.equal(h.window.lastEvent.defaultPrevented,true);
  const saved=action==='save'?JSON.parse(h.storage.get(KK_STAY_STORAGE_KEY)):JSON.parse(await h.downloads.at(-1).blob.text());assert.equal(saved.blocks.length,1);assert.equal(saved.blocks[0].unitId,'Room A');
  await h.read('json',backup([block(20,'Restored C')]));await h.apply();assert.equal(h.ui.isDirty(),true);await h.click('undo');assert.equal(h.ui.isDirty(),true);
  await h.node('manual-form').fire('submit');await h.apply();await h.click(action);assert.equal(h.ui.isDirty(),false);await h.window.fire('beforeunload');assert.equal(h.window.lastEvent.defaultPrevented,false);
  await h.click('undo');assert.equal(h.ui.isDirty(),true);
 }
});
