import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Explicit authorization is checked before dependencies, subprocesses or network.
if (process.env.HITO_ALLOW_TESTNET_DEPLOY !== 'yes') {
  console.error('[deploy] Set HITO_ALLOW_TESTNET_DEPLOY=yes only after authorizing this Testnet deployment.');
  process.exit(1);
}
const deployer = process.env.HITO_DEPLOYER;
const token = process.env.HITO_TOKEN_CONTRACT_ID;
if (!deployer || !/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(deployer) || !token) {
  console.error('[deploy] Set HITO_DEPLOYER to an existing Stellar CLI identity alias (1–40 characters) and HITO_TOKEN_CONTRACT_ID to the verified Testnet token contract.');
  process.exit(1);
}
if (process.env.HITO_DEPLOYER_SECRET) {
  console.error('[deploy] HITO_DEPLOYER_SECRET is unsupported. Use an existing Stellar CLI identity alias.');
  process.exit(1);
}
const { StrKey } = await import('@stellar/stellar-sdk');
if (!StrKey.isValidContract(token)) {
  console.error('[deploy] HITO_TOKEN_CONTRACT_ID must be a valid contract address.');
  process.exit(1);
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rpcUrl = 'https://soroban-testnet.stellar.org';
const passphrase = 'Test SDF Network ; September 2015';
let reportDir;
function run(command, args, capture = false) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', stdio: capture ? ['inherit', 'pipe', 'pipe'] : 'inherit', maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw new Error(`${command} could not start. Install it and ensure it is on PATH (${result.error.code}).`);
  if (result.status !== 0) throw new Error(`${command} failed (exit ${result.status ?? result.signal}).${capture ? `\n${result.stderr || ''}` : ''}`);
  return result;
}
try {
  const stellarVersion = run('stellar', ['--version'], true).stdout.trim();
  const cargoVersion = run('cargo', ['--version'], true).stdout.trim();
  run('cargo', ['test', '--locked', '--manifest-path', 'contracts/Cargo.toml']);
  run(process.execPath, ['scripts/build-contract.mjs']);
  const wasm = 'contracts/target/wasm32v1-none/release/hito_escrow.wasm';
  const wasmSha256 = createHash('sha256').update(readFileSync(join(root, wasm))).digest('hex');
  mkdirSync(join(root, 'reports'), { recursive: true });
  reportDir = mkdtempSync(join(root, `reports/testnet-deploy-${new Date().toISOString().replace(/[:.]/g, '-')}-`));
  const metadata = { network: 'testnet', rpcUrl, passphrase, deployerAlias: deployer, tokenContract: token, wasmSha256, stellarVersion, cargoVersion, startedAt: new Date().toISOString() };
  writeFileSync(join(reportDir, 'deployment.json'), JSON.stringify({ ...metadata, status: 'STARTED' }, null, 2) + '\n');
  console.error(`[deploy] Report: ${reportDir}`);
  // Explicit URL/passphrase avoid a locally redefined network alias.
  const result = spawnSync('stellar', ['contract', 'deploy', '--wasm', wasm, '--source-account', deployer, '--rpc-url', rpcUrl, '--network-passphrase', passphrase, '--', '--token', token], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  writeFileSync(join(reportDir, 'deploy.stdout.log'), result.stdout || '');
  writeFileSync(join(reportDir, 'deploy.stderr.log'), result.stderr || '');
  const contractId = (result.stdout || '').trim();
  const success = !result.error && result.status === 0 && StrKey.isValidContract(contractId);
  writeFileSync(join(reportDir, 'deployment.json'), JSON.stringify({ ...metadata, finishedAt: new Date().toISOString(), status: success ? 'CLI_SUCCEEDED' : 'UNCONFIRMED', exitCode: result.status, contractId: success ? contractId : null }, null, 2) + '\n');
  if (!success) throw new Error('Deployment was not confirmed by CLI output. Inspect the preserved logs and network state before retrying; it may have been submitted.');
  writeFileSync(join(reportDir, 'contract-id.txt'), contractId + '\n');
  console.log(contractId);
  console.error('[deploy] Verify the deployed WASM, token and transaction receipt on Testnet; this is not an escrow payment confirmation.');
} catch (error) {
  console.error(`[deploy] ${error.message}`);
  if (reportDir) console.error(`[deploy] Preserved report: ${reportDir}`);
  process.exitCode = 1;
}
