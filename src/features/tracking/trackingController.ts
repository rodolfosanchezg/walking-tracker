import type { MetricValue, TrackPoint } from '../../types'
import { createGeolocationService } from '../../services/geolocation/geolocationService'
import type { GeolocationError, GeolocationService, RawPosition } from '../../services/geolocation/types'
import { classifyTrackPoint, classifyTrackPoints } from '../../domain/filtering/gpsQuality'
import type { GpsAssessment } from '../../domain/filtering/gpsQuality'
import { calculateAccumulatedDistanceMeters } from '../../domain/metrics/distance'
import { calculateAveragePaceSecondsPerKilometer, calculateAverageSpeedMetersPerSecond } from '../../domain/metrics/averages'
import { buildElevationProfile, calculateElevationChange } from '../../domain/elevation/elevation'
import { createWalkSession, transitionSession } from './session'
import type { SessionActionType, WalkSession } from './session'

export interface CapturedPoint {
  readonly raw: TrackPoint
  readonly assessment: GpsAssessment
  /** null: posición de pausa o anterior al inicio del segmento; no integra ruta. */
  readonly segment: number | null
}
export interface TrackingMetrics {
  readonly distanceMeters: MetricValue
  readonly activeDurationMs: number
  readonly totalDurationMs: number
  readonly averageSpeedMetersPerSecond: MetricValue
  readonly averagePaceSecondsPerKilometer: MetricValue
  readonly elevationGainMeters: MetricValue
  readonly elevationLossMeters: MetricValue
}
export interface TrackingSnapshot {
  readonly session: WalkSession | null
  readonly rawPoints: readonly CapturedPoint[]
  readonly points: readonly TrackPoint[]
  readonly metrics: TrackingMetrics
  readonly watcherActive: boolean
  readonly gpsStatus: 'idle' | 'waiting' | 'available' | 'error'
  readonly gpsError: GeolocationError | null
  readonly trackingStatus: 'idle' | 'active' | 'paused' | 'incomplete' | 'finished' | 'cancelled'
}
export type TrackingResult = { ok: true; value: TrackingSnapshot }
  | { ok: false; error: { kind: string; message: string } }
export interface TrackingControllerOptions {
  /** Servicio exclusivo de esta instancia; no compartir watchers con otro consumidor. */
  geolocation?: GeolocationService
  now?: () => number
}

function metric(value: number | null, estimated = false): MetricValue {
  return value === null || !Number.isFinite(value) ? { value: null, estimated: false } : { value, estimated }
}

/** Controlador en memoria; sin React, repositorios, timers ni eventos de visibilidad. */
export function createTrackingController(options: TrackingControllerOptions = {}) {
  const geolocation = options.geolocation ?? createGeolocationService()
  const now = options.now ?? Date.now
  let session: WalkSession | null = null
  let captured: CapturedPoint[] = []
  let watcherActive = false
  let gpsStatus: TrackingSnapshot['gpsStatus'] = 'idle'
  let gpsError: GeolocationError | null = null
  let cancelled = false
  let generation = 0, pointNumber = 0, segment = 0, segmentStartedAt = 0

  function getSnapshot(): TrackingSnapshot {
    const segments = new Map<number, TrackPoint[]>()
    for (const item of captured) {
      if (item.segment === null) continue
      const group = segments.get(item.segment) ?? []
      const quality = item.assessment.quality
      const point: TrackPoint = quality === 'estimated' ? item.raw : { ...item.raw, quality, estimated: false, accuracy: item.raw.accuracy! }
      group.push(Object.freeze(point)); segments.set(item.segment, group)
    }
    let distance = 0, gain = 0, loss = 0, elevationEstimated = false, elevationAvailable = true
    for (const group of segments.values()) {
      distance += calculateAccumulatedDistanceMeters(group)
      const elevation = calculateElevationChange(buildElevationProfile(group))
      if (elevation.gainMeters === null || elevation.lossMeters === null) elevationAvailable = false
      else { gain += elevation.gainMeters; loss += elevation.lossMeters }
      elevationEstimated ||= elevation.estimated
    }
    const activeDurationMs = session?.activeDurationMs ?? 0
    const metrics = Object.freeze({ distanceMeters: Object.freeze(metric(distance)), activeDurationMs,
      totalDurationMs: session?.totalDurationMs ?? 0,
      averageSpeedMetersPerSecond: Object.freeze(metric(calculateAverageSpeedMetersPerSecond(distance, activeDurationMs))),
      averagePaceSecondsPerKilometer: Object.freeze(metric(calculateAveragePaceSecondsPerKilometer(distance, activeDurationMs))),
      elevationGainMeters: Object.freeze(metric(elevationAvailable ? gain : null, elevationEstimated)),
      elevationLossMeters: Object.freeze(metric(elevationAvailable ? loss : null, elevationEstimated)) })
    const sessionCopy = session === null ? null : Object.freeze({ ...session,
      pauses: Object.freeze(session.pauses.map((pause) => Object.freeze({ ...pause }))),
      interruptions: Object.freeze(session.interruptions.map((gap) => Object.freeze({ ...gap }))) })
    return Object.freeze({ session: sessionCopy, rawPoints: Object.freeze([...captured]),
      points: Object.freeze([...segments.values()].flat()), metrics, watcherActive, gpsStatus,
      gpsError, trackingStatus: cancelled ? 'cancelled' : session?.status ?? 'idle' })
  }

  const success = (): TrackingResult => ({ ok: true, value: getSnapshot() })
  const failure = (kind: string, message: string): TrackingResult => ({ ok: false, error: { kind, message } })
  function change(type: SessionActionType, timestamp: number): TrackingResult {
    if (!session) return failure('no-session', 'No session exists')
    const result = transitionSession(session, { type, timestamp })
    if (result.ok === false) return result
    session = result.value
    return success()
  }
  function stopWatcher(): TrackingResult {
    generation++
    try { geolocation.stop(); watcherActive = false; return success() }
    catch (cause) { return failure('geolocation-stop-failed', String(cause)) }
  }
  function reportError(error: GeolocationError) {
    gpsError = Object.freeze({ ...error }); gpsStatus = 'error'
    if (error.kind === 'permission-denied') {
      if (session?.status === 'active' || session?.status === 'paused') change('mark-incomplete', Math.max(now(), session.evaluatedAt!))
      stopWatcher()
    }
  }
  function receive(position: RawPosition) {
    if (!session || (session.status !== 'active' && session.status !== 'paused')) return
    const raw: TrackPoint = Object.freeze({ ...position, id: `${session.walkId}:${++pointNumber}`,
      walkId: session.walkId, quality: 'valid', estimated: false })
    const participates = session.status === 'active' && Number.isFinite(position.timestamp) && position.timestamp >= segmentStartedAt
    const group = participates ? captured.filter((item) => item.segment === segment).map((item) => item.raw) : []
    const assessment = participates ? classifyTrackPoints([...group, raw]).at(-1)! : classifyTrackPoint(raw)
    captured = [...captured, Object.freeze({ raw,
      assessment: Object.freeze({ ...assessment, signals: Object.freeze([...assessment.signals]) }),
      segment: participates ? segment : null })]
    gpsError = null; gpsStatus = 'available'
    change('refresh', Math.max(now(), session.evaluatedAt!))
  }
  function stop(timestamp = now()): TrackingResult {
    let domainResult: TrackingResult | undefined
    // Sin watcher, un cleanup repetido no intenta otra transición temporal.
    if (watcherActive && (session?.status === 'active' || session?.status === 'paused')) {
      domainResult = change('mark-incomplete', timestamp)
    }
    // La liberación no depende del éxito de la transición de dominio.
    const stopped = stopWatcher()
    if (stopped.ok === false) return stopped
    gpsStatus = gpsError ? 'error' : 'idle'
    if (domainResult?.ok === false) return domainResult
    return success()
  }

  return {
    getSnapshot,
    start(walkId: string, name?: string, timestamp = now()): TrackingResult {
      if (watcherActive || (session && session.status !== 'finished')) return failure('already-started', 'Finish or cancel the previous session first')
      const created = createWalkSession(walkId, name)
      if (created.ok === false) return created
      const started = transitionSession(created.value, { type: 'start', timestamp })
      if (started.ok === false) return started
      session = started.value; captured = []; cancelled = false; segment = 0; segmentStartedAt = timestamp
      gpsStatus = 'waiting'; gpsError = null; watcherActive = true
      const run = ++generation
      let accepted = false
      try {
        accepted = geolocation.start({ onPosition: (position) => { if (run === generation) receive(position) },
          onError: (error) => { if (run === generation) reportError(error) } })
      } catch (cause) {
        reportError({ kind: 'unknown', code: null, message: String(cause) })
      }
      if (!accepted || !watcherActive) {
        if (!gpsError) reportError({ kind: 'unknown', code: null, message: 'Geolocation observation could not start' })
        stopWatcher()
        if (session?.status === 'active' || session?.status === 'paused') change('mark-incomplete', Math.max(timestamp, session.evaluatedAt!))
        return failure('geolocation-start-failed', gpsError!.message)
      }
      return success()
    },
    pause(timestamp = now()) { return change('pause', timestamp) },
    resume(timestamp = now()) {
      const result = change('resume', timestamp)
      if (result.ok) { segment++; segmentStartedAt = timestamp }
      return result
    },
    refresh(timestamp = now()) { return change('refresh', timestamp) },
    finish(timestamp = now()): TrackingResult {
      const result = change('finish', timestamp)
      if (result.ok === false) return result
      const stopped = stopWatcher()
      if (stopped.ok === false) return stopped
      gpsStatus = gpsError ? 'error' : 'idle'
      return success()
    },
    cancel(): TrackingResult {
      const stopped = stopWatcher()
      if (stopped.ok === false) return stopped
      session = null; captured = []; cancelled = true; gpsError = null; gpsStatus = 'idle'
      return success()
    },
    stop,
    cleanup: stop,
  }
}
