import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Usage: npm run setup -- [--projects demo,my-project] [--port 8787]\nCreates fresh local credentials. Existing files are never read or overwritten.');
  process.exit(0);
}
let projects = 'demo', port = 8787;
for (let i = 0; i < args.length; i += 2) {
  const value = args[i + 1];
  if (args[i] === '--projects' && value) projects = value;
  else if (args[i] === '--port' && value) port = Number(value);
  else throw new Error('Unknown or incomplete option. Use npm run setup -- --help');
}
const ids = projects.split(',');
if (!ids.every(id => /^[a-zA-Z0-9_-]{1,80}$/.test(id)) || new Set(ids).size !== ids.length) throw new Error('Projects must be unique IDs, separated by commas (letters, digits, underscore or hyphen).');
if (!Number.isInteger(port) || port <= 1023 || port >= 65536) throw new Error('Port must be an integer from 1024 to 65535.');
if (existsSync('.env') || existsSync('.hito-agent.env')) throw new Error('Configuration already exists; nothing overwritten. Use npm run doctor with the running backend. A human can edit HITO_AGENT_PROJECTS in .env to grant another project, then restart.');
const admin = randomBytes(32).toString('hex'), agent = randomBytes(32).toString('hex');
mkdirSync('.hito', { recursive: true, mode: 0o700 });
writeFileSync('.env', `HITO_ADMIN_TOKEN=${admin}
HITO_AGENT_TOKEN=${agent}
HITO_AGENT_PROJECTS=${projects}
HITO_DB=.hito/hito.db
HITO_PORT=${port}
HITO_ORIGIN=http://127.0.0.1:${port}
HITO_MODE=local
HITO_CONTRACT_ID=
HITO_RPC_URL=https://soroban-testnet.stellar.org
`, { mode: 0o600, flag: 'wx' });
writeFileSync('.hito-agent.env', `HITO_API_URL=http://127.0.0.1:${port}
HITO_AGENT_TOKEN=${agent}
`, { mode: 0o600, flag: 'wx' });
console.log(`Created separate local credentials. Agent project scope: ${projects}.\nNext: npm run build:wallet; npm run configure:agent; npm start\nIn another terminal: npm run demo:seed (if demo is in scope), then npm run doctor.\nUI: http://127.0.0.1:${port}. Only the human reads the admin token in .env.`);
