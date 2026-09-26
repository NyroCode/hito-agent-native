# Usar Hito desde tu agente de código

Hito expone siete herramientas MCP para que tu agente trabaje con acuerdos, hitos, progreso, evidencia y solicitudes de pago. El agente interpreta tu solicitud y el código del proyecto con su contexto habitual; consulta Hito para recuperar los acuerdos guardados. Hito no lee ni indexa automáticamente tu repositorio, no ejecuta el código y no incorpora otro modelo de IA.

Esta guía conecta un **cliente local** de Codex, Claude Code o Cursor con Hito mediante `stdio`. El cliente inicia el proceso MCP; el backend HTTP de Hito debe permanecer ejecutándose por separado. La configuración de localhost no conecta una sesión cloud con tu computadora.

## 1. Preparar Hito una vez

Necesitas Node.js 22.16 o superior y npm. Desde la carpeta donde descargaste o clonaste Hito:

```bash
npm ci
npm run setup
npm run build:wallet
npm run configure:agent
npm start
```

Deja esa terminal abierta. En otra terminal, también en la carpeta de Hito:

```bash
npm run demo:seed
npm run doctor
```

La demo crea un proyecto `demo` y un borrador con datos sintéticos. Sirve para aprender las herramientas sin wallet ni transacciones. Abre `http://127.0.0.1:8787` para revisar la interfaz. El modo local permite guardar trabajo y solicitudes; no confirma pagos de red.

`setup` crea `.env` para el backend y `.hito-agent.env` para el agente, con tokens distintos. Si ya existen, se detiene sin sobrescribirlos: conserva tu configuración y continúa con los siguientes pasos. El agente recibe únicamente `.hito-agent.env`; el token humano de `.env` se introduce personalmente en la interfaz cuando corresponda.

`doctor` comprueba configuración del agente, conexión al backend, proyectos accesibles y descubrimiento de herramientas MCP. Ese resultado verifica el transporte local; la llamada dentro de tu cliente se comprueba en el paso 4.

## 2. Conectar el cliente al proyecto donde trabajarás

La carpeta de Hito y la de tu aplicación pueden ser diferentes. En los pasos siguientes, **proyecto de trabajo** significa la carpeta que abres en Codex, Claude Code o Cursor, por ejemplo `/home/ana/proyectos/mi-aplicacion`.

`npm run configure:agent` escribe ejemplos en `config/generated/` dentro de Hito. Los ejemplos incluyen la ruta absoluta al ejecutable Node usado al generarlos, al archivo `.hito-agent.env` y a `src/mcp/main.ts`. No contienen el valor del token ni modifican configuraciones globales del cliente.

| Cliente | Ejemplo generado en Hito | Destino dentro del proyecto de trabajo |
|---|---|---|
| Codex | `config/generated/codex.toml` | `.codex/config.toml` |
| Claude Code | `config/generated/claude-code.json` | `.mcp.json` |
| Cursor | `config/generated/cursor.json` | `.cursor/mcp.json` |

Si el archivo de destino no existe, crea sus directorios y copia el ejemplo correspondiente. **Si ya existe, incorpora únicamente la entrada de Hito**, preservando los demás servidores y opciones. En TOML es la sección `[mcp_servers.hito]`; en JSON es la propiedad `hito` dentro de `mcpServers`. No dupliques una sección ni pegues dos objetos JSON completos en un mismo archivo. `cursor-or-claude.json` se conserva como ejemplo de compatibilidad.

Mantén las rutas con espacios dentro de las cadenas generadas: cada elemento de `args` ya es un argumento separado. No agregues comillas de shell dentro de esas cadenas. Si cambias de ubicación Hito o de instalación de Node, vuelve a generar los ejemplos y actualiza la entrada del cliente.

### Codex

Incorpora el TOML en `.codex/config.toml` del proyecto de trabajo y abre una sesión de Codex allí. La configuración por proyecto requiere que el proyecto sea de confianza para Codex. Revisa el servidor `hito` con `/mcp` en Codex CLI. Las opciones y ubicación están documentadas en la [guía oficial de MCP de Codex](https://developers.openai.com/codex/mcp).

### Claude Code

Incorpora el JSON en `.mcp.json` de la raíz del proyecto de trabajo y abre Claude Code desde esa carpeta. En la sesión interactiva, acepta el servidor cuando el cliente solicite aprobación y revisa `/mcp`. La [guía oficial de MCP de Claude Code](https://code.claude.com/docs/en/mcp) describe el alcance por proyecto y sus controles.

### Cursor

Incorpora el JSON en `.cursor/mcp.json` del proyecto de trabajo, abre esa carpeta en Cursor y comprueba que `hito` esté habilitado en su configuración MCP. Usa una conversación con herramientas disponibles. La [guía oficial de MCP de Cursor](https://cursor.com/docs/mcp) describe el archivo por proyecto y el transporte local.

Cada colaborador genera su propia configuración con sus rutas y credenciales locales. No compartas `.env`, `.hito-agent.env` ni la base de datos. Los ejemplos generados contienen rutas de tu máquina; no son una configuración portable lista para otra computadora.

## 3. Añadir las instrucciones de uso

MCP aporta las operaciones y sus esquemas. La skill explica cómo relacionarlas con el contexto del proyecto, cuándo pedir datos que faltan y cómo conservar la diferencia entre evidencia, aceptación y pago.

El generador copia la skill completa a `config/generated/hito/`. Copia esa carpeta al destino de tu cliente en el **proyecto de trabajo**:

| Cliente | Destino de la carpeta generada `hito/` |
|---|---|
| Codex | `.agents/skills/hito/` |
| Claude Code | `.claude/skills/hito/` |
| Cursor | `.cursor/skills/hito/` |

Si ya tienes una skill `hito`, revisa y combina los cambios antes de reemplazarla. Copia la carpeta completa, incluidos sus recursos relativos. Abre una sesión nueva después de agregarla. Estas ubicaciones corresponden a las guías oficiales de [skills de Codex](https://developers.openai.com/codex/skills), [skills de Claude Code](https://code.claude.com/docs/en/skills) y [skills de Cursor](https://cursor.com/docs/skills).

No necesitas copiar el `AGENTS.md` de este repositorio a tu aplicación: contiene instrucciones para desarrollar Hito. Usa la skill y conserva las instrucciones propias de tu proyecto.

## 4. Comprobar una llamada desde el agente

Con el backend encendido, pide al agente:

> Usa Hito. Llama a `hito_get_context` sin argumentos y enumera los proyectos a los que tienes acceso. Después consulta `hito_get_context` con `projectId: "demo"`, lee el trabajo existente con su `workId` y resume sus hitos, criterios y estado. Solo consulta datos en este paso.

El resultado debe mostrar una llamada real a la herramienta y los datos del proyecto sintético. El nombre visible puede llevar un prefijo que añade el cliente. Ver el servidor en una lista sin invocar una herramienta no demuestra acceso al backend.

Después puedes practicar con el borrador existente:

> Usa la skill de Hito y el contexto del proyecto `demo`. Explica qué información falta para ejecutar el primer hito y registra una nota de progreso veraz mediante `hito_update_progress`, usando el `workId` y `milestoneId` que acabas de consultar. No declares pruebas ejecutadas ni pagos confirmados.

Esta prueba demuestra lectura y escritura desde tu propio agente. Para aprender el recorrido de revisión y evidencia, sigue [la demo local](DEMO.md). Para operaciones de red, sigue el [runbook Testnet](TESTNET_RUNBOOK.md); los datos sintéticos de `demo` no sirven para firmar.

## 5. Usarlo con tu propio proyecto

Abrir una carpeta de código no registra automáticamente un proyecto en Hito. El operador humano registra en la interfaz su identificador, nombre, pagador, proveedor y activo. El agente debe tener acceso explícito a ese identificador.

En una instalación nueva puedes preparar los identificadores autorizados desde el inicio:

```bash
npm run setup -- --projects demo,mi-proyecto
```

Este comando sustituye al `npm run setup` del paso 1; no se ejecuta para sobrescribir una instalación existente. Autoriza esos identificadores, pero no crea los proyectos. Para añadir acceso en una instalación existente, el humano modifica únicamente `HITO_AGENT_PROJECTS` en su `.env`, conservando los tokens, y reinicia `npm start`. El agente no necesita leer ese archivo. Registra después el proyecto mediante la interfaz administrativa y comprueba que aparece en `hito_get_context`.

Un pedido inicial útil para el agente es:

> Usa Hito para el proyecto `mi-proyecto`. Lee primero su contexto y mi repositorio. Mi solicitud es: [resultado esperado]. El presupuesto autorizado es [importe y activo], con fecha límite [fecha y zona horaria]. Propón hitos con criterios comprobables, dependencias y evidencia esperada. Consulta cualquier dato económico que falte antes de guardar. Revisa trabajos existentes para evitar duplicados y guarda un borrador con `hito_save_work` cuando los datos estén completos.

El agente convierte importes a unidades enteras usando los decimales del activo registrado. No debe inferir presupuesto, fecha, partes o destinos. Cada escritura usa una clave de idempotencia estable para repetir la misma solicitud; un cambio de contenido requiere una clave nueva. El humano revisa y sella el acuerdo. Una vez sellado, esta versión no permite editarlo.

Hito conserva acuerdos, entregas y progreso entre sesiones. El contexto del código y las decisiones de implementación siguen perteneciendo a tu agente. Si ya gestionas tareas en otra herramienta, utiliza sus referencias en el acuerdo y evita crear un segundo listado de todas las tareas técnicas.

## Herramientas disponibles

| Herramienta | Para qué sirve |
|---|---|
| `hito_get_context` | Leer proyectos accesibles, trabajos de un proyecto o un trabajo con sus registros. |
| `hito_save_work` | Crear o actualizar un borrador; actualizar requiere la versión esperada. |
| `hito_update_progress` | Guardar una nota y estado de avance de un hito. |
| `hito_submit_delivery` | Registrar hash SHA-256 real del artefacto, referencia y un resultado por criterio. |
| `hito_check_readiness` | Identificar evidencia faltante o fallida antes de la revisión humana. |
| `hito_prepare_payment` | Crear una solicitud de acción económica para revisión humana. |
| `hito_get_payment_status` | Consultar el estado y, opcionalmente, reconciliar el hash ya registrado. |

`READY_FOR_REVIEW` no equivale a aceptación. `PASS` es evidencia declarada por quien la presenta, no una auditoría independiente. Una solicitud económica no firma ni paga. `UNKNOWN` conserva la incertidumbre y el hash original; no se reintenta creando un pago distinto ni borrando bloqueos. Los esquemas completos están en el [contrato MCP](../specs/001-hito-agent-native/contracts/mcp-tools.json).

## Resolver problemas

| Síntoma | Comprobación |
|---|---|
| No aparece `hito` | Revisa el archivo del cliente, su sintaxis, la confianza del proyecto y la habilitación del servidor; abre una nueva sesión. |
| Node o el archivo no existen | Regenera la configuración después de mover Hito o actualizar la instalación de Node. |
| El MCP arranca, pero las herramientas fallan al conectar | Mantén `npm start` activo. El proceso MCP no inicia el backend. Ejecuta `npm run doctor`. |
| Error de módulos ausentes | Ejecuta `npm ci` en Hito, no en la aplicación que estás desarrollando. |
| Acceso denegado o proyecto ausente | El humano verifica el registro del proyecto y su identificador en `HITO_AGENT_PROJECTS`; reinicia el backend después de modificarlo. |
| No aparece la skill | Comprueba su carpeta en el proyecto abierto y abre una sesión nueva. Puedes pedir leer explícitamente su `SKILL.md`. |
| Demo bloqueada en Testnet | Usa una instalación local independiente para la demo sintética; no alteres una base Testnet para simular pagos. |
| Interfaz de wallet sin bundle | Ejecuta `npm run build:wallet` después de `npm ci`. La wallet no es necesaria para consultar herramientas. |

Las rutas y capacidades de los clientes se contrastaron con documentación oficial el **25 de septiembre de 2026**. Esto no constituye una prueba interactiva de todas sus versiones: cada instalación se valida con la llamada del paso 4. El estado de validación de Hito y los límites pendientes están en [REMAINING_GATES.md](REMAINING_GATES.md).
