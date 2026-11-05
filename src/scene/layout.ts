export type V3 = [number, number, number]
export type RoomMode = 'day' | 'night'

// 日夜共用同一机位。坐标为导出后的 Y-up 坐标。
export const ROOM_VIEW = {
  position: [8, 7.29, 8.3] as V3,
  target: [0, 1.19, -0.15] as V3,
}

export const INTRO_POSITION: V3 = [15, 13, 15]

export const DIARY_VIEW = {
  position: [-0.77, 2, -0.9] as V3,
  target: [-0.77, 0.8, -1.53] as V3,
}

const MONITOR_POS: V3 = [0.5, 0.8, -1.88]

/** 显示器屏幕中心相对底座的坐标及实际宽高（米）。 */
export const SCREEN = {
  local: [0, 0.6, 0.028] as V3,
  width: 0.94,
  height: 0.56,
}

export const SCREEN_CENTER: V3 = [
  MONITOR_POS[0] + SCREEN.local[0],
  MONITOR_POS[1] + SCREEN.local[1],
  MONITOR_POS[2] + SCREEN.local[2],
]

export const DESKTOP_PX = {
  width: 1024,
  height: Math.round((1024 * SCREEN.height) / SCREEN.width),
}
