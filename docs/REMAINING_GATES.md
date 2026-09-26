# Estado de verificación y gates restantes

Actualizado el 25-sep-2026 (America/Lima). Los resultados locales actuales se resumen en [VALIDATION](VALIDATION.md). Los gates distinguen instalación, uso del protocolo, firma humana y confirmación de red.

| Gate | Estado | Alcance y requisito restante |
|---|---|---|
| G1 · instalación, tipos y núcleo | PASS local | Lock npm incluido; sintaxis, tipos y pruebas core ejecutados. |
| G2 · MCP y skill | PASS de transporte; validación por cliente pendiente | SDK real descubre y utiliza siete herramientas; onboarding desde otro proyecto probado, con rutas con espacios. Cada cliente se valida mediante la llamada real de [AGENT_SETUP](AGENT_SETUP.md). No se afirma haber operado interactivamente las tres aplicaciones. |
| G3 · contrato Rust | PASS local | 31 pruebas nativas; WASM construido con dependencias bloqueadas. No equivale a despliegue ni auditoría. |
| G4 · UI, wallet y recuperación | PASS automatizado; firma humana separada | Chromium escritorio/móvil y negativas de wallet con transporte simulado; firma/cuerpo/red mediante SDK real. Las pruebas actuales no abren una wallet personal. Hay un uso previo de Freighter reportado junto con el `create` descrito abajo. |
| G5 · ciclo Testnet completo | PARTIAL | Se conserva un contrato y un `create` reportados previamente. Faltan recibos del ciclo completo, balances y negativas de pago. |
| G6 · entrega reproducible | PASS local | Instalación desde copia limpia y pruebas documentadas; una grabación con firmas y pago requiere terminar G5. |
| G7 · requisitos de una entrega externa | Fuera de la validación técnica | Quien presente el proyecto verifica las reglas y su elegibilidad; no se deducen del código. |
| G8 · x402 | Fuera del MVP | No implementado ni requerido por el recorrido local. |
| G9 · servicio público, CI de evidencia y producción | Fuera del MVP | OAuth, identidad multiusuario, verificador trusted_ci y auditoría requieren diseño y validación adicionales. |

## Registro Testnet previo

La documentación anterior registró este contrato y una creación de acuerdo:

- Contrato: `CDYW3A7EM44O2SJCPMFM2GFYBJL5WFJD3TPAYQF6AMASQ3XXI64AHEQZ`.
- Transacción `create`: `1ff3b0c2ff51723cac49d8044ce0e3e7fbe44e9cc51f57c77fbb8eaec6c1e080`.
- Ledger reportado: `4784176`, red Testnet.

Se conservan como registro previo; no se reconsultaron en esta revisión. El repositorio no incorpora recibos y balances completos de `accept → fund → submit → approve → release`. Por ello se corrige la antigua etiqueta general «PASS Testnet»: crear un acuerdo no acredita el pago de un hito. Un reset de Testnet también puede afectar la consulta de datos históricos.

## Para cerrar G5

Seguir [TESTNET_RUNBOOK](TESTNET_RUNBOOK.md) con partes, activo y contrato verificados. El humano autoriza las firmas por rol. Guardar cada hash original, resultado final, ledger, lecturas de estado y balances antes/después. Comprobar que una segunda liberación no transfiere otra vez y registrar los casos de cancelación/vencimiento requeridos por la especificación.

El WASM construido en una nueva revisión puede tener un hash distinto al histórico: no asumir que el contrato desplegado usa automáticamente el código local nuevo.

## Límites vigentes

- `UNKNOWN` y `NOT_FOUND` sin prueba concluyente mantienen incertidumbre y bloqueo; no borrar locks para continuar.
- Las pruebas locales del repositorio del usuario siguen siendo evidencia declarada. `trusted_ci` no está disponible.
- El servidor es local, con un operador y una credencial de agente restringida por proyecto; no es un servicio remoto multiusuario.
- Hitos remunerados exclusivamente en v0.1. Un plan sin presupuesto no se guarda usando importes ficticios en un proyecto real.
- Contrato sin arbitraje ni auditoría externa; no habilitado para fondos reales.

El histórico de [reports/build](../reports/build/VALIDATION.md) se conserva sin reescribir sus resultados. Las nuevas ejecuciones crean informes independientes.
