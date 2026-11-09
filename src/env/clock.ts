import type { ClockContext, ClockOverride, WallClock } from './types'

const formatters = new Map<string, Intl.DateTimeFormat>()
export function validTimeZone(zone: string): boolean {
  try { new Intl.DateTimeFormat('en', { timeZone: zone }); return true } catch { return false }
}
export function displayTimeZone(clock: ClockContext): string {
  return validTimeZone(clock.timeZone) ? clock.timeZone : validTimeZone(clock.deviceTimeZone) ? clock.deviceTimeZone : 'UTC'
}
export function getWallClock(time: Date, timeZone: string): WallClock {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    if (formatters.size >= 16) formatters.clear()
    formatters.set(timeZone, formatter)
  }
  const parts = Object.fromEntries(formatter.formatToParts(time).map(part => [part.type, Number(part.value)]))
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute, second: parts.second }
}
export function wallClockStamp(wall: WallClock): number {
  const time = new Date(0)
  time.setUTCFullYear(wall.year, wall.month - 1, wall.day)
  time.setUTCHours(wall.hour, wall.minute, wall.second, 0)
  return +time
}
// Sample offsets around the requested local date to include both sides of a DST change.
// Exact matches sorted by instant resolve repeats early; gaps advance minute by minute.
export function fromWallClock(wall: WallClock, zone: string): Date {
  const stamp = wallClockStamp(wall)
  const offsets = new Set<number>()
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = stamp + hours * 3_600_000
    offsets.add(wallClockStamp(getWallClock(new Date(sample), zone)) - sample)
  }
  for (let minutes = 0; minutes <= 1440; minutes++) {
    const desired = minutes ? Math.floor(stamp / 60_000) * 60_000 + minutes * 60_000 : stamp
    const candidates = [...offsets].map(offset => desired - offset)
      .filter(candidate => wallClockStamp(getWallClock(new Date(candidate), zone)) === desired)
    if (candidates.length) return new Date(Math.min(...candidates))
  }
  throw new RangeError('No valid wall clock in the following day')
}
export function resolveClock(now: Date, clock: ClockContext, override: ClockOverride): Date {
  if (!Number.isFinite(+now)) throw new RangeError('Invalid clock instant')
  if (!override.date && !override.time) return new Date(now)
  const zone = displayTimeZone(clock)
  const wall = getWallClock(now, zone)
  if (override.date) [wall.year, wall.month, wall.day] = override.date.split('-').map(Number)
  if (override.time) {
    [wall.hour, wall.minute] = override.time.split(':').map(Number)
    wall.second = 0
  }
  return fromWallClock(wall, zone)
}
export function timeSliderOverride(now: Date, clock: ClockContext, minutes: number): ClockOverride {
  const value = Math.max(0, Math.min(1440, Math.round(minutes)))
  if (value === 1440) {
    const wall = getWallClock(now, displayTimeZone(clock))
    const next = new Date(wallClockStamp({ ...wall, day: wall.day + 1, hour: 0, minute: 0, second: 0 }))
    return { date: next.toISOString().slice(0, 10), time: '00:00' }
  }
  return { time: `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}` }
}
