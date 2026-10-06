import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createTrackingController } from '../src/features/tracking/trackingController'
import { createGeolocationService } from '../src/services/geolocation/geolocationService'
import { calculateAccumulatedDistanceMeters } from '../src/domain/metrics/distance'
import { calculateAverageSpeedMetersPerSecond, calculateAveragePaceSecondsPerKilometer } from '../src/domain/metrics/averages'
import { buildElevationProfile, calculateElevationChange } from '../src/domain/elevation/elevation'

let controller: ReturnType<typeof createTrackingController>
let clock: number
let success: PositionCallback
let error: PositionErrorCallback
const watchPosition = vi.fn<Geolocation['watchPosition']>()
const clearWatch = vi.fn<Geolocation['clearWatch']>()

beforeEach(() => {
  vi.resetAllMocks(); clock = 1000
  watchPosition.mockImplementation((onPosition, onError) => { success = onPosition; error = onError!; return 0 })
  vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch } })
  controller = createTrackingController({ geolocation: createGeolocationService(), now: () => clock })
})
afterEach(() => { controller.cleanup(clock); vi.unstubAllGlobals() })

function emit(values: Partial<GeolocationCoordinates> = {}, timestamp = clock) {
  const position: GeolocationPosition = { timestamp, toJSON: () => ({}), coords: {
    latitude: 0, longitude: 0, altitude: 100, accuracy: 5, speed: null,
    altitudeAccuracy: null, heading: null, toJSON: () => ({}), ...values,
  } }
  success(position)
  return position
}
const fail = (code: number) => error({ code, message: 'Original GPS error', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })

test('start activa sesión y exactamente un watcher T09; doble start explícito', () => {
  expect(controller.start('walk')).toMatchObject({ ok: true })
  expect(controller.getSnapshot()).toMatchObject({ session: { status: 'active' }, watcherActive: true, gpsStatus: 'waiting' })
  expect(watchPosition).toHaveBeenCalledTimes(1)
  expect(controller.start('other')).toMatchObject({ ok: false, error: { kind: 'already-started' } })
  expect(watchPosition).toHaveBeenCalledTimes(1)
})
test('primer punto conserva raw/nullable, walkId e identidad', () => {
  controller.start('walk')
  const input = emit({ altitude: null, speed: null }), before = structuredClone({ coords: { altitude: input.coords.altitude, speed: input.coords.speed }, timestamp: input.timestamp })
  const snapshot = controller.getSnapshot()
  expect(snapshot.points[0]).toMatchObject({ walkId: 'walk', altitude: null, speed: null, accuracy: 5, latitude: 0, longitude: 0, timestamp: 1000 })
  expect(snapshot.rawPoints[0].assessment.quality).toBe('valid')
  expect(snapshot.rawPoints[0].raw.id).toBe('walk:1')
  expect({ coords: { altitude: input.coords.altitude, speed: input.coords.speed }, timestamp: input.timestamp }).toEqual(before)
})
test('varios puntos integran métricas T12-T15 sin duplicar fórmulas', () => {
  controller.start('walk'); emit()
  clock = 11000; emit({ longitude: 0.0001, altitude: 110 })
  clock = 21000; emit({ longitude: 0.0002, altitude: 120 })
  const snapshot = controller.getSnapshot(), distance = calculateAccumulatedDistanceMeters(snapshot.points)
  expect(snapshot.points).toHaveLength(3)
  expect(snapshot.metrics.distanceMeters).toEqual({ value: distance, estimated: false })
  expect(snapshot.metrics.activeDurationMs).toBe(20000)
  expect(snapshot.metrics.averageSpeedMetersPerSecond.value).toBe(calculateAverageSpeedMetersPerSecond(distance, 20000))
  expect(snapshot.metrics.averagePaceSecondsPerKilometer.value).toBe(calculateAveragePaceSecondsPerKilometer(distance, 20000))
  const elevation = calculateElevationChange(buildElevationProfile(snapshot.points))
  expect(snapshot.metrics.elevationGainMeters.value).toBe(elevation.gainMeters)
  expect(snapshot.metrics.elevationLossMeters.value).toBe(elevation.lossMeters)
  expect(elevation.gainMeters).toBe(20)
})
test.each([['low-quality', { accuracy: 1000 }], ['suspicious', { speed: 10 }]] as const)('T14 produce %s conservando campos raw', (quality, values) => {
  controller.start('walk'); emit(values)
  expect(controller.getSnapshot().points[0].quality).toBe(quality)
  expect(controller.getSnapshot().rawPoints[0].raw).toMatchObject(values)
})
test('anomalous se conserva en memoria y queda excluido de métricas', () => {
  controller.start('walk'); emit()
  clock = 3000; emit({ latitude: 0.01, altitude: 1000 })
  const snapshot = controller.getSnapshot()
  expect(snapshot.points[1].quality).toBe('anomalous')
  expect(snapshot.rawPoints[1].raw).toMatchObject({ latitude: 0.01, altitude: 1000 })
  expect(snapshot.metrics.distanceMeters.value).toBe(0)
  expect(snapshot.metrics.elevationGainMeters.value).toBe(0)
})
test('pausa conserva watcher/raw pero excluye puntos y desplazamiento al reanudar', () => {
  controller.start('walk'); emit()
  clock = 11000; emit({ longitude: 0.0001, altitude: 110 })
  const before = controller.getSnapshot().metrics.distanceMeters.value
  clock = 12000; expect(controller.pause().ok).toBe(true)
  clock = 16000; emit({ longitude: 1, altitude: 9000 })
  expect(controller.getSnapshot().metrics.distanceMeters.value).toBe(before)
  expect(controller.getSnapshot().points).toHaveLength(2)
  expect(controller.getSnapshot().rawPoints[2].segment).toBeNull()
  clock = 21000; expect(controller.resume().ok).toBe(true)
  emit({ longitude: 1, altitude: 500 })
  expect(controller.getSnapshot().metrics.distanceMeters.value).toBe(before)
  clock = 31000; emit({ longitude: 1.0001, altitude: 510 })
  const snapshot = controller.getSnapshot()
  expect(snapshot.metrics.distanceMeters.value!).toBeCloseTo(before! * 2, 5)
  expect(snapshot.metrics.elevationGainMeters.value).toBe(20)
  expect(snapshot.metrics.activeDurationMs).toBe(21000)
  expect(snapshot.metrics.totalDurationMs).toBe(30000)
  expect(watchPosition).toHaveBeenCalledTimes(1)
})
test('posición antigua tras resume se conserva raw pero no integra segmento nuevo', () => {
  controller.start('walk'); emit(); clock = 2000; controller.pause()
  clock = 5000; controller.resume(); emit({ longitude: 1 }, 3000)
  expect(controller.getSnapshot().rawPoints[1].segment).toBeNull()
  expect(controller.getSnapshot().points).toHaveLength(1)
})
test('finish cierra sesión, calcula métricas finales y elimina watcher', () => {
  controller.start('walk'); emit(); clock = 11000; emit({ longitude: 0.0001 })
  clock = 21000; const result = controller.finish()
  expect(result).toMatchObject({ ok: true, value: { watcherActive: false, session: { status: 'finished', endedAt: 21000 }, metrics: { activeDurationMs: 20000 } } })
  expect(clearWatch).toHaveBeenCalledExactlyOnceWith(0)
  emit({ longitude: 1 }); expect(controller.getSnapshot().points).toHaveLength(2)
})
test('finish desde pausa cierra intervalo sin aceptar puntos de pausa', () => {
  controller.start('walk'); emit(); clock = 11000; controller.pause()
  clock = 16000; emit({ longitude: 1 }); clock = 21000; controller.finish()
  expect(controller.getSnapshot().session).toMatchObject({ currentPauseStartedAt: null, activeDurationMs: 10000,
    totalDurationMs: 20000, pauses: [{ startedAt: 11000, endedAt: 21000 }] })
})
test('cancel descarta memoria y permite una nueva caminata', () => {
  controller.start('walk'); emit(); controller.cancel(); controller.cancel()
  expect(controller.getSnapshot()).toMatchObject({ session: null, points: [], rawPoints: [], watcherActive: false, trackingStatus: 'cancelled' })
  clock = 2000; expect(controller.start('next').ok).toBe(true)
  expect(watchPosition).toHaveBeenCalledTimes(2)
})
test('stop/cleanup repetido y callback tardío seguros, incluso cleanup extraído', () => {
  controller.start('walk'); emit(); clock = 2000
  const cleanup = controller.cleanup
  expect(cleanup().ok).toBe(true); expect(cleanup().ok).toBe(true)
  expect(controller.getSnapshot()).toMatchObject({ watcherActive: false, session: { status: 'incomplete' } })
  emit({ longitude: 1 }); expect(controller.getSnapshot().points).toHaveLength(1)
  expect(clearWatch).toHaveBeenCalledTimes(1)
})
test.each([1, 2, 3, 99])('error GPS %s propagado sin UI', (code) => {
  controller.start('walk'); fail(code)
  expect(controller.getSnapshot().gpsError).toMatchObject({ code, message: 'Original GPS error' })
  expect(controller.getSnapshot().gpsStatus).toBe('error')
  expect(controller.getSnapshot().watcherActive).toBe(code !== 1)
  if (code === 1) expect(controller.getSnapshot().session?.status).toBe('incomplete')
  else { emit(); expect(controller.getSnapshot().gpsError).toBeNull() }
})
test('ausencia de Geolocation al start es fallo explícito con sesión incompleta', () => {
  vi.stubGlobal('navigator', {})
  expect(controller.start('walk')).toMatchObject({ ok: false, error: { kind: 'geolocation-start-failed' } })
  expect(controller.getSnapshot()).toMatchObject({ watcherActive: false, session: { status: 'incomplete' }, gpsError: { kind: 'unsupported' } })
})
test('fallo síncrono al iniciar y start false dejan estado explícito', () => {
  watchPosition.mockImplementationOnce(() => { throw new Error('Start failed') })
  expect(controller.start('walk').ok).toBe(false)
  expect(controller.getSnapshot().watcherActive).toBe(false)
  controller.cancel()
  controller = createTrackingController({ geolocation: { start: () => false, stop: vi.fn() }, now: () => clock })
  expect(controller.start('other').ok).toBe(false)
  expect(controller.getSnapshot().session?.status).toBe('incomplete')
})
test('snapshot no permite mutar memoria interna', () => {
  controller.start('walk'); emit()
  const snapshot = controller.getSnapshot()
  expect(Object.isFrozen(snapshot)).toBe(true)
  expect(Object.isFrozen(snapshot.rawPoints[0].raw)).toBe(true)
  expect(Object.isFrozen(snapshot.session!.pauses)).toBe(true)
  expect(() => (snapshot.rawPoints as unknown[]).push('invalid')).toThrow()
  expect(controller.getSnapshot().rawPoints).toHaveLength(1)
})
test('acciones inválidas de T16 no modifican watcher ni memoria', () => {
  expect(controller.pause().ok).toBe(false)
  controller.start('walk'); clock = 11000; controller.pause()
  expect(controller.pause().ok).toBe(false)
  expect(controller.resume(5000).ok).toBe(false)
  expect(controller.getSnapshot().session?.status).toBe('paused')
  expect(watchPosition).toHaveBeenCalledTimes(1)
})
test('no persistencia/browser integraciones: solo servicio inyectado y consultas de snapshot', () => {
  const start = vi.fn(() => true), stop = vi.fn()
  const injected = createTrackingController({ geolocation: { start, stop }, now: () => clock })
  injected.start('walk'); injected.getSnapshot(); injected.pause(); injected.resume(); injected.finish()
  expect(start).toHaveBeenCalledTimes(1); expect(stop).toHaveBeenCalledTimes(1)
  expect(injected.getSnapshot().session?.lastPersistedAt).toBeNull()
})

test('QA-T17-001: cleanup libera watcher aunque el reloj retroceda', () => {
  controller.start('walk', undefined, 1000)
  emit()
  clock = 11000
  expect(controller.refresh().ok).toBe(true)
  clock = 5000
  expect(controller.cleanup()).toMatchObject({ ok: false, error: { kind: 'regressive-time' } })
  expect(clearWatch).toHaveBeenCalledExactlyOnceWith(0)
  expect(controller.getSnapshot()).toMatchObject({ watcherActive: false, gpsStatus: 'idle',
    session: { evaluatedAt: 11000, activeDurationMs: 10000 } })
  emit({ longitude: 1 })
  expect(controller.getSnapshot().rawPoints).toHaveLength(1)
  expect(controller.cleanup().ok).toBe(true)
  expect(clearWatch).toHaveBeenCalledTimes(1)
  expect(controller.getSnapshot().watcherActive).toBe(false)
})

test('cleanup también libera watcher tras error temporal invalid-timestamp desde pausa', () => {
  controller.start('walk')
  clock = 2000
  controller.pause()
  expect(controller.cleanup(NaN)).toMatchObject({ ok: false, error: { kind: 'invalid-timestamp' } })
  expect(clearWatch).toHaveBeenCalledExactlyOnceWith(0)
  expect(controller.getSnapshot().watcherActive).toBe(false)
  expect(controller.cleanup(NaN).ok).toBe(true)
  expect(clearWatch).toHaveBeenCalledTimes(1)
})
