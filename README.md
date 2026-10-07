# Walking Tracker

Proyecto de aplicación web móvil para registrar caminatas mediante GPS, orientado inicialmente a iPhone. El stack aprobado es React + TypeScript + Vite, sin backend y con almacenamiento local en el navegador.

## Estado

T00–T22 están completadas y cerradas tras aprobación y validación QA. React + TypeScript + Vite, testing y navegación SPA están operativos. Los modelos, Dexie/IndexedDB v1, repositories, servicios, métricas y estado de sesión cuentan con pruebas. Home en / y Active Walk en /walk son funcionales; Historial, Detalle y Configuración siguen siendo vistas base.

La siguiente tarea pendiente es **T23 — History View**. No ha comenzado y requiere autorización explícita. T17 conecta en memoria el estado de sesión T16, geolocalización T09, clasificación T14 y métricas T12–T15; T18 agrega la composición opcional con persistencia por bloques; T19 conecta esa composición con la UI de /walk.

Estado del repositorio tras T22: base técnica, navegación, modelos, persistencia local y repositories, servicios T09–T11, métricas T12–T15, sesión T16, orquestador T17 y persistencia por bloques T18 y Active Walk View T19 y Leaflet T20 y Chart.js T21 y Home T22; 332 pruebas en 21 archivos. QA-T18-001 quedó RESOLVED tras corrección y revalidación PASS, conservando el FAIL histórico. QA-T17-001 fue corregido y revalidado como RESOLVED, conservando el FAIL inicial en la documentación.

## Stack y dependencias instaladas

- Entorno: Node.js `24.21.0` mediante NVM y npm `11.19.0`.
- Base operativa: React / React DOM `19.3.0`, TypeScript `6.0.3` y Vite `8.3.2` con plugin React.
- Dependencias runtime: React Router DOM `7.18.4` integrado para navegación y Dexie `4.4.6` configurado para IndexedDB; Leaflet `1.9.4` integrado en /walk; Chart.js `4.5.1` integrado como perfil de elevación activo.
- Testing disponible: Vitest `5.0.3`, React Testing Library `16.3.3`, jest-dom `7.0.1`, jsdom `30.1.2` y fake-indexeddb `6.2.5` (solo dev). Las pruebas de base usan IndexedDB en memoria aislada, sin datos reales del navegador.
- Tooling: Oxlint y tipos de Node, React y Leaflet. Versiones exactas y transitivas registradas en `package-lock.json`.

## Estructura actual

- `docs/`: requisitos, decisiones, arquitectura, plan de implementación, estado y evidencias de validación.
- `src/`: estructura aprobada, router/layout compartido, vista de caminata activa y otras páginas base, entrada React y CSS móvil simple.
- `src/types/`: modelos y estados sin implementación runtime, independientes de React y persistencia.
- `src/data/db/`: factory Dexie y esquema v1, sin apertura automática ni conexión desde React.
- `src/data/repositories/`: acceso a caminatas, puntos, sesión activa y ajustes mediante APIs independientes de React.
- `src/services/geolocation/`: observación de posiciones y errores, con inicio/detención; T19 lo consume a través del runtime.
- `src/services/visibility/`: lectura de visibilidad, suscripción a cambios y cleanup independiente.
- `src/services/wakeLock/`: soporte, solicitud/liberación de bloqueo de pantalla, estado y notificaciones de release.
- `src/domain/metrics/`: distancia, tiempo total/activo, velocidad/ritmo promedio y conversiones mediante funciones puras.
- `src/domain/filtering/gpsQuality.ts`: clasificación GPS y señales de anomalía, con umbrales configurables.
- `src/domain/elevation/elevation.ts`: preparación, suavizado, interpolación, ganancia/pérdida y perfil distancia-altitud.
- `src/features/tracking/session.ts`: estado local y transiciones puras de caminata, con pausas e incompletitud.
- `src/features/tracking/trackingController.ts`: orquestador independiente de React, con GPS y métricas en memoria.
- `src/features/tracking/persistenceCoordinator.ts`: buffer, triggers y coordinación de escrituras.
- `src/features/tracking/persistentTrackingController.ts`: composición de T17 con persistencia, sin UI.
- `src/data/repositories/trackingPersistenceStore.ts`: transacción de Walk, puntos y sesión mediante repositories.
- `src/features/tracking/activeWalkRuntime.ts`: composición T16–T18 y ciclo de vida de la sesión en memoria.
- `src/features/tracking/useActiveWalk.ts`: polling de snapshot y cleanup de UI.
- `src/features/tracking/useWalkStatus.ts`: lectura del runtime para Home, sin acciones de tracking.
- `src/features/tracking/ActiveWalkPage.tsx`: estado, controles, métricas y errores en /walk.
- `src/features/maps/`: ActiveWalkMap, adaptación de snapshot y configuración raster.
- `src/features/tracking/ElevationProfile.tsx`: gráfico responsive con Chart.js, actualización y destroy.
- `src/features/tracking/elevationProfileData.ts`: snapshot/T15 → datasets distancia-altitud segmentados.
- `tests/`: setup jest-dom/cleanup RTL, bootstrap, navegación, comprobaciones de tipos y pruebas de base local, repositories, geolocalización, visibilidad y Wake Lock con mocks, y cálculos de distancia, tiempo, promedios, conversiones, calidad GPS, elevación y estado de sesión.
- `vite.config.ts` y `vitest.config.ts`: configuración de desarrollo/build y testing.
- `tsconfig*.json`: compilación de aplicación, pruebas y configuraciones.
- `AGENTS.md`: instrucciones de trabajo para agentes.
- `.gitignore`: exclusiones de dependencias, builds, cachés y configuración local.

```text
src/
├── app/
│   ├── App.tsx
│   ├── HomePage.tsx
│   ├── router.tsx
│   └── providers/
├── features/
│   ├── tracking/
│   │   ├── ActiveWalkPage.tsx
│   │   ├── session.ts
│   │   ├── trackingController.ts
│   │   ├── persistenceCoordinator.ts
│   │   ├── persistentTrackingController.ts
│   │   ├── activeWalkRuntime.ts
│   │   ├── useWalkStatus.ts
│   │   ├── useActiveWalk.ts
│   │   ├── ElevationProfile.tsx
│   │   └── elevationProfileData.ts
│   ├── history/
│   │   ├── HistoryPage.tsx
│   │   └── WalkDetailPage.tsx
│   ├── settings/SettingsPage.tsx
│   └── maps/
│       ├── ActiveWalkMap.tsx
│       ├── mapData.ts
│       └── mapConfig.ts
├── services/
│   ├── geolocation/
│   │   ├── geolocationService.ts
│   │   └── types.ts
│   ├── visibility/visibilityService.ts
│   └── wakeLock/wakeLockService.ts
├── data/
│   ├── db/database.ts
│   ├── repositories/
│   │   ├── WalkRepository.ts
│   │   ├── TrackPointRepository.ts
│   │   ├── ActiveSessionRepository.ts
│   │   ├── SettingsRepository.ts
│   │   ├── trackingPersistenceStore.ts
│   │   └── index.ts
│   └── migrations/
├── domain/
│   ├── metrics/
│   │   ├── distance.ts
│   │   ├── time.ts
│   │   ├── averages.ts
│   │   └── conversions.ts
│   ├── elevation/elevation.ts
│   ├── filtering/gpsQuality.ts
│   └── estimation/
├── components/
├── hooks/
├── utils/
├── types/
│   ├── activeSession.ts
│   ├── index.ts
│   ├── metricValue.ts
│   ├── settings.ts
│   ├── states.ts
│   ├── trackPoint.ts
│   └── walk.ts
├── main.tsx
└── index.css
```

Las 6 carpetas finales todavía vacías contienen `.gitkeep`; la capa de datos, los tres servicios del navegador y el módulo de distancia ya contienen implementación. Recuperación interactiva, estimación de tracking, integraciones y migraciones futuras siguen pendientes.

## Persistencia local configurada

La factory createDatabase define WalkingTracker mediante Dexie, reutilizando Walk, TrackPoint, ActiveSession y Settings. No abre conexiones al importar; T19 la consume mediante el runtime persistente y repositories.

Esquema versión 1:

| Tabla | Clave primaria | Índices secundarios |
|---|---|---|
| walks | id | startedAt |
| trackPoints | id | walkId |
| activeSession | Externa fija: current | Ninguno |
| settings | Externa fija: preferences | Ninguno |

startedAt permite consultas por fecha y walkId recupera puntos de una caminata. Las claves externas de sesión/ajustes evitan añadir campos a los modelos. Los registros se almacenan completos. Dexie usa versión lógica 1 y versión nativa IndexedDB 10 según su convención; no hay migraciones futuras todavía.

Las seis pruebas de base validan apertura/esquema, lectura/escritura de las cuatro tablas, consulta por walkId, sustitución con claves fijas, reapertura y limpieza sin residuos. La capa de repositories ofrece operaciones básicas probadas, sin recuperación interactiva; T18 incorpora guardado incremental y T19 lo utiliza a través del runtime, sin acceso directo desde React.

Repositories disponibles:

| Repository | Propósito y operaciones |
|---|---|
| WalkRepository | Crear, obtener por ID, listar, actualizar y eliminar caminatas. |
| TrackPointRepository | Agregar puntos individualmente o en bloque, consultar y eliminar por walkId. |
| ActiveSessionRepository | Guardar/reemplazar, leer y limpiar la sesión activa. |
| SettingsRepository | Guardar/reemplazar, leer y actualizar los ajustes aprobados. |

Reutilizan la base y los modelos existentes mediante una instancia privada inyectada. getByWalkId aprovecha el índice walkId y ordena por timestamp; bulkAdd revierte el bloque completo si falla. Sesión y ajustes utilizan claves fijas. Eliminar una caminata no elimina sus puntos automáticamente; las políticas de borrado coordinado se implementarán en tareas posteriores.

## Servicio de geolocalización disponible

createGeolocationService encapsula navigator.geolocation.watchPosition y clearWatch. Expone start({ onPosition, onError }, options?) y stop(); admite un adaptador inyectado para pruebas. Evita watchers duplicados por instancia, permite reiniciar y ofrece cleanup idempotente. El consumidor futuro deberá reutilizar una instancia; se ignoran callbacks tardíos de observaciones detenidas.

RawPosition conserva latitude, longitude, altitude, accuracy, speed y timestamp, incluidos nulls en altitud/velocidad y valores cero. No asigna walkId, identidad, calidad definitiva ni estimaciones. Los errores se normalizan como permission-denied, position-unavailable y timeout; también contempla unknown y unsupported, sin mensajes de UI.

Opciones centralizadas y configurables: enableHighAccuracy true, maximumAge 0 ms y timeout omitido para conservar el valor nativo. Son valores iniciales ajustables, sin fijar umbrales de calidad o anomalías. T17 integra el servicio con sesión y métricas en memoria; T18 conecta persistencia mediante la composición opcional; T19 conecta la UI mediante runtime; Wake Lock sigue sin integración funcional. Permisos, precisión y consumo en iPhone siguen pendientes de validación real.

## Servicio de Page Visibility disponible

createVisibilityService encapsula document.visibilityState y visibilitychange. Expone getCurrentState() y subscribe(callback), que devuelve el cleanup de la suscripción. Informa visible, hidden o unknown para estados no reconocidos; no registra listeners al construir ni emite automáticamente el estado inicial.

Cada suscripción tiene un listener independiente. Su cleanup elimina exactamente ese listener, es idempotente y no afecta otras suscripciones, incluso si comparten callback. El consumidor debe ejecutar cada cleanup. Las pruebas verifican cambios de estado, cancelación selectiva y ausencia de callbacks tras cancelar.

Todavía no existe integración funcional entre visibility, tracking y persistencia: no se hace flush de datos, no se muestran advertencias ni se identifican huecos de tracking. Esas acciones corresponden a tareas posteriores.

## Servicio de Wake Lock disponible

createWakeLockService encapsula navigator.wakeLock.request('screen'), Sentinel.release y el evento release. Expone isSupported(), isActive(), request(), release(), subscribeRelease(callback) y cleanup(). No solicita un lock al importar o construir.

Las operaciones se serializan por instancia para evitar locks duplicados. La liberación automática actualiza el estado y permite solicitar uno nuevo; no hay recuperación automática. Las liberaciones retiran el listener del sentinel. Cleanup cancela suscripciones y libera incluso un lock cuya solicitud estuviera pendiente; es repetible.

La ausencia de API y los fallos devuelven WakeLockResult con error normalizado, sin mensajes de UI. Si falla release, se conserva la referencia para permitir reintentar; el consumidor debe revisar el resultado. Soporte y políticas en iPhone siguen pendientes de validación real.

Geolocalización está integrada en el flujo activo mediante T17–T19. Page Visibility y Wake Lock siguen pendientes de integración funcional. Wake Lock no lee Settings ni está conectado a Active Walk; tampoco implementa comportamiento ante cambios de visibilidad.

## Cálculo de distancia implementado

src/domain/metrics/distance.ts expone calculateDistanceMeters(from, to) y calculateAccumulatedDistanceMeters(points). Son funciones puras, independientes de React, persistencia y APIs del navegador; no modifican ni ordenan los puntos originales.

Usan Haversine sobre una esfera de radio medio 6 371 000 m y devuelven metros. La distancia entre coordenadas inválidas devuelve null; la acumulación vacía o sin segmentos elegibles devuelve 0. Es distancia horizontal, sin elevación ni corrección elipsoidal.

La acumulación acepta puntos medidos valid y suspicious con coordenadas seguras. Excluye anomalous, low-quality pendiente de evaluación y estimated. Los puntos excluidos cortan el segmento, sin conectar a través del hueco ni mezclar walkId distintos. El resultado es un subtotal medido; la estimación de huecos queda para tareas posteriores.

Las pruebas cubren referencias geográficas aproximadas, acumulación, exclusiones, repetidos, coordenadas negativas, antimeridiano, estabilidad numérica y entradas congeladas. Los promedios y helpers de conversión se incorporan en T13, sin integración con UI.

## Tiempo, velocidad, ritmo y conversiones implementados

Las funciones de time.ts calculan tiempo total y activo en milisegundos. El total incluye pausas; el activo excluye la unión de sus intervalos, recortados al periodo evaluado. Pausas abiertas se evalúan hasta el instante final recibido; solapamientos no se descuentan dos veces. No hay reloj implícito ni mutación de entradas.

averages.ts calcula velocidad promedio en m/s como distancia en metros / segundos activos, y ritmo promedio en segundos/km como segundos activos / kilómetros. Ambas funciones reciben tiempo activo, no tiempo total.

conversions.ts ofrece metros→kilómetros/millas, m/s→km/h/mph y segundos/km→min/km/min/milla, utilizando la milla internacional de 1609.344 m. No agrega selección de unidades ni formato UI.

Los datos inválidos o métricas no calculables devuelven null, incluidos NaN, Infinity, negativos, divisores cero y desbordamientos. Distancia cero con tiempo activo positivo da velocidad cero; ritmo sin distancia da null. Duraciones cero válidas se conservan. Velocidad/ritmo actuales siguen pendientes; T17 integra los promedios en memoria.

## Clasificación GPS y anomalías implementadas

src/domain/filtering/gpsQuality.ts expone evaluateAccuracy, classifyTrackPoint y classifyTrackPoints. Entrega la clasificación y señales por separado del punto original; conserva todas las entradas y su orden, sin modificar coordenadas ni otros datos crudos. Reutiliza Haversine de T12.

Combina accuracy, velocidad aparente, salto espacial y coherencia temporal. TrackPoint.speed es complementaria cuando está disponible. Accuracy pobre sola produce low-quality; irregularidad aislada produce suspicious; anomalous exige evidencias múltiples y corroboración espacial/temporal. valid representa ausencia de irregularidades; estimated se conserva únicamente para puntos ya estimados.

DEFAULT_GPS_QUALITY_CONFIG centraliza parámetros iniciales ajustables: accuracy 25 m, velocidad 5 m/s, salto 100 m dentro de 30 s, intervalo mínimo 1 s y al menos dos evidencias para anomalía. Timestamps iguales/invertidos se diagnostican sin dividir; no finitos y speed inválida se manejan sin inventar valores derivados. Los umbrales requieren calibración real y salto/velocidad pueden estar correlacionados.

T17 integra la clasificación GPS en el controlador en memoria; no define filtrado definitivo de rutas, persistencia o UI. El procesamiento de altitud se incorpora en T15 sin modificar las clasificaciones GPS.

## Procesamiento de altitud implementado

src/domain/elevation/elevation.ts expone prepareElevationSeries, interpolateElevationGaps, smoothElevationSeries, calculateElevationChange y buildElevationProfile. Son funciones puras que generan una serie derivada en metros, sin modificar los TrackPoints ni sus clasificaciones GPS.

El suavizado usa una banda muerta de 3 m respecto al último valor aceptado. Picos aislados de al menos 30 m se excluyen cuando dos vecinos corroboran el salto. La interpolación lineal se limita a huecos entre referencias próximas: hasta 5 faltantes, 100 m y 60 s. No extrapola extremos ni cruza puntos excluidos; las interpolaciones se marcan estimated.

Altitudes finitas de puntos valid/suspicious participan. low-quality, anomalous y estimated de entrada quedan excluidos según la política documentada. Ganancia/pérdida suman deltas positivos/negativos de la serie procesada, sin conectar a través de huecos. Los resultados son subtotales de tramos disponibles y pueden contener estimaciones identificadas.

El perfil distancia-altitud reutiliza distancia T12 e incluye pointId, walkId, timestamp, distanceMeters, altitudeMeters, source, estimated y smoothed. T21 utiliza este perfil procesado en Chart.js. Los parámetros están centralizados y requieren calibración real; el detector puede confundir un pico real aislado.

T17 integra estos módulos en memoria y T18 persiste incrementalmente sus snapshots; T19 muestra métricas y controles en /walk.

## Estado de sesión implementado

src/features/tracking/session.ts expone createWalkSession, canTransition, transitionSession, generateWalkName y toActiveSessionSnapshot. WalkSession representa idle, active, paused, incomplete y finished con identidad, nombre, inicio/fin, pausas, interrupciones y tiempos derivados.

Las transiciones son puras y reciben timestamps explícitos. Pausar abre un intervalo; reanudar o finalizar desde pausa lo cierra una sola vez. Tiempo total incluye pausas y tiempo activo las excluye mediante T13. Acciones inválidas, repetidas o timestamps regresivos devuelven errores discriminados sin modificar el estado previo. El nombre automático respeta el formato aprobado con UTC explícito.

Incomplete conserva identidad e inicio original, registra la interrupción y permite continuar o finalizar manteniendo isIncomplete. Una interrupción desde active sigue contando como tiempo activo, identificada por separado; desde paused mantiene la pausa abierta. Eso no implica GPS observado ni distancia medida.

El snapshot es compatible con ActiveSessionRepository sin efectuar escrituras. El contrato base no serializa el historial completo de pausas/interrupciones; T18 lo conserva en un snapshot extendido para la futura reconstrucción T26. T17 conecta sesión, GPS y métricas en memoria; T18 incorpora persistencia por bloques. T16 por sí sola no inicia geolocalización ni tracking real.

## Orquestador de tracking implementado — T17

createTrackingController({ geolocation?, now? }) ofrece start, pause, resume, refresh, finish, cancel, stop/cleanup y getSnapshot. Puede iniciar una caminata, recibir GPS mediante T09, clasificar puntos con T14, preservar raw GPS y calcular métricas T12–T15 en memoria. Controla un único watcher por instancia y rechaza doble start.

Durante pausa conserva la observación GPS y los puntos raw, pero excluye esos puntos de ruta y métricas activas. Resume abre un segmento nuevo sin duplicar watcher ni unir desplazamientos de pausa. Anomalous se conserva raw y se excluye de distancia/elevación. Los promedios usan tiempo activo y los errores GPS normalizados son observables en el snapshot.

Finish libera el watcher; cleanup es idempotente e intenta liberar recursos incluso cuando la transición de dominio devuelve regressive-time o invalid-timestamp. El error permanece observable y el estado temporal previo se conserva, con watcher inactivo después de una liberación exitosa. QA-T17-001 quedó RESOLVED tras segunda validación PASS; una falla nativa de detención sigue devolviendo geolocation-stop-failed explícitamente.

El controlador no persiste, no usa React ni modifica UI. T18 agrega persistencia por bloques mediante composición separada. T19 aporta la UI activa; T21 aporta el perfil Chart.js; no hay recuperación interactiva ni integración funcional con Page Visibility/Wake Lock. Consultar el snapshot no avanza el reloj; se utiliza refresh explícito.

## Persistencia por bloques implementada — T18

createPersistenceCoordinator y createPersistentTrackingController conectan opcionalmente T17 con los repositories. El buffer guarda raw GPS, incluidos puntos anómalos y pausados; clasificación y segmento se conservan por separado en el snapshot extendido de ActiveSession.

DEFAULT_PERSISTENCE_LIMITS define **50 puntos OR 30 segundos**, lo que ocurra primero. El plazo usa pendingSince, la hora local de recepción del primer punto pendiente: escrituras de estado no lo reinician. La frontera es inclusiva (elapsed >= 30000 ms). Se evalúa al recibir snapshots o mediante tick/checkFlush; cuando no llegan posiciones, el consumidor debe llamar tick periódicamente. forceFlush persiste pendientes bajo umbral.

Una cola serial y una promesa de flush compartida evitan escrituras conflictivas. Cada bloque se retira únicamente tras éxito; los puntos recibidos durante escritura conservan su propia ventana. La transacción usa TrackPointRepository.bulkAdd, WalkRepository y ActiveSessionRepository; un fallo revierte todas las escrituras, conserva el buffer y expone error para retry.

Al finalizar, se detiene GPS, se espera el bloque en curso y se fuerza el restante. Walk recibe las métricas finales y activeSession se elimina únicamente con la transacción final exitosa. Ante fallo quedan buffer y recovery state; se puede repetir finish. Cancel conserva datos incompletos y no borra registros. Cada caminata requiere una composición/coordinador nuevos.

ActiveSession extendida conserva pausas, interrupciones y metadatos de puntos persistidos para recuperación futura. Los resúmenes de estado pueden incluir métricas de puntos pendientes; T26 deberá reconciliar desde registros confirmados. La recuperación interactiva Continue/Save/Discard aún no existe. Tampoco están integrados Page Visibility T27 ni Wake Lock T28 al flujo activo. T21 muestra el perfil Chart.js. T20 integra Leaflet usando snapshots. T19 conecta los controles y métricas con el runtime persistente. QA-T18-001 quedó RESOLVED tras la segunda validación de Valerio; se preserva el fallo histórico en TEST-RESULTS.

## Active Walk View implementada — T19

En **/walk** el usuario puede iniciar, pausar, reanudar y finalizar una caminata, visualizar métricas y estado/calidad GPS, y recibir errores de tracking o persistencia. ActiveWalkPage usa useActiveWalk y activeWalkRuntime para consumir T16–T18; React no accede a Geolocation/Dexie/repositories ni recalcula métricas.

Muestra tiempo activo/total, distancia en km, velocidad promedio en km/h, ritmo en min/km, elevación ganada/perdida en metros e indicadores de estimación. Unidades métricas fijas: Settings aún no integrado. Los estados son inicial, activa, pausada, incompleta, finalizando, finalización pendiente de guardado y finalizada. Los errores GPS/persistencia/dominio se presentan sin textos técnicos crudos.

Finish requiere confirmación; cancelarla conserva tracking. La acción confirmada usa flush/transacción final T18; solo muestra éxito tras persistencia confirmada. Ante fallo permite reintentar y conserva recovery state. El snapshot se actualiza cada segundo; desmontar elimina el timer de UI y mantiene el runtime por pestaña, sin duplicar watchers al volver. No recupera la sesión tras recargar.

QA aprobó T19 con 294 pruebas y verificación en Chrome real con GPS simulado, viewport390x844, flujo completo, errores y remontaje. T20 integra el mapa; T21 integra el perfil Chart.js. Permanecen pendientes recuperación interactiva (T26), Page Visibility (T27) y Wake Lock (T28); la siguiente tarea es T23.

## Mapa Leaflet integrado — T20

/walk muestra posición actual y ruta recorrida mediante ActiveWalkMap. Consume snapshots T17 y separa los segmentos activos: puntos de pausa no extienden ruta y Resume no crea una línea falsa a través del desplazamiento pausado. Anomalous y otros puntos no aptos quedan excluidos sin modificar raw GPS ni clasificar nuevamente.

Reutiliza CircleMarker y polyline; antes del primer punto muestra vista inicial y al recibirlo centra. Follow hace pan ante nuevas posiciones activas; interacción manual lo suspende y Centrar y seguir posición lo reactiva. Pan/zoom están disponibles. Finish conserva posición/ruta y ajusta bounds, también seguro con cero o un punto. La instancia se limpia al desmontar y no se recrea en cada snapshot.

Tiles raster OpenStreetMap con atribución/configuración centralizada. Si no cargan, aparece un aviso y tracking, persistencia y controles continúan. No hay descarga manual ni offline completo. Leaflet y su CSS se cargan por separado con lazy/Suspense para reducir el bundle inicial.

El usuario puede iniciar/pausar/reanudar/finalizar, ver métricas, posición, ruta y estado GPS, y mover/ampliar el mapa. QA aprobó T20 y regresión T19 con 308 pruebas; Chrome390x844 con GPS/tiles simulados confirmó pausa/resume, anomalía excluida, pan/zoom y finalización. Tiles reales de Internet, GPS real/iPhone y rendimiento de caminatas largas siguen pendientes de validación.

Siguientes tareas pendientes: T23 History; T24 Walk Detail; T25 Settings; T26 Recovery; T27 Page Visibility; T28 Wake Lock. No se han iniciado en esta entrega.

## Perfil de elevación integrado — T21

/walk muestra el perfil de elevación con Chart.js a partir del snapshot T17 y buildElevationProfile T15. Eje X: distancia acumulada en kilómetros; eje Y: altitud procesada en metros. Cada segmento activo es un dataset separado, sin unir pausas ni huecos de altitud. Estimaciones T15 identificadas con triángulos, texto y tooltip; anomalías no se muestran como altitud válida.

Con menos de dos altitudes procesadas disponibles muestra estado vacío. Al llegar puntos actualiza datasets sin recrear la instancia, con animación desactivada. Pause conserva el perfil, Resume continúa con otro segmento y Finish mantiene perfil, mapa y métricas. Destroy al desmontar retira la instancia/listeners; T19/T20 siguen operativos.

El usuario puede iniciar/pausar/reanudar/finalizar, ver métricas, mapa/ruta/posición actual y perfil distancia-altitud, conservando mapa/perfil después de Finish. Unidades métricas fijas; Settings aún no integrado. La recuperación interactiva T26, Page Visibility T27 y Wake Lock T28 siguen pendientes, junto a History T23, Walk Detail T24 y Settings T25.

QA aprobó T21 con 322 pruebas y Chrome390x844 con GPS/tiles simulados: actualización estable, pico vertical3000 excluido por T15, pausa/resume, interpolación marcada, dos desmontajes/remontajes y perfil final. GPS real/iPhone y rendimiento de caminatas largas todavía pendientes.

## Home integrada — T22

La entrada / muestra Inicio y el estado del runtime compartido mediante useWalkStatus/getView. Sin sesión activa indica Listo para caminar (Ready) y ofrece Iniciar caminata, que navega a /walk; el inicio real y la solicitud GPS ocurren allí. Ver historial y Abrir configuración conducen a /history y /settings mediante React Router.

Con sesión active/paused muestra el estado textual, oculta un segundo Start y ofrece Abrir caminata (Open Walk). Navegar /walk → / → /walk conserva sesión, métricas y un único watcher. Finished vuelve a habilitar Start tras guardado exitoso; un guardado pendiente mantiene acceso para reintentar. Solo observa estado en memoria, sin recuperación tras recarga. Home no accede directamente a Geolocation, Dexie ni repositories, no calcula métricas y su cleanup elimina únicamente el temporizador de lectura.

El usuario puede entrar desde Home, iniciar en Active Walk, volver a una sesión activa/pausada y consultar métricas, mapa/ruta/posición y perfil de elevación. QA aprobó T22 con 332 pruebas en 21 archivos, regresión T19–T21 y Chrome con GPS/tiles simulados en móvil/desktop.

Siguiente tarea: **T23 — History View**, todavía no iniciada. History T23 no es funcional; Walk Detail T24, Settings T25, Recovery T26, Page Visibility T27 y Wake Lock T28 están pendientes. GPS real/iPhone y caminatas prolongadas siguen pendientes de validación.

## Modelos TypeScript definidos

- `Walk`: identificación, nombre, inicio/fin, duración activa/total, distancia, velocidad/ritmo promedio, elevación, estado e indicador de caminata incompleta.
- `TrackPoint`: identificación y walkId, timestamp, coordenadas, altitud, precisión, velocidad, calidad y discriminante de punto observado/estimado; datos GPS readonly.
- `ActiveSession`: caminata, estado, inicio original, transición, duraciones acumuladas y referencias al último snapshot/punto persistido. Declara datos de recuperación sin implementarla.
- `Settings`: únicamente unidades metric/imperial y preferencia de mantener pantalla encendida.
- `WalkStatus`: idle, active, paused, incomplete, finished. `GpsQuality`: valid, low-quality, suspicious, anomalous, estimated. Tipos compartidos: ActiveSessionStatus, UnitSystem y MetricValue.

Timestamps/duraciones en milisegundos, distancias/elevación en metros, velocidad en m/s y ritmo en segundos/km. Altitud y velocidad GPS admiten null; inicio/fin y referencias de persistencia también cuando no existen. MetricValue distingue valor no disponible de cero e identifica estimación por métrica. strictNullChecks está activo. Los tipos no ejecutan cálculos ni validaciones runtime.

## Navegación disponible

React Router utiliza BrowserRouter, rutas anidadas y un layout compartido con navegación principal. En móvil, los enlaces se muestran en dos columnas, con ruta activa y foco visible.

| Ruta | Vista |
|---|---|
| `/` | Home / Inicio |
| `/walk` | Active Walk / Caminata activa |
| `/history` | History / Historial |
| `/walk/:walkId` | Walk Detail / Detalle de caminata |
| `/settings` | Settings / Configuración |

Historial ofrece un enlace de ejemplo a `/walk/example`; el detalle muestra el identificador de URL y permite volver al historial. Esto valida navegación, sin consultar ni guardar caminatas.

## Documentación

- [Requisitos](docs/REQUIREMENTS.md)
- [Decisiones](docs/DECISIONS.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Plan de implementación](docs/IMPLEMENTATION-PLAN.md)
- [Estado actual](docs/CURRENT_STATE.md)
- [Plan de validación](docs/TEST-PLAN.md)
- [Resultados de validación](docs/TEST-RESULTS.md)

## Desarrollo

Desde la raíz del repositorio, con NVM instalado:

```sh
source ~/.nvm/nvm.sh
nvm use
npm ci
npm run dev
```

Verificaciones disponibles:

```sh
npm test
npm run build
npm run lint
./node_modules/.bin/tsc -b --force
```

`npm test` ejecuta 322 pruebas/comprobaciones en veinte archivos: bootstrap, navegación, modelos, base local, repositories, geolocalización, visibilidad, Wake Lock, distancia, tiempo/promedios, conversiones, calidad GPS, elevación, estado de sesión y orquestador, persistencia por bloques Active Walk View, Leaflet y perfil Chart.js (incluidas QA-T17-001 y QA-T18-001); para modo watch puede utilizarse `npm test -- --watch`. Las cuatro comprobaciones expectTypeOf se validan mediante compilación TypeScript, no por la ejecución Vitest aislada. `npm run build` comprueba TypeScript y genera `dist/`. `npm run preview` sirve el build localmente.

## Limitaciones vigentes

- /walk es funcional; las demás páginas siguen siendo vistas base. La base local y los repositories están definidos y probados, sin acceso directo desde componentes; la UI activa los utiliza mediante T18 y su runtime. El servicio de geolocalización está probado con mocks, con flujo de caminata en memoria mediante T17 y persistencia T18 y UI activa T19.
- Las pruebas con fake-indexeddb no validan cuotas, políticas de Safari ni durabilidad física. Las claves fijas son una convención tipada; IndexedDB no impone por sí solo singletons ni claves foráneas.
- readonly no congela objetos en runtime; validaciones de dominio adicionales, filtrado definitivo de rutas, estimación de tracking y recuperación siguen pendientes de implementación.
- Navegación y layout móvil validados en Chrome emulado a 320 px. El soporte de accesos directos y base path en GitHub Pages se validará en T32; el despliegue aún no está configurado.
- El tracking confiable del MVP requerirá página visible y activa; no se garantiza con pantalla bloqueada ni navegador en segundo plano.
- El acceso a ubicación requerirá HTTPS y permiso del usuario.
- Sin Internet, el MVP solo podrá aprovechar caché de tiles ya disponible, sin garantía del fondo cartográfico; el tracking deberá ser independiente del mapa. El soporte offline completo, descargas controladas, Service Worker, PWA y gestión de regiones quedan para una segunda versión.
- MVP sin backend, autenticación ni sincronización en la nube; datos locales al navegador. Pruebas reales en iPhone necesarias para validar el futuro tracking.
