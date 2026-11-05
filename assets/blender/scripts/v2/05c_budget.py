from pathlib import Path
exec(compile(Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/common.py').read_text(),'v2/common.py','exec'))
deps=bpy.context.evaluated_depsgraph_get()
for o in scene.objects:
    if o.hide_render or o.type!='MESH':continue
    for mod in list(o.modifiers):
        if mod.name=='Web geometry budget':o.modifiers.remove(mod)
    ratio=None
    if o.name=='Bookshelf':ratio=.32
    elif o.name=='Computer':ratio=.38
    elif o.name=='V2_Detail_GamingChair':ratio=.52
    elif o.name.startswith('V2_Props_'):ratio=.45
    elif o.name.startswith('V2_Detail_') and 'Leaf' not in o.name:ratio=.65
    # Keep soft silhouette subdivision at level 2; thin unseen bevels need less tessellation.
    for mod in o.modifiers:
        if mod.type=='BEVEL':mod.segments=2
    if ratio:
        e=o.evaluated_get(deps);m=e.to_mesh();m.calc_loop_triangles();tri=len(m.loop_triangles);e.to_mesh_clear()
        if tri>80:
            mod=o.modifiers.new('Web geometry budget','DECIMATE');mod.ratio=ratio;mod.use_collapse_triangulate=True
# Decimation can move the lowest bevel vertices by fractions of a millimetre.
# Correct the mesh locally while leaving the exact frontend anchor untouched.
o=scene.objects['Bookshelf'];bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
e=o.evaluated_get(deps);m=e.to_mesh();bottom=min(v.co.z for v in m.vertices);e.to_mesh_clear()
if abs(bottom)>1e-7:o.data.transform(Matrix.Translation((0,0,-bottom)))
print('Budget modifiers refreshed')
