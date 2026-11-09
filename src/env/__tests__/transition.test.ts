import { describe, expect, it } from 'vitest'
import { createVisualTransition, sampleTransition, toVisualEnvironment } from '../transition'
import { resolveEnvironment } from '../resolve'

const input = { now: new Date('2026-06-21T12:00Z'), clock: { timeZone: 'UTC', deviceTimeZone: 'UTC' }, live: null, manual: {}, url: {} }
const clear = toVisualEnvironment(resolveEnvironment(input))
const rain = toVisualEnvironment(resolveEnvironment({ ...input, url: { weather: 'rain', intensity: 1, wind: 18 } }))
describe('four-second independent environment transitions', () => {
  it('starts at the old values, interpolates continuous weights and ends at target', () => {
    expect(sampleTransition(clear, rain, 0)).toEqual(clear)
    expect(sampleTransition(clear, rain, 4000)).toEqual(rain)
    expect(sampleTransition(clear, rain, 2000)).toMatchObject({ rain: .5, wetness: .5, windSpeed: 9 })
    expect(sampleTransition(clear, rain, 8000)).toEqual(rain)
  })
  it('takes the short circular route for wind and solar midnight', () => {
    const mid = sampleTransition({ ...clear, windDirection: 359, dayProgress: .99 }, { ...clear, windDirection: 1, dayProgress: .01 }, 2000)
    expect(mid.windDirection).toBeCloseTo(0)
    expect(mid.dayProgress).toBeCloseTo(0)
  })
  it('retargets from its actual current values, and only snow weather grows snow', () => {
    const transition = createVisualTransition(clear, 0)
    transition.setTarget(rain, 0)
    const halfway = transition.sample(2000)
    transition.setTarget(clear, 2000)
    expect(transition.sample(2000)).toEqual(halfway)
    expect(transition.sample(6000)).toEqual(clear)
    const winter = toVisualEnvironment(resolveEnvironment({ ...input, url: { term: 'dongzhi' } }))
    expect(winter.snowCover).toBe(0)
    const snow = toVisualEnvironment(resolveEnvironment({ ...input, url: { weather: 'snow' } }))
    expect(sampleTransition(clear, snow, 2000).snowCover).toBeGreaterThan(0)
    expect(sampleTransition(snow, clear, 2000).snowCover).toBeLessThan(snow.snowCover)
    expect(sampleTransition(snow, clear, 4000).snowCover).toBe(0)
  })
})
