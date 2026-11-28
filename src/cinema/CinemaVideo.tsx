import React, {useMemo} from 'react';
import {
	AbsoluteFill,
	Audio,
	Img,
	OffthreadVideo,
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
import {FinalTitle, KineticText, setKineticFonts} from './Kinetic';
import {KineticM} from './KineticM';
import type {CinemaProps, CinemaSet, CinemaShot} from './types';

loadFonts();

/** Растворение между планами, кадры */
export const DISSOLVE = 24;
const TAIL = 10;
const LAST_TAIL = 90;

/** Длительность финального кадра с обложкой */
export const POSTER_FRAMES = 135;
export const shotFrames = (s: CinemaShot, isLast: boolean, poster = false) =>
	AUDIO_DELAY + Math.ceil((s.duration ?? estimateDuration(s.voice)) * FPS) + (s.pause ?? TAIL) + (isLast && !poster ? LAST_TAIL : 0);
export const posterFrames = (poster?: CinemaProps['poster']) => (poster?.seconds ? Math.round(poster.seconds * 30) : POSTER_FRAMES);
export const cinemaTotal = (scenes: CinemaShot[], poster?: CinemaProps['poster']) =>
	scenes.reduce((a, s, i) => a + shotFrames(s, i === scenes.length - 1, Boolean(poster)), 0) + (poster ? posterFrames(poster) : 0);

const F_SANS = 'Manrope';

/** Финальный кадр: обложка фильма, название на русском и английском, год */
const PosterCard: React.FC<{poster: NonNullable<CinemaProps['poster']>; accent: string; frames?: number; brand?: string}> = ({poster, accent, frames, brand}) => {
	const frame = useCurrentFrame();
	const inP = interpolate(frame, [0, DISSOLVE], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const zoom = interpolate(frame, [0, frames ?? posterFrames(poster)], [1, 1.04]);
	const t1 = interpolate(frame, [18, 36], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const t2 = interpolate(frame, [28, 46], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const t3 = interpolate(frame, [44, 62], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
	return (
		<AbsoluteFill style={{opacity: inP, background: '#000'}}>
			<Img src={staticFile(poster.src)} style={{position: 'absolute', inset: -80, width: 1240, height: 2080, objectFit: 'cover', filter: 'blur(40px) brightness(0.32) saturate(0.9)'}} />
			<div style={{position: 'absolute', top: 230, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
				<Img
					src={staticFile(poster.src)}
					style={{width: 600, height: 890, objectFit: 'cover', borderRadius: 6, transform: `scale(${zoom})`, boxShadow: '0 30px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)'}}
				/>
			</div>
			<div style={{position: 'absolute', top: 1180, left: SIDE_L, right: SIDE_R - 70, textAlign: 'center', color: CREAM}}>
				<div style={{fontFamily: F_SANS, fontWeight: 800, fontSize: 56, lineHeight: 1.1, opacity: t1, transform: `translateY(${(1 - t1) * 16}px)`}}>{poster.titleRu}</div>
				<div style={{fontFamily: F_SANS, fontWeight: 700, fontSize: 34, marginTop: 12, letterSpacing: 1, opacity: 0.75 * t2, transform: `translateY(${(1 - t2) * 12}px)`}}>
					{poster.titleEn} · {poster.year}
				</div>
				{poster.cta && (
					<div style={{marginTop: 34, display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 34px', borderRadius: 999, background: accent, color: '#fff', fontFamily: F_SANS, fontWeight: 800, fontSize: 34, letterSpacing: 0.5, opacity: t3, transform: `scale(${0.9 + 0.1 * t3})`, boxShadow: '0 10px 30px rgba(0,0,0,0.45)'}}>
						{poster.cta}
						<span style={{fontSize: 36, transform: `scale(${1 + 0.18 * Math.max(0, Math.sin((frame - 60) / 5)) * (frame > 60 && frame < 80 ? 1 : 0)})`}}>❤</span>
					</div>
				)}
				{brand && (
					<div style={{marginTop: 26, fontFamily: "'Montserrat Var', Montserrat", fontWeight: 600, fontSize: 30, letterSpacing: 3, opacity: 0.6 * t3}}>{brand}</div>
				)}
			</div>
		</AbsoluteFill>
	);
};


/** Подпись канала: небольшая полупрозрачная надпись ближе к верхним углам (но с отступом от края), по сценам то слева, то справа:
 * только сверху над текстом (y≈235; внизу стоят персонажи), справа не дальше x≈820 (правые ~150px закрывает интерфейс).
 * Если в сцене место занято — `brandAt: [x, y]` в сцене сценария */
const BRAND_SPOTS: [number, number][] = [[215, 235], [800, 235]];
const BrandMark: React.FC<{text: string; index: number; frames: number; at?: [number, number]}> = ({text, index, frames, at}) => {
	const frame = useCurrentFrame();
	const [x, y] = at ?? BRAND_SPOTS[index % BRAND_SPOTS.length];
	const op = interpolate(frame, [DISSOLVE * 0.5, DISSOLVE, frames - 6, frames + DISSOLVE * 0.5], [0, 1, 1, 0], clamp);
	const dx = Math.sin(frame / 70 + index) * 4;
	const dy = Math.cos(frame / 90 + index * 2) * 3;
	return (
		<div style={{position: 'absolute', left: x + dx, top: y + dy, transform: 'translate(-50%, -50%)', opacity: 0.34 * op, color: '#fff', fontFamily: "'Montserrat Var', Montserrat", fontWeight: 600, fontSize: 30, letterSpacing: 3, whiteSpace: 'nowrap', textShadow: '0 1px 6px rgba(0,0,0,0.6)'}}>
			{text}
		</div>
	);
};

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

/** Плёнка: зерно, виньетка, мерцание, пылинки, каше */
const FilmLook: React.FC<{film?: boolean; grain?: boolean}> = ({film = false, grain = true}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	// чистый режим: неподвижное лёгкое зерно, без мерцания яркости и пылинок
	const seed = film ? frame % 8 : 3;
	const flicker = film ? 0.035 * (random(`fl${frame}`) - 0.5) : 0;
	const bars = interpolate(frame, [0, 30], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const specks = film ? Array.from({length: 3}).filter((_, i) => random(`sp${frame}-${i}`) > 0.82) : [];
	const fadeIn = 1 - interpolate(frame, [0, 24], [0, 1], clamp);
	const fadeOut = interpolate(frame, [durationInFrames - 22, durationInFrames - 1], [0, 1], clamp);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{/* тёплый грейд + виньетка */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(40,60,90,0.18), rgba(255,170,90,0.08))', mixBlendMode: 'soft-light'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />
			<AbsoluteFill style={{background: flicker > 0 ? `rgba(255,240,210,${flicker})` : `rgba(0,0,0,${-flicker})`}} />
			{/* зерно (в половинном разрешении — крупнее и быстрее) */}
			{(grain || film) && <svg width={540} height={960} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, opacity: film ? 0.13 : 0.07, mixBlendMode: 'overlay'}}>
				<filter id={`grain${seed}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#grain${seed})`} />
			</svg>}
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

/** Эксперимент: полоска прогресса вверху кадра */
const ProgressBar: React.FC<{color: string; total: number}> = ({color, total}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 9, background: 'rgba(255,255,255,0.18)'}}>
			<div style={{height: '100%', width: `${(frame / Math.max(1, total - 1)) * 100}%`, background: color, boxShadow: `0 0 14px ${color}`}} />
		</div>
	);
};

/** Лёгкое дрожание кадра, как у проектора */
const GateWeave: React.FC<{children: React.ReactNode; on?: boolean}> = ({children, on = false}) => {
	const frame = useCurrentFrame();
	if (!on) return <AbsoluteFill>{children}</AbsoluteFill>;
	const k = Math.floor(frame / 2);
	const dx = (random(`gx${k}`) - 0.5) * 2;
	const dy = (random(`gy${k}`) - 0.5) * 2.5;
	return <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(1.004)`}}>{children}</AbsoluteFill>;
};

const ShotView: React.FC<{shot: CinemaShot; frames: number; total: number; first: boolean}> = ({shot, frames, total, first}) => {
	const frame = useCurrentFrame();
	const op = first || shot.cut ? 1 : interpolate(frame, [0, DISSOLVE], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	return (
		<AbsoluteFill style={{opacity: op}}>
			{shot.clip ? <OffthreadVideo src={staticFile(shot.clip)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <SetView set={shot.set as CinemaSet} frame={frame} frames={total} />}
		</AbsoluteFill>
	);
};

export const CinemaVideo: React.FC<CinemaProps> = ({scenes, accent = '#e3b46a', music, musicVolume = 0.25, showCaptions = true, poster, fonts, film = false, grain = true, textStyle, brand, progress}) => {
	setKineticFonts(fonts);
	const {durationInFrames} = useVideoConfig();
	const timeline = useMemo(() => {
		let from = 0;
		return scenes.map((shot, i) => {
			const isLast = i === scenes.length - 1;
			const frames = shotFrames(shot, isLast, Boolean(poster));
			const words = shot.words ?? estimateWords(shot.voice, shot.duration ?? estimateDuration(shot.voice));
			const item = {shot, from, frames, words, isLast};
			from += frames;
			return item;
		});
	}, [scenes, poster]);
	const scenesEnd = timeline.length ? timeline[timeline.length - 1].from + timeline[timeline.length - 1].frames : 0;
	/** Постер начинается с первой сцены onPoster (её голос звучит поверх постера), иначе после всех сцен */
	const posterItem = poster ? timeline.find((t) => t.shot.onPoster) : undefined;
	const posterFrom = posterItem ? posterItem.from : scenesEnd;

	/** 1 — идёт речь, плавно спадает до 0 за полсекунды до/после */
	const speechNear = (f: number) =>
		Math.max(
			0,
			...timeline.map((t) => {
				const a = t.from + AUDIO_DELAY;
				const b = a + (t.shot.duration ?? 0) * FPS;
				const d = f < a ? a - f : f > b ? f - b : 0;
				return Math.max(0, 1 - d / 15);
			}),
		);

	return (
		<AbsoluteFill style={{background: '#000'}}>
			<GateWeave on={film}>
				{timeline.map(({shot, from, frames, isLast}, i) => (shot.onPoster && poster) ? null : (
					<Sequence key={`v${i}`} from={from} durationInFrames={frames + (isLast && !poster ? 0 : DISSOLVE)} name={`${i + 1}. ${shot.set}`}>
						<ShotView shot={shot} frames={frames} total={frames + (isLast && !poster ? 0 : DISSOLVE)} first={i === 0} />
					</Sequence>
				))}
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 22%, rgba(0,0,0,0) 42%)'}} />
				{timeline.map(({shot, from, frames, words, isLast}, i) => (
					<Sequence key={`t${i}`} from={from} durationInFrames={frames} name={`${i + 1}. текст`}>
						{(shot.title || shot.stat || shot.credits) && <Titles shot={shot} frames={frames} accent={accent} isLast={isLast} />}
						{showCaptions && !(shot.onPoster && poster) && textStyle && <KineticM words={words} emphasis={shot.emphasis ?? []} accent={accent} frames={frames} top={shot.textY ?? 290} seed={`k${i}`} variant={textStyle} />}
						{showCaptions && !(shot.onPoster && poster) && !textStyle && <KineticText words={words} emphasis={shot.emphasis ?? []} accent={accent} frames={frames} top={shot.textY ?? 290} finalTitle={Boolean(shot.finalTitle) && !poster} seed={`k${i}`} />}
						{shot.finalTitle && !poster && (
							<FinalTitle text={shot.finalTitle} accent={accent} start={AUDIO_DELAY + Math.ceil((shot.words?.[shot.words.length - 1]?.end ?? shot.duration ?? estimateDuration(shot.voice)) * FPS) + 14} />
						)}
						{brand && !(shot.onPoster && poster) && <BrandMark text={brand} index={i} frames={frames} at={shot.brandAt} />}
						{shot.audio && (
							<Sequence from={AUDIO_DELAY}>
								<Audio src={staticFile(shot.audio)} />
							</Sequence>
						)}
					</Sequence>
				))}
			</GateWeave>
			{poster && (
				<Sequence from={posterFrom} durationInFrames={scenesEnd - posterFrom + posterFrames(poster)} name="обложка">
					<PosterCard poster={poster} accent={accent} frames={scenesEnd - posterFrom + posterFrames(poster)} brand={brand} />
				</Sequence>
			)}
			{timeline.flatMap(({shot, from}, i) =>
				(shot.sfx ?? []).map((fx, k) => {
					const len = Math.ceil(fx.duration * FPS);
					return (
						<Sequence key={`fx${i}-${k}`} from={from + Math.round(fx.at * FPS)} durationInFrames={len} name={`звук ${i + 1}.${k + 1}`}>
							<Audio
								src={staticFile(fx.src)}
								volume={(f) => fx.volume * (1 - 0.4 * speechNear(from + Math.round(fx.at * FPS) + f)) * interpolate(f, [0, 6, len - 18, len], [0, 1, 1, 0], clamp)}
							/>
						</Sequence>
					);
				}),
			)}
			<FilmLook film={film} grain={grain} />
			{progress && <ProgressBar color={accent} total={durationInFrames} />}
			{music && (
				<Audio
					src={staticFile(music)}
					loop
					volume={(f) => {
						// приглушаем музыку под голосом
						const near = speechNear(f);
						return (
							musicVolume *
							(1 - 0.6 * near) *
							interpolate(f, [0, 30, durationInFrames - 60, durationInFrames - 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
						);
					}}
				/>
			)}
		</AbsoluteFill>
	);
};
