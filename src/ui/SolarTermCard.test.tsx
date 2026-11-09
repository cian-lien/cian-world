// @vitest-environment jsdom
import { StrictMode,act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect,it,vi } from 'vitest'
import '../i18n'
const data=vi.hoisted(()=>({id:'lichun',source:'live'}))
vi.mock('../env/useEnvironment',()=>({useEnvironment:()=>({solarTerm:{id:data.id}}),useEnvironmentStatus:()=>({fieldSources:{solarTerm:data.source,time:data.source}})}))
import { SolarTermCard } from './SolarTermCard'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('expires in StrictMode and disappears if a live card is switched into simulation',()=>{
  vi.useFakeTimers();localStorage.clear();const host=document.createElement('div'),root=createRoot(host)
  try{
    act(()=>root.render(<StrictMode><SolarTermCard/></StrictMode>));expect(host.querySelector('.solar-term-card')).not.toBeNull()
    act(()=>vi.advanceTimersByTime(6001));expect(host.querySelector('.solar-term-card')).toBeNull()
    data.id='qingming';act(()=>root.render(<StrictMode><SolarTermCard/></StrictMode>));expect(host.querySelector('.solar-term-card')).not.toBeNull()
    data.source='manual';act(()=>root.render(<StrictMode><SolarTermCard/></StrictMode>));expect(host.querySelector('.solar-term-card')).toBeNull()
  }finally{act(()=>root.unmount());vi.useRealTimers()}
})
