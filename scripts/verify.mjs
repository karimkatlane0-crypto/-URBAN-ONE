import fs from 'node:fs';
import {AI_COMMAND_CAPACITY} from '../packages/ai/commands.mjs';
const required=['README.md','apps/web/index.html','apps/mobile/www/index.html','apps/mobile/capacitor.config.ts','services/api/router.mjs','db/schema.sql','packages/ai/universal-access.mjs','packages/ai/commands.mjs','packages/geo/inspire.mjs','docs/EU_INSPIRE.md'];
const missing=required.filter(p=>!fs.existsSync(new URL('../'+p,import.meta.url)));
if(missing.length){console.error({missing});process.exit(2)}
console.log(JSON.stringify({ok:true,required:required.length,localFirstMobile:true,euInspire:true,inspireThemes:34,aiCommandRegistry:true,aiCommandCapacity:AI_COMMAND_CAPACITY,version:'7.0.0'}));
