// Ужать озвучку без перегенерации в ElevenLabs: обрезать тишину после последнего слова
// и ускорить речь (ffmpeg atempo, тон не меняется). Тайминги слов пересчитываются.
//   npm run tighten -- <slug> [--tempo=1.1]   (по умолчанию script.tts.tempo или 1.0)
// После повторного npm run tts запускать снова.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, flag, paths, probeDuration, readJson, slugArg, writeJson} from './lib.mjs';

const slug = slugArg();
const P = paths(slug);
const script = readJson(P.script);
const man = readJson(P.manifest);
const tempo = Number(flag('tempo', script.tts?.tempo ?? 1));
const TAIL = 0.12; // запас после последнего слова, с
for (const [i, sc] of man.scenes.entries()) {
	if (!sc.audio) continue;
	const raw = sc.rawAudio ?? sc.audio;
	const rawWords = sc.rawWords ?? sc.words;
	const end = Math.min(probeDuration(path.join(ROOT, 'public', raw)), rawWords.at(-1).end + TAIL);
	const out = raw.replace(/\.mp3$/, `.t${Math.round(tempo * 100)}.mp3`);
	execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(ROOT, 'public', raw), '-t', String(end), '-af', `atempo=${tempo}`, '-c:a', 'libmp3lame', '-q:a', '2', path.join(ROOT, 'public', out)]);
	Object.assign(sc, {
		rawAudio: raw,
		rawWords,
		audio: out,
		tempo,
		duration: probeDuration(path.join(ROOT, 'public', out)),
		words: rawWords.map((w) => ({...w, start: w.start / tempo, end: w.end / tempo})),
	});
	console.log(`сцена ${i + 1}: ${sc.duration.toFixed(2)} с`);
}
writeJson(P.manifest, man);
console.log(`Итого речи: ${man.scenes.reduce((a, s) => a + s.duration, 0).toFixed(1)} с (темп ×${tempo})`);
