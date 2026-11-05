import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import type { ReactNode } from 'react'
import type { V3 } from './layout'

/**
 * 占位几何体工具。等你在 Blender 里做好模型后，这些都会被 GLTF 替换掉，
 * 但卡通着色（Toon）的思路可以保留：三段式色阶 + 柔和的颜色。
 */

// 三段色阶，让光影呈现「卡通」的分块感
const gradientMap = (() => {
  const tex = new THREE.DataTexture(new Uint8Array([110, 185, 255]), 3, 1, THREE.RedFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
})()

interface ToonProps {
  color: string
  emissive?: string
  emissiveIntensity?: number
}

export function Toon({ color, emissive = '#000000', emissiveIntensity = 0 }: ToonProps) {
  return (
    <meshToonMaterial
      color={color}
      gradientMap={gradientMap}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
    />
  )
}

interface Transform {
  position?: V3
  rotation?: V3
  scale?: V3 | number
}

interface BlockProps extends Transform {
  size: V3
  color: string
  radius?: number
  material?: ReactNode
}

/** 圆角方块：家具的主要组成部分 */
export function Block({ size, color, radius = 0.025, material, ...t }: BlockProps) {
  const mat = material ?? <Toon color={color} />
  const r = Math.min(radius, Math.min(...size) * 0.45)
  if (r < 0.004) {
    return (
      <mesh {...t} castShadow receiveShadow>
        <boxGeometry args={size} />
        {mat}
      </mesh>
    )
  }
  return (
    <RoundedBox args={size} radius={r} smoothness={3} {...t} castShadow receiveShadow>
      {mat}
    </RoundedBox>
  )
}

interface CylProps extends Transform {
  radiusTop: number
  radiusBottom?: number
  height: number
  color: string
  segments?: number
  material?: ReactNode
}

export function Cyl({ radiusTop, radiusBottom, height, color, segments = 24, material, ...t }: CylProps) {
  return (
    <mesh {...t} castShadow receiveShadow>
      <cylinderGeometry args={[radiusTop, radiusBottom ?? radiusTop, height, segments]} />
      {material ?? <Toon color={color} />}
    </mesh>
  )
}

interface BallProps extends Transform {
  radius: number
  color: string
}

export function Ball({ radius, color, ...t }: BallProps) {
  return (
    <mesh {...t} castShadow receiveShadow>
      <sphereGeometry args={[radius, 24, 16]} />
      <Toon color={color} />
    </mesh>
  )
}

interface ConeProps extends Transform {
  radius: number
  height: number
  color: string
}

export function Cone({ radius, height, color, ...t }: ConeProps) {
  return (
    <mesh {...t} castShadow>
      <coneGeometry args={[radius, height, 16]} />
      <Toon color={color} />
    </mesh>
  )
}
