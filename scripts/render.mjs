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

const props = {
	title: script.title,
	theme: script.theme || 'midnight',
	music: script.music,
	musicVolume: script.musicVolume,
	scenes: script.scenes.map((sc, i) => ({...sc, ...manifest.scenes[i]})),
};
fs.mkdirSync(P.outDir, {recursive: true});
const propsFile = path.join(P.outDir, 'props.json');
writeJson(propsFile, props);

const preview = flag('preview', false);
const frames = flag('frames', undefined);
const remotion = path.join(ROOT, 'node_modules', '.bin', 'remotion');
const common = ['src/index.ts', 'FactVideo', `--props=${propsFile}`, '--log=error', ...browserArgs()];

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
	// Обложка: кадр хука после появления текста, без субтитров
	const coverProps = path.join(P.outDir, 'cover-props.json');
	writeJson(coverProps, {...props, showCaptions: false});
	execFileSync(
		remotion,
		['still', 'src/index.ts', 'FactVideo', `--props=${coverProps}`, '--log=error', ...browserArgs(), path.join(P.outDir, 'cover.jpg'), '--frame=28'],
		{cwd: ROOT, stdio: 'inherit'},
	);
	fs.rmSync(coverProps);

	const post = [script.caption ?? script.title, '', (script.hashtags ?? []).join(' ')].join('\n').trim();
	fs.writeFileSync(path.join(P.outDir, 'post.txt'), post + '\n');
	if (script.sources?.length)
		fs.writeFileSync(path.join(P.outDir, 'sources.txt'), script.sources.join('\n') + '\n');
}
console.log(`\n✅ Готово: ${path.relative(ROOT, P.outDir)}/`);
for (const f of fs.readdirSync(P.outDir)) console.log('   ', f);
