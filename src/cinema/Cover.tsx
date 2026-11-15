// Шрифтовая обложка ролика: фраза-хук из строк двух шрифтов и разных размеров на атмосферном градиенте.
// Название фильма и инфо на обложку не пишем. Регистр: либо всё капслоком, либо первая буква заглавная.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFonts} from '../fonts';

loadFonts();

export type CoverLine = {text: string; big?: boolean};
export type CoverProps = {
	lines: CoverLine[];
	/** script — крупное рукописным + мелкое тонким гротеском; display — крупное Yeseva One капслоком + мелкое Tenor Sans;
	 *  contrast — крупное тонким гротеском капслоком + мелкое рукописным */
	pair?: 'script' | 'display' | 'contrast';
	/** Цвета градиента: [фон, середина, свечение, акцент] */
	gradient?: [string, string, string, string];
	ink?: string;
	accent?: string;
};

type Style = React.CSSProperties;
const PAIRS: Record<NonNullable<CoverProps['pair']>, {big: Style; small: Style}> = {
	script: {
		big: {fontFamily: 'Great Vibes', fontSize: 270, lineHeight: 0.95},
		small: {fontFamily: 'Jost', fontWeight: 300, fontSize: 92, letterSpacing: '0.04em', lineHeight: 1.1},
	},
	display: {
		big: {fontFamily: 'Yeseva One', fontSize: 190, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.01em'},
		small: {fontFamily: 'Tenor Sans', fontSize: 70, letterSpacing: '0.32em', textTransform: 'uppercase', lineHeight: 1.4, paddingLeft: '0.32em'},
	},
	contrast: {
		big: {fontFamily: 'Jost', fontWeight: 300, fontSize: 200, lineHeight: 0.98, textTransform: 'uppercase', letterSpacing: '0.04em'},
		small: {fontFamily: 'Great Vibes', fontSize: 150, lineHeight: 1},
	},
};

/** Первая буква фразы заглавная (если не капслок) */
const capFirst = (lines: CoverLine[]) =>
	lines.map((l, i) => (i === 0 ? {...l, text: l.text.charAt(0).toUpperCase() + l.text.slice(1)} : l));

export const CinemaCover: React.FC<CoverProps> = ({lines, pair = 'script', gradient = ['#08142b', '#12506a', '#f0a050', '#c2455e'], ink = '#fbf3e4', accent = '#f3c27a'}) => {
	const [top, mid, glow, acc] = gradient;
	const P = PAIRS[pair];
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${top} 100%)`, overflow: 'hidden'}}>
			<AbsoluteFill style={{background: `radial-gradient(60% 38% at 22% 92%, ${glow}cc 0%, ${glow}00 70%)`}} />
			<AbsoluteFill style={{background: `radial-gradient(55% 30% at 85% 70%, ${acc}99 0%, ${acc}00 70%)`}} />
			<AbsoluteFill style={{background: `radial-gradient(70% 35% at 70% 8%, ${mid}cc 0%, ${mid}00 70%)`}} />
			<AbsoluteFill style={{background: `radial-gradient(50% 24% at 50% 46%, ${ink}26 0%, ${ink}00 70%)`}} />
			<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.22, mixBlendMode: 'overlay'}}>
				<filter id="cover-grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#cover-grain)" />
			</svg>
			<AbsoluteFill style={{background: 'radial-gradient(85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 140, textAlign: 'center'}}>
				{capFirst(lines).map((l, i) => (
					<div
						key={i}
						style={{
							...(l.big ? P.big : P.small),
							color: l.big && pair !== 'contrast' ? ink : pair === 'contrast' && !l.big ? accent : ink,
							textShadow: `0 0 60px ${glow}55, 0 10px 40px rgba(0,0,0,0.5)`,
							padding: '0 50px',
							whiteSpace: 'nowrap',
						}}
					>
						{l.text}
					</div>
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
