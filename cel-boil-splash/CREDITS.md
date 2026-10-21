# CREDITS / 素材与授权

## 图形
| 素材 | 来源 | 授权 |
|---|---|---|
| `assets/paper_base.jpg`、`assets/paper_tooth.png`、`assets/dust_ink_0*.png` | 本项目自制（`tools/gen_paper.py`、`tools/gen_dust.py`） | MIT（随本项目） |
| 全部线稿、水花、水珠、水池、标题笔画 | 由 `js/scene.js` 程序生成，无外部素材 | MIT（随本项目） |

## 字体
| 字体 | 来源 | 授权 |
|---|---|---|
| LXGW Marker Gothic（霞鹜马克体）v1.004 | https://github.com/lxgw/LxgwMarkerGothic | SIL Open Font License 1.1（`assets/fonts/cjk/lxgwmarkergothic/OFL.txt`） |
| Caveat | https://github.com/googlefonts/caveat | SIL Open Font License 1.1 |
| Long Cang 龙藏体 | https://github.com/googlefonts/longcang | SIL Open Font License 1.1 |

## 汉字笔画数据
| 数据 | 来源 | 授权 |
|---|---|---|
| `assets/hanzi/水.json`、`assets/hanzi/花.json`（真笔顺中线） | hanzi-writer-data 2.0（https://github.com/skishore/makemeahanzi） | LGPL-3.0 / Arphic Public License（字形成分） |

## 代码
`js/engine.js`、`js/scene.js`、`harness/render.mjs`、`lib/audio`（mgaudio）取自 mg-styles-15（MIT）。

## 音频
全部由 `audio.py` 用 numpy / mgaudio 合成，无采样唱片版权问题（mgaudio 自带采样见 `lib/audio/samples`，用于木琴/钢琴/格洛克，来源见该目录 README）。
