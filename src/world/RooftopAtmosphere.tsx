import {useMemo,useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import {InstancedMesh,Object3D,type MeshBasicMaterial} from 'three'
import {useWorldEnvironment} from './environment'
import {noise} from './noise'
export function RooftopAtmosphere(){
 const {state,visual,uniforms,reference}=useWorldEnvironment(),ref=useRef<InstancedMesh>(null),material=useRef<MeshBasicMaterial>(null),dummy=useMemo(()=>new Object3D(),[])
 useFrame(()=>{
  if(!ref.current)return;const reduced=!reference&&matchMedia('(prefers-reduced-motion: reduce)').matches,night=1-Math.max(0,Math.min(1,(state.sun.altitude+6)/10)),warm=state.solarTerm.index>=6&&state.solarTerm.index<=17
  ref.current.count=warm&&night>.1&&visual.current.rain<.1?24:0
  if(material.current)material.current.opacity=night*.65
  for(let i=0;i<24;i++){const time=reduced?0:uniforms.uTime.value;dummy.position.set(2.4+noise(i)*1.1+Math.sin(time*.3+i)*.15,.4+noise(i+50)*.9+Math.sin(time*.7+i)*.06,-1.4+noise(i+30)*3.8);dummy.scale.setScalar(.012+.008*noise(i+80));dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix)}ref.current.instanceMatrix.needsUpdate=true
 })
 return <instancedMesh ref={ref} args={[undefined,undefined,24]}><sphereGeometry args={[1,4,3]}/><meshBasicMaterial ref={material} color="#e3d596" transparent depthWrite={false} toneMapped={false}/></instancedMesh>
}

export function WetPuddles(){
 const {visual,state,uniforms}=useWorldEnvironment(),ref=useRef<InstancedMesh>(null),splash=useRef<InstancedMesh>(null),mat=useRef<MeshBasicMaterial>(null),dummy=useMemo(()=>new Object3D(),[])
 useFrame(()=>{
  if(!ref.current||!splash.current)return;const wet=visual.current.wetness,rain=visual.current.rain;ref.current.count=wet>.02?8:0;splash.current.count=rain>.02?36:0;if(mat.current){mat.current.opacity=wet*.34;mat.current.color.set(state.sun.altitude<0?'#a9b2a9':'#b7d0d7')}
  for(let i=0;i<8;i++){dummy.position.set(-1.5+noise(i+200)*3.6,.014,-.9+noise(i+240)*2.3);dummy.rotation.set(-Math.PI/2,0,noise(i)*6);dummy.scale.set(.15+noise(i+290)*.24,.08+noise(i+350)*.15,1);dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix)}ref.current.instanceMatrix.needsUpdate=true
  for(let i=0;i<36;i++){const t=(uniforms.uTime.value*1.6+noise(i))%1,canopy=i<24;dummy.position.set(canopy?-3.39+(noise(i+500)-.5)*1.40:3.46+(noise(i+500)-.5)*.75,(canopy?2.77:.50)+Math.sin(t*Math.PI)*.09,canopy?.945+(noise(i+550)-.5)*2.20:2.379+(noise(i+550)-.5)*.75);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.007*(1-t));dummy.updateMatrix();splash.current.setMatrixAt(i,dummy.matrix)}splash.current.instanceMatrix.needsUpdate=true
 })
 return <><instancedMesh ref={ref} args={[undefined,undefined,8]}><circleGeometry args={[1,14]}/><meshBasicMaterial ref={mat} transparent depthWrite={false}/></instancedMesh><instancedMesh ref={splash} args={[undefined,undefined,36]}><sphereGeometry args={[1,4,3]}/><meshBasicMaterial color="#bfd1d6" transparent opacity={.5}/></instancedMesh></>
}
