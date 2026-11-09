// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect,it } from 'vitest'
import '../i18n'
import EnvironmentPanel from './EnvironmentPanel'
import { getBrowserEnvironment } from '../env/browser'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('restores real conditions without discarding the route, then permits manual weather and traps Escape locally',()=>{
  window.history.replaceState({keep:true},'','/?lang=en&bake=live&weather=rain#/world')
  const container=document.createElement('div'),root=createRoot(container);let closed=0,restored=0
  try{
    act(()=>root.render(<EnvironmentPanel onClose={()=>closed++} onFollowReal={()=>restored++}/>))
    const toggle=document.querySelector<HTMLInputElement>('[role=dialog] input[type=checkbox]')!
    act(()=>toggle.click());expect(restored).toBe(1);expect(location.search).toContain('lang=en');expect(location.hash).toBe('#/world');expect(history.state).toEqual({keep:true})
    const select=document.querySelector<HTMLSelectElement>('[role=dialog] select')!
    act(()=>{select.value='snow';select.dispatchEvent(new Event('change',{bubbles:true}))})
    expect(getBrowserEnvironment().getSnapshot().weather.kind).toBe('snow')
    act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',cancelable:true})))
    expect(closed).toBe(1);expect(location.hash).toBe('#/world')
  }finally{act(()=>root.unmount());getBrowserEnvironment().followReal()}
})
