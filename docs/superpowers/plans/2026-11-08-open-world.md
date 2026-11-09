# 房间 + 外面的世界 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 方案已由作者确认；作者后续指令“直接完成所有阶段”已覆盖阶段间试听/截图停止点；实施至阶段7，保留未提交变更，不推送或发布生产。

**Goal:** 建立可复用的真实环境与实录声音系统，并接入可替换示例岛和原房间。

**Architecture:** 纯 TypeScript 环境计算与外部 store 是唯一状态源；Cloudflare Worker 提供同源位置/天气；React、R3F 与 Web Audio 各自作为消费者。世界整体动态加载，房间保留原烘焙与交互。

**Tech Stack:** React 18、R3F 8、drei 9、three 0.169、Vite 8.3.6、pnpm 12.8.1、TypeScript、Vitest 5、SunCalc、Wrangler 4、Web Audio、ffmpeg。

**Spec:** [2026-11-08-open-world-design.md](../specs/2026-11-08-open-world-design.md)，执行前完整阅读；本文中的接口细节以该设计为准。

## Global Constraints

- URL 参数 > 访客手动选择 > 真实数据 > 兜底默认值；天气与昼夜属于访客，真实节气按 Asia/Shanghai。
- 环境核心不依赖 React、three、Web Audio 或浏览器；只由 browser/useEnvironment 适配。
- 不升级 React、R3F、drei、three 主版本；不改模型、重烘焙或破坏原有交互/多语言/烘焙试验。
- 不主动请求定位授权；不持久保存访客位置；缓存只含 0.1° 取整网格天气。
- 首屏 JS 增量 ≤30KB gzip（计自动加载 chunk）；世界只在首次进入加载；首手势前环境音文件下载 0。
- 实录 CC0、环境 -26 LUFS、雷 -20 LUFS、交互 -18～-14 LUFS；m4a立体声96–128kbps、单条≤1.2MB、总计≤10MB。
- 稳态最多4个环境声层，正在淡出的旧层不计入这4个；环境播放音源总数最多6个（含淡出与雷）。所有切换等功率交叉、禁止先出后入；启动将超过6源时，最早开始淡出的旧层≤0.5秒加速结束并释放后，才能启动新淡入。通常天气/混音3–5秒，拥塞回收为已确认例外；室内外≤1.5秒，隐藏1秒淡出。
- 室内户外层低通1200Hz、衰减8dB；风阈值10.8/17.2m/s；雷间隔20–60秒、声延迟1–4秒、闪光≤每秒一次且reduced-motion禁闪。
- 完整主题是立春、清明、**夏至**、立秋、冬至共5个；其余19个季节通用；节气绝不制造雨雪。
- 全部新增可见文案/aria/title中英双语，遵循DESIGN贴纸令牌、44px触摸目标、reduced-motion。
- 作者已覆盖中间停止点；阶段7仅上传预览版本，不发布生产。

## Review Focus

- 全球设备与CF时区不同、DST/极昼夜/无位置：日月和展示各有明确时钟语义，无 NaN，节气不被默认广州替代时刻改变（任务2）。
- URL非法/部分覆盖、storage抛错、恢复真实：逐字段回退，不丢lang/bake/Hash/history.state，不残留高优先级模拟（任务3）。
- 同一网格不同城市/上游坏JSON/旧响应迟到/切后台：缓存不串城市、失败fallback、旧请求不覆盖新状态（任务4–5）。
- 首次点击即交互、隐藏后立刻恢复、连改天气与雷：单context、稳态≤4层/含淡出总源≤6、拥塞回收≤500ms且交叉无空档，无晚到雷声/定时器suspend前台（任务8–10）。
- world直达/首次chunk失败/往返10次/语言或日记切换：资源恢复、RoomOS和台灯不重置、Esc只关一层（任务6–7、11–13）。

---

## 阶段 0：当前文档交付

- [x] 阅读 DESIGN、i18n、全部已有 spec/plan、route/App/sound 与 scene。
- [x] 核对 Cloudflare/Open-Meteo/SunCalc/HKO 官方来源。
- [x] 确认作者新增夏至，完整主题5个、通用19个、矩阵29张。
- [x] 运行未改功能代码的基线：typecheck、20测试、build通过；记录构建gzip数据。
- [x] 设计 builder check、计划自审：修正当地日出日落/显式坐标时区、房间Html门户停用；声音并发按作者后续确认规则更新。
- [x] 作者已确认设计与计划，并明确授权执行阶段1；完成后停止，等待后续指令。
- [x] 声音调度专项已确认：稳态最多4层，淡出层不计入稳态；总源最多6个；全部等功率交叉；将超6源时最早淡出层≤500ms加速结束再启动新淡入。不采用分段先出后入方案。

## 阶段 1：环境核心（无画面和声音接入）

### Task 1: 契约、节气元数据、天气映射

**Files:** 创建 `src/env/types.ts`、`solarTerms.ts`、`solarTermThemes.ts`、`weather.ts`、`__tests__/metadata.test.ts`、`__tests__/weather.test.ts`。

**Interfaces:** 导出设计中的 DayPhase、WeatherKind、EnvironmentState；`mapWeather(input: WeatherObservation): EnvironmentState['weather'] | null`；`solarTerms` 固定24项；`solarTermThemes` 按id索引的纯配置，无three类型。WeatherObservation含code/cloudCover/windSpeed/windDirection/temperature/precipitation，单位已归一化。

- [x] 先写失败测试：24项id/index/黄经唯一，315°起每15°，中英名称/文案非空；5个完整主题+19个继承主题；夏至含lotus/fireflies/summer-day，冬至无默认积雪。
- [x] 写完整表驱动失败测试：设计内所有WMO代码→kind/intensity；0/1/2/3、冻雨与sleet区别、97/98兼容；未知码、NaN、Infinity、缺必需值返回null；云量/强度截断、风向归一化。
- [x] Run `pnpm exec vitest run src/env/__tests__/metadata.test.ts src/env/__tests__/weather.test.ts`；预期缺模块/导出FAIL。
- [x] 实现上述纯契约/元数据/映射，逐项照设计强度表；主题只包含固有色、植物/小物/装饰粒子和声音id。
- [x] 重跑同一命令预期PASS，`pnpm typecheck`通过；检查纯模块无React/three/window导入。
- [x] 检查diff；未提交，任务变更保留为独立提交单元，获授权时用 `feat(env): add environment contracts and weather mappings`。

### Task 2: 时钟、日月与交节时刻

**Files:** 创建 `src/env/clock.ts`、`astronomy.ts`、`solarLongitude.ts`、`__fixtures__/hko-solar-terms-2026-2027.ts`、`__tests__/{clock,astronomy,solarTerms}.test.ts`；修改package.json/pnpm-lock.yaml（仅此时安装SunCalc）。

**Interfaces:** `resolveClock(now: Date, clock: ClockContext, override: ClockOverride): Date`；`getSky(time: Date, coordinates: Coordinates, fallbackWallClock?: WallClock): Pick<EnvironmentState,'sun'|'moon'|'phase'|'dayProgress'>`；`classifyPhase(altitude: number, ascending: boolean): DayPhase`；`solarLongitude(time: Date): number`；`getSolarTerm(time: Date, forcedId?: string): EnvironmentState['solarTerm']`。ClockOverride为可选date/time，Coordinates为latitude/longitude，WallClock含年月日时分秒；三者在types.ts定义。

- [x] 手工转录HKO两年48日期fixture，注明两张年历链接、UTC+8、核对日期；另转录两张中气表共24个带时分样本，不使用待测算法生成期望值。
- [x] 先写失败测试：48日期逐项相等、时分样本误差≤300000ms；根前1秒旧节气/根时刻新节气；年初小寒大寒、立春index0、角度360/0跨越及上一年区间。
- [x] 写失败测试：高度-6.01→night、-6/0/6按上升下降为dawn/dusk、6.01→day；dayProgress连续并0/1色值闭合；广州/伦敦/悉尼同一绝对时刻、极昼夜、日月方位与月相在合法范围。
- [x] 写时钟失败测试：无位置设备中午仍按广州替代墙钟算日景但真实节气不变；device/CF时区不同、DST重复选早/缺失推进、非法IANA回设备；date-only固定日期/墙钟仍走、time-only固定时分/日期跟随当地当天、date+time冻结完整时刻、24:00滑块归次日。
- [x] Run `pnpm exec vitest run src/env/__tests__/clock.test.ts src/env/__tests__/astronomy.test.ts src/env/__tests__/solarTerms.test.ts`，预期FAIL。
- [x] 核对npm可用SunCalc版本/许可证/度数方位约定，固定安装并只引所需函数；实现适配和Meeus视黄经/求根。误差不达标补周期修正，不能跳过或放宽fixture。
- [x] 同一测试PASS，`pnpm typecheck`通过；在UTC/Asia/Shanghai/America/New_York三宿主TZ运行同一组测试，日期结果一致。登记SunCalc软件许可证；此阶段不下载音频。
- [x] 检查diff；未提交，预留提交单元 `feat(env): calculate local sky and Beijing solar terms`。

### Task 3: 覆盖优先级、外部store和生命周期

**Files:** 创建 `src/env/{overrides,resolve,transition,store,browser,useEnvironment}.ts`、`__tests__/{priority,transition,store}.test.ts`；创建 `shared/env-api.ts`（先定义DTO/校验器）；尚不修改App/main。

**Interfaces:** `parseEnvironmentOverrides(search: string): EnvironmentOverrides`；`resolveEnvironment(input: EnvironmentInput): EnvironmentState`；`createEnvironmentStore(deps): EnvironmentStore`（设计中的全部方法）；`sampleTransition(from: VisualEnvironment, to: VisualEnvironment, elapsedMs: number): VisualEnvironment`（4000ms）；`useEnvironment(): EnvironmentState`。依赖用可注入时钟/storage/fetchEnv/timers/visibility，默认browser单例此时不启动。

- [x] 先写失败测试：逐字段URL>manual>live>fallback、weather单独覆盖带预设、wind单独覆盖不抹温度；坏HH:mm/日期/term/半对坐标/NaN逐项忽略；冻雨不会变sleet；term不改变weather。
- [x] 写失败测试：storage get/set/JSON异常仍可用；仅保存手动配置无坐标；followReal清URL环境参数和manual，保留lang/bake/cam/lamp/Hash/history.state；source与fieldSources准确。
- [x] fake timers测试：一分钟更新时间、交节边界准时、15分钟刷新、隐藏暂停/abort、恢复过期才fetch；start/stop重复、稳定snapshot、unsubscribe和迟到响应处理。
- [x] 纯过渡测试：0ms旧值、4000ms目标、2000ms各降水权重中间值；风向359→1走短弧；重复切换从当前值接续，snow增长只认weather，退出雪渐融。
- [x] Run `pnpm exec vitest run src/env/__tests__` 预期新测试FAIL；实现解析、resolver、store及薄React hook，不挂载任何UI/声音。
- [x] 重跑全环境测试及 `pnpm typecheck`；预期PASS，确认纯入口不依赖React、DOM/three。
- [x] 检查diff；未提交，预留提交单元 `feat(env): add overrides and shared environment store`；记录阶段1结果，按作者本轮要求停止，不进入阶段2。

## 阶段 2：Worker 与数据

### Task 4: 同源天气API、坐标缓存与静态路由

**Files:** 创建 `worker/{index,env,weather}.ts`、`worker/env.test.ts`、`tsconfig.worker.json`、生成 `worker-configuration.d.ts`；修改 shared/env-api.ts、wrangler.jsonc、package.json/lock与typecheck脚本。

**Interfaces:** `GET /api/env` / `GET /api/env?lat=...&lon=...` → EnvResponse；`fetchWeather(coordinates: Coordinates, deps: WeatherFetchDependencies): Promise<CachedWeather | null>`；`handleEnv(request: Request, deps: EnvDependencies): Promise<Response>`。CachedWeather只含weather/网格timezone/fetchedAt；注入fetch、cache、now、waitUntil，单测无需live服务。

- [ ] 先写失败测试：CF字符串经纬度先0.1°取整，缺city保留null，缺坐标不fetch；同网格不同city返回各自location，cache无city/IP；显式URL坐标city=null且timezone用网格zone或UTC，不能沿用CF城市/时区；负坐标/-0、±90/±180边界与URL验证。
- [ ] 写失败测试：cache hit不fetch、900s过期重取、失败不缓存、4秒超时、429/500/坏JSON/非法单位weather:null；命中保留原fetchedAt，出站no-store；未知API404/非GET405/非API委托ASSETS。
- [ ] 写请求契约断言：host固定、指定current/daily字段、ms、celsius、timezone=auto、unixtime、forecast_days=1；日出日落属网格当地当天，DTO云量只除100一次；upstream request与cache key无原始精度/城市/IP。
- [ ] Run `pnpm test -- worker/env.test.ts` 预期FAIL；增加Wrangler4固定开发依赖，`pnpm exec wrangler types`生成独立Worker类型，避免污染DOM app tsconfig。
- [ ] 实现handleEnv/fetchWeather、Cache API与waitUntil；wrangler设main、ASSETS、run_worker_first数组，不改Hash和现有静态资源处理。
- [ ] 重跑Worker测试PASS；根`pnpm typecheck`包含app/worker/tools三配置；`pnpm exec wrangler deploy --dry-run`验证bundling/路由配置，不实际部署。
- [ ] 检查无位置日志/应用观测持久化；提交单元 `feat(worker): serve private grid-cached weather data`。

### Task 5: 离线mock与浏览器数据接线

**Files:** 创建 `dev/{envMock,envMockPlugin}.ts`、`dev/envMock.test.ts`、`src/env/__tests__/browser.test.ts`、tsconfig.tools.json；修改 vite.config.ts、src/env/browser.ts、src/main.tsx、package.json。

**Interfaces:** `createEnvMockPlugin(): Plugin`；`parseEnvResponse(value: unknown): EnvResponse | null`；`startBrowserEnvironment(): () => void`；DEV-only mock simulationTime转换成最低优先级时钟输入。

- [ ] 先写失败测试：clear-day/rain-night/gale-day/snow-night/offline固定fixture；未知mock回默认；生产无mock参数影响；DTO拒绝坏数值、过期/将来时间，浏览器只请求同源API。
- [ ] 测试网络失败、隐藏请求abort、快速URL变更旧响应丢弃；新真实数据到达不覆盖manual/url；CF timezone异常回device，刷新不写位置storage。
- [ ] Run `pnpm test -- dev/envMock.test.ts src/env/__tests__/browser.test.ts` 预期FAIL；实现Vite middleware和启动/清理，默认dev不依赖外网。
- [ ] 新增 `dev:worker` 走Wrangler；`pnpm dev`离线逐个mock验证JSON，`pnpm build`产物不包含mock路由/坐标fixture。
- [ ] 同组测试、typecheck通过；提交单元 `feat(env): connect worker data and offline development mocks`。

## 阶段 3：路由、转场和环境面板（世界占位）

### Task 6: World 路由与场景生命周期

**Files:** 修改 `src/route.ts`、`src/App.tsx`、`src/scene/{Experience,CameraRig,Interactive,HybridTrialLayers,Room,BakedTrialLayers,ComputerScreen}.tsx`；创建 `src/route.test.ts`、`src/world/{WorldScene,WorldCamera}.tsx`（占位）、`src/ui/SceneTransition.tsx`、`src/ui/SceneTransition.test.tsx`、`src/scene/windowAnchors.ts`。

**Interfaces:** `View`加入world；`Interactive`新增`activeViews?: readonly View[]`，默认['room']；WorldScene默认导出组件，props为`{ onReturnToRoom(): void }`，环境从useEnvironment读取；房间render adapter支持active，停用时不渲染composer/灯光、不拾取并恢复Canvas全局状态。

- [ ] 先写parseHash失败测试：#/world、#/world/、旧room/diary编码slug/computer、unknown、畸形URI不throw；navigate保持search。
- [ ] 转场失败测试：600ms正常、≤1500ms上限，reduced-motion≤200ms、chunk慢转静态加载、reject重试/返回；连续点击只激活最后目标。
- [ ] Run `pnpm test -- src/route.test.ts src/ui/SceneTransition.test.tsx` 预期FAIL；实现lazy world入口、单Canvas、房间保留但inactive、独立世界相机、HUD进出按钮和窗户代理。
- [ ] 验证引用模型窗节点/包围盒后记录锚点，不改GLB；屋门占位可回房间，Interactive在world有效，room原行为不变。
- [ ] 浏览器直达/刷新/后退、双语、room/diary/computer/world循环；RoomOS窗口/终端/台灯状态保留，Hybrid未覆盖world，无旧相机影响。特别检查world里ComputerScreen/气泡门户DOM隐藏且不拾取，Desktop仍挂载、房间useFrame和所有灯光暂停；不能只设group.visible=false。构建确认world独立chunk且首次进入才fetch。
- [ ] 单测/typecheck/build通过；提交单元 `feat(world): add lazy scene navigation and transitions`。

### Task 7: 环境面板、声音入口、统一Esc与节气卡

**Files:** 创建 `src/ui/{EnvironmentCapsule,EnvironmentPanel,SoundButton,SolarTermCard,AudioCredits,OverlayHost}.tsx` 与 `EnvironmentPanel.test.tsx`、`SolarTermCard.test.tsx`、`OverlayHost.test.tsx`；修改App、LanguageSwitcher、styles.css、i18n/resources.ts/resources.test.ts。

**Interfaces:** `OverlayHost`向全局Esc暴露只关闭最顶层的动作；面板调用EnvironmentStore setManual/followReal；SoundButton先接持久化AudioPreferences（阶段4接播放），首手势前不加载engine；AudioCredits此阶段显示待补充说明/数据来源，不能伪造已使用素材。

- [ ] 先写失败测试：时间滑块0–24步长1分钟/24归次日、九天气、风0–40、24节气、恢复真实清环境URL而保留语言/bake；温度null不显示0°，城市null有双语兜底。
- [ ] 测试键盘开关/焦点回归、长英文/长城市、44px目标；Esc只关语言/致谢/面板，再按一次world→room；存储异常不崩，日记和电脑Esc仍可返回。
- [ ] 测试节气卡6秒、相同id只一次、storage异常会话一次、模拟term不污染已见；词典key/插值/全部24名称与纯元数据一致。
- [ ] Run `pnpm test -- src/ui/EnvironmentPanel.test.tsx src/ui/SolarTermCard.test.tsx src/ui/OverlayHost.test.tsx src/i18n/resources.test.ts` 预期FAIL；按DESIGN纸色描边/硬阴影实现，不以大量新主黄色按钮挤占HUD。
- [ ] 浏览器375/768/1440宽、zh/en、存储禁用；面板滚动/焦点/表单不穿透拖动，bakeReference新UI全部隐藏且不取环境API。
- [ ] 测试/typecheck/build通过；提交单元 `feat(ui): add bilingual environment controls and accessible overlays`。

## 阶段 4：真实录音与混音；完成后必须停下试听

### Task 8: 素材核验、下载清单与可重复处理流水线

**Files:** 创建 `scripts/audio/{prepare.sh,clips.json}`、`assets/audio/DOWNLOADS.md`（需要时）、`public/sounds/ambience/manifest.json` 与成品m4a；修改 .gitignore、assets/CREDITS.md。

**Interfaces:** `prepare.sh`读取clips.json；manifest输出设计指定id/file/role/duration/loopStart/loopEnd/defaultGain/sourceId/bytes。raw文件名和相对路径一一登记；脚本重复执行同一配置可重建成品。

- [ ] 打开作者每个拟用素材来源页，逐条登记作者/原名/CC0/链接/用途；直接可下载的取原文件，需登录的写具体清单到raw路径给作者，不用未核对替代音。
- [ ] 安装前检查本机ffmpeg/ffprobe；缺工具明确告知再处理，不悄悄引入付费服务。把raw加入.gitignore，声音源页与软件许可证分开登记。
- [ ] 按配置先出一条循环：选60s干净片段（60–90可配置）、2s等功率首尾交叉处理、双遍-26LUFS/≤-1dBTP、96kbps stereo AAC；ffprobe校验时长/声道/体积，再人工试听3遍。
- [ ] 扩展13个用途，11s窗雨不强行伪造60s，雷截独立一声-20LUFS；配置记录每条原始剪辑起止/交叉淡化/响度测量与修改。夏至必须确有可辨蝉鸣。
- [ ] 脚本自动拒绝单条>1200000 bytes或总计>10000000 bytes；用解码PCM验证loop点与AAC间隙，manifest引用全部真实文件；清空成品后重跑验证可重复。
- [ ] 无法下载则保留清单并将试听gate标未完成；音频缺失不阻止后续编写engine，但不得越过作者试听停止点。提交单元 `feat(audio): add verified field recordings and preparation pipeline`。

### Task 9: 纯混音规则、四个稳态声层/六个音源调度和雷事件

**Files:** 创建 `src/audio/{types,mix,scheduler,thunder}.ts`、`__tests__/{mix,scheduler,thunder}.test.ts`。

**Interfaces:** `selectMix(state: EnvironmentState, space: 'indoor'|'outdoor'): MixTarget`；`MixTarget`含最多4个稳态layer目标与filter/gain；`createLayerScheduler(deps): LayerScheduler`提供update(target)/stop()/dispose()，区分目标/淡出源并记录fadeStartedAt/单调序号，最多6个环境播放源；`createThunderController(deps)`提供update(state)/subscribe(listener)/dispose()，事件为id/flashAt/thunderAt。

- [ ] 先写mix失败测试：4时段连续权重、春鸟/秋少鸟/冬夜无虫/夏至虫蝉与荷花无关；snow静音鸟虫；风10.79/10.8/17.19/17.2边界；雨认weather不认term，qingming/guyu雨素材优先；室内1200Hz/-8dB/窗雨/屋内风。
- [ ] 写fake clock/假AudioParam失败测试：等功率cos/sin端点与中点、通常4000ms旧源停止；稳态含淡入目标≤4、淡出旧源不计入稳态、新旧+thunder总源永不>6。验证替代新声与自己的旧声重叠，不能先把旧声停掉再开始新淡入。
- [ ] 写拥塞失败测试：已有6源时新源不得先start；最早fadeStartedAt（同时间用序号）的旧源≤500ms降至0并stop/disconnect后，才准新源start。其配对新源同步推进等功率曲线，排队替换的旧声保持可听；四层全换、快速反向切换、连续拥塞不重置最早淡出计时、无幽灵源，且无全部增益归零的空档。
- [ ] seed随机测试雷20–60s、声晚1–4s、最低1s闪间隔、退出/隐藏取消、reduced-motion无闪声仍可用；素材未就绪不发可听雷事件，雷的稳态预留与总源≤6均满足。拥塞回收完成后再确定flashAt/thunderAt，不能闪光后排队破坏延迟。
- [ ] Run `pnpm test -- src/audio/__tests__/mix.test.ts src/audio/__tests__/scheduler.test.ts src/audio/__tests__/thunder.test.ts` 预期FAIL；实现纯规则及可注入调度器。
- [ ] 重跑同组PASS，typecheck通过；提交单元 `feat(audio): schedule environment layers and shared thunder events`。

### Task 10: 单Web Audio总线、手势解锁、设置与试听入口

**Files:** 创建 `src/audio/{engine,browser,preview}.ts`、`__tests__/{engine,browser}.test.ts`、`src/ui/AudioPreview.tsx`；修改 `src/sound.ts`、main、SoundButton、EnvironmentPanel、AudioCredits、resources、DESIGN.md。

**Interfaces:** `createAudioEngine(deps): AudioEngine`提供unlock()/applyMix(target)/setSpace(space)/setPreferences(prefs)/playEffect(name)/setVisible(visible)/dispose()；保留 `playRoomSound(name)` 同步调用签名，内部队列用同一context。AudioPreferences含muted/ambienceEnabled/effectsEnabled/ambienceVolume/effectsVolume。

- [ ] 先写失败测试：导入/首屏0 context与0 manifest/audio fetch；首有效手势仅1context，交互同次点击可播放；首层解码后3s淡入，已静音刷新/换天不自动开；audio失败静默跳过。
- [ ] 测试共享下载/解码去重、最多6buffer LRU，播放中/淡出中的buffer受保护；预算满时新解码排队且保留其对应旧层发声，不能硬停在播源以驱逐缓存。检查停止断连与dispose；室内外filter/gain≤1.5s，近窗雨不双重低通；effects独立音量与master静音。
- [ ] 测试后台1s淡出再suspend，rapid hide/show取消旧suspend；恢复仅已解锁且允许时resume，退出雷暴取消已排雷；所有偏好storage异常可用。
- [ ] Run `pnpm test -- src/audio/__tests__/engine.test.ts src/audio/__tests__/browser.test.ts` 预期FAIL；实现动态engine、保留手势内同步resume的轻量bootstrap，sound.ts移除顶层HTMLAudio。
- [ ] 更新DESIGN的Sound/Don't、YAML全部音量/时间/滤波令牌、HUD规则与已实现说明；致谢显示真实来源链接，并覆盖新词典key测试。bakeReference不开新环境音流程。
- [ ] 浏览器实际试听黎明→白天→黄昏→夜晚、晴→小雨→雷暴/大风、室内↔室外；Chrome Network验证首交互前0音频、只加载需要层，Audio图/调试计数分别验证稳态≤4层、含淡出总源≤6。快速连切触发拥塞时，验证最早淡出源≤500ms回收、替换仍等功率重叠且无音量空档。
- [ ] 提供本地可直接试听的预览地址（优先可复现的`?audioPreview=1`），录屏可用时附录屏；记录设备/URL/缺素材与听感，检查点击猫/灯/日记/翻页/电脑原效仍可听。
- [ ] 全部必要检查通过；提交单元 `feat(audio): connect gesture-gated ambient and interaction audio`。
- [ ] 已由作者“直接完成所有阶段”覆盖；提供试听入口供交付后体验。

## 阶段 5：可替换示例世界；完成后必须停下看图

### Task 11: 岛、日月天空和五个完整主题

**Files:** 完善 `src/world/{WorldScene,WorldCamera,Island,House,Vegetation,SeasonalProps,Sky}.tsx`、`src/world/resources.ts`；创建 `src/world/themes.test.ts` 与 `src/world/resources.test.ts`；修改 `src/env/solarTermThemes.ts` 和 `src/i18n/resources.ts`。

**Interfaces:** WorldScene入口契约不变；`getWorldTheme(termId: string): SolarTermTheme`只取数据；world-owned资源集中登记dispose，房间共享资源不登记；扩展子group只作为未来角色挂点。

- [ ] 先写失败测试：24主题均可解析、5专属/19通用、夏至荷花/萤火虫/夏虫、冬至无自动雪；极昼夜天空无NaN，月亮低于地平线不强行显示；owned资源dispose一次，共享资源不dispose。
- [ ] Run `pnpm test -- src/world/themes.test.ts src/world/resources.test.ts` 预期FAIL；代码建低饱和圆角岛/小屋/池塘/路/树草/路灯/凳/邮箱/路牌，切面使用scene-cut，窗位复用room锚点。
- [ ] 实现连续渐变天空、日月真实方位、月相、星星、夜窗暖光/路灯；云与阴天光饱和度按天气；五主题按配置生长/小物/装饰粒子，季节不制造天气。
- [ ] 邮箱复用site联系方式、路牌施工中、屋门返回；每个Interactive具备标签/点击反馈/现有CC0交互音；小幅旋转缩放禁底部。
- [ ] 浏览器逐主题/昼夜/zh-en/窄屏验证，世界声音读同一store，无新增音频系统；单测/typecheck/build通过；提交单元 `feat(world): build seasonal island and continuous local sky`。

### Task 12: 天气、性能降级、截图矩阵

**Files:** 创建 `src/world/{WeatherEffects.tsx,surfaceMaterial.ts,quality.ts,quality.test.ts}`、`scripts/screenshot-world-matrix.mjs`；输出 `docs/verification/open-world/world-matrix/` 图与URL清单。

**Interfaces:** WeatherEffects读取`sampleTransition`的连续权重与ThunderEvent；`updateQuality(samples: FrameSample[], previous: QualityState, nowMs: number): QualityState`；每种粒子单实例化绘制，默认雨6000/雪4000、上限15000。

- [ ] 先写失败测试：持续两窗5s<40fps降档/10s冷却、≥55fps30s恢复、粒子≤15000；359→1风向短弧和气象来向转换，雪仅真实/手动snow增长，reduced-motion禁闪。
- [ ] Run `pnpm test -- src/world/quality.test.ts` 预期FAIL；实现GPU雨/雪、云雾、湿表面/涟漪、朝上面雪shader、风吹草树/碎屑，避免每帧React更新或重新分配大数组。
- [ ] 接共享雷事件低幅闪光、20–60s雷节奏，离开/隐藏清理；reduced-motion同时减少装饰摆动、粒子动态幅度，不影响环境事实展示。
- [ ] Chrome预热10s采样30s，晴/雨/雪/雷暴逐项检查≥50fps、全pass≤150draw、4s切换连续；不达标先优化/减粒子，不以关闭天气掩盖。
- [ ] 固定坐标/日期/种子，从天文结果选dawn/day/dusk/night时刻；输出24天气图+5节气图与29图总览，保存每个完整URL（search在Hash前），大风用weather=clear&wind=18。
- [ ] 全检查通过，提交单元 `feat(world): add weather effects and adaptive quality`。
- [ ] 已由作者“直接完成所有阶段”覆盖；交付29图总览与原图。

## 阶段 6：原房间窗景与室内环境

### Task 13: 房间环境适配而不改模型或烘焙

**Files:** 创建 `src/scene/RoomEnvironment.tsx`、`src/scene/roomMode.ts`、`src/scene/roomMode.test.ts`；修改App、Room、HybridTrialLayers/BakedTrialLayers的窗景/激活接线、windowAnchors；追加DESIGN/双语必要规则。

**Interfaces:** `resolveRoomMode(phase: DayPhase, manual: RoomMode | null, reference: RoomMode | null): RoomMode`；RoomEnvironment读取全局environment与既有窗锚点，mount时保存旧window sky/moon/city可见性与材质、unmount恢复，不更改GLB/atlas/烘焙算法。

- [ ] 先写失败测试：dawn/day→day、dusk/night→night、manual优先、followReal清覆盖、bakeReference旧mode/lamp参数优先且不随时钟变；台灯覆盖独立。
- [ ] Run `pnpm test -- src/scene/roomMode.test.ts` 预期FAIL；实现模式输入和独立窗景，新增玻璃雨丝/水珠、窗外雪雾/日月/天空，避免旧sky叠画。
- [ ] 浏览器对照原基线的day/night×lamp on/off、默认/ hybrid/trial/live/reference，验证日记/电脑/猫/灯与语言仍正常，窗户点击能出去。
- [ ] 听验室内滤波-8dB/1200Hz、近处窗雨/屋内风，以及回世界1.5s平滑恢复；世界场景离开没有残余雷/粒子。
- [ ] 检查模型、bake-room/bake-hybrid/bake-trial贴图无diff；必要测试/typecheck/build通过，提交单元 `feat(room): follow environment through window and indoor audio`。

## 阶段 7：完整验证与预览交付

### Task 14: 回归、性能证据和预览版本

**Files:** 创建 `scripts/measure-bundles.mjs`、`docs/verification/open-world/{baseline,performance,acceptance}.md`，更新README、docs/i18n.md；只在预览配置确实需要时修改wrangler预览设置。

**Interfaces:** measure-bundles统计进入room首次自动请求JS的gzip合计，不只入口chunk；输出baseline/current/delta/target。浏览器性能记录全pass renderer统计、帧时间、粒子、GPU数、音频网络、Worker热命中server时间与网络TTFB。

- [ ] 对照设计逐项审查覆盖和作者两次gate反馈，记录所有未达到项，不能将未测写成通过。
- [ ] Run `pnpm typecheck`、`pnpm test`、`pnpm build`、`git diff --check`；预期全部exit0；保留已有大chunk告警，不把它描述成新错误。Worker dry-run通过。
- [ ] 用同版本Chrome在作者Mac冷缓存记录旧基线和新版本room JS；构建参考旧341.16+83.59≈424.75kB，但浏览器对照需另测旧commit，禁止把构建估计当实际网络值。确认增量≤30KB、world首入才加载、首手势前声音0。
- [ ] 晴/雨/雪/雷暴预热10s采样30s；记录≥50fps、≤150draw、≤15000各类粒子、低帧率自动降级；往返10次GPU对象回落。音频逐条≤1.2MB/合计≤10MB，稳态≤4层/含淡出总源≤6、拥塞回收≤500ms、等功率交叉无音量空档及后台无播放。
- [ ] 逐路由/双语/存储禁用/网络失败/CF无位置/URL优先级/一键恢复/键盘/长英文/375px/reduced-motion测试；Console无新增错误，网络失败是受控fallback而非未捕获异常。
- [ ] 更新README与docs/i18n.md：静态站已增加同源Worker、依赖/本地mock/隐私/署名/参数/5主题/音源获取与停止点，移除“部署仅dist即可”的过时说明。
- [ ] 用Cloudflare现有项目上传**预览版本**（执行前核对Wrangler当前preview/version命令与账户权限），不promote、不deploy到生产。预览内验证`/api/env`与静态声音资源，同源/回退正常，提供可访问URL。
- [ ] 交付性能表“改动前/改动后/目标/测量方法”、29图总览、试听入口、检查结果和局限；提交单元 `docs(world): document verification and preview deployment`。

## 执行记录与计划自审

阶段0–6的功能实现已完成，阶段7的自动测试、构建、同源Worker联调、截图矩阵、资源往返与预览上传已执行。最终证据与尚未覆盖的验收项统一见 [交付报告](../../verification/open-world/final.md)。本计划保留原始细粒度验收清单；未打勾项不得解读为已测试。无提交、推送或生产部署。
