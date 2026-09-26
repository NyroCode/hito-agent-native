import { readFile } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { apiClient } from '../client/api.ts';
const [command, resource, argument, extra] = process.argv.slice(2);
const help = `Hito CLI (limited agent access):
  projects
  works PROJECT
  context WORK
  readiness WORK MILESTONE
  save PROJECT file.json
  delivery WORK file.json
  progress WORK file.json
  prepare WORK file.json
  status INTENT
  reconcile INTENT
Writes require HITO_IDEMPOTENCY_KEY and a JSON file. Save files wrap the plan in {"plan": ...}.
Loads only .hito-agent.env from the Hito installation unless HITO_AGENT_TOKEN is already set.
No signing or administrator commands. See docs/CLI.md.`;
if (!command || command === 'help' || command === '--help') { console.log(help); process.exit(0); }
try {
  const writes = ['save','delivery','progress','prepare'];
  const known = ['projects','works','context','readiness',...writes,'status','reconcile'];
  if (!known.includes(command)) throw new Error('Unknown command. Use npm run cli -- help');
  const identifier = (value: string | undefined) => {
    if (!value || !/^[a-zA-Z0-9_-]{1,80}$/.test(value)) throw new Error('A valid resource ID is required. Use help.');
    return value;
  };
  if (command !== 'projects') identifier(resource);
  if (command === 'readiness') identifier(argument);
  if (extra || (command === 'projects' && resource) || (!writes.includes(command) && command !== 'readiness' && argument)) throw new Error('Unexpected argument. Use help.');
  if (writes.includes(command) && (!argument || !process.env.HITO_IDEMPOTENCY_KEY)) throw new Error('Write requires a JSON file and HITO_IDEMPOTENCY_KEY. Reuse the key only for an identical retry.');
  if (!process.env.HITO_AGENT_TOKEN) loadEnvFile(fileURLToPath(new URL('../../.hito-agent.env', import.meta.url)));
  const api = apiClient(process.env.HITO_API_URL ?? 'http://127.0.0.1:8787', process.env.HITO_AGENT_TOKEN ?? '');
  const routes: Record<string,string> = {
    projects:'/api/projects', works:`/api/projects/${resource}/works`, context:`/api/works/${resource}`,
    readiness:`/api/works/${resource}/readiness?milestoneId=${argument}`,
    save:`/api/projects/${resource}/works`, delivery:`/api/works/${resource}/deliveries`,
    progress:`/api/works/${resource}/progress`, prepare:`/api/works/${resource}/intents`,
    status:`/api/intents/${resource}`, reconcile:`/api/intents/${resource}/reconcile`,
  };
  const body = writes.includes(command) ? JSON.parse(await readFile(argument!, 'utf8')) : command === 'reconcile' ? {} : undefined;
  console.log(JSON.stringify(await api(routes[command], body, process.env.HITO_IDEMPOTENCY_KEY), null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Request failed');
  process.exitCode = 1;
}
