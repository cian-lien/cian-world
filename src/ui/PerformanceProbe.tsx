import { useEffect,useState } from 'react'
export default function PerformanceProbe(){
  const [text,setText]=useState('Warming up…')
  useEffect(()=>{const timer=setInterval(()=>{const scope=window as unknown as {__world?:{stats():unknown};__room?:{stats():unknown};__ambience?:{stats():unknown}};setText(JSON.stringify({world:scope.__world?.stats(),room:scope.__room?.stats(),audio:scope.__ambience?.stats()}))},1000);return()=>clearInterval(timer)},[])
  return <output className="performance-probe" style={{position:'fixed',left:20,bottom:70,zIndex:90,maxWidth:420,fontSize:12,lineHeight:1.7,padding:12,background:'#fffaf0',border:'2px solid #3b2f2f',borderRadius:12}}>{text}</output>
}
