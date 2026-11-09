"""Export evaluated, material-batched assets without modifying the editable source meshes."""
from common import *
import json,struct
DEST=ROOT/'public/models/rooftop'
DEST.mkdir(parents=True,exist_ok=True)
PREFIX='__RT_EXPORT__'

def plain(v):
    if hasattr(v,'to_dict'):return {k:plain(x) for k,x in v.to_dict().items()}
    if hasattr(v,'to_list'):return [plain(x) for x in v.to_list()]
    if isinstance(v,(tuple,list)):return [plain(x) for x in v]
    return v

def keep_group(o):
    return o.type=='EMPTY' and (any(o.get(k) for k in ['interaction','wind_part','animation_joint','animal','solar_term','weather_variant','composition']) or o.name.endswith('Pivot') or '_Wing' in o.name)

def clean_glb(path):
    data=path.read_bytes();magic,version,total=struct.unpack_from('<III',data,0)
    if magic!=0x46546c67 or version!=2 or total!=len(data):raise ValueError('Invalid GLB')
    chunks=[];offset=12
    while offset<len(data):
        n,kind=struct.unpack_from('<II',data,offset);body=data[offset+8:offset+8+n];offset+=8+n
        if kind==0x4e4f534a:
            doc=json.loads(body)
            for section in ['nodes','meshes','scenes']:
                for item in doc.get(section,[]):
                    if item.get('name','').startswith(PREFIX):item['name']=item['name'][len(PREFIX):]
            doc['asset']['extras']={'generator':'Lingnan rooftop via Blender MCP','coordinates':'glTF Y-up; units meters','approvedConcept':'second version, 2026-11-08'}
            body=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode();body+=b' '*((-len(body))%4)
        chunks.append(struct.pack('<II',len(body),kind)+body)
    body=b''.join(chunks);path.write_bytes(struct.pack('<III',magic,version,12+len(body))+body)
    return doc

def palette_material(material):
    """Merge color-only materials with identical physical response using glTF COLOR_0."""
    if material is None or material.name in {'RT_warmLight','RT_roomPane','RT_cityLight','RT_windowShader'}:return None
    node=next((n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if node is None:return None
    rough=float(node.inputs['Roughness'].default_value);metal=float(node.inputs['Metallic'].default_value)
    key=f'RT_ExportPalette_{rough:.3f}_{metal:.3f}'
    target=bpy.data.materials.get(key)
    if target is None:
        target=bpy.data.materials.new(key);target.use_nodes=True
        p=next(n for n in target.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        p.inputs['Base Color'].default_value=(1,1,1,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
        color=target.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Color'
        target.node_tree.links.new(color.outputs['Color'],p.inputs['Base Color'])
    return target,tuple(node.inputs['Base Color'].default_value)

def export(name,collections=None,objects=None,center_visitor=False):
    bpy.context.window.scene=SCENE;bpy.context.view_layer.update()
    if objects is None:objects=[o for c in collections for o in collection(c).objects]
    selected={o for o in objects if o.type in {'MESH','CURVE','FONT','EMPTY'} and not o.hide_render and not o.hide_get()}
    for o in list(selected):
        p=o.parent
        while p:selected.add(p);p=p.parent
    selected=sorted(selected,key=lambda o:o.name)
    deps=bpy.context.evaluated_depsgraph_get()
    temp=bpy.data.scenes.new('__RooftopExport');temp['generator']=TAG
    target=bpy.data.collections.new('__RooftopExportParts');temp.collection.children.link(target)
    clones={};geo=[]
    try:
        # Capture evaluated modifiers, curved fabrics, tubes and font outlines in one pass.
        for o in selected:
            if o.type=='EMPTY':copy=bpy.data.objects.new(PREFIX+o.name,None)
            else:
                evaluated=o.evaluated_get(deps);m=evaluated.to_mesh(preserve_all_data_layers=True,depsgraph=deps)
                if m is None:continue
                data=m.copy();evaluated.to_mesh_clear();copy=bpy.data.objects.new(PREFIX+o.name,data);geo.append(copy)
            target.objects.link(copy);copy.matrix_world=o.matrix_world.copy()
            if copy.type=='MESH' and len(copy.data.materials)==1 and not o.get('shader_role'):
                p=palette_material(copy.data.materials[0])
                if p:
                    material,color=p
                    attr=copy.data.color_attributes.get('Color') or copy.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
                    attr.data.foreach_set('color',list(color)*len(copy.data.loops))
                    copy.data.color_attributes.active_color=attr
                    copy.data.materials.clear();copy.data.materials.append(material)
            for k,v in o.items():
                try:
                    value=plain(v)
                    if k in {'forward','facing'} and isinstance(value,list) and len(value)==3:value=[value[0],value[2],-value[1]]
                    copy[k]=value
                except TypeError:pass
            copy['visible_by_default']=True;clones[o]=copy
        bpy.context.window.scene=temp
        for original,copy in clones.items():
            if original.parent in clones:
                mw=copy.matrix_world.copy();copy.parent=clones[original.parent];copy.matrix_world=mw
        layer_roots={}
        for original,copy in clones.items():
            layer=next((c.name.removeprefix('RT_') for c in original.users_collection if c.name in ['RT_CityNear','RT_CityMiddle','RT_CityFar']),None)
            if copy.parent is None and layer:
                if layer not in layer_roots:
                    p=bpy.data.objects.new(PREFIX+layer+'Root',None);target.objects.link(p);p['layer']=layer;layer_roots[layer]=p
                mw=copy.matrix_world.copy();copy.parent=layer_roots[layer];copy.matrix_world=mw
        if center_visitor:
            c=clones[bpy.data.objects['VisitorRoot']];c.location.x=0;c.location.y=0
        bpy.context.view_layer.update()
        # Preserve kinematic/interaction boundaries; batch only siblings that can move together.
        groups={}
        for original,copy in clones.items():
            if copy.type!='MESH' or original.get('keep_independent') or original.get('hide_under_outfit') or original.get('shader_role'):continue
            p=original.parent
            while p and not keep_group(p):p=p.parent
            if p is None:
                p=original.parent
                while p and p.parent:p=p.parent
            owner=clones.get(p) if p else copy.parent;mw=copy.matrix_world.copy();copy.parent=owner;copy.matrix_world=mw
            key=(owner.name if owner else '',tuple(m.name if m else '' for m in copy.data.materials),original.get('weather_variant',''))
            groups.setdefault(key,[]).append(copy)
        for (owner,mats,variant),items in groups.items():
            if len(items)<2:continue
            bpy.ops.object.select_all(action='DESELECT')
            for o in items:o.select_set(True)
            bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join()
            items[0].name=PREFIX+(owner.removeprefix(PREFIX) or 'Static')+'__'+(mats[0] if mats else 'surface')+(('_'+variant) if variant else '')
        bpy.ops.object.select_all(action='SELECT')
        path=DEST/(name+'.glb')
        bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=False,export_extras=True,export_yup=True,export_cameras=False,export_lights=False,export_texcoords=True,export_draco_mesh_compression_enable=False)
        doc=clean_glb(path)
        meshes=[o for o in temp.objects if o.type=='MESH']
        triangles=0
        for o in meshes:o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
        result={'file':path.name,'bytes':path.stat().st_size,'triangles':triangles,'meshNodes':len(meshes),'materials':len(doc.get('materials',[])),'nodes':len(doc.get('nodes',[]))}
        print('EXPORTED',json.dumps(result),flush=True);return result
    finally:
        bpy.context.window.scene=SCENE
        for o in list(temp.objects):
            data=o.data;bpy.data.objects.remove(o,do_unlink=True)
            if data and data.users==0 and isinstance(data,bpy.types.Mesh):bpy.data.meshes.remove(data)
        bpy.data.scenes.remove(temp)
        if target.users==0:bpy.data.collections.remove(target)

def main():
    import presentation as P
    P.set_state(False,False,'xiazhi')
    files=[]
    files.append(export('rooftop',collections=['Architecture','Interactive','Anchors','Props','Laundry','Tea','Equipment','Garden','PlantMass','Animals','Seasons']))
    files.append(export('skyline',collections=['CityNear','CityMiddle','CityFar','SkylineMotion']))
    for name,active in [('visitor',()),('visitor-umbrella',('umbrella',)),('visitor-raincoat',('raincoat',)),('visitor-scarf',('scarf',)),('visitor-fan',('fan',))]:
        P.weather_outfit(active);files.append(export(name,collections=['Character'],center_visitor=True))
    P.weather_outfit(())
    for term in ['lichun','qingming','xiazhi','liqiu','dongzhi']:
        P.season(term);parent=bpy.data.objects['Season_'+term]
        files.append(export('season-'+term,objects=[parent]+list(parent.children_recursive)))
    P.set_state(False,False,'xiazhi')
    floor=bpy.data.objects['RoofFloor']
    points=[floor.matrix_world@Vector(v) for v in floor.bound_box]
    bounds={'x':[round(min(p.x for p in points),3),round(max(p.x for p in points),3)],
            'z':[round(min(-p.y for p in points),3),round(max(-p.y for p in points),3)]}
    meta={'version':1,'units':'meters','up':'Y','forward':'+Z','rooftopBounds':bounds,'defaultSeason':'xiazhi','rooftopIncludesSummerDecor':True,'visitorHeight':.9,'files':files,'notes':['Every file is visible in a standard glTF viewer.','Hide embedded Season_xiazhi before attaching another season asset.','Keep named pivots for procedural animation; no skeletal rig.','CityWindows UV.x stores one random seed per face; replace its material for runtime night dimming.','GLB Y-up converts Blender -Y forward to +Z.','Presentation rain streaks, puddles, sky clouds and lamps are not exported.']}
    (DEST/'manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'rooftop.blend'))
    return meta
