import{expect,it}from'vitest'
import{skyLighting}from'./lighting'
it('keeps dawn, dusk and the horizon continuous in both lighting directions',()=>{
 for(const altitude of [-6,0,6]){
  const a=skyLighting(altitude-.0001),b=skyLighting(altitude+.0001)
  expect(Math.abs(a.ambient-b.ambient)).toBeLessThan(.001)
  expect(Math.abs(a.sun-b.sun)).toBeLessThan(.001)
  expect(Math.abs(a.moon-b.moon)).toBeLessThan(.001)
 }
 expect(skyLighting(-90).sun).toBe(0);expect(skyLighting(90).moon).toBe(0)
})
