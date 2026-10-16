import test from 'node:test';import assert from 'node:assert/strict';
import {prepareUniversalAccess} from '../packages/ai/universal-access.mjs';
test('requires consent',()=>assert.throws(()=>prepareUniversalAccess({ctx:{userId:'u',role:'operator'},consent:{granted:false},sourceRef:'s',purpose:'p',scope:'x',data:{}}),/CONSENT_REQUIRED/));
test('prepares sanitized envelope',()=>{const r=prepareUniversalAccess({ctx:{userId:'u',role:'operator'},consent:{granted:true,purpose:'p'},sourceRef:'drive:file',purpose:'p',scope:'analysis',data:{email:'a@b.com'}});assert.equal(r.providerCallPerformed,false);assert.equal(r.prepared.data.email,'[EMAIL_REDACTED]');assert.equal(r.prepared.sha256.length,64);});
