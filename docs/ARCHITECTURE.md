# ARCHITECTURE.md

## 1. Propósito

Definir la arquitectura técnica del MVP web para seguimiento de caminatas mediante GPS.

Este documento implementa las decisiones aprobadas en `REQUIREMENTS.md` y `DECISIONS.md` y describe cómo se organizará la solución sin entrar todavía en el plan detallado de implementación.

## 2. Objetivo arquitectónico

Construir una aplicación web móvil, ligera y mantenible, que permita registrar caminatas mediante GPS mientras la página permanezca activa y visible en el navegador.

La arquitectura deberá:

- funcionar inicialmente en iPhone mediante navegador moderno;
- ejecutarse como SPA;
- no depender de backend;
- almacenar datos localmente;
- separar UI, lógica de dominio, servicios del navegador y persistencia;
- facilitar pruebas unitarias;
- permitir evolución futura hacia PWA, mapas offline completos o una aplicación móvil nativa/híbrida.

## 3. Stack aprobado

### Frontend
- React
- TypeScript
- Vite
- React Router

### Mapa
- Leaflet
- tiles raster

### Gráficos
- Chart.js

### Persistencia
- IndexedDB
- Dexie

### APIs del navegador
- Web Geolocation API
- Page Visibility API
- Screen Wake Lock API cuando esté disponible

### Testing
- Vitest
- React Testing Library
- pruebas manuales reales en iPhone

### Hosting
- GitHub Pages
- HTTPS provisto por GitHub Pages

### Entorno de desarrollo
- Debian
- VS Code
- Git
- Codex
- agentes de arquitectura, desarrollo y QA

## 4. Principios arquitectónicos

### 4.1 Simplicidad
El MVP deberá usar la menor cantidad posible de capas, librerías y abstracciones.

### 4.2 Separación de responsabilidades
La UI no deberá contener directamente:
- lógica de tracking;
- acceso a IndexedDB;
- cálculos de métricas;
- lógica de filtrado GPS;
- interacción directa con APIs complejas del navegador.

### 4.3 Dominio independiente
Los cálculos de distancia, velocidad, ritmo, elevación, filtrado, detección de anomalías e interpolación deberán implementarse como módulos puros independientes de React.

### 4.4 Persistencia encapsulada
Los componentes React no deberán acceder directamente a IndexedDB. Todo acceso se realizará mediante una capa de datos basada en Dexie.

### 4.5 Datos originales preservados
Los puntos GPS originales deberán conservarse aunque posteriormente sean clasificados como válidos, baja calidad, sospechosos, anómalos o estimados.

## 5. Arquitectura lógica

```text
┌──────────────────────────────┐
│          React UI            │
│ Home / Tracking / History    │
│ Detail / Settings            │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ State / Hooks / Controllers  │
│ React Context + local state  │
└───────┬──────────┬───────────┘
        │          │
        ▼          ▼
┌─────────────┐  ┌────────────────┐
│   Domain    │  │ Browser        │
│ metrics     │  │ Services       │
│ filtering   │  │ geolocation    │
│ elevation   │  │ visibility     │
│ estimation  │  │ wake lock      │
└──────┬──────┘  └───────┬────────┘
       │                 │
       └────────┬────────┘
                ▼
       ┌─────────────────┐
       │ Data Layer      │
       │ Dexie           │
       │ IndexedDB       │
       └─────────────────┘
```

## 6. Estructura de carpetas

```text
project/
├── docs/
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── IMPLEMENTATION-PLAN.md
│   ├── CURRENT_STATE.md
│   ├── TEST-PLAN.md
│   └── TEST-RESULTS.md
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers/
│   ├── features/
│   │   ├── tracking/
│   │   ├── history/
│   │   ├── settings/
│   │   └── maps/
│   ├── services/
│   │   ├── geolocation/
│   │   ├── visibility/
│   │   └── wakeLock/
│   ├── data/
│   │   ├── db/
│   │   ├── repositories/
│   │   └── migrations/
│   ├── domain/
│   │   ├── metrics/
│   │   ├── elevation/
│   │   ├── filtering/
│   │   └── estimation/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── tests/
├── README.md
└── AGENTS.md
```

## 7. Navegación

La aplicación será una SPA ligera con React Router.

Vistas iniciales:
- Home
- Active Walk
- History
- Walk Detail
- Settings

## 8. Tracking GPS

### 8.1 Fuente de datos
El tracking utilizará `navigator.geolocation.watchPosition()`.

### 8.2 Servicio de geolocalización
El servicio deberá:
- iniciar tracking;
- detener tracking;
- entregar posiciones;
- entregar errores;
- exponer precisión;
- conservar metadatos originales;
- no realizar cálculos de negocio.

### 8.3 Modelo conceptual de punto

```ts
TrackPoint {
  id
  walkId
  timestamp
  latitude
  longitude
  altitude
  accuracy
  speed
  quality
  estimated
}
```

### 8.4 Calidad
Estados potenciales:
- valid
- low-quality
- suspicious
- anomalous
- estimated

Los umbrales exactos deberán definirse posteriormente.

## 9. Procesamiento de métricas

La lógica se mantendrá fuera de React.

### Distancia
Solo utilizará puntos válidos según las reglas aprobadas.

### Velocidad promedio
Usará tiempo activo.

### Ritmo promedio
Usará tiempo activo.

### Elevación
Deberá:
- filtrar ruido;
- excluir altitudes claramente anómalas;
- permitir interpolación;
- calcular ganancia;
- calcular pérdida.

### Estimación
Los valores estimados deberán distinguirse de los medidos.

## 10. Estado de la aplicación

El MVP evitará Redux, Zustand u otras librerías globales.

Se usarán:
- estado local de React;
- React Context cuando sea necesario;
- hooks específicos por dominio.

La sesión activa deberá tener representación persistida en IndexedDB.

## 11. Persistencia

### 11.1 Tecnología
IndexedDB con Dexie.

### 11.2 Entidades principales

#### walks
Metadatos y resumen de caminata.

#### trackPoints
Puntos GPS asociados a cada caminata.

#### activeSession
Información mínima necesaria para recuperación.

### 11.3 Relación
`Walk 1 ─────── N TrackPoints`

### 11.4 Versionamiento
El esquema comenzará en versión 1 y evolucionará mediante migraciones explícitas.

## 12. Estrategia de persistencia

La persistencia durante tracking se realizará por bloques.

El guardado se activará por:
- intervalo de tiempo;
- cantidad de puntos;

lo que ocurra primero.

Antes de que la página pase a segundo plano, se intentará forzar persistencia inmediata.

Quedan pendientes los valores exactos de intervalo y tamaño de bloque.

## 13. Recuperación de sesiones

Al cargar la aplicación se comprobará si existe una sesión incompleta.

Opciones:
- Continuar
- Guardar
- Descartar

### Continuar
- retoma tracking;
- conserva inicio original;
- conserva la misma caminata.

### Guardar
- guarda la caminata;
- marca estado incompleto.

### Descartar
- requiere confirmación;
- elimina la sesión activa.

Los intervalos sin posiciones deberán distinguirse del tracking observado.

## 14. Page Visibility

Se utilizará Page Visibility API.

Cuando una caminata esté activa y la página deje de estar visible:
1. persistir estado cuando sea posible;
2. registrar el cambio de visibilidad;
3. advertir al usuario al regresar;
4. indicar que puede existir un intervalo sin GPS.

La arquitectura no asumirá ejecución normal de JavaScript en segundo plano.

## 15. Wake Lock

Cuando esté disponible, se utilizará Screen Wake Lock durante una caminata activa.

El servicio deberá:
- solicitar bloqueo;
- detectar liberación;
- intentar recuperarlo cuando corresponda;
- informar si no está disponible.

Wake Lock será una mejora de experiencia, no una dependencia de integridad.

## 16. Mapas

### 16.1 Librería
Leaflet.

### 16.2 Tipo
Tiles raster.

### 16.3 Responsabilidades
- mostrar posición actual;
- dibujar ruta;
- permitir pan;
- permitir zoom;
- seguir posición;
- ajustar bounds;
- representar segmentos de baja calidad cuando aplique.

### 16.4 Offline
El soporte offline completo no forma parte del MVP.

No se implementará descarga manual de regiones en esta primera iteración.

Una versión posterior podrá añadir:
- Service Worker;
- PWA;
- caché controlada;
- precarga de tiles;
- gestión de regiones offline.

## 17. Perfil de altitud

Chart.js será utilizado para visualizar el perfil.

- eje X: distancia acumulada;
- eje Y: altitud.

La lógica de cálculo y filtrado permanecerá separada de Chart.js.

## 18. Testing

### 18.1 Unit tests
Vitest.

Prioridad:
- distancia;
- velocidad;
- ritmo;
- elevación;
- filtrado;
- anomalías;
- interpolación;
- conversión de unidades.

### 18.2 Component tests
React Testing Library.

Prioridad:
- controles de tracking;
- pausa;
- navegación;
- historial;
- configuración;
- recuperación.

### 18.3 End-to-end
No se implementarán pruebas E2E automatizadas en el MVP inicial.

### 18.4 Pruebas reales
Obligatorias en iPhone para:
- permisos;
- GPS;
- tracking caminando;
- estabilidad;
- batería;
- Wake Lock;
- Page Visibility;
- recuperación;
- persistencia;
- pérdida de señal.

## 19. Deployment

La aplicación se compilará con Vite y se desplegará como sitio estático en GitHub Pages.

```text
Debian
  │
  ├── desarrollo
  ├── tests
  └── build
       │
       ▼
    GitHub
       │
       ▼
 GitHub Pages
       │
       ▼
 HTTPS público
       │
       ▼
     iPhone
```

Deberá configurarse correctamente el `base path` de GitHub Pages.

## 20. Backend

El MVP no tendrá backend.

No existirán inicialmente:
- API propia;
- autenticación;
- sincronización;
- servidor de aplicación;
- base de datos remota.

## 21. Seguridad y privacidad

- los datos GPS permanecerán localmente en el navegador;
- el acceso a ubicación utilizará APIs estándar del navegador;
- la aplicación funcionará bajo HTTPS;
- el MVP no transmitirá caminatas a infraestructura propia.

## 22. Dependencias externas

Inicialmente se autorizan:
- React;
- React DOM;
- React Router;
- Leaflet;
- Dexie;
- Chart.js;
- Vitest;
- React Testing Library;
- Vite;
- dependencias necesarias para TypeScript y tooling.

Se mantendrá el número de dependencias al mínimo.

## 23. Flujo de tracking

```text
User presses Start
       │
       ▼
Tracking feature
       │
       ▼
Geolocation Service
       │
       ▼
watchPosition()
       │
       ▼
Raw TrackPoint
       │
       ├──────────────► Persist buffer
       │
       ▼
Quality evaluation
       │
       ▼
Domain processing
       │
       ├── distance
       ├── speed
       ├── pace
       ├── altitude
       └── anomaly handling
       │
       ▼
React state
       │
       ├── metrics UI
       ├── Leaflet map
       └── Chart.js elevation
```

## 24. Flujo de recuperación

```text
Application starts
       │
       ▼
Check activeSession
       │
       ├── none ─────► Home
       │
       └── exists
              │
              ▼
       Recovery dialog
          /    |     \
 Continue   Save   Discard
```

## 25. Decisiones aplazadas

No bloquean el MVP:
- PWA;
- Service Worker;
- mapas offline completos;
- backend;
- sincronización;
- exportación CSV;
- cuentas;
- autenticación;
- soporte Android específico;
- empaquetado nativo;
- estadísticas agregadas;
- pruebas E2E automatizadas.

## 26. Riesgos principales

### R1 — Limitaciones de background
Mitigación:
- Wake Lock;
- advertencias;
- Page Visibility;
- persistencia frecuente.

### R2 — Precisión GPS variable
Mitigación:
- conservar datos originales;
- clasificar calidad;
- filtrar anomalías;
- separar observados y estimados.

### R3 — Altitud ruidosa
Mitigación:
- suavizado;
- filtrado;
- interpolación;
- pruebas reales.

### R4 — Persistencia local
Mitigación:
- persistencia periódica;
- esquema versionado;
- recuperación.

### R5 — Mapas offline
Mitigación:
- excluir offline completo del MVP;
- mantener tracking independiente del mapa;
- abordarlo en versión posterior.

## 27. Parámetros técnicos pendientes

Antes del plan de implementación deberán concretarse:
1. umbrales de precisión GPS;
2. reglas cuantitativas de anomalías;
3. método de suavizado de altitud;
4. método de interpolación;
5. método de estimación durante huecos prolongados;
6. intervalo de persistencia;
7. cantidad máxima de puntos por bloque;
8. comportamiento exacto ante `visibilitychange`;
9. política de Wake Lock;
10. navegador mínimo soportado.

## 28. Resultado arquitectónico

```text
React + TypeScript + Vite
        │
        ├── React Router
        ├── Leaflet
        ├── Chart.js
        ├── Web Geolocation API
        ├── Page Visibility API
        ├── Screen Wake Lock API
        └── Dexie / IndexedDB
                  │
                  ▼
             Local-only data
```

Sin backend.

Sin ejecución móvil nativa.

Sin tracking garantizado en background.

Desplegada como sitio estático HTTPS en GitHub Pages.

## 29. Siguiente paso

Con `REQUIREMENTS.md`, `DECISIONS.md` y `ARCHITECTURE.md` definidos, el siguiente documento será:

`docs/IMPLEMENTATION-PLAN.md`

Ese documento deberá convertir la arquitectura aprobada en tareas incrementales, verificables y entregables al Senior Developer.
