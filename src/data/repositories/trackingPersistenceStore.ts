import type { WalkingTrackerDatabase } from '../db/database'
import { ActiveSessionRepository } from './ActiveSessionRepository'
import { TrackPointRepository } from './TrackPointRepository'
import { WalkRepository } from './WalkRepository'
import type { PersistenceStore } from '../../features/tracking/persistenceCoordinator'

/** Única frontera transaccional de T18; el coordinador no conoce Dexie. */
export function createTrackingPersistenceStore(database: WalkingTrackerDatabase): PersistenceStore {
  const walks = new WalkRepository(database)
  const points = new TrackPointRepository(database)
  const sessions = new ActiveSessionRepository(database)
  return {
    async commit(batch) {
      await database.transaction('rw', database.walks, database.trackPoints, database.activeSession, async () => {
        const existing = await walks.getById(batch.walk.id)
        if (batch.createWalk) {
          if (existing) throw new Error('Walk ID already exists; recovery is not implemented here')
          await walks.create(batch.walk)
        } else if (existing) {
          if (!await walks.update(batch.walk.id, batch.walk)) throw new Error('Walk update failed')
        } else throw new Error('Persisted walk is missing')
        if (batch.points.length) await points.bulkAdd(batch.points)
        // Se conserva el snapshot hasta que la finalización completa haya sido confirmada.
        await sessions.save(batch.activeSession)
        if (batch.finalize) await sessions.clear()
      })
    },
  }
}
