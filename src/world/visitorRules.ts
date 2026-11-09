import type {WeatherKind} from '../env/types'
export type Outfit='umbrella'|'raincoat'|'scarf'|'fan'
export function selectOutfits(weather:{kind:WeatherKind;windSpeed:number;temperature:number|null}):Outfit[]{
 const result:Outfit[]=[]
 if(weather.kind==='thunderstorm'||weather.windSpeed>=10.8)result.push('raincoat')
 else if(['drizzle','rain','sleet'].includes(weather.kind))result.push('umbrella')
 if(weather.temperature!==null){if(weather.temperature<=12)result.push('scarf');if(weather.temperature>=32)result.push('fan')}
 return result
}
