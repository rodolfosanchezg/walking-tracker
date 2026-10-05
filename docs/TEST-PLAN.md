# Plan de validación

## Alcance actual: T00

Validación documental y de la base del repositorio. No requiere instalar herramientas, crear la aplicación ni ejecutar pruebas funcionales.

| ID | Verificación | Resultado esperado |
|---|---|---|
| T00-V01 | Inspeccionar `docs/`, `src/` y `tests/` | Carpetas presentes; `src/` y `tests/` conservables en Git mediante `.gitkeep`. |
| T00-V02 | Inspeccionar los siete documentos de `docs/`, README y AGENTS | Archivos presentes y con contenido inicial útil. |
| T00-V03 | Comparar los cuatro documentos principales con HEAD y hashes iniciales | Contenido idéntico; ningún cambio en requisitos, decisiones, arquitectura o plan. |
| T00-V04 | Usar `git check-ignore --no-index --stdin` con rutas representativas | Dependencias, builds, cachés, cobertura, logs y configuración local ignorados; fuentes, pruebas, documentación y plantillas de entorno visibles. |
| T00-V05 | Ejecutar `git status --short --branch --untracked-files=all` y `git diff --check` | Solo cambios de T00 y sin errores de whitespace. Estado limpio literal después del commit de los cambios revisados. |
| T00-V06 | Inspeccionar archivos y carpetas del proyecto | Sin package.json, scaffold React, dependencias ni código funcional; T01 sin comenzar. |

Registrar resultados, límites y hallazgos en `TEST-RESULTS.md`.

## Etapas posteriores

La configuración de pruebas corresponde a T03. El plan funcional completo corresponde a T29, siguiendo `ARCHITECTURE.md` §18 y `IMPLEMENTATION-PLAN.md`. No se ejecutan esas tareas en T00.
