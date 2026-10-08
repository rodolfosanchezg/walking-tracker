import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { historyStore } from '../../data/repositories/historyStore'
import type { HistoryStore } from '../../data/repositories/historyStore'
import type { Walk } from '../../types'
import { metersToKilometers } from '../../domain/metrics/conversions'
import { filterHistory, historyDate, validDateRange } from './historyFilters'

function duration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return 'No disponible'
  const seconds = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`
}

export default function HistoryPage({ store = historyStore }: { store?: HistoryStore }) {
  const [walks, setWalks] = useState<Walk[]>([])
  const [loading, setLoading] = useState(true)
  const [readError, setReadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [deleting, setDeleting] = useState<Walk | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  useEffect(() => {
    let mounted = true
    void store.list().then(result => { if (mounted) setWalks(result) })
      .catch(() => { if (mounted) setReadError(true) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [store, retry])
  const visible = filterHistory(walks, name, from, to)
  async function confirmDelete() {
    if (!deleting || busy) return
    setBusy(true); setDeleteError(false)
    try {
      await store.delete(deleting.id)
      setWalks(current => current.filter(walk => walk.id !== deleting.id))
      setDeleting(null)
    } catch { setDeleteError(true) }
    finally { setBusy(false) }
  }
  return <section aria-labelledby="history-title">
    <h2 id="history-title">Historial</h2>
    <Link to="/">Volver a Inicio</Link>
    {loading ? <p role="status">Cargando caminatas…</p> : readError ? <div>
      <p role="alert">No se pudo cargar el historial. Intenta nuevamente.</p>
      <button type="button" onClick={() => { setLoading(true); setReadError(false); setRetry(value => value + 1) }}>Reintentar</button>
    </div> : walks.length === 0 ? <p role="status">No hay caminatas guardadas. Puedes iniciar una desde Inicio.</p> : <>
      <div className="history-filters">
        <label>Buscar por nombre<input type="search" value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Desde<input type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
        <label>Hasta<input type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
      </div>
      {!validDateRange(from, to) && <p role="alert">Revisa las fechas: Desde debe ser anterior o igual a Hasta.</p>}
      {visible.length === 0 ? <p role="status">No hay caminatas que coincidan con los filtros.</p> : <ul className="history-list">
        {visible.map(walk => {
          const kilometers = metersToKilometers(walk.distanceMeters.value)
          return <li key={walk.id}>
            <h3><Link to={`/walk/${encodeURIComponent(walk.id)}`}>{walk.name}</Link></h3>
            <p>Fecha: {historyDate(walk.startedAt) ?? 'No disponible'}</p>
            <p>Distancia: {kilometers === null ? 'No disponible' : `${kilometers.toFixed(2)} km`}{walk.distanceMeters.estimated && ' (estimada)'}</p>
            <p>Duración activa: {duration(walk.activeDurationMs)}</p>
            <p>Estado: {walk.isIncomplete || walk.status === 'incomplete' ? 'Incompleta (registro guardado)' : walk.status === 'finished' ? 'Finalizada' : walk.status === 'paused' ? 'Pausada' : walk.status === 'active' ? 'Activa' : 'Sin iniciar'}</p>
            <button type="button" disabled={busy} onClick={() => { setDeleting(walk); setDeleteError(false) }} aria-label={`Eliminar ${walk.name}`}>Eliminar</button>
          </li>
        })}
      </ul>}
    </>}
    {deleting && <div role="group" aria-labelledby="delete-question" className="walk-confirmation">
      <p id="delete-question">¿Eliminar {deleting.name} y sus puntos GPS? Esta acción no se puede deshacer.</p>
      <button type="button" autoFocus disabled={busy} onClick={() => { setDeleting(null); setDeleteError(false) }}>Cancelar eliminación</button>
      <button type="button" disabled={busy} onClick={() => void confirmDelete()}>Confirmar eliminación</button>
      {busy && <p role="status">Eliminando…</p>}
      {deleteError && <p role="alert">No se pudo eliminar la caminata. Puede estar vinculada a una sesión pendiente o existir un error de almacenamiento. Los datos se conservaron; puedes reintentar.</p>}
    </div>}
  </section>
}
