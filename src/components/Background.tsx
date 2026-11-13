import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../theme';

const Blob: React.FC<{color: string; seed: number; size: number}> = ({color, seed, size}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const t = frame / 30;
	const bx = random(`x${seed}`) * width;
	const by = random(`y${seed}`) * height;
	const sp = 0.15 + random(`s${seed}`) * 0.2;
	const x = bx + Math.sin(t * sp + seed) * 220;
	const y = by + Math.cos(t * sp * 0.8 + seed * 2) * 280;
	return (
		<div
			style={{
				position: 'absolute',
				left: x - size / 2,
				top: y - size / 2,
				width: size,
				height: size,
				background: `radial-gradient(circle at center, ${color} 0%, ${color}00 65%)`,
				opacity: 0.5,
			}}
		/>
	);
};

const Particles: React.FC = () => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill>
			{new Array(28).fill(0).map((_, i) => {
				const x = random(`px${i}`) * width;
				const speed = 0.4 + random(`ps${i}`) * 1.2;
				const y = (random(`py${i}`) * height - frame * speed + height * 10) % height;
				const r = 2 + random(`pr${i}`) * 4;
				const o = 0.15 + random(`po${i}`) * 0.35;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: r,
							height: r,
							borderRadius: '50%',
							background: 'white',
							opacity: o,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

export const Background: React.FC<{theme: Theme}> = ({theme}) => {
	return (
		<AbsoluteFill
			style={{background: `linear-gradient(160deg, ${theme.bg[0]} 0%, ${theme.bg[1]} 100%)`}}
		>
			<Blob color={theme.blobs[0]} seed={1} size={1500} />
			<Blob color={theme.blobs[1]} seed={2} size={1300} />
			<Blob color={theme.blobs[2]} seed={3} size={1200} />
			<Particles />
			{/* лёгкое зерно для "киношности" */}
			<AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
				<svg width="100%" height="100%">
					<filter id="grain">
						<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
					</filter>
					<rect width="100%" height="100%" filter="url(#grain)" />
				</svg>
			</AbsoluteFill>
			{/* виньетка */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};
