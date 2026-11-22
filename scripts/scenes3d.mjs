// 3D-сцены фильма (scenes3d/<slug>.js) или 2D-вектор (scenes2d/<slug>.js, если в сценарии "art": "vector") → видеоклипы public/generated/<slug>/clips/scene-N.mp4
// Длина клипа = длина сцены в ролике (озвучка + паузы + растворение), берётся из manifest.json.
//   npm run scenes3d -- <slug> [--only=1,3] [--w=1080 --h=1920] [--fps=30]
//   npm run scenes3d -- <slug> --stills [--at=0.5] [--w=540 --h=960]  → out/<slug>/scenes3d/scene-N.png (черновые кадры)
// В облаке WebGL идёт через SwiftShader (медленно); на Mac/с видеокартой — через GPU (SCENES3D_GPU=1 или автоматически на macOS).
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {ROOT, flag, paths, readJson, slugArg} from './lib.mjs';

const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
const slug = slugArg();
const P = paths(slug);
const script = readJson(P.script);
const man = readJson(P.manifest);
const W = +flag('w', flag('stills', false) ? 540 : 1080), H = +flag('h', flag('stills', false) ? 960 : 1920);
const FPS = +flag('fps', 30);
const stills = flag('stills', false);
const at = +flag('at', 0.55);
const only = String(flag('only', '')).split(',').filter(Boolean).map(Number);
// те же константы, что в src/cinema/CinemaVideo.tsx и src/timing.ts
const AUDIO_DELAY = 4, DISSOLVE = 24, TAIL = 10;
const flat = script.art === 'vector'; // 2D-вектор: scenes2d/<slug>.js (SVG), рендерится быстро без видеокарты
const gpu = process.env.SCENES3D_GPU === '1' || process.platform === 'darwin';
const args = flat ? ['--disable-gpu'] : gpu ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const types = {'.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg'};

const clipsDir = path.join(P.genDir, 'clips');
const stillsDir = path.join(P.outDir, flat ? 'scenes2d' : 'scenes3d');
fs.mkdirSync(stills ? stillsDir : clipsDir, {recursive: true});
const browser = await chromium.launch({args, headless: true});
for (const [i, sc] of script.scenes.entries()) {
	if (only.length && !only.includes(i + 1)) continue;
	if (sc.onPoster) continue; // идёт поверх постера, клип не нужен
	const dur = man.scenes[i]?.duration ?? 5;
	const frames = AUDIO_DELAY + Math.ceil(dur * FPS) + (sc.pause ?? TAIL) + DISSOLVE;
	const T = frames / FPS;
	const page = await browser.newPage({viewport: {width: W, height: H}});
	page.on('pageerror', (e) => console.log(`[${i + 1}] ERR`, e.message));
	page.on('console', (m) => m.type() === 'error' && console.log(`[${i + 1}]`, m.text().slice(0, 300)));
	await page.route('http://local/**', (r) => {
		const p = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
		if (!fs.existsSync(p)) return r.fulfill({status: 404});
		r.fulfill({body: fs.readFileSync(p), contentType: types[path.extname(p)] || 'application/octet-stream'});
	});
	const t0 = Date.now();
	await page.goto(`http://local/${flat ? 'scenes2d' : 'scenes3d'}/index.html?film=${slug}&shot=${sc.set}&dur=${T}&w=${W}&h=${H}&t=${stills ? T * at : 0}`);
	await page.waitForFunction(() => window.__done === true, null, {timeout: 600000});
	if (stills) {
		const f = path.join(stillsDir, `scene-${i + 1}.png`);
		await page.screenshot({path: f});
		console.log(`сцена ${i + 1} (${sc.set}): кадр ${(T * at).toFixed(1)} с → ${path.relative(ROOT, f)}  ${((Date.now() - t0) / 1000).toFixed(1)} с`);
	} else {
		const out = path.join(clipsDir, `scene-${i + 1}.mp4`);
		const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', out], {stdio: ['pipe', 'inherit', 'inherit']});
		for (let f = 0; f < frames; f++) {
			await page.evaluate((t) => window.renderAt(t), f / FPS);
			const buf = await page.screenshot({type: 'png'});
			if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
			if (f % 30 === 0) process.stdout.write(`\rсцена ${i + 1} (${sc.set}): ${f}/${frames} кадров, ${((Date.now() - t0) / 1000 / (f + 1)).toFixed(2)} с/кадр   `);
		}
		ff.stdin.end();
		await new Promise((r) => ff.on('close', r));
		console.log(`\rсцена ${i + 1} (${sc.set}): ${frames} кадров за ${((Date.now() - t0) / 1000).toFixed(0)} с → ${path.relative(ROOT, out)}          `);
	}
	await page.close();
}
await browser.close();
