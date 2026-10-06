import { expectTypeOf, test } from 'vitest'
import type {
  ActiveSession,
  ActiveSessionStatus,
  GpsQuality,
  MetricValue,
  Settings,
  TrackPoint,
  Walk,
  WalkStatus,
} from '../src/types'

test('declara estados y nulabilidad de caminatas y métricas', () => {
  expectTypeOf<WalkStatus>().toEqualTypeOf<'idle' | 'active' | 'paused' | 'incomplete' | 'finished'>()
  expectTypeOf<Walk['startedAt']>().toEqualTypeOf<number | null>()
  expectTypeOf<Walk['endedAt']>().toEqualTypeOf<number | null>()
  expectTypeOf<Walk['distanceMeters']>().toEqualTypeOf<MetricValue>()
  expectTypeOf<Extract<MetricValue, { value: null }>['estimated']>().toEqualTypeOf<false>()
})

test('distingue puntos observados y estimados, conservando GPS nullable', () => {
  expectTypeOf<GpsQuality>().toEqualTypeOf<'valid' | 'low-quality' | 'suspicious' | 'anomalous' | 'estimated'>()
  expectTypeOf<TrackPoint['altitude']>().toEqualTypeOf<number | null>()
  expectTypeOf<TrackPoint['speed']>().toEqualTypeOf<number | null>()
  expectTypeOf<Extract<TrackPoint, { estimated: false }>['accuracy']>().toEqualTypeOf<number>()
  expectTypeOf<Extract<TrackPoint, { estimated: true }>['accuracy']>().toEqualTypeOf<number | null>()
  expectTypeOf<Extract<TrackPoint, { estimated: false; quality: 'estimated' }>>().toEqualTypeOf<never>()
})

test('una sesión activa contiene datos de recuperación sin estados idle o finished', () => {
  expectTypeOf<ActiveSessionStatus>().toEqualTypeOf<'active' | 'paused' | 'incomplete'>()
  expectTypeOf<ActiveSession['walkId']>().toEqualTypeOf<Walk['id']>()
  expectTypeOf<ActiveSession['lastPersistedAt']>().toEqualTypeOf<number | null>()
  expectTypeOf<ActiveSession['lastPointTimestamp']>().toEqualTypeOf<number | null>()
})

test('configuración limitada a unidades y preferencia de pantalla', () => {
  expectTypeOf<keyof Settings>().toEqualTypeOf<'unitSystem' | 'keepScreenAwake'>()
  expectTypeOf<Settings['unitSystem']>().toEqualTypeOf<'metric' | 'imperial'>()
  expectTypeOf<Settings['keepScreenAwake']>().toEqualTypeOf<boolean>()
})
