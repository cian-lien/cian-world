import {expect,it} from 'vitest'
import {windowCutoff} from './cityLighting'
it('dims city windows gradually after solar midnight with no midnight jump',()=>{
 expect(windowCutoff(0)).toBeCloseTo(windowCutoff(24))
 expect(windowCutoff(.01)).toBeCloseTo(windowCutoff(23.99),2)
 expect(windowCutoff(0)).toBeGreaterThan(windowCutoff(1));expect(windowCutoff(1)).toBeGreaterThan(windowCutoff(2));expect(windowCutoff(2)).toBeGreaterThan(windowCutoff(3))
 for(let h=0;h<=24;h+=.1)expect(windowCutoff(h)).toBeGreaterThanOrEqual(.12)
})
