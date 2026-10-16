import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const cfg=fs.readFileSync(new URL('../apps/mobile/capacitor.config.ts',import.meta.url),'utf8');
test('mobile is local-first',()=>{assert.doesNotMatch(cfg,/server:\s*\{[^}]*url\s*:/s);assert.match(cfg,/webDir:\s*'www'/);});
