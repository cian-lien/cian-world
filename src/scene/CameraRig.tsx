import * as THREE from 'three'
import { useEffect, useRef, type ElementRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { useRoute } from '../route'
import { DIARY_VIEW, ROOM_VIEW, SCREEN, SCREEN_CENTER, type V3 } from './layout'

type Controls = ElementRef<typeof CameraControls>

/** 解除所有限制，好让镜头可以自由飞到聚焦位置 */
function unlock(c: Controls) {
  c.minAzimuthAngle = -Infinity
  c.maxAzimuthAngle = Infinity
  c.minPolarAngle = 0
  c.maxPolarAngle = Math.PI
  c.minDistance = 0.1
  c.maxDistance = Infinity
}

/** 房间总览时：只允许小幅旋转和缩放，避免用户把镜头转到墙后面去 */
function lockRoom(c: Controls, position: V3) {
  const [px, py, pz] = position
  const [tx, ty, tz] = ROOM_VIEW.target
  const offset = new THREE.Vector3(px - tx, py - ty, pz - tz)
  const s = new THREE.Spherical().setFromVector3(offset)
  c.minAzimuthAngle = s.theta - 0.55
  c.maxAzimuthAngle = s.theta + 0.45
  c.minPolarAngle = Math.max(0.35, s.phi - 0.45)
  c.maxPolarAngle = Math.min(1.35, s.phi + 0.2)
  c.minDistance = s.radius * 0.6
  c.maxDistance = s.radius * 1.3
}

export function CameraRig() {
  const ref = useRef<Controls>(null)
  const { view } = useRoute()
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)

  useFrame((_, delta) => {
    const controls = ref.current
    // Keep camera transitions running while Drei disables pointer input.
    if (controls && !controls.enabled) controls.update(delta)
  }, -1)

  // 关掉右键平移，只保留左键旋转 + 滚轮缩放
  useEffect(() => {
    const c = ref.current
    if (!c) return
    ;(c.mouseButtons as { right: number }).right = 0
    c.smoothTime = 0.55
  }, [])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    let cancelled = false
    unlock(c)
    c.enabled = false

    const fly = (pos: V3, target: V3) => c.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)

    if (view === 'room') {
      const aspect = size.width / size.height
      const distanceScale = Math.max(1.34, 1.25 / aspect)
      const position = new THREE.Vector3(...ROOM_VIEW.target)
        .lerp(new THREE.Vector3(...ROOM_VIEW.position), distanceScale)
        .toArray()
      fly(position, ROOM_VIEW.target).then(() => {
        if (cancelled) return
        lockRoom(c, position)
        c.enabled = true
      })
    } else if (view === 'diary') {
      fly(DIARY_VIEW.position, DIARY_VIEW.target)
    } else if (view === 'computer') {
      // 根据窗口宽高比算出镜头距离，让屏幕刚好占满约 88% 的视野
      const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
      const tanH = tanV * (size.width / size.height)
      const fill = 0.88
      const d = Math.max(SCREEN.width / (2 * tanH * fill), SCREEN.height / (2 * tanV * fill))
      const [x, y, z] = SCREEN_CENTER
      fly([x, y, z + d], SCREEN_CENTER)
    }

    return () => {
      cancelled = true
    }
  }, [view, size.width, size.height, camera])

  return <CameraControls ref={ref} makeDefault />
}
