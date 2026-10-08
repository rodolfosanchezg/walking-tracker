import { classifyTrackPoints } from '../../domain/filtering/gpsQuality'
import type { WalkDetailData } from '../../data/repositories/walkDetailStore'
import type { CapturedPoint } from '../tracking/trackingController'

/** Solo prepara datos visuales: no recalcula el resumen persistido ni modifica raw GPS. */
export function toSavedWalkData(data: WalkDetailData) {
  const metadata = new Map(data.metadata?.map(item => [item.id, item]))
  const assessments = classifyTrackPoints(data.points)
  const rawPoints: CapturedPoint[] = data.points.map((raw, index) => {
    const item = metadata.get(raw.id)
    // T18 guarda raw GPS: sin metadatos se reutiliza T14 para su evaluación visual.
    const quality = item?.quality ?? (raw.quality === 'valid' ? assessments[index].quality : raw.quality)
    return { raw, assessment: { ...assessments[index], quality }, segment: item ? item.segment : 0 }
  })
  return { snapshot: { rawPoints, trackingStatus: 'finished' as const },
    segmentationAvailable: data.points.length === 0 || data.points.every(point => metadata.has(point.id)) }
}
