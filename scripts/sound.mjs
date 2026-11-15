// Звук для стиля «Кино»: шумы по сценам (ElevenLabs Sound Effects) + музыка (ElevenLabs Music).
//   npm run sound -- <slug> [--no-music]
// В сценарии: scenes[].sfx = [{prompt, at, duration, volume, repeat?: {every, count}}], musicPrompt.
// Файлы кэшируются по хэшу промпта → public/generated/<slug>/sfx/. Итог → sound.json (его читает render).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {elevenCredits, flag, normalizeLoudness, reportSpent, paths, probeDuration, readJson, slugArg, writeJson} from './lib.mjs';

// Шумы и музыка приводятся к −20 LUFS (голос −16), volume в сценарии — множитель к этому уровню
const BED_LUFS = -20;

const slug = slugArg();
const P = paths(slug);
const script = readJson(P.script);
const man = readJson(P.manifest);
const KEY = process.env.ELEVENLABS_API_KEY || 'injected-by-proxy';
const dir = path.join(P.genDir, 'sfx');
fs.mkdirSync(dir, {recursive: true});
const creditsBefore = await elevenCredits();

const FPS = 30;
const tail = (sc, last) => 4 + Math.ceil(man.scenes[script.scenes.indexOf(sc)].duration * FPS) + (sc.pause ?? 10) + (last ? (script.poster ? 135 : 90) : 0);
const totalSec = script.scenes.reduce((a, sc, i) => a + tail(sc, i === script.scenes.length - 1), 0) / FPS;

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const post = async (url, body) => {
	for (let a = 0; a < 3; a++) {
		const r = await fetch(url, {method: 'POST', headers: {'xi-api-key': KEY, 'content-type': 'application/json'}, body: JSON.stringify(body)});
		if (r.ok) return Buffer.from(await r.arrayBuffer());
		const t = await r.text();
		if (r.status < 500 && r.status !== 429) throw new Error(`${r.status}: ${t.slice(0, 300)}`);
		await new Promise((ok) => setTimeout(ok, 3000 * (a + 1)));
	}
	throw new Error('ElevenLabs недоступен');
};

const prevSound = fs.existsSync(path.join(P.genDir, 'sound.json')) ? readJson(path.join(P.genDir, 'sound.json')) : null;
// --no-music: оставить уже сгенерированную музыку (не тратить кредиты при правке таймингов)
const out = {scenes: [], music: flag('no-music', false) ? (prevSound?.music ?? null) : null};
for (const [i, sc] of script.scenes.entries()) {
	const list = [];
	for (const fx of sc.sfx ?? []) {
		const dur = Math.min(22, Math.max(0.5, fx.duration ?? 5));
		const file = `${hash(`${fx.prompt}|${dur}`)}.mp3`;
		const abs = path.join(dir, file);
		if (!fs.existsSync(abs)) {
			process.stdout.write(`… сцена ${i + 1}: «${fx.prompt.slice(0, 50)}…» `);
			fs.writeFileSync(abs, await post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {text: fx.prompt, duration_seconds: dur, prompt_influence: 0.5}));
			console.log('✓');
		}
		const normFile = file.replace(/\.mp3$/, `.n${-BED_LUFS}.mp3`);
		const normAbs = path.join(dir, normFile);
		if (!fs.existsSync(normAbs)) normalizeLoudness(abs, normAbs, BED_LUFS, 12);
		const len = probeDuration(normAbs);
		const times = fx.repeat ? Array.from({length: fx.repeat.count}, (_, k) => (fx.at ?? 0) + k * fx.repeat.every) : [fx.at ?? 0];
		for (const at of times) list.push({src: `${P.genRel}/sfx/${normFile}`, at, duration: len, volume: fx.volume ?? 0.4});
	}
	out.scenes.push(list);
}

if (script.musicPrompt && !flag('no-music', false)) {
	const ms = Math.round((totalSec + 1) * 1000);
	const file = `music-${hash(`${script.musicPrompt}|${ms}`)}.mp3`;
	const abs = path.join(P.genDir, file);
	if (!fs.existsSync(abs)) {
		process.stdout.write(`… музыка ${(ms / 1000).toFixed(1)} с `);
		fs.writeFileSync(abs, await post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {prompt: script.musicPrompt, music_length_ms: ms}));
		console.log('✓');
	}
	const normFile = file.replace(/\.mp3$/, `.n${-BED_LUFS}.mp3`);
	if (!fs.existsSync(path.join(P.genDir, normFile))) normalizeLoudness(abs, path.join(P.genDir, normFile), BED_LUFS, 12);
	out.music = `${P.genRel}/${normFile}`;
}
writeJson(path.join(P.genDir, 'sound.json'), out);
console.log(`🎧 ${out.scenes.flat().length} звуков${out.music ? ' + музыка' : ''}, ролик ~${totalSec.toFixed(1)} с`);
reportSpent(creditsBefore, await elevenCredits(), 'звуки и музыка');
