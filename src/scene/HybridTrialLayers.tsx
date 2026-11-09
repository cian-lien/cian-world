import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { N8AOPass } from 'n8ao'
import {
  Color, FileLoader, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D,
  PerspectiveCamera, PMREMGenerator, SRGBColorSpace, TextureLoader, type DirectionalLight, type HemisphereLight,
  type PointLight, type SpotLight, type Texture, type WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { bakeReference, hybridProduction, hybridRoomUrl } from './bakeTrial'
import { bakedAccentMaterial } from './bakedMaterial'
import type { RoomMode, V3 } from './layout'

type LightLayer = RoomMode | 'lamp'

type Manifest = {
  maps: Record<LightLayer, string>
  scale: number
  highlightKnee?: number
  exposure: Record<RoomMode, number>
  camera: { position: V3; target: V3; fov: number; offset: [number, number]; resolution: [number, number] }
}

const NIGHT_DIFFUSE = { shelf: 0.73, rug: 0.83 }
const LIGHT_LAYERS: LightLayer[] = ['day', 'night', 'lamp']
const ACCENTS = {
  fairy: ['#ab9f89', '#fff0b2'],
  strip: ['#9f98a3', '#ffcef0'],
  glass: ['#bad1d9', '#181c2d'],
  'desk-shade': ['#e3d2ab', '#8c7855', '#ffe5ba'],
  monitor: ['#c3cce4', '#c6cfee'],
  bedside: ['#c9ba92', '#ffe0a6'],
  clock: ['#4e7365', '#a0d7b6'],
  laptop: ['#a18785', '#d7aba7'],
  indicator: ['#62737f', '#a9d9f4'],
  'ac-display': ['#50605c', '#8ccdb5'],
}
const palette = Object.fromEntries(Object.entries(ACCENTS).map(([key, colors]) => [
  key, colors.map(color => new Color(color)),
]))
palette.glass[0].multiplyScalar(2.35)
const backgroundDay = new Color('#d9e7f6')
const backgroundNight = new Color(bakeReference ? '#000000' : '#15131d')
const lightColors = {
  sky: [new Color('#ffefdb'), new Color('#a99eb6')],
  ground: [new Color('#cbb298'), new Color('#91664f')],
  key: [new Color('#fff1e2'), new Color('#c6d1ff')],
  window: [new Color('#fff5e8'), new Color('#97b5ff')],
}

function step(value: number, goal: number, amount: number) {
  return value + Math.sign(goal - value) * Math.min(amount, Math.abs(goal - value))
}

function configureLightMap(texture: Texture) {
  texture.flipY = false
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
}

function disposeAO(pass: N8AOPass) {
  // N8AO 1.10's native Pass does not dispose its owned targets or shaders.
  for (const value of Object.values(pass)) {
    if (value?.isWebGLRenderTarget || value?.isTexture) value.dispose()
    if (value?.material?.isShaderMaterial && typeof value.dispose === 'function') value.dispose()
  }
}

function recordStats(gl: WebGLRenderer) {
  const { render, memory, programs } = gl.info
  return { ...render, textures: memory.textures, geometries: memory.geometries, programs: programs?.length ?? 0 }
}

export default function HybridTrialLayers({ roots, mode, lampOn, lampPosition, active = true }: {
  roots: Object3D[]
  mode: RoomMode
  lampOn: boolean
  lampPosition: V3
  active?: boolean
}) {
  const manifestText = useLoader(FileLoader, `${hybridRoomUrl}manifest.json`)
  const manifest = useMemo(() => JSON.parse(manifestText as string) as Manifest, [manifestText])
  const initialMode = useRef(mode).current
  const initialTexture = useLoader(TextureLoader, hybridRoomUrl + manifest.maps[initialMode])
  const available = useRef<Partial<Record<LightLayer, Texture>>>({})
  const { gl, scene, camera, size, viewport } = useThree()
  const blend = useRef({ night: Number(initialMode === 'night'), lamp: 0 })
  const uniforms = useMemo(() => ({
    lightDay: { value: initialTexture }, lightNight: { value: initialTexture }, lightLamp: { value: initialTexture },
    uNight: { value: 0 }, uLamp: { value: 0 }, uScale: { value: manifest.scale },
    uHighlightKnee: { value: manifest.highlightKnee ?? -1 },
  }), [initialTexture, manifest])
  const background = useMemo(() => new Color(), [])
  const composer = useRef<EffectComposer>()
  const nightTints = useRef<{ material: MeshStandardMaterial; base: Color; factor: number }[]>([])
  const hemisphere = useRef<HemisphereLight>(null)
  const key = useRef<DirectionalLight>(null)
  const windowLight = useRef<SpotLight>(null)
  const bedside = useRef<PointLight>(null)
  const strip = useRef<PointLight>(null)
  const desk = useRef<PointLight>(null)
  const target = useMemo(() => {
    const object = new Object3D()
    object.position.set(0.1, 0.45, 0.65)
    return object
  }, [])

  useLayoutEffect(() => {
    configureLightMap(initialTexture)
    available.current = { [initialMode]: initialTexture }
  }, [initialMode, initialTexture])

  useEffect(() => {
    const loader = new TextureLoader()
    const loaded = available.current
    let active = true
    const preload = () => {
      for (const layer of LIGHT_LAYERS) {
        if (loaded[layer]) continue
        loader.load(hybridRoomUrl + manifest.maps[layer], texture => {
          if (!active) {
            texture.dispose()
            return
          }
          configureLightMap(texture)
          loaded[layer] = texture
        }, undefined, () => {
          if (active) console.error(`Could not load hybrid light map: ${layer}`)
        })
      }
    }
    // Let the room render with its initial map before requesting the other layers.
    let nextFrame = 0
    const firstFrame = requestAnimationFrame(() => { nextFrame = requestAnimationFrame(preload) })
    return () => {
      active = false
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(nextFrame)
      for (const layer of LIGHT_LAYERS) {
        if (layer !== initialMode) loaded[layer]?.dispose()
      }
    }
  }, [initialMode, manifest])

  useLayoutEffect(() => {
    const accent = bakedAccentMaterial(false)
    const replacements = new Map<MeshStandardMaterial, MeshBasicMaterial>()
    const tints = { shelf: new Map<MeshStandardMaterial, MeshStandardMaterial>(), rug: new Map<MeshStandardMaterial, MeshStandardMaterial>() }
    const bookshelfMeshes = new Set<Object3D>()
    if (hybridProduction) {
      for (const root of roots) {
        root.getObjectByName('Bookshelf')?.traverse(object => bookshelfMeshes.add(object))
      }
    }
    const restore: (() => void)[] = []
    const black = new Color(0)
    for (const root of roots) root.traverse(object => {
      if (!(object instanceof Mesh)) return
      const original = object.material
      const beforeRender = object.onBeforeRender
      const { castShadow, receiveShadow } = object
      const shadowOnly = Boolean(object.userData.shadowOnly)
      object.castShadow = shadowOnly
      object.receiveShadow = !shadowOnly
      const shell = object.userData.bakeShell || object.parent?.userData.bakeShell
      const name = object.userData.bakeAccent ?? object.parent?.userData.bakeAccent
      if (shell && original instanceof MeshStandardMaterial) {
        let material = replacements.get(original)
        if (!material) {
          material = new MeshBasicMaterial({ color: original.color, map: original.map, side: original.side })
          material.onBeforeCompile = shader => {
            Object.assign(shader.uniforms, uniforms)
            shader.vertexShader = shader.vertexShader
              .replace('#include <uv_pars_vertex>', '#include <uv_pars_vertex>\n#ifndef USE_UV1\nattribute vec2 uv1;\n#endif\nvarying vec2 vBakeUv;')
              .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBakeUv = uv1;')
            shader.fragmentShader = shader.fragmentShader
              .replace('#include <common>', `#include <common>
                varying vec2 vBakeUv;
                uniform sampler2D lightDay, lightNight, lightLamp;
                uniform float uNight, uLamp, uScale, uHighlightKnee;
                vec3 decodeLight(vec3 value) {
                  vec3 encoded = value * uScale;
                  if (uHighlightKnee < 0.0) return encoded;
                  return min(encoded, vec3(uHighlightKnee)) + exp(max(encoded - uHighlightKnee, 0.0)) - 1.0;
                }`)
              .replace('#include <map_fragment>', `#include <map_fragment>
                vec3 dayLight = decodeLight(texture2D(lightDay, vBakeUv).rgb);
                vec3 nightLight = decodeLight(texture2D(lightNight, vBakeUv).rgb);
                vec3 lampLight = decodeLight(texture2D(lightLamp, vBakeUv).rgb);
                diffuseColor.rgb *= mix(dayLight, nightLight, uNight) + lampLight * uLamp;`)
          }
          replacements.set(original, material)
        }
        object.material = material
      } else if (shadowOnly) {
        object.material = new MeshBasicMaterial({ colorWrite: false, depthWrite: false })
      } else if (palette[name]) {
        const [day, night, lamp] = palette[name]
        object.material = accent
        object.onBeforeRender = () => {
          const { uniforms } = accent
          uniforms.uDayColor.value = day
          uniforms.uNightColor.value = night
          uniforms.uLampColor.value = lamp ?? black
          uniforms.uLampReactive.value = Number(Boolean(lamp))
          uniforms.uNight.value = blend.current.night
          uniforms.uLamp.value = blend.current.lamp
          accent.uniformsNeedUpdate = true
        }
      } else if (hybridProduction && original instanceof MeshStandardMaterial) {
        const kind = bookshelfMeshes.has(object) ? 'shelf' : original.name === 'RBN_DetailedRug' ? 'rug' : undefined
        if (kind) {
          let material = tints[kind].get(original)
          if (!material) {
            material = original.clone()
            tints[kind].set(original, material)
            nightTints.current.push({ material, base: original.color, factor: NIGHT_DIFFUSE[kind] })
          }
          object.material = material
        }
      }
      const replacement = object.material
      restore.push(() => {
        object.material = original
        object.onBeforeRender = beforeRender
        object.castShadow = castShadow
        object.receiveShadow = receiveShadow
        if (shadowOnly && replacement !== original && !Array.isArray(replacement)) {
          replacement.dispose()
        }
      })
    })
    return () => {
      restore.forEach(reset => reset())
      nightTints.current.forEach(({ material }) => material.dispose())
      nightTints.current = []
      replacements.forEach(material => material.dispose())
      accent.dispose()
    }
  }, [roots, uniforms])

  useLayoutEffect(() => {
    if (!bakeReference || !(camera instanceof PerspectiveCamera)) return
    const { position, target, fov, offset, resolution } = manifest.camera
    camera.position.set(...position)
    camera.lookAt(...target)
    camera.fov = fov
    camera.setViewOffset(resolution[0], resolution[1], offset[0] * resolution[0], offset[1] * resolution[1], ...resolution)
  }, [camera, manifest, size.width, size.height])

  useLayoutEffect(() => {
    if (!active) return
    const previous = { background: scene.background, environment: scene.environment,
      environmentIntensity: scene.environmentIntensity, exposure: gl.toneMappingExposure, autoReset: gl.info.autoReset }
    const environment = new RoomEnvironment()
    const generator = new PMREMGenerator(gl)
    const probe = generator.fromScene(environment, 0.04)
    environment.dispose()
    generator.dispose()
    scene.environment = probe.texture
    scene.background = background

    const pipeline = new EffectComposer(gl)
    const ao = new N8AOPass(scene, camera, 1, 1)
    Object.assign(ao.configuration, {
      gammaCorrection: false, transparencyAware: false, halfRes: true,
      aoRadius: 0.3, intensity: 0.68, distanceFalloff: 0.65,
    })
    ao.beautyRenderTarget.samples = Math.min(4, gl.capabilities.maxSamples)
    const output = new OutputPass()
    pipeline.addPass(ao)
    pipeline.addPass(output)
    composer.current = pipeline
    gl.info.autoReset = false
    if (import.meta.env.DEV || bakeReference || new URLSearchParams(location.search).has('perf')) {
      Object.assign(window, { __room: { stats: () => ({...recordStats(gl),dpr:gl.getPixelRatio(),hasEnvironment:!!scene.environment}) } })
    }
    return () => {
      composer.current = undefined
      pipeline.dispose()
      disposeAO(ao)
      output.dispose()
      scene.background = previous.background
      scene.environment = previous.environment
      scene.environmentIntensity = previous.environmentIntensity
      gl.toneMappingExposure = previous.exposure
      gl.info.autoReset = previous.autoReset
      probe.dispose()
      Reflect.deleteProperty(window, '__room')
    }
  }, [active, background, camera, gl, scene])

  useLayoutEffect(() => {
    composer.current?.setPixelRatio(viewport.dpr)
    composer.current?.setSize(size.width, size.height)
  }, [size.width, size.height, viewport.dpr])

  useFrame((_, delta) => {
    if (!active) return
    const state = blend.current
    const layers = available.current
    if (layers[mode]) state.night = step(state.night, Number(mode === 'night'), delta / 1.2)
    if (layers.lamp) state.lamp = step(state.lamp, Number(lampOn), delta / 0.25)
    uniforms.lightDay.value = layers.day ?? initialTexture
    uniforms.lightNight.value = layers.night ?? initialTexture
    uniforms.lightLamp.value = layers.lamp ?? initialTexture
    const { night, lamp } = state
    const lerp = (day: number, dusk: number) => day + (dusk - day) * night
    for (const { material, base, factor } of nightTints.current) material.color.copy(base).multiplyScalar(lerp(1, factor))
    uniforms.uNight.value = night
    uniforms.uLamp.value = lamp
    background.copy(backgroundDay).lerp(backgroundNight, night)
    const referenceExposure = lerp(manifest.exposure.day, manifest.exposure.night)
    // Match the neutral Blender AgX reference's luminance with Three's AgX approximation.
    gl.toneMappingExposure = 2 ** (referenceExposure + lerp(-0.11, -0.30))
    scene.environmentIntensity = lerp(0.36, 0.13)
    if (hemisphere.current) {
      hemisphere.current.intensity = lerp(0.98, 0.34)
      hemisphere.current.color.copy(lightColors.sky[0]).lerp(lightColors.sky[1], night)
      hemisphere.current.groundColor.copy(lightColors.ground[0]).lerp(lightColors.ground[1], night)
    }
    if (key.current) {
      key.current.intensity = lerp(1.04, 0.17)
      key.current.color.copy(lightColors.key[0]).lerp(lightColors.key[1], night)
    }
    if (windowLight.current) {
      windowLight.current.intensity = lerp(6.5, 2.2)
      windowLight.current.color.copy(lightColors.window[0]).lerp(lightColors.window[1], night)
    }
    if (bedside.current) bedside.current.intensity = 0.57 * night
    if (strip.current) strip.current.intensity = 0.42 * night
    if (desk.current) desk.current.intensity = 1.45 * lamp
    gl.info.reset()
    composer.current?.render(delta)
  }, active ? 1 : 0)

  return (
    <>
      <primitive object={target} />
      <hemisphereLight ref={hemisphere} />
      <directionalLight ref={key} position={[3.1, 5.6, 4]} castShadow
        shadow-intensity={0.34} shadow-mapSize={[1024, 1024]} shadow-normalBias={0.024}
        shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4}
        shadow-camera-near={0.1} shadow-camera-far={14} />
      <spotLight ref={windowLight} position={[1.59, 2.16, -2.03]} target={target} angle={0.95}
        distance={6} penumbra={0.94} />
      <pointLight ref={bedside} position={[-0.75, 0.83, -0.25]} color="#ffcb91" distance={2.5} />
      <pointLight ref={strip} position={[0.12, 2.12, -1.83]} color="#ffbce2" distance={2.5} />
      <pointLight ref={desk} position={lampPosition} color="#ffc683" distance={2.5} />
    </>
  )
}
