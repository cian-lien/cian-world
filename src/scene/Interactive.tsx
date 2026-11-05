import * as THREE from 'three'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useRoute } from '../route'
import type { V3 } from './layout'

interface Props {
  /** 悬停时显示的提示 */
  label?: string
  /** 提示框离物体原点的高度 */
  labelHeight?: number
  onSelect: () => void
  position?: V3
  rotation?: V3
  children: ReactNode
}

/**
 * 可点击物体的通用外壳：
 *  - 悬停：鼠标变手型、物体轻轻放大抬起、显示提示
 *  - 点击：触发 onSelect（拖动镜头后松手不算点击）
 *  - 只在房间总览视图下可交互
 * 以后换成 Blender 模型，同样用它包住对应的 GLTF 节点即可。
 */
export function Interactive({ label, labelHeight = 0.5, onSelect, position, rotation, children }: Props) {
  const { view } = useRoute()
  const active = view === 'room'
  const [hovered, setHovered] = useState(false)
  const inner = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!active) setHovered(false)
  }, [active])

  useEffect(() => {
    if (!hovered) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  useFrame((_, dt) => {
    const g = inner.current
    if (!g) return
    const s = THREE.MathUtils.damp(g.scale.x, hovered ? 1.08 : 1, 12, dt)
    g.scale.setScalar(s)
    g.position.y = THREE.MathUtils.damp(g.position.y, hovered ? 0.035 : 0, 12, dt)
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (active) setHovered(true)
  }
  const out = () => setHovered(false)
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (!active || e.delta > 4) return // delta：按下到松开移动的像素，拖动视角时不触发
    setHovered(false)
    onSelect()
  }

  return (
    <group position={position} rotation={rotation}>
      <group ref={inner} onPointerOver={over} onPointerOut={out} onClick={click}>
        {children}
      </group>
      {hovered && label && (
        <Html position={[0, labelHeight, 0]} center zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }}>
          <div className="tag">{label}</div>
        </Html>
      )}
    </group>
  )
}
