import {Suspense,useEffect,useLayoutEffect,useMemo,useRef} from 'react'
import {useFrame,type ThreeEvent} from '@react-three/fiber'
import {useGLTF} from '@react-three/drei'
import {Group,InstancedMesh,Object3D,MathUtils,Vector3,type MeshBasicMaterial} from 'three'
import {useTranslation} from 'react-i18next'
import {Interactive} from '../scene/Interactive'
import {useAudioPreferences} from '../audio/preferences'
import {playRoomSound} from '../sound'
import {navigate} from '../route'
import {assembleVisitor,applyOutfits,disposeModel} from './modelAssets'
import {modelUrl,useModel,useModelWeather} from './useModel'
import {useWorldEnvironment} from './environment'
import {advancePath,navigationForTerm,type Point} from './navigation'
import {selectOutfits} from './visitorRules'
import {RooftopAtmosphere,WetPuddles} from './RooftopAtmosphere'
import {worldActions,actionIcons,type WorldAction} from './actions'
import walkmap from '../../public/models/rooftop/walkmap.json'
export interface RooftopMotion {position:Point;path:Point[];pending:WorldAction|null;walking:boolean;seated:boolean;angle:number;idle:number;skyUntil:number;catAt:number;laundryAt:number;action:WorldAction|null;actionAt:number;arrivedAt:number|null;destination:Point|null}
const spawn:Point=[walkmap.anchors.VisitorSpawn[0],walkmap.anchors.VisitorSpawn[2]]
const teaApproach:Point=[walkmap.anchors.Tea_Interact[0],walkmap.anchors.Tea_Interact[2]]
export function createRooftopMotion():RooftopMotion{return{position:[...spawn],path:[],pending:null,walking:false,seated:false,angle:0,idle:0,skyUntil:0,catAt:-100,laundryAt:-100,action:null,actionAt:-100,arrivedAt:null,destination:null}}
const anchors:Record<WorldAction,string>={door:'Door_Interact',telescope:'Telescope_Interact',garden:'Garden_Interact',tea:'Tea_Interact',book:'Tea_Interact',radio:'Radio_Interact',laundry:'Laundry_Interact',cat:'Cat_Interact'}
const hitboxes:{id:WorldAction;position:[number,number,number];size:[number,number,number]}[]=[
 {id:'door',position:[-2.73,1.02,-1.46],size:[.62,2.04,.64]},{id:'telescope',position:[2.06,.7,-1.73],size:[.9,1.4,.77]},
 {id:'garden',position:[3.24,.38,.15],size:[1.17,.82,2.5]},{id:'tea',position:[.22,.24,1.64],size:[2.16,.48,1.24]},
 {id:'book',position:[1.08,.53,1.91],size:[.35,.15,.43]},{id:'radio',position:[.95,.61,1.26],size:[.57,.42,.27]},
 {id:'laundry',position:[-2.52,1.96,.97],size:[.3,1.43,2.12]},{id:'cat',position:[-3.42,2.79,-1.96],size:[.8,.45,.6]},
]
export function Rooftop({motion,onInteract}:{motion:RooftopMotion;onInteract?(action:WorldAction):void}){
 const model=useModel('rooftop'),{t}=useTranslation(),{visual,state,uniforms,reference}=useWorldEnvironment(),keys=useRef(new Set<string>()),marker=useRef<MeshBasicMaterial>(null),markerGroup=useRef<Group>(null)
 const nav=navigationForTerm(state.solarTerm.id)
 useEffect(()=>{if(!nav.isWalkable(motion.position))motion.position=nav.nearestWalkable(motion.position);if(motion.destination)motion.path=nav.findPath(motion.position,motion.destination)},[nav,motion])
 const parts=useMemo(()=>{const wind:Object3D[]=[],birds:{object:Object3D;position:Vector3;until:number}[]=[];model.traverse(o=>{if(o.userData.wind_part)wind.push(o);if(o.userData.proximity_flight)birds.push({object:o,position:o.position.clone(),until:0})});const cat=model.getObjectByName('CalicoCat')!;return{wind,birds,cat,catRoof:cat.position.clone(),tail:model.getObjectByName('Cat_TailPivot')!,body:model.getObjectByName('Cat_BodyPivot')!,catGoal:cat.position.clone(),catFrom:cat.position.clone(),catStarted:-100,head:model.getObjectByName('Cat_HeadPivot')!,door:model.getObjectByName('Door_Hinge')!}},[model])
 const go=(action:WorldAction|null,target?:Point)=>{
  if(reference)return
  if(motion.seated){motion.position=[...teaApproach];motion.seated=false}
  const anchor=action?walkmap.anchors[anchors[action] as keyof typeof walkmap.anchors]:null
  const point:Point=target??[anchor![0],anchor![2]];motion.path=nav.findPath(motion.position,point);motion.pending=action&&motion.path.length&&Math.hypot(motion.path[motion.path.length-1][0]-point[0],motion.path[motion.path.length-1][1]-point[1])<.4?action:null;motion.destination=motion.path[motion.path.length-1]??null;motion.idle=0;motion.skyUntil=0;motion.arrivedAt=null
 }
 useEffect(()=>{for(const id of ['lichun','qingming','liqiu','dongzhi'])useGLTF.preload(modelUrl('season-'+id))},[])
 useEffect(()=>{const summer=model.getObjectByName('Season_xiazhi');if(summer)summer.visible=state.solarTerm.id==='xiazhi'},[model,state.solarTerm.id])
 useEffect(()=>{
  if(reference)return
  const command=(event:Event)=>{const action=(event as CustomEvent).detail;if(worldActions.includes(action))go(action)}
  const down=(event:KeyboardEvent)=>{if(document.querySelector('[data-overlay]')||(event.target instanceof HTMLElement&&event.target.closest('input,textarea,select,button,summary,[contenteditable]'))||event.metaKey||event.ctrlKey||event.altKey)return;const key=event.key.toLowerCase();if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(key)){event.preventDefault();keys.current.add(key);motion.pending=null;motion.path=[];motion.destination=null;motion.skyUntil=0;if(motion.seated){motion.seated=false;motion.position=[...teaApproach]}}}
  const up=(event:KeyboardEvent)=>keys.current.delete(event.key.toLowerCase()),blur=()=>keys.current.clear()
  window.addEventListener('rooftop:action',command);window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur)
  return()=>{window.removeEventListener('rooftop:action',command);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur)}
 },[motion,nav,reference])
 useFrame((_,delta)=>{
  const dt=Math.min(.05,delta),now=uniforms.uTime.value,reduced=!reference&&matchMedia('(prefers-reduced-motion: reduce)').matches,blocked=!!document.querySelector('[data-overlay]');const previous:Point=[...motion.position]
  if(blocked)keys.current.clear()
  const key=keys.current,x=Number(key.has('d')||key.has('arrowright'))-Number(key.has('a')||key.has('arrowleft')),z=Number(key.has('s')||key.has('arrowdown'))-Number(key.has('w')||key.has('arrowup'))
  if(!blocked&&(x||z)){const length=Math.hypot(x,z);motion.position=nav.moveOnFloor(motion.position,[x/length*1.2*dt,z/length*1.2*dt])}
  else if(!blocked&&motion.path.length){const step=advancePath(motion.position,motion.path,1.2*dt);motion.position=step.position;motion.path=step.path}
  motion.walking=Math.hypot(motion.position[0]-previous[0],motion.position[1]-previous[1])>.00001
  if(motion.walking){motion.angle=Math.atan2(motion.position[0]-previous[0],motion.position[1]-previous[1]);motion.idle=0}else if(!reference)motion.idle+=dt
  if(!motion.path.length&&motion.pending&&motion.arrivedAt===null){motion.arrivedAt=now;const target=hitboxes.find(x=>x.id===motion.pending)!.position;motion.angle=Math.atan2(target[0]-motion.position[0],target[2]-motion.position[1])}
  if(!motion.path.length&&motion.pending&&motion.arrivedAt!==null&&now-motion.arrivedAt>.5){const action=motion.pending;motion.pending=null;motion.idle=0;motion.action=action;motion.actionAt=now
   playRoomSound(action==='cat'?'cat':action==='book'?'diary':'lamp')
   if(action==='door'){parts.door.rotation.y-=.5;navigate('/')}else{if(action==='tea')motion.seated=true;if(action==='telescope')motion.skyUntil=now+18;if(action==='cat')motion.catAt=now;if(action==='laundry')motion.laundryAt=now;onInteract?.(action)}
  }
  const rain=visual.current.rain,wind=visual.current.windSpeed
  const telescope=model.getObjectByName('Telescope_AzimuthPivot');if(telescope)telescope.rotation.y=motion.action==='telescope'&&!reduced?Math.sin(Math.min(1,now-motion.actionAt)*Math.PI)*.25:0
  for(const object of parts.wind){const clothing=object.name.includes('WindPivot');object.visible=!clothing||rain<.025;object.rotation.z=reduced?0:Math.sin(now*1.5+Number(object.userData.wind_seed??2))*(clothing?.02+.02*wind:.002*wind)+(clothing?Math.min(.8,wind*.025):0)+(clothing?Math.exp(-Math.max(0,now-motion.laundryAt)*2)*Math.sin((now-motion.laundryAt)*12)*.2:0)}
  const catTarget=now-motion.catAt<7?new Vector3(-1.75,.02,-.52):rain>.02&&!reference?new Vector3(-3.10,.015,.19):parts.catRoof;if(catTarget.distanceToSquared(parts.catGoal)>.01){parts.catGoal.copy(catTarget);parts.catFrom.copy(parts.cat.position);parts.catStarted=now}const jump=reference?1:Math.min(1,(now-parts.catStarted)/.8);parts.cat.position.lerpVectors(parts.catFrom,parts.catGoal,jump);if(!reduced)parts.cat.position.y+=Math.sin(jump*Math.PI)*.6;parts.body.rotation.x=now-motion.catAt<3&&!reduced?Math.sin((now-motion.catAt)/3*Math.PI)*.9:0;parts.tail.rotation.y=reduced?0:Math.sin(now*2.5)*(.07+(now-motion.catAt<3?.6:0));parts.head.rotation.y=reduced?0:Math.sin(now*.5)*.15
  for(const bird of parts.birds){const near=Math.hypot(motion.position[0]-bird.position.x,motion.position[1]-bird.position.z)<1.1;if(near&&now>bird.until)bird.until=now+12;const flying=!reference&&(rain>.02||now<bird.until);bird.object.position.copy(bird.position);if(flying){bird.object.position.y+=3+Math.sin(now*.5);bird.object.position.x+=Math.sin(now*.7)*3}bird.object.traverse(o=>{if(o.name.includes('Wing'))o.rotation.z=flying&&!reduced?Math.sin(now*16)*(o.name.endsWith('L')?1:-1):0})}
  if(marker.current)marker.current.opacity=motion.path.length?.45:0
  if(markerGroup.current&&motion.destination)markerGroup.current.position.set(motion.destination[0],.023,motion.destination[1])
  if(import.meta.env.DEV||new URLSearchParams(location.search).has('perf')||new URLSearchParams(location.search).has('capture'))Object.assign(window,{__rooftop:{position:motion.position.slice(),walking:motion.walking,path:motion.path.map(p=>p.slice()),pending:motion.pending,outfits:selectOutfits(state.weather),seated:motion.seated}})
 })
 useEffect(()=>()=>{Reflect.deleteProperty(window,'__rooftop')},[])
 return <>
  <primitive object={model} dispose={null}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.011,0]} onClick={(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<4){(document.activeElement as HTMLElement|null)?.blur();go(null,[e.point.x,e.point.z])}}}><planeGeometry args={[7.8,6.8]}/><meshBasicMaterial visible={false}/></mesh>
  <group ref={markerGroup}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.11,.14,24]}/><meshBasicMaterial ref={marker} color="#ecd2a4" transparent depthWrite={false}/></mesh></group>
  {!reference&&hitboxes.map(box=><Interactive key={box.id} position={box.position} label={`${actionIcons[box.id]} ${t(`rooftop.actions.${box.id}`)}`} labelHeight={box.size[1]/2+.2} activeViews={['world']} onSelect={()=>go(box.id)}><mesh><boxGeometry args={box.size}/><meshBasicMaterial visible={false}/></mesh></Interactive>)}
  <Visitor motion={motion}/><SeasonalDecor/>
  <pointLight position={[.323,1.855,1.68]} color="#ffd39b" intensity={state.sun.altitude<0?6:0} distance={7} decay={2}/>
  <TeaSteam motion={motion}/><RooftopAtmosphere/><WetPuddles/><RadioLight/>
 </>
}
function Visitor({motion}:{motion:RooftopMotion}){
 const loaded=useGLTF(['visitor','visitor-raincoat','visitor-umbrella','visitor-scarf','visitor-fan'].map(modelUrl)),{state,uniforms,reference}=useWorldEnvironment()
 const model=useMemo(()=>assembleVisitor(loaded[0].scene,loaded.slice(1).map(x=>x.scene)),[loaded]),group=useRef<Group>(null)
 useModelWeather(model);useLayoutEffect(()=>()=>disposeModel(model),[model])
 const joints=useMemo(()=>new Map(['BodyPivot','HeadPivot','Arm_L','Arm_R','Leg_L','Leg_R','Knee_L','Knee_R','Face_Eyes'].map(n=>{const object=model.getObjectByName(n)!;return[n,{object,position:object.position.clone(),rotation:object.rotation.clone()}]})),[model])
 useEffect(()=>applyOutfits(model,selectOutfits(state.weather)),[model,state.weather.kind,state.weather.windSpeed,state.weather.temperature])
 useFrame((_,delta)=>{
  if(!group.current)return;const dt=Math.min(delta,.05),time=uniforms.uTime.value,reduced=reference||matchMedia('(prefers-reduced-motion: reduce)').matches,walk=motion.walking&&!reduced?Math.sin(time*9):0,stretch=!motion.walking&&!reduced&&motion.idle%24>19
  const seated=motion.seated||(reference&&state.phase==='day')
  const nightPose=reference&&!seated
  group.current.position.set(seated?-1.26:nightPose?-1.72:motion.position[0],seated?.15:0,seated?2:nightPose?1.62:motion.position[1])
  const target=seated||nightPose?Math.PI/2:motion.angle
  const angle=MathUtils.euclideanModulo(target-group.current.rotation.y+Math.PI,Math.PI*2)-Math.PI;group.current.rotation.y+=angle*(reference?1:1-Math.exp(-dt*10))
  for(const [name,joint]of joints){joint.object.position.copy(joint.position);joint.object.rotation.copy(joint.rotation);if(name.startsWith('Leg_'))joint.object.rotation.x+=seated?-.85:walk*(name.endsWith('L')?.45:-.45);if(name.startsWith('Knee_'))joint.object.rotation.x+=seated?.65:Math.max(0,walk*(name.endsWith('L')?1:-1))*.3;if(name.startsWith('Arm_'))joint.object.rotation.x+=stretch?-1.6:walk*(name.endsWith('L')?-.3:.3);if(name==='BodyPivot'){joint.object.position.y+=reduced?0:Math.sin(time*2)*.005; joint.object.rotation.z+=state.weather.windSpeed>=10.8?-.12:0}if(name==='HeadPivot')joint.object.rotation.y+=reduced?0:Math.sin(time*.45)*.14;if(name==='Face_Eyes')joint.object.scale.y=time%4.7<.12?.1:1}
  const active=selectOutfits(state.weather);if(active.includes('umbrella'))joints.get(active.includes('fan')?'Arm_L':'Arm_R')!.object.rotation.x=0
  const hand=joints.get('Arm_R')!.object;if(selectOutfits(state.weather).includes('fan')&&!reduced)hand.rotation.x+=Math.sin(time*3)*.28-.5
  if(state.phase==='night'&&motion.idle>8&&motion.idle%18<2&&!reduced){joints.get('HeadPivot')!.object.rotation.x-=.18;hand.rotation.x=-1.3}
 })
 return <group ref={group}><primitive object={model} dispose={null}/></group>
}
function SeasonalDecor(){
 const {state}=useWorldEnvironment(),id=['lichun','qingming','xiazhi','liqiu','dongzhi'].includes(state.solarTerm.id)?state.solarTerm.id:null
 return <><Suspense fallback={null}>{id&&id!=='xiazhi'?<SeasonAsset id={id}/>:null}</Suspense><SeasonalLife/></>
}
function SeasonAsset({id}:{id:string}){const model=useModel(`season-${id}`);return <primitive object={model} dispose={null}/>}
function TeaSteam({motion}:{motion:RooftopMotion}){const group=useRef<Group>(null);useFrame(({clock})=>{if(group.current){group.current.visible=motion.seated;group.current.children.forEach((o,i)=>{o.position.y=((clock.elapsedTime*.12+i*.07)%.4);o.scale.setScalar(.6+o.position.y)})}});return <group ref={group} position={[-.18,.60,1.77]}>{[0,1,2,3].map(i=><mesh key={i}><sphereGeometry args={[.035,6,4]}/><meshBasicMaterial color="#ded9c9" transparent opacity={.18} depthWrite={false}/></mesh>)}</group>}

function SeasonalLife(){
 const {state}=useWorldEnvironment(),colors={spring:'#91a27b',summer:'#6c8c62',autumn:'#9f9569',winter:'#8f947d'},buds=state.solarTerm.id==='lichun',sprouts=useRef<InstancedMesh>(null),flowers=useRef<InstancedMesh>(null),dummy=useMemo(()=>new Object3D(),[])
 useLayoutEffect(()=>{if(sprouts.current){for(let i=0;i<6;i++){dummy.position.set(3.18+(i%2)*.08,.38+(i%3)*.04,.22-Math.floor(i/2)*.14);dummy.scale.set(.04,state.season==='winter'?.07:.12,.03);dummy.updateMatrix();sprouts.current.setMatrixAt(i,dummy.matrix)}sprouts.current.instanceMatrix.needsUpdate=true}if(flowers.current){for(let i=0;i<7;i++){dummy.position.set(-4.3+Math.sin(i*2.4)*.4,(i%3)*.13,-7.5+Math.cos(i*2.4)*.3);dummy.scale.setScalar(.06);dummy.updateMatrix();flowers.current.setMatrixAt(i,dummy.matrix)}flowers.current.instanceMatrix.needsUpdate=true}},[state.season,buds,dummy])
 return <group>
  <instancedMesh ref={sprouts} args={[undefined,undefined,6]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color={colors[state.season]} roughness={.85}/></instancedMesh>
  {buds&&<instancedMesh ref={flowers} args={[undefined,undefined,7]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#b18d87"/></instancedMesh>}
  {state.solarTerm.id==='dongzhi'&&<mesh position={[-2.65,1.38,-.2]}><boxGeometry args={[.12,.32,.05]}/><meshStandardMaterial color="#95694e" roughness={.8}/></mesh>}
 </group>
}

function RadioLight(){const prefs=useAudioPreferences(),{reference}=useWorldEnvironment(),ref=useRef<MeshBasicMaterial>(null);useFrame(({clock})=>{if(ref.current)ref.current.opacity=!reference&&prefs.ambienceEnabled&&!prefs.muted?.35+Math.sin(clock.elapsedTime*2)*.12:0});return <mesh position={[1.19,.632,1.395]}><sphereGeometry args={[.015,6,4]}/><meshBasicMaterial ref={ref} color="#d7bd89" transparent depthWrite={false} toneMapped={false}/></mesh>}
