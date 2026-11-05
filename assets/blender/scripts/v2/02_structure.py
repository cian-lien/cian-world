from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/common.py').read_text(),'v2/common.py','exec'))
remove_prefix('V2_Room_');p='V2_Room_';c='Static_Room'
# A solid dark 0.30m plinth with a shallow pocket for boards ending at Z=0.
plinth=box(p+'Plinth',(0,0,-.15),(6.4,6.4,.30),M['cut'],c,0)
cutter=box(p+'FloorPocket',(0,0,-.017),(6.002,6.002,.036),None,c,0)
cut_with(plinth,cutter);bpy.data.objects.remove(cutter,do_unlink=True);bevel(plinth,.015)
rng=random.Random(83)
wood=[mat('Floor_%02d'%i,h,.65) for i,h in enumerate(['#b99a7b','#c2a182','#ba9b80','#c9a989','#b49477','#c1a68b'])]
for row in range(15):
    y=-3+(row+.5)*.4
    edges=[-3];x=-3+(1 if row%2 else 2)
    while x<2.999:edges.append(x);x+=2
    edges.append(3)
    for j,(a,b) in enumerate(zip(edges,edges[1:])):
        box(p+'Board_%02d_%02d'%(row,j),((a+b)/2,y,-.0175),(b-a-.010,.390,.035),wood[rng.randrange(len(wood))],c,.005)
# Real wall aperture, with room-facing colored plaster and dark exposed cuts.
rear=box(p+'RearWall',(0,3.1,1.6),(6.4,.2,3.2),M['rear'],c,0)
cutter=box(p+'WindowOpening',(1.9,3.1,1.75),(1.0,.60,1.4),None,c,0)
cut_with(rear,cutter);bpy.data.objects.remove(cutter,do_unlink=True)
rear.data.materials.append(M['cut']);rear.data.update()
for face in rear.data.polygons:face.material_index=0 if face.normal.y<-.9 else 1
bevel(rear,.012)
left=box(p+'LeftWall',(-3.1,0,1.6),(.2,6.4,3.2),M['left'],c,0)
left.data.materials.append(M['cut'])
for face in left.data.polygons:face.material_index=0 if face.normal.x>.9 else 1
bevel(left,.012)
box(p+'RearSkirting',(0,2.984,.06),(6,.032,.12),M['trim'],c,.008)
box(p+'LeftSkirting',(-2.984,0,.06),(.032,6,.12),M['trim'],c,.008)
# Window with blue night panel, restrained reflective glass and separate frame.
box(p+'NightPanel',(1.9,3.245,1.75),(.99,.025,1.39),M['sky'],c,.005)
glass=mat('Glass','#d7e3ff',.18)
bs=glass.node_tree.nodes.get('Principled BSDF');bs.inputs['Transmission Weight'].default_value=.85;bs.inputs['IOR'].default_value=1.45
box(p+'Glass',(1.9,3.10,1.75),(.94,.012,1.34),glass,c,.002)
for x in [1.43,2.37]:box(p+'WindowStile',(x,2.979,1.75),(.06,.09,1.40),M['white'],c,.012)
for z in [1.08,2.42]:box(p+'WindowRail',(1.9,2.979,z),(1,.09,.06),M['white'],c,.012)
box(p+'WindowMullion',(1.9,2.965,1.75),(.035,.06,1.34),M['white'],c,.008)
box(p+'WindowTransom',(1.9,2.964,1.78),(.94,.06,.035),M['white'],c,.008)
box(p+'WindowSill',(1.9,2.88,1.015),(1.18,.34,.07),M['white'],c,.015)
moon=cyl(p+'Moon',(2.10,3.224,2.12),.13,.008,M['moon'],c);moon.rotation_euler.x=math.pi/2
for i,(x,z) in enumerate([(1.53,1.21),(1.64,1.16),(1.77,1.24),(1.97,1.19),(2.14,1.27),(2.26,1.18)]):
    box(p+'CityLight_%d'%i,(x,3.224,z),(.018,.008,.024),M['city'],c,.003)
save_render(2)
