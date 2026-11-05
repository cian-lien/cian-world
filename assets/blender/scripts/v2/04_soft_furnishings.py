from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/detail_helpers.py').read_text(),'v2/detail_helpers.py','exec'))
remove_prefix('V2_Soft_');q='V2_Soft_'
hide_proxies(['V2_Block_Quilt','V2_Block_Pillow','V2_Block_AccentPillow','V2_Block_Curtain','V2_Block_Beanbag'])
# Materials carry grain and weave, with restrained contrast and shallow bump.
for o in scene.objects:
    if o.type!='MESH':continue
    if o.name.startswith('V2_Room_Board_'):
        h=['#a18467','#b29372','#aa8d6e','#b89b7c','#a98b6b','#b09678'][sum(map(ord,o.name))%6]
        assign(o,wood_mat('DetailedFloor'+str(sum(map(ord,o.name))%6),h))
    elif any(k in o.name for k in ['DeskTop','BedFrame','BedHeadboard','Nightstand','FloatingShelf']):assign(o,WOOD)
    elif o.name=='V2_Block_Mattress':assign(o,LINEN)
    elif o.name=='V2_Block_Rug':assign(o,RUG)
def quilt_pt(u,v):
    x=-2.35+1.32*u;y=-2.045+1.57*v
    drop=.25*max(0,(x+1.13)/.10)**.8+.22*max(0,(-1.92-y)/.13)**.8
    fold=.013*math.sin(15*u+5*v)+.008*math.sin(31*u-9*v)+.007*math.cos(18*v+u*9)
    fold*=.5+.5*math.sin(math.pi*v)**2
    corner=.08*math.exp(-((x+1.14)/.14)**2-((y+1.91)/.16)**2)
    z=.635-drop+fold+.025*math.exp(-((v-.95)/.08)**2)+corner
    return (x,y,z)
nu,nv=16,18
verts=[quilt_pt(a/nu,b/nv) for b in range(nv+1) for a in range(nu+1)]
faces=[(b*(nu+1)+a,b*(nu+1)+a+1,(b+1)*(nu+1)+a+1,(b+1)*(nu+1)+a) for b in range(nv) for a in range(nu)]
mesh_obj(q+'DrapedQuilt',verts,faces,FOREST,sub=2,solid=.018)
for u in [.02,.98]:curve(q+'QuiltSideHem',[quilt_pt(u,j/60) for j in range(61)],PIPING,.0035,F)
curve(q+'QuiltFoldHem',[quilt_pt(j/70,.92) for j in range(71)],PIPING,.003,F)
# A seam at the mattress perimeter separates fabric from the wood frame.
points=[]
for j in range(64):
    t=j*math.tau/64;cs=math.cos(t);sn=math.sin(t)
    points.append((-1.75+.614*math.copysign(abs(cs)**.25,cs),-.95+.964*math.copysign(abs(sn)**.25,sn),.49))
curve(q+'MattressPiping',points,LINEN,.004,F,True)
def pillow(name,center,size,material,angle=0):
    vertices=[];faces=[];n=12
    for z,spread in [(-.5,.64),(-.28,.96),(0,1),(.28,.96),(.5,.64)]:
        for j in range(n):
            t=math.tau*j/n;cs,sn=math.cos(t),math.sin(t)
            x=.5*size[0]*spread*math.copysign(abs(cs)**.45,cs);y=.5*size[1]*spread*math.copysign(abs(sn)**.45,sn)
            vertices.append((x,y,z*size[2]+.004*math.sin(j*2.4)))
    for k in range(4):
        for j in range(n):faces.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
    faces.extend([tuple(reversed(range(n))),tuple(4*n+j for j in range(n))])
    o=mesh_obj(q+name,vertices,faces,material,sub=2);o.location=center;o.rotation_euler.z=angle
    seam=curve(q+name+'Piping',vertices[2*n:3*n],LINEN,.003,F,True);seam.location=center;seam.rotation_euler.z=angle
    return o
pillow('PillowA',(-2.05,-.25,.625),(.53,.37,.18),LINEN,-.04)
pillow('PillowB',(-1.43,-.255,.625),(.53,.37,.18),LINEN,.055)
accent=pillow('Accent',(-1.70,-.53,.75),(.36,.20,.30),PEACH,-.16);accent.rotation_euler.x=.25
# Curtains: vertical pleats, gathered near the rod and relaxed at the hem.
for side,cx in enumerate([1.02,2.08]):
    vs=[];fs=[];nu,nv=12,8
    for k in range(nv+1):
        t=k/nv;z=.995+1.55*t
        for j in range(nu+1):
            u=j/nu;w=.30*(1-.28*t);x=cx+(u-.5)*w
            y=2.09+.035*math.cos(u*math.tau*4)+.012*math.sin(t*8+u*4)
            vs.append((x,y,z+.008*math.sin(u*20)*(1-t)))
    for k in range(nv):
        for j in range(nu):a=k*(nu+1)+j;fs.append((a,a+1,a+nu+2,a+nu+1))
    mesh_obj(q+'PleatedCurtain'+str(side),vs,fs,BLUE,sub=2,solid=.006)
    curve(q+'CurtainHem'+str(side),vs[:nu+1],BLUE,.005,F)
rod(q+'CurtainRod',(.82,2.10,2.59),(2.27,2.10,2.59),.012,METAL,F)
for x in [.84,2.25]:sphere(q+'RodFinial',(x,2.10,2.59),(.022,.022,.022),METAL,F)
# A flattened, slumped beanbag with a seat depression and panel seams.
vs=[];fs=[];n=24
profile=[(.25,0),(.36,.025),(.44,.15),(.45,.32),(.36,.46),(.27,.48),(.14,.33),(.01,.30)]
for k,(r,z) in enumerate(profile):
    for j in range(n):
        t=j*math.tau/n;back=(1+math.sin(t))/2
        vs.append((-.05+r*math.cos(t),-1.20+r*.94*math.sin(t),.02+z+(.18*back if k>=3 else 0)+.008*math.sin(t*5)*(k>0)))
for k in range(len(profile)-1):
    for j in range(n):fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
fs+=[tuple(reversed(range(n))),tuple((len(profile)-1)*n+j for j in range(n))]
mesh_obj(q+'Beanbag',vs,fs,PEACH,sub=2)
for j in [0,6,12,18]:
    seam=curve(q+'BeanbagPanel',[vs[k*n+j] for k in range(1,7)],mat('BeanbagThread','#926550',.9),.0018,F)
    spline=seam.data.splines[0]
    coordinates=[p.co.xyz.copy() for p in spline.points];seam.data.splines.remove(spline)
    spline=seam.data.splines.new('BEZIER');spline.bezier_points.add(len(coordinates)-1)
    for p,co in zip(spline.bezier_points,coordinates):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
# Drawer fronts, recessed dark gaps, and hardware make the casework readable.
for center,width,depth,height in [((.95,1.65,.375),.62,.70,.75),((-.75,.05,.275),.54,.56,.55)]:
    x,y,z=center
    for j in range(3 if height>.6 else 2):
        count=3 if height>.6 else 2;h=(height-.08)/count;zc=.04+h*(j+.5)
        box(q+'DrawerFront',(x,y-depth/2-.006,zc),(width-.035,.022,h-.016),IVORY if height>.6 else WOOD,F,.006)
        rod(q+'DrawerPull',(x-.065,y-depth/2-.025,zc+h*.23),(x+.065,y-depth/2-.025,zc+h*.23),.006,METAL,F)
checkpoint(4,'Compact room: soft furnishings and material refinement')
