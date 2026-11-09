import {BufferGeometry,Material,Mesh,Object3D} from 'three'
import type {Outfit} from './visitorRules'
/** Cached GLTF inputs are CPU templates; only independent copies are ever rendered/disposed. */
export function cloneModel(source:Object3D):Object3D{
 const root=source.clone(true),geometries=new Map<BufferGeometry,BufferGeometry>(),materials=new Map<Material,Material>()
 const cloneMaterial=(m:Material)=>{if(!materials.has(m))materials.set(m,m.clone());return materials.get(m)!}
 root.traverse(o=>{if(o instanceof Mesh){if(!geometries.has(o.geometry))geometries.set(o.geometry,o.geometry.clone());o.geometry=geometries.get(o.geometry)!;o.material=Array.isArray(o.material)?o.material.map(cloneMaterial):cloneMaterial(o.material);o.castShadow=true;o.receiveShadow=true}})
 return root
}
export function disposeModel(root:Object3D){const geometries=new Set<BufferGeometry>(),materials=new Set<Material>();root.traverse(o=>{if(o instanceof Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
export function assembleVisitor(base:Object3D,variants:Object3D[]):Object3D{
 const result=cloneModel(base),parents=new Map<string,Object3D>();result.traverse(o=>parents.set(o.name,o))
 for(const source of variants){
  const owned=cloneModel(source),branches:Object3D[]=[]
  owned.traverse(o=>{if(o.userData.weather_variant&&!o.parent?.userData.weather_variant)branches.push(o)})
  for(const branch of branches){const parent=parents.get(branch.parent?.name??'');if(parent){branch.removeFromParent();parent.add(branch)}}
  // Unrendered remainder has no GPU allocation; detached branches retain their owned copies.
 }
 applyOutfits(result,[]);return result
}
export function applyOutfits(root:Object3D,active:readonly Outfit[]){const umbrella=root.getObjectByName('Outfit_Umbrella');if(umbrella){const x=umbrella.userData.rooftopOriginalX??umbrella.position.x;umbrella.userData.rooftopOriginalX=x;umbrella.position.x=active.includes('fan')?-Math.abs(x):x}root.traverse(o=>{const variant=o.userData.weather_variant as Outfit|undefined;if(variant)o.visible=active.includes(variant);const hide=o.userData.hide_under_outfit as Outfit|undefined;if(hide)o.visible=!active.includes(hide)})}
