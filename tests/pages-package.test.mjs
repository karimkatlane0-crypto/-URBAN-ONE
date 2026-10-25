import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildPages} from '../scripts/build-pages.mjs';

test('Pages package resolves its entry and every relative page/asset link without publishing the repository',()=>{
  const dir=mkdtempSync(join(tmpdir(),'urban-pages-'));
  try{
    const output=buildPages(join(dir,'site'));
    const entry=readFileSync(join(output,'index.html'),'utf8');
    const redirect=entry.match(/http-equiv="refresh" content="0; url=([^"]+)"/)[1];
    assert.ok(existsSync(join(output,redirect)));
    const landing=readFileSync(join(output,redirect),'utf8');
    assert.match(landing,/UNICORN WORKSPACE/);
    assert.match(landing,/href="\.\/index\.html"/);
    assert.match(readFileSync(join(output,'apps/web/index.html'),'utf8'),/checkIntegrations/);
    let checked=0;
    function walk(path){
      for(const file of readdirSync(path,{withFileTypes:true})){
        const absolute=join(path,file.name);
        if(file.isDirectory()){walk(absolute);continue;}
        if(!file.name.endsWith('.html'))continue;
        for(const [,href] of readFileSync(absolute,'utf8').matchAll(/(?:href|src)="([^"]+)"/g)){
          if(/^(?:[a-z]+:|\/\/|#)/i.test(href))continue;
          const target=new URL(href,new URL('file://'+absolute));
          assert.ok(existsSync(target),absolute+': '+href);checked++;
        }
      }
    }
    walk(output);assert.ok(checked>10);
    for(const name of ['services','packages','db','.env','README.md','.github'])assert.equal(existsSync(join(output,name)),false,name);
    assert.throws(()=>buildPages(output),/EEXIST/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
