import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const setup = fileURLToPath(new URL('../../scripts/setup.mjs', import.meta.url));
test('setup creates scoped credentials without revealing them and refuses overwrite', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hito setup '));
  try {
    const run = spawnSync(process.execPath, [setup, '--projects', 'demo,my-project', '--port', '8989'], { cwd: dir, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    // These credentials belong only to this test's temporary directory.
    const adminFile = readFileSync(join(dir, '.env'), 'utf8');
    const agentFile = readFileSync(join(dir, '.hito-agent.env'), 'utf8');
    const admin = adminFile.match(/^HITO_ADMIN_TOKEN=(.+)$/m)![1];
    const agent = agentFile.match(/^HITO_AGENT_TOKEN=(.+)$/m)![1];
    assert.match(admin, /^[a-f0-9]{64}$/); assert.notEqual(admin, agent);
    assert.match(adminFile, /HITO_AGENT_PROJECTS=demo,my-project/);
    assert.match(agentFile, /HITO_API_URL=http:\/\/127.0.0.1:8989/);
    assert.equal(agentFile.includes(admin), false);
    assert.equal((run.stdout + run.stderr).includes(admin), false);
    assert.equal((run.stdout + run.stderr).includes(agent), false);
    if (process.platform !== 'win32') assert.equal(statSync(join(dir, '.env')).mode & 0o777, 0o600);
    const rerun = spawnSync(process.execPath, [setup], { cwd: dir, encoding: 'utf8' });
    assert.notEqual(rerun.status, 0);
    assert.equal(readFileSync(join(dir, '.env'), 'utf8'), adminFile);
    assert.equal(readFileSync(join(dir, '.hito-agent.env'), 'utf8'), agentFile);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('invalid setup options never create configuration', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hito-invalid-'));
  try {
    for (const args of [['--projects', 'demo,../other'], ['--projects', 'demo,demo'], ['--port', '80'], ['--projects']]) {
      const run = spawnSync(process.execPath, [setup, ...args], { cwd: dir, encoding: 'utf8' });
      assert.notEqual(run.status, 0);
      assert.equal(existsSync(join(dir, '.env')), false);
      assert.equal(existsSync(join(dir, '.hito-agent.env')), false);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
