import { NavLink, Outlet } from 'react-router-dom'

function App() {
  return (
    <main>
      <header>
        <h1>Walking Tracker</h1>
        <nav aria-label="Navegación principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/walk" end>Caminata</NavLink>
          <NavLink to="/history">Historial</NavLink>
          <NavLink to="/settings">Configuración</NavLink>
        </nav>
      </header>
      <div className="page-content">
        <Outlet />
      </div>
    </main>
  )
}

export default App
