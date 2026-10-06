import type { WalkingTrackerDatabase } from '../db/database'
import type { Walk } from '../../types'

export class WalkRepository {
  private readonly database: WalkingTrackerDatabase

  constructor(database: WalkingTrackerDatabase) {
    this.database = database
  }

  async create(walk: Walk): Promise<string> {
    return this.database.walks.add(walk)
  }

  async getById(id: string): Promise<Walk | undefined> {
    return this.database.walks.get(id)
  }

  async list(): Promise<Walk[]> {
    return this.database.walks.toArray()
  }

  /** Actualiza campos completos; no cambia identidad ni crea registros ausentes. */
  async update(id: string, changes: Partial<Omit<Walk, 'id'>>): Promise<boolean> {
    return (await this.database.walks.update(id, changes)) === 1
  }

  /** Solo elimina el registro Walk; no decide políticas de cascada. */
  async delete(id: string): Promise<void> {
    await this.database.walks.delete(id)
  }
}
