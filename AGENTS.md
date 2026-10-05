# Instrucciones para agentes — Walking Tracker

## Fuentes del proyecto

Antes de ejecutar una tarea, leer:

1. `docs/REQUIREMENTS.md`.
2. `docs/DECISIONS.md`.
3. `docs/ARCHITECTURE.md`.
4. `docs/IMPLEMENTATION-PLAN.md`.
5. `docs/CURRENT_STATE.md` para conocer el avance y los hallazgos.

## Alcance y decisiones

- Ejecutar únicamente la tarea autorizada y verificar sus criterios de aceptación.
- No avanzar a una tarea dependiente hasta que la anterior esté aprobada y exista autorización para continuar.
- No modificar requisitos, decisiones, arquitectura ni criterios de aceptación sin autorización.
- Si hay conflictos entre documentos, registrar el hallazgo y escalar la decisión antes de implementar el área afectada.
- Evitar dependencias, abstracciones y funcionalidades ajenas a la tarea.

## Implementación

Respetar React + TypeScript + Vite y el MVP sin backend. Separar UI, dominio, servicios del navegador y persistencia según la arquitectura. Conservar los datos GPS originales y distinguir valores medidos de estimados.

## Verificación y entrega

- Revisar el estado Git inicial y preservar cambios existentes del usuario.
- Ejecutar verificaciones apropiadas para la tarea; no presentar pruebas no ejecutadas como aprobadas.
- Actualizar `docs/CURRENT_STATE.md` y registrar validaciones en `docs/TEST-RESULTS.md`.
- Entregar archivos creados/modificados, criterios de aceptación, resultados y hallazgos o bloqueos.

## Estado de preparación

T00 está ejecutada y pendiente de revisión. El bootstrap React, la instalación de dependencias y la lógica funcional pertenecen a tareas posteriores y requieren autorización.
