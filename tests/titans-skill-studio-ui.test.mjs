import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const page=readFileSync(new URL('../apps/web/titans-skill-studio.html',import.meta.url),'utf8');
test('partner skill studio is a local draft-only manifest builder',()=>{
  assert.match(page,/Partner Skill Creator/);
  assert.match(page,/executionEnabled:false/);
  assert.match(page,/publishable:false/);
  assert.match(page,/requiresHumanApproval:true/);
  assert.match(page,/DENY_BY_DEFAULT/);
  assert.match(page,/Esporta manifest JSON/);
});
test('skill studio script is valid and cannot execute or publish provider actions',()=>{
  const script=page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new Script(script));
  assert.doesNotMatch(script,/fetch\s*\(|localStorage|sessionStorage|innerHTML|document\.cookie|payments\.create|send\.email|deploy\s*\(/i);
});
