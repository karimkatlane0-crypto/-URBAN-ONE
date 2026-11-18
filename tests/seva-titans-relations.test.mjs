import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../apps/web/seva-titans-relations.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../apps/web/seva-titans-relations.js',import.meta.url),'utf8');
const hub=fs.readFileSync(new URL('../apps/web/seva-titans-hub.html',import.meta.url),'utf8');

test('public research requires explicit per-query acknowledgement',()=>{
 assert.ok(html.includes('id="research-consent"'));
 assert.ok(js.includes("if(!$('research-consent').checked)"));
 assert.ok(js.includes('window.open(url'));
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
test('public source ledger preserves unverified provenance',()=>{
 assert.ok(js.includes('user-recorded-not-independently-verified'));
 assert.ok(html.includes('Fonti raccolte'));
});
test('share request is a local draft; acceptance and denial require evidence',()=>{
 assert.ok(js.includes('draft-only-not-sent'));
 assert.ok(js.includes('accepted-evidence-recorded-not-verified'));
 assert.ok(js.includes('denied-evidence-recorded'));
 assert.ok(js.includes('validUrl(proof)'));
 assert.ok(html.includes('non trasferisce recapiti'));
});
test('Calendar opens a prefilled user-reviewed draft, no API write',()=>{
 assert.ok(html.includes('id="calendar-consent"'));
 assert.ok(js.includes('calendar.google.com/calendar/render'));
 assert.ok(js.includes("window.open('https://calendar.google.com/calendar/render?"));
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
test('selected contact vCard and CSV export are supported',()=>{
 assert.ok(html.includes('export-vcard')); assert.ok(html.includes('id="export-contacts"'));
 assert.ok(js.includes("$('export-contacts').selectedOptions"));
 assert.ok(js.includes('text/vcard'));
 assert.ok(hub.includes('data-pick='));
 assert.ok(hub.includes('exportRows=selected.length?rows.filter'));
});
test('account separation and no OAuth secrets are preserved',()=>{
 assert.ok(html.includes('Google Contacts OAuth'));
 assert.ok(js.includes('seva.titans.contacts.local.v1'));
 assert.doesNotMatch(js,/access_token|refresh_token|client_secret/i);
});
