import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../../scripts/deploy-testnet.mjs', import.meta.url));
test('direct deployment entrypoint requires explicit authorization and public configuration', () => {
  const env: NodeJS.ProcessEnv = {...process.env, PATH:''};
  for (const key of Object.keys(env)) if (key.startsWith('HITO_')) delete env[key];
  const run = (extra: NodeJS.ProcessEnv) => spawnSync(process.execPath, [script], {env:{...env,...extra},encoding:'utf8',timeout:5000});
  const denied = run({});
  assert.equal(denied.status, 1); assert.match(denied.stderr, /authorizing this Testnet deployment/);
  const incomplete = run({HITO_ALLOW_TESTNET_DEPLOY:'yes'});
  assert.equal(incomplete.status, 1); assert.match(incomplete.stderr, /existing Stellar CLI identity alias/);
  const unsupported = run({HITO_ALLOW_TESTNET_DEPLOY:'yes',HITO_DEPLOYER:'test-alias',HITO_TOKEN_CONTRACT_ID:'public-placeholder',HITO_DEPLOYER_SECRET:'unsupported-input'});
  assert.equal(unsupported.status, 1); assert.match(unsupported.stderr, /SECRET is unsupported/);
  assert.equal(unsupported.stderr.includes('unsupported-input'), false);
});
