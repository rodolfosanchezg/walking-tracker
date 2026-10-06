import { Link, useParams } from 'react-router-dom'

export default function WalkDetailPage() {
  const { walkId } = useParams()

  return (
    <>
      <h2>Detalle de caminata</h2>
      <p>Identificador: {walkId}</p>
      <p>Vista de ejemplo, sin datos del recorrido.</p>
      <Link to="/history">Volver al historial</Link>
    </>
  )
}
