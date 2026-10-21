# CREDITS

## 派蒙精灵

像素数据由用户提供的参考精灵表逐像素解码而来
（`work/attachments/seq3477_sheet.png`），解码器 `tools/decode_sheet.py`。
派蒙 / Paimon 及相关视觉设定版权归米哈游（miHoYo / HoYoverse）所有；
本项目为非商业粉丝向技术演示。

## 代码与分镜

基于 `workspace/mg-styles-15/demos/20-pixel` 的分镜结构、时间轴与渲染骨架改写。
提瓦特场景（远山雪顶、崖壁瀑布、松林、蒙德风车、Celestia 浮空岛、华丽宝箱、原石、
风史莱姆、摩拉）为本项目新绘。

## 字体

- **Fusion Pixel 12px** — 开源像素中文字体，SIL Open Font License 1.1。
- **Press Start 2P** — CodeMan38，SIL Open Font License 1.1。

## 音频

- `mgaudio`（`mg-styles-15/lib/audio`）合成引擎。
- 全部音色为程序合成（Karplus-Strong 拨弦、FM 击弦、sine 主音），不含第三方采样素材。
  原采样库 `lib/audio/samples/` 文件不完整，未使用。

## 工具链

Chromium (CDP) 逐帧确定性渲染 + ffmpeg (H.264 / AAC)。
