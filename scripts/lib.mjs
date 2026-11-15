import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export const slugArg = () => {
	const slug = process.argv.slice(2).find((a) => !a.startsWith('--'));
	if (!slug) {
		console.error('Укажите slug видео, например: npm run make -- octopus');
		process.exit(1);
	}
	return slug;
};

export const flag = (name, def) => {
	const a = process.argv.find((x) => x.startsWith(`--${name}=`));
	if (a) return a.split('=').slice(1).join('=');
	if (process.argv.includes(`--${name}`)) return true;
	return def;
};

export const paths = (slug) => ({
	script: path.join(ROOT, 'videos', slug, 'script.json'),
	genDir: path.join(ROOT, 'public', 'generated', slug),
	genRel: `generated/${slug}`,
	manifest: path.join(ROOT, 'public', 'generated', slug, 'manifest.json'),
	outDir: path.join(ROOT, 'out', slug),
});

export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
export const writeJson = (p, d) => {
	fs.mkdirSync(path.dirname(p), {recursive: true});
	fs.writeFileSync(p, JSON.stringify(d, null, 2));
};

export const probeDuration = (file) =>
	parseFloat(
		execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {
			encoding: 'utf8',
		}).trim(),
	);

/** Браузер для рендера: системный Chromium, если есть, иначе Remotion скачает свой */
export const browserArgs = () => {
	const candidates = [
		process.env.REMOTION_BROWSER,
		'/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
	].filter(Boolean);
	const found = candidates.find((p) => fs.existsSync(p));
	return found ? [`--browser-executable=${found}`] : [];
};

const SCENE_TYPES = ['hook', 'stat', 'fact', 'list', 'compare', 'outro'];

/** Проверка сценария до трат на озвучку */
export const validateScript = (s) => {
	const errors = [];
	const warn = [];
	if (!s.title) errors.push('нет title');
	if (!Array.isArray(s.scenes) || !s.scenes.length) errors.push('нет scenes');
	(s.scenes ?? []).forEach((sc, i) => {
		const n = `сцена ${i + 1} (${sc.type})`;
		if (!['chronicle', 'cinema'].includes(s.style) && !SCENE_TYPES.includes(sc.type)) errors.push(`${n}: неизвестный type`);
		for (const c of sc.clips ?? [])
			if (!fs.existsSync(path.join(ROOT, 'public', c.src))) errors.push(`${n}: нет файла public/${c.src}`);
		if (!sc.voice?.trim()) errors.push(`${n}: пустой voice`);
		if (sc.type === 'hook' && sc.text?.split(/\s+/).length > 7) warn.push(`${n}: хук длиннее 7 слов`);
		if (sc.type === 'stat' && (sc.value + (sc.suffix ?? '')).length > 9)
			warn.push(`${n}: длинное число — лучше "500" + suffix " млн"`);
		if (sc.type === 'list' && sc.items?.length > 4) warn.push(`${n}: больше 4 пунктов не влезет красиво`);
		if (/\d/.test(sc.voice ?? '')) warn.push(`${n}: цифры в voice — лучше прописью, чтобы голос правильно склонял`);
	});
	if (!['chronicle', 'cinema'].includes(s.style) && s.scenes?.[0]?.type !== 'hook') warn.push('первая сцена не hook — первые 2 секунды решают всё');
	const words = (s.scenes ?? []).reduce((a, sc) => a + (sc.voice ?? '').split(/\s+/).length, 0);
	const est = words / 2.6;
	const maxSec = s.style === 'chronicle' ? 65 : s.style === 'cinema' ? 70 : 50;
	if (est > maxSec) warn.push(`оценка длительности ${est.toFixed(0)} с — для Reels/TikTok лучше до ${maxSec} с`);
	if (!s.sources?.length) warn.push('нет sources — факты должны быть проверены');
	return {errors, warn, estSeconds: est};
};

/**
 * Приводит файл к целевой громкости (LUFS): усиление + лимитер.
 * maxGain — не поднимать почти тишину сильнее, чем на столько дБ.
 */
export const normalizeLoudness = (src, dst, target, maxGain = 18) => {
	const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', src, '-af', 'ebur128', '-f', 'null', '-'], {encoding: 'utf8'});
	const m = [...(r.stderr ?? '').matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
	const cur = m ? parseFloat(m[1]) : target;
	const gain = Math.max(-30, Math.min(maxGain, target - (Number.isFinite(cur) ? cur : target)));
	const tmp = dst + '.tmp.mp3';
	execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=0.95:level=false`, '-ar', '44100', '-b:a', '160k', tmp]);
	fs.renameSync(tmp, dst);
	return {from: cur, gain};
};
