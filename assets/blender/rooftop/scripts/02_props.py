from common import *
col=clear_stage('Props');cloth=clear_stage('Laundry');tea=clear_stage('Tea');eq=clear_stage('Equipment')
root=bpy.data.objects['RooftopRoot']
# Corrugated zinc canopy: one smooth corrugated sheet, supported above the laundry.
verts=[];faces=[];n=72
for j,y in enumerate([-2.25,1.2]):
    for i in range(n+1):
        x=-3.92+i/n*1.48;z=2.12-(x+3.92)*.10+.025*math.cos(i/n*math.tau*18);verts.append((x,y,z))
for i in range(n):faces.append((i,i+1,n+2+i,n+1+i))
o=mesh('CorrugatedCanopy',verts,faces,'zinc',col,root);sol=o.modifiers.new('Tin thickness','SOLIDIFY');sol.thickness=.012;bevel(o,.004)
for y in [-2.2,1.13]:
    rod('CanopyBrace',(-3.85,y,.0),(-3.85,y,2.1),.032,'wood',col,root)
    rod('CanopyBeam',(-3.9,y,2.12),(-2.25,y,1.98),.028,'wood',col,root)
    rod('CanopyDiagonal',(-3.85,y,1.65),(-3.40,y,2.06),.021,'wood',col,root)
for x in [-3.75,-2.34]:rod('BambooLaundryPole',(x,-2.22,1.76),(x,1.05,1.76),.018,'wood',col,root)
# Soft low-density fabric; each hanging item retains a pivot at the upper edge.
def fabric(name,cy,width,height,material,shirt=False):
    p=empty(name+'_WindPivot',(-2.34,cy,1.69),cloth,wind_part=True,wind_seed=cy)
    v=[];f=[];nx=8;nz=8
    for j in range(nz+1):
        t=j/nz;half=width/2
        if shirt:half*=1.0 if .09<t<.36 else .66
        for i in range(nx+1):
            u=i/nx;v.append((-2.32+.02*math.sin(u*math.tau*2+t*4)+t*.035,cy+(u-.5)*half*2,1.69-t*height+.012*math.cos(u*9)))
    for j in range(nz):
        for i in range(nx):a=j*(nx+1)+i;f.append((a,a+1,a+nx+2,a+nx+1))
    o=mesh(name,v,f,material,cloth,p,smooth=True);s=o.modifiers.new('Cloth thickness','SOLIDIFY');s.thickness=.008;bevel(o,.003)
    for yy in [cy-width*.23,cy+width*.23]:box(name+'_Peg',(-2.33,yy,1.71),(.035,.018,.065),'wood',cloth,p,r=.003)
    tube(name+'_Hanger',[(-2.34,cy-width*.32,1.70),(-2.34,cy,1.81),(-2.34,cy+width*.32,1.70)],.007,'metalDark',cloth,p)
    tube(name+'_Hook',[(-2.34,cy,1.81),(-2.34,cy,1.86),(-2.34,cy+.025,1.88),(-2.34,cy+.045,1.86)],.006,'metalDark',cloth,p)
fabric('LinenTShirt',-.1,.55,.57,'white',True)
fabric('SageTShirt',.65,.48,.52,'sage',True)
fabric('PaleSheet',-1.20,.80,.95,'linen')
fabric('BlueTowel',-1.84,.32,.72,'clothBlue')
# Water tank, segmented stainless steel bands, three legs, supply pipe.
tank=empty('WaterTank',(-.72,2.48,0),eq,role='equipment')
for a in [0,math.tau/3,2*math.tau/3]:
    x=-.72+.34*math.cos(a);y=2.48+.34*math.sin(a)
    rod('TankLeg',(x,y,.03),(x,y,.73),.027,'metalDark',eq,tank)
    rod('TankLegBrace',(x,y,.11),(-.72,2.48,.6),.017,'metalDark',eq,tank)
lathe('TankBody',(-.72,2.48,.58),[(.0,0),(.36,0),(.46,.12),(.46,1.19),(.36,1.31),(.0,1.31)],'metal',eq,tank,n=24)
for z in [.81,1.1,1.42,1.71]:torus('TankRolledSeam',(-.72,2.48,z),.46,.012,'metalDark',eq,tank)
cylinder('TankLid',(-.72,2.48,1.92),.25,.055,'metal',eq,tank)
tube('TankPipe',[(-.3,2.6,.82),(-.16,2.6,.82),(-.16,2.6,.18),(-.16,3.13,.18)],.024,'metalDark',eq,tank)
# Evacuated-tube solar water heater (not photovoltaic panels).
solar=empty('SolarWaterHeater',(1.12,2.47,0),eq,role='equipment')
for x in [.38,1.82]:
    rod('HeaterFrame',(x,1.87,.07),(x,3.05,1.15),.022,'metalDark',eq,solar)
    rod('HeaterRearLeg',(x,3.05,.03),(x,3.05,1.15),.023,'metalDark',eq,solar)
    rod('HeaterBase',(x,1.82,.06),(x,3.13,.06),.025,'metalDark',eq,solar)
rod('HeaterLowerCross',(.38,1.87,.15),(1.82,1.87,.15),.025,'metal',eq,solar)
for i in range(10):
    x=.45+i*.142;rod('EvacuatedTube',(x,1.88,.24),(x,3.02,1.11),.052,'glass',eq,solar,vertices=12,r=.008)
rod('HeaterStorageTank',(.30,3.08,1.29),(1.91,3.08,1.29),.195,'metal',eq,solar,vertices=24,r=.015)
for x in [.31,1.90]:cylinder('HeaterEnd',(x,3.08,1.29),.199,.035,'metalDark',eq,solar,rot=(0,math.pi/2,0))
# AC condenser and its front grille.
ac=empty('ACCondenser',(-.15,1.45,0),eq)
box('CondenserBody',(-.15,1.45,.40),(.81,.44,.59),'white',eq,ac,r=.025)
for x in [-.44,.13]:box('ACFoot',(x,1.45,.08),(.10,.5,.1),'metalDark',eq,ac)
cylinder('ACFanRecess',(-.27,1.215,.42),.235,.018,'metalDark',eq,ac,vertices=24,rot=(math.pi/2,0,0))
torus('ACFanRim',(-.27,1.192,.42),.23,.012,'metal',eq,ac,rot=(math.pi/2,0,0))
for i in range(9):
    x=-.27+(i-4)*.045;dz=math.sqrt(max(0,.215**2-(x+.27)**2))
    rod('ACGrille',(x,1.177,.42-dz),(x,1.177,.42+dz),.005,'metal',eq,ac,vertices=6,r=0)
for i in range(7):box('ACSideSlots',(.16,1.211,.26+i*.041),(.09,.012,.012),'metalDark',eq,ac,r=.002)
tube('ACPipe',[(.26,1.5,.33),(.35,1.5,.33),(.35,2.0,.33),(-1.58,2.0,.33)],.018,'metalDark',eq,ac)
# A domestic TV aerial.
rod('TVAntennaMast',(-1.17,3.1,0),(-1.17,3.1,3.12),.019,'metalDark',eq)
rod('TVAntennaSpine',(-1.77,3.1,2.88),(-.57,3.1,2.88),.012,'metalDark',eq)
for i in range(5):
    x=-1.68+i*.23;d=.52-abs(i-2)*.08;rod('TVAntennaElement',(x,3.1-d/2,2.88),(x,3.1+d/2,2.88),.009,'metalDark',eq)
tube('AntennaCable',[(-1.17,3.1,2.86),(-1.2,3.14,1.1),(-1.6,3.14,.25)],.005,'ink',eq)
# Red plastic stools: flared legs and rounded seat, open underneath.
def stool(name,x,y):
    p=empty(name,(x,y,0),tea,interaction='tea-seat')
    box(name+'_Seat',(x,y,.40),(.40,.35,.065),'red',tea,p,r=.025)
    for a in [-1,1]:
        for b in [-1,1]:
            top=Vector((x+a*.135,y+b*.11,.38));bottom=Vector((x+a*.18,y+b*.155,.035));mid=(top+bottom)/2
            o=box(name+'_Leg',mid,(.06,.065,(top-bottom).length),'red',tea,p,r=.009)
            o.rotation_euler=(top-bottom).to_track_quat('Z','Y').to_euler()
    for yy in [y-.115,y+.115]:box(name+'_Apron',(x,yy,.315),(.30,.045,.09),'red',tea,p)
    for xx in [x-.14,x+.14]:box(name+'_Apron',(xx,y,.315),(.045,.24,.09),'red',tea,p)
    for i in [-1,0,1]:box(name+'_SeatSlit',(x+i*.055,y,.433),(.026,.075,.002),'redDark',tea,p,r=.01)
    empty(name+'_SitAnchor',(x,y,.44),tea,p,role='seat')
    return p
stool('TeaStool_Left',-.98,-1.87);stool('TeaStool_Right',.93,-2.10)
table=empty('TeaTable',(-.05,-1.72,0),tea,interaction='tea-and-latest-post')
box('TeaTableTop',(-.05,-1.72,.47),(1.38,.77,.08),'wood',tea,table,r=.025)
for x in [-.59,.49]:
    for y in [-2.0,-1.44]:box('TeaTableLeg',(x,y,.23),(.055,.055,.45),'woodDark',tea,table,r=.007)
for y in [-2.0,-1.44]:box('TeaTableFrame',(-.05,y,.37),(1.12,.04,.10),'woodDark',tea,table)
# Tray and small practical tea set.
box('TeaTray',(-.03,-1.74,.526),(.62,.33,.035),'woodDark',tea,table,r=.014)
for y in [-1.91,-1.57]:box('TeaTrayRim',(-.03,y,.55),(.65,.022,.048),'wood',tea,table,r=.005)
for x in [-.35,.29]:box('TeaTrayRim',(x,-1.74,.55),(.022,.34,.048),'wood',tea,table,r=.005)
for i in range(9):box('TeaTraySlat',(-.30+i*.067,-1.74,.55),(.048,.29,.012),'wood',tea,table,r=.004)
lathe('GongfuTeapot',(-.14,-1.7,.56),[(0,0),(.065,.005),(.09,.05),(.078,.09),(.043,.107),(.038,.11)],'terracotta',tea,table,n=20)
lathe('TeapotLid',(-.14,-1.7,.67),[(0,.012),(.038,.012),(.05,0)],'terracotta',tea,table,n=20)
uv('TeapotKnob',(-.14,-1.7,.69),(.014,.014,.012),'woodDark',tea,table)
tube('TeapotHandle',[(-.20,-1.7,.58),(-.25,-1.7,.60),(-.25,-1.7,.66),(-.20,-1.7,.66)],.012,'terracotta',tea,table)
tube('TeapotSpout',[(-.07,-1.7,.595),(-.035,-1.7,.62),(-.01,-1.7,.66)],.018,'terracotta',tea,table)
for i in range(3):
    x=-.04+i*.12;y=-1.83
    lathe('TeaCup',(x,y,.564),[(.023,0),(.032,.006),(.04,.045),(.034,.045),(.027,.01),(.023,.008)],'paper',tea,table,n=16)
    cylinder('TeaInCup',(x,y,.59),.029,.002,'woodDark',tea,table,r=0)
# Glass-colored herbal tea jug, warm amber and cream handle, deliberately simple.
lathe('HerbalTeaJug',(-.55,-1.64,.51),[(.0,0),(.085,0),(.10,.03),(.10,.18),(.075,.22),(.08,.235)],'yellow',tea,table,n=20)
tube('JugHandle',[(-.61,-1.64,.55),(-.69,-1.64,.57),(-.69,-1.64,.68),(-.61,-1.64,.71)],.014,'paper',tea,table)
torus('JugRim',(-.55,-1.64,.745),.079,.007,'paper',tea,table)
# Book, readable as a book without in-scene paragraphs.
box('LatestDiaryBook',(.48,-1.89,.533),(.20,.27,.045),'clothBlue',tea,table,r=.005,rot=(0,0,-.18))
box('BookPages',(.48,-1.89,.536),(.185,.252,.024),'paper',tea,table,r=.003,rot=(0,0,-.18))
box('BookTopCover',(.48,-1.89,.554),(.20,.27,.008),'clothBlue',tea,table,r=.003,rot=(0,0,-.18))
# Palm fan helper reused by the visitor outfit.
def palm_fan(name,origin,col,parent=None,scale=1,vertical=False):
    ox,oy,oz=origin;v=[(ox,oy,oz)]
    n=24
    for i in range(n):
        a=math.tau*i/n;rad=(.145+.009*math.cos(a*7))*scale
        v.append((ox+math.cos(a)*rad,oy+math.sin(a)*rad*.9,oz+.003*math.sin(a)))
    f=[(0,i+1,(i+1)%n+1) for i in range(n)]
    o=mesh(name,v,f,'yellow',col,parent)
    rod(name+'_Handle',(ox,oy-.12*scale,oz),(ox,oy-.31*scale,oz),.008*scale,'wood',col,parent)
    for i in range(9):
        a=.15+i*math.pi/8;rod(name+'_Rib',(ox,oy-.12*scale,oz+.003),(ox+math.cos(a)*.14*scale,oy+math.sin(a)*.12*scale,oz+.003),.0018*scale,'wood',col,parent,vertices=5,r=0)
    return o
palm_fan('TablePalmFan',(.43,-1.54,.515),tea,table,.72)
# Radio with grille, dial, handle, antenna and light anchor.
radio=empty('Radio',(.40,-1.48,.51),tea,interaction='sound-panel')
box('RadioBody',(.40,-1.48,.635),(.35,.13,.24),'wood',tea,radio,r=.018)
box('RadioFront',(.40,-1.552,.635),(.32,.012,.20),'woodDark',tea,radio,r=.01)
box('RadioSpeaker',(.32,-1.56,.63),(.17,.008,.15),'ink',tea,radio,r=.01)
for i in range(9):box('RadioSpeakerGrille',(.32,-1.567,.567+i*.015),(.16,.006,.003),'metalDark',tea,radio,r=.001)
box('RadioTuner',(.50,-1.563,.68),(.11,.006,.035),'paper',tea,radio,r=.003)
for x in [.472,.528]:cylinder('RadioKnob',(x,-1.57,.603),.019,.014,'metal',tea,radio,rot=(math.pi/2,0,0))
tube('RadioHandle',[(.27,-1.48,.75),(.27,-1.48,.81),(.53,-1.48,.81),(.53,-1.48,.75)],.009,'woodDark',tea,radio)
rod('RadioAntenna',(.54,-1.48,.75),(.43,-1.48,1.03),.004,'metal',tea,radio,vertices=6,r=0)
uv('RadioIndicator',(.55,-1.567,.68),(.007,.003,.007),'warmLight',tea,radio,segments=8,rings=4)
# Old lamp: one warm bulb for the tea area.
rod('LampPost',(-1.65,-.95,0),(-1.65,-.95,2.3),.025,'metalDark',col,root)
rod('LampArm',(-1.65,-.95,2.3),(-.20,-1.60,2.3),.022,'metalDark',col,root)
tube('LampFlex',[(-.20,-1.60,2.3),(-.20,-1.60,2.06),(-.20,-1.60,1.96)],.006,'ink',col,root)
cylinder('BulbSocket',(-.20,-1.60,1.94),.027,.07,'metalDark',col,root)
uv('TeaCornerBulb',(-.20,-1.60,1.855),(.045,.045,.064),'warmLight',col,root)
d=bpy.data.lights.new('TeaBulbLight','POINT');d.energy=0;d.shadow_soft_size=.12;d.color=rgba('ffd39b')[:3]
o=bpy.data.objects.new('TeaBulbLight',d);collection('Presentation').objects.link(o);o.location=(-.20,-1.60,1.83)
# Telescope with true tripod, independently rotatable tube.
scope=empty('Telescope',(2.52,2.34,0),col,interaction='astronomy-view')
for a in [0,math.tau/3,2*math.tau/3]:rod('TripodLeg',(2.52+.30*math.cos(a),2.34+.30*math.sin(a),.035),(2.52,2.34,.91),.017,'metalDark',col,scope)
rod('TripodStem',(2.52,2.34,.63),(2.52,2.34,1.04),.027,'metalDark',col,scope)
pivot=empty('Telescope_AzimuthPivot',(2.52,2.34,1.04),col,scope)
a=Vector((2.52,2.02,1.02));b=Vector((2.52,2.67,1.20));direction=(b-a).normalized()
rod('TelescopeTube',a,b,.081,'paper',col,pivot,vertices=24,r=.009)
for p in [a,b]:
    rod('TelescopeBand',p-direction*.022,p+direction*.022,.089,'metalDark',col,pivot,vertices=20)
rod('TelescopeLens',b+direction*.025,b+direction*.028,.073,'glass',col,pivot,vertices=24,r=0)
rod('TelescopeEyepiece',a-direction*.12,a,.03,'metalDark',col,pivot,vertices=12)
# All current-stage props remain separately named for shader/animation adapters.
print('Props:',sum(len(x.objects) for x in [col,cloth,tea,eq]),'objects; cloth pivots, door, radio, seats and scope independent')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'rooftop.blend'))
