import { parseEnvResponse, record, type EnvResponse } from '../../shared/env-api'
import { parseEnvironmentOverrides, sanitizeManual, withoutEnvironmentParams } from './overrides'
import { getSolarTerm } from './solarLongitude'
import { resolveWithStatus, weatherTtlMs, type EnvironmentStatus } from './resolve'
import type { ClockContext, Coordinates, EnvironmentState, ManualEnvironment } from './types'

export const manualStorageKey = 'room-blog.environment.v1'
export interface EnvironmentDependencies {
  now(): Date
  clock: ClockContext
  getSearch(): string
  replaceSearch?(search: string): void
  storage?: { getItem(key: string): string | null; setItem(key: string, value: string): void }
  fetchEnv?(signal: AbortSignal, coordinates?: Coordinates): Promise<EnvResponse | null>
  visibility?: { isVisible(): boolean; subscribe(listener: () => void): () => void }
  subscribeUrl?(listener: () => void): () => void
  onFollowReal?(): void
  timers?: { setTimeout(callback: () => void, ms: number): unknown; clearTimeout(handle: unknown): void }
}
export interface EnvironmentStore {
  getSnapshot(): EnvironmentState
  getStatus(): EnvironmentStatus
  subscribe(listener: () => void): () => void
  setManual(patch: Partial<ManualEnvironment>): void
  followReal(): void
  refresh(): Promise<void>
  start(): () => void
}
export function createEnvironmentStore(deps: EnvironmentDependencies): EnvironmentStore {
  let manual: ManualEnvironment = {}
  try {
    const value: unknown = JSON.parse(deps.storage?.getItem(manualStorageKey) ?? 'null')
    if (record(value) && value.version === 1) manual = sanitizeManual(value.settings)
  } catch { /* Disabled or corrupt storage never prevents the environment. */ }
  let live: EnvResponse | null = null, error: EnvironmentStatus['error'] = null
  const resolve = () => resolveWithStatus({ now: deps.now(), clock: deps.clock, live, manual, url: parseEnvironmentOverrides(deps.getSearch()) })
  let current = resolve()
  const listeners = new Set<() => void>()
  const timers = deps.timers ?? { setTimeout: (cb: () => void, ms: number) => setTimeout(cb, ms), clearTimeout: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>) }
  let timer: unknown, owners = 0, revision = 0, controller: AbortController | undefined
  let nextWeatherAt = 0
  let unobserveVisibility: (() => void) | undefined, unobserveUrl: (() => void) | undefined
  const visible = () => deps.visibility?.isVisible() ?? true
  const persist = () => {
    try { deps.storage?.setItem(manualStorageKey, JSON.stringify({ version: 1, settings: manual })) } catch { /* Keep in-memory choices. */ }
  }
  function publish() {
    const next = resolve()
    next.status.error = error
    const changed = JSON.stringify(next.state) !== JSON.stringify(current.state)
    const statusChanged = JSON.stringify(next.status) !== JSON.stringify(current.status)
    if (changed) current.state = next.state
    if (statusChanged) current.status = next.status
    if (changed || statusChanged) listeners.forEach(listener => listener())
  }
  function clearTimer() {
    if (timer !== undefined) timers.clearTimeout(timer)
    timer = undefined
  }
  function abort() { revision++; controller?.abort(); controller = undefined }
  function schedule() {
    clearTimer()
    if (!owners || !visible()) return
    const now = +deps.now()
    const nextMinute = Math.floor(now / 60_000) * 60_000 + 60_000
    const nextTerm = +getSolarTerm(new Date(now)).nextAt
    const weatherDue = deps.fetchEnv ? nextWeatherAt : Infinity
    timer = timers.setTimeout(() => {
      timer = undefined
      publish()
      if (deps.fetchEnv && +deps.now() >= nextWeatherAt) void refresh()
      else schedule()
    }, Math.max(1, Math.min(nextMinute, nextTerm, weatherDue) - now))
  }
  async function refresh() {
    if (!deps.fetchEnv || !visible()) return
    abort()
    const requestId = revision
    const request = new AbortController()
    controller = request
    nextWeatherAt = +deps.now() + weatherTtlMs
    schedule()
    try {
      const response = await deps.fetchEnv(request.signal, parseEnvironmentOverrides(deps.getSearch()).coordinates)
      if (request.signal.aborted || requestId !== revision) return
      const parsed = parseEnvResponse(response)
      if (!parsed) throw new Error('Invalid environment response')
      live = parsed
      const fresh = !resolve().status.stale
      error = fresh ? null : 'unavailable'
      // Cached responses retain their original fetchedAt: do not extend their life.
      // Expired/bad responses keep the bounded 15-minute retry set above.
      if (fresh) nextWeatherAt = Math.min(nextWeatherAt, Date.parse(live.fetchedAt) + weatherTtlMs)
    } catch {
      if (request.signal.aborted || requestId !== revision) return
      live = live ? { ...live, weather: null } : null
      error = 'unavailable'
    } finally {
      if (!request.signal.aborted && requestId === revision) {
        controller = undefined
        publish()
        schedule()
      }
    }
  }
  function start(): () => void {
    owners++
    if (owners === 1) {
      let previousCoordinates = JSON.stringify(parseEnvironmentOverrides(deps.getSearch()).coordinates)
      unobserveVisibility = deps.visibility?.subscribe(() => {
        if (!visible()) { clearTimer(); abort(); return }
        publish()
        if (deps.fetchEnv && (!live?.weather || +deps.now() - Date.parse(live.fetchedAt) >= weatherTtlMs)) void refresh()
        else { nextWeatherAt = live ? Date.parse(live.fetchedAt) + weatherTtlMs : +deps.now() + weatherTtlMs; schedule() }
      })
      unobserveUrl = deps.subscribeUrl?.(() => {
        publish()
        const coordinates = JSON.stringify(parseEnvironmentOverrides(deps.getSearch()).coordinates)
        if (coordinates !== previousCoordinates) {
          previousCoordinates = coordinates
          abort()
          if (visible()) void refresh()
        }
        schedule()
      })
      publish()
      if (visible() && (!live?.weather || +deps.now() - Date.parse(live.fetchedAt) >= weatherTtlMs)) void refresh()
      else { nextWeatherAt = live ? Date.parse(live.fetchedAt) + weatherTtlMs : +deps.now() + weatherTtlMs; schedule() }
      // No fetch dependency in phase 1 still needs clock/solar-boundary updates.
      if (!deps.fetchEnv) schedule()
    }
    let stopped = false
    return () => {
      if (stopped) return
      stopped = true
      if (--owners === 0) {
        clearTimer(); abort(); unobserveVisibility?.(); unobserveUrl?.()
        unobserveVisibility = unobserveUrl = undefined
      }
    }
  }
  return {
    getSnapshot: () => current.state, getStatus: () => current.status,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
    setManual(patch) { manual = sanitizeManual({ ...manual, ...patch }); persist(); publish(); schedule() },
    followReal() {
      manual = {}; persist()
      deps.replaceSearch?.(withoutEnvironmentParams(deps.getSearch()))
      deps.onFollowReal?.()
      abort(); publish()
      if (owners && visible()) void refresh()
      schedule()
    },
    refresh, start,
  }
}
