import { describe, expect, it } from 'vitest'
import { getWallClock, resolveClock, timeSliderOverride } from '../clock'

const clock = { timeZone: 'Asia/Shanghai', deviceTimeZone: 'Europe/London' }
const now = new Date('2026-06-01T12:34:56Z')
describe('explicit wall clocks, independent of the host timezone', () => {
  it('keeps live instants, composes date-only/time-only, and freezes date+time', () => {
    expect(resolveClock(now, clock, {})).toEqual(now)
    expect(resolveClock(now, clock, { date: '2026-04-05' }).toISOString()).toBe('2026-04-05T12:34:56.000Z')
    expect(resolveClock(now, clock, { time: '22:30' }).toISOString()).toBe('2026-06-01T14:30:00.000Z')
    expect(resolveClock(now, clock, { date: '2026-04-05', time: '22:30' }).toISOString()).toBe('2026-04-05T14:30:00.000Z')
    expect(resolveClock(now, { ...clock, timeZone: 'bad' }, { time: '13:30' }).toISOString()).toBe('2026-06-01T12:30:00.000Z')
  })
  it('chooses the earlier occurrence of DST repeats and advances gaps to the next valid minute', () => {
    const ny = { timeZone: 'America/New_York', deviceTimeZone: 'UTC' }
    expect(resolveClock(now, ny, { date: '2026-11-01', time: '01:30' }).toISOString()).toBe('2026-11-01T05:30:00.000Z')
    expect(resolveClock(now, ny, { date: '2026-03-08', time: '02:30' }).toISOString()).toBe('2026-03-08T07:00:00.000Z')
  })
  it('normalizes slider endpoint to the next local day, not 24:00', () => {
    expect(timeSliderOverride(now, clock, 1440)).toEqual({ date: '2026-06-02', time: '00:00' })
    expect(timeSliderOverride(now, clock, 60)).toEqual({ time: '01:00' })
    expect(getWallClock(now, 'Asia/Shanghai')).toEqual({ year: 2026, month: 6, day: 1, hour: 20, minute: 34, second: 56 })
  })
})
