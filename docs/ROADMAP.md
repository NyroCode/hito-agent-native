# Hoja de ruta

## Completar la validación del alcance actual

El alcance actual es una herramienta local con MCP, acuerdos remunerados, evidencia declarada y preparación de operaciones Stellar Testnet con autorización humana. Consulta resultados en [VALIDATION.md](VALIDATION.md) y pasos pendientes en [REMAINING_GATES.md](REMAINING_GATES.md).

La siguiente validación debe demostrar uso desde el cliente del usuario y el recorrido Testnet completo `create → accept → fund → submit → approve → release`, conservando recibos y balances. Compilar, conectar MCP o confirmar un `create` demuestra solo parte de ese recorrido. Priorizar defectos que lo impidan antes de ampliar funciones.

## Validar utilidad

Probar acuerdos representativos usando únicamente activos de prueba. Observar claridad de hitos y criterios, esfuerzo humano de preparación y revisión y recuperación de contexto por otra sesión del agente. Evaluar por separado el aporte de las instrucciones del agente y el de los registros y controles de Hito.

## Candidatos sujetos a decisión de producto

Estas posibilidades no están implementadas ni comprometidas; cada una requiere alcance y criterios explícitos:

1. Trabajos internos sin importe y referencias a issues existentes, sin duplicar tareas.
2. Cambios de alcance versionados con consentimiento de ambas partes y protección de obligaciones financiadas.
3. Procedencia CI autorizada y comprobación de artefactos, con aislamiento de cualquier ejecución.
4. Servicio de verificación pagada, solo cuando exista una necesidad concreta y controles de cobro.
5. Servicio remoto con autenticación, aislamiento de usuarios y revisión de seguridad previa.
6. Política de disputas y recuperación acordada por las partes.

Se mantiene el canon: el modelo del usuario planifica y programa; Hito guarda acuerdos y prepara operaciones autorizadas. No se incorpora LLM propio, memoria que se reescribe, agentes autónomos que cambian repositorios ni arbitraje unilateral del modelo.
