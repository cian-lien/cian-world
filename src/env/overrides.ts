import { record, roundCoordinate } from '../../shared/env-api'
import { solarTerms } from './solarTerms'
import { clamp01, weatherPresets } from './weather'
import type { EnvironmentOverrides, ManualEnvironment, WeatherKind } from './types'

export const environmentParams = ['time', 'date', 'weather', 'intensity', 'wind', 'term', 'lat', 'lon', 'humidity', 'temperature', 'previousDayTemperature'] as const
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === value && parsed.getUTCFullYear() >= 1900 && parsed.getUTCFullYear() <= 2100
}
export function sanitizeOverrides(value: unknown): EnvironmentOverrides {
  if (!record(value)) return {}
  const out: EnvironmentOverrides = {}
  if (validDate(value.date)) out.date = value.date
  if (typeof value.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.time)) out.time = value.time
  if (typeof value.weather === 'string' && Object.prototype.hasOwnProperty.call(weatherPresets, value.weather)) out.weather = value.weather as WeatherKind
  if (finite(value.intensity)) out.intensity = clamp01(value.intensity)
  if (finite(value.humidity) && value.humidity>=0 && value.humidity<=100) out.humidity=value.humidity
  for (const key of ['temperature','previousDayTemperature'] as const) if (finite(value[key]) && value[key]>=-90 && value[key]<=65) out[key]=value[key]
  if (finite(value.wind) && value.wind >= 0) out.wind = value.wind
  if (typeof value.term === 'string' && solarTerms.some(term => term.id === value.term)) out.term = value.term
  const coordinates = value.coordinates
  if (record(coordinates) && finite(coordinates.latitude) && Math.abs(coordinates.latitude) <= 90 && finite(coordinates.longitude) && Math.abs(coordinates.longitude) <= 180) {
    out.coordinates = { latitude: roundCoordinate(coordinates.latitude), longitude: roundCoordinate(coordinates.longitude) }
  }
  return out
}
export function parseEnvironmentOverrides(search: string): EnvironmentOverrides {
  const params = new URLSearchParams(search)
  const numeric = (key: string) => {
    const value = params.get(key)
    return value !== null && value.trim() !== '' ? Number(value) : undefined
  }
  return sanitizeOverrides({ ...Object.fromEntries(params), intensity: numeric('intensity'), wind: numeric('wind'), humidity:numeric('humidity'), temperature:numeric('temperature'), previousDayTemperature:numeric('previousDayTemperature'), coordinates: { latitude: numeric('lat'), longitude: numeric('lon') } })
}
export function sanitizeManual(value: unknown): ManualEnvironment {
  const { coordinates: _coordinates, ...settings } = sanitizeOverrides(value)
  return settings
}
export function withoutEnvironmentParams(search: string): string {
  const params = new URLSearchParams(search)
  environmentParams.forEach(key => params.delete(key))
  const remaining = params.toString()
  return remaining ? `?${remaining}` : ''
}
