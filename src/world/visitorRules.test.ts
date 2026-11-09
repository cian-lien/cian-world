import {expect,it} from 'vitest'
import {selectOutfits} from './visitorRules'
it('uses rain umbrella, storm coat and inclusive cold/heat thresholds',()=>{
 expect(selectOutfits({kind:'rain',windSpeed:3,temperature:26})).toEqual(['umbrella'])
 expect(selectOutfits({kind:'thunderstorm',windSpeed:3,temperature:26})).toEqual(['raincoat'])
 expect(selectOutfits({kind:'clear',windSpeed:10.8,temperature:12})).toEqual(['raincoat','scarf'])
 expect(selectOutfits({kind:'clear',windSpeed:0,temperature:32})).toEqual(['fan'])
 expect(selectOutfits({kind:'clear',windSpeed:0,temperature:null})).toEqual([])
})
