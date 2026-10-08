import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import HistoryPage from '../src/features/history/HistoryPage'
import { filterHistory, validDateRange } from '../src/features/history/historyFilters'
import type { HistoryStore } from '../src/data/repositories/historyStore'
import type { Walk } from '../src/types'

const day = (n: number) => new Date(2026, 9, n, 12).getTime()
export const historyWalk = (id: string, n = 1, name = id): Walk => ({ id, name, startedAt: day(n), endedAt: day(n) + 600000,
  activeDurationMs: 600000, totalDurationMs: 600000, distanceMeters: { value: 1000, estimated: false },
  averageSpeedMetersPerSecond: { value: 1.666, estimated: false }, averagePaceSecondsPerKilometer: { value: 600, estimated: false },
  elevationGainMeters: { value: 0, estimated: false }, elevationLossMeters: { value: 0, estimated: false }, status: 'finished', isIncomplete: false })
const records = [historyWalk('a', 1, 'Morning park'), historyWalk('b', 7, 'Evening'), historyWalk('c', 3, 'Morning hill')]
function view(store: HistoryStore) {
  return render(<MemoryRouter><Routes><Route path="/" element={<HistoryPage store={store} />} />
    <Route path="/walk/:walkId" element={<h2>Detalle pendiente</h2>} /></Routes></MemoryRouter>)
}
const storeWith = (walks: Walk[] = records): HistoryStore => ({ list: vi.fn().mockResolvedValue(walks), delete: vi.fn().mockResolvedValue(undefined) })
async function loaded(store = storeWith()) { view(store); await screen.findByRole('link', { name: records[0].name }); return store }
const names = () => screen.queryAllByRole('listitem').map(item => within(item).getByRole('heading').textContent)

test('heading, loading y estado vacío con acceso a Home', async () => {
  view(storeWith([])); expect(screen.getByRole('heading', { name: 'Historial' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Cargando')
  expect(await screen.findByText(/No hay caminatas guardadas/)).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Volver a Inicio' })).toHaveAttribute('href', '/')
})
test('error de lectura normalizado y retry', async () => {
  const store = storeWith([]); vi.mocked(store.list).mockRejectedValueOnce(new Error('private internals'))
  view(store); expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar')
  expect(screen.queryByText(/private internals/)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' })); await screen.findByText(/No hay caminatas guardadas/)
})
test('una caminata muestra nombre, fecha, km y duración activa', async () => {
  await loaded(storeWith([records[0]])); expect(names()).toEqual(['Morning park'])
  expect(screen.getByText('Fecha: 2026-10-01')).toBeInTheDocument(); expect(screen.getByText('Distancia: 1.00 km')).toBeInTheDocument()
  expect(screen.getByText('Duración activa: 00:10:00')).toBeInTheDocument()
})
test('varias caminatas más recientes primero', async () => { await loaded(); expect(names()).toEqual(['Evening', 'Morning hill', 'Morning park']) })
test('incomplete guardada se identifica sin recovery', async () => {
  await loaded(storeWith([{ ...records[0], status: 'incomplete', isIncomplete: true }]))
  expect(screen.getByText(/Incompleta \(registro guardado\)/)).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument()
})
test.each([['park', ['Morning park']], ['  MORNING  ', ['Morning hill', 'Morning park']], ['Morning park', ['Morning park']], ['absent', []]])('búsqueda %s', async (query, expected) => {
  await loaded(); fireEvent.change(screen.getByLabelText('Buscar por nombre'), { target: { value: query } }); expect(names()).toEqual(expected)
  if (!expected.length) expect(screen.getByRole('status')).toHaveTextContent('coincidan')
})
test.each([['2026-10-03', '', ['Evening', 'Morning hill']], ['', '2026-10-03', ['Morning hill', 'Morning park']], ['2026-10-01', '2026-10-03', ['Morning hill', 'Morning park']], ['2026-10-07', '2026-10-01', []]])('filtro desde %s hasta %s', async (from, to, expected) => {
  await loaded(); fireEvent.change(screen.getByLabelText('Desde'), { target: { value: from } }); fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: to } })
  expect(names()).toEqual(expected); if (from && to && from > to) expect(screen.getByRole('alert')).toHaveTextContent('Revisa las fechas')
})
test('búsqueda y fecha se combinan mediante AND', async () => {
  await loaded(); fireEvent.change(screen.getByLabelText('Buscar por nombre'), { target: { value: 'morning' } }); fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-03' } }); expect(names()).toEqual(['Morning hill'])
})
test('Link abre detalle sin implementar T24', async () => {
  await loaded(); expect(screen.getByRole('link', { name: 'Morning park' })).toHaveAttribute('href', '/walk/a')
  fireEvent.click(screen.getByRole('link', { name: 'Morning park' })); expect(screen.getByRole('heading', { name: 'Detalle pendiente' })).toBeInTheDocument()
})
test('Delete pide confirmación; cancelar no escribe', async () => {
  const store = await loaded(); fireEvent.click(screen.getByRole('button', { name: 'Eliminar Morning park' })); expect(screen.getByRole('group')).toHaveTextContent('sus puntos GPS')
  expect(store.delete).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: 'Cancelar eliminación' })); expect(store.delete).not.toHaveBeenCalled(); expect(names()).toHaveLength(3)
})
test('Delete confirmado actualiza lista; doble click no duplica operación', async () => {
  let resolve!: () => void; const store = await loaded(); vi.mocked(store.delete).mockImplementation(() => new Promise<void>(r => { resolve = r }))
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar Morning park' })); const confirm = screen.getByRole('button', { name: 'Confirmar eliminación' })
  fireEvent.click(confirm); fireEvent.click(confirm); expect(store.delete).toHaveBeenCalledTimes(1); expect(store.delete).toHaveBeenCalledWith('a')
  resolve(); await waitFor(() => expect(names()).toEqual(['Evening', 'Morning hill']))
})
test('fallo Delete conserva lista y permite retry sin error crudo', async () => {
  const store = await loaded(); vi.mocked(store.delete).mockRejectedValueOnce(new Error('private DB'))
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar Morning park' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo eliminar'); expect(names()).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' })); await waitFor(() => expect(names()).toHaveLength(2))
})
test('último Delete deja estado vacío', async () => {
  await loaded(storeWith([records[0]])); fireEvent.click(screen.getByRole('button', { name: 'Eliminar Morning park' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' })); await screen.findByText(/No hay caminatas guardadas/)
})
test('filtros no mutan, desempate por ID, fechas inválidas y null seguras', () => {
  const data = [historyWalk('b'), historyWalk('a'), { ...historyWalk('z'), startedAt: null }]; const original = structuredClone(data)
  expect(filterHistory(data, '', '', '').map(w => w.id)).toEqual(['a', 'b', 'z']); expect(data).toEqual(original)
  expect(filterHistory(data, '', '2026-10-01', '').map(w => w.id)).toEqual(['a', 'b'])
  expect(validDateRange('2026-02-30', '')).toBe(false); expect(validDateRange('bad', '')).toBe(false)
})
