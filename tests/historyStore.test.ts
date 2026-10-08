import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createDatabase, ACTIVE_SESSION_KEY } from '../src/data/db/database'
import type { WalkingTrackerDatabase } from '../src/data/db/database'
import { createHistoryStore } from '../src/data/repositories/historyStore'
import { WalkRepository } from '../src/data/repositories/WalkRepository'
import type { Walk, TrackPoint } from '../src/types'
let db: WalkingTrackerDatabase
let factory: IDBFactory
const walk: Walk = { id: 'a', name: 'A', startedAt: 1000, endedAt: 2000, activeDurationMs: 1000, totalDurationMs: 1000,
  distanceMeters: { value: 0, estimated: false }, averageSpeedMetersPerSecond: { value: 0, estimated: false },
  averagePaceSecondsPerKilometer: { value: null, estimated: false }, elevationGainMeters: { value: 0, estimated: false }, elevationLossMeters: { value: 0, estimated: false }, status: 'finished', isIncomplete: false }
const point: TrackPoint = { id: 'p', walkId: 'a', timestamp: 1000, latitude: 4, longitude: -74, altitude: null, speed: null, accuracy: 5, quality: 'valid', estimated: false }
beforeEach(async () => { factory = new IDBFactory(); db = createDatabase('history-test', { indexedDB: factory, IDBKeyRange }); await db.walks.bulkAdd([walk, { ...walk, id: 'b' }]); await db.trackPoints.bulkAdd([point, { ...point, id: 'q', walkId: 'b' }]) })
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); expect(await factory.databases()).toEqual([]) })
test('list usa WalkRepository y no reconstruye puntos', async () => { expect(await createHistoryStore(db).list()).toHaveLength(2) })
test('Delete atómico borra Walk y sus puntos; conserva otros', async () => {
  await createHistoryStore(db).delete('a'); expect(await db.walks.get('a')).toBeUndefined(); expect(await db.trackPoints.get('p')).toBeUndefined()
  expect(await db.walks.get('b')).toBeDefined(); expect(await db.trackPoints.get('q')).toBeDefined()
})
test('fallo al borrar Walk revierte borrado de puntos', async () => {
  vi.spyOn(WalkRepository.prototype, 'delete').mockRejectedValueOnce(new Error('failure'))
  await expect(createHistoryStore(db).delete('a')).rejects.toThrow('failure'); expect(await db.trackPoints.get('p')).toBeDefined(); expect(await db.walks.get('a')).toBeDefined()
})
test('sesión persistida protege Walk y puntos', async () => {
  await db.activeSession.put({ walkId: 'a', status: 'active', startedAt: 1000, stateChangedAt: 1000, activeDurationMs: 0, totalDurationMs: 0, lastPersistedAt: 1000, lastPointTimestamp: 1000 }, ACTIVE_SESSION_KEY)
  await expect(createHistoryStore(db).delete('a')).rejects.toThrow(); expect(await db.walks.get('a')).toBeDefined(); expect(await db.trackPoints.get('p')).toBeDefined()
})
test('eliminación persiste tras reapertura y repetir es seguro', async () => {
  await createHistoryStore(db).delete('a'); db.close(); db = createDatabase('history-test', { indexedDB: factory, IDBKeyRange })
  expect(await createHistoryStore(db).list()).toEqual([{ ...walk, id: 'b' }]); await createHistoryStore(db).delete('a'); expect(await db.trackPoints.count()).toBe(1)
})
