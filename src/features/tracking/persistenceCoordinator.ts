import type { ActiveSession, TrackPoint, Walk } from '../../types'
import type { CapturedPoint, TrackingSnapshot } from './trackingController'
import type { WalkSession } from './session'

export const DEFAULT_PERSISTENCE_LIMITS = Object.freeze({ maximumPoints: 50, maximumIntervalMs: 30_000 })
export interface RecoverySession extends ActiveSession {
  /** Información adicional para T26, sin implementar su reconstrucción. */
  session: WalkSession
  pointMetadata: readonly { id: string; segment: number | null; quality: CapturedPoint['assessment']['quality'] }[]
}
export interface PersistenceBatch {
  walk: Walk
  points: readonly TrackPoint[]
  activeSession: RecoverySession
  finalize: boolean
  createWalk: boolean
}
/** commit debe ser atómico: puntos, Walk y ActiveSession se confirman o revierten juntos. */
export interface PersistenceStore { commit(batch: PersistenceBatch): Promise<void> }
export type PersistenceResult = { ok: true } | { ok: false; error: string }

export function createPersistenceCoordinator(store: PersistenceStore, options: {
  now?: () => number
  maximumPoints?: number
  maximumIntervalMs?: number
} = {}) {
  const now = options.now ?? Date.now
  const maximumPoints = options.maximumPoints ?? DEFAULT_PERSISTENCE_LIMITS.maximumPoints
  const maximumIntervalMs = options.maximumIntervalMs ?? DEFAULT_PERSISTENCE_LIMITS.maximumIntervalMs
  if (!Number.isSafeInteger(maximumPoints) || maximumPoints < 1 || !Number.isFinite(maximumIntervalMs) || maximumIntervalMs <= 0) throw new RangeError('Invalid persistence limits')
  let snapshot: TrackingSnapshot | undefined
  let pending: CapturedPoint[] = []
  // Reloj de recepción del buffer, independiente de los timestamps GPS y de guardados de estado.
  const enqueuedAt = new Map<string, number>()
  const seen = new Set<string>()
  const persisted = new Set<string>()
  let lastPersistedAt: number | null = null, lastPointTimestamp: number | null = null
  let error: string | null = null, writing = false, finalized = false, disposed = false
  let queue: Promise<unknown> = Promise.resolve()
  let flushPromise: Promise<PersistenceResult> | undefined

  const pendingSince = () => pending.length ? enqueuedAt.get(pending[0].raw.id)! : null

  function getState() {
    return Object.freeze({ pendingCount: pending.length, pendingSince: pendingSince(), writing, error, lastPersistedAt,
      lastPointTimestamp, finalized, disposed })
  }
  function serial(task: () => Promise<void>): Promise<PersistenceResult> {
    const result = queue.then(async (): Promise<PersistenceResult> => {
      writing = true
      try { await task(); error = null; return { ok: true } }
      catch (cause) { error = String(cause); return { ok: false, error } }
      finally { writing = false }
    })
    queue = result
    return result
  }
  function batch(view: TrackingSnapshot, block: readonly CapturedPoint[], final: boolean): PersistenceBatch {
    const session = view.session!
    if (session.startedAt === null || session.stateChangedAt === null) throw new Error('Session has not started')
    const timestamp = now()
    if (!Number.isSafeInteger(timestamp) || timestamp < 0) throw new Error('Invalid persistence timestamp')
    const latestPoint = block.reduce<number | null>((latest, item) => Number.isFinite(item.raw.timestamp)
      ? Math.max(latest ?? item.raw.timestamp, item.raw.timestamp) : latest, lastPointTimestamp)
    const walk: Walk = { id: session.walkId, name: session.name!, startedAt: session.startedAt,
      endedAt: session.endedAt, status: session.status, isIncomplete: session.isIncomplete,
      activeDurationMs: session.activeDurationMs, totalDurationMs: session.totalDurationMs,
      distanceMeters: view.metrics.distanceMeters, averageSpeedMetersPerSecond: view.metrics.averageSpeedMetersPerSecond,
      averagePaceSecondsPerKilometer: view.metrics.averagePaceSecondsPerKilometer,
      elevationGainMeters: view.metrics.elevationGainMeters, elevationLossMeters: view.metrics.elevationLossMeters }
    return { walk, points: block.map(item => item.raw), finalize: final, createWalk: lastPersistedAt === null,
      activeSession: { walkId: session.walkId, status: session.status === 'paused' ? 'paused'
        : session.status === 'active' ? 'active' : 'incomplete', startedAt: session.startedAt,
        stateChangedAt: session.stateChangedAt, activeDurationMs: session.activeDurationMs,
        totalDurationMs: session.totalDurationMs, lastPersistedAt: timestamp, lastPointTimestamp: latestPoint,
        session, pointMetadata: view.rawPoints.filter(item => persisted.has(item.raw.id) || block.some(point => point.raw.id === item.raw.id)).map(item => ({ id: item.raw.id, segment: item.segment, quality: item.assessment.quality })) } }
  }
  async function write(view: TrackingSnapshot, block: readonly CapturedPoint[], final: boolean) {
    const data = batch(view, block, final)
    await store.commit(data)
    const ids = new Set(block.map(item => item.raw.id))
    for (const id of ids) { persisted.add(id); enqueuedAt.delete(id) }
    pending = pending.filter(item => !ids.has(item.raw.id))
    lastPersistedAt = data.activeSession.lastPersistedAt
    lastPointTimestamp = data.activeSession.lastPointTimestamp
    finalized ||= final
  }
  function flush(final = false): Promise<PersistenceResult> {
    if (flushPromise) return flushPromise
    if (!snapshot?.session || disposed || finalized) return Promise.resolve({ ok: true })
    const view = snapshot
    // Nuevas capturas no pertenecen al bloque en curso.
    const block = [...pending]
    flushPromise = serial(() => write(view, block, final)).then(result => {
      flushPromise = undefined
      // Un bloque nuevo que alcanzó el límite durante la escritura no espera otro GPS.
      if (result.ok && !final && !disposed && pending.length >= maximumPoints) void checkFlush()
      return result
    })
    return flushPromise
  }
  function checkFlush(timestamp = now()): Promise<PersistenceResult> {
    if (!pending.length || disposed || finalized || snapshot?.session?.status === 'finished') return Promise.resolve({ ok: true })
    const timeDue = Number.isFinite(timestamp) && timestamp - pendingSince()! >= maximumIntervalMs
    return pending.length >= maximumPoints || timeDue ? flush() : Promise.resolve({ ok: true })
  }
  function observe(view: TrackingSnapshot): Promise<PersistenceResult> {
    if (disposed) return Promise.resolve({ ok: false, error: 'Persistence coordinator disposed' })
    if (!view.session) return Promise.resolve({ ok: true })
    if (snapshot?.session?.walkId && snapshot.session.walkId !== view.session.walkId) return Promise.resolve({ ok: false, error: 'Use one coordinator per walk' })
    const stateChanged = !snapshot || snapshot.session?.status !== view.session.status
    snapshot = view
    for (const item of view.rawPoints) if (!seen.has(item.raw.id)) {
      seen.add(item.raw.id); pending.push(item)
      const receivedAt = now()
      enqueuedAt.set(item.raw.id, Number.isSafeInteger(receivedAt) && receivedAt >= 0 ? receivedAt : view.session.evaluatedAt!)
    }
    if (stateChanged && view.session.status !== 'finished') {
      const stateWrite = serial(() => write(view, [], false))
      // El estado no consume el buffer; el trigger puede encolarse sin bloquear GPS.
      void checkFlush()
      return stateWrite
    }
    return view.session.status === 'finished' ? Promise.resolve({ ok: true }) : checkFlush()
  }
  async function finalize(view: TrackingSnapshot): Promise<PersistenceResult> {
    if (view.session?.status !== 'finished') return { ok: false, error: 'Tracking must finish first' }
    await observe(view)
    // Un flush previo puede estar en curso; esperar sin solapar transacciones.
    while (flushPromise) await flushPromise
    return flush(true)
  }
  async function cleanup(): Promise<PersistenceResult> {
    if (disposed) return { ok: true }
    const result = await flush(snapshot?.session?.status === 'finished')
    if (result.ok && pending.length) return cleanup()
    if (result.ok) disposed = true
    return result
  }
  return { observe, checkFlush, forceFlush: () => flush(snapshot?.session?.status === 'finished'), finalize, cleanup, getState,
    settled: async () => { await queue; return getState() } }
}
