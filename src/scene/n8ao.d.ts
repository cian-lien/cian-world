declare module 'n8ao' {
  import type { Camera, Scene, WebGLRenderTarget } from 'three'
  import { Pass } from 'three/addons/postprocessing/Pass.js'

  export class N8AOPass extends Pass {
    constructor(scene: Scene, camera: Camera, width: number, height: number)
    beautyRenderTarget: WebGLRenderTarget
    configuration: {
      aoRadius: number
      distanceFalloff: number
      intensity: number
      gammaCorrection: boolean
      halfRes: boolean
      transparencyAware: boolean
    }
  }
}
