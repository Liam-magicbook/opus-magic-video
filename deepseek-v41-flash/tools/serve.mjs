#!/usr/bin/env node
// Local preview server for the film. Open the printed URL in Chrome and drag the timeline
// with the arrow keys / `renderAt` in the console; nothing is rendered to disk.
//
//   node tools/serve.mjs          # → http://127.0.0.1:8777/index.html
//   node tools/serve.mjs 9000
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const PORT=Number(process.argv[2]||8777);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json',
  '.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png','.wav':'audio/wav','.mp4':'video/mp4'};
http.createServer((req,res)=>{
  const u=decodeURIComponent(new URL(req.url,'http://x').pathname);
  let p=path.join(ROOT,u);
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  if(!fs.existsSync(p)){res.writeHead(404);return res.end('404 '+u);}
  res.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(p).pipe(res);
}).listen(PORT,()=>console.log(`http://127.0.0.1:${PORT}/index.html`));
