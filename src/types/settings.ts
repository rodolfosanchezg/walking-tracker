export type UnitSystem = 'metric' | 'imperial'

export interface Settings {
  unitSystem: UnitSystem
  keepScreenAwake: boolean
}
