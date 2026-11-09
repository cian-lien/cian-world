# 天台视觉对照

参考素材裁自已确认的[第二版概念图](../../assets/blender/rooftop/reference/approved-concept.png)。两个场景保留各自的原始宽高比。五套角色和对应标签单独放在[角色设定](./character-sheet.png)。

| 参考图 | 尺寸 | 广州时间 | 天气 |
| --- | --- | --- | --- |
| [白天 · 夏至](./rooftop-day-summer.png) | 918 × 852 | 2026-06-22 10:00 | 晴 |
| [雨夜](./rooftop-night-rain.png) | 571 × 487 | 2026-06-22 21:00 | 雨 |

运行 `pnpm dev`，在开发服务器的首页加 `?ref=day` 或 `?ref=night`。画布按参考图的比例居中，叠图默认 50%。滑块支持 0–100%，`R` 和「参考图」按钮可以显隐叠图。阶段 1 的白天与雨夜分别使用校准机位。两个预设使用广州坐标 23.1° N、113.3° E，固定天气、动画时间、角色和渲染质量。

## 一键生成

已安装项目依赖及 Google Chrome 时，可以用这条命令生成报告。

```sh
pnpm rooftop:compare
```

脚本启动并关闭临时开发服务器与 Chrome。默认输出日期使用上海时区。可以用 `--date 2026-11-09` 重跑指定日期，或用 `--headed` 测量有窗口的 Chrome。其他 Chromium 安装可通过 `ROOFTOP_CHROME_PATH` 指定可执行文件。

`compare/` 中每次生成两张并排 PNG（左原图、右渲染）和一份 Markdown 报告。脚本用 DPR 1 和固定质量档 2，测试滑块、叠图显隐和两次截图的像素一致性，并记录预热后约 30 秒的帧率与绘制调用。

[阶段 1 的取样坐标](./stage-1-points.json)为两张图各标注 20 个对应物件，并记录五组轮廓边界和楼梯间顶盖四角。脚本用实际渲染网格投影计算最大偏差，阶段 1 要求在画面宽度 3% 以内。[阶段 0 报告](./compare/2026-11-09-stage-0.md)保存改动前的基线。后续阶段使用同一组物件和采样方法，把坐标写到对应的 `stage-<阶段>-points.json` 后以 `pnpm rooftop:compare --stage <阶段>` 运行。

色差算法使用 CIEDE2000，已通过 Sharma、Wu 和 Dalal 的 34 组公开测试值。[论文与测试数据](https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/)
