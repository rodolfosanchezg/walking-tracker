import { ACTIVE_SESSION_KEY } from '../db/database'
import type { WalkingTrackerDatabase } from '../db/database'
import type { ActiveSession } from '../../types'

export class ActiveSessionRepository {
  private readonly database: WalkingTrackerDatabase

  constructor(database: WalkingTrackerDatabase) {
    this.database = database
  }

  async save(session: ActiveSession): Promise<void> {
    await this.database.activeSession.put(session, ACTIVE_SESSION_KEY)
  }

  async get(): Promise<ActiveSession | undefined> {
    return this.database.activeSession.get(ACTIVE_SESSION_KEY)
  }

  async clear(): Promise<void> {
    await this.database.activeSession.delete(ACTIVE_SESSION_KEY)
  }
}
