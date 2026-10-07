import { buildElevationProfile } from '../../domain/elevation/elevation'
import { metersToKilometers } from '../../domain/metrics/conversions'
import type { TrackPoint } from '../../types'
import type { TrackingSnapshot } from './trackingController'

export interface ElevationChartPoint { x: number; y: number | null; estimated: boolean }
export interface ElevationChartData {
  segments: ElevationChartPoint[][]
  availableCount: number
  hasGaps: boolean
  hasEstimates: boolean
}

/** Adaptador de presentación; T15 procesa cada segmento igual que las métricas T17. */
export function toElevationChartData(snapshot: Pick<TrackingSnapshot, 'rawPoints'>): ElevationChartData {
  const groups = new Map<number, TrackPoint[]>()
  for (const item of snapshot.rawPoints) {
    if (item.segment === null) continue
    const quality = item.assessment.quality
    const point: TrackPoint = quality === 'estimated' ? item.raw
      : { ...item.raw, quality, estimated: false, accuracy: item.raw.accuracy! }
    const group = groups.get(item.segment) ?? []
    group.push(point); groups.set(item.segment, group)
  }
  let offsetMeters = 0, availableCount = 0, hasGaps = false, hasEstimates = false
  const segments = [...groups.values()].map(group => {
    const profile = buildElevationProfile(group)
    const points = profile.map(sample => {
      if (sample.altitudeMeters !== null) availableCount++
      else hasGaps = true
      hasEstimates ||= sample.estimated
      return { x: metersToKilometers(offsetMeters + sample.distanceMeters)!,
        y: sample.altitudeMeters, estimated: sample.estimated }
    })
    offsetMeters += profile.at(-1)?.distanceMeters ?? 0
    return points
  })
  return { segments, availableCount, hasGaps: hasGaps || segments.length > 1, hasEstimates }
}
