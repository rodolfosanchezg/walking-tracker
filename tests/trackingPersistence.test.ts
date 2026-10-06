import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createDatabase } from '../src/data/db/database'
import { ActiveSessionRepository } from '../src/data/repositories/ActiveSessionRepository'
import { TrackPointRepository } from '../src/data/repositories/TrackPointRepository'
import { WalkRepository } from '../src/data/repositories/WalkRepository'
import { createTrackingPersistenceStore } from '../src/data/repositories/trackingPersistenceStore'
import { createPersistenceCoordinator } from '../src/features/tracking/persistenceCoordinator'
import type { PersistenceStore, RecoverySession } from '../src/features/tracking/persistenceCoordinator'
import { createPersistentTrackingController } from '../src/features/tracking/persistentTrackingController'
import type { GeolocationCallbacks } from '../src/services/geolocation/types'

let database: ReturnType<typeof createDatabase>
let clock: number
let callbacks: GeolocationCallbacks
let coordinator: ReturnType<typeof createPersistenceCoordinator>
let tracking: ReturnType<typeof createPersistentTrackingController>
let store: PersistenceStore
const stop = vi.fn()
function setup(override?: PersistenceStore) {
  store = override ?? createTrackingPersistenceStore(database)
  coordinator = createPersistenceCoordinator(store, { now: () => clock, maximumPoints: 3, maximumIntervalMs: 30_000 })
  tracking = createPersistentTrackingController(coordinator, { now: () => clock,
    geolocation: { start(cb) { callbacks = cb; return true }, stop } })
}
function emit(longitude = 0, timestamp = clock) {
  callbacks.onPosition({ latitude: 0, longitude, altitude: 100, accuracy: 5, speed: null, timestamp })
}
const points = () => new TrackPointRepository(database).getByWalkId('walk')
const active = () => new ActiveSessionRepository(database).get()
beforeEach(async () => {
  clock = 1000; stop.mockReset()
  database = createDatabase('t18-test', { indexedDB: new IDBFactory(), IDBKeyRange })
  await database.open(); setup()
})
afterEach(async () => { await tracking.cleanup(); await database.delete(); vi.restoreAllMocks() })

test('start guarda Walk y ActiveSession sin puntos', async () => {
  expect(tracking.start('walk').ok).toBe(true); await coordinator.settled()
  expect(await active()).toMatchObject({ walkId: 'walk', status: 'active', lastPersistedAt: 1000 })
  expect(await new WalkRepository(database).getById('walk')).toMatchObject({ id: 'walk', status: 'active' })
  expect(await points()).toEqual([])
})
test('buffer vacío y bajo umbral no escribe por actualización visual', async () => {
  const commit = vi.spyOn(store, 'commit'); tracking.start('walk'); await coordinator.settled()
  await tracking.tick(); emit(); clock = 2000; tracking.refresh(); await coordinator.settled()
  expect(commit).toHaveBeenCalledTimes(1); expect(coordinator.getState().pendingCount).toBe(1)
  expect(await points()).toEqual([])
})
test('cantidad suficiente dispara bloque correcto sin esperar tiempo', async () => {
  const commit = vi.spyOn(store, 'commit'); tracking.start('walk'); await coordinator.settled()
  emit(); emit(0.0001); emit(0.0002); await coordinator.settled()
  expect(await points()).toHaveLength(3); expect(coordinator.getState().pendingCount).toBe(0)
  expect(commit.mock.calls[1][0].points.map(point => point.id)).toEqual(['walk:1', 'walk:2', 'walk:3'])
})
test('tiempo suficiente dispara bloque bajo límite; frontera exacta', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  clock = 30999; await tracking.tick(); expect(await points()).toHaveLength(0)
  clock = 31000; expect((await tracking.tick()).ok).toBe(true)
  expect(await points()).toHaveLength(1); expect(coordinator.getState().lastPersistedAt).toBe(31000)
})
test('forceFlush guarda bajo límite y no duplica al repetir', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  await tracking.forceFlush(); await tracking.forceFlush()
  expect(await points()).toHaveLength(1); expect((await active())?.lastPointTimestamp).toBe(1000)
})
test('puntos llegados durante flush quedan pendientes y flush concurrente no duplica', async () => {
  let release!: () => void
  const real = createTrackingPersistenceStore(database)
  const entered = vi.fn()
  setup({ async commit(batch) { if (batch.points.length) { entered(); await new Promise<void>(resolve => { release = resolve }) } await real.commit(batch) } })
  tracking.start('walk'); await coordinator.settled(); emit()
  const first = tracking.forceFlush(), second = tracking.forceFlush()
  await vi.waitFor(() => expect(entered).toHaveBeenCalledTimes(1))
  emit(0.0001); release(); await Promise.all([first, second])
  expect(await points()).toHaveLength(1); expect(coordinator.getState().pendingCount).toBe(1)
  // Quitar el bloqueo para persistir el siguiente bloque.
  const next = tracking.forceFlush(); await vi.waitFor(() => expect(entered).toHaveBeenCalledTimes(2)); release(); await next
  expect(await points()).toHaveLength(2); expect(coordinator.getState().pendingCount).toBe(0)
})
test('bulkAdd fallido revierte transacción, conserva buffer, expone error y permite retry', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  const bulk = vi.spyOn(TrackPointRepository.prototype, 'bulkAdd').mockRejectedValueOnce(new Error('storage full'))
  expect(await tracking.forceFlush()).toMatchObject({ ok: false, error: expect.stringContaining('storage full') })
  expect(coordinator.getState()).toMatchObject({ pendingCount: 1, error: expect.stringContaining('storage full') })
  expect(await points()).toHaveLength(0)
  expect((await tracking.forceFlush()).ok).toBe(true); expect(await points()).toHaveLength(1)
  expect(coordinator.getState()).toMatchObject({ pendingCount: 0, error: null }); expect(bulk).toHaveBeenCalledTimes(2)
})
test('fallo de ActiveSession después de bulkAdd revierte puntos y retry no duplica', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  vi.spyOn(ActiveSessionRepository.prototype, 'save').mockRejectedValueOnce(new Error('session failed'))
  expect((await tracking.forceFlush()).ok).toBe(false); expect(await points()).toEqual([])
  expect(coordinator.getState().pendingCount).toBe(1)
  expect((await tracking.forceFlush()).ok).toBe(true); expect(await points()).toHaveLength(1)
})
test('inicio fallido queda observable y forceFlush permite reintentar', async () => {
  vi.spyOn(ActiveSessionRepository.prototype, 'save').mockRejectedValueOnce(new Error('start failed'))
  tracking.start('walk'); await coordinator.settled(); expect(await active()).toBeUndefined()
  expect(coordinator.getState().error).toContain('start failed')
  await tracking.forceFlush(); expect(await active()).toMatchObject({ status: 'active' })
})
test('pause/resume persisten estado e historial sin consumir puntos pendientes', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  clock = 2000; tracking.pause(); await coordinator.settled()
  expect(await active()).toMatchObject({ status: 'paused' }); expect(coordinator.getState().pendingCount).toBe(1)
  clock = 5000; tracking.resume(); await coordinator.settled()
  expect(await active()).toMatchObject({ status: 'active' })
  const session = await active() as RecoverySession
  expect(session.session.pauses).toEqual([{ startedAt: 2000, endedAt: 5000 }])
})
test('finish fuerza bloque pendiente, actualiza métricas finales y elimina ActiveSession', async () => {
  tracking.start('walk'); await coordinator.settled(); emit(); clock = 11000; emit(0.0001)
  clock = 21000; expect(await tracking.finish()).toMatchObject({ tracking: { ok: true }, persistence: { ok: true } })
  expect(await points()).toHaveLength(2); expect(await active()).toBeUndefined()
  expect(await new WalkRepository(database).getById('walk')).toMatchObject({ status: 'finished', endedAt: 21000,
    activeDurationMs: 20000, distanceMeters: { value: expect.closeTo(11.1195, 3) } })
})
test.each(['points', 'walk', 'session', 'clear'])('fallo final en %s conserva recovery y admite nueva finalización', async (stage) => {
  tracking.start('walk'); await coordinator.settled(); emit(); clock = 5000
  if (stage === 'points') vi.spyOn(TrackPointRepository.prototype, 'bulkAdd').mockRejectedValueOnce(new Error(stage))
  if (stage === 'walk') vi.spyOn(WalkRepository.prototype, 'update').mockRejectedValueOnce(new Error(stage))
  if (stage === 'session') vi.spyOn(ActiveSessionRepository.prototype, 'save').mockRejectedValueOnce(new Error(stage))
  if (stage === 'clear') vi.spyOn(ActiveSessionRepository.prototype, 'clear').mockRejectedValueOnce(new Error(stage))
  expect(await tracking.finish()).toMatchObject({ persistence: { ok: false } })
  expect(await active()).toBeDefined(); expect(coordinator.getState().pendingCount).toBe(1)
  expect(await points()).toHaveLength(0)
  expect(await tracking.finish()).toMatchObject({ persistence: { ok: true } })
  expect(await points()).toHaveLength(1); expect(await active()).toBeUndefined()
})
test('raw anomalous y puntos de pausa se guardan sin reclasificar ni convertir pausa en ruta', async () => {
  tracking.start('walk'); await coordinator.settled(); emit(); clock = 3000; emit(0.01)
  clock = 4000; tracking.pause(); emit(1); await coordinator.settled(); await tracking.forceFlush()
  expect(await points()).toEqual(tracking.getSnapshot().rawPoints.map(item => item.raw))
  const recovery = await active() as RecoverySession
  expect(recovery.pointMetadata[1].quality).toBe('anomalous')
  expect(recovery.pointMetadata[2].segment).toBeNull()
  expect(tracking.getSnapshot().metrics.distanceMeters.value).toBe(0)
})
test('permission denied guarda incomplete y conserva bloque raw', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  callbacks.onError({ kind: 'permission-denied', code: 1, message: 'denied' }); await coordinator.settled()
  expect(await active()).toMatchObject({ status: 'incomplete' }); await tracking.forceFlush()
  expect(await points()).toHaveLength(1)
})
test('cleanup repetido libera watcher y conserva datos incompletos', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  await tracking.cleanup(); await tracking.cleanup()
  expect(await active()).toMatchObject({ status: 'incomplete' }); expect(await points()).toHaveLength(1)
  expect(coordinator.getState().disposed).toBe(true)
})
test('cleanup fallido conserva buffer y puede repetirse', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  vi.spyOn(TrackPointRepository.prototype, 'bulkAdd').mockRejectedValueOnce(new Error('failed'))
  expect(await tracking.cleanup()).toMatchObject({ persistence: { ok: false } })
  expect(coordinator.getState()).toMatchObject({ pendingCount: 1, disposed: false })
  expect(await tracking.cleanup()).toMatchObject({ persistence: { ok: true } }); expect(await points()).toHaveLength(1)
})
test('cancel conserva datos persistidos y raw pendiente sin borrar caminata', async () => {
  tracking.start('walk'); await coordinator.settled(); emit(); await tracking.forceFlush(); emit(0.0001)
  await tracking.cancel()
  expect(await points()).toHaveLength(2); expect(await active()).toMatchObject({ status: 'incomplete' })
  expect(await new WalkRepository(database).getById('walk')).toBeDefined()
})
test('refresh visual no guarda estado, sin listeners Visibility/Wake Lock ni recuperación', async () => {
  const commit = vi.spyOn(store, 'commit'); const listener = vi.spyOn(document, 'addEventListener')
  tracking.start('walk'); await coordinator.settled(); tracking.refresh(); tracking.refresh(); await coordinator.settled()
  expect(commit).toHaveBeenCalledTimes(1); expect(listener).not.toHaveBeenCalled()
  expect(tracking.getSnapshot().session?.lastPersistedAt).toBeNull()
})
test('límites inválidos rechazados y timestamps inválidos no limpian buffer', async () => {
  expect(() => createPersistenceCoordinator(store, { maximumPoints: 0 })).toThrow(RangeError)
  expect(() => createPersistenceCoordinator(store, { maximumIntervalMs: Infinity })).toThrow(RangeError)
  tracking.start('walk'); await coordinator.settled(); emit(); clock = NaN
  expect((await tracking.forceFlush()).ok).toBe(false); expect(coordinator.getState().pendingCount).toBe(1)
  clock = 5000; await tracking.forceFlush()
})


test('un bloque acumulado durante escritura dispara otro flush al completar el primero', async () => {
  let release!: () => void
  const real = createTrackingPersistenceStore(database)
  let blocks = 0
  setup({ async commit(batch) {
    if (batch.points.length && ++blocks === 1) await new Promise<void>(resolve => { release = resolve })
    await real.commit(batch)
  } })
  tracking.start('walk'); await coordinator.settled(); emit()
  const first = tracking.forceFlush(); await vi.waitFor(() => expect(blocks).toBe(1))
  emit(0.0001); emit(0.0002); emit(0.0003); release(); await first; await coordinator.settled()
  expect(await points()).toHaveLength(4); expect(coordinator.getState().pendingCount).toBe(0)
})
test('una nueva caminata requiere coordinador nuevo tras finalizar o cancelar', async () => {
  tracking.start('walk'); await coordinator.settled(); await tracking.finish()
  expect(tracking.start('other')).toMatchObject({ ok: false, error: { kind: 'new-controller-required' } })
  expect(tracking.getSnapshot().watcherActive).toBe(false)
})
test('ID existente no sobrescribe la caminata anterior en el inicio', async () => {
  tracking.start('walk'); await coordinator.settled(); await tracking.finish()
  const original = await new WalkRepository(database).getById('walk')
  setup(); tracking.start('walk'); await coordinator.settled()
  expect(coordinator.getState().error).toContain('Walk ID already exists')
  expect(await new WalkRepository(database).getById('walk')).toEqual(original)
  expect(await active()).toBeUndefined()
})


test('finish durante flush espera el bloque en curso y finaliza los puntos nuevos', async () => {
  let release!: () => void
  const real = createTrackingPersistenceStore(database)
  let blocks = 0
  setup({ async commit(batch) {
    if (batch.points.length && ++blocks === 1) await new Promise<void>(resolve => { release = resolve })
    await real.commit(batch)
  } })
  tracking.start('walk'); await coordinator.settled(); emit()
  const flushing = tracking.forceFlush(); await vi.waitFor(() => expect(blocks).toBe(1))
  emit(0.0001); emit(0.0002); emit(0.0003); clock = 5000
  const finishing = tracking.finish(); release(); await flushing
  expect(await finishing).toMatchObject({ persistence: { ok: true } })
  expect(await points()).toHaveLength(4); expect(await active()).toBeUndefined()
  expect(coordinator.getState()).toMatchObject({ pendingCount: 0, finalized: true })
})


test('QA-T18-001: pause guarda estado sin reiniciar la ventana del punto pendiente', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  clock = 20000; tracking.pause(); await coordinator.settled()
  expect(coordinator.getState()).toMatchObject({ lastPersistedAt: 20000, pendingSince: 1000, pendingCount: 1 })
  clock = 31001; await tracking.tick()
  expect(await points()).toHaveLength(1); expect(coordinator.getState()).toMatchObject({ pendingCount: 0, pendingSince: null })
  await tracking.forceFlush(); expect(await points()).toHaveLength(1)
})
test('QA-T18-001: varios pause/resume no posponen el trigger temporal', async () => {
  tracking.start('walk'); await coordinator.settled(); emit()
  for (const [timestamp, action] of [[5000, 'pause'], [10000, 'resume'], [20000, 'pause'], [30000, 'resume']] as const) {
    clock = timestamp; tracking[action](); await coordinator.settled()
    expect(coordinator.getState().pendingSince).toBe(1000)
  }
  clock = 31001; await tracking.tick(); expect(await points()).toHaveLength(1)
  expect(coordinator.getState().pendingCount).toBe(0)
})
test.each([30999, 31000, 31001])('QA-T18-001: frontera temporal %s después de guardar estado', async timestamp => {
  tracking.start('walk'); await coordinator.settled(); emit()
  clock = 20000; tracking.pause(); await coordinator.settled()
  clock = timestamp; await tracking.tick()
  expect(await points()).toHaveLength(timestamp >= 31000 ? 1 : 0)
})
test('el punto nuevo durante flush conserva su propia ventana pese a escrituras de estado', async () => {
  let release!: () => void
  const real = createTrackingPersistenceStore(database)
  let blocked = false
  setup({ async commit(batch) {
    if (batch.points.length && !blocked) { blocked = true; await new Promise<void>(resolve => { release = resolve }) }
    await real.commit(batch)
  } })
  tracking.start('walk'); await coordinator.settled(); emit()
  const flushing = tracking.forceFlush(); await vi.waitFor(() => expect(blocked).toBe(true))
  clock = 5000; emit(0.0001); clock = 20000; release(); await flushing
  expect(coordinator.getState()).toMatchObject({ pendingCount: 1, pendingSince: 5000 })
  clock = 25000; tracking.pause(); await coordinator.settled()
  clock = 34999; await tracking.tick(); expect(await points()).toHaveLength(1)
  clock = 35000; await tracking.tick(); expect(await points()).toHaveLength(2)
  expect(coordinator.getState().pendingCount).toBe(0)
})
