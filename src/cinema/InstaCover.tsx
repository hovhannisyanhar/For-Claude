// Обложка Reels для Instagram: одна интригующая фраза на размытом градиенте.
// Верхняя строка — тонкий гротеск в разрядку, главная — крупная контрастная антиква.
// Всё важное — в центральной зоне 3:4 (y 240–1680), которую Instagram показывает в сетке профиля.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFonts} from '../fonts';

loadFonts();

export type Glow = {x: number; y: number; r: number; color: string; opacity?: number};
export type InstaCoverProps = {
	/** Верхняя строка: тонкий шрифт, разрядка */
	top: string;
	/** Главная фраза (можно \n) */
	main: string;
	/** Цвета фона сверху вниз */
	base?: string[];
	/** Размытые цветные пятна (боке) */
	glows?: Glow[];
	textColor?: string;
	/** Размер главной фразы, px */
	mainSize?: number;
};

export const InstaCover: React.FC<InstaCoverProps> = ({
	top,
	main,
	base = ['#0b1a2a', '#0f3550', '#123a55', '#0b1e33'],
	glows = [
		{x: 230, y: 1650, r: 520, color: '#c98a3c', opacity: 0.75},
		{x: 930, y: 1330, r: 420, color: '#9c4466', opacity: 0.6},
		{x: 720, y: 220, r: 420, color: '#1f5a78', opacity: 0.5},
	],
	textColor = '#f8f1e4',
	mainSize = 150,
}) => (
	<AbsoluteFill style={{background: `linear-gradient(180deg, ${base.join(', ')})`}}>
		{glows.map((g, i) => (
			<div
				key={i}
				style={{
					position: 'absolute',
					left: g.x - g.r,
					top: g.y - g.r,
					width: g.r * 2,
					height: g.r * 2,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${g.color} 0%, ${g.color}00 70%)`,
					opacity: g.opacity ?? 0.6,
					filter: 'blur(40px)',
				}}
			/>
		))}
		{/* мягкое зерно, чтобы градиент не «полосил» */}
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay'}}>
			<filter id="g">
				<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={3} />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width="100%" height="100%" filter="url(#g)" />
		</svg>
		{/* Текст всегда на одной высоте и одного размера — чтобы обложки в сетке профиля стояли ровно.
		    Верхняя строка: базовая линия ~y 770; главная фраза начинается с y 800 (1–2 строки). Всё внутри зоны 3:4 (y 240–1680). */}
		<div style={{position: 'absolute', left: 60, right: 60, top: 700, textAlign: 'center', color: textColor}}>
			<div style={{fontFamily: 'Montserrat', fontWeight: 300, fontSize: 60, lineHeight: '80px', height: 80, letterSpacing: '0.32em', marginRight: '-0.32em', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>
				{top}
			</div>
			<div
				style={{
					marginTop: 20,
					fontFamily: 'Playfair Display',
					fontWeight: 900,
					fontSize: mainSize,
					lineHeight: 1.0,
					textTransform: 'uppercase',
					whiteSpace: 'pre-line',
					textShadow: '0 10px 50px rgba(0,0,0,0.35)',
				}}
			>
				{main}
			</div>
		</div>
	</AbsoluteFill>
);
