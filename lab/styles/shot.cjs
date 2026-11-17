// node lab/styles/shot.cjs <style...>   стили: pixar diorama 2d-vector (и пробные: clay toon lowpoly painterly comic 2d-paper 2d-watercolor)
//  [--w=540 --h=960]  → out/<style>.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'); // раздаём от корня проекта (нужен node_modules/three)
const OUT = path.join(__dirname, 'out');
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const styles = args.filter(a => !a.startsWith('--'));
const W = +(opt.w || 540), H = +(opt.h || 960);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
(async () => {
  const b = await chromium.launch({ args: styles[0].startsWith('2d-') ? ['--disable-gpu'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  fs.mkdirSync(OUT, { recursive: true });
  for (const s of styles) {
    const page = await b.newPage({ viewport: { width: W, height: H } });
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${s}]`, m.text().slice(0, 300)); });
    page.on('pageerror', e => console.log(`[${s}] ERR`, e.message));
    await page.route('http://local/**', r => {
      const p = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
      if (!fs.existsSync(p)) return r.fulfill({ status: 404 });
      r.fulfill({ body: fs.readFileSync(p), contentType: types[path.extname(p)] || 'application/octet-stream' });
    });
    const t = Date.now();
    const file = 'lab/styles/' + (s.startsWith('2d-') ? `flat.html?style=${s.slice(3)}` : `index.html?style=${s}${opt.actor ? '&actor=' + opt.actor : ''}`);
    await page.goto(`http://local/${file}&w=${W}&h=${H}`);
    await page.waitForFunction(() => window.__done === true, null, { timeout: 300000 });
    await page.screenshot({ path: path.join(OUT, `${s}.png`) });
    console.log(s, ((Date.now() - t) / 1000).toFixed(1) + 's');
    await page.close();
  }
  await b.close();
})();
