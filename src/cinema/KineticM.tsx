// Кинетическая типографика на Montserrat переменной толщины (ось wght 100–900).
// Пять вариантов (script.textStyle): weight · slide · pop · title · stack — выбирается один на ролик.
import React, {useMemo} from 'react';
import {Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {AUDIO_DELAY} from '../timing';
import type {Word} from '../types';
import {STOP, norm, toPhrases, type Phrase} from './Kinetic';

export type TextStyle = 'weight' | 'slide' | 'pop' | 'title' | 'stack';
const F = 'Montserrat Var';
const CREAM = '#f6f1e7';
const SIDE_L = 80;
const SIDE_R = 150;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SHADOW = '0 6px 30px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.6)';
const clean = (w: string) => w.replace(/́/g, '').replace(/[.,;:!?…]+$/g, '').replace(/^—$/, '');
type Kind = 'key' | 'main' | 'stop';

/** Фразы → блоки до maxWords слов */
const toBlocks = (phrases: Phrase[], maxWords: number): Phrase[] => {
	const out: Phrase[] = [];
	let cur: Phrase | null = null;
	for (const ph of phrases) {
		if (cur && cur.words.length + ph.words.length <= maxWords) {
			cur = {words: [...cur.words, ...ph.words], start: cur.start, end: ph.end};
			continue;
		}
		if (cur) out.push(cur);
		// фраза длиннее лимита — режем
		for (let i = 0; i < ph.words.length; i += maxWords) {
			const ws = ph.words.slice(i, i + maxWords);
			const b = {words: ws, start: ws[0].start, end: ws[ws.length - 1].end};
			if (i + maxWords < ph.words.length) out.push(b);
			else cur = b;
		}
	}
	if (cur) out.push(cur);
	return out;
};
const MAX: Record<TextStyle, number> = {weight: 8, slide: 8, pop: 3, title: 7, stack: 4};

type Item = {w: Word; text: string; kind: Kind; i: number; st: number};

/* ---------- 1. «Вес»: тонкое слово набирает толщину, разрядка сжимается ---------- */
const WeightWord: React.FC<{it: Item; accent: string; out: number}> = ({it, accent, out}) => {
	const f = useCurrentFrame();
	const p = interpolate(f, [it.st, it.st + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const target = it.kind === 'key' ? 900 : it.kind === 'stop' ? 300 : 700;
	const wght = 100 + (target - 100) * p * out + 0 * (1 - out);
	return (
		<span
			style={{
				display: 'inline-block',
				whiteSpace: 'nowrap',
				fontVariationSettings: `'wght' ${wght}`,
				fontWeight: wght,
				fontSize: it.kind === 'key' ? 108 : it.kind === 'stop' ? 46 : 82,
				textTransform: it.kind === 'stop' ? 'uppercase' : 'none',
				letterSpacing: `${(1 - p) * 0.35 + (it.kind === 'stop' ? 0.18 : -0.01)}em`,
				color: it.kind === 'key' ? accent : CREAM,
				opacity: Math.min(1, p * 2),
			}}
		>
			{it.text}
		</span>
	);
};

/* ---------- 2. «Шторка»: слово выезжает из-под маски, ключевое — на плашке цвета акцента ---------- */
const SlideWord: React.FC<{it: Item; accent: string}> = ({it, accent}) => {
	const f = useCurrentFrame();
	const p = interpolate(f, [it.st, it.st + 12], [0, 1], {...clamp, easing: Easing.out(Easing.exp)});
	const bar = interpolate(f, [it.st + 4, it.st + 16], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const key = it.kind === 'key';
	return (
		<span style={{display: 'inline-block', position: 'relative', overflow: 'hidden', padding: '0.02em 0.12em 0.1em', verticalAlign: 'bottom'}}>
			{key && <span style={{position: 'absolute', left: 0, top: '8%', bottom: '4%', width: `${bar * 100}%`, background: accent}} />}
			<span
				style={{
					position: 'relative',
					display: 'inline-block',
					whiteSpace: 'nowrap',
					transform: `translateY(${(1 - p) * 110}%)`,
					fontVariationSettings: `'wght' ${key ? 900 : it.kind === 'stop' ? 400 : 700}`,
					fontWeight: key ? 900 : it.kind === 'stop' ? 400 : 700,
					fontSize: it.kind === 'stop' ? 60 : 80,
					fontStyle: key ? 'italic' : 'normal',
					color: CREAM,
				}}
			>
				{it.text}
			</span>
		</span>
	);
};

/* ---------- 3. «Поп»: 1–3 крупных слова, каждое выпрыгивает под голос, звучащее — акцентом ---------- */
const PopWord: React.FC<{it: Item; accent: string; next?: number}> = ({it, accent, next}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const k = Math.max(0, f - it.st);
	const spring = f < it.st ? 0 : 1 - Math.exp(-k / 3.2) * Math.cos(k / 2.6);
	const speaking = f >= it.st && (next === undefined || f < next);
	const key = it.kind === 'key';
	return (
		<span
			style={{
				display: 'inline-block',
				whiteSpace: 'nowrap',
				transform: `scale(${spring}) rotate(${(1 - Math.min(1, spring)) * -6}deg)`,
				opacity: f < it.st ? 0 : 1,
				fontVariationSettings: `'wght' ${key ? 900 : 800}`,
				fontWeight: key ? 900 : 800,
				fontSize: key ? 132 : 104,
				fontStyle: key ? 'italic' : 'normal',
				textTransform: 'uppercase',
				letterSpacing: '-0.02em',
				color: speaking || key ? accent : CREAM,
				WebkitTextStroke: key ? 'none' : `0px`,
				transition: 'none',
			}}
			data-fps={fps}
		>
			{it.text}
		</span>
	);
};

/* ---------- 4. «Титр»: строка проявляется из размытия, разрядка сжимается, под блоком тянется линия ---------- */
const TitleWord: React.FC<{it: Item; accent: string; out: number}> = ({it, accent, out}) => {
	const f = useCurrentFrame();
	const p = interpolate(f, [it.st, it.st + 20], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const key = it.kind === 'key';
	const w = key ? 800 : it.kind === 'stop' ? 200 : 300;
	return (
		<span
			style={{
				display: 'inline-block',
				whiteSpace: 'nowrap',
				fontVariationSettings: `'wght' ${w}`,
				fontWeight: w,
				fontSize: key ? 96 : 76,
				textTransform: 'uppercase',
				letterSpacing: `${0.04 + (1 - p) * 0.4 + (1 - out) * 0.5}em`,
				filter: `blur(${(1 - p) * 10}px)`,
				opacity: p,
				color: key ? accent : CREAM,
			}}
		>
			{it.text}
		</span>
	);
};

/* ---------- 5. «Лесенка»: каждое слово своей строкой, разный вес и кегль, влетают с боков ---------- */
const StackWord: React.FC<{it: Item; accent: string; n: number}> = ({it, accent, n}) => {
	const f = useCurrentFrame();
	const p = interpolate(f, [it.st, it.st + 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
	const side = n % 2 ? 1 : -1;
	const key = it.kind === 'key';
	const w = key ? 900 : it.kind === 'stop' ? 200 : n % 2 ? 600 : 300;
	return (
		<div
			style={{
				whiteSpace: 'nowrap',
				fontVariationSettings: `'wght' ${w}`,
				fontWeight: w,
				fontSize: key ? 150 : it.kind === 'stop' ? 56 : 92,
				lineHeight: 0.98,
				textTransform: key ? 'uppercase' : 'none',
				letterSpacing: key ? '-0.03em' : '0',
				color: key ? accent : CREAM,
				transform: `translateX(${(1 - p) * side * 160}px)`,
				opacity: Math.min(1, p * 1.5),
				filter: `blur(${Math.max(0, 1 - p) * 6}px)`,
				alignSelf: n % 2 ? 'flex-end' : 'flex-start',
			}}
		>
			{it.text}
		</div>
	);
};

export const KineticM: React.FC<{
	words: Word[];
	emphasis: string[];
	accent: string;
	frames: number;
	top: number;
	seed: string;
	variant: TextStyle;
}> = ({words, emphasis, accent, frames, top, seed, variant}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const emph = useMemo(() => new Set(emphasis.map(norm)), [emphasis]);
	const blocks = useMemo(() => toBlocks(toPhrases(words), MAX[variant]), [words, variant]);
	const t = (frame - AUDIO_DELAY) / fps;
	const lastEnd = frames - 2;
	const idx = blocks.findIndex((b, i) => {
		const next = blocks[i + 1];
		return t >= b.start - 0.12 && (next ? t < next.start - 0.06 : frame < lastEnd);
	});
	if (idx < 0) return null;
	const b = blocks[idx];
	const next = blocks[idx + 1];
	const startF = AUDIO_DELAY + (b.start - 0.12) * fps;
	const endF = next ? AUDIO_DELAY + (next.start - 0.06) * fps : lastEnd;
	const items: Item[] = b.words
		.map((w, i) => {
			const n = norm(w.text);
			const kind: Kind = emph.has(n) ? 'key' : STOP.has(n) || n.length <= 2 ? 'stop' : 'main';
			return {w, text: clean(w.text), kind, i, st: AUDIO_DELAY + (w.start - 0.06) * fps};
		})
		.filter((x) => x.text);
	const exitLen = variant === 'pop' ? 4 : variant === 'title' ? 14 : 10;
	const out = interpolate(frame, [endF - exitLen, endF], [1, 0], {...clamp, easing: Easing.in(Easing.quad)});
	const life = interpolate(frame, [startF, endF], [0, 1], clamp);
	const base: React.CSSProperties = {position: 'absolute', top, left: SIDE_L, right: SIDE_R, fontFamily: F, color: CREAM, textShadow: SHADOW};

	if (variant === 'weight') {
		const align = random(`${seed}-${idx}`) > 0.5 ? 'flex-start' : 'center';
		return (
			<div style={{...base, display: 'flex', flexWrap: 'wrap', justifyContent: align, alignItems: 'baseline', columnGap: 22, rowGap: 0, lineHeight: 1.08, opacity: Math.min(1, out * 1.3), transform: `translateY(${(1 - out) * -30}px) scale(${1 + life * 0.03})`}}>
				{items.map((it) => (
					<WeightWord key={it.i} it={it} accent={accent} out={out} />
				))}
			</div>
		);
	}
	if (variant === 'slide') {
		// уход: весь блок уезжает вверх под маску
		return (
			<div style={{...base, overflow: 'hidden', paddingBottom: 10}}>
				<div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 6, lineHeight: 1.02, transform: `translateY(${(1 - out) * -110}%)`}}>
					{items.map((it) => (
						<SlideWord key={it.i} it={it} accent={accent} />
					))}
				</div>
			</div>
		);
	}
	if (variant === 'pop') {
		return (
			<div style={{...base, top: top + 120, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 26, lineHeight: 1.0, textAlign: 'center', transform: `scale(${0.6 + 0.4 * out})`, opacity: out, textShadow: '0 8px 0 rgba(0,0,0,0.55), 0 10px 40px rgba(0,0,0,0.7)'}}>
				{items.map((it, k) => (
					<PopWord key={it.i} it={it} accent={accent} next={items[k + 1]?.st} />
				))}
			</div>
		);
	}
	if (variant === 'title') {
		const line = interpolate(frame, [startF + 6, startF + 30], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
		return (
			<div style={{...base, textAlign: 'center', opacity: out}}>
				<div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: 28, lineHeight: 1.12}}>
					{items.map((it) => (
						<TitleWord key={it.i} it={it} accent={accent} out={out} />
					))}
				</div>
				<div style={{margin: '24px auto 0', height: 3, width: 260 * line * out, background: accent}} />
			</div>
		);
	}
	// stack
	return (
		<div style={{...base, display: 'flex', flexDirection: 'column', opacity: out, transform: `translateX(${(1 - out) * -80}px)`}}>
			{items.map((it, n) => (
				<StackWord key={it.i} it={it} accent={accent} n={n} />
			))}
		</div>
	);
};
