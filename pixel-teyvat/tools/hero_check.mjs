// Dumps one frame's indexed buffer + the sprite source grid, in the SAME page, so a cache or import
// mismatch cannot fake a pass.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const f = Number(process.argv[2] || 140);
const out = process.argv[3] || '/tmp/hero_dump.json';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--use-angle=metal', '--no-sandbox', '--hide-scrollbars'],
  defaultViewport: { width: 1920, height: 1080 } });
const page = await browser.newPage();
const cdp = await page.createCDPSession();
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await page.goto('http://127.0.0.1:8791/index.html', { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__ready === true');
const data = await page.evaluate(async (f) => {
  const m = await import('/js/paimon_art.js');
  const ib = window.__frame(f);
  return { f, w: 320, h: 180, ib: Array.from(ib), poses: m.POSES };
}, f);
fs.writeFileSync(out, JSON.stringify(data));
console.log('wrote', out, 'frame', f);
await browser.close();
