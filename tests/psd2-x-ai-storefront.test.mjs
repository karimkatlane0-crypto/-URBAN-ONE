import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const store=read('apps/web/psd2-x-ai.html');
const home=read('apps/web/index.html');
const other=read('apps/web/financial-insights.html');

test('PSD2 X A.I. is publicly discoverable from URBAN ONE web routes',()=>{
 assert.match(home,/href="\.\/psd2-x-ai\.html"/);
 assert.match(other,/href="\.\/psd2-x-ai\.html"/);
 assert.match(store,/<h1>PSD2 X A\.I\.<\/h1>/);
 assert.match(store,/29,00 €/);
});

test('Monthly subscription not misleadingly active; old regulated PSD2 checkout excluded',()=>{
 assert.match(store,/Non è ancora un abbonamento con addebito automatico/);
 assert.match(store,/Non vengono venduti come attivi accesso automatico ai conti AIS/);
 assert.match(store,/Un report mensile concordato/);
 assert.doesNotMatch(store,/https:\/\/buy\.stripe\.com\/9B65kF9hv6GG4HxcD0b7y02/);
});

test('Stripe checkout is existing verified one-time and protected by contract disclosure',()=>{
 assert.match(store,/https:\/\/buy\.stripe\.com\/7sYbJ351fghgei7auSb7y05/);
 assert.match(store,/target="_blank" rel="noopener noreferrer"/);
 assert.match(store,/Accetta il preventivo/);
 assert.match(store,/Pagamento una tantum/);
 assert.doesNotMatch(store,/\bIT[0-9]{2}[A-Z][0-9]{22}\b|sk_(?:live|test)_|whsec_/i);
 assert.doesNotMatch(store,/<script|<form|googletagmanager|google-analytics|fbq\(/i);
});
