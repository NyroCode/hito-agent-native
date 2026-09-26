# Paquete de entrega — Stellar Odyssey Perú 2026

Actualizado: 25 de septiembre de 2026, America/Lima.

## Decisión de posicionamiento

Track recomendado: **Open Build / Wildcard**.

Hito encaja como herramienta para la comunidad de desarrolladores y cruza agentes, seguridad y pagos. No conviene competir como un agente financiero autónomo: el producto está diseñado para que el agente prepare y documente, mientras una persona conserva la autoridad de firma.

Frase corta:

> Hito convierte el trabajo de un agente de código en acuerdos verificables por hitos y pagos autorizados en Stellar, sin entregarle las llaves de la wallet.

## Guion de video pitch — máximo 3 minutos

Duración objetivo: 2:40–2:50. Hablar con la interfaz visible; evitar diapositivas largas.

### 0:00–0:25 — Problema

> Hoy un agente de código puede planificar, programar y ejecutar pruebas, pero el acuerdo económico sigue viviendo en mensajes y transferencias manuales. El cliente no puede comprobar fácilmente qué se prometió, qué evidencia corresponde a cada hito o si un pago ya fue liberado. Y darle una wallet directamente al agente crea un riesgo todavía mayor.

### 0:25–0:55 — Solución

> Creamos Hito: una herramienta agent-native que conecta el flujo de desarrollo con acuerdos verificables y pagos autorizados en Stellar. El agente mantiene el plan, los criterios, el progreso y la evidencia usando siete herramientas MCP. Las personas revisan y firman. El contrato Soroban hace cumplir importes, roles, dependencias y un único pago por hito.

### 0:55–1:45 — Demo rápida

> Aquí el agente recupera un trabajo existente desde Hito, sin perder contexto entre sesiones. Puede guardar un borrador estructurado, actualizar el avance y presentar una entrega con el hash exacto del artefacto. La interfaz muestra que un PASS declarado solo deja el hito listo para revisión humana: nunca lo acepta ni lo paga automáticamente. Cuando se prepara una operación económica, el agente no recibe el XDR ni puede firmar; la persona revisa la transacción y autoriza con su wallet.

Mientras se narra: mostrar trabajo, criterios, progreso, evidencia, readiness y solicitud `REQUESTED`.

### 1:45–2:20 — Stellar

> En Stellar Testnet desplegamos un escrow Soroban. El acuerdo queda comprometido por hash y cada rol tiene permisos distintos: el proveedor acepta y presenta evidencia; el pagador financia y aprueba; la liberación siempre va al destino acordado. El contrato rechaza dobles liberaciones y cambios de evidencia. La transacción de creación está confirmada en el ledger 4,784,176 y está enlazada en el README.

Mostrar Stellar Expert con la transacción y el contrato. No afirmar que el ciclo completo de pago está publicado si aún no existen esos recibos.

### 2:20–2:50 — Diferenciación y cierre

> Hito no reemplaza al agente ni le entrega custodia. Convierte su trabajo en un proceso auditable donde código, evidencia, consentimiento y pago permanecen conectados. Hoy funciona localmente con Codex, Claude Code y Cursor, y el siguiente paso es completar el ciclo Testnet público e integrar evidencia de CI verificable. Hito: trabajo de agentes, acuerdos humanos y liquidación programable en Stellar.

## Video demo para el jurado — recorrido recomendado

Duración sugerida: 6–8 minutos. Este video es distinto del pitch y no tiene límite oficial.

1. **Problema y arquitectura, 40 s.** Mostrar el diagrama del README y explicar agente → MCP → API/SQLite → revisión humana/Freighter → Soroban.
2. **Arranque reproducible, 30 s.** Mostrar el servidor y `doctor` en estado correcto. No enseñar `.env` ni tokens.
3. **Agente real por MCP, 90 s.** Desde Codex, Claude Code o Cursor: recuperar el proyecto `demo`, leer el trabajo y actualizar una nota de progreso. Mostrar que no duplica el trabajo.
4. **Acuerdo humano, 60 s.** Abrir la UI, conectar el token admin sin que aparezca en el video, revisar el borrador y sellarlo. Explicar que el hash compromete partes, activo, hitos y criterios.
5. **Evidencia, 75 s.** Ejecutar una comprobación real, calcular el SHA-256, registrar la entrega y mostrar `readyForHumanReview: true`, `automaticallyAccepted: false`.
6. **Separación de autoridad, 60 s.** Preparar una solicitud y mostrar estado `REQUESTED`. Señalar que el agente no puede construir, firmar ni enviar la transacción.
7. **Stellar Testnet, 60 s.** Abrir los enlaces de Stellar Expert del README. Mostrar contrato, hash, éxito y ledger. Decir con precisión que la evidencia publicada acredita `create`.
8. **Profundidad técnica, 45 s.** Mostrar brevemente 93 pruebas core, 9 de adaptadores, 31 de contrato y el test de navegador. No decir “auditado” ni “producción”.
9. **Cierre, 20 s.** Resumir valor, track y siguiente gate.

## Checklist antes de subir

- [ ] Cambiar el repositorio a público y probar la URL en una ventana privada sin iniciar sesión.
- [ ] Confirmar que todos los integrantes declarados aparecen como colaboradores activos.
- [ ] Confirmar el commit base declarado en el checkpoint y que el README explica el trabajo posterior.
- [ ] Elegir únicamente `Open Build / Wildcard` en el Dashboard.
- [ ] Grabar y subir el video demo sin límite; pegar su URL.
- [ ] Grabar y subir el video pitch de menos de 3:00; pegar su URL.
- [ ] Pegar como evidencia on-chain el link de la transacción o del contrato y conservar ambos en el README.
- [ ] Verificar audio, permisos de los videos y links desde una sesión incógnita.
- [ ] Enviar todo antes de las 23:59 del 25 de septiembre de 2026, hora de Lima.

## Datos verificados para la entrega

- Contrato: `CDYW3A7EM44O2SJCPMFM2GFYBJL5WFJD3TPAYQF6AMASQ3XXI64AHEQZ`.
- Transacción: `1ff3b0c2ff51723cac49d8044ce0e3e7fbe44e9cc51f57c77fbb8eaec6c1e080`.
- Ledger: `4784176`.
- Resultado consultado en Horizon Testnet: `successful: true`.
- Alcance probado ahora en esta máquina: sintaxis, 93 pruebas core, TypeScript, 9 pruebas de adaptadores, bundle wallet y navegador Chrome escritorio/móvil.
- Límite: falta publicar evidencia del ciclo completo `accept → fund → submit → approve → release`.

## Lo que no debe afirmarse

- Que Hito es un servicio de producción o que fue auditado.
- Que la evidencia del agente es verificación independiente.
- Que conectar Freighter demuestra una firma real.
- Que la transacción `create` demuestra financiación o liberación.
- Que el agente tiene custodia o ejecuta pagos autónomos.
