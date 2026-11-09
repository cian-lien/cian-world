from common import *
col=clear_stage('PlantMass');r=random.Random(821)
# Clustered simplified leaves give the flowering vines a legible silhouette at game scale.
for name,centers in [('Bougainvillea_Right',[(3.82,-1.4,1.04),(3.82,-.3,1.10),(3.82,1.1,1.03)]),('Bougainvillea_Stair',[(-3.70,2.50,2.26),(-3.45,2.95,2.39),(-3.82,3.2,2.18)])]:
    parent=bpy.data.objects[name]
    for x,y,z in centers:
        for j in range(5):
            cx=x+r.uniform(-.18,.18);cy=y+r.uniform(-.27,.27);cz=z+r.uniform(-.13,.12)
            ico('BougainvilleaLeafMass',(cx,cy,cz),(.24,.30,.20),'leafDark' if j%3 else 'leaf',col,parent,sub=2)
        for j in range(10):
            a=j*2.4;cx=x+math.cos(a)*r.uniform(.12,.32);cy=y+math.sin(a)*r.uniform(.18,.35);cz=z+r.uniform(.06,.27)
            for k in range(3):
                aa=a+k*math.tau/3;v=[(cx,cy,cz),(cx+math.cos(aa)*.10-math.sin(aa)*.04,cy+math.sin(aa)*.10+math.cos(aa)*.04,cz+.04),(cx+math.cos(aa)*.13,cy+math.sin(aa)*.13,cz+.02),(cx+math.cos(aa)*.10+math.sin(aa)*.04,cy+math.sin(aa)*.10-math.cos(aa)*.04,cz+.04)]
                mesh('BougainvilleaClusterBract',v,[(0,1,2),(0,2,3)],'pink' if j%4 else 'pinkLight',col,parent)
# Thin proper gutter beneath canopy.
root=bpy.data.objects['RooftopRoot']
rod('CanopyGutter',(-2.43,-2.3,1.97),(-2.43,1.25,1.97),.027,'metalDark',col,root)
# Keep a single presentation lamp even after a stage rerun.
for o in list(collection('Presentation').objects):
    if o.name.startswith('TeaBulbLight.'):bpy.data.objects.remove(o,do_unlink=True)
cam=SCENE.camera;enum(cam.data,'type','PERSP');cam.data.lens=50;cam.location=(6,-14,11);point_at(cam,(0,2,0))
# Recalculate outward normals on the two open rounded caps explicitly (their parametric winding is reversed).
for name in ['HairCap','RainHood']:
    o=bpy.data.objects.get(name)
    if o and not o.get('normal_corrected'):
        for p in o.data.polygons:p.flip()
        o.data.update();o['normal_corrected']=True
SCENE.eevee.use_raytracing=True
SCENE.render.film_transparent=False
bg=next(n for n in SCENE.world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs[0].default_value=rgba('b7d0e0');bg.inputs[1].default_value=.38
sun=bpy.data.objects['RooftopSun'];sun.location=(-4,-6,9);point_at(sun,(0,0,0));sun.data.energy=3.0;sun.data.angle=.10
bpy.data.objects['SkyFill'].data.energy=600
bpy.data.objects['WarmBounce'].data.energy=300
SCENE.view_settings.exposure=.30
# Real Cycles/Metal renders, not generated concept imagery.
try:
    SCENE.render.engine='CYCLES'
    prefs=bpy.context.preferences.addons['cycles'].preferences
    try:prefs.compute_device_type='METAL'
    except TypeError:pass
    prefs.get_devices()
    metal=False
    for d in prefs.devices:
        d.use=d.type=='METAL';metal=metal or d.use
    SCENE.cycles.device='GPU' if metal else 'CPU'
    SCENE.cycles.samples=96;SCENE.cycles.use_denoising=True
    SCENE.cycles.max_bounces=6
    print('Cycles device',SCENE.cycles.device,[(d.name,d.type,d.use) for d in prefs.devices])
except Exception as e:
    print('Cycles unavailable; keeping preview renderer:',str(e)[:120])
SCENE.render.resolution_x=1560;SCENE.render.resolution_y=1200
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'rooftop.blend'))
print('Presentation camera configured; clean plant masses and vertex normals checked')
