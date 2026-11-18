// Создаёт папку нового видео из шаблона.  npm run new -- <slug> [--cinema]
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
const cinema = process.argv.includes('--cinema');
fs.copyFileSync(path.join(ROOT, 'templates', cinema ? 'cinema.example.json' : 'script.example.json'), P.script);
console.log('Создан ' + path.relative(ROOT, P.script));
if (cinema) {
	const progress = path.join(path.dirname(P.script), 'progress.md');
	fs.writeFileSync(progress, `# ${slug}: этапы (регламент «Кино» в CLAUDE.md)

- [ ] 1. Факты (2 источника на факт → sources)
- [ ] 2. Текст рассказа утверждён
- [ ] 3. Раскадровка утверждена · стиль рисовки: … · шрифты: … · фраза обложки: … · постер получен
- [ ] 4. Смета озвучки подтверждена
- [ ] 5. Озвучка готова, голос одобрен (потрачено: …)
- [ ] 6. Черновые кадры сцен и обложки одобрены
- [ ] 7. Финальный рендер одобрен
- [ ] 8. Публикация: posts.md, ${slug}-tiktok-youtube.mp4, бэклог ✅
`);
	console.log('Создан ' + path.relative(ROOT, progress));
}
