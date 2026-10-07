import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import ActiveWalkPage from '../src/features/tracking/ActiveWalkPage'
import { createTrackingController } from '../src/features/tracking/trackingController'
import { createActiveWalkRuntime } from '../src/features/tracking/activeWalkRuntime'
import type { PersistentController } from '../src/features/tracking/activeWalkRuntime'
import type { TrackingSnapshot } from '../src/features/tracking/trackingController'
import type { GeolocationError } from '../src/services/geolocation/types'

function fixture() {
  let snapshot: TrackingSnapshot = createTrackingController().getSnapshot()
  const persistence = { pendingCount: 0, pendingSince: null, writing: false, error: null as string | null,
    lastPersistedAt: null, lastPointTimestamp: null, finalized: false, disposed: false }
  let actionError: string | null = null
  let finishing = false
  const runtime = {
    getView: () => ({ snapshot, persistence, actionError, finishing }),
    start: vi.fn(() => { snapshot = { ...snapshot, trackingStatus: 'active', gpsStatus: 'waiting', watcherActive: true } }),
    pause: vi.fn(() => { snapshot = { ...snapshot, trackingStatus: 'paused' } }),
    resume: vi.fn(() => { snapshot = { ...snapshot, trackingStatus: 'active' } }),
    refresh: vi.fn(),
    finish: vi.fn(async () => { snapshot = { ...snapshot, trackingStatus: 'finished', watcherActive: false }; persistence.finalized = true }),
  }
  return { runtime, persistence,
    status(status: TrackingSnapshot['trackingStatus']) { snapshot = { ...snapshot, trackingStatus: status } },
    gps(error: GeolocationError) { snapshot = { ...snapshot, gpsStatus: 'error', gpsError: error } },
    metrics() { snapshot = { ...snapshot, metrics: { ...snapshot.metrics, activeDurationMs: 600000, totalDurationMs: 900000,
      distanceMeters: { value: 1000, estimated: false }, averageSpeedMetersPerSecond: { value: 1.6666667, estimated: false },
      averagePaceSecondsPerKilometer: { value: 600, estimated: false }, elevationGainMeters: { value: 20, estimated: true } } } },
    fail() { runtime.finish.mockImplementation(async () => { snapshot = { ...snapshot, trackingStatus: 'finished' }; persistence.error = 'storage'; actionError = 'persistence-failed' }) },
    busy() { finishing = true },
  }
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
async function poll() { await act(async () => { vi.advanceTimersByTime(1000) }) }

test('inicial: Start disponible, métricas ausentes y acciones inválidas disabled', () => {
  const f = fixture(); render(<ActiveWalkPage runtime={f.runtime} />)
  expect(screen.getByRole('status')).toHaveTextContent('Sin caminata')
  expect(screen.getByRole('button', { name: 'Iniciar caminata' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Pausar' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Finalizar' })).toBeDisabled()
  expect(f.runtime.start).not.toHaveBeenCalled(); expect(screen.getByText(/No hay métricas/)).toBeInTheDocument()
})
test('Start llama controlador, muestra active y previene doble inicio', () => {
  const f = fixture(); render(<ActiveWalkPage runtime={f.runtime} />); click('Iniciar caminata'); click('Iniciar caminata')
  expect(f.runtime.start).toHaveBeenCalledTimes(1); expect(screen.getByRole('status')).toHaveTextContent('Activa')
  expect(screen.getByRole('button', { name: 'Iniciar caminata' })).toBeDisabled()
})
test('snapshot refresca métricas mediante helpers existentes y marca estimación', async () => {
  const f = fixture(); render(<ActiveWalkPage runtime={f.runtime} />); click('Iniciar caminata'); f.metrics(); await poll()
  for (const value of ['00:10:00', '00:15:00', '1.00 km', '6.00 km/h', '10.00 min/km', '20.00 m (estimada)']) expect(screen.getByText(value)).toBeInTheDocument()
})
test('Pause y Resume llaman controlador y muestran estado pausado', () => {
  const f = fixture(); render(<ActiveWalkPage runtime={f.runtime} />); click('Iniciar caminata'); click('Pausar')
  expect(f.runtime.pause).toHaveBeenCalledTimes(1); expect(screen.getByRole('status')).toHaveTextContent('Pausada')
  expect(screen.getByText(/métricas de movimiento están pausadas/)).toBeInTheDocument()
  click('Reanudar'); expect(f.runtime.resume).toHaveBeenCalledTimes(1); expect(screen.getByRole('status')).toHaveTextContent('Activa')
})
test('Finish pide confirmación; cancelar no finaliza', () => {
  const f = fixture(); render(<ActiveWalkPage runtime={f.runtime} />); click('Iniciar caminata'); click('Finalizar')
  expect(screen.getByRole('group', { name: '¿Finalizar y guardar la caminata?' })).toBeInTheDocument()
  click('Seguir caminando'); expect(f.runtime.finish).not.toHaveBeenCalled()
  expect(screen.queryByRole('group')).not.toBeInTheDocument()
})
test('Finish confirmado muestra éxito solo tras persistencia final', async () => {
  const f = fixture(); render(<ActiveWalkPage runtime={f.runtime} />); click('Iniciar caminata'); click('Finalizar')
  await act(async () => { click('Confirmar finalización') })
  expect(f.runtime.finish).toHaveBeenCalledTimes(1); expect(screen.getByRole('status')).toHaveTextContent('Finalizada')
  expect(screen.getByText(/finalizada y guardada/)).toBeInTheDocument()
})
test('Finish fallido no muestra éxito y ofrece retry', async () => {
  const f = fixture(); f.fail(); render(<ActiveWalkPage runtime={f.runtime} />); click('Iniciar caminata'); click('Finalizar')
  await act(async () => { click('Confirmar finalización') })
  expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron guardar')
  expect(screen.queryByText(/finalizada y guardada/)).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('pendiente de guardado')
  expect(screen.getByRole('button', { name: 'Reintentar finalización' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Iniciar caminata' })).toBeDisabled()
})
test.each([['permission-denied', 'Permiso de ubicación denegado'], ['position-unavailable', 'Ubicación no disponible temporalmente'], ['timeout', 'La ubicación tardó demasiado']] as const)('GPS %s visible y sin error crudo', async (kind, message) => {
  const f = fixture(); render(<ActiveWalkPage runtime={f.runtime} />); click('Iniciar caminata')
  f.gps({ kind, code: 1, message: 'raw technical secret' }); await poll()
  expect(screen.getByRole('alert')).toHaveTextContent(message); expect(screen.queryByText(/raw technical/)).not.toBeInTheDocument()
})
test('acciones deshabilitadas mientras finaliza', async () => {
  const f = fixture(); render(<ActiveWalkPage runtime={f.runtime} />); click('Iniciar caminata'); f.busy(); await poll()
  expect(screen.getByRole('status')).toHaveTextContent('Finalizando')
  for (const name of ['Iniciar caminata', 'Pausar', 'Finalizar']) expect(screen.getByRole('button', { name })).toBeDisabled()
})
test('desmontaje limpia timer; remontaje conserva sesión sin otro start', async () => {
  const f = fixture(); const first = render(<ActiveWalkPage runtime={f.runtime} />); click('Iniciar caminata'); await poll()
  const calls = f.runtime.refresh.mock.calls.length; first.unmount(); await poll()
  expect(f.runtime.refresh).toHaveBeenCalledTimes(calls); expect(vi.getTimerCount()).toBe(0)
  render(<ActiveWalkPage runtime={f.runtime} />); expect(screen.getByRole('status')).toHaveTextContent('Activa')
  expect(f.runtime.start).toHaveBeenCalledTimes(1)
})
test('runtime utiliza finish persistente y no genera controlador/watch al construir', async () => {
  const f = fixture()
  const controller = { getSnapshot: () => f.runtime.getView().snapshot, getPersistenceState: () => f.persistence,
    start: vi.fn(() => ({ ok: true as const, value: f.runtime.getView().snapshot })),
    finish: vi.fn(async () => ({ tracking: { ok: true as const, value: f.runtime.getView().snapshot }, persistence: { ok: true as const } })),
  } as unknown as PersistentController
  const factory = vi.fn(() => controller); const runtime = createActiveWalkRuntime(factory, () => 'id')
  expect(factory).not.toHaveBeenCalled(); runtime.start(); expect(controller.start).toHaveBeenCalledWith('id')
  await runtime.finish(); expect(controller.finish).toHaveBeenCalledTimes(1)
})

test('runtime informa error de dominio sin mostrar mensajes técnicos', () => {
  const f = fixture()
  const controller = { getSnapshot: () => f.runtime.getView().snapshot, getPersistenceState: () => f.persistence,
    start: vi.fn(() => ({ ok: false as const, error: { kind: 'regressive-time', message: 'technical detail' } })),
  } as unknown as PersistentController
  const runtime = createActiveWalkRuntime(() => controller, () => 'id')
  render(<ActiveWalkPage runtime={runtime} />); click('Iniciar caminata')
  expect(screen.getByRole('alert')).toHaveTextContent('El reloj retrocedió')
  expect(screen.queryByText('technical detail')).not.toBeInTheDocument()
})
test('runtime evita dos finalizaciones simultáneas y bloquea acciones mientras espera T18', async () => {
  const f = fixture(); let resolve!: (value: Awaited<ReturnType<PersistentController['finish']>>) => void
  const finish = vi.fn(() => new Promise<Awaited<ReturnType<PersistentController['finish']>>>(done => { resolve = done }))
  const controller = { getSnapshot: () => f.runtime.getView().snapshot, getPersistenceState: () => f.persistence,
    start: vi.fn(() => ({ ok: true as const, value: f.runtime.getView().snapshot })), finish,
    pause: vi.fn(), resume: vi.fn(),
  } as unknown as PersistentController
  const runtime = createActiveWalkRuntime(() => controller, () => 'id'); runtime.start()
  const first = runtime.finish(); await runtime.finish(); runtime.pause(); runtime.resume()
  expect(finish).toHaveBeenCalledTimes(1); expect(controller.pause).not.toHaveBeenCalled(); expect(controller.resume).not.toHaveBeenCalled()
  expect(runtime.getView().finishing).toBe(true)
  resolve({ tracking: { ok: true, value: f.runtime.getView().snapshot }, persistence: { ok: true } }); await first
  expect(runtime.getView().finishing).toBe(false)
})
test('incomplete permite guardar sin iniciar recuperación interactiva', () => {
  const f = fixture(); f.status('incomplete'); render(<ActiveWalkPage runtime={f.runtime} />)
  expect(screen.getByRole('status')).toHaveTextContent('Incompleta')
  expect(screen.getByRole('button', { name: 'Pausar' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Finalizar' })).toBeEnabled()
})
