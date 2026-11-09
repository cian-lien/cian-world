from common import *
col=clear_stage('Garden');variants=clear_stage('Seasons');r=random.Random(1949)
garden=empty('Garden',(0,0,0),col,interaction='solar-term-garden')
def leaf(name,start,end,width,material,col,parent=None):
    a,b=Vector(start),Vector(end);axis=b-a;side=axis.cross(Vector((0,0,1)))
    if side.length<.01:side=Vector((1,0,0))
    side.normalize();v=[]
    for i in range(5):
        t=i/4;c=a+axis*t+Vector((0,0,.03*math.sin(t*math.pi)));w=width*math.sin(math.pi*t)**.8
        v.extend([c-side*w,c+Vector((0,0,.008)),c+side*w])
    f=[]
    for i in range(4):k=i*3;f.extend([(k,k+3,k+4,k+1),(k+1,k+4,k+5,k+2)])
    return mesh(name,v,f,material,col,parent,smooth=True)
def planter(name,loc,dimensions=(.55,.8,.27)):
    x,y,z=loc;w,d,h=dimensions;p=empty(name,loc,col,garden,crop=name)
    box(name+'_Bottom',(x,y,z+.035),(w,d,.07),'white',col,p,r=.025)
    for xx in [x-w/2+.025,x+w/2-.025]:box(name+'_Wall',(xx,y,z+h/2),(.05,d,h),'white',col,p,r=.018)
    for yy in [y-d/2+.025,y+d/2-.025]:box(name+'_Wall',(x,yy,z+h/2),(w,.05,h),'white',col,p,r=.018)
    box(name+'_Soil',(x,y,z+h-.055),(w-.10,d-.10,.06),'soil',col,p,r=.018)
    for xx in [x-w/2-.002,x+w/2+.002]:box(name+'_FoamGroove',(xx,y,z+h*.54),(.003,d*.8,.009),'linen',col,p,r=0)
    return p,z+h-.025
# Scallions with several slender curved blade leaves.
p,z=planter('ScallionBox',(2.97,1.45,0))
for j in range(10):
    x=2.97+r.uniform(-.16,.16);y=1.45+r.uniform(-.28,.28)
    for k in range(5):
        a=r.random()*math.tau;h=r.uniform(.23,.44);pts=[]
        for n in range(5):t=n/4;pts.append((x+math.cos(a)*.095*t*t,y+math.sin(a)*.095*t*t,z+h*t))
        tube('ScallionBlade',pts,.006 if k%2 else .008,'leafDark',col,p,res=1)
# Mint, short stems and paired oval leaves.
p,z=planter('MintBox',(2.97,.42,0))
for j in range(7):
    x=2.97+r.uniform(-.16,.16);y=.42+r.uniform(-.28,.28);height=r.uniform(.22,.34)
    rod('MintStem',(x,y,z),(x,y,z+height),.004,'leafDark',col,p,vertices=6,r=0)
    for k in range(3):
        h=z+.08+k*.075;angle=j*.6+k*.8
        for sign in [-1,1]:leaf('MintLeaf',(x,y,h),(x+sign*math.cos(angle)*.095,y+sign*math.sin(angle)*.095,h+.03),.032,'leaf',col,p)
# Chili plants, clean stylized red fruit.
p,z=planter('ChiliBox',(2.97,-.62,0))
for j in range(5):
    x=2.97+r.uniform(-.14,.14);y=-.62+r.uniform(-.26,.26);height=r.uniform(.36,.53)
    rod('ChiliStem',(x,y,z),(x,y,z+height),.006,'leafDark',col,p,vertices=6,r=0)
    for k in range(6):
        a=j+k*2.4;h=z+.12+k*.05;end=(x+math.cos(a)*.15,y+math.sin(a)*.15,h+.03)
        leaf('ChiliLeaf',(x,y,h),end,.027,'leafDark' if k%2 else 'leaf',col,p)
        if k%2==0:
            px,py,pz=end;tube('ChiliFruit',[(px,py,pz),(px+.01,py,pz-.06),(px+.025,py,pz-.13),(px+.035,py,pz-.15)],.013,'red',col,p,res=1)
# One round ceramic water crock, hollow rim and visible water surface.
crock=empty('LotusCrock',(3.13,-2.31,0),col,garden)
lathe('EarthenwareCrock',(3.13,-2.31,0),[(.0,.015),(.30,.015),(.42,.05),(.49,.27),(.49,.44),(.47,.49),(.43,.49),(.43,.44),(.42,.10),(.0,.10)],'terracotta',col,crock,n=32)
torus('CrockLip',(3.13,-2.31,.475),.455,.022,'terracotta',col,crock)
cylinder('CrockWater',(3.13,-2.31,.405),.429,.008,'water',col,crock,vertices=48,r=0)
for j in range(5):
    x=3.13+r.uniform(-.22,.22);y=-2.31+r.uniform(-.22,.22);rad=r.uniform(.105,.15);a=j*.9
    v=[(x,y,.419)]+[(x+rad*math.cos(a+.18+i/22*(math.tau-.36)),y+rad*math.sin(a+.18+i/22*(math.tau-.36)),.419+.004*math.cos(i)) for i in range(23)]
    mesh('LotusPad',v,[(0,i+1,i+2) for i in range(22)],'leafDark' if j%2 else 'leaf',col,crock)
    for k in range(5):
        aa=a+.4+k*1.1;rod('LotusVein',(x,y,.424),(x+rad*.82*math.cos(aa),y+rad*.82*math.sin(aa),.424),.001,'leafLight',col,crock,vertices=5,r=0)
# Five named seasonal groups, summer is the approved presentation default.
season={}
for term in ['lichun','qingming','xiazhi','liqiu','dongzhi']:
    season[term]=empty('Season_'+term,(0,0,0),variants,solar_term=term,visible_by_default=term=='xiazhi')
def lotus_flower(x,y):
    parent=season['xiazhi'];rod('LotusFlowerStem',(x,y,.40),(x,y,.48),.006,'leafDark',variants,parent)
    for ring,(n,rad,high) in enumerate([(9,.09,.05),(7,.065,.07),(5,.038,.08)]):
        for k in range(n):
            angle=math.tau*k/n+ring*.3;side=Vector((-math.sin(angle),math.cos(angle),0));v=[]
            for q in range(5):
                t=q/4;rr=.012+rad*t;c=Vector((x+math.cos(angle)*rr,y+math.sin(angle)*rr,.47+math.sin(t*math.pi/2)*high));w=.03*math.sin(t*math.pi)**.7
                v.extend([c-side*w,c+Vector((0,0,.004)),c+side*w])
            f=[]
            for q in range(4):i=q*3;f.extend([(i,i+3,i+4,i+1),(i+1,i+4,i+5,i+2)])
            mesh('LotusPetal',v,f,'pink' if ring==0 else 'pinkLight',variants,parent,smooth=True)
    uv('LotusSeedHead',(x,y,.53),(.019,.019,.014),'yellow',variants,parent,segments=12,rings=6)
lotus_flower(3.01,-2.35);lotus_flower(3.31,-2.23)
# A small summer lychee plate; base tea jug remains part of the tea furniture.
parent=season['xiazhi'];lathe('LycheePlate',(-.48,-1.92,.514),[(0,0),(.16,0),(.19,.025),(.17,.035),(.12,.02),(0,.02)],'paper',variants,parent,n=24)
for i in range(7):
    a=i*2.4;rr=.10*math.sqrt(i/7);x=-.48+math.cos(a)*rr;y=-1.92+math.sin(a)*rr;zz=.56+(.05 if i==6 else 0)
    ico('SummerLychee',(x,y,zz),(.038,.038,.04),'fruit',variants,parent,sub=2)
    leaf('LycheeLeaf',(x,y,zz+.027),(x+.035,y+.015,zz+.03),.012,'leafDark',variants,parent)
# Bougainvillea vines: individual small faceted leaves and triad bracts, two wind roots.
for name,origin,extent,number in [('Bougainvillea_Right',(3.85,-1.15,.1),2.1,80),('Bougainvillea_Stair',(-3.8,2.7,.1),1.45,68)]:
    parent=empty(name,origin,col,garden,wind_part=True,plant='bougainvillea')
    ox,oy,oz=origin
    for j in range(4):
        pts=[]
        for k in range(12):
            t=k/11;pts.append((ox+math.sin(t*8+j)*.12,oy+(t-.25)*extent*.7,oz+t*(1.15 if 'Right' in name else 2.55)))
        tube('BougainvilleaVine',pts,.016,'woodDark',col,parent,res=1)
    for j in range(number):
        if 'Right' in name:x=ox+r.uniform(-.22,.12);y=oy+r.uniform(-.5,1.9);zz=r.uniform(.74,1.28)
        else:x=ox+r.uniform(-.20,.52);y=oy+r.uniform(-.45,.50);zz=r.uniform(1.6,2.75)
        angle=r.random()*math.tau;leaf('BougainvilleaLeaf',(x,y,zz),(x+.15*math.cos(angle),y+.15*math.sin(angle),zz+.04),.045,'leaf' if j%3 else 'leafLight',col,parent)
        if j%2==0:
            for k in range(3):
                aa=angle+k*math.tau/3;leaf('BougainvilleaBract',(x,y,zz+.015),(x+.075*math.cos(aa),y+.075*math.sin(aa),zz+.065),.037,'pink' if j%4 else 'pinkLight',col,parent)
            uv('BougainvilleaFlower',(x,y,zz+.05),(.009,.009,.02),'paper',col,parent,segments=6,rings=4)
# Lichun kumquat pot and small fruit tree; ordinary weather remains independent.
parent=season['lichun'];x,y=-1.6,-1.45
lathe('KumquatPot',(x,y,0),[(0,0),(.16,0),(.21,.28),(.23,.30),(.20,.33),(.17,.30)],'terracotta',variants,parent,n=20)
rod('KumquatTrunk',(x,y,.25),(x,y,.95),.025,'woodDark',variants,parent)
for j in range(22):
    a=j*2.4;rr=r.uniform(.08,.27);zz=r.uniform(.68,1.12);xx=x+math.cos(a)*rr;yy=y+math.sin(a)*rr
    rod('KumquatBranch',(x,y,.59),(xx,yy,zz),.008,'woodDark',variants,parent,vertices=6,r=0)
    leaf('KumquatLeaf',(xx,yy,zz),(xx+math.cos(a)*.09,yy+math.sin(a)*.09,zz+.02),.027,'leafDark',variants,parent)
    if j%2==0:ico('KumquatFruit',(xx,yy,zz-.025),(.033,.033,.036),'yellow',variants,parent,sub=2)
# Qingming kites: decorative, do not manufacture rain or mist.
for j in range(3):
    parent=season['qingming'];x=-2+j*1.8;y=6+j*.8;z=2+j*.4
    mesh('SpringKite',[(x,y,z+.35),(x+.20,y,z),(x,y,z-.24),(x-.20,y,z)],[(0,1,2),(0,2,3)],'red' if j==1 else 'paper',variants,parent)
    tube('KiteTail',[(x,y,z-.24),(x+.08,y,z-.48),(x-.04,y,z-.7),(x+.10,y,z-.91)],.009,'clothBlue',variants,parent,res=1)
# First autumn leaves, deliberately sparse.
for i in range(5):
    x=3.1+r.uniform(-.5,.4);y=-2.8+r.uniform(-.4,.4)
    leaf('FirstAutumnLeaf',(x,y,.014),(x+.12,y+.06,.019),.028,'yellow',variants,season['liqiu'])
# Dongzhi: cured sausages, little lanterns, and tangyuan bowl.
parent=season['dongzhi']
for i in range(5):
    y=-1.65+i*.5
    tube('SausageString',[(-2.74,y,1.77),(-2.74,y,1.61)],.003,'wood',variants,parent,res=1)
    for sign in [-1,1]:
        tube('CuredSausage',[(-2.74,y+sign*.025,1.60),(-2.74,y+sign*.03,1.43),(-2.74,y+sign*.065,1.32)],.025,'redDark',variants,parent,res=2)
for i in range(3):
    x=1.7+i*.64;y=3.45;z=1.08
    tube('LanternString',[(x,y,.80),(x,y,1.27)],.006,'woodDark',variants,parent)
    lathe('WinterLantern',(x,y,z-.14),[(.03,0),(.10,.04),(.12,.14),(.09,.25),(.03,.28)],'red',variants,parent,n=12)
    for zz in [z-.14,z+.14]:cylinder('LanternCap',(x,y,zz),.052,.022,'yellow',variants,parent,vertices=12)
    tube('LanternTassel',[(x,y,z-.15),(x,y,z-.27)],.008,'yellow',variants,parent)
lathe('TangyuanBowl',(-.49,-1.9,.52),[(.03,0),(.10,.02),(.14,.09),(.13,.10),(.11,.04),(.03,.02)],'paper',variants,parent,n=24)
for i in range(5):uv('Tangyuan',(-.49+math.sin(i*2.4)*.065,-1.9+math.cos(i*2.4)*.065,.59),(.026,.026,.023),'white',variants,parent,segments=12,rings=6)
empty('SteamAnchor',(-.49,-1.9,.64),variants,parent,role='steam-particles')
# Default presentation only summer; all alternate geometry remains editable and exportable.
for term,parent in season.items():
    for o in parent.children_recursive:
        o.hide_render=term!='xiazhi';o.hide_set(term!='xiazhi');o['solar_term']=term
print('Garden and seasons:',len(col.objects),'base objects;',len(variants.objects),'season objects; five complete roots')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'rooftop.blend'))
