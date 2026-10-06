import { Link } from 'react-router-dom'

export default function HistoryPage() {
  return (
    <>
      <h2>Historial</h2>
      <p>Vista de ejemplo del historial, sin caminatas guardadas.</p>
      <Link to="/walk/example">Ver detalle de ejemplo</Link>
    </>
  )
}
