import type { TrackPoint } from '../../types'

/** Datos originales antes de asignar identidad, caminata o calidad GPS. */
export type RawPosition = Readonly<Pick<TrackPoint,
  'latitude' | 'longitude' | 'altitude' | 'accuracy' | 'speed' | 'timestamp'
> & { accuracy: number }>

export interface GeolocationError {
  readonly kind: 'permission-denied' | 'position-unavailable' | 'timeout' | 'unsupported' | 'unknown'
  readonly code: number | null
  readonly message: string
}

export interface GeolocationCallbacks {
  onPosition(position: RawPosition): void
  onError(error: GeolocationError): void
}

export interface GeolocationService {
  /** false si ya existe observación o la API no está disponible. */
  start(callbacks: GeolocationCallbacks, options?: PositionOptions): boolean
  stop(): void
}
