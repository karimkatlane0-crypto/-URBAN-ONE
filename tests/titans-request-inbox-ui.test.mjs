import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const page=readFileSync(new URL('../apps/web/titans-request-inbox.html',import.meta.url),'utf8');
const onboarding=readFileSync(new URL('../apps/web/seva-titans-onboarding.html',import.meta.url),'utf8');
test('TITANS private inbox exposes one-click decisions and scoped request creation',()=>{
  assert.match(page,/<title>TITANS · Request Inbox/);
  assert.match(page,/type="password"/);
  assert.match(page,/ACCEPT/);
  assert.match(page,/DECLINE/);
  assert.match(page,/contacts:read/);
  assert.match(page,/calendar:read/);
  assert.match(page,/analytics:read/);
  assert.match(page,/skill:execute/);
  assert.match(page,/titans:request:respond/);
  assert.match(page,/titans:grant:revoke/);
  assert.match(onboarding,/titans-request-inbox\.html/);
});
test('inbox browser script is syntax-valid and does not persist tokens or use unsafe HTML injection',()=>{
  const script=page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new Script(script));
  assert.match(script,/Authorization|authorization/);
  assert.match(script,/Bearer /);
  assert.match(script,/pagehide/);
  assert.doesNotMatch(script,/localStorage|sessionStorage|document\.cookie|innerHTML|outerHTML/);
  assert.doesNotMatch(page,/<script[^>]+src=|googletagmanager|google-analytics|fbq\(/i);
});
