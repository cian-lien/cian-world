import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createEnvMockPlugin } from './dev/envMockPlugin'

export default defineConfig({
  plugins: [react(), createEnvMockPlugin()],
  build: {
    // Preserve Vite 5's browser targets while upgrading the build toolchain.
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
})
