from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/common.py').read_text(),'common.py','exec'))
remove_names('Diary','Computer_Screen','Computer','Lamp_Shade','Lamp_Light','Lamp','Cat','Frame_1','Frame_2')
remove_prefix('P_Interact_')
p='P_Interact_'
# Diary: all dimensions are local, with its hover pivot on the desk surface.
parts=[box(p+'DiaryBack',(0,0,.006),(.36,.46,.012),M['diary'],.008,c='Interactive'),
       box(p+'DiaryPaper',(0,0,.035),(.337,.438,.046),M['paper'],.007,c='Interactive'),
       box(p+'DiaryCover',(0,0,.0655),(.36,.46,.017),M['diary'],.008,c='Interactive'),
       box(p+'DiarySpine',(-.168,0,.0375),(.024,.46,.075),M['diary'],.008,c='Interactive'),
       box(p+'DiaryStrap',(.105,0,.0745),(.032,.46,.001),M['strap'],.0004,c='Interactive'),
       cyl(p+'DiarySticker',(-.060,.055,.0745),.044,.001,M['yellow'],c='Interactive')]
diary=join_parts('Diary',parts,(0,0,0),angle=math.radians(-17));diary.location=(-.05,2.30,.80)
# Computer base, support, shell, keyboard and mouse form one independent node.
parts=[box(p+'MonitorBase',(0,0,.016),(.33,.21,.032),M['monitor'],.012,c='Interactive'),
       box(p+'MonitorStand',(0,.01,.17),(.08,.055,.28),M['monitor'],.012,c='Interactive'),
       box(p+'MonitorShell',(0,0,.60),(1,.05,.64),M['monitor'],.015,c='Interactive'),
       box(p+'KeyboardBase',(0,-.43,.013),(.68,.23,.026),M['key'],.012,c='Interactive'),
       sphere(p+'Mouse',(.48,-.43,.026),(.044,.070,.026),M['key'],c='Interactive')]
for row in range(3):
    for col in range(10):parts.append(box(p+'Key_%d_%d'%(row,col),(-.291+col*.0645,-.502+row*.067,.032),(.051,.051,.012),M['white'],.004,c='Interactive'))
parts.append(box(p+'SpaceBar',(0,-.51,.039),(.23,.039,.009),M['key'],.003,c='Interactive'))
computer=join_parts('Computer',parts,(0,0,0));computer.location=(.85,2.68,.80)
# One precise plane, front normal -Y; its origin is its explicitly requested centre.
mesh=bpy.data.meshes.new('Computer_Screen_Mesh')
mesh.from_pydata([(-.47,0,-.28),(.47,0,-.28),(.47,0,.28),(-.47,0,.28)],[],[(0,1,2,3)]);mesh.update()
screen=bpy.data.objects.new('Computer_Screen',mesh);collection('Interactive').objects.link(screen)
screen.location=(.85,2.652,1.40);mesh.materials.append(M['screen']);parent_keep(screen,computer)
# Lamp assembly with separate shade and positional Empty, all exact names.
parts=[cyl(p+'LampBase',(0,0,.014),.10,.028,M['gold'],c='Interactive'),
       rod(p+'LampStem',(0,0,.028),(0,0,.405),.014,M['gold'],c='Interactive'),
       sphere(p+'LampBulb',(0,0,.38),(.034,.034,.038),M['linen'],c='Interactive')]
lamp=join_parts('Lamp',parts,(0,0,0));lamp.location=(-.42,2.72,.80)
bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=.16,radius2=.075,depth=.18,end_fill_type='NOTHING',location=(-.42,2.72,1.24))
shade=finish(bpy.context.object,'Lamp_Shade',M['gold'],0,'Interactive')
mod=shade.modifiers.new('Shade thickness','SOLIDIFY');mod.thickness=.006;mod.offset=0
bpy.context.view_layer.objects.active=shade;bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.context.view_layer.update()
shade_bottom=min((shade.matrix_world@v.co).z for v in shade.data.vertices)
cursor=scene.cursor.location.copy();scene.cursor.location=(-.42,2.72,shade_bottom)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR');scene.cursor.location=cursor
parent_keep(shade,lamp)
marker=bpy.data.objects.new('Lamp_Light',None);marker.empty_display_type='SPHERE';marker.empty_display_size=.035
collection('Interactive').objects.link(marker);marker.location=(-.42,2.72,1.07);parent_keep(marker,lamp)
# A low orange cat, rotated so its face points +X/-Y towards the hero camera.
parts=[sphere(p+'CatBody',(-.035,.055,.12),(.20,.125,.10),M['cat'],c='Interactive'),
       sphere(p+'CatHead',(.12,-.080,.185),(.10,.095,.095),M['cat'],c='Interactive')]
for x in [.065,.185]:
    parts.append(cyl(p+'CatEar',(x,-.055,.278),.040,.10,M['cat'],r2=0,c='Interactive',vertices=16))
    parts.append(sphere(p+'CatPaw',(x,-.16,.025),(.044,.068,.025),M['paw'],c='Interactive'))
for x in [.080,.158]:parts.append(sphere(p+'CatEye',(x,-.166,.202),(.012,.008,.014),M['black'],c='Interactive'))
parts.append(sphere(p+'CatNose',(.12,-.178,.172),(.014,.009,.010),M['nose'],c='Interactive'))
parts.append(sphere(p+'CatMuzzle',(.12,-.162,.156),(.043,.024,.025),M['paw'],c='Interactive'))
parts.append(tube(p+'CatTail',[(-.18,.10,.10),(-.27,.08,.08),(-.28,-.055,.065),(-.17,-.10,.06)],.024,M['cat'],c='Interactive'))
cat=join_parts('Cat',parts,(0,0,0),angle=math.radians(45));cat.location=(1.2,-1.1,.03)
# Wall frames are interactive, never included in Static.
for name,center,width,height,m in [('Frame_1',(-2.98,-1.15,1.65),.50,.42,M['mint']),('Frame_2',(-2.98,-1.8,1.8),.40,.52,M['pink'])]:
    parts=[]
    for y in [-width/2+.025,width/2-.025]:parts.append(box(p+name+'Side',(0,y,height/2),(.04,.05,height),M['frame'],.009,c='Interactive'))
    for z in [.025,height-.025]:parts.append(box(p+name+'Rail',(0,0,z),(.04,width,.05),M['frame'],.009,c='Interactive'))
    parts.append(box(p+name+'Canvas',(.004,0,height/2),(.018,width-.07,height-.07),m,.006,c='Interactive'))
    sun=cyl(p+name+'ArtSun',(.016,-width*.12,height*.63),width*.12,.004,M['yellow'],c='Interactive');sun.rotation_euler.y=math.pi/2;parts.append(sun)
    parts.append(box(p+name+'ArtLine',(.017,width*.04,height*.31),(.004,width*.48,.025),M['white'],.003,c='Interactive'))
    root=join_parts(name,parts,(0,0,0));root.location=(center[0],center[1],center[2]-height/2)
# Rug upper face sits at the specified Cat origin height (0.03).
for o in scene.objects:
    if o.name=='S_Furn_Rug':
        o.location.z=.025
        for v in o.data.vertices:v.co.z=math.copysign(.005,v.co.z)
    elif o.name=='S_Furn_RugInner':
        o.location.z=.0303
        for v in o.data.vertices:v.co.z=math.copysign(.0003,v.co.z)
bpy.context.view_layer.update()
for name in ['Diary','Computer','Lamp','Cat','Bookshelf','Frame_1','Frame_2']:
    o=scene.objects[name];assert all(abs(v-1)<1e-6 for v in o.scale),name
assert screen.parent==computer and shade.parent==lamp and marker.parent==lamp
assert (screen.matrix_world.translation-Vector((.85,2.652,1.40))).length<1e-6
assert screen.data.polygons[0].normal.y<-.999
preview_camera();checkpoint(4)
