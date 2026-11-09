import {useEffect,useMemo} from 'react'
import {createPortal,useFrame,useThree} from '@react-three/fiber'
import {useFBO} from '@react-three/drei'
import {PerspectiveCamera,Scene,type Texture} from 'three'
import {WorldEnvironmentProvider} from '../world/environment'
import {Sky} from '../world/Sky'
import {CitySkyline} from '../world/CitySkyline'
/** A lower-floor camera into the exact same skyline. Rendering never changes room exposure. */
export default function WindowCity({active,onTexture}:{active:boolean;onTexture(texture:Texture|null):void}){
 const target=useFBO(256,384,{depthBuffer:true}),{gl}=useThree(),data=useMemo(()=>{const scene=new Scene(),camera=new PerspectiveCamera(48,256/384,.1,100);camera.position.set(1.55,-1.15,.6);camera.lookAt(.4,.3,-17);return{scene,camera,last:-1}},[])
 useEffect(()=>{onTexture(target.texture);return()=>onTexture(null)},[target,onTexture])
 useFrame(({clock})=>{
  if(!active||clock.elapsedTime-data.last<.1)return;data.last=clock.elapsedTime
  const previous=gl.getRenderTarget(),exposure=gl.toneMappingExposure,xr=gl.xr.enabled
  try{gl.xr.enabled=false;gl.toneMappingExposure=1;gl.setRenderTarget(target);gl.clear();gl.render(data.scene,data.camera)}finally{gl.setRenderTarget(previous);gl.toneMappingExposure=exposure;gl.xr.enabled=xr}
 },-0.1)
 return createPortal(<WorldEnvironmentProvider><Sky isolated/><CitySkyline/></WorldEnvironmentProvider>,data.scene,{camera:data.camera})
}
