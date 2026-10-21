import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--use-angle=metal','--no-sandbox','--hide-scrollbars'],
  defaultViewport: { width: 1920, height: 1080 } });
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
await page.goto('http://127.0.0.1:8791/index.html?v=' + Date.now(), { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__ready === true', { timeout: 60000 });
const out = await page.evaluate(() => {
  const f = Number(new URLSearchParams(location.search).get('f') || 15);
  const ib = window.__frame(f);
  return { w: 320, h: 180, data: Array.from(ib) };
});
console.log(JSON.stringify(out));
await browser.close();
