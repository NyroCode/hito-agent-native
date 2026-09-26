# Desarrollar Hito

Lee [AGENTS.md](AGENTS.md), la [constitución](.specify/memory/constitution.md) y la [especificación](specs/001-hito-agent-native/spec.md) antes de modificar comportamiento. Hito expone operaciones deterministas; la planificación y el desarrollo pertenecen al agente del usuario.

## Entorno

Node.js >=22.16 y npm permiten ejecutar el núcleo. `npm ci` instala las versiones del lock para tipado, MCP, SDK y bundle. Las pruebas crean credenciales y bases temporales propias; no necesitan configuración personal ni un backend ya iniciado.

```bash
npm ci
npm run check
npm test
npm run check:types
npm run test:adapters
npm run build:wallet
```

`check` solo verifica sintaxis. Las pruebas MCP usan el SDK real y HTTP/SQLite reales. Las pruebas de Stellar usan criptografía real con RPC controlado; no mueven fondos.

Para la interfaz instala Chromium según tu sistema y ejecuta:

```bash
npm run test:browser
```

Por defecto busca `chromium` en PATH. Puedes establecer `CHROMIUM_BIN` con el ejecutable de Chromium/Chrome. El test usa un perfil temporal que elimina al terminar, prueba escritorio/móvil y simula únicamente el transporte de la extensión wallet.

## Contrato Rust

Instala Rust y Cargo mediante el procedimiento oficial de tu sistema. Con una instalación gestionada por rustup, añade el target:

```bash
rustup target add wasm32v1-none
npm run contract:test
npm run contract:build
```

Si usas un paquete de tu distribución sin rustup, proporciona el target compatible o una toolchain local completa en PATH. Los scripts no seleccionan rutas particulares de otro desarrollador ni instalan herramientas globales. El artefacto generado está en `contracts/target/wasm32v1-none/release/hito_escrow.wasm`.

Para revisar formato y lints:

```bash
cargo fmt --manifest-path contracts/Cargo.toml --all -- --check
cargo clippy --manifest-path contracts/Cargo.toml --workspace --all-targets --locked -- -D warnings
```

Construir WASM no despliega el contrato. El [runbook Testnet](docs/TESTNET_RUNBOOK.md) describe la operación autorizada por separado.

## Informe reproducible

```bash
npm run verify:local                          # Sintaxis y core
npm run verify:local -- --full                # Añade tipos, adapters y bundle
npm run verify:local -- --full --browser      # Añade Chromium
npm run verify:local -- --full --browser --contract
```

Cada ejecución genera un nuevo `reports/local-*/VALIDATION.md`, `summary.json` y logs, excluidos de Git. El informe identifica comandos, versiones, código de salida y verificaciones no ejecutadas. No reemplaces `reports/build`: conserva hechos de la entrega inicial.

Antes de proponer cambios, ejecuta los checks pertinentes y revisa `git diff --check`. Si modificas un contrato de API o MCP, actualiza schemas, guías y pruebas de sus consumidores. Si corriges una prueba, documenta por qué conserva la intención original.

## Datos que se comparten

Comparte fuentes, lockfiles, ejemplos sin credenciales y documentación. No compartas `.env`, `.hito-agent.env`, `.hito/`, bases SQLite, `node_modules/`, `contracts/target/`, bundles generados ni configuración de cliente con rutas locales. `.gitignore` cubre esos archivos. Revisa cualquier informe antes de adjuntarlo.

Los cambios de scope del producto requieren una decisión explícita. Mantén la separación entre progreso, evidencia declarada, aceptación humana y confirmación de red. Los estados inciertos conservan el hash original y el bloqueo de origen.
