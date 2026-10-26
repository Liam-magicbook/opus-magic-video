#!/usr/bin/env bash
# 从成片重抽 README 用的缩略图与动图。
# 改完片子跑一遍即可，不用手动截图。依赖 ffmpeg。
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=docs/preview
mkdir -p "$OUT"

# 单帧：片子:时间点:输出名
stills=(
  "deepseek-one-line/out/video.mp4:10.2:deepseek-one-line"
  "deepseek-v41-flash/out/stills/p33.20.png:0:deepseek-v41-flash"
  "cel-boil-splash/out/video.mp4:5.0:cel-boil-splash"
  "pixel-teyvat/out/video.mp4:6.6:pixel-teyvat"
  "pdoom/pdoom-web.mp4:46:pdoom"
  "the-fuse/the-fuse-30s.mp4:15:the-fuse"
)

for item in "${stills[@]}"; do
  IFS=: read -r src t name <<<"$item"
  if [[ "$src" == *.png ]]; then
    ffmpeg -v error -y -i "$src" -frames:v 1 \
      -vf "scale=1200:-1:flags=lanczos" -q:v 3 "$OUT/$name.jpg"
  else
    ffmpeg -v error -y -ss "$t" -i "$src" -frames:v 1 \
      -vf "scale=1200:-1:flags=lanczos" -q:v 3 "$OUT/$name.jpg"
  fi
  echo "  $OUT/$name.jpg"
done

# hero.gif：六支里取四支各取 1.5 秒拼 2x2
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

cut_video() {  # src start out
  ffmpeg -v error -y -ss "$2" -t 1.5 -i "$1" \
    -vf "scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:color=black,fps=10,setsar=1" \
    -an "$3"
}

cut_video deepseek-one-line/out/video.mp4 10.2 "$TMP/a.mp4"
cut_video cel-boil-splash/out/video.mp4   5.6  "$TMP/b.mp4"
cut_video pixel-teyvat/out/video.mp4      6.6  "$TMP/c.mp4"
cut_video pdoom/pdoom-web.mp4             44   "$TMP/d.mp4"

ffmpeg -v error -y -i "$TMP/a.mp4" -i "$TMP/b.mp4" -i "$TMP/c.mp4" -i "$TMP/d.mp4" \
  -filter_complex "[0:v][1:v]hstack[t];[2:v][3:v]hstack[u];[t][u]vstack" -an "$TMP/quad.mp4"

ffmpeg -v error -y -i "$TMP/quad.mp4" \
  -vf "scale=720:405,fps=6,split[s0][s1];[s0]palettegen=max_colors=48:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -loop 0 "$OUT/hero.gif"

echo "  $OUT/hero.gif  ($(du -h "$OUT/hero.gif" | cut -f1))"
