import { expect, it } from 'vitest'
import { selectMix } from './mix'
import { resolveEnvironment } from '../env/resolve'
const state = (weather = 'clear', term = 'xiazhi', time = '12:00', wind = 0) => resolveEnvironment({ now: new Date('2026-06-21T04:00Z'), clock: { timeZone: 'Asia/Shanghai', deviceTimeZone: 'Asia/Shanghai' }, live: null, manual: {}, url: { weather: weather as 'clear', term, time, wind } })
it('selects at most four steady layers, reserves thunder and applies wind thresholds', () => {
  expect(selectMix(state('clear', 'xiazhi', '12:00', 10.79), 'outdoor').layers.some(x=>x.id.startsWith('wind-'))).toBe(false)
  expect(selectMix(state('clear', 'xiazhi', '12:00', 10.8), 'outdoor').layers.some(x=>x.id==='wind-strong')).toBe(true)
  const storm=selectMix(state('thunderstorm', 'xiazhi', '12:00', 18), 'indoor')
  expect(storm.layers.length).toBeLessThanOrEqual(3)
  expect(storm.layers.some(x=>x.id==='wind-indoor')).toBe(true)
  expect(storm.layers.some(x=>x.id==='wind-gale')).toBe(true)
  expect(storm.cutoff).toBe(1200)
  expect(storm.outsideGain).toBeCloseTo(10**(-8/20))
})
it('never manufactures rain from a term, silences winter night insects and snow birds', () => {
  expect(selectMix(state('clear','qingming'),'outdoor').layers.some(x=>x.id.startsWith('rain'))).toBe(false)
  expect(selectMix(state('rain','qingming'),'outdoor').layers.some(x=>x.id==='rain-spring')).toBe(true)
  expect(selectMix(state('clear','dongzhi','23:00'),'outdoor').layers.some(x=>x.id==='summer-night'||x.id==='night-field'||x.id.includes('birds'))).toBe(false)
  expect(selectMix(state('snow'),'outdoor').layers.every(x=>x.id.startsWith('wind'))).toBe(true)
  expect(selectMix(state(),'outdoor').layers.some(x=>x.id==='summer-day')).toBe(true)
})
it('coalesces a recording requested by both weather and season into one layer',()=>{
  const next=state();next.weather.kind='snow';next.weather.windSpeed=15
  const mix=selectMix(next,'outdoor')
  expect(new Set(mix.layers.map(x=>x.id)).size).toBe(mix.layers.length)
  expect(mix.layers.find(x=>x.id==='wind-strong')!.gain).toBeGreaterThan(.25)
})
it('uses a city bed all year, warm-season insects only, and metal-roof rain outdoors',()=>{
 const night=state('clear','dongzhi','23:00')
 expect(selectMix(night,'outdoor').layers.some(x=>x.id==='city-night')).toBe(true)
 expect(selectMix(night,'outdoor').layers.some(x=>x.id==='summer-night')).toBe(false)
 expect(selectMix(state('clear','xiazhi','23:00'),'outdoor').layers.some(x=>x.id==='summer-night')).toBe(true)
 expect(selectMix(state(),'outdoor').layers.some(x=>x.id==='city-birds')).toBe(true)
 expect(selectMix(state('rain'),'outdoor').layers.some(x=>x.id==='rain-roof')).toBe(true)
 expect(selectMix(state('rain'),'indoor').layers.some(x=>x.id==='rain-window')).toBe(true)
})
