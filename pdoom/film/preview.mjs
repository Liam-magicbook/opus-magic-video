// 本地预览服务器：把 film/ 当站点根目录，起 127.0.0.1 服务并打开浏览器。
//   node preview.mjs [port]    默认端口 4321，被占用时自动顺延
//   浏览器打开 http://127.0.0.1:<port>/preview.html
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const T = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.srt': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
};

const server = http.createServer((req, res) => {
  try {
    const host = req.headers.host || '';
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' }); return res.end('bad host');
    }
    let u;
    try { u = decodeURIComponent(req.url.split('?')[0].split('#')[0]); } catch { u = '/'; }
    if (u === '/' ) u = '/preview.html';
    const p = path.resolve(DIR, '.' + path.sep + u.replace(/^\/+/, ''));
    if (p !== DIR && !p.startsWith(DIR + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' }); return res.end('outside root');
    }
    const file = fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
    const stat = fs.statSync(file);
    const type = T[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    // 音频要支持 Range，否则拖动进度条会整个重下
    if (range && /^bytes=/.test(range)) {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = parseInt(s || '0', 10);
      const end = e ? parseInt(e, 10) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': type, 'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': end - start + 1,
      });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  }
});

const want = parseInt(process.argv[2] || '4321', 10);
let port = want;
let tries = 0;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && tries++ < 20) { server.listen(++port, '127.0.0.1'); }
  else { console.error(e); process.exit(1); }
});
server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}/preview.html`;
  console.log(`\n  P(doom) preview  →  ${url}\n  (ctrl-c 停止)\n`);
  if (!process.env.NO_OPEN) spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
});
