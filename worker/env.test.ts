import { describe, expect, it, vi } from 'vitest'
import { handleEnv, type EnvDependencies } from './env'

const weather = { current: { weather_code: 61, is_day: 1, temperature_2m: 26, cloud_cover: 90, precipitation: 1, wind_speed_10m: 12, wind_direction_10m: 180 }, daily: { sunrise: [1794090000], sunset: [1794132000] }, timezone: 'Asia/Shanghai' }
function setup() {
  const entries = new Map<string, Response>()
  const fetchWeather = vi.fn(async () => Response.json(weather))
  const pending: Promise<unknown>[] = []
  const deps: EnvDependencies = { cf: { city: 'A', latitude: '23.134', longitude: '113.264', timezone: 'Asia/Shanghai' }, now: () => new Date('2026-11-08T08:00Z'), fetch: fetchWeather, cache: { match: async key => entries.get(key.url)?.clone(), put: async (key, response) => { entries.set(key.url, response.clone()) } }, waitUntil: promise => { pending.push(promise) } }
  return { deps, entries, fetchWeather, pending }
}
describe('private environment Worker', () => {
  it('rounds before fetching, uses m/s and caches only grid weather for 900s', async () => {
    const h = setup(), request = new Request('https://example.test/api/env')
    const response = await handleEnv(request, h.deps), body = await response.json()
    await Promise.all(h.pending)
    expect(body.location).toEqual({ city: 'A', latitude: 23.1, longitude: 113.3, timezone: 'Asia/Shanghai' })
    expect(body.weather).toMatchObject({ code: 61, windSpeed: 12, cloudCover: .9 })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    const url = new URL(String(h.fetchWeather.mock.calls[0][0]))
    expect(url.hostname).toBe('api.open-meteo.com')
    expect(url.searchParams.get('latitude')).toBe('23.1')
    expect(url.searchParams.get('wind_speed_unit')).toBe('ms')
    expect(url.searchParams.get('timezone')).toBe('auto')
    const cached = [...h.entries.values()][0]
    expect(cached.headers.get('Cache-Control')).toBe('public, max-age=900')
    expect(await cached.clone().text()).not.toMatch(/"city"|"ip"/)
    h.deps.cf!.city = 'B'
    const next = await (await handleEnv(request, h.deps)).json()
    expect(next.location.city).toBe('B')
    expect(next.fetchedAt).toBe(body.fetchedAt)
    expect(h.fetchWeather).toHaveBeenCalledTimes(1)
  })
  it('does not inherit the IP city/timezone for explicit coordinates', async () => {
    const h = setup()
    const body = await (await handleEnv(new Request('https://example.test/api/env?lat=-33.87&lon=151.21'), h.deps)).json()
    expect(body.location.city).toBeNull()
    expect(body.location.latitude).toBe(-33.9)
    expect(body.location.timezone).toBe('Asia/Shanghai') // upstream grid response, not CF
  })
  it('degrades upstream failures and missing CF to weather:null without caching an error', async () => {
    const h = setup()
    h.fetchWeather.mockRejectedValue(new Error('offline'))
    const response = await handleEnv(new Request('https://example.test/api/env'), h.deps)
    expect(response.status).toBe(200)
    expect((await response.json()).weather).toBeNull()
    expect(h.entries.size).toBe(0)
    h.deps.cf = undefined
    expect((await (await handleEnv(new Request('https://example.test/api/env'), h.deps)).json()).location).toBeNull()
  })
  it.each(['?lat=91&lon=1','?lat=1','?lat=&lon=2','?lat=NaN&lon=3'])('rejects invalid explicit coordinates %s', async query => {
    expect((await handleEnv(new Request(`https://example.test/api/env${query}`), setup().deps)).status).toBe(400)
  })
  it('rejects non-GET and unknown API routes as JSON', async () => {
    expect((await handleEnv(new Request('https://example.test/api/env', { method: 'POST' }), setup().deps)).status).toBe(405)
    expect((await handleEnv(new Request('https://example.test/api/other'), setup().deps)).status).toBe(404)
  })
})
it('rejects malformed upstream JSON without caching it',async()=>{
  const h=setup();h.deps.fetch=async()=>new Response('{broken')
  const response=await handleEnv(new Request('https://example.test/api/env'),h.deps)
  expect(response.status).toBe(200);expect((await response.json()).weather).toBeNull();expect(h.entries.size).toBe(0)
})
it('expires grid-cache content according to its original fetchedAt',async()=>{
  const h=setup(),request=new Request('https://example.test/api/env')
  await handleEnv(request,h.deps);await Promise.all(h.pending)
  h.deps.now=()=>new Date('2026-11-08T08:16Z')
  await handleEnv(request,h.deps)
  expect(h.fetchWeather).toHaveBeenCalledTimes(2)
})

it('fetches humidity and compares temperature to the preceding 24h without guessing missing history',async()=>{
 const {fetchWeather}=await import('./weather')
 let request=''
 const result=await fetchWeather(23.1,113.3,async(input)=>{request=String(input);return Response.json({current:{...weather.current,time:200000,relative_humidity_2m:94},hourly:{time:[113600,117200],temperature_2m:[20,21]},daily:weather.daily,timezone:'Asia/Shanghai'})},new Date())
 expect(request).toContain('relative_humidity_2m');expect(request).toContain('past_days=1')
 expect(result?.weather.humidity).toBe(94);expect(result?.weather.previousDayTemperature).toBe(20)
 const missing=await fetchWeather(23.1,113.3,async()=>Response.json(weather),new Date())
 expect(missing?.weather.previousDayTemperature).toBeNull()
})
