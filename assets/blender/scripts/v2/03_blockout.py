from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/common.py').read_text(),'v2/common.py','exec'))
remove_prefix('V2_Block_')
remove_names('Diary','Computer_Screen','Computer','Lamp_Shade','Lamp_Light','Lamp','Cat','Bookshelf','Frame_1','Frame_2',
             'Cam_Room','Cam_Room_Target','Cam_Diary','Cam_Diary_Target','Cam_Shelf','Cam_Shelf_Target')
p='V2_Block_';f='Static_Furniture';pr='Static_Props';i='Interactive'
clay=M['clay'];light=M['clay_light'];dark=M['clay_dark']
# Desk: exact 0.80m top. Cabinet and left metal-leg footprint are placeholders.
box(p+'DeskTop',(.5,2.45,.775),(2.3,.8,.05),clay,f,.012)
box(p+'DeskCabinet',(1.30,2.45,.375),(.62,.70,.75),light,f,.015)
for y in [2.13,2.77]:box(p+'DeskMetalLeg',(-.54,y,.375),(.045,.045,.75),dark,f,.006)
box(p+'DeskMat',(.98,2.40,.8001),(1.25,.53,.0002),dark,f,0)
# Pegboard and two shelves reserve space for the detailed work-zone props.
box(p+'Pegboard',(.40,2.983,1.75),(1.8,.030,.96),clay,f,.012)
for z in [2.32,2.88]:box(p+'FloatingShelf',(.15,2.86,z),(2.10,.28,.05),clay,f,.012)
# Ergonomic chair, shown as simple seat/back/headrest and a base-disc footprint.
parts=[cyl(p+'ChairBase',(0,0,.0275),.34,.055,dark,f),
       cyl(p+'ChairLift',(0,0,.26),.045,.42,dark,f),
       box(p+'ChairSeat',(0,0,.48),(.58,.56,.10),clay,f,.025),
       box(p+'ChairBack',(0,-.27,.92),(.55,.12,.68),clay,f,.025),
       box(p+'ChairHeadrest',(0,-.25,1.32),(.37,.12,.15),clay,f,.025)]
for side in [-1,1]:
    parts.append(box(p+'ChairArmStem',(side*.36,0,.60),(.035,.04,.28),dark,f,.005))
    parts.append(box(p+'ChairArmPad',(side*.36,.01,.75),(.09,.34,.055),clay,f,.018))
chair=join(p+'Chair',parts,(0,0,0),c=f,angle=math.radians(15));chair.location=(.75,1.50,0)
# Bed plus simple block pillows/quilt; actual subdivision comes after approval.
for x in [-2.91,-1.79]:
    for y in [-2.18,-.42]:box(p+'BedFoot',(x,y,.07),(.09,.09,.14),dark,f,.012)
box(p+'BedFrame',(-2.35,-1.3,.23),(1.30,2,.18),clay,f,.025)
box(p+'Mattress',(-2.35,-1.3,.435),(1.24,1.94,.23),light,f,.03)
box(p+'BedHeadboard',(-2.35,-.315,.57),(1.30,.075,.86),clay,f,.025)
box(p+'Quilt',(-2.35,-1.55,.61),(1.27,1.42,.12),clay,f,.03)
for x in [-2.67,-2.03]:box(p+'Pillow',(x,-.62,.64),(.56,.35,.18),light,f,.03)
box(p+'AccentPillow',(-2.35,-.86,.82),(.36,.18,.30),clay,f,.03)
# Nightstand and its three reserved small-object envelopes.
box(p+'Nightstand',(-1.30,-.45,.275),(.54,.56,.55),clay,f,.018)
box(p+'BedsideBook',(-1.30,-.55,.565),(.32,.20,.03),light,pr,.006)
cyl(p+'BedsideLampBase',(-1.30,-.25,.57),.07,.04,clay,pr)
cyl(p+'BedsideLampStand',(-1.30,-.25,.68),.012,.20,dark,pr)
cyl(p+'BedsideLampShade',(-1.30,-.25,.82),.105,.17,light,pr,r2=.055)
box(p+'AlarmClock',(-1.12,-.27,.60),(.12,.065,.10),dark,pr,.012)
# Shelf footprint remains one independent interactive root.
shelf=box('Bookshelf',(-2.75,1.6,1.0),(.40,1.2,2),clay,i,.015)
cursor=scene.cursor.location.copy();scene.cursor.location=(-2.75,1.6,0)
bpy.context.view_layer.objects.active=shelf;bpy.ops.object.origin_set(type='ORIGIN_CURSOR');scene.cursor.location=cursor
# Floor layout: round rug, beanbag, cat bed, and a floor fan.
cyl(p+'Rug',(.4,-.6,.01),1.3,.02,light,f)
sphere(p+'Beanbag',(.1,-1.40,.33),(.44,.43,.31),clay,f)
cyl(p+'CatBed',(1,-1.2,.025),.33,.01,clay,f)
cyl(p+'FanBase',(2.20,-.45,.035),.24,.07,dark,pr)
rod(p+'FanPole',(2.20,-.45,.06),(2.20,-.45,1.10),.025,dark,pr)
fan=cyl(p+'FanHead',(2.20,-.45,1.13),.26,.12,clay,pr);fan.rotation_euler.x=math.pi/2
# Large plant is only a pot and leaf-mass envelope at the layout gate.
cyl(p+'LargePlantPot',(2.55,2.55,.23),.22,.46,clay,pr,r2=.28)
rod(p+'LargePlantStem',(2.55,2.55,.46),(2.55,2.55,1.03),.032,dark,pr)
for dx,dy,z,s in [(-.13,0,1.05,.27),(.14,.04,1.30,.29),(-.11,-.04,1.49,.23)]:
    sphere(p+'LargePlantMass',(2.55+dx,2.55+dy,z),(s*.85,s*.72,s),clay,pr)
# Curtain masses, not detailed folds yet.
for x in [1.43,2.37]:box(p+'Curtain',(x,2.90,1.75),(.20,.08,1.55),clay,f,.025)
# Contractual interactive objects are deliberately simple layout proxies.
diary=box('Diary',(0,0,.0375),(.36,.46,.075),clay,i,.01)
cursor=scene.cursor.location.copy();scene.cursor.location=(0,0,0)
bpy.context.view_layer.objects.active=diary;bpy.ops.object.origin_set(type='ORIGIN_CURSOR');scene.cursor.location=cursor
diary.rotation_euler.z=math.radians(-17);diary.location=(-.05,2.335,.8)
parts=[box(p+'MonitorBase',(0,0,.015),(.32,.20,.03),dark,i,.01),
       box(p+'MonitorStand',(0,.01,.17),(.07,.05,.28),dark,i,.008),
       box(p+'MonitorShell',(0,0,.6),(1,.05,.64),dark,i,.01),
       box(p+'Keyboard',(0,-.43,.015),(.68,.23,.03),clay,i,.008),
       sphere(p+'Mouse',(.48,-.43,.025),(.045,.068,.025),light,i)]
computer=join('Computer',parts,(0,0,0));computer.location=(.85,2.68,.8)
mesh=bpy.data.meshes.new('RBN_ScreenMesh');mesh.from_pydata([(-.47,0,-.28),(.47,0,-.28),(.47,0,.28),(-.47,0,.28)],[],[(0,1,2,3)]);mesh.update()
screen=bpy.data.objects.new('Computer_Screen',mesh);col(i).objects.link(screen);screen['owner']=OWNER
screen.location=(.85,2.652,1.40);mesh.materials.append(M['screen']);parent_keep(screen,computer)
parts=[cyl(p+'LampBase',(0,0,.015),.095,.03,clay,i),rod(p+'LampStem',(0,0,.03),(0,0,.36),.014,dark,i)]
lamp=join('Lamp',parts,(0,0,0));lamp.location=(-.42,2.72,.8)
shade=cyl('Lamp_Shade',(-.42,2.72,1.23),.145,.18,clay,i,r2=.065)
cursor=scene.cursor.location.copy();scene.cursor.location=(-.42,2.72,1.14)
bpy.context.view_layer.objects.active=shade;bpy.ops.object.origin_set(type='ORIGIN_CURSOR');scene.cursor.location=cursor;parent_keep(shade,lamp)
empty('Lamp_Light',(-.42,2.72,1.06),c=i,parent=lamp)
parts=[sphere(p+'CatBody',(0,0,.10),(.21,.15,.10),clay,i),sphere(p+'CatHead',(.14,-.11,.16),(.105,.095,.095),light,i)]
cat=join('Cat',parts,(0,0,0),angle=math.radians(45));cat.location=(1,-1.2,.03)
for name,y,z,w,h in [('Frame_1',-1.15,1.65,.50,.42),('Frame_2',-1.80,1.85,.40,.52)]:
    o=box(name,(-2.98,y,z),(.04,w,h),clay,i,.01)
    cursor=scene.cursor.location.copy();scene.cursor.location=(-2.98,y,z-h/2)
    bpy.context.view_layer.objects.active=o;bpy.ops.object.origin_set(type='ORIGIN_CURSOR');scene.cursor.location=cursor
# Basic envelopes ensure the crowded desktop remains feasible before detailing.
cyl(p+'Mug',(-.45,2.47,.88),.060,.16,light,pr)
box(p+'Speaker',(.20,2.73,.91),(.13,.13,.22),dark,pr,.012)
box(p+'HeadphoneStand',(-.43,2.20,1.00),(.13,.13,.40),dark,pr,.015)
cyl(p+'SucculentPot',(1.48,2.20,.86),.055,.12,clay,pr)
sphere(p+'SucculentMass',(1.48,2.20,.97),(.068,.068,.065),light,pr)
box(p+'StickyNotes',(.30,2.25,.81),(.10,.10,.02),light,pr,.004)
# Markers stay independent and at the v2 contractual coordinates.
markers={'Cam_Room':(7.5,-7.5,6.2),'Cam_Room_Target':(0,.4,.8),
         'Cam_Diary':(-.05,1.5,2),'Cam_Diary_Target':(-.05,2.30,.8),
         'Cam_Shelf':(-.78,1.6,1.2),'Cam_Shelf_Target':(-2.75,1.6,1)}
for name,pos in markers.items():empty(name,pos)
for o in scene.objects:
    if o.get('owner')==OWNER and (o.name.startswith(p) or o.name in ['Diary','Computer','Computer_Screen','Lamp','Lamp_Shade','Lamp_Light','Cat','Bookshelf','Frame_1','Frame_2']):
        o['blockout_only']=True
scene['v2_gate']='Stage 3: awaiting layout approval; no detailed modeling, final lighting, UV, bake or export.'
if not globals().get('SKIP_BLOCKOUT_CHECKPOINT',False):save_render(3)
