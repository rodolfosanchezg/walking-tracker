// @vitest-environment node
import { expect, test } from 'vitest'
import { sum } from './helpers/sum'

test('ejecuta una función TypeScript simple', () => {
  expect(sum(2, 3)).toBe(5)
})
