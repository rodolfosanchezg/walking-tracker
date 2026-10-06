import type { GpsQuality, TrackPoint } from '../../types'
import { calculateDistanceMeters } from '../metrics/distance'

export interface GpsQualityConfig {
  readonly acceptableAccuracyMeters: number
  readonly maximumWalkingSpeedMetersPerSecond: number
  readonly maximumJumpMeters: number
  readonly maximumJumpIntervalMs: number
  readonly minimumIntervalMs: number
  readonly anomalyEvidenceCount: number
}

/** Parámetros iniciales ajustables, sujetos a validación con caminatas reales. */
export const DEFAULT_GPS_QUALITY_CONFIG: Readonly<GpsQualityConfig> = Object.freeze({
  acceptableAccuracyMeters: 25,
  maximumWalkingSpeedMetersPerSecond: 5,
  maximumJumpMeters: 100,
  maximumJumpIntervalMs: 30_000,
  minimumIntervalMs: 1000,
  anomalyEvidenceCount: 2,
})

export type GpsSignal = 'poor-accuracy' | 'invalid-accuracy' | 'invalid-coordinates'
  | 'invalid-timestamp' | 'non-increasing-time' | 'short-interval'
  | 'excessive-apparent-speed' | 'spatial-jump' | 'excessive-device-speed' | 'invalid-device-speed'

export interface GpsAssessment {
  /** Referencia original; la clasificación se entrega por separado. */
  readonly point: TrackPoint
  readonly quality: GpsQuality
  readonly signals: readonly GpsSignal[]
  readonly distanceMeters: number | null
  readonly intervalMs: number | null
  readonly apparentSpeedMetersPerSecond: number | null
}

function validateConfig(config: GpsQualityConfig): void {
  if (Object.values(config).some((value) => !Number.isFinite(value) || value <= 0)
    || !Number.isInteger(config.anomalyEvidenceCount) || config.anomalyEvidenceCount < 2
    || config.maximumJumpIntervalMs < config.minimumIntervalMs) {
    throw new RangeError('Invalid GPS quality configuration')
  }
}

function validTimestamp(timestamp: number): boolean {
  return Number.isFinite(timestamp) && timestamp >= 0
}

export function evaluateAccuracy(
  accuracy: number | null, config: GpsQualityConfig = DEFAULT_GPS_QUALITY_CONFIG,
): 'valid' | 'low-quality' {
  validateConfig(config)
  return accuracy !== null && Number.isFinite(accuracy) && accuracy >= 0
    && accuracy <= config.acceptableAccuracyMeters ? 'valid' : 'low-quality'
}

export function classifyTrackPoint(
  point: TrackPoint, previous?: TrackPoint, config: GpsQualityConfig = DEFAULT_GPS_QUALITY_CONFIG,
): GpsAssessment {
  validateConfig(config)
  const signals: GpsSignal[] = []
  if (point.estimated) {
    return { point, quality: 'estimated', signals, distanceMeters: null, intervalMs: null, apparentSpeedMetersPerSecond: null }
  }
  const accuracyQuality = evaluateAccuracy(point.accuracy, config)
  const accuracyValid = Number.isFinite(point.accuracy) && point.accuracy >= 0
  if (!accuracyValid) signals.push('invalid-accuracy')
  else if (accuracyQuality === 'low-quality') signals.push('poor-accuracy')
  if (calculateDistanceMeters(point, point) === null) signals.push('invalid-coordinates')
  if (!validTimestamp(point.timestamp)) signals.push('invalid-timestamp')
  if (point.speed !== null) {
    if (!Number.isFinite(point.speed) || point.speed < 0) signals.push('invalid-device-speed')
    else if (point.speed > config.maximumWalkingSpeedMetersPerSecond) signals.push('excessive-device-speed')
  }

  const relevant = previous && !previous.estimated && previous.walkId === point.walkId
    && (previous.quality === 'valid' || previous.quality === 'suspicious')
    && validTimestamp(previous.timestamp) && calculateDistanceMeters(previous, previous) !== null
  const distanceMeters = relevant ? calculateDistanceMeters(previous, point) : null
  const delta = relevant && validTimestamp(point.timestamp) ? point.timestamp - previous.timestamp : null
  const intervalMs = delta !== null && Number.isFinite(delta) ? delta : null
  let apparentSpeedMetersPerSecond: number | null = null
  if (intervalMs !== null) {
    if (intervalMs <= 0) signals.push('non-increasing-time')
    else if (intervalMs < config.minimumIntervalMs) signals.push('short-interval')
    if (distanceMeters !== null) {
      if (intervalMs >= config.minimumIntervalMs) {
        const speed = distanceMeters / (intervalMs / 1000)
        if (Number.isFinite(speed)) apparentSpeedMetersPerSecond = speed
        if (!Number.isFinite(speed) || speed > config.maximumWalkingSpeedMetersPerSecond) signals.push('excessive-apparent-speed')
      }
      if (distanceMeters > config.maximumJumpMeters && intervalMs <= config.maximumJumpIntervalMs) signals.push('spatial-jump')
    }
  }

  const evidence = signals.filter((signal) => signal === 'poor-accuracy' || signal === 'excessive-apparent-speed'
    || signal === 'spatial-jump' || signal === 'non-increasing-time' || signal === 'excessive-device-speed')
  // Accuracy/device speed requieren corroboración espacial o temporal.
  const corroborated = signals.some((signal) => signal === 'excessive-apparent-speed'
    || signal === 'spatial-jump' || signal === 'non-increasing-time')
  const suspicious = signals.some((signal) => signal !== 'poor-accuracy' && signal !== 'invalid-accuracy')
  const quality = corroborated && evidence.length >= config.anomalyEvidenceCount ? 'anomalous'
    : suspicious ? 'suspicious' : accuracyQuality
  return { point, quality, signals, distanceMeters, intervalMs, apparentSpeedMetersPerSecond }
}

/** Conserva todos los puntos y el orden; no devuelve una ruta filtrada. */
export function classifyTrackPoints(
  points: readonly TrackPoint[], config: GpsQualityConfig = DEFAULT_GPS_QUALITY_CONFIG,
): GpsAssessment[] {
  validateConfig(config)
  let previous: TrackPoint | undefined
  return points.map((point) => {
    const assessment = classifyTrackPoint(point, previous, config)
    if ((assessment.quality === 'valid' || assessment.quality === 'suspicious')
      && validTimestamp(point.timestamp) && calculateDistanceMeters(point, point) !== null
      && (!previous || point.walkId !== previous.walkId || point.timestamp > previous.timestamp)) {
      // La referencia conserva los datos crudos; solo quality corresponde al resultado.
      previous = { ...point, quality: assessment.quality, estimated: false } as TrackPoint
    }
    // No compara puntos de caminatas distintas, tampoco al regresar a otra caminata.
    if (previous && previous.walkId !== point.walkId) previous = undefined
    return assessment
  })
}
