import type { TrackPoint } from '../../types'
import { calculateAccumulatedDistanceMeters, calculateDistanceMeters } from '../metrics/distance'

export interface ElevationConfig {
  readonly minimumChangeMeters: number
  readonly isolatedSpikeMeters: number
  readonly maximumInterpolationPoints: number
  readonly maximumInterpolationDistanceMeters: number
  readonly maximumInterpolationIntervalMs: number
}

export const DEFAULT_ELEVATION_CONFIG: Readonly<ElevationConfig> = Object.freeze({
  minimumChangeMeters: 3,
  isolatedSpikeMeters: 30,
  maximumInterpolationPoints: 5,
  maximumInterpolationDistanceMeters: 100,
  maximumInterpolationIntervalMs: 60_000,
})

export interface ElevationSample {
  readonly pointId: string
  readonly walkId: string
  readonly timestamp: number
  readonly distanceMeters: number
  readonly altitudeMeters: number | null
  readonly source: 'measured' | 'interpolated' | 'unavailable' | 'excluded' | 'altitude-anomaly'
  readonly estimated: boolean
  readonly smoothed: boolean
}

function validateConfig(config: ElevationConfig): void {
  if (Object.values(config).some((value) => !Number.isFinite(value) || value <= 0)
    || !Number.isInteger(config.maximumInterpolationPoints)
    || config.isolatedSpikeMeters <= config.minimumChangeMeters) throw new RangeError('Invalid elevation configuration')
}

/** Preserva huecos y datos originales; distancia acumulada con política de T12. */
export function prepareElevationSeries(
  points: readonly TrackPoint[], config: ElevationConfig = DEFAULT_ELEVATION_CONFIG,
): ElevationSample[] {
  validateConfig(config)
  let distanceMeters = 0
  const samples: ElevationSample[] = points.map((point, index) => {
    if (index > 0) distanceMeters += calculateAccumulatedDistanceMeters([points[index - 1], point])
    const eligible = !point.estimated && (point.quality === 'valid' || point.quality === 'suspicious')
      && calculateDistanceMeters(point, point) !== null
    const available = eligible && point.altitude !== null && Number.isFinite(point.altitude)
    return { pointId: point.id, walkId: point.walkId, timestamp: point.timestamp, distanceMeters,
      altitudeMeters: available ? point.altitude : null,
      source: !eligible ? 'excluded' : available ? 'measured' : 'unavailable', estimated: false, smoothed: false }
  })
  // Pico aislado corroborado por dos vecinos próximos en altitud; sin cambiar quality GPS.
  return samples.map((sample, index) => {
    const before = samples[index - 1], after = samples[index + 1]
    if (sample.altitudeMeters !== null && before?.altitudeMeters != null && after?.altitudeMeters != null
      && sample.walkId === before.walkId && sample.walkId === after.walkId
      && Math.abs(before.altitudeMeters - after.altitudeMeters) < config.minimumChangeMeters
      && Math.abs(sample.altitudeMeters - before.altitudeMeters) >= config.isolatedSpikeMeters
      && Math.abs(sample.altitudeMeters - after.altitudeMeters) >= config.isolatedSpikeMeters) {
      return { ...sample, altitudeMeters: null, source: 'altitude-anomaly' }
    }
    return sample
  })
}

/** Interpola únicamente huecos de altitud, sin cruzar exclusiones ni extrapolar. */
export function interpolateElevationGaps(
  samples: readonly ElevationSample[], config: ElevationConfig = DEFAULT_ELEVATION_CONFIG,
): ElevationSample[] {
  validateConfig(config)
  const result = samples.map((sample) => ({ ...sample }))
  for (let start = 0; start < samples.length; start++) {
    if (samples[start].source !== 'unavailable') continue
    let end = start
    while (end < samples.length && samples[end].source === 'unavailable') end++
    const before = samples[start - 1], after = samples[end]
    const gap = samples.slice(start, end)
    const span = after && before ? after.distanceMeters - before.distanceMeters : NaN
    const elapsed = after && before ? after.timestamp - before.timestamp : NaN
    const bounded = before && after && before.altitudeMeters !== null && after.altitudeMeters !== null
      && end - start <= config.maximumInterpolationPoints
      && gap.every((sample) => sample.walkId === before.walkId) && after.walkId === before.walkId
      && Number.isFinite(span) && span >= 0 && span <= config.maximumInterpolationDistanceMeters
      && Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= config.maximumInterpolationIntervalMs
      && [before, ...gap, after].every((sample, index, sequence) => Number.isFinite(sample.timestamp)
        && sample.timestamp >= 0 && (index === 0 || sample.timestamp >= sequence[index - 1].timestamp))
    if (bounded) {
      for (let index = start; index < end; index++) {
        // Sin avance horizontal (puntos repetidos), usa posición relativa en la secuencia.
        const ratio = span > 0 ? (samples[index].distanceMeters - before.distanceMeters) / span
          : (index - start + 1) / (end - start + 1)
        const altitude = before.altitudeMeters! * (1 - ratio) + after.altitudeMeters! * ratio
        if (Number.isFinite(altitude)) result[index] = { ...result[index], altitudeMeters: altitude, source: 'interpolated', estimated: true }
      }
    }
    start = end - 1
  }
  return result
}

/** Banda muerta respecto al último valor aceptado: pequeños cambios se acumulan hasta el umbral. */
export function smoothElevationSeries(
  samples: readonly ElevationSample[], config: ElevationConfig = DEFAULT_ELEVATION_CONFIG,
): ElevationSample[] {
  validateConfig(config)
  let previous: ElevationSample | undefined
  return samples.map((sample) => {
    if (sample.altitudeMeters === null || !Number.isFinite(sample.altitudeMeters)) {
      previous = undefined
      return { ...sample, altitudeMeters: null }
    }
    const smooth = previous && previous.walkId === sample.walkId
      && Math.abs(sample.altitudeMeters - previous.altitudeMeters!) < config.minimumChangeMeters
    const processed = smooth && previous ? { ...sample, altitudeMeters: previous.altitudeMeters,
      estimated: sample.estimated || previous.estimated,
      smoothed: sample.smoothed || sample.altitudeMeters !== previous.altitudeMeters } : { ...sample }
    previous = processed
    return processed
  })
}

export function calculateElevationChange(samples: readonly ElevationSample[]): {
  gainMeters: number | null; lossMeters: number | null; estimated: boolean
} {
  let gainMeters = 0, lossMeters = 0, estimated = false
  let previous: ElevationSample | undefined
  for (const sample of samples) {
    if (sample.altitudeMeters === null || !Number.isFinite(sample.altitudeMeters)) { previous = undefined; continue }
    if (previous && previous.walkId === sample.walkId) {
      const delta = sample.altitudeMeters - previous.altitudeMeters!
      if (delta > 0) gainMeters += delta
      else if (delta < 0) lossMeters -= delta
      if (delta !== 0 && (sample.estimated || previous.estimated)) estimated = true
    }
    previous = sample
  }
  if (!Number.isFinite(gainMeters) || !Number.isFinite(lossMeters)) return { gainMeters: null, lossMeters: null, estimated: false }
  return { gainMeters, lossMeters, estimated }
}

/** Perfil derivado listo para consumo posterior; no configura gráficos. */
export function buildElevationProfile(
  points: readonly TrackPoint[], config: ElevationConfig = DEFAULT_ELEVATION_CONFIG,
): ElevationSample[] {
  return smoothElevationSeries(interpolateElevationGaps(prepareElevationSeries(points, config), config), config)
}
