/** Milla internacional: 1609.344 metros exactos. */
const METERS_PER_MILE = 1609.344

function convert(value: number | null, factor: number): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null
  const result = value * factor
  return Number.isFinite(result) ? result : null
}

export function metersToKilometers(meters: number | null): number | null {
  return convert(meters, 1 / 1000)
}

export function metersToMiles(meters: number | null): number | null {
  return convert(meters, 1 / METERS_PER_MILE)
}

export function metersPerSecondToKilometersPerHour(speed: number | null): number | null {
  return convert(speed, 3.6)
}

export function metersPerSecondToMilesPerHour(speed: number | null): number | null {
  return convert(speed, 3600 / METERS_PER_MILE)
}

/** La entrada es el ritmo interno en segundos/km, sin redondeo ni formato UI. */
export function secondsPerKilometerToMinutesPerKilometer(pace: number | null): number | null {
  return convert(pace, 1 / 60)
}

export function secondsPerKilometerToMinutesPerMile(pace: number | null): number | null {
  return convert(pace, METERS_PER_MILE / 1000 / 60)
}
