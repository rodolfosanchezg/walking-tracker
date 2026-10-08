import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import WalkDetailPage from '../src/features/history/WalkDetailPage'
import type { WalkDetailData, WalkDetailStore } from '../src/data/repositories/walkDetailStore'
import { toSavedWalkData } from '../src/features/history/savedWalkData'
import { toMapData } from '../src/features/maps/mapData'
import { toElevationChartData } from '../src/features/tracking/elevationProfileData'
import type { TrackPoint } from '../src/types'
const mocks = vi.hoisted(() => ({ map: vi.fn(), profile: vi.fn() }))
vi.mock('../src/features/maps/ActiveWalkMap', () => ({ default: (props: unknown) => { mocks.map(props); return <p>Mapa guardado</p> } }))
vi.mock('../src/features/tracking/ElevationProfile', () => ({ default: (props: unknown) => { mocks.profile(props); return <p>Perfil guardado</p> } }))
const m = (value: number) => ({ value, estimated: false as const })
const data: WalkDetailData = { walk: { id: 'a', name: 'Park', startedAt: new Date(2026,9,8,12).getTime(), endedAt: new Date(2026,9,8,12,15).getTime(), activeDurationMs: 600000, totalDurationMs: 900000,
  distanceMeters: m(1000), averageSpeedMetersPerSecond: m(2), averagePaceSecondsPerKilometer: m(600), elevationGainMeters: m(12), elevationLossMeters: m(4), status: 'finished', isIncomplete: false }, points: [] }
const point = (id: string, timestamp: number, longitude = 0): TrackPoint => ({ id, walkId: 'a', timestamp, latitude: 0, longitude, altitude: 100, speed: null, accuracy: 5, quality: 'valid', estimated: false })
const storeWith = (value: WalkDetailData | undefined = data): WalkDetailStore => ({ get: vi.fn().mockResolvedValue(value), rename: vi.fn(async (_id, name) => name.trim()) })
function view(store = storeWith()) { render(<MemoryRouter initialEntries={['/walk/a']}><Routes><Route path="/walk/:walkId" element={<WalkDetailPage store={store} />} /><Route path="/history" element={<h2>Historial destino</h2>} /></Routes></MemoryRouter>); return store }

test('loading luego resumen completo persistido y mapa/perfil', async () => {
  const store = view(); expect(screen.getByRole('status')).toHaveTextContent('Cargando caminata')
  await screen.findByRole('heading', { name: 'Park' }); expect(store.get).toHaveBeenCalledWith('a')
  for (const text of ['00:10:00','00:15:00','1.00 km','7.20 km/h','10.00 min/km','12.00 m','4.00 m']) expect(screen.getByText(text)).toBeInTheDocument()
  expect(screen.getAllByText(/2026/, { selector: 'dd' })).toHaveLength(2)
  await screen.findByText('Mapa guardado'); await screen.findByText('Perfil guardado')
  expect(mocks.map).toHaveBeenCalledWith(expect.objectContaining({ mode: 'saved' }))
})
test('not found legible y sin excepciones', async () => { const store = storeWith(); vi.mocked(store.get).mockResolvedValue(undefined); view(store); await screen.findByText('No se encontró la caminata.') })
test('error normalizado sin texto técnico', async () => { const store = storeWith(); vi.mocked(store.get).mockRejectedValue(new Error('private')); view(store); expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar'); expect(screen.queryByText('private')).not.toBeInTheDocument() })
test('incomplete muestra datos parciales sin recovery', async () => { view(storeWith({ ...data, walk: { ...data.walk, status: 'incomplete', isIncomplete: true, endedAt: null } })); await screen.findByText(/Incompleta \(datos disponibles\)/); expect(screen.getByText('No disponible')).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument() })
test('volver al historial mediante Router', async () => { view(); await screen.findByText('Park'); fireEvent.click(screen.getByRole('link', { name: 'Volver al historial' })); expect(screen.getByRole('heading', { name: 'Historial destino' })).toBeInTheDocument() })
test('rename prellena, trim, persiste y actualiza heading', async () => {
  const store = view(); await screen.findByText('Park'); fireEvent.click(screen.getByRole('button', { name: 'Renombrar caminata' })); expect(screen.getByLabelText('Nombre de caminata')).toHaveValue('Park')
  fireEvent.change(screen.getByLabelText('Nombre de caminata'), { target: { value: '  New park  ' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' })); await screen.findByRole('heading', { name: 'New park' }); expect(store.rename).toHaveBeenCalledWith('a', '  New park  ')
})
test('rename vacío no llama store; cancelar conserva nombre', async () => {
  const store = view(); await screen.findByText('Park'); fireEvent.click(screen.getByRole('button', { name: 'Renombrar caminata' })); fireEvent.change(screen.getByLabelText('Nombre de caminata'), { target: { value: ' ' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' })); expect(screen.getByRole('alert')).toHaveTextContent('vacío'); expect(store.rename).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole('button', { name: 'Cancelar cambio' })); expect(screen.getByRole('heading', { name: 'Park' })).toBeInTheDocument()
})
test('rename error conserva nombre y permite retry', async () => { const store = storeWith(); vi.mocked(store.rename).mockRejectedValueOnce(new Error('private')); view(store); await screen.findByText('Park'); fireEvent.click(screen.getByRole('button', { name: 'Renombrar caminata' })); fireEvent.change(screen.getByLabelText('Nombre de caminata'), { target: { value: 'Next' } }); fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' })); await screen.findByRole('alert'); expect(screen.getByRole('heading', { name: 'Park' })).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' })); await screen.findByText('Next') })
test.each([[], [point('1',1000)], [point('1',1000),point('2',3000,0.00001)]].map(points=>({points})))('mapa/perfil reciben 0/1/múltiples puntos sin mutar', async ({points}) => {
  const record = { ...data, points }; const copy = structuredClone(record); const visual = toSavedWalkData(record)
  expect(visual.snapshot.rawPoints.map(p=>p.raw)).toEqual(points); expect(toMapData(visual.snapshot).segments.flat()).toHaveLength(points.length); expect(record).toEqual(copy)
  view(storeWith(record)); await screen.findByText('Mapa guardado'); expect(mocks.map).toHaveBeenLastCalledWith(expect.objectContaining({ snapshot: visual.snapshot }))
})
test('anomalous almacenado rompe ruta y perfil no usa pico raw', () => {
  const bad = { ...point('bad',2000,1), quality: 'anomalous' as const, estimated: false as const, accuracy: 5, altitude: 3000 }
  const visual = toSavedWalkData({ ...data, points: [point('1',1000),bad,point('2',4000,0.00001)] })
  expect(toMapData(visual.snapshot).segments).toEqual([[[0,0]],[[0,0.00001]]]); expect(toElevationChartData(visual.snapshot).segments.flat().every(p=>p.y!==3000)).toBe(true)
})
test('T14 evalúa anomalía raw sin clasificación persistida', () => { const visual = toSavedWalkData({ ...data, points: [point('1',1000),point('bad',2000,1)] }); expect(visual.snapshot.rawPoints[1].assessment.quality).toBe('anomalous') })
test('metadata conserva pausas/segmentos y calidad, sin unir desplazamientos', () => {
  const points = [point('a',1000),point('p',2000,1),point('r',3000,1),point('s',5000,1.00001)]
  const visual = toSavedWalkData({ ...data, points, metadata: points.map((p,i)=>({ id:p.id, segment:i===1?null:i>1?1:0, quality:'valid' })) })
  expect(visual.segmentationAvailable).toBe(true); expect(toMapData(visual.snapshot).segments).toEqual([[[0,0]],[[0,1],[0,1.00001]]]); expect(toElevationChartData(visual.snapshot).segments).toHaveLength(2)
})
test('sin metadatos comunica limitación, resumen no recalculado', async () => { view(storeWith({ ...data, points:[point('a',1000)] })); await screen.findByText(/no conserva metadatos de pausas/); expect(screen.getByText('1.00 km')).toBeInTheDocument() })
