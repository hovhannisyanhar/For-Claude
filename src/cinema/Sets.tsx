// «Декорации» стиля «Кино»: атмосферные планы, нарисованные SVG.
// Всё детерминировано (random(seed)), анимация — от кадра сцены.
import React, {useMemo} from 'react';
import {Easing, interpolate, interpolateColors, random} from 'remotion';
import type {CinemaSet} from './types';

const W = 1080;
const H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type SetProps = {frame: number; frames: number};

/* ---------- примитивы ---------- */

/** Силуэт ели: ярусы «ёлочкой» + ствол */
const pinePath = (x: number, base: number, h: number, w: number, seed: string) => {
	const tiers = 6 + Math.floor(random(seed) * 4);
	const top = base - h;
	const left: string[] = [];
	const right: string[] = [];
	for (let i = 1; i <= tiers; i++) {
		const p = i / tiers;
		const y = top + h * 0.9 * p;
		const half = (w / 2) * (0.12 + 0.88 * Math.pow(p, 0.9)) * (0.85 + random(`${seed}-${i}`) * 0.3);
		const inner = half * 0.45;
		left.push(`L${x - half},${y} L${x - inner},${y - h * 0.035}`);
		right.unshift(`L${x + inner},${y - h * 0.035} L${x + half * (0.9 + random(`${seed}r${i}`) * 0.2)},${y}`);
	}
	const tw = Math.max(2, w * 0.06);
	return `M${x},${top} ${left.join(' ')} L${x - tw},${top + h * 0.9} L${x - tw},${base} L${x + tw},${base} L${x + tw},${top + h * 0.9} ${right.join(' ')} Z`;
};

/** Холм, поросший елями */
const Ridge: React.FC<{
	seed: string;
	base: number;
	amp: number;
	treeH: [number, number];
	count: number;
	color: string;
	x0?: number;
	x1?: number;
	/** false — только деревья, без заливки холма (для групп по краям) */
	hill?: boolean;
}> = ({seed, base, amp, treeH, count, color, x0 = -200, x1 = W + 200, hill: showHill = true}) => {
	const {hill, trees} = useMemo(() => {
		const yAt = (x: number) =>
			base -
			amp * (0.55 * Math.sin(x / 260 + random(seed) * 6) + 0.3 * Math.sin(x / 110 + random(seed + 'b') * 6) + 0.15 * Math.sin(x / 47));
		const pts: string[] = [];
		for (let x = x0; x <= x1; x += 20) pts.push(`L${x},${yAt(x)}`);
		const hillD = `M${x0},${H + 50} ${pts.join(' ')} L${x1},${H + 50} Z`;
		const tr: string[] = [];
		for (let i = 0; i < count; i++) {
			const x = x0 + random(`${seed}x${i}`) * (x1 - x0);
			const h = treeH[0] + random(`${seed}h${i}`) * (treeH[1] - treeH[0]);
			tr.push(pinePath(x, yAt(x) + 6, h, h * (0.32 + random(`${seed}w${i}`) * 0.12), `${seed}t${i}`));
		}
		return {hill: hillD, trees: tr.join(' ')};
	}, [seed, base, amp, treeH, count, x0, x1]);
	return (
		<g fill={color}>
			{showHill && <path d={hill} />}
			<path d={trees} />
		</g>
	);
};

/** Полоса тумана, дрейфующая по горизонтали */
const Fog: React.FC<{y: number; frame: number; speed?: number; opacity?: number; height?: number; seed: string; color?: string}> = ({
	y,
	frame,
	speed = 0.4,
	opacity = 0.35,
	height = 160,
	seed,
	color = '#c9d3e0',
}) => (
	<g>
		{Array.from({length: 5}).map((_, i) => {
			const span = W + 900;
			const x = ((random(`${seed}${i}`) * span + frame * speed * (0.7 + random(`${seed}s${i}`) * 0.6)) % span) - 450;
			return (
				<ellipse
					key={i}
					cx={x}
					cy={y + (random(`${seed}y${i}`) - 0.5) * height * 0.6}
					rx={380 + random(`${seed}r${i}`) * 260}
					ry={height * (0.5 + random(`${seed}q${i}`) * 0.4)}
					fill={`url(#fog-${color.slice(1)})`}
					opacity={opacity}
				/>
			);
		})}
	</g>
);

const FogDef: React.FC<{color: string}> = ({color}) => (
	<radialGradient id={`fog-${color.slice(1)}`}>
		<stop offset="0%" stopColor={color} stopOpacity={0.9} />
		<stop offset="60%" stopColor={color} stopOpacity={0.35} />
		<stop offset="100%" stopColor={color} stopOpacity={0} />
	</radialGradient>
);

const Glow: React.FC<{id: string; color: string; inner?: number}> = ({id, color, inner = 1}) => (
	<radialGradient id={id}>
		<stop offset="0%" stopColor={color} stopOpacity={inner} />
		<stop offset="35%" stopColor={color} stopOpacity={inner * 0.35} />
		<stop offset="100%" stopColor={color} stopOpacity={0} />
	</radialGradient>
);

const Stars: React.FC<{frame: number; count: number; maxY: number; seed: string}> = ({frame, count, maxY, seed}) => (
	<g>
		{Array.from({length: count}).map((_, i) => {
			const tw = 0.55 + 0.45 * Math.sin(frame / (6 + random(`${seed}f${i}`) * 14) + random(`${seed}p${i}`) * 6);
			const r = random(`${seed}r${i}`);
			return (
				<circle
					key={i}
					cx={random(`${seed}x${i}`) * W}
					cy={Math.pow(random(`${seed}y${i}`), 1.4) * maxY}
					r={r > 0.96 ? 2.6 : r > 0.8 ? 1.7 : 1.1}
					fill="#f2ecdc"
					opacity={tw * (0.35 + r * 0.6)}
				/>
			);
		})}
	</g>
);

type ParticleKind = 'dust' | 'snow' | 'leaf' | 'ember' | 'firefly';

const Particles: React.FC<{
	frame: number;
	count: number;
	kind: ParticleKind;
	seed: string;
	area?: [number, number, number, number];
	opacity?: number;
}> = ({frame, count, kind, seed, area = [0, 0, W, H], opacity = 1}) => {
	const [ax, ay, aw, ah] = area;
	return (
		<g opacity={opacity}>
			{Array.from({length: count}).map((_, i) => {
				const r1 = random(`${seed}a${i}`);
				const r2 = random(`${seed}b${i}`);
				const r3 = random(`${seed}c${i}`);
				const ph = r3 * Math.PI * 2;
				if (kind === 'dust') {
					const x = ax + ((r1 * aw + frame * (0.15 + r3 * 0.3) + 18 * Math.sin(frame / 50 + ph)) % aw);
					const y = ay + ((r2 * ah - frame * (0.1 + r1 * 0.25) + ah * 10) % ah);
					return <circle key={i} cx={x} cy={y} r={1.2 + r3 * 2.2} fill="#ffe7b8" opacity={0.25 + 0.5 * Math.abs(Math.sin(frame / 25 + ph))} />;
				}
				if (kind === 'snow') {
					const y = ay + ((r2 * ah + frame * (1.2 + r1 * 1.8)) % ah);
					const x = ax + ((r1 * aw + 22 * Math.sin(frame / 30 + ph) + frame * 0.4) % aw);
					return <circle key={i} cx={x} cy={y} r={1.5 + r3 * 3.5} fill="#f4f6fa" opacity={0.45 + r3 * 0.5} />;
				}
				if (kind === 'leaf') {
					const y = ay + ((r2 * ah + frame * (1.6 + r1 * 1.6)) % ah);
					const x = ax + ((r1 * aw + 50 * Math.sin(frame / 22 + ph) + frame * 0.9) % aw);
					const rot = (frame * (3 + r3 * 5) + r1 * 360) % 360;
					const col = ['#c9692c', '#a8441f', '#d9973a', '#7d3a1c'][i % 4];
					return <ellipse key={i} cx={x} cy={y} rx={9 + r3 * 6} ry={4 + r3 * 2} fill={col} transform={`rotate(${rot} ${x} ${y})`} opacity={0.85} />;
				}
				if (kind === 'ember') {
					const life = 60 + r1 * 60;
					const age = (frame + r2 * life) % life;
					const k = age / life;
					const x = ax + aw / 2 + (r3 - 0.5) * aw * 0.4 + Math.sin(age / 9 + ph) * 26 * k + (r1 - 0.5) * aw * k * 0.8;
					const y = ay + ah - k * ah;
					return <circle key={i} cx={x} cy={y} r={1.5 + r3 * 2.5} fill="#ffb347" opacity={(1 - k) * 0.95} />;
				}
				// firefly
				const x = ax + r1 * aw + 30 * Math.sin(frame / 40 + ph);
				const y = ay + r2 * ah + 20 * Math.cos(frame / 33 + ph);
				const blink = Math.max(0, Math.sin(frame / (14 + r3 * 10) + ph));
				return (
					<g key={i} opacity={blink}>
						<circle cx={x} cy={y} r={14} fill="url(#warm)" opacity={0.6} />
						<circle cx={x} cy={y} r={2.5} fill="#fff1b0" />
					</g>
				);
			})}
		</g>
	);
};

/** Клубы пара/дыма из точки */
const Smoke: React.FC<{
	frame: number;
	x: number;
	y: number;
	seed: string;
	color?: string;
	rate?: number;
	life?: number;
	drift?: number;
	size?: number;
	opacity?: number;
}> = ({frame, x, y, seed, color = '#d8d4cc', rate = 7, life = 110, drift = 0.8, size = 40, opacity = 0.5}) => {
	const n = Math.ceil(life / rate);
	return (
		<g>
			{Array.from({length: n}).map((_, i) => {
				const born = Math.floor(frame / rate) * rate - i * rate;
				const age = frame - born;
				if (age < 0 || age > life) return null;
				const k = age / life;
				const r = random(`${seed}${born}`);
				return (
					<circle
						key={born}
						cx={x + age * drift + Math.sin(age / 14 + r * 6) * 14}
						cy={y - age * (1.1 + r * 0.6) * (1 - k * 0.4)}
						r={size * (0.4 + k * 2.2)}
						fill={`url(#smoke-${color.slice(1)})`}
						opacity={opacity * Math.sin(Math.PI * Math.min(1, k * 1.2)) * (0.7 + r * 0.3)}
					/>
				);
			})}
		</g>
	);
};

const SmokeDef: React.FC<{color: string}> = ({color}) => (
	<radialGradient id={`smoke-${color.slice(1)}`}>
		<stop offset="0%" stopColor={color} stopOpacity={0.85} />
		<stop offset="55%" stopColor={color} stopOpacity={0.4} />
		<stop offset="100%" stopColor={color} stopOpacity={0} />
	</radialGradient>
);

/** Паровоз, смотрит влево. (x,y) — передний нижний угол у рельса. */
const Locomotive: React.FC<{x: number; y: number; s: number; frame: number; cars?: number; lit?: boolean; color?: string}> = ({
	x,
	y,
	s,
	frame,
	cars = 3,
	lit = true,
	color = '#07080b',
}) => {
	const wheel = (cx: number, r: number, k: number) => (
		<g key={k}>
			<circle cx={cx} cy={y - r} r={r} fill={color} />
			<circle cx={cx} cy={y - r} r={r * 0.75} fill="none" stroke="#1d1f26" strokeWidth={2 * s} />
		</g>
	);
	const carW = 230 * s;
	return (
		<g>
			{/* скотосбрасыватель */}
			<path d={`M${x},${y} L${x + 40 * s},${y - 38 * s} L${x + 40 * s},${y} Z`} fill={color} />
			{/* котёл */}
			<rect x={x + 30 * s} y={y - 100 * s} width={170 * s} height={62 * s} rx={28 * s} fill={color} />
			<rect x={x + 26 * s} y={y - 104 * s} width={14 * s} height={70 * s} rx={5 * s} fill={color} />
			{/* труба */}
			<path d={`M${x + 58 * s},${y - 96 * s} L${x + 52 * s},${y - 150 * s} L${x + 86 * s},${y - 150 * s} L${x + 80 * s},${y - 96 * s} Z`} fill={color} />
			<rect x={x + 108 * s} y={y - 122 * s} width={24 * s} height={26 * s} rx={10 * s} fill={color} />
			{/* будка */}
			<rect x={x + 190 * s} y={y - 150 * s} width={78 * s} height={112 * s} fill={color} />
			<rect x={x + 182 * s} y={y - 160 * s} width={94 * s} height={14 * s} fill={color} />
			<rect x={x + 205 * s} y={y - 138 * s} width={26 * s} height={30 * s} fill={lit ? '#e8a456' : '#1a1c22'} opacity={lit ? 0.85 : 1} />
			<rect x={x + 30 * s} y={y - 44 * s} width={240 * s} height={14 * s} fill={color} />
			{wheel(x + 70 * s, 16 * s, 0)}
			{wheel(x + 125 * s, 30 * s, 1)}
			{wheel(x + 190 * s, 30 * s, 2)}
			{wheel(x + 245 * s, 18 * s, 3)}
			{/* тендер и вагоны */}
			<rect x={x + 278 * s} y={y - 110 * s} width={120 * s} height={80 * s} fill={color} />
			{wheel(x + 300 * s, 16 * s, 4)}
			{wheel(x + 375 * s, 16 * s, 5)}
			{Array.from({length: cars}).map((_, c) => {
				const cx = x + 410 * s + c * (carW + 12 * s);
				return (
					<g key={c}>
						<rect x={cx} y={y - 140 * s} width={carW} height={108 * s} fill={color} />
						<rect x={cx - 6 * s} y={y - 150 * s} width={carW + 12 * s} height={14 * s} rx={6 * s} fill={color} />
						{Array.from({length: 6}).map((_, k) => (
							<rect
								key={k}
								x={cx + 18 * s + k * 35 * s}
								y={y - 120 * s}
								width={22 * s}
								height={34 * s}
								fill="#f0b363"
								opacity={lit ? 0.55 + 0.35 * Math.sin(frame / 9 + c * 3 + k) ** 2 : 0}
							/>
						))}
						{wheel(cx + 30 * s, 16 * s, 10 + c * 2)}
						{wheel(cx + carW - 30 * s, 16 * s, 11 + c * 2)}
					</g>
				);
			})}
			{/* фара */}
			{lit && (
				<>
					<circle cx={x + 34 * s} cy={y - 88 * s} r={120 * s} fill="url(#lamp)" />
					<circle cx={x + 34 * s} cy={y - 88 * s} r={9 * s} fill="#fff4d6" />
				</>
			)}
		</g>
	);
};

/** Общие градиенты */
const Defs: React.FC = () => (
	<defs>
		<Glow id="lamp" color="#ffd38a" />
		<Glow id="warm" color="#ffbf66" />
		<Glow id="moon" color="#f3e6c4" inner={0.5} />
		<Glow id="red" color="#ff3b2a" />
		<Glow id="fire" color="#ff8a2a" />
		<FogDef color="#c9d3e0" />
		<FogDef color="#e2c9a6" />
		<FogDef color="#8b97a8" />
		<SmokeDef color="#d8d4cc" />
		<SmokeDef color="#9c9a98" />
		<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stopColor="#ffe2a8" stopOpacity={0.55} />
			<stop offset="100%" stopColor="#ffe2a8" stopOpacity={0} />
		</linearGradient>
		<linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stopColor="#ffd98f" stopOpacity={0.5} />
			<stop offset="100%" stopColor="#ffd98f" stopOpacity={0} />
		</linearGradient>
		<linearGradient id="projector" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stopColor="#fff1d0" stopOpacity={0.4} />
			<stop offset="100%" stopColor="#fff1d0" stopOpacity={0.02} />
		</linearGradient>
	</defs>
);

const Sky: React.FC<{stops: string[]; id: string}> = ({stops, id}) => (
	<>
		<defs>
			<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
				{stops.map((c, i) => (
					<stop key={i} offset={`${(i / (stops.length - 1)) * 100}%`} stopColor={c} />
				))}
			</linearGradient>
		</defs>
		<rect x={-50} y={-50} width={W + 100} height={H + 100} fill={`url(#${id})`} />
	</>
);

/** Камера: параллакс-слой. depth 0 — бесконечность, 1 — передний план */
const Layer: React.FC<{p: number; depth: number; pan?: [number, number]; zoom?: number; children: React.ReactNode}> = ({
	p,
	depth,
	pan = [0, 0],
	zoom = 0.06,
	children,
}) => {
	const s = 1 + zoom * depth * p;
	const tx = pan[0] * depth * p;
	const ty = pan[1] * depth * p;
	return <g transform={`translate(${W / 2 + tx} ${H / 2 + ty}) scale(${s}) translate(${-W / 2} ${-H / 2})`}>{children}</g>;
};

/* ---------- планы ---------- */

const Night: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const trainX = interpolate(frame, [0, frames], [1250, -650]);
	const ridgeY = (x: number) => 1010 - 40 * (0.55 * Math.sin(x / 260 + random('n1') * 6) + 0.3 * Math.sin(x / 110 + random('n1b') * 6) + 0.15 * Math.sin(x / 47));
	return (
		<>
			<Sky id="sky-night" stops={['#03050b', '#07101f', '#122039', '#24324d']} />
			<Layer p={p} depth={0.1} pan={[0, 20]}>
				<Stars frame={frame} count={170} maxY={1000} seed="ns" />
				<circle cx={790} cy={760} r={260} fill="url(#moon)" />
				<circle cx={790} cy={760} r={52} fill="#efe4c8" />
				<circle cx={774} cy={749} r={52} fill="#dccfae" opacity={0.25} />
			</Layer>
			<Layer p={p} depth={0.3} pan={[0, 30]}>
				<Ridge seed="n1" base={1010} amp={40} treeH={[40, 80]} count={70} color="#1b2840" />
				{/* далёкий поезд по гребню */}
				<g>
					{Array.from({length: 9}).map((_, i) => {
						const x = trainX + i * 34;
						return <rect key={i} x={x} y={ridgeY(x) - 24} width={26} height={10} fill="#f2b766" opacity={i === 0 ? 0 : 0.85} />;
					})}
					<circle cx={trainX - 4} cy={ridgeY(trainX) - 22} r={60} fill="url(#lamp)" />
					<circle cx={trainX - 4} cy={ridgeY(trainX) - 22} r={4} fill="#fff4d6" />
				</g>
				<Fog y={1040} frame={frame} seed="nf1" opacity={0.28} color="#8b97a8" />
			</Layer>
			<Layer p={p} depth={0.6} pan={[0, 50]}>
				<Ridge seed="n2" base={1260} amp={70} treeH={[120, 230]} count={45} color="#0e1626" />
				<Fog y={1290} frame={frame} seed="nf2" speed={0.7} opacity={0.22} color="#8b97a8" />
			</Layer>
			<Layer p={p} depth={1} pan={[0, 80]}>
				<Ridge seed="n3" base={1600} amp={90} treeH={[380, 620]} count={14} color="#05080f" />
			</Layer>
		</>
	);
};

const Station: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const arrive = interpolate(frame, [0, frames * 0.75], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const lx = interpolate(arrive, [0, 1], [1400, 560]);
	const rail = 1270;
	const s = 1.05;
	return (
		<>
			<Sky id="sky-station" stops={['#141a2a', '#2a2e44', '#5d4a55', '#b9764d', '#e3a466']} />
			<Layer p={p} depth={0.15} pan={[-20, 0]}>
				<circle cx={330} cy={1060} r={520} fill="url(#warm)" opacity={0.35} />
				<Stars frame={frame} count={40} maxY={420} seed="ss" />
			</Layer>
			<Layer p={p} depth={0.35} pan={[-30, 0]}>
				<Ridge seed="s1" base={1150} amp={50} treeH={[60, 120]} count={60} color="#3a3241" />
				<Fog y={1170} frame={frame} seed="sf1" opacity={0.3} color="#e2c9a6" />
			</Layer>
			<Layer p={p} depth={0.7} pan={[-50, 0]}>
				<Ridge seed="s2" hill={false} base={1240} amp={30} treeH={[150, 260]} count={18} color="#1a1720" x0={-200} x1={420} />
				{/* станция */}
				<g fill="#08080b">
					<rect x={-40} y={1080} width={330} height={170} />
					<path d={`M-70,1085 L125,985 L320,1085 Z`} />
					<rect x={40} y={1130} width={44} height={60} fill="#f0a958" opacity={0.85 + 0.1 * Math.sin(frame / 7)} />
					<rect x={160} y={1130} width={44} height={60} fill="#f0a958" opacity={0.7} />
					{/* фонарь */}
					<rect x={350} y={1080} width={8} height={170} />
					<rect x={336} y={1062} width={36} height={30} rx={4} />
				</g>
				<circle cx={354} cy={1078} r={150} fill="url(#warm)" opacity={0.8 + 0.15 * Math.sin(frame / 5)} />
				<circle cx={354} cy={1078} r={7} fill="#fff1c4" />
				{/* перрон и мальчик с узелком */}
				<rect x={-60} y={1250} width={W + 120} height={30} fill="#0b0b0f" />
				<g fill="#08080b" transform="translate(420 1250)">
					<circle cx={0} cy={-118} r={15} />
					<path d="M-15,-100 Q0,-108 15,-100 L19,-46 L11,-46 L9,0 L2,0 L0,-40 L-2,0 L-9,0 L-11,-46 L-19,-46 Z" />
					<rect x={22} y={-46} width={30} height={24} rx={6} />
					<path d="M15,-95 L32,-50 L28,-48 L12,-85 Z" />
				</g>
			</Layer>
			<Layer p={p} depth={0.85} pan={[-60, 0]}>
				<rect x={-60} y={rail} width={W + 120} height={8} fill="#0d0d12" />
				<Smoke frame={frame} x={lx + 69 * s} y={rail - 150 * s} seed="st" color="#d8d4cc" rate={6} life={120} drift={1.6 + (1 - arrive) * 3} size={36} opacity={0.55} />
				<Locomotive x={lx} y={rail} s={s} frame={frame} cars={3} />
				<Smoke frame={frame + 40} x={lx + 150 * s} y={rail - 10} seed="sv" color="#d8d4cc" rate={10} life={70} drift={-0.4} size={30} opacity={0.35 * (1 - arrive * 0.5)} />
				<rect x={-60} y={rail + 8} width={W + 120} height={H} fill="#060608" />
			</Layer>
		</>
	);
};

const Forest: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const trunks = useMemo(
		() =>
			Array.from({length: 9}).map((_, i) => {
				const x = -60 + i * 150 + (random(`ft${i}`) - 0.5) * 80;
				const w = 50 + random(`fw${i}`) * 90;
				const depth = random(`fd${i}`);
				return {x, w: w * (0.6 + depth * 0.9), depth};
			}),
		[],
	);
	const sorted = [...trunks].sort((a, b) => a.depth - b.depth);
	return (
		<>
			<Sky id="sky-forest" stops={['#1d2a22', '#24352b', '#3c4a37', '#2a3427', '#111812']} />
			<Layer p={p} depth={0.2} pan={[0, -60]}>
				<Ridge seed="f1" base={1350} amp={30} treeH={[400, 700]} count={30} color="#2c3a30" />
				<Fog y={1200} frame={frame} seed="ff1" opacity={0.35} height={300} color="#e2c9a6" />
			</Layer>
			{/* лучи */}
			<g style={{mixBlendMode: 'screen'}}>
				{[0, 1, 2, 3].map((i) => {
					const x = 780 - i * 170;
					const o = 0.35 + 0.25 * Math.sin(frame / 40 + i * 1.7);
					return <path key={i} d={`M${x},-40 L${x + 90 + i * 10},-40 L${x - 320 + i * 30},${H} L${x - 520 + i * 20},${H} Z`} fill="url(#ray)" opacity={o} />;
				})}
			</g>
			{sorted.map((t, i) => (
				<Layer key={i} p={p} depth={0.4 + t.depth * 0.6} pan={[0, -140]} zoom={0.08}>
					<path
						d={`M${t.x - t.w / 2},-100 L${t.x + t.w / 2},-100 L${t.x + t.w * 0.62},${H + 80} L${t.x - t.w * 0.62},${H + 80} Z`}
						fill={interpolateColors(t.depth, [0, 1], ['#1c2620', '#050806'])}
					/>
					{/* ветви-лапы */}
					{[0, 1, 2].map((k) => {
						const y = 120 + k * 260 + random(`fb${i}${k}`) * 120;
						const dir = k % 2 ? 1 : -1;
						return (
							<path
								key={k}
								d={`M${t.x},${y} q${dir * 120},${30} ${dir * 260},${90} l${-dir * 40},${10} q${-dir * 110},-40 ${-dir * 220},-60 Z`}
								fill={interpolateColors(t.depth, [0, 1], ['#1c2620', '#050806'])}
							/>
						);
					})}
				</Layer>
			))}
			<Particles frame={frame} count={60} kind="dust" seed="fdust" area={[0, 200, W, 1500]} />
			<Layer p={p} depth={1} pan={[0, -80]}>
				<path d={`M-60,${H - 230} Q300,${H - 300} 600,${H - 250} T${W + 60},${H - 270} L${W + 60},${H + 60} L-60,${H + 60} Z`} fill="#040604" />
			</Layer>
		</>
	);
};

const Bridge: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const deck = 980;
	const ground = (x: number) => Math.min(deck + 760, Math.max(deck + 70, deck + 760 - Math.abs(x - 560) * 1.25));
	const bents = useMemo(() => {
		const out: React.ReactNode[] = [];
		for (let x = -40; x <= W + 60; x += 96) {
			const g = ground(x);
			out.push(<line key={`v${x}`} x1={x} y1={deck} x2={x - 12} y2={g} stroke="#07090e" strokeWidth={7} />);
			out.push(<line key={`w${x}`} x1={x + 30} y1={deck} x2={x + 42} y2={g} stroke="#07090e" strokeWidth={7} />);
			for (let y = deck + 20; y < g - 40; y += 90) {
				const y2 = Math.min(g, y + 90);
				out.push(<line key={`a${x}${y}`} x1={x} y1={y} x2={x + 96} y2={y2} stroke="#07090e" strokeWidth={3} />);
				out.push(<line key={`b${x}${y}`} x1={x + 96} y1={y} x2={x} y2={y2} stroke="#07090e" strokeWidth={3} />);
				out.push(<line key={`h${x}${y}`} x1={x - 6} y1={y2} x2={x + 102} y2={y2} stroke="#07090e" strokeWidth={4} />);
			}
		}
		return out;
	}, []);
	const tx = interpolate(frame, [0, frames + 18], [380, 1450]);
	const s = 0.62;
	return (
		<>
			<Sky id="sky-bridge" stops={['#070b16', '#121b30', '#2b3552', '#6c5d6e', '#a3786a']} />
			<Layer p={p} depth={0.1} pan={[0, 30]}>
				<Stars frame={frame} count={70} maxY={600} seed="bs" />
			</Layer>
			<Layer p={p} depth={0.3} pan={[0, 40]}>
				<Ridge seed="b1" base={1020} amp={60} treeH={[50, 90]} count={60} color="#262b40" />
				<Fog y={1110} frame={frame} seed="bf1" opacity={0.3} color="#c9d3e0" />
			</Layer>
			<Layer p={p} depth={0.55} pan={[0, 60]}>
				{/* ущелье и река */}
				<path d={`M-80,${deck + 60} L300,${deck + 120} L500,${deck + 760} L640,${deck + 760} L880,${deck + 140} L${W + 80},${deck + 50} L${W + 80},${H + 80} L-80,${H + 80} Z`} fill="#0b0f19" />
				<path d={`M470,${deck + 770} Q560,${deck + 740} 660,${deck + 770} L640,${H} L480,${H} Z`} fill="#2a3a55" opacity={0.6} />
				{Array.from({length: 8}).map((_, i) => (
					<rect key={i} x={500 + random(`br${i}`) * 110} y={deck + 790 + i * 18} width={24 + random(`bw${i}`) * 30} height={2} fill="#c9d6ee" opacity={0.25 + 0.3 * Math.sin(frame / 6 + i)} />
				))}
				<Fog y={deck + 600} frame={frame} seed="bf2" speed={0.9} opacity={0.35} height={220} color="#8b97a8" />
				{bents}
				<rect x={-80} y={deck - 14} width={W + 160} height={18} fill="#07090e" />
				<rect x={-80} y={deck - 24} width={W + 160} height={5} fill="#07090e" />
				{/* поезд едет вправо: зеркалим паровоз, нос в точке tx */}
				<g transform={`translate(${tx} 0) scale(-1 1)`}>
					<Locomotive x={0} y={deck - 20} s={s} frame={frame} cars={4} />
				</g>
				<path
					d={`M${tx - 30 * s},${deck - 20 - 88 * s} L${tx + 760},${deck - 260} L${tx + 760},${deck + 80} Z`}
					fill="url(#beam)"
					style={{mixBlendMode: 'screen'}}
				/>
			</Layer>
			<Layer p={p} depth={1} pan={[0, 90]}>
				<Ridge seed="b3" hill={false} base={1820} amp={60} treeH={[300, 520]} count={8} color="#03050a" x0={-200} x1={360} />
				<Ridge seed="b4" hill={false} base={1860} amp={40} treeH={[260, 460]} count={6} color="#03050a" x0={820} x1={1300} />
			</Layer>
		</>
	);
};

const Cabin: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const cx = 540;
	const by = 1180;
	const flick = 0.85 + 0.15 * Math.sin(frame / 4) * Math.sin(frame / 11);
	return (
		<>
			<Sky id="sky-cabin" stops={['#050813', '#0c1428', '#1b2741', '#33405e']} />
			<Layer p={p} depth={0.1} pan={[0, 20]}>
				<Stars frame={frame} count={150} maxY={900} seed="cs" />
			</Layer>
			<Layer p={p} depth={0.3} pan={[0, 30]}>
				<Ridge seed="c1" base={1060} amp={60} treeH={[90, 170]} count={60} color="#121b2e" />
				<Fog y={1100} frame={frame} seed="cf1" opacity={0.25} color="#8b97a8" />
			</Layer>
			<Layer p={p} depth={0.6} pan={[0, 45]}>
				<Ridge seed="c2" hill={false} base={by + 10} amp={20} treeH={[260, 420]} count={12} color="#070b14" x0={-200} x1={330} />
				<Ridge seed="c3" hill={false} base={by + 10} amp={20} treeH={[260, 440]} count={10} color="#070b14" x0={760} x1={1300} />
				<rect x={-80} y={by} width={W + 160} height={60} fill="#070b14" />
				<Smoke frame={frame} x={cx + 105} y={by - 260} seed="cs" color="#9c9a98" rate={9} life={150} drift={0.7} size={26} opacity={0.4} />
				<circle cx={cx} cy={by - 90} r={330} fill="url(#warm)" opacity={0.3 * flick} />
				<g fill="#05070d">
					<rect x={cx - 190} y={by - 170} width={380} height={170} />
					<path d={`M${cx - 230},${by - 165} L${cx},${by - 300} L${cx + 230},${by - 165} Z`} />
					<rect x={cx + 90} y={by - 290} width={32} height={80} />
				</g>
				{Array.from({length: 6}).map((_, i) => (
					<line key={i} x1={cx - 190} y1={by - 150 + i * 26} x2={cx + 190} y2={by - 150 + i * 26} stroke="#10141e" strokeWidth={2} />
				))}
				<rect x={cx - 140} y={by - 125} width={70} height={60} fill="#ffb35c" opacity={flick} />
				<rect x={cx + 70} y={by - 125} width={70} height={60} fill="#ffb35c" opacity={flick * 0.9} />
				<line x1={cx - 105} y1={by - 125} x2={cx - 105} y2={by - 65} stroke="#05070d" strokeWidth={4} />
				<line x1={cx + 105} y1={by - 125} x2={cx + 105} y2={by - 65} stroke="#05070d" strokeWidth={4} />
				<rect x={cx - 30} y={by - 120} width={60} height={120} fill="#0b0e16" />
				<circle cx={cx - 105} cy={by - 95} r={120} fill="url(#warm)" opacity={0.55 * flick} />
				<circle cx={cx + 105} cy={by - 95} r={120} fill="url(#warm)" opacity={0.5 * flick} />
			</Layer>
			<Layer p={p} depth={0.8} pan={[0, 60]}>
				{/* река с отражениями */}
				<rect x={-80} y={by + 50} width={W + 160} height={H} fill="#0a1222" />
				<path d={`M-80,${by + 50} Q540,${by + 30} ${W + 80},${by + 55} L${W + 80},${by + 80} L-80,${by + 80} Z`} fill="#070b14" />
				{Array.from({length: 26}).map((_, i) => {
					const y = by + 100 + i * 22;
					const near = Math.abs(i - 8) < 9;
					const x = (near ? cx - 140 + random(`cr${i}`) * 260 : random(`cr${i}`) * W) + 20 * Math.sin(frame / 10 + i);
					return (
						<rect
							key={i}
							x={x}
							y={y}
							width={30 + random(`cw${i}`) * 70}
							height={3}
							fill={near ? '#ffb35c' : '#9fb4d9'}
							opacity={(near ? 0.55 : 0.18) * (0.5 + 0.5 * Math.sin(frame / 7 + i * 1.3)) * (1 - i / 30)}
						/>
					);
				})}
				<Particles frame={frame} count={14} kind="firefly" seed="cfly" area={[60, by - 300, 860, 360]} />
			</Layer>
		</>
	);
};

const Seasons: React.FC<SetProps> = ({frame, frames}) => {
	const k = frame / frames;
	const hz = 1040;
	const vx = 540;
	const sky = interpolateColors(k, [0, 0.3, 0.45, 0.7, 0.85, 1], ['#a8653a', '#8d5a3e', '#6f7a8c', '#8a95a6', '#7f9a83', '#b7a46a']);
	const skyTop = interpolateColors(k, [0, 0.35, 0.5, 0.8, 1], ['#2a1a1a', '#2a1f24', '#2c3446', '#2d3a46', '#2b3a2e']);
	const groundC = interpolateColors(k, [0, 0.33, 0.45, 0.7, 0.82, 1], ['#3a2616', '#33251a', '#b9c0c9', '#aab2bc', '#2f3d24', '#34442a']);
	const hillC = interpolateColors(k, [0, 0.35, 0.5, 0.75, 0.9], ['#2a1c18', '#2a1f1f', '#566070', '#4e5866', '#22301f']);
	const leaf = interpolate(k, [0, 0.3, 0.38], [1, 1, 0], clamp);
	const snow = interpolate(k, [0.32, 0.42, 0.68, 0.78], [0, 1, 1, 0], clamp);
	const pollen = interpolate(k, [0.72, 0.85], [0, 1], clamp);
	const speed = 0.012;
	const sleepers = Array.from({length: 26}).map((_, i) => {
		const ph = (i / 26 + frame * speed) % 1;
		const d = Math.pow(ph, 3);
		const y = hz + (H + 200 - hz) * d;
		const hw = 20 + 700 * d;
		return <rect key={i} x={vx - hw} y={y} width={hw * 2} height={4 + 50 * d} fill="#14100d" opacity={0.85} />;
	});
	const poles = Array.from({length: 5}).map((_, i) => {
		const ph = (i / 5 + frame * speed * 0.7) % 1;
		const d = Math.pow(ph, 3);
		const y = hz + (H + 400 - hz) * d;
		const x = vx - 60 - 900 * d;
		const h = 30 + 1400 * d;
		return (
			<g key={i} fill="#0e0b09">
				<rect x={x - (2 + 10 * d)} y={y - h} width={4 + 20 * d} height={h} />
				<rect x={x - 6 - 70 * d} y={y - h + 10 * d} width={12 + 140 * d} height={3 + 12 * d} />
			</g>
		);
	});
	return (
		<>
			<defs>
				<linearGradient id="sky-seasons" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={skyTop} />
					<stop offset="100%" stopColor={sky} />
				</linearGradient>
			</defs>
			<rect x={-50} y={-50} width={W + 100} height={H + 100} fill="url(#sky-seasons)" />
			<circle cx={vx} cy={hz - 40} r={500} fill="url(#warm)" opacity={0.35 * (1 - snow * 0.7)} />
			<Ridge seed="ss1" base={hz + 10} amp={35} treeH={[50, 110]} count={70} color={hillC} />
			<Fog y={hz + 10} frame={frame} seed="sef" opacity={0.3} color="#e2c9a6" />
			<path d={`M-80,${hz} L${W + 80},${hz} L${W + 80},${H + 80} L-80,${H + 80} Z`} fill={groundC} />
			<path d={`M${vx - 18},${hz} L${vx + 18},${hz} L${vx + 760},${H + 80} L${vx - 760},${H + 80} Z`} fill="#24201b" opacity={0.85} />
			{sleepers}
			<path d={`M${vx - 8},${hz} L${vx - 4},${hz} L${vx - 430},${H + 80} L${vx - 470},${H + 80} Z`} fill="#504a44" />
			<path d={`M${vx + 4},${hz} L${vx + 8},${hz} L${vx + 470},${H + 80} L${vx + 430},${H + 80} Z`} fill="#504a44" />
			{poles}
			<Particles frame={frame} count={40} kind="leaf" seed="sl" opacity={leaf} />
			<Particles frame={frame} count={130} kind="snow" seed="sn" opacity={snow} />
			<Particles frame={frame} count={60} kind="dust" seed="sp" opacity={pollen} />
		</>
	);
};

const Campfire: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const fx = 540;
	const fy = 1260;
	const flame = (i: number, h: number, w: number, col: string) => {
		const sway = Math.sin(frame / 3.3 + i * 1.7) * 14 + Math.sin(frame / 7.1 + i) * 8;
		const hh = h * (0.85 + 0.2 * Math.sin(frame / 2.7 + i * 2.3));
		const x = fx + (i - 2) * 22;
		return (
			<path
				key={`${col}${i}`}
				d={`M${x - w},${fy} C${x - w * 1.1},${fy - hh * 0.45} ${x + sway - w * 0.4},${fy - hh * 0.7} ${x + sway},${fy - hh} C${x + sway + w * 0.5},${fy - hh * 0.65} ${x + w * 1.1},${fy - hh * 0.4} ${x + w},${fy} Z`}
				fill={col}
			/>
		);
	};
	const glow = 0.85 + 0.15 * Math.sin(frame / 3) * Math.sin(frame / 8);
	return (
		<>
			<Sky id="sky-fire" stops={['#030407', '#070a12', '#0f1420', '#16131a']} />
			<Layer p={p} depth={0.1}>
				<Stars frame={frame} count={110} maxY={800} seed="fs" />
			</Layer>
			<Layer p={p} depth={0.4} pan={[0, 20]}>
				<Ridge seed="fr1" base={1150} amp={40} treeH={[260, 520]} count={30} color="#0b0e15" />
			</Layer>
			<Layer p={p} depth={0.7} pan={[0, 30]}>
				<circle cx={fx} cy={fy - 120} r={700} fill="url(#fire)" opacity={0.45 * glow} />
				<rect x={-80} y={fy - 10} width={W + 160} height={H} fill="#0a0806" />
				<ellipse cx={fx} cy={fy + 20} rx={420} ry={70} fill="#5a2f14" opacity={0.45 * glow} />
				<Ridge seed="fr2" hill={false} base={fy + 40} amp={20} treeH={[600, 900]} count={4} color="#040304" x0={-200} x1={250} />
				<Ridge seed="fr3" hill={false} base={fy + 40} amp={20} treeH={[600, 900]} count={4} color="#040304" x0={850} x1={1300} />
			</Layer>
			<Layer p={p} depth={0.85} pan={[0, 40]}>
				<g fill="#1a0f08">
					<rect x={fx - 150} y={fy - 12} width={300} height={30} rx={14} transform={`rotate(-10 ${fx} ${fy})`} />
					<rect x={fx - 150} y={fy - 12} width={300} height={30} rx={14} transform={`rotate(12 ${fx} ${fy})`} />
				</g>
				<g style={{mixBlendMode: 'screen'}}>
					{[0, 1, 2, 3, 4].map((i) => flame(i, 230 - Math.abs(i - 2) * 50, 46, '#d2471a'))}
					{[0, 1, 2, 3, 4].map((i) => flame(i, 170 - Math.abs(i - 2) * 40, 30, '#f08a2a'))}
					{[1, 2, 3].map((i) => flame(i, 110 - Math.abs(i - 2) * 30, 18, '#ffd27a'))}
				</g>
				<Particles frame={frame} count={45} kind="ember" seed="fe" area={[fx - 300, fy - 900, 600, 900]} />
			</Layer>
		</>
	);
};

const Reel: React.FC<SetProps> = ({frame}) => {
	const holes = Array.from({length: 22}).map((_, i) => {
		const y = ((i * 100 + frame * 4) % 2200) - 140;
		return y;
	});
	return (
		<>
			<rect x={-50} y={-50} width={W + 100} height={H + 100} fill="#070605" />
			<circle cx={540} cy={900} r={900} fill="url(#warm)" opacity={0.12} />
			{/* луч проектора */}
			<g style={{mixBlendMode: 'screen'}} opacity={0.8 + 0.1 * Math.sin(frame / 2.3)}>
				<path d={`M500,-40 L580,-40 L1100,${H} L-20,${H} Z`} fill="url(#projector)" />
			</g>
			<Particles frame={frame} count={70} kind="dust" seed="rd" area={[100, 0, 880, H]} opacity={0.8} />
			{/* перфорация плёнки по краям */}
			{[18, W - 58].map((x, s) => (
				<g key={s}>
					<rect x={x - 18} y={-20} width={76} height={H + 40} fill="#14110e" />
					{holes.map((y, i) => (
						<rect key={i} x={x + 4} y={y} width={32} height={46} rx={6} fill="#2a241d" />
					))}
				</g>
			))}
		</>
	);
};

const Outro: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const hz = 1080;
	const vx = 540;
	const k = interpolate(frame, [0, frames], [0, 1], {easing: Easing.out(Easing.quad)});
	const d = interpolate(k, [0, 1], [0.32, 0.015]);
	const ly = hz + (H - hz) * d - 30 * d;
	const gap = 10 + 260 * d;
	const r = 3 + 40 * d;
	return (
		<>
			<Sky id="sky-outro" stops={['#06080d', '#0e131d', '#1e2533', '#2c3240']} />
			<Layer p={p} depth={0.15}>
				<Stars frame={frame} count={60} maxY={700} seed="os" />
			</Layer>
			<Layer p={p} depth={0.4} pan={[0, -20]}>
				<Ridge seed="o1" base={hz + 10} amp={30} treeH={[120, 260]} count={50} color="#121722" />
				<Fog y={hz} frame={frame} seed="of1" opacity={0.4} height={220} color="#8b97a8" />
			</Layer>
			<Layer p={p} depth={0.7} pan={[0, -30]}>
				<rect x={-80} y={hz} width={W + 160} height={H} fill="#0a0d13" />
				<path d={`M${vx - 6},${hz} L${vx + 6},${hz} L${vx + 600},${H + 80} L${vx - 600},${H + 80} Z`} fill="#11141b" />
				<path d={`M${vx - 4},${hz} L${vx - 2},${hz} L${vx - 340},${H + 80} L${vx - 370},${H + 80} Z`} fill="#3a3e48" />
				<path d={`M${vx + 2},${hz} L${vx + 4},${hz} L${vx + 370},${H + 80} L${vx + 340},${H + 80} Z`} fill="#3a3e48" />
				{/* последний вагон уходит */}
				<rect x={vx - gap * 1.4} y={ly - gap * 1.8} width={gap * 2.8} height={gap * 1.6} fill="#06080c" />
				{[-1, 1].map((sgn) => (
					<g key={sgn}>
						<circle cx={vx + sgn * gap} cy={ly - gap * 0.5} r={r * 9} fill="url(#red)" opacity={0.6} />
						<circle cx={vx + sgn * gap} cy={ly - gap * 0.5} r={r} fill="#ff6a50" />
					</g>
				))}
				<Fog y={hz + 120} frame={frame} seed="of2" speed={0.6} opacity={0.35} height={260} color="#8b97a8" />
			</Layer>
			<Layer p={p} depth={1} pan={[0, -40]}>
				<Ridge seed="o3" hill={false} base={H - 80} amp={40} treeH={[500, 800]} count={4} color="#030406" x0={-200} x1={200} />
				<Ridge seed="o4" hill={false} base={H - 80} amp={40} treeH={[500, 800]} count={4} color="#030406" x0={880} x1={1300} />
			</Layer>
		</>
	);
};

const SETS: Record<CinemaSet, React.FC<SetProps>> = {
	night: Night,
	station: Station,
	forest: Forest,
	bridge: Bridge,
	cabin: Cabin,
	seasons: Seasons,
	campfire: Campfire,
	reel: Reel,
	outro: Outro,
};

export const SetView: React.FC<{set: CinemaSet; frame: number; frames: number}> = ({set, frame, frames}) => {
	const C = SETS[set] ?? Night;
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
			<Defs />
			<C frame={frame} frames={frames} />
		</svg>
	);
};
