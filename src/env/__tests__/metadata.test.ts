import { describe, expect, it } from 'vitest'
import { solarTerms } from '../solarTerms'
import { solarTermThemes } from '../solarTermThemes'

describe('solar term metadata and data-only themes', () => {
  it('covers all 24 longitudes, stable IDs and both languages', () => {
    expect(solarTerms).toHaveLength(24)
    expect(new Set(solarTerms.map(term => term.id)).size).toBe(24)
    solarTerms.forEach((term, index) => {
      expect(term.index).toBe(index)
      expect(term.longitude).toBe((315 + index * 15) % 360)
      expect(term.season).toBe(['spring', 'summer', 'autumn', 'winter'][Math.floor(index / 6)])
      for (const lang of ['zh-CN', 'en'] as const) {
        expect(term.name[lang].trim()).not.toBe('')
        expect(term.copy[lang].trim()).not.toBe('')
      }
      expect(solarTermThemes[term.id]).toBeDefined()
      expect(term.visualThemeId).toBe(solarTermThemes[term.id].id)
      expect(term.soundThemeId).toBe(solarTermThemes[term.id].soundThemeId)
    })
  })
  it('has exactly five complete themes, with summer solstice and no seasonal snow', () => {
    const complete = Object.values(solarTermThemes).filter(theme => theme.complete)
    expect(complete.map(theme => theme.id)).toEqual(['lichun', 'qingming', 'xiazhi', 'liqiu', 'dongzhi'])
    expect(Object.values(solarTermThemes).filter(theme => !theme.complete)).toHaveLength(19)
    expect(solarTermThemes.xiazhi.props).toContain('lotus')
    expect(solarTermThemes.xiazhi.particles).toContain('fireflies')
    expect(solarTermThemes.xiazhi.sounds).toContain('summer-day')
    expect(solarTermThemes.dongzhi.props).toContain('lantern')
    expect(JSON.stringify(solarTermThemes)).not.toMatch(/snow|rain|thunder/)
  })
})
