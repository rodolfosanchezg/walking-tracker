import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createVisibilityService } from '../src/services/visibility/visibilityService'
import type { VisibilityService } from '../src/services/visibility/visibilityService'

let state: DocumentVisibilityState
let service: VisibilityService
let cleanups: (() => void)[]

beforeEach(() => {
  state = 'visible'
  cleanups = []
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => state)
  service = createVisibilityService()
})

afterEach(() => {
  cleanups.forEach((cleanup) => cleanup())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('lee el estado visible inicial', () => {
  expect(service.getCurrentState()).toBe('visible')
})

test('lee hidden consultando el estado actual en cada llamada', () => {
  expect(service.getCurrentState()).toBe('visible')
  state = 'hidden'
  expect(service.getCurrentState()).toBe('hidden')
})

test('subscribe registra visibilitychange sin emitir ni agregar listeners al construir', () => {
  const add = vi.spyOn(document, 'addEventListener')
  service = createVisibilityService()
  expect(add).not.toHaveBeenCalled()
  const callback = vi.fn()
  cleanups.push(service.subscribe(callback))
  expect(add).toHaveBeenCalledExactlyOnceWith('visibilitychange', expect.any(Function))
  expect(callback).not.toHaveBeenCalled()
})

test('los eventos notifican el estado actualizado hidden y visible', () => {
  const callback = vi.fn()
  cleanups.push(service.subscribe(callback))
  state = 'hidden'
  document.dispatchEvent(new Event('visibilitychange'))
  state = 'visible'
  document.dispatchEvent(new Event('visibilitychange'))
  expect(callback.mock.calls).toEqual([['hidden'], ['visible']])
})

test('cleanup elimina exactamente el listener registrado y es idempotente', () => {
  const add = vi.spyOn(document, 'addEventListener')
  const remove = vi.spyOn(document, 'removeEventListener')
  const callback = vi.fn()
  const cleanup = service.subscribe(callback)
  cleanups.push(cleanup)
  const listener = add.mock.calls[0][1]
  cleanup()
  cleanup()
  expect(remove).toHaveBeenCalledExactlyOnceWith('visibilitychange', listener)
  document.dispatchEvent(new Event('visibilitychange'))
  expect(callback).not.toHaveBeenCalled()
})

test('dos suscripciones independientes reciben cambios; eliminar una conserva otra', () => {
  const first = vi.fn()
  const second = vi.fn()
  const unsubscribeFirst = service.subscribe(first)
  cleanups.push(unsubscribeFirst, service.subscribe(second))
  document.dispatchEvent(new Event('visibilitychange'))
  expect(first).toHaveBeenCalledTimes(1)
  expect(second).toHaveBeenCalledTimes(1)
  unsubscribeFirst()
  state = 'hidden'
  document.dispatchEvent(new Event('visibilitychange'))
  expect(first).toHaveBeenCalledTimes(1)
  expect(second.mock.calls).toEqual([['visible'], ['hidden']])
  cleanups.forEach((cleanup) => cleanup())
  document.dispatchEvent(new Event('visibilitychange'))
  expect(second).toHaveBeenCalledTimes(2)
})

test('suscripciones del mismo callback tienen listeners distintos', () => {
  const callback = vi.fn()
  const first = service.subscribe(callback)
  cleanups.push(first, service.subscribe(callback))
  first()
  document.dispatchEvent(new Event('visibilitychange'))
  expect(callback).toHaveBeenCalledExactlyOnceWith('visible')
})

test('un estado no reconocido se informa como unknown en lectura y eventos', () => {
  state = 'prerender' as DocumentVisibilityState
  expect(service.getCurrentState()).toBe('unknown')
  const callback = vi.fn()
  cleanups.push(service.subscribe(callback))
  document.dispatchEvent(new Event('visibilitychange'))
  expect(callback).toHaveBeenCalledExactlyOnceWith('unknown')
})

test('un listener ya cancelado ignora invocaciones tardías', () => {
  const add = vi.spyOn(document, 'addEventListener')
  const callback = vi.fn()
  const cleanup = service.subscribe(callback)
  cleanups.push(cleanup)
  const listener = add.mock.calls[0][1] as EventListener
  cleanup()
  listener(new Event('visibilitychange'))
  expect(callback).not.toHaveBeenCalled()
})

test('admite documento inyectado sin depender del documento global', () => {
  const other = document.implementation.createHTMLDocument('Prueba')
  Object.defineProperty(other, 'visibilityState', { value: 'hidden' })
  const injected = createVisibilityService(other)
  const callback = vi.fn()
  cleanups.push(injected.subscribe(callback))
  expect(injected.getCurrentState()).toBe('hidden')
  document.dispatchEvent(new Event('visibilitychange'))
  expect(callback).not.toHaveBeenCalled()
  other.dispatchEvent(new Event('visibilitychange'))
  expect(callback).toHaveBeenCalledExactlyOnceWith('hidden')
})

test('sin documento falla explícitamente en vez de inventar un estado', () => {
  vi.stubGlobal('document', undefined)
  expect(() => createVisibilityService()).toThrow('Page Visibility requires a document')
})
