import { createDatabase } from '../db/database'
import type { WalkingTrackerDatabase } from '../db/database'
import { WalkRepository } from './WalkRepository'
import { TrackPointRepository } from './TrackPointRepository'
import { ActiveSessionRepository } from './ActiveSessionRepository'
import type { TrackPoint, Walk } from '../../types'
import type { RecoverySession } from '../../features/tracking/persistenceCoordinator'

export interface WalkDetailData {
  walk: Walk
  points: TrackPoint[]
  metadata?: RecoverySession['pointMetadata']
}
export interface WalkDetailStore {
  get(id: string): Promise<WalkDetailData | undefined>
  rename(id: string, name: string): Promise<string>
}

export function createWalkDetailStore(database: WalkingTrackerDatabase): WalkDetailStore {
  const walks = new WalkRepository(database), points = new TrackPointRepository(database)
  const sessions = new ActiveSessionRepository(database)
  return {
    get: id => database.transaction('r', database.walks, database.trackPoints, database.activeSession, async () => {
      const walk = await walks.getById(id)
      if (!walk) return undefined
      const session = await sessions.get() as RecoverySession | undefined
      return { walk, points: await points.getByWalkId(id), metadata: session?.walkId === id ? session.pointMetadata : undefined }
    }),
    async rename(id, name) {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Empty walk name')
      await database.transaction('rw', database.walks, database.activeSession, async () => {
        // La sesión en memoria podría sobrescribir el cambio; no modificarla desde detalle.
        if ((await sessions.get())?.walkId === id) throw new Error('Walk belongs to a pending session')
        if (!await walks.update(id, { name: trimmed })) throw new Error('Walk not found')
      })
      return trimmed
    },
  }
}
async function withDatabase<T>(action: (store: WalkDetailStore) => Promise<T>): Promise<T> {
  const database = createDatabase()
  try { return await action(createWalkDetailStore(database)) }
  finally { database.close() }
}
export const walkDetailStore: WalkDetailStore = {
  get: id => withDatabase(store => store.get(id)),
  rename: (id, name) => withDatabase(store => store.rename(id, name)),
}
