import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, symlinkSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const root = fileURLToPath(new URL('../../', import.meta.url));
async function run(args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore','pipe','pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', b => { stdout += b; }); child.stderr.on('data', b => { stderr += b; });
  const timer = setTimeout(() => child.kill(), 20000);
  try { const [code] = await once(child, 'close'); assert.equal(code, 0, stderr); return stdout; }
  finally { clearTimeout(timer); }
}
test('fresh setup, seed, doctor, generated MCP and CLI work from another project with spaced paths', { timeout: 40000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hito install '));
  const project = join(dir, 'other project'); mkdirSync(project);
  const env: Record<string,string> = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string,string] => entry[1] !== undefined));
  for (const key of Object.keys(env)) if (key.startsWith('HITO_')) delete env[key];
  for (const name of ['src','scripts','.agents','package.json']) cpSync(join(root, name), join(dir, name), { recursive: true });
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const reservation = createServer(); await new Promise<void>(r => reservation.listen(0, '127.0.0.1', r));
  const port = (reservation.address() as {port:number}).port;
  await new Promise<void>(r => reservation.close(() => r()));
  let backend: ReturnType<typeof spawn> | undefined;
  let backendClosed: Promise<unknown> | undefined;
  try {
    await run([join(dir, 'scripts/setup.mjs'), '--port', String(port), '--projects', 'demo,own-project'], dir, env);
    await run([join(dir, 'scripts/configure-agent.mjs')], project, env);
    const adminFile = readFileSync(join(dir, '.env'), 'utf8');
    const adminToken = adminFile.match(/^HITO_ADMIN_TOKEN=(.+)$/m)![1];
    const agentToken = adminFile.match(/^HITO_AGENT_TOKEN=(.+)$/m)![1];
    const generated = JSON.parse(readFileSync(join(dir, 'config/generated/claude-code.json'), 'utf8'));
    assert.equal(JSON.stringify(generated).includes(adminToken), false);
    assert.equal(JSON.stringify(generated).includes(agentToken), false);
    assert.ok(readFileSync(join(dir, 'config/generated/hito/SKILL.md'), 'utf8').includes('hito_get_context'));
    backend = spawn(process.execPath, ['--env-file=.env','--experimental-strip-types','src/server/main.ts'], { cwd: dir, env, stdio: 'ignore' });
    backendClosed = once(backend, 'close');
    let online = false;
    for (let n = 0; n < 100; n++) {
      try { if ((await fetch(`http://127.0.0.1:${port}/healthz`)).ok) { online = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 25));
    }
    assert.equal(online, true, 'Temporary backend did not start');
    await run(['--env-file=.env','--experimental-strip-types','scripts/seed.ts'], dir, env);
    const doctor = await run(['--experimental-strip-types',join(dir,'scripts/doctor.mjs')], project, env);
    assert.match(doctor, /7 tools available/); assert.match(doctor, /demo, own-project/);
    assert.equal(doctor.includes(adminToken), false); assert.equal(doctor.includes(agentToken), false);
    const cli = join(dir, 'src/cli/main.ts');
    const projects = JSON.parse(await run(['--experimental-strip-types',cli,'projects'], project, env));
    assert.deepEqual(projects.map((p:{id:string}) => p.id), ['demo']);
    const works = JSON.parse(await run(['--experimental-strip-types',cli,'works','demo'], project, env));
    assert.equal(works.length, 1);
    writeFileSync(join(project,'plan.json'), JSON.stringify({plan:works[0].plan}));
    const writeEnv = {...env,HITO_IDEMPOTENCY_KEY:'onboarding-work'};
    const saved = JSON.parse(await run(['--experimental-strip-types',cli,'save','demo','plan.json'], project, writeEnv));
    const retry = JSON.parse(await run(['--experimental-strip-types',cli,'save','demo','plan.json'], project, writeEnv));
    assert.equal(saved.id, retry.id);
    const invalid = spawnSync(process.execPath, ['--experimental-strip-types',cli,'works','../bad'], {cwd:project,env,encoding:'utf8'});
    assert.notEqual(invalid.status, 0); assert.match(invalid.stderr, /valid resource ID/);
    const client = new Client({name:'onboarding-host',version:'1'});
    const entry = generated.mcpServers.hito;
    try {
      await client.connect(new StdioClientTransport({command:entry.command,args:entry.args,cwd:project,env,stderr:'pipe'}));
      const response = await client.callTool({name:'hito_get_context',arguments:{workId:saved.id}});
      assert.notEqual(response.isError, true);
      assert.equal(JSON.parse((response.content as {text:string}[])[0].text).work.id, saved.id);
    } finally { await client.close(); }
  } finally {
    if (backend) { backend.kill(); await backendClosed; }
    rmSync(dir,{recursive:true,force:true});
  }
});
