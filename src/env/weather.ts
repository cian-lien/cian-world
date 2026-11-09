import type { EnvironmentState, WeatherKind, WeatherObservation } from './types'

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
export const normalizeDegrees = (value: number) => ((value % 360) + 360) % 360
const codes: Record<number, readonly [WeatherKind, number]> = {
  0: ['clear', 0], 1: ['partly-cloudy', 0], 2: ['partly-cloudy', 0], 3: ['cloudy', 0],
  45: ['fog', .5], 48: ['fog', .8],
  51: ['drizzle', .2], 53: ['drizzle', .4], 55: ['drizzle', .6], 56: ['drizzle', .2], 57: ['drizzle', .6],
  61: ['rain', .3], 63: ['rain', .6], 65: ['rain', 1], 66: ['rain', .3], 67: ['rain', 1],
  71: ['snow', .3], 73: ['snow', .6], 75: ['snow', 1], 77: ['snow', .3],
  80: ['rain', .3], 81: ['rain', .6], 82: ['rain', 1], 85: ['snow', .3], 86: ['snow', 1],
  // 98 is accepted for forward compatibility with the requested 95–99 range.
  95: ['thunderstorm', .6], 96: ['thunderstorm', .75], 97: ['thunderstorm', .9], 98: ['thunderstorm', .9], 99: ['thunderstorm', 1],
}
export function mapWeather(input: WeatherObservation): EnvironmentState['weather'] | null {
  if (!input || ![input.code, input.cloudCover, input.windSpeed, input.windDirection, input.temperature, input.precipitation].every(Number.isFinite)) return null
  if (input.humidity != null && !Number.isFinite(input.humidity) || input.previousDayTemperature != null && !Number.isFinite(input.previousDayTemperature)) return null
  const mapping = codes[input.code]
  if (!mapping) return null
  const [kind, intensity] = mapping
  return { kind, intensity, cloudCover: clamp01(input.cloudCover), windSpeed: Math.max(0, input.windSpeed), windDirection: normalizeDegrees(input.windDirection), temperature: input.temperature, humidity: input.humidity == null ? null : clamp01(input.humidity / 100) * 100, previousDayTemperature: input.previousDayTemperature ?? null }
}
export const weatherPresets: Record<WeatherKind, Pick<EnvironmentState['weather'], 'intensity' | 'cloudCover'>> = {
  clear: { intensity: 0, cloudCover: .05 }, 'partly-cloudy': { intensity: 0, cloudCover: .35 },
  cloudy: { intensity: 0, cloudCover: .9 }, fog: { intensity: .6, cloudCover: .8 },
  drizzle: { intensity: .3, cloudCover: .9 }, rain: { intensity: .6, cloudCover: 1 },
  thunderstorm: { intensity: .8, cloudCover: 1 }, snow: { intensity: .6, cloudCover: .95 }, sleet: { intensity: .6, cloudCover: 1 },
}
