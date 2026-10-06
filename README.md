# Walking Tracker

Proyecto de aplicación web móvil para registrar caminatas mediante GPS, orientado inicialmente a iPhone. El stack aprobado es React + TypeScript + Vite, sin backend y con almacenamiento local en el navegador.

## Estado

T00–T12 están completadas y cerradas tras aprobación y validación QA. React + TypeScript + Vite, la estructura, el testing y la navegación SPA están operativos; los modelos TypeScript y la base Dexie sobre IndexedDB versión 1 están definidos. Las cinco vistas contienen únicamente estructura y placeholders, sin lógica funcional de caminatas.

La siguiente tarea pendiente es **T13 — Tiempo, velocidad y ritmo**. No ha comenzado y requiere autorización del usuario. La persistencia local cuenta con cuatro repositories probados que encapsulan Dexie/IndexedDB. Los servicios de geolocalización, Page Visibility y Wake Lock están disponibles y probados con mocks; todavía no existe tracking funcional integrado con UI/persistencia. El cálculo puro de distancia está implementado. Velocidad, ritmo y conversiones de presentación todavía no están implementados; mapas, gráficos e historial/configuración funcional siguen pendientes.

Estado del repositorio tras T12: router/layout, cinco páginas base, tipos independientes, base local versión 1, cuatro repositories, servicios de geolocalización, visibilidad y Wake Lock más cálculo de distancia y 102 pruebas/comprobaciones. Las capas funcionales pendientes permanecen reservadas mediante `.gitkeep`.

## Stack y dependencias instaladas

- Entorno: Node.js `24.21.0` mediante NVM y npm `11.19.0`.
- Base operativa: React / React DOM `19.3.0`, TypeScript `6.0.3` y Vite `8.3.2` con plugin React.
- Dependencias runtime: React Router DOM `7.18.4` integrado para navegación y Dexie `4.4.6` configurado para IndexedDB; Leaflet `1.9.4` y Chart.js `4.5.1` instalados, sin integración funcional todavía.
- Testing disponible: Vitest `5.0.3`, React Testing Library `16.3.3`, jest-dom `7.0.1`, jsdom `30.1.2` y fake-indexeddb `6.2.5` (solo dev). Las pruebas de base usan IndexedDB en memoria aislada, sin datos reales del navegador.
- Tooling: Oxlint y tipos de Node, React y Leaflet. Versiones exactas y transitivas registradas en `package-lock.json`.

## Estructura actual

- `docs/`: requisitos, decisiones, arquitectura, plan de implementación, estado y evidencias de validación.
- `src/`: estructura aprobada, router/layout compartido, páginas placeholder, entrada React y CSS móvil simple.
- `src/types/`: modelos y estados sin implementación runtime, independientes de React y persistencia.
- `src/data/db/`: factory Dexie y esquema v1, sin apertura automática ni conexión desde React.
- `src/data/repositories/`: acceso a caminatas, puntos, sesión activa y ajustes mediante APIs independientes de React.
- `src/services/geolocation/`: observación de posiciones y errores, con inicio/detención y sin integración UI.
- `src/services/visibility/`: lectura de visibilidad, suscripción a cambios y cleanup independiente.
- `src/services/wakeLock/`: soporte, solicitud/liberación de bloqueo de pantalla, estado y notificaciones de release.
- `src/domain/metrics/distance.ts`: distancia entre coordenadas y acumulación medida mediante funciones puras.
- `tests/`: setup jest-dom/cleanup RTL, bootstrap, navegación, comprobaciones de tipos y pruebas de base local, repositories, geolocalización, visibilidad y Wake Lock con mocks, y cálculo de distancia.
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
│   ├── tracking/ActiveWalkPage.tsx
│   ├── history/
│   │   ├── HistoryPage.tsx
│   │   └── WalkDetailPage.tsx
│   ├── settings/SettingsPage.tsx
│   └── maps/
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
│   │   └── index.ts
│   └── migrations/
├── domain/
│   ├── metrics/distance.ts
│   ├── elevation/
│   ├── filtering/
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

Las 9 carpetas finales todavía vacías contienen `.gitkeep`; la capa de datos, los tres servicios del navegador y el módulo de distancia ya contienen implementación. Tiempo, velocidad, ritmo, otras métricas, integraciones y migraciones futuras siguen pendientes.

## Persistencia local configurada

La factory createDatabase define WalkingTracker mediante Dexie, reutilizando Walk, TrackPoint, ActiveSession y Settings. No abre conexiones al importar; la aplicación todavía no la consume.

Esquema versión 1:

| Tabla | Clave primaria | Índices secundarios |
|---|---|---|
| walks | id | startedAt |
| trackPoints | id | walkId |
| activeSession | Externa fija: current | Ninguno |
| settings | Externa fija: preferences | Ninguno |

startedAt permite consultas por fecha y walkId recupera puntos de una caminata. Las claves externas de sesión/ajustes evitan añadir campos a los modelos. Los registros se almacenan completos. Dexie usa versión lógica 1 y versión nativa IndexedDB 10 según su convención; no hay migraciones futuras todavía.

Las seis pruebas de base validan apertura/esquema, lectura/escritura de las cuatro tablas, consulta por walkId, sustitución con claves fijas, reapertura y limpieza sin residuos. La capa de repositories ofrece operaciones básicas probadas, sin integración con la UI, guardado periódico ni recuperación funcional.

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

Opciones centralizadas y configurables: enableHighAccuracy true, maximumAge 0 ms y timeout omitido para conservar el valor nativo. Son valores iniciales ajustables, sin fijar umbrales de calidad o anomalías. Todavía no existe tracking funcional integrado con UI/persistencia, integración con métricas ni con Wake Lock. Permisos, precisión y consumo en iPhone siguen pendientes de validación real.

## Servicio de Page Visibility disponible

createVisibilityService encapsula document.visibilityState y visibilitychange. Expone getCurrentState() y subscribe(callback), que devuelve el cleanup de la suscripción. Informa visible, hidden o unknown para estados no reconocidos; no registra listeners al construir ni emite automáticamente el estado inicial.

Cada suscripción tiene un listener independiente. Su cleanup elimina exactamente ese listener, es idempotente y no afecta otras suscripciones, incluso si comparten callback. El consumidor debe ejecutar cada cleanup. Las pruebas verifican cambios de estado, cancelación selectiva y ausencia de callbacks tras cancelar.

Todavía no existe integración funcional entre visibility, tracking y persistencia: no se hace flush de datos, no se muestran advertencias ni se identifican huecos de tracking. Esas acciones corresponden a tareas posteriores.

## Servicio de Wake Lock disponible

createWakeLockService encapsula navigator.wakeLock.request('screen'), Sentinel.release y el evento release. Expone isSupported(), isActive(), request(), release(), subscribeRelease(callback) y cleanup(). No solicita un lock al importar o construir.

Las operaciones se serializan por instancia para evitar locks duplicados. La liberación automática actualiza el estado y permite solicitar uno nuevo; no hay recuperación automática. Las liberaciones retiran el listener del sentinel. Cleanup cancela suscripciones y libera incluso un lock cuya solicitud estuviera pendiente; es repetible.

La ausencia de API y los fallos devuelven WakeLockResult con error normalizado, sin mensajes de UI. Si falla release, se conserva la referencia para permitir reintentar; el consumidor debe revisar el resultado. Soporte y políticas en iPhone siguen pendientes de validación real.

Geolocalización, Page Visibility y Wake Lock todavía no están integrados en un flujo funcional de tracking. Wake Lock no lee Settings ni está conectado a Active Walk; tampoco implementa comportamiento ante cambios de visibilidad.

## Cálculo de distancia implementado

src/domain/metrics/distance.ts expone calculateDistanceMeters(from, to) y calculateAccumulatedDistanceMeters(points). Son funciones puras, independientes de React, persistencia y APIs del navegador; no modifican ni ordenan los puntos originales.

Usan Haversine sobre una esfera de radio medio 6 371 000 m y devuelven metros. La distancia entre coordenadas inválidas devuelve null; la acumulación vacía o sin segmentos elegibles devuelve 0. Es distancia horizontal, sin elevación ni corrección elipsoidal.

La acumulación acepta puntos medidos valid y suspicious con coordenadas seguras. Excluye anomalous, low-quality pendiente de evaluación y estimated. Los puntos excluidos cortan el segmento, sin conectar a través del hueco ni mezclar walkId distintos. El resultado es un subtotal medido; la estimación de huecos queda para tareas posteriores.

Las pruebas cubren referencias geográficas aproximadas, acumulación, exclusiones, repetidos, coordenadas negativas, antimeridiano, estabilidad numérica y entradas congeladas. Velocidad, ritmo y conversiones de presentación todavía no están implementados.

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

`npm test` ejecuta 102 pruebas/comprobaciones en diez archivos: bootstrap, navegación, modelos, base local, repositories, geolocalización, visibilidad, Wake Lock y distancia; para modo watch puede utilizarse `npm test -- --watch`. Las cuatro comprobaciones expectTypeOf se validan mediante compilación TypeScript, no por la ejecución Vitest aislada. `npm run build` comprueba TypeScript y genera `dist/`. `npm run preview` sirve el build localmente.

## Limitaciones vigentes

- Las páginas contienen placeholders. La base local y los repositories están definidos y probados, sin integración con la UI. El servicio de geolocalización está probado con mocks, sin tracking funcional integrado con UI/persistencia ni flujos de caminatas.
- Las pruebas con fake-indexeddb no validan cuotas, políticas de Safari ni durabilidad física. Las claves fijas son una convención tipada; IndexedDB no impone por sí solo singletons ni claves foráneas.
- readonly no congela objetos en runtime; rangos, invariantes temporales, filtros, métricas y recuperación siguen pendientes de implementación.
- Navegación y layout móvil validados en Chrome emulado a 320 px. El soporte de accesos directos y base path en GitHub Pages se validará en T32; el despliegue aún no está configurado.
- El tracking confiable del MVP requerirá página visible y activa; no se garantiza con pantalla bloqueada ni navegador en segundo plano.
- El acceso a ubicación requerirá HTTPS y permiso del usuario.
- Sin Internet, el MVP solo podrá aprovechar caché de tiles ya disponible, sin garantía del fondo cartográfico; el tracking deberá ser independiente del mapa. El soporte offline completo, descargas controladas, Service Worker, PWA y gestión de regiones quedan para una segunda versión.
- MVP sin backend, autenticación ni sincronización en la nube; datos locales al navegador. Pruebas reales en iPhone necesarias para validar el futuro tracking.
