/** Wire contract only. No React, browser singleton, Worker or astronomy imports. */
export interface EnvResponse {
  location: { city: string | null; latitude: number; longitude: number; timezone: string } | null
  weather: {
    code: number; isDay: boolean; temperature: number; cloudCover: number
    precipitation: number; windSpeed: number; windDirection: number
    sunrise: string | null; sunset: string | null; humidity?: number | null; previousDayTemperature?: number | null
  } | null
  fetchedAt: string
}
export const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const instant = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))
export const roundCoordinate = (value: number) => Math.round(value * 10) / 10 || 0
export function parseEnvResponse(value: unknown): EnvResponse | null {
  if (!record(value) || !instant(value.fetchedAt)) return null
  let location: EnvResponse['location'] = null, weather: EnvResponse['weather'] = null
  if (value.location !== null) {
    const l = value.location
    if (!record(l) || !finite(l.latitude) || Math.abs(l.latitude) > 90 || !finite(l.longitude) || Math.abs(l.longitude) > 180 || !(l.city === null || typeof l.city === 'string') || typeof l.timezone !== 'string') return null
    location = { city: l.city, latitude: roundCoordinate(l.latitude), longitude: roundCoordinate(l.longitude), timezone: l.timezone }
  }
  if (value.weather !== null) {
    const w = value.weather
    if (!record(w) || !finite(w.code) || !Number.isInteger(w.code) || typeof w.isDay !== 'boolean' || !finite(w.temperature) || !finite(w.cloudCover) || w.cloudCover < 0 || w.cloudCover > 1 || !finite(w.precipitation) || w.precipitation < 0 || !finite(w.windSpeed) || w.windSpeed < 0 || !finite(w.windDirection) || !(w.sunrise === null || instant(w.sunrise)) || !(w.sunset === null || instant(w.sunset))) return null
    if (w.humidity != null && (!finite(w.humidity) || w.humidity < 0 || w.humidity > 100) || w.previousDayTemperature != null && !finite(w.previousDayTemperature)) return null
    weather = { humidity: w.humidity ?? null, previousDayTemperature: w.previousDayTemperature ?? null, code: w.code, isDay: w.isDay, temperature: w.temperature, cloudCover: w.cloudCover, precipitation: w.precipitation, windSpeed: w.windSpeed, windDirection: w.windDirection, sunrise: w.sunrise, sunset: w.sunset }
  }
  return { location, weather, fetchedAt: value.fetchedAt }
}
