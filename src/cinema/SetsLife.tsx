// Декорации для «Жизнь прекрасна» (2D вектор, «детская книжка»).
// Две половины: тёплая Тоскана 1939 (янтарь, охра, зелень) и холодный лагерь (сине-серый) с тёплыми пятнами «игры».
import React from 'react';
import {Easing, interpolate} from 'remotion';
import {Birds, Fog, H, Layer, Particles, Sky, Smoke, Stars, W, clamp, rnd} from './kit';
import {Figure, sitPose, walkPose, type Pose} from './people';
import {Person, mix, type Look} from './person';

type SetProps = {frame: number; frames: number};
const ease = Easing.inOut(Easing.cubic);

/* ---------- герои ---------- */
const GUIDO: Look = {skin: '#e8c3a0', hair: '#2a1c14', hairStyle: 'slick', top: '#8a6a4a', shirt: '#efe8da', tie: '#6a3a2a', bottom: '#6a5442', shoes: '#2a1c14', hat: '#7a5232'};
const GUIDO_CAMP: Look = {skin: '#d9b496', hair: '#2a1c14', hairStyle: 'slick', top: '#6f7888', bottom: '#5d6676', shoes: '#22252c'};
const DORA: Look = {kind: 'woman', skin: '#f0cbb0', hair: '#8a4526', hairStyle: 'bob', top: '#26324e', bottom: '#26324e', shoes: '#1a1a22'};
const DORA_BRIDE: Look = {...DORA, top: '#f4ece0', bottom: '#f4ece0'};
const SON: Look = {skin: '#f0cbb0', hair: '#5a3620', hairStyle: 'wavy', top: '#efe3c8', shirt: '#3d5a8a', bottom: '#3d5a8a', shoes: '#3a2a20'};
const SON_CAMP: Look = {...SON, top: '#7a8494', shirt: undefined, bottom: '#5d6676'};
const SOLDIER: Look = {skin: '#d6b090', hair: '#1a1a1a', top: '#3c4236', bottom: '#33382e', shoes: '#0d0e0c', hat: '#2c3128'};

/* ---------- общие детали ---------- */

/** Виньетка-рамка «книжки» поверх плана */
const Vignette: React.FC<{color?: string; strength?: number; id: string}> = ({color = '#000000', strength = 0.7, id}) => (
	<g>
		<defs>
			<radialGradient id={`vig-${id}`} cx="50%" cy="52%" r="72%">
				<stop offset="55%" stopColor={color} stopOpacity={0} />
				<stop offset="100%" stopColor={color} stopOpacity={strength} />
			</radialGradient>
		</defs>
		<rect x={-200} y={-200} width={W + 400} height={H + 400} fill={`url(#vig-${id})`} />
	</g>
);

const glow = (id: string, color: string, inner = 0.9) => (
	<radialGradient id={id}>
		<stop offset="0%" stopColor={color} stopOpacity={inner} />
		<stop offset="35%" stopColor={color} stopOpacity={inner * 0.35} />
		<stop offset="100%" stopColor={color} stopOpacity={0} />
	</radialGradient>
);

/** Конь в профиль (смотрит вправо), копыта в (0,0), рост ~110 единиц. gallop — фаза в радианах */
const Horse: React.FC<{x: number; y: number; h: number; color: string; mane: string; phase: number; facing?: 1 | -1; scrawl?: string; rim?: string}> = ({x, y, h, color, mane, phase, facing = 1, scrawl, rim}) => {
	const k = h / 110;
	const s = Math.sin(phase);
	const c = Math.cos(phase);
	const bodyY = -64 + c * 2.5;
	const leg = (hx: number, a1: number, a2: number, back: boolean) => {
		const r = (d: number) => (d * Math.PI) / 180;
		const kx = hx + Math.sin(r(a1)) * 22;
		const ky = bodyY + 8 + Math.cos(r(a1)) * 22;
		const fx = kx + Math.sin(r(a1 - a2)) * 24;
		const fy = ky + Math.cos(r(a1 - a2)) * 24;
		const col = back ? mix(color, '#000000', 0.3) : color;
		return (
			<g stroke={col} strokeLinecap="round" fill="none">
				<path d={`M${hx},${bodyY + 4} L${kx},${ky}`} strokeWidth={9} />
				<path d={`M${kx},${ky} L${fx},${fy}`} strokeWidth={5.5} />
				<path d={`M${fx - 2},${fy + 1} L${fx + 3},${fy + 1}`} stroke="#1a140f" strokeWidth={5} />
			</g>
		);
	};
	const tailSway = Math.sin(phase * 0.5) * 8;
	return (
		<g transform={`translate(${x} ${y}) scale(${facing * k} ${k})`}>
			<ellipse cx={0} cy={0} rx={46} ry={4} fill="#000" opacity={0.25} />
			{leg(-24, 30 * s, Math.max(0, 50 * Math.sin(phase + 1)), true)}
			{leg(26, -28 * s, -Math.max(0, 60 * Math.sin(phase - 0.6)), true)}
			{/* хвост */}
			<path d={`M-34,${bodyY - 6} Q${-54 + tailSway},${bodyY - 2} ${-50 + tailSway},${bodyY + 30} Q${-44},${bodyY + 8} -32,${bodyY + 2} Z`} fill={mane} />
			{/* корпус и шея */}
			<ellipse cx={0} cy={bodyY} rx={38} ry={17} fill={color} />
			<path d={`M18,${bodyY - 10} Q30,${bodyY - 38} 42,${bodyY - 48} L54,${bodyY - 40} Q42,${bodyY - 22} 36,${bodyY + 6} Z`} fill={color} />
			{/* голова */}
			<path d={`M40,${bodyY - 52} Q48,${bodyY - 58} 54,${bodyY - 50} L66,${bodyY - 32} Q67,${bodyY - 26} 61,${bodyY - 26} L50,${bodyY - 36} Z`} fill={color} />
			<path d={`M43,${bodyY - 54} L46,${bodyY - 64} L49,${bodyY - 54} Z`} fill={color} />
			<circle cx={53} cy={bodyY - 44} r={1.6} fill="#120c08" />
			{/* грива */}
			<path d={`M40,${bodyY - 54} Q28,${bodyY - 40} 16,${bodyY - 14} Q24,${bodyY - 30} 30,${bodyY - 36} Q26,${bodyY - 26} 22,${bodyY - 14} Q34,${bodyY - 36} 44,${bodyY - 50} Z`} fill={mane} />
			{/* блик сверху */}
			<path d={`M-30,${bodyY - 12} Q0,${bodyY - 20} 26,${bodyY - 12}`} stroke={rim ?? mix(color, '#ffffff', 0.35)} strokeWidth={3} fill="none" opacity={0.6} strokeLinecap="round" />
			{/* надпись краской — неразборчивые мазки */}
			{scrawl && (
				<g stroke={scrawl} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.92}>
					<path d={`M-26,${bodyY - 5} l3,8 l3,-8 l3,8 M-14,${bodyY - 5} l0,8 M-10,${bodyY - 5} q5,0 5,4 q0,4 -5,4 M0,${bodyY - 5} l5,0 m-2.5,0 l0,8 M8,${bodyY - 5} l0,8 l5,0 M16,${bodyY - 5} q4,-2 5,3 q-1,6 -5,5`} />
					<path d={`M-22,${bodyY + 7} l4,0 m-2,0 l0,6 M-14,${bodyY + 7} l0,6 l4,0 M-6,${bodyY + 7} q4,-1 4,3 q0,3 -4,3 M4,${bodyY + 7} l3,6 l3,-6 M14,${bodyY + 7} l0,6`} />
				</g>
			)}
			{leg(-20, 26 * s + 6, Math.max(0, 50 * Math.sin(phase + 2.4)), false)}
			{leg(30, -24 * s - 6, -Math.max(0, 60 * Math.sin(phase + 0.8)), false)}
		</g>
	);
};

/** Игрушечный танк; draw 0..1 — насколько «нарисован» контур (золотая линия), fill — заливка */
const Tank: React.FC<{x: number; y: number; s: number; draw?: number; fill?: string; stroke?: string; sw?: number}> = ({x, y, s, draw = 1, fill = 'none', stroke = '#ffd98a', sw = 3}) => {
	const L = 900;
	return (
		<g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={sw / s} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - draw)}>
			<path d="M-60,0 Q-66,-10 -56,-16 L56,-16 Q66,-10 60,0 Q54,10 44,10 L-44,10 Q-54,10 -60,0 Z" />
			<path d="M-46,-16 L-40,-34 L40,-34 L46,-16" />
			<path d="M-20,-34 Q-18,-52 4,-52 Q22,-52 24,-34" />
			<path d="M20,-44 L74,-50" />
			{[-40, -20, 0, 20, 40].map((cx) => (
				<circle key={cx} cx={cx} cy={-3} r={6} />
			))}
		</g>
	);
};

/** Колючая проволока: столбы + провисающие нити с шипами */
const Fence: React.FC<{y: number; x0: number; x1: number; gap: number; h: number; color: string; seed: string; lit?: string}> = ({y, x0, x1, gap, h, color, seed, lit}) => {
	const posts: number[] = [];
	for (let x = x0; x <= x1; x += gap) posts.push(x);
	return (
		<g>
			{posts.map((x, i) => (
				<g key={i}>
					<rect x={x - 5} y={y - h} width={10} height={h} fill={color} />
					<path d={`M${x},${y - h} l22,-18`} stroke={color} strokeWidth={6} />
					{lit && <rect x={x - 5} y={y - h} width={3} height={h} fill={lit} opacity={0.5} />}
				</g>
			))}
			{[0.12, 0.32, 0.52, 0.72].map((f, j) =>
				posts.slice(0, -1).map((x, i) => {
					const yy = y - h * (1 - f);
					const sag = 10 + rnd(`${seed}${i}${j}`) * 6;
					return (
						<g key={`${i}-${j}`}>
							<path d={`M${x},${yy} Q${x + gap / 2},${yy + sag} ${x + gap},${yy}`} stroke={color} strokeWidth={2.5} fill="none" />
							{[0.25, 0.5, 0.75].map((t) => {
								const bx = x + gap * t;
								const by = yy + sag * 2 * t * (1 - t) * 2 * 0.5 + 2;
								return <path key={t} d={`M${bx - 5},${by - 5} L${bx + 5},${by + 5} M${bx + 5},${by - 5} L${bx - 5},${by + 5}`} stroke={color} strokeWidth={2} />;
							})}
						</g>
					);
				}),
			)}
		</g>
	);
};

/** Барак: длинное здание с двускатной крышей */
const Barrack: React.FC<{x: number; y: number; w: number; h: number; color: string; roof: string; win?: number; seed: string}> = ({x, y, w, h, color, roof, win = 0, seed}) => (
	<g>
		<path d={`M${x - 10},${y - h} L${x + w / 2},${y - h - h * 0.45} L${x + w + 10},${y - h} Z`} fill={roof} />
		<rect x={x} y={y - h} width={w} height={h} fill={color} />
		{Array.from({length: Math.floor(w / 70)}).map((_, i) => {
			const on = win > 0 && rnd(`${seed}${i}`) > 0.6;
			return <rect key={i} x={x + 24 + i * 70} y={y - h * 0.62} width={22} height={16} fill={on ? '#ffc56a' : '#0b0e16'} opacity={on ? win : 0.9} />;
		})}
	</g>
);

/** Сторожевая вышка с прожектором; angle — направление луча (градусы, 0 — вниз) */
const Tower: React.FC<{x: number; y: number; h: number; color: string; angle: number; beam?: number}> = ({x, y, h, color, angle, beam = 1}) => {
	const top = y - h;
	return (
		<g>
			{beam > 0 && (
				<g transform={`rotate(${angle} ${x} ${top - 40})`} opacity={beam}>
					<path d={`M${x - 8},${top - 40} L${x - 210},${top + 1500} L${x + 210},${top + 1500} L${x + 8},${top - 40} Z`} fill="url(#lb-beam)" />
				</g>
			)}
			<g stroke={color} strokeWidth={8}>
				<line x1={x - 40} y1={y} x2={x - 26} y2={top} />
				<line x1={x + 40} y1={y} x2={x + 26} y2={top} />
				<line x1={x - 36} y1={y - h * 0.3} x2={x + 36} y2={y - h * 0.6} strokeWidth={4} />
				<line x1={x + 36} y1={y - h * 0.3} x2={x - 36} y2={y - h * 0.6} strokeWidth={4} />
			</g>
			<rect x={x - 46} y={top - 70} width={92} height={70} fill={color} />
			<path d={`M${x - 62},${top - 68} L${x},${top - 108} L${x + 62},${top - 68} Z`} fill={color} />
			<circle cx={x} cy={top - 40} r={10} fill="#fff6d8" />
			<circle cx={x} cy={top - 40} r={60} fill="url(#lb-cold)" opacity={0.8} />
		</g>
	);
};

/** Тосканский дом: стена, окна-арки, ставни, черепица */
const TuscanHouse: React.FC<{x: number; y: number; w: number; h: number; wall: string; roof: string; shutter: string; seed: string; lit?: number; night?: boolean}> = ({x, y, w, h, wall, roof, shutter, seed, lit = 0, night}) => {
	const cols = Math.max(1, Math.floor(w / 80));
	const rows = Math.max(1, Math.floor(h / 110));
	return (
		<g>
			<rect x={x} y={y - h} width={w} height={h} fill={wall} />
			<rect x={x + w * 0.82} y={y - h} width={w * 0.18} height={h} fill="#000" opacity={0.12} />
			<path d={`M${x - 12},${y - h} L${x + w + 12},${y - h} L${x + w + 4},${y - h - 18} L${x - 4},${y - h - 18} Z`} fill={roof} />
			{Array.from({length: rows}).map((_, r) =>
				Array.from({length: cols}).map((__, c) => {
					const wx = x + ((c + 0.5) * w) / cols - 13;
					const wy = y - h + 30 + r * 110;
					const on = lit > 0 && rnd(`${seed}l${r}${c}`) < 0.5;
					return (
						<g key={`${r}-${c}`}>
							<path d={`M${wx},${wy + 50} L${wx},${wy + 12} Q${wx + 13},${wy - 2} ${wx + 26},${wy + 12} L${wx + 26},${wy + 50} Z`} fill={on ? '#ffcf7a' : night ? '#141826' : '#3a2e2a'} opacity={on ? 0.6 + lit * 0.4 : 1} />
							{!on && <rect x={wx - 10} y={wy + 8} width={8} height={42} fill={shutter} />}
							{!on && <rect x={wx + 28} y={wy + 8} width={8} height={42} fill={shutter} />}
							{on && <circle cx={wx + 13} cy={wy + 30} r={70} fill="url(#warm)" opacity={0.35 * lit} />}
						</g>
					);
				}),
			)}
		</g>
	);
};

/** Общие градиенты сцен */
const LifeDefs: React.FC = () => (
	<defs>
		<linearGradient id="lb-beam" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stopColor="#dfe8ff" stopOpacity={0.5} />
			<stop offset="100%" stopColor="#dfe8ff" stopOpacity={0} />
		</linearGradient>
		{glow('lb-cold', '#cfdcff', 0.8)}
		{glow('lb-gold', '#ffcf6e', 0.95)}
		{glow('lb-green', '#5fd36a', 0.7)}
		{glow('lb-sepia', '#ffd9a0', 0.8)}
		<linearGradient id="lb-ray" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stopColor="#ffe2a8" stopOpacity={0.55} />
			<stop offset="100%" stopColor="#ffe2a8" stopOpacity={0} />
		</linearGradient>
		<linearGradient id="lb-torch" x1="1" y1="0" x2="0" y2="0">
			<stop offset="0%" stopColor="#fff2c8" stopOpacity={0.75} />
			<stop offset="100%" stopColor="#fff2c8" stopOpacity={0} />
		</linearGradient>
	</defs>
);

/* ======================= 1. Лагерь: отец шепчет сыну про игру ======================= */
const Camp: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const sweep = Math.sin(frame / 38) * 28 + 12;
	const draw = interpolate(frame, [frames * 0.45, frames * 0.9], [0, 1], {...clamp, easing: ease});
	const lean = Math.sin(frame / 20) * 2;
	return (
		<>
			<LifeDefs />
			<Sky id="sky-camp" stops={['#070b18', '#0e1730', '#1b2742', '#2a3550']} />
			<Stars frame={frame} count={70} maxY={900} seed="camp-st" opacity={0.6} />
			<Layer p={p} depth={0.15} pan={[-20, 0]}>
				{/* мечта: золотой контур танка в небе */}
				<circle cx={640} cy={960} r={260} fill="url(#lb-gold)" opacity={0.28 * draw} />
				<Tank x={640} y={990} s={2.2} draw={draw} sw={5} />
			</Layer>
			<Layer p={p} depth={0.3} pan={[-30, 0]}>
				<Tower x={170} y={1260} h={420} color="#0a0e1a" angle={sweep} />
				<Barrack x={300} y={1280} w={520} h={110} color="#121a2c" roof="#0c1222" win={0.8} seed="cb1" />
				<Barrack x={760} y={1300} w={420} h={90} color="#101727" roof="#0a101e" win={0.6} seed="cb2" />
				<Fog y={1240} frame={frame} seed="camp-fog" opacity={0.35} color="5d6b82" count={6} />
			</Layer>
			<Layer p={p} depth={0.55} pan={[-40, 0]} zoom={0.1}>
				<rect x={-100} y={1300} width={W + 200} height={700} fill="#0b0f1a" />
				<Fence y={1430} x0={-60} x1={1160} gap={230} h={300} color="#05070d" seed="cf" lit="#6d7fa8" />
			</Layer>
			<Layer p={p} depth={0.9} pan={[-50, 0]} zoom={0.12}>
				<rect x={-100} y={1560} width={W + 200} height={600} fill="#06080e" />
				{/* отец присел к сыну */}
				<Person x={430} y={1600} h={560} facing={1} look={GUIDO_CAMP} tint={{color: '#0a1020', amount: 0.62}} rim={{color: '#9fb4e8', side: -1, strength: 0.8}} pose={{thighL: 95, kneeL: 125, thighR: 60, kneeR: 150, lean: 22 + lean, armL: 70, elbowL: 40, armR: 40, elbowR: 30, head: 8, bob: 34}} />
				<Person x={690} y={1600} h={360} facing={-1} look={SON_CAMP} tint={{color: '#0a1020', amount: 0.55}} rim={{color: '#ffcf8a', side: 1, strength: 0.4 + 0.5 * draw}} pose={{armL: 10, armR: -8, head: -10 - draw * 6}} />
			</Layer>
			<Vignette id="camp" strength={0.75} />
		</>
	);
};

/* ======================= 2. Помолвка: всадник врывается в зал ======================= */
const Wedding: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const ride = interpolate(frame, [frames * 0.25, frames * 0.85], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const hx = 260 + ride * 380;
	const hy = 1180 + ride * 230;
	const hs = 300 + ride * 260;
	const startle = interpolate(frame, [frames * 0.3, frames * 0.45], [0, 1], clamp);
	const flick = 0.92 + 0.08 * Math.sin(frame / 5);
	return (
		<>
			<LifeDefs />
			<Sky id="sky-wed" stops={['#3a1c12', '#5a2e1a', '#6e3b20', '#2a140c']} />
			<Layer p={p} depth={0.2} pan={[20, 0]}>
				{/* стена с арками */}
				{[150, 540, 930].map((cx, i) => (
					<g key={i}>
						<path d={`M${cx - 130},1240 L${cx - 130},760 Q${cx},600 ${cx + 130},760 L${cx + 130},1240 Z`} fill={i === 0 ? '#5d7fb0' : '#4a2616'} />
						{i === 0 && (
							<g>
								<path d={`M${cx - 130},1240 L${cx - 130},760 Q${cx},600 ${cx + 130},760 L${cx + 130},1240 Z`} fill="url(#cold)" opacity={0.7} />
								<Stars frame={frame} count={10} maxY={0} seed="w-st" />
							</g>
						)}
						<path d={`M${cx - 142},1240 L${cx - 142},760 Q${cx},588 ${cx + 142},760 L${cx + 142},1240`} stroke="#c99a52" strokeWidth={10} fill="none" />
					</g>
				))}
				{/* гирлянды */}
				{[0, 1, 2, 3].map((i) => (
					<g key={i}>
						<path d={`M${i * 300 - 60},620 Q${i * 300 + 90},720 ${i * 300 + 240},620`} stroke="#2a1a10" strokeWidth={3} fill="none" />
						{Array.from({length: 7}).map((_, j) => {
							const t = j / 6;
							const x = i * 300 - 60 + 300 * t;
							const y = 620 + 100 * 2 * t * (1 - t) * 2 * 0.5 + 0;
							return (
								<g key={j}>
									<circle cx={x} cy={y + 4} r={30} fill="url(#warm)" opacity={0.45 * flick} />
									<circle cx={x} cy={y + 4} r={6} fill="#ffe2a0" />
								</g>
							);
						})}
					</g>
				))}
			</Layer>
			<Layer p={p} depth={0.45} pan={[30, 0]} zoom={0.1}>
				{/* пол и длинный стол */}
				<rect x={-100} y={1240} width={W + 200} height={800} fill="#2a150c" />
				<path d="M430,1250 L1180,1250 L1180,1560 L620,1560 Z" fill="#f4ead8" />
				<path d="M620,1560 L1180,1560 L1180,1600 L630,1600 Z" fill="#cdbfa6" />
				{[700, 820, 940, 1060].map((x, i) => (
					<g key={i}>
						<rect x={x} y={1300 + i * 40} width={8} height={40} fill="#e9e1d2" />
						<circle cx={x + 4} cy={1296 + i * 40} r={5} fill="#ffd27a" />
						<circle cx={x + 4} cy={1296 + i * 40} r={50} fill="url(#warm)" opacity={0.5 * flick} />
					</g>
				))}
				{/* гости */}
				{[
					[560, 1250, 260, -1, '#3b2f4a'],
					[700, 1250, 260, -1, '#4a3a2a'],
					[880, 1250, 260, -1, '#2f3c4a'],
					[1010, 1250, 260, -1, '#5a2a2a'],
				].map(([x, y, h, f, col], i) => (
					<Person
						key={i}
						x={x as number}
						y={y as number}
						h={h as number}
						facing={f as 1 | -1}
						look={{skin: '#e5bc98', hair: '#2a1c14', hairStyle: i % 2 ? 'wavy' : 'slick', top: col as string, shirt: '#efe8da', bottom: '#2a2420', shoes: '#1a1210'}}
						tint={{color: '#2a140c', amount: 0.35}}
						pose={sitPose({lean: 8 - startle * 22, head: -startle * 18, armL: 40 + startle * 60, elbowL: 30})}
					/>
				))}
				{/* невеста встаёт */}
				<Person x={1000} y={1580} h={420} facing={-1} look={DORA_BRIDE} tint={{color: '#2a140c', amount: 0.15}} rim={{color: '#ffd9a0', side: -1, strength: 0.6}} pose={{armL: 20 + ride * 60, elbowL: 20, armR: -6, head: -6}} />
			</Layer>
			<Layer p={p} depth={0.8} pan={[30, 0]} zoom={0.12}>
				{/* конь со всадником — силуэт в контровом свете из двери */}
				<g opacity={interpolate(frame, [frames * 0.2, frames * 0.3], [0, 1], clamp)}>
					<Horse x={hx} y={hy} h={hs} color="#1c120c" mane="#0c0806" phase={frame / 3.2} rim="#9fc0ff" />
					<Person x={hx - hs * 0.06} y={hy - hs * 0.56 + Math.cos(frame / 3.2) * hs * 0.02} h={hs * 0.62} facing={1} look={GUIDO} tint={{color: '#1a0f0a', amount: 0.55}} rim={{color: '#9fc0ff', side: -1, strength: 0.8}} pose={sitPose({thighL: 70, kneeL: 75, thighR: 64, kneeR: 70, lean: 18, armL: 130, elbowL: -10, armR: 50, elbowR: 30})} />
				</g>
			</Layer>
			<Particles frame={frame} count={30} kind="dust" seed="wed-dust" area={[0, 700, 1080, 900]} opacity={0.5} />
			<Vignette id="wed" strength={0.6} color="#120804" />
		</>
	);
};

/* ======================= 3. Зелёный конь: ночная скачка по Ареццо ======================= */
const GreenHorse: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const scroll = frame * 6;
	const phase = frame / 3;
	const bob = Math.cos(phase) * 8;
	const reveal = interpolate(frame, [0, frames * 0.35], [0.4, 1], clamp);
	return (
		<>
			<LifeDefs />
			<Sky id="sky-gh" stops={['#0b1230', '#1b2350', '#38306a', '#5a3a5e']} />
			<Stars frame={frame} count={60} maxY={1000} seed="gh-st" opacity={0.8} />
			<circle cx={820} cy={760} r={70} fill="#fff4d6" />
			<circle cx={820} cy={760} r={260} fill="url(#moon)" />
			<Layer p={p} depth={0.3}>
				<g transform={`translate(${-(scroll * 0.3) % 600} 0)`}>
					{Array.from({length: 6}).map((_, i) => (
						<TuscanHouse key={i} x={i * 300 - 20} y={1260} w={260 + (i % 2) * 30} h={300 + rnd(`ghh${i % 4}`) * 160} wall={['#4a3e5e', '#54406a', '#3e3a58'][i % 3]} roof="#2a2240" shutter="#2e3a4a" seed={`ghh${i % 4}`} lit={0.9} night />
					))}
				</g>
			</Layer>
			<Layer p={p} depth={0.6}>
				<rect x={-100} y={1250} width={W + 200} height={800} fill="#241c36" />
				{/* брусчатка */}
				<g transform={`translate(${-(scroll % 120)} 0)`}>
					{Array.from({length: 40}).map((_, i) => (
						<ellipse key={i} cx={(i % 12) * 120 + Math.floor(i / 12) * 60} cy={1300 + Math.floor(i / 12) * 60} rx={50} ry={12} fill="#30264a" />
					))}
				</g>
				{/* фонари */}
				<g transform={`translate(${-((scroll * 0.6) % 700)} 0)`}>
					{[200, 900, 1600].map((x) => (
						<g key={x}>
							<rect x={x - 4} y={980} width={8} height={300} fill="#120e1c" />
							<rect x={x - 14} y={950} width={28} height={36} fill="#ffcf7a" />
							<circle cx={x} cy={968} r={140} fill="url(#warm)" opacity={0.55} />
						</g>
					))}
				</g>
			</Layer>
			<Layer p={p} depth={0.85} zoom={0.14}>
				<g transform={`translate(0 ${bob})`}>
					<circle cx={520} cy={1300} r={360} fill="url(#lb-green)" opacity={0.35 * reveal} />
					<Horse x={520} y={1540 - bob} h={640} color={mix('#2b6a34', '#3fbf4f', reveal)} mane="#1f4a26" phase={phase} scrawl="#f6f1e4" rim="#c8ffb0" />
					{/* Дора позади, Гвидо впереди */}
					<Person x={440} y={1185} h={300} facing={1} look={DORA_BRIDE} tint={{color: '#1b2350', amount: 0.3}} rim={{color: '#ffd9a0', side: 1, strength: 0.5}} pose={sitPose({armL: 80, elbowL: 20, armR: 70, lean: 10, head: -6})} />
					<Person x={540} y={1180} h={330} facing={1} look={GUIDO} tint={{color: '#1b2350', amount: 0.3}} rim={{color: '#ffd9a0', side: 1, strength: 0.6}} pose={sitPose({armL: 130, elbowL: -20, armR: 60, elbowR: 40, lean: 14})} />
				</g>
			</Layer>
			<Particles frame={frame} count={24} kind="dust" seed="gh-dust" area={[0, 1350, 1080, 300]} opacity={0.6} color="#c8b8ff" />
			<Vignette id="gh" strength={0.65} color="#05061a" />
		</>
	);
};

/* ======================= 4. Книжная лавка: смех → тени ======================= */
const Shop: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const cold = interpolate(frame, [frames * 0.6, frames * 0.92], [0, 1], {...clamp, easing: ease});
	const shadowX = interpolate(frame, [frames * 0.6, frames], [1200, 640], {...clamp, easing: Easing.out(Easing.quad)});
	const jump = Math.max(0, Math.sin(frame / 6)) * 18 * (1 - cold);
	const laugh = Math.sin(frame / 5) * 3 * (1 - cold);
	return (
		<>
			<LifeDefs />
			<Sky id="sky-shop" stops={['#9cc6e0', '#cfe2e6', '#f3e2bc', '#e9c690']} />
			<Layer p={p} depth={0.2}>
				<circle cx={900} cy={600} r={420} fill="url(#sun)" opacity={0.7 * (1 - cold)} />
				{/* фасад */}
				<rect x={40} y={560} width={1000} height={900} fill="#d9a46a" />
				<rect x={40} y={560} width={1000} height={30} fill="#b07a48" />
				{/* вывеска — без текста, только орнамент */}
				<rect x={240} y={640} width={600} height={90} rx={8} fill="#2f4a3a" />
				<rect x={256} y={656} width={568} height={58} rx={6} fill="none" stroke="#e8c87a" strokeWidth={3} />
				{[0, 1, 2].map((i) => (
					<rect key={i} x={330 + i * 160} y={680} width={100} height={10} rx={5} fill="#e8c87a" opacity={0.8} />
				))}
				{/* навес */}
				<path d="M120,760 L960,760 L1000,860 L80,860 Z" fill="#f2e8d2" />
				{Array.from({length: 10}).map((_, i) => (
					<path key={i} d={`M${120 + i * 84},760 L${162 + i * 84},760 L${166 + i * 88},860 L${122 + i * 88},860 Z`} fill="#3f7a5a" />
				))}
				{Array.from({length: 11}).map((_, i) => (
					<path key={i} d={`M${80 + i * 84},860 q42,30 84,0`} fill={i % 2 ? '#3f7a5a' : '#f2e8d2'} />
				))}
				{/* витрина с книгами */}
				<rect x={140} y={900} width={520} height={420} fill="#3a2a22" />
				<rect x={150} y={910} width={500} height={400} fill="#f6e6c4" opacity={0.25} />
				{[0, 1, 2].map((r) =>
					Array.from({length: 16}).map((_, i) => {
						const hgt = 70 + rnd(`bk${r}${i}`) * 40;
						return <rect key={`${r}-${i}`} x={162 + i * 30} y={1010 + r * 110 - hgt} width={24} height={hgt} fill={['#a8432a', '#2f5a7a', '#d9a441', '#3f7a5a', '#7a3a5a', '#e8dcc0'][Math.floor(rnd(`bc${r}${i}`) * 6)]} />;
					}),
				)}
				{[1010, 1120, 1230].map((y) => (
					<rect key={y} x={150} y={y} width={500} height={8} fill="#5a3a24" />
				))}
				{/* листок в витрине (объявление) — проявляется */}
				<g opacity={cold}>
					<rect x={480} y={930} width={150} height={110} fill="#f4f0e4" transform="rotate(-3 555 985)" />
					{[0, 1, 2, 3].map((i) => (
						<path key={i} d={`M${498},${950 + i * 22} l${110 - i * 12},0`} stroke="#1a1410" strokeWidth={6} strokeLinecap="round" transform="rotate(-3 555 985)" />
					))}
				</g>
				{/* дверь */}
				<rect x={720} y={900} width={240} height={420} fill="#2f4a3a" />
				<rect x={740} y={920} width={200} height={190} fill="#f6e6c4" opacity={0.35} />
				<circle cx={930} cy={1150} r={8} fill="#e8c87a" />
				<rect x={-100} y={1320} width={W + 200} height={700} fill="#c4a27a" />
				<rect x={-100} y={1320} width={W + 200} height={14} fill="#8a6a4a" />
			</Layer>
			<Layer p={p} depth={0.7} zoom={0.1}>
				<Person x={420} y={1640} h={520} facing={1} look={GUIDO} rim={{color: '#fff0c8', side: -1, strength: 0.5}} pose={{lean: 10 + laugh, head: -12 + laugh * 2, armL: 60, elbowL: 50, armR: 100, elbowR: 30}} />
				<Person x={640} y={1640 - jump} h={320} facing={-1} look={SON} rim={{color: '#fff0c8', side: 1, strength: 0.5}} pose={{armL: 150, elbowL: 10, armR: 140, elbowR: 10, head: -14, thighL: jump > 4 ? 20 : 0, kneeL: jump > 4 ? 40 : 0}} />
				{/* длинные тени людей в форме */}
				<g opacity={cold * 0.85} transform={`translate(${shadowX} 1680) skewX(-38) scale(1 -0.9)`}>
					<Figure x={0} y={0} h={700} facing={-1} color="#0e1220" pose={walkPose(frame / 9, 0.5)} hat />
					<Figure x={180} y={0} h={720} facing={-1} color="#0e1220" pose={walkPose(frame / 9 + 1.5, 0.5)} hat />
				</g>
			</Layer>
			{/* похолодание света */}
			<rect x={0} y={0} width={W} height={H} fill="#1c2a4a" opacity={cold * 0.5} />
			<Vignette id="shop" strength={0.45 + cold * 0.3} color="#1a1010" />
		</>
	);
};

/* ======================= 5. Поезд: Дора идёт к вагону ======================= */
const Train: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const walk = interpolate(frame, [0, frames], [0, 1], clamp);
	const dx = 980 - walk * 300;
	return (
		<>
			<LifeDefs />
			<Sky id="sky-train" stops={['#5e6878', '#8a929e', '#b5b8bc', '#8a8e94']} />
			<Layer p={p} depth={0.2} pan={[-20, 0]}>
				{/* вагоны уходят вдаль */}
				{[0, 1, 2, 3].map((i) => {
					const s = 1 - i * 0.22;
					const x = 80 + i * 230;
					return (
						<g key={i} transform={`translate(${x} ${1100 - i * 40}) scale(${s})`} opacity={1 - i * 0.18}>
							<rect x={-200} y={-300} width={360} height={300} fill="#5a3a2c" />
							{Array.from({length: 9}).map((_, j) => (
								<rect key={j} x={-196 + j * 40} y={-296} width={3} height={292} fill="#3a241a" />
							))}
							<path d="M-210,-300 Q-20,-340 170,-300 Z" fill="#3a2a22" />
							<rect x={-60} y={-260} width={30} height={14} fill="#1a120c" />
						</g>
					);
				})}
				<Fog y={1000} frame={frame} seed="tr-fog" opacity={0.5} color="c9d3e0" count={7} />
			</Layer>
			<Layer p={p} depth={0.45} pan={[-30, 0]} zoom={0.1}>
				{/* ближний вагон с открытой дверью */}
				<rect x={-100} y={1360} width={W + 200} height={700} fill="#4a4c52" />
				<rect x={-100} y={1360} width={W + 200} height={12} fill="#2a2c30" />
				<rect x={-40} y={820} width={700} height={500} fill="#6a4232" />
				{Array.from({length: 18}).map((_, j) => (
					<rect key={j} x={-36 + j * 40} y={824} width={3} height={492} fill="#4a2c20" />
				))}
				<path d="M-60,820 Q300,770 680,820 Z" fill="#3a2a22" />
				<rect x={200} y={900} width={220} height={420} fill="#0a0806" />
				<rect x={430} y={890} width={230} height={440} fill="#5a3628" />
				<rect x={-40} y={1316} width={700} height={24} fill="#1a1410" />
				{[60, 200, 460, 600].map((x) => (
					<circle key={x} cx={x} cy={1350} r={30} fill="#141010" />
				))}
				<Smoke frame={frame} x={700} y={860} seed="tr-sm" color="d8d4cc" rate={8} drift={0.6} size={50} opacity={0.4} />
				{/* люди уходят в вагон */}
				{[0, 1, 2, 3].map((i) => (
					<Figure key={i} x={340 + i * 70 - ((frame * 0.7 + i * 40) % 160)} y={1360} h={300 - i * 10} facing={-1} color="#24262c" pose={walkPose(frame / 8 + i, 0.6)} />
				))}
			</Layer>
			<Layer p={p} depth={0.85} pan={[-40, 0]} zoom={0.14}>
				<Person x={dx} y={1700} h={600} facing={-1} look={DORA} tint={{color: '#5e6878', amount: 0.2}} rim={{color: '#ffcf8a', side: 1, strength: 0.7}} pose={walkPose(frame / 7, 0.85)} />
			</Layer>
			<Fog y={1500} frame={frame} seed="tr-fog2" opacity={0.3} color="c9d3e0" count={5} />
			<Vignette id="train" strength={0.6} color="#101218" />
		</>
	);
};

/* ======================= 6. Барак: «это игра!» ======================= */
const Barrack6: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const glowT = interpolate(frame, [frames * 0.3, frames * 0.8], [0.2, 1], {...clamp, easing: ease});
	const nod = Math.sin(frame / 9) * 3;
	return (
		<>
			<LifeDefs />
			<Sky id="sky-bar" stops={['#0d0f16', '#151a24', '#1c2230', '#0b0d12']} />
			<Layer p={p} depth={0.25}>
				{/* нары слева и справа */}
				{[0, 1, 2].map((r) => (
					<g key={r}>
						<path d={`M-40,${760 + r * 230} L300,${820 + r * 200} L300,${850 + r * 200} L-40,${800 + r * 230} Z`} fill="#3a2c22" />
						<path d={`M1120,${760 + r * 230} L780,${820 + r * 200} L780,${850 + r * 200} L1120,${800 + r * 230} Z`} fill="#3a2c22" />
					</g>
				))}
				{[300, 780].map((x) => (
					<rect key={x} x={x - 6} y={780} width={12} height={700} fill="#2a2018" />
				))}
				<rect x={-100} y={1420} width={W + 200} height={700} fill="#14110e" />
				{/* луч из щели */}
				<path d="M700,620 L760,620 L560,1500 L260,1500 Z" fill="url(#lb-ray)" opacity={0.7} />
				<rect x={690} y={604} width={80} height={14} fill="#ffe2a8" opacity={0.8} />
				<Particles frame={frame} count={40} kind="dust" seed="bar-dust" area={[300, 640, 400, 860]} opacity={0.8} />
			</Layer>
			<Layer p={p} depth={0.75} zoom={0.16}>
				<Person x={360} y={1560} h={560} facing={1} look={GUIDO_CAMP} tint={{color: '#151a24', amount: 0.35}} rim={{color: '#ffe2a8', side: 1, strength: 0.7}} pose={{thighL: 95, kneeL: 125, thighR: 60, kneeR: 150, lean: 18, armL: 75, elbowL: 30, armR: 30, elbowR: 40, head: nod, bob: 34}} />
				<Person x={640} y={1560} h={360} facing={-1} look={SON_CAMP} tint={{color: '#151a24', amount: 0.3}} rim={{color: '#ffe2a8', side: -1, strength: 0.7}} pose={{armL: 70, elbowL: 40, armR: -6, head: -16}} />
				{/* бумажный танк на ладони */}
				<circle cx={560} cy={1360} r={140} fill="url(#lb-gold)" opacity={0.6 * glowT} />
				<Tank x={560} y={1362} s={0.55} fill="#e9d2a0" stroke="#7a5a2a" sw={1.5} />
			</Layer>
			<Vignette id="bar" strength={0.8} />
		</>
	);
};

/* ======================= 7. Прятки: луч фонаря и сапоги ======================= */
const Hide: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const beamX = interpolate(frame, [0, frames * 0.55, frames], [1100, 380, 120], {...clamp, easing: ease});
	const step = interpolate(frame, [0, frames], [980, 760], clamp);
	const near = Math.max(0, 1 - Math.abs(beamX - 330) / 260);
	const blink = Math.sin(frame / 23) > 0.96 ? 0.1 : 1;
	return (
		<>
			<LifeDefs />
			<Sky id="sky-hide" stops={['#06080d', '#0b0e16', '#10141e', '#07090d']} />
			<Layer p={p} depth={0.3}>
				{/* стена из досок */}
				{Array.from({length: 14}).map((_, i) => (
					<rect key={i} x={i * 80 - 20} y={500} width={76} height={1000} fill={i % 2 ? '#141820' : '#11141b'} />
				))}
				<rect x={-100} y={1380} width={W + 200} height={700} fill="#0d0f14" />
				{/* луч фонаря по полу и стене */}
				<g>
					<path d={`M1300,900 L${beamX - 180},1300 L${beamX + 120},1520 Z`} fill="url(#lb-torch)" opacity={0.55} />
					<ellipse cx={beamX} cy={1420} rx={220} ry={80} fill="#fff2c8" opacity={0.28} />
				</g>
			</Layer>
			<Layer p={p} depth={0.6} zoom={0.18}>
				{/* ящик, в щели — глаза мальчика */}
				<g>
					<rect x={160} y={1100} width={340} height={330} fill="#4a3424" />
					{[0, 1, 2, 3].map((i) => (
						<rect key={i} x={160} y={1100 + i * 84} width={340} height={6} fill="#2a1c12" />
					))}
					<rect x={160} y={1100} width={340} height={330} fill="#fff2c8" opacity={near * 0.25} />
					<rect x={250} y={1188} width={160} height={22} fill="#030304" />
					<g opacity={blink}>
						<ellipse cx={305} cy={1199} rx={8} ry={6} fill="#f4efe4" />
						<ellipse cx={355} cy={1199} rx={8} ry={6} fill="#f4efe4" />
						<circle cx={308} cy={1199} r={3.4} fill="#1a1210" />
						<circle cx={358} cy={1199} r={3.4} fill="#1a1210" />
					</g>
				</g>
			</Layer>
			<Layer p={p} depth={0.9} zoom={0.12}>
				{/* сапоги солдата: ноги огромной фигуры, торс за кадром */}
				<Person x={step} y={1560} h={1900} facing={-1} look={SOLDIER} tint={{color: '#07090d', amount: 0.55}} rim={{color: '#fff2c8', side: 1, strength: 0.5}} pose={{...walkPose(frame / 14, 0.45), armL: 4, armR: -4, elbowL: 4, elbowR: 4}} />
			</Layer>
			<Vignette id="hide" strength={0.85} />
		</>
	);
};

/* ======================= 8. Реальная история: фото отца, награды ======================= */
const Father: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const lamp = 0.95 + 0.05 * Math.sin(frame / 30);
	const awards = interpolate(frame, [frames * 0.5, frames * 0.75], [0, 1], {...clamp, easing: ease});
	const Statue: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
		<g transform={`translate(${x} ${y}) scale(${s})`}>
			<rect x={-26} y={-30} width={52} height={30} fill="#3a2a1a" />
			<rect x={-20} y={-40} width={40} height={10} fill="#c9a048" />
			<path d="M-8,-40 L-6,-120 Q-12,-130 -8,-140 Q0,-150 8,-140 Q12,-130 6,-120 L8,-40 Z" fill="#e2b85a" />
			<circle cx={0} cy={-154} r={10} fill="#e2b85a" />
			<path d="M-3,-120 L-2,-50" stroke="#fff3c8" strokeWidth={2} opacity={0.7} />
		</g>
	);
	return (
		<>
			<LifeDefs />
			<Sky id="sky-fa" stops={['#2a1e14', '#3a2a1c', '#4a3422', '#1e150e']} />
			<Layer p={p} depth={0.3} zoom={0.1}>
				<circle cx={820} cy={760} r={520} fill="url(#lb-sepia)" opacity={0.55 * lamp} />
				{/* стол */}
				<rect x={-100} y={1340} width={W + 200} height={700} fill="#3a2414" />
				<rect x={-100} y={1340} width={W + 200} height={14} fill="#5a3a22" />
				{/* лампа */}
				<path d="M780,820 L900,820 L940,920 L740,920 Z" fill="#2f4a3a" />
				<rect x={834} y={920} width={12} height={400} fill="#6a5030" />
				<ellipse cx={840} cy={1340} rx={60} ry={12} fill="#6a5030" />
				<path d="M760,920 L920,920 L1080,1340 L620,1340 Z" fill="#ffe2a8" opacity={0.08 * lamp} />
				{/* фотография в рамке — сепия */}
				<g transform="rotate(-4 380 1020)">
					<rect x={170} y={720} width={420} height={560} fill="#7a5530" />
					<rect x={190} y={740} width={380} height={520} fill="#e7d3ae" />
					<rect x={210} y={760} width={340} height={440} fill="#b8946a" />
					<rect x={210} y={1060} width={340} height={140} fill="#9a7650" />
					<g opacity={0.9}>
						<Figure x={380} y={1190} h={380} facing={1} color="#4a3220" kind="man" hat />
					</g>
					<rect x={210} y={760} width={340} height={440} fill="#fff4dc" opacity={0.12} />
				</g>
				{/* награды */}
				<g opacity={awards} transform={`translate(0 ${(1 - awards) * 30})`}>
					<Statue x={640} y={1350} s={1.6} />
					<Statue x={760} y={1350} s={1.75} />
					<Statue x={880} y={1350} s={1.6} />
					<circle cx={760} cy={1150} r={260} fill="url(#lb-gold)" opacity={0.35} />
					{/* пальмовая ветвь */}
					<g transform="translate(1000 1340) rotate(-24) scale(1.3)">
						<path d="M0,0 Q-10,-120 10,-230" stroke="#d6ad52" strokeWidth={6} fill="none" />
						{Array.from({length: 9}).map((_, i) => (
							<g key={i}>
								<path d={`M${-1 + i * 1.2},${-20 - i * 24} q-34,-6 -46,-30 q26,4 46,24`} fill="#e2b85a" />
								<path d={`M${1 + i * 1.2},${-30 - i * 24} q34,-6 44,-30 q-26,4 -44,24`} fill="#e2b85a" />
							</g>
						))}
					</g>
				</g>
			</Layer>
			{/* сепия-тон */}
			<rect x={0} y={0} width={W} height={H} fill="#7a5530" opacity={0.12} />
			<Particles frame={frame} count={26} kind="dust" seed="fa-dust" area={[500, 700, 500, 600]} opacity={0.6} />
			<Vignette id="fa" strength={0.75} color="#140c06" />
		</>
	);
};

/* ======================= 9. Рассвет: отец поднимает сына к свету ======================= */
const Sunrise: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const sun = interpolate(frame, [0, frames], [1180, 1080], clamp);
	const lift = interpolate(frame, [0, frames * 0.5], [0, 1], {...clamp, easing: ease});
	const sonPose: Pose = sitPose({armL: 150 + Math.sin(frame / 8) * 10, elbowL: 10, armR: 165, elbowR: 6, thighL: 80, kneeL: 90, thighR: 75, kneeR: 85, lean: -4, head: -14});
	return (
		<>
			<LifeDefs />
			<Sky id="sky-sr" stops={['#3a4a7a', '#c97a5a', '#f2b46a', '#ffe0a0']} />
			<Layer p={p} depth={0.08}>
				<circle cx={540} cy={sun} r={110} fill="#fff1c4" />
				<circle cx={540} cy={sun} r={520} fill="url(#sun)" />
				{Array.from({length: 12}).map((_, i) => {
					const a = -170 + i * 15;
					const r = (a * Math.PI) / 180;
					return <path key={i} d={`M540,${sun} L${540 + Math.cos(r - 0.03) * 1400},${sun + Math.sin(r - 0.03) * 1400} L${540 + Math.cos(r + 0.03) * 1400},${sun + Math.sin(r + 0.03) * 1400} Z`} fill="#fff1c4" opacity={0.08 + 0.04 * Math.sin(frame / 20 + i)} />;
				})}
				<Birds frame={frame} seed="sr-b" count={5} x={200} y={760} vx={1.1} vy={-0.2} size={18} color="#4a2e2a" />
			</Layer>
			<Layer p={p} depth={0.25}>
				<path d="M-100,1260 Q240,1150 540,1220 Q820,1280 1180,1170 L1180,2000 L-100,2000 Z" fill="#a8604a" />
				<Fog y={1200} frame={frame} seed="sr-fog" opacity={0.5} color="f0c79a" count={7} />
				{/* дальний забор растворяется в тумане */}
				<g opacity={0.25}>
					<Fence y={1270} x0={-60} x1={1160} gap={170} h={120} color="#5a2e2a" seed="srf" />
				</g>
			</Layer>
			<Layer p={p} depth={0.7} zoom={0.12}>
				<path d="M-100,1560 Q300,1440 600,1500 Q900,1550 1180,1480 L1180,2100 L-100,2100 Z" fill="#4a2a24" />
				<g transform={`translate(0 ${-lift * 20})`}>
					{/* сын на плечах отца, руки к солнцу */}
					<Person x={515} y={1210 - lift * 30} h={330} facing={1} look={SON_CAMP} tint={{color: '#3a1e1a', amount: 0.6}} rim={{color: '#ffe0a0', side: 1, strength: 0.9}} pose={sonPose} />
					<Person x={520} y={1560} h={540} facing={1} look={GUIDO_CAMP} tint={{color: '#3a1e1a', amount: 0.65}} rim={{color: '#ffe0a0', side: 1, strength: 0.9}} pose={{armL: 150, elbowL: 40, armR: 140, elbowR: 40, head: -16}} />
				</g>
			</Layer>
			<Particles frame={frame} count={30} kind="dust" seed="sr-dust" area={[0, 900, 1080, 700]} opacity={0.6} />
			<Vignette id="sr" strength={0.5} color="#2a140c" />
		</>
	);
};

export const LIFE_SETS = {
	camp: Camp,
	wedding: Wedding,
	greenhorse: GreenHorse,
	shop: Shop,
	train: Train,
	barrack: Barrack6,
	hide: Hide,
	father: Father,
	sunrise: Sunrise,
} as const;

export const LIFE_CAMERA: Record<keyof typeof LIFE_SETS, [number, number, number]> = {
	camp: [1, 540, 1100],
	wedding: [1, 540, 1100],
	greenhorse: [1, 540, 1100],
	shop: [1, 540, 1100],
	train: [1, 540, 1100],
	barrack: [1.05, 520, 1250],
	hide: [1, 540, 1100],
	father: [1, 540, 1100],
	sunrise: [1, 540, 1100],
};
