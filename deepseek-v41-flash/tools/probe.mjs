import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
import puppeteer from 'puppeteer-core';
const ROOT=process.cwd();
const srv=http.createServer((req,res)=>{const u=decodeURIComponent(new URL(req.url,'http://x').pathname);
 let p=path.join(ROOT,u); if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
 if(!fs.existsSync(p)){res.writeHead(404);return res.end('404 '+u);}
 const ext=path.extname(p);const m={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png'}[ext]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':m,'Cache-Control':'no-store'});fs.createReadStream(p).pipe(res);});
const TS=process.argv.slice(2).map(Number);
srv.listen(8899,async()=>{
 const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--font-render-hinting=none','--disable-lcd-text','--force-color-profile=srgb','--hide-scrollbars','--mute-audio','--allow-file-access-from-files']});
 const pg=await b.newPage();await pg.setViewport({width:1920,height:1080});
 pg.on('console',m=>{if(m.type()==='error'||m.type()==='warn')console.log('[c]',m.type(),m.text())});
 pg.on('pageerror',e=>console.log('[err]',e.message));
 await pg.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load'});
 try{await pg.waitForFunction('window.__ready===true',{timeout:120000});console.log('READY');}catch(e){console.log('NOT READY');}
 fs.mkdirSync('out/stills',{recursive:true});
 for(const t of (TS.length?TS:[2])){
   await pg.evaluate(async(t)=>{await window.renderAt(t)},t);
   await pg.screenshot({path:`out/stills/p${t.toFixed(2)}.png`});
   console.log('shot',t);
 }
 await b.close();srv.close();process.exit(0);
});
