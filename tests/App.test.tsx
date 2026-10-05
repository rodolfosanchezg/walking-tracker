import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from '../src/App'

test('renderiza el componente base de Walking Tracker', () => {
  render(<App />)

  expect(
    screen.getByRole('heading', { name: 'Walking Tracker', level: 1 }),
  ).toBeInTheDocument()
})
