import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import ActiveWalkMap from '../src/features/maps/ActiveWalkMap'
import ActiveWalkPage from '../src/features/tracking/ActiveWalkPage'
import { toMapData } from '../src/features/maps/mapData'
import { createTrackingController } from '../src/features/tracking/trackingController'
import type { CapturedPoint, TrackingSnapshot } from '../src/features/tracking/trackingController'

const mocks = vi.hoisted(() => {
  const map = { setView: vi.fn(), panTo: vi.fn(), fitBounds: vi.fn(), invalidateSize: vi.fn(), remove: vi.fn() }
  map.setView.mockReturnValue(map)
  const route = { addTo: vi.fn(), setLatLngs: vi.fn() }; route.addTo.mockReturnValue(route)
  const marker = { addTo: vi.fn(), setLatLng: vi.fn(), bindTooltip: vi.fn(), remove: vi.fn() }
  marker.addTo.mockReturnValue(marker); marker.bindTooltip.mockReturnValue(marker)
  const tiles = { addTo: vi.fn(), on: vi.fn(), off: vi.fn() }; tiles.addTo.mockReturnValue(tiles)
  return { map, route, marker, tiles, createMap: vi.fn(() => map), polyline: vi.fn(() => route), circleMarker: vi.fn(() => marker) }
})
vi.mock('leaflet', () => ({ map: mocks.createMap, tileLayer: () => mocks.tiles,
  polyline: mocks.polyline, circleMarker: mocks.circleMarker, latLngBounds: (coordinates: unknown) => coordinates }))

function point(id: string, longitude: number, segment: number | null = 0,
  quality: CapturedPoint['assessment']['quality'] = 'valid'): CapturedPoint {
  const raw = { id, walkId: 'walk', timestamp: 1000, latitude: 0, longitude, altitude: null,
    accuracy: 5, speed: null, estimated: false as const, quality: 'valid' as const }
  return { raw, segment, assessment: { point: raw, quality, signals: [], distanceMeters: null,
    intervalMs: null, apparentSpeedMetersPerSecond: null } }
}
function snapshot(points: CapturedPoint[] = [], status: TrackingSnapshot['trackingStatus'] = 'active'): TrackingSnapshot {
  return { ...createTrackingController().getSnapshot(), trackingStatus: status, rawPoints: points }
}
beforeEach(() => vi.clearAllMocks())
afterEach(() => cleanup())

test('sin puntos renderiza mapa, configura vista inicial y no crea marcador/ruta', () => {
  render(<ActiveWalkMap snapshot={snapshot([], 'idle')} />)
  expect(screen.getByRole('region', { name: 'Mapa interactivo de posición y ruta' })).toBeInTheDocument()
  expect(mocks.createMap).toHaveBeenCalledTimes(1)
  expect(mocks.createMap).toHaveBeenCalledWith(expect.any(HTMLElement), { zoomAnimation: false })
  expect(mocks.map.setView).toHaveBeenCalledWith([0, 0], 2)
  expect(mocks.circleMarker).not.toHaveBeenCalled(); expect(mocks.polyline).not.toHaveBeenCalled()
})
test('rerender reutiliza instancia; unmount limpia mapa/listener', () => {
  const view = render(<ActiveWalkMap snapshot={snapshot()} />); view.rerender(<ActiveWalkMap snapshot={snapshot()} />)
  expect(mocks.createMap).toHaveBeenCalledTimes(1); view.unmount(); expect(mocks.map.remove).toHaveBeenCalledTimes(1)
  expect(mocks.tiles.off).toHaveBeenCalledWith('tileerror', mocks.tiles.on.mock.calls[0][1])
})
test('primer punto crea posición diferenciada y centra; siguientes actualizan misma ruta/marker', () => {
  const first = point('a', 0); const view = render(<ActiveWalkMap snapshot={snapshot([first])} />)
  expect(mocks.circleMarker).toHaveBeenCalledWith([0, 0], expect.objectContaining({ fillColor: '#c73516' }))
  expect(mocks.map.setView).toHaveBeenCalledWith([0, 0], 16)
  view.rerender(<ActiveWalkMap snapshot={snapshot([first, point('b', 0.001)])} />)
  expect(mocks.marker.setLatLng).toHaveBeenCalledWith([0, 0.001]); expect(mocks.route.setLatLngs).toHaveBeenCalledWith([[[0, 0], [0, 0.001]]])
  expect(mocks.polyline).toHaveBeenCalledTimes(1); expect(mocks.circleMarker).toHaveBeenCalledTimes(1)
})
test.each(['anomalous', 'low-quality', 'estimated'] as const)('%s rompe ruta y no mueve posición válida anterior', quality => {
  const data = toMapData(snapshot([point('a', 0), point('b', 1, 0, quality)]))
  expect(data.segments).toEqual([[[0, 0]]]); expect(data.position?.id).toBe('a')
})
test('pausa conserva posición raw pero no extiende ruta; resume crea otro segmento sin puente', () => {
  const a = point('a', 0), b = point('b', 0.001), paused = point('pause', 1, null)
  const view = render(<ActiveWalkMap snapshot={snapshot([a, b])} />)
  view.rerender(<ActiveWalkMap snapshot={snapshot([a, b, paused], 'paused')} />)
  expect(mocks.route.setLatLngs).toHaveBeenLastCalledWith([[[0, 0], [0, 0.001]]])
  expect(mocks.marker.setLatLng).toHaveBeenLastCalledWith([0, 1])
  view.rerender(<ActiveWalkMap snapshot={snapshot([a, b, paused, point('resume', 1, 1), point('next', 1.001, 1)])} />)
  expect(mocks.route.setLatLngs).toHaveBeenLastCalledWith([[[0, 0], [0, 0.001]], [[0, 1], [0, 1.001]]])
})
test('anomalía intermedia corta línea entre vecinos; suspicious sí participa', () => {
  expect(toMapData(snapshot([point('a', 0), point('bad', 1, 0, 'anomalous'), point('b', 0.002, 0, 'suspicious')])).segments)
    .toEqual([[[0, 0]], [[0, 0.002]]])
})
test('coordenadas inseguras no entran en ruta y no muta inputs', () => {
  const input = Object.freeze(point('bad', Infinity)); const before = JSON.stringify(input)
  expect(toMapData(snapshot([input])).segments).toEqual([])
  expect(JSON.stringify(input)).toBe(before)
})
test('interacción manual suspende seguimiento, botón lo reactiva; no pan cada polling', () => {
  const view = render(<ActiveWalkMap snapshot={snapshot([point('a', 0)])} />)
  fireEvent.pointerDown(screen.getByRole('region', { name: 'Mapa interactivo de posición y ruta' }))
  view.rerender(<ActiveWalkMap snapshot={snapshot([point('a', 0), point('b', 0.001)])} />)
  expect(mocks.map.panTo).not.toHaveBeenCalled(); expect(screen.getByText(/seguimiento automático suspendido/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Centrar y seguir posición' }))
  view.rerender(<ActiveWalkMap snapshot={snapshot([point('a', 0), point('b', 0.001), point('c', 0.002)])} />)
  expect(mocks.map.panTo).toHaveBeenCalledTimes(1)
  view.rerender(<ActiveWalkMap snapshot={snapshot([point('a', 0), point('b', 0.001), point('c', 0.002)])} />)
  expect(mocks.map.panTo).toHaveBeenCalledTimes(1)
})
test('finish ajusta bounds una vez y conserva ruta y marcador', () => {
  const points = [point('a', 0), point('b', 0.001)]
  const view = render(<ActiveWalkMap snapshot={snapshot(points)} />)
  view.rerender(<ActiveWalkMap snapshot={snapshot(points, 'finished')} />)
  expect(mocks.map.fitBounds).toHaveBeenCalledTimes(1)
  view.rerender(<ActiveWalkMap snapshot={snapshot(points, 'finished')} />)
  expect(mocks.map.fitBounds).toHaveBeenCalledTimes(1); expect(mocks.marker.remove).not.toHaveBeenCalled()
})
test('tileerror informa sin impedir actualizar ruta/GPS', () => {
  const view = render(<ActiveWalkMap snapshot={snapshot()} />)
  act(() => { mocks.tiles.on.mock.calls[0][1]() })
  expect(screen.getByRole('status')).toHaveTextContent('tracking y sus controles siguen funcionando')
  view.rerender(<ActiveWalkMap snapshot={snapshot([point('a', 0)])} />)
  expect(mocks.circleMarker).toHaveBeenCalledTimes(1)
})


test('una posición antigua fuera de segmento no corta la ruta activa que T17 conserva', () => {
  const data = toMapData(snapshot([point('a', 0), point('old', 1, null), point('b', 0.001)]))
  expect(data.segments).toEqual([[[0, 0], [0, 0.001]]])
})


test('Active Walk integra el contenedor de mapa sin iniciar GPS', async () => {
  render(<ActiveWalkPage />)
  expect(await screen.findByRole('region', { name: 'Mapa interactivo de posición y ruta' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Sin caminata')
  expect(mocks.createMap).toHaveBeenCalledTimes(1)
})


test.each([[], [point('a',0)], [point('a',0),point('b',0.001)]].map(points=>({points})))('modo saved ajusta bounds sin marker/follow, con 0/1/múltiples puntos', ({points}) => {
  render(<ActiveWalkMap snapshot={snapshot(points,'finished')} mode="saved" />)
  expect(mocks.circleMarker).not.toHaveBeenCalled(); expect(mocks.map.panTo).not.toHaveBeenCalled()
  expect(mocks.map.fitBounds).toHaveBeenCalledTimes(points.length?1:0)
  expect(screen.queryByRole('button', { name: 'Centrar y seguir posición' })).not.toBeInTheDocument()
})

test('saved conserva pan/zoom manual al rerender sin puntos nuevos', () => {
  const saved = snapshot([point('a',0),point('b',0.001)],'finished')
  const view = render(<ActiveWalkMap snapshot={saved} mode="saved" />)
  fireEvent.pointerDown(screen.getByRole('region', { name: 'Mapa interactivo de posición y ruta' }))
  fireEvent.wheel(screen.getByRole('region', { name: 'Mapa interactivo de posición y ruta' }))
  view.rerender(<ActiveWalkMap snapshot={saved} mode="saved" />)
  expect(mocks.map.fitBounds).toHaveBeenCalledTimes(1)
  expect(mocks.map.panTo).not.toHaveBeenCalled()
})
