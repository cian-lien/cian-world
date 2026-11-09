import type { Plugin } from 'vite'
import { envMock } from './envMock'
export function createEnvMockPlugin(): Plugin {
  return { name: 'offline-environment', configureServer(server) {
    server.middlewares.use('/api/env', (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(envMock(new URL(req.url ?? '/', 'http://local').searchParams.get('mock') ?? undefined)))
    })
  } }
}
