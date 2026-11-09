import {expect,it} from 'vitest'
import {readFile} from 'node:fs/promises'
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {assembleVisitor,applyOutfits,cloneModel} from './modelAssets'
async function load(file:string){const bytes=await readFile(new URL(`../../public/models/rooftop/${file}.glb`,import.meta.url));return(new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''))}
it('assembles combined costumes without moving the source or losing joint attachments',async()=>{
 const [base,coat,umbrella,fan]=await Promise.all(['visitor','visitor-raincoat','visitor-umbrella','visitor-fan'].map(load))
 const root=assembleVisitor(base.scene,[coat.scene,umbrella.scene,fan.scene]);applyOutfits(root,['raincoat','umbrella'])
 expect(root.getObjectByName('Outfit_Raincoat')?.visible).toBe(true);expect(root.getObjectByName('Outfit_Umbrella')?.visible).toBe(true);expect(root.getObjectByName('Outfit_Fan')?.visible).toBe(false)
 expect(root.getObjectByName('Outfit_Fan')?.parent?.name).toBe('HandAnchor_R')
 let originalSleeveVisible=false;root.traverse(o=>{if(o.userData.hide_under_outfit==='raincoat'&&o.visible)originalSleeveVisible=true});expect(originalSleeveVisible).toBe(false)
 expect(base.scene.getObjectByName('Outfit_Raincoat')).toBeUndefined()
 applyOutfits(root,[]);expect(root.getObjectByName('Outfit_Raincoat')?.visible).toBe(false)
})
it('owns independent geometry and material copies for safe scene release',async()=>{
 const {scene}=await load('visitor');const clone=cloneModel(scene)
 let same=false;clone.traverse(o=>{if('geometry'in o&&o.geometry===scene.getObjectByName(o.name)?.['geometry' as never])same=true})
 expect(same).toBe(false)
})
