import type { WalkingTrackerDatabase } from '../db/database'
import type { TrackPoint } from '../../types'

export class TrackPointRepository {
  private readonly database: WalkingTrackerDatabase

  constructor(database: WalkingTrackerDatabase) {
    this.database = database
  }

  async add(point: TrackPoint): Promise<string> {
    return this.database.trackPoints.add(point)
  }

  /** Si falla cualquier inserción, se revierte el bloque completo. */
  async bulkAdd(points: readonly TrackPoint[]): Promise<void> {
    await this.database.transaction('rw', this.database.trackPoints, () =>
      this.database.trackPoints.bulkAdd(points),
    )
  }

  async getByWalkId(walkId: string): Promise<TrackPoint[]> {
    return this.database.trackPoints.where('walkId').equals(walkId).sortBy('timestamp')
  }

  async deleteByWalkId(walkId: string): Promise<number> {
    return this.database.trackPoints.where('walkId').equals(walkId).delete()
  }
}
