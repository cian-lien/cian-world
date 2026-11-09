import map from '../../public/models/rooftop/walkmap.json'
export type Point=[number,number]
const radius=map.visitorRadiusMeters,step=map.gridMeters
const distance=(a:Point,b:Point)=>Math.hypot(a[0]-b[0],a[1]-b[1])
const roofEdges=map.outlineXZ.map(([x,z],i)=>{
 const [nextX,nextZ]=map.outlineXZ[(i+1)%map.outlineXZ.length],dx=nextX-x,dz=nextZ-z
 return {x,z,dx,dz,clearance:map.edgeClearanceMeters*Math.hypot(dx,dz)}
})
function createNavigation(kumquat=false){
 const obstacles=[...map.obstacles,...(kumquat?[{name:'kumquat',circleXZ:[-1.6,1.45,.23]}]:[])]
function isWalkable([x,z]:Point):boolean{
 if(!Number.isFinite(x)||!Number.isFinite(z)||x<map.walkBoundsXZ[0]||x>map.walkBoundsXZ[1]||z<map.walkBoundsXZ[2]||z>map.walkBoundsXZ[3])return false
 if(roofEdges.some(edge=>edge.dz*(x-edge.x)-edge.dx*(z-edge.z)<edge.clearance))return false
 return !obstacles.some(o=>{if('rectXZ'in o&&o.rectXZ){const [a,b,c,d]=o.rectXZ;return x>=a-radius&&x<=b+radius&&z>=c-radius&&z<=d+radius}if('circleXZ'in o&&o.circleXZ){const [a,b,r]=o.circleXZ;return Math.hypot(x-a,z-b)<=r+radius}return false})
}
const cells=new Map<string,Point>()
for(let x=-3.5;x<=3.5;x+=step)for(let z=-3;z<=3;z+=step)if(isWalkable([x,z]))cells.set(`${x},${z}`,[x,z])
function nearest(p:Point,options=cells){let best='',d=Infinity;for(const [id,point]of options){const next=distance(p,point);if(next<d){d=next;best=id}}return best}
function lineClear(a:Point,b:Point){
 if(!isWalkable(a)||!isWalkable(b))return false
 const dx=b[0]-a[0],dz=b[1]-a[1]
 for(const obstacle of obstacles){
  if('circleXZ'in obstacle&&obstacle.circleXZ){const [x,z,r]=obstacle.circleXZ,length=dx*dx+dz*dz,t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length)):0;if(Math.hypot(a[0]+dx*t-x,a[1]+dz*t-z)<=r+radius)return false}
  if('rectXZ'in obstacle&&obstacle.rectXZ){const [x0,x1,z0,z1]=obstacle.rectXZ;let low=0,high=1,hit=true
   for(const [position,direction,min,max]of [[a[0],dx,x0-radius,x1+radius],[a[1],dz,z0-radius,z1+radius]]){
    if(Math.abs(direction)<1e-12){if(position<min||position>max){hit=false;break}}
    else{const t0=(min-position)/direction,t1=(max-position)/direction;low=Math.max(low,Math.min(t0,t1));high=Math.min(high,Math.max(t0,t1));if(low>high){hit=false;break}}
   }
   if(hit)return false
  }
 }
 return true
}
/** A* on a four-neighbour grid; unreachable clicks snap within the start's connected component. */
function findPath(from:Point,to:Point):Point[]{
 if(!to.every(Number.isFinite)||!isWalkable(from))return []
 const visible=new Map([...cells].filter(([,point])=>lineClear(from,point)))
 if(!visible.size)return []
 const start=nearest(from,visible),reachable=new Map<string,Point>([[start,cells.get(start)!]]),queue=[start]
 for(let i=0;i<queue.length;i++){const [x,z]=cells.get(queue[i])!;for(const n of [[x-step,z],[x+step,z],[x,z-step],[x,z+step]] as Point[]){const id=`${n[0]},${n[1]}`;if(cells.has(id)&&!reachable.has(id)&&lineClear([x,z],n)){reachable.set(id,n);queue.push(id)}}}
 const end=nearest(to,reachable),open=new Set([start]),came=new Map<string,string>(),g=new Map([[start,0]])
 while(open.size){let current='',score=Infinity;for(const id of open){const f=g.get(id)!+distance(cells.get(id)!,cells.get(end)!);if(f<score){current=id;score=f}}if(current===end)break;open.delete(current)
  const [x,z]=cells.get(current)!
  for(const n of [[x-step,z],[x+step,z],[x,z-step],[x,z+step]] as Point[]){const id=`${n[0]},${n[1]}`;if(!reachable.has(id)||!lineClear([x,z],n))continue;const cost=g.get(current)!+step;if(cost<(g.get(id)??Infinity)){g.set(id,cost);came.set(id,current);open.add(id)}}
 }
 const path:Point[]=[];let key=end;while(key!==start){path.unshift(cells.get(key)!);key=came.get(key)!;if(!key)return []}path.unshift(cells.get(start)!)
 if(isWalkable(to)&&lineClear(path[path.length-1],to))path.push([...to])
 const smooth:Point[]=[];let position=isWalkable(from)?from:path[0]
 for(let i=0;i<path.length;){let next=i;while(next+1<path.length&&lineClear(position,path[next+1]))next++;smooth.push(path[next]);position=path[next];i=next+1}
 return smooth
}
function moveOnFloor(position:Point,delta:Point):Point{
 let p:Point=[...position];const count=Math.max(1,Math.ceil(Math.hypot(...delta)/.04)),dx=delta[0]/count,dz=delta[1]/count
 for(let i=0;i<count;i++){const target:Point=[p[0]+dx,p[1]+dz];if(lineClear(p,target))p=target;else{if(lineClear(p,[p[0]+dx,p[1]]))p[0]+=dx;if(lineClear(p,[p[0],p[1]+dz]))p[1]+=dz}}
 return p
}

 return {isWalkable,findPath,moveOnFloor,nearestWalkable:(point:Point):Point=>[...cells.get(nearest(point))!] as Point}
}
const standard=createNavigation(),spring=createNavigation(true)
export const {isWalkable,findPath,moveOnFloor}=standard
export const navigationForTerm=(id:string)=>id==='lichun'?spring:standard
export function advancePath(position:Point,path:Point[],meters:number):{position:Point;path:Point[];walking:boolean}{
 const remaining=path.slice();let next:Point=[...position],budget=Math.max(0,meters)
 while(remaining.length&&budget>0){const p=remaining[0],d=distance(next,p);if(d<=budget){next=[...p];remaining.shift();budget-=d}else{next=[next[0]+(p[0]-next[0])*budget/d,next[1]+(p[1]-next[1])*budget/d];budget=0}}
 return {position:next,path:remaining,walking:distance(position,next)>.00001}
}
