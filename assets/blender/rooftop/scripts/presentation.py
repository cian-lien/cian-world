"""Reversible presentation states. Runtime counterparts are intentionally not implemented here."""
from common import *
from mathutils import Matrix

def setup():
    # Warm lit panes below this same rooftop; never make solar tubes emissive.
    m=mat('roomPane','718a88',.25,emission='ffd39b',strength=0)
    for o in SCENE.objects:
        if o.name.startswith('FacadeWindow') and o.type=='MESH':o.data.materials.clear();o.data.materials.append(m)
    # One threshold shader for all seeded city windows (also stored as glTF metadata).
    m=mat('windowShader','514f44',.65,emission='e9b56a',strength=0)
    nt=m.node_tree;bsdf=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
    if not any(n.get('rt_role')=='window_gain' for n in nt.nodes):
        uv=nt.nodes.new('ShaderNodeTexCoord');sep=nt.nodes.new('ShaderNodeSeparateXYZ')
        cutoff=nt.nodes.new('ShaderNodeMath');enum(cutoff,'operation','LESS_THAN');cutoff.inputs[1].default_value=.45;cutoff['rt_role']='window_cutoff'
        gain=nt.nodes.new('ShaderNodeMath');enum(gain,'operation','MULTIPLY');gain.inputs[1].default_value=0;gain['rt_role']='window_gain'
        nt.links.new(uv.outputs['UV'],sep.inputs[0]);nt.links.new(sep.outputs['X'],cutoff.inputs[0]);nt.links.new(cutoff.outputs[0],gain.inputs[0]);nt.links.new(gain.outputs[0],bsdf.inputs['Emission Strength'])
    for o in SCENE.objects:
        if o.name.startswith('CityWindows') and o.type=='MESH':o.data.materials.clear();o.data.materials.append(m)
    # A camera-only sky remains bright without flattening the lighting of the miniature.
    w=SCENE.world;nt=w.node_tree
    if not any(n.get('rt_role')=='camera-sky' for n in nt.nodes):
        lighting=next(n for n in nt.nodes if n.type=='BACKGROUND');lighting['rt_role']='lighting-sky'
        sky=nt.nodes.new('ShaderNodeBackground');sky['rt_role']='camera-sky';sky.inputs[0].default_value=rgba('b7d0e4');sky.inputs[1].default_value=.9
        path=nt.nodes.new('ShaderNodeLightPath');mix=nt.nodes.new('ShaderNodeMixShader');out=next(n for n in nt.nodes if n.type=='OUTPUT_WORLD')
        nt.links.new(path.outputs['Is Camera Ray'],mix.inputs[0]);nt.links.new(lighting.outputs[0],mix.inputs[1]);nt.links.new(sky.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs[0])
    # Keep book and facial articulation identifiable after material batching.
    if not bpy.data.objects.get('LatestPostBook'):
        p=empty('LatestPostBook',(.48,-1.89,.53),collection('Tea'),bpy.data.objects['TeaTable'],interaction='latest-post')
        for name in ['LatestDiaryBook','BookPages','BookTopCover']:
            o=bpy.data.objects.get(name)
            if o:mw=o.matrix_world.copy();o.parent=p;o.matrix_world=mw
    h=bpy.data.objects['HeadPivot'];p=bpy.data.objects.get('Face_Eyes')
    if p is None:p=empty('Face_Eyes',(0,0,0),collection('Character'),h,animation_joint='blink')
    p.parent=h;p.matrix_parent_inverse=Matrix.Identity(4);p.location=(0,-.117,.008)
    bpy.context.view_layer.update()
    eyes=sorted([o for o in collection('Character').objects if o.name=='Eye' or o.name.startswith('Eye.')],key=lambda o:o.name)
    for sign,o in zip([-1,1],eyes):o.parent=p;o.matrix_parent_inverse=Matrix.Identity(4);o.location=(sign*.046,0,0)
    if bpy.data.objects.get('SmallSmile'):bpy.data.objects['SmallSmile']['keep_independent']=True
    # Optional rain-state geometry. These are presentation-only, excluded from model exports.
    col=clear_stage('RainPreview');mat('rainStreak','c0cdd0',.4);m=mat('puddle','829e9f',.10,.3)
    rr=random.Random(721)
    for i in range(8):
        x=rr.uniform(-2.5,2.0);y=rr.uniform(-2.8,1.1);radius=rr.uniform(.16,.38)
        verts=[(x,y,.004)]+[(x+radius*(1+.2*math.sin(j*3.1))*math.cos(j*math.tau/16),y+radius*.45*math.sin(j*math.tau/16),.004) for j in range(16)]
        mesh('RainPuddle',verts,[(0,j+1,(j+1)%16+1) for j in range(16)],m,col)
    verts=[];faces=[]
    for i in range(260):
        x=rr.uniform(-4.6,4.6);y=rr.uniform(-3.8,4);z=rr.uniform(.25,4.5);length=rr.uniform(.13,.30);k=len(verts)
        verts.extend([(x-.003,y,z),(x+.003,y,z),(x+.032,y,z+length),(x+.026,y,z+length)]);faces.append((k,k+1,k+2,k+3))
    mesh('RainStreaks',verts,faces,'rainStreak',col)
    if not SCENE.get('reference_composition'):
        mat('river','729da8',.29,.05);mat('mountainFront','9bb4bd');mat('mountainBack','b4c6d1');mat('farGray','afc0c5')
        SCENE.render.resolution_x=1560;SCENE.render.resolution_y=1450

def weather_outfit(active=()):
    active=set(active)
    for o in collection('Character').objects:
        kind=o.get('weather_variant')
        if kind:o.hide_render=kind not in active;o.hide_set(kind not in active)
        hidden_by=o.get('hide_under_outfit')
        if hidden_by:o.hide_render=hidden_by in active;o.hide_set(hidden_by in active)

def season(term='xiazhi'):
    for o in collection('Seasons').objects:
        if o.get('solar_term'):o.hide_render=o['solar_term']!=term;o.hide_set(o['solar_term']!=term)

def set_state(night=False,rain=False,term='xiazhi'):
    season(term);weather_outfit(('raincoat','umbrella') if rain else ())
    for o in collection('Laundry').objects:o.hide_render=rain;o.hide_set(rain)
    cat=bpy.data.objects['CalicoCat'];cat.location=cat.get('roof_pose',(-2.7,2.23,2.18))
    for o in collection('RainPreview').objects:o.hide_render=not rain;o.hide_set(not rain)
    for o in SCENE.objects:
        if o.name.startswith(('Sparrow','Pigeon')):o.hide_render=rain;o.hide_set(rain)
    for name,rough in [('floor',.72),('limestone',.72),('terracotta',.72)]:
        bsdf=next(n for n in M[name].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        bsdf.inputs['Roughness'].default_value=.22 if rain else rough
    sun=bpy.data.objects['RooftopSun'];sun.data.energy=.08 if night else 3.0;sun.data.color=rgba('a8c0de' if night else 'fff0d1')[:3]
    bpy.data.objects['SkyFill'].data.energy=90 if night else 600
    bpy.data.objects['WarmBounce'].data.energy=0 if night else 300
    bpy.data.objects['TeaBulbLight'].data.energy=55 if night else 0
    for name,strength in [('warmLight',8 if night else 0),('roomPane',2.0 if night else 0),('cityLight',2.0 if night else 0)]:
        m=bpy.data.materials['RT_'+name];bsdf=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bsdf.inputs['Emission Strength'].default_value=strength
    m=bpy.data.materials['RT_windowShader'];gain=next(n for n in m.node_tree.nodes if n.get('rt_role')=='window_gain');gain.inputs[1].default_value=2.4 if night else 0
    for n in SCENE.world.node_tree.nodes:
        if n.get('rt_role')=='lighting-sky':n.inputs[0].default_value=rgba('657d9b' if night else 'b7d0e0');n.inputs[1].default_value=.16 if night else .38
        if n.get('rt_role')=='camera-sky':n.inputs[0].default_value=rgba('263850' if night else 'b7d0e4');n.inputs[1].default_value=.55 if night else .9
    for o in collection('PreviewClouds').objects:o.hide_render=night;o.hide_set(night)
    SCENE.view_settings.exposure=.50 if night else .30
    bpy.context.view_layer.update()

def render(name,night=False,rain=False,term='xiazhi',percent=100,samples=128):
    set_state(night,rain,term);SCENE.render.resolution_percentage=percent;SCENE.cycles.samples=samples
    SCENE.render.filepath=str(OUT/'reference'/name)
    return bpy.ops.render.render('INVOKE_DEFAULT',write_still=True)
