from pathlib import Path
s=Path('/Users/cianlien/Downloads/room-blog/assets/blender/scripts/v2/validate_realism.py').read_text()
exec(compile(s[:s.index("assert not failed")], 'validate-part','exec'))
print('SHELF_BOUNDS',geo(scene.objects['Bookshelf']))
e=quilt.evaluated_get(deps);m=e.to_mesh();ids=sorted(set(a for a,b in overlap));ps=[quilt.matrix_world@m.polygons[a].center for a in ids]
print('INTERSECTION_REGION',len(ids),[min(p[a] for p in ps) for a in range(3)] if ps else None,[max(p[a] for p in ps) for a in range(3)] if ps else None)
e.to_mesh_clear()
