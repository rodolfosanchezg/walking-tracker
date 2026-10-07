import { Link } from 'react-router-dom'
import { activeWalkRuntime } from '../features/tracking/activeWalkRuntime'
import { useWalkStatus } from '../features/tracking/useWalkStatus'
import type { WalkStatusReader } from '../features/tracking/useWalkStatus'

export default function HomePage({ runtime = activeWalkRuntime }: { runtime?: WalkStatusReader }) {
  const view = useWalkStatus(runtime)
  const status = view.snapshot.trackingStatus
  const finalPending = status === 'finished' && !view.persistence?.finalized
  const inProgress = ['active', 'paused', 'incomplete'].includes(status) || finalPending || view.finishing
  const message = view.finishing ? 'Guardando la caminata…'
    : finalPending ? 'Finalización pendiente de guardado. Abre la caminata para reintentar.'
      : status === 'active' ? 'Caminata activa en progreso.'
        : status === 'paused' ? 'Caminata pausada.'
          : status === 'incomplete' ? 'La caminata actual está incompleta. Abre la caminata para revisar su estado.'
            : status === 'finished' ? 'Caminata finalizada. Listo para otra caminata.' : 'Listo para caminar.'
  return <section aria-labelledby="home-title" className="home-view">
    <h2 id="home-title">Inicio</h2>
    <p>Registra tu caminata con Walking Tracker.</p>
    <Link className="home-primary" to="/walk">{inProgress ? 'Abrir caminata' : 'Iniciar caminata'}</Link>
    <p role="status">{message}</p>
    <nav aria-label="Accesos de inicio">
      <Link to="/history">Ver historial</Link>
      <Link to="/settings">Abrir configuración</Link>
    </nav>
  </section>
}
