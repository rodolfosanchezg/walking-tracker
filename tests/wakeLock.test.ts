import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createWakeLockService } from '../src/services/wakeLock/wakeLockService'
import type { WakeLockService } from '../src/services/wakeLock/wakeLockService'

function createSentinel() {
  const target = new EventTarget()
  let released = false
  const autoRelease = () => {
    released = true
    target.dispatchEvent(new Event('release'))
  }
  const sentinel: WakeLockSentinel = {
    get released() { return released },
    type: 'screen', onrelease: null,
    release: vi.fn(async () => { autoRelease() }),
    addEventListener: vi.fn(target.addEventListener.bind(target)),
    removeEventListener: vi.fn(target.removeEventListener.bind(target)),
    dispatchEvent: target.dispatchEvent.bind(target),
  }
  return { sentinel, autoRelease }
}

let service: WakeLockService
let lock: ReturnType<typeof createSentinel>
const request = vi.fn<WakeLock['request']>()

beforeEach(() => {
  vi.resetAllMocks()
  lock = createSentinel()
  request.mockResolvedValue(lock.sentinel)
  vi.stubGlobal('navigator', { wakeLock: { request } })
  service = createWakeLockService()
})

afterEach(async () => {
  vi.mocked(lock.sentinel.release).mockImplementation(async () => { lock.autoRelease() })
  await service.cleanup()
  vi.unstubAllGlobals()
})

test('detecta soporte sin solicitar al construir', () => {
  expect(service.isSupported()).toBe(true)
  expect(service.isActive()).toBe(false)
  expect(request).not.toHaveBeenCalled()
})

test.each([{}, { wakeLock: {} }, undefined])('sin API devuelve fallback técnico seguro', async (navigatorMock) => {
  vi.stubGlobal('navigator', navigatorMock)
  expect(service.isSupported()).toBe(false)
  expect(await service.request()).toMatchObject({ ok: false, error: { kind: 'unsupported' } })
  expect(service.isActive()).toBe(false)
  expect(await service.release()).toEqual({ ok: true })
})

test('solicita screen y mantiene estado activo', async () => {
  expect(await service.request()).toEqual({ ok: true })
  expect(request).toHaveBeenCalledExactlyOnceWith('screen')
  expect(service.isActive()).toBe(true)
})

test('solicitudes concurrentes o consecutivas no duplican el lock', async () => {
  expect(await Promise.all([service.request(), service.request()])).toEqual([{ ok: true }, { ok: true }])
  await service.request()
  expect(request).toHaveBeenCalledTimes(1)
})

test('release libera el lock, retira listener exacto y notifica una vez', async () => {
  const callback = vi.fn()
  service.subscribeRelease(callback)
  await service.request()
  await service.release()
  expect(lock.sentinel.release).toHaveBeenCalledTimes(1)
  expect(service.isActive()).toBe(false)
  const listener = vi.mocked(lock.sentinel.addEventListener).mock.calls[0][1]
  expect(lock.sentinel.removeEventListener).toHaveBeenCalledExactlyOnceWith('release', listener)
  expect(callback).toHaveBeenCalledTimes(1)
})

test('release sin lock y repetido es seguro', async () => {
  await service.release()
  await service.request()
  await Promise.all([service.release(), service.release()])
  expect(lock.sentinel.release).toHaveBeenCalledTimes(1)
})

test('release automático actualiza estado y permite nueva solicitud sin recuperación automática', async () => {
  const callback = vi.fn()
  service.subscribeRelease(callback)
  await service.request()
  lock.autoRelease()
  expect(service.isActive()).toBe(false)
  expect(callback).toHaveBeenCalledTimes(1)
  expect(request).toHaveBeenCalledTimes(1)
  const next = createSentinel()
  request.mockResolvedValue(next.sentinel)
  await service.request()
  expect(service.isActive()).toBe(true)
  expect(request).toHaveBeenCalledTimes(2)
  await service.release()
})

test('rechazo request se normaliza sin estado inconsistente y permite reintentar', async () => {
  request.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'))
  expect(await service.request()).toEqual({ ok: false, error: { kind: 'request-failed', name: 'NotAllowedError', message: 'Denied' } })
  expect(service.isActive()).toBe(false)
  expect(await service.request()).toEqual({ ok: true })
})

test('excepción síncrona y rechazo desconocido no son errores fatales', async () => {
  request.mockImplementationOnce(() => { throw new Error('Failure') })
  expect(await service.request()).toMatchObject({ ok: false, error: { kind: 'request-failed', message: 'Failure' } })
  request.mockRejectedValueOnce('unexpected')
  expect(await service.request()).toMatchObject({ ok: false, error: { name: 'UnknownError', message: 'unexpected' } })
})

test('sentinel recibido ya liberado no se considera activo', async () => {
  lock.autoRelease()
  expect(await service.request()).toMatchObject({ ok: false, error: { kind: 'already-released' } })
  expect(service.isActive()).toBe(false)
  expect(lock.sentinel.addEventListener).not.toHaveBeenCalled()
})

test('error release conserva lock y permite reintentar', async () => {
  await service.request()
  vi.mocked(lock.sentinel.release).mockRejectedValueOnce(new Error('Release failed'))
  expect(await service.release()).toMatchObject({ ok: false, error: { kind: 'release-failed' } })
  expect(service.isActive()).toBe(true)
  expect(await service.release()).toEqual({ ok: true })
  expect(service.isActive()).toBe(false)
})

test('cleanup libera lock, cancela notificaciones y es repetible', async () => {
  const callback = vi.fn()
  const unsubscribe = service.subscribeRelease(callback)
  await service.request()
  await service.cleanup()
  await service.cleanup()
  unsubscribe(); unsubscribe()
  expect(callback).not.toHaveBeenCalled()
  expect(service.isActive()).toBe(false)
  expect(lock.sentinel.release).toHaveBeenCalledTimes(1)
})

test('cleanup durante request pendiente libera el sentinel al llegar', async () => {
  let resolve!: (sentinel: WakeLockSentinel) => void
  request.mockReturnValueOnce(new Promise((done) => { resolve = done }))
  const acquisition = service.request()
  await Promise.resolve()
  const cleanup = service.cleanup()
  resolve(lock.sentinel)
  await acquisition
  expect(await cleanup).toEqual({ ok: true })
  expect(service.isActive()).toBe(false)
  expect(lock.sentinel.release).toHaveBeenCalledTimes(1)
})

test('request después de release pendiente adquiere un nuevo lock', async () => {
  await service.request()
  const next = createSentinel()
  request.mockResolvedValueOnce(next.sentinel)
  await Promise.all([service.release(), service.request()])
  expect(request).toHaveBeenCalledTimes(2)
  expect(service.isActive()).toBe(true)
  await service.release()
})

test('cancelar una suscripción conserva otras incluso con el mismo callback', async () => {
  const callback = vi.fn()
  const unsubscribe = service.subscribeRelease(callback)
  service.subscribeRelease(callback)
  unsubscribe(); unsubscribe()
  await service.request()
  lock.autoRelease()
  expect(callback).toHaveBeenCalledTimes(1)
})

test('admite API inyectada sin navigator', async () => {
  vi.stubGlobal('navigator', undefined)
  service = createWakeLockService({ request })
  expect(service.isSupported()).toBe(true)
  expect(await service.request()).toEqual({ ok: true })
})
