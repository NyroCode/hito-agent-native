import { writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'config/generated');
const args = [`--env-file=${join(root, '.hito-agent.env')}`, '--experimental-strip-types', join(root, 'src/mcp/main.ts')];
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'codex.toml'), `# Merge only this entry; preserve other servers and settings.
[mcp_servers.hito]
command = ${JSON.stringify(process.execPath)}
args = ${JSON.stringify(args)}
startup_timeout_sec = 30
tool_timeout_sec = 40
`);
const server = { command: process.execPath, args };
for (const name of ['cursor.json', 'cursor-or-claude.json']) writeFileSync(join(out, name), JSON.stringify({ mcpServers: { hito: server } }, null, 2) + '\n');
writeFileSync(join(out, 'claude-code.json'), JSON.stringify({ mcpServers: { hito: { type: 'stdio', ...server } } }, null, 2) + '\n');
cpSync(join(root, '.agents/skills/hito'), join(out, 'hito'), { recursive: true });
console.log(`Generated host configuration and portable skill in ${out}.\nNo token values embedded. Keep npm start running. Follow docs/AGENT_SETUP.md to merge the hito entry in your project.\nRegenerate these files after moving Hito or changing your Node executable.`);
