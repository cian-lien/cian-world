import { useMemo, useSyncExternalStore } from 'react'

/**
 * 极简 hash 路由：地址栏就是唯一的状态来源。
 *   #/                 -> 房间总览
 *   #/diary            -> 日记本（文章列表）
 *   #/diary/<slug>     -> 某篇文章
 *   #/computer         -> 电脑桌面
 * 好处：每个视图都有可分享的链接，浏览器的后退键也能用。
 */
export type View = 'room' | 'diary' | 'computer'

export interface Route {
  view: View
  slug: string | null
}

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'diary') {
    return { view: 'diary', slug: parts[1] ? decodeURIComponent(parts[1]) : null }
  }
  if (parts[0] === 'computer') return { view: 'computer', slug: null }
  return { view: 'room', slug: null }
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

const getHash = () => window.location.hash

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash)
  return useMemo(() => parseHash(hash), [hash])
}

/** navigate('/diary/hello') */
export function navigate(path: string) {
  window.location.hash = path.startsWith('/') ? path : `/${path}`
}

export const postHref = (slug: string) => `#/diary/${encodeURIComponent(slug)}`
