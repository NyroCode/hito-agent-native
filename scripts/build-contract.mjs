import { spawnSync } from 'node:child_process';
const res = spawnSync(
  'cargo',
  ['build', '--locked', '--manifest-path', 'contracts/Cargo.toml', '--target', 'wasm32v1-none', '--release'],
  { stdio: 'inherit', env: process.env }
);

if (res.status !== 0) {
  console.error('\n[hito] Contract WASM build failed.');
  if (res.error?.code === 'ENOENT') {
    console.error('[hito] cargo was not found on PATH. Install Rust using https://rustup.rs/ and reopen your terminal.');
  } else if (res.error) {
    console.error(`[hito] ${res.error.message}`);
  }
  console.error('[hito] Ensure Rust toolchain has the target wasm32v1-none:');
  console.error('       rustup target add wasm32v1-none\n');
}

process.exit(res.status ?? 1);
