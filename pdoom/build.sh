#!/usr/bin/env bash
# 一键重建 P(doom) 成片。
#   ./build.sh            完整跑：拟音 → 渲染 → 混流 → 海报 → 字幕
#   ./build.sh assets     只重建拟音与事件表
#   ./build.sh stills 12  只出一张静帧（调试用）
set -euo pipefail
cd "$(dirname "$0")"

PY=.venv/bin/python
FILM=film
MP4=pdoom.mp4
WORKERS=${WORKERS:-6}

need() { command -v "$1" >/dev/null || { echo "缺少 $1"; exit 1; }; }
need node
need ffmpeg
[ -x "$PY" ] || { echo "缺少 .venv（python3 -m venv .venv && .venv/bin/pip install numpy scipy）"; exit 1; }

case "${1:-all}" in
  assets)
    ( cd "$FILM" && node dump_ev.mjs )
    "$PY" music_sfx.py
    ;;
  stills)
    ( cd "$FILM" && node render.mjs stills "${@:2}" --dir ../stills )
    ;;
  all)
    echo "== 1/4 导出事件表 =="
    ( cd "$FILM" && node dump_ev.mjs )
    echo "== 2/4 合成拟音 + 混音 =="
    "$PY" music_sfx.py
    echo "== 3/4 逐帧渲染（$WORKERS workers）=="
    ( cd "$FILM" && node render.mjs video "$WORKERS" )
    echo "== 4/4 混流 =="
    ( cd "$FILM" && node render.mjs mux "../$MP4" )
    ffmpeg -y -loglevel error -ss 1.6 -i "$MP4" -frames:v 1 -q:v 2 poster.jpg
    echo "完成 → $MP4 / poster.jpg"
    ;;
  *)
    echo "用法：./build.sh [all|assets|stills <t>...]"; exit 1 ;;
esac
