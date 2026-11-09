import { Suspense,lazy,useCallback,useEffect,useLayoutEffect,useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial,type Object3D,type Texture } from 'three'
import { useEnvironment } from '../env/useEnvironment'
import { createVisualTransition,toVisualEnvironment } from '../env/transition'
import {SceneBoundary} from '../ui/SceneBoundary'
import { Interactive } from './Interactive'
import { roomWindow } from './windowAnchors'
import { navigate } from '../route'
import { playRoomSound } from '../sound'
import { useTranslation } from 'react-i18next'
const WindowCity=lazy(()=>import('./WindowCity'))
export function RoomEnvironment({roots,active}:{roots:Object3D[];active:boolean}){
  const state=useEnvironment(),{t}=useTranslation()
  const transition=useMemo(()=>createVisualTransition(toVisualEnvironment(state),performance.now()),[])
  const material=useMemo(()=>new ShaderMaterial({toneMapped:false,uniforms:{uCity:{value:null},uHasCity:{value:0},uTime:{value:0},uDay:{value:1},uCloud:{value:0},uRain:{value:0},uSnow:{value:0},uFog:{value:0},uBody:{value:[-2,-2]},uMoon:{value:0},uPhase:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;uniform sampler2D uCity;uniform float uHasCity;uniform float uTime,uDay,uCloud,uRain,uSnow,uFog,uMoon,uPhase;uniform vec2 uBody;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){vec3 top=mix(vec3(.025,.035,.08),vec3(.38,.56,.68),uDay),bottom=mix(vec3(.16,.15,.23),vec3(.72,.79,.79),uDay);vec3 color=mix(bottom,top,vUv.y);color=mix(color,vec3(.39,.45,.48),uCloud*.6+uFog*.3);
    if(uHasCity>.5)color=texture2D(uCity,vUv).rgb;
    vec2 body=(vUv-uBody)*vec2(.94,1.3);float disc=1.-smoothstep(.045,.05,length(body));float light=1.;if(uMoon>.5){vec2 p=body/.05;float z=sqrt(max(0.,1.-dot(p,p)));light=smoothstep(-.08,.08,dot(vec3(p,z),vec3(sin(uPhase*6.283185),0.,-cos(uPhase*6.283185))));}if(uHasCity<.5)color=mix(color,vec3(.92,.88,.68),disc*light);
    for(int i=0;i<24;i++){float f=float(i);vec2 p=vec2(hash(vec2(f,2.)),fract(hash(vec2(f,3.))-uTime*.09));float drop=1.-smoothstep(.004,.012,length((vUv-p)*vec2(1.,.5)));float streak=(1.-smoothstep(.001,.004,abs(vUv.x-p.x)))*(1.-smoothstep(.02,.16,abs(vUv.y-p.y)));color=mix(color,vec3(.7,.79,.82),uRain*(drop*.35+streak*.24));}
    for(int i=0;i<20;i++){float f=float(i);vec2 p=vec2(hash(vec2(f,8.))+.04*sin(uTime+f),fract(hash(vec2(f,4.))-uTime*.04));float dot=1.-smoothstep(.003,.008,length(vUv-p));color=mix(color,vec3(.88,.91,.9),dot*uSnow);}
    color=mix(color,vec3(.62,.67,.67),uFog*.4);gl_FragColor=vec4(color,1.);\n#include <colorspace_fragment>\n}`}),[])
  const onTexture=useCallback((texture:Texture|null)=>{material.uniforms.uCity.value=texture;material.uniforms.uHasCity.value=texture?1:0},[material])
  useLayoutEffect(()=>{
    const hidden:{object:Object3D;visible:boolean}[]=[]
    roots.forEach(root=>root.traverse(object=>{if(object.name.startsWith('V2_Room_Glass')||['sky','moon','city'].includes(object.userData.bakeAccent)){hidden.push({object,visible:object.visible});object.visible=false}}))
    return()=>hidden.forEach(({object,visible})=>{object.visible=visible})
  },[roots])
  useEffect(()=>{transition.setTarget(toVisualEnvironment(state),performance.now())},[state,transition])
  useEffect(()=>()=>material.dispose(),[material])
  useFrame(({clock})=>{
    if(!active)return
    const v=transition.sample(performance.now()),u=material.uniforms
    u.uTime.value=clock.elapsedTime;u.uDay.value=Math.max(0,Math.min(1,(state.sun.altitude+8)/16));u.uCloud.value=v.cloudCover;u.uRain.value=v.rain;u.uSnow.value=v.snow;u.uFog.value=v.fog
    const body=state.sun.altitude>0?state.sun:state.moon,az=body.azimuth*Math.PI/180
    u.uBody.value=body.altitude>0&&Math.cos(az)>.1?[.5+Math.sin(az)*.45,.12+body.altitude/100]:[-2,-2];u.uMoon.value=state.sun.altitude>0?0:1;u.uPhase.value=state.moon.phase
  })
  return <><SceneBoundary><Suspense fallback={null}><WindowCity active={active} onTexture={onTexture}/></Suspense></SceneBoundary><Interactive position={roomWindow.center} label={`🌇 ${t('environment.outside')}`} labelHeight={.85} onSelect={()=>{playRoomSound('diary');navigate('/world')}}><mesh><planeGeometry args={roomWindow.size}/><primitive attach="material" object={material}/></mesh></Interactive></>
}
