import test from 'node:test';import assert from 'node:assert/strict';import {relayStatus} from '../packages/relay/relay.mjs';
test('relay fail-closed without config',()=>{const s=relayStatus({});assert.equal(s.enabled,false);assert.ok(s.missing.length===3)});
