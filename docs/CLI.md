# CLI de Hito

La CLI usa la misma API y permisos limitados que MCP. Carga `.hito-agent.env` desde la instalación de Hito; nunca carga `.env`. También permite `HITO_API_URL` y `HITO_AGENT_TOKEN` proporcionados por el entorno. El backend debe estar activo.

```bash
npm run cli -- help
npm run cli -- projects
npm run cli -- works demo
npm run cli -- context WORK_ID
npm run cli -- readiness WORK_ID MILESTONE_ID
npm run cli -- status INTENT_ID
npm run cli -- reconcile INTENT_ID
```

Sustituye los IDs por los valores devueltos por Hito. `reconcile` consulta el hash existente y puede actualizar su estado; no vuelve a pagar.

Desde otra carpeta, usa la ruta absoluta de la CLI:

```bash
node --experimental-strip-types /ruta/a/hito/src/cli/main.ts projects
```

Las rutas con espacios deben ir entre comillas. Los archivos JSON de entrada se resuelven desde tu directorio actual.

## Escrituras

Cada escritura exige un archivo JSON y una clave estable de idempotencia:

```bash
HITO_IDEMPOTENCY_KEY=mi-plan-v1 npm run cli -- save PROJECT_ID plan.json
HITO_IDEMPOTENCY_KEY=avance-1 npm run cli -- progress WORK_ID progress.json
HITO_IDEMPOTENCY_KEY=entrega-1 npm run cli -- delivery WORK_ID delivery.json
HITO_IDEMPOTENCY_KEY=solicitud-1 npm run cli -- prepare WORK_ID intent.json
```

Ese formato de variable es para Bash/Zsh. En PowerShell, establece primero `$env:HITO_IDEMPOTENCY_KEY = "mi-plan-v1"` y ejecuta después el comando npm. No pongas tokens en los ejemplos ni en el historial de shell.

Reutiliza la clave solo para repetir exactamente la misma operación. Si cambias el contenido, usa una clave nueva. Si hay timeout, conserva archivo y clave para el reintento. Un conflicto de versión requiere recuperar el trabajo y decidir cómo combinar los cambios.

### Borrador

`plan.json` contiene `{ "plan": { ... } }`, como [plan.template.json](../examples/plan.template.json). Ajusta presupuesto, criterios y fecha antes de usarlo; `deadline` es Unix en segundos, futuro y dentro del próximo año. No presupongas el precio de un trabajo real. Para editar agrega `workId` y `expectedVersion` al nivel de `plan`:

```json
{
  "workId": "ID_EXISTENTE",
  "expectedVersion": 1,
  "plan": {
    "title": "Título acordado",
    "description": "Alcance y referencias acordados",
    "deadline": 1798761600,
    "totalUnits": "10000000",
    "milestones": [{
      "id": "entrega",
      "title": "Resultado verificable",
      "amountUnits": "10000000",
      "dependsOn": [],
      "criteria": [{"id": "criterio", "text": "Condición concreta acordada", "evidence": "self_reported"}]
    }]
  }
}
```

La fecha y los importes de este ejemplo deben sustituirse por los acordados. Los importes son strings de unidades base, con suma exacta; el número de decimales viene del proyecto.

### Progreso

```json
{"milestoneId":"entrega","status":"IN_PROGRESS","note":"Estado real, bloqueo o próximo paso"}
```

Estados disponibles: `TODO`, `IN_PROGRESS`, `BLOCKED`, `READY_FOR_REVIEW`. El progreso no modifica el estado económico.

### Entrega

```json
{
  "milestoneId": "entrega",
  "artifactHash": "SUSTITUIR_POR_SHA256_REAL_DE_64_CARACTERES_HEX",
  "reference": "https://URL_AUTORIZADA_DEL_ARTEFACTO",
  "checks": [{"criterionId":"criterio","status":"NOT_CHECKED","detail":"La comprobación todavía no se ejecutó"}]
}
```

Los marcadores no son entradas válidas: calcula el hash y proporciona la referencia real. Se exige un trabajo sellado y exactamente un resultado por criterio. El hash de evidencia devuelto por Hito es distinto del hash del artefacto y vincula toda la entrega al acuerdo.

### Solicitud económica

```json
{"action":"create"}
```

Para `submit`, `approve` o `release`, agrega `milestoneId` y el `evidenceHash` de una entrega registrada. La CLI prepara la solicitud; la UI humana construye y solicita la firma. No ofrece comandos de administrador, sellado ni firma. Consulta las acciones completas en el [contrato REST](../specs/001-hito-agent-native/contracts/api.openapi.json).
