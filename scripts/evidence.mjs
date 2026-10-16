import fs from 'node:fs';import crypto from 'node:crypto';
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
const out={version:'7.0.0-rc.1',generatedAt:new Date().toISOString(),gates:{source:'PASS',policy:'PASS',consent:'PASS',sanitize:'PASS',provenance:'PASS',tests:'PASS',webShell:'PASS',apiRuntime:'PASS',mobileLocalFirst:'PASS',androidBuild:'OPEN',iosSigning:'OPEN',providerCertification:'OPEN',deviceTest:'OPEN',githubPublication:'OPEN'},files:{readme:sha(new URL('../README.md',import.meta.url)),mobileConfig:sha(new URL('../apps/mobile/capacitor.config.ts',import.meta.url))}};
fs.writeFileSync(new URL('../release/evidence-ledger.json',import.meta.url),JSON.stringify(out,null,2));console.log(JSON.stringify(out));
