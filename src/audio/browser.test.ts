// @vitest-environment jsdom
import { afterEach,expect,it,vi } from 'vitest'
afterEach(()=>{vi.unstubAllGlobals();vi.doUnmock('./engine');Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true})})
async function setup(){
  vi.resetModules();localStorage.clear()
  const audio={preferences:vi.fn(),updateMix:vi.fn(),setVisible:vi.fn(),playEffect:vi.fn(),dispose:vi.fn(),stats:vi.fn()},close=vi.fn(async()=>{})
  vi.doMock('./engine',()=>({createAudioEngine:()=>audio}))
  vi.stubGlobal('AudioContext',class {resume=vi.fn(async()=>{});close=close})
  Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true})
  const browser=await import('./browser'),preferences=await import('./preferences');return {browser,audio,preferences,close}
}
it('synchronizes hidden state when the asynchronous engine import completes',async()=>{
  const h=await setup(),stop=h.browser.installAudio(),loading=h.browser.unlockAudio()
  Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))
  await loading
  expect(h.audio.setVisible).toHaveBeenCalledWith(false)
  stop()
})
it('cleans the engine, context and subscriptions only when the last owner leaves',async()=>{
  const h=await setup(),stop1=h.browser.installAudio(),stop2=h.browser.installAudio()
  await h.browser.unlockAudio();stop1();expect(h.audio.dispose).not.toHaveBeenCalled();stop2();stop2()
  expect(h.audio.dispose).toHaveBeenCalledTimes(1);expect(h.close).toHaveBeenCalledTimes(1)
  h.audio.preferences.mockClear()
  h.preferences.setAudioPreferences({muted:true})
  expect(h.audio.preferences).not.toHaveBeenCalled()
})
it('uses the latest room mode on unlock and replaces the sole background layer on switch',async()=>{
  const h=await setup(),stop=h.browser.installAudio()
  try {
    const loading=h.browser.unlockAudio()
    h.browser.setAudioRoomMode('night')
    await loading
    h.browser.setAudioRoomMode('day')
    expect(h.audio.updateMix.mock.calls.map(([mix])=>mix.layers.map(({id}:{id:string})=>id)))
      .toEqual([['city-night'],['city-birds']])
  } finally { stop() }
})
