// Атмосферный фон без лицензий: синтез в ffmpeg (ветер + тёплый аккорд + далёкий гудок).
//   npm run ambient -- <slug>   → public/generated/<slug>/ambient.mp3 (длина = длина ролика)
import path from 'node:path';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {paths, readJson, slugArg, flag} from './lib.mjs';

const slug = slugArg();
const P = paths(slug);
const script = readJson(P.script);
const man = fs.existsSync(P.manifest) ? readJson(P.manifest) : null;
const est = (v) => Math.max(1.6, v.split(/\s+/).length / 2.6 + 0.3);
const frames = script.scenes.reduce((a, sc, i) => {
	const d = man?.scenes[i]?.duration ?? est(sc.voice);
	return a + 4 + Math.ceil(d * 30) + (sc.pause ?? 14) + (i === script.scenes.length - 1 ? 75 : 0);
}, 0);
const dur = Number(flag('dur', (frames / 30 + 1).toFixed(2)));
const out = path.join(P.genDir, 'ambient.mp3');
fs.mkdirSync(P.genDir, {recursive: true});

// Аккорд ля-минор с медленными биениями и «дыханием» громкости
const notes = [110, 164.81, 220, 261.63, 329.63];
const pad = notes
	.map((f, i) => `${(0.16 / (1 + i * 0.35)).toFixed(3)}*sin(2*PI*${f}*t)*(0.6+0.4*sin(2*PI*t/${(9 + i * 2.3).toFixed(1)}+${i}))` +
		`+${(0.08 / (1 + i * 0.35)).toFixed(3)}*sin(2*PI*${(f * 1.004).toFixed(3)}*t)`)
	.join('+');
// Гудок паровоза: аккорд из трёх тонов с огибающей, дважды (в начале и в конце)
const whistle = (t0, len) => {
	const env = `between(t,${t0},${t0 + len})*sin(PI*(t-${t0})/${len})^0.6`;
	return [311.1, 370, 466.2].map((f) => `0.12*${env}*sin(2*PI*${f}*t+0.3*sin(2*PI*5*t))`).join('+');
};
const whistles = `${whistle(0.8, 2.4)}+${whistle(+(dur - 7.5).toFixed(2), 3.2)}`;

const filter = [
	`anoisesrc=d=${dur}:c=brown:a=0.5:seed=7,lowpass=f=520,highpass=f=60,tremolo=f=0.1:d=0.5,volume=0.55[wind]`,
	`aevalsrc='${pad}':d=${dur}:s=44100,lowpass=f=1400,aecho=0.8:0.85:120|260:0.35|0.25,volume=0.8[pad]`,
	`aevalsrc='${whistles}':d=${dur}:s=44100,lowpass=f=1800,aecho=0.8:0.9:400|900:0.4|0.25,volume=0.55[wh]`,
	`[wind][pad][wh]amix=inputs=3:normalize=0,afade=t=in:d=2,afade=t=out:st=${(dur - 3).toFixed(2)}:d=3,alimiter=limit=0.9[out]`,
].join(';');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-filter_complex', filter, '-map', '[out]', '-ac', '2', '-ar', '44100', '-b:a', '160k', out], {stdio: 'inherit'});
console.log(`🎧 ${path.relative(process.cwd(), out)} (${dur} с)`);
