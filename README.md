# Walking Tracker

Proyecto de aplicación web móvil para registrar caminatas mediante GPS, orientado inicialmente a iPhone. El stack aprobado es React + TypeScript + Vite, sin backend y con almacenamiento local en el navegador.

## Estado

T00–T05 están completadas y cerradas tras aprobación y validación QA. React + TypeScript + Vite, la estructura aprobada, el testing y la navegación SPA están operativos. Las cinco vistas contienen únicamente estructura y placeholders, sin lógica funcional de caminatas.

La siguiente tarea pendiente es **T06 — Definir modelos TypeScript**. No ha comenzado y requiere autorización del usuario. Todavía no hay modelos de dominio, tracking GPS, métricas, mapas, gráficos, historial/configuración funcional ni persistencia.

Estado del repositorio tras T05: router y layout en `src/app/`, cinco páginas base y ocho pruebas. App fue reubicado a `src/app/App.tsx`; los imports están actualizados. Las capas funcionales pendientes permanecen reservadas mediante `.gitkeep`.

## Stack y dependencias instaladas

- Entorno: Node.js `24.21.0` mediante NVM y npm `11.19.0`.
- Base operativa: React / React DOM `19.3.0`, TypeScript `6.0.3` y Vite `8.3.2` con plugin React.
- Dependencias runtime: React Router DOM `7.18.4` integrado para navegación; Leaflet `1.9.4`, Dexie `4.4.6` y Chart.js `4.5.1` instalados, sin integración funcional todavía.
- Testing disponible: Vitest `5.0.3`, React Testing Library `16.3.3`, jest-dom `7.0.1` y jsdom `30.1.2`. Pruebas React en jsdom y prueba de función TypeScript en Node.
- Tooling: Oxlint y tipos de Node, React y Leaflet. Versiones exactas y transitivas registradas en `package-lock.json`.

## Estructura actual

- `docs/`: requisitos, decisiones, arquitectura, plan de implementación, estado y evidencias de validación.
- `src/`: estructura aprobada, router/layout compartido, páginas placeholder, entrada React y CSS móvil simple.
- `tests/`: setup jest-dom/cleanup RTL, prueba de App, prueba de función fixture y pruebas de navegación.
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
├── main.tsx
└── index.css
```

Las 16 carpetas finales todavía vacías contienen `.gitkeep`; se retiraron los marcadores de tracking, history y settings al incorporar páginas. No hay modelos ni servicios funcionales.

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

`npm test` ejecuta ocho pruebas de bootstrap y navegación una vez; para modo watch puede utilizarse `npm test -- --watch`. `npm run build` comprueba TypeScript y genera `dist/`. `npm run preview` sirve el build localmente.

## Limitaciones vigentes

- Las páginas contienen placeholders; aún no hay funcionalidades de caminatas. Las pruebas actuales cubren bootstrap y navegación.
- Navegación y layout móvil validados en Chrome emulado a 320 px. El soporte de accesos directos y base path en GitHub Pages se validará en T32; el despliegue aún no está configurado.
- El tracking confiable del MVP requerirá página visible y activa; no se garantiza con pantalla bloqueada ni navegador en segundo plano.
- El acceso a ubicación requerirá HTTPS y permiso del usuario.
- Sin Internet, el MVP solo podrá aprovechar caché de tiles ya disponible, sin garantía del fondo cartográfico; el tracking deberá ser independiente del mapa. El soporte offline completo, descargas controladas, Service Worker, PWA y gestión de regiones quedan para una segunda versión.
- MVP sin backend, autenticación ni sincronización en la nube; datos locales al navegador. Pruebas reales en iPhone necesarias para validar el futuro tracking.
