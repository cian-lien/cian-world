export interface ThunderEvent { id:number; flashAt:number; thunderAt:number }
const listeners=new Set<(event:ThunderEvent)=>void>()
let last:ThunderEvent|null=null
export const subscribeThunder=(cb:(event:ThunderEvent)=>void)=>{listeners.add(cb);return()=>{listeners.delete(cb)}}
export const getThunder=()=>last
export function createThunderController(random= Math.random, now=Date.now){
  let active=false,timer:ReturnType<typeof setTimeout>|undefined,id=0
  const schedule=()=>{timer=setTimeout(()=>{if(!active)return;const flashAt=now()+600;last={id:++id,flashAt,thunderAt:flashAt+1000+random()*3000};listeners.forEach(cb=>cb(last!));schedule()},20000+random()*40000)}
  return {update(storm:boolean){if(storm===active)return;active=storm;clearTimeout(timer);if(storm)schedule();else last=null},dispose(){active=false;clearTimeout(timer);last=null}}
}
