import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import HomePage from '../src/app/HomePage'
import AppRouter from '../src/app/router'
import { createTrackingController } from '../src/features/tracking/trackingController'
import type { TrackingSnapshot } from '../src/features/tracking/trackingController'
import type { WalkStatusReader } from '../src/features/tracking/useWalkStatus'

function fixture(status: TrackingSnapshot['trackingStatus'] = 'idle', finalized = false) {
  let snapshot = { ...createTrackingController().getSnapshot(), trackingStatus: status }
  const persistence = { pendingCount: 0, pendingSince: null, writing: false, error: null,
    lastPersistedAt: null, lastPointTimestamp: null, finalized, disposed: false }
  const runtime = { getView: vi.fn(() => ({ snapshot, persistence, finishing: false, actionError: null })),
    start: vi.fn(), pause: vi.fn(), resume: vi.fn(), finish: vi.fn(), refresh: vi.fn(), stop: vi.fn(), cleanup: vi.fn() }
  return { runtime, status(next: TrackingSnapshot['trackingStatus']) { snapshot = { ...snapshot, trackingStatus: next } } }
}
function view(runtime: WalkStatusReader) {
  return render(<MemoryRouter><Routes>
    <Route path="/" element={<HomePage runtime={runtime} />} />
    <Route path="/walk" element={<h2>Destino caminata</h2>} />
    <Route path="/history" element={<h2>Destino historial</h2>} />
    <Route path="/settings" element={<h2>Destino configuración</h2>} />
  </Routes></MemoryRouter>)
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

test('Home renderiza título de app e Inicio, Ready y Start sin iniciar sesión', () => {
  render(<MemoryRouter><AppRouter /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Walking Tracker' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Listo para caminar')
  expect(screen.getByRole('link', { name: 'Iniciar caminata' })).toHaveAttribute('href', '/walk')
})
test.each([['Iniciar caminata', 'Destino caminata'], ['Ver historial', 'Destino historial'], ['Abrir configuración', 'Destino configuración']])('%s navega mediante Router', (link, heading) => {
  const f = fixture(); view(f.runtime); fireEvent.click(screen.getByRole('link', { name: link }))
  expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  expect(f.runtime.start).not.toHaveBeenCalled()
})
test.each([['active', 'activa'], ['paused', 'pausada']] as const)('%s oculta Start y ofrece Open sin crear segundo tracking', (state, message) => {
  const f = fixture(state); view(f.runtime)
  expect(screen.getByRole('status')).toHaveTextContent(message)
  expect(screen.queryByRole('link', { name: 'Iniciar caminata' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('link', { name: 'Abrir caminata' }))
  expect(screen.getByRole('heading', { name: 'Destino caminata' })).toBeInTheDocument()
  expect(f.runtime.start).not.toHaveBeenCalled(); expect(f.runtime.stop).not.toHaveBeenCalled()
})
test('finished guardada vuelve a permitir Start', () => {
  const f = fixture('finished', true); view(f.runtime)
  expect(screen.getByRole('status')).toHaveTextContent('finalizada')
  expect(screen.getByRole('link', { name: 'Iniciar caminata' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Abrir caminata' })).not.toBeInTheDocument()
})
test('finished sin persistir no ofrece Start; incompleta abre sesión actual', () => {
  const f = fixture('finished'); const rendered = view(f.runtime)
  expect(screen.getByRole('status')).toHaveTextContent('pendiente de guardado')
  expect(screen.queryByRole('link', { name: 'Iniciar caminata' })).not.toBeInTheDocument()
  rendered.unmount(); const interrupted = fixture('incomplete'); view(interrupted.runtime)
  expect(screen.getByRole('link', { name: 'Abrir caminata' })).toBeInTheDocument()
})
test('montaje/polling/unmount no controla tracking y limpia su timer', () => {
  const f = fixture('active'); const rendered = view(f.runtime)
  act(() => { vi.advanceTimersByTime(2000) }); expect(f.runtime.getView).toHaveBeenCalledTimes(3)
  rendered.unmount(); const count = f.runtime.getView.mock.calls.length
  act(() => { vi.advanceTimersByTime(2000) }); expect(f.runtime.getView).toHaveBeenCalledTimes(count)
  expect(vi.getTimerCount()).toBe(0)
  for (const action of [f.runtime.start, f.runtime.pause, f.runtime.resume, f.runtime.finish, f.runtime.refresh, f.runtime.stop, f.runtime.cleanup]) expect(action).not.toHaveBeenCalled()
})
test('estado en memoria actualiza lectura sin refresh de tracking', () => {
  const f = fixture('active'); view(f.runtime); f.status('paused')
  act(() => { vi.advanceTimersByTime(1000) })
  expect(screen.getByRole('status')).toHaveTextContent('pausada'); expect(f.runtime.refresh).not.toHaveBeenCalled()
})
