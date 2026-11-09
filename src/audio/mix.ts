import type {EnvironmentState} from '../env/types'
import type {MixTarget} from './types'
export function selectMix(state:EnvironmentState,space:'indoor'|'outdoor'):MixTarget{
 const w=state.weather,indoor=space==='indoor',snow=w.kind==='snow',storm=w.kind==='thunderstorm',rain=['drizzle','rain','thunderstorm','sleet'].includes(w.kind)
 const layers:{id:string;gain:number}[]=[]
 const add=(id:string,gain:number)=>{if(gain<=.002)return;const existing=layers.find(x=>x.id===id);if(existing)existing.gain=Math.max(existing.gain,gain);else layers.push({id,gain})}
 // Weather has priority when the four-layer budget is full. The metal recording contains rain too.
 if(w.windSpeed>=10.8)add(indoor?'wind-indoor':'wind-strong',.25+Math.min(1,(w.windSpeed-10.8)/12)*.15)
 if(w.windSpeed>=17.2)add('wind-gale',.15+Math.min(1,(w.windSpeed-17.2)/16)*.15)
 if(rain){add(indoor?'rain-window':'rain-roof',w.intensity*.3);add(['qingming','guyu'].includes(state.solarTerm.id)?'rain-spring':'rain-gentle',w.intensity*.32)}
 if(snow)add('wind-strong',.035)
 else{
  const knots=[0,.19,.24,.30,.70,.76,.81,1],names=['city-night','city-night','dawn-birds','city-birds','city-birds','dusk-birds','city-night','city-night']
  const p=state.dayProgress,i=Math.max(0,knots.findIndex((x,j)=>j>0&&x>=p)-1),t=Math.max(0,Math.min(1,(p-knots[i])/(knots[i+1]-knots[i])))
  for(const [id,weight]of [[names[i],Math.cos(t*Math.PI/2)],[names[i+1],Math.sin(t*Math.PI/2)]] as [string,number][])add(id,weight*(id==='city-night'?.13:state.season==='winter'?.055:.18))
  if(state.phase==='day'){add('city-night',.025);if(state.season==='summer')add('summer-day',.12)}
  if(state.phase==='night'&&state.solarTerm.index>=6&&state.solarTerm.index<=17)add('summer-night',.10)
 }
 return{layers:layers.slice(0,storm?3:4),cutoff:indoor?1200:snow?1800:18000,outsideGain:indoor?10**(-8/20):1,thunder:storm}
}
