import React, {useMemo} from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Sequence,
	interpolate,
	random,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {loadFonts} from '../fonts';
import {AUDIO_DELAY, FPS, chunkWords, estimateDuration, estimateWords} from '../timing';
import type {Word} from '../types';
import {SetView} from './Sets';
import type {CinemaProps, CinemaShot} from './types';

loadFonts();

/** Растворение между планами, кадры */
export const DISSOLVE = 20;
const TAIL = 10;
const LAST_TAIL = 90;

export const shotFrames = (s: CinemaShot, isLast: boolean) =>
	AUDIO_DELAY + Math.ceil((s.duration ?? estimateDuration(s.voice)) * FPS) + (s.pause ?? TAIL) + (isLast ? LAST_TAIL : 0);
export const cinemaTotal = (scenes: CinemaShot[]) => scenes.reduce((a, s, i) => a + shotFrames(s, i === scenes.length - 1), 0);

const CREAM = '#f3ead8';
const F_SERIF = 'Playfair Display';
const F_CAPS = 'Oswald';
const F_TEXT = 'Manrope';
const SIDE_L = 80;
const SIDE_R = 150;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Буквы проявляются из размытия, слово не рвётся */
const RevealText: React.FC<{text: string; start: number; stagger?: number; style: React.CSSProperties}> = ({text, start, stagger = 1.2, style}) => {
	const frame = useCurrentFrame();
	let n = 0;
	return (
		<div style={style}>
			{text.split('\n').map((line, li) => (
				<div key={li}>
					{line.split(' ').map((word, wi) => (
						<span key={wi} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
							{[...word].map((ch, ci) => {
								const t = frame - start - n++ * stagger;
								const p = interpolate(t, [0, 16], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
								return (
									<span key={ci} style={{display: 'inline-block', opacity: p, filter: `blur(${(1 - p) * 10}px)`, transform: `translateY(${(1 - p) * 14}px)`}}>
										{ch}
									</span>
								);
							})}
							{wi < line.split(' ').length - 1 ? ' ' : ''}
						</span>
					))}
				</div>
			))}
		</div>
	);
};

const fade = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});

/** Лавровая ветвь из листьев-эллипсов */
const Laurel: React.FC<{side: 1 | -1; p: number; color: string}> = ({side, p, color}) => (
	<svg width={180} height={300} viewBox="-90 -150 180 300" style={{transform: `scaleX(${side})`}}>
		{Array.from({length: 9}).map((_, i) => {
			const a = (-60 + i * 15) * (Math.PI / 180);
			const x = -Math.cos(a) * 70 + 20;
			const y = Math.sin(a) * 120;
			const show = interpolate(p * 10 - i, [0, 1], [0, 1], clamp);
			return (
				<g key={i} opacity={show}>
					<ellipse cx={x - 16} cy={y} rx={22} ry={8} fill={color} transform={`rotate(${-30 + i * 8} ${x - 16} ${y})`} />
					<ellipse cx={x + 10} cy={y - 6} rx={20} ry={7} fill={color} transform={`rotate(${40 + i * 6} ${x + 10} ${y - 6})`} />
				</g>
			);
		})}
	</svg>
);

const Titles: React.FC<{shot: CinemaShot; frames: number; accent: string; isLast: boolean}> = ({shot, frames, accent, isLast}) => {
	const frame = useCurrentFrame();
	const st = Math.round(DISSOLVE * 0.6);
	const out = isLast ? 1 : 1 - fade(frame, frames - 12, frames);
	const top = shot.textY ?? 330;
	const kickerP = fade(frame, st, st + 18);
	return (
		<AbsoluteFill style={{opacity: out}}>
			<div style={{position: 'absolute', top, left: SIDE_L, right: SIDE_R, textAlign: 'center', color: CREAM}}>
				{shot.kicker && (
					<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginBottom: 26, opacity: kickerP}}>
						<div style={{height: 2, width: 70 * kickerP, background: accent, opacity: 0.8}} />
						<div style={{fontFamily: F_CAPS, fontWeight: 500, fontSize: 30, letterSpacing: 10, color: accent, textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,0.8)'}}>
							{shot.kicker}
						</div>
						<div style={{height: 2, width: 70 * kickerP, background: accent, opacity: 0.8}} />
					</div>
				)}
				{shot.stat && (
					<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10}}>
						<Laurel side={1} p={fade(frame, st, st + 40)} color={accent} />
						<div
							style={{
								fontFamily: F_SERIF,
								fontWeight: 900,
								fontSize: 280,
								lineHeight: 1,
								color: accent,
								opacity: fade(frame, st + 4, st + 24),
								transform: `scale(${interpolate(fade(frame, st + 4, st + 40), [0, 1], [1.25, 1])})`,
								textShadow: '0 10px 60px rgba(0,0,0,0.6)',
							}}
						>
							{shot.stat.value}
						</div>
						<Laurel side={-1} p={fade(frame, st, st + 40)} color={accent} />
					</div>
				)}
				{shot.stat && (
					<div style={{fontFamily: F_CAPS, fontWeight: 500, fontSize: 46, letterSpacing: 6, textTransform: 'uppercase', opacity: fade(frame, st + 20, st + 40)}}>
						{shot.stat.label}
					</div>
				)}
				{shot.stat?.sub && (
					<div style={{fontFamily: F_TEXT, fontWeight: 500, fontSize: 36, marginTop: 12, opacity: 0.8 * fade(frame, st + 34, st + 54)}}>{shot.stat.sub}</div>
				)}
				{shot.title && (
					<RevealText
						text={shot.title}
						start={st + (shot.kicker ? 8 : 0)}
						style={{
							fontFamily: F_SERIF,
							fontWeight: 900,
							fontSize: shot.titleSize ?? 96,
							lineHeight: 1.08,
							textShadow: '0 6px 40px rgba(0,0,0,0.75), 0 2px 6px rgba(0,0,0,0.6)',
						}}
					/>
				)}
				{shot.text && (
					<div
						style={{
							fontFamily: F_TEXT,
							fontWeight: 500,
							fontSize: 38,
							lineHeight: 1.35,
							marginTop: 26,
							color: 'rgba(243,234,216,0.88)',
							textShadow: '0 2px 16px rgba(0,0,0,0.85)',
							opacity: fade(frame, st + 26, st + 46),
						}}
					>
						{shot.text}
					</div>
				)}
				{shot.credits && (
					<div style={{marginTop: 50, display: 'flex', flexDirection: 'column', gap: 30}}>
						{shot.credits.map((c, i) => {
							const p = fade(frame, st + 30 + i * 14, st + 50 + i * 14);
							return (
								<div key={i} style={{opacity: p, transform: `translateY(${(1 - p) * 12}px)`}}>
									<div style={{fontFamily: F_CAPS, fontWeight: 500, fontSize: 26, letterSpacing: 6, color: accent, textTransform: 'uppercase'}}>{c.role}</div>
									<div style={{fontFamily: F_SERIF, fontWeight: 700, fontSize: 54, marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.15}}>{c.name}</div>
								</div>
							);
						})}
					</div>
				)}
				{shot.cta && (
					<div style={{marginTop: 56, opacity: fade(frame, st + 50, st + 70)}}>
						<span
							style={{
								display: 'inline-block',
								border: `2px solid ${accent}`,
								color: accent,
								fontFamily: F_CAPS,
								fontWeight: 500,
								fontSize: 34,
								letterSpacing: 6,
								textTransform: 'uppercase',
								padding: '14px 40px',
								background: 'rgba(0,0,0,0.35)',
							}}
						>
							{shot.cta}
						</span>
					</div>
				)}
			</div>
		</AbsoluteFill>
	);
};

const norm = (w: string) => w.toLowerCase().replace(/[«»"“”.,!?;:—…]/g, '');
const clean = (w: string) => w.replace(/[.,;:!?…]+$/g, '').replace(/^[—]$/, '');

type Phrase = {words: Word[]; start: number; end: number};
/** Слова озвучки → фразы для экрана: по знакам препинания, до 5 слов / ~26 символов */
const toPhrases = (words: Word[]): Phrase[] => {
	const out: Phrase[] = [];
	let cur: Word[] = [];
	const flush = () => {
		if (cur.length) out.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
		cur = [];
	};
	for (const w of words) {
		const len = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length;
		if (cur.length >= 5 || (cur.length >= 2 && len > 26)) flush();
		cur.push(w);
		if (/[.!?…]»?$/.test(w.text)) flush();
		else if (/[,;:—]»?$/.test(w.text) && cur.length >= 2) flush();
	}
	flush();
	return out;
};

/** Кинетическая типографика: слова проявляются ровно под голос, ключевые — крупнее и тёплым цветом */
const KineticText: React.FC<{words: Word[]; emphasis: string[]; accent: string; frames: number; top: number; finalTitle?: boolean}> = ({words, emphasis, accent, frames, top, finalTitle}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const phrases = useMemo(() => toPhrases(words), [words]);
	const emph = useMemo(() => new Set(emphasis.map(norm)), [emphasis]);
	const t = (frame - AUDIO_DELAY) / fps;
	const lastW = words[words.length - 1];
	const lastEnd = finalTitle ? AUDIO_DELAY + (lastW?.end ?? 0) * fps + 4 : frames - 4;
	const idx = phrases.findIndex((ph, i) => {
		const next = phrases[i + 1];
		return t >= ph.start - 0.12 && (next ? t < next.start - 0.06 : frame < lastEnd);
	});
	if (idx < 0) return null;
	const ph = phrases[idx];
	const next = phrases[idx + 1];
	const endF = next ? AUDIO_DELAY + (next.start - 0.06) * fps : lastEnd;
	const out = interpolate(frame, [endF - 7, endF], [1, 0], clamp);
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: SIDE_L,
				right: SIDE_R,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				alignItems: 'baseline',
				columnGap: 22,
				rowGap: 4,
				opacity: out,
				transform: `translateY(${(1 - out) * -24}px)`,
				filter: `blur(${(1 - out) * 6}px)`,
			}}
		>
			{ph.words.map((w, i) => {
				const isE = emph.has(norm(w.text));
				const st = AUDIO_DELAY + (w.start - 0.06) * fps;
				const p = interpolate(frame, [st, st + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
				const pop = isE ? interpolate(frame, [st, st + 14], [1.3, 1], {...clamp, easing: Easing.out(Easing.back(2))}) : 1;
				const text = clean(w.text);
				if (!text) return null;
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							fontFamily: F_SERIF,
							fontWeight: isE ? 900 : 700,
							fontSize: isE ? 122 : 96,
							lineHeight: 1.12,
							color: isE ? accent : CREAM,
							opacity: p,
							transform: `translateY(${(1 - p) * 30}px) scale(${pop})`,
							filter: `blur(${(1 - p) * 10}px)`,
							textShadow: isE
								? `0 0 40px ${accent}66, 0 6px 30px rgba(0,0,0,0.85)`
								: '0 6px 30px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.6)',
						}}
					>
						{text}
					</span>
				);
			})}
		</div>
	);
};

/** Финальный титр */
const FinalTitle: React.FC<{text: string; start: number; accent: string}> = ({text, start, accent}) => {
	const frame = useCurrentFrame();
	const line = interpolate(frame, [start + 10, start + 40], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<div style={{position: 'absolute', top: 470, left: SIDE_L, right: SIDE_R, textAlign: 'center', color: CREAM}}>
			<RevealText text={text} start={start} stagger={2} style={{fontFamily: F_SERIF, fontWeight: 900, fontSize: 132, lineHeight: 1, textShadow: '0 8px 50px rgba(0,0,0,0.8)'}} />
			<div style={{margin: '28px auto 0', height: 2, width: 260 * line, background: accent, opacity: 0.8}} />
		</div>
	);
};

/** Плёнка: зерно, виньетка, мерцание, пылинки, каше */
const FilmLook: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const seed = frame % 8;
	const flicker = 0.035 * (random(`fl${frame}`) - 0.5);
	const bars = interpolate(frame, [0, 30], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const specks = Array.from({length: 3}).filter((_, i) => random(`sp${frame}-${i}`) > 0.82);
	const fadeIn = 1 - interpolate(frame, [0, 24], [0, 1], clamp);
	const fadeOut = interpolate(frame, [durationInFrames - 40, durationInFrames - 1], [0, 1], clamp);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{/* тёплый грейд + виньетка */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(40,60,90,0.18), rgba(255,170,90,0.08))', mixBlendMode: 'soft-light'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
			<AbsoluteFill style={{background: flicker > 0 ? `rgba(255,240,210,${flicker})` : `rgba(0,0,0,${-flicker})`}} />
			{/* зерно (в половинном разрешении — крупнее и быстрее) */}
			<svg width={540} height={960} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, opacity: 0.13, mixBlendMode: 'overlay'}}>
				<filter id={`grain${seed}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#grain${seed})`} />
			</svg>
			{specks.map((_, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: random(`sx${frame}${i}`) * 1000,
						top: random(`sy${frame}${i}`) * 1800,
						width: 3 + random(`sw${frame}${i}`) * 5,
						height: 3 + random(`sh${frame}${i}`) * 14,
						borderRadius: 4,
						background: 'rgba(240,230,210,0.5)',
					}}
				/>
			))}
			{/* каше: широкий экран */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120 * bars, background: '#000'}} />
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 * bars, background: '#000'}} />
			<AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut)}} />
		</AbsoluteFill>
	);
};

/** Лёгкое дрожание кадра, как у проектора */
const GateWeave: React.FC<{children: React.ReactNode}> = ({children}) => {
	const frame = useCurrentFrame();
	const k = Math.floor(frame / 2);
	const dx = (random(`gx${k}`) - 0.5) * 2;
	const dy = (random(`gy${k}`) - 0.5) * 2.5;
	return <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(1.004)`}}>{children}</AbsoluteFill>;
};

const ShotView: React.FC<{shot: CinemaShot; frames: number; total: number; first: boolean}> = ({shot, frames, total, first}) => {
	const frame = useCurrentFrame();
	const op = first ? 1 : interpolate(frame, [0, DISSOLVE], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	return (
		<AbsoluteFill style={{opacity: op}}>
			<SetView set={shot.set} frame={frame} frames={total} />
		</AbsoluteFill>
	);
};

export const CinemaVideo: React.FC<CinemaProps> = ({scenes, accent = '#e3b46a', music, musicVolume = 0.25, showCaptions = true}) => {
	const {durationInFrames} = useVideoConfig();
	const timeline = useMemo(() => {
		let from = 0;
		return scenes.map((shot, i) => {
			const isLast = i === scenes.length - 1;
			const frames = shotFrames(shot, isLast);
			const words = shot.words ?? estimateWords(shot.voice, shot.duration ?? estimateDuration(shot.voice));
			const item = {shot, from, frames, words, isLast};
			from += frames;
			return item;
		});
	}, [scenes]);

	return (
		<AbsoluteFill style={{background: '#000'}}>
			<GateWeave>
				{timeline.map(({shot, from, frames, isLast}, i) => (
					<Sequence key={`v${i}`} from={from} durationInFrames={frames + (isLast ? 0 : DISSOLVE)} name={`${i + 1}. ${shot.set}`}>
						<ShotView shot={shot} frames={frames} total={frames + (isLast ? 0 : DISSOLVE)} first={i === 0} />
					</Sequence>
				))}
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 22%, rgba(0,0,0,0) 42%)'}} />
				{timeline.map(({shot, from, frames, words, isLast}, i) => (
					<Sequence key={`t${i}`} from={from} durationInFrames={frames} name={`${i + 1}. текст`}>
						{(shot.title || shot.stat || shot.credits) && <Titles shot={shot} frames={frames} accent={accent} isLast={isLast} />}
						{showCaptions && <KineticText words={words} emphasis={shot.emphasis ?? []} accent={accent} frames={frames} top={shot.textY ?? 290} finalTitle={Boolean(shot.finalTitle)} />}
						{shot.finalTitle && (
							<FinalTitle text={shot.finalTitle} accent={accent} start={AUDIO_DELAY + Math.ceil((shot.words?.[shot.words.length - 1]?.end ?? shot.duration ?? estimateDuration(shot.voice)) * FPS) + 14} />
						)}
						{shot.audio && (
							<Sequence from={AUDIO_DELAY}>
								<Audio src={staticFile(shot.audio)} />
							</Sequence>
						)}
					</Sequence>
				))}
			</GateWeave>
			{timeline.flatMap(({shot, from}, i) =>
				(shot.sfx ?? []).map((fx, k) => {
					const len = Math.ceil(fx.duration * FPS);
					return (
						<Sequence key={`fx${i}-${k}`} from={from + Math.round(fx.at * FPS)} durationInFrames={len} name={`звук ${i + 1}.${k + 1}`}>
							<Audio src={staticFile(fx.src)} volume={(f) => fx.volume * interpolate(f, [0, 6, len - 18, len], [0, 1, 1, 0], clamp)} />
						</Sequence>
					);
				}),
			)}
			<FilmLook />
			{music && (
				<Audio
					src={staticFile(music)}
					loop
					volume={(f) => {
						// приглушаем музыку под голосом
						const near = Math.max(
							0,
							...timeline.map((t) => {
								const a = t.from + AUDIO_DELAY;
								const b = a + (t.shot.duration ?? 0) * FPS;
								const d = f < a ? a - f : f > b ? f - b : 0;
								return Math.max(0, 1 - d / 15);
							}),
						);
						return (
							musicVolume *
							(1 - 0.45 * near) *
							interpolate(f, [0, 30, durationInFrames - 60, durationInFrames - 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
						);
					}}
				/>
			)}
		</AbsoluteFill>
	);
};
