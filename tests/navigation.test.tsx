import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import AppRouter from '../src/app/router'

test.each([
  ['/', 'Inicio'],
  ['/walk', 'Caminata activa'],
  ['/history', 'Historial'],
  ['/walk/walk-123', 'Detalle de caminata'],
  ['/settings', 'Configuración'],
])('carga la ruta %s', (path, heading) => {
  render(<MemoryRouter initialEntries={[path]}><AppRouter /></MemoryRouter>)

  expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
  if (path === '/walk/walk-123') {
    expect(screen.getByText('Identificador: walk-123')).toBeInTheDocument()
  }
})

test('permite navegar entre vistas, detalle e historial sin recargar', async () => {
  render(<MemoryRouter><AppRouter /></MemoryRouter>)

  for (const [link, heading] of [
    ['Caminata', 'Caminata activa'],
    ['Configuración', 'Configuración'],
    ['Historial', 'Historial'],
  ]) {
    fireEvent.click(screen.getByRole('link', { name: link }))
    expect(await screen.findByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: link })).toHaveAttribute('aria-current', 'page')
  }

  fireEvent.click(screen.getByRole('link', { name: 'Ver detalle de ejemplo' }))
  expect(await screen.findByText('Identificador: example')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('link', { name: 'Volver al historial' }))
  expect(await screen.findByRole('heading', { level: 2, name: 'Historial' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('link', { name: 'Inicio' }))
  expect(await screen.findByRole('heading', { level: 2, name: 'Inicio' })).toBeInTheDocument()
})
