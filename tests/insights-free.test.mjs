import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const page=read('apps/web/insights-free.html');
test('INSIGHTS Free is discoverable from UNIVERSAL 36 and keeps the executive dashboard local-first',()=>{
 const home=read('apps/web/universal-36.html');
 assert.match(home,/insights-free\.html/);
 assert.match(page,/FREE · SELF-SERVICE · LOCAL-FIRST/);
 assert.match(page,/financial-dashboard\.html/);
 assert.match(page,/loading="lazy" referrerpolicy="no-referrer"/);
});
test('INSIGHTS Free states terms, limitations and no implied provider integrations',()=>{
 assert.match(page,/nessun prezzo, carta, prova a pagamento o rinnovo/i);
 assert.match(page,/Nessuna connessione bancaria, Open Banking, Power BI, ERP o provider AI è implicita/);
 assert.match(page,/Nessun rinnovo o addebito automatico/);
 assert.match(page,/non è un prodotto affiliato o approvato da Ernst & Young/i);
 assert.doesNotMatch(page,/sk_(?:live|test)_|whsec_|IT\\d{2}[A-Z]\\d{22}/i);
});
