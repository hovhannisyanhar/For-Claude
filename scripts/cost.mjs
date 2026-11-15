// Смета ElevenLabs до генерации: сколько кредитов уйдёт на озвучку, звуки и музыку.
//   npm run cost -- <slug>
// Озвучка: 1 кредит за символ (eleven_multilingual_v2 / eleven_v3), 0.5 — для flash/turbo.
// Звуки и музыка — оценка по ставкам ниже (уточняются по факту: tts/sound печатают реальный расход).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {elevenCredits, paths, readJson, slugArg} from './lib.mjs';

const SFX_PER_SEC = 20; // оценка, кредитов за секунду звука
const MUSIC_PER_MIN = 800; // оценка, кредитов за минуту музыки

const slug = slugArg();
const P = paths(slug);
const script = readJson(P.script);
const man = fs.existsSync(P.manifest) ? readJson(P.manifest) : {scenes: []};
const model = script.tts?.model || 'eleven_multilingual_v2';
const rate = /flash|turbo/.test(model) ? 0.5 : 1;
const voiceId = script.tts?.voiceId || 'default';
const voiceKey = `${voiceId}/${model}/${script.tts?.speed ?? 1.05}/${JSON.stringify(script.tts?.settings ?? {})}`;

let ttsChars = 0;
const todo = [];
script.scenes.forEach((sc, i) => {
	const hash = crypto.createHash('sha1').update(`elevenlabs|${voiceKey}|${sc.voice}`).digest('hex').slice(0, 10);
	const cached = man.scenes[i]?.hash === hash && fs.existsSync(path.join(P.genDir, `scene-${i + 1}-${hash}.mp3`));
	if (!cached) {
		ttsChars += sc.voice.length;
		todo.push(i + 1);
	}
});
const sh = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
let sfxSec = 0;
let sfxN = 0;
for (const sc of script.scenes)
	for (const fx of sc.sfx ?? []) {
		const dur = Math.min(22, Math.max(0.5, fx.duration ?? 5));
		if (!fs.existsSync(path.join(P.genDir, 'sfx', `${sh(`${fx.prompt}|${dur}`)}.mp3`))) {
			sfxSec += dur;
			sfxN++;
		}
	}
const words = script.scenes.reduce((a, s) => a + s.voice.split(/\s+/).length, 0);
const soundJson = path.join(P.genDir, 'sound.json');
const haveMusic = fs.existsSync(soundJson) && readJson(soundJson).music;
const musicMin = script.musicPrompt && !haveMusic ? (words / 2.3 + script.scenes.length) / 60 : 0;

const tts = Math.ceil(ttsChars * rate);
const sfx = Math.ceil(sfxSec * SFX_PER_SEC);
const music = Math.ceil(musicMin * MUSIC_PER_MIN);
console.log(`Смета ElevenLabs для «${slug}»`);
console.log(`  Озвучка (${model}): ${todo.length ? `сцены ${todo.join(', ')} — ${ttsChars} символов ≈ ${tts} кредитов` : 'всё в кэше — 0'}`);
console.log(`  Звуки: ${sfxN ? `${sfxN} шт., ${sfxSec} с ≈ ${sfx} кредитов (оценка)` : 'нет новых — 0'}`);
console.log(`  Музыка: ${musicMin ? `~${musicMin.toFixed(1)} мин ≈ ${music} кредитов (оценка)` : haveMusic ? 'уже есть — 0' : 'не нужна — 0'}`);
const bal = await elevenCredits();
console.log(bal ? `  Баланс: осталось ${bal.left} из ${bal.limit} (тариф ${bal.tier})` : '  Баланс: ключ не может читать подписку (нужно право user_read)');
