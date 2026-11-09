# 房间 + 外面的世界：环境系统设计

**状态：整体方案已确认；阶段 1 已完成并验证，阶段 2 尚未开始。**
**日期：2026-11-08（Asia/Shanghai）**
**基线：`a98bc01`，本地目录 `room-blog`，Cloudflare 项目名 `cian-world`。**
**配套计划：** [实施计划](../plans/2026-11-08-open-world.md)

## 目标、边界与确认记录

把当前房间扩展成可以往返的房间与室外示例。先做好可复用的时间、天气、节气与实录声音系统；示例岛是其消费者，以后可以整体换掉。房间、世界和声音读取同一份环境状态，天气不由节气生成。

阶段0的方案与计划已获作者确认；作者本轮授权完成阶段1并交付验证结果，完成后停止。后续依次执行阶段2–7，并在声音试听（阶段4）、世界视觉（阶段5）暂停确认。预览部署属于阶段7，不发布生产版本。

作者在本轮补充：完整主题由四个增加为 **立春、清明、夏至、立秋、冬至五个**；其余 **19 个**使用季节通用主题。夏至有荷花、夜间萤火虫、白天夏季虫鸣与蝉鸣，卡片体现白昼最长的寓意。实际昼夜仍按所在地计算，卡片明确这是北半球节令，不能让南半球访客误以为当地白昼最长。

作者随后确认声音并发规则：**稳定状态最多 4 个声层；过渡期间淡出的声层不计入这 4 个，环境音源总数最多 6 个。所有切换使用等功率交叉淡化，不采用先淡出再淡入。若加入新源会超过 6 个，最早开始淡出的声层须在 0.5 秒内加速淡出结束，再开始新的淡入。** 此规则替代原任务中“最多 4 层，包含淡出中的层”的限制，也替代此前待确认的分段淡出入建议。

不做角色控制、自由行走、多区域地图、房间重建、重烘焙、模型替换、主版本升级。保留日记、RoomOS、语言切换、交互音效及全部烘焙试验入口。

## 仓库现状与接入点

- `src/route.ts` 用 Hash + `useSyncExternalStore`；目前只有 room/diary/computer，没有路由测试。
- `src/App.tsx` 持有日夜模式，普通访问默认 day；全局 Esc 直接返回房间，需要改为先关闭最上层面板。
- `src/scene/Experience.tsx` 拥有 Canvas；Room 与 CameraRig 常驻。RoomOS DOM 位于 ComputerScreen 内，不能因语言或日记切换重建。
- 默认是 `public/bake-room/` 三层烘焙；`?bake=hybrid`、`?bake=trial`、`?bake=live`、`?cam=reference&mode=...&lamp=...` 均须保留。HybridTrialLayers 自己管理背景、灯光、曝光及后处理，不能让室外渲染器与其同时接管 Canvas。
- `Interactive` 把 active 写死为 room；它实现悬停/点击包装，音效目前由调用者触发。新增允许 world 的显式参数，原调用默认行为不变。
- `src/sound.ts` 在模块导入时创建五个 HTMLAudioElement；后续保留 `playRoomSound(name)` API，内部改接单一 Web Audio 总线。
- 双语词典在 `src/i18n/resources.ts` 同步加载；已有 key/插值一致性测试和语言选择器键盘测试。语言切换保留其他 query、Hash、history.state。
- `wrangler.jsonc` 目前仅声明 `assets.directory = ./dist`；没有 Worker、Wrangler 本地依赖或服务端类型检查。
- `DESIGN.md` 的规则部分包含尚未实现的意图，Known Gaps 也可能过时；以当前代码为实现基线，遵守其视觉令牌。本次只在后续对应阶段更新新增能力涉及的规则。

## 方案比较与建议

| 方案 | 收益 | 代价与结论 |
| --- | --- | --- |
| 纯 TS 核心 + 外部 store + 独立消费者（建议） | 可离线测试，React/R3F/Web Audio 共用状态，世界可替换 | 要明确数据来源、时钟和资源所有权；符合作者核心原则 |
| 全部塞进 React Context 与场景组件 | 初期接线较少 | 无法让纯模块、Worker、声音独立复用；排除 |
| 引入大型世界引擎、状态框架或完整天文套件 | 有现成能力 | 首屏预算与现有烘焙兼容成本高，本期不需要；排除 |

作者已确认采用该方案；本轮实现范围仅限阶段1。

## 文件结构与依赖

```text
src/env/
  types.ts                 # 作者指定的 EnvironmentState 与纯输入类型
  astronomy.ts             # 日月位置、阶段、连续 dayProgress
  clock.ts                 # UTC instant、展示时区、手动墙钟时间转换
  solarLongitude.ts        # Meeus 视黄经与节气时刻求根
  solarTerms.ts            # 24 项双语元数据（无 React/three）
  solarTermThemes.ts       # 24 项纯数据主题、5 项完整主题
  weather.ts               # WMO 映射与参数归一化
  overrides.ts             # URL/手动配置验证与逐字段优先级
  resolve.ts               # resolveEnvironment(input): EnvironmentState
  transition.ts            # 4 秒视觉/混音输入插值，纯数值
  store.ts                 # 无 React 的可注入 store
  browser.ts               # storage、生命周期、同源 API 接线
  useEnvironment.ts        # 唯一 React 适配层
  __tests__/               # astronomy/clock/terms/weather/priority/store
  __fixtures__/            # HKO 2026/2027 独立权威样本
shared/env-api.ts           # JSON DTO 与运行时解析；只含传输契约
worker/{index,env,weather}.ts
worker/env.test.ts
dev/{envMock,envMockPlugin}.ts
src/audio/
  types.ts                 # clip/layer/混音目标
  mix.ts                   # 纯函数：环境 + 室内外 → 不超过 4 个目标
  scheduler.ts             # 稳态4层/总音源6个调度、等功率交叉淡化
  engine.ts                # 单 AudioContext、总线、缓存与释放
  browser.ts               # 首次手势、可见性、设置
  thunder.ts               # 共享雷电事件、可注入随机数/计时器
  __tests__/               # 混音/生命周期/并发/事件
src/world/                 # 整个目录只经动态 import 进入
  WorldScene.tsx           # 唯一替换入口
  WorldCamera.tsx
  Island.tsx / House.tsx / Vegetation.tsx / SeasonalProps.tsx
  Sky.tsx / WeatherEffects.tsx / surfaceMaterial.ts
  quality.ts / resources.ts
src/scene/RoomEnvironment.tsx
src/scene/windowAnchors.ts
src/ui/{EnvironmentCapsule,EnvironmentPanel,SoundButton,SolarTermCard,AudioCredits}.tsx
src/ui/{SceneTransition,OverlayHost}.tsx
scripts/audio/{prepare.sh,clips.json}
scripts/{measure-bundles,screenshot-world-matrix}.mjs
public/sounds/ambience/{manifest.json,*.m4a}
assets/audio/raw/           # 不进 Git
docs/verification/open-world/ # 基线、试听、截图矩阵、实测报告
tsconfig.worker.json / tsconfig.tools.json
```

测试与模块同责任组织；不得从 `src/env` 的纯入口重新导出 React hook、浏览器单例或 three。天文、天气、节气元数据也可被 Node 测试直接导入。

新增运行时依赖建议只有 **SunCalc**：采用实施时核对的固定版本，为太阳/月亮位置和月相服务，适配层输出度数与正北顺时针方位。当前上游主分支为 2.1.2、BSD-2-Clause、含类型；不能套用旧版弧度/朝南方位约定。锁定实际 npm 版本后写独立方位测试并登记许可证，不额外安装不匹配的 `@types/suncalc`。节气时刻由独立 Meeus 模块计算，不能拿低精度月相/日出算法代替节气算法。[SunCalc 源码与接口](https://github.com/mourner/suncalc)、[许可证](https://github.com/mourner/suncalc/blob/master/LICENSE)

开发依赖新增 Wrangler 4（支持选择性路由，最低 4.20）及其生成的 Worker 类型；必要的 Node 类型只进入工具 tsconfig。ffmpeg/ffprobe 是本机工具。沿用 Vitest/jsdom；不新增状态管理、路由、音频、日期或后处理框架。阶段 0 不安装依赖。

## 环境契约与时钟

保留作者指定的 `EnvironmentState` 字段和类型：

```ts
type DayPhase = 'night' | 'dawn' | 'day' | 'dusk'
type WeatherKind = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog'
  | 'drizzle' | 'rain' | 'thunderstorm' | 'snow' | 'sleet'
interface EnvironmentState {
  time: Date
  sun: { altitude: number; azimuth: number }
  moon: { altitude: number; azimuth: number; phase: number }
  phase: DayPhase
  dayProgress: number
  weather: {
    kind: WeatherKind; intensity: number; cloudCover: number
    windSpeed: number; windDirection: number; temperature: number | null
  }
  solarTerm: { index: number; id: string; startedAt: Date; nextAt: Date }
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  location: { city: string | null; latitude: number; longitude: number; approximate: true } | null
  source: { weather: 'live' | 'manual' | 'url' | 'fallback'; time: 'live' | 'manual' | 'url' }
}
```

`Date` 表示绝对时刻，本身不携带当地时区。展示时区和 freshness、字段来源等放在独立 `EnvironmentStatus`，不偷偷改变上述契约。

```ts
interface ClockContext { timeZone: string; deviceTimeZone: string }
interface EnvironmentOverrides {
  date?: string; time?: string; weather?: WeatherKind; intensity?: number
  wind?: number; term?: string; coordinates?: { latitude: number; longitude: number }
}
type ManualEnvironment = Pick<EnvironmentOverrides, 'date'|'time'|'weather'|'intensity'|'wind'|'term'>
interface EnvironmentInput {
  now: Date; clock: ClockContext; live: EnvResponse | null
  manual: ManualEnvironment; url: EnvironmentOverrides
}
resolveEnvironment(input: EnvironmentInput): EnvironmentState
createEnvironmentStore(deps: EnvironmentDependencies): EnvironmentStore
interface EnvironmentStore {
  getSnapshot(): EnvironmentState
  getStatus(): EnvironmentStatus
  subscribe(listener: () => void): () => void
  setManual(patch: Partial<ManualEnvironment>): void
  followReal(): void
  refresh(): Promise<void>
  start(): () => void
}
useEnvironment(): EnvironmentState
```

稳定快照只在真实变化时替换，外部不得原地修改 Date 或对象。store 注入时钟、取数、storage、计时器和可见性；导入纯模块不读 window、不起定时器。浏览器 start 幂等且有清理，兼容 StrictMode/HMR。

### 昼夜与无位置兜底

- 有位置：绝对时刻 + 取整经纬度算日月。阶段用太阳中心高度；`< -6°` night，`[-6°, 6°]` 按上升/下降判 dawn/dusk，`> 6°` day。用太阳时角/高度变化判断上午下午，不用设备时区的 12 点截断。
- 无位置：location 保持 null。用设备当地年月日时分，在广州默认坐标 `(23.13, 113.26)` 对应的 UTC+8 墙钟下构造**只给日月计算的替代时刻**，避免伦敦设备中午却用广州真实经度算成夜晚。状态 time、真实节气时刻不被这个替代时刻改变。
- `dayProgress` 是连续太阳日相位：太阳下中天 0、上升段约 0.25、上中天 0.5、下降段约 0.75、再到下中天 1。基于时角而非有无日出，因此极昼/极夜也有定义。天空取循环关键帧并叠加高度权重，0/1 色值相同；一分钟更新之间在渲染适配器插值，不能在阶段边界换整张背景。
- 太阳/月亮低于地平线时隐藏天体，方向光按高度衰减；没有可见月亮也不能把地平线下的月亮抬上天空。月相 0 新月、0.5 满月。
- 展示优先用有效 CF timezone，无效则设备时区；显式坐标时改用其网格时区，详见Worker规则。URL/手动 time 是该展示时区的墙钟；date 指同一时区日期。只有date时固定日期、时分继续跟随当前当地墙钟；只有time时固定HH:mm/秒归零，日期跟随当前当地日期；date+time同时出现时冻结完整时刻，截图应同时指定。DST 重复时间取较早时刻，缺失时间推进到下一个有效分钟；相关规则固定测试，不能依赖运行测试的宿主时区。

### 节气

按太阳视黄经每15°求根，立春index0、315°，春分0°。阶段1实测Meeus双体简式未达分钟门槛，现使用130项IMCCE VSOP87D地球黄经周期系数，并按Meeus补TT/UTC、ΔT、光行差/章动修正，角度跨360°时先展开。根区间跨年，不靠固定公历日期判断。计算结果缓存在内存的年度表中，离线可用，无网络历法服务。

真实节气在交节**时刻**切换，不提前到当天 00:00；格式化/年度日期比较统一 Asia/Shanghai。相同真实时刻所有访客一致。URL date/time 是显式模拟，会改变节气计算时刻；无位置兜底的天文替代时刻不会。term 单独覆盖只换节气与主题，不改日期、太阳、天气；startedAt/nextAt 指该节气在生效时刻之前最近一次实际出现的区间，UI 标明“手动/预览节气”。

元数据含稳定 id、中文/英文含拼音名、季节、黄经、双语一句文案、visualThemeId、soundThemeId，可选三候。24 id 依次为：
`lichun yushui jingzhe chunfen qingming guyu lixia xiaoman mangzhong xiazhi xiaoshu dashu liqiu chushu bailu qiufen hanlu shuangjiang lidong xiaoxue daxue dongzhi xiaohan dahan`。
index 0–5 春、6–11 夏、12–17 秋、18–23 冬；春雨声音特例为 qingming/guyu。

验收分两层：2026/2027 **48 个北京时间公历日期全部与权威样本一致**；另以天文台有时分的样本检查误差 ≤5 分钟。日期测试不能证明分钟精度；精度不达标就补充 Meeus 周期修正再验，不能放宽断言或用固定两年表代替算法。阶段1已通过上述48个日期和24个时分样本，最大时分误差33.682秒；不将该结果外推为其他年份的已验证精度。

独立样本来源：[2026 年历表](https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2026e.pdf)、[2027 年历表](https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/2027e.pdf)；带时分的 [2026 中气表](https://www.hko.gov.hk/en/gts/astron2026/files/2026SolarTerms24.pdf)、[2027 中气表](https://www.hko.gov.hk/en/gts/astron2027/files/2027SolarTerms24.pdf)。后两表各只有 12 个中气，不能误称含全年 24 项时分。fixture 手工转录并记录来源、时区与核对日期，不从待测算法生成。

### 天气映射、覆盖与渐变

WMO 映射按明确存在的代码测试，而非把所有范围内整数当有效代码。0 clear；1/2 partly-cloudy；3 cloudy；45/48 fog；51/53/55/56/57 drizzle；61/63/65/66/67/80/81/82 rain；71/73/75/77/85/86 snow；95–99 按需求兼容为 thunderstorm（当前文档列出 95/96/97/99，98 作为兼容输入）。冻雨不擅自改成雨夹雪；sleet 是手动/URL 可选种类。[天气 API 与代码表](https://open-meteo.com/en/docs)

默认强度表为：clear/partly-cloudy/cloudy 0；fog 45=.5、48=.8；drizzle 51/56=.2、53=.4、55/57=.6；rain 61/66/80=.3、63/81=.6、65/67/82=1；snow 71/77/85=.3、73=.6、75/86=1；thunder 95=.6、96=.75、97/98=.9、99=1。使用实测 cloud_cover/100、wind_speed_10m（m/s）、wind_direction_10m；数值归一化/截断，异常代码或非法必需字段使 weather 无效并兜底。precipitation 用于一致性/未来扩展，不在本期用它覆盖代码强弱。

来源逐字段合并：有效 URL > 有效手动选择 > 有效 live > 默认。weather=rain 单独出现时使用该种类的手动预设强度/云量，不继承晴天的零雨量；intensity/wind 可单独覆盖。lat/lon 必须成对且有限、合法，使用前取整；只改变位置和天文，不凭空更改天气。为该位置取天气时仍经同源 `/api/env?lat=...&lon=...`。

手动预设（intensity/cloudCover）：clear 0/.05、partly-cloudy 0/.35、cloudy 0/.9、fog .6/.8、drizzle .3/.9、rain .6/1、thunderstorm .8/1、snow .6/.95、sleet .6/1；无来源默认 clear、风 0、温度 null。风向做最短圆弧插值，不能从 359° 绕一圈到 1°。

URL 只解析 search，不把 Hash 当查询串；验证 HH:mm、1900–2100范围内的真实 YYYY-MM-DD、有限数值和稳定 term id，坏字段逐个忽略。ManualEnvironment 持久化只有版本、日期/时间、天气、风和节气选择（日期用于24:00滑块的次日端点），不保存位置；try/catch 包裹 get/set/parse。恢复跟随真实会清空这些手动字段、房间日夜覆盖及**环境 URL 参数**，保留 lang/bake/cam/lamp、Hash、history.state。若保留 URL 参数，界面会假装已恢复，因此必须明确清掉。

source.weather/time 保留契约中的总体来源；`EnvironmentStatus.fieldSources` 解释混合来源，另含 timeZone、fetchedAt、stale/error。网络失败立即进入晴天 fallback，保留当前有效城市作天文输入但不标 live。成功响应 15 分钟后视为过期，重新请求失败不无限保留旧雨；不缓存位置到 localStorage。

时间每分钟重算；另安排下次交节边界一次性更新。天气每 15 分钟刷新。页面隐藏清掉轮询并中止在途请求；恢复时立即重算时间，过期才取天气。请求序号防止旧响应覆盖新 URL/手动状态。4 秒纯数值过渡层在 store 目标状态之外，连续混合 rain/snow/fog/cloud/wetness 权重；kind 保持语义枚举，不能直接把枚举“插值”。积雪只有 snow 激活时增长，退出雪后平缓融去；节气不创建积雪。

## Worker、隐私与离线开发

```ts
interface EnvResponse {
  location: { city: string | null; latitude: number; longitude: number; timezone: string } | null
  weather: {
    code: number; isDay: boolean; temperature: number; cloudCover: number
    precipitation: number; windSpeed: number; windDirection: number
    sunrise: string | null; sunset: string | null
  } | null
  fetchedAt: string // UTC ISO；缓存命中保持天气原始取数时刻
}
```

正常缺位置/上游失败返回 200 + weather:null；未知 `/api/*` 返回 JSON 404，非 GET 405。lat/lon 错误返回 JSON 400，客户端兜底；不把第三方报错栈传给访客。CF 缺 city 可保留 null；没有合法坐标则 location/weather 都为 null，不请求上游。

处理顺序：读取 request.cf，立即将坐标 round 到 0.1°；URL 坐标入口亦先取整；后续请求、DTO、cache key 只使用取整值。原 IP 不读取、不写日志。缓存只存按坐标分桶的天气、由网格确定的 timezone 和 fetchedAt，**不存 city、IP 或访客响应**；相同坐标不同城市名的访客不会读到他人的 location。使用显式 URL 坐标时 city=null，timezone 用上游按网格返回的有效 IANA zone；上游失败时回 UTC，不继承 IP 的城市/时区。普通 CF 模式用有效 CF timezone，无效再用网格 zone/UTC。发给浏览器的响应 `Cache-Control: no-store`。

上游请求固定 HTTPS host/path，禁止传任意 URL：current 为 `weather_code,is_day,temperature_2m,cloud_cover,precipitation,wind_speed_10m,wind_direction_10m`；daily 为 `sunrise,sunset`；`wind_speed_unit=ms&temperature_unit=celsius&forecast_days=1&timezone=auto&timeformat=unixtime`。日出日落取网格所在地的当天，用 epoch 解析成 UTC ISO；timezone=auto 由已取整坐标确定，因此天气 cache key 不依赖访客城市或 CF timezone。DTO 的 cloudCover 已在服务端除100成为0–1，windSpeed为m/s、precipitation为mm、temperature为°C；core的 WeatherObservation 接收相同归一化单位，不能再除100。太阳位置始终由核心算，日出日落为空不影响极地使用。超时 4 秒；服务端 Cache API 有效期 900 秒，成功才缓存、错误不缓存，通过 waitUntil 完成写入。缓存是边缘节点本地的，不承诺跨数据中心共享。[Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)

配置提案：`main: "worker/index.ts"`，现有 assets.directory 保留，增加 binding `ASSETS` 和 `run_worker_first: ["/api/*"]`。Hash 路由无需新增 SPA rewrite；非 API 请求沿用静态资产路径，Worker 非 API 防御分支委托 `env.ASSETS.fetch(request)`。不把所有静态文件都送进 Worker。[选择性路由](https://developers.cloudflare.com/workers/static-assets/binding/)、[request.cf 地理字段](https://developers.cloudflare.com/workers/runtime-apis/request/)

不开应用访问日志或包含位置的 analytics；核对现有 Worker observability 配置。界面承诺“本站不持久保存个人位置；仅短暂缓存约 10 公里网格天气”，不夸大为第三方基础设施从不处理网络地址。

`pnpm dev` 加 Vite middleware，默认固定 Guangzhou clear-day，支持 `?mock=rain-night`、`?mock=gale-day`、`?mock=snow-night`、`?mock=offline`。前端只在 DEV 转发 mock；mock fixture 可附 `simulationTime`，由 dev adapter 转成最低优先级时钟输入，生产 DTO 不含该字段。网络完全断开也能调试。另提供 `pnpm dev:worker` 检查实际 Worker；不引入 Cloudflare Vite plugin 改造现有构建。

可选“精确位置”本期建议暂不做：不是核心验收必要项，省去与 approximate:true 契约冲突。如以后加入，只有点击时请求权限，回调立即取整且只留会话内存，不回显或持久化原始 GPS 坐标。

Open-Meteo 数据需要 CC BY 4.0 署名；免费服务本身另有限额和非商业用途限制。当前个人博客按非商业使用设计，若用途变化再选商业 API 配置，不在本次接入付费服务。[条款](https://open-meteo.com/en/terms)

## 路由、场景生命周期与贴纸 UI

`View` 加 world，`#/world` 可直达/刷新/后退。现有路由行为保留，畸形 slug 不得令 parseHash 抛异常。单 Canvas 中通过 lazy import `src/world/WorldScene.tsx`；只在第一次真正导航 world 时请求世界代码/资源，不预取世界。WorldScene 只消费环境、转场上下文和回房间回调，未来角色扩展留一个普通子 group，当前不添加控制器。

为保留现有台灯/RoomOS/相机状态，房间子树进入世界时保留于不渲染、不拾取的分组；房间的相机和渲染接管 effect 暂停且保存/恢复 scene/background/environment/exposure。Three分组visible=false不会自动保证drei Html门户DOM隐藏，ComputerScreen/猫气泡须显式隐藏DOM并禁指针，Desktop仍保持挂载；房间useFrame、非hybrid灯光也须停用。HybridTrialLayers 必须提供 active 生命周期控制，暂停 composer 和灯光驱动；不复制烘焙算法。world 离开后卸载并释放其拥有的 geometry/material/texture/targets/instance buffers 与事件；不释放房间或 loader 的共享资源。世界只复用无全局 GPU 单例的工具，不直接 import 当前 parts.tsx 的顶层 gradientMap。

转场选择简单纸色遮罩淡出/淡入：300ms 出、遮罩中交换可见场景、300ms 入，通常 600ms，总长最多 1.5s；首次 chunk 未就绪时在 ≤1.5s 后结束为静态加载状态，不无限延长动画。加载失败显示重试/返回房间双语按钮。reduced-motion 用 ≤200ms 的淡出入，不飞镜头。音响室内外在场景交接点启动 ≤1.5s 过渡。

保留日记、电脑的返回按钮和语言控件；room/world 增加“出去走走/回房间”按钮。窗户加独立可点击代理，位置从已有 GLB 标记/包围盒验证后记录在 windowAnchors，不移动模型。世界屋门也用 Interactive；邮箱打开联系方式（复用 site 资料），路牌打开施工中提示。新物件交互仍有悬停、点击反馈和现有 CC0 点击音效。

新增小胶囊与声音按钮：纸色、深棕 2px 描边、硬阴影、胶囊圆角；HUD 不挤占模型。移动端至少 44px 命中，长城市名省略、完整 aria-label；环境胶囊示例可拆成语义字段，每个字段开头图标，避免违背单条文案一个 emoji 的规范。主强调黄同屏至多两处。

环境面板：跟随真实、0–24h 时间滑块（步长 1 分钟，24:00 归次日 00:00）、九天气选项、风速 0–40m/s、24 节气、环境声音开关/音量、交互音效开关/音量、天气署名/隐私和声音致谢链接。跟随真实为开时，动任意手动控件转为关；再次开清空模拟覆盖。URL 生效时标明预览状态。日期通过 URL 模拟，本期不额外加日期选择器。

OverlayHost 统一 Esc 优先级：最上层语言菜单/致谢/环境或世界面板先关闭并返回焦点；第二次才 world→room，diary/computer 仍按既有路径返回。全局处理检查 defaultPrevented，避免同一次 Esc 关闭菜单又导航。所有面板键盘可用、可滚动、焦点可见；模态有 focus trap，关闭恢复触发点。bakeReference 模式隐藏新 HUD，不启动实时数据/环境音/自动模式，保持旧参考参数可复现。

所有新完整句子、aria/title、天气/节气名称与说明进 resources.ts；纯节气数据中的双语文案同步投影到词典，不维护两份不同内容，测试对应。节气卡显示 6 秒且不抢焦点，aria-live=polite；以 term id 记已见（24 个，一生效 id 只显示一次），storage 禁用时退到会话内存。URL 手动预览不污染真实已见记录。

## 声音：素材、混音与播放生命周期

### 素材与处理

只使用作者列出的真实 CC0 实录，阶段 4 下载前再次打开来源页核对，记录名称/作者/URL/授权/用途/剪辑起止/交叉淡化/处理参数；未取到文件不能登记成已下载。Freesound 登录受阻就生成 `assets/audio/DOWNLOADS.md`，列文件名/链接/目标 raw 路径给作者；不绕过登录，不换成合成声或未核对试听。此处素材是计划输入，本轮没有宣称逐页复核或试听完成。

配置覆盖 dawn-birds、day-country、dusk-birds、night-field、summer-day、summer-night、rain-gentle、rain-spring、rain-window、wind-strong、wind-gale、wind-indoor、thunder-01。备选 Night Ambience 仅在主素材不适用时启用；不为备选多下载/输出一套。

`prepare.sh` 读取 clips.json，检查 ffmpeg/ffprobe，从 raw 剪干净 60–90s（本身只有 11s 的窗雨保留短循环），2s 首尾等功率交叉淡化并重排成真正可循环片段。人工听循环至少三遍；算法有淡化不等于素材无接缝。配置记录原始截取区间、目标响度、循环处理、声道与源 id，清理缓存后可重复运行。

循环目标 -26 LUFS、雷单次 -20 LUFS，现有交互 -18～-14 LUFS；双遍 loudnorm，真峰值 ≤-1 dBTP。AAC m4a 立体声 96–128kbps，通常先用 60s/96kbps控制 13 条总预算；单条 ≤1.2MB、总计 ≤10MB（按十进制计）。thunder 从指定实录截取一声，不把含雷长循环再当普通雨层叠加；检查片段前后避开额外雷声。

manifest 每条含 id/file/role/duration/loopStart/loopEnd/defaultGain/sourceId/bytes；循环点使用处理后 PCM 的秒数，不以 AAC 容器时长推断，解码后验证编码 priming 和尾部间隙。raw 进 .gitignore，成品与来源记录入库，不从远端 CDN 播放。

### 混音规则、四个稳态声层与六个音源上限

同一 AudioContext：环境源 → 各 GainNode → 户外滤波/增益总线或室内近处总线 → ambienceGain → master；交互源 → effectsGain → master。室内户外总线低通 1200Hz、Q=.7、-8dB（线性约 .398）；室外低通 18000Hz、0dB。雪天上限 1800Hz；室内再取更低值。近处窗雨/屋内风不重复经过“隔墙”滤波。

默认 ambience 音量 .25、effects .7、master 1；各 clip 默认基准 gain：dawn .35/day .25/dusk .3/night .25、summer .22、rain .45/window .25、strong-wind .4/gale .3/indoor-wind .3、thunder .5。实际由 mix 输出权重相乘，必要时限总增益。作为本方案建议值，试听 gate 可调。写入 DESIGN.md 的 YAML：层默认音量、4000ms 天气淡化、3000ms 首次淡入、1000ms 隐藏淡出、1500ms 室内外过渡、滤波/衰减值。

相邻时段用 dayProgress 连续权重，旧新 gain 为 cos/sin 等功率曲线。春季多鸟，秋季少鸟；冬夜无虫且冬日稀疏鸟。夏日增加实录虫鸣/蝉鸣（夏至白天尤为明显），夏夜替换为 summer-night。若现有候选没有可辨识蝉声，只补充经核对的 CC0 实录，不能用普通噪声冒充蝉鸣。雪时鸟虫为零，仅轻风；平静冬夜同样允许很轻风，不把它描述成真实“大风”。风 ≥10.8m/s 启 strong-wind，≥17.2 叠加 gale；室内 strong-wind 改用 wind-indoor。雨按 drizzle/rain/thunderstorm/sleet 与强度决定，清明/谷雨优先 rain-spring；室内另有窗雨。

并发规则已按作者答复确定，分两个计数：

- **稳态声层最多 4 个**：保留的层和正在淡入的新目标层均计入，正在淡出的旧层不计入这 4 个。把一个旧层转为淡出不等于立即停止其音源。
- **同时播放的环境音源最多 6 个**：按已启动且尚未停止的 AudioBufferSourceNode 计数，包括淡出中的旧源和单次雷声；短交互音效仍由独立总线控制，不属于环境声层计数。
- **全部替换都做重叠的等功率交叉淡化**：通常 4000ms（3–5秒范围），旧/新按cos/sin配对变化；室内外保持≤1500ms过渡。禁止以“先把旧声降到零、再启动其替代声”的方式换层，避免音量空档。
- **第七个音源不得先启动**：如果下一次启动会使总数超过6，按 `fadeStartedAt` 找到最早开始淡出的旧源，使其在不超过500ms内加速淡出、stop并断连；只有释放该音源后才能启动排队的新淡入。同一时刻开始淡出的层用单调序号决定顺序；已在加速的旧源不能因新请求重置计时而一直不结束。
- **加速也保持交叉连续**：旧源已有配对新源时，同步加速其新源到对应等功率进度，从当前增益接续，不直接归零。排队的新替换在获准启动前，保留它自己的旧层持续发声；被加速释放的是更早的淡出层，不能把排队新声的唯一对应旧声提前停掉。多层同时替换按可用的两个额外音源名额分批开始，不要求所有新源在同一毫秒启动。
- **快速反复切换**：取消旧automation后从实际增益/交叉进度重排；保留最早淡出时间供抢占排序，不累计幽灵源。500ms是已确认的拥塞回收例外，不把它误测成每条旧源都必须继续完整3–5秒，也不通过重叠启动第七源来赶时限。

选择优先级：降水主层 > 雷声预留 > 阈值风层 > 室内近处层 > 时段底层 > 季节附层。晴朗时允许双时段+季节；暴雨大风时压低/让出鸟虫，不强行叠满所有概念层。雷暴稳态循环最多三层，第四个稳态名额专供thunder；室内雷暴+狂风保留rain、wind-indoor、gale，窗雨在雷间歇有稳态预算时才播。雷声也经过总音源≤6的启动调度；需要回收时先完成最早淡出源的≤500ms回收，再确定共享雷电事件的flashAt/thunderAt，不能闪光后为排队任意延长1–4秒声延迟。试听可调权重，但必须同时满足稳态≤4、总源≤6和无先出后入空档。

ThunderController 在雷暴可见会话中每 20–60s 调度一次事件 `{id,flashAt,thunderAt}`，先闪、延迟 1–4s 雷。视觉读同一事件，声音不自行产生第二套时刻。退出雷暴、隐藏、销毁时取消所有延迟；静音仍可保留视觉时刻，reduced-motion 禁闪但仍可听雷。未加载雷素材先不创建可听雷事件。闪光限制 ≥1s 间隔、短促低幅且没有高亮白屏。

### 手势、按需加载与错误

首屏不创建 AudioContext、不取 manifest/音频。第一次有效 pointerdown/keydown 同步创建/resume context，再动态加载 audio engine、manifest 和当前需要文件，解码后 3s 淡入；忽略纯修饰键和输入框普通打字。手势捕获不能吞掉点击导致原有交互失效。尚未创建引擎时第一次 `playRoomSound` 也进入同一 context 队列，不另外创建 HTMLAudio 或第二 context。

HUD 一键静音控制 master，同时保留环境/交互独立设置；持久化显式静音、ambience/effects enabled 与音量，禁用 storage 则会话可用。显式关闭后任何天气、场景或刷新均不自动开启；未知前台播放限制显示可恢复的“点击开启声音”。文件失败只跳过该层，UI/交互照常工作。

隐藏时1s master淡出后suspend，回来仅在已解锁且用户允许时resume/淡入；序号保护防止迟到暂停。只加载当前候选层并去重。实施时解码缓存调整为最多10条LRU，保护正在播放/淡出的buffer及最新待入场目标（见末尾实施裁定）；音源仍最多6个。新环境异步加载时暂停旧队列入场、保持旧对应层可听，再以最新目标恢复调度；停止源断连并允许闲置buffer被驱逐，不让全部13条长录音常驻。

阶段 4 用独立按需加载的本地试听入口 `?audioPreview=1` 或 `#/world` 占位场景展示室内外效果；覆盖黎明→白天→黄昏→夜晚、晴→小雨→雷暴、大风、室内↔室外。交付可直接试听地址并尽可能录像；未齐素材明确缺失，不能声称通过试听 gate。

## 示例世界与房间适配

岛：低多边形圆角厚地台、scene-cut 深棕切面、小屋、小路、树、草、池塘、路灯、长椅、邮箱、施工路牌。小屋窗位置由既有房间窗锚点映射，不另造相互矛盾的窗位。材质低饱和，彩色氛围来自光；几何边缘倒角，风格化渐变天空是场景光色的一部分。

WorldCamera 保持俯视 3/4，旋转/缩放有限，polar 最大 <π/2、禁底部和右键平移；reduced-motion 去除镜头运动、树叶大幅摇摆等装饰动态。星星单 draw、月相遮罩、云实例化，云覆盖与光饱和度由 cloudCover 驱动。

每类天气一个实例化 draw，雨/雪各最多 15000（默认 6000/4000），GPU 按时间、种子、风向/风速移动，不每帧重建矩阵或 React state。雨带少量池塘/地面涟漪实例、表面颜色压暗/roughness降低。雪用世界法线朝上权重 shader 混白、雪权重渐增；切换雪后平缓融化。雾跟随 fog 权重。≥10.8m/s 草树明显摇摆/倾斜、少量落叶/碎屑；风方向为气象“来自”方向，转换为粒子移动方向时转 180°。闪光与雷声读共享事件。

主题纯数据驱动，完整五个：

| id | 画面 | 声音与文案 |
| --- | --- | --- |
| lichun | 梅花、新芽 | 春鸟；春意初起 |
| qingming | 柳枝、风筝 | 春鸟，真实雨时优先桂林春雨 |
| xiazhi | 池塘荷花、夜间萤火虫 | 白天夏虫/蝉、夜间夏虫；北半球昼长达峰 |
| liqiu | 第一批落叶、草色微黄 | 鸟鸣减少，夜虫保留 |
| dongzhi | 枯枝、门口灯笼 | 冬夜无虫，轻风；不能自动铺雪 |

其余 19 项各有元数据与配置，继承 spring/summer/autumn/winter 通用主题；夏季通用夜间也可有少量萤火虫，夏至更明显。萤火虫/柳絮/落叶是季节装饰，雨雪则只认真实或显式模拟天气。

低性能：预热后滚动 5s 均值 <40fps 持续两窗，粒子减半、DPR 降到1、关闭可选后处理，冷却10s；持续 <40 再降到基础档。≥55fps 持续30s才逐档恢复。记录档位供验收，不在主 UI 暴露调试细节。

阶段 6 才接房间环境画面：dawn/day → day，dusk/night → night；旧 HUD 日夜按钮记录单独房间模式覆盖，不改变世界时间或天气；“跟随真实”清除此覆盖。只改窗户、窗外、模式输入和声音，保留模型、烘焙贴图/算法及台灯状态。用现有窗节点临时隐藏旧 sky/moon/city，叠加独立环境窗景/玻璃雨滴 shader；退出时恢复。窗景明确挂载顺序/遮挡，不能让旧天空与新天空重叠。

## 性能、验收与停止点

2026-11-08 本机基线：typecheck 成功，Vitest 4 文件/20 测试通过，build 成功；已有大 chunk 警告。Vite 报告 index gzip **341.16kB**、默认房间随后加载 HybridTrialLayers gzip **83.59kB**，房间初次自动加载合计约 **424.75kB**。这只是构建报告，尚非 Chrome 网络/帧率实测。

首屏 JS 验收计入所有首次进入房间自动下载的 JS（包括当前 hybrid 动态 chunk），不能靠延迟 import 隐藏新增开销；相同 Vite 版本/压缩口径与相同 Chrome 冷缓存流程前后比较，增量 ≤30KB gzip。world chunk 必须首次进入才下；环境面板、试听工具、audio engine按需拆分。首手势前声音文件下载 0。

阶段 7 在作者 Mac Chrome 记录版本、硬件、电源/视口/DPR/URL；每场景预热10s、采样30s，晴/雨/雪/雷暴均 ≥50fps、完整帧所有 pass draw calls ≤150，雨雪各≤15000粒子；自动降级另外验证。重复往返10次记录 GPU 对象数回落、无资源增长。缓存热命中 Worker 处理耗时目标 ≤100ms，同时单列浏览器端网络TTFB（不把公网延迟伪装为处理时间）。最终实测以交付报告为准。

截图：固定坐标/日期/时刻、随机种子与稳定转场等待，24 张（4时段×晴/阴/雨/雷暴/雪/大风）+5 节气，共29张拼总览，保留每张 URL。用阶段 1 天文输出选择真正满足各高度区间的时刻，不把固定 06:00 一概叫黎明。大风使用 clear+wind=18，不能发明第十种天气。所有模拟 URL 参数放在 Hash 前面。

| 阶段 | 产物 | 边界 |
| --- | --- | --- |
| 0 | 本设计与实施计划 | 已确认 |
| 1 | 纯环境、store、权威历法/优先级测试 | 已完成 |
| 2 | Worker、mock、客户端取数和兜底 | 不部署生产 |
| 3 | world 路由、占位世界、面板、入口与转场 | 无完整世界 |
| 4 | 实录素材/流水线、混音、致谢、DESIGN声音令牌、试听 | 作者已授权连续执行；交付试听入口 |
| 5 | 示例岛、全部天气、五完整主题、29图总览 | 作者已授权连续执行；交付29图 |
| 6 | 房间窗景与模式/室内声音跟随 | 保留既有烘焙和交互 |
| 7 | 全量验证、性能表、预览部署地址 | 不替换生产部署 |

## 风险与处理

- **节气分钟精度**：Meeus 简式可能不达≤5min；以独立时分样本先验证，补周期修正，拒绝靠日期测试假装达到精度。
- **音源与预算**：Freesound 登录、原录音杂声、AAC循环间隙、13条素材容量/解码内存；用下载清单、人工听验、60s优先、ffprobe预算和LRU解决，缺录音不冒充完成。
- **并发规则**：室内雨+狂风+季节+雷需要优先级控制；已确认稳态≤4、总源≤6、全部等功率交叉，拥塞时最早淡出层≤500ms回收。重点验证多层同换和快速反向切换不超限、不产生先出后入空档、不破坏雷声时序。
- **烘焙接管**：Hybrid 每帧接管背景/曝光/composer；active 生命周期必须完整暂停恢复，否则世界会被旧房间覆盖。
- **全球时间/隐私**：Date时区、DST、极地、CF缺位置、cache携带城市；用独立时钟语义、只缓存网格天气和 no-store 响应验证。
- **首屏预算**：新词典/天文/core都计入≤30KB；按需面板/引擎，持续记录构建和Chrome传输数据，超预算先收敛依赖。
- **真实数据局限**：IP城市定位/天气模型与窗外可能不完全一致；说明大致位置与数据来源，用户可手动覆盖，不主动弹定位授权。

作者最终指令“直接完成所有阶段”覆盖原有阶段停止点；阶段0–6功能已实现，预览已上传。五个完整主题、稳态四层/总源六个规则已落实。最终验证及局限见[交付报告](../../verification/open-world/final.md)。

## 实施裁定

- 简式太阳黄经未通过分钟精度门槛，使用130条 VSOP87D 地球黄经周期系数与 Meeus 视位置修正；保留独立 HKO 断言，24个时分样本最大误差33.682秒。
- 解码缓存上限调整为10条，以保护6个播放中音源与4个待进入目标；音源并发仍严格≤6。缓存容量不等于可播放层数，最多增加两条60秒立体声PCM缓冲（相对于实现早期的8条）。新环境加载期间暂停旧队列入场，避免过期音源被误启动。
- 用户允许直接执行所有阶段，未授权提交/推送；因此保留 `feat/environment-system` 工作区，预览上传不改变生产流量。
