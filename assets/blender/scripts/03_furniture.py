from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/common.py').read_text(),'common.py','exec'))
remove_prefix('S_Furn_');remove_prefix('P_Shelf_');remove_names('Bookshelf')
p='S_Furn_'
# Desk surface top is exactly 0.80 m.
box(p+'DeskTop',(.5,2.45,.76),(2.3,.92,.08),M['desk'],.02)
for x in [-.49,1.49]:
    for y in [2.10,2.80]:box(p+'DeskLeg',(x,y,.37),(.095,.095,.70),M['wood'],.012)
box(p+'DeskApron',(.5,2.78,.67),(2.05,.06,.11),M['wood'],.012)
# Chair faces +Y towards the desk; the back is on its -Y side.
chair=[]
for x in [-.20,.20]:
    for y in [-.20,.20]:chair.append(box(p+'ChairLeg',(x,y,.245),(.055,.055,.45),M['wood'],.01))
chair.append(box(p+'ChairSeat',(0,0,.48),(.55,.55,.085),M['blue'],.025))
for x in [-.21,.21]:chair.append(box(p+'ChairBackPost',(x,-.235,.68),(.05,.05,.43),M['wood'],.012))
chair.append(box(p+'ChairBack',(0,-.245,.83),(.55,.075,.29),M['blue'],.025))
for o in chair:
    R=Matrix.Rotation(math.radians(15),3,'Z');o.location=R@o.location+Vector((.75,1.7,0));o.rotation_euler=(R@o.rotation_euler.to_matrix()).to_euler()
# Compact bed: 1.20 x 2.00; headboard at the +Y end.
for x in [-2.90,-1.90]:
    for y in [-2.24,-.56]:box(p+'BedFoot',(x,y,.13),(.09,.09,.22),M['wood'],.015)
box(p+'BedFrame',(-2.4,-1.4,.255),(1.20,2.0,.19),M['wood'],.025)
box(p+'Mattress',(-2.4,-1.4,.405),(1.15,1.93,.20),M['linen'],.04)
box(p+'Headboard',(-2.4,-.415,.49),(1.20,.07,.80),M['wood'],.025)
box(p+'Quilt',(-2.4,-1.65,.535),(1.17,1.40,.12),M['quilt'],.035)
box(p+'Pillow',(-2.4,-.77,.57),(.77,.37,.15),M['linen'],.04)
box(p+'QuiltFold',(-2.4,-1.00,.60),(1.16,.16,.07),M['quilt'],.025)
# Flat two-tone circular rug: bottom is the actual floor top.
cyl(p+'Rug',(.5,-.7,.03),1.4,.02,M['rug'],vertices=24)
cyl(p+'RugInner',(.5,-.7,.041),1.05,.003,M['rug_inner'],vertices=24)
# Plant, no external asset or texture.
cyl(p+'PlantPot',(2.55,2.55,.21),.21,.38,M['terra'],r2=.27)
cyl(p+'PlantSoil',(2.55,2.55,.402),.235,.012,M['wood'])
rod(p+'PlantTrunk',(2.55,2.55,.40),(2.55,2.55,.89),.045,M['wood'])
for i,(dx,dy,z,scale) in enumerate([(-.13,0,.85,.25),(.13,.04,.96,.23),(0,-.1,1.12,.25),(.02,.10,1.22,.20)]):
    sphere(p+'PlantCrown_%d'%i,(2.55+dx,2.55+dy,z),(scale,scale*.92,scale*1.04),[M['leaf'],M['leaf_dark'],M['leaf_light'],M['leaf']][i])
# Desk mug and a pen are static decorations.
cyl(p+'Mug',(1.48,2.24,.875),.06,.15,M['blue'])
cyl(p+'MugInner',(1.48,2.24,.953),.045,.003,M['paper'])
tube(p+'MugHandle',[(1.532,2.24,.91),(1.585,2.24,.91),(1.585,2.24,.855),(1.532,2.24,.855)],.011,M['blue'])
rod(p+'Pen',(1.35,2.09,.811),(1.56,2.11,.811),.008,M['monitor'])
# One interactive bookshelf mesh, assembled from deterministic small primitives.
parts=[];q='P_Shelf_'
for y in [-.5775,.5775]:parts.append(box(q+'Side',(0,y,1.0),(.40,.045,2),M['wood'],.015,c='Interactive'))
parts.append(box(q+'Back',(-.185,0,1.0),(.03,1.11,2),M['desk'],.01,c='Interactive'))
for z in [.03,.42,.81,1.20,1.59,1.97]:parts.append(box(q+'Shelf',(0,0,z),(.40,1.2,.06),M['wood'],.012,c='Interactive'))
colors=['#e07a5f','#3d405b','#81b29a','#f2cc8f','#7fb3d5','#b56576','#6d597a']
books=[mat('Book_%d'%i,c) for i,c in enumerate(colors)]
rng=random.Random(19)
for row,base in enumerate([.06,.45,.84,1.23,1.62]):
    y=-.53;j=0
    while y<.48:
        width=min(rng.uniform(.065,.105),.54-y);h=rng.uniform(.21,.31)
        o=box(q+'Book_%d_%d'%(row,j),(.015,y+width/2,base+h/2),(.27,width-.007,h),books[(row*3+j)%7],.005,c='Interactive')
        if j in [2,6]:o.rotation_euler.x=math.radians((-1 if j==2 else 1)*5)
        parts.append(o);y+=width;j+=1
root=join_parts('Bookshelf',parts,(0,0,0));root.location=(-2.78,1.6,0)
preview_camera();checkpoint(3)
