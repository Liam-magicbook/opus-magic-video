# DeepSeek V4.1 Flash · 硬核拆解（60s 纸片贴纸风 MG）

参考 `mg-styles-15/demos/19-paperclip` 的视觉语言，为 DeepSeek V4.1 Flash 做的一支 60 秒
纸面/贴纸风格说明片。**纯 HTML/CSS/JS，单文件时间轴，`window.renderAt(t)` 可确定性寻帧。**

## 一分钟讲什么

一句话主张：**读得越多，每 token 反而越便宜**——因为这一代把"上下文越长缓存越贵"的账反着算了。

| 段 | 时间 | 主张 | 画面证据 |
|---|---|---|---|
| A 标题 | 0–5.2s | 抛问题：读得越多为什么反而越便宜 | 大标题 + `CONTEXT · 1,000,000` 贴纸落地；3.15s 补"账是反着算的"立论 |
| 01 结构 | 5.4–17.4s | 输入输出不按同一套算 | 编码器/解码器双箱 + token 双跑道 + 8B/16B 徽章；12.35s「20 层各存一份 → 1 份 SHARED」 |
| 02 缓存 | 17.5–28.7s | 同一条上下文只存四分之一 | 890 字节计数 + ×1/4、×1/8 比值条 + 437× ；24.15s「890 B × 1M = 890 MB / 一张卡 90 条」 |
| 03 跑分 | 28.8–40.0s | 小模型赢了自己的旗舰 | 五项对比条形图 + Opus 5 基准竖线 + 1017 印章；35.9s「五项平均 +6.6」 |
| 04 成本 | 40.1–50.0s | 能看图，也便宜到可以随手用 | 价格表 + 闲时五折票根 + 三张能力卡；47.4s「缓存命中便宜 50 倍，$3 对 $150」 |
| 收束 | 50.1–60.0s | 890 字节回到同一个数字上 | 暗色纸片自上拍下，890 沿逆光轨迹飞入并 slam，红色印章白描边 |

节奏设计上刻意避免"一节讲完就静止"：每节在主讲信息落地后 5–7 秒处都有一个**第二个信息节拍**
（上表"xx s"那些点），并且都配了对应的音效事件。

## 运行

```bash
# 1) 配乐 + 音效（锁 cues.json 的事件点，输出 -14 LUFS / TP ≤ -1.0）
/Users/oceann/Desktop/workspace/claude-lab/pixel-teyvat/.venv/bin/python audio.py
# → out/audio.wav + out/audio_spec.png

# 2) 预览（纯 HTML，不渲染任何文件）
node tools/serve.mjs            # → http://127.0.0.1:8777/index.html
#    控制台里 window.renderAt(26.2) 可以逐点跳帧检查

# 3) 抓静帧自检（任意时刻，写 out/stills/p< t >.png）
node tools/probe.mjs 2 12.9 26 36.9 48.5 59

# 4) 正式成片（1920×1080 / 30fps / 60s，需先经确认）
node harness/render.mjs . --out out/video.mp4 --audio out/audio.wav --workers 4
```

- `tools/probe.mjs` — 起本地静态服务 → 等 `window.__ready` → `renderAt(t)` → 截图，用来在不渲染整片的情况下逐点校验。
- `tools/serve.mjs` — 预览用静态服务（`node tools/serve.mjs`），浏览器里直接看。

## 文件

- `index.html` — 全片唯一渲染入口。世界坐标系 1920×5400，五段 `SEC=[0,1080,2160,3240,4320]`，
  机位 y = 段顶 + 540；段间用 `d3.interpolateZoom` 做 fly 转场。
- `cues.json` — 机位关键帧 `cam`、全部事件时刻 `ev`、章节表 `chapters/chapter_names`。
  **改时间轴只改这里**，画面与音频都从这里读。
- `audio.py` — `mgaudio` 的 `recipes.explainer`（marimba + 轻鼓 + glock）+ 逐事件音效。
- `harness/render.mjs` — 逐帧渲染器（ROOT 已指向本项目，`node_modules` 软链到 `mg-styles-15`）。
- `assets/fonts/` — Alibaba PuHuiTi（400/500/700/900/1000）、Inter VF、JetBrains Mono VF。

## 视觉规范（沿用 paperclip）

- 纸面 `#E9EEF2`，卡纸 `#F7F9FB`，墨 `#25313D`，次级灰 `#8C9AA8`，强调橙 `#FF5A36`。
- 网格点 `radial-gradient` 46px 栅格；全片带 16% 的 feTurbulence 颗粒 + 径向暗角。
- 贴纸语言：`stroke:#F7F9FB` + `paint-order:stroke` 做 die-cut 白描边；落地用 `slap()`
  （过冲 → 回弹 → 阻尼摆动），阴影 `drop-shadow` 随 lift 变化。
- 章节卡片靠机位距离 `clamp((520-|d.y+112-C.y|)/210)` 控制显隐，转场时自动淡出；
  HUD 底部进度条同理（`hubY` 判定），右上角计时器同开关。

## 事实来源

- DeepSeek 官方发布页：https://www.deepseek.com/news/deepseek-v4-1-flash/ （2026-09-10）
- Hugging Face 模型卡：https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017
- API 定价页：https://api-docs.deepseek.com/quick_start/pricing

片中用到的口径：552B MoE / 20 E + 20 D / 45T tokens 预训练 / 输入激活 8B、输出激活 16B /
1M 上下文、最长输出 384K / 每 token 全局 KV 890 B（上代约 3.5 KB）/ HBM 需求 1/4、常驻 1/8 /
较初代累计 437× / BabyVision 92.5、Chartography 83.0 / 五项基准全部上涨、平均 +6.6，三项高于 Opus 5 /
MIT / 闲时价为高峰价一半（$0.003 / $0.15 / $0.60）。

派生数字（片中标注为推算）：890 B × 1,000,000 ≈ 890 MB；800 亿字节 ÷ 890 MB ≈ 90 条并行上下文；
缓存命中 $0.003 vs 未命中 $0.15 = 50 倍；10 亿 token 输入 $3 对 $150。
