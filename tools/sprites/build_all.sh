#!/bin/sh
# Renders and packs the given hotels one after another.
# Usage: tools/sprites/build_all.sh <bpy-python> <glbDir> <renderDir> <hotel...>
PY=$1; GLB=$2; OUT=$3; shift 3
DIR=$(dirname "$0")
for h in "$@"; do
  echo "== $h"
  "$PY" "$DIR/render_hotel.py" "$GLB" "$h" "$OUT/$h" --samples 48 > "$OUT/$h.log" 2>&1
  "$PY" "$DIR/render_chars.py" "$GLB/$h-chars.glb" "$h" "$OUT/$h" > "$OUT/$h-chars.log" 2>&1
  "$PY" "$DIR/pack.py" "$OUT/$h" "$GLB" "$h" "$DIR/../../assets/sprites"
done
