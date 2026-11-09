import { handleEnv } from './env'
export default {
  fetch(request, env, ctx) {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    return handleEnv(request, { cf: request.cf, fetch, cache: caches.default, now: () => new Date(), waitUntil: promise => ctx.waitUntil(promise) })
  },
} satisfies ExportedHandler<Env>
