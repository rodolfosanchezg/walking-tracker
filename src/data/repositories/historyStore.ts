import { createDatabase } from '../db/database'
import type { WalkingTrackerDatabase } from '../db/database'
import { WalkRepository } from './WalkRepository'
import { TrackPointRepository } from './TrackPointRepository'
import { ActiveSessionRepository } from './ActiveSessionRepository'
import type { Walk } from '../../types'

export interface HistoryStore {
  list(): Promise<Walk[]>
  delete(id: string): Promise<void>
}

/** La frontera transaccional evita puntos huérfanos y protege la sesión persistida. */
export function createHistoryStore(database: WalkingTrackerDatabase): HistoryStore {
  const walks = new WalkRepository(database)
  const points = new TrackPointRepository(database)
  const sessions = new ActiveSessionRepository(database)
  return {
    list: () => walks.list(),
    async delete(id) {
      await database.transaction('rw', database.walks, database.trackPoints, database.activeSession, async () => {
        if ((await sessions.get())?.walkId === id) throw new Error('Walk belongs to the persisted session')
        await points.deleteByWalkId(id)
        await walks.delete(id)
      })
    },
  }
}

async function withDatabase<T>(action: (store: HistoryStore) => Promise<T>): Promise<T> {
  const database = createDatabase()
  try { return await action(createHistoryStore(database)) }
  finally { database.close() }
}

export const historyStore: HistoryStore = {
  list: () => withDatabase(store => store.list()),
  delete: id => withDatabase(store => store.delete(id)),
}
