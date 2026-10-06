import type { ActiveSession, WalkStatus } from '../../types'
import { calculateActiveDurationMs, calculateTotalDurationMs } from '../../domain/metrics/time'
import type { PauseInterval } from '../../domain/metrics/time'

export interface SessionInterruption {
  readonly startedAt: number
  readonly endedAt: number | null
  readonly previousStatus: 'active' | 'paused'
}

export interface WalkSession {
  readonly walkId: string
  readonly name: string | null
  readonly status: WalkStatus
  readonly startedAt: number | null
  readonly endedAt: number | null
  readonly currentPauseStartedAt: number | null
  readonly pauses: readonly PauseInterval[]
  readonly interruptions: readonly SessionInterruption[]
  readonly activeDurationMs: number
  readonly totalDurationMs: number
  readonly stateChangedAt: number | null
  readonly evaluatedAt: number | null
  readonly isIncomplete: boolean
  readonly lastPersistedAt: number | null
  readonly lastPointTimestamp: number | null
}

export type SessionActionType = 'start' | 'pause' | 'resume' | 'mark-incomplete' | 'continue' | 'finish' | 'refresh'
export interface SessionAction { readonly type: SessionActionType; readonly timestamp: number }
export type SessionResult<T> = { ok: true; value: T } | {
  ok: false; error: { kind: 'invalid-identity' | 'invalid-transition' | 'invalid-timestamp' | 'regressive-time' | 'invalid-state'; message: string }
}

const allowed: Record<WalkStatus, readonly SessionActionType[]> = {
  idle: ['start'], active: ['pause', 'finish', 'mark-incomplete', 'refresh'],
  paused: ['resume', 'finish', 'mark-incomplete', 'refresh'],
  incomplete: ['continue', 'finish', 'refresh'], finished: [],
}

export function canTransition(status: WalkStatus, action: SessionActionType): boolean {
  return allowed[status].includes(action)
}

function validTimestamp(timestamp: number): boolean {
  return Number.isSafeInteger(timestamp) && timestamp >= 0 && timestamp <= 8_640_000_000_000_000
}

/** Formato aprobado; UTC explícito para independencia de locale/zona del entorno. */
export function generateWalkName(timestamp: number): SessionResult<string> {
  if (!validTimestamp(timestamp)) return { ok: false, error: { kind: 'invalid-timestamp', message: 'Invalid naming timestamp' } }
  const date = new Date(timestamp)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad = (value: number) => String(value).padStart(2, '0')
  return { ok: true, value: `Caminata – ${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}` }
}

export function createWalkSession(walkId: string, name?: string): SessionResult<WalkSession> {
  if (!walkId.trim()) return { ok: false, error: { kind: 'invalid-identity', message: 'walkId must not be blank' } }
  return { ok: true, value: {
    walkId, name: name?.trim() || null, status: 'idle', startedAt: null, endedAt: null,
    currentPauseStartedAt: null, pauses: [], interruptions: [], activeDurationMs: 0, totalDurationMs: 0,
    stateChangedAt: null, evaluatedAt: null, isIncomplete: false, lastPersistedAt: null, lastPointTimestamp: null,
  } }
}

/** Transición local: no inicia GPS, Wake Lock, visibilidad ni escrituras. */
export function transitionSession(session: WalkSession, action: SessionAction): SessionResult<WalkSession> {
  if (!canTransition(session.status, action.type)) return { ok: false, error: { kind: 'invalid-transition', message: `${action.type} is not allowed from ${session.status}` } }
  const timestamp = action.timestamp
  if (!validTimestamp(timestamp)) return { ok: false, error: { kind: 'invalid-timestamp', message: 'Timestamp must be a valid non-negative integer in milliseconds' } }
  if (session.evaluatedAt !== null && timestamp < session.evaluatedAt) return { ok: false, error: { kind: 'regressive-time', message: 'Timestamp precedes the last evaluated event' } }
  let next: WalkSession = { ...session, pauses: [...session.pauses], interruptions: [...session.interruptions],
    evaluatedAt: timestamp, stateChangedAt: action.type === 'refresh' ? session.stateChangedAt : timestamp }
  const closePause = () => {
    if (next.currentPauseStartedAt !== null) next = { ...next, currentPauseStartedAt: null,
      pauses: [...next.pauses, { startedAt: next.currentPauseStartedAt, endedAt: timestamp }] }
  }
  const closeInterruption = () => {
    next = { ...next, interruptions: next.interruptions.map((gap) => gap.endedAt === null ? { ...gap, endedAt: timestamp } : gap) }
  }

  switch (action.type) {
    case 'start': {
      const generated = generateWalkName(timestamp)
      if (generated.ok === false) return generated
      next = { ...next, status: 'active', startedAt: timestamp, name: next.name ?? generated.value }
      break
    }
    case 'pause': next = { ...next, status: 'paused', currentPauseStartedAt: timestamp }; break
    case 'resume': closePause(); next = { ...next, status: 'active' }; break
    case 'mark-incomplete':
      next = { ...next, status: 'incomplete', isIncomplete: true, interruptions: [...next.interruptions,
        { startedAt: timestamp, endedAt: null, previousStatus: session.status as 'active' | 'paused' }] }
      break
    case 'continue': closePause(); closeInterruption(); next = { ...next, status: 'active' }; break
    case 'finish': closePause(); closeInterruption(); next = { ...next, status: 'finished', endedAt: timestamp }; break
    case 'refresh': break
  }
  const intervals = next.currentPauseStartedAt === null ? next.pauses
    : [...next.pauses, { startedAt: next.currentPauseStartedAt, endedAt: null }]
  const totalDurationMs = calculateTotalDurationMs(next.startedAt, timestamp)
  const activeDurationMs = calculateActiveDurationMs(next.startedAt, timestamp, intervals)
  if (totalDurationMs === null || activeDurationMs === null) return { ok: false, error: { kind: 'invalid-state', message: 'Session times are inconsistent' } }
  return { ok: true, value: { ...next, totalDurationMs, activeDurationMs } }
}

/** Contrato T06 compatible con ActiveSessionRepository, sin escribir ni recuperar datos. */
export function toActiveSessionSnapshot(session: WalkSession): SessionResult<ActiveSession> {
  if (session.startedAt === null || session.stateChangedAt === null
    || (session.status !== 'active' && session.status !== 'paused' && session.status !== 'incomplete')) {
    return { ok: false, error: { kind: 'invalid-state', message: 'Only an ongoing session has an ActiveSession snapshot' } }
  }
  return { ok: true, value: {
    walkId: session.walkId, status: session.status, startedAt: session.startedAt, stateChangedAt: session.stateChangedAt,
    activeDurationMs: session.activeDurationMs, totalDurationMs: session.totalDurationMs,
    lastPersistedAt: session.lastPersistedAt, lastPointTimestamp: session.lastPointTimestamp,
  } }
}
