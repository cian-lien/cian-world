from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/common.py').read_text(),'v2/common.py','exec'))
from bpy_extras.object_utils import world_to_camera_view
import hashlib
deps=bpy.context.evaluated_depsgraph_get();checks=[]
def geometry(o):
    if o.type not in {'MESH','CURVE','FONT'}:return {'triangles':0,'min':None,'max':None,'dimensions':[0,0,0]}
    e=o.evaluated_get(deps);m=e.to_mesh();m.calc_loop_triangles();points=[o.matrix_world@v.co for v in m.vertices]
    lo=[min(v[a] for v in points) for a in range(3)];hi=[max(v[a] for v in points) for a in range(3)]
    r={'triangles':len(m.loop_triangles),'min':lo,'max':hi,'dimensions':[round(hi[a]-lo[a],6) for a in range(3)]};e.to_mesh_clear();return r
def check(label,condition):checks.append({'check':label,'passed':bool(condition)})
required=['Diary','Computer','Computer_Screen','Lamp','Lamp_Shade','Lamp_Light','Cat','Bookshelf','Frame_1','Frame_2']
check('Six requested collections',set(c.name for c in scene.collection.children)==set(COLLECTIONS))
check('All interactive roots exist',all(n in scene.objects for n in required))
expected={'Diary':(-.05,2.335,.8),'Computer':(.85,2.68,.8),'Computer_Screen':(.85,2.652,1.4),
          'Lamp':(-.42,2.72,.8),'Cat':(1,-1.2,.03),'Bookshelf':(-2.75,1.6,0)}
compact=scene.get('layout_variant')=='compact-color'
if compact:
    expected={'Diary':(-.4,1.535,.8),'Computer':(.5,1.88,.8),'Computer_Screen':(.5,1.852,1.4),
              'Lamp':(-.77,1.92,.8),'Cat':(.92,-1.30,.03),'Bookshelf':(-2.15,1.10,0)}
for n,p in expected.items():check(n+' origin',(scene.objects[n].matrix_world.translation-Vector(p)).length<1e-5)
for n in required:check(n+' applied scale',all(abs(v-1)<1e-6 for v in scene.objects[n].scale))
for child,parent in [('Computer_Screen','Computer'),('Lamp_Shade','Lamp'),('Lamp_Light','Lamp')]:check(child+' parent',scene.objects[child].parent==scene.objects[parent])
screen=scene.objects['Computer_Screen'];sm=geometry(screen)
check('Screen 0.94 x 0.56',abs(sm['dimensions'][0]-.94)<1e-5 and abs(sm['dimensions'][2]-.56)<1e-5)
normal=screen.matrix_world.to_3x3().inverted().transposed()@screen.data.polygons[0].normal
check('Screen faces -Y',(normal.normalized()-Vector((0,-1,0))).length<1e-6)
check('Desktop top 0.80',abs(geometry(scene.objects['V2_Block_DeskTop'])['max'][2]-.8)<1e-6)
check('Floor top 0',all(abs(geometry(o)['max'][2])<1e-6 for o in scene.objects if o.name.startswith('V2_Room_Board_')))
base=geometry(scene.objects['V2_Room_Plinth']);check('Plinth 0.30m thick',abs(base['max'][2]-base['min'][2]-.3)<1e-5)
for n in ['Diary','Computer','Lamp']:check(n+' desktop contact',abs(geometry(scene.objects[n])['min'][2]-.8)<1e-6)
desk=geometry(scene.objects['V2_Block_DeskTop']);diary=geometry(scene.objects['Diary'])
check('Rotated diary fully within desktop',all(diary['min'][a]>=desk['min'][a]-.0001 and diary['max'][a]<=desk['max'][a]+.0001 for a in (0,1)))
rug=geometry(scene.objects['V2_Block_Rug']);nest=geometry(scene.objects['V2_Block_CatBed']);bean=geometry(scene.objects['V2_Block_Beanbag'])
check('Cat bed above rug',nest['min'][2]>=rug['max'][2]-.0001)
check('Cat touches cat bed',abs(geometry(scene.objects['Cat'])['min'][2]-nest['max'][2])<.0001)
check('Beanbag touches rug',abs(bean['min'][2]-rug['max'][2])<.0001)
check('Headboard clears skirting',geometry(scene.objects['V2_Block_BedHeadboard'])['min'][2]>=geometry(scene.objects['V2_Room_LeftSkirting'])['max'][2])
check('No contract duplicates',not any(o.name.startswith(tuple(n+'.' for n in required)) for o in scene.objects))
objects=[];total=0
for o in sorted(scene.objects,key=lambda o:o.name):
    g=geometry(o);total+=g['triangles'];v=o.matrix_world.translation
    objects.append({'name':o.name,'type':o.type,'collection':[c.name for c in o.users_collection],'parent':o.parent.name if o.parent else None,'origin_blender':[round(x,6) for x in v],**g})
check('Under final 150000 triangle budget',total<=150000)
points=[world_to_camera_view(scene,scene.camera,o.matrix_world@Vector(v)) for o in scene.objects if o.type=='MESH' for v in o.bound_box]
check('Full camera framing',all(0<=p.x<=1 and 0<=p.y<=1 for p in points))
if compact:
    check('Compact interior 4.8 x 4.4',list(scene['interior_dimensions'])==[4.8,4.4])
    check('Bed real dimensions preserved',all(abs(a-b)<1e-5 for a,b in zip(geometry(scene.objects['V2_Block_BedFrame'])['dimensions'][:2],[1.3,2])))
    check('Desk real dimensions preserved',all(abs(a-b)<1e-5 for a,b in zip(desk['dimensions'][:2],[2.3,.8])))
    # Nightstand's closest corner must stay outside the circular rug footprint.
    nb=geometry(scene.objects['V2_Block_Nightstand']);rc=Vector((.35,-.85))
    closest=Vector((max(nb['min'][0],min(rc.x,nb['max'][0])),max(nb['min'][1],min(rc.y,nb['max'][1]))))
    check('Nightstand clears rug',(closest-rc).length>=1.0)
fingerprint=hashlib.sha256(json.dumps([(o['name'],o['origin_blender'],o['dimensions'],o['triangles']) for o in objects],sort_keys=True).encode()).hexdigest()
report_path=ASSETS/'validation-v2-layout.json'
previous=json.loads(report_path.read_text()) if report_path.exists() else {}
report={'version':2,'stage':3,'blender':bpy.app.version_string,'status':'awaiting layout approval','object_count':len(scene.objects),'triangles_total':total,'all_objects':objects,'checks':checks,'fingerprint':fingerprint,'rerun_matches_previous':previous.get('fingerprint')==fingerprint if previous else None,
        'adjustments':['Desk centre Z=0.775 for 0.05 thickness and 0.80 top.','Diary Y=2.335 to fit the 0.8m-deep desktop.','PreviewCam uses 50mm and a 40mm vertical sensor; all camera markers retain specified positions.'],
        'deferred':['Detailed geometry and subdivision','Final night lighting','UVs','Baking','GLB export']}
if compact:
    report['layout_variant']='compact-color';report['interior_dimensions']=[4.8,4.4];report['floor_area_reduction']=1-4.8*4.4/36
    report['adjustments']=['Interior reduced from 6x6 to 4.8x4.4m; bed 1.3x2 and desk 2.3x0.8 unchanged.','All updated interactive and marker coordinates are in all_objects.','Nightstand moved clear of the rug; furniture colored for layout review.']
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2))
failed=[c['check'] for c in checks if not c['passed']]
print(json.dumps({'checks':len(checks),'failed':failed,'objects':len(scene.objects),'triangles':total,'rerun_matches_previous':report['rerun_matches_previous']},ensure_ascii=False))
assert not failed,failed
lines=['# v2 阶段 3：布局白模审核','',f'Blender {bpy.app.version_string}；{len(scene.objects)} 个对象；{total:,} 个三角面；{len(checks)} 项检查通过。',
       '','此版只确认布局、比例与动线；家具为简单白模，灯光是临时检查光。未进入精细建模、最终夜景灯光、UV、烘焙或导出。','',
       '## 布局','', '- 后墙中部：工作桌、抽屉柜、显示器、人体工学椅、洞洞板与两层浮板。',
       '- 后墙右侧：窗户、窗帘占位、夜空及绿植占位。','- 左侧：床、床头柜、两个相框；左后方为书架。',
       '- 前景：圆地毯、豆袋沙发、猫窝与猫、落地风扇。','',
       '## 坐标调整','', '- 桌面厚 0.05 米、顶面 0.80 米，因此中心 Z=0.775。','- 日记本 Y 从 2.30 调至 2.335，避免旋转后伸出较窄桌面。',
       '- PreviewCam 保留指定位置与 50mm 焦距，使用较大传感器完整容纳剖面房间。','',
       '| 交互节点 | 世界原点 XYZ（米） | 包围盒 XYZ（米） |','|---|---|---|']
for o in objects:
    if o['name'] in required:
        fmt=lambda v:'('+', '.join(f'{x:.4f}' for x in v)+')'
        lines.append(f"| `{o['name']}` | {fmt(o['origin_blender'])} | {fmt(o['dimensions'])} |")
lines+=['','## 确认点','','按 v2 工作规则第 5 条，阶段 3 在此停下。确认布局后再进行阶段 4–6；阶段 6 和阶段 7 仍分别需要确认。',
        '','v1 已归档至 `archive/v1/`；`room_prev.blend` 保留上一保存版本。','素材声明见 `assets/CREDITS.md`；当前没有使用任何外部素材。']
if compact:
    lines=['# v2 阶段 3：紧凑上色布局审核','',f'当前 {len(scene.objects)} 个对象；{total:,} 个三角面；{len(checks)} 项检查通过。',
           '','## 本轮调整','','- 室内尺寸：6×6 米改为 **4.8×4.4 米**，面积减少约 **41.3%**。','- 床仍为 1.3×2 米，书桌仍为 2.3×0.8 米；收紧的是房间外壳、家具间距和地毯。',
           '- 配色：浅木、墨绿床品、灰蓝窗帘、炭灰工作椅、陶土色豆袋与橘猫。','- 书架用简化的书本色块、相框和小猫用基础几何轮廓帮助辨认；完整细节与夜景灯光仍等待布局确认。',
           '','| 节点 | 世界原点 XYZ（米） | 包围盒 XYZ（米） |','|---|---|---|']
    for o in objects:
        if o['name'] in required or o['collection']==['Markers']:
            fmt=lambda v:'('+', '.join(f'{x:.4f}' for x in v)+')'
            lines.append(f"| `{o['name']}` | {fmt(o['origin_blender'])} | {fmt(o['dimensions'])} |")
    lines+=['','## 确认点','','继续停在阶段 3 的布局确认点；尚未开始阶段 4 的精细建模、最终夜景布光、UV、烘焙或 GLB 导出。',
            '','上一版大空间白模已归档到 `archive/v2-spacious-blockout/`；`room_prev.blend` 保留上一次保存。']
(ASSETS/'REVIEW-v2-layout.md').write_text('\n'.join(lines)+'\n')
(ASSETS/'REVIEW.md').write_text('\n'.join(lines)+'\n')
(ASSETS/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
