import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const page=read('apps/web/insights-free.html');
test('legacy INSIGHTS Free route redirects to the unified paid INSIGHTS.ai service',()=>{
 assert.match(page,/url=\.\/insights-ai\.html/);
 assert.match(page,/INSIGHTS\.ai · Unified Intelligence/);
 assert.match(page,/servizio unificato a pagamento/i);
 assert.match(page,/href="\.\/instance-manager\.html"/);
});
test('legacy route does not offer free pricing, checkout or provider access',()=>{
 assert.doesNotMatch(page,/FREE · SELF-SERVICE · LOCAL-FIRST|prezzo gratuito|free trial|checkout\.sessions/i);
 assert.match(page,/nessuna attivazione gratuita/i);
});
