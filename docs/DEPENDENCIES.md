# Dependencias y reproducibilidad

`package-lock.json` y `contracts/Cargo.lock` forman parte del repositorio. Usa `npm ci` y comandos Cargo con `--locked` para reproducir las versiones fijadas. No regeneres los locks como paso habitual de instalación.

| Dependencia | Versión declarada | Uso |
|---|---|---|
| Node.js | >=22.16.0 | SQLite integrado y TypeScript con strip-types |
| @stellar/stellar-sdk | 16.3.0 | Transacciones y RPC |
| @modelcontextprotocol/sdk | 1.30.0 | Servidor y pruebas MCP |
| @stellar/freighter-api | 6.0.1 | Conexión con la extensión wallet |
| zod | 3.25.76 | Esquemas MCP |
| TypeScript | 5.9.3 | Comprobación de tipos |
| @types/node | 22.19.17 | Tipos de Node |
| esbuild | 0.28.2 | Bundle de wallet |
| soroban-sdk | 25.1.1 | Contrato y pruebas; resolución en Cargo.lock |

El entorno de revisión del 25-sep-2026 dispone de Node 26.5.0, npm 11.17.0 y cargo/rustc 1.97.1. El mínimo declarado no significa que cada versión posterior haya pasado una matriz de compatibilidad. Los resultados actuales están en [VALIDATION.md](VALIDATION.md); disponibilidad del target WASM y confirmación Testnet se comprueban por separado.

## Instalación y comprobación

```bash
npm ci
npm run check
npm test
npm run check:types
npm run test:adapters
npm run build:wallet
```

`check` analiza sintaxis; `check:types` ejecuta `tsc`. El core puede ejecutarse sin paquetes npm; MCP, adapters y bundle necesitan la instalación. Rust, Stellar CLI y wallet no son necesarios para probar las herramientas locales.

Para el contrato se necesita una toolchain compatible con las dependencias bloqueadas y el target `wasm32v1-none`:

```bash
cargo --version
rustc --version
rustup target list --installed
npm run contract:test
npm run contract:build
```

Si falta el target, el operador puede instalarlo en su toolchain elegida con `rustup target add wasm32v1-none`. El script informa del requisito; no lo instala automáticamente. Las pruebas nativas no demuestran disponibilidad del target ni despliegue del contrato.

## Historial y actualizaciones

El informe versionado de [reports/build](../reports/build/VALIDATION.md) conserva la validación inicial. Otros informes de sesiones anteriores permanecen locales y no forman parte de una copia limpia. Sus versiones, resultados y hashes no describen automáticamente el estado actual. Una auditoría sin incidencias conocidas tampoco sustituye una revisión de seguridad.

Para actualizar dependencias, revisar fuentes oficiales y advisories, modificar pines intencionalmente, regenerar locks y ejecutar las pruebas afectadas. Registrar comandos, versiones, códigos de salida y limitaciones en un informe nuevo. `npm run verify:local` crea un informe local sin reemplazar los históricos.

Spec Kit es una integración de desarrollo opcional, no una dependencia de ejecución. Su versión revisada y procedimiento selectivo están en [SPEC_KIT.md](SPEC_KIT.md).
