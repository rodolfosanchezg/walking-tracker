import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { walkDetailStore } from '../../data/repositories/walkDetailStore'
import type { WalkDetailData, WalkDetailStore } from '../../data/repositories/walkDetailStore'
import { metersToKilometers, metersPerSecondToKilometersPerHour, secondsPerKilometerToMinutesPerKilometer } from '../../domain/metrics/conversions'
import { toSavedWalkData } from './savedWalkData'
const Map = lazy(() => import('../maps/ActiveWalkMap'))
const Profile = lazy(() => import('../tracking/ElevationProfile'))
function duration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return 'No disponible'
  const seconds = Math.floor(ms / 1000), pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`
}
function date(value: number | null) { return value === null || !Number.isFinite(value) || Number.isNaN(new Date(value).getTime()) ? 'No disponible' : new Date(value).toLocaleString() }
function number(value: number | null, unit: string) { return value === null || !Number.isFinite(value) ? 'No disponible' : `${value.toFixed(2)} ${unit}` }

function LoadedDetail({ data, store }: { data: WalkDetailData; store: WalkDetailStore }) {
  const [walk, setWalk] = useState(data.walk)
  const [editing, setEditing] = useState(false), [name, setName] = useState(data.walk.name)
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null)
  const visual = useMemo(() => toSavedWalkData(data), [data])
  async function rename() {
    if (busy) return
    if (!name.trim()) { setError('El nombre no puede estar vacío.'); return }
    setBusy(true); setError(null)
    try { const saved = await store.rename(walk.id, name); setWalk(current => ({ ...current, name: saved })); setEditing(false) }
    catch { setError('No se pudo cambiar el nombre. Revisa si la caminata está vinculada a una sesión pendiente o intenta nuevamente.') }
    finally { setBusy(false) }
  }
  return <>
    <h3>{walk.name}</h3>
    <p>Estado: {walk.isIncomplete || walk.status === 'incomplete' ? 'Incompleta (datos disponibles)' : walk.status === 'finished' ? 'Finalizada' : walk.status === 'paused' ? 'Pausada (registro guardado)' : 'En curso (registro guardado)'}</p>
    <dl className="walk-metrics">
      <div><dt>Inicio</dt><dd>{date(walk.startedAt)}</dd></div>
      <div><dt>Finalización</dt><dd>{date(walk.endedAt)}</dd></div>
      <div><dt>Tiempo activo</dt><dd>{duration(walk.activeDurationMs)}</dd></div>
      <div><dt>Tiempo transcurrido</dt><dd>{duration(walk.totalDurationMs)}</dd></div>
      <div><dt>Distancia</dt><dd>{number(metersToKilometers(walk.distanceMeters.value), 'km')}</dd></div>
      <div><dt>Velocidad promedio</dt><dd>{number(metersPerSecondToKilometersPerHour(walk.averageSpeedMetersPerSecond.value), 'km/h')}</dd></div>
      <div><dt>Ritmo promedio</dt><dd>{number(secondsPerKilometerToMinutesPerKilometer(walk.averagePaceSecondsPerKilometer.value), 'min/km')}</dd></div>
      <div><dt>Elevación ganada</dt><dd>{number(walk.elevationGainMeters.value, 'm')}</dd></div>
      <div><dt>Elevación perdida</dt><dd>{number(walk.elevationLossMeters.value, 'm')}</dd></div>
    </dl>
    <p>Resumen persistido en unidades métricas. {Object.values(walk).some(value => value && typeof value === 'object' && 'estimated' in value && value.estimated) && 'El resumen incluye métricas estimadas.'}</p>
    {!visual.segmentationAvailable && <p>Este registro no conserva metadatos de pausas. La ruta y el perfil se basan en los puntos disponibles y pueden incluir desplazamientos durante pausas; el resumen conserva los valores guardados.</p>}
    <Suspense fallback={<p>Cargando mapa…</p>}><Map snapshot={visual.snapshot} mode="saved" /></Suspense>
    <Suspense fallback={<p>Cargando perfil…</p>}><Profile snapshot={visual.snapshot} /></Suspense>
    {editing ? <div className="walk-confirmation">
      <label>Nombre de caminata<input value={name} disabled={busy} onChange={event => setName(event.target.value)} /></label>
      <button type="button" disabled={busy} onClick={() => void rename()}>Guardar nombre</button>
      <button type="button" disabled={busy} onClick={() => { setEditing(false); setError(null) }}>Cancelar cambio</button>
      {error && <p role="alert">{error}</p>}
    </div> : <button type="button" onClick={() => { setName(walk.name); setEditing(true) }}>Renombrar caminata</button>}
    <p>Para eliminar la caminata con confirmación, vuelve al historial.</p>
  </>
}
function DetailLoader({ id, store }: { id: string; store: WalkDetailStore }) {
  const [result, setResult] = useState<{ data?: WalkDetailData; error?: boolean } | null>(null)
  useEffect(() => {
    let mounted = true
    void store.get(id).then(data => { if (mounted) setResult({ data }) }).catch(() => { if (mounted) setResult({ error: true }) })
    return () => { mounted = false }
  }, [id, store])
  if (!result) return <p role="status">Cargando caminata…</p>
  if (result.error) return <p role="alert">No se pudo cargar la caminata. Vuelve al historial e intenta nuevamente.</p>
  if (!result.data) return <p role="status">No se encontró la caminata.</p>
  return <LoadedDetail data={result.data} store={store} />
}
export default function WalkDetailPage({ store = walkDetailStore }: { store?: WalkDetailStore }) {
  const { walkId } = useParams()
  return <section aria-labelledby="detail-title">
    <h2 id="detail-title">Detalle de caminata</h2>
    <Link to="/history">Volver al historial</Link>{' · '}<Link to="/">Volver a Inicio</Link>
    <DetailLoader key={walkId} id={walkId ?? ''} store={store} />
  </section>
}
