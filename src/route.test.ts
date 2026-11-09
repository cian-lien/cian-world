import { expect, it } from 'vitest'
import { parseHash } from './route'
it('falls back to the room for retired rooftop links and preserves the diary and computer routes', () => {
  expect(parseHash('#/world')).toEqual({ view: 'room', slug: null })
  expect(parseHash('#/world/')).toEqual({ view: 'room', slug: null })
  expect(parseHash('#/computer').view).toBe('computer')
  expect(parseHash('#/diary/hello%20room').slug).toBe('hello room')
  expect(() => parseHash('#/diary/%broken')).not.toThrow()
  expect(parseHash('#/unknown').view).toBe('room')
})
