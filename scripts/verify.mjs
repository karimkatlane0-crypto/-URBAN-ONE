import fs from 'node:fs';
const required=['README.md','apps/web/index.html','apps/mobile/www/index.html','apps/mobile/capacitor.config.ts','services/api/router.mjs','db/schema.sql','packages/ai/universal-access.mjs'];
const missing=required.filter(p=>!fs.existsSync(new URL('../'+p,import.meta.url)));
if(missing.length){console.error({missing});process.exit(2)}
console.log(JSON.stringify({ok:true,required:required.length,localFirstMobile:true,version:'7.0.0-rc.1'}));
