// @vitest-environment jsdom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import {SceneBoundary} from './SceneBoundary'
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
it('contains an asset render failure, preserves surrounding UI and recovers when scene changes',async()=>{
 const expected=(event:ErrorEvent)=>{if(event.error?.message==='asset failed')event.preventDefault()};window.addEventListener('error',expected)
 const error=vi.spyOn(console,'error').mockImplementation(()=>{}),host=document.createElement('div'),root=createRoot(host),failed=vi.fn()
 const Broken=()=>{throw new Error('asset failed')}
 await act(async()=>{root.render(<><header>Navigation</header><SceneBoundary resetKey="world" onError={failed}><Broken/></SceneBoundary></>)})
 expect(host.textContent).toBe('Navigation');expect(failed).toHaveBeenCalledOnce()
 await act(async()=>{root.render(<><header>Navigation</header><SceneBoundary resetKey="room" onError={failed}><p>Room</p></SceneBoundary></>)})
 expect(host.textContent).toBe('NavigationRoom');await act(async()=>root.unmount());error.mockRestore();window.removeEventListener('error',expected)
})
