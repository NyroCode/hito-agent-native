# Empieza aquí

Hito permite que tu agente de código gestione acuerdos de trabajo, hitos, progreso, evidencia y solicitudes de pago autorizadas.

1. Sigue [README](README.md) para instalar con `npm ci`, crear la configuración local y abrir la demo.
2. Conecta tu cliente mediante [AGENT_SETUP](docs/AGENT_SETUP.md). Hito puede vivir en una carpeta distinta de tu proyecto.
3. Practica el [recorrido local](docs/DEMO.md) o registra tu propio proyecto con la [guía de configuración](docs/CONFIGURATION.md).
4. Consulta [VALIDATION](docs/VALIDATION.md) y [REMAINING_GATES](docs/REMAINING_GATES.md) antes de interpretar pruebas locales como evidencia de pagos.

Para desarrollar Hito, lee [AGENTS](AGENTS.md), la [constitución](.specify/memory/constitution.md), la [especificación](specs/001-hito-agent-native/spec.md), su plan y tareas, y [CONTRIBUTING](CONTRIBUTING.md). El informe de [reports/build](reports/build/VALIDATION.md) describe la primera entrega y se conserva como histórico.

Cada instalación genera sus credenciales. No compartas `.env`, `.hito-agent.env`, la base de datos ni configuraciones con rutas personales. La demo local no necesita wallet; las operaciones de red siguen el [runbook Testnet](docs/TESTNET_RUNBOOK.md).
