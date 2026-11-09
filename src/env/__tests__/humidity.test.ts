import { expect,it } from 'vitest'
import { isHuinantian } from '../humidity'
import { mapWeather } from '../weather'
import { parseEnvResponse } from '../../../shared/env-api'
it('requires spring, ≥90% humidity and a real rise over yesterday',()=>{
 const wet={humidity:90,temperature:24,previousDayTemperature:22}
 for(const index of [0,1,2,3,4])expect(isHuinantian(wet,index)).toBe(true)
 for(const index of [5,6,18,23])expect(isHuinantian(wet,index)).toBe(false)
 for(const w of [{...wet,humidity:89.9},{...wet,humidity:null},{...wet,previousDayTemperature:null},{...wet,temperature:22},{...wet,temperature:21}])expect(isHuinantian(w,2)).toBe(false)
})
it('preserves zero and missing humidity without invalidating legacy weather',()=>{
 const weather={code:0,cloudCover:0,windSpeed:0,windDirection:0,temperature:24,precipitation:0}
 expect(mapWeather({...weather,humidity:0,previousDayTemperature:20})?.humidity).toBe(0)
 expect(mapWeather(weather)?.humidity).toBeNull()
 const response={location:null,fetchedAt:'2026-11-08T00:00:00Z',weather:{...weather,isDay:true,sunrise:null,sunset:null,humidity:95,previousDayTemperature:20}}
 expect(parseEnvResponse(response)?.weather?.humidity).toBe(95)
 expect(parseEnvResponse({...response,weather:{...response.weather,humidity:101}})).toBeNull()
})
