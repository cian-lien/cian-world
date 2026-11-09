import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {Box3,Vector3} from 'three'
const root=path.resolve(import.meta.dirname,'../../../../public/models/rooftop'),manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'))
const reports=[],contractErrors=[]
for(const file of manifest.files){
 const buffer=await fs.readFile(path.join(root,file.file));assert.equal(buffer.toString('ascii',0,4),'glTF');assert.equal(buffer.readUInt32LE(4),2);assert.equal(buffer.readUInt32LE(8),buffer.length)
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');assert.equal(gltf.scenes.length,1,'Only the intended asset scene may be exported');gltf.scene.updateMatrixWorld(true)
 const objects=new Map();gltf.scene.traverse(o=>objects.set(o.name,o));
 const names=[],bounds=new Box3().setFromObject(gltf.scene),size=bounds.getSize(new Vector3());let triangles=0,meshes=0,colors=0,windows=0
 gltf.scene.traverse(o=>{names.push(o.name);if(!o.isMesh)return;++meshes;const p=o.geometry.attributes.position;assert.ok(p&&p.count>0);for(const v of p.array)assert.ok(Number.isFinite(v));triangles+=(o.geometry.index?.count??p.count)/3;if(o.geometry.attributes.color)++colors;if(o.name.startsWith('CityWindows')){++windows;assert.ok(o.geometry.attributes.uv,'window seeds must survive');for(let i=0;i<o.geometry.attributes.uv.count;i++)assert.ok(o.geometry.attributes.uv.getX(i)>=0&&o.geometry.attributes.uv.getX(i)<=1)}})
 assert.ok([size.x,size.y,size.z].every(Number.isFinite));assert.equal(Math.round(triangles),file.triangles);assert.ok(colors>0,'palette colors must be exported')
 if(file.file==='visitor.glb'){if(JSON.stringify(objects.get('VisitorRoot')?.userData.forward)!==JSON.stringify([0,0,1]))contractErrors.push('VisitorRoot.forward must use glTF +Z');assert.ok(Math.abs(size.y-.9)<.001);for(const n of ['VisitorRoot','HeadPivot','Arm_L','Arm_R','Knee_L','Knee_R','Face_Eyes'])assert.ok(names.includes(n),n);assert.ok(bounds.min.y>=-.001&&bounds.min.y<.02)}
 if(file.file==='visitor-fan.glb'){let p=objects.get('Outfit_Fan')?.parent;let attached=false;while(p){if(p.name==='HandAnchor_R')attached=true;p=p.parent}if(!attached)contractErrors.push('Outfit_Fan must follow HandAnchor_R')}
 if(file.file==='rooftop.glb'&&JSON.stringify(objects.get('RoomWindowAnchor')?.userData.facing)!==JSON.stringify([0,0,-1]))contractErrors.push('RoomWindowAnchor.facing must use glTF -Z');
 if(file.file==='rooftop.glb')for(const n of ['RooftopRoot','Door_Hinge','TeaTable','LatestPostBook','Radio','Telescope','CalicoCat','RoomWindowAnchor','Season_xiazhi','Stairwell','WaterTank','TeaTableFrameOutline','FrontParapet','LotusCrock','StairRoofCorner0','StairRoofCorner1','StairRoofCorner2','StairRoofCorner3'])assert.ok(names.includes(n),n)
 if(file.file==='skyline.glb'){assert.equal(windows,2);for(const n of ['CityNearRoot','CityMiddleRoot','CityFarRoot','BridgeTrafficRoot','RiverBoat'])assert.ok(names.includes(n),n)}
 reports.push({file:file.file,bytes:buffer.length,meshes,triangles,colors,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}})
 gltf.scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}})
}
assert.deepEqual(contractErrors,[],'Export integration contracts');
const report={validatedWith:'Three.js 0.169 GLTFLoader (same as website)',files:reports,totalBytes:reports.reduce((n,f)=>n+f.bytes,0),defaultMeshes:reports.slice(0,3).reduce((n,f)=>n+f.meshes,0)}
await fs.writeFile(path.join(root,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({files:reports.length,totalBytes:report.totalBytes,defaultMeshes:report.defaultMeshes,visitor:reports.find(x=>x.file==='visitor.glb').bounds},null,2))
