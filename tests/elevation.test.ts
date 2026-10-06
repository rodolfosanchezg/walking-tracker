// @vitest-environment node
import { expect, test } from 'vitest'
import { buildElevationProfile, calculateElevationChange, DEFAULT_ELEVATION_CONFIG, interpolateElevationGaps, prepareElevationSeries, smoothElevationSeries } from '../src/domain/elevation/elevation'
import { calculateAccumulatedDistanceMeters } from '../src/domain/metrics/distance'
import type { TrackPoint } from '../src/types'

function points(altitudes: readonly (number | null)[]): TrackPoint[] {
  return altitudes.map((altitude, index) => ({ id: String(index), walkId: 'walk', timestamp: index * 1000,
    latitude: 4.6, longitude: -74.1 + index * 0.0001, altitude, accuracy: 5, speed: null, quality: 'valid', estimated: false }))
}
const changes = (altitudes: readonly (number | null)[]) => calculateElevationChange(buildElevationProfile(points(altitudes)))

test('vacío y un punto no acumulan elevación', () => {
  expect(buildElevationProfile([])).toEqual([])
  expect(changes([])).toEqual({ gainMeters: 0, lossMeters: 0, estimated: false })
  expect(changes([100])).toEqual({ gainMeters: 0, lossMeters: 0, estimated: false })
})
test('altitud constante da cero', () => {
  expect(changes([100, 100, 100])).toMatchObject({ gainMeters: 0, lossMeters: 0 })
})
test('ascenso, descenso y perfil mixto conocidos', () => {
  expect(changes([100, 110, 120])).toMatchObject({ gainMeters: 20, lossMeters: 0 })
  expect(changes([120, 110, 100])).toMatchObject({ gainMeters: 0, lossMeters: 20 })
  expect(changes([100, 110, 120, 110, 100])).toMatchObject({ gainMeters: 20, lossMeters: 20 })
})
test('oscilaciones pequeñas no inflan ganancia/pérdida', () => {
  const profile = buildElevationProfile(points([100, 101, 100.5, 101.2]))
  expect(profile.map((sample) => sample.altitudeMeters)).toEqual([100, 100, 100, 100])
  expect(calculateElevationChange(profile)).toMatchObject({ gainMeters: 0, lossMeters: 0 })
  expect(profile[1].smoothed).toBe(true)
})
test.each([2.999, 3, 3.001])('frontera de suavizado %s m', (change) => {
  expect(changes([100, 100 + change]).gainMeters).toBeCloseTo(change < 3 ? 0 : change, 8)
})
test('ascenso lento no se pierde por comparar solo puntos contiguos', () => {
  expect(changes([100, 101, 102, 103, 104, 105, 106]).gainMeters).toBe(6)
})
test('interpola un null entre referencias y marca estimación', () => {
  const series = interpolateElevationGaps(prepareElevationSeries(points([100, null, 120])))
  expect(series[1].altitudeMeters).toBeCloseTo(110, 6)
  expect(series[1]).toMatchObject({ estimated: true, source: 'interpolated' })
  expect(calculateElevationChange(buildElevationProfile(points([100, null, 120])))).toEqual({ gainMeters: 20, lossMeters: 0, estimated: true })
})
test('interpola varios null consecutivos', () => {
  const series = interpolateElevationGaps(prepareElevationSeries(points([100, null, null, 130])))
  expect(series[1].altitudeMeters).toBeCloseTo(110, 5)
  expect(series[2].altitudeMeters).toBeCloseTo(120, 5)
})
test('extremos y series totalmente ausentes no se extrapolan', () => {
  expect(buildElevationProfile(points([null, 100, 110, null])).map((p) => p.altitudeMeters)).toEqual([null, 100, 110, null])
  expect(changes([null, null])).toMatchObject({ gainMeters: 0, lossMeters: 0 })
})
test.each(['anomalous', 'low-quality'] as const)('política %s: excluido y sin interpolar a través', (quality) => {
  const input = points([100, 1000, 120]); input[1] = { ...input[1], quality, estimated: false, accuracy: 5 }
  const profile = buildElevationProfile(input)
  expect(profile[1]).toMatchObject({ altitudeMeters: null, source: 'excluded' })
  expect(calculateElevationChange(profile)).toMatchObject({ gainMeters: 0, lossMeters: 0 })
})
test('suspicious finito se utiliza sin cambiar clasificación', () => {
  const input = points([100, 110, 120]); input[1] = { ...input[1], quality: 'suspicious', estimated: false, accuracy: 5 }
  expect(calculateElevationChange(buildElevationProfile(input)).gainMeters).toBe(20)
  expect(input[1].quality).toBe('suspicious')
})
test('estimated de entrada se excluye; no confunde origen de interpolaciones', () => {
  const input = points([100, 110, 120]); input[1] = { ...input[1], quality: 'estimated', estimated: true, accuracy: null }
  expect(buildElevationProfile(input)[1]).toMatchObject({ altitudeMeters: null, source: 'excluded', estimated: false })
})
test('pico vertical aislado confirmado por vecinos queda excluido', () => {
  const profile = buildElevationProfile(points([100, 1000, 100]))
  expect(profile[1]).toMatchObject({ altitudeMeters: null, source: 'altitude-anomaly' })
  expect(calculateElevationChange(profile)).toMatchObject({ gainMeters: 0, lossMeters: 0 })
  expect(changes([100, 140, 180]).gainMeters).toBe(80)
})
test('altitudes negativas son válidas', () => {
  expect(changes([-20, -10, -15])).toMatchObject({ gainMeters: 10, lossMeters: 5 })
})
test('perfil usa distancia acumulada T12 y coordenadas negativas', () => {
  const input = points([100, 110, 120]), profile = buildElevationProfile(input)
  expect(profile[0].distanceMeters).toBe(0)
  expect(profile[2].distanceMeters).toBeCloseTo(calculateAccumulatedDistanceMeters(input), 8)
  expect(profile[2].distanceMeters).toBeGreaterThan(20)
})
test('puntos repetidos permiten interpolación por orden cuando distancia es cero', () => {
  const input = points([100, null, 120]).map((p) => ({ ...p, longitude: -74.1 }))
  expect(interpolateElevationGaps(prepareElevationSeries(input))[1].altitudeMeters).toBe(110)
  expect(buildElevationProfile(input).every((p) => p.distanceMeters === 0)).toBe(true)
})
test.each([NaN, Infinity, -Infinity])('altitud no finita %s se trata como ausencia', (altitude) => {
  expect(interpolateElevationGaps(prepareElevationSeries(points([100, altitude, 120])))[1]).toMatchObject({ source: 'interpolated', estimated: true })
})
test('interpolación limitada por cantidad, distancia y tiempo', () => {
  const config = { ...DEFAULT_ELEVATION_CONFIG, maximumInterpolationPoints: 1 }
  expect(buildElevationProfile(points([100, null, null, 120]), config)[1].altitudeMeters).toBeNull()
  const far = points([100, null, 120]).map((p, i) => ({ ...p, longitude: p.longitude + i * 0.01 }))
  expect(buildElevationProfile(far)[1].altitudeMeters).toBeNull()
  const late = points([100, null, 120]).map((p, i) => ({ ...p, timestamp: i * 60000 }))
  expect(buildElevationProfile(late)[1].altitudeMeters).toBeNull()
})
test('timestamp invertido/inválido impide interpolar', () => {
  for (const timestamp of [NaN, -1, 3000]) {
    const input = points([100, null, 120]); input[1] = { ...input[1], timestamp }
    expect(buildElevationProfile(input)[1].altitudeMeters).toBeNull()
  }
})
test('no conecta caminatas distintas', () => {
  const input = points([100, 120]); input[1] = { ...input[1], walkId: 'other' }
  expect(calculateElevationChange(buildElevationProfile(input)).gainMeters).toBe(0)
})
test('no mutación en cada etapa y determinismo', () => {
  const input = Object.freeze(points([100, null, 110]).map((p) => Object.freeze(p)))
  const snapshot = structuredClone(input)
  const prepared = Object.freeze(prepareElevationSeries(input).map((p) => Object.freeze(p)))
  const filled = Object.freeze(interpolateElevationGaps(prepared).map((p) => Object.freeze(p)))
  smoothElevationSeries(filled); calculateElevationChange(filled)
  expect(buildElevationProfile(input)).toEqual(buildElevationProfile(input))
  expect(input).toEqual(snapshot)
})
test('configuración inválida se rechaza explícitamente', () => {
  expect(() => buildElevationProfile([], { ...DEFAULT_ELEVATION_CONFIG, minimumChangeMeters: NaN })).toThrow(RangeError)
})
test('coordenadas inválidas crean barrera, sin perfil no finito', () => {
  const input = points([100, 1000, 120]); input[1] = { ...input[1], latitude: NaN }
  const profile = buildElevationProfile(input)
  expect(profile[1].source).toBe('excluded')
  expect(profile.every((p) => Number.isFinite(p.distanceMeters))).toBe(true)
  expect(calculateElevationChange(profile)).toMatchObject({ gainMeters: 0, lossMeters: 0 })
})
test('desbordamiento de ganancia/pérdida se representa como no calculable', () => {
  expect(changes([-Number.MAX_VALUE, Number.MAX_VALUE])).toEqual({ gainMeters: null, lossMeters: null, estimated: false })
})
