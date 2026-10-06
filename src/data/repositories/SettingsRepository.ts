import { SETTINGS_KEY } from '../db/database'
import type { WalkingTrackerDatabase } from '../db/database'
import type { Settings } from '../../types'

export class SettingsRepository {
  private readonly database: WalkingTrackerDatabase

  constructor(database: WalkingTrackerDatabase) {
    this.database = database
  }

  async get(): Promise<Settings | undefined> {
    return this.database.settings.get(SETTINGS_KEY)
  }

  async save(settings: Settings): Promise<void> {
    await this.database.settings.put(settings, SETTINGS_KEY)
  }

  /** No crea ajustes por defecto si aún no fueron guardados. */
  async update(changes: Partial<Settings>): Promise<boolean> {
    return (await this.database.settings.update(SETTINGS_KEY, changes)) === 1
  }
}
