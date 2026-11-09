import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {spawnSync} from 'node:child_process'
const root=path.resolve('public/models/rooftop'),manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'))
if(manifest.compression==='EXT_meshopt_compression'){console.log('Rooftop already compressed; re-export Blender before recompressing.');process.exit(0)}
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'rooftop-meshopt-'))
try{
 for(const file of manifest.files){const output=path.join(root,file.file),input=path.join(temp,file.file);await fs.copyFile(output,input);const result=spawnSync('pnpm',['dlx','@gltf-transform/cli@4.5.1','meshopt',input,output,'--level','high','--quantize-position','16','--quantize-texcoord','16'],{encoding:'utf8',maxBuffer:2000000});if(result.status!==0)throw new Error(result.stderr||result.stdout);file.uncompressedBytes=file.bytes;file.bytes=(await fs.stat(output)).size;console.log(file.file,file.uncompressedBytes,'→',file.bytes)}
 manifest.compression='EXT_meshopt_compression';manifest.notes.push('Requires MeshoptDecoder; Drei useGLTF supplies the existing decoder. Positions/UVs quantized to16bits; named nodes and extras retained.');await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n')
}finally{await fs.rm(temp,{recursive:true,force:true})}
