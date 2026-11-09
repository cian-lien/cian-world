import { Suspense, lazy, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { AgXToneMapping, DoubleSide, Object3D, Path, Shape } from 'three'
import { Room } from './Room'
import { CameraRig } from './CameraRig'
import { bakeReference, bakeTrial, hybridRoom } from './bakeTrial'
import { INTRO_POSITION, type RoomMode } from './layout'
import type { EnvironmentStore } from '../env/store'
import { useTranslation } from 'react-i18next'

import {SceneBoundary} from '../ui/SceneBoundary'
const WorldScene = import.meta.env.DEV ? lazy(() => import('../world/WorldScene')) : null

export function Experience({ mode, referenceStore, onError }: { mode: RoomMode; referenceStore?: EnvironmentStore; onError?(): void }) {
  const { t } = useTranslation()
  const isDay = mode === 'day'
  const reference = WorldScene ? referenceStore : undefined

  return (
    <>
      <SceneBoundary onError={onError}><Canvas
        shadows={!!reference || !bakeTrial}
        gl={{ toneMapping: AgXToneMapping, preserveDrawingBuffer: !!reference || (hybridRoom && bakeReference) || new URLSearchParams(location.search).has('capture') }}
        dpr={reference ? 1 : [1, 2]}
        camera={{ position: INTRO_POSITION, fov: 35, near: 0.1, far: 100 }}
        className="canvas"
      >
        {!reference && !bakeTrial && !hybridRoom && (
          <>
            <color attach="background" args={[isDay ? '#efddc8' : '#242635']} />
            {isDay ? <DayLights /> : <NightLights />}
          </>
        )}
        <Suspense fallback={null}>
          {WorldScene && reference ? <WorldScene referenceStore={reference} /> : <Room mode={mode} />}
        </Suspense>
        {!bakeReference && !reference && <CameraRig />}
      </Canvas></SceneBoundary>
      <Loader dataInterpolation={progress => t('scene.loading', { progress: progress.toFixed(0) })} />
    </>
  )
}

function DayLights() {
  const windowTarget = useMemo(() => {
    const target = new Object3D()
    target.position.set(0.25, 0.12, 0.35)
    return target
  }, [])
  const sunTarget = useMemo(() => new Object3D(), [])
  const sunMask = useMemo(() => {
    const mask = new Shape()
    mask.moveTo(-6, -2).lineTo(7, -2).lineTo(7, 10).lineTo(-6, 10).closePath()
    const opening = new Path()
    opening.moveTo(1.05, 1.05).lineTo(1.05, 2.45).lineTo(2.05, 2.45).lineTo(2.05, 1.05).closePath()
    mask.holes.push(opening)
    return mask
  }, [])

  return (
    <>
      <hemisphereLight args={['#fff9ef', '#e4c9ad', 2.4]} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={1.35}
        color="#fff9ef"
        castShadow
        shadow-intensity={0.18}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <primitive object={windowTarget} />
      <primitive object={sunTarget} position={[1.78, 0.1, -0.87]} />
      {/* Block exterior sun from entering through the cutaway edges. */}
      <mesh position={[0, 0, -2.42]} castShadow>
        <shapeGeometry args={[sunMask]} />
        <meshBasicMaterial side={DoubleSide} colorWrite={false} depthWrite={false} />
      </mesh>
      <directionalLight
        name="MorningSun"
        position={[0.82, 7, -6.35]}
        target={sunTarget}
        color="#fff6e7"
        intensity={3.15}
        castShadow
        shadow-intensity={0.76}
        shadow-mapSize={[1536, 1536]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.012}
        shadow-camera-left={-5.5}
        shadow-camera-right={5.5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
      />
      <spotLight
        position={[1.57, 2.2, -2.02]}
        target={windowTarget}
        color="#fff3e1"
        intensity={5}
        distance={7}
        angle={0.88}
        penumbra={0.9}
      />
    </>
  )
}

function NightLights() {
  const moonTarget = useMemo(() => new Object3D(), [])

  return (
    <>
      <hemisphereLight args={['#cedbff', '#c39879', 1.0]} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={0.55}
        color="#dae2ff"
        castShadow
        shadow-intensity={0.25}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <primitive object={moonTarget} position={[0.25, 0.15, 0.7]} />
      <spotLight
        position={[1.56, 2.15, -2.04]}
        target={moonTarget}
        color="#8fafff"
        intensity={10}
        distance={6}
        angle={0.84}
        penumbra={0.95}
      />
      <pointLight position={[-0.75, 0.83, -0.25]} color="#ffc887" intensity={1.65} distance={2.5} />
    </>
  )
}
