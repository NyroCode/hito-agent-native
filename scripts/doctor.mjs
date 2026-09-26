import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
try {
  if (!process.env.HITO_AGENT_TOKEN) loadEnvFile(fileURLToPath(new URL('../.hito-agent.env', import.meta.url)));
  const { apiClient } = await import('../src/client/api.ts');
  const base = process.env.HITO_API_URL ?? 'http://127.0.0.1:8787';
  const api = apiClient(base, process.env.HITO_AGENT_TOKEN ?? '');
  const info = await api('/api/info');
  if (info.role !== 'agent') throw new Error('Doctor requires the limited agent credential. Do not use an admin token.');
  const projects = await api('/api/projects');
  console.log(`Backend: ${base} · ${info.mode} · Hito ${info.version}`);
  console.log(`Authorized project IDs: ${info.agentScopedProjects.join(', ') || '(none)'}`);
  console.log(`Registered, accessible project IDs: ${projects.map(p => p.id).join(', ') || '(none)'}`);
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
  const client = new Client({ name: 'hito-doctor', version: '0.1.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--experimental-strip-types', fileURLToPath(new URL('../src/mcp/main.ts', import.meta.url))],
    env: { PATH: process.env.PATH ?? '', HITO_API_URL: base, HITO_AGENT_TOKEN: process.env.HITO_AGENT_TOKEN },
    stderr: 'pipe',
  });
  transport.stderr?.on('data', () => {});
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    const names = listed.tools.map(t => t.name).sort();
    const expected = ['hito_check_readiness','hito_get_context','hito_get_payment_status','hito_prepare_payment','hito_save_work','hito_submit_delivery','hito_update_progress'];
    if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error('Unexpected MCP tool list. Check that backend and MCP come from the same Hito installation.');
    const result = await client.callTool({ name: 'hito_get_context', arguments: {} });
    if (result.isError) throw new Error('MCP context call failed; check project scope and agent configuration.');
    console.log(`MCP: handshake and context OK; ${names.length} tools available.`);
  } finally { await client.close(); }
  if (!projects.length) console.log('Next: npm run demo:seed in local mode, or register your project through the human UI. Its ID must also be in the authorized scope.');
  console.log('Connection checks passed. The final host check is to call hito_get_context inside your coding agent.');
} catch (error) {
  const code = error?.code;
  const message = code === 'ENOENT' ? 'Agent configuration missing. Run npm run setup in the Hito directory.'
    : code === 'ERR_MODULE_NOT_FOUND' ? 'Dependencies missing. Run npm ci in the Hito directory.'
    : error instanceof TypeError ? 'Backend unavailable. Keep npm start running and verify HITO_API_URL in .hito-agent.env.'
    : error instanceof Error ? error.message : 'Connection check failed.';
  console.error(`Hito doctor: ${message}`);
  process.exitCode = 1;
}
