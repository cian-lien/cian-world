import { describe, expect, it } from 'vitest'
import { calculateSolarTerms, getSolarTerm, solarLongitude } from '../solarLongitude'
import { hkoDates, hkoMajorTimes } from '../__fixtures__/hko-solar-terms-2026-2027'

const beijingDate = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
describe('offline solar terms against independent Hong Kong Observatory tables', () => {
  for (const year of [2026, 2027]) {
    for (let i = 0; i < 24; i++) {
      it(`${year} calendar term ${i + 1} matches the published Beijing date`, () => {
        expect(beijingDate(calculateSolarTerms(year)[i].startedAt)).toBe(`${year}-${hkoDates[year][i]}`)
      })
    }
    hkoMajorTimes[year].forEach((time, i) => {
      it(`${year} major term ${i + 1} differs by at most five minutes`, () => {
        expect(Math.abs(+calculateSolarTerms(year)[i * 2 + 1].startedAt - +new Date(`${year}-${time}:00+08:00`))).toBeLessThanOrEqual(300_000)
      })
    })
  }
  it('changes at the computed instant, wraps longitude and spans calendar years', () => {
    for (const term of calculateSolarTerms(2026)) {
      expect(getSolarTerm(term.startedAt).id).toBe(term.id)
      expect(getSolarTerm(new Date(+term.startedAt - 1000)).id).not.toBe(term.id)
      expect(term.nextAt > term.startedAt).toBe(true)
    }
    expect(getSolarTerm(new Date('2026-01-01T00:00:00Z')).id).toBe('dongzhi')
    expect(getSolarTerm(new Date('2026-02-10T00:00:00Z')).index).toBe(0)
    expect(solarLongitude(new Date('2026-03-20T22:00:00Z'))).toBeLessThan(1)
  })
  it('forced terms select their last actual occurrence without changing time', () => {
    const term = getSolarTerm(new Date('2026-01-01Z'), 'qingming')
    expect(term.id).toBe('qingming')
    expect(beijingDate(term.startedAt)).toMatch(/^2025-04/)
    expect(() => getSolarTerm(new Date('invalid'))).toThrow(RangeError)
  })
  it('supports both ends of the accepted date range and protects cached dates from caller mutation', () => {
    expect(getSolarTerm(new Date('1900-01-01T00:00Z')).id).toBe('dongzhi')
    expect(getSolarTerm(new Date('2100-12-31T00:00Z')).id).toBe('dongzhi')
    const term = calculateSolarTerms(2026)[0], before = +term.startedAt
    term.startedAt.setUTCFullYear(2030)
    expect(+calculateSolarTerms(2026)[0].startedAt).toBe(before)
  })
})
