import { expect, it } from 'vitest'
import { envMock } from './envMock'
it('provides repeatable offline weather scenarios', () => {
  expect(envMock('rain-night').weather).toMatchObject({ code: 63, isDay: false })
  expect(envMock('gale-day').weather?.windSpeed).toBe(18)
  expect(envMock('snow-night').weather?.temperature).toBe(-2)
  expect(envMock('offline').weather).toBeNull()
})
