import { createContext,useContext,useEffect,useMemo,useRef,type MutableRefObject,type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { createVisualTransition,toVisualEnvironment,type VisualEnvironment } from '../env/transition'
import { useEnvironment } from '../env/useEnvironment'
import type { EnvironmentState } from '../env/types'
import type { EnvironmentStore } from '../env/store'
interface WorldEnvironment {state:EnvironmentState;visual:MutableRefObject<VisualEnvironment>;uniforms:Record<'uTime'|'uWind'|'uWet'|'uSnow',{value:number}>;quality:MutableRefObject<number>;reference:boolean}
const Context=createContext<WorldEnvironment|null>(null)
export const useWorldEnvironment=()=>useContext(Context)!
export function WorldEnvironmentProvider({children,referenceStore}:{children:ReactNode;referenceStore?:EnvironmentStore}){
  const state=useEnvironment(referenceStore),visual=useRef(toVisualEnvironment(state)),quality=useRef(2),reference=!!referenceStore
  const transition=useMemo(()=>createVisualTransition(visual.current,performance.now()),[])
  const uniforms=useMemo(()=>({uTime:{value:0},uWind:{value:0},uWet:{value:0},uSnow:{value:0}}),[])
  useEffect(()=>transition.setTarget(toVisualEnvironment(state),performance.now()),[state,transition])
  useFrame(({clock})=>{if(!reference)visual.current=transition.sample(performance.now());uniforms.uTime.value=reference?1:clock.elapsedTime;uniforms.uWind.value=!reference&&matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.min(30,visual.current.windSpeed);uniforms.uWet.value=visual.current.wetness;uniforms.uSnow.value=visual.current.snowCover},-2)
  return <Context.Provider value={{state,visual,uniforms,quality,reference}}>{children}</Context.Provider>
}
