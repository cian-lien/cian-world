from common import *
near=clear_stage('CityNear');mid=clear_stage('CityMiddle');far=clear_stage('CityFar');decor=clear_stage('SkylineMotion')
r=random.Random(1573)

def box(name, loc, size, material, col, parent=None, r=.015):
    """Create the repeated city blocks without changing Blender's selection."""
    x,y,z=(v/2 for v in size)
    vertices=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
    faces=[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    o=mesh(name,vertices,faces,material,col,parent)
    o.location=loc
    bevel(o,min(r,min(size)*.32))
    return o

for name,color in {'cityCream':'e1d1ba','cityClay':'c6aa95','citySage':'a9b5ae','cityGray':'bac3c5','cityRose':'ccbab9','cityWindow':'748481','midCream':'cfbdab','midClay':'c0a897','midGreen':'91a696','river':'91afb1','riverBank':'b9c2b5','farGray':'b8c1d4','mountainBack':'a9c1dc','mountainFront':'99b5d2','cloud':'d4dcd7','street':'a8aea9','paving':'c1bcad'}.items():mat(name,color)
mat('river','91afb1',.34,.05)
ground=STREET_LEVEL
near_shore, far_shore = 28.7, 37.7
box('StreetGround',(0,(near_shore-130)/2,ground-.24),(320,near_shore+130,.48),'street',near,r=0)
box('Riverbed',(0,(near_shore+far_shore)/2,ground-.43),(172,far_shore-near_shore,.30),'riverBank',mid,r=0)
for x in [-11.7,-4.65,4.82,12.2]:
    box('StreetSidewalk',(x,1,ground+.026),(.42,46,.052),'paving',near,r=.01)
for y in [5.45,10.6,16.4,22.3,26.1]:
    box('CrossStreet',(0,y,ground+.013),(172,1.08,.026),'paving',near,r=0)
# Window quads form one mesh per tier, with one seed value per face for runtime window shaders.
window_data={tier:[[],[],[]] for tier in ['near','middle']}
def windows(tier,x,y,z,w,h,rows,cols,side=0):
    v,f,seeds=window_data[tier]
    for row in range(rows):
        for j in range(cols):
            xx=x+(j-(cols-1)/2)*w/cols;zz=z+(row+.5)*h/rows;ww=min(.35,w/cols*.44);hh=min(.48,h/rows*.48)
            k=len(v);p=[(xx-ww/2,y,zz-hh/2),(xx+ww/2,y,zz-hh/2),(xx+ww/2,y,zz+hh/2),(xx-ww/2,y,zz+hh/2)]
            v.extend(p if not side else [(b,a,c) for a,b,c in p]);f.append((k,k+1,k+2,k+3) if side>=0 else (k+3,k+2,k+1,k));seeds.append(r.random())
def small_tank(x,y,z,col):
    for dx in [-.18,.18]:rod('NeighborTankLeg',(x+dx,y,z),(x+dx,y,z+.28),.022,'metalDark',col)
    lathe('NeighborRoofTank',(x,y,z+.24),[(0,0),(.25,0),(.30,.07),(.30,.60),(.23,.67),(0,.67)],'metal',col,n=16)
    torus('NeighborTankBand',(x,y,z+.59),.30,.009,'metalDark',col)
def neighbor(i,x,y,w,d,top):
    palette=['cityCream','cityClay','citySage','cityGray','cityRose'];material=palette[i%len(palette)];bottom=ground
    box('NeighborBlock',(x,y,(bottom+top)/2),(w,d,top-bottom),material,near,r=.025)
    box('NeighborCoping',(x,y,top+.04),(w+.10,d+.10,.10),'cityCream',near,r=.025)
    for xx in [x-w/2,x+w/2]:box('NeighborParapet',(xx,y,top+.22),(.10,d,.35),material,near)
    for yy in [y-d/2,y+d/2]:box('NeighborParapet',(x,yy,top+.22),(w,.10,.35),material,near)
    rows=max(2,round((top-bottom)/2.2));cols=max(2,int(w/.95));front=y-d/2
    windows('near',x,front-.014,bottom,w,top-bottom-.2,rows,cols)
    for side in [-1,1]:windows('near',y,x+side*(w/2+.014),bottom,d,top-bottom-.2,rows,max(2,int(d/.95)),side)
    for row in range(rows):
        zz=bottom+(row+.5)*(top-bottom-.2)/rows
        box('NeighborFloorCourse',(x,front-.017,zz-.62),(w,.05,.07),'cityCream',near,r=0)
        for j in range(cols):
            xx=x+(j-(cols-1)/2)*w/cols
            box('NeighborSill',(xx,front-.04,zz-.255),(.49,.13,.05),'cityCream',near,r=.006)
            if row>=rows-2:
                for dx in [-.13,0,.13]:box('NeighborWindowGrille',(xx+dx,front-.038,zz),(.018,.028,.46),'metalDark',near,r=0)
    if i<16 and i%2==0:small_tank(x-w*.19,y,top+.1,near)
    if i<16 and i%3==0:
        rod('NeighborAerial',(x+.4,y+.1,top),(x+.4,y+.1,top+1.1),.012,'metalDark',near)
        rod('NeighborAerialBar',(x+.08,y+.1,top+.9),(x+.72,y+.1,top+.9),.009,'metalDark',near)
    if i<16 and i%3==1:
        a=(x-w*.32,y,top+.8);b=(x+w*.32,y,top+.8);rod('NeighborClothesLine',a,b,.009,'woodDark',near)
        for j in range(3):box('NeighborLaundry',(x+(j-1)*.30,y,top+.58),(.22,.012,.38),'white' if j%2 else 'clothBlue',near,r=.008)
# Neighbors stay below the hero roof; open the view toward the river.
lots=[(-6.75,2.7,3.4,4.0,-3.2),(-7.1,8.0,3.6,3.5,-2.6),(-4.7,12.7,3.8,3.0,-4.7),
      (-.8,12.7,3.3,3.1,-5.2),(3.2,12.7,3.7,3.1,-4.9),(6.7,6.0,3.2,3.1,-2.5),
      (7.1,1.2,3.8,4.3,-3.35),(6.75,10.0,3.25,3.0,-3.6),(-10.6,5.2,3.15,3.3,-4.7)]
for row in range(3):
    for j in range(10):
        x=(j-4.5)*3.8+(row%2)*.6
        if row==2 and -4<x<10:continue
        roof=[-7.65,-8.75,-10.05][row]
        lots.append((x,16.3+row*3.4,3.05,2.55,roof+r.uniform(-.45,.45)))
for i,p in enumerate(lots):neighbor(i,*p)
# Continuous qilou arcade roofs and compact arched shop fronts.
def arch(name,x,y,z,width,height,material,col):
    rr=width/2;th=.085;pts=[]
    for rad in [rr,rr-th]:
        for i in range(13):a=math.pi*i/12;pts.append((x+math.cos(a)*rad,y,z+height-rr+math.sin(a)*rad))
    v=pts+[(xx,yy+.16,zz) for xx,yy,zz in pts];f=[]
    for i in range(12):f.extend([(i,i+1,13+i+1,13+i),(26+i,39+i,40+i,27+i),(i,26+i,27+i,i+1),(13+i,14+i,40+i,39+i)])
    mesh(name,v,f,material,col)
    for xx in [x-rr+th/2,x+rr-th/2]:box(name+'_Pillar',(xx,y+.08,z+(height-rr)/2),(th,.16,height-rr),material,col,r=.008)
for j in range(9):
    x=-11.0+j*3.2;y=24.5;w=3.08;top=-10.65+(j%3)*.18;bottom=ground;material='midCream' if j%2 else 'midClay'
    box('QilouUpperFloor',(x,y,(top+bottom+2.15)/2),(w,2.2,top-bottom-2.15),material,mid,r=.022)
    box('QilouRearWall',(x,y+.95,bottom+1.08),(w,.26,2.16),material,mid,r=.008)
    box('QilouCornice',(x,y-1.05,top-.12),(w+.18,.34,.15),'cityCream',mid)
    box('QilouRoof',(x,y,top+.05),(w+.20,2.38,.16),'midClay',mid)
    for k in range(3):arch('QilouArcade',x+(k-1)*.96,y-1.1,bottom,.91,2.15,material,mid)
    windows('middle',x,y-1.12,bottom+2.26,w,top-bottom-2.41,2,3)
    box('QilouBalustrade',(x,y-1.04,top+.15),(w,.09,.24),'cityCream',mid)
# Banyan crowns emerge above the near streets, broad but inexpensive.
canopy_shape=ico('BanyanCrown',(0,0,0),(1,1,1),'midGreen',mid,sub=2)
canopy_mesh=canopy_shape.data
bpy.data.objects.remove(canopy_shape,do_unlink=True)
for j,(x,y,z) in enumerate([(-7.8,12.6,-6.8),(7.8,14.7,-7.0),(.8,22.3,-9.5),(3.7,26.3,-11.0),(-3.3,26.8,-11.1),
                            (-12.1,22.7,-10.15),(11.8,26.8,-11.2),(5.45,27.1,-11.5),(-2,15.0,-7.3)]):
    rod('BanyanTrunk',(x,y,ground),(x,y,z+1.25),.15,'woodDark',mid,vertices=8)
    for k in range(11):
        a=k*2.4;rr=math.sqrt(k/11)*1.45
        o=bpy.data.objects.new('BanyanCrown',canopy_mesh);mid.objects.link(o);o['generator']=TAG
        o.location=(x+math.cos(a)*rr,y+math.sin(a)*rr*.65,z+1.2+r.uniform(-.1,.45));o.scale=(.82,.75,.58)
# River, far bank, bridge and small boat, all behind the immediate city.
box('RiverSurface',(0,(near_shore+far_shore)/2,ground-.06),(172,far_shore-near_shore,.08),'river',mid,r=0)
for y in [near_shore,far_shore]:box('RiverBank',(0,y,ground),(172,.33,.21),'riverBank',mid)
for i in range(22):
    x=r.uniform(-22,22);y=r.uniform(near_shore+.45,far_shore-.45);box('RiverGlint',(x,y,ground-.019),(r.uniform(.25,1.3),.025,.002),'cloud',mid,r=0)
by=34.0
bridge=empty('BridgeTrafficRoot',(0,by,ground+1.08),decor,route='east-west',animate='traffic-lights')
box('ElevatedBridge',(0,by,ground+.94),(56,.88,.18),'farGray',far,r=.018)
for x in range(-26,27,4):
    box('BridgePier',(x,by,ground-.02),(.30,.77,1.9),'farGray',far)
    # A shallow segmental arch in each span leaves a real opening underneath.
    for yy in [by-.43,by+.27]:
        v=[];f=[]
        for k in range(17):
            dx=-1.86+k*3.72/16
            lower=ground+.05+.68*math.sqrt(max(0,1-(dx/1.86)**2))
            v.extend([(x+2+dx,yy,lower),(x+2+dx,yy,ground+.90)])
            if k:f.append((2*k-2,2*k,2*k+1,2*k-1))
        mesh('BridgeSpandrel',v,f,'farGray',far)
for y in [by-.41,by+.41]:box('BridgeRail',(0,y,ground+1.12),(56,.05,.19),'farGray',far)
for i in range(22):
    x=-25+i*2.3;box('TrafficLight',(x,by-.32 if i%2 else by+.18,ground+1.09),(.11,.055,.055),'cityLight',decor,bridge,r=.006)
bx,ry=9.2,33.0
boat=empty('RiverBoat',(bx,ry,ground),decor,route='river',animate='boat')
box('BoatHull',(bx,ry,ground+.04),(1.62,.48,.20),'cityCream',decor,boat,r=.07)
box('BoatCabin',(bx-.06,ry,ground+.26),(.86,.36,.26),'white',decor,boat,r=.025)
box('BoatWindshield',(bx-.06,ry-.19,ground+.28),(.67,.01,.13),'cityWindow',decor,boat,r=.003)
for x in [bx-.64,bx+.64]:uv('BoatRunningLight',(x,ry,ground+.24),(.045,.045,.045),'cityLight',decor,boat,segments=8,rings=4)
# Distant compact skyline; increasingly pale and simple by distance.
def far_ground(y):return ground-(y-far_shore)*.67
for a,b in [(far_shore,44.0),(44.0,53.0),(53.0,61.0)]:
    mesh('FarBankTerrain',[(-90,a,far_ground(a)),(90,a,far_ground(a)),(90,b,far_ground(b)),(-90,b,far_ground(b))],[(0,1,2,3)],'riverBank',far)
for i in range(42):
    x=-37+i*1.76;y=40.2+r.uniform(-.4,3.7);height=r.uniform(.6,2.25);z=far_ground(y+.75)+height/2
    box('FarBuilding',(x,y,z),(r.uniform(.75,1.4),r.uniform(.7,1.5),height),'farGray',far,r=.015)
# Invented TV tower silhouette: tapering shaft and two shallow offset decks, no real landmark details.
x,y=10.2,44.7;z=far_ground(y)
cone('AbstractTowerShaft',(x,y,z+1.70),.23,.09,3.4,'farGray',far,vertices=10)
lathe('AbstractTowerPod',(x,y,z+3.08),[(.1,0),(.33,.1),(.30,.23),(.16,.33),(.1,.33)],'farGray',far,n=16)
rod('AbstractTowerAntenna',(x,y,z+3.32),(x,y,z+4.5),.025,'farGray',far)
# Simple silhouette cards backed by a few centimeters of thickness.
for layer,(yy,base,height,material) in enumerate([(54,-24.4,4.3,'mountainBack'),(48.8,-21.8,4.1,'mountainFront')]):
    pts=[]
    for i in range(30):
        xx=-49+i*3.4;zz=base+1.5+height*(.48+.25*math.sin(i*.7+layer)+.12*math.sin(i*2.4))
        pts.append((xx,yy,zz))
    v=[(-52,yy,base-3)]+pts+[(52,yy,base-3)]
    mesh('MountainSilhouette',v,[tuple(range(len(v)))],material,far)
# One UV seed per city window. Runtime can replace the material with one threshold shader.
for tier,col in [('near',near),('middle',mid)]:
    v,f,seeds=window_data[tier];o=mesh('CityWindows_'+tier,v,f,'cityLight',col)
    uv_layer=o.data.uv_layers.new(name='WindowSeed')
    for poly,seed in zip(o.data.polygons,seeds):
        for li in poly.loop_indices:uv_layer.data[li].uv=(seed,0 if tier=='near' else 1)
    o['shader_role']='city-windows';o['seed_channel']='TEXCOORD_0.x';o['midnight_dimming']=True
# A few simple clouds, separate from exported city geometry so existing Sky may replace them.
clouds=collection('PreviewClouds')
for o in list(clouds.objects):bpy.data.objects.remove(o,do_unlink=True)
for i in range(6):
    x=-13+i*5.0;y=22;zz=1.8+(i%3)*.32
    for k in range(3):uv('PreviewCloud',(x+(k-1)*.55,y,zz),(.72,.35,.23),'cloud',clouds,segments=12,rings=6)
print('City layers:',[(c.name,len(c.objects)) for c in [near,mid,far]],'windows',sum(len(d[1]) for d in window_data.values()))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'rooftop.blend'))
