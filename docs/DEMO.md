# Recorrido local con un agente

Esta práctica recorre contexto, borrador, revisión humana, progreso, evidencia y solicitud económica. Usa exclusivamente el proyecto sintético `demo`, sin wallets ni transacciones. Primero completa la instalación y conexión de [AGENT_SETUP](AGENT_SETUP.md).

## 1. Recuperar contexto y preparar el trabajo

Pide a tu agente:

> Usa Hito en el proyecto `demo`. Consulta los trabajos y recupera el borrador existente. Para esta práctica autorizo reemplazar su plan mientras siga DRAFT por «Revisión de la interfaz local», con un único hito `interfaz`, importe sintético total `100000000` unidades de TOKEN FICTICIO y plazo de siete días desde ahora. El criterio `html` es: «La URL local de Hito responde HTTP 200 y su HTML contiene el título Hito». Usa evidencia `self_reported`. Guarda la edición con el workId y expectedVersion actuales. Si el trabajo ya está sellado, crea un nuevo borrador de esta práctica y explícame su ID. No registres todavía resultados.

El agente debe usar `hito_get_context` y `hito_save_work`, devolver un `workId`, una versión y estado `DRAFT`. Los importes son expresamente ficticios; no representan una cotización real. Reintentar la misma escritura con la misma clave no debe crear otro trabajo.

## 2. Revisar y sellar

En la UI, conecta personalmente tu token humano, selecciona el proyecto y abre el trabajo. Revisa título, criterio, importe y plazo. Pulsa **Sellar borrador**. El estado cambia a `SEALED` y aparece el hash del acuerdo. Sellar no financia ni paga.

## 3. Probar y registrar evidencia verdadera

Pide:

> Recupera el trabajo [workId] desde Hito. Registra el hito `interfaz` como IN_PROGRESS. Consulta la URL local de Hito, verifica el código HTTP y el título, y calcula SHA-256 de los mismos bytes HTML recibidos. Registra esa URL como referencia, el digest real como artifactHash y un resultado veraz para el criterio `html`. Si no puedes ejecutar la comprobación, no declares PASS. Consulta después `hito_check_readiness` y registra el estado de progreso que corresponda.

El agente puede ejecutar esta comprobación con sus herramientas normales. Por ejemplo, con el puerto predeterminado:

```bash
node --input-type=module -e 'import {createHash} from "node:crypto"; const r=await fetch("http://127.0.0.1:8787/"); const b=Buffer.from(await r.arrayBuffer()); console.log(JSON.stringify({status:r.status,hasHitoTitle:/<title>Hito/.test(b.toString()),artifactHash:createHash("sha256").update(b).digest("hex")},null,2));'
```

Adapta la URL si cambiaste el puerto. La URL es una referencia local accesible solo mientras tu servidor está activo; para una entrega compartida utiliza una referencia HTTP(S) estable autorizada por el equipo. Hito almacena la referencia y no descarga el artefacto.

El resultado positivo debe ser `readyForHumanReview: true`, con `automaticallyAccepted: false` e `independentVerification: false`. Si falla la prueba, registra `FAIL`; si no se ejecutó, `NOT_CHECKED`. Ambos mantienen bloqueada la preparación de aceptación. La clasificación `self_reported` se conserva incluso cuando el agente ejecutó una prueba real.

## 4. Preparar una solicitud sin realizar un pago

Pide:

> Para el mismo trabajo de práctica, prepara únicamente la solicitud `create` con `hito_prepare_payment`. Consulta su estado usando `hito_get_payment_status`. Informa qué autorización falta.

El resultado esperado es `REQUESTED`, sin hash de transacción ni XDR accesible al agente. La solicitud permanece registrada. En modo local, intentar construir una transacción en la UI se rechaza expresamente. No hay financiación, firma o liberación simulada.

## 5. Continuar en otra sesión

Abre una conversación nueva con la misma conexión MCP:

> Usa Hito para recuperar el trabajo [workId] del proyecto `demo`. Resume el acuerdo, la última evidencia, el progreso y la solicitud existente. No lo dupliques ni prepares otra solicitud económica.

El agente debe recuperar los registros persistidos por Hito. Su conocimiento del código sigue viniendo de la carpeta abierta y sus herramientas habituales.

## Pasar a Testnet

El recorrido económico completo necesita un contrato de Testnet, partes reales de esa red, un nuevo proyecto y las firmas de cada rol. Sigue [TESTNET_RUNBOOK](TESTNET_RUNBOOK.md). Un video o captura de esta práctica local solo demuestra el recorrido local.
