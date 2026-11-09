# 环境、世界与声音系统

纯 TypeScript 环境核心是唯一状态源。房间、按需加载的示例岛与 Web Audio 消费同一状态；同源 Cloudflare Worker 提供城市网格天气。

## 模块入口

- `src/env/index.ts` 是纯入口：日月位置、昼夜阶段、节气、天气映射、覆盖解析、resolver、外部 store 和数值过渡。
- `src/env/browser.ts` 显式创建浏览器适配器；导入不会创建 store、计时器或请求。应用通过 `/api/env` 注入取数函数。
- `src/env/useEnvironment.ts` 提供 `useEnvironment(store?)`，订阅本身不启动取数。应用生命周期的拥有者须显式调用 `store.start()` 并保留其清理函数。
- `shared/env-api.ts` 是同源 API 的 JSON 契约和校验器；实现位于 `worker/`。

```ts
import { createEnvironmentStore } from '../src/env'

const store = createEnvironmentStore({
  now: () => new Date(),
  clock: { timeZone: 'Asia/Shanghai', deviceTimeZone: 'Asia/Shanghai' },
  getSearch: () => '',
  // 后续可注入 fetchEnv(signal, roundedCoordinates)、storage、visibility 和 timers。
})
const unsubscribe = store.subscribe(() => console.log(store.getSnapshot()))
const stop = store.start()
// 拥有者销毁时：stop(); unsubscribe()
```

store 的 `getSnapshot()` 在数据未变化时保持相同引用，适合 `useSyncExternalStore`；调用者不得修改返回对象或其中 Date。`start()` 支持多个拥有者和重复清理，最后一个拥有者离开才停止计时/订阅并取消请求。`getStatus()` 返回展示时区、更新时间、过期标记及逐字段来源。

## 来源与时间规则

有效 URL > 有效手动 > 有效实时数据 > 晴天兜底，逐字段合并。天气种类的显式选择携带该种类的强度/云量预设；单独指定风速保留其他真实字段。非法字段独立忽略，禁止从小雪/大雪/冬至生成天气。温度未知为 null。

URL 参数放在 Hash 前：`?date=2026-04-05&time=22:30&weather=rain&intensity=0.7&wind=12&term=qingming&lat=23.1&lon=113.3#/`。日期模拟支持 **1900–2100**，精度独立验证范围目前为 **2026、2027**。`date` 单独固定当地日期、时分继续走；`time` 单独固定时分、日期跟随当地当天；两者同时指定冻结完整时刻。DST 重复时间取早，缺失时间推进到下一有效分钟。

Date 始终是绝对时刻。显示优先使用有效城市时区；无位置使用设备当地墙钟，在广州坐标投影日月，但绝不改变真实节气时刻。太阳高度 <−6° 为夜、>6° 为昼，边界范围按太阳上升/下降决定黎明/黄昏；dayProgress 为连续太阳日相位，极昼/极夜也有定义。日月方位为正北0°、顺时针，月相0新月/0.5满月。

节气按视黄经求根，立春 index0=315°，交节时刻切换；日期展示统一 Asia/Shanghai。2026/2027 两年的48个日期来自香港天文台年历；另用24个中气时分样本校验≤5分钟，不把只检查日期当作分钟精度证据。详见 `src/env/__fixtures__/hko-solar-terms-2026-2027.ts`。

`term` 只换世界日历/季节主题；不改天体时间或天气。五个完整主题为立春、清明、夏至、立秋、冬至，其余19个继承季节通用配置，世界按这些数据渲染；夏至有荷花与夜间萤火虫，夏季白天有虫鸣/蝉鸣。

## 位置、持久化与生命周期

坐标成对验证、取整到0.1°后再用；显式坐标与实时响应坐标不匹配时不使用另一地点的天气/城市/时区。DTO 只拣选声明字段；云量0–1、风速m/s、温度°C、降水mm。

`room-blog.environment.v1` 仅保存 `{version:1, settings:{date?,time?,weather?,intensity?,wind?,term?}}`，不保存位置。存储读取/JSON/写入异常都不会阻断使用。`followReal()` 清手动配置和环境 URL 参数，浏览器适配器保留 pathname、Hash、history.state、lang/bake/cam/lamp；可注入 `onFollowReal` 供后续清房间模式覆盖。

页面可见时每分钟更新时钟，并单独安排真实交节边界；天气有效期15分钟。隐藏时取消计时器、取消在途请求，恢复时立刻重算，过期才取数。请求序号和 AbortSignal 防止旧坐标/旧请求迟到覆盖新状态。网络不可用进入晴天 fallback；允许保留会话内城市作天文输入，不持久化位置。

数值过渡独立于语义状态：`toVisualEnvironment` 得到雨、雪、雾、云量、湿度、积雪、风和昼夜进度的目标；`sampleTransition` 在4秒内插值，风向/日相位沿最短圆弧；`createVisualTransition` 支持从当前值连续改目标。这些模块没有 GPU、React 帧循环或音频节点。

## 验证

```sh
pnpm exec vitest run src/env/__tests__
pnpm typecheck
pnpm test
pnpm build
```

用 `TZ=UTC`、`TZ=Asia/Shanghai`、`TZ=America/New_York` 分别运行 clock/astronomy/solarTerms 测试，验证不依赖宿主时区。阶段结果记录在 [阶段 1 验证报告](verification/open-world/phase-1.md)。

完整实现与验证见 [交付报告](verification/open-world/final.md)。

## Worker 与本地开发

`pnpm dev` 使用离线 `/api/env` mock：`?mock=rain-night`、`?mock=gale-day`、`?mock=snow-night`、`?mock=offline` 控制返回的天气和 isDay；天文昼夜仍由绝对时间计算，预览夜空时加 `&time=23:00`。线上不会接受 mock。构建后 `pnpm dev:worker` 使用本地 Workers Runtime；本地无 CF 城市时可传 `?lat=23.1&lon=113.3` 测试真实上游。

Worker 只优先处理 `/api/*`，其他路径由 ASSETS 托管。取整后才请求 Open-Meteo，m/s 风速；缓存900秒且只包含网格天气/时区/时间戳。城市不写入缓存，响应 no-store；上游4秒超时、坏数据和缺失CF位置均安全返回空天气，不记录 IP。站点面板提供 Open-Meteo CC BY 4.0 署名和隐私说明。

## 场景与控件

`#/world` 是可整体替换的示例岛；`WorldScene` 只在首次进入时下载。房间窗户、HUD 与小屋门连接两场景，0.6秒纸色转场（减弱动态时0.2秒）。房间组保持挂载以保留 RoomOS/灯状态，离开世界时释放该场景拥有的 GPU 资源，并恢复房间的环境光、曝光、DPR 和后处理。

环境胶囊打开可键盘操作的面板；Esc 先关闭面板，再回房间。五个完整主题和其余19个通用主题不产生天气。`?capture=1` 冻结降水采样用于可复现截图；`?perf=1` 显示调试计数。截图脚本：`node scripts/screenshot-world-matrix.mjs --space <Ego任务空间ID> --out <绝对路径>`，调用者须先建立并最终结束该浏览器任务空间。

## 声音与素材

`src/audio/mix.ts` 计算目标混音；scheduler 管理等功率交叉和并发，engine 负责一个 AudioContext、解码缓存和总线。首次手势前不请求环境音，第一次解锁后3秒总线淡入。天气/时段4秒交叉，进出房间1.5秒，隐藏1秒淡出并暂停；恢复后重新同步，取消过期雷声。稳态最多4层，淡出旧层不占稳态额度；含淡出和雷声总源最多6个。将超6源时，最早淡出层加速至0.5秒结束后才接纳新层，旧的对应层保持可听，始终重叠交叉。

解码 LRU 最多10条，保护最多6个仍播放的声音及4个待切入目标，避免快速切换丢层。室内户外总线1200Hz/-8dB，近窗雨和屋内风走独立近处路径；雷与低幅闪光共享事件（20–60秒间隔，雷延迟1–4秒），减弱动态禁闪。

13条 CC0 实录自托管于 `public/sounds/ambience/`；处理配置 `scripts/audio/clips.json`，执行 `pnpm audio:prepare` 需要 ffmpeg 与 raw 文件。循环通过2秒等功率首尾交叉并旋转接缝处理；两遍 loudnorm 后96kbps立体声AAC，环境-26 LUFS、雷-20 LUFS。Freesound 原始WAV需登录的条目使用发布者公开HQ预览MP3，不绕过登录；原始WAV的手动获取链接及放置位置见 `assets/audio/DOWNLOADS.md`。致谢见 `assets/CREDITS.md` 与站内 `/audio-credits.html`。

试听：`?audioPreview=1#/world` 依次提供黎明/白天/黄昏/夜晚/晴/雨/雷暴/大风按钮；先清除 `time/weather/wind` 等URL模拟或点“跟随真实”，再用按钮。环境和交互音效独立开关/音量，HUD一键总静音，全部偏好安全持久化。
