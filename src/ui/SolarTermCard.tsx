import { useEffect,useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEnvironment,useEnvironmentStatus } from '../env/useEnvironment'
const seen=new Set<string>()
export function SolarTermCard(){
  const state=useEnvironment(),status=useEnvironmentStatus(),{t}=useTranslation(),[visible,setVisible]=useState(false),id=state.solarTerm.id
  useEffect(()=>{
    if(status.fieldSources.solarTerm!=='live'||status.fieldSources.time!=='live'){setVisible(false);return}
    try{const saved=JSON.parse(localStorage.getItem('room-blog.seen-terms.v1')??'[]');if(Array.isArray(saved))saved.forEach(x=>{if(typeof x==='string')seen.add(x)})}catch{}
    if(seen.has(id))return;seen.add(id);try{localStorage.setItem('room-blog.seen-terms.v1',JSON.stringify([...seen]))}catch{}
    setVisible(true)
  },[id,status.fieldSources.solarTerm,status.fieldSources.time])
  useEffect(()=>{if(!visible)return;const timer=setTimeout(()=>setVisible(false),6000);return()=>clearTimeout(timer)},[visible,id])
  return visible?<aside className="solar-term-card" aria-live="polite"><b>{t(`environment.terms.${id}`)}</b><p>{t(`environment.copies.${id}`)}</p></aside>:null
}
