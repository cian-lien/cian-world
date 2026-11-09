import { useEffect,useMemo,useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending,DoubleSide,InstancedBufferAttribute,InstancedMesh,Object3D,ShaderMaterial,type MeshBasicMaterial } from 'three'
import { noise } from './noise'
import { useWorldEnvironment } from './environment'
function Particles({kind}:{kind:'rain'|'snow'|'debris'}){
  const {visual,quality,uniforms}=useWorldEnvironment(),ref=useRef<InstancedMesh>(null),count=kind==='rain'?6000:kind==='snow'?4000:80
  const seeds=useMemo(()=>new Float32Array(Array.from({length:count*4},(_,i)=>noise(i+count))),[count])
  const material=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,toneMapped:false,uniforms:{uTime:{value:0},uAmount:{value:0},uWind:{value:[0,0]}},vertexShader:`attribute vec4 aSeed;uniform float uTime,uAmount;uniform vec2 uWind;varying vec2 vUv;varying float vAlpha;void main(){
    vUv=uv;vAlpha=step(aSeed.w,uAmount);float speed=${kind==='rain'?'5.5':kind==='snow'?'.65':'.35'};
    vec3 center=vec3((aSeed.x-.5)*13.,.25+mod(aSeed.y*7.-uTime*speed,7.),(aSeed.z-.5)*10.);
    float fall=7.-(center.y-.25);center.xz+=uWind*fall*.025;
    ${kind!=='rain'?'center.x+=sin(uTime*.6+aSeed.x*30.)*.35;':''}
    vec4 mv=modelViewMatrix*vec4(center,1.);vec2 offset=position.xy;${kind==='rain'?'offset.x+=offset.y*uWind.x*.06;':''}
    mv.xy+=offset;gl_Position=projectionMatrix*mv;
  }`,fragmentShader:`varying vec2 vUv;varying float vAlpha;void main(){float a=${kind==='snow'?'smoothstep(.5,.15,length(vUv-.5))':kind==='rain'?'sin(vUv.y*3.14159)*.45':'.7'}*vAlpha;if(a<.02)discard;gl_FragColor=vec4(${kind==='rain'?'vec3(.65,.76,.82)':kind==='snow'?'vec3(.91,.94,.94)':'vec3(.63,.51,.34)'},a);\n#include <colorspace_fragment>\n}`}),[kind])
  useEffect(()=>()=>material.dispose(),[material])
  useFrame(()=>{
    const v=visual.current,amount=kind==='rain'?v.rain:kind==='snow'?v.snow:Math.max(0,Math.min(1,(v.windSpeed-10.8)/10)),factor=[.25,.5,1][quality.current]
    if(ref.current)ref.current.count=amount<.003?0:Math.round(count*factor)
    material.uniforms.uTime.value=new URLSearchParams(location.search).has('capture')?1:uniforms.uTime.value;material.uniforms.uAmount.value=amount
    const angle=(v.windDirection+180)*Math.PI/180;material.uniforms.uWind.value=[Math.sin(angle)*v.windSpeed,-Math.cos(angle)*v.windSpeed]
  })
  return <instancedMesh ref={ref} args={[undefined,undefined,count]} frustumCulled={false}><planeGeometry args={kind==='rain'?[.018,.4]:kind==='snow'?[.09,.09]:[.12,.08]}><instancedBufferAttribute attach="attributes-aSeed" args={[seeds,4]}/></planeGeometry><primitive attach="material" object={material}/></instancedMesh>
}
function Ripples(){
  const ref=useRef<InstancedMesh>(null),mat=useRef<MeshBasicMaterial>(null),{visual,uniforms}=useWorldEnvironment(),dummy=useMemo(()=>new Object3D(),[])
  useFrame(()=>{if(!ref.current)return;ref.current.count=visual.current.rain>.01?18:0;if(mat.current)mat.current.opacity=.22*visual.current.rain;for(let i=0;i<18;i++){const radius=.05+((uniforms.uTime.value*.35+noise(i))%1)*.42;if(i<12)dummy.position.set(-.8+(noise(i)-.5)*4.6,.018,-.3+(noise(i+40)-.5)*4.4);else dummy.position.set(3.46+(noise(i)-.5)*.76,.496,2.379+(noise(i+40)-.5)*.76);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(radius);dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix)}ref.current.instanceMatrix.needsUpdate=true})
  return <instancedMesh ref={ref} args={[undefined,undefined,18]}><ringGeometry args={[.94,1,20]}/><meshBasicMaterial ref={mat} color="#c1d4ce" transparent depthWrite={false}/></instancedMesh>
}
export function WeatherEffects(){return <><Particles kind="rain"/><Particles kind="snow"/><Particles kind="debris"/><Ripples/></>}
