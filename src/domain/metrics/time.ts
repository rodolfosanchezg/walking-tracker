export interface PauseInterval {
  readonly startedAt: number
  /** null mientras la pausa siga abierta; se evalúa hasta el final recibido. */
  readonly endedAt: number | null
}

function validTimestamp(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0
}

/** Timestamps Unix y resultado en milisegundos; no consulta el reloj del sistema. */
export function calculateTotalDurationMs(startedAt: number | null, endedAt: number | null): number | null {
  if (!validTimestamp(startedAt) || !validTimestamp(endedAt) || endedAt < startedAt) return null
  const duration = endedAt - startedAt
  return Number.isFinite(duration) ? duration : null
}

/** Excluye la unión de pausas dentro del intervalo, sin modificar las entradas. */
export function calculateActiveDurationMs(
  startedAt: number | null,
  endedAt: number | null,
  pauses: readonly PauseInterval[] = [],
): number | null {
  const total = calculateTotalDurationMs(startedAt, endedAt)
  if (total === null || startedAt === null || endedAt === null) return null
  const intervals: { start: number; end: number }[] = []
  for (const pause of pauses) {
    if (!validTimestamp(pause.startedAt)
      || (pause.endedAt !== null && (!validTimestamp(pause.endedAt) || pause.endedAt < pause.startedAt))) return null
    const start = Math.max(startedAt, pause.startedAt)
    const end = Math.min(endedAt, pause.endedAt ?? endedAt)
    if (end > start) intervals.push({ start, end })
  }
  intervals.sort((a, b) => a.start - b.start)
  let pausedMs = 0
  let previous: { start: number; end: number } | undefined
  for (const interval of intervals) {
    if (previous && interval.start <= previous.end) {
      previous.end = Math.max(previous.end, interval.end)
    } else {
      if (previous) pausedMs += previous.end - previous.start
      previous = interval
    }
  }
  if (previous) pausedMs += previous.end - previous.start
  const activeMs = total - pausedMs
  return Number.isFinite(activeMs) && activeMs >= 0 ? activeMs : null
}
