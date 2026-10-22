import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {once} from 'node:events';

// CI emulator only: never install onto a connected personal/physical device.
const adb=(...args)=>execFileSync('adb',args,{encoding:'utf8',timeout:30000}).trim();
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const pkg='com.urbanone.universal';
const apk='apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk';
const report={kind:'android_emulator_only',physicalRedmiVerified:false,providerLiveVerified:false,checks:{}};
let serial, api='unknown', ws;
try {
  const devices=adb('devices').split('\n').slice(1).map(x=>x.trim().split(/\s+/)).filter(x=>x[1]==='device');
  if(devices.length!==1||!/^emulator-\d+$/.test(devices[0][0]))throw Error('SINGLE_EMULATOR_REQUIRED');
  serial=devices[0][0];
  const device=(...args)=>adb('-s',serial,...args);
  if(device('shell','getprop','ro.kernel.qemu')!=='1')throw Error('PHYSICAL_DEVICE_BLOCKED');
  api=device('shell','getprop','ro.build.version.sdk');report.api=api;
  report.apkSha256=createHash('sha256').update(readFileSync(apk)).digest('hex');
  device('install','-r',apk);report.checks.install=true;
  device('shell','am','force-stop',pkg);
  device('shell','am','start','-W','-n',pkg+'/.MainActivity');
  let pages=[];
  for(let i=0;i<45;i++){
    try{
      const pid=device('shell','pidof',pkg).split(/\s+/)[0];
      device('forward','tcp:9222','localabstract:webview_devtools_remote_'+pid);
      pages=await fetch('http://127.0.0.1:9222/json',{signal:AbortSignal.timeout(1500)}).then(r=>r.json());
      if(pages.some(x=>x.webSocketDebuggerUrl))break;
    }catch{}
    await pause(1000);
  }
  const page=pages.find(x=>x.webSocketDebuggerUrl&&x.url.startsWith('https://localhost'));
  if(!page)throw Error('LOCAL_WEBVIEW_NOT_READY');
  report.checks.launch=true;report.origin=page.url;
  ws=new WebSocket(page.webSocketDebuggerUrl);await once(ws,'open');
  let next=0;
  async function evaluate(expression){
    const id=++next;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{ws.removeEventListener('message',receive);reject(Error('WEBVIEW_EVALUATION_TIMEOUT'));},12000);
      function receive(event){
        const m=JSON.parse(event.data);if(m.id!==id)return;
        clearTimeout(timer);ws.removeEventListener('message',receive);
        if(m.error||m.result?.exceptionDetails)reject(Error('WEBVIEW_SCRIPT_FAILED'));
        else resolve(m.result?.result?.value);
      }
      ws.addEventListener('message',receive);
      ws.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}));
    });
  }
  const initial=await evaluate("({title:document.title,pool:document.getElementById('bnbPool').textContent})");
  if(!initial.title.includes('URBAN ONE')||!initial.pool.includes('720'))throw Error('LOCAL_CALCULATOR_NOT_INITIALIZED');
  report.checks.initialCalculation=true;
  const changed=await evaluate("document.getElementById('bnbFee').value='2000';document.getElementById('bnbCalc').click();document.getElementById('bnbPool').textContent");
  if(!changed.includes('440'))throw Error('LOCAL_CALCULATOR_INTERACTION_FAILED');
  report.checks.calculate=true;
  await evaluate("document.getElementById('checkIntegrations').click();true");
  let status='';
  for(let i=0;i<12;i++){
    status=await evaluate("document.getElementById('integrationStatus').textContent");
    if(status.includes('non disponibile'))break;
    await pause(1000);
  }
  if(!status.includes('non disponibile'))throw Error('LOCAL_SERVER_FALLBACK_FAILED');
  report.checks.unconfiguredBackendFallback=true;
  ws.close();ws=undefined;
  device('shell','am','force-stop',pkg);
  device('shell','am','start','-W','-n',pkg+'/.MainActivity');
  await pause(3000);
  if(!device('shell','pidof',pkg))throw Error('RELAUNCH_FAILED');
  report.checks.relaunchProcess=true;report.result='PASS';
}catch(error){
  report.result='FAIL';report.error=error.message;process.exitCode=1;
}finally{
  ws?.close();
  if(serial)try{adb('-s',serial,'forward','--remove','tcp:9222');}catch{}
  mkdirSync('release',{recursive:true});
  writeFileSync('release/emulator-'+api+'.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
}
