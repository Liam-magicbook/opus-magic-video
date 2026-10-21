# 提瓦特：大陆探险 (Teyvat: Continental Expedition)

派蒙主题的 320×180 像素冒险短片，10 秒 / 30fps / 1920×1080 CRT 输出。
基于 `mg-styles-15/demos/20-pixel` 的分镜与时间轴改造，世界观整体换成提瓦特大陆。

产物：

- `out/video.mp4` — 成片（H.264 + AAC，10.0s）
- `out/audio.wav` — 配乐（-15 LUFS，TP -1.26 dBTP）
- `out/stills/t*.png` — 逐时间点静帧

## 怎么跑

```bash
node harness/render.mjs . --stills 1.0,5.6          # 静帧 → out/stills/
node harness/render.mjs . --query "sheet=1"         # 精灵表 → out/stills/sheet.png
node harness/render.mjs . --query "nocrt=1" --stills 2.1   # 关 CRT，看原始像素
node harness/render.mjs . --out out/video.mp4 --audio out/audio.wav --workers 4
.venv/bin/python audio.py                            # 重写 out/audio.wav
```

## 派蒙精灵是怎么来的

**精灵不是手画的，是从参考图逐像素解码出来的。**

参考图（用户认可的那版 18 姿势精灵表）保存在 `work/attachments/seq3477_sheet.png`。
这张图是从 opencode 会话数据库里原样提取的附件，未经压缩。

它是一张 6 倍最近邻渲染，每个精灵像素都是实心 6×6 色块，所以取色块中心采样就能取回原字符。

```bash
.venv/bin/python tools/decode_sheet.py            # → work/reference_poses.json
.venv/bin/python tools/decode_sheet.py --dump idle0
```

布局是实测的，不是假设的：

| 行 | 姿势顺序 | 起始 y（设计像素） |
|---|---|---|
| 1 | run0 run1 run2 run3 run4 run5 up down land skid | 4 |
| 2 | idle0 idle1 cheer get0 get1 flinch0 flinch1 blink | 36 |

**每个姿势宽度不同（20–25 px）**，所以必须按各自的实际墨迹包围盒解码。
早期版本假设固定步距，结果把光环和披风边缘整段裁掉——这是"sheet 好看、片中难看"的真正原因之一。

每个姿势在 `js/paimon_art.js` 里带自己的锚点：`ax` = 头顶 4 行墨迹的水平中心，`ay` = 脚底行号。
`drawHero()` 按这两个值对齐，跑步/跳跃切换姿势时不会左右抖。

解码出的网格**已经自带 1 px 描边**，因此 `heroSprite()` 不再调用 `outline()`（否则会叠第二层描边并整体位移）。

## 逐像素验收

不看图判断，只做数值比对：

```bash
node tools/hero_check.mjs 140 work/h140.json     # 导出实际帧缓冲 + 页面真实 POSES
.venv/bin/python tools/verify_hero.py work/h140.json
```

约定：`verify_hero.py` 报出的差异如果落在角色包围盒右边缘之外，是旁边金币/粒子的像素侵入取样窗口，不是角色本身。
frame 140（idle）曾达到 2 行 2 像素差异，且两点都在窗口边缘。

## 配乐

`audio.py` 是提瓦特风，不是参考片的 NES 芯片音乐：

- 竖琴琶音（Karplus-Strong 合成，`engine='ks'`）
- 长笛主旋律（`synth.voice`，sine + 微量噪声 + 5.2Hz 颤音）
- 拨弦低音 + 钢片琴式击弦（`fm.mallet(kind='xylo')`）

时间点全部读 `cues.json`，与画面同一张表。

**踩过的坑**：`lib/audio/samples/` 里大量 flac 文件缺失（harp 18 个样本只有 6 个文件，glock 12 个全缺），
`S.inst(...).play()` 会在部分音高上直接抛 `LibsndfileError`。
所以全线改用合成器，不碰采样库。

## 场景

`js/scene.js` 一个文件装全部：精灵加载、天空/远山雪顶/崖壁瀑布/松林/蒙德风车/Celestia 浮空岛、
蒲公英与萤火、摩拉金币、风史莱姆、华丽宝箱、原石、HUD、对话框、标题 Logo、CRT 着色器。

时间轴沿用参考片，未改动：0.3 / 2.0s 起跳，2.4s 踩史莱姆，4.4s 停 + 感叹，
4.6s 对话框，6.4s 宝箱开 + 闪白，6.8s 拿到原石，7.2s 标题砸落，8.0s 入夜，8.4s PRESS START。

## 依赖

- `lib/audio` → 软链到 `mg-styles-15/lib/audio`
- `node_modules` → 软链到 `mg-styles-15/node_modules`
- `.venv`（Python 3.12）：numpy / scipy / soundfile / pedalboard / pyloudnorm / matplotlib / numba / Pillow

## 目录

```
js/scene.js            全部画面逻辑
js/paimon_art.js       解码产物，勿手改
tools/decode_sheet.py  参考图 → 精灵网格
tools/hero_check.mjs   导出帧缓冲 + 真实 POSES
tools/verify_hero.py   逐像素 diff
tools/preview_sprite.py 离线精灵预览
harness/render.mjs     逐帧确定性渲染
cues.json              节拍时间表
audio.py               配乐
work/attachments/      原始参考图（宝贵，勿覆盖）
work/reference_poses.json  解码中间产物
```
