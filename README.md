# Walking Tracker

Proyecto de aplicación web móvil para registrar caminatas mediante GPS, orientado inicialmente a iPhone. El stack aprobado es React + TypeScript + Vite, sin backend y con almacenamiento local en el navegador.

## Estado

T00–T06 están completadas y cerradas tras aprobación y validación QA. React + TypeScript + Vite, la estructura aprobada, el testing y la navegación SPA están operativos; los modelos TypeScript base están definidos. Las cinco vistas contienen únicamente estructura y placeholders, sin lógica funcional de caminatas.

La siguiente tarea pendiente es **T07 — Configurar Dexie e IndexedDB**. No ha comenzado y requiere autorización del usuario. Dexie está instalado, pero todavía no existe persistencia IndexedDB/Dexie funcional, esquema de base de datos ni repositories. Tampoco hay tracking GPS, cálculos de métricas, mapas, gráficos o historial/configuración funcional.

Estado del repositorio tras T06: router y layout en `src/app/`, cinco páginas base, tipos independientes en `src/types/` y doce pruebas/comprobaciones. Las capas funcionales pendientes permanecen reservadas mediante `.gitkeep`.

## Stack y dependencias instaladas

- Entorno: Node.js `24.21.0` mediante NVM y npm `11.19.0`.
- Base operativa: React / React DOM `19.3.0`, TypeScript `6.0.3` y Vite `8.3.2` con plugin React.
- Dependencias runtime: React Router DOM `7.18.4` integrado para navegación; Leaflet `1.9.4`, Dexie `4.4.6` y Chart.js `4.5.1` instalados, sin integración funcional todavía.
- Testing disponible: Vitest `5.0.3`, React Testing Library `16.3.3`, jest-dom `7.0.1` y jsdom `30.1.2`. Pruebas React en jsdom y prueba de función TypeScript en Node.
- Tooling: Oxlint y tipos de Node, React y Leaflet. Versiones exactas y transitivas registradas en `package-lock.json`.

## Estructura actual

- `docs/`: requisitos, decisiones, arquitectura, plan de implementación, estado y evidencias de validación.
- `src/`: estructura aprobada, router/layout compartido, páginas placeholder, entrada React y CSS móvil simple.
- `src/types/`: modelos y estados sin implementación runtime, independientes de React y persistencia.
- `tests/`: setup jest-dom/cleanup RTL, bootstrap, navegación y comprobaciones de tipos.
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
│   ├── visibility/
│   └── wakeLock/
├── data/
│   ├── db/
│   ├── repositories/
│   └── migrations/
├── domain/
│   ├── metrics/
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

Las 15 carpetas finales todavía vacías contienen `.gitkeep`; se retiró también el marcador de types al definir modelos. No hay servicios funcionales.

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

`npm test` ejecuta doce pruebas/comprobaciones en cuatro archivos: bootstrap, navegación y modelos; para modo watch puede utilizarse `npm test -- --watch`. Las cuatro comprobaciones expectTypeOf se validan mediante compilación TypeScript, no por la ejecución Vitest aislada. `npm run build` comprueba TypeScript y genera `dist/`. `npm run preview` sirve el build localmente.

## Limitaciones vigentes

- Las páginas contienen placeholders; aún no hay funcionalidades de caminatas ni persistencia IndexedDB/Dexie. Las pruebas actuales cubren bootstrap, navegación y contratos de tipos.
- readonly no congela objetos en runtime; rangos, invariantes temporales, filtros, métricas y recuperación siguen pendientes de implementación.
- Navegación y layout móvil validados en Chrome emulado a 320 px. El soporte de accesos directos y base path en GitHub Pages se validará en T32; el despliegue aún no está configurado.
- El tracking confiable del MVP requerirá página visible y activa; no se garantiza con pantalla bloqueada ni navegador en segundo plano.
- El acceso a ubicación requerirá HTTPS y permiso del usuario.
- Sin Internet, el MVP solo podrá aprovechar caché de tiles ya disponible, sin garantía del fondo cartográfico; el tracking deberá ser independiente del mapa. El soporte offline completo, descargas controladas, Service Worker, PWA y gestión de regiones quedan para una segunda versión.
- MVP sin backend, autenticación ni sincronización en la nube; datos locales al navegador. Pruebas reales en iPhone necesarias para validar el futuro tracking.
