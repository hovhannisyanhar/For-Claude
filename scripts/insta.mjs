// Обложка Reels для Instagram из поля instaCover сценария → out/<slug>/cover-insta.jpg
//   npm run insta -- <slug>
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, browserArgs, paths, readJson, slugArg, writeJson} from './lib.mjs';

const slug = slugArg();
const P = paths(slug);
const script = readJson(P.script);
if (!script.instaCover) {
	console.error('В сценарии нет instaCover: {"top": "...", "main": "...", "base": [...], "glows": [...]}');
	process.exit(1);
}
fs.mkdirSync(P.outDir, {recursive: true});
const propsFile = path.join(P.outDir, 'insta-props.json');
writeJson(propsFile, script.instaCover);
const out = path.join(P.outDir, 'cover-insta.jpg');
execFileSync(path.join(ROOT, 'node_modules', '.bin', 'remotion'), ['still', 'src/index.ts', 'InstaCover', out, `--props=${propsFile}`, '--log=error', '--jpeg-quality=95', ...browserArgs()], {cwd: ROOT, stdio: 'inherit'});
fs.rmSync(propsFile);
console.log(`✅ ${path.relative(ROOT, out)}`);
