import { describe, expect, it } from 'vitest'
import { mapWeather } from '../weather'

const observation = { code: 0, cloudCover: .4, windSpeed: 12, windDirection: 90, temperature: 28, precipitation: 0 }
const cases = [
  [0,'clear',0], [1,'partly-cloudy',0], [2,'partly-cloudy',0], [3,'cloudy',0],
  [45,'fog',.5], [48,'fog',.8], [51,'drizzle',.2], [53,'drizzle',.4], [55,'drizzle',.6], [56,'drizzle',.2], [57,'drizzle',.6],
  [61,'rain',.3], [63,'rain',.6], [65,'rain',1], [66,'rain',.3], [67,'rain',1],
  [71,'snow',.3], [73,'snow',.6], [75,'snow',1], [77,'snow',.3],
  [80,'rain',.3], [81,'rain',.6], [82,'rain',1], [85,'snow',.3], [86,'snow',1],
  [95,'thunderstorm',.6], [96,'thunderstorm',.75], [97,'thunderstorm',.9], [98,'thunderstorm',.9], [99,'thunderstorm',1],
] as const
describe('normalized WMO observations', () => {
  it.each(cases)('maps code %s to %s at intensity %s', (code, kind, intensity) => {
    expect(mapWeather({ ...observation, code })).toEqual({ kind, intensity, cloudCover: .4, windSpeed: 12, windDirection: 90, temperature: 28, humidity: null, previousDayTemperature: null })
  })
  it.each([-1, 4, 52, 62, 100, NaN, Infinity])('rejects invalid/unlisted code %s', code => {
    expect(mapWeather({ ...observation, code })).toBeNull()
  })
  it.each(['cloudCover', 'windSpeed', 'windDirection', 'temperature', 'precipitation'] as const)('rejects nonfinite %s', key => {
    expect(mapWeather({ ...observation, [key]: NaN })).toBeNull()
    expect(mapWeather({ ...observation, [key]: Infinity })).toBeNull()
    expect(mapWeather({ ...observation, [key]: undefined })).toBeNull()
  })
  it('clamps bounded values, normalizes wind, and keeps m/s and °C', () => {
    expect(mapWeather({ ...observation, cloudCover: 5, windSpeed: -1, windDirection: -10 })).toMatchObject({ cloudCover: 1, windSpeed: 0, windDirection: 350, temperature: 28, humidity: null, previousDayTemperature: null })
    expect(mapWeather({ ...observation, cloudCover: -.5, windDirection: 721 })).toMatchObject({ cloudCover: 0, windDirection: 1 })
  })
})
