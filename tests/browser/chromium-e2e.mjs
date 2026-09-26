import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,rmSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer as createNetServer } from 'node:net';
import { application } from '../../src/server/app.ts';
import { PaymentService } from '../../src/service/payment-service.ts';
import { offlineChain } from '../../src/stellar/offline.ts';
import { admin,agent,delivery,fixture,plan } from '../fixtures.ts';

const reportDir=resolve(process.env.HITO_BROWSER_REPORT_DIR??'reports/browser-e2e');
mkdirSync(reportDir,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'hito-chromium-'));
let f,server,chromium,ws;
const pending=new Map();
let chromiumError;
try{
f=fixture();
const malicious='<img src=x onerror="window.__hitoXss=1">';
const maliciousPlan={...plan(),title:malicious,description:`Texto no ejecutable ${malicious}`};
const work=f.svc.save(agent,'demo',{plan:maliciousPlan},'browser-xss');
f.svc.seal(admin,work.id,{expectedVersion:1},'browser-seal');
f.svc.deliver(agent,work.id,delivery(),'browser-delivery');
const config={adminToken:randomBytes(32).toString('hex'),agentToken:randomBytes(32).toString('hex'),agentProjects:['demo'],db:':memory:',port:0,origin:'',mode:'local',contractId:'UNCONFIGURED_TESTNET_CONTRACT',rpcUrl:'https://soroban-testnet.stellar.org'};
server=application(config,f.svc,new PaymentService(f.svc,offlineChain()));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
config.port=server.address().port;config.origin=`http://127.0.0.1:${config.port}`;

async function freePort(){const s=createNetServer();await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));const port=s.address().port;await new Promise(resolve=>s.close(resolve));return port;}
const debugPort=await freePort();
chromium=spawn(process.env.CHROMIUM_BIN||'chromium',[`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'--headless=new','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-sync','--disable-background-networking','about:blank'],{stdio:['ignore','ignore','pipe']});
chromium.on('error',error=>{chromiumError=error;});
let chromiumStderr='';chromium.stderr.on('data',chunk=>{chromiumStderr+=chunk.toString();});

async function pollJson(path){for(let n=0;n<100;n++){if(chromiumError)throw new Error(`Cannot start Chromium: ${chromiumError.message}. Set CHROMIUM_BIN to your Chromium executable.`);if(chromium.exitCode!==null||chromium.signalCode!==null)throw new Error(`Chromium exited before DevTools was ready: ${chromiumStderr.slice(-2000)}`);try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`);if(r.ok)return r.json();}catch{}await new Promise(resolve=>setTimeout(resolve,50));}throw new Error(`Chromium DevTools did not start: ${chromiumStderr.slice(-2000)}`);}
await pollJson('/json/version');
const target=await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();
ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
let nextId=0;
ws.addEventListener('message',event=>{const msg=JSON.parse(String(event.data));if(msg.id&&pending.has(msg.id)){const {resolve:done,reject}=pending.get(msg.id);pending.delete(msg.id);msg.error?reject(new Error(JSON.stringify(msg.error))):done(msg.result);}});
function send(method,params={}){return new Promise((done,reject)=>{const id=++nextId;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`DevTools command timed out: ${method}`));},10000);pending.set(id,{resolve:value=>{clearTimeout(timer);done(value);},reject:error=>{clearTimeout(timer);reject(error);}});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const out=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(out.exceptionDetails)throw new Error(`${out.exceptionDetails.exception?.description??out.exceptionDetails.text} at ${out.exceptionDetails.lineNumber}:${out.exceptionDetails.columnNumber}`);return out.result.value;}
async function waitFor(expression,message){for(let n=0;n<100;n++){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,50));}throw new Error(message);}
async function navigate(url){await send('Page.navigate',{url});await waitFor(`document.readyState==='complete'`,`Page did not load ${url}`);}
async function screenshot(name){const out=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(join(reportDir,name),Buffer.from(out.data,'base64'));}

const results=[];
  await Promise.all([send('Page.enable'),send('Runtime.enable'),send('Network.enable')]);
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate(config.origin+'/');
  const csp=await evaluate(`fetch('/').then(r=>r.headers.get('content-security-policy'))`);
  assert.match(csp,/script-src 'self'/);assert.match(csp,/frame-ancestors 'none'/);results.push('desktop CSP headers');
  await evaluate(`(()=>{const input=document.querySelector('#token');input.value=${JSON.stringify(config.adminToken)};document.querySelector('#connect').click();return true})()`);
  await waitFor(`document.querySelector('#connection').textContent.includes('admin')`,'Admin UI did not connect');
  const security=await evaluate(`({input:document.querySelector('#token').value,local:Object.keys(localStorage),session:Object.keys(sessionStorage),cookie:document.cookie,htmlHasToken:document.documentElement.outerHTML.includes(${JSON.stringify(config.adminToken)})})`);
  assert.deepEqual(security,{input:'',local:[],session:[],cookie:'',htmlHasToken:false});results.push('ephemeral token absent from input/storage/cookie/DOM');
  await waitFor(`[...document.querySelectorAll('#works button')].some(x=>x.textContent.includes(${JSON.stringify(malicious)}))`,'Work button did not appear');
  await evaluate(`(()=>{[...document.querySelectorAll('#works button')].find(x=>x.textContent.includes(${JSON.stringify(malicious)})).click();return true})()`);
  await waitFor(`document.querySelector('#detail h2')?.textContent===${JSON.stringify(malicious)}`,'Malicious-title work did not open');
  const escaped=await evaluate(`({title:document.querySelector('#detail h2').textContent,titleHtml:document.querySelector('#detail h2').innerHTML,injected:!!document.querySelector('#detail h2 img'),evidence:document.querySelector('#detail').textContent.includes('Evidencias registradas (1)'),declared:document.querySelector('#detail').textContent.includes('self_reported')})`);
  assert.equal(escaped.title,malicious);assert.equal(escaped.injected,false);assert.match(escaped.titleHtml,/&lt;img/);assert.equal(escaped.evidence,true);assert.equal(escaped.declared,true);results.push('untrusted plan/evidence rendered as text');
  const inlineBlocked=await evaluate(`(async()=>{window.__hitoInline=0;window.__hitoViolations=0;addEventListener('securitypolicyviolation',()=>window.__hitoViolations++);const d=document.createElement('div');d.innerHTML='<img src="/missing-xss" onerror="window.__hitoInline=1">';document.body.append(d);await new Promise(r=>setTimeout(r,250));return {executed:window.__hitoInline,violations:window.__hitoViolations}})()`);
  assert.equal(inlineBlocked.executed,0);assert.ok(inlineBlocked.violations>=1);results.push('inline event-handler XSS blocked by CSP');
  await screenshot('ui-desktop-1440.png');

  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  const mobile=await evaluate(`({width:innerWidth,columns:getComputedStyle(document.querySelector('.layout')).gridTemplateColumns,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth})`);
  assert.equal(mobile.width,390);assert.equal(mobile.overflow,0);assert.equal(mobile.columns,'354px');results.push('mobile 390px single-column layout without horizontal overflow');
  await screenshot('ui-mobile-390.png');

  const wallet=await evaluate(`(async()=>{
    const source='G'+'A'.repeat(55),other='G'+'B'.repeat(55),testnet='Test SDF Network ; September 2015';let mode='success',requests=[];
    addEventListener('message',event=>{const d=event.data;if(d?.source!=='FREIGHTER_EXTERNAL_MSG_REQUEST')return;requests.push(d.type);let out={source:'FREIGHTER_EXTERNAL_MSG_RESPONSE',messagedId:d.messageId};if(d.type==='REQUEST_ACCESS'){out.publicKey=source;if(mode==='denied')out.apiError={message:'denied'};if(mode==='wallet')out.publicKey=other;}else if(d.type==='REQUEST_NETWORK_DETAILS'){out.networkDetails={network:'TESTNET',networkPassphrase:mode==='network'?'Public Global Stellar Network ; September 2015':testnet};}else if(d.type==='SUBMIT_TRANSACTION'){out.signedTransaction='SIGNED_XDR';out.signerAddress=mode==='signer'?other:source;}postMessage(out,location.origin);});
    const {signIntent}=await import('/wallet.bundle.js?browser-e2e=1');const call=async(next,intent={source,unsignedXdr:'UNSIGNED_XDR',expiresAt:Math.floor(Date.now()/1000)+60})=>{mode=next;requests=[];try{return {ok:await signIntent(intent),requests}}catch(e){return {error:e.message,requests}}};
    return {expired:await call('success',{source,unsignedXdr:'UNSIGNED_XDR',expiresAt:1}),denied:await call('denied'),wallet:await call('wallet'),network:await call('network'),signer:await call('signer'),success:await call('success')};
  })()`);
  assert.match(wallet.expired.error,/Expired/);assert.deepEqual(wallet.expired.requests,[]);
  assert.match(wallet.denied.error,/denied/i);assert.match(wallet.wallet.error,/public account/);assert.match(wallet.network.error,/TESTNET/);assert.match(wallet.signer.error,/wrong account/);assert.equal(wallet.success.ok,'SIGNED_XDR');results.push('Freighter denial/account/network/expiry/signer guards with mocked extension transport');

  await navigate(config.origin+'/');
  const afterReload=await evaluate(`({input:document.querySelector('#token').value,connection:document.querySelector('#connection').textContent,local:Object.keys(localStorage),session:Object.keys(sessionStorage),htmlHasToken:document.documentElement.outerHTML.includes(${JSON.stringify(config.adminToken)})})`);
  assert.deepEqual(afterReload,{input:'',connection:'No conectado',local:[],session:[],htmlHasToken:false});results.push('reload does not restore credentials');
  const report={browser:'Chromium',version:(await pollJson('/json/version')).Browser,profile:'ephemeral-deleted',viewportTests:[1440,390],walletTransport:'simulated; no extension loaded or real signatures',results};
  writeFileSync(join(reportDir,'browser-e2e.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}finally{
  for(const request of pending.values())request.reject(new Error('Browser test ended'));
  pending.clear();
  if(ws && ws.readyState!==WebSocket.CLOSED)ws.close();
  if(chromium?.pid && chromium.exitCode===null && chromium.signalCode===null){
    await new Promise(resolve=>{
      const timer=setTimeout(()=>chromium.kill('SIGKILL'),2000);
      chromium.once('exit',()=>{clearTimeout(timer);resolve();});
      chromium.kill('SIGTERM');
    });
  }
  if(server?.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  f?.db.close();
  rmSync(profile,{recursive:true,force:true});
}
