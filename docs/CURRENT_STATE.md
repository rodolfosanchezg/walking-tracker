# Estado actual — Walking Tracker

Fecha: 2026-10-08 (America/Bogota).

## Tarea ejecutada

T23 — History View.

Estado: T23 CLOSED; cierre formal autorizado tras aprobación de Valerio: PASS — READY TO CLOSE T23. T24 no ha comenzado; T25–T28 fuera del alcance.

## Historial implementado en T23

/history consume historyStore mediante una API inyectable list/delete. La capa de datos usa WalkRepository.list; React no accede directamente a Dexie/IndexedDB ni Geolocation, no reconstruye desde trackPoints ni calcula métricas. La conexión se crea por operación y se cierra en finally. HistoryPage usa estado local y un efecto de carga con protección ante desmontaje; carga al entrar, sin suscripción a cambios en vivo.

Cada registro muestra nombre, fecha local de startedAt (o No disponible), distancia en km mediante metersToKilometers T13, duración activa HH:MM:SS y estado. Incomplete sigue visible como registro guardado, sin convertirlo en recuperación interactiva. Distancia estimada se identifica. Unidades métricas fijas según T19; Settings aún pendiente.

historyFilters implementa búsqueda parcial case-insensitive con trim y rango opcional Desde/Hasta inclusivo por día local, consistente con la fecha mostrada. Nombre y fechas se combinan mediante AND. Rango invertido o fecha inválida muestra advertencia/sin resultados, sin crash. Orden por startedAt descendente, desempate determinístico por id; fechas ausentes/inválidas al final y excluidas cuando se filtra por fecha. Filtra/ordena copias, sin mutar Walks.

Links React Router a Home y /walk/:walkId con id codificado. WalkDetail sigue placeholder T05, sin implementar T24. Loading/empty/sin resultados/error legibles; error de lectura con Reintentar y sin detalles técnicos. Inputs etiquetados, lista semántica y botones de confirmación con foco; CSS limitado a filtros/tarjetas, adaptable a móvil/desktop.

Delete exige confirmación; cancelar no escribe. createHistoryStore coordina TrackPointRepository.deleteByWalkId y WalkRepository.delete en una transacción rw sobre walks/trackPoints/activeSession. El fallo revierte todo, conserva la lista y permite retry. No deja puntos huérfanos ni borra registros de otras caminatas. Protege el Walk vinculado a activeSession persistida (incluidas sesiones pendientes) para no interferir con T18 o recuperación futura; no elimina ni recupera esa sesión. Durante Delete se bloquean acciones duplicadas; tras éxito actualiza lista. Rename queda diferido explícitamente: IMPLEMENTATION-PLAN asigna nombre editable a T24; no se duplicó esa funcionalidad.

## Verificación T23 — 2026-10-08

25 pruebas nuevas: tests/historyView.test.tsx (20 casos RTL/MemoryRouter, stores mockeados) y tests/historyStore.test.ts (5 casos con fake-indexeddb aislada y borrado de base tras cada prueba). Cubren loading/empty/error/retry, resumen, orden, incomplete, búsqueda, from/to/rango/AND, navegación, confirmación/cancelación/Delete/error/duplicados, atomicidad/rollback/anti-orphan/protección de sesión/reapertura. tests/navigation.test.tsx adaptada para usar un Walk mockeado en lugar del enlace placeholder retirado; no pierde cobertura de detalle/ruta. Primer run: fallo en esa expectativa antigua, corregido; advertencia lint sobre setState síncrono en efecto eliminada moviendo el reinicio de carga a la acción Reintentar.

Navegador real Chrome headless/CDP, perfil temporal aislado, IndexedDB real con fixtures sintéticas, sin datos del usuario. A vacío/Home PASS; B varias caminatas, orden, resumen/incomplete, búsqueda case-insensitive y AND con fecha PASS; C detalle placeholder /walk/qa-c PASS; D cancelar/confirmar Delete, recargar y verificar Walk ausente/puntos0 PASS. 390×844 y1280×800 sin overflow/errores consola; la base de fixtures se eliminó al finalizar. E Rename no aplica, diferido a T24. Sin GPS real/iPhone ni performance de historiales grandes validados.

Sin dependencias nuevas. Limitaciones: listado se refresca al entrar/reintentar, no en vivo; filtros en memoria apropiados al MVP, no paginación; día local del navegador; Delete de una sesión persistida se rechaza; Rename/Recovery/Settings/Visibility/Wake Lock pendientes. README actualizado durante el cierre; los cuatro documentos fuente permanecen intactos. T24 no ha comenzado.

Validación final T23: Node 24.21.0/npm 11.19.0. Tests PASS: 357 pruebas en 23 archivos, 9.57 s (332 anteriores +25 nuevas); regresiones T19–T22 incluidas. Build PASS: 63 módulos, 448 ms. Lint PASS sin advertencias; TypeScript tsc -b --force PASS; git diff --check PASS.

Comandos: source ~/.nvm/nvm.sh; nvm use; node --version; npm --version; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Adicionales: npm run dev -- --host 127.0.0.1, Chrome headless/CDP para comprobar A–D en un perfil temporal aislado.

## QA y cierre formal de T23

Valerio aprobó T23: PASS — READY TO CLOSE T23; 357 tests PASS en 23 archivos y regresiones Home/Active Walk/persistencia/Leaflet/Chart.js aprobadas, sin defectos ni bloqueos. Validación independiente Chrome/CDP con IndexedDB real aislada: orden temporal fuera de orden de inserción, búsqueda/fechas AND y limpieza de filtros, incomplete sin recuperación, navegación al detalle placeholder, confirmación/cancelación/Delete persistido. Fallo inyectado en WalkRepository.delete después de borrar puntos confirmó rollback real: Walk y sus dos puntos permanecieron; retry eliminó A y conservó B y sus puntos, incluso tras recargar. Error de lectura normalizado con retry. Tres ciclos /walk → /history → /walk conservaron sesión/puntos y watcher único; Pause/Resume/Finish operativos (starts=1, clears=1). History no inicia/detiene tracking ni limpia activeSession. Viewports 390×844/1280×800 y teclado PASS; sin errores inesperados de consola. Fixtures aisladas eliminadas al finalizar. Rename diferido a T24 según plan. El cierre solo actualiza documentación; T24 no ha comenzado.

Validación final de cierre T23: Node 24.21.0/npm 11.19.0; 357 tests PASS en 23 archivos (10.59 s), incluidos History, Delete/anti-orphan/rollback, búsqueda/fechas, navegación al detalle y regresión Home/Active Walk. Build PASS (63 módulos, 450 ms); lint PASS sin advertencias; tsc -b --force PASS; git diff --check PASS. Antes del commit se confirmó T24 sin iniciar: WalkDetail sigue placeholder, fuentes intactas y sin funcionalidad adicional.

## Historial del cierre de T22

T22 — Home View.

Estado: T22 CLOSED; cierre formal autorizado por el usuario tras aprobación de Valerio: PASS — READY TO CLOSE T22. T23 no ha comenzado; T24–T28 fuera del alcance.

## Home implementada en T22

src/app/HomePage.tsx convierte la ruta / existente en pantalla de entrada funcional. Conserva heading Inicio y título principal Walking Tracker del layout App. Acción principal, estado textual y accesos secundarios Ver historial/Abrir configuración; estilos mínimos coherentes con /walk, sin rediseño general.

src/features/tracking/useWalkStatus.ts usa únicamente runtime.getView() mediante un contrato Pick<ActiveWalkRuntime,'getView'>. Lectura inicial y polling centralizado1000ms; elimina solo su temporizador al desmontar. No invoca start/stop/cleanup/refresh/tick, no calcula métricas en React ni usa Geolocation/Dexie/repositories. No consulta persistencia al abrir ni reconstruye sesiones; observa exclusivamente la instancia en memoria ya disponible. T19–T21/controladores/capas inferiores permanecen intactos.

Sin sesión muestra Listo para caminar y Link Iniciar caminata a /walk. Ese enlace NO inicia GPS ni crea sesión; la acción real permanece en Active Walk/T19. Los accesos /history y /settings usan Link/React Router existente, sin window.location ni navegación externa/base path hardcoded.

Con active/paused muestra Caminata activa en progreso/Caminata pausada, oculta Start y ofrece Abrir caminata a /walk. No crea segundo mecanismo de inicio ni segunda sesión. También protege incomplete y finished con persistencia aún pendiente, mostrando acceso para revisar/reintentar en /walk en lugar de un Start incoherente. Mientras finishing, indica Guardando la caminata. Finished con persistence.finalized=true muestra finalizada/listo para otra caminata y vuelve a ofrecer Iniciar. No incorpora resumen histórico ni recuperación interactiva T26.

Navegar /walk→Home→/walk no cancela tracking, limpia sesión ni duplica watcher. El temporizador Home solo lee estado; el runtime existente conserva sesión/GPS. Accesibilidad: heading, role=status, enlaces con labels claros y foco visible/altura44px; Home no depende de iconos/color y ajusta su navegación a dos columnas en móvil/desktop.

## Pruebas y verificación T22 — 2026-10-07

10 casos nuevos en tests/homeView.test.tsx con RTL/MemoryRouter, reader mockeado y timers falsos: render/título/Ready/Start, tres destinos, active/paused/Open/protección de segundo Start, finished guardada, finished pendiente/incomplete, lectura actualizada, timer cleanup y ausencia de llamadas a acciones de tracking.

| Validación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 332 pruebas,21 archivos,9.04 s;322 anteriores y10 T22; regresiones T19–T21/QA-T17-001/QA-T18-001 incluidas. |
| Build | PASS | 61 módulos,420 ms; salida0. |
| Lint / TypeScript | PASS | npm run lint/tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |
| Navegador | PASS | Chrome real headless/CDP con GPS/tiles simulados. A Ready/History/Settings/Start→walk sin watcher; B active en Home, Start oculto/Open conserva watcher1; C paused en Home/Open conserva pausa; D finish guardado habilita Start, watcher0. Mobile390x844 y desktop1280x800 sin overflow/errores de consola. |

Comandos: source ~/.nvm/nvm.sh; nvm use; node --version; npm --version; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node24.21.0/npm11.19.0. Vite/Chrome/CDP con perfil /tmp aislado y permisos de puerto local; validación automatizada sobre navegador real, sin GPS real ni interacción humana afirmada.

Sin hallazgos bloqueantes, desviaciones ni dependencias nuevas. Limitaciones: Start de Home abre /walk y requiere iniciar allí; estado solo en memoria (reload/recoveryT26 pendiente); History/Settings continúan vistas base; comportamiento de tracking al salir de /walk sigue el runtime/T19 existente, sin timers funcionales nuevos de persistencia ni background. README actualizado durante el cierre formal; los cuatro documentos fuente permanecen intactos. No T23/T24/T25/T26/T27/T28. T23 no ha comenzado.

## QA y cierre formal de T22

Valerio aprobó T22 con 332 pruebas PASS en 21 archivos; regresión T19–T21 aprobada, sin defectos ni bloqueos. Chrome/CDP con GPS/tiles simulados confirmó Ready, navegación History/Settings, doble click Start sin watcher, tres ciclos /walk → / → /walk con una única sesión y watcher, pausa conservando distancia/tiempo activo y Finish persistido liberando el watcher y habilitando nuevamente Start. Viewports 390×844 y 1280×800 sin desbordamiento ni errores de consola. GPS real/iPhone/caminatas prolongadas siguen pendientes. El cierre agrega únicamente documentación; T23 no ha comenzado.

Validación final de cierre T22: Node 24.21.0/npm 11.19.0; 332 tests PASS en 21 archivos (9.34 s), incluidos Home, protección contra segundo Start, lifecycle y regresión T19–T21. Build PASS (61 módulos, 390 ms); lint PASS; tsc -b --force PASS; git diff --check PASS. Se confirmó T23 sin iniciar antes del commit: History conserva el placeholder y las fuentes permanecen intactas.

## Historial de T21

T21 aprobada/cerrada en39cb4a4 (feat: complete T21 elevation profile). QA PASS — READY TO CLOSE T21; evidencia histórica preservada a continuación.

## Perfil integrado en T21

src/features/tracking/ElevationProfile.tsx encapsula Chart.js4.5.1, sin wrappers/dependencias nuevas. ActiveWalkPage lo carga mediante lazy/Suspense debajo del mapa y antes de controles. Solo registra LineController, LineElement, PointElement, LinearScale y Tooltip. Dimensiones explícitas responsive260px; ejes lineales X distancia acumulada(km)/Y altitud procesada(m). Títulos, canvas con aria-label/fallback, estado textual y explicación de huecos/estimaciones complementan el color.

src/features/tracking/elevationProfileData.ts adapta snapshot.rawPoints, assessment y segment T17. Excluye segment=null (pausa/posiciones antiguas), agrupa por segmento activo y construye los TrackPoints clasificados de la misma forma que T17. Invoca buildElevationProfile T15 para cada segmento, sin reimplementar smoothing/interpolación/calidad/ganancia/pérdida. Distancia horizontal interna T15 se concatena mediante offset de tramos previos; usa metersToKilometers T13 para X. Y procede directamente de altitudeMeters procesado. No se une el desplazamiento de pausa.

Dataset por segmento: puntos { x:km, y:altitudeMeters|null, estimated:boolean }. spanGaps=false conserva huecos sin líneas falsas; datasets separados evitan conectar alturas antes/después de pausa. T15 excluye anomalous/low-quality/estimated de entrada y entrega nulls/estimaciones identificadas. Los valores interpolados se muestran con triángulos, texto y tooltip estimated, sin alterar raw GPS. Perfil parcial queda indicado por texto. Unidades métricas según estrategia T19; Settings no integrado.

Ciclo Chart: crea instancia al disponer de al menos dos altitudes procesadas, actualiza datasets y update('none')/resize sin recrear; animation=false y parsing=false. useMemo evita reprocesar cuando la referencia de capturas no cambia; el polling T19 puede producir nuevos arrays y actualizar una vez por segundo, sin timers nuevos. destroy al desmontar. Si empieza otra caminata vacía, oculta canvas y limpia datasets conservando instancia reutilizable. Con 0/1 altitudes disponibles o todas null, muestra estado vacío claro. Nulls parciales no se extrapolan visualmente.

Pause conserva perfil; capturas de pausa no añaden datos activos. Resume agrega dataset con offset de distancia ya acumulada, sin puente por pausa ni interpolación entre segmentos. Finish conserva gráfico/datos finales. Ninguna llamada a Geolocation, Dexie/repositories ni fórmulas GPS dentro del componente. T15 y T16–T20 runtime/mapa permanecen intactos.

## Pruebas y verificación T21 — 2026-10-07

14 casos nuevos en tests/elevationProfile.test.tsx: 0/1/null, integración /walk, datos T15/km/m/no mutación, actualización y reutilización, cleanup, anomalous/null/spanGaps, interpolaciones/triángulos, pausa/resume con offsets, perfil parcial, finish y nueva caminata vacía. Chart.js mockeado, sin canvas real en unit tests. Pruebas previas T19/T20 y regresiones QA-T17-001/QA-T18-001 siguen pasando.

| Validación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 322 pruebas,20 archivos,8.35 s;308 previas y14 nuevas. |
| Build | PASS | 60 módulos,447 ms; chunk perfil153.45kB, mapa152.01kB, inicial382.53kB. |
| Lint / TypeScript | PASS | npm run lint/tsc -b --force sin errores ni warnings de hooks finales. |
| Whitespace | PASS | git diff --check sin errores. |
| Navegador | PASS | Chrome real headless/CDP390x844, GPS/tiles simulados. A vacío; B dos puntos con X creciente/Y100→110; C pausa sin cambios y resume separado con altitud null interpolada510/estimated/triángulo; D finish conserva gráfico/mapa/métricas. ChartID0 estable, watcher único/liberado al finalizar, sin overflow ni errores JS/consola. |

Hallazgos corregidos: tabla test.each pasaba objetos individuales en lugar de arrays (2 fallos de fixtures), corregida; lint inicial detectó dependencias de useMemo incompletas, simplificado para depender explícitamente de rawPoints. T15 no requirió cambios. Referencia técnica consultada: https://www.chartjs.org/docs/latest/developers/updates.html (update none) y https://www.chartjs.org/docs/latest/charts/line.html (spanGaps/datasets).

Comandos: source ~/.nvm/nvm.sh; nvm use; node --version; npm --version; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node24.21.0/npm11.19.0. Vite/Chrome/CDP con perfil /tmp aislado y permisos de puerto local para validación automatizada sobre navegador real. No GPS real, tiles online ni interacción humana afirmada.

Sin dependencias nuevas ni bloqueos. Limitaciones: unidades métricas fijas, perfil disponible desde dos altitudes, recálculo lineal por segmento mediante T15 y actualización1Hz; rendimiento de caminatas largas e iPhone pendientes. No gráfico en detalle T24 ni Home/History/Settings/Recovery/Visibility/Wake Lock. README actualizado en el cierre formal para T00–T21, perfil, testing, limitaciones y T22 pendiente. Fuentes intactas. T22 no ha comenzado.

QA independiente de Valerio: PASS — READY TO CLOSE T21. Los48 criterios, lifecycle y regresión T19/T20 aprobados; sin defectos confirmados ni bloqueos. 322 pruebas (20 archivos,8.11 s), build (433 ms), lint/TypeScript/diff PASS. Chrome/CDP390x844 con GPS/tiles simulados: A vacío; B perfil km/m actualizado; C pausa/resume segmentado e interpolación510 marcada; D pico raw3000 excluido por T15; E perfil/mapa/métricas finales visibles. Dos unmount/remount liberaron ctx/listeners y registro de charts0→1, watcher único. El harness inicialmente intentó serializar Chart circular; corregido para inspeccionar contadores/estados simples, sin defecto de producto. Sin errores ni overflow. GPS real/iPhone y rendimiento largo NOT TESTED. QA aprobó T21; T22 no ha comenzado.


Validación final de cierre de T21: Node24.21.0/npm11.19.0; npm test -- --run PASS (322 pruebas,20 archivos,8.18 s); Chart T21, lifecycle/destroy, pausa/resume y regresión T19/T20 aprobados. npm run build PASS (60 módulos,356 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Antes del commit se confirmó T22 sin iniciar: Home permanece vista base; fuentes/T15/runtime/mapa intactos y sin T23–T28. Se verifican git status y git log -1 --oneline después del commit.

## Historial de T20

T20 aprobada/cerrada en 0662911 (feat: complete T20 leaflet integration), QA PASS — READY TO CLOSE T20 sin defectos confirmados. Evidencia histórica preservada a continuación.

## Mapa activo implementado en T20

src/features/maps/ActiveWalkMap.tsx encapsula Leaflet1.9.4 y su CSS, sin React-Leaflet ni dependencias nuevas. ActiveWalkPage carga el componente mediante lazy/Suspense, separando Leaflet del bundle inicial. Tamaño explícito320px móvil/400px desktop. Instancia única por montaje: remove al desmontar, listeners y ResizeObserver retirados; no solicita GPS ni accede a persistencia.

mapData.ts adapta TrackingSnapshot.rawPoints y CapturedPoint.assessment/segment de T17. Ruta elegible: medidos valid/suspicious con coordenadas finitas dentro de rango; anomalous/low-quality/estimated se excluyen y cortan continuidad conforme T12. segment=null no participa; IDs distintos producen subrutas independientes. Esto excluye puntos pausados/antiguos y evita conectar movimiento durante pausa, sin alterar raw ni clasificaciones. Las posiciones antiguas fuera de segmento no cortan innecesariamente el segmento activo que T17 conserva.

Polyline multi-segmento azul reutilizada mediante setLatLngs. CircleMarker rojo/blanco reutilizado para la última posición apta, diferenciada de la ruta y con tooltip. Puede mostrar la posición raw válida durante pausa sin extender ruta ni seguirla automáticamente. Ante GPS perdido o último punto excluido conserva la última posición válida conocida; no estima nuevos puntos. Sin puntos muestra vista mundial [0,0]/zoom2 y texto esperando ubicación; primer punto centra azoom16.

Follow inicialmente habilitado: panTo sin animación únicamente al cambiar ID de posición y mientras active; no fitBounds por cada punto. Pointer/wheel/keyboard dentro del mapa suspenden follow; botón Centrar y seguir posición lo reactiva. Pan/zoom Leaflet siguen disponibles. Finish conserva ruta/marker y fitBounds una vez con padding20/maxZoom16. ZoomAnimation desactivado para evitar que un zoom manual pendiente impida aplicar el ajuste final; no usa APIs privadas de Leaflet en producción.

mapConfig.ts centraliza URL HTTPS raster de OpenStreetMap, atribución visible y maxZoom19. Los documentos aprobaban raster/Leaflet pero no especificaban proveedor: elección inicial configurable, sin cambiar arquitectura ni decisiones. Referencia de política: https://operations.osmfoundation.org/policies/tiles/ . No hay descarga, prefetch, Service Worker ni caché administrada; solo comportamiento HTTP nativo del navegador. tileerror muestra aviso sin detener GPS, persistencia ni controles. Mapas offline completos siguen fuera del MVP.

## Pruebas y validación T20 — 2026-10-07

14 casos nuevos en tests/activeWalkMap.test.tsx: integración /walk, inicial vacío, instancia única/cleanup, posición inicial/actualizada, polyline, tres calidades excluidas, anomalía intermedia, pausa/resume con subrutas, coordenadas inválidas/no mutación, seguimiento manual/reactivación, finish y tileerror. Leaflet mockeado en estas pruebas; sin internet real. Pruebas T19 conservadas; una aserción de disabled se ajustó a los tres controles de caminata, ya que el zoom del mapa debe permanecer usable.

| Validación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 308 pruebas,19 archivos,7.53 s;294 previas y14 nuevas; incluye QA-T17-001/QA-T18-001. |
| Build | PASS | 55 módulos,385 ms; bundle inicial382.31kB y mapa separado152.02kB; sin aviso de tamaño final. |
| Lint / TypeScript | PASS | npm run lint y tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |
| Navegador | PASS | Chrome real headless/CDP,390x844, GPS y tiles simulados. Mapa sin GPS, posición/ruta, drag suspende follow, zoom, pausa sin extensión, resume sin watcher duplicado, finish tras zoom muestra dos subrutas sin puente y marcador final. HTTP503 de tiles simulado mantiene tracking/controles. Sin overflow ni excepciones JS/Leaflet. |

Hallazgos corregidos durante desarrollo: prueba T19 asumía todos los botones disabled, ahora limita a acciones de caminata; primer build534kB avisó tamaño, solucionado con carga lazy; fitBounds podía ser ignorado durante zoom animado, corregido desactivando zoomAnimation. Chrome conservó una instancia con configuración antigua tras edición; recarga completa verificó la opción nueva y el caso final. Se conserva esta evidencia sin afirmar que las primeras comprobaciones finales pasaron.

Comandos: source ~/.nvm/nvm.sh; nvm use; node --version; npm --version; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node24.21.0/npm11.19.0. Vite/Chrome levantados con permisos para puerto local; perfil /tmp aislado, scripts CDP externos. Verificación de navegador automatizada, sin afirmar GPS real/iPhone ni tiles reales de Internet.

Sin bloqueos ni dependencias nuevas. Limitaciones: proveedor raster público sin garantía offline; aviso de tileerror conservado durante montaje; calidad avanzada por colores/raw secondary layer no implementados; GPS real/iPhone y rendimiento de caminatas largas pendientes. Se retiró maps/.gitkeep porque ya contiene implementación. README actualizado en el cierre formal para T00–T20, capacidades, limitaciones y T21 pendiente; cuatro documentos fuente intactos. No Chart.js, Recovery, Visibility/Wake Lock ni T21.

QA independiente de Valerio: PASS — READY TO CLOSE T20. Aprobó inicialización única, limpieza, marker, polyline, anomalías, pausa/reanudación sin puente, follow/pan/zoom, tiles independientes y regresión T19; sin defectos confirmados. 308 pruebas (19 archivos,7.44 s), build (550 ms), lint/TypeScript/diff PASS. Chrome/CDP390x844 con GPS/tiles simulados verificó A–E: A/B activos permanecen, C/D pausados no extienden ruta, E/F en nuevo segmento; anomalía excluida de ruta/marker; finish con bounds completos, incluyendo cero/un punto sin excepción. Sin errores JS/Leaflet/overflow. Tiles reales/GPS real/iPhone y rendimiento largo no probados. T21 no ha comenzado.


Validación final de cierre de T20: Node24.21.0/npm11.19.0; npm test -- --run PASS (308 pruebas,19 archivos,7.87 s); pruebas Leaflet, regresión T19, pausa/resume sin puente y cleanup aprobados. npm run build PASS (55 módulos,369 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Antes del commit se confirmó ausencia de Chart.js funcional/T21 y cambios a documentos fuente; T16–T19 runtime y capas inferiores intactos salvo integración visual/prueba de controles autorizadas. Se verifican git status y git log -1 --oneline después del commit.

## Historial de T19

T19 aprobada y cerrada en a74f0a6 (feat: complete T19 active walk view). QA PASS — READY TO CLOSE T19, sin defectos confirmados. Evidencia histórica preservada a continuación.

## Vista activa implementada en T19

/walk (ruta existente, sin cambiar router) usa ActiveWalkPage con estado, métricas, GPS/errores y controles. src/features/tracking/activeWalkRuntime.ts compone el controlador persistente T18 con su coordinador y adapter de repositories; la base se crea solo al iniciar, nunca al importar/renderizar, y se cierra tras finish persistido exitoso. No hay llamadas Geolocation ni acceso Dexie desde React. T16/T17/T18 permanecen intactos.

src/features/tracking/useActiveWalk.ts obtiene snapshots mediante polling centralizado de 1000 ms. Invoca refresh T17 para tiempos y tick T18 para trigger temporal; las posiciones entran por T09/T17/T18 existentes. No calcula coordenadas, clasificaciones ni métricas en componentes. React solo usa conversiones T13 (km, km/h, min/km), presentación de duración y redondeo. Unidades métricas fijas por ahora; no lee Settings ni agrega selector/configuración T25.

Estados UI: Sin caminata, Activa, Pausada, Incompleta, Finalizando, Finalización pendiente de guardado y Finalizada. Inicialmente no hay watcher ni métricas activas. Iniciar crea una identidad crypto.randomUUID y usa naming mínimo del dominio. Doble inicio queda deshabilitado; Pause/Resume/Finish solo están disponibles en estados válidos. La pausa conserva métricas y explica que no acumula ruta activa mientras tiempo total continúa, según T16/T17.

Métricas: tiempo activo y total, distancia, velocidad promedio, ritmo promedio, elevación ganada/perdida (con marca de estimación). GPS muestra estado, última clasificación y precisión. Permission denied/unsupported son errores de disponibilidad; position unavailable/timeout muestran un aviso temporal esperando nuevas posiciones. Errores persistentes ofrecen reintento sin mostrar textos técnicos crudos; errores de dominio (como reloj regresivo) son explícitos y legibles.

Finish usa confirmación inline con group/label y botones Seguir caminando/Confirmar finalización. Runtime bloquea acciones mientras espera finish T18 y evita llamadas simultáneas. Solo muestra éxito cuando persistence.finalized es true; fallo conserva estado pendiente, muestra error y Reintentar finalización. Usa transacción/flush final T18; React no llama repositories manualmente. El resumen básico conserva métricas, sin implementar detalle T24.

Runtime singleton por pestaña conserva sesión entre desmontaje/remontaje y crea nuevo controlador/coordinador solo para una siguiente caminata ya finalizada. El hook elimina únicamente su timer; no cancela ni destruye una caminata al navegar/re-renderizar. No hay suscripciones adicionales a navegador. Guardas mounted evitan actualizaciones de estado tras desmontaje. Sin recuperación tras recarga: esa interacción es T26. Navegar fuera de /walk conserva GPS y su persistencia por cantidad/posiciones; no queda polling UI allí, y no se garantiza ejecución en background.

Accesibilidad/estilos: h2/section, status textual, alert legible, dl de métricas, controles con labels/disabled/foco visible y altura mínima 44 px. Layout sencillo en dos columnas y controles que ajustan líneas. No mapa, gráfico, velocidad/ritmo actuales, Home/History/Settings adicionales, recuperación, Visibility ni Wake Lock.

## Validación T19 — 2026-10-07

16 casos nuevos en tests/activeWalkView.test.tsx usan RTL, runtime/controlador mockeado y timers falsos: inicial/acciones inválidas, start/doble inicio, métricas, pause/resume, confirmación cancelada/confirmada, finalización fallida/pending/retry, tres errores GPS, acciones ocupadas, timer cleanup/remontaje, llamada a finish persistente, error de dominio, concurrencia de finish e incomplete. Nunca utilizan GPS real.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 294 pruebas,18 archivos,6.79 s; 278 previas más16 T19, incluidas regresiones QA-T17-001/QA-T18-001. |
| Build | PASS | 50 módulos,342 ms; salida0. |
| Lint / TypeScript | PASS | npm run lint y tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |
| Navegador real | PASS | Chrome headless controlado por CDP, viewport390x844, GPS simulado por Emulation; /walk, inicial, Start/Pause/Resume, cancelación de confirmación y finish guardado. Cero errores JS/consola y sin overflow horizontal. |

Comandos: source ~/.nvm/nvm.sh; nvm use; node --version; npm --version; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node24.21.0 / npm11.19.0. Se levantó Vite y Chrome con perfil /tmp aislado; script CDP externo al repositorio. Sandbox bloqueó puerto/conexión local (EPERM), validación completada con permisos concedidos. Verificación de navegador automatizada sobre Chrome real, sin afirmar interacción humana ni prueba GPS real/iPhone.

Sin dependencias nuevas ni bloqueos. El plan conceptual menciona mapa/perfil para T19; la instrucción explícita autorizada los excluye hasta T20/T21, respetada sin modificar fuentes. Limitaciones: Settings aún no integrado (unidades métricas); sin mapas/gráficos ni recuperación interactiva; pruebas reales iPhone/rendimiento de caminatas largas pendientes. README actualizado en el cierre formal con T00–T19, UI activa, testing, limitaciones y T20 pendiente. T20 no ha comenzado.

La revisión independiente de Valerio aprobó T19: PASS — READY TO CLOSE T19. 294 pruebas (18 archivos,6.71 s), build (375 ms), lint, TypeScript y git diff --check PASS. Chrome con GPS simulado confirmó inicial sin watcher, watcher único, Start/Pause/Resume, pausa sin distancia artificial, confirmación cancelada y finish guardado. Navegar fuera/volver eliminó/recreó timer sin duplicar watcher. Timeout/unavailable/permission denied visibles, sin mensajes crudos ni crash;390x844 sin overflow/errores de consola. Primera simulación de timeout fue sustituida por la posición inicial del mock; repetida tras esa posición, pasó. Sin defectos confirmados ni bloqueos. GPS real/iPhone y rendimiento de caminatas largas pendientes.


Validación final de cierre de T19: Node24.21.0/npm11.19.0; npm test -- --run PASS (294 pruebas,18 archivos,6.86 s); npm run build PASS (50 módulos,339 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Antes del commit se confirmó T20 sin iniciar: sin imports Leaflet/Chart.js en UI/runtime; T16–T18 y documentos fuente intactos. Se verifican git status y git log -1 --oneline después del commit.

## Historial de T18

T18 aprobada y cerrada en d676cf1 (feat: complete T18 block persistence), con QA-T18-001 RESOLVED tras revalidación PASS. El FAIL histórico queda preservado a continuación y en TEST-RESULTS.

## Persistencia incremental implementada en T18

- src/features/tracking/persistenceCoordinator.ts: buffer/coordinador independiente de React, Dexie y browser APIs. Recibe snapshots T17 mediante observe, evalúa checkFlush, ofrece forceFlush, finalize, cleanup, getState y settled para esperar la cola en pruebas.
- src/data/repositories/trackingPersistenceStore.ts: frontera transaccional que reutiliza WalkRepository, TrackPointRepository y ActiveSessionRepository sobre la misma base v1. No cambia esquema ni repositories T08.
- src/features/tracking/persistentTrackingController.ts: composición opcional con T17 sin modificarlo. Intercepta callbacks del servicio T09 y acciones para entregar snapshots al coordinador. Conserva start/pause/resume/refresh síncronos: el tracking sigue recibiendo GPS durante escrituras. Expone estado/error persistente, tick, forceFlush y finish/cleanup/cancel asíncronos.

Parámetros centralizados DEFAULT_PERSISTENCE_LIMITS: 50 puntos pendientes O 30000 ms desde la recepción del primer punto todavía pendiente (pendingSince). Guardar únicamente estado no reinicia esa ventana. Valores iniciales ajustables elegidos bajo la autorización T18: bloques moderados y ventana relativamente larga para reducir escrituras. El tiempo se comprueba al observar posiciones, mediante checkFlush/tick o refresh. No hay timer oculto; el consumidor debe invocar tick periódicamente si no llegan posiciones. La ventana de pérdida esperada es hasta el bloque pendiente (menos de 50 puntos/30 s cuando se comprueban regularmente los triggers); un fallo de almacenamiento o suspensión del navegador puede ampliarla y queda observable.

Buffer: guarda CapturedPoint originales y deduplica por ID. bulkAdd persiste exclusivamente raw TrackPoint, sin cambiar coordenadas, altitud, speed, accuracy, timestamp ni calidad raw. Anomalous y puntos pausados también se guardan. Su clasificación separada y segment (incluido null para pausa) quedan en pointMetadata del snapshot extendido de ActiveSession; no se convierten en ruta activa. Se mantiene orden de captura; el repository permite consulta ordenada por timestamp.

Concurrencia: cola serial para todas las escrituras; flushes simultáneos comparten una promesa. Cada flush captura un bloque y su snapshot antes de escribir; tras éxito elimina solo IDs de ese bloque. Puntos nuevos recibidos durante la escritura permanecen pendientes; si alcanzan el límite, comienza otro flush al terminar el anterior. Finalizar espera escrituras previas y luego vacía el resto sin solaparlas. No hay bucle de reintentos automático ante fallo.

Cada commit es una transacción Dexie sobre walks, trackPoints y activeSession, a través de los repositories: crea Walk al primer guardado, lo actualiza en estados/bloques y guarda ActiveSession. Si falla bulkAdd, Walk, save o clear, revierte toda la transacción. Buffer y marcadores confirmados se conservan; error es observable en getState y en el resultado asíncrono. forceFlush reintenta el bloque sin duplicados. Un ID Walk ya existente no se sobrescribe al iniciar: error explícito, recuperación no implementada aquí.

ActiveSession se guarda al inicio, pause/resume/incomplete y cada flush; no en cada refresh visual salvo que se alcance un trigger. Campos lastPersistedAt/lastPointTimestamp se actualizan solo tras commit exitoso. Además del contrato T06 se guarda session (pausas/interrupciones/nombre/tiempos T16) y pointMetadata solo para IDs persistidos. No se cambian modelos base ni versión de esquema: IndexedDB conserva objetos completos. Los resúmenes en cambios de estado reflejan métricas observadas en memoria; pueden incluir puntos aún pendientes, por lo que la futura recuperación deberá reconciliar/recalcular desde los registros confirmados. No se afirma que todos los puntos capturados ya estén guardados.

Finalización: T17 termina y libera GPS; el coordinador espera el flush previo, fuerza el bloque pendiente, actualiza Walk con estado/métricas finales, guarda snapshot de sesión y elimina activeSession dentro de la misma transacción. clear se confirma únicamente con toda la escritura final. Si falla, conserva recovery state previo y buffer; finish puede repetirse aunque T17 ya esté finished. forceFlush/cleanup de una sesión finished también pueden completar la transacción final.

Cleanup detiene GPS mediante T17, observa el estado, fuerza pendientes y dispone el coordinador solo tras éxito; es repetible y, si falla, permite reintentar. Cancel primero detiene y conserva la sesión como incomplete junto con sus puntos; solo descarta memoria tras guardado exitoso, nunca borra Walk/puntos persistidos. No implementa Discard ni confirmaciones de T26. Composición/coordinador son de una sola caminata: crear otra instancia para la siguiente sesión, sin reutilizar un coordinador dispuesto/finalizado.

No se integra con UI, Leaflet, Chart.js, Page Visibility ni Wake Lock. forceFlush queda disponible para T27; no se suscribe a visibilitychange. No detecta sesiones almacenadas al abrir ni implementa Continue/Save/Discard de T26. README actualizado en el cierre formal para T00–T18 y T19 pendiente. Los cuatro documentos fuente permanecen intactos.

## QA-T18-001 — FAIL → corrección → revalidación PASS — RESOLVED

Valerio detectó QA-T18-001 — Guardados de estado posponen el flush temporal (High/High). Primera validación: FAIL — CORRECTIONS REQUIRED. Suite previa de 272 pruebas PASS y escenarios independientes A–E PASS, pero F confirmó el defecto: start(1000), punto, pause(20000), tick(31001) dejaba pendingCount=1/persistedPoints=0/error=null; pause/resume posteriores podían mantener el punto pendiente hasta 80000 ms sin persistirlo. La causa era actualizar lastFlushAt también con escrituras de estado vacías y utilizarlo como referencia del trigger de puntos.

Corrección acotada a persistenceCoordinator.ts: el marcador de último guardado se denomina lastPersistedAt y conserva su significado para estado/recovery. Un mapa registra la hora local de recepción de cada ID en el buffer; pendingSince es la del primer punto que aún permanece pendiente. No utiliza timestamps GPS. checkFlush compara con pendingSince y conserva >=30000 ms; pause/resume/otros guardados vacíos no modifican esos tiempos. Solo tras commit exitoso se retiran los tiempos de IDs del bloque confirmado. Los puntos recibidos durante un flush mantienen su propia ventana; un fallo no reinicia el plazo. Buffer vacío devuelve pendingSince=null y una nueva captura abre su propia ventana.

Se añadieron seis casos de regresión: reproducción exacta, múltiples pause/resume, fronteras 30999/31000/31001 ms desde recepción a 1000 y recepción durante flush con guardado de estado posterior. Comprobaciones independientes con repositories reales/fake IndexedDB confirmaron el punto único persistido y buffer vacío, sin duplicación. A 30999 no se escribe, a 31000 se escribe (frontera inclusiva), y a 31001 se mantiene un único registro; múltiples estados conservan pendingSince=1000 aunque lastPersistedAt avance.

Validación tras corrección: 278 pruebas en 17 archivos PASS (5.98 s), incluidas las 272 previas y T17/QA-T17-001; build PASS (30 módulos, 336 ms); lint PASS; TypeScript tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Se mantienen concurrencia, deduplicación, rollback/retry, raw/anomalous, pausa/reanudación y finalización con recuperación preservada ante fallos. Coordinador, pruebas y este registro fueron los únicos archivos cambiados durante la corrección; composición, adapter transaccional, T17 y README intactos. Sin commit ni T19/T26/T27/T28. Ese estado corresponde a la entrega de corrección previa a QA. Valerio realizó la segunda validación: PASS — READY TO CLOSE T18. Reproducción exacta con repositories reales: pause20000 mantuvo pendingSince1000; tick31001 ejecutó bulkAdd una vez, persistió un punto, dejó buffer0/error=null y no duplicó. Escenarios independientes A–F, múltiples cambios, fronteras y regresión completa PASS; 278 pruebas (6.02 s), build (295 ms), lint/TypeScript/diff PASS. QA-T18-001 quedó RESOLVED, sin defectos nuevos. El usuario autorizó el cierre formal de T18; T19 no ha comenzado. El FAIL original se conserva.


Validación final de cierre de T18: Node24.21.0 / npm11.19.0; npm test -- --run PASS (278 pruebas,17 archivos,5.86 s), incluyendo seis regresiones QA-T18-001 y T17; npm run build PASS (30 módulos,304 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Antes del commit se verificó T19 sin implementar: ActiveWalkPage permanece placeholder, T17 intacto; sin recuperación T26 ni integración Visibility/Wake Lock/Leaflet/Chart.js. El cierre incluye git status y git log -1 --oneline después del commit.

## Pruebas y verificación inicial de T18

26 casos nuevos en tests/trackingPersistence.test.ts usan repositories reales y una IDBFactory aislada por prueba, además de adaptadores controlados para concurrencia. Cubren inicio, buffer vacío/bajo umbral, triggers OR/frontera temporal, bloque correcto, forceFlush, arrivals durante flush, llamadas concurrentes, siguiente bloque automático, fallos/reintentos/rollback de puntos y sesión, pausas, finalización pendiente/en curso y fallos en cuatro fases, preservación raw/anomalous/pausa, incomplete, cleanup/cancel no destructivo, IDs existentes y límites inválidos. Limpieza mediante database.delete al finalizar; sin datos reales del navegador.

| Validación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 272 pruebas, 17 archivos, 5.93 s; 246 previas incluidas T17/QA-T17-001 y 26 nuevas. |
| Build | PASS | 30 módulos, 331 ms, salida 0. |
| Lint | PASS | npm run lint, salida 0. |
| TypeScript | PASS | tsc -b --force, salida 0. |
| Whitespace | PASS | git diff --check, salida 0. |

Comandos: source ~/.nvm/nvm.sh; nvm use; node --version; npm --version; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 / npm 11.19.0.

Hallazgo corregido durante desarrollo: suite inicial de 268 pruebas PASS, pero build detectó un import de tipo sin uso en el nuevo archivo de pruebas. Retirado; validación completa ampliada PASS. Sin dependencias nuevas ni bloqueos. Parámetros y cuotas/durabilidad de Safari requieren validación real; snapshots de clasificación completos pueden crecer en caminatas largas. El wrapper opcional no está conectado a UI y tick requiere consumidor futuro. No se inició T19.

## Historial de T17

T17 cerrada en 179d14a (feat: complete T17 tracking orchestrator), tras QA-T17-001 corregido y revalidación PASS. El FAIL original permanece a continuación y en TEST-RESULTS.

## Orquestador implementado en T17

src/features/tracking/trackingController.ts define createTrackingController({ geolocation?, now? }). Controlador en memoria independiente de React y UI. Utiliza un servicio T09 exclusivo por instancia (por defecto createGeolocationService) y reloj inyectable (por defecto Date.now). Reutiliza sesión T16, clasificación T14 y métricas T12/T13/T15. No accede directamente a navigator ni IndexedDB.

API pública:

- getSnapshot(): TrackingSnapshot, sin suscripciones ni listeners propios de UI.
- start(walkId, name?, timestamp = now()): TrackingResult. Crea/inicia sesión T16 y un único watcher T09; doble inicio rechazado mientras la sesión siga en curso. Permite iniciar otra caminata después de finish o cancel.
- pause/resume/refresh/finish(timestamp = now()): TrackingResult. Reutilizan transiciones T16 y sus errores.
- cancel(): TrackingResult. Detiene watcher y descarta sesión/puntos en memoria, sin borrar bases.
- stop/cleanup(timestamp = now()): TrackingResult. Intentan marcar incomplete si existe watcher activo y la sesión estaba active/paused; siempre intentan detener el watcher, incluso si la transición falla. Conservan el error temporal y el estado de sesión previo cuando la transición es inválida; no inventan timestamps. Tras liberar el watcher, cleanup repetido no intenta otra transición temporal. Conservan datos para revisión local y son independientes del binding this.

TrackingResult: ok true/value snapshot o ok false/error kind/message. Errores de transición/tiempo T16 se propagan; además already-started, no-session, geolocation-start-failed y geolocation-stop-failed. Datos/errores GPS normalizados se exponen en snapshot sin mensajes UI.

Snapshot:

- session: copia protegida de WalkSession o null.
- rawPoints: CapturedPoint[] con raw TrackPoint (identidad asignada, todos los campos originales), assessment T14 separado y segment (null si no participa de ruta).
- points: puntos activos derivados con quality clasificada, incluidos anomalous, sin alterar campos GPS originales.
- metrics: distanceMeters, activeDurationMs, totalDurationMs, averageSpeedMetersPerSecond, averagePaceSecondsPerKilometer, elevationGainMeters y elevationLossMeters. Métricas de distancia/promedios/elevación reutilizan MetricValue para null y procedencia estimada.
- watcherActive, gpsStatus idle/waiting/available/error, gpsError normalizado o null y trackingStatus idle/active/paused/incomplete/finished/cancelled.

Snapshots, arrays, puntos, evaluaciones/señales, métricas y estado/intervalos expuestos están congelados/copiados para evitar mutación de memoria interna por el consumidor. IDs de puntos son walkId:contador monotónico por controlador; walkId único lo proporciona el consumidor. No se resuelven IDs persistidos ni reconstrucción de otra instancia en T17.

Flujo:

1. Start valida sesión y timestamp, pasa active y solicita T09.start. Si el servicio devuelve false, no existe soporte o lanza excepción síncrona, expone error explícito y conserva sesión incomplete con watcher detenido.
2. Posiciones T09 se copian y asocian al walkId sin modificar latitude/longitude/altitude/accuracy/speed/timestamp. Se clasifican con T14; no se generan estimaciones ni redefinen umbrales.
3. Durante active se incorporan al segmento actual las posiciones con timestamp finito y no anterior al inicio de segmento. Posiciones antiguas/no finitas se conservan raw con segment null; no crean ruta activa. Reloj del controlador actualiza tiempos T16 sin usar el timestamp GPS como reloj de sesión.
4. Pause conserva el watcher para conciencia GPS. Sus posiciones también se conservan raw con evaluación, pero segment null: no participan de ruta, distancia o elevación. Tiempo activo permanece detenido y total sigue transcurriendo.
5. Resume cierra pausa T16 y abre segmento nuevo sin reiniciar watcher. No se unen coordenadas/altitudes antes y después de la pausa, evitando distancia/elevación artificial por desplazamientos pausados.
6. Finish cierra sesión/pausa, detiene watcher, invalida callbacks antiguos y devuelve snapshot final sin persistir.

Clasificación y métricas: cada segmento activo se clasifica por T14, manteniendo sus reglas de referencia relevante. Los raw anomalous se conservan, pero T12/T15 los excluyen de métricas. Distancia y elevación se calculan por segmento y se suman, sin conectar pausas. Promedios usan distancia válida y duración activa T13. Perfil/ganancia/pérdida se calculan por T15 sin Chart.js. Indicadores estimated de elevación se propagan cuando T15 interpola. Valores no calculables mantienen null; subtotales vacíos siguen la semántica 0 de T12/T15.

Errores GPS: permission-denied conserva error, marca incomplete y detiene watcher. position-unavailable, timeout y unknown conservan error normalizado pero no paran una caminata activa; una nueva posición actualiza gpsStatus y limpia el error. unsupported falla al iniciar. Excepciones inesperadas de inicio se exponen como unknown y resultado geolocation-start-failed. Fallo de stop devuelve geolocation-stop-failed sin afirmar liberación exitosa; cleanup puede reintentarse. Generación interna descarta callbacks de observaciones anteriores tras stop/finish/cancel.

No se añaden timers; refresh recibe timestamp o reloj inyectado. El snapshot no avanza tiempo por consultarlo: lo actualizan acciones/posiciones/refresh. No hay recuperación de almacenamiento ni continuación del controlador desde incomplete todavía; cancel permite iniciar sesión nueva y el estado local conserva información para capas futuras.

## Corrección y revalidación de QA-T17-001 — RESOLVED

La revisión independiente de Valerio obtuvo FAIL — CORRECTIONS REQUIRED. Defecto QA-T17-001 (severidad y prioridad altas): start(1000), refresh(11000), reloj=5000, cleanup devolvía regressive-time antes de llamar stopWatcher; quedaban watcherActive=true y cero llamadas a clearWatch. El PASS inicial de desarrollo documentado abajo no cubría esta regresión.

Se corrigió únicamente stop/cleanup en trackingController.ts: se conserva el resultado de la transición, se intenta liberar el watcher antes de devolver el error y, si la liberación tiene éxito, watcherActive queda false. El estado temporal previo se conserva cuando falla la transición (puede seguir active/paused, pero sin watcher); no se oculta regressive-time ni invalid-timestamp. Si la detención falla, se devuelve geolocation-stop-failed sin afirmar liberación exitosa. Sin watcher activo, cleanup repetido no intenta una nueva transición de dominio.

Dos pruebas nuevas verifican la regresión exacta y cleanup con NaN desde paused. Cubren clearWatch una vez con ID 0, watcher inactivo, error explícito, repetición segura y descarte de callbacks tardíos. La reproducción independiente en memoria confirmó: regressive-time, watcherActive=false, clearWatch=1, segundo cleanup exitoso y cero puntos tardíos.

Validación tras corrección: 246 pruebas en 16 archivos PASS (6.06 s); build PASS (30 módulos, 294 ms); lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Comandos de validación iguales a los registrados abajo; reproducción adicional con node --input-type=module, mocks y módulos TypeScript transpilados en memoria. El primer intento de reproducción usó incorrectamente la firma de inyección de T09; corregido el harness sin cambios de producto, la reproducción pasó.

Tras la corrección de Aurelio y las dos regresiones añadidas, Valerio realizó una segunda validación independiente: PASS — READY TO CLOSE T17. Reprodujo exactamente start(1000) → refresh(11000) → reloj=5000 → cleanup: regressive-time observable, clearWatch(0) una vez, watcherActive=false, cero observaciones activas, segundo cleanup exitoso sin alterar sesión y callbacks tardíos ignorados. Suite de 246 pruebas PASS (6.59 s), build PASS (414 ms), lint/TypeScript/diff PASS; regresión completa de T17 aprobada y sin defectos nuevos. QA-T17-001 quedó RESOLVED; el FAIL inicial permanece en el historial. T17 queda aprobada y cerrada por autorización del usuario. README actualizado para T00–T17 y T18 pendiente; documentos fuente, módulos anteriores y UI intactos. No se inició T18.


Validación final de cierre de T17: Node 24.21.0 / npm 11.19.0; npm test -- --run PASS (246 pruebas, 16 archivos, 6.18 s), incluida QA-T17-001 y timestamp inválido desde paused; npm run build PASS (30 módulos, 320 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Antes del commit se verificó que el controlador solo importa T09, sesión T16, tipos y dominio T12–T15; sin repositories, IndexedDB, buffers/flush, UI, Visibility o Wake Lock. T18 no ha comenzado. El cierre incluye git status y git log -1 --oneline después del commit.

## Pruebas y verificación inicial de T17

21 pruebas en tests/trackingController.test.ts con mocks nativos y servicio T09 real: start/doble start, campos nullable/raw, puntos/métricas T12-T15, low-quality/suspicious/anomalous, pausa/raw/segmentos, reanudación sin duplicación o salto, posiciones antiguas, finish activo/paused, cancel/nuevo start, stop/cleanup idempotente extraído, callbacks tardíos, cuatro errores GPS, API ausente, excepción síncrona/start false, snapshots protegidos, acciones inválidas y servicio inyectado sin persistencia/integraciones.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 244 pruebas en 16 archivos, 5.71 s; 223 previas preservadas. |
| Build | PASS | 30 módulos, 353 ms, salida 0. |
| Lint | PASS | Salida 0. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; node --version; npm --version; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 / npm 11.19.0.

Hallazgo de alcance: IMPLEMENTATION-PLAN lista buffer de persistencia y estado React en T17; la instrucción explícita más reciente limita esta entrega al controlador independiente de React y sin persistencia automática. Se sigue esa autorización, sin modificar documentos fuente ni iniciar T18. No hay llamadas a bulkAdd/save, buffers de escritura, triggers, flush, recuperación persistida, Page Visibility funcional o Wake Lock; esos puntos quedan para T18/T27/T28 y UI posterior.

Limitaciones: almacenamiento solo en memoria (se pierde al recargar); cálculos/reclasificación por segmento completos pueden requerir optimización y validación de rendimiento para caminatas largas; polling/refresh explícito, sin suscripción; current speed/current pace no se calculan (no asignados explícitamente a T17); sin UI, mapas o gráficos; GPS real en iPhone pendiente. No se garantizan métricas completas en huecos. Sin dependencias nuevas ni bloqueos pendientes; README/documentos fuente/T08–T16/UI intactos. Vitest conserva sugerencia informativa de rendimiento jsdom. T18 no ha comenzado.

## Historial de T16

T16 ejecutada, aprobada por QA y cerrada en b432651 (feat: complete T16 walk session state).

## Estado y transiciones implementados en T16

src/features/tracking/session.ts contiene reducer/funciones puras para estado local. Solo depende de tipos T06 y helpers de tiempo T13; sin React, Dexie directo, browser APIs, Geolocation, Wake Lock, Page Visibility ni UI. No escribe datos, captura GPS ni recalcula distancia/velocidad/ritmo/elevación.

WalkSession: walkId, name, status, startedAt, endedAt, currentPauseStartedAt, pauses cerradas, interruptions, activeDurationMs, totalDurationMs, stateChangedAt, evaluatedAt, isIncomplete, lastPersistedAt y lastPointTimestamp. Campos y arrays readonly; las transiciones crean nuevo estado sin mutar el previo. No se añaden referencias o conteos GPS todavía; el contrato no los requiere para T16.

API pública:

- createWalkSession(walkId, name?): SessionResult<WalkSession>. Crea idle con tiempos cero y referencias null; ID en blanco se rechaza.
- canTransition(status, action): boolean. Consulta tabla explícita.
- transitionSession(session, { type, timestamp }): SessionResult<WalkSession>. Acciones start/pause/resume/mark-incomplete/continue/finish/refresh; timestamps explícitos, sin Date.now.
- generateWalkName(timestamp): SessionResult<string>. Nombre automático al iniciar si no hay nombre manual, formato Caminata – DD Mon YYYY HH:MM. UTC explícito y meses ingleses estables para determinismo, sin depender de locale/zona del entorno. Nombres manuales se conservan tras trim; blanco equivale a no proporcionado. Cambiar nombre en UI/historial queda para otra tarea.
- toActiveSessionSnapshot(session): SessionResult<ActiveSession>. Compatible con el parámetro save de ActiveSessionRepository sin importar runtime de repositorios ni realizar escritura.

Transiciones:

| Estado | Acción | Resultado |
|---|---|---|
| idle | start | active |
| active | pause | paused |
| paused | resume | active |
| active/paused | mark-incomplete | incomplete |
| incomplete | continue | active |
| active/paused/incomplete | finish | finished |
| active/paused/incomplete | refresh | mismo estado, tiempos actualizados |

Toda otra transición se rechaza, incluidas pausa idle/repetida, resume active, continue no incomplete y cualquier acción tras finished. No se implementa cancelación/descarte de aplicación porque no forma parte de las transiciones mínimas autorizadas de T16.

Errores explícitos SessionResult: ok true/value o ok false/error con kind/message. Kinds invalid-identity, invalid-transition, invalid-timestamp, regressive-time e invalid-state. Fechas no finitas, negativas, fraccionarias, fuera de rango Date o enteros inseguros se rechazan. Timestamp igual al último evento se permite con duración cero; anterior a evaluatedAt (incluido refresh) se rechaza sin alterar estado.

Tiempos en milisegundos: total = tiempo final/evaluado - inicio original, incluyendo pausas; activo usa calculateActiveDurationMs de T13 sobre pausas cerradas y pausa actual abierta. Pause inicia intervalo; resume/finish lo cierran una sola vez. Refresh cambia evaluatedAt pero conserva stateChangedAt. Finalización fija endedAt y no admite posteriores refrescos/transiciones.

Incomplete: marca isIncomplete permanentemente y registra un intervalo interruptions con inicio/fin y previousStatus, conservando walkId/inicio original. Continue o finish cierra la interrupción. Si venía de paused, conserva y luego cierra la misma pausa abierta: toda ella excluida del activo. Si venía de active, el intervalo de interrupción no se convierte en pausa: su tiempo continúa dentro del activo, identificado separadamente conforme al contexto D7; no implica GPS efectivo ni distancia medida. La condición incompleta persiste al continuar/finalizar para la futura integración con Walk.isIncomplete. No se inicia ningún servicio al continuar.

Compatibilidad persistente: ActiveSession T06 permanece intacto. Snapshot contiene walkId/status/inicio/stateChangedAt/duraciones/últimas referencias; solo se permite para active/paused/incomplete. Idle/finished se rechazan. lastPersistedAt/lastPointTimestamp permanecen null mientras ninguna capa autorizada los actualice. No se agrega guardado automático ni recuperación desde IndexedDB. El snapshot existente no serializa historial de pausas/interrupciones o nombre; su reconstrucción y estrategia de persistencia corresponden a T18/T26, no se afirma recuperación completa desde ese objeto en T16.

## Pruebas y verificación de T16

30 pruebas en tests/session.test.ts: idle, identidad/naming, ocho transiciones requeridas, pausa/refresh, dos ciclos, cierre desde paused, incompletitud desde active/paused, continuar/guardar preservando inicio y bandera, transiciones inválidas/repetidas, timestamps iguales/regresivos/invalidos, inputs congelados/determinismo y snapshot compatible con contrato de repository mediante import type sin escritura.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 223 pruebas en 15 archivos, 5.47 s; 193 previas preservadas. |
| Build | PASS | 30 módulos, 305 ms, salida 0. |
| Lint | PASS | Salida 0. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; node --version; npm --version; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 / npm 11.19.0.

Sin dependencias nuevas, desviaciones ni bloqueos. README actualizado en el cierre formal con T00–T16, estado/transiciones, pausas/incomplete, testing y T17 pendiente. Documentos fuente/modelos/repositorios/servicios/métricas/UI intactos. Vitest mantiene sugerencia informativa de rendimiento jsdom. No se implementan orquestador, GPS en vivo, Wake Lock, Page Visibility funcional, persistencia, métricas de ruta o UI; recuperación de almacenamiento real pendiente de T26. T17 no ha comenzado.

La revisión independiente de Valerio aprobó T16: estado, transiciones válidas/rechazadas, errores explícitos, tiempos, pausas, incomplete, naming, snapshot compatible, pureza/no mutación y determinismo. 223 pruebas, build, lint, TypeScript y git diff --check PASS. Verificó 35 combinaciones estado/acción; escenario 10:00–10:30 con pausa de 5 minutos dio total 30/activo 25; dos pausas dieron total 40/activo 32. Sin defectos ni bloqueos.

Validación final de cierre de T16: npm test -- --run PASS (223 pruebas, 15 archivos, 5.34 s); npm run build PASS (30 módulos, 341 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Documentos fuente intactos. Antes del commit se verificó tracking: solo session.ts puro y página placeholder; imports limitados a tipos y tiempo T13, sin orquestador ni integración T17.

El cierre incluye comprobación de git status y git log -1 --oneline después del commit.

## Historial de T15

T15 ejecutada, aprobada por QA y cerrada en 56bf979 (feat: complete T15 altitude processing).

## Procesamiento de altitud implementado en T15

src/domain/elevation/elevation.ts implementa funciones puras en metros. Reutiliza distancia acumulada/Haversine T12, sin modificar T12/T13, modelos ni clasificación T14. Sin React, browser, Chart.js, Dexie, repositories, persistencia, UI o tracking.

API pública:

- ElevationConfig / DEFAULT_ELEVATION_CONFIG: parámetros centralizados ajustables.
- prepareElevationSeries(points, config?): ElevationSample[]. Normaliza altitud disponible/no disponible, aplica política GPS y detecta picos verticales aislados; conserva un sample por punto y su orden.
- interpolateElevationGaps(samples, config?): ElevationSample[]. Interpolación conservadora de huecos disponibles para tratar.
- smoothElevationSeries(samples, config?): ElevationSample[]. Banda muerta respecto al último valor aceptado.
- calculateElevationChange(processedSamples): { gainMeters, lossMeters, estimated }. Sobre la serie ya tratada: suma deltas positivos para ganancia y magnitud de deltas negativos para pérdida; huecos y cambios de walkId cortan continuidad.
- buildElevationProfile(points, config?): ElevationSample[]. Compone preparación, interpolación y suavizado para el gráfico futuro.

ElevationSample: pointId, walkId, timestamp originales, distanceMeters acumulada, altitudeMeters procesada o null, source (measured/interpolated/unavailable/excluded/altitude-anomaly), estimated y smoothed. Serie derivada independiente: no modifica altitude ni quality de TrackPoint. No persiste ni adapta automáticamente las evaluaciones separadas de T14; consume la clasificación presente en los puntos recibidos.

Política por calidad GPS:

- valid: altitud finita y coordenadas seguras utilizables.
- suspicious: utilizable con cautela conforme D2; mismo control de valores no finitos y picos corroborados, sin reclasificar GPS.
- low-quality: conservado como hueco excluded, sin participar en elevación ni interpolar a través; evaluación posterior pendiente.
- anomalous: excluido, corta métricas; altitud original conservada.
- estimated de entrada: excluido por ahora para no mezclar una estimación de método desconocido. Las interpolaciones creadas en T15 sí participan y se marcan estimated; no generan TrackPoints estimated.

Altitud null/no finita de un punto GPS elegible produce unavailable. Altitud negativa finita es válida. Coordenadas inseguras producen excluded y no generan distancias no finitas.

Parámetros iniciales:

| Parámetro | Valor | Motivo |
|---|---|---|
| minimumChangeMeters | 3 m | Suprimir oscilaciones pequeñas; diferencia inferior al umbral mantiene el último valor aceptado, igualdad sí se acepta. Ascenso lento acumulado cruza el umbral sin perder todos los incrementos. |
| isolatedSpikeMeters | 30 m | Pico/vaguada aislado debe diferir al menos 30 m de ambos vecinos, que entre sí difieren menos de 3 m; no elimina un ascenso sostenido. |
| maximumInterpolationPoints | 5 | Limitar cantidad de faltantes consecutivos. |
| maximumInterpolationDistanceMeters | 100 m | Exigir referencias cercanas por distancia horizontal acumulada. |
| maximumInterpolationIntervalMs | 60000 ms | Exigir cercanía temporal; sin extrapolar pérdidas prolongadas. |

Los límites de interpolación son inclusivos. Parámetros no finitos/no positivos, cantidad no entera o umbral de pico menor/igual al suavizado producen RangeError por configuración inválida. Son valores iniciales ajustables, sujetos a calibración real.

Interpolación: solo huecos unavailable entre referencias finitas de la misma caminata, sin saltar excluded/altitude-anomaly. Requiere timestamps finitos/no negativos/no decrecientes y límites de cantidad/distancia/tiempo. Se interpola linealmente respecto a distancia; si distancia de todo el tramo es cero, se usa posición relativa en la secuencia. Extremos y huecos sin base suficiente quedan null. No se inventan alturas por extrapolación.

Suavizado: banda muerta respecto a último valor aceptado, con reinicio en huecos o cambio de caminata; no altera la altitud original. La salida informa smoothed si cambia el valor y propaga procedencia estimated cuando usa un valor interpolado previo. Ganancia/pérdida excluyen toda transición a través de null o entre caminatas. estimated de las métricas es true cuando un delta no nulo usa valores derivados estimados. Vacío/un punto/sin segmentos dan 0/0 (subtotal disponible); un desbordamiento numérico produce null/null, no Infinity.

Perfil: distanceMeters reutiliza segmentos consecutivos de T12, respetando exclusiones y sin interpolar distancia. La serie puede contener nulls y distancias repetidas, para que un gráfico futuro identifique huecos. No configura Chart.js.

## Pruebas y verificación de T15

29 pruebas en tests/elevation.test.ts: vacío/un punto, constante, ascenso/descenso/mixto, ruido, fronteras 2.999/3/3.001 m, ascenso lento, uno/varios null, extremos, clasificación GPS, picos corroborados, altitud negativa, coordenadas negativas, perfil/T12, puntos repetidos, NaN/Infinity, límites de interpolación, timestamps inválidos, separación de caminatas, inputs congelados, determinismo, configuración y desbordamiento.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 193 pruebas en 14 archivos, 4.90 s; 164 previas preservadas. |
| Build | PASS | 30 módulos, 338 ms, salida 0. |
| Lint | PASS | Salida 0. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; node --version; npm --version; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 / npm 11.19.0.

Hallazgo corregido: primeras 191 pruebas PASS, pero build detectó narrowing de referencia opcional y fixtures incompatibles con discriminante TrackPoint; corregidos y suite/build completos PASS. Sin dependencias nuevas, desviaciones ni bloqueos. Vitest mantiene sugerencia informativa de rendimiento jsdom. Se retira .gitkeep de elevation. README actualizado en el cierre formal con T00–T15, elevación, suavizado/interpolación, perfil, testing y T16 pendiente. Documentos fuente intactos. Sin conversiones opcionales a pies, tracking, persistencia, UI, gráficos ni T16.

Limitaciones: suavizado puede omitir cambios reales menores a 3 m; detector de pico aislado puede omitir una cima/vaguada real y no resuelve anomalías de extremos o bloques completos sin corroboración. Ganancia/pérdida son subtotales de tramos disponibles, no una garantía de cobertura completa. Interpolaciones y umbrales requieren validación en iPhone. T16 no ha comenzado.

La revisión independiente de Valerio aprobó T15: procesamiento en metros, suavizado e interpolación conservadora, parámetros y política GPS, exclusión de anomalous, ganancia/pérdida, perfil T12, pureza/no mutación y determinismo. 193 pruebas, build, lint, TypeScript y git diff --check PASS. Sus comprobaciones independientes confirmaron ascenso 20/0 m, descenso 0/20 m, perfil mixto 20/5 m, ruido 0/0 m, interpolación a 110 m y fronteras de 3 m. Sin defectos ni bloqueos.

Validación final de cierre de T15: npm test -- --run PASS (193 pruebas, 14 archivos, 5.09 s); npm run build PASS (30 módulos, 330 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Documentos fuente intactos. Antes del commit se verificaron tracking/App/hooks/providers: solo página placeholder y marcadores existentes, sin lógica de estado de sesión T16.

El cierre incluye comprobación de git status y git log -1 --oneline después del commit.

## Historial de T14

T14 ejecutada, aprobada por QA y cerrada en a589c4f (feat: complete T14 GPS quality classification).

## Clasificación GPS implementada en T14

src/domain/filtering/gpsQuality.ts implementa lógica pura y determinística. Reutiliza Haversine de T12, sin modificar métricas T12/T13 ni modelos T06. No elimina puntos ni devuelve una ruta filtrada; entrega la clasificación por separado de los datos originales. Sin React, Dexie, repositories, browser, persistencia, UI o integración con Geolocation Service.

API pública:

- GpsQualityConfig / DEFAULT_GPS_QUALITY_CONFIG: configuración centralizada, readonly y defaults congelados.
- evaluateAccuracy(accuracy, config?): valid | low-quality. Accuracy no finita, negativa o ausente queda low-quality; no basta para anomalía.
- classifyTrackPoint(point, previous?, config?): GpsAssessment. Incluye referencia original point, quality, signals, distanceMeters, intervalMs y apparentSpeedMetersPerSecond. No modifica ningún campo del punto original.
- classifyTrackPoints(points, config?): GpsAssessment[]. Conserva todos los puntos y orden. Mantiene como referencia previa relevante el último punto clasificado valid/suspicious con coordenadas seguras y timestamp creciente; low-quality/anomalous/estimated no desplazan esa referencia. No compara entre walkId distintos.

Umbrales iniciales autorizados explícitamente para T14, configurables y sujetos a pruebas reales:

| Parámetro | Valor | Justificación |
|---|---|---|
| acceptableAccuracyMeters | 25 m | Tolerancia inicial generosa para caminata; mayor precisión reportada degrada calidad, no descarta el dato. |
| maximumWalkingSpeedMetersPerSecond | 5 m/s | Límite conservador alto (18 km/h), para no tratar caminar rápido como anomalía por sí solo. |
| maximumJumpMeters | 100 m | Identifica saltos grandes, con corroboración adicional. |
| maximumJumpIntervalMs | 30000 ms | Salto espacial solo dentro de ventana corta; desplazamiento largo con intervalo largo puede ser normal. |
| minimumIntervalMs | 1000 ms | Evita inferir velocidad sobre intervalos demasiado breves. |
| anomalyEvidenceCount | 2 | Se requieren al menos dos evidencias y corroboración espacial/temporal. Puede aumentarse; nunca reducirse a una. |

Las comparaciones de accuracy/velocidad/salto son estrictamente mayores al umbral; igualdad aceptada. Intervalo mínimo inclusivo para calcular velocidad; ventana máxima de salto inclusiva. Configuración inválida (no finita/no positiva, cantidad no entera o menor a dos, ventana máxima menor al intervalo mínimo) lanza RangeError para señalar error de configuración, no clasificar datos GPS.

Señales: poor-accuracy, invalid-accuracy, invalid-coordinates, invalid-timestamp, non-increasing-time, short-interval, excessive-apparent-speed, spatial-jump, excessive-device-speed, invalid-device-speed. Distancia e intervalo inseguros se entregan como null; no se inventa velocidad.

Reglas:

- valid: accuracy aceptable, sin señales sospechosas.
- low-quality: accuracy pobre/invalidada, sin otras señales sospechosas; dato conservado para evaluación posterior (D1).
- suspicious: señal aislada de movimiento/tiempo, datos inválidos o speed reportada excesiva, sin suficientes evidencias corroboradas; D2 mantiene utilizable lo sospechoso no claramente inválido.
- anomalous: al menos anomalyEvidenceCount entre poor-accuracy, excessive-apparent-speed, spatial-jump, non-increasing-time y excessive-device-speed, incluyendo al menos una señal espacial/temporal. Accuracy y speed reportada juntas no bastan sin corroboración espacial/temporal.
- estimated: solo se conserva cuando el punto de entrada ya es estimated; no se genera ni asigna a puntos observados.

Timestamps iguales/invertidos generan non-increasing-time, sin división; aislados son suspicious. Timestamp no finito/negativo genera diagnóstico invalid-timestamp y comparación temporal null. Intervalos positivos menores al mínimo generan short-interval, sin velocidad aparente. Datos faltantes/invalidados no cuentan por sí solos como evidencia de anomalía; una combinación de evidencias explícitas sí puede producirla.

Speed null es ausencia permitida. Speed negativa/no finita produce diagnóstico, no anomalía automática. Speed medida por encima del máximo aporta evidencia complementaria; no sustituye velocidad aparente ni determina sola anomalous. Los valores originales, incluidos null/NaN, se preservan. Altitud no se evalúa.

Limitación: velocidad aparente y salto se derivan del mismo desplazamiento y pueden estar correlacionados. La regla inicial es explicable y configurable, no una calibración validada en iPhone. No detecta movimiento real con certeza ni define políticas de UI o filtrado definitivo.

## Pruebas y verificación de T14

31 pruebas en tests/gpsQuality.test.ts: punto inicial, accuracy/fronteras/invalidada, movimiento normal, salto imposible, intervalo largo coherente, velocidad aislada, timestamps iguales/invertidos/invalidos, intervalos mínimos, speed ausente/cero/frontera/inválida/complementaria, repetidos, coordenadas negativas e inválidas, estimated reservado, secuencia mixta, anomalías consecutivas, referencia relevante, entradas congeladas, determinismo, compatibilidad T12, configuración y fronteras de salto/velocidad/ventana.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 164 pruebas en 13 archivos, 5.82 s; 133 previas preservadas. |
| Build | PASS | 30 módulos, 286 ms, salida 0. |
| Lint | PASS | Salida 0. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 / npm 11.19.0.

Hallazgo corregido durante desarrollo: primera ejecución tuvo tres fallos por un paréntesis incorrecto en una aserción parametrizada; corregido y suite completa PASS. Vitest mantiene sugerencia informativa de rendimiento jsdom. Sin dependencias nuevas, desviaciones ni bloqueos. Se retira .gitkeep de filtering al crear fuentes. Umbrales iniciales establecidos bajo autorización de T14 sin modificar DECISIONS. README actualizado en el cierre formal con T00–T14, clasificación GPS, señales/umbrales, testing y T15 pendiente. Documentos fuente intactos. Sin T15, altitud, filtrado definitivo, métricas adicionales, UI, mapas, tracking, persistencia o integración con servicios. T15 no ha comenzado.

La revisión independiente de Valerio aprobó los 31 criterios de T14: estados diferenciados y estimated reservado, múltiples señales, umbrales ajustables/fronteras, timestamps/speed, pureza y no mutación, reutilización T12, alcance y documentación. 164 pruebas, build, lint, TypeScript y git diff --check PASS. Sus escenarios independientes confirmaron movimiento normal, accuracy pobre aislada, sospecha aislada, salto/velocidad corroborados, tiempo invertido, fronteras y determinismo. Sin defectos ni bloqueos.

Validación final de cierre de T14: npm test -- --run PASS (164 pruebas, 13 archivos, 4.62 s); npm run build PASS (30 módulos, 330 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Documentos fuente intactos. Antes del commit se verificó src/domain/elevation: solo .gitkeep, sin implementación de T15.

El cierre incluye comprobación de git status y git log -1 --oneline después del commit.

## Historial de T13

T13 ejecutada, aprobada por QA y cerrada en ec55c3e (feat: complete T13 time speed and pace metrics).

## Métricas y conversiones implementadas en T13

Tres módulos nuevos en src/domain/metrics/, independientes de React, Dexie, repositories y APIs del navegador; funciones puras sin reloj implícito ni mutación. distance.ts de T12 se conserva intacto. No se implementa tracking ni clasificación GPS.

Unidades internas: timestamps Unix y duración en milisegundos, distancia en metros, velocidad promedio en m/s y ritmo promedio en segundos/km, coherentes con Walk de T06.

API pública:

- PauseInterval: startedAt y endedAt readonly; endedAt null representa pausa abierta.
- calculateTotalDurationMs(startedAt, endedAt): number | null. Total = final - inicio, incluyendo pausas. El final puede ser el instante de evaluación recibido para una caminata en curso; no se consulta Date.now. Fechas ausentes producen null.
- calculateActiveDurationMs(startedAt, endedAt, pauses = []): number | null. Activo = total menos la unión de pausas recortadas al intervalo. Copia los intervalos antes de ordenar; une solapamientos/duplicados/contiguos sin restarlos dos veces. Pausa abierta se evalúa hasta endedAt recibido. Pausas válidas completamente fuera del intervalo no descuentan tiempo; pausas invertidas o no finitas invalidan el resultado.
- calculateAverageSpeedMetersPerSecond(distanceMeters, activeDurationMs): number | null. Velocidad = distancia / (tiempo activo / 1000). No recibe tiempo total.
- calculateAveragePaceSecondsPerKilometer(distanceMeters, activeDurationMs): number | null. Ritmo = (tiempo activo / 1000) / (distancia / 1000), equivalente a tiempo activo ms / distancia m, en segundos/km. No recibe tiempo total.

Helpers de conversions.ts:

| Helper | Conversión |
|---|---|
| metersToKilometers | m / 1000 |
| metersToMiles | m / 1609.344 (milla internacional) |
| metersPerSecondToKilometersPerHour | m/s × 3.6 |
| metersPerSecondToMilesPerHour | m/s × 3600 / 1609.344 |
| secondsPerKilometerToMinutesPerKilometer | s/km / 60 |
| secondsPerKilometerToMinutesPerMile | s/km × 1.609344 / 60 |

Resultados no calculables se representan como null: fechas ausentes/invertidas/negativas, valores negativos, NaN o Infinity, pausas inválidas, tiempo activo cero para promedios, distancia cero para ritmo y desbordamientos. Distancia cero con tiempo activo positivo da velocidad cero. Duración cero válida y duración totalmente pausada dan 0. Los helpers de conversión preservan cero y propagan null; no redondean ni formatean para UI. No se fabrican métricas estimadas. Las funciones reciben la distancia ya calculada en T12; el consumidor futuro conserva el origen medido/estimado al construir MetricValue.

## Pruebas y verificación de T13

31 pruebas nuevas: tests/timeAndAverages.test.ts (18) y tests/conversions.test.ts (13). Cubren total/activo, una/múltiples pausas, solapamientos, pausas abiertas, recorte, totalmente pausada, promedios con tiempo activo, distancia/tiempo cero, entradas inválidas, desbordamiento, seis conversiones, tolerancias y no mutación mediante entradas congeladas. Una prueba reutiliza el resultado de distancia T12. Sin GPS real ni navegador manual.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 133 pruebas en 12 archivos, 4.64 s; 102 previas preservadas. |
| Build | PASS | 30 módulos, 324 ms, salida 0. |
| Lint | PASS | Salida 0. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 / npm 11.19.0.

Sin dependencias nuevas, desviaciones ni bloqueos. Vitest conserva sugerencia informativa de rendimiento jsdom. README actualizado en el cierre formal con T00–T13, métricas/conversiones, testing y T14 pendiente. Documentos fuente intactos. Sin velocidad/ritmo actuales, altitud, clasificación, filtrado avanzado, UI ni lógica funcional de tracking o recuperación. Las pausas son datos de entrada; no se generan transiciones de caminata. T14 no ha comenzado.

La revisión independiente de Valerio aprobó los 26 criterios de T13: tiempo total/activo, pausas, promedios con tiempo activo, unidades/conversiones, resultados null, pureza y no mutación; 133 pruebas, build, lint, TypeScript y git diff --check PASS. Confirmó los ejemplos de 1000 m en 600 s y 1609.344 m en 600 s, además de 50 combinaciones de pausas mediante un conteo independiente. Sin defectos ni bloqueos.

Validación final de cierre de T13: npm test -- --run PASS (133 pruebas, 12 archivos, 4.92 s); npm run build PASS (30 módulos, 325 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Documentos fuente intactos y T14 sin iniciar.

El cierre incluye comprobación de git status y git log -1 --oneline después del commit.

## Historial de T12

T12 ejecutada, aprobada por QA y cerrada en aad960b (feat: complete T12 distance calculation).

## Distancia implementada en T12

src/domain/metrics/distance.ts contiene funciones puras, sin dependencias runtime de React, Dexie, repositories o APIs del navegador. Solo importa TrackPoint como tipo.

API pública:

- Coordinates: campos readonly latitude/longitude reutilizados de TrackPoint.
- calculateDistanceMeters(from: Coordinates, to: Coordinates): number | null. Distancia horizontal en metros mediante Haversine, modelo esférico con radio medio 6 371 000 m; null para coordenadas no finitas o fuera de latitude [-90, 90] / longitude [-180, 180]. No confunde entradas inválidas con distancia cero.
- calculateAccumulatedDistanceMeters(points: readonly TrackPoint[]): number. Suma segmentos consecutivos elegibles en el orden recibido; devuelve 0 para secuencia vacía, un punto o ausencia de segmentos elegibles. No modifica, clasifica ni ordena puntos.

Reglas de participación sin umbrales nuevos:

- Puntos medidos (estimated false), quality valid o suspicious y coordenadas seguras participan. D2 permite utilizar suspicious normalmente.
- anomalous se excluye según RQ-DATA-002/D2. low-quality queda pendiente de evaluación según D1 y no participa provisionalmente. estimated queda fuera de esta distancia medida; no se mezcla estimación sin identificarla.
- Cada punto excluido corta el segmento; no se conecta el punto anterior con el siguiente a través del hueco. Esta función no implementa interpolación o tratamiento de interrupciones, previstos en tareas posteriores; puede devolver un subtotal medido menor que la ruta completa.
- No se suman segmentos entre walkId distintos. No se implementan reglas de pausa, coherencia temporal o duración; el consumidor futuro debe proporcionar la secuencia pertinente.

Haversine calcula distancia superficial esférica, sin elevación ni corrección elipsoidal. El término intermedio se limita numéricamente a [0, 1] para evitar NaN por redondeo cerca de antípodas. Maneja naturalmente el cruce del meridiano 180. Referencia: [Chris Veness, cálculo geodésico Haversine](https://www.movable-type.co.uk/scripts/latlong.html).

## Pruebas y verificación de T12

21 pruebas en tests/distance.test.ts: puntos iguales, referencia ecuatorial de 0.001 grados (~111.195 m, tolerancia 0.005 m para el modelo esférico), coordenadas de Bogotá negativas, acumulación, secuencia vacía/un punto, anomalous intermedio, suspicious/low-quality, estimated, repetidos, antimeridiano, antípodas/polos, ocho entradas no finitas/fuera de rango, objetos/array congelados y separación de caminatas. No requieren navegador ni datos reales.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 102 pruebas en 10 archivos, 4.76 s; 81 previas preservadas. |
| Build | PASS | 30 módulos, 302 ms, salida 0. |
| Lint | PASS | Salida 0. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 / npm 11.19.0.

Sin dependencias nuevas, desviaciones arquitectónicas ni bloqueos. Se retira .gitkeep de metrics al incorporar fuentes. Vitest conserva sugerencia informativa de rendimiento jsdom. README actualizado en el cierre formal con distancia, fórmula/unidad, testing, T00–T12 y T13 pendiente. Documentos fuente intactos. Sin UI, velocidad, ritmo, conversión de presentación, elevación, filtrado avanzado, clasificación ni estimación. Los parámetros de calidad y tratamiento de huecos siguen pendientes de tareas posteriores; no se fijan en T12. T13 no ha comenzado.

La revisión independiente de Valerio aprobó los 21 criterios de T12: funciones puras, fórmula/unidad, exclusión de anómalos, no mutación y casos borde, alcance y documentación; 102 pruebas, build, lint, TypeScript y git diff --check PASS. Contrastó cinco pares mediante una fórmula vectorial independiente, con diferencia inferior a 0.001 m respecto al mismo modelo esférico. Sin defectos ni bloqueos.

Validación final de cierre de T12: npm test -- --run PASS (102 pruebas, 10 archivos, 4.71 s); npm run build PASS (30 módulos, 328 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Documentos fuente intactos y T13 sin iniciar.

El cierre incluye comprobación de git status y git log -1 --oneline después del commit.

## Historial de T11

T11 ejecutada, aprobada por QA y cerrada en 9f31a62 (feat: complete T11 wake lock service).

## Servicio de Wake Lock creado en T11

src/services/wakeLock/wakeLockService.ts encapsula navigator.wakeLock.request('screen'), WakeLockSentinel.release y el evento release. Servicio sin imports, independiente de React, Dexie, repositories, geolocalización, UI y Settings. Sin solicitudes al importar/construir. Admite API inyectada para pruebas.

API pública de createWakeLockService(injectedApi?):

- isSupported(): boolean. Detecta presencia de request sin solicitar permisos.
- isActive(): boolean. Comprueba sentinel existente y released false.
- request(): Promise<WakeLockResult>. Solicita screen o reutiliza el bloqueo activo.
- release(): Promise<WakeLockResult>. Libera el bloqueo; seguro sin lock o al repetirse.
- subscribeRelease(callback): () => void. Notifica liberaciones automáticas y explícitas, con cancelación independiente e idempotente.
- cleanup(): Promise<WakeLockResult>. Cancela todas las suscripciones y encola liberación; seguro al repetirse. El servicio puede reutilizarse posteriormente.

WakeLockResult: { ok: true } o { ok: false, error: { kind, name, message } }. kind admite unsupported, request-failed, release-failed y already-released. Falta de API devuelve unsupported; request rechazado o excepción síncrona se normalizan conservando nombre/mensaje, incluidos DOMException de otros realms. Un sentinel ya liberado no se considera activo. No se exponen errores como mensajes de UI.

Operaciones request/release serializadas por instancia para evitar solicitudes nativas duplicadas y mantener orden. Cleanup durante request pendiente espera su resolución y libera el sentinel recibido; la API nativa no proporciona cancelación de esa solicitud. Un release fallido devuelve error y conserva el sentinel para permitir reintentar. No se ocultan fallos de liberación ni se asume éxito.

El listener release actualiza el estado, se retira del sentinel y notifica una sola vez; se elimina también al liberar explícitamente. Suscripciones con el mismo callback son independientes. El consumidor debe llamar cleanup y revisar su resultado. No hay recuperación automática, política de visibilidad ni decisiones de inicio/fin de caminata.

Referencia: [W3C Screen Wake Lock API](https://www.w3.org/TR/screen-wake-lock/).

## Pruebas y verificación de T11

18 pruebas nuevas en tests/wakeLock.test.ts con mock de navigator.wakeLock y sentinel respaldado por EventTarget: soporte/no soporte/sin navigator, screen, estado activo, solicitudes concurrentes/consecutivas, release explícito/automático, listener exacto, ausencia e idempotencia, nueva solicitud, rechazo/DOMException/excepción síncrona, sentinel ya liberado, fallo de release y reintento, cleanup repetido o durante solicitud pendiente, orden release/request, suscripciones selectivas e inyección. Teardown limpia el servicio y restaura globals. Sin Wake Lock real.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 81 pruebas en 9 archivos, 4.55 s; 63 anteriores preservadas. |
| Build | PASS | 30 módulos, 339 ms, salida 0. |
| Lint | PASS | Salida 0. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 / npm 11.19.0.

Hallazgo corregido durante desarrollo: normalización inicial mediante instanceof Error no preservaba nombre/mensaje de DOMException en jsdom; se reemplazó por lectura estructural y la regresión pasó. Vitest mantiene su sugerencia informativa sobre rendimiento jsdom. Sin dependencias nuevas, desviaciones ni bloqueos. Se retira .gitkeep de wakeLock. README actualizado en el cierre formal con Wake Lock, testing, tareas T00–T11 y T12 pendiente. Documentos fuente intactos. Sin conexión a Settings, Active Walk, Page Visibility, tracking o persistencia; sin métricas. Validaciones de soporte/políticas en iPhone pendientes de pruebas reales. T12 no ha comenzado.

La revisión independiente de Valerio aprobó los 24 criterios de T11: soporte/fallback, request screen/release, estado y liberación automática, re-solicitud, cleanup, independencia y alcance; 81 pruebas, build, lint, TypeScript y git diff --check PASS. Su comprobación adicional confirmó ausencia de locks/listeners residuales tras cleanup. Sin defectos ni bloqueos.

Validación final de cierre de T11: npm test -- --run PASS (81 pruebas, 9 archivos, 4.45 s); npm run build PASS (30 módulos, 328 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Documentos fuente intactos y T12 sin iniciar.

El cierre incluye comprobación de git status y git log -1 --oneline después del commit.

## Historial de T10

T10 ejecutada, aprobada por QA y cerrada en cb83386 (feat: complete T10 page visibility service).

## Servicio de Page Visibility creado en T10

src/services/visibility/visibilityService.ts encapsula document.visibilityState y el evento visibilitychange. No tiene imports ni dependencias de React, Dexie, repositories, GPS o dominio. No registra listeners al importar o construir; admite documento inyectado para pruebas. Sin documento disponible, la creación falla explícitamente en vez de inventar un estado de visibilidad.

API pública:

- createVisibilityService(injectedDocument?): VisibilityService.
- getCurrentState(): VisibilityState. Consulta el estado actual, sin snapshot obsoleto.
- subscribe(callback): () => void. Registra una suscripción a eventos futuros y devuelve su cleanup; no emite un estado inicial automáticamente (se obtiene mediante getCurrentState).
- VisibilityState: visible | hidden | unknown. Valores no reconocidos se normalizan a unknown, sin asumir que la página es visible ni decidir acciones funcionales.

Cada suscripción crea un listener independiente. El callback recibe el estado leído al producirse visibilitychange. Cleanup retira exactamente ese listener, es idempotente e invalida invocaciones tardías; cancelar una suscripción no afecta a otras, incluso cuando comparten callback. El consumidor es responsable de llamar al cleanup de cada suscripción. No hay listeners globales ni suscripciones implícitas.

Referencia técnica: [HTML Standard, Page visibility](https://html.spec.whatwg.org/multipage/interaction.html#page-visibility).

## Pruebas y verificación de T10

11 pruebas en tests/visibility.test.ts, con spies sobre document.visibilityState, addEventListener y removeEventListener y eventos simulados. Cubren visible/hidden, lectura actualizada, registro de evento, callback/estado actualizado, cleanup exacto e idempotente, suscripciones independientes, cancelación selectiva, mismo callback, estados desconocidos, callbacks tardíos, documento inyectado y ausencia de documento. afterEach limpia las suscripciones y restaura spies/globals; sin interacción manual con navegador real.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 63 pruebas en 8 archivos, 3.65 s; 52 anteriores preservadas. |
| Build | PASS | 30 módulos, 308 ms, salida 0. |
| Lint | PASS | Salida 0. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 / npm 11.19.0.

Sin dependencias nuevas, desviaciones ni bloqueos. Se retira el .gitkeep de visibility porque contiene implementación. Vitest muestra una sugerencia de rendimiento sobre creación de entornos jsdom; no es un fallo y se conserva el aislamiento existente. No se implementan flush, advertencias, huecos de tracking, persistencia, UI ni Wake Lock. El comportamiento funcional ante cambios de visibilidad permanece pendiente de tareas posteriores. README actualizado durante el cierre formal con Page Visibility, testing y T11 pendiente. Documentos fuente intactos. T11 no ha comenzado.

La revisión independiente de Valerio aprobó los 24 criterios de T10: API de lectura/suscripción/cleanup, múltiples suscripciones y cleanup repetido, independencia y alcance, 63 pruebas PASS, build, lint, TypeScript y git diff --check. La comprobación adicional con documento simulado verificó cero listeners registrados tras cleanup. Sin defectos ni bloqueos.

Validación final de cierre de T10: npm test -- --run PASS (63 pruebas, 8 archivos, 3.65 s); npm run build PASS (30 módulos, 431 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Documentos fuente intactos y T11 sin iniciar.

El cierre incluye comprobación de git status y git log -1 --oneline después del commit.

## Historial de T09

T09 ejecutada, aprobada por QA y cerrada en fe2eefb (feat: complete T09 geolocation service).

## Servicio de geolocalización creado en T09

Archivos: src/services/geolocation/geolocationService.ts y types.ts. createGeolocationService devuelve una API independiente de React, Dexie y repositories; puede recibir un adaptador watchPosition/clearWatch para pruebas. Sin acceso al navegador al importar ni iniciar observación al construir. El navegador se consulta únicamente en start.

API pública:

- start({ onPosition, onError }, options?: PositionOptions): boolean. Inicia una observación; false si ya existe una o la API no está disponible. Una llamada duplicada conserva los callbacks y opciones originales; para cambiarlos hay que detener e iniciar nuevamente.
- stop(): void. Libera el watchId, incluido cero, y es seguro sin watcher activo o al repetirse. Permite reiniciar; callbacks tardíos de observaciones anteriores se ignoran. Garantía de un watcher por instancia del servicio; el futuro consumidor debe reutilizar una instancia.
- RawPosition reutiliza los tipos de campos de TrackPoint y conserva latitude, longitude, altitude, accuracy, speed y timestamp. Altitud y velocidad conservan null; no se asignan id, walkId, calidad ni estimaciones. Accuracy sigue siendo medida numérica. No hay cálculos ni persistencia.

Opciones centralizadas en DEFAULT_GEOLOCATION_OPTIONS, sobreescribibles en cada start:

| Opción | Valor inicial | Motivo |
|---|---|---|
| enableHighAccuracy | true | Solicitar mayor precisión para caminar; no garantiza precisión y deberá validarse el consumo en dispositivo real. |
| maximumAge | 0 ms | Solicitar posiciones actuales sin aceptar antigüedad de caché. |
| timeout | Omitido | Mantener el valor nativo; no fijar un umbral propio todavía. Puede configurarse mediante PositionOptions. |

Estos valores son ajustables, no parámetros definitivos de calidad, pérdida de señal o tracking. Referencia técnica: [W3C Geolocation, PositionOptions](https://www.w3.org/TR/geolocation/#position_options_interface).

Errores normalizados: permission-denied (1), position-unavailable (2), timeout (3); se preservan code y message originales. unknown conserva códigos no reconocidos; unsupported/code null informa ausencia de API. No hay mensajes de UI, reintentos automáticos ni cambios de estado de caminata. Los errores GPS se entregan a onError; stop queda bajo control del consumidor. Excepciones síncronas inesperadas de un adaptador se propagan, restableciendo el estado para permitir reintentar.

## Pruebas y verificación de T09

17 pruebas nuevas en tests/geolocation.test.ts: inicio mediante mock de navigator.geolocation, defaults y configuración, normalización, nulls, ceros, tres errores estándar y desconocido, clearWatch con ID cero, cleanup repetido, prevención de duplicados, reinicio y callbacks antiguos, API ausente, entorno sin navigator, inyección, excepción síncrona y stop desde callback síncrono. afterEach detiene el servicio y restaura los globals simulados. No requieren GPS real.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Tests | PASS | 52 pruebas en 7 archivos, 3.22 s; 35 previas preservadas. |
| Build | PASS | 30 módulos, 287 ms, salida 0. |
| Lint | PASS | Salida 0. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; npm test -- --run; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Node 24.21.0 y npm 11.19.0.

Sin dependencias adicionales ni desviaciones arquitectónicas. Se retira .gitkeep de geolocation al incorporar fuentes. Sin conexión UI, tracking funcional, persistencia, métricas, Page Visibility ni Wake Lock. Requisitos, decisiones, arquitectura y plan permanecen intactos. README actualizado durante el cierre formal con el servicio disponible, testing y T10 pendiente. Las pruebas con mocks no sustituyen la validación futura de permisos, precisión y consumo en iPhone. T10 no ha comenzado. Sin bloqueos.

La revisión independiente de Valerio aprobó los 28 criterios de T09, con 52 pruebas PASS, build, lint, TypeScript y git diff --check correctos. Confirmó mediante una comprobación adicional con mocks duplicados, stop repetido, reinicio con nuevo watchId, callbacks tardíos y errores desconocidos. Sin defectos ni bloqueos.

Validación final de cierre de T09: npm test -- --run PASS (52 pruebas, 7 archivos, 3.27 s); npm run build PASS (30 módulos, 325 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Documentos fuente intactos y T10 sin iniciar.

El cierre incluye comprobación de git status y git log -1 --oneline después del commit.

## Historial de T08

T08 ejecutada, aprobada por QA (Valerio: PASS — READY TO CLOSE T08) y cerrada en bb49a31 (feat: complete T08 data repositories).

## Repositories creados en T08

Cuatro clases pequeñas en `src/data/repositories/`, con instancia WalkingTrackerDatabase de T07 inyectada y privada. Reutilizan modelos T06, esquema v1 y claves singleton existentes. APIs públicas con Promise y datos de dominio; no exponen tablas ni consultas Dexie. index.ts reexporta los cuatro repositorios sin crear instancias ni abrir bases. UI y dominio no importan Dexie ni consumen directamente la base; no se integra todavía persistencia con la aplicación.

| Repository | API pública |
|---|---|
| WalkRepository | create(walk): Promise<string>; getById(id): Promise<Walk \| undefined>; list(): Promise<Walk[]>; update(id, Partial<Omit<Walk, 'id'>>): Promise<boolean>; delete(id): Promise<void> |
| TrackPointRepository | add(point): Promise<string>; bulkAdd(readonly TrackPoint[]): Promise<void>; getByWalkId(walkId): Promise<TrackPoint[]>; deleteByWalkId(walkId): Promise<number> |
| ActiveSessionRepository | save(session): Promise<void>; get(): Promise<ActiveSession \| undefined>; clear(): Promise<void> |
| SettingsRepository | get(): Promise<Settings \| undefined>; save(settings): Promise<void>; update(Partial<Settings>): Promise<boolean> |

Semántica de persistencia:

- create/add insertan y rechazan IDs duplicados sin sobrescribir. get ausente devuelve undefined; list vacío y getByWalkId sin coincidencias devuelven arrays vacíos.
- update modifica solo campos especificados y devuelve false si el registro no existe, sin crearlo. Walk.id se excluye del tipo de cambios. Campos métricos completos se reemplazan sin cálculos ni merge de subcampos.
- delete/clear son idempotentes. Walk.delete solo elimina Walk; no agrega cascadas sobre puntos/sesión. deleteByWalkId usa el índice existente y devuelve cantidad borrada. Políticas de borrado coordinado quedan fuera de esta tarea.
- getByWalkId usa el índice walkId y ordena los puntos por timestamp, sin índices nuevos ni filtrado GPS.
- bulkAdd se ejecuta en transacción: un fallo revierte el bloque completo. Array vacío no cambia datos.
- save de sesión/ajustes reemplaza mediante claves current/preferences; update de settings no introduce defaults. No se añaden opciones futuras.
- Errores de almacenamiento se propagan como rechazo de Promise; no se ocultan ni convierten en falsos éxitos. No se duplican validaciones de dominio ni se implementa recuperación.

## Pruebas y verificación de T08

`tests/repositories.test.ts` agrega 17 pruebas contra createDatabase de T07 con una IDBFactory en memoria por prueba. afterEach elimina la base y verifica ausencia de residuos. Casos: CRUD Walk, ausentes y duplicados; add/bulkAdd/getByWalkId/deleteByWalkId con exclusión de otros walks y orden temporal; bloque vacío y rollback ante duplicado; sesión save/get/clear y sustitución única; settings save/get/update, conservación de campos y ausencia de defaults; errores propagados con base cerrada. Datos ficticios, sin acceso a IndexedDB real ni globals modificados.

| Criterio / comprobación | Resultado | Evidencia |
|---|---|---|
| Cuatro repositories / encapsulación | PASS | Instancia privada inyectada; solo modelos/Promise en API pública; sin React/GPS/UI/métricas. |
| CRUD Walk | PASS | Create/get/list/update/delete, ausentes, duplicados e independencia de otros registros. |
| Puntos por walkId | PASS | Add/bulkAdd, consulta indexada, borrado selectivo y rollback atómico. |
| Sesión activa | PASS | Save/get/clear, reemplazo único y clear idempotente. |
| Settings | PASS | Save/get/update, preservación de campos, singleton y actualización ausente false. |
| Tests | PASS | 6 archivos y 35 pruebas en 2.81 s; 18 pruebas previas preservadas. |
| Build | PASS | 30 módulos, 350 ms, salida 0. |
| Lint | PASS | Sin errores ni advertencias. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; npm test; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; git diff --check; git status --short --branch --untracked-files=all. Entorno Node 24.21.0 y npm 11.19.0.

Sin bloqueos ni desviaciones arquitectónicas. Sin dependencias nuevas, cambios a DB/esquema/modelos, UI, rutas o documentos principales. Se retira src/data/repositories/.gitkeep porque hay implementación. README actualizado durante el cierre formal después de QA; incluye repositories, testing, tareas T00–T08 y T09 pendiente. Sin geolocalización, tracking, métricas, filtros ni recuperación funcional. Las pruebas siguen limitadas al simulador; cuotas y durabilidad Safari quedan para validaciones posteriores. T09 no ha comenzado.

La revisión independiente de Valerio aprobó los 22 criterios de T08, con 35 pruebas PASS, build, lint, TypeScript y git diff --check correctos. Sin defectos ni bloqueos. El cierre incluye una última ejecución de esas validaciones y comprobación de git status y git log -1 --oneline después del commit.


Validación final de cierre de T08: npm test -- --run PASS (35 pruebas, 6 archivos, 2.55 s); npm run build PASS (30 módulos, 309 ms); npm run lint PASS; tsc -b --force PASS; git diff --check PASS. Node 24.21.0 / npm 11.19.0. Documentos fuente intactos y T09 sin iniciar.

## Historial de T07

T07 ejecutada, aprobada por QA (Valerio: PASS — READY TO CLOSE T07) y cerrada en 36468ab (feat: complete T07 Dexie IndexedDB setup). Durante T07 se definió la base; la capa de repositorios se incorpora posteriormente en T08.

## Base local definida en T07

`src/data/db/database.ts` define la base WalkingTracker mediante Dexie `4.4.6` y la factory tipada createDatabase. Registra explícitamente versión lógica 1 con version(1).stores(...). No abre la base al importar ni instancia conexiones globales; se abre mediante database.open() cuando el consumidor autorizado lo requiera. En T07 solo las pruebas la abren, con IndexedDB simulada. Sin imports de base de datos desde React/UI.

Esquema completo v1:

```ts
{
  walks: 'id, startedAt',
  trackPoints: 'id, walkId',
  activeSession: '',
  settings: '',
}
```

- walks: clave primaria id de Walk; startedAt como único índice secundario para consultas de historial por fecha. Registros idle con startedAt=null se almacenan, pero no participan en ese índice. Sin índice de nombre porque la búsqueda textual no necesita fijar ahora una estrategia de coincidencia.
- trackPoints: clave primaria id de TrackPoint; walkId como único índice secundario para recuperar puntos de una caminata. La consulta probada puede ordenar sus resultados por timestamp sin crear un índice adicional todavía.
- activeSession: clave primaria externa fija current, exportada como ACTIVE_SESSION_KEY; valores ActiveSession de T06 sin añadir campos de almacenamiento.
- settings: clave primaria externa fija preferences, exportada como SETTINGS_KEY; valores Settings de T06. Ambas tablas singleton carecen de índices secundarios/autoincremento; put con la clave fija sustituye el registro anterior. La estrategia se expone tipada; no se crean repositories ni validadores runtime.
- Se almacenan los objetos completos, incluyendo nulls, discriminantes, métricas y metadatos; el esquema declara claves/índices, no todas las propiedades.
- Futura migración: añadir declaraciones de nuevas versiones conservando la v1; no hay versiones futuras ni funciones de upgrade todavía. src/data/migrations conserva su marcador vacío.
- Dexie denomina esta versión 1 y representa internamente la versión IndexedDB nativa como 10, conforme a su convención; no es una segunda versión de aplicación.

## Pruebas y verificación de T07

Se añadió fake-indexeddb `6.2.5` únicamente en devDependencies, porque jsdom no proporciona por sí solo el almacenamiento IndexedDB requerido por estas pruebas. Cada prueba recibe una IDBFactory en memoria distinta mediante DexieOptions; no modifica globals ni usa datos reales del navegador. afterEach elimina la base y comprueba que no quedan bases en la factory.

`tests/database.test.ts` contiene seis pruebas:

1. Apertura, versión Dexie 1, cuatro tablas, claves e índices mínimos.
2. Escritura/lectura de un objeto completo de cada tabla, incluyendo valores null.
3. Consulta por walkId con dos puntos y exclusión de otra caminata; consulta inexistente vacía.
4. Sustitución mediante claves fijas de sesión y ajustes, sin duplicados.
5. Cierre/reapertura con otra instancia, conservando datos y versión.
6. Eliminación de base, ausencia de residuos y reapertura de las cuatro tablas vacías.

| Criterio / comprobación | Resultado | Evidencia |
|---|---|---|
| Dexie, versión y tablas | PASS | Factory sin efectos de import; esquema v1 tipado con los cuatro modelos T06. |
| Índices mínimos | PASS | Solo startedAt y walkId secundarios; claves singleton externas justificadas. |
| Lectura/escritura, consulta, limpieza | PASS | Seis pruebas aisladas, sin datos reales. |
| Tests | PASS | 5 archivos y 18 pruebas aprobados en 2.57 s. |
| Build | PASS | 30 módulos, 327 ms, salida 0. |
| Lint | PASS | Sin errores ni advertencias. |
| TypeScript | PASS | tsc -b --force sin errores. |
| Dependencias | PASS | npm ls --depth=0 correcto; única dependencia nueva fake-indexeddb dev. Instalación: 1 paquete, 117 auditados, 0 vulnerabilidades reportadas. |
| Whitespace | PASS | git diff --check sin errores. |

Comandos: source ~/.nvm/nvm.sh; nvm use; npm_config_cache=/tmp/walking-tracker-npm-cache npm install -D fake-indexeddb --fetch-retries=0 --fetch-timeout=15000; npm test; npm run build; npm run lint; ./node_modules/.bin/tsc -b --force; npm ls --depth=0; git diff --check; git status --short --branch --untracked-files=all.

Hallazgos: el intento restringido de descarga falló por EAI_AGAIN; el reintento autorizado fue correcto. Sin bloqueos ni desviaciones arquitectónicas. La relación Walk/TrackPoint es lógica, no una foreign key impuesta por IndexedDB. Las pruebas simuladas no validan cuotas, políticas de Safari ni durabilidad física; eso corresponde a etapas posteriores. Sin CRUD de aplicación, repositories, tracking, métricas, recuperación o cambios de UI. Modelos T06 y documentos principales intactos. Se retira src/data/db/.gitkeep porque ahora contiene la definición. README y estado de AGENTS actualizados durante el cierre autorizado: T00–T07 completadas, base v1, tablas/índices, testing y T08 pendiente.

Valerio aprobó independientemente los 22 criterios de T07, sin defectos: esquema Dexie v1, tablas e índices mínimos, tipos T06, ausencia de T08, aislamiento/limpieza, dependencia dev justificada, coherencia del lockfile y validaciones técnicas. Ejecutó además un flujo independiente en memoria con Walk, varios TrackPoint, consulta por walkId, ActiveSession y Settings, seguido de eliminación sin residuos. El cierre incorpora una última ejecución de tests, build, lint, TypeScript forzado y git diff --check, seguida de commit autorizado y comprobación de git status y git log -1 --oneline.

## Historial de T06

T06 ejecutada, aprobada por QA (Valerio: PASS — READY TO CLOSE T06) y cerrada en 440ef8f (feat: complete T06 TypeScript domain models). Durante T06 solo se definieron tipos; la base se incorpora posteriormente en T07.

## Modelos definidos en T06

Tipos sin implementación runtime en `src/types/`, con imports/exports exclusivamente de tipos:

- `Walk`: id, nombre, timestamps de inicio/fin, duración activa/total, distancia, velocidad/ritmo promedio, elevación ganada/perdida, estado e indicador incompleto.
- `TrackPoint`: id, walkId, timestamp, coordenadas, altitud, precisión, velocidad, calidad y discriminante estimated. Datos GPS readonly para no sobrescribir valores observados al calcular/filtrar posteriormente.
- `ActiveSession`: walkId, estado active/paused/incomplete, inicio original, última transición, duración activa/total acumulada, último snapshot persistido y timestamp del último punto persistido para identificar un hueco de tracking. Sin lógica de recuperación.
- `Settings`: únicamente unitSystem (metric/imperial) y keepScreenAwake.
- `WalkStatus`: idle, active, paused, incomplete, finished.
- `ActiveSessionStatus`: subconjunto active, paused, incomplete; no representa ausencia de sesión ni sesiones finalizadas.
- `GpsQuality`: valid, low-quality, suspicious, anomalous, estimated.
- `MetricValue`: valor numérico con indicador estimated, o value=null/estimated=false cuando no está disponible.
- `UnitSystem`: metric/imperial. `index.ts` ofrece exportaciones de tipos, sin duplicar definiciones.

## Unidades y nulabilidad

- Todos los timestamps son números Unix en milisegundos. Duraciones en milisegundos, distancia/elevación en metros, velocidad en metros/segundo, ritmo en segundos/kilómetro. Settings controla futuras conversiones de presentación; no se implementan ahora.
- Walk.startedAt=null permite estado idle antes de iniciar. Walk.endedAt=null representa ausencia de finalización; no se inventan fechas.
- Métricas value=null indican datos insuficientes o cálculo no disponible; cero sigue siendo un valor conocido. Cada métrica puede marcarse estimada individualmente; no se aplica un único indicador ambiguo a todo el resumen.
- TrackPoint.altitude y speed admiten null por ausencia de dato GPS o imposibilidad de estimación. Latitud, longitud y timestamp son obligatorios para cualquier punto.
- Un punto observado exige accuracy numérica, estimated=false y calidad distinta de estimated; un punto sintético exige estimated=true/quality=estimated y puede tener accuracy=null porque no hay precisión medida. La unión impide mezclar ambos orígenes en el tipado.
- Los valores observados se conservan directamente en los campos GPS readonly. Las futuras series filtradas/interpoladas deben derivarse por separado; readonly no congela objetos en runtime ni implementa integridad de almacenamiento.
- ActiveSession.lastPersistedAt=null antes del primer guardado; lastPointTimestamp=null sin puntos persistidos. startedAt es obligatorio porque una sesión activa ya fue iniciada. stateChangedAt permite interpretar acumuladores al retomar sin implementar tiempos todavía.
- Se activa strictNullChecks en tsconfig.app.json para hacer efectiva la nulabilidad explícita. No se modifica el stack ni se añaden dependencias.

## Verificación de T06

Node.js `24.21.0` mediante NVM y npm `11.19.0`. `tests/models.test.ts` agrega cuatro grupos de comprobaciones expectTypeOf: estados/nulabilidad de Walk y métricas, discriminantes y nulabilidad de TrackPoint, estados/identificación de sesión y campos exactos de Settings. Estas aserciones validan tipos mediante TypeScript; Vitest transpila y no reemplaza la compilación.

| Criterio / comprobación | Resultado | Evidencia |
|---|---|---|
| Modelos, estados y unidades consistentes | PASS | Cuatro modelos requeridos, estados aprobados y tipos compartidos sin duplicación. |
| Nulabilidad y origen de datos | PASS | null documentado; discriminantes de TrackPoint y estimación por métrica. |
| Independencia | PASS | Interfaces/types, sin clases ni imports React, Dexie o APIs del navegador. |
| Tests | PASS | 4 archivos y 12 pruebas aprobados en 2.26 s; 8 pruebas previas preservadas. |
| Build | PASS | `npm run build`, 30 módulos, 343 ms. |
| Lint | PASS | `npm run lint`, sin errores ni advertencias. |
| TypeScript | PASS | `tsc -b --force`, sin errores, incluyendo comprobaciones expectTypeOf. |
| Whitespace | PASS | `git diff --check`, sin errores. |

Comandos: `source ~/.nvm/nvm.sh`, `nvm use`, `npm test`, `npm run build`, `npm run lint`, `./node_modules/.bin/tsc -b --force`, `git diff --check` y `git status --short --branch --untracked-files=all`.

Se retira src/types/.gitkeep porque la carpeta contiene tipos. README y estado de AGENTS actualizados durante el cierre autorizado: T00–T06 completadas, modelos/nulabilidad/testing disponibles, navegación placeholder y T07 pendiente; sin persistencia funcional. Sin cambios en UI/rutas, dominio funcional, persistencia, servicios, dependencias ni los cuatro documentos principales. Sin desviaciones arquitectónicas ni bloqueos pendientes; umbrales, algoritmos, invariantes temporales y políticas de recuperación siguen pendientes de sus tareas correspondientes.

Valerio aprobó independientemente los 21 criterios de T06, sin defectos. Revisó directamente modelos y nulabilidad, comprobó independencia, coherencia y ausencia de T07, ejecutó tests/build/lint/TypeScript y siete casos negativos y dos positivos de tipos en memoria. El cierre incluye una última ejecución de tests, build, lint, TypeScript forzado y git diff --check, seguida del commit autorizado y comprobación de git status y git log -1 --oneline.

## Historial de T05

T05 ejecutada, aprobada por QA (Valerio: `PASS — READY TO CLOSE T05`) y cerrada en `dfb2a58` (`feat: complete T05 navigation setup`). Durante T05 solo se incorporó navegación; los modelos se añaden posteriormente en T06.

## Navegación creada en T05

React Router DOM `7.18.4` integrado en modo declarativo: BrowserRouter en `src/main.tsx`, tabla de rutas y `useRoutes` en `src/app/router.tsx`, layout con NavLink y Outlet en `src/app/App.tsx`.

| Ruta | Vista | Archivo |
|---|---|---|
| `/` | Home / Inicio | `src/app/HomePage.tsx` |
| `/walk` | Active Walk / Caminata activa | `src/features/tracking/ActiveWalkPage.tsx` |
| `/history` | History / Historial | `src/features/history/HistoryPage.tsx` |
| `/walk/:walkId` | Walk Detail / Detalle de caminata | `src/features/history/WalkDetailPage.tsx` |
| `/settings` | Settings / Configuración | `src/features/settings/SettingsPage.tsx` |

- Las cinco vistas solo contienen placeholders. Detalle muestra el parámetro de URL, sin cargar datos. Historial ofrece un enlace explícito de ejemplo para verificar el detalle y este permite volver al historial.
- App reubicado de `src/App.tsx` a `src/app/App.tsx` para alinearse con la ubicación arquitectónica e integrar el layout. Se actualizaron entrada e import de la prueba; sin copias ni alias nuevos.
- CSS móvil simple: navegación de dos columnas en móvil, cuatro en pantallas mayores, enlaces principales de al menos 44 px, indicador de ruta activa y foco visible.
- Se retiraron los marcadores de `features/tracking`, `features/history` y `features/settings`, ahora con páginas. Los demás marcadores permanecen.
- `tests/App.test.tsx` conserva la comprobación de encabezado dentro de MemoryRouter. `tests/navigation.test.tsx` añade cinco casos de carga directa y un flujo de clics entre vistas, detalle, retorno al historial e inicio. La prueba sum sigue intacta.
- Sin dependencias nuevas ni cambios de lockfile/configuraciones de tooling. Sin tracking, mapas, gráficos, Dexie, IndexedDB, modelos, historial/configuración funcional ni métricas. README y el estado de AGENTS se actualizan en el cierre autorizado para reflejar T00–T05 completadas, navegación placeholder y T06 pendiente.

## Verificación de T05

Entorno: Node.js `24.21.0` mediante NVM, npm `11.19.0`.

| Criterio | Resultado | Evidencia |
|---|---|---|
| Todas las rutas cargan | PASS | Cinco casos en RTL y acceso directo en Chrome headless. |
| Navegación básica | PASS | Clics entre vistas y retorno; Chrome confirma conservación del documento SPA y botón Atrás. |
| Detalle dinámico | PASS | Identificadores walk-123, mobile-123 y example renderizados según la URL. |
| Consola | PASS | Chrome sin errores ni advertencias en las cinco rutas y navegación. |
| Layout móvil | PASS | A 320 × 740 px, sin overflow horizontal; enlaces principales de al menos 44 px en todas las vistas. |
| Tests existentes y nuevos | PASS | 3 archivos y 8 pruebas aprobados en 2.16 s. |
| Build | PASS | `npm run build`, 30 módulos, 278 ms. |
| Lint | PASS | `npm run lint` sin errores ni advertencias. |
| TypeScript | PASS | `tsc -b --force` sin errores. |
| Sin lógica funcional prematura | PASS | Solo routing, layout y placeholders; capas de dominio/datos/servicios intactas. |
| Whitespace | PASS | `git diff --check` sin errores. |

Comandos principales: `source ~/.nvm/nvm.sh`, `nvm use`, `npm test`, `npm run build`, `npm run lint`, `./node_modules/.bin/tsc -b --force`, `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`, `node /tmp/walking-tracker-t05-browser-check.mjs`, `git diff --check` y `git status --short --branch --untracked-files=all`. El script temporal de verificación utilizó Chrome headless y DevTools, sin instalar tooling ni agregar pruebas E2E al repositorio. Servidor y navegador detenidos al terminar.

Hallazgos resueltos: se eliminó una exportación innecesaria de la tabla de rutas que provocaba advertencia Fast Refresh en lint; se añadió un favicon vacío mediante data URI en index.html para evitar una petición 404. El primer script temporal de navegador tuvo un selector mal escapado, corregido sin afectar la aplicación. Vite y Chrome necesitaron permisos autorizados fuera del entorno restringido (EPERM al abrir el puerto).

Sin bloqueos ni desviaciones en nombres de rutas. La ubicación de App ahora coincide con arquitectura. BrowserRouter conserva las rutas solicitadas; el tratamiento de accesos directos y base path en GitHub Pages deberá validarse en T32, sin configurar deployment en T05. Las comprobaciones móviles son de escritorio emulado, no validación física en iPhone.

Valerio aprobó independientemente los 19 criterios de T05, sin defectos: React Router, cinco vistas, rutas, distintos identificadores dinámicos, enlaces SPA y Atrás, consola sin errores/advertencias, layout móvil, alcance, imports, pruebas, build, lint, TypeScript, diff y estado documental. El cierre incluye una última validación de tests/build/lint/TypeScript forzado y `git diff --check`, seguida del commit autorizado y comprobación de `git status` y `git log -1 --oneline`.

## Historial de T04

T04 ejecutada, aprobada por QA (Valerio: `PASS — READY TO CLOSE T04`) y cerrada en `538ad86` (`chore: complete T04 project structure`). Durante T04 únicamente se crearon carpetas; la navegación se incorpora posteriormente en T05.

## Estructura creada en T04

Se crearon las carpetas aprobadas dentro de `src/`: `app/providers`, `features/{tracking,history,settings,maps}`, `services/{geolocation,visibility,wakeLock}`, `data/{db,repositories,migrations}`, `domain/{metrics,elevation,filtering,estimation}`, `components`, `hooks`, `utils` y `types`.

- Se añadieron 19 archivos `.gitkeep`, uno por carpeta final vacía. Los padres con subcarpetas no necesitan marcadores adicionales.
- Se retiró `src/.gitkeep`, innecesario porque la raíz contiene fuentes y subcarpetas.
- Ningún archivo fue reubicado. `src/App.tsx`, `src/main.tsx` y `src/index.css` se conservaron intactos, junto con sus imports y las pruebas existentes. Sin alias nuevos ni duplicación de código.
- La estructura de carpetas coincide con la aprobada. Respecto al árbol ilustrativo de `ARCHITECTURE.md`, App sigue en la ubicación generada por Vite; moverlo no es necesario para crear las carpetas autorizadas. No se crea `app/router.tsx`, porque configurar navegación pertenece a T05.
- No se implementaron rutas, modelos, servicios, tracking, mapas, IndexedDB, gráficos ni lógica funcional. No se cambiaron dependencias ni configuraciones.
- README y AGENTS se conservaron durante la implementación de T04 y se actualizan en el cierre autorizado para reflejar T00–T04 completadas, estructura creada y T05 pendiente. README conserva stack, testing, comandos y limitaciones vigentes del MVP.

## Verificación de T04

Entorno: Node.js `24.21.0` mediante NVM, npm `11.19.0`.

| Criterio / comprobación | Resultado | Evidencia |
|---|---|---|
| Estructura coincide con arquitectura | PASS | Todas las carpetas solicitadas presentes; marcadores solo en carpetas finales vacías. |
| No existe lógica duplicada | PASS | Solo se crean marcadores; fuentes y pruebas conservadas sin copias ni lógica nueva. |
| Imports base funcionan | PASS | Tests, build y TypeScript pasan con imports existentes intactos. |
| Tests | PASS | 2 archivos y 2 pruebas aprobados en 1.86 s. |
| Build | PASS | `npm run build`, 16 módulos, build Vite en 279 ms. |
| Lint | PASS | `npm run lint`, salida 0. |
| TypeScript | PASS | `tsc -b --force` sin errores. |
| Whitespace | PASS | `git diff --check` sin errores. |

Comandos: `source ~/.nvm/nvm.sh`, `nvm use`, `npm test`, `npm run build`, `npm run lint`, `./node_modules/.bin/tsc -b --force`, `git diff --check` y `git status --short --branch --untracked-files=all`. Se verificaron además las carpetas, los marcadores y la preservación byte a byte de los archivos existentes fuera del estado/resultados y el marcador retirado.

Sin bloqueos pendientes ni cambios arquitectónicos. Cambios limitados a carpetas/marcadores y documentación de estado/resultados. T05 no ha comenzado.

Valerio aprobó independientemente los 14 criterios revisados de T04, sin defectos: estructura, compatibilidad Vite, imports, ausencia de funcionalidad prematura, uso necesario de marcadores, tests, build, lint, TypeScript, diff y estado documental. El cierre incorpora una última validación de tests/build/lint/TypeScript forzado y `git diff --check`, seguida del commit autorizado y comprobación de `git status` y `git log -1 --oneline`. No hubo reubicaciones de archivos.

## Historial de T03

T03 ejecutada, aprobada por QA (Valerio: `PASS — READY TO CLOSE T03`) y cerrada en `988e33a` (`test: complete T03 testing setup`). Durante T03 se configuró testing; la estructura de carpetas se incorpora posteriormente en T04.

## Configuración y verificación de T03

- `vitest.config.ts` extiende Vite mediante `mergeConfig`, conservando el plugin React. Usa jsdom, `tests/setup.ts` y descubrimiento de `tests/**/*.test.{ts,tsx}`.
- `tests/setup.ts` importa `@testing-library/jest-dom/vitest` y registra cleanup de RTL después de cada prueba. Las APIs de Vitest se importan explícitamente, sin globals.
- Script npm `test`: `vitest run`, ejecución única con código de salida. Scripts existentes preservados.
- `tsconfig.app.json` incluye `tests` además de `src`; `tsconfig.node.json` incluye `vitest.config.ts`. Build y compilación forzada verifican también pruebas, setup y configuración.
- `tests/sum.test.ts`: una prueba mínima de función TypeScript en entorno Node. La función sum está aislada como fixture en `tests/helpers/sum.ts`, sin lógica del producto en `src/`.
- `tests/App.test.tsx`: una prueba mínima del App existente; verifica con RTL y `toBeInTheDocument` que se renderiza el encabezado Walking Tracker en jsdom.
- Sin dependencias adicionales. Se reutilizan Vitest `5.0.3`, RTL `16.3.3`, jest-dom `7.0.1` y jsdom `30.1.2`. Lockfile intacto.

| Criterio / comprobación | Resultado | Evidencia |
|---|---|---|
| Script ejecuta pruebas | PASS | `npm test` ejecuta Vitest run y termina con salida 0. |
| Prueba mínima de componente | PASS | App renderizado con RTL en jsdom; matcher jest-dom operativo. |
| Prueba mínima de función TypeScript / dominio | PASS | Fixture sum(2, 3) devuelve 5 en Node; sin dominio funcional del producto. |
| Pruebas | PASS | 2 archivos y 2 pruebas aprobados en 1.69 s. |
| Build | PASS | `npm run build`, 16 módulos, build Vite en 238 ms. |
| Lint | PASS | `npm run lint`, salida 0. |
| TypeScript | PASS | `tsc -b --force` sin errores, incluyendo tests/setup/configuración. |
| Whitespace | PASS | `git diff --check` sin errores. |

Comandos ejecutados bajo Node `24.21.0` y npm `11.19.0`:

```sh
source ~/.nvm/nvm.sh
nvm use
./node_modules/.bin/vitest --help
npm test
npm run build
npm run lint
./node_modules/.bin/tsc -b --force
git diff --check
git status --short --branch --untracked-files=all
```

Hallazgos de T03: sin bloqueos ni desviaciones arquitectónicas. Pruebas exclusivamente del bootstrap, sin tracking, GPS, métricas o persistencia. Fuentes de aplicación, documentos principales y configuración Vite original intactos. Sin integraciones Router, Leaflet, Dexie o Chart.js ni estructura de aplicación T04.

Valerio aprobó independientemente los 18 criterios de T03, incluyendo configuración Vitest/RTL/jest-dom, jsdom, las dos pruebas mínimas, build, lint y compilación TypeScript forzada. Sin defectos identificados. El cierre incluye la última ejecución de tests, build, lint, TypeScript forzado y `git diff --check`, seguida de commit autorizado y comprobación de estado Git.

README actualizado con stack operativo, dependencias instaladas, testing disponible, comandos de desarrollo/validación, T00–T03 completadas, T04 pendiente y limitaciones del MVP. AGENTS refleja el estado actual y registra la regla permanente aprobada: actualizar README en cada cierre de tarea TXX.

## Historial de T02

T02 ejecutada, aprobada por QA (Valerio: `PASS — READY TO CLOSE T02`) y cerrada en `ae869d0` (`chore: complete T02 dependency installation`). Durante T02 solo se instalaron dependencias; la configuración de testing se incorpora en T03.

## Dependencias instaladas en T02

Entorno: Node.js `v24.21.0` mediante NVM y npm `11.19.0`.

| Dependencia nueva | Categoría | Versión instalada |
|---|---|---|
| `react-router-dom` | runtime | 7.18.4 |
| `leaflet` | runtime | 1.9.4 |
| `dexie` | runtime | 4.4.6 |
| `chart.js` | runtime | 4.5.1 |
| `vitest` | dev | 5.0.3 |
| `@testing-library/react` | dev | 16.3.3 |
| `@testing-library/jest-dom` | dev | 7.0.1 |
| `@types/leaflet` | dev | 1.9.22 |
| `jsdom` | dev | 30.1.2 |

`@types/leaflet` aporta los tipos de Leaflet. `jsdom` aporta el entorno DOM necesario para pruebas de componentes con Vitest y React Testing Library; su necesidad se justificó antes de instalarlo. Durante T02 no se configuró el entorno de testing.

`package.json` incorpora exclusivamente estas cuatro dependencias runtime y cinco dev, con rangos caret. `package-lock.json` registra sus versiones exactas, integridad y dependencias transitivas/peer resueltas por npm. No cambiaron los scripts, engines, rangos previos ni versiones resueltas del stack instalado en T01.

## Verificación de T02

- Instalación runtime: 8 paquetes añadidos, 36 auditados, 0 vulnerabilidades reportadas.
- Instalación dev: 80 paquetes añadidos, 116 auditados, 0 vulnerabilidades reportadas.
- `npm ls --depth=0`: PASS, sin dependencias inválidas o faltantes; versiones detalladas en la tabla y stack T01 preservado.
- `npm run build`: PASS, incluye `tsc -b`; Vite `8.3.2`, 16 módulos transformados, build en 265 ms.
- `npm run lint`: PASS, salida 0.
- `./node_modules/.bin/tsc -b --force`: PASS, compilación forzada sin errores.
- Comprobación de manifiesto/lockfile/paquetes instalados: PASS; solo dependencias directas autorizadas y transitivas gestionadas por npm.
- `git diff --check`: PASS, sin errores. Solo se modifican `package.json`, `package-lock.json`, este estado y la evidencia documental en `docs/TEST-RESULTS.md`.

La revisión independiente de Valerio aprobó los 16 criterios de T02: dependencias autorizadas y justificadas, coherencia del manifiesto/lockfile/instalación, árboles npm sin errores relevantes, build, lint, TypeScript forzado, ausencia de configuración o lógica prematura y estado documental correcto. No encontró defectos ni bloqueos. El cierre incluye una última validación de build, lint, TypeScript forzado y `git diff --check`, seguida de la comprobación de `git status` y `git log -1 --oneline` después del commit.

Comandos ejecutados para T02:

```sh
source /home/rodolfo/.nvm/nvm.sh
nvm use
node --version
npm --version
npm_config_cache=/tmp/walking-tracker-npm-cache npm install react-router-dom leaflet dexie chart.js --fetch-retries=0 --fetch-timeout=15000
npm_config_cache=/tmp/walking-tracker-npm-cache npm install -D vitest @testing-library/react @testing-library/jest-dom @types/leaflet jsdom --fetch-retries=0 --fetch-timeout=15000
npm ls --depth=0
npm run build
npm run lint
./node_modules/.bin/tsc -b --force
git diff --check
git status --short --branch --untracked-files=all
```

Hallazgos de T02: los intentos restringidos de instalación fallaron por DNS (`EAI_AGAIN`); los reintentos con permisos autorizados finalizaron correctamente. Sin advertencias de instalación, bloqueos pendientes ni desviaciones de arquitectura. Las dependencias quedan instaladas sin integración: no se configuran Router, Leaflet, Dexie, IndexedDB, Chart.js ni Vitest, no se crean pruebas y no se implementa lógica funcional. Fuentes, configuraciones existentes y los cuatro documentos principales permanecen intactos.

## Historial de T01

T01 ejecutada, aprobada por QA (Valerio: `PASS — READY TO CLOSE T01`) y cerrada en el commit `55a9f1b` (`chore: complete T01 React TypeScript Vite bootstrap`). React + TypeScript + Vite quedaron operativos.

## Base técnica creada en T01

- Plantilla oficial `create-vite@9.2.1`, variante `react-ts`, integrada en la raíz del repositorio mediante una carpeta temporal. Se conservaron los archivos existentes y los marcadores `src/.gitkeep` y `tests/.gitkeep`.
- React y React DOM `19.3.0`, TypeScript `6.0.3`, Vite `8.3.2`, plugin React `6.1.2`; versiones resueltas en `package-lock.json`.
- Node.js `v24.21.0` y npm `11.19.0`, activados con NVM. `.nvmrc` fija la versión disponible y `package.json` exige Node 24.
- Pantalla estática mínima con el título Walking Tracker y el texto «Base del proyecto preparada». Se omitieron el contador y los assets de demostración de la plantilla. Sin navegación, tracking, dominio ni persistencia.
- Scripts revisados: `dev` = `vite`; `build` = `tsc -b && vite build`; `lint` = `oxlint`; `preview` = `vite preview`. Oxlint y los tipos corresponden al tooling de la plantilla base.
- Durante T01 no se instalaron React Router, Leaflet, Dexie, Chart.js, Vitest ni React Testing Library. Se incorporan posteriormente en T02, según la sección vigente de este documento.

## Verificación de T01

| Criterio / comprobación | Resultado | Evidencia |
|---|---|---|
| `npm install` | PASS | 27 paquetes añadidos, 28 auditados; 0 vulnerabilidades reportadas. |
| `npm run dev` funciona | PASS | Vite listo en 279 ms, en `http://127.0.0.1:5173/`; servidor detenido al finalizar la comprobación. |
| `npm run build` termina sin errores | PASS | `tsc -b && vite build`, salida 0; 16 módulos transformados, build Vite en 291 ms. |
| TypeScript compila | PASS | `tsc -b` ejecutado correctamente como primera etapa del build. |
| Aplicación base carga en navegador | PASS | Chrome headless renderizó `<main><h1>Walking Tracker</h1><p>Base del proyecto preparada.</p></main>` dentro de `#root`. |
| Lint | PASS | `npm run lint` terminó con salida 0. |

La revisión independiente de Valerio confirmó build, compilación TypeScript forzada (`tsc -b --force`), lint, inicio del servidor Vite y renderizado en Chrome headless, además de consistencia de dependencias y preservación documental. No encontró defectos ni bloqueos. El cierre incluye una última ejecución de `npm run build` y `git diff --check`, y comprobación de `git status` y `git log -1 --oneline` después del commit.

Comandos principales ejecutados, después de cargar `/home/rodolfo/.nvm/nvm.sh` y activar Node con `nvm use 24` / `nvm use`:

```sh
node --version
npm --version
npm create vite@latest /tmp/walking-tracker-t01-scaffold -- --template react-ts --no-interactive
npm install --fetch-retries=0 --fetch-timeout=15000
npm run build
npm run lint
npm ls --depth=0
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
google-chrome --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --no-first-run --no-default-browser-check --user-data-dir=/tmp/walking-tracker-t01-chrome --virtual-time-budget=5000 --dump-dom http://127.0.0.1:5173/
git diff --check
git status --short --branch --untracked-files=all
```

Los comandos npm de descarga utilizaron `npm_config_cache=/tmp/walking-tracker-npm-cache`. El generador interpretó inicialmente la ruta temporal dentro del repositorio; se trasladó la plantilla a `/tmp` y se integraron solo los archivos necesarios, conservando README y `.gitignore` existentes.

## Historial de T00

T00 aprobada técnicamente el 2026-10-05 y cerrada mediante commit `82fec4c`. Corrección de mapas offline consolidada en `a2e2925`; sincronización del estado documental en `657058b`. QA validó la base antes de autorizar T01.

- `docs/`, `src/` y `tests/` ya existían al inicio.
- Los siete documentos de `docs/`, `README.md`, `AGENTS.md` y `.gitignore` ya existían y estaban versionados.
- Se completaron los documentos de seguimiento, README e instrucciones para agentes que estaban vacíos.
- Se amplió `.gitignore` para dependencias, builds, cachés, cobertura, logs, configuración local y archivos del editor/sistema. Las plantillas `.env.example` pueden versionarse.
- Se añadieron `src/.gitkeep` y `tests/.gitkeep` para conservar ambas carpetas en Git.
- Durante T00, los cuatro documentos principales se conservaron intactos. En la corrección documental posterior se modifican únicamente `REQUIREMENTS.md` y `DECISIONS.md`; `ARCHITECTURE.md` e `IMPLEMENTATION-PLAN.md` permanecen intactos.
- Git ya estaba inicializado en la rama `master`, con HEAD `90e71ad`. El estado inicial era limpio.
- Los cambios aprobados de T00 se incluyen en el commit de cierre. La verificación posterior al commit comprende `git status` y `git log -1 --oneline` para confirmar el repositorio limpio y el último commit.

Al cierre de T00 todavía no existían proyecto React, dependencias ni scripts. T01 crea ahora únicamente la base técnica descrita arriba; no implementa lógica funcional del producto ni configuración de pruebas de T03.

## Validación

Verificaciones documentales y del repositorio descritas en [TEST-PLAN.md](TEST-PLAN.md) y registradas en [TEST-RESULTS.md](TEST-RESULTS.md). Esos resultados corresponden a la entrega previa al commit; la aprobación técnica del usuario queda registrada aquí. No aplica ejecutar pruebas funcionales en T00.

## Hallazgos históricos de T00/T01

- Sin bloqueos pendientes para T01 ni desviaciones de arquitectura.
- El entorno restringido produjo `EAI_AGAIN` al acceder a npm, `EPERM` al abrir el puerto de Vite y un error de sockets al iniciar Chrome. Los reintentos con permisos autorizados permitieron completar las verificaciones.
- La documentación existente se conserva intacta salvo este archivo, conforme al alcance autorizado. README y AGENTS mantienen su descripción de la etapa previa a T01; el estado vigente y la evidencia de esta tarea quedan registrados aquí. Los resultados históricos de TEST-RESULTS corresponden a las etapas anteriores.
- Los cambios aprobados de T01 se incluyen en el commit de cierre autorizado. `node_modules/`, `dist/` y los archivos de caché de TypeScript están excluidos por el `.gitignore` existente.
- Sin bloqueos documentales para iniciar T01 respecto a mapas offline.
- Inconsistencia documental sobre mapas offline resuelta el 2026-10-05 por el Senior Software Architect, conforme a la decisión aprobada por el usuario.
- La decisión arquitectónica más reciente aprobada establece que el soporte offline completo queda fuera del MVP inicial y se traslada a una segunda versión.
- Se actualizaron `docs/REQUIREMENTS.md` y `docs/DECISIONS.md`, además de este estado y la evidencia en `docs/TEST-RESULTS.md`. D6 permanece como antecedente sustituido por D9, ahora vigente. El MVP solo podrá aprovechar caché ya disponible en el navegador cuando exista, sin garantía de disponibilidad del mapa y manteniendo el tracking GPS independiente de los tiles.
- `REQUIREMENTS.md`, `DECISIONS.md` y `ARCHITECTURE.md` son coherentes respecto a mapas offline. No fue necesario modificar la arquitectura; `IMPLEMENTATION-PLAN.md` tampoco se modificó. La corrección documental previa a T01 queda completada.
- Los parámetros técnicos pendientes en los documentos principales siguen sin resolverse; deberán cerrarse antes de las tareas que dependan de ellos.

## Handoff

Siguiente responsable: QA Tester / usuario para revisar T17 y autorizar su cierre.

T17 ejecutada y pendiente de revisión. Sin commit final hasta autorización del cierre. README se actualizará durante el cierre formal después de QA. T18 no ha comenzado y requiere autorización posterior. Sin cambios de requisitos, decisiones, arquitectura ni plan de implementación.
