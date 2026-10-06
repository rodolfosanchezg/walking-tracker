import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createDatabase } from '../src/data/db/database'
import type { WalkingTrackerDatabase } from '../src/data/db/database'
import {
  ActiveSessionRepository,
  SettingsRepository,
  TrackPointRepository,
  WalkRepository,
} from '../src/data/repositories'
import type { ActiveSession, Settings, TrackPoint, Walk } from '../src/types'

const walk: Walk = {
  id: 'walk-1', name: 'Prueba de repositorio', startedAt: 1000, endedAt: null,
  activeDurationMs: 0, totalDurationMs: 0,
  distanceMeters: { value: 0, estimated: false },
  averageSpeedMetersPerSecond: { value: null, estimated: false },
  averagePaceSecondsPerKilometer: { value: null, estimated: false },
  elevationGainMeters: { value: null, estimated: false },
  elevationLossMeters: { value: null, estimated: false },
  status: 'active', isIncomplete: false,
}
const point: TrackPoint = {
  id: 'point-1', walkId: walk.id, timestamp: 2000,
  latitude: 4, longitude: -74, altitude: null, speed: null,
  accuracy: 10, quality: 'valid', estimated: false,
}
const session: ActiveSession = {
  walkId: walk.id, status: 'active', startedAt: 1000, stateChangedAt: 1000,
  activeDurationMs: 0, totalDurationMs: 0, lastPersistedAt: null, lastPointTimestamp: null,
}
const settings: Settings = { unitSystem: 'metric', keepScreenAwake: false }

let factory: IDBFactory
let database: WalkingTrackerDatabase
let walks: WalkRepository
let points: TrackPointRepository
let sessions: ActiveSessionRepository
let preferences: SettingsRepository

beforeEach(async () => {
  factory = new IDBFactory()
  database = createDatabase('WalkingTracker-repositories-test', { indexedDB: factory, IDBKeyRange })
  await database.open()
  walks = new WalkRepository(database)
  points = new TrackPointRepository(database)
  sessions = new ActiveSessionRepository(database)
  preferences = new SettingsRepository(database)
})

afterEach(async () => {
  await database.delete()
  expect(await factory.databases()).toEqual([])
})

describe('WalkRepository', () => {
  test('create/getById conservan el modelo completo y distinguen ausentes', async () => {
    expect(await walks.getById('missing')).toBeUndefined()
    expect(await walks.create(walk)).toBe(walk.id)
    expect(await walks.getById(walk.id)).toEqual(walk)
  })

  test('list devuelve vacío o todas las caminatas', async () => {
    expect(await walks.list()).toEqual([])
    await walks.create(walk)
    await walks.create({ ...walk, id: 'walk-2' })
    expect((await walks.list()).map((item) => item.id).sort()).toEqual(['walk-1', 'walk-2'])
  })

  test('update modifica solo los campos solicitados y conserva identidad', async () => {
    await walks.create(walk)
    expect(await walks.update(walk.id, { name: 'Nuevo nombre' })).toBe(true)
    expect(await walks.getById(walk.id)).toEqual({ ...walk, name: 'Nuevo nombre' })
    expect(walk.name).toBe('Prueba de repositorio')
  })

  test('update ausente devuelve false sin crear una caminata', async () => {
    expect(await walks.update('missing', { name: 'Nuevo' })).toBe(false)
    expect(await walks.list()).toEqual([])
  })

  test('delete es idempotente y no borra otras caminatas ni puntos', async () => {
    await walks.create(walk)
    await walks.create({ ...walk, id: 'walk-2' })
    await points.add(point)
    await walks.delete(walk.id)
    await walks.delete(walk.id)
    expect(await walks.getById(walk.id)).toBeUndefined()
    expect((await walks.list()).map((item) => item.id)).toEqual(['walk-2'])
    expect(await points.getByWalkId(walk.id)).toEqual([point])
  })

  test('create duplicado rechaza sin sobrescribir', async () => {
    await walks.create(walk)
    await expect(walks.create({ ...walk, name: 'Duplicado' })).rejects.toMatchObject({ name: 'ConstraintError' })
    expect(await walks.getById(walk.id)).toEqual(walk)
  })
})

describe('TrackPointRepository', () => {
  test('add preserva nulls y valores GPS originales', async () => {
    expect(await points.add(point)).toBe(point.id)
    expect(await points.getByWalkId(walk.id)).toEqual([point])
    await expect(points.add(point)).rejects.toMatchObject({ name: 'ConstraintError' })
    expect(await points.getByWalkId(walk.id)).toEqual([point])
  })

  test('bulkAdd/getByWalkId filtran por caminata y ordenan por timestamp', async () => {
    const earlier = { ...point, id: 'point-2', timestamp: 1500 }
    await points.bulkAdd([point, earlier, { ...point, id: 'other', walkId: 'walk-2' }])
    expect(await points.getByWalkId(walk.id)).toEqual([earlier, point])
    expect(await points.getByWalkId('missing')).toEqual([])
  })

  test('deleteByWalkId solo elimina los puntos solicitados', async () => {
    const other = { ...point, id: 'other', walkId: 'walk-2' }
    await points.bulkAdd([point, { ...point, id: 'point-2' }, other])
    expect(await points.deleteByWalkId(walk.id)).toBe(2)
    expect(await points.getByWalkId(walk.id)).toEqual([])
    expect(await points.getByWalkId('walk-2')).toEqual([other])
    expect(await points.deleteByWalkId(walk.id)).toBe(0)
  })

  test('bulkAdd vacío no cambia datos', async () => {
    await points.add(point)
    await points.bulkAdd([])
    expect(await points.getByWalkId(walk.id)).toEqual([point])
  })

  test('bulkAdd revierte el bloque completo cuando un id está duplicado', async () => {
    await points.add(point)
    await expect(points.bulkAdd([{ ...point, id: 'new-point' }, point])).rejects.toMatchObject({ name: 'BulkError' })
    expect(await points.getByWalkId(walk.id)).toEqual([point])
  })
})

describe('ActiveSessionRepository', () => {
  test('save/get crean y reemplazan la sesión única', async () => {
    expect(await sessions.get()).toBeUndefined()
    await sessions.save(session)
    expect(await sessions.get()).toEqual(session)
    const replacement: ActiveSession = { ...session, walkId: 'walk-2', status: 'paused' }
    await sessions.save(replacement)
    expect(await sessions.get()).toEqual(replacement)
    expect(await database.activeSession.count()).toBe(1)
  })

  test('clear es idempotente y no borra ajustes', async () => {
    await sessions.save(session)
    await preferences.save(settings)
    await sessions.clear()
    await sessions.clear()
    expect(await sessions.get()).toBeUndefined()
    expect(await preferences.get()).toEqual(settings)
  })
})

describe('SettingsRepository', () => {
  test('save/get crean y reemplazan ajustes sin duplicados', async () => {
    expect(await preferences.get()).toBeUndefined()
    await preferences.save(settings)
    expect(await preferences.get()).toEqual(settings)
    const replacement: Settings = { unitSystem: 'imperial', keepScreenAwake: true }
    await preferences.save(replacement)
    expect(await preferences.get()).toEqual(replacement)
    expect(await database.settings.count()).toBe(1)
  })

  test('update cambia solo los campos indicados', async () => {
    await preferences.save(settings)
    expect(await preferences.update({ keepScreenAwake: true })).toBe(true)
    expect(await preferences.get()).toEqual({ ...settings, keepScreenAwake: true })
    expect(await preferences.update({ unitSystem: 'imperial' })).toBe(true)
    expect(await preferences.get()).toEqual({ unitSystem: 'imperial', keepScreenAwake: true })
    expect(settings.keepScreenAwake).toBe(false)
  })

  test('update ausente no inventa configuración por defecto', async () => {
    expect(await preferences.update({ unitSystem: 'imperial' })).toBe(false)
    expect(await preferences.get()).toBeUndefined()
  })
})

test('los errores de almacenamiento se propagan sin devolver éxitos falsos', async () => {
  database.close({ disableAutoOpen: true })
  await expect(walks.list()).rejects.toMatchObject({ name: 'DatabaseClosedError' })
  await expect(points.add(point)).rejects.toMatchObject({ name: 'DatabaseClosedError' })
  await expect(sessions.save(session)).rejects.toMatchObject({ name: 'DatabaseClosedError' })
  await expect(preferences.update({ keepScreenAwake: true })).rejects.toMatchObject({ name: 'DatabaseClosedError' })
})
