// ACTOR=/path/model.glb node lab/styles/frames.cjs <style> <fps> <w> <h> <out.mp4> [maxSeconds]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'); const { spawn } = require('child_process');
const [style, fps, W, H, out, maxS] = process.argv.slice(2); const ROOT = path.join(__dirname, '..', '..');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.png': 'image/png' };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await b.newPage({ viewport: { width: +W, height: +H } });
  page.on('console', m => console.log('[page]', m.text().slice(0, 200))); page.on('pageerror', e => console.log('ERR', e.message));
  await page.route('http://local/**', r => { const p = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!fs.existsSync(p)) return r.fulfill({ status: 404 }); r.fulfill({ body: fs.readFileSync(p), contentType: types[path.extname(p)] || 'application/octet-stream' }); });
  await page.goto(`http://local/lab/styles/index.html?style=${style}&actor=${process.env.ACTOR || ''}&w=${W}&h=${H}`);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 300000 });
  const total = Math.min(await page.evaluate(() => window.TOTAL), +(maxS || 99)); const n = Math.round(total * fps);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', fps, '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.renderAt(t), i / fps);
    ff.stdin.write(await page.screenshot({ type: 'png' }));
    if (i % 24 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000 / (i + 1)).toFixed(2)} s/frame`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('done', n, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's'); await b.close();
})();
