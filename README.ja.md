# opus-magic-video

**5本の短編を、すべてコードから描画しています。** 素材ライブラリも、編集ソフトも、タイムラインの
ドラッグもありません——1フレームずつが `renderAt(t)` で計算され、音楽は同じイベント表から
Python で合成されます。

[English](README.md) | [简体中文](README.zh-CN.md) | **日本語** | [Français](README.fr.md)

<img src="docs/preview/hero.gif" width="720" alt="4本から各1.5秒：紙のMG / 手描きの水しぶき / ピクセル冒険 / ハーフトーンの一件書類">

<sub>4本から各1.5秒を2×2に並べたもの。左上 `deepseek-one-line`、右上 `cel-boil-splash`、左下 `pixel-teyvat`、右下 `pdoom`。</sub>

---

## 作品

| プレビュー | 作品 | 尺 | スタイル | ファイル |
|:---:|---|---:|---|---|
| <img src="docs/preview/deepseek-one-line.jpg" width="260"> | [`deepseek-one-line/`](deepseek-one-line/) | 60s | **8章・8素材**：製図紙 / サーバー室 / レシート / オシロスコープ / 織物 / 機械加工 / 岩層 / 製図紙に戻る。28ショットで1本の価格曲線を描く | [`out/video.mp4`](deepseek-one-line/out/video.mp4) · 2048×858 · 27 MB |
| <img src="docs/preview/deepseek-v41-flash.jpg" width="260"> | [`deepseek-v41-flash/`](deepseek-v41-flash/) | 60s | **紙・ステッカー風MG**、技術解説：読むほど1トークンあたりが安くなる | 未レンダリング。[`out/stills/`](deepseek-v41-flash/out/stills/) に静止画あり |
| <img src="docs/preview/cel-boil-splash.jpg" width="260"> | [`cel-boil-splash/`](cel-boil-splash/) | 10s | **コマ手描き / line boil**、水の精霊が崩れて再構成される | [`out/video.mp4`](cel-boil-splash/out/video.mp4) · 1920×1080 · 36 MB |
| <img src="docs/preview/pixel-teyvat.jpg" width="260"> | [`pixel-teyvat/`](pixel-teyvat/) | 10s | **320×180 ピクセル冒険 + CRT**、宝箱開封、昼夜の交代 | [`out/video.mp4`](pixel-teyvat/out/video.mp4) · 1920×1080 · 13 MB |
| <img src="docs/preview/pdoom.jpg" width="260"> | [`pdoom/`](pdoom/) | 156s | **レトロ・ハーフトーンの一件書類**、47シーン / 46行の歌詞、P(doom) メーターが4回上がる | [`pdoom-web.mp4`](pdoom/pdoom-web.mp4) · 1920×1080 · 79 MB |

<sub>サムネイルは [`docs/make_preview.sh`](docs/make_preview.sh) が完成済みの映像から切り出したもので、デザイン画ではありません。</sub>

## 1フレーム = 1つの純粋関数

最初の4本は**単一ファイルのタイムライン + `window.renderAt(t)` による決定論的シーク**という作りです。
映像・音楽・効果音が同じ `cues.json` を読むため、時刻の変更は1か所で済みます：

```
cues.json ──┬──> index.html   renderAt(t) ──> フレーム単位のキャプチャ ──> ffmpeg ──> out/video.mp4
            └──> audio.py     synthesize() ──> out/audio.wav ────────────┘
```

画面が完全に時刻で駆動されるので、同じコードはどのマシンでも同一のフレームを返します。途中から
レンダリングを再開でき、構図確認のために一部だけ描画でき、仕上がりを待たずに静止画で反復できます。

`pdoom/` は長尺の例外です。156秒、音楽は独立した音源で、タイムラインは `data/lyrics.json` の
単語単位タイムスタンプに由来します。そのため `build.sh` による分割レンダリング
（フォーリー → 描画 → 多重化 → ポスター → 字幕）を使います。

レンダラーは1つだけです。ローカル静的サーバーを起動 → `window.__ready` を待つ → `renderAt(t)` を
逐次実行 → キャプチャを ffmpeg に流す（`tmix` でモーションブラー）→ H.264 + AAC。

## 構成

```
lib/audio/            mgaudio：合成エンジン + CC0 サンプル集（4本の audio.py が共用）
requirements.txt      サウンドトラック依存（numpy/scipy/soundfile/numba/pedalboard…）
docs/preview/         README 用サムネイルとアニメーション
docs/make_preview.sh  完成映像からサムネイルを再抽出
<films>/              index.html · cues.json · audio.py · assets/ · out/
```

`out/stills/` は指定時刻の検証用静止画で、全編を描画せずに構図を確認できます。
`deepseek-one-line/out/sheet.png` は2秒ごとに1コマのコンタクトシートで、全体のリズムを最も速く判断できます。

各作品の固有ルール（詳細は各 `README.md`）：

- `deepseek-one-line/` — `index.html` に28ショットの `SHOTS` 表と `camAt()` のカメラキーフレーム。
  `docs/TREATMENT.md` は監督ノート（章ごとの素材、ショット表、音響設計表）。`out/sheet/` は秒ごとの
  コンタクトシート（未追跡）。
- `deepseek-v41-flash/`、`pixel-teyvat/`、`cel-boil-splash/` — `js/` にシーンモジュール、`assets/` にフォントとテクスチャ。
- `pdoom/` — `film/` がプロジェクト本体。`build.sh` で一括再構築（フォーリー → 描画 → 多重化 → ポスター → 字幕）。

## 動かす

```bash
# 依存
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd pixel-teyvat && npm install        # 作品ディレクトリごとに1回

# プレビュー（ファイルを書き出さない）
cd deepseek-one-line && node tools/serve.mjs     # → http://127.0.0.1:8777/index.html

# 静止画
node harness/render.mjs . --stills 0.5,5.6

# 音楽（cues.json のイベント時刻に固定）
.venv/bin/python audio.py                          # → out/audio.wav

# 完成映像
node harness/render.mjs . --out out/video.mp4 --audio out/audio.wav --workers 4

# README サムネイルの再抽出
./docs/make_preview.sh
```

ローカルに Google Chrome（レンダラーは `puppeteer-core` 経由で駆動し、Chromium はダウンロードしません）
と `ffmpeg` が必要です。

`deepseek-one-line` と `deepseek-v41-flash` の `node_modules` はローカルへのシンボリックリンク
（`mg-styles-15/node_modules` を指す）なので、クローン後に `npm i puppeteer-core` を実行してください。
`deepseek-one-line` が必要とするのはこれだけで、d3 は使いません。

## Opus 5.5 の質感を低予算で再現する

率直に言えば、**この作品群の質感は「モデルが強い」ことではなく、3つの工学的制約から来ています。**
コードを書く意思のあるモデルなら、この3つを守るだけで7割までは到達できます。逆に、最高のモデルでも
制約がなければ「再生はできるが作品には見えない」映像しか出てきません。

**① アニメーションを自律実行させず、決定論的にシークする。**
画面は `renderAt(t)` の純粋関数でなければなりません——同じ `t` なら常に同じフレーム。ここまでやって
初めて「修正」が意味を持ちます。1か所直したら影響するフレームだけ再描画でき、不安なら一部だけ描画して
確認できます。CSS アニメーションが勝手に走ったり `requestAnimationFrame` が勝手に流れたりすると、
フレーム整列も再描画も不可能になります。

**② 時刻の源を1つにし、映像と音が同じ表を読む。**
`cues.json` の1つのイベント（`ev`）が「12.4秒にこのフレームが叩きつけられる」と「12.4秒にこの音が鳴る」を
同時に決めます。最も高くつく手戻りは描画ではなく音ズレです。時刻をデータとして外に出せば、そのバグは
構造的に存在しなくなります。

**③ まず素材を決め、それからカメラワーク。**
`deepseek-one-line` の8章が成立しているのは、各章がまず物理的な素材（紙、レシート、オシロスコープ、織物…）を
1つに定め、そのうえで同じ1本の線をそれに適応させているからです。「この区間は何でできているか」を
「カメラがどう動くか」より先に考えるほうが速く、文字とフェードに退化しにくくなります。

正直なコスト:

| 項目 | コスト |
|---|---|
| 描画の計算資源 | **0**——ローカルの Chrome + ffmpeg。GPU を借りない |
| 60秒の描画 | 約2分 / 3 workers（`deepseek-one-line` の実測） |
| 10秒の音楽合成 | 3〜8秒（`mgaudio`、numpy のみの合成、サンプル集の購読不要） |
| モデルのトークン | **主要なコスト**。構想から納品まで数十ターン。削れるのは計算資源で、思考ではない |

つまり「低予算」の正確な意味は、**コストを計算資源から制約設計へ移す**ということです。参考ライブラリから
写せる場合はさらに安く済みます——既存のスタイルを1つ選び、`cues.json` の時刻と素材変数を1つ変えるだけで、
数分後に自分の版が見られます。`video_prototype/` のリポジトリ群の最大の価値はここにあります。ゼロから
発明させるのではなく、**すでに動いているもの**を改変させるのです。

## 制約

- 尺・解像度・fps は各作品の `index.html` の `window.DEMO` か `cues.json` にあり、レンダラーがそれを読む。
- 画面は完全に `renderAt(t)` で駆動すること。CSS アニメーションを自律実行させてはいけない——フレーム描画がずれる。
- 音と映像は `cues.json` の `ev` を共有する。視覚的なビートを足したら `audio.py` にも効果音を足す。
- 章内にハードカットがある場合、絶対時刻に依存するアニメーションは章時計（`t - 章の開始`）を使う。
  ショット内の `lt` を使うとカット後に全体がずれる。
- 暗い画面や細密なテクスチャの作品（例：`deepseek-one-line`）は `--mb 3 --shutter 0.5` を付けて描画する。
  速いプッシュインが震えないようにするため。

## 謝辞

この作り方はゼロから発明したものではありません。以下の上流リポジトリが骨組み・見本・方法論を提供し、
本プロジェクトはその上に書き換えたものです：

| リポジトリ | 作者 | ここでの役割 | ライセンス |
|---|---|---|---|
| [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | Vincentwei1021 | **レンダラーと `mgaudio` エンジンの出所**。`harness/render.mjs` と `lib/audio/` はここから直接取得。`cel-boil-splash` は `demos/05-cel-boil` から、`pixel-teyvat` は `demos/20-pixel` から改変、`deepseek-v41-flash` は `demos/19-paperclip` の視覚言語を参考 | MIT |
| [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | Vincentwei1021 | **ショットの語彙**：124枚のレシピカード / 150種のモーション。「このビートをどう撮るか」を引くほうが発明より速い | Apache-2.0 |
| [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | LemoLab | **59種のコード製映像スタイル**。`pdoom` の `playwright-core` 依存はここを指す。データストーリーテリングと iso-infographic の方向を参考にした | MIT |
| [huashu-motion](https://github.com/alchaincyf/huashu-motion) | Huashu | プロダクト発表映像スキルの一連の流れ：脚本を書き、自分で音楽を作り、ブラウザ内で画面を編集 | MIT |
| [pdoom-video](https://github.com/mexicat/pdoom-video) | Giacomo Magnanini | **生成MVの規範例**：歌詞と同期するタイポグラフィ、決定論的描画。`pdoom/` はそのローカル改変版 | MIT |
| [openfilm/examples](https://github.com/openfilm/examples) | OpenFilm | 開いて、変えて、描画できる最小構成の作例 | MIT |

その他：

- **フォント**：LXGW Marker Gothic、Caveat、Long Cang、Fusion Pixel 12px、Press Start 2P —— いずれも
  SIL Open Font License 1.1。漢字の筆順データは [hanzi-writer-data](https://github.com/skishore/makemeahanzi)
  （LGPL-3.0 / Arphic）。
- **サンプル**：`lib/audio/samples/` は CC0 の VCSL 素材。それ以外の音色は numpy で合成しており、
  第三者の素材を含みません。
- **`pixel-teyvat`**：パイモンのスプライトおよびテイワット関連の視覚設定の著作権は miHoYo / HoYoverse に
  帰属します。本プロジェクトは非営利のファンメイド技術デモです。

作品ごとの出典は各ディレクトリの `CREDITS.md` に、参考ライブラリの索引は `video_prototype/README.md` にあります。
