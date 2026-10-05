# REQUIREMENTS.md

## 1. Propósito

Definir los requisitos funcionales y no funcionales de una aplicación móvil orientada inicialmente a iPhone para registrar caminatas a pie mediante GPS.

La aplicación deberá permitir registrar la ruta recorrida, visualizarla sobre un mapa, medir distancia y duración, mostrar información de velocidad y ritmo, registrar altitud y visualizar el perfil de elevación del recorrido.

Este documento define **qué debe hacer la aplicación**, no cómo debe implementarse.

---

## 2. Alcance inicial

La primera versión estará orientada a un único usuario y a caminatas a pie.

El MVP web deberá:

- ejecutarse como aplicación web HTML + JavaScript en un navegador móvil compatible;
- registrar caminatas mediante la Web Geolocation API mientras la página permanezca activa y visible;
- mostrar la posición y la ruta en tiempo real;
- calcular distancia y duración;
- manejar pausas;
- registrar altitud cuando esté disponible;
- mostrar un perfil de altitud;
- conservar el historial de caminatas localmente;
- conservar periódicamente los datos registrados para reducir pérdidas ante recargas o cierres accidentales;
- permitir consultar caminatas anteriores.

El MVP no garantizará tracking GPS mientras el navegador esté en segundo plano o la pantalla esté bloqueada.

El tracking GPS será independiente de la disponibilidad del mapa. El MVP no garantizará disponibilidad del fondo cartográfico sin Internet y solo podrá aprovechar la caché ya disponible en el navegador cuando exista. El soporte offline completo se traslada a una segunda versión.

---

## 3. Usuario objetivo

### RQ-USER-001
La primera versión será utilizada inicialmente por un único usuario.

### RQ-USER-002
La primera versión no requerirá autenticación ni inicio de sesión.

---

## 4. Inicio, pausa y finalización de caminatas

### RQ-WALK-001
El usuario deberá poder iniciar una caminata manualmente mediante un botón **Iniciar**.

### RQ-WALK-002
La aplicación deberá permitir iniciar una caminata aun cuando la precisión GPS no sea óptima, pero deberá mostrar una advertencia antes de comenzar.

### RQ-WALK-003
El usuario deberá poder pausar una caminata manualmente.

### RQ-WALK-004
El usuario deberá poder reanudar una caminata pausada.

### RQ-WALK-005
El tiempo durante el cual una caminata permanezca pausada no deberá contabilizarse como tiempo activo.

### RQ-WALK-006
La aplicación deberá registrar también el tiempo total transcurrido, incluyendo pausas.

### RQ-WALK-007
Los puntos GPS obtenidos mientras la caminata esté pausada no deberán formar parte de la ruta activa.

### RQ-WALK-008
El usuario deberá poder finalizar una caminata manualmente.

### RQ-WALK-009
La aplicación deberá solicitar confirmación antes de finalizar una caminata.

### RQ-WALK-010
El usuario deberá poder cancelar una caminata en curso sin guardarla.

### RQ-WALK-011
La aplicación deberá solicitar confirmación antes de cancelar una caminata.

### RQ-WALK-012
El estado **Pausado** deberá mostrarse claramente mientras una caminata esté detenida temporalmente.

---

## 5. Identificación de la caminata

### RQ-NAME-001
El usuario deberá poder asignar manualmente un nombre a una caminata.

### RQ-NAME-002
El nombre podrá asignarse antes de iniciar o al finalizar la caminata.

### RQ-NAME-003
Si el usuario no asigna un nombre, la aplicación deberá generar uno automáticamente.

### RQ-NAME-004
El formato automático deberá seguir el patrón:

`Caminata – DD Mon YYYY HH:MM`

Ejemplo:

`Caminata – 04 Oct 2026 16:45`

### RQ-NAME-005
El usuario deberá poder editar posteriormente el nombre de una caminata guardada.

---

## 6. Registro GPS

### RQ-GPS-001
Durante una caminata activa, la aplicación deberá registrar la posición GPS de forma continua.

### RQ-GPS-002
Cada punto GPS deberá conservar, como mínimo:

- latitud;
- longitud;
- altitud;
- fecha y hora;
- precisión GPS.

### RQ-GPS-003
La aplicación deberá conservar también la velocidad reportada por el sistema GPS cuando esté disponible.

### RQ-GPS-004
La aplicación deberá conservar los datos GPS originales de cada punto, además de las métricas calculadas.

### RQ-GPS-005
La aplicación deberá mostrar la precisión GPS actual durante la caminata.

### RQ-GPS-006
La aplicación deberá advertir cuando la precisión GPS sea insuficiente para considerar confiables los datos.

### RQ-GPS-007
La aplicación deberá identificar visualmente las partes de la ruta registradas con baja calidad GPS.

### RQ-GPS-008
Si se pierde temporalmente la señal GPS, la caminata deberá permanecer activa.

### RQ-GPS-009
Cuando la señal GPS regrese, la aplicación deberá reanudar automáticamente el registro.

### RQ-GPS-010
Si existe una interrupción prolongada de señal GPS, la representación visual de la ruta podrá unir el último punto válido con el siguiente punto válido mediante una línea continua.

---

## 7. Filtrado de datos anómalos

### RQ-DATA-001
Los puntos GPS claramente anómalos deberán conservarse en los datos originales.

### RQ-DATA-002
Los puntos GPS identificados como anómalos no deberán utilizarse para calcular la distancia recorrida.

### RQ-DATA-003
La identificación de un punto GPS anómalo deberá considerar múltiples criterios y no depender únicamente de una velocidad aparente elevada.

### RQ-DATA-004
Los valores de altitud claramente anómalos no deberán utilizarse para calcular ganancia o pérdida de elevación.

### RQ-DATA-005
La eliminación lógica de puntos anómalos para cálculos no deberá modificar ni eliminar los datos GPS originales almacenados.

---

## 8. Mapa y visualización de ruta

### RQ-MAP-001
Durante una caminata, la aplicación deberá mostrar la posición actual del usuario sobre un mapa.

### RQ-MAP-002
La posición actual deberá estar visualmente destacada.

### RQ-MAP-003
La aplicación deberá mostrar en tiempo real la ruta ya recorrida.

### RQ-MAP-004
El mapa deberá seguir automáticamente la posición del usuario durante la caminata.

### RQ-MAP-005
El usuario deberá poder mover manualmente el mapa.

### RQ-MAP-006
El usuario deberá poder modificar manualmente el nivel de zoom.

### RQ-MAP-007
La ruta recorrida deberá distinguirse visualmente del resto de los elementos del mapa.

### RQ-MAP-008
Al abrir una caminata guardada, el mapa deberá ajustar automáticamente la vista para mostrar toda la ruta.

### RQ-MAP-009
Durante una caminata, mapa y métricas deberán tener una importancia visual similar.

### RQ-MAP-010
El usuario deberá poder alternar entre la visualización del mapa y el perfil de altitud durante una caminata.

---

## 9. Funcionamiento offline y mapas

Alcance actualizado el 2026-10-05 según la decisión aprobada D9 de `DECISIONS.md`, que sustituye D6. Se conservan los identificadores RQ-OFFLINE-002/003/004, con su contenido ajustado al MVP vigente.

### RQ-OFFLINE-001
Una caminata ya iniciada deberá continuar registrándose aunque se pierda la conexión a Internet.

El registro GPS no deberá depender de la carga de tiles ni de la disponibilidad del fondo cartográfico, sujeto a las condiciones de visibilidad y permisos del navegador.

### RQ-OFFLINE-002
El MVP no garantizará disponibilidad del fondo cartográfico sin conexión a Internet. Solo podrá aprovechar la caché ya disponible en el navegador cuando exista, sin garantizar cobertura ni permanencia de los tiles.

### RQ-OFFLINE-003
El MVP no incluirá selección manual, preparación ni descarga explícita de áreas del mapa para uso offline. El soporte offline completo queda fuera del alcance inicial y se traslada a una segunda versión (FUT-021).

### RQ-OFFLINE-004
Si durante una caminata el fondo cartográfico deja de estar disponible por falta de conexión y de tiles en la caché del navegador, la aplicación deberá:

1. mostrar una advertencia;
2. continuar registrando la caminata;
3. continuar mostrando la posición actual;
4. continuar mostrando la ruta registrada;
5. permitir que el fondo cartográfico no esté disponible sin detener el tracking GPS.

### RQ-OFFLINE-005
No será requisito de la primera versión poder iniciar una caminata completamente sin conexión a Internet desde el primer momento.

---

## 10. Duración y tiempo

### RQ-TIME-001
La aplicación deberá registrar fecha y hora de inicio de cada caminata.

### RQ-TIME-002
La aplicación deberá registrar fecha y hora de finalización.

### RQ-TIME-003
La aplicación deberá calcular el tiempo activo.

### RQ-TIME-004
La aplicación deberá calcular el tiempo total transcurrido, incluyendo pausas.

### RQ-TIME-005
Durante una caminata activa, la aplicación deberá mostrar la duración acumulada.

---

## 11. Distancia, velocidad y ritmo

### RQ-METRIC-001
La aplicación deberá calcular la distancia total recorrida utilizando únicamente puntos GPS considerados válidos.

### RQ-METRIC-002
Durante una caminata, deberá mostrar la distancia acumulada.

### RQ-METRIC-003
La aplicación deberá calcular la velocidad promedio utilizando el tiempo activo.

### RQ-METRIC-004
La aplicación deberá calcular el ritmo promedio utilizando el tiempo activo.

### RQ-METRIC-005
Durante una caminata, la aplicación deberá mostrar una métrica instantánea de movimiento, correspondiente a velocidad actual o ritmo actual según la configuración aplicable.

### RQ-METRIC-006
El sistema de unidades deberá ser configurable.

### RQ-METRIC-007
La distancia deberá poder mostrarse en:

- kilómetros/metros;
- millas/pies.

### RQ-METRIC-008
El ritmo deberá poder mostrarse en:

- minutos por kilómetro;
- minutos por milla.


### RQ-METRIC-009
Si no existen suficientes datos válidos para calcular directamente una métrica requerida, la aplicación deberá estimar el valor mediante un método técnico definido y documentado posteriormente.

---

## 12. Altitud y perfil de elevación

### RQ-ALT-001
La aplicación deberá registrar la altitud a lo largo del recorrido.

### RQ-ALT-002
La altitud deberá poder mostrarse en:

- metros;
- pies.

### RQ-ALT-003
La aplicación deberá mostrar un perfil de altitud durante la caminata.

### RQ-ALT-004
La aplicación deberá mostrar el perfil de altitud después de finalizar la caminata.

### RQ-ALT-005
El perfil de altitud deberá representarse respecto a la distancia recorrida.

### RQ-ALT-006
La aplicación deberá calcular la ganancia total de elevación utilizando únicamente datos de altitud válidos y filtrados.

### RQ-ALT-007
La aplicación deberá calcular la pérdida total de elevación utilizando únicamente datos de altitud válidos y filtrados.

---

## 13. Persistencia y recuperación

### RQ-PERSIST-001
Cada caminata finalizada deberá poder guardarse para consulta posterior.

### RQ-PERSIST-002
Los datos deberán almacenarse inicialmente en el teléfono.

### RQ-PERSIST-003
Si la página se recarga o el navegador se cierra accidentalmente durante una caminata, la sesión deberá poder recuperarse hasta el último bloque persistido cuando el almacenamiento local siga disponible.

### RQ-PERSIST-004
Si el teléfono se reinicia o se queda sin batería, deberán conservarse los datos registrados hasta el último bloque persistido cuando el almacenamiento local del navegador permanezca disponible.

### RQ-PERSIST-005
Ante un error durante una caminata, la aplicación deberá conservar la información registrada hasta el último bloque persistido.

### RQ-PERSIST-006
Una caminata interrumpida deberá poder quedar marcada como incompleta.

### RQ-PERSIST-007
Al reabrir la aplicación cuando exista una caminata incompleta, esta deberá mostrarse de forma inmediata y ofrecer las opciones:

- Continuar;
- Guardar;
- Descartar.

### RQ-PERSIST-008
Si el usuario decide continuar una caminata incompleta, deberá conservarse la fecha y hora de inicio original.

### RQ-PERSIST-009
Si una caminata web recuperada se continúa, el intervalo durante el cual la página no estuvo registrando posiciones no deberá asumirse como distancia recorrida medida. El tratamiento del tiempo de interrupción deberá quedar identificado para evitar confundirlo con tracking GPS efectivo.

### RQ-PERSIST-010
Durante una caminata activa, los datos deberán persistirse periódicamente en bloques.

### RQ-PERSIST-011
La frecuencia exacta de persistencia y la pérdida máxima tolerable de datos ante una interrupción deberán definirse técnicamente y documentarse antes de la implementación.

---

## 14. Historial

### RQ-HISTORY-001
La aplicación deberá disponer de un historial de caminatas guardadas.

### RQ-HISTORY-002
Cada elemento del historial deberá mostrar, como mínimo:

- nombre;
- fecha;
- distancia;
- duración.

### RQ-HISTORY-003
El usuario deberá poder abrir una caminata del historial para consultar todos sus detalles.

### RQ-HISTORY-004
El usuario deberá poder buscar caminatas por nombre.

### RQ-HISTORY-005
El usuario deberá poder filtrar caminatas por fecha.

### RQ-HISTORY-006
El usuario deberá poder eliminar una caminata guardada.

### RQ-HISTORY-007
La aplicación deberá solicitar confirmación antes de eliminar una caminata.

### RQ-HISTORY-008
El usuario deberá poder eliminar todo el historial.

---

## 15. Resumen de caminata

### RQ-SUMMARY-001
Al finalizar una caminata, la aplicación deberá mostrar una pantalla de resumen.

### RQ-SUMMARY-002
El resumen deberá incluir:

- mapa del recorrido;
- distancia;
- duración;
- velocidad promedio;
- ritmo promedio;
- ganancia de elevación;
- pérdida de elevación;
- perfil de altitud.

---

## 16. Pantalla principal

### RQ-HOME-001
La pantalla principal deberá mostrar un control claramente visible para iniciar una nueva caminata.

### RQ-HOME-002
La pantalla principal deberá mostrar un resumen del estado actual de la aplicación o de la caminata activa.

### RQ-HOME-003
La pantalla principal deberá proporcionar acceso rápido al historial.

### RQ-HOME-004
La pantalla principal deberá proporcionar acceso rápido a configuración.

---

## 17. Configuración

### RQ-SETTINGS-001
La aplicación deberá permitir configurar el sistema de unidades.

### RQ-SETTINGS-002
La aplicación deberá permitir configurar si la pantalla debe mantenerse encendida mientras la aplicación está mostrando una caminata activa.

### RQ-SETTINGS-003
La aplicación deberá recordar la última configuración utilizada.

### RQ-SETTINGS-004
Cada opción de configuración deberá incluir una explicación breve de su función.

---

## 18. Permisos

### RQ-PERM-001
La aplicación deberá requerir permiso de ubicación para operar.

### RQ-PERM-002
Si el permiso de ubicación está desactivado, la aplicación deberá explicar el problema y guiar al usuario para habilitarlo.

### RQ-PERM-003
Si el usuario niega el permiso de ubicación, no deberá poder continuar utilizando las funciones normales de la aplicación.

---

## 19. Ejecución y visibilidad en navegador

### RQ-WEB-001
Durante una caminata activa, la página deberá permanecer abierta, visible y en primer plano para que el registro GPS sea considerado confiable.

### RQ-WEB-002
El MVP no deberá depender de ejecución continua de JavaScript cuando el navegador esté en segundo plano.

### RQ-WEB-003
El MVP no deberá garantizar registro GPS mientras la pantalla del teléfono esté bloqueada.

### RQ-WEB-004
Cuando el navegador sea compatible, la aplicación deberá poder solicitar mantener la pantalla encendida durante una caminata activa mediante la Screen Wake Lock API.

### RQ-WEB-005
Si el Wake Lock no está disponible, es liberado por el navegador o falla, la aplicación deberá informar al usuario que debe mantener la pantalla activa manualmente.

### RQ-WEB-006
Si la página deja de estar visible durante una caminata, la aplicación deberá detectar el cambio de visibilidad cuando sea posible y advertir al usuario al regresar que puede existir un intervalo sin datos GPS.

## 20. Manejo de errores

### RQ-ERROR-001
La aplicación deberá mostrar mensajes claros cuando exista una condición que impida o degrade el registro correcto.

### RQ-ERROR-002
Como mínimo, deberán contemplarse mensajes para:

- GPS o ubicación desactivados;
- precisión GPS insuficiente;
- pérdida temporal de señal;
- falta de almacenamiento suficiente;
- fondo cartográfico no disponible por falta de conexión y de tiles en la caché del navegador.

### RQ-ERROR-003
Los mensajes de error no deberán provocar pérdida de los datos ya registrados.

---

## 21. Requisitos no funcionales

### NFR-001 — Plataforma inicial
La primera versión será una aplicación web móvil HTML + JavaScript, priorizando su uso en iPhone mediante un navegador moderno compatible con Web Geolocation.

### NFR-002 — Tipo de dispositivo
La primera versión estará orientada a teléfonos. El soporte específico para tablet no forma parte del alcance inicial.

### NFR-003 — Actividad
La primera versión estará diseñada exclusivamente para caminatas a pie.

### NFR-004 — Duración esperada
La aplicación deberá soportar adecuadamente caminatas típicas de entre 1 y 3 horas.

### NFR-005 — Consumo de batería
El consumo de batería será una consideración importante de diseño y validación.

### NFR-006 — Equilibrio precisión/batería
La solución deberá buscar un equilibrio razonable entre precisión GPS y consumo energético.

### NFR-007 — Robustez
La aplicación deberá priorizar la conservación de los datos ante cierres inesperados, errores o interrupciones.

### NFR-008 — Usabilidad
Las funciones principales de iniciar, pausar, reanudar, finalizar y cancelar una caminata deberán ser claramente identificables.

### NFR-009 — Persistencia
La información registrada durante una caminata deberá persistirse con suficiente frecuencia para reducir al mínimo la pérdida de datos ante interrupciones.

### NFR-010 — Pruebas reales
La primera versión no se considerará validada hasta haber sido probada en caminatas reales en exteriores.

---

## 22. Criterio mínimo de éxito de la primera versión

La primera versión deberá demostrar correctamente, como mínimo, que puede:

1. registrar una ruta real mediante GPS;
2. calcular la distancia recorrida;
3. medir correctamente la duración;
4. registrar altitud a lo largo del recorrido.

El cumplimiento de este criterio mínimo no elimina los demás requisitos aprobados en este documento.

---

## 23. Fuera de alcance de la primera versión

Los siguientes elementos no forman parte del alcance inicial:

- tracking GPS garantizado con la pantalla bloqueada;
- tracking GPS garantizado al cambiar a otra aplicación o pestaña;
- ejecución continua garantizada de JavaScript en segundo plano;

- múltiples usuarios;
- cuentas de usuario;
- autenticación;
- sincronización en la nube;
- protección mediante PIN;
- autenticación biométrica;
- soporte para tablet;
- estadísticas acumuladas de múltiples caminatas;
- comparación entre caminatas;
- exportación de recorridos;
- copia de seguridad;
- restauración de copias;
- notas o comentarios por caminata;
- marcación de caminatas favoritas;
- avisos periódicos por distancia;
- avisos periódicos por tiempo;
- notificaciones sonoras o por vibración asociadas a hitos;
- modo claro/oscuro configurable;
- configuración manual de frecuencia de registro GPS;
- registro técnico interno de errores;
- rumbo o dirección de movimiento;
- indicador global de calidad GPS;
- detección automática de inactividad;
- sugerencia automática de pausa;
- soporte offline completo de mapas, incluida preparación o descarga controlada de áreas;
- Service Worker y PWA;
- caché controlada, precarga de tiles y gestión de regiones offline;
- reutilización administrada de áreas offline;
- eliminación manual de mapas offline;
- consulta del espacio ocupado por mapas offline.

---

## 24. Posibilidades futuras

Las siguientes funcionalidades se consideran candidatas para futuras versiones:

### FUT-001
Autenticación de usuario.

### FUT-002
Sincronización en la nube.

### FUT-003
Protección mediante PIN o biometría.

### FUT-004
Soporte para tablet.

### FUT-005
Exportación de caminatas.

### FUT-006
Copias de seguridad y restauración.

### FUT-007
Estadísticas acumuladas, incluyendo al menos:

- distancia total;
- tiempo total;
- número de caminatas.

### FUT-008
Comparación entre caminatas.

### FUT-009
Notas o comentarios asociados a una caminata.

### FUT-010
Caminatas favoritas.

### FUT-011
Avisos por distancia recorrida.

### FUT-012
Avisos por tiempo transcurrido.

### FUT-013
Avisos sonoros o mediante vibración.

### FUT-014
Modo claro y oscuro.

### FUT-015
Configuración manual de frecuencia de registro GPS.

### FUT-016
Registro interno de errores técnicos.

### FUT-017
Registro y uso del rumbo de movimiento.

### FUT-018
Indicador global de calidad GPS.

### FUT-019
Detección automática de inactividad.

### FUT-020
Sugerencia automática de pausa.

### FUT-021
Soporte offline completo de mapas en una segunda versión: preparación o descarga controlada de áreas, Service Worker, PWA, caché controlada, precarga de tiles y gestión de regiones offline, incluyendo reutilización, eliminación y consulta de espacio ocupado. No forma parte del MVP inicial.

---

## 25. Supuestos actuales

### ASM-001
El usuario dispondrá de permiso para acceder a la ubicación del dispositivo.

### ASM-002
El dispositivo contará con capacidades GPS suficientes para registrar caminatas en exteriores.

### ASM-003
Las caminatas típicas se realizarán principalmente en exteriores.

### ASM-004
El almacenamiento inicial de datos será local al dispositivo.

### ASM-005
Puede existir caché de tiles en el navegador, pero su disponibilidad, cobertura y permanencia no se presuponen ni se garantizan. Este supuesto sustituye el anterior sobre preparación inicial de mapas offline, trasladada a la segunda versión según D9.

---

## 26. Restricciones actuales

### CON-001
La primera versión será una aplicación web HTML + JavaScript orientada inicialmente a uso móvil en iPhone.

### CON-002
El tracking GPS confiable requerirá que la página permanezca visible y activa durante la caminata.

### CON-003
La primera versión estará limitada a caminatas a pie.

### CON-004
La primera versión no dependerá de cuentas de usuario ni de servicios de sincronización en la nube.

### CON-005
Los datos de caminatas deberán almacenarse inicialmente mediante almacenamiento local disponible en el navegador.

### CON-006
El acceso a ubicación requerirá un contexto seguro HTTPS y autorización del usuario.

### CON-007
La arquitectura web concreta y las tecnologías auxiliares deberán documentarse posteriormente en `ARCHITECTURE.md`.

---

## 27. Revisión de alcance para MVP web

El alcance fue ajustado para priorizar una implementación web HTML + JavaScript compatible con las capacidades reales del navegador móvil.

### Decisiones de alcance

1. el tracking GPS confiable se realizará únicamente mientras la página permanezca visible y activa;
2. no se exigirá tracking continuo con pantalla bloqueada;
3. no se exigirá tracking continuo al cambiar de aplicación;
4. se intentará mantener la pantalla encendida mediante Screen Wake Lock cuando el navegador lo permita;
5. la aplicación deberá advertir cuando exista riesgo de haber perdido posiciones por cambios de visibilidad;
6. la persistencia local permitirá recuperar hasta el último bloque guardado después de una recarga, cierre o interrupción, siempre que el navegador conserve el almacenamiento;
7. las capacidades nativas de background tracking quedan fuera del MVP web y podrán reevaluarse en una futura aplicación móvil nativa o híbrida;
8. el tracking GPS será independiente del fondo cartográfico; sin Internet solo podrá aprovecharse la caché ya disponible en el navegador, sin garantía de disponibilidad del mapa;
9. no habrá descarga manual de áreas en el MVP; el soporte offline completo, Service Worker, PWA y gestión de regiones offline se trasladan a una segunda versión conforme a D9.

### Parámetros técnicos pendientes

Antes de la implementación deberán concretarse:

- navegador mínimo soportado;
- estrategia de almacenamiento local;
- frecuencia de persistencia;
- comportamiento exacto ante `visibilitychange`;
- política de Wake Lock y recuperación del bloqueo;
- umbrales de precisión GPS;
- criterios cuantitativos de anomalías;
- método de suavizado de altitud;
- método de estimación e interpolación de métricas.

Estos parámetros deberán quedar documentados en `DECISIONS.md` y `ARCHITECTURE.md`.
