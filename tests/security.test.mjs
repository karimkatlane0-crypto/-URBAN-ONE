import test from 'node:test';import assert from 'node:assert/strict';
import {sanitizeText} from '../packages/security/sanitize.mjs';
import {authorize} from '../packages/security/policy.mjs';
test('PII sanitizer redacts',()=>assert.match(sanitizeText('mail a@b.com IBAN IT60X0542811101000000123456'),/REDACTED/));
test('viewer cannot prepare provider',()=>assert.equal(authorize({role:'viewer',scope:'prepare:provider'}),false));
