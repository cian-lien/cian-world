from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/common.py').read_text(),'v2/common.py','exec'))
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view
import hashlib
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();checks=[];cache={};trees={}
def check(label,ok):checks.append({'check':label,'passed':bool(ok)})
def geo(o):
    if o.name in cache:return cache[o.name]
    e=o.evaluated_get(deps);m=e.to_mesh();m.calc_loop_triangles();vs=[o.matrix_world@v.co for v in m.vertices]
    lo=[min(v[a] for v in vs) for a in range(3)];hi=[max(v[a] for v in vs) for a in range(3)]
    r={'triangles':len(m.loop_triangles),'min':lo,'max':hi,'dimensions':[round(hi[a]-lo[a],6) for a in range(3)]}
    trees[o.name]=BVHTree.FromPolygons(vs,[tuple(p.vertices) for p in m.polygons]);e.to_mesh_clear();cache[o.name]=r;return r
def origin(o):return [round(x,6) for x in o.matrix_world.translation]
check('All scene objects managed',all(o.get('owner')==OWNER for o in scene.objects))
check('Six collections',set(c.name for c in scene.collection.children)==set(COLLECTIONS))
required=['Diary','Computer','Computer_Screen','Lamp','Lamp_Shade','Lamp_Light','Cat','Bookshelf','Frame_1','Frame_2']
check('Required interactive objects present',all(n in scene.objects for n in required))
check('No duplicate interactive roots',not any(o.name.startswith(tuple(n+'.' for n in required)) for o in scene.objects))
for name in required:
    check(name+' scale applied',all(abs(x-1)<1e-6 for x in scene.objects[name].scale))
    check(name+' in Interactive',col('Interactive') in scene.objects[name].users_collection)
for child,parent in [('Computer_Screen','Computer'),('Lamp_Shade','Lamp'),('Lamp_Light','Lamp')]:check(child+' parent',scene.objects[child].parent==scene.objects[parent])
expected={'Diary':(-.4,1.535,.8),'Computer':(.5,1.88,.8),'Computer_Screen':(.5,1.852,1.4),'Lamp':(-.77,1.92,.8),'Cat':(.92,-1.30,.03),'Bookshelf':(-2.15,1.1,0)}
optimized=scene.get('layout_revision')=='ac-macbook-v1'
if optimized:expected.update({'Diary':(-.77,1.53,.8),'Lamp':(-.97,1.92,.8),'Cat':(1.22,-1.20,.03),'Bookshelf':(-2.15,1.20,0)})
for n,p in expected.items():check(n+' origin',(scene.objects[n].matrix_world.translation-Vector(p)).length<1e-5)
for n in ['Diary','Computer','Lamp','Cat','Bookshelf','Frame_1','Frame_2','Lamp_Shade']:
    g=geo(scene.objects[n]);check(n+' bottom origin',abs(g['min'][2]-scene.objects[n].matrix_world.translation.z)<.0002)
screen=scene.objects['Computer_Screen'];g=geo(screen)
check('Screen dimensions 0.94 x 0.56',abs(g['dimensions'][0]-.94)<1e-5 and abs(g['dimensions'][2]-.56)<1e-5)
normal=screen.matrix_world.to_3x3().inverted().transposed()@screen.data.polygons[0].normal
check('Screen normal -Y',(normal.normalized()-Vector((0,-1,0))).length<1e-6)
check('Interior 4.8 x 4.4',list(scene['interior_dimensions'])==[4.8,4.4])
check('Bed footprint retained',all(abs(a-b)<1e-5 for a,b in zip(geo(scene.objects['V2_Block_BedFrame'])['dimensions'][:2],[1.3,2])))
desk=geo(scene.objects['V2_Block_DeskTop'])
check('Desk footprint matches current layout',all(abs(a-b)<1e-5 for a,b in zip(desk['dimensions'][:2],[2.6 if optimized else 2.3,.8])))
check('Desk top 0.80',abs(desk['max'][2]-.8)<1e-6)
check('Floor top zero',all(abs(geo(o)['max'][2])<1e-6 for o in scene.objects if o.name.startswith('V2_Room_Board_')))
for n in ['Diary','Computer','Lamp']:check(n+' desktop contact',abs(geo(scene.objects[n])['min'][2]-.8)<1e-6)
diary=geo(scene.objects['Diary']);check('Diary within desk',all(diary['min'][a]>=desk['min'][a]-.0001 and diary['max'][a]<=desk['max'][a]+.0001 for a in (0,1)))
check('Gaming chair casters on floor',abs(geo(scene.objects['V2_Detail_GamingChair'])['min'][2])<.003)
check('Beanbag on rug',abs(geo(scene.objects['V2_Soft_Beanbag'])['min'][2]-.02)<.003)
check('Cat on pad',abs(geo(scene.objects['Cat'])['min'][2]-.03)<.001)
soft=[o for o in scene.objects if not o.hide_render and o.name.startswith('V2_Soft_') and any(mod.type=='SUBSURF' for mod in o.modifiers)]
check('Soft objects use subdivision 2',len(soft)>=7 and all(any(mod.type=='SUBSURF' and mod.levels==2 and mod.render_levels==2 for mod in o.modifiers) for o in soft))
quilt=scene.objects['V2_Soft_DrapedQuilt'];mattress=scene.objects['V2_Block_Mattress'];geo(quilt);geo(mattress)
overlap=trees[quilt.name].overlap(trees[mattress.name]);check('Quilt does not pierce mattress',len(overlap)==0)
visible=[o for o in scene.objects if o.type in {'MESH','CURVE','FONT'} and not o.hide_render]
records=[];total=0;framing=True
for o in sorted(visible,key=lambda o:o.name):
    g=geo(o);total+=g['triangles'];records.append({'name':o.name,'origin':origin(o),**g})
    for v in o.bound_box:
        p=world_to_camera_view(scene,scene.camera,o.matrix_world@Vector(v))
        if not (0<=p.x<=1 and 0<=p.y<=1):framing=False
check('Visible geometry <=150000 triangles',total<=150000)
check('Complete camera framing',framing)
check('Preview 1800 x 1600',scene.render.resolution_x==1800 and scene.render.resolution_y==1600 and scene.render.resolution_percentage==100)
check('Cycles 256 with denoising',scene.render.engine=='CYCLES' and scene.cycles.samples==256 and scene.cycles.use_denoising)
check('Depth of field disabled',not scene.camera.data.dof.use_dof)
check('Layered lights present',all(n in scene.objects for n in ['L_Moon','L_Fill','L_Desk','L_Bedside','L_LED','L_Monitor']))
check('No blockout lights',not any(o.name.startswith('L_Blockout_') for o in scene.objects))
check('No export yet',not (ROOT/'public/models/room.glb').exists())
if optimized:
    check('Floor fan fully removed',not any(o.name.startswith(('V2_Block_Fan','V2_Detail_Fan')) for o in scene.objects))
    check('AC and two computer devices exist',all(n in scene.objects for n in ['AirConditioner','MacBook','MacMini']))
    for n in ['MacBook','MacMini']:
        d=geo(scene.objects[n]);check(n+' desktop contact',abs(d['min'][2]-.8)<.0001)
        check(n+' within desk',all(d['min'][a]>=desk['min'][a]-.0001 and d['max'][a]<=desk['max'][a]+.0001 for a in (0,1)))
        check(n+' scale applied',all(abs(v-1)<1e-6 for v in scene.objects[n].scale))
    a=geo(scene.objects['AirConditioner']);check('AC mounted on left wall',abs(a['min'][0]+2.4)<.001 and a['min'][2]>2.5 and a['max'][2]<3.2)
    laptop=geo(scene.objects['MacBook']);mini=geo(scene.objects['MacMini'])
    check('MacBook enlarged to about 0.42m wide including ports',abs(laptop['dimensions'][0]-.42)<.003)
    check('Mac mini enlarged to 0.28m wide',abs(mini['dimensions'][0]-.28)<.0001)
    screen_bounds=geo(screen)
    check('MacBook left and Mac mini right of monitor',laptop['max'][0]<screen_bounds['min'][0] and mini['min'][0]>screen_bounds['max'][0])
    for n in ['Computer','Diary','MacMini','V2_Block_Speaker','Lamp','V2_Props_Mug']:
        geo(scene.objects[n]);pairs=trees['MacBook'].overlap(trees[n]);check('MacBook clear of '+n,len(pairs)==0)
    bed=geo(scene.objects['V2_Block_BedFrame']);bean=geo(scene.objects['V2_Soft_Beanbag'])
    check('Bed to beanbag clearance >=0.8m',bean['min'][0]-bed['max'][0]>=.8)
    rug=scene.objects['V2_Block_Rug'];nest=geo(scene.objects['V2_Block_CatBed']);nest_center=scene.objects['V2_Block_CatBed'].matrix_world.translation
    check('Cat pad remains on rug',(Vector(nest_center[:2])-Vector(rug.location[:2])).length+nest['dimensions'][0]/2<=1.001)
    check('Chair centred on monitor',abs(scene.objects['V2_Detail_GamingChair'].location.x-scene.objects['Computer'].location.x)<.001)
fingerprint=hashlib.sha256(json.dumps(records,sort_keys=True).encode()).hexdigest()
path=ASSETS/'validation-v2-realism.json';prev=json.loads(path.read_text()) if path.exists() else {}
report={'blender':bpy.app.version_string,'stage':'realism and lighting review','status':'awaiting visual approval before bake test','checks':checks,'objects':len(scene.objects),'visible_objects':len(visible),'visible_triangles':total,'quilt_mattress_overlap_pairs':len(overlap),'fingerprint':fingerprint,'rerun_matches_previous':prev.get('fingerprint')==fingerprint if prev else None,'visible_geometry':records,'interactive':{n:origin(scene.objects[n]) for n in required},'pending':['Visual approval','UV/bake test','Production baking','GLB export']}
if optimized:report.update({'layout_revision':scene['layout_revision'],'device_origins':{n:origin(scene.objects[n]) for n in ['AirConditioner','MacBook','MacMini']},'bed_to_beanbag_clearance':bean['min'][0]-bed['max'][0]})
path.write_text(json.dumps(report,ensure_ascii=False,indent=2));(ASSETS/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
failed=[c['check'] for c in checks if not c['passed']]
print(json.dumps({'checks':len(checks),'failed':failed,'triangles':total,'quilt_overlap_pairs':len(overlap),'rerun_matches_previous':report['rerun_matches_previous']},ensure_ascii=False))
assert not failed,failed
lines=['# 紧凑房间：写实细节与夜景审核','',f'Blender {bpy.app.version_string}；{total:,} 个可见三角面；{len(checks)} 项检查通过。','','## 修改内容','','- 保留 4.8×4.4 米室内、1.3×2 米床与 2.3×0.8 米书桌。','- 被子改为带褶皱和垂边的网格；枕头、窗帘、豆袋使用二级细分，加入缝边与织物纹理。','- 椅子改为电竞椅，补五爪底座、脚轮、侧翼、扶手和面料分区。','- 补键帽、Mac mini 外壳/接口、耳机、抽屉把手、书页/书脊、便签与线材。','- 绿植改为带叶脉的独立叶片；风扇补扇叶和网罩；猫加入虎斑、卷尾和闭眼睡姿。','- 程序木纹与墙面微凹凸；暖台灯、床头灯、灯串、冷蓝窗光与低饱和紫色灯带。','- 1800×1600，Cycles 256 采样，开启降噪，关闭景深。','','## 验证','','- 对象名称、原点、缩放、父子关系和显示屏尺寸/法线均已检查。','- 检查被子与床垫的网格相交、椅轮/猫/豆袋接触、镜头完整性及面数预算。','- 重复运行结果见 validation-v2-realism.json 的 rerun_matches_previous。','','## 待确认','','这是模型与灯光审核版，尚未展开 UV、烘焙或导出 GLB。按原任务阶段 6 的要求停在这里，等待视觉确认后再做阶段 7 烘焙测试。','', '上色布局版保存在 archive/v2-compact-color/。外部素材：无。']
if optimized:
    lines=[line.replace('风扇补扇叶和网罩；','落地风扇已换成壁挂空调；') for line in lines]
    lines=[line.replace('2.3×0.8 米书桌','2.6×0.8 米书桌') for line in lines]
    lines+=['','## 布局与设备调整','','- 床与床头柜向后收，电竞椅对齐显示器；地毯、豆袋与猫窝右移。',f"- 床架与豆袋之间的水平净距为 {report['bed_to_beanbag_clearance']:.3f} 米。",'- 左墙上方新增分体空调，含出风口、导风叶片、状态显示与线槽；旧风扇对象全部移除。','- 显示器左侧放打开的 MacBook，右侧放 Mac mini；重新安排日记本、耳机、杯子和音箱。','- 检查两台设备贴桌、桌面范围、MacBook 与周边物体的网格碰撞。','','| 节点 | 世界原点 XYZ（米） |','|---|---|']
    for n in ['Diary','Cat','Bookshelf','AirConditioner','MacBook','MacMini','Cam_Diary','Cam_Diary_Target','Cam_Shelf','Cam_Shelf_Target']:lines.append(f'| `{n}` | {origin(scene.objects[n])} |')
    lines+=['','本轮修改前的模型保存在 archive/v2-before-ac-macbook/。']
    lines+=['','设备展示比例按用户反馈放大：MacBook 宽 0.42 米，Mac mini 宽 0.28 米。桌面加宽到 2.6 米以保留设备间距。']
(ASSETS/'REVIEW-v2-realism.md').write_text('\n'.join(lines)+'\n');(ASSETS/'REVIEW.md').write_text('\n'.join(lines)+'\n')
