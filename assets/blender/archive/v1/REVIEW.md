# 阶段 6：建模审核（等待确认）

Blender 5.2.3 LTS；总计 **45,258** 个三角面（含修改器），Static 为 15,932。
数值检查：52 项全部通过。

| 对象 | 父级 | 原点 Blender XYZ（米） | 世界包围盒 XYZ（米） | 三角面 |
|---|---|---|---|---:|
| `Bookshelf` | — | (-2.7800, 1.6000, 0.0000) | (0.4000, 1.2000, 2.0000) | 13,724 |
| `Cat` | — | (1.2000, -1.1000, 0.0300) | (0.5724, 0.4422, 0.3280) | 3,428 |
| `Computer` | — | (0.8500, 2.6800, 0.8000) | (1.0240, 0.6500, 0.9200) | 6,940 |
| `Computer_Screen` | Computer | (0.8500, 2.6520, 1.4000) | (0.9400, 0.0000, 0.5600) | 2 |
| `Diary` | — | (-0.0500, 2.3000, 0.8000) | (0.4755, 0.5419, 0.0750) | 1,256 |
| `Frame_1` | — | (-2.9800, -1.1500, 1.4400) | (0.0400, 0.5000, 0.4200) | 1,444 |
| `Frame_2` | — | (-2.9800, -1.8000, 1.5400) | (0.0400, 0.4000, 0.5200) | 1,444 |
| `Lamp` | — | (-0.4200, 2.7200, 0.8000) | (0.2000, 0.2000, 0.4180) | 928 |
| `Lamp_Light` | Lamp | (-0.4200, 2.7200, 1.0700) | (0.0000, 0.0000, 0.0000) | 0 |
| `Lamp_Shade` | Lamp | (-0.4200, 2.7200, 1.1487) | (0.3254, 0.3254, 0.1826) | 160 |
| `Cam_Diary` | — | (-0.0500, 1.5000, 2.0000) | (0.0000, 0.0000, 0.0000) | 0 |
| `Cam_Diary_Target` | — | (-0.0500, 2.3000, 0.8000) | (0.0000, 0.0000, 0.0000) | 0 |
| `Cam_Room` | — | (7.5000, -7.5000, 6.2000) | (0.0000, 0.0000, 0.0000) | 0 |
| `Cam_Room_Target` | — | (0.0000, 0.4000, 0.8000) | (0.0000, 0.0000, 0.0000) | 0 |
| `Cam_Shelf` | — | (-0.7800, 1.6000, 1.2000) | (0.0000, 0.0000, 0.0000) | 0 |
| `Cam_Shelf_Target` | — | (-2.7800, 1.6000, 1.0000) | (0.0000, 0.0000, 0.0000) | 0 |

## 审核说明

- Computer_Screen origin is its specified centre; Lamp_Light is an Empty.
- Frame_1/Frame_2 origins are bottom centres below their specified artwork centres.
- PreviewCam uses 40mm to prevent cropping at the exact requested camera position.
- A concealed floor recess beneath Bookshelf preserves its exact Z=0 pivot without intersection with the 0.02m floor layer.
- Room_Static, UVs, baked textures and room.glb are intentionally pending approval.

## 文件状态

- 已保存：`room.blend`、`room_prev.blend`、`preview.png`、逐阶段截图。
- 等你确认后再生成：`Room_Static`、`public/models/room.glb`、`public/textures/baked-day.webp`（或 PNG）。
- GLB 大小、UV 无重叠与烘焙质量将在导出阶段验收。
