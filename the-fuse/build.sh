#!/bin/sh
# The Fuse — from a blank page to the finished film.
# Requires: node 20+, ffmpeg, python3 with numpy + scipy, and the Lemo-Opuscar
# core tools (playwright-core + a Chromium) installed at $LIB.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-${LEMO_OPUSCAR:-}}
if [ -z "$LIB" ] || [ ! -f "$LIB/core/render/video.mjs" ]; then
  echo "set LIB to the Lemo-Opuscar folder (it must contain core/render/video.mjs)"
  echo "  git clone https://github.com/lemomo-ai/lemo-opuscar"
  echo "  LIB=/path/to/lemo-opuscar sh build.sh"
  exit 1
fi
export LIB
if [ -n "${PLAYWRIGHT_CHROME:-}" ]; then
  export PLAYWRIGHT_CHROME
fi
cd "$LIB"
mkdir -p "$HERE/out"

node core/render/events.mjs "$HERE"
python3 "$HERE/audio/foley.py"
python3 "$HERE/audio/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/picture.mp4"
sh core/render/mux.sh "$HERE/out/picture.mp4" "$HERE/out/mix.wav" "$HERE/the-fuse.mp4" 24 1.5
python3 core/render/srt.py "$HERE/cues.json" "$HERE/the-fuse.srt"
echo "done: $HERE/the-fuse.mp4"
