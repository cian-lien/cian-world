#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir/../../../.."
workspace="$(mktemp -d "${TMPDIR:-/tmp}/room-hybrid.XXXXXXXX")"
blender="${ROOM_BLENDER_BIN:-/Applications/Blender.app/Contents/MacOS/Blender}"
output="$PWD/public/bake-hybrid"
source_glb="$PWD/public/models/room-day-warm.glb"

npm install --prefix "$workspace" --no-audit --no-fund \
  @gltf-transform/core@4.5.1 @gltf-transform/extensions@4.5.1 @gltf-transform/functions@4.5.1 \
  meshoptimizer@1.3.0 sharp@0.35.5

"$blender" -b --factory-startup assets/blender/room.blend --python-exit-code 1 \
  -P "$script_dir/bake_hybrid.py" -- --res 1024 --samples 2048 --output "$workspace/bake"
mkdir -p "$workspace/web" "$output"
node "$script_dir/optimize_hybrid.mjs" "$workspace" "$source_glb" \
  "$workspace/bake/shell.glb" "$workspace/web/room.glb"
cp "$workspace/web/"* "$output/"
printf 'Trial assets: %s\nBlender copy and reference renders: %s\n' "$output" "$workspace/bake"
