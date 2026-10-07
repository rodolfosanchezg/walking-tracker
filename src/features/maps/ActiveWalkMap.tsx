import { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { TrackingSnapshot } from '../tracking/trackingController'
import { toMapData } from './mapData'
import { MAP_CONFIG } from './mapConfig'

export default function ActiveWalkMap({ snapshot }: { snapshot: TrackingSnapshot }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const route = useRef<L.Polyline | null>(null)
  const marker = useRef<L.CircleMarker | null>(null)
  const follow = useRef(true)
  const lastPosition = useRef<string | null>(null)
  const previousStatus = useRef<TrackingSnapshot['trackingStatus']>('idle')
  const [following, setFollowing] = useState(true)
  const [tileError, setTileError] = useState(false)
  const data = toMapData(snapshot)

  useEffect(() => {
    const element = container.current!
    const instance = L.map(element, { zoomAnimation: false }).setView([0, 0], MAP_CONFIG.initialZoom)
    map.current = instance
    const tiles = L.tileLayer(MAP_CONFIG.tilesUrl, { attribution: MAP_CONFIG.attribution, maxZoom: MAP_CONFIG.maximumZoom }).addTo(instance)
    const onTileError = () => setTileError(true)
    tiles.on('tileerror', onTileError)
    const suspend = () => { follow.current = false; setFollowing(false) }
    for (const event of ['pointerdown', 'wheel', 'keydown']) element.addEventListener(event, suspend)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => instance.invalidateSize({ pan: false }))
    observer?.observe(element)
    return () => {
      observer?.disconnect()
      tiles.off('tileerror', onTileError)
      for (const event of ['pointerdown', 'wheel', 'keydown']) element.removeEventListener(event, suspend)
      instance.remove(); map.current = null; route.current = null; marker.current = null; lastPosition.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!instance) return
    if (data.segments.length && !route.current) route.current = L.polyline(data.segments, { color: '#164e80', weight: 4 }).addTo(instance)
    else route.current?.setLatLngs(data.segments)
    if (data.position) {
      if (!marker.current) marker.current = L.circleMarker(data.position.coordinates, { radius: 8, color: '#ffffff', weight: 3,
        fillColor: '#c73516', fillOpacity: 1 }).addTo(instance).bindTooltip('Última posición GPS válida')
      else marker.current.setLatLng(data.position.coordinates)
      if (lastPosition.current === null) instance.setView(data.position.coordinates, MAP_CONFIG.trackingZoom)
      else if (follow.current && snapshot.trackingStatus === 'active' && lastPosition.current !== data.position.id) instance.panTo(data.position.coordinates, { animate: false })
      lastPosition.current = data.position.id
    } else { marker.current?.remove(); marker.current = null; lastPosition.current = null }
    if (snapshot.trackingStatus === 'finished' && previousStatus.current !== 'finished') {
      const coordinates = data.segments.flat()
      if (coordinates.length) instance.fitBounds(L.latLngBounds(coordinates), { padding: [20, 20], maxZoom: MAP_CONFIG.trackingZoom })
    }
    previousStatus.current = snapshot.trackingStatus
  }, [data, snapshot.trackingStatus])

  function recenter() {
    follow.current = true; setFollowing(true)
    if (data.position) map.current?.setView(data.position.coordinates, MAP_CONFIG.trackingZoom)
  }
  return <section aria-label="Mapa de la caminata">
    <div ref={container} className="active-walk-map" role="region" aria-label="Mapa interactivo de posición y ruta" />
    <button type="button" onClick={recenter} disabled={!data.position}>Centrar y seguir posición</button>
    <p>{following ? 'Seguimiento automático habilitado.' : 'Mapa libre: seguimiento automático suspendido.'} La ruta excluye pausas y puntos no aptos.</p>
    {!data.position && <p>Esperando la primera posición GPS válida.</p>}
    {tileError && <p role="status">El fondo del mapa no está disponible. El tracking y sus controles siguen funcionando.</p>}
  </section>
}
