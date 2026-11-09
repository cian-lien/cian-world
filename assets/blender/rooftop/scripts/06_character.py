from common import *
col=clear_stage('Character');root=empty('VisitorRoot',(0,0,0),col,role='visitor',height=.9,forward=[0,-1,0],animation='procedural')
parts={k:[] for k in ['raincoat','umbrella','scarf','fan']}
def variant(o,kind):o['weather_variant']=kind;parts[kind].append(o);return o
body=empty('BodyPivot',(0,0,.34),col,root,animation_joint='body')
uv('ShirtBody',(0,0,.43),(.094,.064,.14),'cloth',col,body,segments=16,rings=10)
uv('OverallShorts',(0,.005,.327),(.103,.075,.085),'sage',col,body,segments=16,rings=8)
box('OverallBib',(0,-.061,.45),(.128,.018,.13),'sage',col,body,r=.015)
for x in [-.047,.047]:
    box('OverallStrap',(x,-.060,.531),(.022,.019,.075),'sage',col,body,r=.007,rot=(0,0,0))
    uv('OverallButton',(x,-.075,.479),(.008,.004,.008),'yellow',col,body,segments=8,rings=4)
cylinder('Neck',(0,0,.566),.033,.065,'skin',col,body,vertices=16)
# Hip pivots, bare lower legs, soft shoes with sole and two simple laces.
for sign,side in [(-1,'L'),(1,'R')]:
    x=sign*.053;leg=empty('Leg_'+side,(x,0,.30),col,root,animation_joint='leg_'+side)
    cylinder('ShortLeg_'+side,(x,0,.274),.044,.075,'sage',col,leg,vertices=12,r=.012)
    uv('BareThigh_'+side,(x,-.002,.220),(.032,.033,.063),'skin',col,leg,segments=12,rings=8)
    knee=empty('Knee_'+side,(x,0,.173),col,leg,animation_joint='knee_'+side)
    uv('BareShin_'+side,(x,-.002,.134),(.029,.030,.052),'skin',col,knee,segments=12,rings=8)
    uv('Sock_'+side,(x,-.002,.114),(.033,.034,.035),'cloth',col,knee,segments=12,rings=6)
    box('Shoe_'+side,(x,-.026,.064),(.086,.144,.066),'shoe',col,knee,r=.025)
    box('ShoeSole_'+side,(x,-.027,.035),(.091,.149,.018),'linen',col,knee,r=.007)
    for y in [-.054,-.030]:rod('ShoeLace_'+side,(x-.023,y,.100),(x+.023,y,.100),.003,'white',col,knee,vertices=6,r=0)
# Shoulder-centered arms; upper cloth sleeves and soft mitten hands.
for sign,side in [(-1,'L'),(1,'R')]:
    x=sign*.105;arm=empty('Arm_'+side,(x,0,.505),col,root,animation_joint='arm_'+side)
    uv('Sleeve_'+side,(x+sign*.012,0,.48),(.047,.044,.068),'cloth',col,arm,segments=12,rings=8)['hide_under_outfit']='raincoat'
    uv('Forearm_'+side,(x+sign*.024,-.006,.404),(.029,.029,.064),'skin',col,arm,segments=12,rings=8)
    uv('Hand_'+side,(x+sign*.027,-.011,.352),(.033,.029,.037),'skin',col,arm,segments=12,rings=8)
    empty('HandAnchor_'+side,(x+sign*.027,-.017,.36),col,arm,role='hand-attachment')
    variant(uv('RainSleeve_'+side,(x+sign*.014,.002,.451),(.049,.047,.105),'raincoat',col,arm,segments=12,rings=8),'raincoat')
head=empty('HeadPivot',(0,0,.688),col,root,animation_joint='head')
uv('VisitorFace',(0,-.004,.689),(.135,.120,.137),'skin',col,head,segments=24,rings=16)
for sign in [-1,1]:
    uv('Ear',(sign*.132,.002,.682),(.025,.022,.035),'skin',col,head,segments=12,rings=8)
    uv('Eye',(sign*.046,-.117,.696),(.012,.006,.018),'ink',col,head,segments=12,rings=8)
    uv('Cheek',(sign*.074,-.110,.666),(.019,.004,.009),'pinkLight',col,head,segments=12,rings=6)
uv('Nose',(0,-.124,.674),(.010,.009,.011),'skin',col,head,segments=12,rings=6)
tube('SmallSmile',[(-.014,-.123,.650),(0,-.127,.646),(.014,-.123,.650)],.0021,'woodDark',col,head,res=1)
# Clean stylized hair cap, open at the face. Radial rim lowers toward the back.
n=24;rings=9;v=[];f=[]
for j in range(rings+1):
    t=j/rings
    for i in range(n):
        phi=math.tau*i/n;theta=t*(1.46+.34*math.sin(phi))
        v.append((.141*math.sin(theta)*math.cos(phi),.128*math.sin(theta)*math.sin(phi),.694+.144*math.cos(theta)))
for j in range(rings):
    for i in range(n):a=j*n+i;f.append((a,j*n+(i+1)%n,(j+1)*n+(i+1)%n,a+n))
mesh('HairCap',v,f,'hair',col,head,smooth=True)
# Rounded pointed fringe locks; broad chunks rather than individual hair strands.
for i in range(7):
    x=(i-3)*.030;z=.799-abs(i-3)*.008;y=-.106+abs(i-3)*.007
    lock=uv('FringeLock',(x,y,z),(.027,.027,.061),'hair',col,head,segments=12,rings=8)
    lock.rotation_euler.y=(i-3)*.13;lock.rotation_euler.x=-.17
for sign in [-1,1]:
    lock=uv('SideHair',(sign*.122,-.022,.733),(.035,.044,.068),'hair',col,head,segments=12,rings=8)
    lock.rotation_euler.y=sign*.15
# A tiny swept tuft.
tube('HairTuft',[(.015,.02,.823),(.007,.02,.854),(-.012,.016,.866),(-.025,.012,.858)],.009,'hair',col,head,res=2)
# Raincoat body with opening, buttons, pockets and an open-faced hood.
coat=empty('Outfit_Raincoat',(0,0,0),col,root,weather_variant='raincoat');parts['raincoat'].append(coat)
profile=[(.106,.277),(.114,.305),(.106,.430),(.091,.544),(.048,.567)]
variant(lathe('RaincoatBody',(0,0,0),profile,'raincoat',col,coat,n=20),'raincoat')
variant(box('CoatPlacket',(0,-.108,.41),(.012,.013,.23),'yellow',col,coat,r=.003),'raincoat')
for z in [.34,.40,.46,.52]:variant(uv('CoatButton',(.016,-.112,z),(.006,.004,.006),'wood',col,coat,segments=8,rings=4),'raincoat')
for sign in [-1,1]:variant(box('CoatPocket',(sign*.062,-.095,.35),(.054,.017,.055),'yellow',col,coat,r=.01),'raincoat')
# Hood is a bowl whose mouth remains open, so it never hides the face.
v=[];f=[];n=24;rings=8
for j in range(rings+1):
    t=j/rings*math.pi/2
    for i in range(n):
        a=math.tau*i/n;v.append((.159*math.cos(t)*math.cos(a),-.096+.25*math.sin(t),.697+.176*math.cos(t)*math.sin(a)))
for j in range(rings):
    for i in range(n):a=j*n+i;f.append((a,j*n+(i+1)%n,(j+1)*n+(i+1)%n,a+n))
variant(mesh('RainHood',v,f,'raincoat',col,head,smooth=True),'raincoat')
points=[(.158*math.cos(i*math.tau/32),-.098,.697+.176*math.sin(i*math.tau/32)) for i in range(33)]
variant(tube('HoodRim',points,.015,'yellow',col,head,res=2),'raincoat')
# Cold-weather scarf with two ends and quiet fold strips.
scarf=empty('Outfit_Scarf',(0,0,0),col,root,weather_variant='scarf');parts['scarf'].append(scarf)
o=torus('ScarfWrap',(0,0,.561),.063,.021,'scarf',col,scarf);o.scale=(1.18,.95,1);variant(o,'scarf')
variant(box('ScarfTail',(.045,-.092,.475),(.054,.029,.18),'scarf',col,scarf,r=.012,rot=(0,-.15,0)),'scarf')
for i in range(4):variant(rod('ScarfFringe',(.028+i*.011,-.107,.389),(.028+i*.011,-.107,.368),.003,'scarf',col,scarf,vertices=6,r=0),'scarf')
# Plain eight-panel umbrella, individual ribs and curved handle, identity-neutral.
umb=empty('Outfit_Umbrella',(.14,-.02,0),col,root,weather_variant='umbrella');parts['umbrella'].append(umb)
ux,uy=.14,-.02
variant(rod('UmbrellaShaft',(ux,uy,.37),(ux,uy,1.135),.007,'metalDark',col,umb,vertices=10),'umbrella')
for k in range(8):
    v=[];f=[]
    for j in range(5):
        t=j/4;rr=.37*t
        for i in range(5):
            a=(k+i/4)*math.tau/8;edge=rr*(1-.03*math.sin(i/4*math.pi)*t*t);zz=1.16-.17*t*t
            v.append((ux+edge*math.cos(a),uy+edge*math.sin(a),zz))
    for j in range(4):
        for i in range(4):a=j*5+i;f.append((a,a+1,a+6,a+5))
    o=mesh('UmbrellaPanel',v,f,'linen' if k%2 else 'paper',col,umb,smooth=True);variant(o,'umbrella')
    a=k*math.tau/8;pts=[(ux+.37*t*math.cos(a),uy+.37*t*math.sin(a),1.157-.17*t*t) for t in [0,.25,.5,.75,1]]
    variant(tube('UmbrellaRib',pts,.003,'wood',col,umb,res=1),'umbrella')
variant(uv('UmbrellaTip',(ux,uy,1.17),(.013,.013,.026),'woodDark',col,umb,segments=10,rings=6),'umbrella')
variant(tube('UmbrellaCrook',[(ux,uy,.40),(ux,uy,.34),(ux+.018,uy,.319),(ux+.04,uy,.33),(ux+.04,uy,.35)],.009,'wood',col,umb,res=2),'umbrella')
empty('UmbrellaGripAnchor',(ux,uy,.395),col,umb,role='hand-grip',weather_variant='umbrella')
# Palm-leaf fan attached to the right hand, fan blade faces forwards.
fan=empty('Outfit_Fan',(0,0,0),col,bpy.data.objects['HandAnchor_R'],weather_variant='fan');parts['fan'].append(fan)
fx,fy,fz=.20,-.07,.50;v=[(fx,fy,fz)];n=24
for i in range(n):
    a=math.tau*i/n;rr=.105*(1+.035*math.cos(a*7));v.append((fx+rr*math.cos(a),fy,fz+rr*.90*math.sin(a)))
variant(mesh('PalmLeafFan',v,[(0,i+1,(i+1)%n+1) for i in range(n)],'yellow',col,fan),'fan')
variant(rod('PalmFanHandle',(.132,-.011,.352),(fx,fy,.47),.006,'wood',col,fan,vertices=8),'fan')
for i in range(9):
    a=i*math.pi/8
    variant(rod('PalmFanVein',(fx,fy-.003,fz-.085),(fx+math.cos(a)*.10,fy-.003,fz+math.sin(a)*.09),.0015,'wood',col,fan,vertices=5,r=0),'fan')
# Normalize the actual character (excluding equipment) to 0.9m, then place at spawn.
bpy.context.view_layer.update()
base=[o for o in root.children_recursive if o.type in {'MESH','CURVE'} and not o.get('weather_variant')]
lo=min((o.matrix_world@Vector(c)).z for o in base for c in o.bound_box);hi=max((o.matrix_world@Vector(c)).z for o in base for c in o.bound_box)
scale=.9/(hi-lo);root.scale=(scale,scale,scale);root.location=(-1.35,-.68,-lo*scale+.008)
root['normalized_scale']=scale;root['base_bounds_z']=[lo,hi]
for kind,objects in parts.items():
    for o in objects:o.hide_render=True;o.hide_set(True)
# Driver-independent extras enumerate alternative pieces in the eventual GLB.
SCENE['character_variants']='raincoat,umbrella,scarf,fan'
print('Visitor:',len(col.objects),'objects; normalized height0.9m; forward -Y; body/head/4 limb pivots; four outfit sets')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'rooftop.blend'))
