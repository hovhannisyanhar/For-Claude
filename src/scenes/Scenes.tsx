import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {FONT_BODY, FONT_DISPLAY, type Theme} from '../theme';
import type {CompareScene, FactScene, HookScene, ListScene, OutroScene, StatScene} from '../types';
import {Body, Card, Headline, Rise, Stage, Tag, useSpring, withAccent} from '../components/ui';

type P<T> = {scene: T; theme: Theme; frames: number};

/* ---------- HOOK: крупный кинетический текст, слова влетают по очереди ---------- */
export const Hook: React.FC<P<HookScene>> = ({scene, theme}) => {
	const frame = useCurrentFrame();
	const words = scene.text.split(/\s+/);
	const ring = useSpring(2, 20);
	const pulse = 1 + Math.sin(frame / 7) * 0.03;
	const size = scene.text.length > 40 ? 92 : scene.text.length > 24 ? 108 : 128;
	return (
		<Stage>
			<div
				style={{
					position: 'absolute',
					right: -60,
					top: 40,
					width: 420,
					height: 420,
					borderRadius: '50%',
					border: `14px solid ${theme.accent}`,
					opacity: 0.35 * ring,
					transform: `scale(${ring * pulse})`,
				}}
			/>
			<div
				style={{
					fontFamily: FONT_DISPLAY,
					fontWeight: 900,
					fontSize: size,
					lineHeight: 1.02,
					letterSpacing: -2,
					color: theme.text,
					textTransform: 'uppercase',
					display: 'flex',
					flexWrap: 'wrap',
					columnGap: '0.25em',
				}}
			>
				{words.map((w, i) => {
					const isAccent =
						scene.accent && scene.accent.toLowerCase().split(/\s+/).includes(w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''));
					return (
						<Rise key={i} delay={i * 3} dist={90}>
							<span style={{color: isAccent ? theme.accent : theme.text}}>{w}</span>
						</Rise>
					);
				})}
			</div>
		</Stage>
	);
};

/* ---------- STAT: счётчик числа ---------- */
const parseNum = (v: string) => {
	const normalized = v.replace(/[\s  ]/g, '').replace(',', '.');
	const n = parseFloat(normalized);
	const decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0;
	return {n: Number.isFinite(n) ? n : null, decimals};
};
const fmt = (n: number, decimals: number) =>
	n
		.toFixed(decimals)
		.replace('.', ',')
		.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const Stat: React.FC<P<StatScene>> = ({scene, theme, frames}) => {
	const frame = useCurrentFrame();
	const {n, decimals} = parseNum(scene.value);
	const countDur = Math.min(45, frames * 0.5);
	const progress = interpolate(frame, [4, 4 + countDur], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});
	const shown = n === null ? scene.value : fmt(n * progress, decimals);
	const len = (scene.prefix ?? '').length + scene.value.length + (scene.suffix ?? '').length;
	// ширина цифры Unbounded Black ≈ 0.82em, доступно ~840px
	const size = Math.min(240, Math.floor(840 / (len * 0.82)));
	const bar = useSpring(10, 22);
	return (
		<Stage>
			<Rise>
				<div
					style={{
						fontFamily: FONT_DISPLAY,
						fontWeight: 900,
						fontSize: size,
						lineHeight: 1,
						letterSpacing: -4,
						color: theme.accent,
						whiteSpace: 'nowrap',
						textShadow: `0 0 80px ${theme.accent}55`,
						fontVariantNumeric: 'tabular-nums',
					}}
				>
					{scene.prefix}
					{shown}
					{scene.suffix}
				</div>
			</Rise>
			<div
				style={{
					height: 10,
					width: `${bar * 70}%`,
					borderRadius: 10,
					background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
				}}
			/>
			<Rise delay={8}>
				<Headline size={64}>{scene.label}</Headline>
			</Rise>
		</Stage>
	);
};

/* ---------- FACT: карточка с плашкой ---------- */
export const Fact: React.FC<P<FactScene>> = ({scene, theme}) => {
	return (
		<Stage>
			{scene.tag && (
				<Rise>
					<Tag theme={theme}>{scene.tag}</Tag>
				</Rise>
			)}
			<Rise delay={4}>
				<Card theme={theme}>
					<Headline size={scene.title.length > 50 ? 64 : 78}>{scene.title}</Headline>
					{scene.text && (
						<div style={{marginTop: 30}}>
							<Body theme={theme}>{scene.text}</Body>
						</div>
					)}
				</Card>
			</Rise>
		</Stage>
	);
};

/* ---------- LIST: пункты появляются по ходу речи ---------- */
export const List: React.FC<P<ListScene>> = ({scene, theme, frames}) => {
	const step = Math.max(8, Math.floor((frames * 0.7) / Math.max(1, scene.items.length)));
	return (
		<Stage>
			<Rise>
				<Headline size={74}>{scene.title}</Headline>
			</Rise>
			<div style={{display: 'flex', flexDirection: 'column', gap: 24, width: '100%'}}>
				{scene.items.map((it, i) => (
					<Rise key={i} delay={10 + i * step} dist={40}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 28,
								background: theme.card,
								border: `2px solid ${theme.cardBorder}`,
								borderRadius: 32,
								padding: '28px 34px',
							}}
						>
							<div
								style={{
									flex: '0 0 auto',
									width: 72,
									height: 72,
									borderRadius: 22,
									background: theme.accent,
									color: theme.bg[0],
									fontFamily: FONT_DISPLAY,
									fontWeight: 900,
									fontSize: 38,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{i + 1}
							</div>
							<div style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: 44, color: theme.text, lineHeight: 1.2}}>
								{it}
							</div>
						</div>
					</Rise>
				))}
			</div>
		</Stage>
	);
};

/* ---------- COMPARE: два столбца с растущими полосами ---------- */
export const Compare: React.FC<P<CompareScene>> = ({scene, theme}) => {
	const a = parseNum(scene.left.value).n;
	const b = parseNum(scene.right.value).n;
	const max = a !== null && b !== null ? Math.max(a, b) : null;
	const grow = useSpring(12, 24);
	const Col: React.FC<{side: {label: string; value: string}; v: number | null; color: string; delay: number}> = ({
		side,
		v,
		color,
		delay,
	}) => {
		const h = max && v !== null ? Math.max(0.08, v / max) : 1;
		return (
			<Rise delay={delay} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
				<div style={{fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 64, color}}>{side.value}</div>
				<div style={{height: 520, width: '100%', display: 'flex', alignItems: 'flex-end'}}>
					<div
						style={{
							width: '100%',
							height: `${h * grow * 100}%`,
							borderRadius: 30,
							background: `linear-gradient(180deg, ${color}, ${color}33)`,
							boxShadow: `0 0 60px ${color}44`,
						}}
					/>
				</div>
				<div style={{fontFamily: FONT_BODY, fontWeight: 800, fontSize: 40, color: theme.text, textAlign: 'center'}}>
					{side.label}
				</div>
			</Rise>
		);
	};
	return (
		<Stage>
			{scene.title && (
				<Rise>
					<Headline size={68}>{scene.title}</Headline>
				</Rise>
			)}
			<div style={{display: 'flex', gap: 40, width: '100%'}}>
				<Col side={scene.left} v={a} color={theme.accent2} delay={4} />
				<Col side={scene.right} v={b} color={theme.accent} delay={8} />
			</div>
		</Stage>
	);
};

/* ---------- OUTRO: призыв к действию ---------- */
export const Outro: React.FC<P<OutroScene>> = ({scene, theme}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const bounce = 1 + Math.max(0, Math.sin((frame / fps) * Math.PI * 1.5)) * 0.05;
	return (
		<Stage>
			<Rise>
				<Headline size={88}>{withAccent(scene.text, undefined, theme.accent)}</Headline>
			</Rise>
			{scene.cta && (
				<Rise delay={10}>
					<div
						style={{
							transform: `scale(${bounce})`,
							transformOrigin: 'left center',
							fontFamily: FONT_DISPLAY,
							fontWeight: 800,
							fontSize: 48,
							color: theme.bg[0],
							background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
							padding: '30px 52px',
							borderRadius: 999,
							boxShadow: `0 20px 60px ${theme.accent}55`,
						}}
					>
						{scene.cta}
					</div>
				</Rise>
			)}
		</Stage>
	);
};
