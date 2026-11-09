import{readFile,readdir}from'node:fs/promises';import{resolve,dirname}from'node:path';import{gzipSync}from'node:zlib';
const root=resolve(process.argv[2]||'dist'),seen=new Set(),html=await readFile(resolve(root,'index.html'),'utf8');
async function visit(file){if(seen.has(file))return;seen.add(file);const source=await readFile(resolve(root,file),'utf8');for(const match of source.matchAll(/(?:from|import)\s*["'](\.\/[^"']+\.js)["']/g))await visit(resolve(root,dirname(file),match[1]).slice(root.length+1));}
for(const match of html.matchAll(/(?:src|href)="\/([^"?]+\.js)"/g))await visit(match[1]);
// Default production room loads the hybrid renderer automatically after the root chunk.
for(const file of await readdir(resolve(root,'assets')))if((file.startsWith('HybridTrialLayers-')||file.startsWith('WindowCity-'))&&file.endsWith('.js'))await visit('assets/'+file);
const files=await Promise.all([...seen].map(async file=>({file,gzip:gzipSync(await readFile(resolve(root,file))).length})));console.log(JSON.stringify({files,totalGzip:files.reduce((n,f)=>n+f.gzip,0)},null,2));
