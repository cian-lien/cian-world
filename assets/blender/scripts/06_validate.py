from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/common.py').read_text(),'common.py','exec'))
from bpy_extras.object_utils import world_to_camera_view
deps=bpy.context.evaluated_depsgraph_get()
def metrics(o):
    if o.type not in {'MESH','CURVE','FONT','SURFACE'}:
        return {'triangles':0,'dimensions':[0,0,0],'min_z':None}
    ev=o.evaluated_get(deps);mesh=ev.to_mesh();mesh.calc_loop_triangles()
    points=[o.matrix_world@v.co for v in mesh.vertices]
    result={'triangles':len(mesh.loop_triangles),'dimensions':[round(max(v[i] for v in points)-min(v[i] for v in points),6) for i in range(3)],'min_z':min(v.z for v in points),'max_z':max(v.z for v in points)}
    ev.to_mesh_clear();return result
interactive=['Diary','Computer','Computer_Screen','Lamp','Lamp_Shade','Lamp_Light','Cat','Bookshelf','Frame_1','Frame_2']
markers=['Cam_Room','Cam_Room_Target','Cam_Diary','Cam_Diary_Target','Cam_Shelf','Cam_Shelf_Target']
expected={'Diary':(-.05,2.30,.8),'Computer':(.85,2.68,.8),'Lamp':(-.42,2.72,.8),'Cat':(1.2,-1.1,.03),'Bookshelf':(-2.78,1.6,0)}
checks=[]
def check(label,condition):
    checks.append({'check':label,'passed':bool(condition)})
    assert condition,label
check('exact interactive and marker names',all(n in scene.objects for n in interactive+markers))
check('static remains unmerged before approval','Room_Static' not in scene.objects)
for n in interactive:
    o=scene.objects[n]
    check(n+' belongs to Interactive',o.name in collection('Interactive').objects)
    check(n+' applied scale',all(abs(v-1)<1e-6 for v in o.scale))
    if n not in {'Computer_Screen','Lamp_Light'}:
        z=metrics(o)['min_z'];check(n+' pivot at bottom height',abs(o.matrix_world.translation.z-z)<.00001)
for n,p in expected.items():check(n+' exact world origin',(scene.objects[n].matrix_world.translation-Vector(p)).length<1e-6)
screen=scene.objects['Computer_Screen'];sm=metrics(screen)
check('screen dimensions 0.94 x 0.56',abs(sm['dimensions'][0]-.94)<1e-5 and abs(sm['dimensions'][2]-.56)<1e-5 and sm['dimensions'][1]<1e-6)
check('screen world centre',(screen.matrix_world.translation-Vector((.85,2.652,1.40))).length<1e-6)
normal=screen.matrix_world.to_3x3().inverted().transposed()@screen.data.polygons[0].normal
check('screen normal -Y',(normal.normalized()-Vector((0,-1,0))).length<1e-6)
for child,parent in [('Computer_Screen','Computer'),('Lamp_Shade','Lamp'),('Lamp_Light','Lamp')]:check(child+' parent '+parent,scene.objects[child].parent==scene.objects[parent])
check('desktop top 0.80',abs(metrics(scene.objects['S_Furn_DeskTop'])['max_z']-.8)<1e-6)
floor=scene.objects['S_Shell_Floor'];evfloor=floor.evaluated_get(deps)
ray_origin=floor.matrix_world.inverted()@Vector((-2.78,1.6,.10))
check('concealed floor recess below zero-origin shelf',not evfloor.ray_cast(ray_origin,Vector((0,0,-1)),distance=.2)[0])
for n in ['Diary','Computer','Lamp']:check(n+' rests at desktop height',abs(metrics(scene.objects[n])['min_z']-.8)<1e-6)
check('window and poster face inward',scene.objects['S_Shell_WindowGlass'].location.y>2.98 and scene.objects['S_Shell_PosterPaper'].location.y<2.98)
check('no image texture nodes',all(not any(n.type=='TEX_IMAGE' for n in m.node_tree.nodes) for m in bpy.data.materials if m.use_nodes and m.name.startswith('RB_')))
check('material roughness and metallic',all(abs(m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value-.78)<1e-5 and m.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value==0 for m in bpy.data.materials if m.use_nodes and m.name.startswith('RB_')))
all_objects=[];total=0;static_total=0
for o in sorted(scene.objects,key=lambda o:o.name):
    m=metrics(o);total+=m['triangles']
    if o.name in collection('Static').objects:static_total+=m['triangles']
    p=o.matrix_world.translation
    all_objects.append({'name':o.name,'type':o.type,'collection':[c.name for c in o.users_collection],'parent':o.parent.name if o.parent else None,'origin_blender':[round(v,6) for v in p],'origin_three':[round(p.x,6),round(p.z,6),round(-p.y,6)],**m})
check('triangle budget <= 60000',total<=60000)
visible=[o for o in scene.objects if o.type in {'MESH','CURVE'}]
points=[world_to_camera_view(scene,scene.camera,o.matrix_world@Vector(v)) for o in visible for v in o.bound_box]
check('complete preview framing',all(0<=p.x<=1 and 0<=p.y<=1 for p in points))
check('no duplicate contract nodes',not any(o.name.startswith(tuple(n+'.' for n in interactive+markers)) for o in scene.objects))
report={'blender':bpy.app.version_string,'stage':6,'approval_status':'awaiting user approval before UV/bake/export','triangles_total':total,'static_triangles':static_total,'interactive':[r for r in all_objects if r['name'] in interactive],'markers':[r for r in all_objects if r['name'] in markers],'all_objects':all_objects,'checks':checks,'notes':['Computer_Screen origin is its specified centre; Lamp_Light is an Empty.','Frame_1/Frame_2 origins are bottom centres below their specified artwork centres.','PreviewCam uses 40mm to prevent cropping at the exact requested camera position.','A concealed floor recess beneath Bookshelf preserves its exact Z=0 pivot without intersection with the 0.02m floor layer.','Room_Static, UVs, baked textures and room.glb are intentionally pending approval.']}
(ASSETS/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
lines=['# 阶段 6：建模审核（等待确认）','',f'Blender {bpy.app.version_string}；总计 **{total:,}** 个三角面（含修改器），Static 为 {static_total:,}。',f'数值检查：{len(checks)} 项全部通过。','','| 对象 | 父级 | 原点 Blender XYZ（米） | 世界包围盒 XYZ（米） | 三角面 |','|---|---|---|---|---:|']
for r in report['interactive']+report['markers']:
    fmt=lambda v:'('+', '.join(f'{x:.4f}' for x in v)+')'
    lines.append(f"| `{r['name']}` | {r['parent'] or '—'} | {fmt(r['origin_blender'])} | {fmt(r['dimensions'])} | {r['triangles']:,} |")
lines+=['','## 审核说明','']+['- '+n for n in report['notes']]
lines+=['','## 文件状态','','- 已保存：`room.blend`、`room_prev.blend`、`preview.png`、逐阶段截图。','- 等你确认后再生成：`Room_Static`、`public/models/room.glb`、`public/textures/baked-day.webp`（或 PNG）。','- GLB 大小、UV 无重叠与烘焙质量将在导出阶段验收。']
(ASSETS/'REVIEW.md').write_text('\n'.join(lines)+'\n')
s=scene
s.render.preview_pixel_size='1'
for screen_layout in bpy.data.screens:
    if screen_layout.name!='Layout':continue
    for area in screen_layout.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.shading.type='RENDERED'
            area.spaces.active.region_3d.view_perspective='CAMERA'
checkpoint(6)
print(json.dumps({'triangles_total':total,'static_triangles':static_total,'checks_passed':len(checks),'interactive':report['interactive']},ensure_ascii=False))
