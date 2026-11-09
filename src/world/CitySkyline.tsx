import {useMemo,useLayoutEffect} from 'react'
import {useFrame} from '@react-three/fiber'
import {useModel} from './useModel'
import {useWorldEnvironment} from './environment'
/** The same exported geometry is used by the rooftop and the lower-floor window camera. */
export function CitySkyline(){
 const model=useModel('skyline'),{uniforms}=useWorldEnvironment()
 useLayoutEffect(()=>model.traverse(o=>{o.castShadow=false}),[model])
 const motion=useMemo(()=>['RiverBoat','BridgeTrafficRoot'].map(name=>{const object=model.getObjectByName(name)!;return{object,origin:object.position.clone()}}),[model])
 const capture=new URLSearchParams(location.search).has('capture')
 useFrame(()=>{const t=capture?1:uniforms.uTime.value;for(const {object,origin}of motion){const boat=object.name==='RiverBoat';object.position.copy(origin);object.position.x+=Math.sin(t*(boat?.025:.08))*(boat?9:.8)}})
 return <primitive object={model} dispose={null}/>
}
