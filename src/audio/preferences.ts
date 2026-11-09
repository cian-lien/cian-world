import { useSyncExternalStore } from 'react'
import type { AudioPreferences } from './types'
const defaults:AudioPreferences={muted:false,ambienceEnabled:true,effectsEnabled:true,ambienceVolume:.25,effectsVolume:.7}
export const audioStorageKey='room-blog.audio.v1'
let value={...defaults}
try{const saved=JSON.parse(localStorage.getItem(audioStorageKey)??'null');if(saved?.version===1){for(const key of ['muted','ambienceEnabled','effectsEnabled'] as const)if(typeof saved[key]==='boolean')value[key]=saved[key];for(const key of ['ambienceVolume','effectsVolume'] as const)if(Number.isFinite(saved[key]))value[key]=Math.max(0,Math.min(1,saved[key]))}}catch{/* Use defaults without storage. */}
const listeners=new Set<()=>void>()
export const getAudioPreferences=()=>value
export function setAudioPreferences(patch:Partial<AudioPreferences>){value={...value,...patch};try{localStorage.setItem(audioStorageKey,JSON.stringify({version:1,...value}))}catch{/* Session setting remains. */}listeners.forEach(cb=>cb())}
export const subscribeAudioPreferences=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}}
export const useAudioPreferences=()=>useSyncExternalStore(subscribeAudioPreferences,getAudioPreferences,getAudioPreferences)
