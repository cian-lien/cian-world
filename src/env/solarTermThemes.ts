import { solarTerms } from './solarTerms'
import type { Season } from './types'

export interface SolarTermTheme {
  id: string; season: Season; complete: boolean; soundThemeId: string
  treeColor: string; groundColor: string; flowers: string[]; props: string[]; particles: string[]; sounds: string[]
}
const seasonal: Record<Season, Omit<SolarTermTheme, 'id' | 'complete' | 'season' | 'soundThemeId'>> = {
  spring: { treeColor: '#7fa36a', groundColor: '#8fa98a', flowers: [], props: [], particles: ['catkins'], sounds: ['day-country', 'dawn-birds'] },
  summer: { treeColor: '#728f66', groundColor: '#839576', flowers: [], props: [], particles: ['fireflies'], sounds: ['summer-day', 'summer-night'] },
  autumn: { treeColor: '#b29b73', groundColor: '#aaa082', flowers: [], props: [], particles: ['leaves'], sounds: ['day-country', 'night-field'] },
  winter: { treeColor: '#978c7e', groundColor: '#aaa79c', flowers: [], props: ['bare-branches'], particles: [], sounds: [] },
}
const special: Record<string, Partial<SolarTermTheme>> = {
  lichun: { flowers: ['plum'], props: ['new-buds'] },
  qingming: { props: ['willow', 'kite'] },
  xiazhi: { flowers: ['lotus'], props: ['lotus'], particles: ['fireflies'] },
  liqiu: { particles: ['first-leaves'] },
  dongzhi: { props: ['bare-branches', 'lantern'] },
}
export const solarTermThemes: Readonly<Record<string, SolarTermTheme>> = Object.fromEntries(solarTerms.map(term => [term.id, {
  ...seasonal[term.season], ...special[term.id], id: term.id, season: term.season,
  complete: Object.prototype.hasOwnProperty.call(special, term.id), soundThemeId: term.soundThemeId,
}]))
