// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { createBrowserEnvironment } from '../browser'
import { useEnvironment } from '../useEnvironment'
import { manualStorageKey } from '../store'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
describe('unmounted browser/React adapters', () => {
  it('starts the live room without old saved or query-string time and location overrides', () => {
    window.localStorage.setItem(manualStorageKey, JSON.stringify({ version: 1, settings: { time: '23:00' } }))
    window.history.replaceState(null, '', '/?time=22:30&lat=23.1&lon=113.3&debugSun=1')
    try {
      const store = createBrowserEnvironment(window, undefined, true)
      expect(store.getSnapshot().source.time).toBe('live')
      expect(store.getSnapshot().location).toBeNull()
      expect(store.getStatus().fieldSources.location).toBe('fallback')
    } finally {
      window.localStorage.removeItem(manualStorageKey)
      window.history.replaceState(null, '', '/')
    }
  })
  it('clears only environment query keys and preserves path/hash/history state', () => {
    window.localStorage.clear()
    window.history.replaceState({ keep: true }, '', '/nested/?lang=en&bake=hybrid&cam=reference&lamp=on&time=22:30&weather=rain&lat=23.1&lon=113.3#/diary/hello%20room')
    const store = createBrowserEnvironment(window)
    expect(store.getSnapshot().source.weather).toBe('url')
    store.followReal()
    expect(window.location.pathname).toBe('/nested/')
    expect(window.location.search).toBe('?lang=en&bake=hybrid&cam=reference&lamp=on')
    expect(window.location.hash).toBe('#/diary/hello%20room')
    expect(window.history.state).toEqual({ keep: true })
    expect(store.getSnapshot().source.weather).toBe('fallback')
  })
  it('reacts through useSyncExternalStore without mounting an app, scene or audio', () => {
    window.history.replaceState(null, '', '/?lang=en#/')
    window.localStorage.clear()
    const store = createBrowserEnvironment(window)
    const container = document.createElement('div'), root = createRoot(container)
    function Probe() { return <span>{useEnvironment(store).weather.kind}</span> }
    try {
      act(() => root.render(<Probe />))
      expect(container.textContent).toBe('clear')
      act(() => store.setManual({ weather: 'snow' }))
      expect(container.textContent).toBe('snow')
      act(() => store.followReal())
      expect(container.textContent).toBe('clear')
    } finally { act(() => root.unmount()) }
  })
})
