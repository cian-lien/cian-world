---
version: 1.1
name: 3D 房间博客
description: 一个被切开、摆在桌上的温柔小房间。访客像俯身看微缩模型一样逛进作者的生活，再坐下来读他写的东西。
updated: 2026-11-07

colors:
  # UI · 品牌与强调
  primary: "#ffd36e"
  on-primary: "#3b2f2f"
  diary: "#c4513b"
  diary-shadow: "#8f3a2a"
  danger: "#ff6b6b"
  # UI · 表面
  paper: "#fffaf0"
  paper-bright: "#fffdf8"
  paper-line: "#ecdcc4"
  accent-soft: "#fdeedb"
  titlebar: "#ffe7c2"
  scrim: "rgba(59, 47, 47, 0.25)"
  night-surface: "#38354c"
  night-line: "#a8a2c2"
  on-night: "#ffffff"
  # UI · 文字
  ink: "#3b2f2f"
  text-muted: "#8a7a6d"
  # UI · 深色区域
  code-bg: "#2d2a32"
  code-text: "#f8f8f2"
  terminal-bg: "#1f1d24"
  terminal-text: "#b8f2a6"
  wallpaper-start: "#8ec5fc"
  wallpaper-end: "#e0c3fc"
  # 舞台（3D 画布背景）
  stage-day: "#b9c0c6"
  stage-night: "#12121c"
  # 场景固有色
  scene-wall: "#efe4d6"
  scene-cut: "#7a4e33"
  scene-floor: "#c9a27e"
  scene-floor-seam: "#9c7756"
  scene-wood: "#e2b07f"
  scene-white: "#f1ede6"
  scene-bedding: "#8fa98a"
  scene-linen: "#f4efe6"
  scene-rug: "#ecc6a8"
  scene-rug-inner: "#f4d8c0"
  scene-terracotta: "#c98a6e"
  scene-chair: "#8fa3ad"
  scene-curtain: "#9fb2b8"
  scene-leaf: "#7fa36a"
  scene-cat: "#e8975a"
  scene-device: "#2a2a32"
  # 灯光颜色
  light-sun: "#fff3e1"
  light-moon: "#8fafff"
  light-desk-lamp: "#ffbd77"
  light-bedside: "#ffc887"
  light-fairy: "#ffd39b"
  light-led: "#c9a2ff"
  sky-day-top: "#a9cdf0"
  sky-day-bottom: "#e3f0fb"

typography:
  display:
    fontFamily: hand
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.3
  heading-1:
    fontFamily: hand
    fontSize: 26px
    fontWeight: 600
    lineHeight: 1.3
  heading-2:
    fontFamily: ui
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: ui
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.85
  ui:
    fontFamily: ui
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: ui
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: ui
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: ui
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5

fontFamilies:
  ui: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif'
  hand: '"LXGW WenKai", "Kaiti SC", "STKaiti", "KaiTi", serif'
  mono: '"JetBrains Mono", "Cascadia Code", Consolas, monospace'

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 18px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px

stroke:
  default: 2px solid {colors.ink}
  thin: 1.5px solid {colors.ink}

shadows:
  hard-sm: 0 2px 0 {colors.ink}
  hard-md: 0 4px 0 {colors.ink}
  hard-lg: 0 6px 0 rgba(59, 47, 47, 0.85)
  float: 0 30px 60px rgba(0, 0, 0, 0.25)

motion:
  fast: 0.12s
  pop: 0.18s
  page: 0.3s
  panel: 0.4s
  lamp: 0.25s
  day-night: 1.2s
  camera-smooth: 0.55s
  ease-pop: cubic-bezier(0.2, 0.9, 0.3, 1.2)

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    border: "{stroke.default}"
    shadow: "{shadows.hard-md}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  button-primary-pressed:
    shadow: "{shadows.hard-sm}"
    transform: translateY(2px)
  button-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    border: "{stroke.default}"
    shadow: "{shadows.hard-md}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  button-mode-night:
    backgroundColor: "{colors.night-surface}"
    textColor: "{colors.on-night}"
    border: 2px solid {colors.night-line}
    shadow: 0 4px 0 {colors.night-line}
    rounded: "{rounded.full}"
  name-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    border: "{stroke.default}"
    shadow: "{shadows.hard-md}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  hover-tag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 6px 12px
  speech-bubble:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    border: "{stroke.default}"
    rounded: 14px
    padding: 4px 12px
  hint-bar:
    backgroundColor: rgba(255, 250, 242, 0.9)
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.full}"
    padding: 8px 18px
  chip:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  kbd:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    border: "1px solid {colors.ink}"
    rounded: "{rounded.xs}"
    padding: 0 4px
  diary-cover:
    backgroundColor: "{colors.diary}"
    shadow: 0 10px 0 {colors.diary-shadow}, {shadows.float}
    rounded: "{rounded.lg}"
    padding: 14px
  diary-page:
    backgroundColor: "{colors.paper}"
    ruleColor: "{colors.paper-line}"
    ruleGap: 32px
    padding: 28px 32px
  diary-list-item:
    backgroundColor: transparent
    hoverBackground: "{colors.accent-soft}"
    activeBackground: "{colors.primary}"
    rounded: 10px
    padding: 10px 12px
  diary-close:
    backgroundColor: "{colors.paper}"
    border: "{stroke.default}"
    shadow: 0 3px 0 {colors.ink}
    size: 40px
    rounded: "{rounded.full}"
  code-block:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.code-text}"
    typography: "{typography.mono}"
    rounded: 10px
    padding: 14px 16px
  roomos-window:
    backgroundColor: "{colors.paper-bright}"
    border: "{stroke.default}"
    shadow: "{shadows.hard-lg}"
    rounded: "{rounded.md}"
  roomos-titlebar:
    backgroundColor: "{colors.titlebar}"
    height: 36px
    borderBottom: "{stroke.default}"
  roomos-taskbar:
    backgroundColor: rgba(255, 253, 248, 0.88)
    height: 44px
    borderTop: "{stroke.default}"
  roomos-icon:
    width: 92px
    emojiSize: 38px
    textColor: "#ffffff"
    rounded: 10px
  terminal:
    backgroundColor: "{colors.terminal-bg}"
    textColor: "{colors.terminal-text}"
    typography: "{typography.mono}"
---

## Overview

这个网站是一个**放在桌上的剖面小房间**：俯视 3/4 视角，两面墙、一块带厚度的地台，悬浮在纯色的「舞台」上。访客点击房间里的物件来浏览内容：日记本里是博客文章，电脑里是一个叫 RoomOS 的仿桌面系统，台灯可以开关，地毯上睡着一只橘猫。

视觉分成两层，职责清楚。**3D 场景负责「逛」**：温柔、低饱和、有生活痕迹，像一个被灯光照亮的微缩模型；房间里的彩色感几乎全部来自灯光，而不是物体本身。**2D 界面负责「读」**：奶白色的纸、深棕色的粗描边、实心的硬阴影，像贴在模型旁边的手绘贴纸，按下去时会「陷」进纸里。两层共用同一套暖色调，所以 UI 浮在场景上时不会显得突兀。

网站有两种光照模式。**日景**是上午九点的书房：雾灰蓝的舞台、从窗户斜射进来的阳光、清爽的影子。**夜景**是深夜还在写代码的房间：舞台几乎全黑，房间整体压暗，只有台灯、灯串、置物架灯带和显示器几处亮着，用暖橙、暖黄和淡紫勾出氛围。

**Key Characteristics：**
- 剖面微缩模型：两面墙 + 厚地台，切面统一为深棕 `{colors.scene-cut}`，悬浮在 `{colors.stage-day}` / `{colors.stage-night}` 舞台上
- 「饱和度交给灯光」：场景固有色是奶油、浅木、灰绿，彩色感来自 `{colors.light-desk-lamp}`、`{colors.light-led}`、`{colors.light-moon}` 等灯光
- 手绘贴纸 UI：`{colors.paper}` 底、2px `{colors.ink}` 描边、`{shadows.hard-md}` 实心硬阴影，按下时阴影缩短、整体下移 2px
- 唯一的明黄 `{colors.primary}`：只用于主要按钮、选中状态和「最新一篇」这类需要访客行动的地方
- 日记本是一本真的书：`{colors.diary}` 红色封面、带横线的纸页、标题用楷体 `{fontFamilies.hand}`
- RoomOS 是一台小电脑：蓝紫渐变壁纸、奶黄标题栏、红黄绿三个圆点、绿字终端
- 每一次点击都有回应：悬停标签、点击动画、音效，三者缺一不可

## Colors

来源：当前网站的 `styles.css`、Blender 模型、2026-11-07 的日景和夜景截图。

### Brand & Accent
- **Sunny Yellow**（`{colors.primary}` — #ffd36e）：品牌强调色。用于主要按钮（返回房间、离开电脑、最新一篇）、日记本目录的选中项、日景模式按钮。一个界面上最多出现两处，它出现就意味着「点这里」。
- **Diary Red**（`{colors.diary}` — #c4513b）：日记本封面，和 3D 模型里日记本的颜色完全一致，让 3D 物件和 2D 界面对上号。也用于正文链接。它的硬阴影用更深的 `{colors.diary-shadow}`（#8f3a2a）。
- **Danger**（`{colors.danger}` — #ff6b6b）：只用于 RoomOS 窗口的关闭圆点。

### Surface
- **Paper**（`{colors.paper}` — #fffaf0）：默认的面板色。名牌、纸页、关闭按钮、提示条都是它。
- **Paper Bright**（`{colors.paper-bright}` — #fffdf8）：RoomOS 窗口的内容区，比 Paper 再亮一点，像屏幕上的白色。
- **Paper Line**（`{colors.paper-line}` — #ecdcc4）：日记本的横线、分隔线。
- **Accent Soft**（`{colors.accent-soft}` — #fdeedb）：悬停背景、标签 chip、引用块底色。
- **Titlebar**（`{colors.titlebar}` — #ffe7c2）：RoomOS 窗口的标题栏。
- **Scrim**（`{colors.scrim}`）：日记本背后半透明的暖棕遮罩，让场景退后但仍然可见。
- **Night Surface**（`{colors.night-surface}` — #38354c）+ **Night Line**（`{colors.night-line}` — #a8a2c2）：夜景模式下的切换按钮，在深色舞台上保持贴纸质感。

### Text
- **Ink**（`{colors.ink}` — #3b2f2f）：标题、正文、描边、硬阴影都用这一个颜色。深棕而不是纯黑，和木头、纸张更搭。
- **Muted**（`{colors.text-muted}` — #8a7a6d）：日期、篇数、次要说明。

### Stage & Scene
- **舞台**：日景 `{colors.stage-day}`（#b9c0c6，雾灰蓝），夜景 `{colors.stage-night}`（#12121c，近黑的深蓝紫）。切换时 1.2 秒渐变。
- **场景固有色**（物体本身的颜色，实际看到的会被灯光改变）：

| 令牌 | 色值 | 用在哪里 |
|---|---|---|
| `{colors.scene-wall}` | #efe4d6 | 墙面（左墙比后墙暗约 4%） |
| `{colors.scene-cut}` | #7a4e33 | 墙顶、墙侧、地台侧面等所有切面，必须统一 |
| `{colors.scene-floor}` | #c9a27e | 木地板，每条木板明度随机 ±6%；板缝 `{colors.scene-floor-seam}` |
| `{colors.scene-wood}` | #e2b07f | 书桌面、书架、床架、置物架、床头柜、踢脚线 |
| `{colors.scene-white}` | #f1ede6 | 抽屉柜 |
| `{colors.scene-bedding}` | #8fa98a | 被子（灰绿） |
| `{colors.scene-linen}` | #f4efe6 | 枕头、床单 |
| `{colors.scene-rug}` / `{colors.scene-rug-inner}` | #ecc6a8 / #f4d8c0 | 地毯外圈 / 内圈 |
| `{colors.scene-terracotta}` | #c98a6e | 豆袋、花盆 |
| `{colors.scene-chair}` | #8fa3ad | 电竞椅；底座和轮子用 `{colors.scene-device}` |
| `{colors.scene-curtain}` | #9fb2b8 | 窗帘 |
| `{colors.scene-leaf}` | #7fa36a | 植物叶片 |
| `{colors.scene-cat}` | #e8975a | 橘猫（白色肚皮和爪子） |
| `{colors.scene-device}` | #2a2a32 | 显示器、笔记本、Mac mini 外壳 |

### Light
灯光颜色只在 3D 场景里使用，UI 不能借用。

| 令牌 | 色值 | 光源 | 出现在 |
|---|---|---|---|
| `{colors.light-sun}` | #fff3e1 | 透过窗户的阳光 | 日景 |
| `{colors.light-moon}` | #8fafff | 透过窗户的月光 | 夜景 |
| `{colors.light-desk-lamp}` | #ffbd77 | 台灯 | 可开关 |
| `{colors.light-bedside}` | #ffc887 | 床头灯 | 夜景 |
| `{colors.light-fairy}` | #ffd39b | 床头上方的灯串 | 夜景 |
| `{colors.light-led}` | #c9a2ff | 置物架下的灯带 | 夜景 |
| `{colors.sky-day-top}` → `{colors.sky-day-bottom}` | #a9cdf0 → #e3f0fb | 日景窗外的天空渐变 | 日景 |

### Semantic
网站没有独立的成功 / 警告 / 错误色板。状态都放在暖色体系里表达：选中用 `{colors.primary}`，悬停用 `{colors.accent-soft}`，错误和空状态用文案和插画式的比喻（「这一页被撕掉了」），不用红色警告框。

## Typography

### Font Family

**界面与正文**：`{fontFamilies.ui}`，即系统自带的中文无衬线字体（苹方、微软雅黑、思源黑体）。

**手写感标题**：`{fontFamilies.hand}`。首选开源的**霞鹜文楷**（LXGW WenKai），只用于日记本里的标题，让它像真的在本子上写字。必须自托管并按实际用到的字做子集化，不使用 Google Fonts 等国外 CDN。

**代码与终端**：`{fontFamilies.mono}`。

### Hierarchy

| 令牌 | 字号 | 字重 | 行高 | 字体 | 用途 |
|---|---|---|---|---|---|
| `{typography.display}` | 30px | 600 | 1.3 | hand | 文章标题、欢迎页标题 |
| `{typography.heading-1}` | 26px | 600 | 1.3 | hand | 日记本目录标题「📔 日记本」 |
| `{typography.heading-2}` | 20px | 700 | 1.4 | ui | 正文里的二级标题 |
| `{typography.body}` | 16px | 400 | 1.85 | ui | 文章正文 |
| `{typography.ui}` | 14px | 400 | 1.5 | ui | 提示条、窗口内容、项目描述 |
| `{typography.button}` | 14px | 600 | 1.5 | ui | 按钮、名牌 |
| `{typography.label}` | 13px | 600 | 1.4 | ui | 3D 悬停标签、任务栏按钮 |
| `{typography.caption}` | 12px | 400 | 1.5 | ui | 日期、标签 chip、篇数 |
| `{typography.mono}` | 13px | 400 | 1.5 | mono | 代码块、终端 |

### Principles
- **正文要宽松**：中文正文行高 1.85，段落之间留足空白。这是一个让人读文章的地方，阅读舒适优先于信息密度。
- **楷体只用在「写在本子上」的地方**：日记本的标题用楷体，其他地方（HUD、按钮、RoomOS）一律不用，避免整站显得花哨。
- **emoji 当图标用**：按钮、标签、桌面图标都用 emoji 打头，代替图标库；每条文案最多一个 emoji，并且必须放在开头。
- **不调字距、不用全大写**：中文和英文都用字体默认字距。

### Note on Font Substitutes
霞鹜文楷加载失败时，依次回退到系统楷体（Kaiti SC、STKaiti、KaiTi）。如果访客系统里都没有楷体，退回到 `{fontFamilies.ui}` 并把字重提高到 700，保证标题仍然有分量。

## Layout

### Spacing System
- **基数**：4px。
- **令牌**：`{spacing.xxs}` 4 · `{spacing.xs}` 8 · `{spacing.sm}` 12 · `{spacing.md}` 16 · `{spacing.lg}` 20 · `{spacing.xl}` 24 · `{spacing.xxl}` 32。
- HUD 距离视口边缘 `{spacing.lg}`；底部提示条距离底部 22px；纸页内边距 28px × 32px；RoomOS 窗口内边距 16px × 18px。

### Grid & Container
- **全屏舞台**：3D 画布铺满整个视口，没有页头页脚和滚动条。房间在总览视角下占画面宽度的 **65–75%**，镜头距离按房间包围盒和窗口宽高比自动计算。
- **HUD 四角**：左上是名牌，右上是模式切换或返回按钮（同一时间只出现一个），底部居中是提示条。HUD 不遮挡房间主体。
- **日记本**：居中的模态面板，宽 `min(1100px, 92vw)`、高 `min(700px, 84vh)`；左右两页按 1 : 1.6 分配，左边是目录，右边是正文。
- **RoomOS**：固定 1024 × 610 CSS px，和显示器屏幕模型的宽高比一致，通过 3D 变换贴在屏幕上。桌面图标从左上角纵向排列，窗口自由摆放。

### Whitespace Philosophy
舞台本身就是留白。房间周围均匀的空白让它像一个摆在桌上的模型，所以 HUD 元素要小、要贴边，不能挤占这片空白。2D 面板内部用 `{spacing.xl}`–`{spacing.xxl}` 的内边距，让文字离描边有足够距离。

### Responsive Strategy

#### Breakpoints

| 名称 | 宽度 | 主要变化 |
|---|---|---|
| desktop | ≥ 1024px | 完整体验 |
| tablet | 768–1023px | 3D 完整；日记本改为单页，目录可以收起；RoomOS 不变 |
| mobile | < 768px | 3D 降低渲染分辨率（dpr 1），支持触摸拖动和点击；HUD 缩小；顶部显示「用电脑访问体验更好」提示和「直接看文章」入口 |
| no-webgl | — | 跳过 3D，直接显示纯 2D 文章列表，沿用同一套 UI 令牌 |

#### Touch Targets
- 手机上所有按钮的点击区域至少 44 × 44px。
- 3D 物件在手机上把射线检测的范围放大约 20%，小物件（日记本、台灯）更容易点中。

#### Collapsing Strategy
- 名牌在手机上只显示「🏠 {姓名}」。
- 日记本在手机上是全屏单页：先显示目录，点进文章后顶部出现「← 目录」按钮。
- RoomOS 在手机上不缩放内部布局，镜头距离自动调整，让屏幕铺满视口宽度。

#### Image Behavior
- 文章图片最大宽度 100%，`{rounded.sm}` 圆角，懒加载。
- 3D 场景在窗口尺寸变化时重新计算取景，不裁切房间。

## Elevation & Depth

| 层级 | 处理方式 | 用在哪里 |
|---|---|---|
| 0 | 平铺，无描边无阴影 | 提示条、纸页内部、RoomOS 壁纸 |
| 1 | `{shadows.hard-sm}` | 按下状态、日记本关闭按钮 |
| 2 | `{stroke.default}` + `{shadows.hard-md}` | 名牌、按钮、贴纸类元素的默认状态 |
| 3 | `{stroke.default}` + `{shadows.hard-lg}` | RoomOS 窗口 |
| 浮层 | `{shadows.float}` + 彩色硬阴影 | 只有日记本，因为它浮在整个 3D 场景上方 |

**层级只靠硬阴影表达**：阴影是不带模糊的实心色块，偏移方向永远是正下方。悬停或按下时阴影从 4px 缩短到 2px，元素同时下移 2px，像贴纸被按进纸里。除日记本的 `{shadows.float}` 之外，不使用任何模糊投影。

### Decorative Depth
- **3D 场景本身就是纵深**：UI 是平的，房间是立体的。两者的对比让 UI 像贴在模型玻璃罩上的标签。
- **遮罩退后**：日记本打开时，`{colors.scrim}` 让场景退到后面但仍然可见，提醒访客「你还在房间里」。
- **3D 变换的屏幕**：RoomOS 是真实的 DOM，但贴在显示器上，跟着镜头一起有透视。这是全站唯一一处「2D 进入 3D」的地方。

## Shapes

### Border Radius Scale

| 令牌 | 值 | 用在哪里 |
|---|---|---|
| `{rounded.xs}` | 4px | 键帽样式的 `kbd` |
| `{rounded.sm}` | 8px | 纸页内侧、文章图片 |
| `{rounded.md}` | 12px | RoomOS 窗口、书签卡片、悬停标签、手机提示 |
| `{rounded.lg}` | 18px | 日记本封面 |
| `{rounded.full}` | 9999px | 所有按钮、名牌、提示条、标签 chip、关闭按钮 |

**按钮永远是胶囊形**：不存在直角或小圆角的按钮。

### Scene Geometry
- **比例真实，表面风格化**：家具尺寸参照真实家具（书桌高 0.8m、床宽 1.3m），表面干净，没有划痕、污渍和写实纹理。
- **所有硬边都倒角**（0.005–0.03m），没有锋利的边。
- **软装用细分曲面**（被子、枕头、豆袋、窗帘），带少量自然褶皱。
- **不用描边线**：接缝和缝线用比表面略深的同色系表现，不用黑线。
- **细节集中在焦点附近**：显示器周围（键盘键帽、书脊）细节最多，远处保持简洁。

## Components

### Buttons

**`button-primary`**：「← 返回房间」「🏠 离开电脑」「最新：{标题} →」
- `{colors.primary}` 底、`{colors.on-primary}` 字、`{typography.button}`、`{stroke.default}` 描边、`{shadows.hard-md}`、`{rounded.full}`
- 悬停或按下时切换到 `button-primary-pressed`：阴影变成 `{shadows.hard-sm}`，整体下移 2px，过渡 `{motion.fast}`
- 带快捷键的按钮在文字后放一个 `kbd`（如「Esc」）

**`button-paper`**：日景模式按钮「☀️ 日景」、名牌
- 和 primary 相同的形状，底色是 `{colors.paper}`

**`button-mode-night`**：夜景模式按钮「🌙 夜景」
- `{colors.night-surface}` 底、白字、`{colors.night-line}` 描边和阴影；用 `aria-pressed="true"` 表示当前是夜景

### HUD

**`name-pill`**：左上角「🏠 {姓名} 的房间」，点击回到总览。

**`hint-bar`**：底部居中的操作提示。页面加载 1.2 秒后浮现；用户第一次点击任意物件后消失，并记住不再显示。

### 3D 浮层

**`hover-tag`**：悬停在可交互物件上时出现在物件上方。`{colors.ink}` 底、`{colors.paper}` 字；文案格式是「{emoji} {物件} · {动作}」，例如「📔 日记本 · 看看我的博客」。出现时用 `{motion.pop}` 弹出，不拦截鼠标事件。

**`speech-bubble`**：物件「说话」时使用（猫的「喵～」「Zzz」）。白底、描边、14px 圆角，显示 1.4 秒。

### Diary（日记本）

**`diary-cover`**：日记本外壳。`{colors.diary}` 红色封面，`0 10px 0 {colors.diary-shadow}` 的硬阴影加上 `{shadows.float}`。打开时延迟 0.35 秒（等镜头推近），再用 `{motion.ease-pop}` 从 0.7 倍放大弹出。

**`diary-page`**：左右两张纸页。`{colors.paper}` 底，每 32px 一条 `{colors.paper-line}` 横线，横线跟着内容一起滚动；两页之间用 2px 虚线分隔。

**`diary-list-item`**：目录项，日期（`{typography.caption}`、`{colors.text-muted}`）在上，标题（加粗）在下。悬停时背景变为 `{colors.accent-soft}`，选中时变为 `{colors.primary}`。

**`chip`**：标签「#随笔」，`{colors.accent-soft}` 底的小胶囊。

**`diary-close`**：右上角、向外突出一半的 40px 圆形关闭按钮。

**文章正文**：`{typography.body}`；链接用 `{colors.diary}`；引用块左侧是 4px `{colors.primary}` 竖条、`{colors.accent-soft}` 底；`code-block` 是 `{colors.code-bg}` 深色底、10px 圆角；图片 `{rounded.sm}`。

**状态**：未选择文章时显示欢迎页（楷体标题「欢迎翻开我的日记本」+ 一个「最新：{标题} →」的 primary 按钮）；找不到文章时显示「这一页被撕掉了……找不到「{slug}」。」

### RoomOS（电脑里的仿桌面系统）

**壁纸**：`{colors.wallpaper-start}` → `{colors.wallpaper-end}` 160° 渐变，右上方有一个暖黄色的太阳圆。

**`roomos-icon`**：桌面图标。emoji 38px，下方是白色文字带阴影；悬停时显示半透明白底。单击打开。

**`roomos-window`**：`{colors.paper-bright}` 底、描边、`{shadows.hard-lg}`、`{rounded.md}`，打开时用 `{motion.pop}` 弹出。

**`roomos-titlebar`**：36px 高的 `{colors.titlebar}` 标题栏，左侧是红黄绿三个圆点（红点 = 关闭，用 `{colors.danger}`），按住标题栏可以拖动窗口。

**`roomos-taskbar`**：44px 高，半透明奶白底。左侧是「🏠 离开电脑」（`button-primary`），中间是已打开的窗口，右侧是 HH:MM 时钟。

**`terminal`**：`{colors.terminal-bg}` 底、`{colors.terminal-text}` 绿字、`{typography.mono}`。

**应用**：关于我.txt、我的项目、浏览器（只有书签，在新标签页打开）、终端、日记本（快捷方式，跳转到博客）。

### Signature Components

**`room-diorama`**：整个房间就是一个组件。它由三部分组成：剖面外壳（两面墙 + 厚地台，切面 `{colors.scene-cut}`）、四个区域（休息区、工作区、窗边、地面），以及可交互物件。每个区域都要有一个视觉焦点：灯串、显示器、窗外的天空或月亮、睡着的猫。

**`interactive-object`**：可交互物件。必须同时满足三条：
1. 悬停时放大 1.08 倍、抬高 0.035m，显示 `hover-tag`，鼠标变成手型
2. 点击时有动画或镜头移动
3. 点击时有音效

| 物件 | 悬停标签 | 点击效果 |
|---|---|---|
| 日记本 | 📔 日记本 · 看看我的博客 | 镜头推近，打开日记本 |
| 电脑 | 💻 电脑 · 打开看看 | 镜头正对屏幕，进入 RoomOS |
| 台灯 | 💡 开灯 / 💡 关灯 | 开关台灯，镜头不动 |
| 猫 | 🐱 摸摸猫 | 耳朵抖一下、抬头，冒出「喵～」或「Zzz」，再睡回去（猫是睡姿造型，不整只跳起来） |
| 窗户（规划） | 🌙 看看夜空 / ☀️ 拉开窗帘 | 切换日夜 |
| 书架（规划） | 📚 书架 · 按标签找文章 | 镜头推向书架，弹出标签墙 |
| 相框（规划） | 🖼️ 看看照片 | 放大显示照片和一句话 |
| MacBook（规划） | 💻 正在做的项目 | 打开项目卡片或 GitHub |
| 空调（规划） | ❄️ 吹吹空调 | 出风口飘出风的粒子，「嘀」一声 |

**`light-scene`**：两种光照模式，四个状态。

| 状态 | 舞台 | 主光 | 台灯 | 灯串、灯带、床头灯 | 窗外 |
|---|---|---|---|---|---|
| 日景 · 台灯关（日间默认） | `{colors.stage-day}` | `{colors.light-sun}`，在地板上投出窗框形状的光斑 | 关 | 关 | 天空渐变 |
| 日景 · 台灯开 | `{colors.stage-day}` | 同上 | 只有灯罩亮 | 关 | 天空渐变 |
| 夜景 · 台灯开（夜间默认） | `{colors.stage-night}` | `{colors.light-moon}`，淡淡的窗框光斑 | 桌面和后墙上有暖色光圈，灯罩自发光 | 开 | 月亮和远处的灯光 |
| 夜景 · 台灯关 | `{colors.stage-night}` | 同上 | 关 | 开 | 同上 |

- 日景：明亮柔和，环境光偏暖，暗部不发灰也不死黑；物体和地面接触的地方必须有明显的接触阴影。
- 夜景：环境光比日景降低 50–60%，房间整体压暗，只有几处亮着；发光体带柔和的泛光（Bloom），光晕范围小，不能糊成一片。
- 显示器在所有状态下都亮着；MacBook 屏幕、Mac mini 指示灯、空调显示屏、闹钟数字在日景微亮、夜景亮。
- 默认模式按访客本地时间决定（6:00–18:00 为日景）；用户手动切换后，在本次访问中保持用户的选择。

## Motion

| 令牌 / 动效 | 参数 | 用在哪里 |
|---|---|---|
| 首次飞入 | 约 1.5 秒 | 加载完成后，镜头从远处飞到总览位置 |
| `{motion.camera-smooth}` | 0.55 秒阻尼 | 镜头在视图之间切换 |
| 悬停 | 放大 1.08 倍、抬高 0.035m，damp 系数 12 | 可交互物件 |
| `{motion.fast}` | 0.12 秒 | 按钮按下 |
| `{motion.pop}` | 0.18 秒，从 0.6 倍放大 | 悬停标签、气泡、RoomOS 窗口 |
| `{motion.page}` | 0.3 秒淡入 | 日记本切换文章 |
| `{motion.panel}` + `{motion.ease-pop}` | 延迟 0.35 秒，再 0.4 秒弹出 | 打开日记本 |
| `{motion.lamp}` | 0.25 秒 | 台灯开关 |
| `{motion.day-night}` | 1.2 秒 ease-in-out | 日夜切换（灯光、舞台、发光体同步渐变） |
| 猫的呼吸 | 纵向缩放 ±1.2%，周期约 3 秒 | 空闲时 |

**减弱动态效果**：系统开启 `prefers-reduced-motion` 时，镜头直接切换不飞行，去掉所有弹跳和回弹，只保留 0.2 秒以内的淡入淡出。

## Interaction

- **三个视图**：房间总览 `#/`、日记本 `#/diary` 或 `#/diary/{slug}`、电脑 `#/computer`。任何视图都能用 **Esc**、返回按钮和浏览器后退回到总览。
- **只有总览视图能转动视角和点击物件**；同一时间只有一个物件处于悬停状态。
- **点击和拖动**：按下到松开之间移动超过 4px 算拖动（转动视角），不触发点击。
- **视角范围**：水平约 ±30°，俯仰有限制，永远看不到墙背后和地台底部；滚轮缩放距离 0.6–1.3 倍；禁用右键平移。
- **键盘**：`Esc` 返回；日记本里 `←` `→` 翻到上一篇 / 下一篇（规划中）。
- **打开日记本时暂停 3D 渲染**，关闭后恢复。

## Sound & Voice

### Sound

| 音效 | 文件 | 什么时候播放 |
|---|---|---|
| 翻开书本 | `diary-open.m4a` | 点击日记本，或桌面上的日记本快捷方式 |
| 翻页 | `diary-page-turn.m4a` | 在日记本里切换文章 |
| 鼠标点击 | `computer-mouse.m4a` | 点击电脑 |
| 开关 | `lamp-switch.m4a` | 开关台灯 |
| 猫叫 | `cat-meow.m4a` | 点击猫 |

- 只在用户操作时播放；**没有背景音乐，也不自动播放任何声音**。
- 每个音效 ≤ 1.5 秒、单声道 AAC，响度统一在 -18 到 -14 LUFS 之间。
- 左下角提供静音开关（规划中），并记住用户的选择。
- 所有音效必须是 CC0 授权，登记在 `assets/CREDITS.md`。

### Voice
- 第一人称「我」，像作者本人在招呼来客；轻松、亲切，有一点俏皮，不卖萌，也不堆砌网络用语。
- 标签和按钮 ≤ 12 个字，提示 ≤ 30 个字。
- 错误和空状态用房间里的比喻，同时说清楚怎么办，例如「这一页被撕掉了……」「电脑还没开机」。

## Accessibility

- 文字与背景的对比度符合 WCAG AA（正文 ≥ 4.5 : 1），夜景下的 HUD 也要满足。
- 所有 2D 控件都能用键盘操作；焦点框是 2px `{colors.ink}` 外框，偏移 2px。
- 日记本使用 `role="dialog"` 和 `aria-modal="true"`：打开时焦点移入，关闭后焦点回到原处。
- 3D 画布旁边提供一组视觉上隐藏、屏幕阅读器能读到的导航按钮（「打开日记本」「打开电脑」）。
- 只有 emoji 的按钮必须加 `aria-label`。

## Do's and Don'ts

### Do
- 让场景固有色保持低饱和，把彩色感交给 `{colors.light-desk-lamp}`、`{colors.light-led}`、`{colors.light-moon}` 这些灯光。
- 所有贴纸类 UI 都用 `{stroke.default}` 描边加实心硬阴影；按下时阴影缩短、整体下移 2px。
- 所有按钮都用 `{rounded.full}` 胶囊形。
- `{colors.primary}` 明黄只用于需要访客行动的地方，一个界面最多两处。
- 所有切面统一用 `{colors.scene-cut}`，让房间像一个完整的模型。
- 新增可交互物件时，悬停标签、点击动画、音效三者都要做。
- 长文字一律放进 2D 界面，用 `{typography.body}` 排版。
- 日景和夜景都要截图检查，两种模式都好看才算完成。

### Don't
- 不使用模糊投影表现按钮层级；`{shadows.float}` 只给日记本用。
- 不使用玻璃拟态（毛玻璃）、霓虹色、赛博朋克配色和渐变描边。
- 不把正文和长段文字渲染成 3D 文字。
- 不在场景里使用写实的划痕、污渍、做旧纹理，也不用黑色卡通描边线。
- 不把灯光颜色（`{colors.light-*}`）用在 UI 上。
- 不在 HUD、按钮和 RoomOS 里使用楷体。
- 不自动播放声音，不加背景音乐。
- 不在显示器里用 iframe 嵌入第三方网站。
- 不复刻其他作品的布局、角色和品牌标志；设备只保留外形，不出现真实品牌的 logo。
- 不引入国外 CDN 的字体和脚本。

## Known Gaps（2026-11-07）

以下是当前实现与本规范之间的差距，按优先级排列：

| 优先级 | 问题 | 对应章节 |
|---|---|---|
| 高 | 夜景整体太亮、明暗对比弱；台灯和床头灯没有照出光圈，灯罩不发光 | `light-scene` |
| 高 | 没有泛光，发光体缺少光晕 | `light-scene` |
| 高 | 物体和地面的接触阴影太弱，家具看起来浮在地上 | `light-scene` |
| 中 | 日景窗户是一块白色，地板上没有阳光光斑 | `light-scene` |
| 中 | 墙切面颜色不统一（后墙右侧切面是浅灰蓝色） | Stage & Scene |
| 中 | 豆袋颜色偏淡，接缝是黑色细线 | Scene Geometry |
| 中 | 点击猫时整只跳起，和睡姿造型不符 | `interactive-object` |
| 中 | 夜景窗外没有月亮 | `light-scene` |
| 低 | 默认模式不随访客时间变化；没有静音开关 | `light-scene`、Sound |
| 低 | 加载画面使用 drei 默认的 Loader | — |
| 低 | `site.ts` 仍是示例内容（Your Name） | — |