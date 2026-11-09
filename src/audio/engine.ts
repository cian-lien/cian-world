import type { EnvironmentState } from '../env/types'
import type { AudioClip, AudioPreferences, MixTarget } from './types'
import { selectMix } from './mix'
import { createLayerScheduler } from './scheduler'
import { subscribeThunder } from './thunder'
export function createAudioEngine(ctx:AudioContext) {
  const master=ctx.createGain(),ambience=ctx.createGain(),effects=ctx.createGain(),outside=ctx.createGain(),filter=ctx.createBiquadFilter()
  filter.type='lowpass';filter.Q.value=.7
  outside.connect(filter);filter.connect(ambience);ambience.connect(master);effects.connect(master);master.connect(ctx.destination)
  let targetIds=new Set<string>()
  let clips:AudioClip[]=[],manifest:Promise<void>|undefined,prefs:AudioPreferences,currentMix:MixTarget|undefined,space:'indoor'|'outdoor'='indoor',generation=0,visible=true,disposed=false,peak=0
  const buffers=new Map<string,AudioBuffer>(),loading=new Map<string,Promise<AudioBuffer|null>>()
  const shortSources=new Set<AudioBufferSourceNode>(),thunderSources=new Set<AudioBufferSourceNode>()
  let suspendTimer:ReturnType<typeof setTimeout>|undefined,thunderTimer:ReturnType<typeof setTimeout>|undefined
  function ramp(param:AudioParam,value:number,seconds:number,from=param.value){
    const now=ctx.currentTime
    param.cancelScheduledValues(now)
    param.setValueAtTime(seconds>0?from:value,now)
    if(seconds>0)param.linearRampToValueAtTime(value,now+seconds)
  }
  const scheduler=createLayerScheduler({create(id){
    const buffer=buffers.get(id)!,clip=clips.find(x=>x.id===id)!,source=ctx.createBufferSource(),gain=ctx.createGain()
    source.buffer=buffer;source.loop=true;source.loopStart=clip.loopStart;source.loopEnd=clip.loopEnd;gain.gain.value=0
    source.connect(gain);gain.connect(id==='rain-window'||id==='wind-indoor'?ambience:outside);source.start()
    peak=Math.max(peak,scheduler.counts().total+1+thunderSources.size)
    let from=0,to=0,started=ctx.currentTime,duration=0
    const current=()=>{const t=duration?Math.max(0,Math.min(1,(ctx.currentTime-started)/duration)):1;return Math.sqrt(from*from*Math.cos(t*Math.PI/2)**2+to*to*Math.sin(t*Math.PI/2)**2)}
    return {ramp(value,seconds){from=current();to=value;started=ctx.currentTime;duration=seconds;const curve=new Float32Array(65);for(let i=0;i<curve.length;i++){const t=i/(curve.length-1);curve[i]=Math.sqrt(from*from*Math.cos(t*Math.PI/2)**2+to*to*Math.sin(t*Math.PI/2)**2)}gain.gain.cancelScheduledValues(0);gain.gain.setValueCurveAtTime(curve,started,seconds)},stop(){try{source.stop()}catch{/* Already ended. */}source.disconnect();gain.disconnect()}}
  }})
  async function load(id:string,effect=false):Promise<AudioBuffer|null>{
    const key=effect?`effect:${id}`:id
    if(buffers.has(key)){const b=buffers.get(key)!;buffers.delete(key);buffers.set(key,b);return b}
    if(loading.has(key))return loading.get(key)!
    const promise=(async()=>{
      try{
        if(!effect){manifest??=fetch(`${import.meta.env.BASE_URL}sounds/ambience/manifest.json`).then(r=>{if(!r.ok)throw new Error('manifest');return r.json()}).then(data=>{clips=data.clips});await manifest}
        const clip=clips.find(x=>x.id===id),file=effect?`${id}.m4a`:clip?.file
        if(!file)return null
        const response=await fetch(`${import.meta.env.BASE_URL}sounds/${effect?'':'ambience/'}${file}`)
        if(!response.ok)return null
        const decoded=await ctx.decodeAudioData(await response.arrayBuffer())
        if(disposed)return null
        const pinned=new Set([...scheduler.ids(),...targetIds])
        for(const [old] of buffers){if(buffers.size<10)break;if(!pinned.has(old))buffers.delete(old)}
        if(buffers.size>=10)return null
        buffers.set(key,decoded);return decoded
      }catch{return null}finally{loading.delete(key)}
    })();loading.set(key,promise);return promise
  }
  async function updateMix(mix:MixTarget, fadeSeconds=currentMix?4:3){
    currentMix=mix
    if(!visible||disposed)return
    const own=++generation
    targetIds=new Set([...mix.layers.map(x=>x.id),...(mix.thunder?['thunder-01']:[])])
    ramp(filter.frequency,mix.cutoff,fadeSeconds);ramp(outside.gain,mix.outsideGain,fadeSeconds)
    if(!mix.thunder){clearTimeout(thunderTimer);thunderTimer=undefined;for(const source of thunderSources){try{source.stop()}catch{}}}
    if(!prefs?.ambienceEnabled){scheduler.update([]);return}
    scheduler.hold()
    await Promise.all(mix.layers.map(x=>load(x.id)))
    if(disposed||own!==generation||!visible||!prefs.ambienceEnabled)return
    scheduler.update(mix.layers.filter(x=>buffers.has(x.id)),mix.thunder?5:6,fadeSeconds)
    if(mix.thunder)void load('thunder-01')
  }
  function update(next:EnvironmentState,nextSpace:'indoor'|'outdoor'){
    const fade=!currentMix?3:nextSpace!==space?1.5:4
    space=nextSpace
    return updateMix(selectMix(next,space),fade)
  }
  const unlisten=subscribeThunder(event=>{
    if(!currentMix?.thunder||!prefs?.ambienceEnabled||prefs.muted||!visible)return
    clearTimeout(thunderTimer)
    thunderTimer=setTimeout(()=>{
      const buffer=buffers.get('thunder-01');if(!buffer||thunderSources.size||scheduler.counts().total>=6||!visible)return
      const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=.5;source.connect(gain);gain.connect(outside);thunderSources.add(source);peak=Math.max(peak,scheduler.counts().total+thunderSources.size);source.onended=()=>{source.disconnect();gain.disconnect();thunderSources.delete(source)};source.start()
    },Math.max(0,event.thunderAt-Date.now()))
  })
  return {
    update,
    updateMix,
    preferences(value:AudioPreferences){
      const initial=!prefs
      const unmuting=prefs?.muted&&!value.muted
      prefs=value
      // Fade the background separately so a short click is audible on the first gesture.
      ramp(ambience.gain,value.ambienceEnabled?value.ambienceVolume:0,initial?0:3,unmuting?0:undefined)
      ramp(effects.gain,value.effectsEnabled?value.effectsVolume:0,initial?0:.1)
      ramp(master.gain,value.muted||!visible?0:1,initial||unmuting?0:value.muted?.1:3)
      if(currentMix)void updateMix(currentMix)
    },
    async playEffect(file:string){if(!prefs?.effectsEnabled||prefs.muted||!visible)return;const buffer=await load(file,true);if(!buffer||disposed||prefs.muted||!visible)return;const source=ctx.createBufferSource();source.buffer=buffer;source.connect(effects);shortSources.add(source);source.onended=()=>{source.disconnect();shortSources.delete(source)};source.start()},
    setVisible(value:boolean){visible=value;clearTimeout(suspendTimer);clearTimeout(thunderTimer);if(value){if(currentMix)void updateMix(currentMix);void ctx.resume().catch(()=>{});ramp(master.gain,prefs?.muted?0:1,1)}else{++generation;ramp(master.gain,0,1);suspendTimer=setTimeout(()=>{if(!visible)void ctx.suspend().catch(()=>{})},1000)}},
    stats:()=>({...scheduler.counts(),total:scheduler.counts().total+thunderSources.size,peak,buffers:buffers.size,state:ctx.state}),
    dispose(){disposed=true;++generation;clearTimeout(suspendTimer);clearTimeout(thunderTimer);unlisten();scheduler.dispose();for(const source of [...shortSources,...thunderSources]){try{source.stop()}catch{}source.disconnect()}buffers.clear();master.disconnect();ambience.disconnect();effects.disconnect();outside.disconnect();filter.disconnect()},
  }
}
