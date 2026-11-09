import { useEffect,useMemo,useRef,type ReactNode } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Color,ExtrudeGeometry,InstancedMesh,Object3D,Shape,type Group } from 'three'
import { useTranslation } from 'react-i18next'
import { Interactive } from '../scene/Interactive'
import { navigate } from '../route'
import { playRoomSound } from '../sound'
import { solarTermThemes } from '../env/solarTermThemes'
import { Surface } from './surfaceMaterial'
import { useWorldEnvironment } from './environment'
export const noise=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
type V3=[number,number,number]
export interface Instance {p:V3;s:V3|number;r?:V3;color?:string}
export function Instances({items,children}:{items:Instance[];children:ReactNode}){
  const ref=useRef<InstancedMesh>(null)
  useEffect(()=>{const mesh=ref.current!,dummy=new Object3D(),color=new Color();items.forEach((item,i)=>{dummy.position.set(...item.p);dummy.rotation.set(...(item.r??[0,0,0]));if(typeof item.s==='number')dummy.scale.setScalar(item.s);else dummy.scale.set(...item.s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,color.set(item.color??'#ffffff'))});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true},[items])
  return <instancedMesh ref={ref} args={[undefined,undefined,items.length]} castShadow receiveShadow>{children}</instancedMesh>
}
function Box({position,size,color,rotation}:{position:V3;size:V3;color:string;rotation?:V3}){return <RoundedBox args={size} radius={Math.min(.025,Math.min(...size)*.4)} smoothness={2} position={position} rotation={rotation} castShadow receiveShadow><Surface color={color}/></RoundedBox>}
export function Island({onInteract}:{onInteract?(kind:'mail'|'construction'):void}){
  const {state}=useWorldEnvironment(),{t}=useTranslation(),theme=solarTermThemes[state.solarTerm.id],night=state.phase==='night'||state.phase==='dusk'
  const path=useMemo<Instance[]>(()=>Array.from({length:12},(_,i)=>({p:[-.05+i*.34,.24,-.5-i*.19],s:[.37,.07,.29],r:[0,noise(i)*.5,0],color:i%3?'#c8b9a0':'#b8ad9a'})),[])
  const stones=useMemo<Instance[]>(()=>Array.from({length:18},(_,i)=>{const a=i/18*Math.PI*2;return {p:[-2.45+Math.cos(a)*1.52,.27,-2.5+Math.sin(a)*1.0],s:[.18+noise(i)*.08,.13,.16],color:'#a1a59a'}}),[])
  return <>
    <RoundedBox args={[11,.65,8.5]} radius={.14} smoothness={3} position={[0,-.17,0]} castShadow receiveShadow><Surface color="#7a4e33"/></RoundedBox>
    <RoundedBox args={[10.88,.14,8.38]} radius={.05} smoothness={3} position={[0,.19,0]} receiveShadow><Surface color={theme.groundColor}/></RoundedBox>
    <Instances items={path}><cylinderGeometry args={[1,1,1,8]}/><Surface color="#ffffff"/></Instances>
    <mesh position={[-2.45,.275,-2.5]} rotation={[-Math.PI/2,0,0]} scale={[1.55,1.05,1]} receiveShadow><circleGeometry args={[1,48]}/><Surface color="#739b9d" roughness={.22}/></mesh>
    <Instances items={stones}><icosahedronGeometry args={[1,0]}/><Surface color="#ffffff"/></Instances>
    <House/>
    <Tree/>
    <Grass/>
    <SeasonalProps/>
    <group position={[3.6,.3,1.6]} rotation={[0,.1,0]}>
      <Box position={[0,.44,0]} size={[1.5,.12,.52]} color="#b5a186"/>
      <Box position={[0,.85,.2]} size={[1.5,.48,.08]} color="#b5a186"/>
      {[-.56,.56].map(x=><Box key={x} position={[x,.2,0]} size={[.12,.45,.5]} color="#777970"/>)}
    </group>
    <group position={[3.7,.3,-2.7]}>
      <mesh position={[0,1.3,0]} castShadow><cylinderGeometry args={[.035,.05,2.6,8]}/><Surface color="#687167"/></mesh>
      <mesh position={[0,2.7,0]}><coneGeometry args={[.26,.22,6]}/><Surface color="#687167"/></mesh>
      <mesh position={[0,2.48,0]}><cylinderGeometry args={[.13,.15,.28,6]}/><meshStandardMaterial color="#d9cfb4" emissive="#ffce8a" emissiveIntensity={night?2:.15}/></mesh>
      <pointLight position={[0,2.5,0]} color="#ffd6a0" intensity={night?5:0} distance={5}/>
    </group>
    <Interactive activeViews={['world']} label={t('environment.mailbox')} position={[1.5,.3,-3.2]} labelHeight={1.2} onSelect={()=>{playRoomSound('computer');onInteract?.('mail')}}><Box position={[0,.42,0]} size={[.07,.85,.07]} color="#a49781"/><Box position={[0,.95,0]} size={[.5,.34,.35]} color="#9b7470"/><Box position={[0,1.03,-.19]} size={[.32,.018,.025]} color="#4e4d47"/></Interactive>
    <Interactive activeViews={['world']} label={t('environment.sign')} position={[4,.3,-.3]} labelHeight={1.4} onSelect={()=>{playRoomSound('computer');onInteract?.('construction')}}><Box position={[0,.65,0]} size={[.1,1.3,.1]} color="#a08c6e"/><Box position={[.08,1.08,0]} size={[.9,.26,.1]} color="#c2ad8c"/><Box position={[-.03,.76,0]} size={[.7,.24,.1]} color="#b8a181"/></Interactive>
    <group name="FutureCharacterMount"/>
  </>
}
function House(){
  const {state}=useWorldEnvironment(),{t}=useTranslation(),night=state.phase==='night'||state.phase==='dusk'
  const roof=useMemo(()=>{const shape=new Shape();shape.moveTo(-1.65,1.85);shape.lineTo(0,2.73);shape.lineTo(1.65,1.85);shape.closePath();return new ExtrudeGeometry(shape,{depth:2.9,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.025,bevelThickness:.025})},[])
  useEffect(()=>()=>roof.dispose(),[roof])
  return <group position={[-1.4,.3,.65]}>
    <Box position={[0,.9,0]} size={[2.78,1.8,2.55]} color="#ded3be"/>
    <mesh geometry={roof} position={[0,0,-1.45]} castShadow receiveShadow><Surface color="#8d8173"/></mesh>
    <Box position={[.65,2.34,.5]} size={[.28,.85,.32]} color="#ad9e8b"/>
    {/* Back-wall window matches room's x≈1.55,z≈-2.2 after scale 0.58. */}
    <Box position={[.9,1.05,-1.29]} size={[.73,.9,.08]} color="#a38b6f"/>
    <mesh position={[.9,1.05,-1.34]}><boxGeometry args={[.61,.78,.025]}/><meshStandardMaterial color={night?'#cfb591':'#9cb6bc'} emissive="#ffbd77" emissiveIntensity={night?1.3:0}/></mesh>
    <Box position={[.9,1.05,-1.365]} size={[.035,.8,.025]} color="#b29f82"/><Box position={[.9,1.05,-1.365]} size={[.65,.035,.025]} color="#b29f82"/>
    <Interactive activeViews={['world']} label={t('environment.door')} position={[1.42,0,.34]} labelHeight={1.5} onSelect={()=>{playRoomSound('diary');navigate('/')}}><Box position={[0,.64,0]} size={[.12,1.28,.67]} color="#a59278"/><mesh position={[.075,.64,-.23]}><sphereGeometry args={[.04,8,6]}/><meshStandardMaterial color="#c5b598" metalness={.4} roughness={.5}/></mesh></Interactive>
    <pointLight position={[.9,1.1,-1.7]} color="#ffcd8b" intensity={night?2:0} distance={3}/>
    <Box position={[1.57,.055,.34]} size={[.55,.1,.9]} color="#bdb5a5"/>
  </group>
}
function Tree(){
  const {state,visual}=useWorldEnvironment(),theme=solarTermThemes[state.solarTerm.id],ref=useRef<Group>(null)
  const leaves=useMemo<Instance[]>(()=>Array.from({length:38},(_,i)=>{const young=state.solarTerm.id==='lichun',factor=young?.22:1,angle=i*2.39996,r=Math.sqrt(noise(i))*(young?.85:1.25);return{p:[Math.cos(angle)*r,(young?2.4:2.6)+noise(i+40)*(young?.8:1.3),Math.sin(angle)*r],s:[(.55+noise(i+6)*.3)*factor,.65*factor,.55*factor],r:[noise(i),noise(i+1),noise(i+2)],color:i%4===0?'#a5ad83':'#ffffff'}}),[state.solarTerm.id])
  const willow=useMemo<Instance[]>(()=>Array.from({length:24},(_,i)=>{const a=i/24*Math.PI*2;return{p:[Math.sin(a)*1.05,2.3+noise(i)*.5,Math.cos(a)*1.05],s:[.045,1.4+noise(i)*.5,.045],r:[0,0,Math.sin(a)*.15]}}),[])
  const blossoms=useMemo<Instance[]>(()=>Array.from({length:24},(_,i)=>({p:[Math.sin(i*3)*(.4+noise(i)),2.4+noise(i+25)*.9,Math.cos(i*3)*(.4+noise(i))],s:.13,color:i%2?'#d6b4ad':'#e0c7bf'})),[])
  const branches=useMemo<Instance[]>(()=>Array.from({length:6},(_,i)=>({p:[Math.sin(i)*.35,1.9+i*.17,Math.cos(i)*.35],s:[.09,.95,.09],r:[Math.sin(i)*.55,0,Math.cos(i)*.55]})),[])
  useFrame(({clock})=>{if(ref.current){const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,wind=reduced?0:Math.min(25,visual.current.windSpeed);const a=visual.current.windDirection*Math.PI/180;ref.current.rotation.z=Math.sin(clock.elapsedTime*1.8)*wind*.003*Math.cos(a);ref.current.rotation.x=Math.sin(clock.elapsedTime*1.6)*wind*.003*Math.sin(a)}})
  return <group position={[2.55,.3,-1.15]}><group ref={ref}><mesh position={[0,1.5,0]} castShadow><cylinderGeometry args={[.12,.22,3,8]}/><Surface color="#9c8971"/></mesh><Instances items={branches}><cylinderGeometry args={[.6,1,1,6]}/><Surface color="#9c8971"/></Instances>{state.season!=='winter'&&<Instances items={leaves}><icosahedronGeometry args={[1,0]}/><Surface color={theme.treeColor} sway/></Instances>}{state.solarTerm.id==='qingming'&&<Instances items={willow}><cylinderGeometry args={[1,1,1,4]}/><Surface color="#8d9f72" sway/></Instances>}{state.solarTerm.id==='lichun'&&<Instances items={blossoms}><icosahedronGeometry args={[1,0]}/><Surface color="#ffffff"/></Instances>}</group></group>
}
function Grass(){
  const {state}=useWorldEnvironment(),theme=solarTermThemes[state.solarTerm.id]
  const items=useMemo<Instance[]>(()=>Array.from({length:650},(_,i)=>({p:[(noise(i)-.5)*10.2,.36,(noise(i+700)-.5)*7.8] as V3,s:[.7+noise(i+3),.6+noise(i+11),.8] as V3,r:[0,noise(i+4)*Math.PI,0] as V3})).filter(x=>!(x.p[0]<.2&&x.p[0]>-3.1&&x.p[2]>-.8&&x.p[2]<2.1)&&((x.p[0]+2.45)**2/3+(x.p[2]+2.5)**2)>1.5),[])
  return <Instances items={items}><coneGeometry args={[.065,.3,3]}/><Surface color={theme.treeColor} sway/></Instances>
}
function SeasonalProps(){
  const {state,visual}=useWorldEnvironment(),fireflies=useRef<InstancedMesh>(null),dummy=useMemo(()=>new Object3D(),[])
  const lotus=useMemo<Instance[]>(()=>Array.from({length:7},(_,i)=>({p:[-2.45+Math.sin(i*8)*.9,.31,-2.5+Math.cos(i*8)*.6],s:[.24,.018,.24],r:[0,noise(i)*6,0],color:'#779279'})),[])
  const petals=useMemo<Instance[]>(()=>lotus.flatMap((leaf,i)=>Array.from({length:6},(_,j)=>{const angle=j/6*Math.PI*2;return {p:[leaf.p[0]+Math.cos(angle)*.07,.35,leaf.p[2]+Math.sin(angle)*.07] as V3,s:[.12,.06,.045] as V3,r:[0,-angle,0] as V3,color:i%2?'#d6b6b4':'#dfc6bf'}})),[lotus])
  const autumn=useMemo<Instance[]>(()=>Array.from({length:24},(_,i)=>({p:[1.4+noise(i)*2.5,.3,-1+noise(i+4)*2.2],s:[.09,.018,.16],r:[0,noise(i)*6,0],color:i%2?'#bca07e':'#a58d72'})),[])
  useFrame(({clock})=>{if(fireflies.current){const night=state.phase==='night'||state.phase==='dusk';fireflies.current.count=night?24:0;for(let i=0;i<24;i++){dummy.position.set(-1+Math.sin(i*3+clock.elapsedTime*.18)*3,.7+noise(i)*1.2+Math.sin(clock.elapsedTime+i)*.1,-2+Math.cos(i*7+clock.elapsedTime*.12)*1.3);dummy.scale.setScalar(.02+.008*Math.sin(clock.elapsedTime*2+i));dummy.updateMatrix();fireflies.current.setMatrixAt(i,dummy.matrix)}fireflies.current.instanceMatrix.needsUpdate=true}})
  return <>
    {state.solarTerm.id==='xiazhi'&&<><Instances items={lotus}><cylinderGeometry args={[1,1,1,12]}/><Surface color="#ffffff"/></Instances><Instances items={petals}><octahedronGeometry args={[1,0]}/><Surface color="#ffffff"/></Instances></>}
    {state.season==='summer'&&<instancedMesh ref={fireflies} args={[undefined,undefined,24]}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial color="#d5d68b" toneMapped={false}/></instancedMesh>}
    {state.season==='autumn'&&<Instances items={autumn}><octahedronGeometry args={[1,0]}/><Surface color="#ffffff"/></Instances>}
    {state.solarTerm.id==='qingming'&&<group position={[2.4,4.6,-2.7]} rotation={[0,0,.25]}><mesh><octahedronGeometry args={[.35,0]}/><Surface color="#b6a194"/></mesh><mesh position={[0,-.65,0]}><cylinderGeometry args={[.006,.006,1.1,4]}/><Surface color="#b4aa92"/></mesh></group>}
    {state.solarTerm.id==='dongzhi'&&<group position={[.2,1.7,.7]}><mesh><sphereGeometry args={[.19,8,6]}/><meshStandardMaterial color="#b78a76" emissive="#dba26d" emissiveIntensity={state.phase==='night'?.8:.1}/></mesh><mesh position={[0,-.25,0]}><cylinderGeometry args={[.012,.012,.2,5]}/><Surface color="#b99a6b"/></mesh></group>}
  </>
}
