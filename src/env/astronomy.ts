import { getPosition, getMoonPosition, getMoonIllumination } from 'suncalc'
import { wallClockStamp } from './clock'
import { solarLongitude } from './solarLongitude'
import { normalizeDegrees } from './weather'
import type { Coordinates, DayPhase, EnvironmentState, WallClock } from './types'

export const defaultCoordinates: Coordinates = { latitude: 23.13, longitude: 113.26 }
export function classifyPhase(altitude: number, ascending: boolean): DayPhase {
  if (altitude < -6) return 'night'
  if (altitude > 6) return 'day'
  return ascending ? 'dawn' : 'dusk'
}
export function getSky(time: Date, coordinates: Coordinates, fallbackWallClock?: WallClock): Pick<EnvironmentState, 'sun' | 'moon' | 'phase' | 'dayProgress'> {
  const projected = fallbackWallClock ? new Date(wallClockStamp(fallbackWallClock) - 8 * 3_600_000) : time
  const { latitude, longitude } = coordinates
  const sun = getPosition(projected, latitude, longitude)
  const moon = getMoonPosition(projected, latitude, longitude)
  const phase = getMoonIllumination(projected).phase
  const jd = +projected / 86_400_000 + 2440587.5
  const t = (jd - 2451545) / 36525
  const lambda = solarLongitude(projected) * Math.PI / 180
  const obliquity = (23.439291 - .0130042 * t) * Math.PI / 180
  const ra = Math.atan2(Math.cos(obliquity) * Math.sin(lambda), Math.cos(lambda)) * 180 / Math.PI
  const sidereal = 280.46061837 + 360.98564736629 * (jd - 2451545) + .000387933 * t * t
  const hourAngle = normalizeDegrees(sidereal + longitude - ra)
  return {
    sun: { altitude: sun.altitude, azimuth: normalizeDegrees(sun.azimuth) },
    moon: { altitude: moon.altitude, azimuth: normalizeDegrees(moon.azimuth), phase },
    phase: classifyPhase(sun.altitude, hourAngle > 180),
    dayProgress: normalizeDegrees(hourAngle + 180) / 360,
  }
}
