import type {Scene, Word} from './types';

export const FPS = 30;
/** Пауза перед началом голоса в сцене (кадры) */
export const AUDIO_DELAY = 4;
/** Хвост после голоса (кадры) */
export const TAIL = 8;
export const LAST_TAIL = 36;

/** Оценка длительности речи, если TTS ещё не делали: ~2.6 слова/сек */
export const estimateDuration = (text: string) => {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1.6, words / 2.6 + 0.3);
};

export const sceneFrames = (scene: Scene, isLast: boolean) => {
	const dur = scene.duration ?? estimateDuration(scene.voice);
	return AUDIO_DELAY + Math.ceil(dur * FPS) + (isLast ? LAST_TAIL : TAIL);
};

export const totalFrames = (scenes: Scene[]) =>
	scenes.reduce((acc, s, i) => acc + sceneFrames(s, i === scenes.length - 1), 0);

/** Равномерная разметка слов по длине, если нет точных таймингов */
export const estimateWords = (text: string, duration: number): Word[] => {
	const tokens = text.trim().split(/\s+/).filter(Boolean);
	const weights = tokens.map((t) => t.length + 2);
	const sum = weights.reduce((a, b) => a + b, 0);
	let t = 0;
	return tokens.map((tok, i) => {
		const d = (weights[i] / sum) * duration;
		const w = {text: tok, start: t, end: t + d};
		t += d;
		return w;
	});
};

export type Chunk = {words: Word[]; start: number; end: number};

/** Группирует слова в короткие фразы для субтитров (до 3 слов / ~20 символов) */
export const chunkWords = (words: Word[]): Chunk[] => {
	const chunks: Chunk[] = [];
	let cur: Word[] = [];
	const flush = () => {
		if (!cur.length) return;
		chunks.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
		cur = [];
	};
	for (const w of words) {
		const len = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length;
		if (cur.length >= 3 || (cur.length > 0 && len > 16)) flush();
		cur.push(w);
		if (/[.,!?;:—…]$/.test(w.text)) flush();
	}
	flush();
	return chunks;
};
