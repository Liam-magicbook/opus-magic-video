# opus-magic-video

五支从代码渲染出来的短片。前四支是**单文件时间轴 + `window.renderAt(t)` 可确定性寻帧**：
画面、配乐、音效共用同一张 `cues.json`，所以改时间只改一处。
（`pdoom/` 是长片特例：156 秒、音乐已有独立声源，时间轴来自 `data/lyrics.json` 的词级时间戳。）

| 片子 | 时长 | 风格 | 成片 |
|---|---|---|---|
| [`deepseek-one-line/`](deepseek-one-line/) | 60s | 八章八材质：制图纸 / 机房 / 收据 / 示波器 / 织物 / 机械 / 岩层 / 回到制图纸（28 镜头） | [`out/video.mp4`](deepseek-one-line/out/video.mp4)（27 MB） |
| [`deepseek-v41-flash/`](deepseek-v41-flash/) | 60s | 纸面/贴纸风 MG，技术拆解 | `out/video.mp4` 未渲染（HTML 预览） |
| [`pixel-teyvat/`](pixel-teyvat/) | 10s | 320×180 像素冒险 + CRT | [`out/video.mp4`](pixel-teyvat/out/video.mp4) |
| [`cel-boil-splash/`](cel-boil-splash/) | 10s | 逐帧手绘 / line boil | [`out/video.mp4`](cel-boil-splash/out/video.mp4) |
| [`pdoom/`](pdoom/) | 156s | 复古半调案卷（47 场景 / 46 句歌词） | [`pdoom-web.mp4`](pdoom/pdoom-web.mp4) |

`out/stills/` 里是逐时间点的校验静帧——不渲染整片也能看构图。
`deepseek-one-line/out/sheet.png` 是每 2 秒一格的总览图，判断整体节奏最快。

## 目录

```
lib/audio/            mgaudio：合成引擎 + CC0 采样库（四支片子的 audio.py 共用）
requirements.txt      soundtrack 依赖（numpy/scipy/soundfile/numba/pedalboard…）
<films>/              index.html · cues.json · audio.py · assets/ · out/
```

每支片子的 `harness/render.mjs` 都是同一份逐帧渲染器：起本地静态服务 → 等 `window.__ready`
→ 逐帧 `renderAt(t)` → 截图管道喂 ffmpeg（`tmix` 做运动模糊）→ H.264 + AAC。

各片自有目录约定（细节看各片 `README.md`）：

- `deepseek-one-line/` — `index.html` 里是 `SHOTS` 28 镜头表 + `camAt()` 摄影机关键帧；
  `docs/TREATMENT.md` 是导演阐述（章节材质、镜头表、声音设计表）；`out/sheet/` 是逐秒缩略图（不入库）。
- `deepseek-v41-flash/`、`pixel-teyvat/`、`cel-boil-splash/` — `js/` 放场景模块，`assets/` 放字体与纹理。
- `pdoom/` — `film/` 是工程本体，`build.sh` 一键重建（拟音 → 渲染 → 混流 → 海报 → 字幕）。

## 跑起来

```bash
# 依赖
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd pixel-teyvat && npm install        # 每个 film 目录各自一次

# 预览（不落任何文件）
cd deepseek-one-line && node tools/serve.mjs     # → http://127.0.0.1:8777/index.html

# 静帧
node harness/render.mjs . --stills 0.5,5.6

# 配乐（锁 cues.json 的事件时刻）
.venv/bin/python audio.py                          # → out/audio.wav

# 成片
node harness/render.mjs . --out out/video.mp4 --audio out/audio.wav --workers 4
```

需要本机装有 Google Chrome（渲染器用 `puppeteer-core` 驱动它，不下载 Chromium）和 `ffmpeg`。

`deepseek-one-line` 与 `deepseek-v41-flash` 的 `node_modules` 是本地软链（指向 `mg-styles-15/node_modules`），
克隆后需要自己 `npm i puppeteer-core`——`deepseek-one-line` 只用得上这一个，不需要 d3。

## 约束

- 时长/分辨率/fps 写在各片 `index.html` 的 `window.DEMO` 或 `cues.json` 里，渲染器读它。
- 画面必须完全由 `renderAt(t)` 驱动，不能用 CSS 动画自己跑——否则逐帧渲染会漂。
- 音频与画面共用 `cues.json` 的 `ev`，加一个视觉节拍就要同时在 `audio.py` 里补音效。
- 章内有硬切时，依赖绝对时间的动画要用章节时钟（`t - 章节起点`），不能用镜头内 `lt`，否则切点后整体错位。
- 暗场/细密纹理的片子（如 `deepseek-one-line`）渲染时加 `--mb 3 --shutter 0.5`，快推镜才不抖。
