import { expect,it,vi } from 'vitest'
import { createAudioEngine } from './engine'
import type { EnvironmentState } from '../env/types'
import { resolveEnvironment } from '../env/resolve'
const ids=['dawn-birds','day-country','dusk-birds','night-field','summer-day','summer-night','rain-gentle','rain-spring','rain-window','wind-strong','wind-gale','wind-indoor','thunder-01']
function harness(){
  const live=new Set<{buffer:{id:string}|null}>(),ramps:number[]=[]
  const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(value:number){this.value=value},linearRampToValueAtTime(){},setValueCurveAtTime(_curve:Float32Array,_time:number,duration:number){ramps.push(duration)}})
  const node=()=>({gain:param(),frequency:param(),Q:param(),connect(){},disconnect(){}})
  const context={currentTime:0,destination:{},createGain:node,createBiquadFilter:node,createBufferSource(){const source={buffer:null as {id:string}|null,loop:false,loopStart:0,loopEnd:0,connect(){},disconnect(){},start(){live.add(source)},stop(){live.delete(source)},onended:()=>{}};return source},decodeAudioData:async(buffer:ArrayBuffer)=>({id:new TextDecoder().decode(buffer)}),resume:async()=>{},suspend:async()=>{}}
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.endsWith('manifest.json')?{ok:true,json:async()=>({clips:ids.map(id=>({id,file:`${id}.m4a`,loopStart:0,loopEnd:60}))})}:{ok:true,arrayBuffer:async()=>new TextEncoder().encode(url.split('/').pop()!.replace('.m4a','')).buffer}))
  const engine=createAudioEngine(context as unknown as AudioContext)
  engine.preferences({muted:false,ambienceEnabled:true,effectsEnabled:true,ambienceVolume:.25,effectsVolume:.7})
  return {engine,live,ramps}
}
const base=()=>resolveEnvironment({now:new Date('2026-06-21T04:00Z'),clock:{timeZone:'Asia/Shanghai',deviceTimeZone:'Asia/Shanghai'},live:null,manual:{},url:{}})
const state=(season:EnvironmentState['season'],term:string,p:number,weather:EnvironmentState['weather']['kind'],wind:number)=>({...base(),season,solarTerm:{...base().solarTerm,id:term},dayProgress:p,phase:'dawn' as const,weather:{...base().weather,kind:weather,intensity:.7,windSpeed:wind}})
it('keeps pending target recordings pinned across consecutive full mixes',async()=>{
  vi.useFakeTimers();const h=harness()
  try{
    await h.engine.update(state('summer','xiazhi',.9,'clear',18),'indoor')
    await h.engine.update(state('spring','qingming',.22,'rain',0),'indoor')
    await h.engine.update(state('autumn','liqiu',.73,'clear',12),'outdoor')
    await vi.advanceTimersByTimeAsync(5500)
    expect([...h.live].map(x=>x.buffer?.id)).toContain('wind-strong')
    expect(h.engine.stats().total).toBeLessThanOrEqual(6)
  }finally{h.engine.dispose();vi.useRealTimers();vi.unstubAllGlobals()}
})
it('crossfades indoor/outdoor replacement sources within 1.5 seconds',async()=>{
  vi.useFakeTimers();const h=harness()
  try{const sky=state('summer','xiazhi',.9,'clear',18);await h.engine.update(sky,'indoor');await vi.advanceTimersByTimeAsync(5000);h.ramps.length=0;await h.engine.update(sky,'outdoor');expect(Math.max(...h.ramps)).toBeLessThanOrEqual(1.5)}finally{h.engine.dispose();vi.useRealTimers();vi.unstubAllGlobals()}
})
