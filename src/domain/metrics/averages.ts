function validValue(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0
}

/** Recibe distancia ya calculada; usa exclusivamente duración activa, en ms. */
export function calculateAverageSpeedMetersPerSecond(
  distanceMeters: number | null, activeDurationMs: number | null,
): number | null {
  if (!validValue(distanceMeters) || !validValue(activeDurationMs) || activeDurationMs === 0) return null
  const speed = distanceMeters / (activeDurationMs / 1000)
  return Number.isFinite(speed) ? speed : null
}

/** Ritmo interno en segundos por kilómetro; requiere distancia y tiempo positivos. */
export function calculateAveragePaceSecondsPerKilometer(
  distanceMeters: number | null, activeDurationMs: number | null,
): number | null {
  if (!validValue(distanceMeters) || !validValue(activeDurationMs)
    || distanceMeters === 0 || activeDurationMs === 0) return null
  const pace = activeDurationMs / distanceMeters
  return Number.isFinite(pace) ? pace : null
}
