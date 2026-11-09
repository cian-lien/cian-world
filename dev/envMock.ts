import type { EnvResponse } from '../shared/env-api'
export function envMock(name = 'clear-day'): EnvResponse {
  const kind = name.split('-')[0]
  return { location: { city: 'Guangzhou', latitude: 23.1, longitude: 113.3, timezone: 'Asia/Shanghai' }, fetchedAt: new Date().toISOString(), weather: name === 'offline' ? null : { code: kind === 'rain' ? 63 : kind === 'snow' ? 73 : 0, isDay: !name.includes('night'), temperature: kind === 'snow' ? -2 : kind==='cold'?8:kind==='hot'?34:26, humidity:kind==='damp'?95:65, previousDayTemperature:kind==='damp'?20:26, cloudCover: kind === 'rain' ? .95 : .15, precipitation: kind === 'rain' ? 2 : 0, windSpeed: kind === 'gale' ? 18 : 2, windDirection: 210, sunrise: null, sunset: null } }
}
