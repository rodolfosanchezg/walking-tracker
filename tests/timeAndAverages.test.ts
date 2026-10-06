// @vitest-environment node
import { expect, test } from 'vitest'
import { calculateActiveDurationMs, calculateTotalDurationMs } from '../src/domain/metrics/time'
import { calculateAveragePaceSecondsPerKilometer, calculateAverageSpeedMetersPerSecond } from '../src/domain/metrics/averages'
import { calculateAccumulatedDistanceMeters } from '../src/domain/metrics/distance'
import type { TrackPoint } from '../src/types'

test('tiempo total y activo sin pausas en milisegundos', () => {
  expect(calculateTotalDurationMs(1000, 11000)).toBe(10000)
  expect(calculateActiveDurationMs(1000, 11000)).toBe(10000)
})

test('excluye una pausa del activo, conservando tiempo total', () => {
  expect(calculateActiveDurationMs(1000, 11000, [{ startedAt: 3000, endedAt: 5000 }])).toBe(8000)
  expect(calculateTotalDurationMs(1000, 11000)).toBe(10000)
})

test('múltiples pausas desordenadas se excluyen sin mutación', () => {
  const pauses = Object.freeze([
    Object.freeze({ startedAt: 7000, endedAt: 9000 }),
    Object.freeze({ startedAt: 2000, endedAt: 3000 }),
  ])
  const snapshot = structuredClone(pauses)
  expect(calculateActiveDurationMs(1000, 11000, pauses)).toBe(7000)
  expect(pauses).toEqual(snapshot)
})

test('solapamientos, duplicados y pausas contiguas se cuentan una sola vez', () => {
  expect(calculateActiveDurationMs(0, 10000, [
    { startedAt: 1000, endedAt: 4000 }, { startedAt: 2000, endedAt: 3000 },
    { startedAt: 3000, endedAt: 6000 }, { startedAt: 6000, endedAt: 8000 },
  ])).toBe(3000)
})

test('pausa abierta se evalúa hasta el instante recibido', () => {
  const pauses = [{ startedAt: 4000, endedAt: null }]
  expect(calculateActiveDurationMs(0, 10000, pauses)).toBe(4000)
  expect(calculateActiveDurationMs(0, 12000, pauses)).toBe(4000)
  expect(calculateTotalDurationMs(0, 12000)).toBe(12000)
})

test('recorta pausas a límites y omite intervalos fuera de ellos', () => {
  expect(calculateActiveDurationMs(1000, 10000, [
    { startedAt: 0, endedAt: 2000 }, { startedAt: 9000, endedAt: 12000 },
    { startedAt: 20000, endedAt: null },
  ])).toBe(7000)
})

test('duración cero y tiempo totalmente pausado son cero', () => {
  expect(calculateTotalDurationMs(0, 0)).toBe(0)
  expect(calculateActiveDurationMs(0, 0)).toBe(0)
  expect(calculateActiveDurationMs(0, 10000, [{ startedAt: 0, endedAt: null }])).toBe(0)
})

test('velocidad y ritmo usan tiempo activo, no total', () => {
  const active = calculateActiveDurationMs(0, 4_200_000, [{ startedAt: 600_000, endedAt: 1_200_000 }])
  expect(active).toBe(3_600_000)
  expect(calculateAverageSpeedMetersPerSecond(5000, active)).toBeCloseTo(1.3888889, 6)
  expect(calculateAveragePaceSecondsPerKilometer(5000, active)).toBe(720)
})

test('distancia cero da velocidad cero con tiempo positivo y ritmo null', () => {
  expect(calculateAverageSpeedMetersPerSecond(0, 1000)).toBe(0)
  expect(calculateAveragePaceSecondsPerKilometer(0, 1000)).toBeNull()
})

test('tiempo activo cero no produce divisiones inválidas', () => {
  for (const distance of [0, 1000]) {
    expect(calculateAverageSpeedMetersPerSecond(distance, 0)).toBeNull()
    expect(calculateAveragePaceSecondsPerKilometer(distance, 0)).toBeNull()
  }
})

test.each([NaN, Infinity, -Infinity, -1, null])('rechaza valor inválido %s', (invalid) => {
  expect(calculateTotalDurationMs(invalid, 1000)).toBeNull()
  expect(calculateTotalDurationMs(0, invalid)).toBeNull()
  expect(calculateActiveDurationMs(invalid, 1000)).toBeNull()
  expect(calculateActiveDurationMs(0, invalid)).toBeNull()
  expect(calculateAverageSpeedMetersPerSecond(invalid, 1000)).toBeNull()
  expect(calculateAverageSpeedMetersPerSecond(1000, invalid)).toBeNull()
  expect(calculateAveragePaceSecondsPerKilometer(invalid, 1000)).toBeNull()
  expect(calculateAveragePaceSecondsPerKilometer(1000, invalid)).toBeNull()
})

test('rechaza duración negativa y pausas inválidas', () => {
  expect(calculateTotalDurationMs(1000, 0)).toBeNull()
  expect(calculateActiveDurationMs(1000, 0)).toBeNull()
  for (const pause of [
    { startedAt: 5, endedAt: 4 }, { startedAt: NaN, endedAt: null },
    { startedAt: -1, endedAt: 4 }, { startedAt: 0, endedAt: Infinity },
  ]) expect(calculateActiveDurationMs(0, 10000, [pause])).toBeNull()
})

test('desbordamiento de promedios devuelve null', () => {
  expect(calculateAverageSpeedMetersPerSecond(Number.MAX_VALUE, 0.001)).toBeNull()
  expect(calculateAveragePaceSecondsPerKilometer(Number.MIN_VALUE, Number.MAX_VALUE)).toBeNull()
})

test('reutiliza el resultado de distancia T12 sin cambiar puntos', () => {
  const makePoint = (longitude: number): TrackPoint => Object.freeze({
    id: String(longitude), walkId: 'walk', timestamp: 0, latitude: 0, longitude,
    altitude: null, speed: null, accuracy: 5, quality: 'valid', estimated: false,
  })
  const points = Object.freeze([makePoint(0), makePoint(0.001)])
  const snapshot = structuredClone(points)
  const distance = calculateAccumulatedDistanceMeters(points)
  expect(calculateAverageSpeedMetersPerSecond(distance, 100000)).toBeCloseTo(1.1119493, 6)
  expect(calculateAveragePaceSecondsPerKilometer(distance, 100000)).toBeCloseTo(899.3216, 3)
  expect(points).toEqual(snapshot)
})
