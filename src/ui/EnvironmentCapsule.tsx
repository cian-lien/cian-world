import {isHuinantian} from '../env/humidity'
import { useTranslation } from 'react-i18next'
import { useEnvironment,useEnvironmentStatus } from '../env/useEnvironment'
export function EnvironmentCapsule({onOpen}:{onOpen():void}){
  const state=useEnvironment(),status=useEnvironmentStatus(),{t,i18n}=useTranslation()
  const time=new Intl.DateTimeFormat(i18n.language,{timeZone:status.timeZone,hour:'2-digit',minute:'2-digit',hour12:false}).format(state.time)
  const text=`${state.location?.city??t('environment.cityFallback')} · ${isHuinantian(state.weather,state.solarTerm.index)?t('rooftop.damp'):t(`environment.weather.${state.weather.kind}`)}${state.weather.temperature===null?'':` ${Math.round(state.weather.temperature)}°`} · ${time} · ${t(`environment.terms.${state.solarTerm.id}`)}`
  return <button className="environment-capsule paper-button" onClick={onOpen} aria-label={`${t('environment.panel')}: ${text}`} title={text}>📍 {text}</button>
}
