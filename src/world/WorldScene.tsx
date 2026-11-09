import {PerspectiveCamera,Vector3} from 'three'
import { useLayoutEffect,useRef,useMemo } from 'react'
import { useFrame,useThree } from '@react-three/fiber'
import { WorldEnvironmentProvider,useWorldEnvironment } from './environment'
import {Rooftop,createRooftopMotion} from './Rooftop'
import {CitySkyline} from './CitySkyline'
import type {WorldAction} from './actions'
import { Sky } from './Sky'
import { WorldCamera } from './WorldCamera'
import { WeatherEffects } from './WeatherEffects'
import { updateQuality,type QualityState } from './quality'
import type { EnvironmentStore } from '../env/store'
import {measureReferenceComposition} from './referenceComposition'
function Renderer(){
  const {gl,scene,camera,setDpr,size}=useThree(),{quality,reference}=useWorldEnvironment(),frames=useRef<number[]>([]),q=useRef<QualityState>({level:2,lowSince:0,highSince:0,changedAt:0}),lastCheck=useRef(0)
  useLayoutEffect(()=>{
    const initialDpr=gl.getPixelRatio(),previous=gl.info.autoReset;gl.info.autoReset=false
    const stats=()=>({camera:{position:camera.position.toArray(),direction:camera.getWorldDirection(new Vector3()).toArray(),fov:camera instanceof PerspectiveCamera?camera.fov:null},dpr:gl.getPixelRatio(),fps:frames.current.length/(frames.current.reduce((a,b)=>a+b,0)||1),drawCalls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,sampleSeconds:frames.current.reduce((a,b)=>a+b,0),quality:quality.current,particles:{rain:6000*[.25,.5,1][quality.current],snow:4000*[.25,.5,1][quality.current]}})
    const composition=import.meta.env.DEV&&reference?()=>measureReferenceComposition(scene,camera,size.width,size.height):undefined
    Object.assign(window,{__world:{stats,composition}})
    return()=>{setDpr(initialDpr);gl.info.autoReset=previous;Reflect.deleteProperty(window,'__world')}
  },[gl,quality,setDpr,scene,camera,reference,size.width,size.height])
  useFrame((_,delta)=>{
    frames.current.push(delta);while(frames.current.length>1&&frames.current.reduce((a,b)=>a+b,0)>30)frames.current.shift()
    const now=performance.now()
    if(!reference&&now-lastCheck.current>1000){lastCheck.current=now;const next=updateQuality(q.current,frames.current.length/frames.current.reduce((a,b)=>a+b,0),now);if(next.level!==q.current.level){quality.current=next.level;setDpr(next.level<2?1:Math.min(1.5,devicePixelRatio))}q.current=next}
    gl.info.reset();gl.render(scene,camera)
  },1)
  return null
}
export default function WorldScene({onInteract,referenceStore}:{onInteract?(kind:WorldAction):void;referenceStore?:EnvironmentStore}){
  const motion=useMemo(createRooftopMotion,[])
  return <WorldEnvironmentProvider referenceStore={referenceStore}><Sky/><CitySkyline/><Rooftop motion={motion} onInteract={onInteract}/><WeatherEffects/><WorldCamera motion={motion}/><Renderer/></WorldEnvironmentProvider>
}
