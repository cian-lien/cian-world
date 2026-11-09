import { solarTerms } from './solarTerms'
import { normalizeDegrees } from './weather'
import type { EnvironmentState } from './types'
import { earthLongitude } from './earthLongitude'

const day = 86_400_000
const sin = (degrees: number) => Math.sin(degrees * Math.PI / 180)
// Meeus ch.25/32: VSOP87D Earth longitude with FK5, nutation and aberration.
// TT correction: Espenak/Meeus 2005–2050 polynomial; minute-level display, not ephemeris work.
export function solarLongitude(time: Date): number {
  if (!Number.isFinite(+time)) throw new RangeError('Invalid solar instant')
  const y = time.getUTCFullYear() + time.getUTCMonth() / 12 - 2000
  const deltaT = 62.92 + .32217 * y + .005589 * y * y
  const t = ((+time / day + 2440587.5 + deltaT / 86400) - 2451545) / 36525
  const tau = t / 10
  const heliocentric = earthLongitude.reduce((sum, terms, power) => sum + tau ** power * terms.reduce((total, [a, b, c]) => total + a * Math.cos(b + c * tau), 0), 0) * 180 / Math.PI
  const meanLongitude = 280.4665 + 36000.7698 * t
  const anomaly = 357.52911 + 35999.05029 * t - .0001537 * t * t
  const moonLongitude = 218.3165 + 481267.8813 * t
  const omega = 125.04452 - 1934.136261 * t
  const nutation = -17.2 * sin(omega) - 1.32 * sin(2 * meanLongitude) - .23 * sin(2 * moonLongitude) + .21 * sin(2 * omega)
  const eccentricity = .016708634 - .000042037 * t - .0000001267 * t * t
  const trueAnomaly = anomaly + (1.914602 - .004817 * t) * sin(anomaly) + .019993 * sin(2 * anomaly)
  const radius = 1.000001018 * (1 - eccentricity ** 2) / (1 + eccentricity * Math.cos(trueAnomaly * Math.PI / 180))
  return normalizeDegrees(heliocentric + 180 + (-.09033 + nutation - 20.4898 / radius) / 3600)
}
type Term = EnvironmentState['solarTerm']
const cache = new Map<number, readonly Term[]>()
function root(year: number, ordinal: number, longitude: number): number {
  const estimate = Date.UTC(year, 0, 5) + ordinal * 15.22 * day
  let low = estimate - 6 * day, high = estimate + 6 * day
  const error = (ms: number) => normalizeDegrees(solarLongitude(new Date(ms)) - longitude + 180) - 180
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2)
    if (error(mid) < 0) low = mid
    else high = mid
  }
  return Math.ceil(high)
}
function calendarTerms(year: number): Term[] {
  let entries = cache.get(year)
  if (!entries) {
    const starts = Array.from({ length: 25 }, (_, ordinal) => {
      const term = solarTerms[(ordinal + 22) % 24]
      const start = ordinal === 24 ? root(year + 1, 0, term.longitude) : root(year, ordinal, term.longitude)
      return { index: term.index, id: term.id, startedAt: new Date(start) }
    })
    entries = starts.slice(0, 24).map((term, i) => ({ ...term, nextAt: starts[i + 1].startedAt }))
    if (cache.size >= 8) cache.delete(cache.keys().next().value!)
    cache.set(year, entries)
  }
  return entries.map(term => ({ ...term, startedAt: new Date(term.startedAt), nextAt: new Date(term.nextAt) }))
}
export function calculateSolarTerms(year: number): Term[] {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new RangeError('Supported solar term years: 1900–2100')
  return calendarTerms(year)
}
export function getSolarTerm(time: Date, forcedId?: string): Term {
  if (!Number.isFinite(+time)) throw new RangeError('Invalid solar term instant')
  const year = new Date(+time + 8 * 3_600_000).getUTCFullYear()
  // Accepted local 1900–2100 dates can become a neighbouring Beijing year.
  if (year < 1899 || year > 2101) throw new RangeError('Solar term instant is outside the supported range')
  const entries = [...calendarTerms(year - 1), ...calendarTerms(year)]
  const candidates = entries.filter(term => term.startedAt <= time && (!forcedId || term.id === forcedId))
  return candidates[candidates.length - 1] ?? getSolarTerm(time)
}
