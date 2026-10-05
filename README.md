# Walking Tracker

Proyecto de aplicación web móvil para registrar caminatas mediante GPS, orientado inicialmente a iPhone. El stack aprobado es React + TypeScript + Vite, sin backend y con almacenamiento local en el navegador.

## Estado

T00 — Crear estructura documental y base del repositorio ejecutada el 2026-10-05 y pendiente de revisión. La aplicación todavía no está creada: no hay dependencias, scripts npm ni lógica funcional. T01 no ha comenzado.

## Estructura inicial

- `docs/`: requisitos, decisiones, arquitectura, plan de implementación, estado y evidencias de validación.
- `src/`: reservado para código de la aplicación; contiene únicamente `.gitkeep`.
- `tests/`: reservado para pruebas; contiene únicamente `.gitkeep`.
- `AGENTS.md`: instrucciones de trabajo para agentes.
- `.gitignore`: exclusiones para el futuro proyecto React + TypeScript + Vite.

## Documentación

- [Requisitos](docs/REQUIREMENTS.md)
- [Decisiones](docs/DECISIONS.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Plan de implementación](docs/IMPLEMENTATION-PLAN.md)
- [Estado actual](docs/CURRENT_STATE.md)
- [Plan de validación](docs/TEST-PLAN.md)
- [Resultados de validación](docs/TEST-RESULTS.md)

## Desarrollo

El bootstrap con Vite corresponde a T01 y requiere aprobación de T00 y autorización para esa tarea. Los comandos de ejecución, build y pruebas se documentarán cuando estén disponibles.

El tracking confiable del MVP requerirá mantener la página visible y activa; no se garantiza tracking con pantalla bloqueada o navegador en segundo plano.
