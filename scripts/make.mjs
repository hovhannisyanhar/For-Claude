// Полный цикл: проверка сценария → озвучка → рендер.  npm run make -- <slug> [--provider=none]
import {execFileSync} from 'node:child_process';
import {ROOT} from './lib.mjs';

const args = process.argv.slice(2);
const run = (file, extra = []) =>
	execFileSync(process.execPath, [`scripts/${file}`, ...args, ...extra], {cwd: ROOT, stdio: 'inherit'});
run('tts.mjs');
run('render.mjs');
