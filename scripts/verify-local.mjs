import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const flags = new Set(process.argv.slice(2));
for (const flag of flags) if (!['--full','--browser','--contract'].includes(flag)) throw new Error('Usage: npm run verify:local -- [--full] [--browser] [--contract]');
const dir = `reports/local-${new Date().toISOString().replace(/[:.]/g, '-')}`;
mkdirSync(dir, { recursive: true });
const nodeTestArgs = folder => ['--experimental-strip-types','--test',...readdirSync(folder).filter(x => x.endsWith('.test.ts')).map(x => `${folder}/${x}`)];
const tasks = [
  ['syntax', process.execPath, ['scripts/check-syntax.mjs']],
  ['core', process.execPath, nodeTestArgs('tests/core')],
];
const notRun = ['Human signatures in Freighter','Live Testnet lifecycle and balances','Interactive Codex/Claude Code/Cursor host sessions'];
if (flags.has('--full') || flags.has('--browser')) tasks.push(
  ['types', process.execPath, ['node_modules/typescript/bin/tsc','--noEmit']],
  ['adapters', process.execPath, nodeTestArgs('tests/adapters')],
  ['wallet-bundle', process.execPath, ['scripts/build-wallet.mjs']],
); else notRun.push('TypeScript types','SDK and MCP adapters','Wallet bundle');
if (flags.has('--browser')) tasks.push(['browser', process.execPath, ['--experimental-strip-types','tests/browser/chromium-e2e.mjs']]);
else notRun.push('Chromium browser tests');
if (flags.has('--contract')) tasks.push(
  ['contract-tests','cargo',['test','--locked','--manifest-path','contracts/Cargo.toml']],
  ['contract-build',process.execPath,['scripts/build-contract.mjs']],
); else notRun.push('Rust contract tests and WASM build');
const git = args => { const r=spawnSync('git', args, { encoding:'utf8' }); return r.status===0 ? r.stdout.trim() : null; };
const result = { generatedAt:new Date().toISOString(), node:process.version, platform:process.platform, arch:process.arch, commit:git(['rev-parse','HEAD']), dirty:git(['status','--porcelain']) === null ? null : git(['status','--porcelain']) !== '', tests:[], notRun };
for (const [name,command,args] of tasks) {
  const started = Date.now();
  const execution = spawnSync(command,args,{encoding:'utf8',timeout:600000,maxBuffer:16*1024*1024,env:{...process.env,HITO_BROWSER_REPORT_DIR:`${dir}/browser`}});
  writeFileSync(`${dir}/${name}.log`,(execution.stdout??'')+(execution.stderr??''));
  result.tests.push({ name, command:[command,...args], exitCode:execution.status, error:execution.error?.message??null, durationMs:Date.now()-started });
  console.log(`${name}: ${execution.status === 0 ? 'PASS' : 'FAIL'} (log: ${dir}/${name}.log)`);
}
writeFileSync(`${dir}/summary.json`,JSON.stringify(result,null,2)+'\n');
writeFileSync(`${dir}/VALIDATION.md`, `# Local validation\n\nGenerated: ${result.generatedAt}\n\nNode ${result.node}; ${result.platform}/${result.arch}; commit ${result.commit}; working tree changed: ${result.dirty}.\n\n| Check | Result | Log |\n|---|---|---|\n${result.tests.map(t => `| ${t.name} | ${t.exitCode === 0 ? 'PASS' : 'FAIL'} (exit ${t.exitCode}) | [log](${t.name}.log) |`).join('\n')}\n\n## Not run\n\n${notRun.map(x=>`- ${x}`).join('\n')}\n\nBrowser wallet transport is simulated. MCP tests use the real SDK with temporary local credentials. Neither proves human signing or network payment. Exact commands and durations are in summary.json.\n`);
console.log(`Report: ${dir}/VALIDATION.md`);
if (result.tests.some(t=>t.exitCode!==0)) process.exitCode=1;
