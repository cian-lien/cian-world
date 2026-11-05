from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/common.py').read_text(),'v2/common.py','exec'))
scene['layout_variant']='compact-color'
scene['interior_dimensions']=[4.8,4.4]
remove_prefix('V2_Room_');p='V2_Room_';c='Static_Room'
hx,hy=2.4,2.2
plinth=box(p+'Plinth',(0,0,-.15),(5.2,4.8,.30),M['cut'],c,0)
cutter=box(p+'FloorPocket',(0,0,-.017),(4.802,4.402,.036),None,c,0)
cut_with(plinth,cutter);bpy.data.objects.remove(cutter,do_unlink=True);bevel(plinth,.015)
rng=random.Random(83)
wood=[mat('Floor_%02d'%i,h,.65) for i,h in enumerate(['#b99a7b','#c2a182','#ba9b80','#c9a989','#b49477','#c1a68b'])]
for row in range(11):
    y=-hy+(row+.5)*.4
    edges=[-hx];x=-hx+(.8 if row%2 else 1.6)
    while x<hx-.001:edges.append(x);x+=1.6
    edges.append(hx)
    for j,(a,b) in enumerate(zip(edges,edges[1:])):
        box(p+'Board_%02d_%02d'%(row,j),((a+b)/2,y,-.0175),(b-a-.010,.390,.035),wood[rng.randrange(len(wood))],c,.005)
rear=box(p+'RearWall',(0,hy+.1,1.6),(5.2,.2,3.2),M['rear'],c,0)
cutter=box(p+'WindowOpening',(1.55,hy+.1,1.75),(1.0,.60,1.4),None,c,0)
cut_with(rear,cutter);bpy.data.objects.remove(cutter,do_unlink=True)
rear.data.materials.append(M['cut']);rear.data.update()
for face in rear.data.polygons:face.material_index=0 if face.normal.y<-.9 else 1
bevel(rear,.012)
left=box(p+'LeftWall',(-hx-.1,0,1.6),(.2,4.8,3.2),M['left'],c,0)
left.data.materials.append(M['cut'])
for face in left.data.polygons:face.material_index=0 if face.normal.x>.9 else 1
bevel(left,.012)
box(p+'RearSkirting',(0,hy-.016,.06),(4.8,.032,.12),M['trim'],c,.008)
box(p+'LeftSkirting',(-hx+.016,0,.06),(.032,4.4,.12),M['trim'],c,.008)
box(p+'NightPanel',(1.55,hy+.245,1.75),(.99,.025,1.39),M['sky'],c,.005)
glass=mat('Glass','#d7e3ff',.18)
bs=glass.node_tree.nodes.get('Principled BSDF');bs.inputs['Transmission Weight'].default_value=.85;bs.inputs['IOR'].default_value=1.45
box(p+'Glass',(1.55,hy+.10,1.75),(.94,.012,1.34),glass,c,.002)
for x in [1.08,2.02]:box(p+'WindowStile',(x,hy-.021,1.75),(.06,.09,1.40),M['white'],c,.012)
for z in [1.08,2.42]:box(p+'WindowRail',(1.55,hy-.021,z),(1,.09,.06),M['white'],c,.012)
box(p+'WindowMullion',(1.55,hy-.035,1.75),(.035,.06,1.34),M['white'],c,.008)
box(p+'WindowTransom',(1.55,hy-.036,1.78),(.94,.06,.035),M['white'],c,.008)
box(p+'WindowSill',(1.55,hy-.12,1.015),(1.18,.34,.07),M['white'],c,.015)
moon=cyl(p+'Moon',(1.75,hy+.224,2.12),.13,.008,M['moon'],c);moon.rotation_euler.x=math.pi/2
for j,(x,z) in enumerate([(1.18,1.21),(1.29,1.16),(1.42,1.24),(1.62,1.19),(1.79,1.27),(1.91,1.18)]):
    box(p+'CityLight_%d'%j,(x,hy+.224,z),(.018,.008,.024),M['city'],c,.003)
hidden={o:o.hide_render for o in scene.objects if o.type=='MESH' and o.name not in col('Static_Room').objects}
for o in hidden:o.hide_render=True
save_render(2)
for o,value in hidden.items():o.hide_render=value
