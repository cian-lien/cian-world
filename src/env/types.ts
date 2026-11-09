export type DayPhase = 'night' | 'dawn' | 'day' | 'dusk'
export type WeatherKind = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'thunderstorm' | 'snow' | 'sleet'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type Coordinates = { latitude: number; longitude: number }
export type WeatherSource = 'live' | 'manual' | 'url' | 'fallback'
export interface EnvironmentState {
  time: Date
  sun: { altitude: number; azimuth: number }
  moon: { altitude: number; azimuth: number; phase: number }
  phase: DayPhase
  dayProgress: number
  weather: {
    kind: WeatherKind; intensity: number; cloudCover: number
    windSpeed: number; windDirection: number; temperature: number | null; humidity: number | null; previousDayTemperature: number | null
  }
  solarTerm: { index: number; id: string; startedAt: Date; nextAt: Date }
  season: Season
  location: (Coordinates & { city: string | null; approximate: true }) | null
  source: { weather: WeatherSource; time: 'live' | 'manual' | 'url' }
}
export interface WeatherObservation {
  code: number; cloudCover: number; windSpeed: number; windDirection: number
  temperature: number; precipitation: number; humidity?: number | null; previousDayTemperature?: number | null
}
export interface EnvironmentOverrides {
  date?: string; time?: string; weather?: WeatherKind; intensity?: number
  wind?: number; term?: string; humidity?: number; temperature?: number; previousDayTemperature?: number; coordinates?: Coordinates
}
export type ManualEnvironment = Pick<EnvironmentOverrides, 'date' | 'time' | 'weather' | 'intensity' | 'wind' | 'term' | 'humidity' | 'temperature' | 'previousDayTemperature'>
export interface ClockContext { timeZone: string; deviceTimeZone: string }
export type ClockOverride = Pick<EnvironmentOverrides, 'date' | 'time'>
export interface WallClock { year: number; month: number; day: number; hour: number; minute: number; second: number }
