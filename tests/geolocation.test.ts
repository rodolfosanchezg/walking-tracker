import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createGeolocationService, DEFAULT_GEOLOCATION_OPTIONS } from '../src/services/geolocation/geolocationService'
import type { GeolocationService } from '../src/services/geolocation/types'

const position: GeolocationPosition = {
  timestamp: 1234,
  coords: {
    latitude: 4.5, longitude: -74.2, altitude: 2600, accuracy: 8, speed: 1.2,
    altitudeAccuracy: null, heading: null, toJSON: () => ({}),
  },
  toJSON: () => ({}),
}

let service: GeolocationService
let successes: PositionCallback[]
let failures: PositionErrorCallback[]
const watchPosition = vi.fn<Geolocation['watchPosition']>()
const clearWatch = vi.fn<Geolocation['clearWatch']>()
const onPosition = vi.fn()
const onError = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  successes = []
  failures = []
  watchPosition.mockImplementation((success, error) => {
    successes.push(success)
    if (error) failures.push(error)
    return successes.length - 1
  })
  vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch } })
  service = createGeolocationService()
})

afterEach(() => {
  service.stop()
  vi.unstubAllGlobals()
})

describe('servicio de geolocalización', () => {
  test('no observa al construir; start usa navigator y las opciones centralizadas', () => {
    expect(watchPosition).not.toHaveBeenCalled()
    expect(service.start({ onPosition, onError })).toBe(true)
    expect(watchPosition).toHaveBeenCalledExactlyOnceWith(
      expect.any(Function), expect.any(Function), { enableHighAccuracy: true, maximumAge: 0 },
    )
  })

  test('permite configurar todas las opciones sin cambiar los defaults', () => {
    const options = { enableHighAccuracy: false, maximumAge: 1000, timeout: 5000 }
    service.start({ onPosition, onError }, options)
    expect(watchPosition.mock.calls[0][2]).toEqual(options)
    expect(DEFAULT_GEOLOCATION_OPTIONS).toEqual({ enableHighAccuracy: true, maximumAge: 0 })
  })

  test('normaliza posiciones sin identidad, calidad, estimaciones o métricas', () => {
    service.start({ onPosition, onError })
    successes[0](position)
    expect(onPosition).toHaveBeenCalledExactlyOnceWith({
      latitude: 4.5, longitude: -74.2, altitude: 2600, accuracy: 8, speed: 1.2, timestamp: 1234,
    })
    expect(onError).not.toHaveBeenCalled()
  })

  test.each(['altitude', 'speed'] as const)('preserva %s null sin estimar', (field) => {
    service.start({ onPosition, onError })
    successes[0]({ ...position, coords: { ...position.coords, [field]: null } })
    expect(onPosition.mock.calls[0][0][field]).toBeNull()
  })

  test('preserva valores cero', () => {
    service.start({ onPosition, onError })
    successes[0]({ ...position, timestamp: 0, coords: { ...position.coords, altitude: 0, speed: 0 } })
    expect(onPosition.mock.calls[0][0]).toMatchObject({ altitude: 0, speed: 0, timestamp: 0 })
  })

  test.each([
    [1, 'permission-denied'], [2, 'position-unavailable'], [3, 'timeout'], [99, 'unknown'],
  ])('normaliza error %s y conserva código/mensaje', (code, kind) => {
    service.start({ onPosition, onError })
    failures[0]({ code: Number(code), message: 'Original', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
    expect(onError).toHaveBeenCalledExactlyOnceWith({ kind, code, message: 'Original' })
    expect(onPosition).not.toHaveBeenCalled()
  })

  test('stop libera incluso watchId cero y cleanup repetido es seguro', () => {
    service.stop()
    expect(clearWatch).not.toHaveBeenCalled()
    service.start({ onPosition, onError })
    service.stop()
    service.stop()
    expect(clearWatch).toHaveBeenCalledExactlyOnceWith(0)
  })

  test('evita watchers duplicados y conserva los callbacks originales', () => {
    service.start({ onPosition, onError })
    const ignored = vi.fn()
    expect(service.start({ onPosition: ignored, onError: ignored })).toBe(false)
    expect(watchPosition).toHaveBeenCalledTimes(1)
    successes[0](position)
    expect(onPosition).toHaveBeenCalledTimes(1)
    expect(ignored).not.toHaveBeenCalled()
  })

  test('reinicia y descarta callbacks tardíos de una observación anterior', () => {
    service.start({ onPosition, onError })
    service.stop()
    expect(service.start({ onPosition, onError })).toBe(true)
    successes[0](position)
    failures[0]({ code: 3, message: 'Old', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
    expect(onPosition).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    successes[1](position)
    expect(onPosition).toHaveBeenCalledTimes(1)
    service.stop()
    expect(clearWatch.mock.calls).toEqual([[0], [1]])
  })

  test('informa API no disponible sin crear watcher', () => {
    vi.stubGlobal('navigator', {})
    expect(service.start({ onPosition, onError })).toBe(false)
    expect(onError).toHaveBeenCalledWith({ kind: 'unsupported', code: null, message: 'Geolocation API unavailable' })
    expect(watchPosition).not.toHaveBeenCalled()
  })

  test('admite entorno sin navigator e inyección independiente del navegador', () => {
    vi.stubGlobal('navigator', undefined)
    expect(service.start({ onPosition, onError })).toBe(false)
    service = createGeolocationService({ watchPosition, clearWatch })
    expect(service.start({ onPosition, onError })).toBe(true)
  })

  test('un fallo síncrono se propaga y permite reintentar', () => {
    watchPosition.mockImplementationOnce(() => { throw new Error('Adapter failed') })
    expect(() => service.start({ onPosition, onError })).toThrow('Adapter failed')
    expect(service.start({ onPosition, onError })).toBe(true)
  })

  test('stop desde callback síncrono también libera el ID', () => {
    watchPosition.mockImplementationOnce((success) => { success(position); return 7 })
    expect(service.start({ onPosition: () => service.stop(), onError })).toBe(false)
    expect(clearWatch).toHaveBeenCalledExactlyOnceWith(7)
  })
})
