# 水花 · SPLASH — cel animation / line boil

参考 `mg-styles-15/demos/05-cel-boil`，把火柴与火苗精灵换成水滴与水花精灵，标题改成「水花」。

## 故事
一滴水在竹管口鼓成大水珠 → 脱落下坠（smear 拖影 + 多重影）→ 砸进水池炸开水花 → 水花精灵点开眼睛、跳上池面 → 蹦三下、转身、Ta-da → 蓄力旋转 → 炸成一团水花 → 水花凝成扇贝徽章，火花把「水花」逐笔写出来 → 拉回手绘台，小精灵举起一颗水珠眨眼。

## 与参考片的差异
- 火柴盒 → 水池（竹管嘴给水，木牌写「水花池」）
- 火苗精灵 → 水花精灵（圆瓣水冠、水裙、溅起的小水珠）
- 标题 手作 → 水花（按 Make Me a Hanzi 真笔顺逐笔写出）
- 副标题 HAND MADE → SPLASH；手写小字「一帧一帧 · 亲手点亮」→「一滴一滴 · 落成一片」
- 调色板：墨黑 / 深水蓝 / 浅水青 / 纸白；铅笔批注改蓝色
- 音效：擦火柴刮擦 → 水珠扯断；爆燃 → 水爆；烟 → 水雾；余烬 → 水珠

## 运行
```bash
# 出静帧（在浏览器里看关键构图）
node harness/render.mjs . --stills 0.45,1.6,3.2,6.7,9.6

# 出整片（先跑音频，harness 会自动混 out/audio.wav）
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # numpy/scipy/soundfile/numba/pedalboard/pyloudnorm/matplotlib
.venv/bin/python audio.py
node harness/render.mjs . --workers 2
```

## 结构
- `js/engine.js` — 画笔渲染器、boil、离屏层
- `js/scene.js` — 全部镜头、精灵、水花特效、标题
- `cues.json` — 节拍/命中时间表（画面和声音共用）
- `audio.py` — 配乐与音效合成
- `harness/render.mjs` — 逐帧确定性渲染
