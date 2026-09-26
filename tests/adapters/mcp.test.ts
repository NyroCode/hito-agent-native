// Requires the actual MCP SDK; not included in the dependency-free local gate.
import test from 'node:test';import assert from 'node:assert/strict';import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { application } from '../../src/server/app.ts';import { PaymentService } from '../../src/service/payment-service.ts';import { offlineChain } from '../../src/stellar/offline.ts';import { admin,delivery,fixture,plan,project } from '../fixtures.ts';import type { AddressInfo } from 'node:net';
function toolJson<T>(value:unknown):T {
 const r=value as {isError?:boolean;content?:unknown};assert.notEqual(r.isError,true);const contents=r.content as {type:string;text?:string}[];assert.equal(contents[0]?.type,'text');return JSON.parse(contents[0]?.text??'null') as T;
}
test('real MCP supports discovery, scoped draft edits, retries, progress, evidence and payment requests',async t=>{
 const f=fixture();const config={adminToken:'a'.repeat(64),agentToken:'b'.repeat(64),agentProjects:['demo'],db:':memory:',port:0,origin:'',mode:'local' as const,contractId:'UNCONFIGURED_TESTNET_CONTRACT',rpcUrl:'https://soroban-testnet.stellar.org'};
 f.svc.createProject(admin,{...project,id:'private'},'private-project');
 const privateWork=f.svc.save(admin,'private',{plan:plan()},'private-work');
 f.svc.seal(admin,f.w.id,{expectedVersion:f.w.version},'mcp-seal');
 const http=application(config,f.svc,new PaymentService(f.svc,offlineChain()));await new Promise<void>(resolve=>http.listen(0,'127.0.0.1',resolve));config.port=(http.address() as AddressInfo).port;config.origin=`http://127.0.0.1:${config.port}`;
 const client=new Client({name:'hito-test',version:'1'});const transport=new StdioClientTransport({command:process.execPath,args:['--experimental-strip-types',fileURLToPath(new URL('../../src/mcp/main.ts',import.meta.url))],env:{PATH:process.env.PATH??'',HITO_API_URL:config.origin,HITO_AGENT_TOKEN:config.agentToken},stderr:'pipe'});
 try{
  await client.connect(transport);assert.deepEqual(client.getServerVersion(),{name:'hito',version:'0.1.0'});await client.ping();
  assert.ok(client.getInstructions());
  const guide=await client.readResource({uri:'hito://guide'});const entry=guide.contents[0];assert.ok(entry&&'text' in entry);assert.equal(entry.text,client.getInstructions());
  const prompt=await client.getPrompt({name:'plan_work',arguments:{request:'Resume the import agreement'}});assert.equal(prompt.messages[0]?.role,'user');
  const list=await client.listTools();assert.deepEqual(list.tools.map(x=>x.name).sort(),['hito_check_readiness','hito_get_context','hito_get_payment_status','hito_prepare_payment','hito_save_work','hito_submit_delivery','hito_update_progress']);assert.equal(list.tools.some(x=>/sign|execute_xdr/.test(x.name)),false);
  const context=toolJson<{id:string}[]>(await client.callTool({name:'hito_get_context',arguments:{}}));assert.deepEqual(context.map(p=>p.id),['demo']);
  const denied=await client.callTool({name:'hito_get_context',arguments:{workId:privateWork.id}});assert.equal(denied.isError,true);assert.equal(JSON.parse((denied.content as {text:string}[])[0]!.text).code,'FORBIDDEN');
  const saved=toolJson<{id:string;version:number;state:string;projectId:string}>(await client.callTool({name:'hito_save_work',arguments:{projectId:'demo',plan:plan(),idempotencyKey:'mcp-save'}}));assert.equal(saved.state,'DRAFT');assert.equal(saved.projectId,'demo');
  const retry=toolJson<{id:string}>(await client.callTool({name:'hito_save_work',arguments:{projectId:'demo',plan:plan(),idempotencyKey:'mcp-save'}}));assert.equal(retry.id,saved.id);
  const changedPlan={...plan(),description:'Revised scope from the user'};
  const conflict=await client.callTool({name:'hito_save_work',arguments:{projectId:'demo',plan:changedPlan,idempotencyKey:'mcp-save'}});assert.equal(conflict.isError,true);assert.equal(JSON.parse((conflict.content as {text:string}[])[0]!.text).code,'IDEMPOTENCY_CONFLICT');
  const updated=toolJson<{id:string;version:number}>(await client.callTool({name:'hito_save_work',arguments:{projectId:'demo',workId:saved.id,expectedVersion:saved.version,plan:changedPlan,idempotencyKey:'mcp-edit'}}));assert.equal(updated.id,saved.id);assert.equal(updated.version,saved.version+1);
  const stale=await client.callTool({name:'hito_save_work',arguments:{projectId:'demo',workId:saved.id,expectedVersion:saved.version,plan:plan(),idempotencyKey:'mcp-stale'}});assert.equal(stale.isError,true);assert.deepEqual(JSON.parse((stale.content as {text:string}[])[0]!.text),{error:'Reload before editing',code:'VERSION_CONFLICT',status:409});
  const works=toolJson<{id:string}[]>(await client.callTool({name:'hito_get_context',arguments:{projectId:'demo'}}));assert.equal(works.length,2);
  const progress=toolJson<{status:string}>(await client.callTool({name:'hito_update_progress',arguments:{workId:saved.id,milestoneId:'one',status:'IN_PROGRESS',note:'Implementing the import; deduplication test remains pending.',idempotencyKey:'mcp-progress'}}));assert.equal(progress.status,'IN_PROGRESS');
  const resumed=toolJson<{work:{version:number;plan:{description:string}};progress:{status:string}[]}>(await client.callTool({name:'hito_get_context',arguments:{workId:saved.id}}));assert.equal(resumed.work.version,updated.version);assert.equal(resumed.work.plan.description,changedPlan.description);assert.equal(resumed.progress[0]?.status,'IN_PROGRESS');
  const premature=await client.callTool({name:'hito_submit_delivery',arguments:{workId:saved.id,...delivery(),idempotencyKey:'mcp-unsealed'}});assert.equal(premature.isError,true);
  toolJson(await client.callTool({name:'hito_submit_delivery',arguments:{workId:f.w.id,...delivery('NOT_CHECKED'),idempotencyKey:'mcp-unchecked'}}));
  const blocked=toolJson<{readyForHumanReview:boolean}>(await client.callTool({name:'hito_check_readiness',arguments:{workId:f.w.id,milestoneId:'one'}}));assert.equal(blocked.readyForHumanReview,false);
  const recorded=toolJson<{evidenceHash:string;workId:string}>(await client.callTool({name:'hito_submit_delivery',arguments:{workId:f.w.id,...delivery(),idempotencyKey:'mcp-delivery'}}));assert.equal(recorded.workId,f.w.id);assert.match(recorded.evidenceHash,/^[0-9a-f]{64}$/);
  const ready=toolJson<{readyForHumanReview:boolean;automaticallyAccepted:boolean;independentVerification:boolean}>(await client.callTool({name:'hito_check_readiness',arguments:{workId:f.w.id,milestoneId:'one'}}));assert.equal(ready.readyForHumanReview,true);assert.equal(ready.automaticallyAccepted,false);assert.equal(ready.independentVerification,false);
  const intent=toolJson<{id:string;status:string;requiresWalletSignature:boolean}>(await client.callTool({name:'hito_prepare_payment',arguments:{workId:f.w.id,action:'submit',milestoneId:'one',evidenceHash:recorded.evidenceHash,idempotencyKey:'mcp-intent'}}));assert.equal(intent.status,'REQUESTED');assert.equal(intent.requiresWalletSignature,true);
  const status=toolJson<{id:string;status:string;unsignedXdr?:unknown;signedXdr?:unknown}>(await client.callTool({name:'hito_get_payment_status',arguments:{intentId:intent.id}}));assert.equal(status.id,intent.id);assert.equal(status.status,'REQUESTED');assert.equal(status.unsignedXdr,undefined);assert.equal(status.signedXdr,undefined);
  t.diagnostic(JSON.stringify({server:client.getServerVersion(),tools:list.tools.map(x=>x.name).sort(),calls:{context:'PASS',scope:'DENIED',save:saved.state,retry:'SAME_WORK',edit:'VERSION_CHECKED',progress:'RECOVERED',readiness:'BLOCKED_THEN_READY',delivery:'RECORDED',prepare:intent.status,status:status.status},stdout:'JSON-RPC only; handshake, ping and calls parsed by SDK'}));
 }
 finally{await client.close();await new Promise<void>(resolve=>http.close(()=>resolve()));f.db.close();}
});
