# 3D 房间博客（原型 v0.1）

一个俯视视角的 3D 卡通小房间，房间就是博客：

- **日记本** → 博客文章（Markdown）
- **电脑** → 仿桌面系统 RoomOS（关于我、我的项目、浏览器书签、终端）
- **台灯** → 开关灯；**猫** → 彩蛋

技术栈：React 18 + React Three Fiber + drei + Vite + marked。

## 快速开始

```bash
npm install
npm run dev        # 本地开发
npm run build      # 打包到 dist/，可直接部署到任意静态托管（Vercel / Netlify / GitHub Pages）
npm run typecheck  # TypeScript 类型检查
```

> 这个原型是在无法安装依赖的环境里写的，3D 部分还没实际跑过。如果第一次运行报错，把报错信息发给我即可。

## 网址（hash 路由）

| 地址 | 视图 |
|---|---|
| `#/` | 房间总览 |
| `#/diary` | 日记本目录 |
| `#/diary/<文件名>` | 某篇文章（可直接分享） |
| `#/computer` | 电脑桌面 |

按 `Esc` 或点「返回房间」回到总览，浏览器后退键也可以用。

## 目录结构

```
content/posts/*.md        文章（文件名 = 文章网址）
src/content/site.ts       个人信息、项目、书签 ← 先改这里
src/content/parsePosts.ts frontmatter 解析 + Markdown 渲染
src/route.ts              hash 路由
src/scene/layout.ts       所有关键坐标（镜头位置、日记本、屏幕尺寸）
src/scene/Room.tsx        占位房间（之后换成 Blender 模型）
src/scene/Interactive.tsx 可点击物体的通用外壳（悬停放大 + 提示 + 点击）
src/scene/CameraRig.tsx   镜头飞行与视角限制
src/scene/ComputerScreen.tsx  把 RoomOS 贴到显示器上
src/ui/Desktop.tsx        RoomOS 仿桌面系统
src/ui/DiaryOverlay.tsx   日记本阅读界面
```

## 写文章

在 `content/posts/` 新建 `xxx.md`：

```md
---
title: 文章标题
date: 2026-11-01
tags: [标签1, 标签2]
summary: 一句话简介
draft: false
---

正文……
```

## 换成你的 Blender 模型

建议的 Blender 工作流：

1. **建模**：low-poly，圆角（Bevel 修改器），颜色尽量用纯色块。
2. **分组**：静态物体（墙、地板、床、书架……）合并成一个对象，例如 `Room`；每个可交互物体单独一个对象，并起好名字：`Diary`、`Computer`、`Screen`、`Lamp`、`Cat`。
3. **烘焙光照**：把静态部分的光影烘焙到一张贴图里（Cycles → Bake → Combined），运行时就不需要实时阴影，又好看又流畅。
4. **导出**：File → Export → glTF 2.0（.glb），勾选 Compression（Draco）。放到 `public/models/room.glb`。

然后在 `Room.tsx` 里替换占位几何体，大致这样：

```tsx
import { useGLTF } from '@react-three/drei'

export function Room() {
  const { nodes } = useGLTF('/models/room.glb') as any
  return (
    <group>
      <primitive object={nodes.Room} />
      <Interactive label="📔 日记本" onSelect={() => navigate('/diary')}>
        <primitive object={nodes.Diary} />
      </Interactive>
      {/* Computer、Lamp、Cat 同理 */}
    </group>
  )
}
useGLTF.preload('/models/room.glb')
```

注意：`<primitive>` 会把节点从原来的父级挪出来，所以每个节点只用一次。

最后把 `src/scene/layout.ts` 里的坐标改成模型里对应物体的位置（在 Blender 里选中物体看 Location；Blender 的 Z 轴向上，对应 three.js 的 Y 轴，three.js 的 Z = Blender 的 −Y）。屏幕的宽高也要改成模型里屏幕面的实际尺寸。

## 可以调的参数

- 镜头位置：`layout.ts` 的 `ROOM_VIEW`、`DIARY_VIEW`
- 房间视角能转多少：`CameraRig.tsx` 的 `lockRoom`
- 镜头飞行速度：`CameraRig.tsx` 的 `smoothTime`
- 灯光：`Experience.tsx` 的 `Lights`
- 卡通色阶：`parts.tsx` 的 `gradientMap`

## 后续计划

- [ ] 用 Blender 模型替换占位房间，烘焙光照
- [ ] 书架 → 文章分类 / 标签；相框 → 关于我
- [ ] 移动端适配（触控、简化模型）
- [ ] SEO：为每篇文章预渲染静态 HTML，或提供纯 2D 版本
- [ ] 音效（翻书声、开机声、猫叫）
- [ ] 后端：评论 / 留言板 / 访问统计（可以拿来练后端）
