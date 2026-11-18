// node lab/styles/shogun-shot.cjs <style:shot ...> [--w=540 --h=960]  → out/shogun-<style>-<shot>.png
//   стили: pixar diorama (3D, shogun.js) · vector (2D, covenant2d.html); планы: base cart
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), OUT = path.join(__dirname, 'out');
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const jobs = args.filter(a => !a.startsWith('--'));
const W = +(opt.w || 540), H = +(opt.h || 960);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2' };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const j of jobs) {
    const [style, shot] = j.split(':');
    const flat = style === 'vector';
    const b = await chromium.launch({ args: flat ? ['--disable-gpu'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
    const page = await b.newPage({ viewport: { width: W, height: H } });
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log(`[${j}]`, m.text().slice(0, 300)); });
    page.on('pageerror', e => console.log(`[${j}] ERR`, e.message));
    await page.route('http://local/**', r => {
      const p = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
      if (!fs.existsSync(p)) return r.fulfill({ status: 404 });
      r.fulfill({ body: fs.readFileSync(p), contentType: types[path.extname(p)] || 'application/octet-stream' });
    });
    const t = Date.now();
    await page.goto(`http://local/lab/styles/${flat ? 'covenant2d.html' : 'covenant.html'}?style=${style}&shot=${shot}&w=${W}&h=${H}`);
    await page.waitForFunction(() => window.__done === true, null, { timeout: 600000 });
    await page.screenshot({ path: path.join(OUT, `covenant-${style}-${shot}.png`) });
    console.log(j, ((Date.now() - t) / 1000).toFixed(1) + 's');
    await b.close();
  }
})();
