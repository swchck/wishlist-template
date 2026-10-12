// Генерация OG-превью (картинка для ссылок в мессенджерах), 1200×630.
// Запуск:  npm i -D playwright && node scripts/gen-og.mjs
// Стиль — монохром сайта, шрифт Golos Text. Правь HTML ниже под себя.
import { chromium } from 'playwright';

const W = 1200;
const H = 630;

const html = `<!doctype html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px}
  .card{
    width:${W}px;height:${H}px;position:relative;overflow:hidden;
    background:#f5f5f2;color:#131312;
    font-family:'Golos Text',sans-serif;
    padding:76px 80px;display:flex;flex-direction:column;justify-content:space-between;
  }
  .brand{display:flex;align-items:center;gap:12px;font-weight:600;font-size:30px;color:#6f6f6b}
  .mark{width:26px;height:26px}
  h1{font-weight:600;font-size:92px;line-height:1.02;letter-spacing:-0.035em;max-width:15ch}
  h1 .accent{color:#131312}
  .sub{font-size:32px;color:#6f6f6b;font-weight:500}
  /* крупная марка-водяной знак */
  .watermark{position:absolute;right:-70px;bottom:-90px;width:420px;height:420px;opacity:.05}
</style></head>
<body>
  <div class="card">
    <div class="brand">
      <svg class="mark" viewBox="0 0 512 512"><g stroke="#131312" stroke-width="46" stroke-linecap="round"><line x1="256" y1="150" x2="256" y2="362"/><line x1="164" y1="203" x2="348" y2="309"/><line x1="164" y1="309" x2="348" y2="203"/></g></svg>
      <span>вишлист</span>
    </div>
    <h1>Что я хочу<br>получить в&nbsp;подарок</h1>
    <div class="sub">Список подарков — выбирай и бронируй</div>
    <svg class="watermark" viewBox="0 0 512 512"><g stroke="#131312" stroke-width="34" stroke-linecap="round"><line x1="256" y1="150" x2="256" y2="362"/><line x1="164" y1="203" x2="348" y2="309"/><line x1="164" y1="309" x2="348" y2="203"/></g></svg>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('wrote public/og.png', `${W}x${H}`);
