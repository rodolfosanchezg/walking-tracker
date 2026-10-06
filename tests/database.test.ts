import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, beforeEach, expect, test } from 'vitest'
import {
  ACTIVE_SESSION_KEY,
  SETTINGS_KEY,
  createDatabase,
} from '../src/data/db/database'
import type { WalkingTrackerDatabase } from '../src/data/db/database'
import type { ActiveSession, Settings, TrackPoint, Walk } from '../src/types'

const walk: Walk = {
  id: 'walk-1',
  name: 'Caminata de prueba',
  startedAt: 1000,
  endedAt: null,
  activeDurationMs: 1000,
  totalDurationMs: 1000,
  distanceMeters: { value: 0, estimated: false },
  averageSpeedMetersPerSecond: { value: null, estimated: false },
  averagePaceSecondsPerKilometer: { value: null, estimated: false },
  elevationGainMeters: { value: null, estimated: false },
  elevationLossMeters: { value: null, estimated: false },
  status: 'active',
  isIncomplete: false,
}

const point: TrackPoint = {
  id: 'point-1',
  walkId: walk.id,
  timestamp: 2000,
  latitude: 4,
  longitude: -74,
  altitude: null,
  accuracy: 10,
  speed: null,
  quality: 'valid',
  estimated: false,
}

const session: ActiveSession = {
  walkId: walk.id,
  status: 'active',
  startedAt: 1000,
  stateChangedAt: 1000,
  activeDurationMs: 1000,
  totalDurationMs: 1000,
  lastPersistedAt: 2000,
  lastPointTimestamp: point.timestamp,
}

const settings: Settings = { unitSystem: 'metric', keepScreenAwake: true }

let factory: IDBFactory
let database: WalkingTrackerDatabase

beforeEach(async () => {
  // Una IndexedDB en memoria distinta por prueba; nunca usa la del navegador.
  factory = new IDBFactory()
  database = createDatabase('WalkingTracker-test', { indexedDB: factory, IDBKeyRange })
  await database.open()
})

afterEach(async () => {
  await database.delete()
  expect(await factory.databases()).toEqual([])
})

test('abre versión Dexie 1 con las cuatro tablas e índices mínimos', () => {
  expect(database.isOpen()).toBe(true)
  expect(database.verno).toBe(1)
  expect(database.tables.map((table) => table.name).sort()).toEqual([
    'activeSession', 'settings', 'trackPoints', 'walks',
  ])
  expect(database.walks.schema.primKey.name).toBe('id')
  expect(database.trackPoints.schema.primKey.name).toBe('id')
  expect(database.walks.schema.indexes.map((index) => index.name)).toEqual(['startedAt'])
  expect(database.trackPoints.schema.indexes.map((index) => index.name)).toEqual(['walkId'])
  for (const table of [database.activeSession, database.settings]) {
    expect(table.schema.primKey.keyPath).toBeNull()
    expect(table.schema.primKey.auto).toBe(false)
    expect(table.schema.indexes).toEqual([])
  }
})

test('escribe y lee los modelos completos de las cuatro tablas', async () => {
  await database.walks.add(walk)
  await database.trackPoints.add(point)
  await database.activeSession.put(session, ACTIVE_SESSION_KEY)
  await database.settings.put(settings, SETTINGS_KEY)

  expect(await database.walks.get(walk.id)).toEqual(walk)
  expect(await database.trackPoints.get(point.id)).toEqual(point)
  expect(await database.activeSession.get(ACTIVE_SESSION_KEY)).toEqual(session)
  expect(await database.settings.get(SETTINGS_KEY)).toEqual(settings)
})

test('consulta walkId sin mezclar puntos de otras caminatas', async () => {
  await database.trackPoints.bulkAdd([
    point,
    { ...point, id: 'point-2', timestamp: 3000 },
    { ...point, id: 'other-point', walkId: 'walk-2' },
  ])

  expect(await database.trackPoints.where('walkId').equals(walk.id).sortBy('timestamp')).toEqual([
    point, { ...point, id: 'point-2', timestamp: 3000 },
  ])
  expect(await database.trackPoints.where('walkId').equals('missing').toArray()).toEqual([])
})

test('reutiliza las claves fijas de sesión y ajustes sin crear duplicados', async () => {
  await database.activeSession.put(session, ACTIVE_SESSION_KEY)
  await database.activeSession.put({ ...session, status: 'paused' }, ACTIVE_SESSION_KEY)
  await database.settings.put(settings, SETTINGS_KEY)
  await database.settings.put({ ...settings, unitSystem: 'imperial' }, SETTINGS_KEY)

  expect(await database.activeSession.count()).toBe(1)
  expect((await database.activeSession.get(ACTIVE_SESSION_KEY))?.status).toBe('paused')
  expect(await database.settings.count()).toBe(1)
  expect((await database.settings.get(SETTINGS_KEY))?.unitSystem).toBe('imperial')
})

test('conserva los datos al cerrar y abrir otra instancia de la base', async () => {
  await database.walks.add(walk)
  database.close()
  database = createDatabase('WalkingTracker-test', { indexedDB: factory, IDBKeyRange })
  await database.open()

  expect(database.verno).toBe(1)
  expect(await database.walks.get(walk.id)).toEqual(walk)
})

test('la limpieza elimina la base y una reapertura empieza sin residuos', async () => {
  await database.walks.add(walk)
  await database.trackPoints.add(point)
  await database.activeSession.put(session, ACTIVE_SESSION_KEY)
  await database.settings.put(settings, SETTINGS_KEY)
  await database.delete()
  expect(await factory.databases()).toEqual([])

  database = createDatabase('WalkingTracker-test', { indexedDB: factory, IDBKeyRange })
  await database.open()
  for (const table of database.tables) expect(await table.count()).toBe(0)
})
