# DECISIONS.md

## 1. Propósito

Registrar las decisiones técnicas y de comportamiento aprobadas para el proyecto de seguimiento de caminatas.

Este documento complementa `REQUIREMENTS.md`.

Su objetivo es dejar trazabilidad de decisiones que afectan cálculos, calidad de datos, persistencia, mapas offline y recuperación de sesiones, sin definir todavía la arquitectura de implementación.

---

## 2. Estado de las decisiones

| ID | Tema | Estado |
|---|---|---|
| D1 | Precisión GPS | Aprobada |
| D2 | Detección de puntos GPS anómalos | Aprobada |
| D3 | Altitud y ruido | Aprobada |
| D4 | Estimación de métricas faltantes | Aprobada |
| D5 | Persistencia durante la caminata | Aprobada |
| D6 | Mapas offline: selección y descarga manual de áreas | Sustituida por D9; antecedente histórico |
| D7 | Recuperación de sesiones | Aprobada |
| D8 | Plataforma del MVP: Web HTML + JavaScript | Aprobada |
| D9 | Mapas en el MVP y soporte offline completo en segunda versión | Aprobada y vigente; sustituye D6 |

---

# D1 — Precisión GPS

## Decisión

Los puntos GPS con baja precisión deberán conservarse, marcarse internamente como de baja calidad y evaluarse posteriormente para determinar si participan en cálculos.

Cuando durante un periodo solo existan puntos de baja precisión:

- deberán almacenarse;
- no deberán incorporarse provisionalmente a la ruta calculada;
- podrán mantenerse disponibles para evaluación posterior.

El criterio para clasificar la precisión podrá ser fijo o adaptativo según la recomendación técnica que se defina posteriormente.

## Contexto

La señal GPS puede degradarse temporalmente por condiciones del entorno, geometría satelital, edificios, vegetación u otras limitaciones.

Eliminar inmediatamente esos puntos podría provocar pérdida innecesaria de información.

## Ventajas

- conserva los datos originales;
- evita distorsionar inmediatamente distancia y ruta;
- permite aplicar mejores criterios posteriormente;
- mantiene trazabilidad de la calidad del GPS.

## Desventajas

- aumenta la complejidad de clasificación;
- requiere distinguir entre datos medidos, válidos y degradados;
- algunos puntos deberán reevaluarse después de ser capturados.

## Alternativas descartadas

- conservar todos los puntos y usarlos directamente;
- rechazar automáticamente cualquier punto de baja precisión.

## Parámetros pendientes

Deberán definirse técnicamente:

- umbral de precisión aceptable;
- umbral de precisión degradada;
- umbral de precisión insuficiente;
- conveniencia de usar umbrales fijos o adaptativos.

---

# D2 — Detección de puntos GPS anómalos

## Decisión

La detección de puntos GPS anómalos deberá combinar múltiples señales.

Como mínimo, podrán considerarse:

- precisión reportada;
- velocidad aparente;
- salto de distancia;
- coherencia temporal.

Un punto sospechoso pero no claramente inválido deberá mantenerse y utilizarse normalmente.

Si varios puntos consecutivos son clasificados como anómalos:

- podrán conservarse visualmente;
- deberán excluirse de las métricas calculadas.

## Contexto

Un único criterio puede clasificar incorrectamente puntos válidos como erróneos.

Por ejemplo, una velocidad aparente elevada puede originarse por ruido GPS y no necesariamente indica por sí sola que un punto deba descartarse.

## Ventajas

- reduce falsos positivos;
- permite análisis más robusto;
- conserva información útil;
- separa visualización de cálculo de métricas.

## Desventajas

- requiere una lógica de validación más elaborada;
- necesita parámetros combinados y consistentes;
- puede existir incertidumbre en casos límite.

## Alternativas descartadas

- usar una única regla simple;
- excluir automáticamente todo punto sospechoso;
- usar normalmente incluso tramos claramente anómalos en las métricas.

## Parámetros pendientes

Deberán definirse técnicamente:

- umbral de velocidad aparente sospechosa;
- distancia máxima razonable entre puntos consecutivos;
- criterios temporales;
- reglas para clasificar un punto como sospechoso o claramente inválido.

---

# D3 — Altitud y ruido

## Decisión

Las pequeñas variaciones de altitud deberán suavizarse antes de calcular ganancia y pérdida de elevación.

Cuando falten valores válidos de altitud:

- podrán estimarse;
- podrán interpolarse entre valores válidos cercanos.

El cálculo de elevación deberá buscar un equilibrio entre:

- sensibilidad a cambios reales;
- estabilidad frente al ruido.

## Contexto

La altitud obtenida desde sensores o GPS puede contener ruido suficiente para inflar artificialmente los valores de ascenso y descenso acumulados.

## Ventajas

- mejora la estabilidad del perfil;
- evita sumar ruido como elevación real;
- permite mantener continuidad cuando faltan datos aislados.

## Desventajas

- el suavizado puede ocultar cambios pequeños reales;
- requiere definir un método de filtrado;
- la interpolación introduce datos estimados.

## Alternativas descartadas

- utilizar altitud sin filtrar;
- dejar huecos obligatoriamente cuando falte altitud;
- priorizar exclusivamente sensibilidad o estabilidad.

## Parámetros pendientes

Deberán definirse técnicamente:

- método de suavizado;
- tamaño de ventana o equivalente;
- criterio para detectar cambios imposibles;
- método de interpolación;
- tratamiento de extremos del recorrido.

---

# D4 — Estimación de métricas faltantes

## Decisión

Cuando falte información válida durante un tramo, la aplicación deberá interpolar o estimar entre el último dato válido y el siguiente disponible.

La aplicación continuará estimando incluso cuando la pérdida de datos sea prolongada.

Los valores estimados deberán distinguirse internamente de los valores medidos directamente.

## Contexto

El usuario aprobó mantener continuidad de métricas incluso durante interrupciones prolongadas de datos.

Esto prioriza continuidad funcional sobre certeza absoluta del valor.

## Ventajas

- mantiene continuidad en las métricas;
- evita huecos prolongados;
- permite conservar una experiencia coherente de seguimiento.

## Desventajas

- la incertidumbre aumenta mientras más larga sea la pérdida de datos;
- una estimación prolongada puede alejarse significativamente de la trayectoria real;
- requiere marcar claramente el origen estimado de los valores.

## Riesgo aceptado

Una pérdida larga de GPS puede producir métricas menos confiables.

Esta incertidumbre deberá poder identificarse internamente aunque la aplicación continúe estimando.

## Alternativas descartadas

- dejar de estimar después de cierto límite;
- dejar el tramo sin métricas;
- invalidar toda la caminata.

## Parámetros pendientes

Deberán definirse técnicamente:

- método de estimación;
- forma de representar internamente la incertidumbre;
- tratamiento de distancia, velocidad y altitud durante pérdidas prolongadas;
- posibles límites de confianza sin detener la estimación.

---

# D5 — Persistencia durante la caminata

## Decisión

Los datos de una caminata activa deberán persistirse periódicamente en bloques.

El guardado deberá activarse por cualquiera de estos criterios, lo que ocurra primero:

- tiempo transcurrido;
- cantidad acumulada de puntos.

Se priorizará un intervalo relativamente más largo para reducir escrituras.

Antes de que la aplicación pase a segundo plano, deberá forzarse un guardado inmediato.

## Contexto

El proyecto requiere recuperar caminatas tras cierres inesperados, reinicios, batería agotada o suspensión de la aplicación.

Al mismo tiempo, se busca evitar escrituras excesivamente frecuentes.

## Ventajas

- reduce cantidad de operaciones de escritura;
- conserva capacidad de recuperación;
- permite balancear robustez y eficiencia;
- mejora la protección al entrar en segundo plano.

## Desventajas

- puede perderse una pequeña cantidad de datos recientes ante una interrupción abrupta;
- requiere coordinar criterios por tiempo y número de puntos.

## Alternativas descartadas

- guardar cada punto inmediatamente;
- guardar únicamente por tiempo;
- guardar únicamente por cantidad de puntos.

## Parámetros pendientes

Deberán definirse técnicamente:

- intervalo temporal de persistencia;
- número máximo de puntos antes de persistir;
- pérdida máxima tolerable ante una interrupción;
- estrategia de escritura segura.

---

# D6 — Mapas offline

## Estado y trazabilidad

Sustituida por D9 el 2026-10-05 por decisión explícita del usuario. Se conserva íntegro el contenido previo a continuación como antecedente histórico; sus obligaciones, alternativas descartadas y parámetros no son vigentes para el MVP ni definen por sí solos la implementación de la segunda versión.

## Decisión anterior (sustituida)

El usuario deberá seleccionar manualmente el área del mapa que desea preparar para uso offline.

La aplicación deberá establecer un límite máximo de tamaño para evitar descargas excesivas.

Si la descarga del área queda incompleta:

- la aplicación deberá reintentar automáticamente;
- el objetivo será completar el área seleccionada.

## Contexto

`REQUIREMENTS.md` establece que el mapa debe seguir siendo visible sin Internet dentro de un área preparada previamente.

También se requiere continuar registrando la caminata si el usuario sale de esa zona.

## Ventajas

- el usuario controla qué zona prepara;
- limita uso innecesario de almacenamiento y red;
- reduce el riesgo de dejar mapas parcialmente disponibles.

## Desventajas

- requiere definir límites de área;
- las descargas pueden consumir almacenamiento;
- reintentos automáticos requieren control para evitar comportamiento indefinido.

## Alternativas descartadas

- descarga automática alrededor de la ubicación sin selección;
- uso permanente de áreas incompletas sin reintento.

## Parámetros pendientes

Deberán definirse técnicamente:

- tamaño máximo del área;
- nivel o niveles de detalle incluidos;
- política de reintentos;
- comportamiento si no es posible completar la descarga;
- estimación previa del tamaño de descarga.

---

# D7 — Recuperación de sesiones

## Decisión

Si existe una caminata incompleta al reabrir la aplicación, el usuario deberá poder elegir:

- Continuar;
- Guardar;
- Descartar.

### Continuar

Al elegir **Continuar**:

- el registro GPS deberá retomarse inmediatamente;
- deberá conservarse la fecha y hora de inicio original;
- la caminata seguirá considerándose una única sesión;
- el intervalo sin posiciones deberá quedar identificado como interrupción de tracking; no se asumirá automáticamente como distancia medida.

### Guardar

Al elegir **Guardar**:

- la caminata se conservará como válida;
- deberá quedar marcada como incompleta.

### Descartar

Al elegir **Descartar**:

- la aplicación deberá solicitar una confirmación final antes de eliminar la sesión.

## Contexto

Una caminata puede quedar incompleta por:

- cierre accidental;
- reinicio;
- batería agotada;
- suspensión;
- error inesperado.

La recuperación no debe implicar pérdida automática de información.

## Ventajas

- mantiene control explícito del usuario;
- conserva trazabilidad de recorridos incompletos;
- permite continuar una caminata sin crear una nueva sesión.

## Desventajas

- contabilizar la interrupción como tiempo activo puede aumentar la duración aunque no exista certeza de movimiento;
- requiere distinguir caminatas completas e incompletas.

## Riesgo aceptado

Una interrupción del navegador puede producir un hueco sin posiciones GPS. La sesión podrá continuar, pero ese intervalo deberá distinguirse del tracking efectivamente observado.

## Alternativas descartadas

- continuar automáticamente sin preguntar;
- guardar siempre automáticamente;
- separar la continuación como una nueva caminata.

---


# D8 — Plataforma del MVP: Web HTML + JavaScript

## Decisión

El MVP se implementará como aplicación web móvil utilizando HTML y JavaScript, priorizando funcionamiento en iPhone mediante un navegador moderno.

El tracking GPS confiable se limitará al periodo durante el cual la página permanezca visible y activa.

No serán requisitos del MVP:

- tracking GPS garantizado con la pantalla bloqueada;
- tracking GPS garantizado al cambiar a otra aplicación;
- ejecución continua garantizada de JavaScript en segundo plano.

Cuando el navegador lo permita, se utilizará Screen Wake Lock para intentar mantener la pantalla encendida durante una caminata activa.

## Contexto

El prototipo previo `location-map-test` demostró que la Web Geolocation API permite capturar posiciones GPS y representar recorridos mediante una solución web HTML + JavaScript.

Los requisitos originales de background tracking obligaban a utilizar capacidades nativas de iOS. Al eliminar esos requisitos, una arquitectura web se vuelve suficiente para el MVP.

## Ventajas

- reutiliza experiencia y conceptos ya validados en `location-map-test`;
- permite desarrollar principalmente desde Debian y VS Code;
- no requiere Xcode para el ciclo normal de desarrollo;
- evita Swift, React Native y toolchains móviles en el MVP;
- reduce complejidad arquitectónica;
- facilita pruebas rápidas directamente desde el navegador del iPhone.

## Desventajas

- el usuario deberá mantener la página activa durante el tracking;
- cambiar de aplicación puede producir huecos de ubicación;
- bloquear la pantalla puede detener o degradar el seguimiento;
- el comportamiento depende de las políticas del navegador y del sistema operativo;
- el control sobre batería y sensores es menor que en una aplicación nativa.

## Alternativas descartadas para el MVP

- aplicación iOS nativa;
- React Native;
- Flutter;
- Kotlin Multiplatform.

Estas alternativas no quedan descartadas para versiones futuras.

## Consecuencia arquitectónica

`ARCHITECTURE.md` deberá diseñar una solución web sencilla, basada en capacidades estándar del navegador, evitando incorporar infraestructura móvil nativa que ya no sea necesaria.

---

# D9 — Mapas en el MVP y soporte offline completo en segunda versión

## Estado y autoridad

Aprobada y vigente. Registra la decisión arquitectónica más reciente confirmada por el usuario el 2026-10-05. Sustituye D6 y prevalece sobre las referencias anteriores que exigían preparación o descarga manual de mapas en el MVP.

## Decisión

- El MVP será una web React + TypeScript + Vite y utilizará Leaflet con tiles raster.
- No habrá selección manual, preparación ni descarga explícita de áreas offline en el MVP.
- Sin Internet, el MVP solo podrá aprovechar la caché ya disponible en el navegador cuando exista; no garantizará disponibilidad, cobertura ni permanencia del fondo cartográfico.
- El tracking GPS permanecerá independiente de la carga de tiles y de la disponibilidad del mapa, sujeto a las condiciones de visibilidad y permisos ya aprobadas.
- El soporte offline completo, incluida preparación o descarga controlada de mapas, Service Worker, PWA, caché controlada, precarga de tiles y gestión de regiones offline, se traslada a una segunda versión.

## Contexto

La decisión D6 y las referencias anteriores de `REQUIREMENTS.md` exigían mapas preparados manualmente para uso offline, mientras que `ARCHITECTURE.md` §16.4 y §26 R5 ya excluyen el soporte offline completo del MVP y mantienen el tracking independiente del mapa. El usuario confirmó que la decisión arquitectónica más reciente prevalece.

## Ventajas

- Mantiene el MVP dentro de la arquitectura aprobada.
- Evita que la falta de fondo cartográfico detenga el registro GPS.
- Aplaza la complejidad de descargas y gestión offline a la segunda versión.

## Limitaciones y riesgo aceptado

El fondo cartográfico puede quedar parcial o totalmente indisponible sin Internet. La caché existente del navegador no constituye soporte offline completo ni garantiza disponibilidad de mapas.

## Alternativa sustituida

La selección manual de áreas, límites de descarga y reintentos automáticos definidos en D6 dejan de ser obligaciones del MVP. Los parámetros del soporte offline completo se definirán al abordar la segunda versión; no se fijan nuevos valores ni políticas en esta corrección.

## Impacto documental

Se actualizan RQ-OFFLINE-002/003/004, RQ-ERROR-002, el alcance inicial, las exclusiones, FUT-021, ASM-005 y la revisión de alcance de `REQUIREMENTS.md`. RQ-OFFLINE-001 y RQ-OFFLINE-005 siguen vigentes. `ARCHITECTURE.md` ya es compatible con D9 y permanece intacto, al igual que `IMPLEMENTATION-PLAN.md`.


## 10. Parámetros técnicos aún pendientes

Las decisiones D1–D5, D7, D8 y D9 están aprobadas y vigentes. D6 queda sustituida por D9.

Antes de finalizar `ARCHITECTURE.md` deberán concretarse, como mínimo:

1. umbrales de precisión GPS;
2. criterios cuantitativos de anomalías;
3. método de suavizado de altitud;
4. método de interpolación y estimación;
5. tratamiento de incertidumbre en pérdidas prolongadas;
6. intervalo y tamaño de bloque de persistencia;
7. pérdida máxima tolerable de datos.

El límite de tamaño de mapas offline y la política de reintentos de descargas offline, antes listados como pendientes del MVP, quedan trasladados a la segunda versión. No bloquean el MVP ni T01.

Estos puntos son parámetros derivados de decisiones ya aprobadas y no modifican el alcance funcional salvo que una limitación técnica obligue a revisarlos.

---

## 11. Control de cambios

### Cambio aprobado — 2026-10-05

El usuario confirmó la sustitución de D6 por D9 para alinear requisitos y decisiones con la arquitectura aprobada. D6 se conserva como antecedente histórico; la decisión vigente elimina la preparación manual de áreas del MVP y traslada el soporte offline completo a la segunda versión. No se modifica la arquitectura ni el plan de implementación.

Las decisiones aprobadas en este documento no deberán modificarse silenciosamente.

Si durante arquitectura, implementación o pruebas aparece un conflicto:

1. deberá documentarse el problema;
2. deberá explicarse el impacto;
3. deberán presentarse alternativas;
4. deberá recomendarse una opción;
5. cualquier cambio deberá ser aprobado antes de reemplazar una decisión existente.

---

## 12. Siguiente paso

Con `REQUIREMENTS.md` y `DECISIONS.md` consolidados, el siguiente documento a desarrollar será:

`docs/ARCHITECTURE.md`

La arquitectura deberá respetar las decisiones vigentes D1–D5, D7, D8 y D9 y definir la solución más simple que satisfaga los requisitos aprobados. D6 se conserva únicamente como antecedente sustituido.
