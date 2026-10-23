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
      else if(entry.isFile()&&(/^[a-z0-9-]+\.(html|css|svg|webmanifest)$/.test(entry.name)||['apps/web/pole-position.js','apps/web/pole-premium.js'].includes(path)))copyFileSync(join(root,path),join(output,path));
      else throw Error('UNSUPPORTED_PUBLIC_ASSET: '+path);
    }
  }
  copyPublic('apps/web');
  return output;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(buildPages(join(root,'dist/pages')));
