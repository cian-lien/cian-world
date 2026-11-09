import {useLayoutEffect,useRef,type ElementRef} from 'react'
import {CameraControls} from '@react-three/drei'
import {useFrame,useThree} from '@react-three/fiber'
import {Box3,PerspectiveCamera,Vector3} from 'three'
import {useWorldEnvironment} from './environment'
import type {RooftopMotion} from './Rooftop'

const day = { position: new Vector3(.494,10.722,11.859), target: new Vector3(-.15,0,-.902), fov: 35 }
const night = { position: new Vector3(.439,10.926,13.602), target: new Vector3(-.279,0,-1.985), fov: 30 }
const roofBoundary = () => new Box3(new Vector3(-1.2,-.5,-2.4),new Vector3(1,.5,.3))

function resetView(controls: ElementRef<typeof CameraControls>, aspect: number, smooth: boolean) {
 const scale=Math.max(1,.95/aspect)
 const p=day.position.clone().sub(day.target).multiplyScalar(scale).add(day.target)
 void controls.setLookAt(...p.toArray(),...day.target.toArray(),smooth)
}

export function WorldCamera({motion}:{motion:RooftopMotion}){
 const controls=useRef<ElementRef<typeof CameraControls>>(null),{size,camera}=useThree(),sky=useRef(false),target=useRef(new Vector3()),{state,reference}=useWorldEnvironment()
 const referenceNight=reference&&state.phase==='night'
 const aspect=size.width/size.height
 useLayoutEffect(()=>{
  const pose=referenceNight?night:day
  const previous=camera instanceof PerspectiveCamera?{fov:camera.fov,far:camera.far}:null
  if(camera instanceof PerspectiveCamera){camera.fov=pose.fov;camera.far=180;camera.updateProjectionMatrix()}
  if(reference){
   camera.position.copy(pose.position);camera.lookAt(pose.target)
  }else{
   const c=controls.current!
   c.minPolarAngle=.5;c.maxPolarAngle=1.1;c.minAzimuthAngle=-.45;c.maxAzimuthAngle=.62;c.minDistance=12;c.maxDistance=28*Math.max(1,.95/aspect);c.smoothTime=.45
   c.mouseButtons.right=0;c.mouseButtons.middle=0;c.touches.three=0;c.setBoundary(roofBoundary())
   resetView(c,aspect,false)
  }
  return()=>{if(camera instanceof PerspectiveCamera&&previous){camera.fov=previous.fov;camera.far=previous.far;camera.updateProjectionMatrix()}}
 },[aspect,camera,reference,referenceNight])
 useFrame(({clock},delta)=>{
  const c=controls.current;if(!c)return;const focus=clock.elapsedTime<motion.skyUntil
  if(focus!==sky.current){sky.current=focus;c.enabled=!focus;c.maxPolarAngle=focus?Math.PI:1.1;c.setBoundary(focus?undefined:roofBoundary())
   if(focus){const body=state.sun.altitude>0?state.sun:state.moon,a=body.altitude*Math.PI/180,z=body.azimuth*Math.PI/180;void c.setLookAt(0,1.3,2,Math.sin(z)*Math.cos(a)*25,Math.max(8,Math.sin(a)*25),-Math.cos(z)*Math.cos(a)*25,true)}else{resetView(c,aspect,true)}
  }
  if(!c.enabled)c.update(delta)
  if(!focus){c.getTarget(target.current);const x=day.target.x+(motion.position[0]+1.65)*.10,z=day.target.z+(motion.position[1]-.22)*.08;void c.moveTo(target.current.x+(x-target.current.x)*Math.min(1,delta*2),day.target.y,target.current.z+(z-target.current.z)*Math.min(1,delta*2),false)}
 })
 return reference?null:<CameraControls ref={controls} makeDefault/>
}
