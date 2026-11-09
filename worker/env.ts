import { roundCoordinate } from '../shared/env-api'
import { fetchWeather, type GridWeather } from './weather'
export interface EnvDependencies {
  cf?: { latitude?: string; longitude?: string; city?: string; timezone?: string }
  fetch: typeof fetch
  cache: { match(key: Request): Promise<Response | undefined>; put(key: Request, response: Response): Promise<unknown> }
  now(): Date
  waitUntil(promise: Promise<unknown>): void
}
export async function handleEnv(request: Request, deps: EnvDependencies): Promise<Response> {
  const started = performance.now()
  const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'Server-Timing': `env;dur=${(performance.now() - started).toFixed(2)}` } })
  const url = new URL(request.url)
  if (url.pathname !== '/api/env') return json({ error: 'not-found' }, 404)
  if (request.method !== 'GET') return json({ error: 'method-not-allowed' }, 405)
  const explicit = url.searchParams.has('lat') || url.searchParams.has('lon')
  const lat = explicit ? url.searchParams.get('lat') : deps.cf?.latitude
  const lon = explicit ? url.searchParams.get('lon') : deps.cf?.longitude
  const valid = lat != null && lon != null && lat.trim() !== '' && lon.trim() !== '' && Number.isFinite(Number(lat)) && Math.abs(Number(lat)) <= 90 && Number.isFinite(Number(lon)) && Math.abs(Number(lon)) <= 180
  if (!valid) return explicit ? json({ error: 'invalid-coordinates' }, 400) : json({ location: null, weather: null, fetchedAt: deps.now().toISOString() })
  const latitude = roundCoordinate(Number(lat)), longitude = roundCoordinate(Number(lon))
  const key = new Request(`${url.origin}/__grid-weather/v2/${latitude}/${longitude}`)
  let grid: GridWeather | null = null
  try {
    const hit = await deps.cache.match(key)
    if (hit) {
      const cached = await hit.json() as GridWeather
      if (+deps.now() - Date.parse(cached.fetchedAt) < 900_000) grid = cached
    }
  } catch { /* Cache failure may not break live data. */ }
  if (!grid) {
    grid = await fetchWeather(latitude, longitude, deps.fetch, deps.now())
    if (grid) deps.waitUntil(deps.cache.put(key, Response.json(grid, { headers: { 'Cache-Control': 'public, max-age=900' } })).catch(() => {}))
  }
  const timezone = explicit ? grid?.timezone ?? 'UTC' : deps.cf?.timezone ?? grid?.timezone ?? 'UTC'
  return json({ location: { city: explicit ? null : deps.cf?.city ?? null, latitude, longitude, timezone }, weather: grid?.weather ?? null, fetchedAt: grid?.fetchedAt ?? deps.now().toISOString() })
}
