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
let serial, api='unknown', ws, diagnostics=[];
try {
  const devices=adb('devices').split('\n').slice(1).map(x=>x.trim().split(/\s+/)).filter(x=>x[1]==='device');
  if(devices.length!==1||!/^emulator-\d+$/.test(devices[0][0]))throw Error('SINGLE_EMULATOR_REQUIRED');
  serial=devices[0][0];
  const device=(...args)=>adb('-s',serial,...args);
  if(device('shell','getprop','ro.kernel.qemu')!=='1')throw Error('PHYSICAL_DEVICE_BLOCKED');
  api=device('shell','getprop','ro.build.version.sdk');report.api=api;
  report.webview=device('shell','dumpsys','webviewupdate').split('\n').find(line=>line.includes('Current WebView package'))?.trim()||'not_reported';
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
  const evaluationTimeoutMs=30000;
  report.evaluationTimeoutMs=evaluationTimeoutMs;
  diagnostics=[];
  ws.addEventListener('message',event=>{try{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')diagnostics.push({type:'exception',text:message.params?.exceptionDetails?.text||'unknown'});if(message.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(message.params?.type))diagnostics.push({type:message.params.type,args:(message.params.args||[]).map(x=>x.value??x.description??'').slice(0,4)});}catch{}});
  async function evaluate(expression){
    const id=++next;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{ws.removeEventListener('message',receive);report.lastEvaluation=expression.slice(0,180);reject(Error('WEBVIEW_EVALUATION_TIMEOUT'));},evaluationTimeoutMs);
      function receive(event){
        const m=JSON.parse(event.data);if(m.id!==id)return;
        clearTimeout(timer);ws.removeEventListener('message',receive);
        if(m.error||m.result?.exceptionDetails)reject(Error('WEBVIEW_SCRIPT_FAILED: '+(m.error?.message||m.result?.exceptionDetails?.exception?.description||m.result?.exceptionDetails?.text||'unknown')));
        else resolve(m.result?.result?.value);
      }
      ws.addEventListener('message',receive);
      ws.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:false,userGesture:true}}));
    });
  }
  report.phase='webview-session-ready';
  // A debuggable WebView can exist before its local document has finished loading.
  async function evaluateReadWithRetry(expression,attempts=3){
    let lastError;
    for(let attempt=0;attempt<attempts;attempt++){
      try{return await evaluate(expression);}
      catch(error){
        lastError=error;
        if(!String(error.message).includes('WEBVIEW_EVALUATION_TIMEOUT'))throw error;
        if(attempt+1<attempts)await pause(500);
      }
    }
    throw lastError;
  }
  let loaded=false,lastReadError='';
  for(let i=0;i<30;i++){
    try{
      loaded=await evaluateReadWithRetry("document.readyState==='complete' && Boolean(document.getElementById('bnbPool'))",2);
      if(loaded)break;
    }catch(error){lastReadError=error.message;}
    await pause(1000);
  }
  if(!loaded)throw Error('LOCAL_DOCUMENT_NOT_READY'+(lastReadError?': '+lastReadError:''));
  report.phase='initial-dom-check';
  const initial=await evaluateReadWithRetry("({title:document.title,pool:document.getElementById('bnbPool').textContent})");
  if(!initial.title.includes('URBAN ONE')||!initial.pool.includes('720'))throw Error('LOCAL_CALCULATOR_NOT_INITIALIZED');
  report.checks.initialCalculation=true;
  report.phase='calculator-interaction';
  const changed=await evaluate("document.getElementById('bnbFee').value='2000';document.getElementById('bnbCalc').click();document.getElementById('bnbPool').textContent");
  if(!changed.includes('440'))throw Error('LOCAL_CALCULATOR_INTERACTION_FAILED');
  report.checks.calculate=true;
  report.phase='integration-button-click';
  await evaluate("document.getElementById('checkIntegrations').click();'clicked'");
  let status='',lastStatusReadError='';
  report.phase='integration-status-poll';
  for(let i=0;i<15;i++){
    try{status=await evaluateReadWithRetry("document.getElementById('integrationStatus') ? document.getElementById('integrationStatus').textContent : ''",2);}
    catch(error){lastStatusReadError=error.message;}
    if(status.includes('non disponibile'))break;
    await pause(1000);
  }
  report.integrationStatusReadError=lastStatusReadError||null;
  report.integrationDiagnostics=diagnostics.slice(-20);
  if(!status.includes('non disponibile')){report.fallbackStatus=status;throw Error('LOCAL_SERVER_FALLBACK_FAILED');}
  report.checks.unconfiguredBackendFallback=true;
  report.phase='command-center-entry';
  const opened=await evaluate("(()=>{const link=[...document.querySelectorAll('a[href]')].find(a=>a.getAttribute('href')==='./universal-command-center.html');if(!link)return false;link.click();return true})()");
  if(!opened)throw Error('COMMAND_CENTER_ENTRY_LINK_MISSING');
  let commandCenterReady=false,lastCommandCenterError='';
  for(let i=0;i<30;i++){
    try{
      commandCenterReady=await evaluateReadWithRetry("document.readyState==='complete'&&document.title.includes('UNIVERSAL COMMAND CENTER')&&Boolean(document.getElementById('screen-info'))&&Boolean(document.getElementById('module-frame'))",2);
      if(commandCenterReady)break;
    }catch(error){lastCommandCenterError=error.message;}
    await pause(500);
  }
  if(!commandCenterReady)throw Error('COMMAND_CENTER_NOT_READY'+(lastCommandCenterError?': '+lastCommandCenterError:''));
  report.screenDiagnostics=await evaluateReadWithRetry("document.getElementById('screen-info').textContent");
  if(!report.screenDiagnostics.includes('viewport')||!report.screenDiagnostics.includes('DPR'))throw Error('COMMAND_CENTER_SCREEN_DIAGNOSTICS_MISSING');
  report.checks.commandCenterOpened=true;
  const moduleRoutes=[
    ['SEVA INTELLIGENCE','seva-unified-studio.html'],
    ['ADVANCED INSIGHTS','insights-free.html'],
    ['SYNAPSY','synapsy.html'],
    ['KKUBERA','discovery.html'],
    ['TITANS','titans-enterprise-studio.html'],
    ['URBAN ONE','v10-workspace.html'],
    ['INSTANCE MANAGER','instance-manager.html']
  ];
  for(const [label,route] of moduleRoutes){
    const clickExpression="(()=>{const button=[...document.querySelectorAll('nav[aria-label=\\\"Navigazione moduli\\\"] button')].find(b=>b.textContent.includes("+JSON.stringify(label)+"));if(!button)return false;button.click();return true})()";
    const clicked=await evaluate(clickExpression);
    if(!clicked)throw Error('COMMAND_CENTER_BUTTON_MISSING: '+label);
    let routeReady=false;
    for(let attempt=0;attempt<30;attempt++){
      try{
        routeReady=await evaluateReadWithRetry("(()=>{const frame=document.getElementById('module-frame');try{return frame.contentWindow.location.pathname.endsWith('/"+route+"')&&frame.contentDocument.readyState==='complete'}catch{return false}})()",2);
        if(routeReady)break;
      }catch{}
      await pause(300);
    }
    if(!routeReady)throw Error('COMMAND_CENTER_ROUTE_FAILED: '+route);
  }
  report.checks.commandCenterRoutes='7/7';
  report.phase='relaunch-check';
  ws.close();ws=undefined;
  device('shell','am','force-stop',pkg);
  device('shell','am','start','-W','-n',pkg+'/.MainActivity');
  await pause(3000);
  if(!device('shell','pidof',pkg))throw Error('RELAUNCH_FAILED');
  report.checks.relaunchProcess=true;report.result='PASS';
}catch(error){
  report.result='FAIL';report.error=error.message;report.phase=report.phase||'startup';report.integrationDiagnostics=diagnostics.slice(-20);process.exitCode=1;
}finally{
  ws?.close();
  if(serial)try{adb('-s',serial,'forward','--remove','tcp:9222');}catch{}
  mkdirSync('release',{recursive:true});
  writeFileSync('release/emulator-'+api+'.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
}
