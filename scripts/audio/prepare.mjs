import { readFile, writeFile, mkdir, stat, access } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
const root=resolve(import.meta.dirname,'../..'),raw=resolve(root,'assets/audio/raw'),out=resolve(root,'public/sounds/ambience')
await mkdir(out,{recursive:true})
const config=JSON.parse(await readFile(resolve(import.meta.dirname,'clips.json'),'utf8')),clips=[]
function run(args){const result=spawnSync('ffmpeg',['-hide_banner','-nostdin',...args],{encoding:'utf8',maxBuffer:8*1024*1024});if(result.status!==0)throw new Error(result.stderr.slice(-1500));return result.stderr}
for(const c of config){
  const preferred=resolve(raw,`${c.id}.wav`);const input=await access(preferred).then(()=>preferred,()=>resolve(raw,c.input)),temp=resolve(out,`.${c.id}.wav`)
  // Rotate a tail/head overlap to the middle, preserving the contiguous loop boundary.
  const filter=c.fade?`asplit=3[a][b][c];[a]atrim=start=${c.length-c.fade}:end=${c.length},asetpts=PTS-STARTPTS[tail];[b]atrim=start=0:end=${c.fade},asetpts=PTS-STARTPTS[head];[tail][head]acrossfade=d=${c.fade}:c1=qsin:c2=qsin[join];[c]atrim=start=${c.fade}:end=${c.length-c.fade},asetpts=PTS-STARTPTS[mid];[join][mid]concat=n=2:v=0:a=1`:'anull'
  run(['-y','-ss',String(c.start),'-t',String(c.length),'-i',input,'-filter_complex',filter,'-ar','44100','-ac','2',temp])
  const measured=run(['-i',temp,'-af',`loudnorm=I=${c.lufs}:TP=-1:LRA=11:print_format=json`,'-f','null','-'])
  const measurements=JSON.parse(measured.slice(measured.lastIndexOf('{')))
  const normalization=`loudnorm=I=${c.lufs}:TP=-1:LRA=11:measured_I=${measurements.input_i}:measured_TP=${measurements.input_tp}:measured_LRA=${measurements.input_lra}:measured_thresh=${measurements.input_thresh}:offset=${measurements.target_offset}:linear=true`
  const file=`${c.id}.m4a`;run(['-y','-i',temp,'-af',normalization,'-ac','2','-ar','44100','-c:a','aac','-b:a',c.bitrate,'-movflags','+faststart',resolve(out,file)])
  const bytes=(await stat(resolve(out,file))).size,duration=c.length-c.fade
  if(bytes>1_200_000)throw new Error(`${file} exceeds 1.2MB`)
  clips.push({id:c.id,file,role:c.id==='thunder-01'?'one-shot':'loop',duration,loopStart:0,loopEnd:duration,defaultGain:c.defaultGain,sourceId:c.sourceId,bytes,sourceLufs:Number(measurements.input_i),targetLufs:c.lufs,sourceTrim:{start:c.start,end:c.start+c.length},crossfade:c.fade})
  console.log(`${file}: ${bytes} bytes, ${duration}s, target ${c.lufs} LUFS`)
  const {unlink}=await import('node:fs/promises');await unlink(temp)
}
if(clips.reduce((sum,c)=>sum+c.bytes,0)>10_000_000)throw new Error('Ambience exceeds 10MB')
await writeFile(resolve(out,'manifest.json'),JSON.stringify({version:1,clips},null,2)+'\n')
