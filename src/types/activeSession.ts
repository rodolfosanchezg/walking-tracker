import type { ActiveSessionStatus } from './states'
import type { Walk } from './walk'

/** Snapshot de sesión; declara datos de recuperación, sin ejecutar recuperación ni persistencia. */
export interface ActiveSession {
  walkId: Walk['id']
  status: ActiveSessionStatus
  /** Inicio original de la caminata, timestamp Unix en milisegundos. */
  startedAt: number
  /** Última transición de estado, timestamp Unix en milisegundos. */
  stateChangedAt: number
  activeDurationMs: Walk['activeDurationMs']
  totalDurationMs: Walk['totalDurationMs']
  /** null antes del primer guardado; timestamp del último snapshot persistido. */
  lastPersistedAt: number | null
  /** null sin puntos persistidos; permite identificar el comienzo de un hueco de tracking. */
  lastPointTimestamp: number | null
}
