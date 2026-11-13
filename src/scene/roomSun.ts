import { fromWallClock } from '../env/clock'
import type { EnvironmentState, WallClock } from '../env/types'
import type { V3 } from './layout'
import { windowGlass, windowOpening } from './windowAnchors'

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
  const innerDistance = (windowOpening.inside - z) / dz
  const glassDistance = (windowGlass.inside - z) / dz
  const exit = windowGlassExit([x + dx * glassDistance, y + dy * glassDistance, windowGlass.inside], [dx, dy, dz])
  const outerDistance = (windowOpening.outside - exit[2]) / dz
  const inside = (x: number, y: number) => x >= windowOpening.left && x <= windowOpening.right
    && y >= windowOpening.bottom && y <= windowOpening.top
  return inside(x + dx * innerDistance, y + dy * innerDistance)
    && inside(exit[0] + dx * outerDistance, exit[1] + dy * outerDistance)
}

export function windowGlassExit([x, y]: readonly [number, number, number], [dx, dy]: V3): V3 {
  const gx = dx / windowGlass.ior
  const gy = dy / windowGlass.ior
  const distance = (windowGlass.inside - windowGlass.outside) / Math.sqrt(1 - gx * gx - gy * gy)
  return [x + gx * distance, y + gy * distance, windowGlass.outside]
}

export function debugSunTime(date: LocalDate, minute: number, zone: string): Date {
  return fromWallClock({
    ...date, hour: Math.floor(minute / 60), minute: minute % 60, second: 0,
  }, zone)
}
