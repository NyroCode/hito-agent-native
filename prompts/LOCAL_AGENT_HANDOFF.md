# Continuar el desarrollo de Hito

Este prompt sirve para mantener **el repositorio de Hito**. Para usar sus herramientas desde otro proyecto, sigue `docs/AGENT_SETUP.md` y la skill `.agents/skills/hito/`.

Actúa como integrador de TypeScript/MCP y Stellar/Soroban. Revisa el estado, resuelve los defectos del alcance solicitado y entrega evidencia reproducible. Conserva los cambios del usuario.

## Producto y autoridad

Hito es una herramienta del agente del usuario. El modelo interpreta el encargo, propone hitos y programa con sus herramientas; Hito guarda acuerdos y evidencia y prepara solicitudes económicas. No añadir LLM propio, repo ingestion, memoria que modifica skills, orquestador autónomo ni otra planificación comercial.

Un hito representa un resultado aceptable y remunerado. La versión actual requiere entre 1 y 10 hitos; no inventar presupuestos, partes, plazos o evidencia ni usar importe cero para simular un modo no implementado. No duplicar tareas de otros gestores.

## Antes de modificar

Lee `AGENTS.md`, `START_HERE.md`, `.specify/memory/constitution.md`, `specs/001-hito-agent-native/spec.md`, `plan.md` y `tasks.md` de esa misma carpeta, `docs/REMAINING_GATES.md`, `docs/VALIDATION.md` y `reports/build/VALIDATION.md`. Consulta modelos y contratos de interfaces al modificar esas áreas.

Inspecciona `git status` y distingue código implementado, resultados históricos y gates pendientes. No reescribas constitución o criterios para acomodarlos al código. No ejecutes `specify init --force`: prepara integración upstream en staging y fusión selectiva según `docs/SPEC_KIT.md`.

## Reproducir y corregir

1. Registra versiones de Node/npm y sistema. Instala con `npm ci`: el lockfile está incluido. Ejecuta `npm run check`, `npm test`, `npm run check:types`, `npm run test:adapters` y `npm run build:wallet`. Consulta `package.json` para comandos adicionales.
2. Reproduce fallos, determina su causa y corrige sin desactivar pruebas. Añade regresión cuando proteja un comportamiento que falló. `check` es sintaxis, no tipado; RPC simulado no confirma una transacción de red.
3. Prueba MCP con backend real y credenciales efímeras. Comprueba handshake, siete herramientas y operaciones afectadas. `npm run configure:agent` genera ejemplos; `npm run doctor` comprueba configuración y transporte. Una sesión real del cliente requiere invocación explícita según `docs/AGENT_SETUP.md`.
4. Para contrato, conserva `contracts/Cargo.lock` y ejecuta pruebas/build con `--locked`. Verifica cargo/rustc y target `wasm32v1-none`; reporta su ausencia como bloqueo del build. No instales toolchains globales sin autorización. Preserva autenticación por rol, cantidades, replay, rollback, balances, dependencias y aislamiento entre trabajos; actualiza ABI y adapters cuando corresponda.
5. Si cambias UI o wallet, verifica los casos afectados en navegador con credenciales efímeras. Distingue transporte Freighter simulado de extensión real. Conserva recuperación de intents y source locks: `NOT_FOUND` o timeout no significan pago fallido ni autorizan repetir una transferencia.

Usa subagentes existentes para módulos independientes y un integrador para pruebas compartidas. No edites concurrentemente los mismos schemas, manifests o criterios.

## Secretos y Testnet

No leas ni imprimas seeds, cookies, credenciales de otros proyectos ni el token humano de `.env`. El agente recibe solo `.hito-agent.env`; los tests pueden generar credenciales efímeras. No imprimas el entorno completo ni agregues secretos a fixtures o informes.

No publiques, financies, firmes, instales wallets o cambies permisos globales sin autorización. No uses Mainnet. El humano configura direcciones públicas y firma Freighter; el agente no necesita su seed.

Sigue `docs/TESTNET_RUNBOOK.md` para operaciones de red. El despliegue requiere un alias Stellar CLI existente y autorización explícita; no crea ni financia identidades. Una salida correcta de CLI requiere verificación posterior de red. Usa un proyecto Testnet nuevo, nunca los datos sintéticos de `demo`.

Si el encargo incluye el recorrido económico, verifica `create/accept/fund/submit/approve/release` con firmas de cada rol, hashes originales, ledger y balances. No declares pago por respuesta de envío ni por inferencia. Conserva incertidumbre y bloqueos mientras falte evidencia. Si falta wallet o autorización, completa el trabajo local y registra el gate pendiente.

## Evidencia y entrega

Guarda ejecuciones nuevas en informes nuevos de `reports/`, conservando los históricos. `npm run verify:local` crea su directorio de informe. Registra comando, versión, código de salida y limitaciones; separa PASS, FAIL, BLOCKED y NOT_RUN.

Actualiza documentación operativa y estado con resultados obtenidos. Prueba instalación limpia con locks cuando cambies empaquetado o instalación. Excluye secretos, bases locales, dependencias y artefactos de compilación de cualquier paquete compartido.

Entrega resumen de cambios, comprobaciones y gates pendientes con su razón. No anuncies validación completa si falta llamada desde el cliente o recorrido Testnet solicitado; pruebas locales no constituyen auditoría de producción.
