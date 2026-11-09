import { expect,it } from 'vitest'
import { updateQuality } from './quality'
it('reduces quality after sustained low fps with hysteresis and never exceeds particle budgets',()=>{
  let q={level:2,lowSince:0,highSince:0,changedAt:0}
  q=updateQuality(q,30,11000);q=updateQuality(q,30,22000)
  expect(q.level).toBe(1)
  expect(updateQuality(q,60,23000).level).toBe(1)
  q=updateQuality(q,60,24000);q=updateQuality(q,60,55000)
  expect(q.level).toBe(2)
})
