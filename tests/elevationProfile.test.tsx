import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import ElevationProfile from '../src/features/tracking/ElevationProfile'
import ActiveWalkPage from '../src/features/tracking/ActiveWalkPage'
import { toElevationChartData } from '../src/features/tracking/elevationProfileData'
import { buildElevationProfile } from '../src/domain/elevation/elevation'
import { createTrackingController } from '../src/features/tracking/trackingController'
import type { CapturedPoint, TrackingSnapshot } from '../src/features/tracking/trackingController'

const mocks = vi.hoisted(() => ({ instances: [] as { data: { datasets: unknown[] }; update: ReturnType<typeof vi.fn>;
  resize: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn>; options: unknown }[], register: vi.fn(), create: vi.fn() }))
vi.mock('chart.js', () => ({ Chart: class {
  static register = mocks.register
  data: { datasets: unknown[] }; options: unknown
  update = vi.fn(); resize = vi.fn(); destroy = vi.fn()
  constructor(canvas: unknown, config: { data: { datasets: unknown[] }; options: unknown }) {
    this.data = config.data; this.options = config.options; mocks.create(canvas, config); mocks.instances.push(this)
  }
}, LineController: {}, LineElement: {}, PointElement: {}, LinearScale: {}, Tooltip: {} }))
function point(id: string, longitude: number, altitude: number | null, segment: number | null = 0,
  quality: CapturedPoint['assessment']['quality'] = 'valid'): CapturedPoint {
  const raw = { id, walkId: 'walk', timestamp: Number(id) * 10000, latitude: 0, longitude,
    altitude, accuracy: 5, speed: null, quality: 'valid' as const, estimated: false as const }
  return { raw, segment, assessment: { point: raw, quality, signals: [], distanceMeters: null,
    intervalMs: null, apparentSpeedMetersPerSecond: null } }
}
const snapshot = (points: CapturedPoint[] = [], status: TrackingSnapshot['trackingStatus'] = 'active'): TrackingSnapshot =>
  ({ ...createTrackingController().getSnapshot(), rawPoints: points, trackingStatus: status })
beforeEach(() => { vi.clearAllMocks(); mocks.instances.length = 0 })
afterEach(cleanup)

test.each([{ points: [] }, { points: [point('1', 0, 100)] }, { points: [point('1', 0, null), point('2', 0.0001, null)] }])('0/1/altitudes ausentes muestran estado vacío sin canvas real', ({ points }) => {
  render(<ElevationProfile snapshot={snapshot(points)} />)
  expect(screen.getByRole('heading', { name: 'Perfil de elevación' })).toBeInTheDocument()
  expect(screen.getByText(/Se necesitan al menos dos/)).toBeInTheDocument()
  expect(mocks.create).not.toHaveBeenCalled()
})
test('múltiples puntos usan distancia km y altitud procesada T15, sin mutación', () => {
  const points = [point('1', 0, 100), point('2', 0.0001, 101), point('3', 0.0002, 110)]
  const original = JSON.stringify(points), expected = buildElevationProfile(points.map(item => item.raw))
  const data = toElevationChartData(snapshot(points))
  expect(data.segments[0].map(p => p.y)).toEqual(expected.map(p => p.altitudeMeters))
  expect(data.segments[0][1].y).toBe(100)
  expect(data.segments[0].at(-1)!.x).toBeCloseTo(expected.at(-1)!.distanceMeters / 1000, 8)
  expect(JSON.stringify(points)).toBe(original)
})
test('chart declara ejes y dataset, se actualiza sin crear otra instancia', () => {
  const points = [point('1', 0, 100), point('2', 0.0001, 110)]
  const view = render(<ElevationProfile snapshot={snapshot(points)} />)
  expect(mocks.create).toHaveBeenCalledTimes(1)
  expect(mocks.instances[0].options).toMatchObject({ animation: false, parsing: false,
    scales: { x: { title: { text: 'Distancia acumulada (km)' } }, y: { title: { text: 'Altitud procesada (m)' } } } })
  view.rerender(<ElevationProfile snapshot={snapshot([...points, point('3', 0.0002, 120)])} />)
  expect(mocks.create).toHaveBeenCalledTimes(1); expect(mocks.instances[0].update).toHaveBeenCalledWith('none')
  expect(screen.getByText(/3 altitudes disponibles/)).toBeInTheDocument()
})
test('cleanup destruye chart, rerender con misma fuente no actualiza', () => {
  const points = [point('1', 0, 100), point('2', 0.0001, 110)]
  const view = render(<ElevationProfile snapshot={snapshot(points)} />)
  view.rerender(<ElevationProfile snapshot={snapshot(points)} />)
  expect(mocks.instances[0].update).not.toHaveBeenCalled()
  view.unmount(); expect(mocks.instances[0].destroy).toHaveBeenCalledTimes(1)
})
test('anomalous no usa altitud raw; huecos se conservan sin unir', () => {
  const data = toElevationChartData(snapshot([point('1', 0, 100), point('2', 1, 9000, 0, 'anomalous'), point('3', 0.0002, 110)]))
  expect(data.segments[0].map(p => p.y)).toEqual([100, null, 110]); expect(data.hasGaps).toBe(true)
  render(<ElevationProfile snapshot={snapshot([point('1', 0, 100), point('2', 1, 9000, 0, 'anomalous'), point('3', 0.0002, 110)])} />)
  expect(mocks.instances[0].data.datasets[0]).toMatchObject({ spanGaps: false })
})
test('interpolaciones T15 permanecen identificadas y accesibles sin depender del color', () => {
  render(<ElevationProfile snapshot={snapshot([point('1', 0, 100), point('2', 0.0001, null), point('3', 0.0002, 120)])} />)
  expect(screen.getByText(/Incluye altitudes estimadas/)).toBeInTheDocument()
  expect(mocks.instances[0].data.datasets[0]).toMatchObject({ pointStyle: ['circle', 'triangle', 'circle'] })
  expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('kilómetros'))
})
test('pausa no agrega perfil; resume conserva distancia acumulada y separa datasets', () => {
  const a = point('1', 0, 100), b = point('2', 0.0001, 110), paused = point('3', 1, 9000, null)
  const before = toElevationChartData(snapshot([a, b]))
  expect(toElevationChartData(snapshot([a, b, paused], 'paused'))).toEqual(before)
  const after = toElevationChartData(snapshot([a, b, paused, point('4', 1, 500, 1), point('5', 1.0001, 510, 1)]))
  expect(after.segments).toHaveLength(2); expect(after.segments[1][0].x).toBe(before.segments[0][1].x)
  expect(after.segments[1][1].x).toBeCloseTo(before.segments[0][1].x * 2, 7)
  expect(after.segments[1].map(p=>p.y)).toEqual([500,510])
})
test('finish mantiene el perfil sin destruirlo', () => {
  const points = [point('1', 0, 100), point('2', 0.0001, 110)]
  const view = render(<ElevationProfile snapshot={snapshot(points)} />)
  view.rerender(<ElevationProfile snapshot={snapshot(points, 'finished')} />)
  expect(mocks.instances[0].destroy).not.toHaveBeenCalled(); expect(mocks.create).toHaveBeenCalledTimes(1)
  expect(screen.getByText(/2 altitudes disponibles/)).toBeInTheDocument()
})
test('nueva caminata vacía oculta datos viejos; instancia sigue usable', () => {
  const view = render(<ElevationProfile snapshot={snapshot([point('1', 0, 100), point('2', 0.0001, 110)])} />)
  view.rerender(<ElevationProfile snapshot={snapshot([], 'idle')} />)
  expect(screen.getByText(/Se necesitan al menos dos/)).toBeInTheDocument()
  expect(mocks.instances[0].data.datasets).toEqual([])
})


test('perfil integrado en /walk con estado vacío y controles disponibles', async () => {
  render(<ActiveWalkPage />)
  expect(await screen.findByRole('heading', { name: 'Perfil de elevación' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Iniciar caminata' })).toBeEnabled()
  expect(mocks.create).not.toHaveBeenCalled()
})
test('perfil parcial conserva nulls en extremos sin extrapolar', () => {
  const data = toElevationChartData(snapshot([point('1', 0, null), point('2', 0.0001, 100), point('3', 0.0002, 110), point('4', 0.0003, null)]))
  expect(data.segments[0].map(p => p.y)).toEqual([null, 100, 110, null])
  expect(data.hasGaps).toBe(true)
})
test('componente en pause/resume mantiene chart y separa nuevos tramos', () => {
  const points = [point('1', 0, 100), point('2', 0.0001, 110)]
  const view = render(<ElevationProfile snapshot={snapshot(points)} />)
  view.rerender(<ElevationProfile snapshot={snapshot([...points, point('3', 1, 9000, null)], 'paused')} />)
  expect(mocks.instances[0].data.datasets).toHaveLength(1)
  expect(mocks.create).toHaveBeenCalledTimes(1)
  view.rerender(<ElevationProfile snapshot={snapshot([...points, point('3', 1, 9000, null), point('4', 1, 500, 1), point('5', 1.0001, 510, 1)])} />)
  expect(mocks.instances[0].data.datasets).toHaveLength(2)
  expect(mocks.create).toHaveBeenCalledTimes(1)
})
