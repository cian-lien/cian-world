import { useMemo,useEffect } from 'react'
import { MeshStandardMaterial } from 'three'
import { useWorldEnvironment } from './environment'
export function Surface({color,roughness=.85,sway=false}:{color:string;roughness?:number;sway?:boolean}){
  const {uniforms}=useWorldEnvironment()
  const material=useMemo(()=>{
    const mat=new MeshStandardMaterial({color,roughness})
    mat.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,uniforms)
      shader.vertexShader='uniform float uTime,uWind; varying vec3 vWorldNormal;\n'+shader.vertexShader
      shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvWorldNormal=normalize(mat3(modelMatrix)*objectNormal);')
      if(sway)shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(uTime*1.7+instanceMatrix[3].x*2.0+instanceMatrix[3].z)*uWind*.025*max(position.y+.12,0.0);\n#endif')
      shader.fragmentShader='uniform float uWet,uSnow; varying vec3 vWorldNormal;\n'+shader.fragmentShader
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb *= 1.0-uWet*0.22; diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.88,0.90,0.88),smoothstep(0.45,0.9,vWorldNormal.y)*uSnow);')
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,0.2,uWet);')
    };mat.customProgramCacheKey=()=> `world-surface-v1-${sway}`;return mat
  },[color,roughness,sway,uniforms])
  useEffect(()=>()=>material.dispose(),[material])
  return <primitive attach="material" object={material}/>
}
