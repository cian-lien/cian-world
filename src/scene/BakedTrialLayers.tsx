import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import {
  Color, FileLoader, Mesh, PerspectiveCamera, SRGBColorSpace,
  type Object3D,
} from 'three'
import { bakeReference, bakeTrialUrl } from './bakeTrial'
import { bakedAccentMaterial, bakedMaterial } from './bakedMaterial'
import type { RoomMode, V3 } from './layout'

const GROUPS = ['room', 'furniture', 'props', 'interactive'] as const
const MAPS = ['albedo', 'light-day', 'light-night', 'light-lamp'] as const
type Group = typeof GROUPS[number]

interface Manifest {
  scale: number
  exposure: { day: number; night: number }
  groups: Record<Group, Record<typeof MAPS[number], string>>
  camera: { position: V3; target: V3; fov: number; offset: [number, number]; resolution: [number, number] }
}

const ACCENTS: Record<string, { day: string; night: string; lamp?: string; opacity?: [number, number] }> = {
  glass: { day: '#b6d8ec', night: '#536fa4', opacity: [0.30, 0.17] },
  fairy: { day: '#ada08a', night: '#fff0aa' },
  strip: { day: '#a1989d', night: '#d3a2f0' },
  'desk-shade': { day: '#dfcdb5', night: '#605040', lamp: '#ffd5a0' },
  monitor: { day: '#9eacda', night: '#8c9bcf' },
  bedside: { day: '#c5b39a', night: '#ffd49a' },
  clock: { day: '#527368', night: '#9cd7b6' },
  laptop: { day: '#987b92', night: '#eab1bd' },
  indicator: { day: '#657583', night: '#aad9f4' },
  'ac-display': { day: '#50605c', night: '#8ccdb5' },
  sky: { day: '#171e40', night: '#171e40', opacity: [0, 1] },
  moon: { day: '#b3bbef', night: '#d4dcff', opacity: [0, 1] },
  city: { day: '#c7a470', night: '#e3bb76', opacity: [0, 1] },
}

function approach(value: number, target: number, step: number) {
  return value < target ? Math.min(target, value + step) : Math.max(target, value - step)
}

export function BakedTrialLayers({ roots, mode, lampOn, active=true }: {
  roots: Object3D[]
  mode: RoomMode
  active?: boolean
  lampOn: boolean
}) {
  const manifestText = useLoader(FileLoader, `${bakeTrialUrl}manifest.json`)
  const manifest = useMemo(() => JSON.parse(manifestText as string) as Manifest, [manifestText])
  const paths = useMemo(() => GROUPS.flatMap(group => MAPS.map(kind => bakeTrialUrl + manifest.groups[group][kind])), [manifest])
  const textures = useTexture(paths)
  const { scene, camera, size } = useThree()
  const night = useRef(mode === 'night' ? 1 : 0)
  const lamp = useRef(lampOn ? 1 : 0)
  const background = useMemo(() => new Color(), [])
  const dayBackground = useMemo(() => new Color('#c3cbd1'), [])
  const nightBackground = useMemo(() => new Color(bakeReference ? '#000000' : '#121018'), [])
  const palette = useMemo(() => Object.fromEntries(Object.entries(ACCENTS).map(([key, values]) => [
    key, {
      day: new Color(values.day),
      night: new Color(values.night),
      lamp: values.lamp ? new Color(values.lamp) : undefined,
      opacity: values.opacity,
    },
  ])), [])

  const materials = useMemo(() => {
    for (const texture of textures) {
      texture.flipY = false
      texture.colorSpace = SRGBColorSpace
      texture.needsUpdate = true
    }
    return Object.fromEntries(GROUPS.map((group, i) => [
      group, bakedMaterial(textures.slice(i * MAPS.length, (i + 1) * MAPS.length), manifest.scale, manifest.exposure),
    ]))
  }, [textures, manifest])
  const opaqueAccent = useMemo(() => bakedAccentMaterial(false), [])
  const transparentAccent = useMemo(() => bakedAccentMaterial(true), [])

  useLayoutEffect(() => {
    const originalBackground = scene.background
    scene.background = background
    const restore: (() => void)[] = []
    for (const root of roots) root.traverse(object => {
      if (!(object instanceof Mesh)) return
      const original = object.material
      const originalCallback = object.onBeforeRender
      const group = object.userData.bakeGroup as Group | undefined
      const accent = palette[object.userData.bakeAccent]
      if (group) {
        object.material = materials[group]
      } else if (accent) {
        const material = accent.opacity ? transparentAccent : opaqueAccent
        object.material = material
        object.onBeforeRender = () => {
          const { uniforms } = material
          uniforms.uDayColor.value = accent.day
          uniforms.uNightColor.value = accent.night
          uniforms.uLampColor.value = accent.lamp ?? accent.day
          uniforms.uLampReactive.value = accent.lamp ? 1 : 0
          uniforms.uDayOpacity.value = accent.opacity?.[0] ?? 1
          uniforms.uNightOpacity.value = accent.opacity?.[1] ?? 1
          uniforms.uNight.value = night.current
          uniforms.uLamp.value = lamp.current
          material.uniformsNeedUpdate = true
        }
      } else {
        return
      }
      restore.push(() => {
        object.material = original
        object.onBeforeRender = originalCallback
      })
    })
    return () => {
      scene.background = originalBackground
      restore.forEach(reset => reset())
      Object.values(materials).forEach(material => material.dispose())
      opaqueAccent.dispose()
      transparentAccent.dispose()
    }
  }, [roots, scene, background, materials, palette, opaqueAccent, transparentAccent])

  useLayoutEffect(() => {
    if (!bakeReference || !(camera instanceof PerspectiveCamera)) return
    const { position, target, fov, offset, resolution } = manifest.camera
    camera.position.set(...position)
    camera.lookAt(...target)
    camera.fov = fov
    camera.setViewOffset(resolution[0], resolution[1], offset[0] * resolution[0], offset[1] * resolution[1], ...resolution)
  }, [camera, manifest, size.width, size.height])

  useFrame((_, delta) => {
    if(!active)return
    night.current = approach(night.current, mode === 'night' ? 1 : 0, delta / 1.2)
    lamp.current = approach(lamp.current, lampOn ? 1 : 0, delta / 0.25)
    for (const material of Object.values(materials)) {
      material.uniforms.uNight.value = night.current
      material.uniforms.uLamp.value = lamp.current
    }
    background.copy(dayBackground).lerp(nightBackground, night.current)
  })

  return null
}
