import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../../seva-android/app/src/main/assets/seva-offline.html', import.meta.url), 'utf8');
function app(saved) {
  const nodes = new Map();
  const node = () => ({ value: '', hidden: true, children: [], events: {}, appendChild(x){ this.children.push(x); }, replaceChildren(){this.children=[];}, addEventListener(k,f){this.events[k]=f;}, focus(){} });
  const get = id => { if(!nodes.has(id)) nodes.set(id,node()); return nodes.get(id); };
  let data = saved;
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
    document: { getElementById:get, createElement:node }, window:{}, confirm:()=>true,
    localStorage:{getItem:()=>data, setItem:(_,value)=>{data=value;}},
  });
  return { get, data:()=>JSON.parse(data), import(goals){get('import-json').value=JSON.stringify({schema:'seva-offline-v1',goals});get('import').events.click();} };
}
const goal = (id,parent='',status='todo') => ({id,parent,status,title:id,description:'',criteria:'',evidence:''});
test('verified imports need acceptance criteria and evidence, preserving existing data on failure',()=>{
 const a=app();a.import([goal('existing')]);a.import([goal('invalid','','done')]);
 assert.equal(a.data().goals[0].id,'existing');
 a.import([{...goal('valid','','done'),criteria:'API responds',evidence:'Test run 123 passed'}]);
 assert.equal(a.data().goals[0].status,'done');
});
test('three child levels accepted; deeper, cyclic and malformed parents rejected',()=>{
 const a=app();const tree=[goal('a'),goal('b','a'),goal('c','b'),goal('d','c')];a.import(tree);
 for(const invalid of [[...tree,goal('e','d')],[goal('a','b'),goal('b','a')],[goal('bad',false)]]) {
  a.import(invalid);assert.equal(a.data().goals.length,4);
 }
});
test('restoring backup closes stale editor and subsequent new goal retains restored records',()=>{
 const a=app();a.import([goal('old')]);
 a.get('goal-list').children[0].children.at(-1).children[0].events.click();
 assert.equal(a.get('editor').hidden,false);a.import([goal('restored')]);
 assert.equal(a.get('editor').hidden,true);
 a.get('new').events.click();a.get('title').value='new';a.get('goal-status').value='todo';
 a.get('goal-form').events.submit({preventDefault(){}});
 assert.deepEqual(a.data().goals.map(x=>x.title),['restored','new']);
});
test('unknown persisted schema is reported instead of silently loading',()=>{
 const a=app(JSON.stringify({schema:'unknown',goals:[goal('bad')]}));
 assert.match(a.get('status').textContent,/Formato/);assert.equal(a.get('count-all').textContent,0);
});
