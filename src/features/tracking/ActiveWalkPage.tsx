import { lazy, Suspense, useState } from 'react'
import { activeWalkRuntime } from './activeWalkRuntime'
import type { ActiveWalkRuntime } from './activeWalkRuntime'
import { useActiveWalk } from './useActiveWalk'
import { metersToKilometers, metersPerSecondToKilometersPerHour, secondsPerKilometerToMinutesPerKilometer } from '../../domain/metrics/conversions'

const ActiveWalkMap = lazy(() => import('../maps/ActiveWalkMap'))

const states = { idle: 'Sin caminata', active: 'Activa', paused: 'Pausada', incomplete: 'Incompleta', finished: 'Finalizada', cancelled: 'Cancelada' }
const qualities = { valid: 'Válida', 'low-quality': 'Baja precisión', suspicious: 'Sospechosa', anomalous: 'Anómala', estimated: 'Estimada' }
const gpsMessages = { 'permission-denied': 'Permiso de ubicación denegado. Habilita el permiso del navegador.',
  'position-unavailable': 'Ubicación no disponible temporalmente. Esperando una nueva posición.',
  timeout: 'La ubicación tardó demasiado. Esperando una nueva posición.', unsupported: 'Este navegador no ofrece geolocalización.',
  unknown: 'No se pudo obtener la ubicación.' }
const number = (value: number | null, unit: string) => value === null ? 'No disponible' : `${value.toFixed(2)} ${unit}`
// Solo formato de presentación; las duraciones provienen del dominio T16.
function duration(ms: number) {
  const seconds = Math.floor(ms / 1000)
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`
}

export default function ActiveWalkPage({ runtime = activeWalkRuntime }: { runtime?: ActiveWalkRuntime }) {
  const { view, start, pause, resume, finish } = useActiveWalk(runtime)
  const [confirming, setConfirming] = useState(false)
  const { snapshot, persistence, finishing, actionError } = view
  const status = snapshot.trackingStatus
  const completed = status === 'finished' && persistence?.finalized
  const finalPending = status === 'finished' && !completed
  const canFinish = ['active', 'paused', 'incomplete'].includes(status) || finalPending
  const latest = snapshot.rawPoints.at(-1)
  const metrics = snapshot.metrics
  return (
    <section aria-labelledby="walk-title">
      <h2 id="walk-title">Caminata activa</h2>
      <p role="status">Estado: {finishing ? 'Finalizando…' : finalPending ? 'Finalización pendiente de guardado' : states[status]}</p>
      <p>GPS: {snapshot.gpsStatus === 'idle' ? 'Sin observación' : snapshot.gpsStatus === 'waiting' ? 'Esperando posición' : snapshot.gpsStatus === 'error' ? 'Con error' : 'Posición disponible'}
        {latest && ` · Calidad: ${qualities[latest.assessment.quality]} · Precisión: ${latest.raw.accuracy ?? 'No disponible'} m`}</p>
      {snapshot.gpsError && <p role="alert">{gpsMessages[snapshot.gpsError.kind]}</p>}
      {(persistence?.error || actionError === 'persistence-failed') && <p role="alert">No se pudieron guardar los datos. Se conservan pendientes; vuelve a intentar el guardado.</p>}
      {actionError && actionError !== 'persistence-failed' && <p role="alert">{actionError === 'regressive-time' ? 'El reloj retrocedió. Revisa la hora del dispositivo antes de continuar.' : 'No se pudo realizar la acción. Revisa el estado de la caminata y los permisos de ubicación.'}</p>}
      {status === 'paused' && <p>La ruta y las métricas de movimiento están pausadas; el tiempo total sigue transcurriendo.</p>}
      {status === 'idle' ? <p>No hay métricas activas. La ubicación se solicitará al iniciar.</p> : <dl className="walk-metrics">
        <div><dt>Tiempo activo</dt><dd>{duration(metrics.activeDurationMs)}</dd></div>
        <div><dt>Tiempo total</dt><dd>{duration(metrics.totalDurationMs)}</dd></div>
        <div><dt>Distancia</dt><dd>{number(metersToKilometers(metrics.distanceMeters.value), 'km')}</dd></div>
        <div><dt>Velocidad promedio</dt><dd>{number(metersPerSecondToKilometersPerHour(metrics.averageSpeedMetersPerSecond.value), 'km/h')}</dd></div>
        <div><dt>Ritmo promedio</dt><dd>{number(secondsPerKilometerToMinutesPerKilometer(metrics.averagePaceSecondsPerKilometer.value), 'min/km')}</dd></div>
        <div><dt>Elevación ganada</dt><dd>{number(metrics.elevationGainMeters.value, 'm')}{metrics.elevationGainMeters.estimated && ' (estimada)'}</dd></div>
        <div><dt>Elevación perdida</dt><dd>{number(metrics.elevationLossMeters.value, 'm')}{metrics.elevationLossMeters.estimated && ' (estimada)'}</dd></div>
      </dl>}
      <Suspense fallback={<p>Cargando mapa…</p>}><ActiveWalkMap snapshot={snapshot} /></Suspense>
      <div className="walk-controls">
        <button type="button" onClick={start} disabled={finishing || !(status === 'idle' || completed)}>Iniciar caminata</button>
        <button type="button" onClick={status === 'paused' ? resume : pause} disabled={finishing || !['active', 'paused'].includes(status)}>{status === 'paused' ? 'Reanudar' : 'Pausar'}</button>
        <button type="button" onClick={() => setConfirming(true)} disabled={finishing || !canFinish}>{finalPending ? 'Reintentar finalización' : 'Finalizar'}</button>
      </div>
      {confirming && <div role="group" aria-labelledby="finish-question" className="walk-confirmation">
        <p id="finish-question">¿Finalizar y guardar la caminata?</p>
        <button type="button" autoFocus onClick={() => setConfirming(false)}>Seguir caminando</button>
        <button type="button" onClick={() => { setConfirming(false); void finish() }}>Confirmar finalización</button>
      </div>}
      {completed && <p>La caminata quedó finalizada y guardada. Puedes iniciar otra.</p>}
    </section>
  )
}
