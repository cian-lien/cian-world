import {useTranslation} from 'react-i18next'
import {getTimes} from 'suncalc'
import {Modal} from './Modal'
import {useEnvironment,useEnvironmentStatus} from '../env/useEnvironment'
import {defaultCoordinates} from '../env/astronomy'
import type {WorldAction} from '../world/actions'
export default function RooftopInfo({action,onClose}:{action:WorldAction;onClose():void}){
 const{t,i18n}=useTranslation(),state=useEnvironment(),status=useEnvironmentStatus(),coordinates=state.location??defaultCoordinates
 const times=getTimes(state.time,coordinates.latitude,coordinates.longitude)
 const format=(date:Date|null)=>date&&Number.isFinite(+date)?new Intl.DateTimeFormat(i18n.language,{timeZone:status.timeZone,hour:'2-digit',minute:'2-digit'}).format(date):t('rooftop.polar')
 const phase=state.moon.phase,moon=phase<.06||phase>.94?'moonNew':phase<.44?'moonWaxing':phase<.56?'moonFull':'moonWaning'
 return <Modal title={t(`rooftop.actions.${action}`)} onClose={onClose}><div className="rooftop-info">
  {action==='garden'?<><h3>{t(`environment.terms.${state.solarTerm.id}`)}</h3><p>{t(`environment.copies.${state.solarTerm.id}`)}</p></>:action==='telescope'?<><p>{t('rooftop.skyCopy')}</p><dl><dt>{t('rooftop.sunrise')}</dt><dd>{format(times.sunrise)}</dd><dt>{t('rooftop.sunset')}</dt><dd>{format(times.sunset)}</dd><dt>{t('rooftop.moonPhase')}</dt><dd>{t(`rooftop.${moon}`)} · {Math.round(phase*100)}%</dd><dt>{t('environment.term')}</dt><dd>{t(`environment.terms.${state.solarTerm.id}`)}</dd></dl></>:<p>{t(action==='cat'?'rooftop.catCopy':action==='laundry'?'rooftop.laundryCopy':'rooftop.teaCopy')}</p>}
 </div></Modal>
}
