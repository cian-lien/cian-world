# 岭南城市天台 · 第二版模型

用户于 2026-11-08 批准第二版概念图后，通过 Blender MCP 在独立场景中制作。`rooftop.blend` 是可编辑源文件，`reference/rooftop-day.png`、`rooftop-rain-night.png` 和 `character-outfits.png` 是真实 Cycles 渲染；`approved-concept.png` 是先前批准的 AI 概念参考。

## 文件

- `rooftop.blend`：`LingnanRooftop` 主场景；`RooftopCharacterStudy` 五种角色外观展示。米制、Blender Z-up。
- `public/models/rooftop/rooftop.glb`（仓库根）：天台建筑、生活物件、植物、猫鸟及默认夏至小物。
- `skyline.glb`：近、中、远三个城市层及船/桥上灯点的独立根。
- `visitor.glb`：日常角色；`visitor-umbrella/raincoat/scarf/fan.glb`：各自可直接查看的完整角色外观。
- `season-lichun/qingming/xiazhi/liqiu/dongzhi.glb`：五个节气的独立附加小物。
- 同目录 `manifest.json`：每个模型的字节数、三角面数及节点统计；`validation.json`：实际 Three.js 加载结果；`walkmap.json`：障碍轮廓和可达交互点。
- `scene-validation.json`：Blender 源场景的尺寸、有限坐标和交互点检查结果。

GLB 实际位于仓库根 `public/models/rooftop/`。阶段 1 导出的 12 个文件合计约 2.90 MB。每个模型的顶点和三角面统计见 `manifest.json`，网页绘制调用和帧率见[阶段 1 对照报告](../../../docs/reference/compare/2026-11-09-stage-1.md)。

## 建模与接入约定

屋顶是最大宽深 9.45 × 7.10 m 的五边形，前沿宽 8 m，角色身高 0.9 m。主楼、邻楼和骑楼以 −13.8 m 为街面标高，远楼沿对岸地形落地。白天对照相机在 Blender `(.494,-11.859,10.722)`，朝 `(-.15,.902,0)`，垂直视角 35°。雨夜另用网页固定机位适配原图比例。

Web GLB 使用 EXT_meshopt_compression，需 MeshoptDecoder（网站现有 Drei useGLTF 已提供）；16位位置/UV量化保留交互层级和顶点色。Blender 原文件为未压缩源，可重新导出。GLB 为 Y-up、米制，`forward`/`facing` extras 也转换为相同坐标；Blender `(x,y,z)` 对应 GLB `(x,z,-y)`。角色面向 GLB `+Z`，脚底距 Y=0 约 0.008m。单独角色文件移至原点；天台、城市和节气共享场景原点。

- 保留 `Door_Hinge`、`TeaTable`、`LatestPostBook`、`Radio`、`Telescope`、`CalicoCat`、衣物/鸟/植物根及 `*_Interact`。
- 角色保留 `BodyPivot`、`HeadPivot`、`Arm_L/R`、`Leg_L/R`、`Knee_L/R`、`Face_Eyes` 和手部锚点，供程序动画使用；葵扇挂在 `HandAnchor_R` 下随右臂运动。没有骨骼动画或已制作的动作剪辑。
- `weather_variant` 标记雨伞、雨衣、围巾、葵扇。Blender 中用 `presentation.weather_outfit(...)` 切换；雨衣时同时隐藏带 `hide_under_outfit=raincoat` 的原衣袖。独立 GLB 每份已设置为可见状态。
- `rooftop.glb` 内含 `Season_xiazhi`。切换到其他节气时先隐藏它，再加载相应附加 GLB；不要重复加载两份夏至小物。
- 固定几何按材质合并，固有色保存在标准 `COLOR_0` 顶点色中。不要以不支持顶点色的自定义材质整体覆盖。
- 两个 `CityWindows_*` 合并网格的 `UV.x` 是每个窗面的随机种子，`UV.y` 是层级。Blender 里的随机夜灯节点网络不会自动变成 Three.js shader；运行时需按这些种子设置灯窗着色器。
- `BridgeTrafficRoot`、`RiverBoat`、`RoomWindowAnchor` 供后续移动灯点、船和房间共用天际线。
- 雨丝、水洼、世界天空、云和灯光属于 Blender 演示，不包含在 GLB 中。夜雨渲染展示的是演示状态；网站天气效果需要另行接入。
- `walkmap.json` 从模型生成屋顶多边形、物件障碍和 8 个交互锚点，供网页的移动和寻路使用。0.25 m 网格和 0.14 m 角色半径用于验证锚点的可达性。移动摆设后重建并核查。

## 重建与检查

在已安装 Blender MCP 的 Blender 中运行（也可通过 MCP 执行同样的 Python）：

```python
import sys, runpy, importlib
from pathlib import Path
scripts = Path('/Users/cianlien/development/projects/room-blog/assets/blender/rooftop/scripts')
sys.path.insert(0, str(scripts))
for stage in ['01_architecture.py', '02_props.py', '03_garden.py', '04_animals.py',
              '05_city.py', '06_character.py', '07_presentation.py', '08_composition.py']:
    runpy.run_path(str(scripts / stage), run_name='__main__')
import presentation, validate_scene, export_assets
presentation.setup()
presentation.set_state(False, False, 'xiazhi')
validate_scene.validate()
export_assets.main()
```

`common.py` 中的根路径对应当前本机仓库，换机器需修改。脚本只清理由本生成器拥有的分组；不要在这些分组里存放其他工作。字体在本机使用系统黑体，导出后为网格，不需要外部字体或贴图。`bootstrap_mcp.py` 只是本机启动现有插件的辅助，不是场景生成的依赖。

真实渲染可运行 `presentation.render('rooftop-day', False, False)` 和 `presentation.render('rooftop-rain-night', True, True)`，等待 `bpy.app.is_job_running('RENDER')` 结束后再切换场景；角色图用 `character_study.make()` 后渲染。项目根运行：

```sh
node scripts/compress-rooftop.mjs
node assets/blender/rooftop/scripts/validate_glb.mjs
```

该检查用本项目 Three.js 0.169 的 `GLTFLoader` 解析全部 GLB，检查有限顶点、三角面、顶点色、角色高度、交互/动作根、方向元数据、葵扇右手父子关系和灯窗 UV。

## 当前交付边界

模型阶段之后已继续完成网站集成：角色移动、交互、天气换装、回南天、城市实录、房间共享天际线、33张截图和录屏。详见 docs/verification/rooftop/final.md。旧房间模型和烘焙资源保留，未提交或推送，生产版本不变。

几何和材质由本项目脚本原创制作，无下载的第三方模型、贴图或品牌。概念图用于已批准的视觉方向，实际实现以上述真实渲染和模型为准。
