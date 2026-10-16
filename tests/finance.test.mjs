import test from 'node:test';import assert from 'node:assert/strict';import {preparePis} from '../packages/finance/psd2.mjs';
test('PIS requires human approval',()=>assert.throws(()=>preparePis({amount:100,currency:'EUR',beneficiary:'x'}),/HUMAN_APPROVAL_REQUIRED/));
