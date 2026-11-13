import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT_BODY, FONT_DISPLAY, SAFE, type Theme} from '../theme';

export const useSpring = (delay = 0, damping = 16) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - delay, fps, config: {damping, stiffness: 160, mass: 0.8}});
};

/** Появление снизу с размытием */
export const Rise: React.FC<{delay?: number; children: React.ReactNode; dist?: number; style?: React.CSSProperties}> = ({
	delay = 0,
	children,
	dist = 60,
	style,
}) => {
	const p = useSpring(delay);
	return (
		<div
			style={{
				transform: `translateY(${interpolate(p, [0, 1], [dist, 0])}px)`,
				opacity: p,
				filter: `blur(${interpolate(p, [0, 1], [12, 0])}px)`,
				...style,
			}}
		>
			{children}
		</div>
	);
};

/** Зона контента сцены — выше субтитров и вне интерфейса соцсетей */
export const Stage: React.FC<{children: React.ReactNode; align?: 'center' | 'start'}> = ({children, align = 'center'}) => (
	<div
		style={{
			position: 'absolute',
			top: SAFE.top,
			left: SAFE.left,
			right: SAFE.right,
			height: 1180 - SAFE.top,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: align === 'center' ? 'center' : 'flex-start',
			alignItems: 'flex-start',
			gap: 36,
		}}
	>
		{children}
	</div>
);

export const Tag: React.FC<{theme: Theme; children: React.ReactNode}> = ({theme, children}) => (
	<div
		style={{
			fontFamily: FONT_BODY,
			fontWeight: 800,
			fontSize: 30,
			letterSpacing: 4,
			textTransform: 'uppercase',
			color: theme.bg[0],
			background: theme.accent,
			padding: '12px 26px',
			borderRadius: 999,
		}}
	>
		{children}
	</div>
);

export const Headline: React.FC<{size?: number; children: React.ReactNode; color?: string}> = ({
	size = 84,
	children,
	color = 'white',
}) => (
	<div
		style={{
			fontFamily: FONT_DISPLAY,
			fontWeight: 800,
			fontSize: size,
			lineHeight: 1.08,
			letterSpacing: -1,
			color,
			textWrap: 'balance',
		}}
	>
		{children}
	</div>
);

export const Body: React.FC<{theme: Theme; size?: number; children: React.ReactNode}> = ({theme, size = 44, children}) => (
	<div
		style={{
			fontFamily: FONT_BODY,
			fontWeight: 600,
			fontSize: size,
			lineHeight: 1.35,
			color: theme.muted,
			textWrap: 'pretty',
		}}
	>
		{children}
	</div>
);

export const Card: React.FC<{theme: Theme; children: React.ReactNode; style?: React.CSSProperties}> = ({
	theme,
	children,
	style,
}) => (
	<div
		style={{
			background: theme.card,
			border: `2px solid ${theme.cardBorder}`,
			borderRadius: 44,
			padding: '52px 56px',
			backdropFilter: 'blur(20px)',
			boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
			width: '100%',
			boxSizing: 'border-box',
			...style,
		}}
	>
		{children}
	</div>
);

/** Подсвечивает слово-акцент в строке */
export const withAccent = (text: string, accent: string | undefined, color: string) => {
	if (!accent) return text;
	const i = text.toLowerCase().indexOf(accent.toLowerCase());
	if (i < 0) return text;
	return (
		<>
			{text.slice(0, i)}
			<span style={{color}}>{text.slice(i, i + accent.length)}</span>
			{text.slice(i + accent.length)}
		</>
	);
};
