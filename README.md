# opus-magic-video

四支从代码渲染出来的短片。每支片子都是**单文件时间轴 + `window.renderAt(t)` 可确定性寻帧**：
画面、配乐、音效共用同一张 `cues.json`，所以改时间只改一处。
（`pdoom/` 是长片特例：156 秒、音乐已有独立声源，时间轴来自 `data/lyrics.json` 的词级时间戳。）

| 片子 | 时长 | 风格 | 成片 |
|---|---|---|---|
| [`deepseek-v41-flash/`](deepseek-v41-flash/) | 60s | 纸面/贴纸风 MG，技术拆解 | `out/video.mp4` 未渲染（HTML 预览） |
| [`pixel-teyvat/`](pixel-teyvat/) | 10s | 320×180 像素冒险 + CRT | [`out/video.mp4`](pixel-teyvat/out/video.mp4) |
| [`cel-boil-splash/`](cel-boil-splash/) | 10s | 逐帧手绘 / line boil | [`out/video.mp4`](cel-boil-splash/out/video.mp4) |
| [`pdoom/`](pdoom/) | 156s | 复古半调案卷（47 场景 / 46 句歌词） | [`pdoom-web.mp4`](pdoom/pdoom-web.mp4) |

`out/stills/` 里是逐时间点的校验静帧——不渲染整片也能看构图。

## 目录

```
lib/audio/            mgaudio：合成引擎 + CC0 采样库（三支片子共用）
requirements.txt      soundtrack 依赖（numpy/scipy/soundfile/numba/pedalboard…）
<films>/              index.html · cues.json · audio.py · js/ · assets/ · out/
```

每支片子的 `harness/render.mjs` 都是同一份逐帧渲染器：起本地静态服务 → 等 `window.__ready`
→ 逐帧 `renderAt(t)` → 截图管道喂 ffmpeg（`tmix` 做运动模糊）→ H.264 + AAC。

## 跑起来

```bash
# 依赖
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd pixel-teyvat && npm install        # 每个 film 目录各自一次

# 预览（不落任何文件）
cd deepseek-v41-flash && node tools/serve.mjs      # → http://127.0.0.1:8777/index.html

# 静帧
node harness/render.mjs . --stills 0.5,5.6

# 配乐（锁 cues.json 的事件时刻）
.venv/bin/python audio.py                          # → out/audio.wav

# 成片
node harness/render.mjs . --out out/video.mp4 --audio out/audio.wav --workers 4
```

需要本机装有 Google Chrome（渲染器用 `puppeteer-core` 驱动它，不下载 Chromium）和 `ffmpeg`。

## 约束

- 时长/分辨率/fps 写在各片 `index.html` 的 `window.DEMO` 或 `cues.json` 里，渲染器读它。
- 画面必须完全由 `renderAt(t)` 驱动，不能用 CSS 动画自己跑——否则逐帧渲染会漂。
- 音频与画面共用 `cues.json` 的 `ev`，加一个视觉节拍就要同时在 `audio.py` 里补音效。
