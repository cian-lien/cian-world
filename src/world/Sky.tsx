import { useLayoutEffect,useMemo,useRef } from 'react'
import { useFrame,useThree } from '@react-three/fiber'
import { Color,BackSide,BufferAttribute,FogExp2,Mesh,ShaderMaterial,Vector3,type DirectionalLight,type HemisphereLight,type PointsMaterial,type InstancedMesh,Object3D } from 'three'
import { useWorldEnvironment } from './environment'
import { skyLighting } from './lighting'
import { getThunder } from '../audio/thunder'
const skyVertex='varying float vHeight;void main(){vHeight=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}'
const skyFragment='uniform vec3 topColor,bottomColor;varying float vHeight;void main(){gl_FragColor=vec4(mix(bottomColor,topColor,smoothstep(-0.12,0.75,vHeight)),1.0);#include <colorspace_fragment>\n}'
const direction=(altitude:number,azimuth:number,out:Vector3)=>{const a=altitude*Math.PI/180,z=azimuth*Math.PI/180;return out.set(Math.sin(z)*Math.cos(a),Math.sin(a),-Math.cos(z)*Math.cos(a))}
export function Sky({isolated=false}:{isolated?:boolean}){
  const {state,visual,uniforms,reference}=useWorldEnvironment(),{scene,gl}=useThree(),sun=useRef<Mesh>(null),moon=useRef<Mesh>(null),stars=useRef<PointsMaterial>(null),cloud=useRef<InstancedMesh>(null),light=useRef<DirectionalLight>(null),hemisphere=useRef<HemisphereLight>(null)
  const data=useMemo(()=>{
    const colors=[['#151b30','#554c65'],['#151b30','#554c65'],['#91a0b6','#e2b7a3'],['#a7bdc8','#c8d7dc'],['#a7bdc8','#c8d7dc'],['#7b88a4','#d3aa94'],['#151b30','#554c65'],['#151b30','#554c65']].map(pair=>pair.map(x=>new Color(x)))
    const positions=new Float32Array(600*3)
    for(let i=0;i<600;i++){const a=i*2.39996,b=.12+(Math.sin(i*17.3)*.5+.5)*.85;positions.set([Math.cos(a)*Math.sqrt(1-b*b)*40,b*40,Math.sin(a)*Math.sqrt(1-b*b)*40],i*3)}
    const sky=new ShaderMaterial({side:BackSide,depthWrite:false,toneMapped:false,uniforms:{topColor:{value:new Color()},bottomColor:{value:new Color()}},vertexShader:skyVertex,fragmentShader:skyFragment.replace('#include','\n#include')})
    const lunar=new ShaderMaterial({transparent:true,toneMapped:false,uniforms:{phase:{value:0},opacity:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv;uniform float phase,opacity;void main(){vec2 p=(vUv-.5)*2.;float rr=dot(p,p);if(rr>1.)discard;vec3 n=vec3(p,sqrt(1.-rr));vec3 l=vec3(sin(phase*6.283185),0.,-cos(phase*6.283185));float lit=smoothstep(-.06,.06,dot(n,l));gl_FragColor=vec4(mix(vec3(.08,.10,.17),vec3(.88,.88,.76),lit),opacity);\n#include <colorspace_fragment>\n}'})
    return {colors,positions,sky,lunar,top:new Color(),bottom:new Color(),dayHorizon:new Color('#c5d9f4'),fog:new FogExp2('#bac5c9',.012),sunVector:new Vector3(),moonVector:new Vector3(),dummy:new Object3D(),gray:new Color('#a6adb4')}
  },[])
  useLayoutEffect(()=>{
    const previous={fog:scene.fog,background:scene.background,environment:scene.environment,exposure:gl.toneMappingExposure}
    scene.fog=data.fog;scene.environment=null;if(!isolated)gl.toneMappingExposure=1
    return()=>{scene.fog=previous.fog;scene.background=previous.background;scene.environment=previous.environment;if(!isolated)gl.toneMappingExposure=previous.exposure;data.sky.dispose();data.lunar.dispose()}
  },[scene,gl,data,isolated])
  useFrame(({camera})=>{
    const {dayProgress:p,cloudCover,fog}=visual.current,knots=[0,.19,.24,.30,.70,.76,.81,1]
    const i=Math.max(0,knots.findIndex((x,j)=>j>0&&x>=p)-1),t=Math.max(0,Math.min(1,(p-knots[i])/(knots[i+1]-knots[i])))
    data.gray.set(state.sun.altitude < -6 ? '#353c49' : '#a6adb4')
    data.top.copy(data.colors[i][0]).lerp(data.colors[i+1][0],t).lerp(data.gray,cloudCover*.45)
    data.bottom.copy(data.colors[i][1]).lerp(data.colors[i+1][1],t).lerp(data.gray,cloudCover*.35)
    data.sky.uniforms.topColor.value.copy(data.top);data.sky.uniforms.bottomColor.value.copy(data.bottom)
    data.fog.color.copy(data.bottom).lerp(data.dayHorizon,Math.max(0,Math.min(1,state.sun.altitude/15))*(1-cloudCover*.45))
    data.fog.density=.012+fog*.065
    direction(state.sun.altitude,state.sun.azimuth,data.sunVector);direction(state.moon.altitude,state.moon.azimuth,data.moonVector)
    const night=1-Math.max(0,Math.min(1,(state.sun.altitude+7)/10))
    if(sun.current){sun.current.visible=state.sun.altitude>0;sun.current.position.copy(data.sunVector).multiplyScalar(35);sun.current.lookAt(camera.position)}
    if(moon.current){moon.current.visible=state.moon.altitude>0;moon.current.position.copy(data.moonVector).multiplyScalar(35);moon.current.lookAt(camera.position)}
    data.lunar.uniforms.phase.value=state.moon.phase;data.lunar.uniforms.opacity.value=night
    if(stars.current)stars.current.opacity=night*(1-cloudCover)
    const lighting=skyLighting(state.sun.altitude)
    if(hemisphere.current)hemisphere.current.intensity=lighting.ambient*(1-cloudCover*.2)
    if(light.current){const v=state.sun.altitude>0?data.sunVector:data.moonVector;light.current.position.copy(v).multiplyScalar(15);light.current.intensity=(state.sun.altitude>0?2.3*lighting.sun*(1-cloudCover*.65):.3*lighting.moon*Math.max(0,v.y));light.current.color.set(state.sun.altitude>0?'#fff2d9':'#aebddd')
      const event=reference?null:getThunder(),age=event?Date.now()-event.flashAt:9999;if(age>0&&age<140&&!matchMedia('(prefers-reduced-motion: reduce)').matches)light.current.intensity+=.75*Math.sin(age/140*Math.PI)
    }
    if(cloud.current){const drift=!reference&&matchMedia('(prefers-reduced-motion: reduce)').matches?0:uniforms.uTime.value*visual.current.windSpeed*.004;for(let j=0;j<20;j++){data.dummy.position.set(Math.sin(j*9.2+drift)*14,12.5+Math.sin(j*3)*1.5,10+Math.cos(j*7.4)*7);data.dummy.scale.set(1.3+(j%3)*.4,.24,.8);data.dummy.updateMatrix();cloud.current.setMatrixAt(j,data.dummy.matrix)}cloud.current.count=Math.round(cloudCover*20);cloud.current.instanceMatrix.needsUpdate=true}
  })
  return <>
    <mesh renderOrder={-10}><sphereGeometry args={[48,24,16]}/><primitive attach="material" object={data.sky}/></mesh>
    <mesh ref={sun}><circleGeometry args={[.85,32]}/><meshBasicMaterial color="#fff1c7" toneMapped={false}/></mesh>
    <mesh ref={moon}><planeGeometry args={[1.7,1.7]}/><primitive attach="material" object={data.lunar}/></mesh>
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.positions,3]}/></bufferGeometry><pointsMaterial ref={stars} size={.075} color="#fff0d1" transparent depthWrite={false}/></points>
    <instancedMesh ref={cloud} args={[undefined,undefined,20]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#e2e1da" roughness={1} transparent opacity={.4}/></instancedMesh>
    <hemisphereLight ref={hemisphere} color="#e1e3da" groundColor="#8e816f" intensity={1}/>
    <directionalLight ref={light} castShadow={!isolated} shadow-mapSize={[1024,1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={.1} shadow-camera-far={45} shadow-normalBias={.04}/>
  </>
}
