import {mkdirSync,readdirSync,copyFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
export function buildPages(output){
  mkdirSync(dirname(output),{recursive:true});
  // Require a fresh output directory so stale files cannot enter the deployment.
  mkdirSync(output);
  copyFileSync(join(root,'index.html'),join(output,'index.html'));
  function copyPublic(relative){
    mkdirSync(join(output,relative),{recursive:true});
    for(const entry of readdirSync(join(root,relative),{withFileTypes:true})){
      const path=join(relative,entry.name);
      if(entry.isDirectory())copyPublic(path);
      else if(entry.isFile()&&(/^[a-z0-9-]+\.(html|css|svg|webmanifest)$/.test(entry.name)||path==='apps/web/seva-titans-manifest.json'||['apps/web/pole-position.js','apps/web/pole-premium.js','apps/web/eu-language-selector.js','apps/web/seva-titans-relations.js','apps/web/seva-titans-policy.js'].includes(path)))copyFileSync(join(root,path),join(output,path));
      else throw Error('UNSUPPORTED_PUBLIC_ASSET: '+path);
    }
  }
  copyPublic('apps/web');
  // Publish the Mobile workspace at a route inside the public Pages artifact.
  // Its relative assets resolve against apps/web and remain subject to the same package allowlist.
  copyFileSync(join(root,'apps/mobile/www/titans-enterprise-studio.html'),join(output,'apps/web/titans-enterprise-studio-mobile.html'));
  return output;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(buildPages(join(root,'dist/pages')));
