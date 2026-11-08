import * as THREE from 'three'
import { lazy, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Html, useGLTF } from '@react-three/drei'
import { navigate } from '../route'
import { playRoomSound } from '../sound'
import { Interactive } from './Interactive'
import { ComputerScreen } from './ComputerScreen'
import { BakedTrialLayers } from './BakedTrialLayers'
import { bakeReference, bakeTrial, bakeTrialUrl, hybridRoom, hybridRoomUrl } from './bakeTrial'
import type { RoomMode, V3 } from './layout'
import { useTranslation } from 'react-i18next'

const HybridTrialLayers = lazy(() => import('./HybridTrialLayers'))

const NIGHT_ACCENTS: Record<string, { color?: string; emissive: string; intensity: number }> = {
  RBN_Glass: { color: '#172745', emissive: '#304775', intensity: 0.44 },
  RBN_FairyBulb: { emissive: '#ffd39b', intensity: 1.15 },
  RBN_LEDStrip: { emissive: '#edb27e', intensity: 0.45 },
}

function takeInteractive(scene: THREE.Group, name: string) {
  const object = scene.getObjectByName(name)
  if (!object) throw new Error(`Room model is missing the ${name} node`)

  const position = new THREE.Vector3()
  object.matrixWorld.decompose(position, object.quaternion, object.scale)
  object.removeFromParent()
  // Keep the model's orientation, with its origin at the interaction group's pivot.
  object.position.set(0, 0, 0)
  return { object, position: position.toArray() }
}

export function Room({ mode }: { mode: RoomMode }) {
  const { t } = useTranslation()
  const modelUrl = hybridRoom ? `${hybridRoomUrl}room.glb`
    : bakeTrial ? `${bakeTrialUrl}room.glb`
      : `${import.meta.env.BASE_URL}models/room-day-warm.glb`
  const { scene } = useGLTF(modelUrl, false)
  const { model, diary, computer, lamp, cat, lampPosition } = useMemo(() => {
    const model = scene.clone(true)
    model.updateMatrixWorld(true)
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = !object.name.startsWith('V2_Room_Glass')
        object.receiveShadow = true
      }
    })

    return {
      model,
      lampPosition: model.getObjectByName('Lamp_Light')?.getWorldPosition(new THREE.Vector3()).toArray(),
      diary: takeInteractive(model, 'Diary'),
      computer: takeInteractive(model, 'Computer'),
      lamp: takeInteractive(model, 'Lamp'),
      cat: takeInteractive(model, 'Cat'),
    }
  }, [scene])

  useLayoutEffect(() => {
    if (bakeTrial || hybridRoom || mode !== 'night') return

    const originals = new Map<THREE.Mesh, THREE.MeshStandardMaterial>()
    const accents = new Map<THREE.MeshStandardMaterial, THREE.MeshStandardMaterial>()
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return
      const original = object.material
      const accent = NIGHT_ACCENTS[original.name]
      if (!accent) return

      let material = accents.get(original)
      if (!material) {
        material = original.clone()
        if (accent.color) material.color.set(accent.color)
        material.emissive.set(accent.emissive)
        material.emissiveIntensity = accent.intensity
        accents.set(original, material)
      }
      originals.set(object, original)
      object.material = material
    })

    return () => {
      originals.forEach((original, object) => { object.material = original })
      accents.forEach((material) => material.dispose())
    }
  }, [mode, model])

  const [lampOverride, setLampOverride] = useState<boolean>()
  const referenceLamp = new URLSearchParams(window.location.search).get('lamp')
  const lampOn = lampOverride ?? (bakeReference ? referenceLamp === 'on' : mode === 'night')
  const bakedRoots = useMemo(() => [model, diary.object, computer.object, lamp.object, cat.object],
    [model, diary, computer, lamp, cat])

  return (
    <>
      <primitive object={model} />
      {hybridRoom && <HybridTrialLayers roots={bakedRoots} mode={mode} lampOn={lampOn}
        lampPosition={lampPosition ?? lamp.position} />}
      {bakeTrial && <BakedTrialLayers roots={bakedRoots} mode={mode} lampOn={lampOn} />}
      {!bakeTrial && !hybridRoom && <ContactShadows
        position={[0, 0.004, 0]}
        width={4.8}
        height={4.4}
        far={0.38}
        blur={1.7}
        opacity={0.44}
        color="#281b16"
        resolution={256}
        frames={1}
      />}
      <Interactive label={t('scene.diary')} labelHeight={0.35} position={diary.position} onSelect={() => {
        playRoomSound('diary')
        navigate('/diary')
      }}>
        <primitive object={diary.object} />
      </Interactive>
      <Interactive label={t('scene.computer')} labelHeight={1.15} position={computer.position} onSelect={() => {
        playRoomSound('computer')
        navigate('/computer')
      }}>
        <primitive object={computer.object} />
        {!bakeReference && <ComputerScreen />}
      </Interactive>
      <Interactive label={t(lampOn ? 'scene.lampOff' : 'scene.lampOn')} labelHeight={0.65} position={lamp.position} onSelect={() => {
        playRoomSound('lamp')
        setLampOverride(!lampOn)
      }}>
        <primitive object={lamp.object} />
        {!bakeTrial && !hybridRoom && <pointLight
          position={lamp.object.getObjectByName('Lamp_Light')?.position}
          color="#ffbd77"
          intensity={lampOn ? 3 : 0}
          distance={2.5}
        />}
      </Interactive>
      <Cat position={cat.position}>
        <primitive object={cat.object} />
      </Cat>
    </>
  )
}

function Cat({ position, children }: { position: V3; children: ReactNode }) {
  const { t } = useTranslation()
  const body = useRef<THREE.Group>(null)
  const jumpAt = useRef(-10)
  const wantJump = useRef(false)
  const timer = useRef<number>()
  const [talking, setTalking] = useState(false)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useFrame(({ clock }) => {
    const g = body.current
    if (!g) return
    if (wantJump.current) {
      jumpAt.current = clock.elapsedTime
      wantJump.current = false
    }
    const t = clock.elapsedTime - jumpAt.current
    g.position.y = t < 0.6 ? Math.sin((t / 0.6) * Math.PI) * 0.35 : 0
    g.scale.set(1, 1 + Math.sin(clock.elapsedTime * 2) * 0.012, 1)
  })

  const meow = () => {
    playRoomSound('cat')
    wantJump.current = true
    setTalking(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setTalking(false), 1400)
  }

  return (
    <Interactive label={t('scene.cat')} labelHeight={0.45} position={position} onSelect={meow}>
      <group ref={body}>{children}</group>
      {talking && (
        <Html position={[0, 0.6, 0]} center zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
          <div className="bubble">{t('scene.meow')}</div>
        </Html>
      )}
    </Interactive>
  )
}
