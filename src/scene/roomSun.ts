import { fromWallClock } from '../env/clock'
import type { EnvironmentState, WallClock } from '../env/types'
import type { V3 } from './layout'
import { windowOpening } from './windowAnchors'

export type SunPosition = EnvironmentState['sun']
export type LocalDate = Pick<WallClock, 'year' | 'month' | 'day'>

export function roomSunDirection({ altitude, azimuth }: SunPosition): V3 {
  const elevation = altitude * Math.PI / 180
  const bearing = (azimuth - 180) * Math.PI / 180
  const horizontal = Math.cos(elevation)
  return [Math.sin(bearing) * horizontal, Math.sin(elevation), -Math.cos(bearing) * horizontal]
}

export function sunlightThroughWindow([x, y, z]: V3, [dx, dy, dz]: V3): boolean {
  if (dy <= 0 || dz >= -0.0001 || z < windowOpening.inside) return false
  return [windowOpening.inside, windowOpening.outside].every(plane => {
    const distance = (plane - z) / dz
    const hitX = x + dx * distance
    const hitY = y + dy * distance
    return hitX >= windowOpening.left && hitX <= windowOpening.right
      && hitY >= windowOpening.bottom && hitY <= windowOpening.top
  })
}

export function debugSunTime(date: LocalDate, minute: number, zone: string): Date {
  return fromWallClock({
    ...date, hour: Math.floor(minute / 60), minute: minute % 60, second: 0,
  }, zone)
}
