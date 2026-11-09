import {useLayoutEffect,useMemo} from 'react'
import {useFrame} from '@react-three/fiber'
import {useGLTF} from '@react-three/drei'
import {Mesh,MeshStandardMaterial,type Object3D} from 'three'
import {windowCutoff} from './cityLighting'
import {cloneModel,disposeModel} from './modelAssets'
import {useWorldEnvironment} from './environment'
export const modelUrl=(name:string)=>`/models/rooftop/${name}.glb`
export function useModel(name:string){
 const gltf=useGLTF(modelUrl(name)),model=useMemo(()=>cloneModel(gltf.scene),[gltf])
 useLayoutEffect(()=>()=>disposeModel(model),[model]);useModelWeather(model,name==='skyline');return model
}
export function useModelWeather(model:Object3D,fog=false){
 const {state,visual,uniforms}=useWorldEnvironment()
 const local=useMemo(()=>({uNight:{value:0},uWindows:{value:.45}}),[])
 useLayoutEffect(()=>{
  const materials=new Set<MeshStandardMaterial>()
  model.traverse(o=>{if(o instanceof Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof MeshStandardMaterial)materials.add(m)})
  for(const material of materials){
   material.fog=fog
   const window=material.name==='RT_windowShader'
   material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms,local)
    shader.vertexShader='varying vec3 vRoofNormal;varying float vWindowSeed;\n'+shader.vertexShader
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvRoofNormal=normalize(mat3(modelMatrix)*objectNormal);vWindowSeed=uv.x;')
    shader.fragmentShader='uniform float uWet,uSnow,uNight,uWindows;varying vec3 vRoofNormal;varying float vWindowSeed;\n'+shader.fragmentShader
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.0-uWet*.17;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.88,.90,.88),smoothstep(.45,.92,vRoofNormal.y)*uSnow);')
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.2,uWet);')
    if(window)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance=vec3(.95,.58,.25)*uNight*step(vWindowSeed,uWindows)*2.0;')
   }
   material.customProgramCacheKey=()=>`rooftop-weather-v2-${window}`;material.needsUpdate=true
  }
 },[model,uniforms,local,fog])
 useFrame(()=>{
  local.uNight.value=1-Math.max(0,Math.min(1,(state.sun.altitude+6)/12))
  const hour=state.dayProgress*24;local.uWindows.value=windowCutoff(hour)
  model.traverse(o=>{if(o instanceof Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof MeshStandardMaterial&&['RT_warmLight','RT_roomPane','RT_cityLight'].includes(m.name)){m.emissive.set('#ffd39b');m.emissiveIntensity=local.uNight.value*2}})
 })
}
