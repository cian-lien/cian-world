import { useSyncExternalStore } from 'react'
import { getBrowserEnvironment } from './browser'
import type { EnvironmentStore } from './store'
import type { EnvironmentState } from './types'
import type { EnvironmentStatus } from './resolve'

/** The owner calls store.start() explicitly; subscribing alone has no network side effects. */
export function useEnvironment(store: EnvironmentStore = getBrowserEnvironment()): EnvironmentState {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
export function useEnvironmentStatus(store:EnvironmentStore=getBrowserEnvironment()):EnvironmentStatus {
  return useSyncExternalStore(store.subscribe,store.getStatus,store.getStatus)
}
