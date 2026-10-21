// 用法（本目录下运行）：
//   node render.mjs stills 1.2 3.3 ... [--dir stills]
//   node render.mjs video [workers]
//   node render.mjs mux <out.mp4>
import { chromium } from '/Users/oceann/Desktop/workspace/video_prototype/lemo-opuscar/node_modules/playwright-core/index.mjs';
import { serve, pageURL } from '/Users/oceann/Desktop/workspace/video_prototype/lemo-opuscar/core/render/serve.mjs';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const LIB = '/Users/oceann/Desktop/workspace/video_prototype/lemo-opuscar';
const FPS = 30;
let srvP = null;
let srv = null;
async function openPage(browser) {
  if (!srvP) srvP = serve(LIB, 0).then(r => (srv = r));
  await srvP;
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text().slice(0, 300)); });
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
  await page.goto(pageURL(LIB, srv.port, DIR));
  await page.waitForFunction(() => window.READY === true, null, { timeout: 180000 });
  console.log('[page ready]');
  return page;
}
const args = process.argv.slice(2);
const mode = args[0];
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
const DUR = 156.651, TOTAL = Math.round(FPS * DUR);

if (mode === 'stills') {
  const di = args.indexOf('--dir');
  const outDir = di > 0 ? path.resolve(DIR, args[di + 1]) : path.join(DIR, 'stills');
  const times = args.slice(1).filter(a => a !== '--dir' && a !== (di > 0 ? args[di + 1] : null));
  fs.mkdirSync(outDir, { recursive: true });
  const page = await openPage(browser);
  for (const ts of times) {
    const t0 = Date.now();
    await page.evaluate(t => window.render(t), parseFloat(ts));
    await page.screenshot({ path: path.join(outDir, `t_${ts}.png`), timeout: 180000 });
    console.log(`t=${ts}  ${Date.now() - t0} ms`);
  }
} else if (mode === 'video') {
  const W = parseInt(args[1] || '5');
  const F0 = parseInt(process.env.F0 || '0');
  const F1 = parseInt(process.env.F1 || String(TOTAL));
  const CHUNK = parseInt(process.env.CHUNK || '150');
  const outDir = path.join(DIR, 'out');
  const chunkDir = path.join(outDir, 'chunks');
  fs.mkdirSync(chunkDir, { recursive: true });
  const chunkName = (a) => path.join(chunkDir, `c${String(a).padStart(5, '0')}.mp4`);
  // 要渲染的块
  const jobs = [];
  for (let a = F0; a < F1; a += CHUNK) {
    const b = Math.min(F1, a + CHUNK);
    if (fs.existsSync(chunkName(a))) continue;
    jobs.push([a, b]);
  }
  console.log(`chunks to render: ${jobs.length} (of ${Math.ceil((F1 - F0) / CHUNK)})`);
  const t0 = Date.now();
  let idx = 0;
  // 单块重试：page 崩了就重建 page，块本身最多试 3 次（丢块 = 成片缺 5 秒，必须防）
  const renderChunk = async (page, a, b) => {
    const file = chunkName(a) + '.part.mp4';
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p',
      '-r', String(FPS), file]);
    let ffErr = '';
    ff.stderr.on('data', d => { ffErr += d.toString(); });
    const done = new Promise(res => ff.on('close', res));
    let dead = false;
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.render(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 94, timeout: 180000 });
      try {
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      } catch (e) { dead = true; break; }
    }
    try { ff.stdin.end(); } catch (e) {}
    const code = await done;
    if (dead || code !== 0) throw new Error(`ffmpeg ${code}: ${ffErr.slice(0, 200)}`);
    fs.renameSync(file, chunkName(a));
  };
  const worker = async () => {
    let page = await openPage(browser);
    for (;;) {
      const j = jobs[idx++];
      if (!j) break;
      const [a, b] = j;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await renderChunk(page, a, b);
          console.log(`chunk ${a}-${b} ok  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
          break;
        } catch (e) {
          console.error(`chunk ${a} attempt ${attempt} failed: ${e.message}`);
          fs.existsSync(chunkName(a) + '.part.mp4') && fs.unlinkSync(chunkName(a) + '.part.mp4');
          if (attempt === 3) { console.error(`chunk ${a} GAVE UP`); process.exitCode = 2; break; }
          try { await page.close(); } catch {}
          page = await openPage(browser);
        }
      }
    }
    try { await page.close(); } catch {}
  };
  await Promise.all([...Array(Math.min(W, jobs.length || 1))].map(worker));
  // 拼接
  const files = [];
  for (let a = F0; a < F1; a += CHUNK) {
    const f = chunkName(a);
    if (!fs.existsSync(f)) { console.error('missing chunk ' + a); process.exit(2); }
    files.push(f);
  }
  fs.writeFileSync(path.join(chunkDir, 'list.txt'), files.map(f => `file '${f}'`).join('\n'));
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(chunkDir, 'list.txt'),
    '-c', 'copy', path.join(outDir, 'video.mp4')], { stdio: 'inherit' });
  console.log('done ' + ((Date.now() - t0) / 1000).toFixed(0) + 's → out/video.mp4');
} else if (mode === 'mux') {
  const out = process.argv[3] || path.join(DIR, '..', 'pdoom.mp4');
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error',
    '-i', path.join(DIR, 'out/video.mp4'),
    '-i', path.join(DIR, 'mix.wav'),
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
    '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('mux failed'); process.exit(1); }
  console.log('muxed → ' + out);
}
await browser.close();
process.exit(0);
