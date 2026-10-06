# Estado actual — Walking Tracker

Fecha: 2026-10-06 (America/Bogota).

## Tarea ejecutada

T07 — Configurar Dexie e IndexedDB.

Estado: T07 CLOSED; ejecutada y aprobada por QA (Valerio: PASS — READY TO CLOSE T07). Cierre formal autorizado por el usuario mediante el commit feat: complete T07 Dexie IndexedDB setup. T08 no ha comenzado.

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

Siguiente responsable: usuario para autorizar una tarea posterior; Senior Developer únicamente tras esa autorización.

T07 ejecutada, aprobada por QA y cerrada mediante commit autorizado. Dexie/IndexedDB v1, tablas e índices documentados; lectura/escritura, consulta walkId y limpieza validadas. README actualizado conforme a la regla permanente. T08 no ha comenzado y requiere autorización posterior. Sin cambios de requisitos, decisiones, arquitectura ni plan de implementación.
