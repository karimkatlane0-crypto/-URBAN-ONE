import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_COMMAND_CAPACITY,AI_COMMAND_MAX_PAGE_SIZE,createCommandRegistry,aiCommandCapabilities} from '../packages/ai/commands.mjs';

test('AI command capability advertises a bounded 100000-command registry and 100000 max page size',()=>{
  const capability=aiCommandCapabilities();
  assert.equal(capability.registry,true);
  assert.equal(capability.capacity,100000);
  assert.equal(capability.maxPageSize,100000);
  assert.equal(AI_COMMAND_MAX_PAGE_SIZE,100000);
  assert.equal(capability.providerExecution,false);
  assert.equal(capability.executionGate,'PROVIDER_EXECUTION_REQUIRES_CERTIFIED_RUNTIME');
});

test('AI command registry accepts exactly 100000 registered commands, lists all 100000, and fails closed above the cap',()=>{
  const registry=createCommandRegistry();
  for(let i=0;i<AI_COMMAND_CAPACITY;i++) registry.register({id:`cmd-${i}`,mode:'read'});
  assert.equal(registry.size,AI_COMMAND_CAPACITY);
  const page=registry.list({offset:0,limit:AI_COMMAND_MAX_PAGE_SIZE});
  assert.equal(page.total,AI_COMMAND_CAPACITY);
  assert.equal(page.items.length,AI_COMMAND_CAPACITY);
  assert.throws(()=>registry.register({id:'cmd-over-cap',mode:'read'}),/AI_COMMAND_CAPACITY_EXCEEDED/);
  assert.throws(()=>registry.list({limit:AI_COMMAND_MAX_PAGE_SIZE+1}),/AI_COMMAND_LIMIT_INVALID/);
});

test('AI command registry rejects duplicates and paginates safely',()=>{
  const registry=createCommandRegistry({capacity:3});
  registry.register({id:'research.lookup',mode:'read'});
  registry.register({id:'provider.prepare',mode:'prepare'});
  assert.throws(()=>registry.register({id:'research.lookup',mode:'read'}),/AI_COMMAND_DUPLICATE/);
  const page=registry.list({offset:1,limit:1});
  assert.equal(page.total,2);
  assert.deepEqual(page.items.map(item=>item.id),['provider.prepare']);
});
