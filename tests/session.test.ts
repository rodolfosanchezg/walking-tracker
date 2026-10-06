// @vitest-environment node
import { expect, test } from 'vitest'
import { canTransition, createWalkSession, generateWalkName, toActiveSessionSnapshot, transitionSession } from '../src/features/tracking/session'
import type { SessionActionType, SessionResult, WalkSession } from '../src/features/tracking/session'
import type { ActiveSessionRepository } from '../src/data/repositories'

function value<T>(result: SessionResult<T>): T {
  if (result.ok === false) throw new Error(result.error.message)
  return result.value
}
const initial = () => value(createWalkSession('walk'))
const step = (state: WalkSession, type: SessionActionType, timestamp: number) => value(transitionSession(state, { type, timestamp }))
const started = () => step(initial(), 'start', 1000)

test('creación idle correcta sin inicio ni pausas', () => {
  expect(initial()).toMatchObject({ walkId: 'walk', status: 'idle', startedAt: null, endedAt: null,
    currentPauseStartedAt: null, pauses: [], interruptions: [], activeDurationMs: 0, totalDurationMs: 0, isIncomplete: false })
  expect(createWalkSession(' ')).toMatchObject({ ok: false, error: { kind: 'invalid-identity' } })
})
test('idle a active conserva identidad y genera nombre al iniciar', () => {
  const state = started()
  expect(state).toMatchObject({ status: 'active', walkId: 'walk', startedAt: 1000, stateChangedAt: 1000 })
  expect(state.name).toBe('Caminata – 01 Jan 1970 00:00')
})
test('nombre manual prevalece y naming UTC respeta formato', () => {
  expect(step(value(createWalkSession('walk', ' Sendero ')), 'start', 0).name).toBe('Sendero')
  expect(value(generateWalkName(Date.UTC(2026, 9, 4, 16, 45)))).toBe('Caminata – 04 Oct 2026 16:45')
})
test('active a paused inicia pausa y refresco excluye intervalo abierto', () => {
  const state = step(started(), 'pause', 4000)
  expect(state).toMatchObject({ status: 'paused', currentPauseStartedAt: 4000, activeDurationMs: 3000 })
  expect(step(state, 'refresh', 8000)).toMatchObject({ activeDurationMs: 3000, totalDurationMs: 7000, stateChangedAt: 4000 })
})
test('paused a active cierra pausa sin contarla dos veces', () => {
  const state = step(step(started(), 'pause', 4000), 'resume', 6000)
  expect(state).toMatchObject({ status: 'active', currentPauseStartedAt: null, pauses: [{ startedAt: 4000, endedAt: 6000 }], activeDurationMs: 3000, totalDurationMs: 5000 })
})
test('dos ciclos pausa/reanudación y tiempos finales correctos', () => {
  let state = started()
  for (const [type, timestamp] of [['pause', 3000], ['resume', 5000], ['pause', 7000], ['resume', 9000]] as const) state = step(state, type, timestamp)
  state = step(state, 'finish', 11000)
  expect(state).toMatchObject({ pauses: [{ startedAt: 3000, endedAt: 5000 }, { startedAt: 7000, endedAt: 9000 }], activeDurationMs: 6000, totalDurationMs: 10000 })
})
test('active a finished fija final y tiempos', () => {
  expect(step(started(), 'finish', 11000)).toMatchObject({ status: 'finished', endedAt: 11000, activeDurationMs: 10000, totalDurationMs: 10000 })
})
test('paused a finished cierra intervalo de pausa', () => {
  expect(step(step(started(), 'pause', 4000), 'finish', 11000)).toMatchObject({ status: 'finished', currentPauseStartedAt: null,
    pauses: [{ startedAt: 4000, endedAt: 11000 }], activeDurationMs: 3000, totalDurationMs: 10000 })
})
test('active a incomplete registra interrupción diferenciada', () => {
  expect(step(started(), 'mark-incomplete', 4000)).toMatchObject({ status: 'incomplete', isIncomplete: true,
    interruptions: [{ startedAt: 4000, endedAt: null, previousStatus: 'active' }], activeDurationMs: 3000 })
})
test('paused a incomplete conserva pausa abierta', () => {
  const state = step(step(started(), 'pause', 3000), 'mark-incomplete', 4000)
  expect(state).toMatchObject({ status: 'incomplete', currentPauseStartedAt: 3000, activeDurationMs: 2000 })
})
test('incomplete a active conserva inicio/identidad e indicador de incompletitud', () => {
  const state = step(step(started(), 'mark-incomplete', 4000), 'continue', 9000)
  expect(state).toMatchObject({ status: 'active', walkId: 'walk', startedAt: 1000, isIncomplete: true,
    interruptions: [{ startedAt: 4000, endedAt: 9000, previousStatus: 'active' }], activeDurationMs: 8000, totalDurationMs: 8000 })
})
test('continuar interrupción desde pausa cierra pausa completa', () => {
  const state = step(step(step(started(), 'pause', 3000), 'mark-incomplete', 4000), 'continue', 9000)
  expect(state).toMatchObject({ status: 'active', currentPauseStartedAt: null, pauses: [{ startedAt: 3000, endedAt: 9000 }], activeDurationMs: 2000, totalDurationMs: 8000 })
})
test.each(['active', 'paused'] as const)('incomplete a finished desde %s conserva condición incompleta', (previousStatus) => {
  let state = started()
  if (previousStatus === 'paused') state = step(state, 'pause', 3000)
  state = step(step(state, 'mark-incomplete', 4000), 'finish', 9000)
  expect(state).toMatchObject({ status: 'finished', endedAt: 9000, isIncomplete: true, totalDurationMs: 8000, currentPauseStartedAt: null })
  expect(state.activeDurationMs).toBe(previousStatus === 'paused' ? 2000 : 8000)
})
test.each(['pause', 'resume', 'continue', 'finish', 'mark-incomplete', 'refresh'] as const)('acción %s rechazada desde idle', (type) => {
  expect(transitionSession(initial(), { type, timestamp: 1000 })).toMatchObject({ ok: false, error: { kind: 'invalid-transition' } })
})
test('acciones repetidas y transiciones incorrectas son errores explícitos', () => {
  expect(canTransition('active', 'resume')).toBe(false)
  const paused = step(started(), 'pause', 3000)
  expect(transitionSession(paused, { type: 'pause', timestamp: 4000 })).toMatchObject({ ok: false })
  const finished = step(started(), 'finish', 4000)
  for (const type of ['finish', 'start', 'continue', 'refresh'] as const) expect(transitionSession(finished, { type, timestamp: 5000 })).toMatchObject({ ok: false })
  expect(transitionSession(started(), { type: 'continue', timestamp: 4000 })).toMatchObject({ ok: false })
})
test('timestamps iguales admiten transiciones sin duración negativa', () => {
  const state = step(step(step(started(), 'pause', 1000), 'resume', 1000), 'finish', 1000)
  expect(state).toMatchObject({ activeDurationMs: 0, totalDurationMs: 0, pauses: [{ startedAt: 1000, endedAt: 1000 }] })
})
test('timestamp regresivo incluso tras refresh no altera estado', () => {
  const state = step(started(), 'refresh', 5000), snapshot = structuredClone(state)
  expect(transitionSession(state, { type: 'pause', timestamp: 4000 })).toMatchObject({ ok: false, error: { kind: 'regressive-time' } })
  expect(state).toEqual(snapshot)
})
test.each([NaN, Infinity, -1, 1.5, 8_640_000_000_000_001])('timestamp inválido %s es error explícito', (timestamp) => {
  expect(transitionSession(initial(), { type: 'start', timestamp })).toMatchObject({ ok: false, error: { kind: 'invalid-timestamp' } })
})
test('entradas congeladas no se mutan y resultado determinístico', () => {
  const paused = step(started(), 'pause', 3000)
  const state = Object.freeze({ ...paused, pauses: Object.freeze(paused.pauses), interruptions: Object.freeze(paused.interruptions) })
  const before = structuredClone(state), action = { type: 'resume' as const, timestamp: 5000 }
  expect(transitionSession(state, action)).toEqual(transitionSession(state, action))
  expect(state).toEqual(before)
})
test('snapshot compatible con contrato de ActiveSessionRepository sin escribir', () => {
  const snapshot = value(toActiveSessionSnapshot(step(started(), 'pause', 3000)))
  const acceptedByRepository: Parameters<ActiveSessionRepository['save']>[0] = snapshot
  expect(acceptedByRepository).toMatchObject({ walkId: 'walk', status: 'paused', startedAt: 1000,
    stateChangedAt: 3000, activeDurationMs: 2000, totalDurationMs: 2000, lastPersistedAt: null, lastPointTimestamp: null })
  expect(toActiveSessionSnapshot(initial())).toMatchObject({ ok: false })
  expect(toActiveSessionSnapshot(step(started(), 'finish', 4000))).toMatchObject({ ok: false })
})
