# Room Blog Blender Modeling Plan

**Goal:** Build and validate the room described in `assets/blender/BRIEF.md`, stopping at stage 6 for approval.
**Architecture:** Idempotent bpy scripts executed through Blender MCP. Static geometry remains separate until approved baking; interactive parts are joined only within each named interactable. Preview cameras/lights stay in a separate non-export collection.
**Tech stack:** Blender 5.2.3 LTS, bpy, MCP.
**Source:** User attachment copied to `assets/blender/BRIEF.md`. `docs/SPEC.md` is absent; existing `src/scene/layout.ts` agrees with the attachment's coordinate anchors.

## Constraints and decisions

- User authorized deletion of the default Cube, Camera and Light on 2026-11-01.
- Blender Z-up, metres; material hex values converted from sRGB to linear; no external assets or image textures.
- Exact named roots and child nodes; applied scales; under 60,000 evaluated triangles.
- Preserve required roots even when assembly bounding-box centres differ (computer keyboard extends forward of its base).
- `Computer_Screen` uses the explicitly required centre origin, overriding the general bottom-origin rule for this plane. `Lamp_Light` is an Empty, not a mesh. Wall frames use bottom-centre pivots below the specified artwork centres.
- Floor top stays at 0.02; floor-standing furniture feet start at 0.02, with specified zero-height assembly anchors retained.
- Each stage saves `room.blend`, first copying the prior file to `room_prev.blend`; stage screenshots are retained.
- No UVs, baking, Room_Static merge, GLB export or frontend changes until approval after stage 6.
- Preview-camera ruling: at the required fixed position, 50 mm clips the shell (projected x=-0.112..1.031 and y=-0.099..0.923). Use 40 mm with a small lens shift for complete preview framing; preserve all frontend marker coordinates and disclose this at stage 6.

## Stages

- [x] 1. Inspect environment; initialize collections, shared helpers, preview camera and checkpoint.
- [x] 2. Shell and wall decorations; screenshot and spatial inspection.
- [x] 3. Furniture and interactive bookshelf; screenshot and spatial inspection.
- [x] 4. Exact interactive nodes, origins and hierarchy; screenshot and numerical checks.
- [x] 5. Exact camera markers, final preview camera and warm soft lighting; Cycles preview.
- [x] 6. Validate naming, screen normal/dimensions/centre, parenting, scales, triangle budget and furniture support heights. Write JSON/Markdown inventory, show final preview and wait.

## Stage 6 result

52 numerical checks passed; 45,258 evaluated triangles, including 15,932 Static triangles. Screen geometry, names, parents, scales and desktop contact heights match the contract. Corrected coplanar rug faces and made a concealed floor recess under the zero-origin Bookshelf. No UV, bake, merge or export has been started. Awaiting user approval.

## Validation focus

1. Screen export orientation: Blender normal -Y converts to Three.js +Z.
2. Interactive assembly roots must remain stable across reruns; no `.001` duplicate contract names.
3. Desk top 0.80 and three desktop anchors 0.80; rotated diary stays within the desk.
4. Evaluated triangles include bevels and converted curves, not only base topology.
5. Approval boundary: stage 6 leaves public model/texture output untouched.
