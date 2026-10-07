import { useEffect, useMemo, useRef } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, Tooltip } from 'chart.js'
import type { TrackingSnapshot } from './trackingController'
import { toElevationChartData } from './elevationProfileData'
import type { ElevationChartPoint } from './elevationProfileData'

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip)

export default function ElevationProfile({ snapshot }: { snapshot: TrackingSnapshot }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart<'line', ElevationChartPoint[], number> | null>(null)
  const points = snapshot.rawPoints
  const profile = useMemo(() => toElevationChartData({ rawPoints: points }), [points])
  const hasData = profile.availableCount >= 2

  useEffect(() => {
    const datasets = profile.segments.map((data, index) => ({ label: `Tramo ${index + 1}`, data,
      borderColor: '#164e80', backgroundColor: '#164e80', borderWidth: 2, pointRadius: 3,
      pointStyle: data.map(point => point.estimated ? 'triangle' as const : 'circle' as const),
      spanGaps: false, tension: 0, fill: false }))
    if (!chart.current && hasData) {
      chart.current = new Chart(canvas.current!, {
        type: 'line', data: { datasets }, options: { responsive: true, maintainAspectRatio: false,
          animation: false, parsing: false,
          scales: { x: { type: 'linear', min: 0, title: { display: true, text: 'Distancia acumulada (km)' } },
            y: { type: 'linear', title: { display: true, text: 'Altitud procesada (m)' } } },
          plugins: { tooltip: { callbacks: { label(context) {
            const point = context.raw as ElevationChartPoint
            return `${point.y?.toFixed(1) ?? 'No disponible'} m${point.estimated ? ' (estimada)' : ''}`
          } } } },
        },
      })
    } else if (chart.current) {
      chart.current.data.datasets = datasets
      chart.current.update('none')
      if (hasData) chart.current.resize()
    }
  }, [profile, hasData])

  useEffect(() => () => { chart.current?.destroy(); chart.current = null }, [])
  return <section aria-labelledby="elevation-title">
    <h3 id="elevation-title">Perfil de elevación</h3>
    {!hasData && <p>Se necesitan al menos dos altitudes procesadas disponibles para mostrar el perfil.</p>}
    <div className="elevation-chart" hidden={!hasData}>
      <canvas ref={canvas} role="img" aria-label="Perfil de elevación: distancia acumulada en kilómetros y altitud procesada en metros">
        Perfil distancia-altitud. Consulta el estado del perfil y las métricas de elevación.
      </canvas>
    </div>
    {hasData && <p>{profile.availableCount} altitudes disponibles. Eje X: distancia acumulada en km; eje Y: altitud procesada en m.</p>}
    {hasData && profile.hasGaps && <p>Perfil parcial: los huecos y segmentos de pausa se muestran sin unir.</p>}
    {hasData && profile.hasEstimates && <p>Incluye altitudes estimadas por T15, identificadas con triángulos y en el tooltip.</p>}
  </section>
}
