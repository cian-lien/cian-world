import { describe, expect, it } from 'vitest'
import { getSky } from '../env/astronomy'
import { fromWallClock } from '../env/clock'
import { debugSunTime, roomSunDirection, sunlightThroughWindow, windowGlassExit } from './roomSun'
import { windowGlass } from './windowAnchors'

describe('room sunlight', () => {
  it.each([
    [23.13, 113.26, '2026-11-13T04:11Z', true],
    [51.5, -.12, '2026-11-13T11:44Z', true],
    [-33.87, 151.21, '2026-11-13T01:39Z', false],
  ] as const)('uses the actual solar bearing at %s, %s', (latitude, longitude, noon, facesWindow) => {
    const { sun } = getSky(new Date(noon), { latitude, longitude })
    const direction = roomSunDirection(sun)
    expect(sun.altitude).toBeGreaterThan(0)
    expect(direction[2] < 0).toBe(facesWindow)
    expect(Math.hypot(...direction)).toBeCloseTo(1)
  })

  it('places morning light east of the south-facing window', () => {
    expect(roomSunDirection({ altitude: 20, azimuth: 130 })[0]).toBeLessThan(0)
    expect(roomSunDirection({ altitude: 20, azimuth: 230 })[0]).toBeGreaterThan(0)
  })

  it('admits a ray only when both sides of the wall opening are clear', () => {
    expect(sunlightThroughWindow([1.55, 0, 0], roomSunDirection({ altitude: 35, azimuth: 180 }))).toBe(true)
    expect(sunlightThroughWindow([1.55, 0, 0], roomSunDirection({ altitude: 65, azimuth: 180 }))).toBe(false)
    expect(sunlightThroughWindow([1.55, 0, 0], roomSunDirection({ altitude: 35, azimuth: 0 }))).toBe(false)
    expect(sunlightThroughWindow([1.55, 2, 0], roomSunDirection({ altitude: -1, azimuth: 180 }))).toBe(false)
    expect(sunlightThroughWindow([1.55, 1.75, -2.5], roomSunDirection({ altitude: 35, azimuth: 180 }))).toBe(false)
    expect(sunlightThroughWindow([-.19, 0, 0], roomSunDirection({ altitude: 27, azimuth: 225 }))).toBe(false)
  })

  it('bends an oblique ray toward the normal inside glass and preserves normal incidence', () => {
    const entry = [1.55, 1.75, windowGlass.inside] as const
    expect(windowGlassExit(entry, [0, 0, -1])).toEqual([1.55, 1.75, windowGlass.outside])
    const ray = roomSunDirection({ altitude: 35, azimuth: 220 })
    const exit = windowGlassExit(entry, ray)
    const distance = (windowGlass.outside - windowGlass.inside) / ray[2]
    expect(exit[0]).toBeGreaterThan(entry[0])
    expect(exit[0]).toBeLessThan(entry[0] + distance * ray[0])
    expect(exit[1]).toBeGreaterThan(entry[1])
    expect(exit[1]).toBeLessThan(entry[1] + distance * ray[1])
  })
})

describe('sun preview clock', () => {
  it('keeps the selected local date at both ends of the slider', () => {
    const date = { year: 2026, month: 11, day: 13 }
    expect(debugSunTime(date, 0, 'Asia/Shanghai').toISOString()).toBe('2026-11-12T16:00:00.000Z')
    expect(debugSunTime(date, 1439, 'Asia/Shanghai').toISOString()).toBe('2026-11-13T15:59:00.000Z')
  })

  it('uses the existing time zone policy during the DST gap and repeated hour', () => {
    const zone = 'America/New_York'
    expect(debugSunTime({ year: 2026, month: 3, day: 8 }, 150, zone).toISOString()).toBe('2026-03-08T07:00:00.000Z')
    const date = { year: 2026, month: 11, day: 1 }
    expect(debugSunTime(date, 90, zone)).toEqual(fromWallClock({ ...date, hour: 1, minute: 30, second: 0 }, zone))
    expect(debugSunTime(date, 90, zone).toISOString()).toBe('2026-11-01T05:30:00.000Z')
  })
})
