import { getAudioPreferences, subscribeAudioPreferences } from './preferences'
import type { RoomMode } from '../scene/layout'
import type { createAudioEngine } from './engine'
import type { MixTarget } from './types'
let context:AudioContext|undefined,engine:ReturnType<typeof createAudioEngine>|undefined,pending:Promise<typeof engine>|undefined,owners=0,epoch=0
let releaseBindings:()=>void=()=>{}
let roomMode:RoomMode='day'
// These recordings are already normalized to a quiet background level.
const indoorMix={outsideGain:.9,thunder:false}
const roomMix:Record<RoomMode,MixTarget>={
  day:{...indoorMix,cutoff:4600,layers:[{id:'city-birds',gain:1}]},
  night:{...indoorMix,cutoff:3200,layers:[{id:'city-night',gain:.8}]},
}
const effects={computer:'computer-mouse',diary:'diary-open',page:'diary-page-turn',lamp:'lamp-switch',cat:'cat-meow'}
export function setAudioRoomMode(mode:RoomMode){
  if(roomMode===mode)return
  roomMode=mode
  void engine?.updateMix(roomMix[mode])
}
function disposeAudio(){
  ++epoch;releaseBindings();releaseBindings=()=>{};engine?.dispose();engine=undefined;pending=undefined
  void context?.close().catch(()=>{});context=undefined;Reflect.deleteProperty(window,'__ambience')
}
export function unlockAudio(){
  const preferences=getAudioPreferences();if(preferences.muted||(!preferences.ambienceEnabled&&!preferences.effectsEnabled))return Promise.resolve(undefined)
  try{context??=new AudioContext();if(document.visibilityState!=='hidden')void context.resume().catch(()=>{})}catch{return Promise.resolve(undefined)}
  const own=epoch,unlockedContext=context
  pending??=import('./engine').then(({createAudioEngine})=>{
    if(own!==epoch)return undefined
    const audio=createAudioEngine(unlockedContext);engine=audio
    audio.setVisible(document.visibilityState!=='hidden');audio.preferences(getAudioPreferences())
    releaseBindings=subscribeAudioPreferences(()=>audio.preferences(getAudioPreferences()))
    void audio.updateMix(roomMix[roomMode])
    if(import.meta.env.DEV)Object.assign(window,{__ambience:{stats:()=>audio.stats()}})
    return audio
  }).catch(()=>{if(own===epoch)pending=undefined;return undefined})
  return pending
}
export function playEffect(name:keyof typeof effects){void unlockAudio().then(audio=>audio?.playEffect(effects[name]))}
export function installAudio(){
  let released=false
  const gesture=(event:Event)=>{
    if(event instanceof KeyboardEvent&&(event.ctrlKey||event.metaKey||event.altKey||['Shift','Control','Alt','Meta'].includes(event.key)||(event.target instanceof HTMLElement&&event.target.matches('input,textarea,[contenteditable]'))))return
    void unlockAudio()
  }
  const visibility=()=>engine?.setVisible(document.visibilityState!=='hidden')
  if(owners++===0){
    window.addEventListener('click',gesture,{capture:true,passive:true})
    window.addEventListener('keydown',gesture)
    document.addEventListener('visibilitychange',visibility)
    removeListeners=()=>{
      window.removeEventListener('click',gesture,true)
      window.removeEventListener('keydown',gesture)
      document.removeEventListener('visibilitychange',visibility)
    }
  }
  return()=>{if(released)return;released=true;if(--owners===0){removeListeners();disposeAudio()}}
}
let removeListeners=()=>{}
if(import.meta.hot)import.meta.hot.dispose(()=>{owners=0;removeListeners();disposeAudio()})
