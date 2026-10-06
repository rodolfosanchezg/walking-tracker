export type WalkStatus = 'idle' | 'active' | 'paused' | 'incomplete' | 'finished'

export type ActiveSessionStatus = Extract<WalkStatus, 'active' | 'paused' | 'incomplete'>

export type GpsQuality = 'valid' | 'low-quality' | 'suspicious' | 'anomalous' | 'estimated'
