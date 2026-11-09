import { mkdir,writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
const args=process.argv.slice(2),option=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback
const space=Number(option('--space','32')),base=option('--base','http://127.0.0.1:5173/'),out=resolve(option('--out','/tmp/room-world-matrix'))
await mkdir(out,{recursive:true})
const scenes=[]
for(const [phase,time]of [['dawn','05:44'],['day','12:00'],['dusk','19:14'],['night','23:00']])for(const weather of ['clear','cloudy','rain','thunderstorm','gale','fog','damp'])scenes.push({id:`${phase}-${weather}`,phase,weather,date:weather==='damp'?'2026-04-05':'2026-06-21',time:weather==='damp'?(phase==='dawn'?'06:10':phase==='dusk'?'18:40':time):time,term:weather==='damp'?'qingming':'xiazhi'})
for(const [term,date]of [['lichun','2026-02-04'],['qingming','2026-04-05'],['xiazhi','2026-06-21'],['liqiu','2026-08-07'],['dongzhi','2026-12-22']])scenes.push({id:term,phase:'term',weather:'clear',term,date,time:term==='dongzhi'?'20:00':'12:00'})
for(const scene of scenes){const url=new URL(base);url.search=new URLSearchParams({date:scene.date,time:scene.time,weather:['gale','damp'].includes(scene.weather)?'clear':scene.weather,intensity:['clear','gale','damp'].includes(scene.weather)?'0':'.7',wind:scene.weather==='gale'?'25':'2',...(scene.weather==='damp'?{humidity:'95',temperature:'24',previousDayTemperature:'20'}:{}),term:scene.term,lat:'23.1',lon:'113.3',lang:'en',capture:'1'}).toString();url.hash='/world';scene.url=url.href}
await writeFile(resolve(out,'urls.json'),JSON.stringify(scenes,null,2))
const captureScenes=option('--only','all')==='all'?scenes:scenes.filter(scene=>scene.phase===option('--only','all'))
for(let i=0;i<captureScenes.length;i+=4){
  const batch=captureScenes.slice(i,i+4)
  const code=`const fs=await import('node:fs/promises');const task=await taskSpace(${space}),page=task.page('p1');for(const scene of ${JSON.stringify(batch)}){await page.goto(scene.url);await page.waitForFunction(()=>window.__rooftop&&window.__world?.stats().sampleSeconds>4.5&&window.__environment?.status().timeZone==='Asia/Shanghai',undefined,{timeout:25000});const data=await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png'));await fs.writeFile(${JSON.stringify(out)}+'/'+scene.id+'.png',Buffer.from(data.split(',')[1],'base64'));console.log(scene.id,'captured');}`
  const r=spawnSync('ego-browser',['nodejs'],{input:code,encoding:'utf8',maxBuffer:2*1024*1024,timeout:180000});process.stdout.write(r.stdout??'');if(r.status!==0)throw new Error(r.stderr||`Capture batch ${i} failed`)
}
