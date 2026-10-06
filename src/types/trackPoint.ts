import type { GpsQuality } from './states'

interface TrackPointData {
  readonly id: string
  readonly walkId: string
  /** Timestamp Unix en milisegundos. */
  readonly timestamp: number
  /** Grados decimales; datos originales en puntos observados. */
  readonly latitude: number
  readonly longitude: number
  /** Metros; null si no fue proporcionada o no puede estimarse. */
  readonly altitude: number | null
  /** Metros por segundo; null si no fue proporcionada o no puede estimarse. */
  readonly speed: number | null
}

/**
 * Los puntos observados conservan los valores GPS originales, incluso si son anómalos.
 * Los valores filtrados/interpolados se derivarán por separado, sin sobrescribirlos.
 * readonly protege las asignaciones en TypeScript; no congela objetos en runtime.
 */
export type TrackPoint = TrackPointData & (
  | {
      readonly estimated: false
      readonly quality: Exclude<GpsQuality, 'estimated'>
      /** Precisión horizontal reportada, en metros. */
      readonly accuracy: number
    }
  | {
      readonly estimated: true
      readonly quality: 'estimated'
      /** null cuando no existe precisión medida para un punto sintético. */
      readonly accuracy: number | null
    }
)
