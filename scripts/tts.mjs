// Озвучка сценария: по одному mp3 на сцену + тайминги слов для субтитров.
// Провайдер: TTS_PROVIDER=elevenlabs (по умолчанию) | openai | none
//   none — без голоса, длительность по оценке (для черновиков и проверки визуала)
// --only=1,3 — озвучить только эти сцены (остальные: из кэша или оценка длительности)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {elevenCredits, flag, normalizeLoudness, reportSpent, paths, probeDuration, readJson, slugArg, validateScript, writeJson} from './lib.mjs';

// Голос приводим к −16 LUFS: тогда громкость шумов/музыки в сценарии — относительно голоса
const VOICE_LUFS = -16;

const slug = slugArg();
const P = paths(slug);
const script = readJson(P.script);
const provider = flag('provider', process.env.TTS_PROVIDER || script.tts?.provider || 'elevenlabs');

const {errors, warn} = validateScript(script);
warn.forEach((w) => console.warn('⚠️ ', w));
if (errors.length) {
	errors.forEach((e) => console.error('❌', e));
	process.exit(1);
}

const EL = {
	voiceId: process.env.ELEVENLABS_VOICE_ID || script.tts?.voiceId || 'JBFqnCBsd6RMkjVDRZzb',
	model: process.env.ELEVENLABS_MODEL || script.tts?.model || 'eleven_multilingual_v2',
	// Если ключ сохранён как секрет окружения, прокси подставит его сам
	key: process.env.ELEVENLABS_API_KEY || 'injected-by-proxy',
};
const OA = {
	voice: process.env.OPENAI_TTS_VOICE || script.tts?.voice || 'onyx',
	model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
	key: process.env.OPENAI_API_KEY || 'injected-by-proxy',
	instructions:
		script.tts?.instructions ||
		'Говори по-русски живо и увлекательно, как ведущий научно-популярного канала. Чёткая дикция, энергичный темп, интонация удивления на интересных фактах.',
};

const wordsFromAlignment = (al) => {
	const words = [];
	let cur = null;
	al.characters.forEach((ch, i) => {
		if (/\s/.test(ch)) {
			if (cur) words.push(cur);
			cur = null;
			return;
		}
		if (!cur) cur = {text: '', start: al.character_start_times_seconds[i], end: 0};
		cur.text += ch;
		cur.end = al.character_end_times_seconds[i];
	});
	if (cur) words.push(cur);
	return words;
};

const estimateWords = (text, duration) => {
	const tokens = text.trim().split(/\s+/);
	const w = tokens.map((t) => t.length + 2);
	const sum = w.reduce((a, b) => a + b, 0);
	let t = 0;
	return tokens.map((tok, i) => {
		const d = (w[i] / sum) * duration;
		const r = {text: tok, start: t, end: t + d};
		t += d;
		return r;
	});
};

const elevenlabs = async (text, prev, next) => {
	const res = await fetch(
		`https://api.elevenlabs.io/v1/text-to-speech/${EL.voiceId}/with-timestamps?output_format=mp3_44100_128`,
		{
			method: 'POST',
			headers: {'xi-api-key': EL.key, 'content-type': 'application/json'},
			body: JSON.stringify({
				text,
				model_id: EL.model,
				previous_text: prev || undefined,
				next_text: next || undefined,
				voice_settings: {stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, ...script.tts?.settings, speed: script.tts?.speed ?? 1.05},
			}),
		},
	);
	if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
	const data = await res.json();
	return {audio: Buffer.from(data.audio_base64, 'base64'), words: wordsFromAlignment(data.alignment)};
};

const openai = async (text) => {
	const res = await fetch('https://api.openai.com/v1/audio/speech', {
		method: 'POST',
		headers: {authorization: `Bearer ${OA.key}`, 'content-type': 'application/json'},
		body: JSON.stringify({model: OA.model, voice: OA.voice, input: text, instructions: OA.instructions, response_format: 'mp3'}),
	});
	if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
	return {audio: Buffer.from(await res.arrayBuffer()), words: null};
};

fs.mkdirSync(P.genDir, {recursive: true});
const creditsBefore = provider === 'elevenlabs' ? await elevenCredits() : null;
const old = fs.existsSync(P.manifest) ? readJson(P.manifest) : {scenes: []};
const voiceKey = provider === 'elevenlabs' ? `${EL.voiceId}/${EL.model}/${script.tts?.speed ?? 1.05}/${JSON.stringify(script.tts?.settings ?? {})}` : provider === 'openai' ? `${OA.voice}/${OA.model}` : 'none';
const out = {provider, scenes: []};
const only = new Set(String(flag('only', '')).split(',').filter(Boolean).map(Number));

for (const [i, sc] of script.scenes.entries()) {
	const hash = crypto.createHash('sha1').update(`${provider}|${voiceKey}|${sc.voice}`).digest('hex').slice(0, 10);
	const prevEntry = old.scenes[i];
	if (only.size && !only.has(i + 1)) {
		if (prevEntry) out.scenes.push(prevEntry);
		else {
			const duration = Math.max(1.6, sc.voice.split(/\s+/).length / 2.6 + 0.3);
			out.scenes.push({hash: 'skip', duration, words: estimateWords(sc.voice, duration)});
		}
		continue;
	}
	const file = `scene-${i + 1}-${hash}.mp3`;
	if (prevEntry?.hash === hash && (provider === 'none' || fs.existsSync(path.join(P.genDir, file)))) {
		if (provider !== 'none' && prevEntry.norm !== VOICE_LUFS) {
			normalizeLoudness(path.join(P.genDir, file), path.join(P.genDir, file), VOICE_LUFS);
			prevEntry.norm = VOICE_LUFS;
		}
		out.scenes.push(prevEntry);
		console.log(`✓ сцена ${i + 1}: из кэша`);
		continue;
	}
	if (provider === 'none') {
		const duration = Math.max(1.6, sc.voice.split(/\s+/).length / 2.6 + 0.3);
		out.scenes.push({hash, duration, words: estimateWords(sc.voice, duration)});
		continue;
	}
	process.stdout.write(`… сцена ${i + 1}: озвучка (${provider}) `);
	const r =
		provider === 'openai'
			? await openai(sc.voice)
			: await elevenlabs(sc.voice, script.scenes[i - 1]?.voice, script.scenes[i + 1]?.voice);
	const abs = path.join(P.genDir, file);
	fs.writeFileSync(abs, r.audio);
	normalizeLoudness(abs, abs, VOICE_LUFS);
	const duration = probeDuration(abs);
	out.scenes.push({hash, audio: `${P.genRel}/${file}`, duration, norm: VOICE_LUFS, words: r.words ?? estimateWords(sc.voice, duration)});
	console.log(`${duration.toFixed(1)} с`);
}

writeJson(P.manifest, out);
const total = out.scenes.reduce((a, s) => a + s.duration, 0);
console.log(`\nГотово: ${out.scenes.length} сцен, ~${total.toFixed(1)} с речи → ${path.relative(process.cwd(), P.manifest)}`);
if (creditsBefore) reportSpent(creditsBefore, await elevenCredits(), 'озвучка');
