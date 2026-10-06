// @vitest-environment node
import { expect, test } from 'vitest'
import { calculateAccumulatedDistanceMeters, calculateDistanceMeters } from '../src/domain/metrics/distance'
import type { TrackPoint } from '../src/types'

function point(longitude: number, overrides: Partial<TrackPoint> = {}): TrackPoint {
  return {
    id: String(longitude), walkId: 'walk', timestamp: 1,
    latitude: 0, longitude, altitude: null, accuracy: 5, speed: null,
    quality: 'valid', estimated: false,
    ...overrides,
  } as TrackPoint
}

test('dos coordenadas iguales producen cero', () => {
  expect(calculateDistanceMeters(point(-74), point(-74))).toBe(0)
})

test('0.001 grados sobre el ecuador son aproximadamente 111.195 metros', () => {
  expect(calculateDistanceMeters(point(0), point(0.001))).toBeCloseTo(111.195, 2)
})

test('coordenadas cercanas de Bogotá con longitud negativa', () => {
  const a = { latitude: 4.6, longitude: -74.1 }
  const b = { latitude: 4.601, longitude: -74.1 }
  expect(calculateDistanceMeters(a, b)).toBeCloseTo(111.195, 2)
  expect(calculateDistanceMeters(b, a)).toBeCloseTo(111.195, 2)
})

test('acumula varios segmentos en metros', () => {
  expect(calculateAccumulatedDistanceMeters([point(0), point(0.001), point(0.002)])).toBeCloseTo(222.39, 2)
})

test('secuencia vacía y un solo punto producen cero', () => {
  expect(calculateAccumulatedDistanceMeters([])).toBe(0)
  expect(calculateAccumulatedDistanceMeters([point(0)])).toBe(0)
})

test('excluye anomalous sin conectar por estimación los puntos alrededor', () => {
  const points = [point(0), point(0.001), point(100, { quality: 'anomalous' }), point(0.002), point(0.003)]
  expect(calculateAccumulatedDistanceMeters(points)).toBeCloseTo(222.39, 2)
  expect(calculateAccumulatedDistanceMeters([point(0), point(100, { quality: 'anomalous' }), point(0.002)])).toBe(0)
})

test('suspicious participa según D2 y low-quality queda pendiente según D1', () => {
  expect(calculateAccumulatedDistanceMeters([point(0), point(0.001, { quality: 'suspicious' })])).toBeCloseTo(111.195, 2)
  expect(calculateAccumulatedDistanceMeters([point(0), point(0.001, { quality: 'low-quality' }), point(0.002)])).toBe(0)
})

test('puntos estimated no se mezclan con distancia medida', () => {
  const estimated: TrackPoint = { ...point(0.001), quality: 'estimated', estimated: true, accuracy: null }
  expect(calculateAccumulatedDistanceMeters([point(0), estimated, point(0.002)])).toBe(0)
})

test('puntos repetidos consecutivos no inflan distancia', () => {
  expect(calculateAccumulatedDistanceMeters([point(0), point(0), point(0.001), point(0.001)])).toBeCloseTo(111.195, 2)
})

test('cruce cercano de longitud 180 usa la distancia corta', () => {
  expect(calculateDistanceMeters(point(179.999), point(-179.999))).toBeCloseTo(222.39, 2)
})

test('antípodas y polos mantienen resultados finitos', () => {
  expect(calculateDistanceMeters(point(0), point(180))).toBeCloseTo(20_015_086.796, 2)
  const polar = calculateDistanceMeters({ latitude: 90, longitude: 0 }, { latitude: 90, longitude: 180 })
  expect(polar).not.toBeNull()
  expect(polar!).toBeLessThan(0.000001)
})

test.each([
  { latitude: NaN, longitude: 0 }, { latitude: Infinity, longitude: 0 },
  { latitude: 91, longitude: 0 }, { latitude: -91, longitude: 0 },
  { latitude: 0, longitude: NaN }, { latitude: 0, longitude: -Infinity },
  { latitude: 0, longitude: 181 }, { latitude: 0, longitude: -181 },
])('coordenadas inseguras devuelven null y cortan acumulación: %o', (invalid) => {
  expect(calculateDistanceMeters(invalid, point(0))).toBeNull()
  expect(calculateDistanceMeters(point(0), invalid)).toBeNull()
  expect(calculateAccumulatedDistanceMeters([point(0), point(0, invalid), point(0.002)])).toBe(0)
})

test('no modifica ni ordena las entradas congeladas', () => {
  const points = Object.freeze([Object.freeze(point(0.002)), Object.freeze(point(0.001)), Object.freeze(point(0))])
  const snapshot = structuredClone(points)
  expect(calculateAccumulatedDistanceMeters(points)).toBeCloseTo(222.39, 2)
  expect(points).toEqual(snapshot)
})

test('no suma segmentos entre caminatas distintas', () => {
  expect(calculateAccumulatedDistanceMeters([point(0), point(0.001, { walkId: 'other' })])).toBe(0)
})
