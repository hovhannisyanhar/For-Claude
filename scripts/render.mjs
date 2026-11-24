// Рендер готового видео + обложки + текста поста.
//   npm run render -- <slug> [--preview] [--frames=0-90]
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, browserArgs, flag, paths, readJson, slugArg, writeJson} from './lib.mjs';

const slug = slugArg();
const P = paths(slug);
const script = readJson(P.script);
if (!fs.existsSync(P.manifest)) {
	console.error('Нет озвучки. Сначала: npm run tts -- ' + slug + '  (или --provider=none для черновика)');
	process.exit(1);
}
const manifest = readJson(P.manifest);

const chronicle = script.style === 'chronicle';
const composition = chronicle ? 'ChronicleVideo' : script.style === 'cinema' ? 'CinemaVideo' : 'FactVideo';
const soundFile = path.join(P.genDir, 'sound.json');
const sound = fs.existsSync(soundFile) ? readJson(soundFile) : null;
const props = {
	title: script.title,
	style: script.style,
	accent: script.accent,
	handle: script.handle,
	poster: script.poster ?? null,
	fonts: script.fonts,
	textStyle: script.textStyle,
	brand: script.brand,
	film: script.film,
	grain: script.grain,
	theme: script.theme || 'midnight',
	music: script.musicSeparate ? null : (sound?.music ?? script.music ?? null),
	musicVolume: script.musicVolume,
	scenes: script.scenes.map((sc, i) => {
		// 3D-сцены: клип из npm run scenes3d, если он отрендерен
		const clip = path.join(P.genDir, 'clips', `scene-${i + 1}.mp4`);
		return {...sc, ...manifest.scenes[i], ...(sound ? {sfx: sound.scenes[i]} : {}), ...(fs.existsSync(clip) ? {clip: `${P.genRel}/clips/scene-${i + 1}.mp4`} : {})};
	}),
};
fs.mkdirSync(P.outDir, {recursive: true});
const propsFile = path.join(P.outDir, 'props.json');
writeJson(propsFile, props);

const preview = flag('preview', false);
const frames = flag('frames', undefined);
const remotion = path.join(ROOT, 'node_modules', '.bin', 'remotion');
const common = ['src/index.ts', composition, `--props=${propsFile}`, '--log=error', ...browserArgs()];

const videoOut = path.join(P.outDir, preview ? 'preview.mp4' : `${slug}.mp4`);
console.log(`🎬 Рендер ${path.relative(ROOT, videoOut)} …`);
execFileSync(
	remotion,
	[
		'render',
		...common,
		videoOut,
		...(preview ? ['--scale=0.5', '--crf=28'] : []),
		...(frames ? [`--frames=${frames}`] : []),
		'--concurrency=75%',
	],
	{cwd: ROOT, stdio: 'inherit'},
);

if (!preview) {
	// Громкость под соцсети: −14 LUFS, видео не перекодируется
	const tmp = videoOut.replace(/\.mp4$/, '.norm.mp4');
	execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', videoOut, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', tmp]);
	fs.renameSync(tmp, videoOut);
	// Музыка отдельным файлом (для монтажа в редакторе)
	if (script.musicSeparate && sound?.music) {
		const raw = path.join(ROOT, 'public', sound.music.replace(/\.n\d+\.mp3$/, '.mp3'));
		fs.copyFileSync(fs.existsSync(raw) ? raw : path.join(ROOT, 'public', sound.music), path.join(P.outDir, 'music.mp3'));
	}
	// Обложка: кадр хука после появления текста, без субтитров
	// В «Кино» со script.cover — шрифтовая обложка на градиенте (композиция CinemaCover)
	// Единый шаблон обложки для всех роликов (текст на одной высоте) — script.instaCover → InstaCover
	const instaCover = script.instaCover;
	const fontCover = !instaCover && script.style === 'cinema' && script.cover;
	const coverProps = path.join(P.outDir, 'cover-props.json');
	writeJson(coverProps, instaCover ?? (fontCover ? script.cover : {...props, showCaptions: false}));
	execFileSync(
		remotion,
		['still', 'src/index.ts', instaCover ? 'InstaCover' : fontCover ? 'CinemaCover' : composition, `--props=${coverProps}`, '--log=error', ...browserArgs(), path.join(P.outDir, 'cover.jpg'), `--frame=${instaCover || fontCover ? 0 : script.coverFrame ?? 28}`, '--jpeg-quality=95'],
		{cwd: ROOT, stdio: 'inherit'},
	);
	fs.rmSync(coverProps);

	const post = [script.caption ?? script.title, '', (script.hashtags ?? []).join(' ')].join('\n').trim();
	fs.writeFileSync(path.join(P.outDir, 'post.txt'), post + '\n');
	if (script.sources?.length)
		fs.writeFileSync(path.join(P.outDir, 'sources.txt'), script.sources.join('\n') + '\n');
	// Лицензии изображений (CC BY / CC BY-SA требуют указать автора)
	const creditsFile = path.join(ROOT, 'public', 'assets', slug, 'credits.json');
	if (fs.existsSync(creditsFile)) {
		const used = new Set([...script.scenes.flatMap((s) => (s.clips ?? []).map((c) => path.basename(c.src))), ...(script.credits ?? [])]);
		const credits = readJson(creditsFile);
		const lines = Object.entries(credits)
			.filter(([f]) => [...used].some((u) => u.startsWith(f.replace(/\.[^.]+$/, ''))))
			.map(([, c]) => `${c.title.replace(/^File:/, '')} — ${c.artist || 'автор неизвестен'}, ${c.license}, ${c.page}`);
		fs.writeFileSync(path.join(P.outDir, 'credits.txt'), lines.join('\n') + '\n');
		const needAttr = Object.values(credits).some((c) => /CC BY/i.test(c.license));
		if (needAttr) console.log('ℹ️  Есть изображения CC BY/CC BY-SA — добавьте credits.txt в описание или первый комментарий');
	}
}
console.log(`\n✅ Готово: ${path.relative(ROOT, P.outDir)}/`);
for (const f of fs.readdirSync(P.outDir)) console.log('   ', f);
