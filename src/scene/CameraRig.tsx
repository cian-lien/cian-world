import * as THREE from 'three'
import { useEffect, useRef, type ElementRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { useRoute } from '../route'
import { DIARY_VIEW, ROOM_FOV, ROOM_VIEW, SCREEN, SCREEN_CENTER, WINDOW_FOV, type V3 } from './layout'
import { roomWindow } from './windowAnchors'

type Controls = ElementRef<typeof CameraControls>

function setOrbitLimits(controls: Controls, position: V3) {
  const offset = new THREE.Vector3(...position).sub(new THREE.Vector3(...ROOM_VIEW.target))
  const orbit = new THREE.Spherical().setFromVector3(offset)
  controls.minAzimuthAngle = orbit.theta - 0.55
  controls.maxAzimuthAngle = orbit.theta + 0.45
  controls.minPolarAngle = Math.max(0.35, orbit.phi - 0.45)
  controls.maxPolarAngle = Math.min(1.35, orbit.phi + 0.2)
}

export function CameraRig({ liveSun = false }: { liveSun?: boolean }) {
  const ref = useRef<Controls>(null)
  const { view } = useRoute()
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const { width, height } = useThree((s) => s.size)

  useFrame((_, delta) => {
    // Drei skips updates while input is disabled. Advance route transitions here.
    const controls = ref.current
    if (controls && !controls.enabled) controls.update(delta)
    const fov = view === 'window' && liveSun ? WINDOW_FOV : ROOM_FOV
    if (camera.fov !== fov) {
      const next = THREE.MathUtils.damp(camera.fov, fov, 8, delta)
      camera.fov = Math.abs(next - fov) < 0.01 ? fov : next
      camera.updateProjectionMatrix()
    }
  }, -1)

  useEffect(() => {
    const controls = ref.current
    if (!controls) return
    Object.assign(controls.mouseButtons, { middle: 0, right: 0, wheel: 0 })
    Object.assign(controls.touches, { two: 0, three: 0 })
  }, [])

  useEffect(() => {
    const c = ref.current
    if (!c || width <= 0 || height <= 0) return
    let cancelled = false
    c.enabled = false
    c.minAzimuthAngle = -Infinity
    c.maxAzimuthAngle = Infinity
    c.minPolarAngle = 0
    c.maxPolarAngle = Math.PI

    const fly = (pos: V3, target: V3) => c.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], true)

    if (view === 'room') {
      const aspect = width / height
      const distanceScale = Math.max(liveSun ? 1.13 : 1.34, 1.25 / aspect)
      const position = new THREE.Vector3(...ROOM_VIEW.target)
        .lerp(new THREE.Vector3(...ROOM_VIEW.position), distanceScale)
        .toArray()
      void fly(position, ROOM_VIEW.target).then(() => {
        if (cancelled) return
        setOrbitLimits(c, position)
        c.enabled = true
      })
    } else if (view === 'window') {
      const [x, y, z] = roomWindow.center
      fly([x + 0.12, y - 0.43, z + 0.74], [x + 0.12, y + 0.16, z - 0.63])
    } else if (view === 'world') {
      fly([1.55,3.4,1.4],[1.55,2.3,-2.285])
    } else if (view === 'diary') {
      fly(DIARY_VIEW.position, DIARY_VIEW.target)
    } else if (view === 'computer') {
      // 根据窗口宽高比算出镜头距离，让屏幕刚好占满约 88% 的视野
      const tanV = Math.tan(THREE.MathUtils.degToRad(ROOM_FOV) / 2)
      const tanH = tanV * (width / height)
      const fill = 0.88
      const d = Math.max(SCREEN.width / (2 * tanH * fill), SCREEN.height / (2 * tanV * fill))
      const [x, y, z] = SCREEN_CENTER
      fly([x, y, z + d], SCREEN_CENTER)
    }
    return () => { cancelled = true }
  }, [view, width, height, camera, liveSun])

  return <CameraControls ref={ref} enabled={false} smoothTime={0.55} makeDefault />
}
