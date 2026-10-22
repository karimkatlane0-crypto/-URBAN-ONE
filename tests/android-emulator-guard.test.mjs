import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

for(const scenario of ['physical','ambiguous'])test('emulator smoke refuses '+scenario+' devices before installation',()=>{
  const dir=mkdtempSync(join(tmpdir(),'urban-emulator-'));
  try{
    const devices=scenario==='physical'?'personal-phone\tdevice':'emulator-5554\tdevice\nemulator-5556\tdevice';
    writeFileSync(join(dir,'adb'),'#!/usr/bin/env node\n'+
      'require("fs").appendFileSync("commands.txt",process.argv.slice(2).join(" ")+"\\n");\n'+
      'if(process.argv[2]==="devices")console.log('+JSON.stringify('List of devices attached\n'+devices)+');\n',{mode:0o755});
    const result=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/android-emulator-smoke.mjs',import.meta.url))],{cwd:dir,env:{...process.env,PATH:dir+':'+process.env.PATH},encoding:'utf8',timeout:10000});
    assert.equal(result.status,1);
    const report=JSON.parse(readFileSync(join(dir,'release/emulator-unknown.json'),'utf8'));
    assert.equal(report.error,'SINGLE_EMULATOR_REQUIRED');
    assert.equal(report.physicalRedmiVerified,false);
    assert.doesNotMatch(readFileSync(join(dir,'commands.txt'),'utf8'),/install|am start/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
