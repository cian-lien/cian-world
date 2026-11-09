import { expect, it, vi } from 'vitest'
import { createLayerScheduler } from './scheduler'
it('crossfades with at most 4 steady/6 total voices and reclaims the earliest fade in 500ms', () => {
  vi.useFakeTimers()
  const voices: { id:string; gain:number; stopped:boolean; target:number; duration:number }[]=[]
  const scheduler=createLayerScheduler({ create(id){const v={id,gain:0,stopped:false,target:0,duration:0};voices.push(v);return { ramp(gain,seconds){v.target=gain;v.duration=seconds}, stop(){v.stopped=true} } } })
  scheduler.update(['a','b','c','d'].map(id=>({id,gain:.3})))
  expect(scheduler.counts()).toEqual({steady:4,total:4})
  scheduler.update(['e','f','g','h'].map(id=>({id,gain:.3})))
  expect(scheduler.counts().total).toBe(6)
  expect(scheduler.counts().steady).toBeLessThanOrEqual(4)
  expect(voices.find(v=>v.id==='a')?.duration).toBeLessThanOrEqual(.5)
  vi.advanceTimersByTime(501)
  expect(voices.find(v=>v.id==='a')?.stopped).toBe(true)
  expect(scheduler.counts().total).toBeLessThanOrEqual(6)
  vi.advanceTimersByTime(5000)
  expect(scheduler.counts()).toEqual({steady:4,total:4})
  scheduler.dispose();expect(scheduler.counts().total).toBe(0)
  vi.useRealTimers()
})
it('bounds rapid replacements even while earlier source pairs are being reclaimed',()=>{
  vi.useFakeTimers();let live=0,peak=0
  const scheduler=createLayerScheduler({create(){++live;peak=Math.max(peak,live);return {ramp(){},stop(){--live}}}})
  try{
    for(let i=0;i<120;i++){
      scheduler.update(Array.from({length:i%5},(_,j)=>({id:`recording-${(i+j)%13}`,gain:.25})))
      vi.advanceTimersByTime((i*137)%700)
      expect(scheduler.counts().steady).toBeLessThanOrEqual(4)
      expect(live).toBeLessThanOrEqual(6)
    }
    vi.advanceTimersByTime(6000);expect(peak).toBe(6)
  }finally{scheduler.dispose();expect(live).toBe(0);vi.useRealTimers()}
})
it('holds queued admissions while a newer environment is still loading',()=>{
  vi.useFakeTimers();const started:string[]=[]
  const scheduler=createLayerScheduler({create(id){started.push(id);return{ramp(){},stop(){}}}})
  try{
    scheduler.update(['a','b','c','d'].map(id=>({id,gain:.2})))
    scheduler.update(['e','f','g','h'].map(id=>({id,gain:.2})))
    scheduler.hold();vi.advanceTimersByTime(1000)
    expect(started).not.toContain('g');expect(started).not.toContain('h')
    scheduler.update(['i','j'].map(id=>({id,gain:.2})))
    vi.advanceTimersByTime(6000);expect(scheduler.counts()).toEqual({steady:2,total:2})
  }finally{scheduler.dispose();vi.useRealTimers()}
})
