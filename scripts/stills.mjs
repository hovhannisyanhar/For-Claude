// Проверочные кадры одной сборкой: npm run stills -- <slug> 120 300 450 [--scale=0.5]
// Нужен out/<slug>/props.json (его пишет npm run render, или --frames=0-0)
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {ROOT, browserArgs, flag, paths, readJson, slugArg} from './lib.mjs';

const slug = slugArg();
const P = paths(slug);
const frames = process.argv.slice(3).filter((a) => /^\d+$/.test(a)).map(Number);
const scale = Number(flag('scale', 0.5));
const script = readJson(P.script);
const id = script.style === 'chronicle' ? 'ChronicleVideo' : script.style === 'cinema' ? 'CinemaVideo' : 'FactVideo';
const inputProps = readJson(path.join(P.outDir, 'props.json'));
const browserExecutable = browserArgs()[0]?.split('=')[1] ?? null;
const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src/index.ts'), publicDir: path.join(ROOT, 'public')});
const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable});
const dir = path.join(P.outDir, 'stills');
fs.mkdirSync(dir, {recursive: true});
for (const frame of frames) {
	const output = path.join(dir, `f-${frame}.jpg`);
	await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', inputProps, browserExecutable, scale, timeoutInMilliseconds: 60000});
	console.log('✓', path.relative(ROOT, output));
}
