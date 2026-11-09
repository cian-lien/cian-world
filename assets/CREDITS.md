# 素材与授权记录

## 环境天文计算（阶段 1）

- 太阳/月亮位置与月相：SunCalc 2.1.2，Volodymyr Agafonkin，BSD-2-Clause。通过 pnpm 自托管打包，不使用 CDN；接口适配为度数和正北顺时针方位。[项目](https://github.com/mourner/suncalc)，[完整许可证](licenses/suncalc.txt)。
- 离线节气：依据 Meeus《Astronomical Algorithms》第 25/32 章的视黄经、章动、光行差思路实现；地球黄经使用 Bretagnon & Francou (1988) VSOP87D 的 130 项数值系数（保留振幅 ≥1e-7 rad），来自 [IMCCE 原始数据](https://ftp.imcce.fr/pub/ephem/planets/vsop87/VSOP87D.ear)。截断数据存于 `src/env/earthLongitude.ts`，未引入完整天文库或在线历法服务。
- 独立验证数据：香港天文台 [2026 年历](https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf)、[2027 年历](https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2027e.pdf)及其两年中气时刻表；测试 fixture 记录来源，不从待测算法生成。这些科学数据与软件许可证不属于下方声音素材的 CC0 声明。

## 房间模型 v2（当前：写实细节与夜景审核版）

- 房间、家具、电竞椅、设备（MacBook、Mac mini）、壁挂空调、猫、植物叶片、软装与装饰：本项目 bpy 脚本原创生成。
- 木纹、织物、墙面微凹凸、橘猫虎斑、显示屏渐变：Blender 程序材质。
- 未使用外部模型、图片、字体贴图或材质；未使用 AI 生成模型。
- 后续如使用 Poly Haven CC0 素材，将在此补充素材名称、来源链接及授权；不使用 Sketchfab 或 AI 生成模型。

## 房间交互音效

以下 Freesound 实录均标注 CC0。项目使用公开试听版，经剪辑、音量调整并转换为单声道 AAC，文件位于 `public/sounds/`。

- 电脑点击（`computer-mouse.m4a`）。[HunteR4708 — Mouse Click](https://freesound.org/people/HunteR4708/sounds/256455/)
- 打开日记（`diary-open.m4a`）。[yossirafa100 — Soft Cover Book Open 1.wav](https://freesound.org/people/yossirafa100/sounds/638382/)
- 日记翻页（`diary-page-turn.m4a`）。[sokworks — Page Turn](https://freesound.org/people/sokworks/sounds/860360/)
- 台灯开关（`lamp-switch.m4a`）。[jsbarrett — Desk lamp switch](https://freesound.org/people/jsbarrett/sounds/395125/)
- 摸猫（`cat-meow.m4a`）。[ZJ-Davis — CatMeow_Small.wav](https://freesound.org/people/ZJ-Davis/sounds/618900/)

## 环境实录（2026-11-08 核对）

真实实地录音，自托管；CC0 或署名 CC BY 4.0。无 AI 音频、无合成背景音乐。所有片段经剪辑、循环交叉淡化和响度标准化。 Freesound 使用公开 HQ 试听 MP3；原 WAV 需登录，未绕过登录。城市夜晚使用用户允许的 Paris by night CC0 备选。

### dusk-birds

- 名称：Evening birds；作者：Joseph Sardin；[来源](https://bigsoundbank.com/evening-birds-s1859.html)；授权：CC0；用途：dusk-birds。
- 输入：MP3, publisher download。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### wind-gale

- 名称：Strong wind blowing and howling in the desert of Atacama；作者：felix.blume；[来源](https://freesound.org/people/felix.blume/sounds/146914)；授权：CC0；用途：wind-gale。
- 输入：Public HQ preview MP3; original WAV requires login。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### summer-day

- 名称：DeepSummerInsectsJune.wav；作者：kvgarlic；[来源](https://freesound.org/people/kvgarlic/sounds/161980)；授权：CC0；用途：summer-day。
- 输入：Public HQ preview MP3; original WAV requires login。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### summer-night

- 名称：Night Ambience 01 - Aug 2 2013 - Back Yard；作者：rgbrobot；[来源](https://freesound.org/people/rgbrobot/sounds/195969/)；授权：CC0；用途：summer-night。
- 输入：Public HQ preview MP3; original WAV requires login。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### wind-strong

- 名称：Strong wind and trees 2；作者：Joseph Sardin；[来源](https://bigsoundbank.com/vent-fort-et-arbres-2-s1451.html)；授权：CC0；用途：wind-strong。
- 输入：MP3, publisher download。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### rain-spring

- 名称：Rainy ambience in a village on a spring morning and a shower；作者：lastraindrop；[来源](https://freesound.org/people/lastraindrop/sounds/804787)；授权：CC0；用途：rain-spring。
- 输入：Public HQ preview MP3; original WAV requires login。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### rain-window

- 名称：Rain on Window Loop；作者：alxl；[来源](https://opengameart.org/content/rain-on-window-loop)；授权：CC0；用途：rain-window。
- 输入：Original WAV; CC0 chosen from multiple available licenses。剪辑 0–10s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### wind-indoor

- 名称：Wind from inside 1；作者：Joseph Sardin；[来源](https://bigsoundbank.com/wind-from-inside-1-s1714.html)；授权：CC0；用途：wind-indoor。
- 输入：MP3, publisher download。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### rain-gentle

- 名称：gentle rainfall.wav；作者：rasunter255；[来源](https://freesound.org/s/416227)；授权：CC0；用途：rain-gentle。
- 输入：Public HQ preview MP3; original WAV requires login。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### thunder-01

- 名称：Rain + Long Thunder；作者：WuxiaScrub；[来源](https://opengameart.org/content/rain-long-thunder)；授权：CC0；用途：thunder-01。
- 输入：Original OGG。剪辑 18–36s；首尾等功率交叉 0s；目标 -20 LUFS，AAC 立体声96kbps。

### dawn-birds

- 名称：Birds waking 4；作者：Joseph Sardin；[来源](https://bigsoundbank.com/birds-waking-4-s1906.html)；授权：CC0；用途：dawn-birds。
- 输入：MP3, publisher download。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### city-birds

- 名称：Birds in the City #1；作者：Joseph Sardin；[来源](https://bigsoundbank.com/birds-in-the-city-1-s3575.html)；授权：CC0；用途：city-birds。
- 输入：MP3, publisher download。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### city-night

- 名称：Paris by night；作者：Joseph Sardin；[来源](https://bigsoundbank.com/paris-by-night-s0680.html)；授权：CC0；用途：city-night。
- 输入：MP3, publisher download。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。

### rain-roof

- 名称：250723_234255_PH_Heavy_to_medium_rain_on_small_backyard_and_metallic_roof；作者：kevp888 (Kevin Luce)；[来源](https://freesound.org/people/kevp888/sounds/827442/)；授权：CC BY 4.0；用途：rain-roof。
- 输入：Public HQ MP3 preview; original WAV requires login。剪辑 10–72s；首尾等功率交叉 2s；目标 -26 LUFS，AAC 立体声96kbps。
- 授权链接：https://creativecommons.org/licenses/by/4.0/ 。由原录音剪辑、循环和响度处理；本站及本页均保留 kevp888 (Kevin Luce) 署名。

## 岭南天台模型

通过 Blender MCP 程序建模，原创几何和材质；批准的第二版概念图与真实模型渲染分开保存。系统字体转为网格，无第三方模型或贴图。详见 assets/blender/rooftop/README.md。
