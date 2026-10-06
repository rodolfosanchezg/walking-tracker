import { Dexie } from 'dexie'
import type { DexieOptions } from 'dexie'
import type { ActiveSession, Settings, TrackPoint, Walk } from '../../types'

export const DATABASE_NAME = 'WalkingTracker'
export const DATABASE_VERSION = 1
export const ACTIVE_SESSION_KEY = 'current'
export const SETTINGS_KEY = 'preferences'

/** Cada objeto completo se almacena; aquí solo se declaran claves e índices. */
const schemaV1 = {
  walks: 'id, startedAt',
  trackPoints: 'id, walkId',
  // Claves externas fijas para singletons, sin modificar los modelos T06.
  activeSession: '',
  settings: '',
}

/** Define la base sin abrirla ni acceder a datos durante el import. */
export function createDatabase(name = DATABASE_NAME, options?: DexieOptions) {
  const database = new Dexie(name, options)
  // Futuras versiones se declararán separadamente, preservando este esquema v1.
  database.version(DATABASE_VERSION).stores(schemaV1)

  return Object.assign(database, {
    walks: database.table<Walk, string>('walks'),
    trackPoints: database.table<TrackPoint, string>('trackPoints'),
    activeSession: database.table<ActiveSession, typeof ACTIVE_SESSION_KEY>('activeSession'),
    settings: database.table<Settings, typeof SETTINGS_KEY>('settings'),
  })
}

export type WalkingTrackerDatabase = ReturnType<typeof createDatabase>
