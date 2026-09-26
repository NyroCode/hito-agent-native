# Configuración y proyectos

## Archivos locales

`npm run setup` crea configuración nueva en la carpeta desde la que se ejecuta. Usa el comando npm desde la raíz de Hito. No sobrescribe archivos existentes ni muestra los tokens.

| Archivo | Uso |
|---|---|
| `.env` | Backend; credenciales separadas de humano y agente, proyectos permitidos y modo. Solo lo administra el humano. |
| `.hito-agent.env` | Dirección de la API y credencial limitada del agente; usado por MCP, CLI y doctor. |
| `.hito/hito.db` | SQLite: proyectos, trabajos, entregas, progreso, solicitudes, auditoría y reintentos. |
| `config/generated/` | Ejemplos para conectar clientes en esta máquina y copia portable de la skill. |

Todos están excluidos de Git. Genera configuración propia en cada computadora; compartir el código no comparte el estado local de Hito.

## Opciones iniciales

```bash
npm run setup -- --projects demo,mi-proyecto --port 8787
```

Los identificadores admiten letras, números, guion y guion bajo, hasta 80 caracteres. Usa una lista separada por comas sin espacios ni duplicados. El puerto debe estar entre 1024 y 65535. `demo` es el único scope predeterminado.

`setup` configura acceso a los identificadores; el registro del proyecto es un paso separado. Después ejecuta `npm run build:wallet`, `npm run configure:agent` y `npm start`.

## Registrar un proyecto propio

1. Decide el ID del proyecto y el nombre que verá el agente. Un proyecto agrupa trabajos con las mismas partes y activo.
2. El humano conecta la UI con su token administrativo y abre **Registrar proyecto**.
3. Sustituye todos los campos del formulario JSON: `id`, `name`, `payer`, `payee`, `tokenContract`, `tokenLabel` y `decimals`. Pagador y proveedor deben ser distintos. Para Testnet verifica direcciones públicas, activo y decimales según el runbook.
4. Registra el proyecto. Las partes y el activo quedan inmutables; una configuración diferente requiere un proyecto nuevo.
5. Si ese ID no estaba autorizado durante setup, el humano agrega el ID a `HITO_AGENT_PROJECTS` en `.env` y reinicia `npm start`. Conserva los tokens existentes. No entregues el contenido de `.env` al agente.
6. Ejecuta `npm run doctor`. Debe aparecer el ID tanto en el scope autorizado como entre los proyectos accesibles. El agente ya puede consultarlo con `hito_get_context`.

Para practicar sin wallets utiliza el proyecto sintético de `npm run demo:seed`, disponible únicamente en modo `local`. Sus direcciones no sirven para transacciones. Para trabajar en Testnet crea un proyecto y acuerdo nuevos después de configurar el contrato; no reutilices un acuerdo sellado en modo local.

## Variables del backend

| Variable | Valor y propósito |
|---|---|
| `HITO_ADMIN_TOKEN` | Token humano aleatorio generado; nunca se copia al cliente MCP. |
| `HITO_AGENT_TOKEN` | Token diferente, limitado a los proyectos autorizados. |
| `HITO_AGENT_PROJECTS` | IDs accesibles por el agente, separados por comas. |
| `HITO_DB` | Ruta de SQLite, por defecto `.hito/hito.db`. |
| `HITO_PORT` | Puerto local, por defecto `8787`. |
| `HITO_ORIGIN` | Debe ser exactamente `http://127.0.0.1:PUERTO`. |
| `HITO_MODE` | `local` o `testnet`; no existe modo Mainnet. |
| `HITO_CONTRACT_ID` | Contrato escrow de Testnet, obligatorio en modo `testnet`. |
| `HITO_RPC_URL` | RPC de Stellar Testnet; el adaptador comprueba la red. |

En `.hito-agent.env`, `HITO_API_URL` debe coincidir con `HITO_ORIGIN`, y `HITO_AGENT_TOKEN` con la credencial de agente del backend. Si cambias el puerto, actualiza ambas direcciones y reinicia backend y conexión MCP. Si mueves la instalación o cambias el ejecutable Node, regenera y fusiona los ejemplos del cliente.

No expongas este servicio mediante un túnel ni una dirección pública. Está diseñado para loopback y un operador; no incorpora identidad multiusuario u OAuth.

## Reinicios, copias y recuperación

Detener y arrancar Hito conserva los datos de SQLite. Para una copia consistente, detén el backend y copia el directorio `.hito/` completo a una ubicación privada. Mantén una copia privada separada de tu configuración. La base puede contener datos de acuerdos y material transaccional; no la adjuntes a reportes públicos.

Reiniciar no requiere ejecutar de nuevo `setup` ni el seed. El seed no añade otro trabajo si el proyecto demo ya tiene uno.

Si una operación económica aparece `UNKNOWN`, consulta la misma solicitud y conserva su hash. La UI ofrece reconciliación y recuperación cuando procede; no borres locks, base de datos o solicitudes para repetir un pago. Una configuración o credencial de API perdida no cambia el estado de los contratos ni recupera las claves de una wallet. Consulta [seguridad](SECURITY.md) antes de intervenir en un estado incierto.

## Diagnóstico

`npm run doctor` utiliza solo la credencial del agente. Comprueba backend, rol, scopes, proyectos registrados y una llamada MCP de lectura. No crea trabajos, no firma y no mueve fondos. Su resultado no sustituye la prueba dentro del cliente descrita en [AGENT_SETUP](AGENT_SETUP.md).
