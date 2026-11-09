import { describe, expect, it } from 'vitest'
import { classifyPhase, getSky } from '../astronomy'

const guangzhou = { latitude: 23.13, longitude: 113.26 }
describe('local astronomical sky', () => {
  it('classifies exact phase boundaries by ascending/descending sun', () => {
    expect(classifyPhase(-6.01, true)).toBe('night')
    for (const altitude of [-6, 0, 6]) {
      expect(classifyPhase(altitude, true)).toBe('dawn')
      expect(classifyPhase(altitude, false)).toBe('dusk')
    }
    expect(classifyPhase(6.01, false)).toBe('day')
  })
  it.each([guangzhou, { latitude: 51.5, longitude: -.12 }, { latitude: -33.87, longitude: 151.21 }, { latitude: 89.9, longitude: 0 }])('returns finite sun/moon coordinates at %j', coordinates => {
    for (const date of ['2026-06-21T04:00Z', '2026-12-21T04:00Z']) {
      const sky = getSky(new Date(date), coordinates)
      for (const body of [sky.sun, sky.moon]) {
        expect(body.altitude).toBeGreaterThanOrEqual(-90)
        expect(body.altitude).toBeLessThanOrEqual(90)
        expect(body.azimuth).toBeGreaterThanOrEqual(0)
        expect(body.azimuth).toBeLessThan(360)
      }
      expect(sky.moon.phase).toBeGreaterThanOrEqual(0)
      expect(sky.moon.phase).toBeLessThanOrEqual(1)
      expect(sky.dayProgress).toBeGreaterThanOrEqual(0)
      expect(sky.dayProgress).toBeLessThan(1)
    }
  })
  it('has local daytime, nighttime and north-clockwise azimuth', () => {
    expect(getSky(new Date('2026-06-21T04:00Z'), guangzhou).phase).toBe('day')
    expect(getSky(new Date('2026-06-21T16:00Z'), guangzhou).phase).toBe('night')
    const morning = getSky(new Date('2026-03-20T00:00Z'), guangzhou)
    expect(morning.sun.azimuth).toBeGreaterThan(70)
    expect(morning.sun.azimuth).toBeLessThan(120)
  })
  it('projects no-location wall clock to Guangzhou but preserves input time', () => {
    const time = new Date('2026-11-08T12:00Z')
    expect(getSky(time, guangzhou, { year: 2026, month: 11, day: 8, hour: 12, minute: 0, second: 0 }).phase).toBe('day')
    expect(time.toISOString()).toBe('2026-11-08T12:00:00.000Z')
  })
  it('progresses continuously through phase boundaries and wraps only at solar midnight', () => {
    let previous = getSky(new Date('2026-06-21T00:00Z'), guangzhou).dayProgress
    for (let minute = 1; minute <= 1440; minute++) {
      const next = getSky(new Date(+new Date('2026-06-21T00:00Z') + minute * 60_000), guangzhou).dayProgress
      const step = (next - previous + 1) % 1
      expect(step).toBeGreaterThan(0)
      expect(step).toBeLessThan(.001)
      previous = next
    }
  })
})
