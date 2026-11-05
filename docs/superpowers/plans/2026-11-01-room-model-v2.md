# Room Blog V2 — Night Room Plan

**Goal:** Build the user's original night-room design through three approval gates.
**Architecture:** Idempotent bpy stage scripts through Blender MCP; independent render/bake collections; exact frontend root names and markers. Preserve v1 under `assets/blender/archive/v1`.
**Spec:** `assets/blender/BRIEF-v2.md` (the user attachment is authoritative).
**Tools:** Blender 5.2.3 LTS, Cycles/Metal, MCP. No external assets required for blockout.

## Constraints

- Stop after stage 3 for layout approval; after stage 6 for lighting approval; after stage 7 for bake-test approval.
- No detailed furniture/soft modeling before the stage 3 approval. No UV, baking or export during this initial pass.
- Six collections: Static_Room, Static_Furniture, Static_Props, Interactive, Markers, Lights. PreviewCam is linked directly to the scene root.
- Metres, Z-up; sRGB hex converted to linear; procedural materials; no copied reference objects or branding.
- Final evaluated triangle budget 150,000; model 4MB; eventual WebP atlas target 600KB each.
- Each stage uses Cycles 48 samples with denoising, saves `room.blend`, preserves `room_prev.blend`, and stores its preview.

## Decisions to disclose at layout gate

- Desktop top takes priority: 0.05m thickness with top Z=0.80 gives centre Z=0.775.
- Diary Y=2.335 instead of 2.30 keeps its rotated footprint on the narrower 0.8m desktop. Other interactive anchors retain the v2 values.
- PreviewCam stays at (7.5,-7.5,6.2), lens 50mm; a 40mm vertical sensor and small lens shift allow the full cutaway to fit.
- Blockout lighting is temporary neutral inspection light; final blue/orange/purple zone lighting waits until stages 4–6.
- Floor top is exactly 0, eliminating v1's 2cm contact conflict.

## Work

- [x] 1. Inspect, archive v1, reset only managed objects, create helpers/collections/camera, render empty setup checkpoint.
- [x] 2. Build dark cutaway plinth, colored walls with window, separate wood boards, skirting, window/night panel. Render and inspect.
- [x] 3. Add complete furniture/props placeholders, interactive roots and camera markers. Validate placement/framing, render and stop for approval.
- [x] 4. Detailed furniture and soft goods revised in response to the user’s realism feedback; retained compact layout.
- [x] 5. Small props, books, botanical leaves, equipment, cables and fairy lights.
- [x] 6. Named layered night lighting, 256-sample preview produced — awaiting visual approval at this gate.
- [ ] 7. Static_Room-only 1024px bake test — approval gate.
- [ ] 8. Four 2048px atlases, lamp-on/off variants, color-management and frontend appearance verification.
- [ ] 9. Draco GLB export, preserved UVs, exact nodes, size checks and delivery inventory.

## Verification focus

Check exact floor and desk heights, missing/duplicate contract roots, screen plane orientation, foreground clearance, furniture boundaries, camera framing, evaluated triangle count, rerun consistency, and that public export files are untouched.

## Layout gate result

Stage 3: 138 objects, 32,710 evaluated triangles; 37 checks passed. A second complete blockout run produced the same object-name/origin/dimension/triangle fingerprint. Corrected cat-bed/rug contact and headboard/skirting overlap. The final Cycles inspection preview and previous blend are saved. Awaiting explicit stage 3 layout approval; stages 4–9 have not started.

## Realism revision requested 2026-11-01

User feedback: the compact colored layout is not realistic enough. Keep 4.8×4.4m interior and object anchors; refine this review version using the existing stylized-realism brief. Preserve the colored blockout under archive/v2-compact-color. This is a requested visual revision, not permission to bake or export.

- [x] Replace rigid bedding with draped quilt, soft pillows and seams; add pleated curtains and a shaped beanbag.
- [x] Replace chair with the previously requested gaming chair, including five-star wheels, panels, bolsters and stitched seams; refine drawers and materials.
- [x] Replace sphere foliage and disk fan, add keyboard keys, computer accessories, books, pegboard and cables.
- [x] Render and inspect a clear material/geometry review. Check contracts, contact, triangle budget and repeatability. Stop for review before UV/bake/export.

## Realism revision verification

- Current stage: detailed geometry/material and night-light review; awaiting stage 6 visual confirmation. No UV, bake test, production baking or export performed.
- 4.8×4.4m interior, existing interactive/camera anchors retained. Gaming chair follows the user’s earlier correction.
- 546 scene objects; 136,794 visible evaluated triangles; 65 checks passed. The complete 04→05→05b→05d→06 rerun reproduced the same geometry fingerprint.
- Quilt/mattress BVH overlap: 0 pairs after correcting the draped corner. Bookcase’s 0.36mm decimation gap corrected in mesh coordinates without changing its anchor.
- Corrected the visible moon-light source artifact in window glass by moving the source outside the window.
- Final preview: stages/v2/06-preview.png and preview.png, 1800×1600, Cycles 256 with denoising, AgX, no depth of field.
- Blender scene: RoomBlog V2 | Realism Review. Local material viewport uses scene lights/world; Render Result contains the clear review image.
- Scripts: detail_helpers.py; 04_soft_furnishings.py; 05_furniture_detail.py; 05b_props.py; 05d_cat_surface.py; 06_lighting_review.py (calls 05c_budget.py); validate_realism.py.
- Previous colored blockout archived at assets/blender/archive/v2-compact-color/. Credits updated; no external or AI-generated model assets.

## Layout / air conditioner / Apple desktop revision

User requests a better layout, replacement of floor fan with air conditioning, and MacBook + Mac mini beside the monitor. Retain the current room size, material direction and review gate.

- [x] Move bed/nightstand slightly rearward; centre chair on display; shift lounge grouping right to clear circulation.
- [x] Remove all managed fan objects, create detailed left-wall split air conditioner.
- [x] Add open MacBook left of monitor; replace existing small desktop-computer proxy with clearly detailed Mac mini on the right. Re-space diary, headphones and mug.
- [x] Preserve contract names, update anchors/report for moved objects; render, check device collisions and surface contact, rerun and verify geometry consistency. No bake/export.

### Device proportion correction

User says MacBook and Mac mini are too small. Enlarge the display models to 0.42m and 0.28m wide, respectively, for overview readability. Widen desk from 2.3m to 2.6m to accommodate the larger models, reposition side props and left lamp, and recheck contact/collisions. Room size and monitor contract plane remain unchanged.

### Revised layout result

- 492 scene objects; 141,680 visible triangles; 86 checks passed; geometry fingerprint identical on repeated 06b run.
- AirConditioner replaces all visible and hidden fan objects. Left wall mounting plate at X=-2.4; grille, louvers, status digits and conduit included.
- MacBook case enlarged from 0.304 to 0.42m wide (0.422m including ports), Mac mini from 0.197 to 0.28m wide. Desk enlarged from 2.3 to 2.6m and remains 0.8m deep with top Z=0.8.
- MacBook left of monitor, Mac mini right; no laptop mesh intersections with monitor/computer, diary, mini, speaker, lamp or mug. Both devices remain inside desk and touch its top.
- Bed and nightstand moved rearward; chair aligned to monitor; beanbag and cat shifted right. Current anchor positions and bed/beanbag clearance are in validation-v2-realism.json and REVIEW.md.
- Reproducible revision script: assets/blender/scripts/v2/06b_layout_ac_macbook.py (run after existing 06 stage). Detail camera script 06c_desk_detail.py restores all camera/render settings and writes 06-desk-detail.png without altering the saved master camera.
- Full preview saved to preview.png; room.blend and room_prev.blend retained. Earlier version archived at archive/v2-before-ac-macbook/.
- Visual review boundary retained; UV/bake/export remain pending.
