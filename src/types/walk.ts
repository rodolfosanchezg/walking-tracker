import type { MetricValue } from './metricValue'
import type { WalkStatus } from './states'

export interface Walk {
  id: string
  name: string
  /** Timestamp Unix en milisegundos; null mientras no se haya iniciado. */
  startedAt: number | null
  /** Timestamp Unix en milisegundos; null mientras no haya finalización. */
  endedAt: number | null
  activeDurationMs: number
  totalDurationMs: number
  distanceMeters: MetricValue
  averageSpeedMetersPerSecond: MetricValue
  /** Segundos por kilómetro; null si no hay distancia suficiente para definir ritmo. */
  averagePaceSecondsPerKilometer: MetricValue
  elevationGainMeters: MetricValue
  elevationLossMeters: MetricValue
  status: WalkStatus
  /** Conserva la condición incompleta incluso si la caminata se continúa posteriormente. */
  isIncomplete: boolean
}
