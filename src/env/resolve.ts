import { parseEnvResponse, type EnvResponse } from '../../shared/env-api'
import { defaultCoordinates, getSky } from './astronomy'
import { displayTimeZone, getWallClock, resolveClock, validTimeZone } from './clock'
import { sanitizeManual, sanitizeOverrides } from './overrides'
import { getSolarTerm } from './solarLongitude'
import { solarTerms } from './solarTerms'
import { mapWeather, weatherPresets } from './weather'
import type { ClockContext, EnvironmentOverrides, EnvironmentState, ManualEnvironment, WeatherSource } from './types'

export const weatherTtlMs = 900_000
export interface EnvironmentInput {
  now: Date; clock: ClockContext; live: EnvResponse | null
  manual: ManualEnvironment; url: EnvironmentOverrides
}
export interface EnvironmentStatus {
  timeZone: string; fetchedAt: string | null; stale: boolean; error: 'unavailable' | null
  fieldSources: Record<keyof EnvironmentState['weather'] | 'time' | 'solarTerm' | 'location', WeatherSource>
}
export function resolveWithStatus(input: EnvironmentInput): { state: EnvironmentState; status: EnvironmentStatus } {
  const url = sanitizeOverrides(input.url), manual = sanitizeManual(input.manual)
  const live = parseEnvResponse(input.live)
  const explicit = url.coordinates
  const matches = !explicit || (live?.location?.latitude === explicit.latitude && live?.location?.longitude === explicit.longitude)
  const location = explicit ? { ...explicit, city: null, approximate: true as const }
    : live?.location ? { latitude: live.location.latitude, longitude: live.location.longitude, city: live.location.city, approximate: true as const } : null
  const timeZone = explicit
    ? matches && live?.location && validTimeZone(live.location.timezone) ? live.location.timezone : 'UTC'
    : live?.location && validTimeZone(live.location.timezone) ? live.location.timezone : displayTimeZone(input.clock)
  const clock = { ...input.clock, timeZone }
  const time = resolveClock(input.now, clock, { date: url.date ?? manual.date, time: url.time ?? manual.time })
  const timeSource = url.date || url.time ? 'url' : manual.date || manual.time ? 'manual' : 'live'
  const age = live ? +input.now - Date.parse(live.fetchedAt) : Infinity
  const observation = live?.weather && matches && age >= -300_000 && age < weatherTtlMs ? mapWeather(live.weather) : null
  const weather: EnvironmentState['weather'] = observation ?? { kind: 'clear', ...weatherPresets.clear, windSpeed: 0, windDirection: 0, temperature: null, humidity: null, previousDayTemperature: null }
  const baseSource = observation ? 'live' : 'fallback'
  const fieldSources: EnvironmentStatus['fieldSources'] = { kind: baseSource, intensity: baseSource, cloudCover: baseSource, windSpeed: baseSource, windDirection: baseSource, temperature: baseSource, humidity: baseSource, previousDayTemperature: baseSource, time: timeSource, solarTerm: url.term ? 'url' : manual.term ? 'manual' : timeSource, location: explicit ? 'url' : location ? 'live' : 'fallback' }
  for (const [override, source] of [[manual, 'manual'], [url, 'url']] as const) {
    if (override.weather) {
      Object.assign(weather, { kind: override.weather, ...weatherPresets[override.weather] })
      fieldSources.kind = fieldSources.intensity = fieldSources.cloudCover = source
    }
    if (override.intensity !== undefined) { weather.intensity = override.intensity; fieldSources.intensity = source }
    for (const key of ['humidity','temperature','previousDayTemperature'] as const) if (override[key] !== undefined) { weather[key] = override[key]; fieldSources[key] = source }
    if (override.wind !== undefined) { weather.windSpeed = override.wind; fieldSources.windSpeed = source }
  }
  const sources = Object.keys(weather).map(key => fieldSources[key as keyof typeof weather])
  const weatherSource = (['url', 'manual', 'live', 'fallback'] as const).find(source => sources.includes(source))!
  const solarTerm = getSolarTerm(time, url.term ?? manual.term)
  const state: EnvironmentState = {
    time, ...getSky(time, location ?? defaultCoordinates, location ? undefined : getWallClock(time, timeZone)),
    weather, solarTerm, season: solarTerms[solarTerm.index].season, location,
    source: { time: timeSource, weather: weatherSource },
  }
  return { state, status: { timeZone, fetchedAt: live?.fetchedAt ?? null, stale: !observation, error: null, fieldSources } }
}
export const resolveEnvironment = (input: EnvironmentInput): EnvironmentState => resolveWithStatus(input).state
