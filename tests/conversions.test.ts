// @vitest-environment node
import { expect, test } from 'vitest'
import {
  metersToKilometers, metersToMiles,
  metersPerSecondToKilometersPerHour, metersPerSecondToMilesPerHour,
  secondsPerKilometerToMinutesPerKilometer, secondsPerKilometerToMinutesPerMile,
} from '../src/domain/metrics/conversions'

test('metros a kilómetros', () => {
  expect(metersToKilometers(1500)).toBeCloseTo(1.5, 10)
})
test('metros a millas internacionales', () => {
  expect(metersToMiles(1609.344)).toBeCloseTo(1, 10)
})
test('m/s a km/h', () => {
  expect(metersPerSecondToKilometersPerHour(2)).toBeCloseTo(7.2, 10)
})
test('m/s a mph', () => {
  expect(metersPerSecondToMilesPerHour(1)).toBeCloseTo(2.236936292, 8)
})
test('segundos/km a min/km', () => {
  expect(secondsPerKilometerToMinutesPerKilometer(300)).toBeCloseTo(5, 10)
})
test('segundos/km a min/milla', () => {
  expect(secondsPerKilometerToMinutesPerMile(300)).toBeCloseTo(8.04672, 8)
})

test.each([
  metersToKilometers, metersToMiles,
  metersPerSecondToKilometersPerHour, metersPerSecondToMilesPerHour,
  secondsPerKilometerToMinutesPerKilometer, secondsPerKilometerToMinutesPerMile,
])('conversiones preservan cero y propagan datos no calculables: %s', (convert) => {
  expect(convert(0)).toBe(0)
  for (const invalid of [null, NaN, Infinity, -Infinity, -1]) expect(convert(invalid)).toBeNull()
})

test('desbordamiento de conversión no devuelve Infinity', () => {
  expect(metersPerSecondToKilometersPerHour(Number.MAX_VALUE)).toBeNull()
  expect(metersPerSecondToMilesPerHour(Number.MAX_VALUE)).toBeNull()
})
