import {expect,it} from 'vitest'
import {findPath,isWalkable,advancePath,moveOnFloor,type Point} from './navigation'
import map from '../../public/models/rooftop/walkmap.json'
it('routes to all eight model anchors on the actual footprint map',()=>{
 const spawn:Point=[map.anchors.VisitorSpawn[0],map.anchors.VisitorSpawn[2]]
 for(const anchor of Object.values(map.anchors)){
  const target:Point=[anchor[0],anchor[2]],path=findPath(spawn,target)
  expect(path.length).toBeGreaterThan(0)
  expect(Math.hypot(path[path.length-1][0]-target[0],path[path.length-1][1]-target[1])).toBeLessThan(.36)
  let from=spawn
  for(const point of path){for(let n=0;n<=40;n++){const t=n/40;expect(isWalkable([from[0]+(point[0]-from[0])*t,from[1]+(point[1]-from[1])*t])).toBe(true)}from=point}
 }
})
it('resolves blocked and out-of-bounds clicks to reachable floor, never cuts a corner',()=>{
 for(const target of [[-2.65,-2.42],[100,-100],[3.13,2.31]] as Point[]){const path=findPath([0,0],target);expect(path.length).toBeGreaterThan(0);expect(path.every(isWalkable)).toBe(true)}
 expect(isWalkable([-2.65,-2.42])).toBe(false);expect(isWalkable([4,0])).toBe(false);expect(isWalkable([3.2,-2.75])).toBe(false)
 const end=moveOnFloor([0,0],[20,0]);expect(isWalkable(end)).toBe(true);expect(end[0]).toBeLessThan(3.6)
})
it('advances 1.2m in one second, consumes turns and does not mutate paths',()=>{
 const path:Point[]=[[1,0],[1,2]];const next=advancePath([0,0],path,1.2)
 expect(next.position[0]).toBeCloseTo(1);expect(next.position[1]).toBeCloseTo(.2);expect(path).toEqual([[1,0],[1,2]])
 expect(advancePath([0,0],[[1,0]],10).position).toEqual([1,0])
})
it('connects off-grid starts without crossing tanks or grazing table corners',()=>{
 for(const [from,to]of [[[-1.05,-2.49],[-2.11,-.54]],[[2.54,2.7],[-.65,.93]]] as [Point,Point][]){
  expect(isWalkable(from)).toBe(true);let previous=from
  const path=findPath(from,to);expect(path.length).toBeGreaterThan(0)
  for(const point of path){const n=Math.ceil(Math.hypot(point[0]-previous[0],point[1]-previous[1])/.001);for(let i=0;i<=n;i++){const t=i/n;expect(isWalkable([previous[0]+(point[0]-previous[0])*t,previous[1]+(point[1]-previous[1])*t])).toBe(true)}previous=point}
 }
})
it('blocks the Lichun kumquat pot and offers an escape point if decoration appears beneath a visitor',async()=>{
 const {navigationForTerm}=await import('./navigation'),spring=navigationForTerm('lichun'),summer=navigationForTerm('xiazhi'),pot:Point=[-1.6,1.45]
 expect(spring.isWalkable(pot)).toBe(false);expect(summer.isWalkable(pot)).toBe(true)
 const safe=spring.nearestWalkable(pot);expect(spring.isWalkable(safe)).toBe(true);expect(Math.hypot(safe[0]-pot[0],safe[1]-pot[1])).toBeLessThan(.6)
 let previous:Point=[-2,0];for(const point of spring.findPath(previous,[-1.6,2.4])){for(let i=0;i<=100;i++){const t=i/100;expect(spring.isWalkable([previous[0]+(point[0]-previous[0])*t,previous[1]+(point[1]-previous[1])*t])).toBe(true)}previous=point}
})
