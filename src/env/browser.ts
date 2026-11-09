import { createEnvironmentStore, type EnvironmentDependencies, type EnvironmentStore } from './store'
import { parseEnvResponse } from '../../shared/env-api'

/** Explicit adapter: importing this module neither starts timers nor makes requests. */
export function createBrowserEnvironment(target: Window, fetchEnv?: EnvironmentDependencies['fetchEnv']): EnvironmentStore {
  let storage: Storage | undefined
  try { storage = target.localStorage } catch { /* SecurityError in restricted frames. */ }
  const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return createEnvironmentStore({
    now: () => new Date(), clock: { timeZone: deviceTimeZone, deviceTimeZone },
    getSearch: () => target.location.search,
    replaceSearch(search) { target.history.replaceState(target.history.state, '', `${target.location.pathname}${search}${target.location.hash}`) },
    storage, fetchEnv,
    visibility: {
      isVisible: () => target.document.visibilityState !== 'hidden',
      subscribe(listener) { target.document.addEventListener('visibilitychange', listener); return () => target.document.removeEventListener('visibilitychange', listener) },
    },
    subscribeUrl(listener) {
      target.addEventListener('popstate', listener)
      target.addEventListener('hashchange', listener)
      return () => { target.removeEventListener('popstate', listener); target.removeEventListener('hashchange', listener) }
    },
  })

}
let browserStore: EnvironmentStore | undefined
export function getBrowserEnvironment(): EnvironmentStore {
  if(browserStore)return browserStore
  browserStore=createBrowserEnvironment(window, async (signal, coordinates) => {
    const params = new URLSearchParams()
    if (coordinates) { params.set('lat', String(coordinates.latitude)); params.set('lon', String(coordinates.longitude)) }
    if (import.meta.env.DEV) {
      const mock = new URLSearchParams(window.location.search).get('mock')
      if (mock) params.set('mock', mock)
    }
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 6000)
    const abort = () => controller.abort()
    signal.addEventListener('abort', abort, { once: true })
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/env?${params}`, { signal: controller.signal, cache: 'no-store' })
      return response.ok ? parseEnvResponse(await response.json()) : null
    } finally { clearTimeout(timeout); signal.removeEventListener('abort', abort) }
  })
  if(import.meta.env.DEV||new URLSearchParams(location.search).has('perf')||new URLSearchParams(location.search).has('capture'))Object.assign(window,{__environment:{snapshot:browserStore.getSnapshot,status:browserStore.getStatus}})
  return browserStore
}
