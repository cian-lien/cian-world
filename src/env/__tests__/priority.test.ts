import { describe, expect, it } from 'vitest'
import { parseEnvironmentOverrides, withoutEnvironmentParams } from '../overrides'
import { resolveEnvironment, resolveWithStatus } from '../resolve'
import { parseEnvResponse } from '../../../shared/env-api'

export const now = new Date('2026-06-21T12:00Z')
export const clock = { timeZone: 'Europe/London', deviceTimeZone: 'Europe/London' }
export const live = {
  location: { city: 'Guangzhou', latitude: 23.13, longitude: 113.26, timezone: 'Asia/Shanghai' },
  weather: { code: 0, cloudCover: .1, windSpeed: 2, windDirection: 359, temperature: 28, precipitation: 0, isDay: true, sunrise: null, sunset: null },
  fetchedAt: now.toISOString(),
}
const base = { now, clock, live, manual: {}, url: {} }
describe('source priority and defensive boundary parsing', () => {
  it('merges URL > manual > live > fallback by field, with kind presets', () => {
    const { state, status } = resolveWithStatus({ ...base, manual: { weather: 'snow', wind: 10 }, url: { weather: 'rain', intensity: .7 } })
    expect(state.weather).toEqual({ humidity: null, previousDayTemperature: null, kind: 'rain', intensity: .7, cloudCover: 1, windSpeed: 10, windDirection: 359, temperature: 28 })
    expect(state.source.weather).toBe('url')
    expect(status.fieldSources.windSpeed).toBe('manual')
    expect(status.fieldSources.temperature).toBe('live')
    expect(resolveEnvironment({ ...base, url: { wind: 12 } }).weather).toMatchObject({ kind: 'clear', temperature: 28, windSpeed: 12 })
    expect(resolveEnvironment({ ...base, url: { weather: 'rain' } }).weather.intensity).toBe(.6)
  })
  it('keeps calendar separate from weather and the fallback sky projection', () => {
    const state = resolveEnvironment({ ...base, live: null })
    expect(state.location).toBeNull()
    expect(state.phase).toBe('day') // 13:00 London wall clock projected into Guangzhou.
    expect(state.time).toEqual(now)
    expect(state.weather).toMatchObject({ kind: 'clear', temperature: null, windSpeed: 0 })
    const forced = resolveEnvironment({ ...base, url: { term: 'dongzhi' } })
    expect(forced.season).toBe('winter')
    expect(forced.weather).toEqual(resolveEnvironment(base).weather)
    expect(forced.sun).toEqual(resolveEnvironment(base).sun)
    expect(forced.time).toEqual(now)
    expect(resolveEnvironment({ ...base, clock: { ...clock, deviceTimeZone: 'Pacific/Honolulu' } }).solarTerm).toEqual(resolveEnvironment(base).solarTerm)
  })
  it('uses explicit coordinates without inheriting another city, rounds before use and rejects mismatched weather', () => {
    const state = resolveEnvironment({ ...base, url: { coordinates: { latitude: -33.87, longitude: 151.21 } } })
    expect(state.location).toEqual({ city: null, latitude: -33.9, longitude: 151.2, approximate: true })
    expect(state.source.weather).toBe('fallback')
    const matched = resolveEnvironment({ ...base, live: { ...live, location: { ...live.location, latitude: -33.9, longitude: 151.2, city: null, timezone: 'Australia/Sydney' } }, url: { coordinates: { latitude: -33.9, longitude: 151.2 } } })
    expect(matched.source.weather).toBe('live')
  })
  it('falls back on stale/malformed/future weather, never treating null as a live observation', () => {
    for (const bad of [null, { ...live, weather: null }, { ...live, fetchedAt: 'invalid' }, { ...live, fetchedAt: new Date(+now - 900_001).toISOString() }, { ...live, fetchedAt: new Date(+now + 600_000).toISOString() }, { ...live, weather: { ...live.weather, code: 999 } }]) {
      expect(resolveEnvironment({ ...base, live: bad }).source.weather).toBe('fallback')
    }
    expect(parseEnvResponse({ ...live, location: { ...live.location, latitude: Infinity } })).toBeNull()
    expect(parseEnvResponse({ ...live, weather: { ...live.weather, windSpeed: NaN } })).toBeNull()
    expect(parseEnvResponse(live)?.location?.latitude).toBe(23.1)
  })
  it('composes date/time individually using the location timezone', () => {
    const state = resolveEnvironment({ ...base, manual: { time: '08:30' }, url: { date: '2026-04-05' } })
    expect(state.time.toISOString()).toBe('2026-04-05T00:30:00.000Z')
    expect(state.source.time).toBe('url')
    expect(resolveWithStatus(base).status.timeZone).toBe('Asia/Shanghai')
  })
  it.each([
    ['1900-01-01', '00:00', 'Australia/Sydney'],
    ['2100-12-31', '23:00', 'America/Los_Angeles'],
  ])('accepts %s %s at the supported range edge in %s', (date, time, zone) => {
    const result = resolveEnvironment({ ...base, live: null, clock: { timeZone: zone, deviceTimeZone: zone }, url: { date, time } })
    expect(result.solarTerm.id).toBe('dongzhi')
    expect(Number.isFinite(+result.time)).toBe(true)
  })
  it('preserves unrelated parameters without the newer URLSearchParams.size API', () => {
    const descriptor = Object.getOwnPropertyDescriptor(URLSearchParams.prototype, 'size')!
    Object.defineProperty(URLSearchParams.prototype, 'size', { get: () => undefined, configurable: true })
    try {
      expect(withoutEnvironmentParams('?lang=en&bake=hybrid&time=22:30')).toBe('?lang=en&bake=hybrid')
    } finally { Object.defineProperty(URLSearchParams.prototype, 'size', descriptor) }
  })
  it('parses only valid fields, retaining independent valid values', () => {
    expect(parseEnvironmentOverrides('?date=2026-02-30&time=24:00&weather=bogus&term=no&lat=12&wind=12&intensity=NaN')).toEqual({ wind: 12 })
    expect(parseEnvironmentOverrides('?lat=Infinity&lon=20')).toEqual({})
    expect(parseEnvironmentOverrides('?lat=91&lon=0')).toEqual({})
    expect(parseEnvironmentOverrides('?lat=23.134&lon=113.264&time=22:30&date=2026-04-05&weather=sleet&intensity=5&wind=-1&term=qingming')).toEqual({ coordinates: { latitude: 23.1, longitude: 113.3 }, time: '22:30', date: '2026-04-05', weather: 'sleet', intensity: 1, term: 'qingming' })
  })
})
