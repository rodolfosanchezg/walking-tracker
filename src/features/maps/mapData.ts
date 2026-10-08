import type { TrackingSnapshot } from '../tracking/trackingController'
export type MapCoordinate = [number, number]

/** Adaptación visual: misma elegibilidad que distancia T12; no reclasifica ni calcula métricas. */
export function toMapData(snapshot: Pick<TrackingSnapshot, 'rawPoints'>) {
  const segments: MapCoordinate[][] = []
  let current: MapCoordinate[] | undefined
  let previousSegment: number | null = null
  let position: { id: string; coordinates: MapCoordinate } | null = null
  for (const item of snapshot.rawPoints) {
    const point = item.raw
    const usable = !point.estimated && ['valid', 'suspicious'].includes(item.assessment.quality)
      && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90
      && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180
    if (usable) position = { id: point.id, coordinates: [point.latitude, point.longitude] }
    // Pausas/posiciones antiguas no pertenecen a ningún segmento; T17 separa resume por ID.
    if (item.segment === null) continue
    if (!usable) { current = undefined; previousSegment = null; continue }
    if (!current || previousSegment !== item.segment) { current = []; segments.push(current) }
    current.push([point.latitude, point.longitude]); previousSegment = item.segment
  }
  return { segments, position }
}
