import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEnvironment, useEnvironmentStatus } from '../env/useEnvironment'
import { getBrowserEnvironment } from '../env/browser'
import { getWallClock, timeSliderOverride } from '../env/clock'
import { solarTerms } from '../env/solarTerms'
import { weatherPresets } from '../env/weather'
import type { WeatherKind } from '../env/types'
import { useAudioPreferences,setAudioPreferences } from '../audio/preferences'
import { unlockAudio } from '../audio/browser'
import { Modal } from './Modal'
export default function EnvironmentPanel({onClose,onFollowReal}:{onClose():void;onFollowReal():void}){
  const {t}=useTranslation(),store=getBrowserEnvironment(),state=useEnvironment(),status=useEnvironmentStatus(),audio=useAudioPreferences(),[credits,setCredits]=useState(false)
  const wall=getWallClock(state.time,status.timeZone),following=!Object.values(status.fieldSources).some(x=>x==='url'||x==='manual')
  const toggle=(key:'ambienceEnabled'|'effectsEnabled',value:boolean)=>{setAudioPreferences({[key]:value,muted:value?false:audio.muted});if(value)void unlockAudio()}
  return <Modal title={t('environment.panel')} onClose={onClose}>
    <label className="environment-toggle"><input type="checkbox" checked={following} onChange={event=>{if(event.target.checked){store.followReal();onFollowReal()}else store.setManual({time:`${String(wall.hour).padStart(2,'0')}:${String(wall.minute).padStart(2,'0')}`})}}/>{t('environment.follow')}</label>
    {!following&&<p className="muted">{t('environment.simulation')}</p>}
    <label>{t('environment.time')} <output>{String(wall.hour).padStart(2,'0')}:{String(wall.minute).padStart(2,'0')}</output><input aria-label={t('environment.time')} type="range" min="0" max="1440" step="1" value={wall.hour*60+wall.minute} onChange={event=>store.setManual(timeSliderOverride(state.time,{timeZone:status.timeZone,deviceTimeZone:status.timeZone},Number(event.target.value)))}/></label>
    <div className="environment-fields"><label>{t('environment.weatherLabel')}<select aria-label={t('environment.weatherLabel')} value={state.weather.kind} onChange={event=>store.setManual({weather:event.target.value as WeatherKind})}>{Object.keys(weatherPresets).map(kind=><option key={kind} value={kind}>{t(`environment.weather.${kind as WeatherKind}`)}</option>)}</select></label><label>{t('environment.wind')}<input aria-label={t('environment.wind')} type="number" min="0" max="40" value={state.weather.windSpeed} onChange={event=>store.setManual({wind:Math.max(0,Math.min(40,Number(event.target.value)))})}/></label></div>
    <label>{t('environment.term')}<select aria-label={t('environment.term')} value={state.solarTerm.id} onChange={event=>store.setManual({term:event.target.value})}>{solarTerms.map(term=><option key={term.id} value={term.id}>{t(`environment.terms.${term.id}`)}</option>)}</select></label>
    <div className="environment-fields">{(['temperature','humidity','previousDayTemperature'] as const).map(key=><label key={key}>{t(key==='temperature'?'rooftop.temperature':key==='humidity'?'rooftop.humidityLabel':'rooftop.yesterday')}<input aria-label={t(key==='temperature'?'rooftop.temperature':key==='humidity'?'rooftop.humidityLabel':'rooftop.yesterday')} type="number" min={key==='humidity'?0:-90} max={key==='humidity'?100:65} value={state.weather[key]??''} onChange={event=>{if(event.target.value!=='')store.setManual({[key]:Number(event.target.value)})}}/></label>)}</div>
    <hr/>
    {(['ambienceEnabled','effectsEnabled'] as const).map((key,index)=><div key={key}><label className="environment-toggle"><input type="checkbox" checked={audio[key]} onChange={event=>toggle(key,event.target.checked)}/>{t(index?'environment.effects':'environment.ambient')}</label><input type="range" aria-label={`${t(index?'environment.effects':'environment.ambient')} ${t('environment.volume')}`} min="0" max="1" step=".01" value={audio[index?'effectsVolume':'ambienceVolume']} onChange={event=>setAudioPreferences({[index?'effectsVolume':'ambienceVolume']:Number(event.target.value)})}/></div>)}
    {status.stale&&<p className="muted">{t('environment.fallback')}</p>}
    <p className="environment-privacy">{t('environment.privacy')} <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></p>
    <button className="paper-button" onClick={()=>setCredits(!credits)} aria-expanded={credits}>{t('environment.credits')}</button>
    {credits&&<section className="audio-credits"><p>{t('environment.creditsIntro')}</p><a href={`${import.meta.env.BASE_URL}audio-credits.html`} target="_blank" rel="noreferrer">{t('environment.sourceLink')} ↗</a></section>}
  </Modal>
}
