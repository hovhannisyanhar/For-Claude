// Набор деталей для «декораций» стиля «Кино». Всё — SVG, детерминировано (random(seed)).
import React, {useMemo} from 'react';
import {random} from 'remotion';

export const W = 1080;
export const H = 1920;
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const rnd = (s: string) => random(s);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- деревья ---------- */

/** Силуэт ели: ярусы «ёлочкой» + ствол */
export const pinePath = (x: number, base: number, h: number, w: number, seed: string) => {
	const tiers = 7 + Math.floor(rnd(seed) * 5);
	const top = base - h;
	const left: string[] = [];
	const right: string[] = [];
	for (let i = 1; i <= tiers; i++) {
		const p = i / tiers;
		const y = top + h * 0.9 * p;
		const half = (w / 2) * (0.1 + 0.9 * Math.pow(p, 0.85)) * (0.8 + rnd(`${seed}-${i}`) * 0.4);
		const inner = half * (0.35 + rnd(`${seed}i${i}`) * 0.2);
		const droop = h * 0.03;
		left.push(`L${x - half},${y + droop * 0.3} L${x - half * 0.8},${y - droop * 0.4} L${x - inner},${y - h * 0.04}`);
		right.unshift(`L${x + inner},${y - h * 0.04} L${x + half * 0.8},${y - droop * 0.4} L${x + half * (0.85 + rnd(`${seed}r${i}`) * 0.3)},${y + droop * 0.3}`);
	}
	const tw = Math.max(1.5, w * 0.05);
	return `M${x},${top} ${left.join(' ')} L${x - tw},${top + h * 0.9} L${x - tw},${base} L${x + tw},${base} L${x + tw},${top + h * 0.9} ${right.join(' ')} Z`;
};

export const ridgeY = (seed: string, base: number, amp: number) => (x: number) =>
	base - amp * (0.55 * Math.sin(x / 260 + rnd(seed) * 6) + 0.3 * Math.sin(x / 110 + rnd(seed + 'b') * 6) + 0.15 * Math.sin(x / 47));

/** Холм, поросший елями */
export const Ridge: React.FC<{
	seed: string;
	base: number;
	amp: number;
	treeH: [number, number];
	count: number;
	color: string;
	x0?: number;
	x1?: number;
	hill?: boolean;
	/** Подсветка верхушек (луна/закат) */
	rim?: string;
}> = ({seed, base, amp, treeH, count, color, x0 = -200, x1 = W + 200, hill = true, rim}) => {
	const {hillD, trees} = useMemo(() => {
		const yAt = ridgeY(seed, base, amp);
		const pts: string[] = [];
		for (let x = x0; x <= x1; x += 16) pts.push(`L${x},${yAt(x)}`);
		const tr: string[] = [];
		const order = Array.from({length: count}, (_, i) => i).sort((a, b) => rnd(`${seed}h${a}`) - rnd(`${seed}h${b}`));
		for (const i of order) {
			const x = x0 + rnd(`${seed}x${i}`) * (x1 - x0);
			const h = treeH[0] + rnd(`${seed}h${i}`) * (treeH[1] - treeH[0]);
			tr.push(pinePath(x, yAt(x) + 8, h, h * (0.3 + rnd(`${seed}w${i}`) * 0.14), `${seed}t${i}`));
		}
		return {hillD: `M${x0},${H + 50} ${pts.join(' ')} L${x1},${H + 50} Z`, trees: tr.join(' ')};
	}, [seed, base, amp, treeH, count, x0, x1]);
	return (
		<g>
			{rim && <path d={trees} fill="none" stroke={rim} strokeWidth={2.5} opacity={0.35} transform="translate(-1.5 -1.5)" />}
			<g fill={color}>
				{hill && <path d={hillD} />}
				<path d={trees} />
			</g>
		</g>
	);
};

/** Горная гряда с заснеженными вершинами */
export const Mountains: React.FC<{seed: string; base: number; peak: number; color: string; snow?: string; lit?: string; x0?: number; x1?: number}> = ({
	seed,
	base,
	peak,
	color,
	snow,
	lit,
	x0 = -200,
	x1 = W + 200,
}) => {
	const {d, caps, light} = useMemo(() => {
		const pts: Array<[number, number]> = [];
		let x = x0;
		let up = true;
		while (x < x1) {
			const y = up ? base - peak * (0.55 + rnd(`${seed}p${x}`) * 0.45) : base - peak * (0.15 + rnd(`${seed}v${x}`) * 0.3);
			pts.push([x, y]);
			x += 90 + rnd(`${seed}s${x}`) * 170;
			up = !up;
		}
		pts.push([x1, base - peak * 0.3]);
		// мелкая зубчатость
		const fine: Array<[number, number]> = [];
		for (let i = 0; i < pts.length - 1; i++) {
			const [ax, ay] = pts[i];
			const [bx, by] = pts[i + 1];
			for (let k = 0; k < 6; k++) {
				const t = k / 6;
				fine.push([ax + (bx - ax) * t, ay + (by - ay) * t + (k ? (rnd(`${seed}j${i}${k}`) - 0.5) * 18 : 0)]);
			}
		}
		fine.push(pts[pts.length - 1]);
		const path = `M${x0},${base + 400} ${fine.map(([a, b]) => `L${a},${b}`).join(' ')} L${x1},${base + 400} Z`;
		const capList: string[] = [];
		const lightList: string[] = [];
		for (let i = 1; i < pts.length - 1; i++) {
			const [px, py] = pts[i];
			if (py > pts[i - 1][1] || py > pts[i + 1][1]) continue;
			const dl = (pts[i - 1][1] - py) * 0.32;
			const dr = (pts[i + 1][1] - py) * 0.32;
			const lx = px - (px - pts[i - 1][0]) * 0.32;
			const rx = px + (pts[i + 1][0] - px) * 0.32;
			capList.push(`M${px},${py} L${lx},${py + dl} L${lx + 14},${py + dl - 12} L${px - 6},${py + dl * 0.9} L${px + 10},${py + dr * 0.7} L${rx - 10},${py + dr - 8} L${rx},${py + dr} Z`);
			lightList.push(`M${px},${py} L${rx},${py + dr} L${rx + (pts[i + 1][0] - rx) * 0.5},${py + dr * 2.2} L${px + 8},${py + dr * 1.2} Z`);
		}
		return {d: path, caps: capList.join(' '), light: lightList.join(' ')};
	}, [seed, base, peak, x0, x1]);
	return (
		<g>
			<path d={d} fill={color} />
			{lit && <path d={light} fill={lit} opacity={0.35} />}
			{snow && <path d={caps} fill={snow} opacity={0.8} />}
		</g>
	);
};

/** Лиственное дерево: ветви + крона; листва может менять цвет/исчезать, ветви — под снегом */
export const LeafTree: React.FC<{
	x: number;
	base: number;
	h: number;
	seed: string;
	trunk: string;
	leaf: string;
	leafOpacity: number;
	snow?: number;
	frame: number;
}> = ({x, base, h, seed, trunk, leaf, leafOpacity, snow = 0, frame}) => {
	const {branches, tips} = useMemo(() => {
		const br: Array<{x1: number; y1: number; x2: number; y2: number; w: number}> = [];
		const tp: Array<{x: number; y: number; r: number}> = [];
		const grow = (x1: number, y1: number, ang: number, len: number, w: number, depth: number, id: string) => {
			const x2 = x1 + Math.sin(ang) * len;
			const y2 = y1 - Math.cos(ang) * len;
			br.push({x1, y1, x2, y2, w});
			if (depth === 0) {
				tp.push({x: x2, y: y2, r: h * (0.09 + rnd(id + 'r') * 0.06)});
				return;
			}
			const n = 2 + (rnd(id) > 0.6 ? 1 : 0);
			for (let k = 0; k < n; k++) {
				const a = ang + (k - (n - 1) / 2) * (0.55 + rnd(id + k) * 0.35);
				grow(x2, y2, a, len * (0.66 + rnd(id + 'l' + k) * 0.12), w * 0.62, depth - 1, id + k);
			}
		};
		grow(0, 0, (rnd(seed) - 0.5) * 0.15, h * 0.36, h * 0.06, 4, seed);
		return {branches: br, tips: tp};
	}, [seed, h]);
	const sway = Math.sin(frame / 45 + rnd(seed) * 6) * 1.2;
	return (
		<g transform={`translate(${x} ${base}) rotate(${sway})`}>
			{branches.map((b, i) => (
				<line key={i} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={trunk} strokeWidth={b.w} strokeLinecap="round" />
			))}
			{snow > 0 &&
				branches.map((b, i) =>
					b.w > 2 ? <line key={`s${i}`} x1={b.x1} y1={b.y1 - b.w * 0.4} x2={b.x2} y2={b.y2 - b.w * 0.4} stroke="#eef2f7" strokeWidth={b.w * 0.45} strokeLinecap="round" opacity={snow} /> : null,
				)}
			{leafOpacity > 0.01 && (
				<g opacity={leafOpacity}>
					{tips.map((t, i) => (
						<g key={i}>
							<circle cx={t.x} cy={t.y} r={t.r} fill={leaf} />
							<circle cx={t.x - t.r * 0.5} cy={t.y + t.r * 0.3} r={t.r * 0.75} fill={leaf} />
							<circle cx={t.x + t.r * 0.25} cy={t.y - t.r * 0.35} r={t.r * 0.6} fill="#fff" opacity={0.08} />
						</g>
					))}
				</g>
			)}
		</g>
	);
};

/* ---------- небо и воздух ---------- */

export const Sky: React.FC<{stops: string[]; id: string}> = ({stops, id}) => (
	<>
		<defs>
			<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
				{stops.map((c, i) => (
					<stop key={i} offset={`${(i / (stops.length - 1)) * 100}%`} stopColor={c} />
				))}
			</linearGradient>
		</defs>
		<rect x={-100} y={-100} width={W + 200} height={H + 200} fill={`url(#${id})`} />
	</>
);

export const Stars: React.FC<{frame: number; count: number; maxY: number; seed: string; opacity?: number}> = ({frame, count, maxY, seed, opacity = 1}) => (
	<g opacity={opacity}>
		{Array.from({length: count}).map((_, i) => {
			const tw = 0.55 + 0.45 * Math.sin(frame / (6 + rnd(`${seed}f${i}`) * 14) + rnd(`${seed}p${i}`) * 6);
			const r = rnd(`${seed}r${i}`);
			return (
				<circle
					key={i}
					cx={rnd(`${seed}x${i}`) * W}
					cy={Math.pow(rnd(`${seed}y${i}`), 1.3) * maxY}
					r={r > 0.97 ? 2.8 : r > 0.85 ? 1.8 : 1.1}
					fill="#f2ecdc"
					opacity={tw * (0.3 + r * 0.65)}
				/>
			);
		})}
	</g>
);

/** Облака: пушистые гряды с подсвеченным краем */
export const Clouds: React.FC<{frame: number; seed: string; y: number; count: number; color: string; lit: string; speed?: number; scale?: number; opacity?: number}> = ({
	frame,
	seed,
	y,
	count,
	color,
	lit,
	speed = 0.2,
	scale = 1,
	opacity = 1,
}) => (
	<g opacity={opacity}>
		{Array.from({length: count}).map((_, i) => {
			const span = W + 1000;
			const cx = ((rnd(`${seed}x${i}`) * span + frame * speed * (0.6 + rnd(`${seed}v${i}`) * 0.8)) % span) - 500;
			const cy = y + (rnd(`${seed}y${i}`) - 0.5) * 220 * scale;
			const w = (260 + rnd(`${seed}w${i}`) * 300) * scale;
			const puffs = 6;
			return (
				<g key={i}>
					{Array.from({length: puffs}).map((__, k) => {
						const px = cx + (k / (puffs - 1) - 0.5) * w;
						const pr = (36 + rnd(`${seed}r${i}${k}`) * 46) * scale * (1 - Math.abs(k / (puffs - 1) - 0.5));
						return (
							<g key={k}>
								<circle cx={px} cy={cy - pr * 0.25} r={pr * 1.25} fill={lit} opacity={0.55} />
								<circle cx={px + 4} cy={cy + 4} r={pr * 1.2} fill={color} />
							</g>
						);
					})}
					<ellipse cx={cx} cy={cy + 20 * scale} rx={w * 0.62} ry={34 * scale} fill={color} />
				</g>
			);
		})}
	</g>
);

/** Полоса тумана */
export const Fog: React.FC<{y: number; frame: number; speed?: number; opacity?: number; height?: number; seed: string; color?: string; count?: number}> = ({
	y,
	frame,
	speed = 0.4,
	opacity = 0.35,
	height = 160,
	seed,
	color = 'c9d3e0',
	count = 6,
}) => (
	<g>
		{Array.from({length: count}).map((_, i) => {
			const span = W + 1000;
			const x = ((rnd(`${seed}${i}`) * span + frame * speed * (0.7 + rnd(`${seed}s${i}`) * 0.6)) % span) - 500;
			return (
				<ellipse
					key={i}
					cx={x}
					cy={y + (rnd(`${seed}y${i}`) - 0.5) * height * 0.6}
					rx={400 + rnd(`${seed}r${i}`) * 280}
					ry={height * (0.5 + rnd(`${seed}q${i}`) * 0.4)}
					fill={`url(#fog-${color})`}
					opacity={opacity}
				/>
			);
		})}
	</g>
);

/** Стая птиц */
export const Birds: React.FC<{frame: number; seed: string; count: number; x: number; y: number; vx: number; vy?: number; size?: number; color?: string; circle?: number}> = ({
	frame,
	seed,
	count,
	x,
	y,
	vx,
	vy = 0,
	size = 12,
	color = '#0b0b10',
	circle = 0,
}) => (
	<g>
		{Array.from({length: count}).map((_, i) => {
			const ox = (rnd(`${seed}x${i}`) - 0.5) * 220;
			const oy = (rnd(`${seed}y${i}`) - 0.5) * 120;
			const ph = rnd(`${seed}p${i}`) * 6;
			let bx = x + ox + frame * vx;
			let by = y + oy + frame * vy + Math.sin(frame / 20 + ph) * 6;
			if (circle) {
				const a = frame / (60 + i * 7) + ph;
				bx = x + Math.cos(a) * circle * (0.6 + rnd(`${seed}c${i}`) * 0.6);
				by = y + Math.sin(a) * circle * 0.35 + oy * 0.5;
			}
			const f = Math.sin(frame / 3 + ph * 3);
			const s = size * (0.7 + rnd(`${seed}s${i}`) * 0.6);
			return (
				<path
					key={i}
					d={`M${bx - s},${by - f * s * 0.5} Q${bx - s * 0.45},${by - s * 0.35 - f * s * 0.2} ${bx},${by} Q${bx + s * 0.45},${by - s * 0.35 - f * s * 0.2} ${bx + s},${by - f * s * 0.5}`}
					fill="none"
					stroke={color}
					strokeWidth={Math.max(1.5, s * 0.22)}
					strokeLinecap="round"
				/>
			);
		})}
	</g>
);

/** Трава на переднем плане, колышется */
export const Grass: React.FC<{frame: number; seed: string; y: number; count: number; h: [number, number]; color: string; x0?: number; x1?: number; lit?: string}> = ({
	frame,
	seed,
	y,
	count,
	h,
	color,
	x0 = -40,
	x1 = W + 40,
	lit,
}) => (
	<g>
		{Array.from({length: count}).map((_, i) => {
			const x = x0 + rnd(`${seed}x${i}`) * (x1 - x0);
			const hh = h[0] + rnd(`${seed}h${i}`) * (h[1] - h[0]);
			const bend = (rnd(`${seed}b${i}`) - 0.5) * 30 + Math.sin(frame / 22 + x / 60) * 10;
			const yy = y + rnd(`${seed}y${i}`) * 20;
			return (
				<path
					key={i}
					d={`M${x - 3},${yy} Q${x + bend * 0.4},${yy - hh * 0.6} ${x + bend},${yy - hh} Q${x + bend * 0.4 + 2},${yy - hh * 0.6} ${x + 3},${yy} Z`}
					fill={lit && i % 5 === 0 ? lit : color}
				/>
			);
		})}
	</g>
);

type ParticleKind = 'dust' | 'snow' | 'leaf' | 'ember' | 'firefly' | 'chip';

export const Particles: React.FC<{
	frame: number;
	count: number;
	kind: ParticleKind;
	seed: string;
	area?: [number, number, number, number];
	opacity?: number;
	color?: string;
}> = ({frame, count, kind, seed, area = [0, 0, W, H], opacity = 1, color}) => {
	const [ax, ay, aw, ah] = area;
	return (
		<g opacity={opacity}>
			{Array.from({length: count}).map((_, i) => {
				const r1 = rnd(`${seed}a${i}`);
				const r2 = rnd(`${seed}b${i}`);
				const r3 = rnd(`${seed}c${i}`);
				const ph = r3 * Math.PI * 2;
				if (kind === 'dust') {
					const x = ax + ((r1 * aw + frame * (0.15 + r3 * 0.3) + 18 * Math.sin(frame / 50 + ph)) % aw);
					const y = ay + ((r2 * ah - frame * (0.1 + r1 * 0.25) + ah * 10) % ah);
					return <circle key={i} cx={x} cy={y} r={1.2 + r3 * 2.4} fill={color ?? '#ffe7b8'} opacity={0.2 + 0.55 * Math.abs(Math.sin(frame / 25 + ph))} />;
				}
				if (kind === 'snow') {
					const y = ay + ((r2 * ah + frame * (1.2 + r1 * 2.2)) % ah);
					const x = ax + ((r1 * aw + 22 * Math.sin(frame / 30 + ph) + frame * 0.8) % aw);
					return <circle key={i} cx={x} cy={y} r={1.5 + r3 * 4} fill="#f4f6fa" opacity={0.45 + r3 * 0.5} />;
				}
				if (kind === 'leaf') {
					const y = ay + ((r2 * ah + frame * (1.6 + r1 * 1.6)) % ah);
					const x = ax + ((r1 * aw + 50 * Math.sin(frame / 22 + ph) + frame * 0.9) % aw);
					const rot = (frame * (3 + r3 * 5) + r1 * 360) % 360;
					const col = ['#c9692c', '#a8441f', '#d9973a', '#7d3a1c'][i % 4];
					return <ellipse key={i} cx={x} cy={y} rx={8 + r3 * 7} ry={3.5 + r3 * 2.5} fill={col} transform={`rotate(${rot} ${x} ${y})`} opacity={0.9} />;
				}
				if (kind === 'ember') {
					const life = 50 + r1 * 70;
					const age = (frame + r2 * life) % life;
					const k = age / life;
					const x = ax + aw / 2 + (r3 - 0.5) * aw * 0.3 + Math.sin(age / 9 + ph) * 26 * k + (r1 - 0.5) * aw * k * 0.7;
					const y = ay + ah - k * ah;
					return <circle key={i} cx={x} cy={y} r={1.4 + r3 * 2.6} fill={k < 0.4 ? '#ffd27a' : '#ff9a3c'} opacity={(1 - k) * 0.95} />;
				}
				// firefly
				const x = ax + r1 * aw + 30 * Math.sin(frame / 40 + ph);
				const y = ay + r2 * ah + 20 * Math.cos(frame / 33 + ph);
				const blink = Math.max(0, Math.sin(frame / (14 + r3 * 10) + ph));
				return (
					<g key={i} opacity={blink}>
						<circle cx={x} cy={y} r={16} fill="url(#warm)" opacity={0.6} />
						<circle cx={x} cy={y} r={2.6} fill="#fff1b0" />
					</g>
				);
			})}
		</g>
	);
};

/** Клубы пара/дыма из точки */
export const Smoke: React.FC<{
	frame: number;
	x: number;
	y: number;
	seed: string;
	color?: string;
	rate?: number;
	life?: number;
	drift?: number;
	rise?: number;
	size?: number;
	opacity?: number;
}> = ({frame, x, y, seed, color = 'd8d4cc', rate = 7, life = 110, drift = 0.8, rise = 1.1, size = 40, opacity = 0.5}) => {
	const n = Math.ceil(life / rate);
	return (
		<g>
			{Array.from({length: n}).map((_, i) => {
				const born = Math.floor(frame / rate) * rate - i * rate;
				const age = frame - born;
				if (age < 0 || age > life) return null;
				const k = age / life;
				const r = rnd(`${seed}${born}`);
				return (
					<circle
						key={born}
						cx={x + age * drift + Math.sin(age / 14 + r * 6) * 14}
						cy={y - age * (rise + r * 0.6) * (1 - k * 0.4)}
						r={size * (0.4 + k * 2.2)}
						fill={`url(#smoke-${color})`}
						opacity={opacity * Math.sin(Math.PI * Math.min(1, k * 1.2)) * (0.7 + r * 0.3)}
					/>
				);
			})}
		</g>
	);
};

/** Камера: параллакс-слой. depth 0 — бесконечность, 1 — передний план */
export const Layer: React.FC<{p: number; depth: number; pan?: [number, number]; zoom?: number; shake?: [number, number]; children: React.ReactNode}> = ({
	p,
	depth,
	pan = [0, 0],
	zoom = 0.07,
	shake = [0, 0],
	children,
}) => {
	const s = 1 + zoom * depth * p;
	const tx = pan[0] * depth * p + shake[0] * depth;
	const ty = pan[1] * depth * p + shake[1] * depth;
	return <g transform={`translate(${W / 2 + tx} ${H / 2 + ty}) scale(${s}) translate(${-W / 2} ${-H / 2})`}>{children}</g>;
};

/* ---------- градиенты ---------- */

const Glow: React.FC<{id: string; color: string; inner?: number}> = ({id, color, inner = 1}) => (
	<radialGradient id={id}>
		<stop offset="0%" stopColor={color} stopOpacity={inner} />
		<stop offset="30%" stopColor={color} stopOpacity={inner * 0.35} />
		<stop offset="100%" stopColor={color} stopOpacity={0} />
	</radialGradient>
);

const FOGS = ['c9d3e0', 'e2c9a6', '8b97a8', 'f0c79a', '5d6b82'];
const SMOKES = ['d8d4cc', '9c9a98', 'e9d2b4', '5a5658'];

export const Defs: React.FC = () => (
	<defs>
		<Glow id="lamp" color="#ffd38a" />
		<Glow id="warm" color="#ffbf66" />
		<Glow id="moon" color="#f3e6c4" inner={0.55} />
		<Glow id="sun" color="#ffd9a0" inner={0.9} />
		<Glow id="red" color="#ff3b2a" />
		<Glow id="fire" color="#ff8a2a" />
		<Glow id="cold" color="#bcd2ff" inner={0.6} />
		{FOGS.map((c) => (
			<radialGradient key={c} id={`fog-${c}`}>
				<stop offset="0%" stopColor={`#${c}`} stopOpacity={0.9} />
				<stop offset="60%" stopColor={`#${c}`} stopOpacity={0.35} />
				<stop offset="100%" stopColor={`#${c}`} stopOpacity={0} />
			</radialGradient>
		))}
		{SMOKES.map((c) => (
			<radialGradient key={c} id={`smoke-${c}`}>
				<stop offset="0%" stopColor={`#${c}`} stopOpacity={0.85} />
				<stop offset="55%" stopColor={`#${c}`} stopOpacity={0.4} />
				<stop offset="100%" stopColor={`#${c}`} stopOpacity={0} />
			</radialGradient>
		))}
		<linearGradient id="beamR" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stopColor="#ffe2a8" stopOpacity={0.6} />
			<stop offset="100%" stopColor="#ffe2a8" stopOpacity={0} />
		</linearGradient>
		<linearGradient id="beamL" x1="1" y1="0" x2="0" y2="0">
			<stop offset="0%" stopColor="#ffe2a8" stopOpacity={0.6} />
			<stop offset="100%" stopColor="#ffe2a8" stopOpacity={0} />
		</linearGradient>
		<linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stopColor="#ffd98f" stopOpacity={0.55} />
			<stop offset="100%" stopColor="#ffd98f" stopOpacity={0} />
		</linearGradient>
		<linearGradient id="spill" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stopColor="#ffb35c" stopOpacity={0.55} />
			<stop offset="100%" stopColor="#ffb35c" stopOpacity={0} />
		</linearGradient>
	</defs>
);

/* ---------- паровоз ---------- */

/**
 * Паровоз с тендером и вагонами, смотрит влево. (x, y) — нос у рельса.
 * dist — пройденный путь (для вращения колёс и движения дышел).
 */
export const Train: React.FC<{
	x: number;
	y: number;
	s: number;
	dist: number;
	frame: number;
	cars?: number;
	lit?: number;
	color?: string;
	hi?: string;
	lamp?: boolean;
}> = ({x, y, s, dist, frame, cars = 3, lit = 1, color = '#08090c', hi = '#5a6378', lamp = true}) => {
	const X = (v: number) => x + v * s;
	const Y = (v: number) => y + v * s;
	const ang = dist / (30 * s);
	const wheel = (cx: number, r: number, k: string, spokes = 10) => {
		const a = (dist / (r * s)) * (180 / Math.PI);
		return (
			<g key={k} transform={`translate(${X(cx)} ${Y(-r)}) rotate(${-a})`}>
				<circle r={r * s} fill={color} />
				<circle r={r * s * 0.82} fill="none" stroke={hi} strokeWidth={1.4 * s} opacity={0.45} />
				{Array.from({length: spokes}).map((_, i) => {
					const t = (i / spokes) * Math.PI * 2;
					return <line key={i} x1={0} y1={0} x2={Math.cos(t) * r * s * 0.8} y2={Math.sin(t) * r * s * 0.8} stroke={hi} strokeWidth={1.1 * s} opacity={0.35} />;
				})}
				<circle r={r * s * 0.18} fill={hi} opacity={0.5} />
			</g>
		);
	};
	const crank = (cx: number) => [X(cx) + Math.cos(-ang) * 17 * s, Y(-30) + Math.sin(-ang) * 17 * s] as const;
	const [c1x, c1y] = crank(118);
	const [c2x, c2y] = crank(178);
	const cross = X(86 + Math.cos(-ang) * 10);
	const carW = 240;
	const winLit = (k: number) => lit * (0.6 + 0.35 * Math.sin(frame / 11 + k * 1.7) ** 2);
	return (
		<g>
			{/* вагоны */}
			{Array.from({length: cars}).map((_, c) => {
				const cx = 420 + c * (carW + 14);
				return (
					<g key={c}>
						<rect x={X(cx)} y={Y(-150)} width={carW * s} height={116 * s} fill={color} />
						<path d={`M${X(cx - 6)},${Y(-150)} Q${X(cx + carW / 2)},${Y(-176)} ${X(cx + carW + 6)},${Y(-150)} Z`} fill={color} />
						<rect x={X(cx + 30)} y={Y(-176)} width={(carW - 60) * s} height={14 * s} fill={color} />
						<line x1={X(cx - 6)} y1={Y(-151)} x2={X(cx + carW + 6)} y2={Y(-151)} stroke={hi} strokeWidth={1.5 * s} opacity={0.5} />
						{Array.from({length: 7}).map((__, k) => (
							<g key={k}>
								<rect x={X(cx + 16 + k * 31)} y={Y(-132)} width={20 * s} height={36 * s} rx={3 * s} fill="#f0b363" opacity={winLit(c * 7 + k)} />
								<rect x={X(cx + 16 + k * 31)} y={Y(-132)} width={20 * s} height={36 * s} rx={3 * s} fill="none" stroke={hi} strokeWidth={1 * s} opacity={0.3} />
							</g>
						))}
						<line x1={X(cx)} y1={Y(-80)} x2={X(cx + carW)} y2={Y(-80)} stroke={hi} strokeWidth={1 * s} opacity={0.25} />
						{wheel(cx + 28, 14, `a${c}`, 8)}
						{wheel(cx + 62, 14, `b${c}`, 8)}
						{wheel(cx + carW - 62, 14, `c${c}`, 8)}
						{wheel(cx + carW - 28, 14, `d${c}`, 8)}
						<rect x={X(cx + carW)} y={Y(-60)} width={14 * s} height={6 * s} fill={color} />
					</g>
				);
			})}
			{/* тендер */}
			<rect x={X(290)} y={Y(-118)} width={120 * s} height={86 * s} rx={4 * s} fill={color} />
			<path d={`M${X(296)},${Y(-118)} Q${X(330)},${Y(-140)} ${X(350)},${Y(-126)} Q${X(375)},${Y(-142)} ${X(404)},${Y(-118)} Z`} fill={color} />
			<line x1={X(290)} y1={Y(-117)} x2={X(410)} y2={Y(-117)} stroke={hi} strokeWidth={1.5 * s} opacity={0.5} />
			{wheel(318, 16, 't1', 8)}
			{wheel(382, 16, 't2', 8)}
			{/* скотосбрасыватель */}
			<path d={`M${X(0)},${Y(0)} L${X(38)},${Y(-36)} L${X(38)},${Y(0)} Z`} fill={color} />
			{[8, 16, 24, 32].map((v) => (
				<line key={v} x1={X(v)} y1={Y(0)} x2={X(v + 4)} y2={Y(-v * 0.9)} stroke={hi} strokeWidth={1 * s} opacity={0.3} />
			))}
			<rect x={X(32)} y={Y(-50)} width={14 * s} height={18 * s} fill={color} />
			{/* цилиндр */}
			<rect x={X(64)} y={Y(-62)} width={40 * s} height={26 * s} rx={5 * s} fill={color} />
			{/* котёл */}
			<rect x={X(42)} y={Y(-106)} width={40 * s} height={64 * s} rx={6 * s} fill={color} />
			<rect x={X(60)} y={Y(-102)} width={152 * s} height={58 * s} rx={27 * s} fill={color} />
			<path d={`M${X(66)},${Y(-101)} L${X(205)},${Y(-101)}`} stroke={hi} strokeWidth={2 * s} opacity={0.55} />
			{[100, 140, 180].map((v) => (
				<line key={v} x1={X(v)} y1={Y(-102)} x2={X(v)} y2={Y(-44)} stroke={hi} strokeWidth={1.4 * s} opacity={0.35} />
			))}
			{/* труба, домы, колокол */}
			<path d={`M${X(56)},${Y(-100)} L${X(48)},${Y(-158)} L${X(84)},${Y(-158)} L${X(76)},${Y(-100)} Z`} fill={color} />
			<rect x={X(44)} y={Y(-164)} width={44 * s} height={9 * s} rx={3 * s} fill={color} />
			<rect x={X(108)} y={Y(-124)} width={28 * s} height={26 * s} rx={12 * s} fill={color} />
			<rect x={X(152)} y={Y(-118)} width={22 * s} height={20 * s} rx={9 * s} fill={color} />
			<path d={`M${X(138)},${Y(-104)} L${X(142)},${Y(-118)} L${X(150)},${Y(-118)} L${X(154)},${Y(-104)} Z`} fill={color} />
			{/* фонарь-короб */}
			<rect x={X(44)} y={Y(-134)} width={28 * s} height={26 * s} rx={3 * s} fill={color} />
			{/* площадка и будка */}
			<rect x={X(40)} y={Y(-50)} width={244 * s} height={7 * s} fill={color} />
			<rect x={X(206)} y={Y(-160)} width={76 * s} height={118 * s} fill={color} />
			<rect x={X(198)} y={Y(-170)} width={92 * s} height={12 * s} rx={4 * s} fill={color} />
			<line x1={X(198)} y1={Y(-170)} x2={X(290)} y2={Y(-170)} stroke={hi} strokeWidth={1.8 * s} opacity={0.55} />
			<rect x={X(222)} y={Y(-148)} width={32 * s} height={36 * s} rx={3 * s} fill="#f0a958" opacity={lit * (0.75 + 0.2 * Math.sin(frame / 4))} />
			{/* колёса и дышла */}
			{wheel(62, 15, 'p', 8)}
			{wheel(118, 30, 'd1', 14)}
			{wheel(178, 30, 'd2', 14)}
			{wheel(246, 17, 'tr', 9)}
			<line x1={c1x} y1={c1y} x2={c2x} y2={c2y} stroke={hi} strokeWidth={4 * s} strokeLinecap="round" opacity={0.75} />
			<line x1={cross} y1={Y(-49)} x2={c1x} y2={c1y} stroke={hi} strokeWidth={3.5 * s} strokeLinecap="round" opacity={0.6} />
			{/* фара */}
			{lamp && (
				<>
					<circle cx={X(44)} cy={Y(-121)} r={140 * s} fill="url(#lamp)" />
					<circle cx={X(44)} cy={Y(-121)} r={9 * s} fill="#fff4d6" />
				</>
			)}
		</g>
	);
};
