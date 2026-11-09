import type { MixLayer } from './types'
export interface Voice { ramp(gain:number, seconds:number, mode:'in'|'out'|'move'):void; stop():void }
interface Entry { voice:Voice; fading:boolean; order:number; partner?:string; timer?:ReturnType<typeof setTimeout>; accelerated?:boolean }
export function createLayerScheduler(deps:{create(id:string):Voice}) {
  const active=new Map<string,Entry>();let target:MixLayer[]=[],counter=0,limit=6,duration=4,disposed=false,paused=false
  let drainTimer:ReturnType<typeof setTimeout>|undefined
  const stop=(id:string)=>{const item=active.get(id);if(!item)return;clearTimeout(item.timer);item.voice.stop();active.delete(id)}
  function fade(id:string,seconds=duration,partner?:string){
    const item=active.get(id);if(!item)return
    if(!item.fading){item.order=++counter;item.fading=true}
    clearTimeout(item.timer);item.partner=partner??item.partner;item.voice.ramp(0,seconds,'out')
    item.timer=setTimeout(()=>{stop(id);drain()},seconds*1000)
  }
  function drain(){
    if(disposed||paused)return
    clearTimeout(drainTimer)
    const wanted=new Map(target.map(x=>[x.id,x.gain]))
    const scheduled=new Set<string>()
    for(const [id,item] of active)if(wanted.has(id)&&item.fading){clearTimeout(item.timer);item.fading=false;item.accelerated=false;item.voice.ramp(wanted.get(id)!,duration,'move')}
    const queue=target.filter(x=>!active.has(x.id))
    for(const layer of queue){
      if(active.size>=limit){
        const oldest=[...active.entries()].filter(([,x])=>x.fading).sort((a,b)=>a[1].order-b[1].order)[0]
        if(oldest&&!oldest[1].accelerated){
          oldest[1].accelerated=true;fade(oldest[0],.5)
          const pair=oldest[1].partner, item=pair?active.get(pair):undefined
          if(item&&wanted.has(pair!)){item.voice.ramp(wanted.get(pair!)!,.5,'in');scheduled.add(pair!)}
        }
        break
      }
      const old=[...active.entries()].find(([id,item])=>!item.fading&&!wanted.has(id))
      active.set(layer.id,{voice:deps.create(layer.id),fading:false,order:0})
      active.get(layer.id)!.voice.ramp(layer.gain,duration,'in')
      scheduled.add(layer.id)
      if(old)fade(old[0],duration,layer.id)
    }
    const outstanding=target.filter(x=>!active.has(x.id)).length
    const obsolete=[...active.entries()].filter(([id,item])=>!item.fading&&!wanted.has(id))
    obsolete.slice(outstanding).forEach(([id])=>fade(id))
    for(const layer of target){const item=active.get(layer.id);if(item&&!item.fading&&!scheduled.has(layer.id))item.voice.ramp(layer.gain,duration,'move')}
  }
  return {
    hold(){paused=true},
    update(layers:MixLayer[],sourceLimit=6,seconds=4){paused=false;duration=seconds;target=layers.slice(0,4);limit=sourceLimit;drain()},
    ids:()=>[...active.keys()],
    counts:()=>({steady:[...active.values()].filter(x=>!x.fading).length,total:active.size}),
    dispose(){disposed=true;clearTimeout(drainTimer);[...active.keys()].forEach(stop)},
  }
}
