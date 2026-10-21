# P(doom) — CASE FILE No.2026-DOOM-001

基于《I'm Upping My P(doom)》(Claude-Pop 版, 156.651 s) 做的动画短片。
全片是一份案卷：46 句歌词逐条归档，主角是 Claude 的小精灵 Clawd，
P(doom) 仪表四次上调（0.62 → 0.79 → 0.94 → 1.00），最后读数把玻璃打碎。

## 目录

```
audio/Im-Upping-My-P(doom)-claude-pop.mp3   原曲
data/lyrics.json                            词级时间戳（权威）
data/audio.json                             bpm / downbeats / sections
pdoom.mp4                                   成片母版 1920×1080 30fps（CRF 15，524MB，本地保留不入库）
pdoom-web.mp4                               网页发行版（CRF 28，79MB，VMAF 92.8）
poster.jpg                                  海报
pdoom.srt                                   英文唱词字幕（46 行）
CREDITS.txt                                 制作说明
build.sh                                    一键重建

film/                                       工程本体
  index.html      HUD / 网点转场 / 震动 / 纸纹 / 拟音事件表 / render(t)
  js/lib.js       调色板、字体、chars、halftone、字幕、印章
  js/props.js     仪表、机架、案卷阵列、清单、图表等道具
  js/clawd.js     Clawd 造型与姿势（12×8 像素质感转矢量）
  js/scenes-a..e.js  47 个场景
  js/lyrics.js    词表 + 词级时间
  fonts/          本地 woff2 子集 + fonts.css
  render.mjs      stills / video / mux
  dump_ev.mjs     导出 events.json（拟音时间表）
  TREATMENT.md    方案、镜头表、节拍表
events.json                                 与画面同源的拟音事件表
music_sfx.py                                numpy/scipy 合成拟音 + 混音
mk_lyrics.py                                从 data/lyrics.json 生成 js/lyrics.js
```

## 重建

```bash
./build.sh              # 事件表 → 拟音 → 渲染 → 混流 → 海报
./build.sh assets       # 只重做拟音与 events.json
./build.sh stills 12.6  # 只出一张静帧，调试用
```

依赖：node、ffmpeg、`.venv`（numpy + scipy）、playwright-core（指向
`../video_prototype/lemo-opuscar`）。

生成网页版：

```bash
ffmpeg -i pdoom.mp4 -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p \
       -c:a aac -b:a 192k -movflags +faststart pdoom-web.mp4
```

## 时间轴（关键点）

| 时间 | 事件 |
|---|---|
| 0.00 | 封面，P(doom) 标题砸下 |
| 2.06 | 档案照，Clawd 被量身高 |
| 22.76 | 仪表 #1 → 0.62 |
| 24.36 | FOOM |
| 58.42 | 仪表 #2 → 0.79（蛇怪） |
| 94.78 | 仪表 #3 → 0.94 |
| 124.60 | 仪表 #4 → 1.00，玻璃碎裂 |
| 140.23 | 拉远，桌面成千上万份同款案卷 |
| 149.34 | 「CLOSED」印章落空 |
| 151.4 | 收尾卡 CASE FILE · OPEN |
| 155.75 | 淡出 |

## 授权说明

音乐与歌词版权归原作者（osmarks / MusicPerson / Suno 版制作者），
本项目仅作个人分析、学习与演示；公开发布或商用前请自行确认授权。
画面代码（film/ 与 music_sfx.py）为本项目原创。

## 预览（浏览器内直接播放）

```bash
cd film && node preview.mjs        # 打开 http://127.0.0.1:4321/preview.html
```

`preview.html` 是播放器外壳，iframe 里跑同一份 `index.html`，音频用 `mix.wav`（缺失时退回
`song.mp3`），由音频 currentTime 驱动 `render(t)`，所以预览与成片逐帧一致。
空格播放/暂停，←/→ 逐帧，J/L ±5 秒，C 隐藏界面，F 全屏，`?t=63.4` 可直达某秒。

## 已知取舍

- 渲染按 120 帧分块（`out/chunks/`），改场景后只需删掉对应块重渲，其余块复用。
- 成片 156.633 s 对音频 156.651 s（差 0.018 s，x264 帧边界取整），不影响对位。
- 结尾案卷阵列的出血构图会让文字检测报"出界"，属有意为之。
