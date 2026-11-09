import common as C
from common import *
col=clear_stage('Architecture');interactive=clear_stage('Interactive');anchors=clear_stage('Anchors');pres=clear_stage('Presentation')
if 'reference_composition' in SCENE:del SCENE['reference_composition']
SCENE.unit_settings.scale_length=1;enum(SCENE.unit_settings,'system','METRIC')
root=empty('RooftopRoot',(0,0,0),col,asset='rooftop',width=8.0,depth=7.0)
box('RoofFloor',(0,0,-.09),(8,7,.18),'floor',col,root,r=.025)
box('RoofCutEdge',(0,0,-.285),(8.12,7.12,.23),'cut',col,root,r=.025)
box('UpperFloorFacade',(0,0,-1.28),(7.98,6.98,1.76),'plaster',col,root,r=.02)
# Roof rainwater outlet and restrained expansion joints, not distressed textures.
for x in [-2,0,2]:box('FloorJoint',(x,0,.0008),(.004,6.7,.001),'limestone',col,root,r=0)
for y in [-1.75,0,1.75]:box('FloorJoint',(0,y,.0008),(7.7,.004,.001),'limestone',col,root,r=0)
# Reusable perforated Lingnan concrete flower tile.
def tile_geometry():
    n=24;v=[]
    for y in [-.055,.055]:
        for outer in [True,False]:
            for i in range(n):
                a=math.tau*i/n;cs,sn=math.cos(a),math.sin(a)
                r=.139/max(abs(cs),abs(sn)) if outer else .074+.018*math.cos(4*a)
                v.append((r*cs,y,r*sn))
    f=[]
    for i in range(n):
        j=(i+1)%n
        f.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    data=bpy.data.meshes.new('FlowerTileShared');data.from_pydata(v,[],f);data.materials.append(M['terracotta']);return data
shared=tile_geometry()
for side in range(4):
    length=8 if side<2 else 7;yy=(-3.5 if side==0 else 3.5) if side<2 else 0;xx=0 if side<2 else (-4 if side==2 else 4)
    box('ParapetBase',(xx,yy,.13),(length,.17,.26) if side<2 else (.17,length,.26),'limestone',col,root)
    box('ParapetTop',(xx,yy,.76),(length+.14,.23,.12) if side<2 else (.23,length+.14,.12),'limestone',col,root)
    box('ParapetWebTop',(xx,yy,.65),(length,.14,.13) if side<2 else (.14,length,.13),'plaster',col,root)
    n=int((length-.3)/.32)
    for i in range(n):
        k=(i-(n-1)/2)*.32;o=bpy.data.objects.new('FlowerLattice',shared);col.objects.link(o);o['generator']=TAG
        o.location=(k,yy,.43) if side<2 else (xx,k,.43);o.rotation_euler.z=0 if side<2 else math.pi/2;o.parent=root
    for k in [-length/2,0,length/2]:
        p=(k,yy,.42) if side<2 else (xx,k,.42)
        box('ParapetPier',p,(.19,.19,.84),'plaster',col,root)
        box('PierCap',(p[0],p[1],.86),(.27,.27,.1),'limestone',col,root)
# Stairwell, with a genuine opening and independent hinged door.
sx,sy=-2.65,2.42
box('StairBackWall',(sx,sy+.85,1.01),(2.12,.14,2.02),'plaster',col,root)
for x in [sx-1.0,sx+1.0]:box('StairSideWall',(x,sy,1.01),(.14,1.7,2.02),'plaster',col,root)
box('StairFrontLeft',(sx-.77,sy-.85,1.01),(.46,.14,2.02),'plaster',col,root)
box('StairFrontRight',(sx+.7,sy-.85,1.01),(.6,.14,2.02),'plaster',col,root)
box('StairLintel',(sx-.04,sy-.85,1.88),(.92,.14,.28),'plaster',col,root)
box('StairRoof',(sx,sy,2.065),(2.24,1.94,.17),'plaster',col,root,r=.025)
box('StairRoofCoping',(sx,sy,2.17),(2.25,1.95,.05),'limestone',col,root)
for x in [sx-.50,sx+.39]:box('DoorFrame',(x,sy-.94,.87),(.055,.055,1.76),'doorDark',col,root,r=.006)
box('DoorFrameTop',(sx-.055,sy-.94,1.75),(.95,.055,.055),'doorDark',col,root,r=.006)
door=empty('Door_Hinge',(sx-.49,sy-.97,.03),interactive,interaction='return-room',pivot='hinge')
box('GreenIronDoor',(sx-.055,sy-.974,.875),(.86,.045,1.69),'door',interactive,door,r=.009)
for z in [1.35+i*.042 for i in range(6)]:box('DoorVent',(sx-.055,sy-1.001,z),(.45,.015,.017),'doorDark',interactive,door,r=.003)
box('DoorPanel',(sx-.055,sy-1.002,.63),(.70,.012,.84),'door',interactive,door,r=.012)
box('DoorHandlePlate',(sx+.26,sy-1.02,.85),(.05,.025,.17),'metalDark',interactive,door)
rod('DoorHandle',(sx+.26,sy-1.045,.8),(sx+.26,sy-1.045,.9),.012,'metal',interactive,door)
box('DoorStep',(sx-.055,sy-1.06,.035),(1.01,.38,.07),'limestone',col,root)
# Small generic spring couplet; short scene lettering only.
box('SpringCouplet',(sx+.63,sy-.934,1.17),(.20,.012,.76),'red',col,root,r=.001)
for i,ch in enumerate('万事顺遂'):text('CoupletGlyph',ch,(sx+.63,sy-.946,1.42-i*.17),.13,'ink',col,root)
# Residential windows below rooftop; north anchor shares the river-facing skyline.
for x in [-1.7,1.65]:
    box('FacadeWindow',(x,-3.506,-1.26),(1.4,.035,.92),'glass',col,root,r=.006)
    for xx in [x-.72,x,x+.72]:box('WindowFrame',(xx,-3.54,-1.26),(.045,.035,1.04),'wood',col,root,r=.004)
    for z in [-1.77,-1.26,-.75]:box('WindowFrame',(x,-3.54,z),(1.48,.035,.04),'wood',col,root,r=.003)
    for i in range(8):rod('SecurityBars',(x-.63+i*.18,-3.60,-1.72),(x-.63+i*.18,-3.60,-.8),.007,'metalDark',col,root)
    box('WindowAwning',(x,-3.70,-.67),(1.6,.55,.035),'door',col,root,rot=(.15,0,0))
empty('RoomWindowAnchor',(1.55,3.53,-1.2),anchors,size=[.94,1.3],facing=[0,1,0])
for name,p in {'Door_Interact':(sx-.05,.99,0),'Tea_Interact':(.05,-.8,0),'Garden_Interact':(2.3,-.5,0),'Radio_Interact':(.7,-1.1,0),'Laundry_Interact':(-2.25,-.5,0),'Telescope_Interact':(2.25,1.65,0),'Cat_Interact':(-1.25,1.0,0),'VisitorSpawn':(-1.65,.2,0)}.items():empty(name,p,anchors,role='interaction-point')
# Broad studio-style summer light. Preview engine keeps the current valid engine.
w=bpy.data.worlds.new('RooftopSky');SCENE.world=w;w.use_nodes=True
bg=next(n for n in w.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=rgba('c2d0d2');bg.inputs[1].default_value=.55
sun_d=bpy.data.lights.new('Sun','SUN');sun_d.energy=2.2;sun_d.angle=.18;sun_d.color=rgba('fff0d1')[:3]
sun=bpy.data.objects.new('RooftopSun',sun_d);pres.objects.link(sun);sun.rotation_euler=(math.radians(28),math.radians(-24),math.radians(-34))
area('SkyFill',(1,-4,10),(0,0,0),900,8,'dbe6e4')
area('WarmBounce',(-6,-3,5),(0,1,0),450,6,'f6dec2')
cam=camera('RooftopCamera',(10,-14,12),(0,1.4,-.2),ortho=11.8);SCENE.camera=cam
SCENE.render.resolution_x=1560;SCENE.render.resolution_y=1200;SCENE.render.resolution_percentage=100
SCENE.render.image_settings.file_format='PNG';SCENE.render.image_settings.color_mode='RGBA'
SCENE.view_settings.view_transform='AgX'
SCENE['approved_concept']='reference/approved-concept.png';SCENE['generator']=TAG
bpy.context.view_layer.update()
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':a.spaces.active.region_3d.view_perspective='CAMERA'
print('Architecture built:',len(col.objects),'objects; roof8x7m; four enclosed sides; separate door/anchors')
