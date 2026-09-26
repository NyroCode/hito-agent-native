# Validación actual

Fecha: **25 de septiembre de 2026, America/Lima** (logs generados el 26-sep en UTC). Revisión de fuentes aplicada sobre el commit base `c3ffd30`; los informes identifican que el árbol contenía cambios. Este documento resume el alcance efectivamente comprobado, sin sustituir una auditoría ni una confirmación Testnet.

## Resultados

| Comprobación | Resultado |
|---|---|
| `npm ci` desde copia limpia | PASS; 129 paquetes instalados, auditoría de esa instalación sin incidencias conocidas. |
| `npm run check` | PASS; 37 archivos, 0 fallos de sintaxis. |
| `npm test` | PASS; **93 pruebas**, 0 fallos ni omitidas. |
| `npm run check:types` | PASS; TypeScript sin errores. |
| `npm run test:adapters` | PASS; **9 pruebas**, 0 fallos ni omitidas. |
| `npm run build:wallet` | PASS; bundle local Freighter. |
| `npm run test:browser` | PASS; Chromium, escritorio 1440 px y móvil 390 px. |
| `npm run contract:test` | PASS; **31 pruebas Rust**, 0 fallos ni omitidas. |
| `npm run contract:build` | PASS; WASM con dependencias bloqueadas y target `wasm32v1-none`. |
| Validación estructural de la skill | PASS; frontmatter y estructura mediante validador skill-creator en entorno temporal. |
| Copia limpia: `verify:local -- --full --browser` | PASS; sin configuración personal, base, dependencias ni bundle previos. |
| Firmas humanas y ciclo Testnet | No ejecutados en esta revisión; ver [gates](REMAINING_GATES.md). |

La advertencia de npm 11 sobre el script de instalación de esbuild quedó visible durante `npm ci`. El bundle se construyó correctamente; no se cambiaron permisos globales ni se ejecutó `npm audit fix`.

## Qué se comprobó

El onboarding automatizado usa una carpeta temporal cuyo nombre contiene espacios. Ejecuta setup con proyectos y puerto propios, inicia el backend, carga el seed, genera configuración y skill, y opera CLI y MCP desde una segunda carpeta de proyecto. Consulta contexto, guarda un borrador y reintenta la escritura sin duplicarlo. Los archivos generados no contienen valores de tokens.

La prueba MCP real verifica discovery, las siete herramientas, aislamiento por proyecto, edición con versión esperada, conflicto de versión, reintentos, recuperación de progreso, evidencia `NOT_CHECKED` y preparación para revisión sin aceptación automática. Las solicitudes económicas quedan `REQUESTED`, sin XDR accesible al agente.

Las pruebas del navegador comprueban CSP, texto malicioso renderizado como texto, ausencia de token en DOM/storage/cookies, recarga sin credenciales, layout móvil y rechazos de wallet/cuenta/red/expiración. Usan **transporte de extensión simulado y perfil efímero**; no inspeccionan perfiles personales ni demuestran una firma real.

Las pruebas Rust cubren autoridades por rol, ciclo contractual, doble financiación/liberación, dependencias, evidencia, cancelación, vencimiento, rollback y aislamiento entre trabajos. Son pruebas locales; no representan transferencias en Testnet.

El script de despliegue se comprobó negativamente: exige autorización y configuración pública antes de iniciar herramientas; rechaza recibir secretos. No se ejecutó un despliegue durante esta revisión.

## Entorno

- Linux x86_64; Node `26.5.0`, npm `11.17.0`.
- TypeScript `5.9.3`, MCP SDK `1.30.0`, Stellar SDK `16.3.0`, Freighter API `6.0.1`.
- Chromium `151.0.7922.108`.
- Pruebas nativas iniciales con cargo/rustc `1.97.1` del sistema.
- Verificación contractual integrada y WASM con Rust `1.98.1`, instalado temporalmente desde distribución oficial y checksum verificado. El sistema no tenía el target WASM; no se cambió su toolchain global.

WASM construido: `contracts/target/wasm32v1-none/release/hito_escrow.wasm`, **27.606 bytes**.

SHA-256: `861a3ce8e4394ea0cffb7a47c98e912d8b690fc4523a6c559febd8b7ee9d10aa`.

Este hash identifica el artefacto local de esta revisión. No implica que un contrato previamente desplegado tenga ese código.

## Reproducir y conservar evidencia

```bash
npm ci
npm run verify:local -- --full --browser --contract
```

Requiere Chromium y toolchain Rust con target WASM; consulta [CONTRIBUTING](../CONTRIBUTING.md). También puedes ejecutar `--full` para comprobar únicamente la integración Node/MCP sin herramientas de navegador o contrato.

Cada ejecución crea `reports/local-*/VALIDATION.md`, `summary.json` y logs con comandos, códigos de salida y verificaciones no ejecutadas. Los informes locales quedan excluidos de Git. La revisión integrada produjo `reports/local-2026-09-26T00-12-29-937Z/`; la copia limpia produjo su propio informe. Las fuentes distribuidas permiten generar evidencia nueva en otra máquina.

El histórico de [reports/build](../reports/build/VALIDATION.md) describe la entrega inicial y conserva sus resultados originales, incluidos bloqueos de aquel entorno. No debe usarse como estado actual.

## Límites de la conclusión

### Verificación al preparar el repositorio GitHub

Se ejecutó nuevamente `npm run verify:local -- --full --browser --contract` con Node `26.5.0` y npm `11.17.0`. Informe: `reports/local-2026-09-26T00-42-38-933Z/`. Pasaron sintaxis, 93 pruebas core, tipos, 9 pruebas de adaptadores, bundle, Chromium y 31 pruebas Rust. El comando terminó con código 1 porque la toolchain del sistema carece del target `wasm32v1-none` (error E0463); no se reprodujo el build WASM en esta ejecución. El PASS de WASM de la tabla corresponde a la revisión anterior con toolchain temporal. No se ejecutaron firmas ni operaciones Testnet.

No se operaron interactivamente todas las versiones de Codex, Claude Code y Cursor; las configuraciones siguen sus guías oficiales y se probó el proceso generado con el SDK MCP real. Cada usuario comprueba su cliente con el procedimiento de [AGENT_SETUP](AGENT_SETUP.md).

No se acredita el ciclo económico completo de Testnet, verificación independiente de evidencia, multiusuario remoto, arbitraje ni seguridad de producción. Esos límites permanecen explícitos en [REMAINING_GATES](REMAINING_GATES.md).
