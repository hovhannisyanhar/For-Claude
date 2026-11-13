import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT_DISPLAY, SAFE, type Theme} from '../theme';
import {AUDIO_DELAY, chunkWords} from '../timing';
import type {Word} from '../types';

const clean = (s: string) => s.replace(/[«»"“”]/g, '');

/** Субтитры в стиле TikTok: 1–3 слова, текущее слово подсвечено */
export const Captions: React.FC<{words: Word[]; theme: Theme}> = ({words, theme}) => {
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
	const startFrame = AUDIO_DELAY + Math.round((chunk.start - 0.05) * fps);
	const pop = spring({frame: frame - startFrame, fps, config: {damping: 14, stiffness: 220}});
	const scale = interpolate(pop, [0, 1], [0.82, 1]);

	return (
		<AbsoluteFill
			style={{
				top: 1230,
				left: SAFE.left,
				right: SAFE.right,
				height: 260,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div
				style={{
					transform: `scale(${scale})`,
					opacity: pop,
					textAlign: 'center',
					fontFamily: FONT_DISPLAY,
					fontWeight: 800,
					fontSize: 60,
					lineHeight: 1.15,
					textTransform: 'uppercase',
					color: theme.text,
					WebkitTextStroke: '10px rgba(0,0,0,0.85)',
					paintOrder: 'stroke fill',
					textShadow: '0 8px 28px rgba(0,0,0,0.55)',
				}}
			>
				{chunk.words.map((w, i) => {
					const active = t >= w.start - 0.03 && t < w.end + 0.1;
					return (
						<span
							key={i}
							style={{
								color: active ? theme.accent : theme.text,
							}}
						>
							{clean(w.text)}
							{i < chunk.words.length - 1 ? ' ' : ''}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
