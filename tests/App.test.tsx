import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/app/App'

test('renderiza el componente base de Walking Tracker', () => {
  render(<MemoryRouter><App /></MemoryRouter>)

  expect(
    screen.getByRole('heading', { name: 'Walking Tracker', level: 1 }),
  ).toBeInTheDocument()
})
