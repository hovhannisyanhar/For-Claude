// Кинетическая типографика стиля «Кино».
// Три шрифта: рукописный (ключевые слова), антиква с засечками (основной текст), узкие капители (служебные слова).
// Каждая фраза озвучки — отдельная «вёрстка»: своё выравнивание, высота, характер появления и ухода.
import React, {useMemo} from 'react';
import {Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {AUDIO_DELAY} from '../timing';
import type {Word} from '../types';

export const F_SCRIPT = 'Great Vibes';
export const F_SERIF = 'Cormorant Garamond';
export const F_CAPS = 'Oswald';

/** Шрифтовая тройка ролика: рукописный (ключевые слова), основной, капители (служебные) */
export type KineticFonts = {script: string; serif: string; caps: string; serifWeight?: number; italic?: boolean; capsWeight?: number};
export const FONT_PRESETS = {
	classic: {script: 'Great Vibes', serif: 'Cormorant Garamond', caps: 'Oswald'},
	noir: {script: 'Marck Script', serif: 'Playfair Display', caps: 'Tenor Sans', serifWeight: 700, italic: false, capsWeight: 400},
	modern: {script: 'Great Vibes', serif: 'Jost', caps: 'Tenor Sans', serifWeight: 400, italic: false, capsWeight: 400},
	display: {script: 'Marck Script', serif: 'Yeseva One', caps: 'Jost', serifWeight: 400, italic: false, capsWeight: 400},
	hand: {script: 'Caveat', serif: 'Cormorant Garamond', caps: 'Tenor Sans', capsWeight: 400},
	futura: {script: 'Great Vibes', serif: 'Jost', caps: 'Jost', serifWeight: 700, italic: false, capsWeight: 400},
} satisfies Record<string, KineticFonts>;
export type FontPreset = keyof typeof FONT_PRESETS;
/** Текущая тройка (на весь рендер одна — задаётся из пропсов CinemaVideo) */
export const FONT: KineticFonts = {...FONT_PRESETS.classic};
export const setKineticFonts = (f?: FontPreset | KineticFonts) => {
	const next = typeof f === 'string' ? FONT_PRESETS[f] ?? FONT_PRESETS.classic : f ?? FONT_PRESETS.classic;
	for (const k of Object.keys(FONT) as Array<keyof KineticFonts>) delete FONT[k];
	Object.assign(FONT, next);
};
const CREAM = '#f3ead8';
const SIDE_L = 80;
const SIDE_R = 150;
const MAX_W = 1080 - SIDE_L - SIDE_R;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const SIZE = {script: 160, serif: 92, caps: 40};
export const STOP = new Set(['и', 'в', 'на', 'по', 'а', 'но', 'ни', 'не', 'он', 'его', 'ему', 'это', 'так', 'там', 'тут', 'чем', 'что', 'как', 'же', 'из', 'за', 'до', 'у', 'к', 'с', 'о', 'от', 'при', 'эту', 'то', 'их', 'есть', 'было', 'одной', 'почти', 'только', 'которым', 'которая', 'которую', 'после', 'просто', 'потом', 'здесь', 'этого', 'каждый', 'вокруг']);

export const norm = (w: string) => w.toLowerCase().replace(/\u0301/g, '').replace(/[«»"“”.,!?;:—…]/g, '');
const clean = (w: string) => w.replace(/\u0301/g, '').replace(/[.,;:!?…]+$/g, '').replace(/^—$/, '');

type Kind = 'script' | 'serif' | 'caps';
export type Phrase = {words: Word[]; start: number; end: number; breaks?: number[]};

/** Слова озвучки → фразы: по знакам препинания, до 5 слов / ~28 символов */
export const toPhrases = (words: Word[]): Phrase[] => {
	const out: Phrase[] = [];
	let cur: Word[] = [];
	const flush = () => {
		if (cur.length) out.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
		cur = [];
	};
	for (const w of words) {
		const len = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length;
		if (cur.length >= 5 || (cur.length >= 2 && len > 28)) flush();
		cur.push(w);
		if (/[.!?…]»?$/.test(w.text)) flush();
		else if (/[,;:—]»?$/.test(w.text) && cur.length >= 2) flush();
	}
	flush();
	return out;
};

/** Фразы → «экраны»: слова копятся в кадре (до ~9 слов, до 4 строк), потом блок уходит целиком */
const toBlocks = (phrases: Phrase[], emph: Set<string>): Phrase[] => {
	const out: Phrase[] = [];
	let cur: Phrase | null = null;
	for (const ph of phrases) {
		if (cur) {
			const merged: Phrase = {words: [...cur.words, ...ph.words], start: cur.start, end: ph.end, breaks: [...(cur.breaks ?? []), cur.words.length]};
			if (merged.words.length <= 9 && layout(merged, emph).length <= 4) {
				cur = merged;
				continue;
			}
			out.push(cur);
		}
		cur = {...ph, breaks: []};
	}
	if (cur) out.push(cur);
	return out;
};

const widthOf = (text: string, kind: Kind) => {
	const n = [...text].length;
	if (kind === 'script') return n * SIZE.script * 0.38;
	if (kind === 'caps') return n * (SIZE.caps * 0.6 + 10);
	return n * SIZE.serif * 0.55;
};

type Item = {w: Word; text: string; kind: Kind; i: number};

/** Раскладка фразы по строкам: рукописное слово — отдельной строкой, остальное — набором до ширины кадра */
const layout = (ph: Phrase, emph: Set<string>): Item[][] => {
	const items: Item[] = ph.words
		.map((w, i) => {
			const text = clean(w.text);
			const n = norm(w.text);
			const kind: Kind = emph.has(n) ? 'script' : STOP.has(n) || n.length <= 2 ? 'caps' : 'serif';
			return {w, text, kind, i};
		})
		.filter((x) => x.text);
	const lines: Item[][] = [];
	let cur: Item[] = [];
	let cw = 0;
	const breaks = new Set(ph.breaks ?? []);
	for (const it of items) {
		const wd = widthOf(it.text, it.kind) + 26;
		if (breaks.has(it.i) && cur.length) {
			lines.push(cur);
			cur = [];
			cw = 0;
		}
		const curScript = cur.length > 0 && cur.every((x) => x.kind === 'script');
		if (it.kind === 'script' && !(curScript && cw + wd <= MAX_W)) {
			if (cur.length) lines.push(cur);
			cur = [it];
			cw = wd;
			continue;
		}
		if (cur.length && (cw + wd > MAX_W || (curScript && it.kind !== 'script'))) {
			lines.push(cur);
			cur = [];
			cw = 0;
		}
		cur.push(it);
		cw += wd;
	}
	if (cur.length) lines.push(cur);
	return lines;
};

/* ---------- появление слов ---------- */

/** Антиква: буквы поднимаются из-под «маски» строки */
const SerifWord: React.FC<{text: string; st: number}> = ({text, st}) => {
	const frame = useCurrentFrame();
	return (
		<span style={{display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0, overflow: 'hidden', padding: '0.04em 0.02em 0.14em', marginBottom: '-0.14em', verticalAlign: 'baseline'}}>
			{[...text].map((ch, k) => {
				const p = interpolate(frame, [st + k * 1.1, st + k * 1.1 + 13], [0, 1], {...clamp, easing: Easing.out(Easing.exp)});
				return (
					<span
						key={k}
						style={{
							display: 'inline-block',
							transform: `translateY(${(1 - p) * 105}%) rotate(${(1 - p) * 8}deg)`,
							opacity: Math.min(1, p * 1.6),
						}}
					>
						{ch}
					</span>
				);
			})}
		</span>
	);
};

/** Капители: разлёт трекинга сжимается, проявление из размытия */
const CapsWord: React.FC<{text: string; st: number; accent: string}> = ({text, st, accent}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [st, st + 16], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<span
			style={{
				display: 'inline-block',
				whiteSpace: 'nowrap',
				flexShrink: 0,
				fontFamily: FONT.caps,
				fontWeight: FONT.capsWeight ?? 500,
				fontSize: SIZE.caps,
				textTransform: 'uppercase',
				letterSpacing: `${0.7 - 0.5 * p}em`,
				color: accent,
				opacity: p,
				filter: `blur(${(1 - p) * 6}px)`,
				transform: `translateY(${-(SIZE.serif - SIZE.caps) * 0.3}px)`,
			}}
		>
			{text}
		</span>
	);
};

/** Рукописное: проявляется слева направо, как росчерк пера, с подчёркиванием-завитком */
const ScriptWord: React.FC<{text: string; st: number; accent: string; tilt: number}> = ({text, st, accent, tilt}) => {
	const frame = useCurrentFrame();
	const dur = 8 + [...text].length * 2.2;
	const p = interpolate(frame, [st, st + dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const u = interpolate(frame, [st + dur * 0.6, st + dur + 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const settle = interpolate(frame, [st, st + dur + 10], [1.12, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const w = widthOf(text, 'script');
	return (
		<span style={{display: 'inline-block', whiteSpace: 'nowrap', flexShrink: 0, position: 'relative', transform: `rotate(${tilt}deg) scale(${settle})`, padding: '0 0.15em'}}>
			<span
				style={{
					display: 'inline-block',
					fontFamily: FONT.script,
					fontSize: SIZE.script,
					lineHeight: 1.05,
					color: accent,
					// маска с запасом 15% под росчерки по краям; при p=0 закрыто целиком (иначе виден хвостик первой буквы)
					clipPath: `inset(-30% ${(1 - p) * 130 - 15}% -40% -15%)`,
					opacity: interpolate(frame, [st, st + 5], [0, 1], clamp),
					paddingRight: '0.12em',
					textShadow: `0 0 50px ${accent}55, 0 6px 26px rgba(0,0,0,0.8)`,
				}}
			>
				{text}
			</span>
			<svg width={w} height={40} viewBox={`0 0 ${w} 40`} style={{position: 'absolute', left: '0.2em', bottom: -14, overflow: 'visible'}}>
				<path
					d={`M4,26 C${w * 0.3},${12} ${w * 0.65},${34} ${w - 6},${14} q14,-8 4,8`}
					fill="none"
					stroke={accent}
					strokeWidth={3}
					strokeLinecap="round"
					pathLength={1}
					strokeDasharray={1}
					strokeDashoffset={1 - u}
					opacity={0.75}
				/>
			</svg>
		</span>
	);
};

/* ---------- фраза целиком ---------- */

type Mood = {align: 'left' | 'center' | 'right'; dy: number; italic: boolean; exit: 'rise' | 'drift' | 'fall'; tilt: number};
const moodFor = (seed: string): Mood => {
	const r = (k: string) => random(seed + k);
	const aligns = ['center', 'left', 'center', 'right'] as const;
	const exits = ['rise', 'drift', 'fall'] as const;
	return {
		align: aligns[Math.floor(r('a') * aligns.length)],
		dy: Math.floor(r('y') * 3) * 30,
		italic: r('i') > 0.5,
		exit: exits[Math.floor(r('e') * exits.length)],
		tilt: -3 - r('t') * 4,
	};
};

export const KineticText: React.FC<{
	words: Word[];
	emphasis: string[];
	accent: string;
	frames: number;
	top: number;
	finalTitle?: boolean;
	seed: string;
}> = ({words, emphasis, accent, frames, top, finalTitle, seed}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const emph = useMemo(() => new Set(emphasis.map(norm)), [emphasis]);
	const phrases = useMemo(() => toBlocks(toPhrases(words), emph), [words, emph]);
	const t = (frame - AUDIO_DELAY) / fps;
	const lastW = words[words.length - 1];
	const lastEnd = finalTitle ? AUDIO_DELAY + (lastW?.end ?? 0) * fps + 20 : frames - 2;
	const idx = phrases.findIndex((ph, i) => {
		const next = phrases[i + 1];
		return t >= ph.start - 0.12 && (next ? t < next.start - 0.06 : frame < lastEnd);
	});
	const lines = useMemo(() => (idx >= 0 ? layout(phrases[idx], emph) : []), [idx, phrases, emph]);
	if (idx < 0) return null;
	const ph = phrases[idx];
	const next = phrases[idx + 1];
	const startF = AUDIO_DELAY + (ph.start - 0.12) * fps;
	const endF = next ? AUDIO_DELAY + (next.start - 0.06) * fps : lastEnd;
	const mood = moodFor(`${seed}-${idx}`);
	const out = interpolate(frame, [endF - 9, endF], [1, 0], {...clamp, easing: Easing.in(Easing.quad)});
	const life = interpolate(frame, [startF, endF], [0, 1], clamp);
	const exitT =
		mood.exit === 'rise'
			? `translateY(${(1 - out) * -50}px)`
			: mood.exit === 'fall'
				? `translateY(${(1 - out) * 40}px) rotate(${(1 - out) * 2}deg)`
				: `translateX(${(1 - out) * -60}px)`;
	return (
		<div
			style={{
				position: 'absolute',
				top: top + mood.dy,
				left: SIDE_L,
				right: SIDE_R,
				display: 'flex',
				flexDirection: 'column',
				alignItems: mood.align === 'left' ? 'flex-start' : mood.align === 'right' ? 'flex-end' : 'center',
				gap: 0,
				opacity: out,
				filter: `blur(${(1 - out) * 8}px)`,
				transform: `${exitT} scale(${1 + life * 0.035})`,
				transformOrigin: mood.align === 'left' ? 'left top' : mood.align === 'right' ? 'right top' : 'center top',
			}}
		>
			{lines.map((line, li) => (
				<div
					key={li}
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						justifyContent: mood.align === 'left' ? 'flex-start' : mood.align === 'right' ? 'flex-end' : 'center',
						maxWidth: '100%',
						alignItems: 'baseline',
						columnGap: 22,
						textAlign: mood.align,
						fontFamily: FONT.serif,
						fontWeight: FONT.serifWeight ?? (mood.italic ? 600 : 700),
						fontStyle: mood.italic && FONT.italic !== false ? 'italic' : 'normal',
						fontSize: SIZE.serif,
						lineHeight: 1.04,
						color: CREAM,
						textShadow: '0 6px 30px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.6)',
						marginTop: line[0].kind === 'script' ? -10 : 0,
						marginLeft: mood.align === 'left' ? li * 34 : 0,
						marginRight: mood.align === 'right' ? li * 34 : 0,
					}}
				>
					{line.map((it) => {
						const st = AUDIO_DELAY + (it.w.start - 0.06) * fps;
						if (it.kind === 'script') return <ScriptWord key={it.i} text={it.text} st={st} accent={accent} tilt={mood.tilt} />;
						if (it.kind === 'caps') return <CapsWord key={it.i} text={it.text} st={st} accent={accent} />;
						return <SerifWord key={it.i} text={it.text} st={st} />;
					})}
				</div>
			))}
		</div>
	);
};

/** Финальный титр: одним шрифтом (антиква), буквы поднимаются, разрядка медленно сжимается */
export const FinalTitle: React.FC<{text: string; start: number; accent: string}> = ({text, start, accent}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [start, start + 70], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const line = interpolate(frame, [start + 30, start + 70], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<div style={{position: 'absolute', top: 470, left: SIDE_L, right: SIDE_R, textAlign: 'center', color: CREAM}}>
			<div
				style={{
					fontFamily: FONT.serif,
					fontWeight: FONT.serifWeight ?? 700,
					fontSize: 128,
					lineHeight: 1,
					letterSpacing: `${0.12 - 0.08 * p}em`,
					textShadow: '0 8px 50px rgba(0,0,0,0.8)',
				}}
			>
				{text.split(' ').map((w, wi) => (
					<div key={wi}>
						<SerifWord text={w} st={start + wi * 10} />
					</div>
				))}
			</div>
			<div style={{margin: '26px auto 0', height: 2, width: 300 * line, background: accent, opacity: 0.8}} />
		</div>
	);
};
