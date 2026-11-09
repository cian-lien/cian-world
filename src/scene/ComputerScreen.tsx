import { Html } from '@react-three/drei'
import { useRoute } from '../route'
import { Desktop } from '../ui/Desktop'
import { DESKTOP_PX, SCREEN } from './layout'

/**
 * 把一个真实的 DOM（仿桌面系统）贴在显示器屏幕上。
 * drei 的 <Html transform> 中：世界宽度 = CSS 像素 × distanceFactor / 400，
 * 据此反推 distanceFactor，让 1024px 宽的桌面刚好铺满 0.94m 宽的屏幕。
 */
const DISTANCE_FACTOR = (SCREEN.width * 400) / DESKTOP_PX.width

export function ComputerScreen() {
  const { view } = useRoute()
  const active = view === 'computer'

  return (
    <Html
      transform
      position={SCREEN.local}
      distanceFactor={DISTANCE_FACTOR}
      zIndexRange={[10, 0]}
      // 不在电脑视图时，让点击穿透到 3D 场景（点屏幕 = 点电脑）
      pointerEvents={active ? 'auto' : 'none'}
      style={{ backfaceVisibility: 'hidden', display: view === 'world' ? 'none' : undefined }}
    >
      <Desktop active={active} />
    </Html>
  )
}
