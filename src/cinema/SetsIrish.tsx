// Декорации для «Ирландца» (2D вектор, нуар). Палитра: ночной сине-стальной, янтарные лампы, красный акцент «краски».
import React from 'react';
import {Easing, interpolate, staticFile} from 'remotion';
import {Fog, H, Layer, Particles, Sky, Smoke, Stars, W, clamp, rnd} from './kit';
import {sitPose, walkPose} from './people';
import {Person, type Look} from './person';

type SetProps = {frame: number; frames: number};
const ease = Easing.inOut(Easing.cubic);

/* ---------- герои ---------- */
const FRANK: Look = {skin: '#e2b89a', hair: '#3a2a20', hairStyle: 'slick', top: '#2e3440', shirt: '#ebe6da', tie: '#6a1e24', bottom: '#262b34', shoes: '#141414'};
const FRANK_DRIVER: Look = {skin: '#e2b89a', hair: '#3a2a20', hairStyle: 'slick', top: '#55697e', shirt: '#d9d2c2', bottom: '#2f3a48', shoes: '#1e1a16', rolled: true};
const OLD_FRANK: Look = {skin: '#dcb8a2', hair: '#e4e4e4', hairStyle: 'slick', top: '#4b5262', shirt: '#cfcac0', bottom: '#3a3f4b', shoes: '#1a1a1a'};
const RUSSELL: Look = {skin: '#d8b096', hair: '#9a9a9a', hairStyle: 'slick', top: '#1d2026', shirt: '#d8d4cc', tie: '#3a3d46', bottom: '#1a1d22', shoes: '#0d0d0d', hat: '#25272d'};
const HOFFA: Look = {skin: '#e0b494', hair: '#1c1816', hairStyle: 'slick', top: '#7a7262', shirt: '#f1ede4', tie: '#7a2424', bottom: '#5e584c', shoes: '#1e1a16'};
const PEGGY: Look = {kind: 'woman', skin: '#f0cbb0', hair: '#3a2418', hairStyle: 'bob', top: '#b8865a', bottom: '#b8865a', shoes: '#2a1c14'};

/* ---------- общие детали ---------- */
const Vignette: React.FC<{color?: string; strength?: number; id: string}> = ({color = '#000000', strength = 0.7, id}) => (
	<g>
		<defs>
			<radialGradient id={`vig-${id}`} cx="50%" cy="54%" r="72%">
				<stop offset="52%" stopColor={color} stopOpacity={0} />
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

const IrDefs: React.FC = () => (
	<defs>
		{glow('ir-amber', '#ffc77a', 0.95)}
		{glow('ir-cold', '#cfe0ff', 0.8)}
		{glow('ir-red', '#ff2a2a', 0.85)}
		{glow('ir-neon', '#ff5a4a', 0.9)}
		<linearGradient id="ir-cone" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stopColor="#ffd9a0" stopOpacity={0.55} />
			<stop offset="100%" stopColor="#ffd9a0" stopOpacity={0} />
		</linearGradient>
		<linearGradient id="ir-window" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stopColor="#e8f0ff" stopOpacity={0.5} />
			<stop offset="100%" stopColor="#e8f0ff" stopOpacity={0} />
		</linearGradient>
		<filter id="ir-blur" x="-50%" y="-50%" width="200%" height="200%">
			<feGaussianBlur stdDeviation="14" />
		</filter>
	</defs>
);

/** Подвесная лампа с конусом света */
const Lamp: React.FC<{x: number; y: number; len?: number; swing?: number; cone?: number; color?: string}> = ({x, y, len = 260, swing = 0, cone = 1, color = '#ffd9a0'}) => {
	const lx = x + Math.sin(swing) * len;
	const ly = y + Math.cos(swing) * len;
	return (
		<g>
			<path d={`M${lx - 40},${ly + 30} L${lx - 420},${ly + 1100} L${lx + 420},${ly + 1100} L${lx + 40},${ly + 30} Z`} fill="url(#ir-cone)" opacity={0.55 * cone} />
			<line x1={x} y1={y - 400} x2={lx} y2={ly} stroke="#0a0a0c" strokeWidth={4} />
			<path d={`M${lx - 60},${ly + 34} Q${lx},${ly - 26} ${lx + 60},${ly + 34} Z`} fill="#1a2a24" />
			<ellipse cx={lx} cy={ly + 34} rx={30} ry={8} fill={color} />
			<circle cx={lx} cy={ly + 40} r={160} fill="url(#ir-amber)" opacity={0.7 * cone} />
		</g>
	);
};

/** Инвалидное кресло (сбоку), сиденье на высоте seatY */
const Wheelchair: React.FC<{x: number; y: number; s: number; color?: string; lit?: string}> = ({x, y, s, color = '#2a2e38', lit = '#9fb4e8'}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<circle cx={-10} cy={-34} r={33} fill="none" stroke={color} strokeWidth={5} />
		<circle cx={-10} cy={-34} r={33} fill="none" stroke={lit} strokeWidth={1.5} opacity={0.5} strokeDasharray="30 180" />
		<circle cx={-10} cy={-34} r={4} fill={color} />
		<circle cx={30} cy={-8} r={8} fill="none" stroke={color} strokeWidth={4} />
		<path d="M-34,-48 L26,-48 L30,-16 M-30,-48 L-38,-110 M-38,-110 L-46,-112" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
	</g>
);

/** Грузовик-рефрижератор 50-х, вид сбоку (кабина справа). bonnet — открытый капот 0..1 */
const Truck: React.FC<{x: number; y: number; s: number; bonnet?: number; body?: string; cab?: string; tint?: number}> = ({x, y, s, bonnet = 0, body = '#d9d4c6', cab = '#8a2a26', tint = 0}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<ellipse cx={0} cy={2} rx={330} ry={14} fill="#000" opacity={0.35} />
		{/* кузов-фургон */}
		<rect x={-330} y={-250} width={400} height={200} rx={10} fill={body} />
		<rect x={-330} y={-250} width={400} height={18} rx={8} fill="#ffffff" opacity={0.25} />
		{[0, 1, 2, 3, 4].map((i) => (
			<rect key={i} x={-316 + i * 78} y={-226} width={6} height={160} fill="#000" opacity={0.08} />
		))}
		<rect x={-330} y={-60} width={420} height={18} fill="#2a2a2e" />
		{/* кабина */}
		<path d="M80,-60 L80,-200 Q80,-214 94,-214 L170,-214 Q190,-214 200,-196 L232,-130 L300,-122 Q320,-118 322,-96 L322,-60 Z" fill={cab} />
		<path d="M100,-196 L168,-196 Q180,-196 186,-184 L210,-136 L100,-136 Z" fill="#a8c4d8" opacity={0.75} />
		<rect x={300} y={-104} width={24} height={14} rx={4} fill="#ffe6a8" />
		{/* капот (поднят) */}
		<g transform={`rotate(${-bonnet * 48} 232 -130)`}>
			<path d="M232,-130 L300,-122 Q320,-118 322,-100 L232,-112 Z" fill={cab} />
		</g>
		{bonnet > 0.3 && <rect x={238} y={-116} width={74} height={30} fill="#141414" opacity={0.8} />}
		{/* колёса */}
		{[-250, -150, 230].map((wx) => (
			<g key={wx}>
				<circle cx={wx} cy={-30} r={34} fill="#141414" />
				<circle cx={wx} cy={-30} r={14} fill="#6a6a6a" />
			</g>
		))}
		{tint > 0 && <rect x={-340} y={-260} width={680} height={280} fill="#0a1020" opacity={tint} />}
	</g>
);

/** Бензоколонка 50-х */
const Pump: React.FC<{x: number; y: number; s: number; color?: string}> = ({x, y, s, color = '#b8322a'}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<rect x={-30} y={-180} width={60} height={180} rx={10} fill={color} />
		<circle cx={0} cy={-200} r={30} fill="#f4ecd8" />
		<circle cx={0} cy={-200} r={22} fill={color} opacity={0.5} />
		<rect x={-20} y={-150} width={40} height={36} rx={4} fill="#f4ecd8" opacity={0.85} />
		<path d="M30,-120 Q60,-110 52,-60" stroke="#1a1a1a" strokeWidth={5} fill="none" />
	</g>
);

/** Красные потёки «краски» по стене: grow 0..1 */
const Drips: React.FC<{x0: number; x1: number; y: number; grow: number; seed: string; count?: number; maxLen?: number}> = ({x0, x1, y, grow, seed, count = 14, maxLen = 520}) => (
	<g>
		<path d={`M${x0},${y} Q${(x0 + x1) / 2},${y - 30} ${x1},${y} L${x1},${y + 40} L${x0},${y + 40} Z`} fill="#8e0f16" opacity={Math.min(1, grow * 2)} />
		{Array.from({length: count}).map((_, i) => {
			const cx = x0 + ((i + 0.5) / count) * (x1 - x0) + (rnd(`${seed}x${i}`) - 0.5) * 30;
			const len = maxLen * (0.3 + rnd(`${seed}l${i}`) * 0.7) * Math.min(1, grow * (0.8 + rnd(`${seed}s${i}`) * 0.6));
			const w = 10 + rnd(`${seed}w${i}`) * 16;
			return (
				<g key={i}>
					<rect x={cx - w / 2} y={y + 20} width={w} height={len} rx={w / 2} fill="#9a121a" />
					<circle cx={cx} cy={y + 20 + len} r={w * 0.75} fill="#9a121a" />
					<rect x={cx - w / 2 + 2} y={y + 24} width={3} height={len * 0.7} rx={2} fill="#ff6a5a" opacity={0.35} />
				</g>
			);
		})}
	</g>
);

/** Окно в стене (рама + свет) */
const WindowLight: React.FC<{x: number; y: number; w: number; h: number; sky?: string; snow?: number; frame?: number}> = ({x, y, w, h, sky = '#c9d6e6', snow = 0, frame = 0}) => (
	<g>
		<rect x={x} y={y} width={w} height={h} fill={sky} />
		{snow > 0 &&
			Array.from({length: 40}).map((_, i) => {
				const sx = x + ((rnd(`sn${i}`) * w + frame * 0.3) % w);
				const sy = y + ((rnd(`sny${i}`) * h + frame * (1 + rnd(`snv${i}`))) % h);
				return <circle key={i} cx={sx} cy={sy} r={2 + rnd(`snr${i}`) * 3} fill="#ffffff" opacity={0.8 * snow} />;
			})}
		<rect x={x} y={y} width={w} height={h} fill="none" stroke="#2a2e38" strokeWidth={18} />
		<line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#2a2e38" strokeWidth={12} />
		<line x1={x} y1={y + h * 0.45} x2={x + w} y2={y + h * 0.45} stroke="#2a2e38" strokeWidth={12} />
	</g>
);

/* ======================= 1. Дом престарелых: старик у окна ======================= */
const Nursing: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const breathe = Math.sin(frame / 40) * 1.5;
	return (
		<>
			<IrDefs />
			<rect x={0} y={0} width={W} height={H} fill="#1c2230" />
			<Layer p={p} depth={0.25}>
				{/* коридор в перспективе */}
				<path d="M-100,500 L380,820 L700,820 L1180,500 Z" fill="#141924" />
				<path d="M-100,500 L380,820 L380,1260 L-100,1700 Z" fill="#2a3242" />
				<path d="M1180,500 L700,820 L700,1260 L1180,1700 Z" fill="#232a38" />
				<path d="M-100,1700 L380,1260 L700,1260 L1180,1700 Z" fill="#39404c" />
				{/* плитка пола */}
				{[0, 1, 2, 3, 4, 5].map((i) => {
					const t = i / 6;
					const yy = 1260 + (1700 - 1260) * t * t;
					return <line key={i} x1={-100} y1={yy} x2={1180} y2={yy} stroke="#2c323e" strokeWidth={3} />;
				})}
				{/* двери по стенам */}
				{[0, 1].map((i) => (
					<g key={i}>
						<path d={`M${120 + i * 150},${1000 - i * 70} L${210 + i * 110},${960 - i * 55} L${210 + i * 110},${1350 - i * 40} L${120 + i * 150},${1440 - i * 70} Z`} fill="#1a1f2a" />
						<path d={`M${960 - i * 150},${1000 - i * 70} L${870 - i * 110},${960 - i * 55} L${870 - i * 110},${1350 - i * 40} L${960 - i * 150},${1440 - i * 70} Z`} fill="#161b25" />
					</g>
				))}
				{/* окно в торце */}
				<WindowLight x={420} y={850} w={240} h={300} sky="#d8e2ee" />
				<path d="M420,1150 L660,1150 L980,1700 L100,1700 Z" fill="url(#ir-window)" opacity={0.35} />
				<circle cx={540} cy={1000} r={380} fill="url(#ir-cold)" opacity={0.4} />
			</Layer>
			<Layer p={p} depth={0.7} zoom={0.12}>
				{/* старик в кресле у окна, силуэт против света */}
				<Wheelchair x={560} y={1520} s={2.6} color="#10141c" lit="#cfe0ff" />
				<Person x={540} y={1520} h={430} facing={-1} look={OLD_FRANK} tint={{color: '#0c1018', amount: 0.55}} rim={{color: '#e8f0ff', side: 1, strength: 0.75}} pose={sitPose({lean: 14 + breathe, head: 10, armL: 50, elbowL: 50, armR: 40, elbowR: 60})} />
			</Layer>
			<Particles frame={frame} count={20} kind="dust" seed="nh-dust" area={[300, 850, 500, 700]} opacity={0.35} />
			<Vignette id="nh" strength={0.75} color="#05070c" />
		</>
	);
};

/* ======================= 2. Заправка: заглохший грузовик, незнакомец в шляпе ======================= */
const TruckStop: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const bonnet = interpolate(frame, [0, frames * 0.25], [0.2, 1], {...clamp, easing: ease});
	const work = Math.sin(frame / 7) * 6;
	const neon = 0.85 + 0.15 * Math.sin(frame / 3) * (Math.sin(frame / 23) > 0.7 ? 1 : 0);
	return (
		<>
			<IrDefs />
			<Sky id="sky-ts" stops={['#2a2448', '#6a3a5a', '#d26a4a', '#f2a65a']} />
			<Layer p={p} depth={0.08}>
				<circle cx={260} cy={1180} r={90} fill="#ffd9a0" />
				<circle cx={260} cy={1180} r={480} fill="url(#ir-amber)" opacity={0.7} />
			</Layer>
			<Layer p={p} depth={0.2} pan={[20, 0]}>
				{/* дальние холмы и столбы */}
				<path d="M-100,1260 Q200,1190 480,1230 Q800,1270 1180,1200 L1180,1400 L-100,1400 Z" fill="#3a2436" />
				{[80, 360, 640, 920].map((px) => (
					<g key={px}>
						<rect x={px} y={1060} width={8} height={220} fill="#1e1424" />
						<rect x={px - 30} y={1080} width={68} height={6} fill="#1e1424" />
					</g>
				))}
				<path d="M-100,1086 Q220,1120 364,1086 Q500,1120 644,1086 Q780,1120 924,1086 Q1060,1120 1180,1086" stroke="#1e1424" strokeWidth={2} fill="none" />
			</Layer>
			<Layer p={p} depth={0.45} pan={[30, 0]}>
				{/* заправка */}
				<rect x={600} y={980} width={480} height={320} fill="#e8dcc4" />
				<rect x={580} y={950} width={520} height={40} fill="#b8322a" />
				<rect x={640} y={1060} width={150} height={120} fill="#ffd9a0" opacity={0.85} />
				<rect x={840} y={1060} width={100} height={240} fill="#3a2a2a" />
				{/* неоновая вывеска без слов: стрелка и звезда */}
				<g opacity={neon}>
					<circle cx={840} cy={890} r={150} fill="url(#ir-neon)" opacity={0.5} />
					<path d="M720,890 L930,890 L900,860 M930,890 L900,920" stroke="#ff6a5a" strokeWidth={10} fill="none" strokeLinecap="round" />
					<circle cx={980} cy={890} r={18} fill="none" stroke="#ffe08a" strokeWidth={6} />
				</g>
				<rect x={-100} y={1290} width={W + 200} height={700} fill="#3a3038" />
				<Pump x={540} y={1300} s={1.1} />
				<Pump x={620} y={1300} s={1.1} color="#2a5a7a" />
			</Layer>
			<Layer p={p} depth={0.75} zoom={0.1} pan={[40, 0]}>
				<rect x={-100} y={1540} width={W + 200} height={500} fill="#241c24" />
				<Truck x={300} y={1560} s={1.25} bonnet={bonnet} />
				{/* незнакомец в шляпе склонился над мотором */}
				<Person x={720} y={1580} h={500} facing={-1} look={RUSSELL} rim={{color: '#ffb46a', side: -1, strength: 0.8}} pose={{lean: 34, head: 14, armL: 70 + work, elbowL: 30, armR: 60 - work, elbowR: 40}} />
				{/* Фрэнк смотрит */}
				<Person x={940} y={1600} h={540} facing={-1} look={FRANK_DRIVER} rim={{color: '#ffb46a', side: -1, strength: 0.7}} pose={{armL: 20, elbowL: 80, armR: 10, elbowR: 60, head: 4}} />
			</Layer>
			<Vignette id="ts" strength={0.6} color="#140a14" />
		</>
	);
};

/* ======================= 3. Босс: тихий человек в полумраке ресторана ======================= */
const Boss: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const nod = Math.sin(frame / 50) * 2;
	return (
		<>
			<IrDefs />
			<rect x={0} y={0} width={W} height={H} fill="#0e0c10" />
			<Layer p={p} depth={0.15}>
				{/* стены с панелями */}
				<rect x={-100} y={700} width={W + 200} height={900} fill="#2a1a18" />
				{[0, 1, 2, 3, 4].map((i) => (
					<rect key={i} x={-40 + i * 250} y={760} width={200} height={460} rx={6} fill="#33201c" stroke="#1a100e" strokeWidth={6} />
				))}
				{/* бра */}
				{[180, 900].map((bx) => (
					<g key={bx}>
						<circle cx={bx} cy={880} r={220} fill="url(#ir-amber)" opacity={0.55} />
						<path d={`M${bx - 26},${900} L${bx - 16},${860} L${bx + 16},${860} L${bx + 26},${900} Z`} fill="#ffd9a0" />
					</g>
				))}
			</Layer>
			<Layer p={p} depth={0.5} zoom={0.1}>
				<Lamp x={540} y={700} len={200} cone={0.9} />
			</Layer>
			<Layer p={p} depth={0.8} zoom={0.14}>
				{/* Рассел за столом, крупно */}
				<Person x={540} y={1840} h={1100} facing={1} look={RUSSELL} tint={{color: '#140c0a', amount: 0.25}} rim={{color: '#ffd9a0', side: -1, strength: 0.85}} pose={sitPose({lean: 6 + nod, head: 6, armL: 70, elbowL: 70, armR: 80, elbowR: 60})} />
				{/* перстень */}
				<circle cx={735} cy={1390} r={9} fill="#e8c06a" />
				<circle cx={735} cy={1390} r={30} fill="url(#ir-amber)" opacity={0.6} />
				{/* стол */}
				<path d="M60,1430 L1020,1430 L1100,1560 L-20,1560 Z" fill="#e8e0d0" />
				<rect x={-20} y={1560} width={1120} height={400} fill="#cfc4b0" />
				<path d="M-20,1560 L1100,1560 L1100,1600 L-20,1600 Z" fill="#000" opacity={0.15} />
				{/* бокалы, тарелка, пепельница с дымом */}
				<g>
					<path d="M300,1440 L330,1440 L326,1380 Q315,1350 304,1380 Z" fill="#7a1420" opacity={0.85} />
					<rect x={312} y={1440} width={6} height={30} fill="#d8e0e8" />
					<ellipse cx={315} cy={1472} rx={20} ry={5} fill="#d8e0e8" />
					<ellipse cx={720} cy={1480} rx={90} ry={22} fill="#ffffff" />
					<ellipse cx={850} cy={1460} rx={34} ry={10} fill="#4a4a50" />
				</g>
			</Layer>
			<Smoke frame={frame} x={850} y={1450} seed="boss-sm" size={40} color="9c9a98" opacity={0.35} />
			<Vignette id="boss" strength={0.85} color="#050304" />
		</>
	);
};

/* ======================= 4. Мясо: ночная разгрузка ======================= */
const Meat: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const hand = interpolate(frame, [frames * 0.15, frames * 0.55], [0, 1], {...clamp, easing: ease});
	const sway = Math.sin(frame / 25) * 2;
	return (
		<>
			<IrDefs />
			<Sky id="sky-meat" stops={['#05070e', '#0a1020', '#121a2e', '#1a2338']} />
			<Stars frame={frame} count={40} maxY={800} seed="meat-st" opacity={0.4} />
			<Layer p={p} depth={0.2}>
				{/* склад */}
				<rect x={-100} y={820} width={W + 200} height={600} fill="#141a26" />
				<rect x={600} y={940} width={360} height={380} fill="#0a0e16" />
				<circle cx={780} cy={900} r={20} fill="#cfe0ff" />
				<path d="M760,910 L600,1320 L960,1320 L800,910 Z" fill="#cfe0ff" opacity={0.08} />
				<rect x={-100} y={1320} width={W + 200} height={700} fill="#1c2230" />
			</Layer>
			<Layer p={p} depth={0.55} zoom={0.1}>
				{/* открытый кузов, вид сзади */}
				<rect x={60} y={980} width={520} height={480} fill="#d9d4c6" />
				<rect x={90} y={1010} width={460} height={430} fill="#1e2a36" />
				<rect x={90} y={1010} width={460} height={430} fill="url(#ir-cold)" opacity={0.6} />
				{/* туши на крюках */}
				{[0, 1, 2].map((i) => (
					<g key={i} transform={`rotate(${sway * (i % 2 ? 1 : -1)} ${170 + i * 140} 1030)`}>
						<line x1={170 + i * 140} y1={1015} x2={170 + i * 140} y2={1050} stroke="#9aa4b0" strokeWidth={4} />
						<path d={`M${170 + i * 140},1050 q-55,40 -50,150 q10,90 50,110 q40,-20 50,-110 q5,-110 -50,-150 Z`} fill="#c25a5a" />
						<path d={`M${170 + i * 140},1070 q-30,40 -28,120`} stroke="#f2d8c8" strokeWidth={10} fill="none" opacity={0.7} />
					</g>
				))}
				<rect x={60} y={1460} width={520} height={30} fill="#2a2a2e" />
				{/* машина покупателя справа, фары */}
				<g transform="translate(700 1500)">
					<path d="M0,-120 Q20,-200 120,-210 L300,-210 Q370,-200 400,-120 L460,-110 Q480,-100 480,-60 L480,-20 L-20,-20 L-20,-80 Z" fill="#20242c" />
					<path d="M60,-130 Q80,-190 140,-192 L260,-192 Q320,-186 340,-130 Z" fill="#0a0c10" />
					<circle cx={80} cy={-20} r={36} fill="#0a0a0a" />
					<circle cx={380} cy={-20} r={36} fill="#0a0a0a" />
					<circle cx={470} cy={-80} r={14} fill="#ffe6a8" />
				</g>
			</Layer>
			<Layer p={p} depth={0.85} zoom={0.12}>
				{/* Фрэнк передаёт ящик */}
				<g transform={`translate(${interpolate(hand, [0, 1], [0, 90])} 0)`}>
					<rect x={560} y={1180} width={150} height={100} fill="#8a6a44" />
					<rect x={560} y={1180} width={150} height={14} fill="#a8865a" />
					<path d="M580,1194 L690,1280 M690,1194 L580,1280" stroke="#6a4e30" strokeWidth={6} />
				</g>
				<Person x={480 + hand * 60} y={1640} h={560} facing={1} look={FRANK_DRIVER} tint={{color: '#0a1020', amount: 0.45}} rim={{color: '#cfe0ff', side: -1, strength: 0.8}} pose={{lean: 10, armL: 85, elbowL: 25, armR: 95, elbowR: 20, head: -4, ...walkPose(hand * 3, 0.4 * (1 - hand))}} />
			</Layer>
			<Fog y={1500} frame={frame} seed="meat-fog" opacity={0.3} color="5d6b82" count={5} />
			<Vignette id="meat" strength={0.8} color="#03050a" />
		</>
	);
};

/* ======================= 5. Звонок: ночная кухня, телефон на стене ======================= */
const Phone: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const ring = frame < frames * 0.25 ? Math.sin(frame * 1.6) * 3 : 0;
	const pick = interpolate(frame, [frames * 0.22, frames * 0.32], [0, 1], {...clamp, easing: ease});
	const redGlow = interpolate(frame, [frames * 0.65, frames], [0, 1], clamp);
	return (
		<>
			<IrDefs />
			<rect x={0} y={0} width={W} height={H} fill="#1a1e26" />
			<Layer p={p} depth={0.2}>
				{/* стена-обои в полоску */}
				<rect x={-100} y={500} width={W + 200} height={1100} fill="#4a4e44" />
				{Array.from({length: 14}).map((_, i) => (
					<rect key={i} x={-100 + i * 100} y={500} width={40} height={1100} fill="#555a4e" />
				))}
				<rect x={-100} y={1300} width={W + 200} height={30} fill="#2a2a24" />
				<rect x={-100} y={1330} width={W + 200} height={700} fill="#2e2a26" />
				{/* окно ночью: красный свет вывески снаружи */}
				<WindowLight x={640} y={760} w={300} h={380} sky="#121a2e" />
				<rect x={650} y={770} width={280} height={360} fill="url(#ir-red)" opacity={0.35 + redGlow * 0.4} />
				<Lamp x={300} y={600} len={140} cone={0.8} />
			</Layer>
			<Layer p={p} depth={0.5}>
				{/* телефон на стене */}
				<g transform={`translate(180 1020) rotate(${ring})`}>
					<rect x={-50} y={-90} width={100} height={170} rx={14} fill="#141414" />
					<circle cx={0} cy={-20} r={34} fill="#2a2a2a" stroke="#555" strokeWidth={3} />
					{pick < 0.5 && <path d="M-60,-110 Q0,-140 60,-110 L60,-90 Q0,-112 -60,-90 Z" fill="#141414" />}
				</g>
				<path d={`M180,1080 Q${220 + pick * 120},1300 ${300 + pick * 160},${1160 - pick * 40}`} stroke="#141414" strokeWidth={5} fill="none" />
			</Layer>
			<Layer p={p} depth={0.8} zoom={0.14}>
				<Person x={460} y={1720} h={620} facing={-1} look={FRANK} rim={{color: '#ff6a5a', side: 1, strength: 0.4 + redGlow * 0.5}} pose={{armL: 160 * pick, elbowL: 150 * pick, armR: 10, elbowR: 30, head: 6 * pick, lean: 4}} />
			</Layer>
			<Vignette id="ph" strength={0.75} color="#06060a" />
		</>
	);
};

/* ======================= 6. Кровь на стенах → Хоффа и Фрэнк как братья ======================= */
const Blood: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const grow = interpolate(frame, [0, frames * 0.4], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const cross = interpolate(frame, [frames * 0.42, frames * 0.58], [0, 1], {...clamp, easing: ease});
	const cheer = Math.sin(frame / 6);
	return (
		<>
			<IrDefs />
			{/* часть 1: стена, красные потёки, валик */}
			<g opacity={1 - cross}>
				<rect x={0} y={0} width={W} height={H} fill="#d8cfbe" />
				<Layer p={p} depth={0.4} zoom={0.2}>
					<rect x={-100} y={0} width={W + 200} height={H} fill="#d8cfbe" />
					{Array.from({length: 10}).map((_, i) => (
						<rect key={i} x={-100 + i * 140} y={0} width={4} height={H} fill="#b8ad98" opacity={0.5} />
					))}
					<Drips x0={-40} x1={1120} y={780} grow={grow} seed="bl" count={16} maxLen={620} />
					<rect x={-100} y={1500} width={W + 200} height={500} fill="#3a2e28" />
					{/* ведро и кисть */}
					<path d="M720,1520 L860,1520 L840,1680 L740,1680 Z" fill="#6a6a70" />
					<ellipse cx={790} cy={1520} rx={70} ry={16} fill="#7a0e14" />
					<rect x={860} y={1450} width={14} height={120} fill="#8a6a44" transform="rotate(30 867 1510)" />
				</Layer>
				<rect x={0} y={0} width={W} height={H} fill="#3a0a0c" opacity={0.25} />
			</g>
			{/* часть 2: трибуна профсоюза, Хоффа и Фрэнк плечом к плечу */}
			<g opacity={cross}>
				<Sky id="sky-bl" stops={['#0c0e18', '#1a2034', '#2a2a40', '#3a2a34']} />
				<Layer p={p} depth={0.2}>
					{/* флаги и прожекторы */}
					{[-1, 1].map((s) => (
						<path key={s} d={`M${540 + s * 600},400 L${540 + s * 80},1400 L${540 + s * 220},1400 Z`} fill="#fff4d8" opacity={0.08} />
					))}
					{[160, 380, 700, 920].map((fx, i) => (
						<g key={fx}>
							<rect x={fx} y={760} width={8} height={440} fill="#2a2a30" />
							<path d={`M${fx + 8},770 q${70},${10 + Math.sin(frame / 10 + i) * 10} 140,0 l0,110 q-70,${-10 - Math.sin(frame / 10 + i) * 10} -140,0 Z`} fill={i % 2 ? '#d8d4ca' : '#2a4a7a'} />
						</g>
					))}
					<circle cx={540} cy={1000} r={460} fill="url(#ir-amber)" opacity={0.4} />
				</Layer>
				<Layer p={p} depth={0.55}>
					{/* трибуна */}
					<path d="M300,1300 L780,1300 L740,1640 L340,1640 Z" fill="#2a3448" />
					<rect x={300} y={1290} width={480} height={20} fill="#c8a24a" />
					<circle cx={540} cy={1420} r={60} fill="#c8a24a" opacity={0.9} />
				</Layer>
				<Layer p={p} depth={0.75} zoom={0.12}>
					<Person x={420} y={1600} h={600} facing={1} look={HOFFA} rim={{color: '#ffe0a8', side: -1, strength: 0.7}} pose={{armL: 172 + cheer * 4, elbowL: 4, armR: 20, elbowR: 30, head: -8}} />
					<Person x={700} y={1610} h={640} facing={-1} look={FRANK} rim={{color: '#ffe0a8', side: 1, strength: 0.7}} pose={{armL: 14, elbowL: 20, armR: 10, elbowR: 20, head: 0}} />
					{/* толпа: головы в нижней кромке */}
					{Array.from({length: 14}).map((_, i) => (
						<g key={i}>
							<circle cx={20 + i * 80} cy={1720 + (i % 2) * 30 + Math.max(0, cheer) * (i % 3) * 6} r={46} fill="#0c0e14" />
							{i % 3 === 0 && <rect x={10 + i * 80} y={1560 - Math.max(0, cheer) * 20} width={14} height={140} rx={7} fill="#0c0e14" />}
						</g>
					))}
				</Layer>
			</g>
			<Vignette id="bl" strength={0.7} color="#08060a" />
		</>
	);
};

/* ======================= 7. Раскол: Хоффа против мафии, Фрэнк посередине ======================= */
const Rift: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const swing = Math.sin(frame / 28) * 0.06;
	const red = interpolate(frame, [frames * 0.3, frames], [0, 1], clamp);
	return (
		<>
			<IrDefs />
			<rect x={0} y={0} width={W} height={H} fill="#07080c" />
			<Layer p={p} depth={0.3}>
				<rect x={-100} y={700} width={W + 200} height={900} fill="#121620" />
				<circle cx={540} cy={1100} r={600} fill="url(#ir-red)" opacity={0.18 + red * 0.3} />
			</Layer>
			<Layer p={p} depth={0.6} zoom={0.1}>
				<Lamp x={540} y={620} len={240} swing={swing} cone={0.95} />
				{/* длинный стол */}
				<path d="M120,1400 L960,1400 L1060,1520 L20,1520 Z" fill="#3a2a22" />
				<rect x={20} y={1520} width={1040} height={30} fill="#24180f" />
				{/* Хоффа слева — стоит, рука рубит воздух */}
				<Person x={210} y={1640} h={620} facing={1} look={HOFFA} rim={{color: '#ffd9a0', side: 1, strength: 0.7}} pose={{lean: 12, armL: 100 + Math.sin(frame / 8) * 12, elbowL: 10, armR: 20, elbowR: 30, head: -4}} />
				{/* босс справа — сидит в тени */}
				<g fill="#0c0a0c">
					<rect x={790} y={1330} width={190} height={22} />
					<rect x={958} y={1120} width={22} height={480} />
					<rect x={796} y={1350} width={16} height={250} />
				</g>
				<Person x={880} y={1600} h={600} facing={-1} look={RUSSELL} tint={{color: '#07080c', amount: 0.55}} rim={{color: '#ff6a5a', side: -1, strength: 0.5 + red * 0.4}} pose={sitPose({lean: 2, head: 4, armL: 60, elbowL: 80, armR: 70, elbowR: 70})} />
			</Layer>
			<Layer p={p} depth={0.9} zoom={0.16}>
				{/* Фрэнк посередине, ближе к нам, спиной/вполоборота */}
				<Person x={540} y={1880} h={760} facing={1} look={FRANK} tint={{color: '#07080c', amount: 0.6}} rim={{color: '#ffd9a0', side: -1, strength: 0.6}} pose={{armL: 10, elbowL: 20, armR: 5, elbowR: 10, head: 6}} />
			</Layer>
			<Smoke frame={frame} x={880} y={1300} seed="rift-sm" size={40} color="9c9a98" opacity={0.3} />
			<Vignette id="rift" strength={0.85} color="#020203" />
		</>
	);
};

/* ======================= 8. Дочь в дверях ======================= */
const Daughter: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const door = interpolate(frame, [0, frames * 0.35], [0.4, 1], {...clamp, easing: ease});
	return (
		<>
			<IrDefs />
			<rect x={0} y={0} width={W} height={H} fill="#0a0c12" />
			<Layer p={p} depth={0.3}>
				{/* тёмный коридор */}
				<rect x={-100} y={600} width={W + 200} height={1000} fill="#141824" />
				{/* дверной проём, тёплый свет из детской */}
				<rect x={520} y={820} width={300 * door} height={620} fill="#ffcf8a" />
				<rect x={520} y={820} width={300 * door} height={620} fill="url(#ir-amber)" opacity={0.6} />
				<rect x={506} y={806} width={20} height={648} fill="#2a2016" />
				<path d={`M520,1440 L${520 + 300 * door},1440 L${700 + 500 * door},1800 L380,1800 Z`} fill="#ffcf8a" opacity={0.2} />
				<rect x={-100} y={1440} width={W + 200} height={600} fill="#1a1c24" opacity={0.85} />
			</Layer>
			<Layer p={p} depth={0.55} zoom={0.12}>
				{/* девочка в проёме смотрит */}
				<Person x={640} y={1440} h={330} facing={-1} look={PEGGY} tint={{color: '#3a2412', amount: 0.25}} rim={{color: '#fff0c8', side: 1, strength: 0.6}} pose={{armL: 5, elbowL: 10, armR: 5, elbowR: 10, head: 4}} />
			</Layer>
			<Layer p={p} depth={0.95} zoom={0.18}>
				{/* отец спиной, огромный тёмный силуэт слева */}
				<Person x={240} y={2050} h={1200} facing={1} look={FRANK} tint={{color: '#05060a', amount: 0.85}} rim={{color: '#ffcf8a', side: 1, strength: 0.55}} pose={{armL: 5, elbowL: 10, armR: 8, elbowR: 10, head: 4}} />
			</Layer>
			<Vignette id="dt" strength={0.8} color="#020204" />
		</>
	);
};

/* ======================= 9. Актёры: фото-стикеры под имена ======================= */
type Sticker = {src: string; x: number; y: number; w: number; h: number; at: number; tilt: number};
// at — кадр появления (AUDIO_DELAY 4 + время слова × 30)
const STICKERS: Sticker[] = [
	{src: 'assets/the-irishman/deniro-cut.png', x: 300, y: 1010, w: 380, h: 500, at: 33, tilt: -6},
	{src: 'assets/the-irishman/pacino-cut.png', x: 690, y: 1150, w: 540, h: 384, at: 50, tilt: 4},
	{src: 'assets/the-irishman/pesci-cut.png', x: 400, y: 1340, w: 420, h: 340, at: 69, tilt: -3},
];

const StickerView: React.FC<{s: Sticker; frame: number; i: number}> = ({s, frame, i}) => {
	const t = frame - s.at;
	if (t < 0) return null;
	const pop = interpolate(t, [0, 6, 10, 14], [0.2, 1.12, 0.96, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const wob = Math.sin((frame + i * 17) / 14) * 2.2;
	const bob = Math.sin((frame + i * 11) / 20) * 6;
	return (
		<g transform={`translate(${s.x} ${s.y + bob}) rotate(${s.tilt + wob}) scale(${pop})`} opacity={Math.min(1, t / 3)}>
			<image href={staticFile(s.src)} x={-s.w / 2} y={-s.h / 2} width={s.w} height={s.h} filter="url(#ir-sticker)" preserveAspectRatio="xMidYMid meet" />
		</g>
	);
};

const Actors: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	return (
		<>
			<IrDefs />
			<defs>
				{/* белая обводка + мягкая тень, как у наклейки */}
				<filter id="ir-sticker" x="-20%" y="-20%" width="140%" height="140%">
					<feMorphology in="SourceAlpha" operator="dilate" radius="9" result="dil" />
					<feFlood floodColor="#ffffff" />
					<feComposite in2="dil" operator="in" result="outline" />
					<feGaussianBlur in="dil" stdDeviation="10" result="blur" />
					<feOffset in="blur" dx="6" dy="14" result="sh" />
					<feFlood floodColor="#000000" floodOpacity="0.55" />
					<feComposite in2="sh" operator="in" result="shadow" />
					<feMerge>
						<feMergeNode in="shadow" />
						<feMergeNode in="outline" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<Sky id="sky-act" stops={['#0a0e1a', '#141c30', '#1e2440', '#2a1a24']} />
			<Layer p={p} depth={0.2}>
				<circle cx={260} cy={1500} r={620} fill="url(#ir-red)" opacity={0.28} />
				<circle cx={880} cy={1000} r={560} fill="url(#ir-cold)" opacity={0.22} />
				{/* прожекторы */}
				{[-1, 1].map((s) => (
					<path key={s} d={`M${540 + s * 700},300 L${540 + s * 60},1700 L${540 + s * 260},1700 Z`} fill="#fff4d8" opacity={0.05 + 0.02 * Math.sin(frame / 15 + s)} />
				))}
			</Layer>
			<Particles frame={frame} count={26} kind="dust" seed="act-dust" area={[0, 800, 1080, 900]} opacity={0.4} />
			{STICKERS.map((s, i) => (
				<StickerView key={i} s={s} frame={frame} i={i} />
			))}
			<Vignette id="act" strength={0.6} color="#040408" />
		</>
	);
};

/* ======================= 10. Финал: старик у окна, снег ======================= */
const Window: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	return (
		<>
			<IrDefs />
			<rect x={0} y={0} width={W} height={H} fill="#1a2030" />
			<Layer p={p} depth={0.3}>
				<rect x={-100} y={500} width={W + 200} height={1200} fill="#2a3040" />
				<WindowLight x={420} y={720} w={480} h={620} sky="#b8c6d8" snow={1} frame={frame} />
				<circle cx={660} cy={1030} r={520} fill="url(#ir-cold)" opacity={0.45} />
				<path d="M420,1340 L900,1340 L1180,1800 L200,1800 Z" fill="url(#ir-window)" opacity={0.3} />
				<rect x={-100} y={1340} width={W + 200} height={700} fill="#2e3440" />
			</Layer>
			<Layer p={p} depth={0.8} zoom={0.12}>
				<Wheelchair x={400} y={1600} s={3.2} color="#0c1018" lit="#cfe0ff" />
				<Person x={380} y={1600} h={540} facing={1} look={OLD_FRANK} tint={{color: '#0c1018', amount: 0.55}} rim={{color: '#e8f0ff', side: 1, strength: 0.8}} pose={sitPose({lean: 12, head: -4, armL: 40, elbowL: 60, armR: 30, elbowR: 70})} />
			</Layer>
			<Vignette id="win" strength={0.75} color="#05070c" />
		</>
	);
};

export const IRISH_SETS = {
	nursing: Nursing,
	truck: TruckStop,
	boss: Boss,
	meat: Meat,
	phone: Phone,
	blood: Blood,
	rift: Rift,
	daughter: Daughter,
	actors: Actors,
	window: Window,
} as const;

export const IRISH_CAMERA: Record<keyof typeof IRISH_SETS, [number, number, number]> = {
	nursing: [1, 540, 1100],
	truck: [1, 540, 1100],
	boss: [1, 540, 1100],
	meat: [1, 540, 1100],
	phone: [1, 540, 1100],
	blood: [1, 540, 1100],
	rift: [1, 540, 1100],
	daughter: [1, 540, 1100],
	actors: [1, 540, 1100],
	window: [1, 540, 1100],
};

