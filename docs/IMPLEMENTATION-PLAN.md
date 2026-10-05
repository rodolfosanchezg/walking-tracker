# IMPLEMENTATION-PLAN.md

## 1. Propósito

Convertir `REQUIREMENTS.md`, `DECISIONS.md` y `ARCHITECTURE.md` en un plan de implementación incremental, verificable y apto para ejecución por el Senior Developer.

El plan prioriza:

- riesgo técnico bajo;
- validación temprana;
- separación clara entre infraestructura, dominio y UI;
- pruebas desde etapas iniciales;
- evitar implementar funcionalidades futuras antes de tiempo.

---

## 2. Principios de ejecución

1. Cada tarea debe ser pequeña y verificable.
2. No se debe avanzar a una tarea dependiente si la anterior no está aprobada.
3. Toda funcionalidad nueva debe incluir pruebas cuando aplique.
4. Los cambios arquitectónicos requieren revisión previa.
5. No se deben añadir dependencias externas sin necesidad concreta.
6. El MVP debe mantenerse sin backend.
7. Las pruebas reales en iPhone son obligatorias para cerrar tracking.

---

## 3. Orden general

El desarrollo se divide en nueve fases:

1. Bootstrap del proyecto.
2. Estructura base y navegación.
3. Persistencia local.
4. Servicios del navegador.
5. Dominio de métricas.
6. Tracking activo.
7. Historial y detalle.
8. Recuperación y robustez.
9. Validación real y despliegue.

---

# FASE 0 — Preparación del repositorio

## T00 — Crear estructura documental y base del repositorio

### Objetivo
Dejar el repositorio listo para desarrollo sin implementar lógica funcional.

### Actividades
- crear estructura `docs/`;
- agregar:
  - `REQUIREMENTS.md`;
  - `DECISIONS.md`;
  - `ARCHITECTURE.md`;
  - `IMPLEMENTATION-PLAN.md`;
  - `CURRENT_STATE.md`;
  - `TEST-PLAN.md`;
  - `TEST-RESULTS.md`;
- crear `README.md`;
- crear `AGENTS.md`;
- configurar `.gitignore`;
- inicializar repositorio Git si todavía no existe.

### Criterios de aceptación
- estructura de carpetas creada;
- documentos presentes;
- repositorio limpio;
- `git status` sin archivos inesperados.

### Dependencias
Ninguna.

---

# FASE 1 — Bootstrap técnico

## T01 — Crear proyecto React + TypeScript + Vite

### Objetivo
Crear la aplicación base usando el stack aprobado.

### Actividades
- crear proyecto React + TypeScript con Vite;
- verificar ejecución local;
- verificar build de producción;
- confirmar Node 24 LTS;
- revisar scripts npm.

### Criterios de aceptación
- `npm run dev` funciona;
- `npm run build` termina sin errores;
- TypeScript compila;
- aplicación base carga en navegador.

### Dependencias
T00.

---

## T02 — Instalar dependencias aprobadas

### Objetivo
Instalar únicamente las dependencias arquitectónicas autorizadas.

### Dependencias runtime
- `react-router-dom`;
- `leaflet`;
- `dexie`;
- `chart.js`.

### Dependencias de desarrollo
- `vitest`;
- `@testing-library/react`;
- `@testing-library/jest-dom`;
- tipos necesarios para Leaflet y tooling.

### Actividades
- instalar dependencias;
- revisar `package.json`;
- verificar que no existan dependencias innecesarias;
- ejecutar build.

### Criterios de aceptación
- instalación limpia;
- build correcto;
- dependencias aprobadas solamente.

### Dependencias
T01.

---

## T03 — Configurar testing

### Objetivo
Dejar Vitest y React Testing Library operativos antes de implementar lógica funcional.

### Actividades
- configurar Vitest;
- configurar entorno DOM de pruebas;
- agregar prueba mínima de componente;
- agregar prueba mínima de función TypeScript.

### Criterios de aceptación
- `npm test` o script equivalente ejecuta pruebas;
- al menos una prueba de componente PASS;
- al menos una prueba de dominio PASS.

### Dependencias
T02.

---

# FASE 2 — Estructura de aplicación

## T04 — Crear estructura de carpetas

### Objetivo
Implementar la estructura aprobada en `ARCHITECTURE.md`.

### Actividades
Crear:

- `src/app/`;
- `src/features/tracking/`;
- `src/features/history/`;
- `src/features/settings/`;
- `src/features/maps/`;
- `src/services/geolocation/`;
- `src/services/visibility/`;
- `src/services/wakeLock/`;
- `src/data/db/`;
- `src/data/repositories/`;
- `src/data/migrations/`;
- `src/domain/metrics/`;
- `src/domain/elevation/`;
- `src/domain/filtering/`;
- `src/domain/estimation/`;
- `src/components/`;
- `src/hooks/`;
- `src/utils/`;
- `src/types/`.

### Criterios de aceptación
- estructura coincide con arquitectura;
- no existe lógica duplicada;
- imports base funcionan.

### Dependencias
T03.

---

## T05 — Configurar navegación

### Objetivo
Crear las vistas principales sin lógica funcional.

### Rutas
- Home;
- Active Walk;
- History;
- Walk Detail;
- Settings.

### Criterios de aceptación
- todas las rutas cargan;
- navegación funciona;
- no existen errores de consola;
- layout móvil básico utilizable.

### Dependencias
T04.

---

# FASE 3 — Persistencia local

## T06 — Definir modelos TypeScript

### Objetivo
Definir tipos base del dominio y persistencia.

### Modelos mínimos
- `Walk`;
- `TrackPoint`;
- `ActiveSession`;
- `Settings`;
- estados de calidad GPS;
- estados de caminata.

### Criterios de aceptación
- modelos tipados;
- nulabilidad explícita;
- datos medidos y estimados distinguibles;
- no hay campos no aprobados innecesarios.

### Dependencias
T04.

---

## T07 — Configurar Dexie e IndexedDB

### Objetivo
Crear esquema local versionado.

### Tablas
- `walks`;
- `trackPoints`;
- `activeSession`;
- `settings`.

### Actividades
- crear DB versión 1;
- definir índices mínimos;
- crear capa de inicialización;
- documentar esquema.

### Criterios de aceptación
- base abre correctamente;
- esquema se crea;
- versión registrada;
- pruebas de lectura/escritura PASS.

### Dependencias
T06.

---

## T08 — Crear repositories

### Objetivo
Evitar acceso directo a Dexie desde componentes.

### Repositories mínimos
- WalkRepository;
- TrackPointRepository;
- ActiveSessionRepository;
- SettingsRepository.

### Criterios de aceptación
- CRUD básico probado;
- componentes no importan Dexie directamente;
- tests de repositorios PASS.

### Dependencias
T07.

---

# FASE 4 — Servicios del navegador

## T09 — Servicio de geolocalización

### Objetivo
Encapsular Web Geolocation API.

### Responsabilidades
- `watchPosition`;
- detener tracking;
- mapear datos crudos;
- exponer errores;
- no calcular métricas.

### Criterios de aceptación
- servicio aislado;
- callback de posiciones probado con mocks;
- errores manejados;
- tracking puede iniciar/detenerse.

### Dependencias
T06.

---

## T10 — Servicio de Page Visibility

### Objetivo
Detectar cambios de visibilidad de la página.

### Criterios de aceptación
- detecta visible/hidden;
- permite suscripción y cleanup;
- pruebas con eventos simulados PASS.

### Dependencias
T04.

---

## T11 — Servicio de Wake Lock

### Objetivo
Encapsular Screen Wake Lock API.

### Responsabilidades
- solicitar bloqueo;
- liberar bloqueo;
- detectar release;
- manejar ausencia de soporte.

### Criterios de aceptación
- fallback correcto cuando API no existe;
- no genera errores fatales;
- pruebas con mocks PASS.

### Dependencias
T04.

---

# FASE 5 — Dominio de métricas

## T12 — Distancia

### Objetivo
Implementar cálculo de distancia entre puntos válidos.

### Criterios de aceptación
- función pura;
- casos normales PASS;
- puntos inválidos excluidos;
- pruebas de borde PASS.

### Dependencias
T06.

---

## T13 — Tiempo, velocidad y ritmo

### Objetivo
Implementar:
- tiempo activo;
- tiempo total;
- velocidad promedio;
- ritmo promedio;
- conversiones de unidades.

### Criterios de aceptación
- funciones puras;
- usa tiempo activo donde corresponde;
- conversiones métricas/imperiales probadas.

### Dependencias
T12.

---

## T14 — Calidad GPS y anomalías

### Objetivo
Crear pipeline inicial de clasificación.

### Consideraciones
- precisión;
- salto de distancia;
- velocidad aparente;
- coherencia temporal.

### Importante
Los valores exactos deberán salir de parámetros configurables, no hardcodeados sin documentación.

### Criterios de aceptación
- puntos originales preservados;
- clasificación separada;
- puntos sospechosos y anómalos distinguibles;
- tests PASS.

### Dependencias
T12.

---

## T15 — Altitud

### Objetivo
Implementar:
- filtrado de ruido;
- detección de valores anómalos;
- suavizado;
- interpolación;
- ganancia;
- pérdida.

### Criterios de aceptación
- funciones puras;
- datos originales no modificados;
- valores estimados marcados;
- tests con perfiles sintéticos PASS.

### Dependencias
T06.

---

# FASE 6 — Tracking activo

## T16 — Estado de sesión de caminata

### Objetivo
Crear modelo de estado para:
- idle;
- active;
- paused;
- incomplete;
- finished.

### Criterios de aceptación
- transiciones válidas definidas;
- transiciones inválidas bloqueadas;
- tests PASS.

### Dependencias
T06.

---

## T17 — Orquestador de tracking

### Objetivo
Conectar:
- geolocation service;
- dominio;
- buffer de persistencia;
- estado React.

### Responsabilidades
- iniciar;
- pausar;
- reanudar;
- finalizar;
- cancelar.

### Criterios de aceptación
- flujo básico completo;
- pausa excluye puntos de ruta activa;
- métricas se actualizan;
- no hay acceso directo a IndexedDB desde UI.

### Dependencias
T08, T09, T12, T13, T14, T15, T16.

---

## T18 — Persistencia por bloques

### Objetivo
Guardar puntos periódicamente.

### Actividades
- buffer de puntos;
- trigger por tiempo;
- trigger por cantidad;
- flush manual;
- flush por visibility change.

### Criterios de aceptación
- puntos persistidos por bloques;
- flush manual funciona;
- sesión activa actualizada;
- recuperación no pierde bloques ya guardados.

### Dependencias
T08, T10, T17.

---

## T19 — Vista Active Walk

### Objetivo
Implementar UI principal de tracking.

### Debe mostrar
- duración;
- distancia;
- velocidad o ritmo;
- precisión GPS;
- estado;
- controles;
- mapa;
- alternancia con perfil de altitud.

### Criterios de aceptación
- controles funcionales;
- estado pausado visible;
- responsive en móvil;
- sin lógica de dominio dentro de componentes.

### Dependencias
T17.

---

## T20 — Integración Leaflet

### Objetivo
Mostrar posición y ruta.

### Criterios de aceptación
- posición actual visible;
- polyline actualizada;
- seguimiento automático;
- pan y zoom manual;
- fit bounds en recorridos guardados;
- segmentos degradados representables.

### Dependencias
T19.

---

## T21 — Perfil de altitud con Chart.js

### Objetivo
Mostrar altitud vs distancia.

### Criterios de aceptación
- eje X distancia;
- eje Y altitud;
- actualización durante tracking;
- detalle posterior reutiliza mismo componente;
- lógica de datos separada del gráfico.

### Dependencias
T15, T19.

---

# FASE 7 — Historial y configuración

## T22 — Home

### Objetivo
Implementar pantalla inicial.

### Criterios de aceptación
- botón iniciar;
- acceso historial;
- acceso configuración;
- estado de sesión visible.

### Dependencias
T05, T17.

---

## T23 — Historial

### Objetivo
Listar caminatas guardadas.

### Criterios de aceptación
- nombre;
- fecha;
- distancia;
- duración;
- búsqueda por nombre;
- filtro por fecha;
- eliminación con confirmación.

### Dependencias
T08.

---

## T24 — Detalle de caminata

### Objetivo
Mostrar información completa.

### Criterios de aceptación
- mapa completo;
- métricas;
- perfil altitud;
- nombre editable;
- estado incompleto visible.

### Dependencias
T20, T21, T23.

---

## T25 — Configuración

### Objetivo
Implementar ajustes iniciales.

### Ajustes
- sistema de unidades;
- mantener pantalla encendida.

### Criterios de aceptación
- persistencia en IndexedDB;
- última selección recordada;
- explicación breve por ajuste.

### Dependencias
T08, T11.

---

# FASE 8 — Recuperación y robustez

## T26 — Recuperación de sesión

### Objetivo
Detectar `activeSession` al cargar.

### Opciones
- Continuar;
- Guardar;
- Descartar.

### Criterios de aceptación
- diálogo aparece cuando corresponde;
- continuar reutiliza mismo walk;
- guardar marca incompleta;
- descartar requiere confirmación.

### Dependencias
T18.

---

## T27 — Manejo de visibilitychange

### Objetivo
Aplicar comportamiento aprobado.

### Criterios de aceptación
- flush al ocultarse cuando sea posible;
- al volver se muestra advertencia;
- huecos de tracking quedan identificados;
- no se inventan puntos observados.

### Dependencias
T10, T18, T26.

---

## T28 — Integración Wake Lock

### Objetivo
Mantener pantalla encendida cuando configuración lo solicite.

### Criterios de aceptación
- se solicita al iniciar tracking;
- se libera al finalizar;
- se intenta recuperar cuando corresponda;
- fallback visible si no existe soporte.

### Dependencias
T11, T25.

---

# FASE 9 — Validación y release MVP

## T29 — Completar TEST-PLAN.md

### Objetivo
Formalizar pruebas unitarias, de componentes y manuales.

### Cobertura mínima
- tracking;
- pausa;
- recuperación;
- persistencia;
- GPS pobre;
- pérdida GPS;
- visibilidad;
- Wake Lock;
- métricas;
- historial;
- configuración.

### Dependencias
T28.

---

## T30 — Pruebas reales en iPhone

### Objetivo
Validar comportamiento físico real.

### Escenarios mínimos
1. caminata corta normal;
2. pausa y reanudación;
3. GPS degradado;
4. pérdida temporal de señal;
5. cambio de visibilidad;
6. recarga accidental;
7. cierre y recuperación;
8. Wake Lock;
9. batería durante recorrido;
10. caminata de duración extendida.

### Evidencia
Registrar resultados en `TEST-RESULTS.md`.

### Dependencias
T29.

---

## T31 — Ajustes derivados de pruebas

### Objetivo
Corregir defectos detectados sin cambiar silenciosamente requisitos.

### Criterios de aceptación
- defectos clasificados;
- fixes probados;
- cambios arquitectónicos documentados si aparecen.

### Dependencias
T30.

---

## T32 — Configurar GitHub Pages

### Objetivo
Publicar MVP.

### Actividades
- configurar `base`;
- build;
- deployment;
- verificar HTTPS;
- probar desde iPhone.

### Criterios de aceptación
- sitio carga públicamente;
- rutas funcionan;
- permisos GPS funcionan bajo HTTPS;
- versión desplegada coincide con release aprobado.

### Dependencias
T31.

---

## T33 — Cierre del MVP

### Objetivo
Cerrar formalmente la primera versión.

### Actividades
- actualizar `README.md`;
- actualizar `CURRENT_STATE.md`;
- registrar versión;
- documentar limitaciones conocidas;
- confirmar funcionalidades futuras fuera de alcance.

### Criterios de aceptación
- documentación consistente;
- tests aprobados;
- release desplegado;
- MVP cerrado formalmente.

### Dependencias
T32.

---

# 4. Puertas de avance

## Gate 1 — Base técnica
Requiere:
- T00–T05 aprobadas.

## Gate 2 — Datos y servicios
Requiere:
- T06–T11 aprobadas.

## Gate 3 — Dominio
Requiere:
- T12–T15 aprobadas.

## Gate 4 — Tracking funcional
Requiere:
- T16–T21 aprobadas.

## Gate 5 — Producto usable
Requiere:
- T22–T28 aprobadas.

## Gate 6 — MVP validado
Requiere:
- T29–T33 aprobadas.

---

# 5. Parámetros técnicos a resolver durante implementación

Los siguientes parámetros deberán cerrarse antes de las tareas que dependan de ellos:

1. umbrales de precisión GPS;
2. umbrales de anomalías;
3. método exacto de suavizado de altitud;
4. método de interpolación;
5. estrategia de estimación durante huecos prolongados;
6. intervalo de persistencia;
7. tamaño máximo del buffer;
8. navegador mínimo soportado.

Cada parámetro deberá registrarse en `DECISIONS.md` antes de considerarse definitivo.

---

# 6. Handoff inicial

TASK:
T00 — Crear estructura documental y base del repositorio

STATUS:
Ready

Objective:
Preparar el repositorio para comenzar implementación sin introducir lógica funcional.

Approved requirements:
Usar la estructura documental y de proyecto aprobada.

Decisions made:
MVP web sin backend, React + TypeScript + Vite.

Architecture impact:
Ninguno adicional.

Risks:
Bajo.

Open issues:
Ninguno para T00.

Acceptance criteria:
- estructura creada;
- documentos presentes;
- `.gitignore` correcto;
- repositorio limpio.

Recommended next step:
Ejecutar T00 y someter resultado a revisión.

Next responsible role:
Senior Developer
