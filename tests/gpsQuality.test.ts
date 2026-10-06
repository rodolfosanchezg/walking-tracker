// @vitest-environment node
import { expect, test } from 'vitest'
import { classifyTrackPoint, classifyTrackPoints, DEFAULT_GPS_QUALITY_CONFIG, evaluateAccuracy } from '../src/domain/filtering/gpsQuality'
import { calculateAccumulatedDistanceMeters } from '../src/domain/metrics/distance'
import type { TrackPoint } from '../src/types'

function point(overrides: Partial<TrackPoint> = {}): TrackPoint {
  return { id: 'point', walkId: 'walk', timestamp: 1000, latitude: 4.6, longitude: -74.1,
    altitude: null, accuracy: 5, speed: null, quality: 'valid', estimated: false, ...overrides } as TrackPoint
}

test('punto inicial y accuracy buena son valid', () => {
  expect(classifyTrackPoint(point())).toMatchObject({ quality: 'valid', signals: [], distanceMeters: null })
})
test('accuracy pobre por sí sola es low-quality, no anomalous', () => {
  expect(classifyTrackPoint(point({ accuracy: 1000 })).quality).toBe('low-quality')
})
test('frontera de accuracy aceptable', () => {
  expect(evaluateAccuracy(25)).toBe('valid')
  expect(evaluateAccuracy(25.001)).toBe('low-quality')
  expect(evaluateAccuracy(24.999)).toBe('valid')
})
test.each([null, NaN, Infinity, -1])('accuracy ausente/inválida no genera anomalía automáticamente: %s', (accuracy) => {
  expect(evaluateAccuracy(accuracy)).toBe('low-quality')
})
test('desplazamiento normal y coordenadas negativas', () => {
  const result = classifyTrackPoint(point({ timestamp: 11000, latitude: 4.6001 }), point())
  expect(result.quality).toBe('valid')
  expect(result.apparentSpeedMetersPerSecond).toBeCloseTo(1.111949, 5)
})
test('salto imposible combina velocidad aparente y salto espacial', () => {
  const result = classifyTrackPoint(point({ timestamp: 3000, latitude: 4.61 }), point())
  expect(result.quality).toBe('anomalous')
  expect(result.signals).toEqual(['excessive-apparent-speed', 'spatial-jump'])
})
test('desplazamiento largo coherente con intervalo largo sigue valid', () => {
  expect(classifyTrackPoint(point({ timestamp: 1_001_000, latitude: 4.61 }), point()).quality).toBe('valid')
})
test('velocidad aparente aislada es suspicious', () => {
  expect(classifyTrackPoint(point({ timestamp: 2000, latitude: 4.6001 }), point()).quality).toBe('suspicious')
})
test.each([1000, 500])('timestamp igual/invertido es suspicious sin corroboración: %s', (timestamp) => {
  const result = classifyTrackPoint(point({ timestamp }), point())
  expect(result.quality).toBe('suspicious')
  expect(result.signals).toContain('non-increasing-time')
  expect(result.apparentSpeedMetersPerSecond).toBeNull()
})
test.each([NaN, Infinity, -1])('timestamp inválido no genera NaN ni anomalía solo: %s', (timestamp) => {
  const result = classifyTrackPoint(point({ timestamp }), point())
  expect(result.quality).toBe('suspicious')
  expect(result.intervalMs).toBeNull()
})
test('intervalo mínimo: igual se calcula, menor es short-interval', () => {
  expect(classifyTrackPoint(point({ timestamp: 2000 }), point()).signals).toEqual([])
  expect(classifyTrackPoint(point({ timestamp: 1999 }), point()).signals).toEqual(['short-interval'])
})
test('speed ausente, cero o justo en umbral no es señal anómala', () => {
  for (const speed of [null, 0, 5]) expect(classifyTrackPoint(point({ speed })).quality).toBe('valid')
  expect(classifyTrackPoint(point({ speed: 5.001 })).quality).toBe('suspicious')
})
test.each([NaN, Infinity, -1])('speed inválido es diagnóstico sin anomalía automática: %s', (speed) => {
  expect(classifyTrackPoint(point({ speed }))).toMatchObject({ quality: 'suspicious', signals: ['invalid-device-speed'] })
})
test('speed del dispositivo complementa otras señales pero no basta solo', () => {
  const current = point({ speed: 10, latitude: 4.6001, timestamp: 2000 })
  expect(classifyTrackPoint(current, point()).quality).toBe('anomalous')
  expect(classifyTrackPoint(point({ speed: 10, accuracy: 1000 })).quality).toBe('suspicious')
})
test('puntos repetidos con tiempo creciente siguen valid', () => {
  expect(classifyTrackPoint(point({ timestamp: 2000 }), point()).quality).toBe('valid')
})
test('coordenadas inválidas se diagnostican sin cálculos no finitos', () => {
  expect(classifyTrackPoint(point({ latitude: NaN }), point())).toMatchObject({ quality: 'suspicious', distanceMeters: null })
})
test('estimated se conserva reservado sin reclasificar ni generar puntos', () => {
  const estimated: TrackPoint = { ...point(), estimated: true, quality: 'estimated', accuracy: null }
  expect(classifyTrackPoint(estimated)).toMatchObject({ point: estimated, quality: 'estimated', signals: [] })
})
test('secuencia conserva originales, determinismo y referencia relevante tras anomalía', () => {
  const points = Object.freeze([
    Object.freeze(point()), Object.freeze(point({ id: 'low', accuracy: 1000, timestamp: 2000 })),
    Object.freeze(point({ id: 'suspicious', speed: 10, timestamp: 3000 })),
    Object.freeze(point({ id: 'anomaly', latitude: 4.61, timestamp: 4000 })),
    Object.freeze(point({ id: 'normal', latitude: 4.60001, timestamp: 5000 })),
  ])
  const snapshot = structuredClone(points)
  const results = classifyTrackPoints(points)
  expect(results.map((result) => result.quality)).toEqual(['valid', 'low-quality', 'suspicious', 'anomalous', 'valid'])
  expect(results[4].intervalMs).toBe(2000)
  expect(results[3].point).toBe(points[3])
  expect(points).toEqual(snapshot)
  expect(classifyTrackPoints(points)).toEqual(results)
  // Adaptación explícita solo en prueba: T12 conserva su API y excluye anomalous.
  const classified = results.map(({ point: original, quality }) => ({ ...original, quality }) as TrackPoint)
  expect(calculateAccumulatedDistanceMeters(classified)).toBe(0)
})
test('umbrales configurables y frontera de velocidad aparente', () => {
  const config = { ...DEFAULT_GPS_QUALITY_CONFIG, maximumWalkingSpeedMetersPerSecond: 1 }
  expect(classifyTrackPoint(point({ timestamp: 11000, latitude: 4.6001 }), point(), config).quality).toBe('suspicious')
  const measured = classifyTrackPoint(point({ timestamp: 11000, latitude: 4.6001 }), point())
  expect(classifyTrackPoint(point({ timestamp: 11000, latitude: 4.6001 }), point(), {
    ...config, maximumWalkingSpeedMetersPerSecond: measured.apparentSpeedMetersPerSecond!,
  }).quality).toBe('valid')
})
test('fronteras de salto e intervalo máximo de salto', () => {
  const current = point({ timestamp: 31000, latitude: 4.601 })
  const measured = classifyTrackPoint(current, point())
  expect(measured.signals).toEqual(['spatial-jump'])
  expect(classifyTrackPoint(current, point(), {
    ...DEFAULT_GPS_QUALITY_CONFIG, maximumJumpMeters: measured.distanceMeters!,
  }).signals).toEqual([])
  expect(classifyTrackPoint({ ...current, timestamp: 31001 }, point()).signals).toEqual([])
})
test('cantidad mínima de evidencias configurable, siempre múltiple', () => {
  const current = point({ timestamp: 3000, latitude: 4.61 })
  expect(classifyTrackPoint(current, point(), { ...DEFAULT_GPS_QUALITY_CONFIG, anomalyEvidenceCount: 3 }).quality).toBe('suspicious')
  expect(() => classifyTrackPoints([], { ...DEFAULT_GPS_QUALITY_CONFIG, anomalyEvidenceCount: 1 })).toThrow(RangeError)
  expect(() => evaluateAccuracy(5, { ...DEFAULT_GPS_QUALITY_CONFIG, minimumIntervalMs: NaN })).toThrow(RangeError)
})
test('referencias estimated/anomalous/otra caminata no participan de comparación', () => {
  const current = point({ timestamp: 2000, latitude: 4.61 })
  expect(classifyTrackPoint(current, point({ quality: 'anomalous' })).distanceMeters).toBeNull()
  expect(classifyTrackPoint(current, point({ walkId: 'other' })).distanceMeters).toBeNull()
  const estimated: TrackPoint = { ...point(), quality: 'estimated', estimated: true, accuracy: null }
  expect(classifyTrackPoint(current, estimated).distanceMeters).toBeNull()
})
test('varios anomalous conservan referencia válida y todos los puntos originales', () => {
  const points = [point(), point({ latitude: 4.61, timestamp: 3000 }), point({ latitude: 4.62, timestamp: 5000 }), point({ timestamp: 7000 })]
  const results = classifyTrackPoints(points)
  expect(results.map((result) => result.quality)).toEqual(['valid', 'anomalous', 'anomalous', 'valid'])
  expect(results).toHaveLength(points.length)
  expect(results[3].intervalMs).toBe(6000)
})
