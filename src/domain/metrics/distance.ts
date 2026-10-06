import type { TrackPoint } from '../../types'

export type Coordinates = Readonly<Pick<TrackPoint, 'latitude' | 'longitude'>>

/** Radio medio esférico en metros; no representa una corrección elipsoidal. */
const EARTH_RADIUS_METERS = 6_371_000
const RADIANS_PER_DEGREE = Math.PI / 180

function hasSafeCoordinates(point: Coordinates): boolean {
  return Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90
    && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180
}

/** Distancia horizontal Haversine en metros; null si las coordenadas son inválidas. */
export function calculateDistanceMeters(from: Coordinates, to: Coordinates): number | null {
  if (!hasSafeCoordinates(from) || !hasSafeCoordinates(to)) return null
  const latitude1 = from.latitude * RADIANS_PER_DEGREE
  const latitude2 = to.latitude * RADIANS_PER_DEGREE
  const deltaLatitude = (to.latitude - from.latitude) * RADIANS_PER_DEGREE
  const deltaLongitude = (to.longitude - from.longitude) * RADIANS_PER_DEGREE
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2
  // Redondeos cerca de antípodas pueden sacar a del intervalo [0, 1].
  const bounded = Math.min(1, Math.max(0, a))
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(bounded), Math.sqrt(1 - bounded))
}

function canMeasureDistance(point: TrackPoint): boolean {
  return !point.estimated && (point.quality === 'valid' || point.quality === 'suspicious')
    && hasSafeCoordinates(point)
}

/**
 * Suma segmentos consecutivos medidos, en el orden recibido, sin modificar puntos.
 * Un punto excluido corta el segmento: no interpola huecos ni mezcla caminatas.
 * D1 difiere low-quality; D2 admite suspicious. Estimaciones quedan para otra tarea.
 */
export function calculateAccumulatedDistanceMeters(points: readonly TrackPoint[]): number {
  let total = 0
  let previous: TrackPoint | undefined
  for (const point of points) {
    if (!canMeasureDistance(point)) {
      previous = undefined
      continue
    }
    if (previous && previous.walkId === point.walkId) {
      const distance = calculateDistanceMeters(previous, point)
      if (distance !== null) total += distance
    }
    previous = point
  }
  return total
}
