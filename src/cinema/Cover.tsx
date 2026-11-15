// Шрифтовая обложка ролика: крупное название + подпись на атмосферном градиенте.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFonts} from '../fonts';

loadFonts();

export type CoverProps = {
	title: string;
	subtitle?: string;
	kicker?: string;
	note?: string;
	/** Пара шрифтов: script — рукописный + тонкий гротеск; display — контрастная антиква; serif — антиква курсивом */
	font?: 'script' | 'display' | 'serif';
	/** Цвета градиента: [верх, середина, свечение снизу, акцент] */
	gradient?: [string, string, string, string];
	ink?: string;
};

const PAIRS = {
	script: {title: {fontFamily: 'Great Vibes', fontWeight: 400, fontSize: 330, lineHeight: 1.1, letterSpacing: 0}, sub: {fontFamily: 'Jost', fontWeight: 300, fontSize: 64, letterSpacing: '0.04em'}},
	display: {title: {fontFamily: 'Yeseva One', fontWeight: 400, fontSize: 250, lineHeight: 1, letterSpacing: '0.01em'}, sub: {fontFamily: 'Tenor Sans', fontWeight: 400, fontSize: 58, letterSpacing: '0.06em'}},
	serif: {title: {fontFamily: 'Cormorant Garamond', fontWeight: 600, fontStyle: 'italic', fontSize: 290, lineHeight: 1, letterSpacing: '-0.01em'}, sub: {fontFamily: 'Jost', fontWeight: 300, fontSize: 60, letterSpacing: '0.18em', textTransform: 'uppercase'}},
} as const;

export const CinemaCover: React.FC<CoverProps> = ({title, subtitle, kicker, note, font = 'script', gradient = ['#08142b', '#12506a', '#f0a050', '#c2455e'], ink = '#fbf3e4'}) => {
	const [top, mid, glow, acc] = gradient;
	const pair = PAIRS[font];
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${top} 100%)`, overflow: 'hidden'}}>
			{/* атмосферные пятна света */}
			<AbsoluteFill style={{background: `radial-gradient(60% 38% at 22% 92%, ${glow}cc 0%, ${glow}00 70%)`}} />
			<AbsoluteFill style={{background: `radial-gradient(55% 30% at 85% 70%, ${acc}99 0%, ${acc}00 70%)`}} />
			<AbsoluteFill style={{background: `radial-gradient(70% 35% at 70% 8%, ${mid}cc 0%, ${mid}00 70%)`}} />
			<AbsoluteFill style={{background: `radial-gradient(45% 22% at 50% 47%, ${ink}22 0%, ${ink}00 70%)`}} />
			{/* зерно */}
			<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.22, mixBlendMode: 'overlay'}}>
				<filter id="cover-grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#cover-grain)" />
			</svg>
			{/* виньетка */}
			<AbsoluteFill style={{background: 'radial-gradient(85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
			{/* текст: в центре кадра, вне зоны интерфейса */}
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 140, color: ink, textAlign: 'center'}}>
				{kicker && (
					<div style={{fontFamily: 'Jost', fontWeight: 400, fontSize: 34, letterSpacing: '0.42em', textTransform: 'uppercase', opacity: 0.8, marginBottom: font === 'script' ? 10 : 40, paddingLeft: '0.42em'}}>{kicker}</div>
				)}
				<div style={{...pair.title, textShadow: `0 0 60px ${glow}66, 0 10px 40px rgba(0,0,0,0.45)`, padding: '0 60px'} as React.CSSProperties}>{title}</div>
				{subtitle && <div style={{...pair.sub, marginTop: font === 'script' ? -10 : 34, opacity: 0.95, maxWidth: 860, lineHeight: 1.25} as React.CSSProperties}>{subtitle}</div>}
				{note && (
					<div style={{marginTop: 70, display: 'flex', alignItems: 'center', gap: 22, fontFamily: 'Tenor Sans', fontSize: 30, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.75}}>
						<span style={{width: 70, height: 1, background: ink, opacity: 0.6}} />
						{note}
						<span style={{width: 70, height: 1, background: ink, opacity: 0.6}} />
					</div>
				)}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
