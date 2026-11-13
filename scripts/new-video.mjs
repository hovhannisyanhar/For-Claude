// Создаёт папку нового видео из шаблона.  npm run new -- <slug>
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, paths, slugArg} from './lib.mjs';

const slug = slugArg();
if (!/^[a-z0-9-]+$/.test(slug)) {
	console.error('slug — латиница, цифры и дефисы, напр. "octopus-hearts"');
	process.exit(1);
}
const P = paths(slug);
if (fs.existsSync(P.script)) {
	console.error('Уже существует: ' + path.relative(ROOT, P.script));
	process.exit(1);
}
fs.mkdirSync(path.dirname(P.script), {recursive: true});
fs.copyFileSync(path.join(ROOT, 'templates', 'script.example.json'), P.script);
console.log('Создан ' + path.relative(ROOT, P.script));
