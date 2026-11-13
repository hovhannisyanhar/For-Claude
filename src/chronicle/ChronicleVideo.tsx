import React, {useMemo} from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Sequence,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {loadFonts} from '../fonts';
import {AUDIO_DELAY, chunkWords, estimateDuration, estimateWords, sceneFrames} from '../timing';
import type {Scene, Word} from '../types';
import type {ChroniclePage, ChronicleProps} from './types';
import {
	BLOCKS,
	ClipImage,
	F_MONO,
	F_POSTER,
	F_SERIF,
	HandNote,
	INK,
	Newspaper,
	PAPER,
	PosterHeadline,
	RansomText,
	Ruler,
	Stamp,
	TornBlock,
	TypeLabel,
	tornPolygon,
} from './Paper';

loadFonts();

const DEFAULT_BLOCK_TOP = 980;

const parseNum = (v: string) => {
	const s = v.replace(/[\s  ]/g, '').replace(',', '.');
	const n = parseFloat(s);
	return {n: Number.isFinite(n) ? n : null, dec: s.includes('.') ? s.split('.')[1].length : 0};
};
const fmt = (n: number, dec: number) =>
	n
		.toFixed(dec)
		.replace('.', ',')
		.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const StatCount: React.FC<{stat: NonNullable<ChroniclePage['stat']>; color: string; frames: number}> = ({stat, color, frames}) => {
	const frame = useCurrentFrame();
	const {n, dec} = parseNum(stat.value);
	const p = interpolate(frame, [8, 8 + Math.min(40, frames * 0.5)], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	const shown = n === null ? stat.value : fmt(n * p, dec);
	const len = (stat.prefix ?? '').length + stat.value.length + (stat.suffix ?? '').length;
	const size = Math.min(200, Math.floor(860 / (len * 0.62)));
	return (
		<div style={{position: 'absolute', left: 90, right: 150, top: stat.y ?? 1010, textAlign: 'center'}}>
			<div style={{fontFamily: F_SERIF, fontWeight: 900, fontSize: size, lineHeight: 1, color, whiteSpace: 'nowrap', opacity: Math.min(1, frame / 8)}}>
				{stat.prefix}
				{shown}
				{stat.suffix}
			</div>
			{stat.label && (
				<div
					style={{
						display: 'inline-block',
						marginTop: 14,
						background: '#f6f0e2',
						color: INK,
						fontFamily: F_MONO,
						fontSize: 32,
						letterSpacing: 2,
						textTransform: 'uppercase',
						padding: '6px 20px',
						transform: 'rotate(-1deg)',
						opacity: p,
					}}
				>
					{stat.label}
				</div>
			)}
		</div>
	);
};

/** Субтитры на бумажных полосках, текущее слово — маркером */
const TapeCaptions: React.FC<{words: Word[]; accent: string}> = ({words, accent}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = (frame - AUDIO_DELAY) / fps;
	const chunks = useMemo(() => chunkWords(words), [words]);
	const idx = chunks.findIndex((c, i) => {
		const next = chunks[i + 1];
		return t >= c.start - 0.05 && (next ? t < next.start - 0.05 : t < c.end + 0.6);
	});
	if (idx < 0) return null;
	const chunk = chunks[idx];
	const st = AUDIO_DELAY + Math.round((chunk.start - 0.05) * fps);
	const p = spring({frame: frame - st, fps, config: {damping: 15, stiffness: 260}});
	return (
		<div style={{position: 'absolute', left: 90, right: 150, top: 1345, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					background: '#f6f0e2',
					padding: '14px 28px',
					transform: `rotate(${idx % 2 ? 1.2 : -1.2}deg) scale(${interpolate(p, [0, 1], [0.85, 1])})`,
					opacity: p,
					boxShadow: '3px 6px 14px rgba(0,0,0,0.4)',
					clipPath: tornPolygon(`cap${idx}`, {left: true, right: true}, 1),
					fontFamily: F_POSTER,
					fontWeight: 700,
					fontSize: 58,
					lineHeight: 1.15,
					textTransform: 'uppercase',
					color: INK,
					textAlign: 'center',
				}}
			>
				{chunk.words.map((w, i) => {
					const active = t >= w.start - 0.03 && t < w.end + 0.1;
					return (
						<span key={i} style={{background: active ? accent : 'transparent', color: active ? PAPER : INK, padding: '0 6px'}}>
							{w.text.replace(/[«»"“”]/g, '')}
							{i < chunk.words.length - 1 ? ' ' : ''}
						</span>
					);
				})}
			</div>
		</div>
	);
};

const Page: React.FC<{
	page: ChroniclePage;
	prev?: ChroniclePage;
	frames: number;
	isLast: boolean;
	accent: string;
	index: number;
}> = ({page, prev, frames, isLast, accent, index}) => {
	const frame = useCurrentFrame();
	const blockTop = page.blockTop ?? DEFAULT_BLOCK_TOP;
	const sameBlock = prev && prev.block === page.block && (prev.blockTop ?? DEFAULT_BLOCK_TOP) === blockTop;
	const sameYear = prev?.year === page.year;
	const textOnBlock = page.block ? BLOCKS[page.block].text : INK;
	const out = isLast ? 1 : interpolate(frame, [frames - 6, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const zoom = interpolate(frame, [0, frames], [1, 1.03]);
	return (
		<AbsoluteFill>
			{page.block && <TornBlock color={page.block} top={blockTop} animate={!sameBlock} seed={`b${index}`} />}
			<AbsoluteFill style={{opacity: out, transform: `scale(${zoom})`}}>
				{page.year && <RansomText text={page.year} x={90} y={230} animate={!sameYear} seed="year" />}
				{(page.clips ?? []).map((c, i) => (
					<ClipImage key={i} clip={c} index={i} />
				))}
				{page.label && <TypeLabel text={page.label} y={page.labelY ?? 900} />}
				{page.headline && (
					<PosterHeadline text={page.headline} y={page.headlineY ?? blockTop + 50} color={textOnBlock} size={page.headlineSize} />
				)}
				{page.stat && <StatCount stat={page.stat} color={page.block ? textOnBlock : accent} frames={frames} />}
				{page.note && <HandNote text={page.note} y={page.noteY ?? blockTop + 60} color={textOnBlock} />}
				{page.stamp && (
					<Stamp
						text={page.stamp.text}
						sub={page.stamp.sub}
						x={page.stamp.x ?? 800}
						y={page.stamp.y ?? 300}
						rotate={page.stamp.rotate}
						color={page.block === 'red' && (page.stamp.y ?? 300) > blockTop ? PAPER : '#b3122e'}
					/>
				)}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const ChronicleVideo: React.FC<ChronicleProps> = ({scenes, accent = '#a8133a', music, musicVolume = 0.08, showCaptions = true, handle}) => {
	const frame = useCurrentFrame();
	const timeline = useMemo(() => {
		let from = 0;
		return scenes.map((page, i) => {
			const isLast = i === scenes.length - 1;
			const frames = sceneFrames(page as unknown as Scene, isLast);
			const words = page.words ?? estimateWords(page.voice, page.duration ?? estimateDuration(page.voice));
			const item = {page, from, frames, words, isLast};
			from += frames;
			return item;
		});
	}, [scenes]);

	const years = scenes.map((s) => parseInt(s.year ?? '', 10)).filter((n) => Number.isFinite(n));
	const yFrom = years.length ? Math.floor(Math.min(...years) / 10) * 10 - 2 : 1950;
	const yTo = years.length ? Math.ceil(Math.max(...years) / 10) * 10 + 2 : 2030;
	const curIdx = Math.max(0, timeline.findIndex((t, i) => frame >= t.from && (i === timeline.length - 1 || frame < timeline[i + 1].from)));
	const yearAt = (i: number): number => {
		for (let k = i; k >= 0; k--) {
			const y = parseInt(scenes[k].year ?? '', 10);
			if (Number.isFinite(y)) return y;
		}
		return years[0] ?? yFrom;
	};
	const curYear = yearAt(curIdx);
	const prevYear = curIdx > 0 ? yearAt(curIdx - 1) : curYear;

	return (
		<AbsoluteFill style={{background: '#d9cdb3'}}>
			<Newspaper />
			{years.length > 0 && <Ruler from={yFrom} to={yTo} year={curYear} prevYear={prevYear} sceneFrame={frame - timeline[curIdx].from} />}
			{timeline.map(({page, from, frames, words, isLast}, i) => (
				<Sequence key={i} from={from} durationInFrames={frames} name={`${i + 1}. ${page.year ?? ''} ${page.headline ?? page.label ?? ''}`}>
					<Page page={page} prev={scenes[i - 1]} frames={frames} isLast={isLast} accent={accent} index={i} />
					{showCaptions && <TapeCaptions words={words} accent={accent} />}
					{page.audio && (
						<Sequence from={AUDIO_DELAY}>
							<Audio src={staticFile(page.audio)} />
						</Sequence>
					)}
				</Sequence>
			))}
			{handle && (
				<div style={{position: 'absolute', right: 160, top: 60, fontFamily: F_MONO, fontSize: 24, color: 'rgba(29,26,22,0.6)'}}>{handle}</div>
			)}
			{music && <Audio src={staticFile(music)} volume={musicVolume} loop />}
		</AbsoluteFill>
	);
};
