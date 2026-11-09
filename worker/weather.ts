import { parseEnvResponse, record, type EnvResponse } from '../shared/env-api'
export interface GridWeather { weather: NonNullable<EnvResponse['weather']>; timezone: string; fetchedAt: string }
export async function fetchWeather(latitude: number, longitude: number, fetcher: typeof fetch, now: Date): Promise<GridWeather | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  Object.entries({ latitude, longitude, current: 'weather_code,is_day,temperature_2m,relative_humidity_2m,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m', daily: 'sunrise,sunset', hourly:'temperature_2m', past_days:1, wind_speed_unit: 'ms', temperature_unit: 'celsius', forecast_days: 1, timezone: 'auto', timeformat: 'unixtime' }).forEach(([key, value]) => url.searchParams.set(key, String(value)))
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetcher(url.toString(), { signal: controller.signal })
    if (!response.ok) return null
    const data: unknown = await response.json()
    if (!record(data) || !record(data.current)) return null
    const c = data.current, d = record(data.daily) ? data.daily : {}, h = record(data.hourly) ? data.hourly : {}
    const oldTime = typeof c.time==='number' ? c.time-86400 : NaN
    const times=Array.isArray(h.time)?h.time:[], temperatures=Array.isArray(h.temperature_2m)?h.temperature_2m:[]
    let previousDayTemperature:number|null=null, gap=Infinity
    times.forEach((time,index)=>{if(typeof time==='number'&&Math.abs(time-oldTime)<gap&&Math.abs(time-oldTime)<=3600&&typeof temperatures[index]==='number'&&Number.isFinite(temperatures[index])){gap=Math.abs(time-oldTime);previousDayTemperature=temperatures[index]}})
    const date = (key: string) => Array.isArray(d[key]) && typeof d[key][d[key].length-1] === 'number' && Number.isFinite(d[key][d[key].length-1]) ? new Date(d[key][d[key].length-1] * 1000).toISOString() : null
    const parsed = parseEnvResponse({ location: null, fetchedAt: now.toISOString(), weather: { humidity: c.relative_humidity_2m ?? null, previousDayTemperature, code: c.weather_code, isDay: c.is_day === 1, temperature: c.temperature_2m, cloudCover: typeof c.cloud_cover === 'number' ? c.cloud_cover / 100 : null, precipitation: c.precipitation, windSpeed: c.wind_speed_10m, windDirection: c.wind_direction_10m, sunrise: date('sunrise'), sunset: date('sunset') } })
    return parsed?.weather ? { weather: parsed.weather, timezone: typeof data.timezone === 'string' ? data.timezone : 'UTC', fetchedAt: parsed.fetchedAt } : null
  } catch { return null } finally { clearTimeout(timeout) }
}
