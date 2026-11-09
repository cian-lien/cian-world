import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEnvironmentStore, manualStorageKey } from '../store'
import type { EnvironmentDependencies } from '../store'
import type { EnvResponse } from '../../../shared/env-api'
import { calculateSolarTerms } from '../solarLongitude'

const now = new Date('2026-06-21T12:00:00Z')
function setup(options: Partial<EnvironmentDependencies> = {}) {
  let search = '?lang=en&bake=live&time=22:30&weather=rain'
  let visible = true
  let onVisibility = () => {}
  let onUrl = () => {}
  const saved = new Map<string, string>()
  const fetchEnv = vi.fn(async (): Promise<EnvResponse | null> => ({ location: { city: 'Test', latitude: 23.1, longitude: 113.3, timezone: 'Asia/Shanghai' }, weather: { code: 0, isDay: true, temperature: 28, cloudCover: .1, precipitation: 0, windSpeed: 1, windDirection: 0, sunrise: null, sunset: null }, fetchedAt: new Date().toISOString() }))
  const deps: EnvironmentDependencies = {
    now: () => new Date(), clock: { timeZone: 'UTC', deviceTimeZone: 'UTC' },
    getSearch: () => search, replaceSearch: value => { search = value },
    storage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => { saved.set(key, value) } },
    visibility: { isVisible: () => visible, subscribe: cb => { onVisibility = cb; return () => { onVisibility = () => {} } } },
    subscribeUrl: cb => { onUrl = cb; return () => { onUrl = () => {} } }, fetchEnv, ...options,
  }
  const store = createEnvironmentStore(deps)
  return { store, fetchEnv, saved, search: () => search, visible: (value: boolean) => { visible = value; onVisibility() }, url: (value: string) => { search = value; onUrl() } }
}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now) })
afterEach(() => vi.useRealTimers())
describe('external store lifecycle and persistence', () => {
  it('does not fetch or schedule at import/construction, keeps snapshot identity and cleans subscribers', async () => {
    const { store, fetchEnv } = setup({ getSearch: () => '' })
    expect(fetchEnv).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    expect(store.getSnapshot()).toBe(store.getSnapshot())
    const listener = vi.fn(), unsubscribe = store.subscribe(listener)
    const stop1 = store.start(), stop2 = store.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchEnv).toHaveBeenCalledTimes(1)
    const first = store.getSnapshot()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(+store.getSnapshot().time - +first.time).toBe(60_000)
    expect(listener).toHaveBeenCalled()
    unsubscribe(); listener.mockClear(); store.setManual({ weather: 'snow' })
    expect(listener).not.toHaveBeenCalled()
    stop1(); expect(vi.getTimerCount()).toBeGreaterThan(0)
    stop2(); stop2(); expect(vi.getTimerCount()).toBe(0)
  })
  it('polls every 15 minutes only while visible and refreshes stale data on return', async () => {
    const h = setup({ getSearch: () => '' }), stop = h.store.start()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(899_999); expect(h.fetchEnv).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1); expect(h.fetchEnv).toHaveBeenCalledTimes(2)
    h.visible(false); expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(60_000); h.visible(true); await vi.advanceTimersByTimeAsync(0)
    expect(h.fetchEnv).toHaveBeenCalledTimes(2)
    h.visible(false); await vi.advanceTimersByTimeAsync(900_000); h.visible(true); await vi.advanceTimersByTimeAsync(0)
    expect(h.fetchEnv).toHaveBeenCalledTimes(3)
    stop()
  })
  it('recovers from rejected fetches and resumes with fallback weather', async () => {
    const h = setup({ getSearch: () => '', fetchEnv: vi.fn(async () => { throw new Error('offline') }) })
    const stop = h.store.start(); await vi.advanceTimersByTimeAsync(0)
    expect(h.store.getSnapshot().source.weather).toBe('fallback')
    expect(h.store.getStatus().error).toBe('unavailable')
    stop()
  })
  it('refreshes a cache hit at its actual expiry and bounds retries for already stale data', async () => {
    const cached: EnvResponse = { location: null, weather: { code: 61, isDay: true, temperature: 28, cloudCover: 1, precipitation: 1, windSpeed: 1, windDirection: 0, sunrise: null, sunset: null }, fetchedAt: new Date(+now - 840_000).toISOString() }
    const fetchEnv = vi.fn(async () => cached)
    const h = setup({ getSearch: () => '', fetchEnv }), stop = h.store.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(h.store.getSnapshot().weather.kind).toBe('rain')
    await vi.advanceTimersByTimeAsync(59_999); expect(fetchEnv).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1); expect(fetchEnv).toHaveBeenCalledTimes(2)
    // This server now keeps returning an expired cache entry. Do not spin or claim it is live.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetchEnv).toHaveBeenCalledTimes(2)
    expect(h.store.getSnapshot().source.weather).toBe('fallback')
    stop()
  })
  it('preserves the last valid city and sky timezone on malformed or null responses', async () => {
    const good: EnvResponse = { location: { city: 'London', latitude: 51.5, longitude: -.1, timezone: 'Europe/London' }, weather: { code: 0, isDay: true, temperature: 20, cloudCover: .1, precipitation: 0, windSpeed: 1, windDirection: 0, sunrise: null, sunset: null }, fetchedAt: now.toISOString() }
    const fetchEnv = vi.fn(async (): Promise<EnvResponse | null> => good)
    const h = setup({ getSearch: () => '', clock: { timeZone: 'Asia/Shanghai', deviceTimeZone: 'Asia/Shanghai' }, fetchEnv }), stop = h.store.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(h.store.getSnapshot().phase).toBe('day')
    fetchEnv.mockResolvedValueOnce({ ...good, weather: { ...good.weather!, windSpeed: NaN } })
    await h.store.refresh()
    expect(h.store.getSnapshot().location?.city).toBe('London')
    expect(h.store.getSnapshot().phase).toBe('day')
    expect(h.store.getStatus().timeZone).toBe('Europe/London')
    expect(h.store.getSnapshot().source.weather).toBe('fallback')
    fetchEnv.mockResolvedValueOnce(null)
    await h.store.refresh()
    expect(h.store.getSnapshot().location?.city).toBe('London')
    stop()
  })
  it('continues its offline clock after hiding and restoring without a weather fetch dependency', async () => {
    const h = setup({ fetchEnv: undefined, getSearch: () => '' }), stop = h.store.start()
    h.visible(false)
    await vi.advanceTimersByTimeAsync(120_000)
    h.visible(true)
    const resumed = +h.store.getSnapshot().time
    await vi.advanceTimersByTimeAsync(60_000)
    expect(+h.store.getSnapshot().time - resumed).toBe(60_000)
    stop()
  })
  it('updates at the exact solar term boundary even between minute ticks', async () => {
    const term = calculateSolarTerms(2026)[11]
    vi.setSystemTime(+term.startedAt - 1000)
    const h = setup({ fetchEnv: undefined, getSearch: () => '' }), stop = h.store.start()
    expect(h.store.getSnapshot().solarTerm.id).not.toBe(term.id)
    await vi.advanceTimersByTimeAsync(1000)
    expect(h.store.getSnapshot().solarTerm.id).toBe(term.id)
    stop()
  })
  it('does not overwrite manual or URL values when live data arrives', async () => {
    const h = setup(), stop = h.store.start()
    h.store.setManual({ wind: 19, weather: 'snow' })
    await vi.advanceTimersByTimeAsync(0)
    expect(h.store.getSnapshot().weather).toMatchObject({ kind: 'rain', windSpeed: 19, temperature: 28 })
    expect(h.store.getSnapshot().source.weather).toBe('url')
    stop()
  })
  it('aborts on hide/stop and ignores late results from superseded coordinates', async () => {
    const requests: { signal: AbortSignal; resolve(value: EnvResponse | null): void }[] = []
    const h = setup({ fetchEnv: (signal) => new Promise(resolve => { requests.push({ signal, resolve }) }) })
    const stop = h.store.start()
    h.url('?lat=-33.9&lon=151.2')
    expect(requests[0].signal.aborted).toBe(true)
    requests[0].resolve({ location: { city: 'Old', latitude: 23.1, longitude: 113.3, timezone: 'Asia/Shanghai' }, weather: null, fetchedAt: now.toISOString() })
    await vi.advanceTimersByTimeAsync(0)
    expect(h.store.getSnapshot().location?.city).not.toBe('Old')
    h.visible(false); expect(requests[1].signal.aborted).toBe(true)
    stop(); expect(vi.getTimerCount()).toBe(0)
  })
  it('persists only valid manual settings and restores real without losing unrelated query keys', () => {
    const h = setup()
    h.store.setManual({ weather: 'snow', wind: 8, term: 'dongzhi' })
    expect(h.store.getSnapshot().weather.kind).toBe('rain')
    const saved = JSON.parse(h.saved.get(manualStorageKey)!)
    expect(saved).toEqual({ version: 1, settings: { weather: 'snow', wind: 8, term: 'dongzhi' } })
    expect(JSON.stringify(saved)).not.toMatch(/latitude|longitude|city/)
    h.store.followReal()
    expect(h.search()).toBe('?lang=en&bake=live')
    expect(h.store.getSnapshot().source.time).toBe('live')
    expect(h.store.getSnapshot().weather.kind).toBe('clear')
    const restored = setup({ storage: { getItem: () => JSON.stringify(saved), setItem: () => {} }, getSearch: () => '' })
    expect(restored.store.getSnapshot().weather.kind).toBe('snow')
  })
  it('survives corrupt/disabled storage and clears invalid manual patches', () => {
    for (const getItem of [() => '{broken', () => { throw new Error('blocked') }]) {
      const h = setup({ storage: { getItem, setItem: () => { throw new Error('blocked') } } })
      expect(() => h.store.setManual({ weather: 'snow' })).not.toThrow()
      expect(() => h.store.followReal()).not.toThrow()
    }
  })
})
