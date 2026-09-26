# Quickstart de aceptación

Desde raíz: `npm run check && npm test`. Después `npm run setup`, `npm start` y en otra terminal `npm run demo:seed`. UI en `http://127.0.0.1:8787`. El humano usa token admin, no el agente.

1. Abrir trabajo sintético, revisar que total=suma y que cada criterio sea explícito.
2. Sellar localmente. Intentar editar: debe rechazar.
3. Registrar una entrega con SHA-256 de un artefacto de prueba y NOT_CHECKED. No decir que pasó una prueba no ejecutada.
4. Readiness muestra blocker. Cambiar solo después de ejecutar prueba y registrar nueva entrega.
5. Preparar create: solo REQUESTED. Build en local retorna TESTNET_NOT_CONFIGURED; no fake transfer.
6. Para MCP ejecutar instalación, types y test:adapters; configurar entrada local y usar tools con token limitado.
7. Para Stellar, seguir [TESTNET_RUNBOOK](../../docs/TESTNET_RUNBOOK.md); crear nuevo proyecto real Testnet antes de sellar.

Los comandos con seed/custodia no son parte del quickstart. No registrar IDs del demo como wallets reales.

La instalación completa y la conexión de clientes se mantienen en [README](../../README.md) y [AGENT_SETUP](../../docs/AGENT_SETUP.md).
