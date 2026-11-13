import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {BlockColor, Clip} from './types';

export const INK = '#1d1a16';
export const PAPER = '#efe5cf';
export const F_POSTER = "'Oswald', sans-serif";
export const F_MONO = "'PT Mono', monospace";
export const F_SERIF = "'Playfair Display', serif";
export const F_HAND = "'Caveat', cursive";

export const BLOCKS: Record<BlockColor, {bg: string; text: string}> = {
	red: {bg: '#a8133a', text: PAPER},
	orange: {bg: '#e0531f', text: PAPER},
	black: {bg: '#1f1c19', text: PAPER},
	olive: {bg: '#6d6c3c', text: PAPER},
	blue: {bg: '#1f3f6e', text: PAPER},
	cream: {bg: '#e9dcc0', text: INK},
};

const useSp = (delay: number, damping = 14, stiffness = 170) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - delay, fps, config: {damping, stiffness, mass: 0.9}});
};

/** Рваный край: полигон с зазубринами */
export const tornPolygon = (seed: string, edges: {top?: boolean; bottom?: boolean; left?: boolean; right?: boolean}, amp = 1.6) => {
	const pts: string[] = [];
	const N = 28;
	const j = (i: number, s: string) => (random(`${seed}${s}${i}`) * amp).toFixed(2);
	for (let i = 0; i <= N; i++) pts.push(`${(i / N) * 100}% ${edges.top ? j(i, 't') : 0}%`);
	for (let i = 1; i <= N; i++) pts.push(`${edges.right ? (100 - Number(j(i, 'r'))).toFixed(2) : 100}% ${(i / N) * 100}%`);
	for (let i = N - 1; i >= 0; i--) pts.push(`${(i / N) * 100}% ${edges.bottom ? (100 - Number(j(i, 'b'))).toFixed(2) : 100}%`);
	for (let i = N - 1; i >= 1; i--) pts.push(`${edges.left ? j(i, 'l') : 0}% ${(i / N) * 100}%`);
	return `polygon(${pts.join(',')})`;
};

/** Шум бумаги поверх любого слоя */
export const Grain: React.FC<{opacity?: number; id: string; freq?: number}> = ({opacity = 0.18, id, freq = 0.8}) => (
	<svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, mixBlendMode: 'multiply'}}>
		<filter id={id}>
			<feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={7} />
			<feColorMatrix type="saturate" values="0" />
		</filter>
		<rect width="100%" height="100%" filter={`url(#${id})`} />
	</svg>
);

const WORDS =
	'the of track meet runners coach oregon eugene season record mile field team university shoes new company sales league first annual report city council daily journal weather market local news sport victory champion race time miles national'.split(
		' ',
	);
const fakeText = (seed: string, n: number) =>
	new Array(n)
		.fill(0)
		.map((_, i) => WORDS[Math.floor(random(`${seed}${i}`) * WORDS.length)])
		.join(' ');

const HEADS = ['THE DAILY JOURNAL', 'SPORTS EDITION', 'TRACK & FIELD', 'LOCAL NEWS', 'MARKET REPORT', 'THE OREGON HERALD'];

/** Фон: старая газета */
export const Newspaper: React.FC = () => {
	const frame = useCurrentFrame();
	const cols = useMemo(
		() =>
			new Array(12).fill(0).map((_, i) => ({
				head: HEADS[i % HEADS.length],
				text: fakeText(`np${i}`, 260),
			})),
		[],
	);
	const drift = interpolate(frame, [0, 3000], [0, -60]);
	return (
		<AbsoluteFill style={{background: '#d9cdb3', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					left: -160,
					top: -200 + drift,
					width: 1400,
					height: 2400,
					transform: 'rotate(-3deg)',
					display: 'grid',
					gridTemplateColumns: 'repeat(4, 1fr)',
					gap: 28,
					padding: 30,
					color: '#4a4034',
					opacity: 0.5,
				}}
			>
				{cols.map((c, i) => (
					<div key={i} style={{overflow: 'hidden'}}>
						<div style={{fontFamily: F_SERIF, fontWeight: 900, fontSize: 40, lineHeight: 1, marginBottom: 12, borderBottom: '3px solid #4a4034', paddingBottom: 8}}>
							{c.head}
						</div>
						<div style={{fontFamily: F_SERIF, fontWeight: 700, fontSize: 15, lineHeight: 1.35, textAlign: 'justify'}}>{c.text}</div>
					</div>
				))}
			</div>
			{/* пятна и потёртости */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(circle at 20% 15%, rgba(120,90,40,0.25), transparent 30%), radial-gradient(circle at 85% 60%, rgba(120,90,40,0.22), transparent 28%), radial-gradient(circle at 40% 85%, rgba(90,60,30,0.2), transparent 30%)',
				}}
			/>
			<Grain id="np-grain" opacity={0.35} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(40,25,10,0.45) 100%)'}} />
		</AbsoluteFill>
	);
};

/** Цветная рваная бумага снизу */
export const TornBlock: React.FC<{color: BlockColor; top: number; animate: boolean; seed: string}> = ({color, top, animate, seed}) => {
	const p = useSp(0, 18, 120);
	const y = animate ? interpolate(p, [0, 1], [1100, 0]) : 0;
	const rot = animate ? interpolate(p, [0, 1], [4, 0]) : 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: -40,
				right: -40,
				top,
				bottom: -60,
				transform: `translateY(${y}px) rotate(${rot}deg)`,
				filter: 'drop-shadow(0 -10px 18px rgba(0,0,0,0.35))',
			}}
		>
			<div style={{position: 'absolute', inset: 0, background: BLOCKS[color].bg, clipPath: tornPolygon(seed, {top: true}, 1.1)}}>
				<Grain id={`blk-${seed}`} opacity={0.45} freq={0.6} />
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.18))'}} />
			</div>
		</div>
	);
};

/** Год из вырезанных букв */
export const RansomText: React.FC<{text: string; x: number; y: number; size?: number; animate: boolean; seed?: string}> = ({
	text,
	x,
	y,
	size = 120,
	animate,
	seed = 'r',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const styles = [
		{bg: PAPER, color: INK, font: F_SERIF, w: 900},
		{bg: INK, color: PAPER, font: F_POSTER, w: 700},
		{bg: '#e0531f', color: PAPER, font: F_SERIF, w: 900},
		{bg: '#ffffff', color: INK, font: F_MONO, w: 400},
		{bg: '#d4b25a', color: INK, font: F_POSTER, w: 700},
	];
	return (
		<div style={{position: 'absolute', left: x, top: y, display: 'flex', gap: 10, alignItems: 'center'}}>
			{text.split('').map((ch, i) => {
				if (ch === ' ') return <div key={i} style={{width: size * 0.3}} />;
				const st = styles[Math.floor(random(`${seed}${text}${i}`) * styles.length)];
				const p = animate ? spring({frame: frame - 3 - i * 4, fps, config: {damping: 11, stiffness: 220}}) : 1;
				const rot = (random(`${seed}rot${text}${i}`) - 0.5) * 14;
				return (
					<div
						key={i}
						style={{
							background: st.bg,
							color: st.color,
							fontFamily: st.font,
							fontWeight: st.w,
							fontSize: size,
							lineHeight: 1,
							padding: `${size * 0.08}px ${size * 0.12}px`,
							transform: `rotate(${rot}deg) scale(${interpolate(p, [0, 1], [1.8, 1])})`,
							opacity: p,
							boxShadow: '3px 5px 10px rgba(0,0,0,0.35)',
							clipPath: tornPolygon(`${seed}${text}${i}`, {top: true, bottom: true, left: true, right: true}, 3),
						}}
					>
						{ch}
					</div>
				);
			})}
		</div>
	);
};

/** Строка «с печатной машинки» на полоске бумаги */
export const TypeLabel: React.FC<{text: string; x?: number; y: number; delay?: number; rotate?: number; maxWidth?: number}> = ({
	text,
	x = 90,
	y,
	delay = 6,
	rotate = -1,
	maxWidth = 820,
}) => {
	const frame = useCurrentFrame();
	const shown = Math.max(0, Math.floor((frame - delay) * 1.4));
	if (frame < delay) return null;
	const cursor = shown < text.length || Math.floor(frame / 8) % 2 === 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				maxWidth,
				transform: `rotate(${rotate}deg)`,
				background: '#f6f0e2',
				padding: '10px 22px',
				fontFamily: F_MONO,
				fontSize: 34,
				letterSpacing: 2,
				textTransform: 'uppercase',
				color: INK,
				boxShadow: '2px 4px 10px rgba(0,0,0,0.3)',
				clipPath: tornPolygon(`lbl${text}`, {left: true, right: true}, 1.2),
			}}
		>
			{text.slice(0, shown)}
			<span style={{opacity: cursor ? 1 : 0}}>▌</span>
		</div>
	);
};

/** Штамп чернилами */
export const Stamp: React.FC<{text: string; sub?: string; x: number; y: number; rotate?: number; color: string; delay?: number}> = ({
	text,
	sub,
	x,
	y,
	rotate = -8,
	color,
	delay = 14,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame: frame - delay, fps, config: {damping: 9, stiffness: 260}});
	if (frame < delay) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${interpolate(p, [0, 1], [2.2, 1])})`,
				opacity: interpolate(p, [0, 0.3, 1], [0, 0.9, 0.88]),
				border: `7px solid ${color}`,
				outline: `3px solid ${color}`,
				outlineOffset: 6,
				padding: '10px 26px',
				color,
				textAlign: 'center',
				fontFamily: F_POSTER,
				fontWeight: 700,
				textTransform: 'uppercase',
				mixBlendMode: 'multiply',
				whiteSpace: 'nowrap',
			}}
		>
			<div style={{fontSize: 64, lineHeight: 1}}>{text}</div>
			{sub && <div style={{fontFamily: F_MONO, fontSize: 26, letterSpacing: 2, marginTop: 6}}>{sub}</div>}
			<Grain id={`stamp${text}`} opacity={0.6} freq={1.4} />
		</div>
	);
};

const TONES = {
	sepia: 'sepia(0.55) contrast(1.08) saturate(0.85) brightness(0.98)',
	bw: 'grayscale(1) contrast(1.15) brightness(1.02)',
	color: 'saturate(0.9) contrast(1.04)',
};

/** Фото-вырезка или наклейка */
export const ClipImage: React.FC<{clip: Clip; index: number}> = ({clip, index}) => {
	const delay = clip.delay ?? 4 + index * 7;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 150}});
	if (frame < delay) return null;
	const rot = clip.rotate ?? (random(`clip${clip.src}`) - 0.5) * 8;
	const kind = clip.kind ?? 'photo';
	const tone = TONES[clip.tone ?? (kind === 'photo' ? 'sepia' : 'color')];
	const float = Math.sin((frame + index * 20) / 40) * 4;
	const transform = `translate(-50%, -50%) translateY(${interpolate(p, [0, 1], [-60, 0]) + float}px) rotate(${rot + interpolate(p, [0, 1], [10, 0])}deg) scale(${interpolate(p, [0, 1], [1.25, 1])})`;
	return (
		<div style={{position: 'absolute', left: clip.x, top: clip.y, width: clip.w, transform, opacity: Math.min(1, p * 1.5)}}>
			{kind === 'photo' ? (
				<div style={{background: '#f8f4ea', padding: 14, boxShadow: '6px 12px 28px rgba(0,0,0,0.45)', position: 'relative'}}>
					<Img src={staticFile(clip.src)} style={{width: '100%', display: 'block', filter: tone}} />
					<Grain id={`ph${index}${clip.src}`} opacity={0.25} />
					{/* скотч */}
					<div
						style={{
							position: 'absolute',
							top: -22,
							left: '50%',
							width: 150,
							height: 46,
							transform: `translateX(-50%) rotate(${(random(`tape${clip.src}`) - 0.5) * 16}deg)`,
							background: 'rgba(235,225,195,0.72)',
							boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
							clipPath: tornPolygon(`tp${clip.src}`, {left: true, right: true}, 4),
						}}
					/>
				</div>
			) : (
				<Img
					src={staticFile(clip.src)}
					style={{
						width: '100%',
						display: 'block',
						filter: `${tone} drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(8px 14px 14px rgba(0,0,0,0.45))`,
					}}
				/>
			)}
			{clip.caption && (
				<div
					style={{
						position: 'absolute',
						left: '50%',
						bottom: -50,
						transform: 'translateX(-50%) rotate(1.5deg)',
						background: '#f6f0e2',
						padding: '6px 16px',
						fontFamily: F_MONO,
						fontSize: 24,
						letterSpacing: 1.5,
						textTransform: 'uppercase',
						color: INK,
						whiteSpace: 'nowrap',
						boxShadow: '2px 3px 8px rgba(0,0,0,0.3)',
					}}
				>
					{clip.caption}
				</div>
			)}
		</div>
	);
};

/** Плакатный заголовок: строки выезжают из-под маски */
export const PosterHeadline: React.FC<{text: string; y: number; color: string; size?: number; delay?: number}> = ({
	text,
	y,
	color,
	size = 120,
	delay = 8,
}) => {
	const frame = useCurrentFrame();
	const lines = text.split('\n');
	return (
		<div style={{position: 'absolute', left: 90, right: 150, top: y, textAlign: 'center'}}>
			{lines.map((l, i) => {
				const p = interpolate(frame, [delay + i * 5, delay + i * 5 + 12], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
					easing: Easing.out(Easing.cubic),
				});
				return (
					<div key={i} style={{overflow: 'hidden', lineHeight: 1.02}}>
						<div
							style={{
								transform: `translateY(${(1 - p) * 110}%)`,
								fontFamily: F_POSTER,
								fontWeight: 700,
								fontSize: size,
								textTransform: 'uppercase',
								color,
								letterSpacing: 1,
								textShadow: '0 4px 14px rgba(0,0,0,0.25)',
							}}
						>
							{l}
						</div>
					</div>
				);
			})}
		</div>
	);
};

/** Рукописная заметка, «пишется» слева направо */
export const HandNote: React.FC<{text: string; y: number; color: string; delay?: number}> = ({text, y, color, delay = 10}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [delay, delay + text.length * 1.6], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div
			style={{
				position: 'absolute',
				left: 90,
				right: 150,
				top: y,
				textAlign: 'center',
				fontFamily: F_HAND,
				fontWeight: 700,
				fontSize: 78,
				lineHeight: 1.1,
				color,
				clipPath: `inset(0 ${100 - p}% 0 0)`,
				whiteSpace: 'pre-line',
				transform: 'rotate(-3deg)',
			}}
		>
			{text}
		</div>
	);
};

/** Линейка времени сверху: маркер едет к текущему году */
export const Ruler: React.FC<{from: number; to: number; year: number; prevYear: number; sceneFrame: number}> = ({
	from,
	to,
	year,
	prevYear,
	sceneFrame,
}) => {
	const {fps} = useVideoConfig();
	const p = spring({frame: sceneFrame, fps, config: {damping: 20, stiffness: 90}});
	const cur = prevYear + (year - prevYear) * p;
	const W = 900;
	const x0 = 90;
	const pos = (yr: number) => x0 + ((yr - from) / (to - from)) * W;
	const ticks: number[] = [];
	for (let yr = Math.ceil(from / 2) * 2; yr <= to; yr += 2) ticks.push(yr);
	return (
		<div style={{position: 'absolute', top: 110, left: 0, right: 0, height: 80}}>
			<div style={{position: 'absolute', left: x0, width: W, top: 36, height: 3, background: 'rgba(29,26,22,0.55)'}} />
			{ticks.map((t) => (
				<div key={t}>
					<div
						style={{
							position: 'absolute',
							left: pos(t),
							top: t % 10 === 0 ? 18 : 26,
							width: 2,
							height: t % 10 === 0 ? 22 : 12,
							background: 'rgba(29,26,22,0.6)',
						}}
					/>
					{t % 10 === 0 && (
						<div style={{position: 'absolute', left: pos(t) - 40, width: 80, textAlign: 'center', top: -8, fontFamily: F_MONO, fontSize: 20, color: 'rgba(29,26,22,0.75)'}}>
							{t}
						</div>
					)}
				</div>
			))}
			<div style={{position: 'absolute', left: pos(cur) - 44, top: 46, width: 88, textAlign: 'center'}}>
				<div style={{width: 0, height: 0, margin: '0 auto', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '14px solid #a8133a'}} />
				<div style={{background: '#a8133a', color: PAPER, fontFamily: F_MONO, fontSize: 22, padding: '2px 0'}}>{Math.round(cur)}</div>
			</div>
		</div>
	);
};
