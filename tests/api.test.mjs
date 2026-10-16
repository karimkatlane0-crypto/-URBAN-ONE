import test from 'node:test';import assert from 'node:assert/strict';
import {route} from '../services/api/router.mjs';
test('health is public and versioned',()=>{const r=route({method:'GET',path:'/health'});assert.equal(r.status,200);assert.equal(r.body.ok,true);assert.equal(r.body.version,'7.0.0-rc.1');});
test('universal status is fail-closed without provider config',()=>{const r=route({method:'GET',path:'/api/universal/status'},{});assert.equal(r.status,200);assert.equal(r.body.providers.openai,false);assert.equal(r.body.providers.gemini,false);assert.equal(r.body.relay.enabled,false);});
