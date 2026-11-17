// Декорации для «Рипли»: Нью-Йорк 1961 и итальянское побережье (Атрани).
// Тёплая средиземноморская гамма: лазурь, охра, терракота, лимон.
import React from 'react';
import {Easing, interpolate} from 'remotion';
import {Birds, Clouds, Fog, H, Layer, Particles, Sky, Smoke, Stars, W, clamp, rnd} from './kit';
import {Figure, sitPose, walkPose} from './people';
import {DICKIE, MARGE, Person, TOM, TOM_HAT, TOM_LINEN, type Look} from './person';

type SetProps = {frame: number; frames: number};
const ease = Easing.inOut(Easing.cubic);

/* ---------- общие детали ---------- */

/** Море: полосы цвета + бегущие блики */
const Sea: React.FC<{frame: number; y: number; top: string; bottom: string; glint: string; seed: string; count?: number; x0?: number; x1?: number; glow?: number}> = ({
	frame,
	y,
	top,
	bottom,
	glint,
	seed,
	count = 90,
	x0 = -100,
	x1 = W + 100,
	glow,
}) => (
	<g>
		<defs>
			<linearGradient id={`sea-${seed}`} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stopColor={top} />
				<stop offset="100%" stopColor={bottom} />
			</linearGradient>
		</defs>
		<rect x={x0} y={y} width={x1 - x0} height={H - y + 200} fill={`url(#sea-${seed})`} />
		{Array.from({length: count}).map((_, i) => {
			const d = Math.pow(rnd(`${seed}d${i}`), 1.6); // 0 — горизонт, 1 — близко
			const yy = y + 4 + d * (H - y);
			const near = glow === undefined ? 1 : Math.exp(-Math.pow((rnd(`${seed}x${i}`) * (x1 - x0) + x0 - glow) / (120 + d * 260), 2));
			const xx = x0 + ((rnd(`${seed}x${i}`) * (x1 - x0) + frame * (0.2 + d * 0.6)) % (x1 - x0));
			const w = 8 + d * 70 * rnd(`${seed}w${i}`);
			const o = Math.max(0, Math.sin(frame / (7 + rnd(`${seed}t${i}`) * 9) + rnd(`${seed}p${i}`) * 6));
			return <rect key={i} x={glow === undefined ? xx : glow + (xx - W / 2) * (0.1 + d * 0.5)} y={yy} width={w} height={1.5 + d * 4} rx={2} fill={glint} opacity={o * (glow === undefined ? 0.75 : 0.95 * near + 0.1)} />;
		})}
	</g>
);

/** Дом в итальянском стиле: стена, окна со ставнями, плоская крыша */
const House: React.FC<{x: number; y: number; w: number; h: number; color: string; shade: string; shutter: string; seed: string; lit?: number}> = ({x, y, w, h, color, shade, shutter, seed, lit = 0}) => {
	const cols = Math.max(1, Math.floor(w / 34));
	const rows = Math.max(1, Math.floor(h / 40));
	return (
		<g>
			<rect x={x} y={y} width={w} height={h} fill={color} />
			<rect x={x + w - w * 0.18} y={y} width={w * 0.18} height={h} fill={shade} opacity={0.55} />
			<rect x={x - 3} y={y - 5} width={w + 6} height={7} fill={shade} opacity={0.7} />
			{Array.from({length: rows}).map((_, r) =>
				Array.from({length: cols}).map((__, c) => {
					if (rnd(`${seed}${r}${c}`) < 0.25) return null;
					const wx = x + ((c + 0.5) * w) / cols - 6;
					const wy = y + 12 + r * 40;
					const on = lit > 0 && rnd(`${seed}l${r}${c}`) < 0.55;
					return (
						<g key={`${r}-${c}`}>
							<rect x={wx} y={wy} width={12} height={18} fill={on ? '#ffc56a' : '#2a2a33'} opacity={on ? lit : 0.85} />
							{!on && <rect x={wx - 5} y={wy} width={4} height={18} fill={shutter} />}
							{!on && <rect x={wx + 13} y={wy} width={4} height={18} fill={shutter} />}
						</g>
					);
				}),
			)}
		</g>
	);
};

/** Каскад домов на склоне */
const Town: React.FC<{seed: string; x0: number; x1: number; base: number; rows: number; slope: number; palette: string[]; lit?: number; scale?: number}> = ({
	seed,
	x0,
	x1,
	base,
	rows,
	slope,
	palette,
	lit = 0,
	scale = 1,
}) => {
	const items: React.ReactNode[] = [];
	for (let r = rows - 1; r >= 0; r--) {
		let x = x0 + rnd(`${seed}o${r}`) * 30;
		let k = 0;
		while (x < x1) {
			const w = (60 + rnd(`${seed}w${r}${k}`) * 70) * scale;
			const h = (70 + rnd(`${seed}h${r}${k}`) * 70) * scale;
			const y = base - r * 52 * scale - (x - x0) * slope - h + rnd(`${seed}y${r}${k}`) * 16;
			const col = palette[Math.floor(rnd(`${seed}c${r}${k}`) * palette.length)];
			items.push(<House key={`${r}-${k}`} x={x} y={y} w={w} h={h + 60 * scale} color={col} shade="#7a4a35" shutter={rnd(`${seed}s${r}${k}`) > 0.5 ? '#3f6e58' : '#3d6e8c'} seed={`${seed}${r}${k}`} lit={lit} />);
			x += w - 4 + rnd(`${seed}g${r}${k}`) * 10;
			k++;
		}
	}
	return <g>{items}</g>;
};

/** Скалистый склон с зеленью */
const Cliff: React.FC<{d: string; color: string; green: string; seed: string; bushes?: Array<[number, number]>}> = ({d, color, green, seed, bushes = []}) => (
	<g>
		<path d={d} fill={color} />
		{bushes.map(([x, y], i) => (
			<g key={i} fill={green}>
				<circle cx={x} cy={y} r={22 + rnd(`${seed}${i}`) * 26} />
				<circle cx={x + 24} cy={y + 8} r={16 + rnd(`${seed}b${i}`) * 18} />
				<circle cx={x - 22} cy={y + 10} r={14 + rnd(`${seed}c${i}`) * 16} />
			</g>
		))}
	</g>
);

/** Кипарис */
const Cypress: React.FC<{x: number; y: number; h: number; color: string; frame: number}> = ({x, y, h, color, frame}) => {
	const sway = Math.sin(frame / 40 + x) * 3;
	return <path d={`M${x},${y} Q${x - h * 0.13},${y - h * 0.5} ${x + sway},${y - h} Q${x + h * 0.13},${y - h * 0.5} ${x},${y} Z`} fill={color} />;
};

/** Гудок/пар */
const Gull: React.FC<{frame: number; seed: string; x: number; y: number}> = ({frame, seed, x, y}) => (
	<Birds frame={frame} seed={seed} count={4} x={x} y={y} vx={0.9} vy={-0.1} size={16} color="#fdfbf5" circle={40} />
);

/* ======================= 1. Зеркало: две жизни ======================= */
const Mirror: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const merge = interpolate(frame, [30, frames * 0.75], [0, 1], {...clamp, easing: ease});
	const flick = 0.92 + 0.08 * Math.sin(frame / 4) * Math.sin(frame / 11);
	const mx = 600;
	const my = 1040;
	return (
		<>
			<Sky id="sky-mirror" stops={['#0d1418', '#16252a', '#1c2f33', '#120d0b']} />
			<Layer p={p} depth={0.15} pan={[-20, 0]}>
				{/* обои с узором */}
				{Array.from({length: 14}).map((_, i) =>
					Array.from({length: 22}).map((__, j) => (
						<path key={`${i}-${j}`} d={`M${i * 84 + (j % 2) * 42},${j * 84 + 30} l14,24 l-14,24 l-14,-24 Z`} fill="#2c4a4e" opacity={0.35} />
					)),
				)}
				<rect x={-100} y={1460} width={W + 200} height={600} fill="#1b100c" />
				<rect x={-100} y={1450} width={W + 200} height={14} fill="#3a2418" />
			</Layer>
			<Layer p={p} depth={0.4} pan={[-30, 0]} zoom={0.12}>
				{/* лампа на комоде */}
				<circle cx={190} cy={1150} r={420} fill="url(#lamp)" opacity={0.55 * flick} />
				<rect x={20} y={1300} width={340} height={170} fill="#2a170e" />
				<rect x={20} y={1296} width={340} height={10} fill="#5a3520" />
				<path d="M150,1180 L230,1180 L260,1250 L120,1250 Z" fill="#f2c98a" opacity={0.95 * flick} />
				<rect x={184} y={1250} width={12} height={46} fill="#7a5530" />
				<ellipse cx={190} cy={1298} rx={40} ry={8} fill="#7a5530" />
				{/* зеркало в золочёной раме */}
				<defs>
					<clipPath id="mirror-clip">
						<rect x={mx - 205} y={my - 300} width={410} height={600} rx={160} />
					</clipPath>
					<linearGradient id="mirror-glass" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#3a4d4f" />
						<stop offset="100%" stopColor="#141c1e" />
					</linearGradient>
				</defs>
				<rect x={mx - 230} y={my - 325} width={460} height={650} rx={180} fill="#9a7432" />
				<rect x={mx - 220} y={my - 315} width={440} height={630} rx={172} fill="#d8b25c" opacity={0.7} />
				<rect x={mx - 205} y={my - 300} width={410} height={600} rx={160} fill="url(#mirror-glass)" />
				<g clipPath="url(#mirror-clip)">
					{/* отражение лампы */}
					<circle cx={mx + 160} cy={my + 60} r={200} fill="url(#lamp)" opacity={0.4 * flick} />
					{/* Дики — светлый пиджак, проявляется и совпадает с Томом */}
					<g opacity={0.25 + merge * 0.6}>
						<Person x={mx + 170 - merge * 170} y={my + 520} h={560} facing={-1} look={DICKIE} tint={{color: '#3a4d4f', amount: 0.25}} pose={{armL: 6, armR: -4, head: -2}} />
					</g>
					<g opacity={1 - merge * 0.55}>
						<Person x={mx} y={my + 520} h={560} facing={-1} look={TOM} tint={{color: '#0a0d0f', amount: 0.6}} rim={{color: '#f2b86a', side: 1, strength: 0.8}} pose={{armL: 6, armR: -4}} />
					</g>
					{/* блик на стекле */}
					<path d={`M${mx - 160},${my - 260} L${mx - 90},${my - 260} L${mx - 220},${my + 120} L${mx - 260},${my + 120} Z`} fill="#ffffff" opacity={0.07} />
				</g>
			</Layer>
			<Layer p={p} depth={0.8} pan={[20, 0]} zoom={0.1}>
				{/* Том со спины на переднем плане */}
				<Person x={360} y={2020} h={1000} facing={1} look={TOM} tint={{color: '#06080a', amount: 0.72}} rim={{color: '#f0a858', side: -1, strength: 0.7 * flick}} pose={{armL: 4, armR: -3, head: 4}} />
			</Layer>
			<Particles frame={frame} count={40} kind="dust" seed="mirror-dust" area={[0, 700, 700, 900]} opacity={0.5} />
		</>
	);
};

/* ======================= 2. Каморка в Нью-Йорке ======================= */
const NyRoom: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const knockAt = frames * 0.7;
	const k = frame - knockAt;
	const knock = k > 0 && k < 40 ? Math.sin(k * 1.4) * Math.exp(-k / 14) : 0;
	const startle = interpolate(frame, [knockAt, knockAt + 8], [0, 1], clamp);
	const neon = Math.sin(frame / 3) > -0.6 ? 1 : 0.35;
	const bulb = Math.sin(frame / 22) * 5;
	return (
		<>
			<Sky id="sky-ny" stops={['#2a1d1a', '#3b2a22', '#2d211c', '#18110e']} />
			<Layer p={p} depth={0.2} pan={[0, 0]}>
				{/* окно на город */}
				<defs>
					<clipPath id="ny-win">
						<rect x={560} y={700} width={360} height={520} />
					</clipPath>
				</defs>
				<rect x={560} y={700} width={360} height={520} fill="#121a33" />
				<g clipPath="url(#ny-win)">
					<rect x={560} y={700} width={360} height={520} fill="#1c2748" />
					{[
						[560, 840, 110],
						[660, 760, 90],
						[740, 900, 80],
						[810, 720, 120],
					].map(([x, y, w], i) => (
						<g key={i}>
							<rect x={x} y={y} width={w} height={600} fill="#0b0f1e" />
							{Array.from({length: 24}).map((_, j) => (
								<rect key={j} x={x + 10 + (j % 4) * (w / 4.4)} y={y + 20 + Math.floor(j / 4) * 40} width={8} height={14} fill="#ffd27a" opacity={rnd(`nyw${i}${j}`) > 0.55 ? 0.8 : 0.08} />
							))}
						</g>
					))}
					{/* неоновая вывеска */}
					<rect x={600} y={1060} width={120} height={36} rx={6} fill="none" stroke="#ff4f6a" strokeWidth={5} opacity={neon} />
					<circle cx={660} cy={1078} r={160} fill="url(#red)" opacity={0.25 * neon} />
					{/* дождь */}
					{Array.from({length: 70}).map((_, i) => {
						const x = 560 + rnd(`nyr${i}`) * 400;
						const y = 700 + ((rnd(`nyry${i}`) * 520 + frame * (18 + rnd(`nyrv${i}`) * 8)) % 560);
						return <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 22} stroke="#a9c3ff" strokeWidth={1.4} opacity={0.45} />;
					})}
					{/* пожарная лестница */}
					<g stroke="#05070d" strokeWidth={6} fill="none">
						<line x1={560} y1={1000} x2={920} y2={1000} />
						<line x1={560} y1={1030} x2={920} y2={1030} />
						{Array.from({length: 9}).map((_, i) => (
							<line key={i} x1={570 + i * 42} y1={1000} x2={570 + i * 42} y2={1030} strokeWidth={3} />
						))}
						<line x1={640} y1={1030} x2={760} y2={1220} strokeWidth={5} />
					</g>
				</g>
				{/* рама окна */}
				<g fill="#140d0a">
					<rect x={548} y={690} width={384} height={14} />
					<rect x={548} y={1214} width={384} height={20} />
					<rect x={548} y={690} width={14} height={540} />
					<rect x={918} y={690} width={14} height={540} />
					<rect x={734} y={690} width={10} height={540} />
					<rect x={548} y={952} width={384} height={10} />
				</g>
				{/* отсветы неона на стене */}
				<rect x={480} y={640} width={520} height={680} fill="#ff4f6a" opacity={0.05 * neon} />
				{/* дверь слева — дрожит от стука */}
				<g transform={`translate(${knock * 6} 0)`}>
					<rect x={90} y={720} width={260} height={760} fill="#4a2f22" />
					<rect x={112} y={750} width={216} height={300} fill="#3c251a" />
					<rect x={112} y={1080} width={216} height={370} fill="#3c251a" />
					<circle cx={320} cy={1110} r={10} fill="#c9a050" />
					<rect x={90} y={1474} width={260} height={6} fill="#ffc56a" opacity={0.5 + 0.4 * Math.abs(knock)} />
				</g>
				<rect x={-100} y={1480} width={W + 200} height={600} fill="#120c0a" />
				<rect x={-100} y={1478} width={W + 200} height={8} fill="#2b1c14" />
			</Layer>
			<Layer p={p} depth={0.6} pan={[0, -10]} zoom={0.12}>
				{/* лампочка */}
				<g transform={`rotate(${bulb} 520 380)`}>
					<line x1={520} y1={380} x2={520} y2={760} stroke="#0c0806" strokeWidth={3} />
					<circle cx={520} cy={772} r={16} fill="#ffe0a0" />
					<circle cx={520} cy={772} r={300} fill="url(#lamp)" opacity={0.6} />
				</g>
				{/* стол, телефон, Том */}
				<rect x={380} y={1300} width={360} height={14} fill="#1b110c" />
				<rect x={400} y={1314} width={12} height={180} fill="#1b110c" />
				<rect x={708} y={1314} width={12} height={180} fill="#1b110c" />
				<path d="M600,1300 L612,1262 L682,1262 L694,1300 Z" fill="#0a0806" />
				<circle cx={647} cy={1282} r={14} fill="#2a2420" />
				<path d="M598,1258 Q647,1236 696,1258" stroke="#0a0806" strokeWidth={8} fill="none" />
				<rect x={250} y={1360} width={130} height={10} fill="#1b110c" />
				<rect x={258} y={1370} width={8} height={120} fill="#1b110c" />
				<rect x={366} y={1370} width={8} height={120} fill="#1b110c" />
				<Person
					x={320}
					y={1490}
					h={420}
					facing={1}
					look={{...TOM, top: '#f1eee6', shirt: undefined, tie: undefined, rolled: true}}
					tint={{color: '#1a0f0a', amount: 0.35}}
					rim={{color: '#ffcf8a', side: 1, strength: 0.6}}
					pose={sitPose({armL: 72, elbowL: 18, armR: 40, elbowR: 50, lean: 10 - startle * 10, head: startle * -22})}
				/>
			</Layer>
		</>
	);
};

/* ======================= 3. Отплытие в Италию ======================= */
const Liner: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const climb = interpolate(frame, [0, frames], [0, 1], clamp);
	const tx = 270 + climb * 300;
	const ty = 1460 - climb * 190;
	const horn = interpolate(frame, [20, 30], [0, 1], clamp);
	return (
		<>
			<Sky id="sky-liner" stops={['#5e9bd0', '#8fbde2', '#cfe3ee', '#f6e2c0']} />
			<Layer p={p} depth={0.05} pan={[30, 0]}>
				<circle cx={880} cy={760} r={380} fill="url(#sun)" opacity={0.6} />
				<Clouds frame={frame} seed="lc" y={820} count={4} color="#eef3f6" lit="#ffffff" speed={0.15} scale={0.7} opacity={0.9} />
			</Layer>
			<Layer p={p} depth={0.25} pan={[40, 0]}>
				<Sea frame={frame} y={1180} top="#5f97bd" bottom="#1f4f73" glint="#fff4d6" seed="lsea" count={70} />
				{/* лайнер */}
				<g>
					<path d="M-60,1240 L940,1240 L900,1340 L-60,1340 Z" fill="#141518" />
					<rect x={-60} y={1240} width={1000} height={12} fill="#b83a2c" />
					<rect x={-60} y={1310} width={980} height={30} fill="#7a2a20" />
					<rect x={0} y={1150} width={820} height={92} fill="#f4f1ea" />
					<rect x={80} y={1090} width={620} height={62} fill="#ece7dc" />
					<rect x={200} y={1045} width={400} height={48} fill="#e4ded0" />
					{Array.from({length: 26}).map((_, i) => (
						<circle key={i} cx={20 + i * 31} cy={1200} r={6} fill="#2b3240" />
					))}
					{Array.from({length: 20}).map((_, i) => (
						<rect key={i} x={95 + i * 30} y={1108} width={16} height={16} fill="#2b3240" />
					))}
					{[300, 470].map((x, i) => (
						<g key={i}>
							<path d={`M${x},1045 L${x + 8},930 L${x + 92},930 L${x + 100},1045 Z`} fill="#c63b2a" />
							<rect x={x + 8} y={930} width={84} height={28} fill="#151518" />
							<Smoke frame={frame} x={x + 50} y={925} seed={`lsm${i}`} color="9c9a98" rate={8} life={120} drift={-0.9} size={26} opacity={0.5} />
						</g>
					))}
					{/* гудок — облачко пара */}
					<g opacity={horn * Math.max(0, 1 - (frame - 30) / 60)}>
						<circle cx={330} cy={915} r={30 + (frame - 20) * 0.8} fill="#ffffff" opacity={0.7} />
					</g>
					<line x1={580} y1={1045} x2={580} y2={880} stroke="#141518" strokeWidth={5} />
					<line x1={580} y1={880} x2={900} y2={1150} stroke="#141518" strokeWidth={2} />
					{Array.from({length: 8}).map((_, i) => (
						<path key={i} d={`M${600 + i * 36},${897 + i * 30} l14,10 l-14,4 Z`} fill={['#e0392b', '#f2c440', '#2a7fc0'][i % 3]} />
					))}
				</g>
				<Gull frame={frame} seed="lg1" x={700} y={900} />
			</Layer>
			<Layer p={p} depth={0.6} pan={[-50, 0]} zoom={0.1}>
				{/* причал и трап */}
				<rect x={-100} y={1460} width={W + 200} height={500} fill="#5a4636" />
				<rect x={-100} y={1452} width={W + 200} height={12} fill="#8a6c50" />
				{Array.from({length: 14}).map((_, i) => (
					<line key={i} x1={i * 90 - 40} y1={1464} x2={i * 90 - 80} y2={1920} stroke="#47372a" strokeWidth={4} />
				))}
				<path d="M240,1462 L620,1250 L640,1262 L262,1474 Z" fill="#2a221c" />
				<line x1={240} y1={1430} x2={620} y2={1218} stroke="#2a221c" strokeWidth={4} />
				{Array.from({length: 8}).map((_, i) => (
					<line key={i} x1={240 + i * 54} y1={1430 - i * 30} x2={240 + i * 54} y2={1460 - i * 30} stroke="#2a221c" strokeWidth={3} />
				))}
				{/* Том с чемоданом идёт по трапу */}
				<g>
					<Person x={tx} y={ty} h={210} facing={1} look={TOM_HAT} pose={{...walkPose(frame / 6, 0.8), armR: 2, elbowR: 0}} />
					<rect x={tx - 26} y={ty - 82} width={30} height={22} rx={3} fill="#7a4a28" />
				</g>
				{/* провожающие */}
				{[
					[80, '#c0492f', 1],
					[150, '#2f5f8a', 1],
					[860, '#e8d6a8', -1],
					[930, '#3f6e58', -1],
				].map(([x, c, f], i) => (
					<Person
						key={i}
						x={x as number}
						y={1560}
						h={250}
						facing={f as 1 | -1}
						look={(i % 2 ? {...MARGE, top: c as string} : {...TOM_HAT, top: c as string, hat: '#3a3a3a'}) as Look}
						pose={{armL: 150 + Math.sin(frame / 5 + i) * 18, elbowL: 10, armR: -4}}
						shadow={0.25}
					/>
				))}
			</Layer>
		</>
	);
};

/* ======================= 4. Атрани: общий план ======================= */
const PALETTE = ['#f3e6cf', '#f0d79a', '#e8b98c', '#f4efe6', '#e7c3a8', '#f2cf7a', '#e9a98a', '#f6f0dc'];

const Atrani: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	return (
		<>
			<Sky id="sky-atrani" stops={['#4f8fca', '#7fb3dd', '#bad7ea', '#f3e3c4']} />
			<Layer p={p} depth={0.05} pan={[-30, 0]}>
				<circle cx={860} cy={720} r={360} fill="url(#sun)" opacity={0.55} />
				<Clouds frame={frame} seed="ac" y={760} count={3} color="#f4f7f9" lit="#ffffff" speed={0.12} scale={0.6} opacity={0.8} />
			</Layer>
			<Layer p={p} depth={0.2} pan={[-40, 0]}>
				{/* дальние горы побережья */}
				<path d="M-100,1020 Q120,860 300,900 Q460,820 620,930 Q820,880 1180,960 L1180,1200 L-100,1200 Z" fill="#7d9a86" opacity={0.75} />
				<Fog y={1000} frame={frame} seed="af" opacity={0.25} color="e2c9a6" />
			</Layer>
			<Layer p={p} depth={0.4} pan={[-60, 0]} zoom={0.1}>
				{/* скалы и город, сбегающий к морю */}
				<Cliff
					d="M-100,880 Q60,860 160,940 Q260,900 360,1000 L420,1040 Q560,1010 700,1080 Q820,1020 900,1080 L980,1130 Q1100,1100 1180,1150 L1180,1420 L-100,1420 Z"
					color="#b6895e"
					green="#4f6b3c"
					seed="acl"
					bushes={[
						[60, 920],
						[200, 960],
						[330, 1010],
						[880, 1100],
						[1040, 1140],
					]}
				/>
				<Town seed="at" x0={100} x1={900} base={1360} rows={6} slope={-0.12} palette={PALETTE} />
				{/* церковь с майоликовым куполом */}
				<g>
					<rect x={600} y={1030} width={140} height={160} fill="#f4ecdc" />
					<ellipse cx={670} cy={1032} rx={70} ry={58} fill="#d8b54a" />
					{Array.from({length: 7}).map((_, i) => (
						<path key={i} d={`M${614 + i * 19},1032 Q${670},${960} ${670},${976}`} stroke="#3f7e66" strokeWidth={4} fill="none" opacity={0.7} />
					))}
					<rect x={664} y={962} width={12} height={22} fill="#f4ecdc" />
					<rect x={750} y={940} width={60} height={250} fill="#efe2c8" />
					<path d="M745,942 L780,890 L815,942 Z" fill="#3f7e66" />
					<rect x={768} y={970} width={24} height={36} rx={12} fill="#3a2a22" />
				</g>
				<Cypress x={250} y={1100} h={170} color="#2f4a2c" frame={frame} />
				<Cypress x={920} y={1120} h={150} color="#2f4a2c" frame={frame} />
			</Layer>
			<Layer p={p} depth={0.65} pan={[-80, 0]} zoom={0.12}>
				<Sea frame={frame} y={1400} top="#2f8fb8" bottom="#0f4f78" glint="#fff6da" seed="asea" count={120} />
				{/* пляж и лодки */}
				<path d="M-100,1400 Q300,1370 620,1400 Q800,1412 1180,1396 L1180,1440 Q700,1460 -100,1440 Z" fill="#d9c09a" />
				{[
					[180, '#d24a32'],
					[330, '#2f7fbf'],
					[500, '#f2c440'],
					[760, '#3f8e6a'],
				].map(([x, c], i) => (
					<g key={i} transform={`translate(${x} ${1418 + Math.sin(frame / 20 + i) * 2})`}>
						<path d="M-50,0 Q0,22 50,0 L42,-14 L-42,-14 Z" fill={c as string} />
						<rect x={-42} y={-16} width={84} height={4} fill="#fffaf0" />
					</g>
				))}
				<Gull frame={frame} seed="ag" x={300} y={1180} />
			</Layer>
		</>
	);
};

/* ======================= 5. Терраса: Дики, Мардж и Том ======================= */
const Terrace: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const look = interpolate(frame, [frames * 0.45, frames * 0.62], [0, 1], {...clamp, easing: ease});
	const sip = Math.max(0, Math.sin(frame / 35)) * 30;
	const type = Math.sin(frame * 0.9) * 5 * (1 - look);
	return (
		<>
			<Sky id="sky-terrace" stops={['#3f86c6', '#78b0dc', '#b7d6ea', '#e9e6d6']} />
			<Layer p={p} depth={0.1} pan={[20, 0]}>
				<Sea frame={frame} y={1010} top="#3b9dc4" bottom="#16608c" glint="#fffbe6" seed="tsea" count={110} />
				<path d="M-100,1012 Q160,950 300,980 Q380,990 420,1012 Z" fill="#7d9a86" opacity={0.8} />
				<Gull frame={frame} seed="tg" x={760} y={860} />
			</Layer>
			<Layer p={p} depth={0.5} pan={[30, 0]} zoom={0.1}>
				{/* пол из плитки */}
				<path d="M-100,1200 L1180,1200 L1180,1920 L-100,1920 Z" fill="#c9844f" />
				{Array.from({length: 18}).map((_, i) => (
					<line key={i} x1={i * 80 - 140} y1={1200} x2={(i * 80 - 140 - 540) * 2.2 + 540} y2={1920} stroke="#a86a3c" strokeWidth={3} />
				))}
				{Array.from({length: 8}).map((_, i) => (
					<line key={i} x1={-100} y1={1200 + i * i * 12} x2={1180} y2={1200 + i * i * 12} stroke="#a86a3c" strokeWidth={3} />
				))}
				{/* перила с балясинами */}
				<rect x={-100} y={1150} width={W + 200} height={18} fill="#efe6d4" />
				{Array.from({length: 26}).map((_, i) => (
					<path key={i} d={`M${i * 46 - 20},1168 q-8,14 0,24 q10,4 0,10 l0,0 q-8,0 0,0 Z`} fill="#e6dcc6" stroke="#e6dcc6" strokeWidth={12} />
				))}
				{/* лимоны в кадках */}
				{[70, 1000].map((x, i) => (
					<g key={i}>
						<path d={`M${x - 40},1260 L${x + 40},1260 L${x + 30},1330 L${x - 30},1330 Z`} fill="#b65a35" />
						<circle cx={x} cy={1180} r={70} fill="#4f7a3a" />
						{Array.from({length: 7}).map((_, k) => (
							<ellipse key={k} cx={x - 45 + rnd(`lem${i}${k}`) * 90} cy={1140 + rnd(`lemy${i}${k}`) * 80} rx={9} ry={7} fill="#f5d33a" />
						))}
					</g>
				))}
				{/* зонт */}
				<rect x={636} y={900} width={8} height={430} fill="#e9e1d0" />
				<path d="M400,960 Q640,830 880,960 Z" fill="#f08a3a" />
				{Array.from({length: 4}).map((_, i) => (
					<path key={i} d={`M${640 + (i - 1.5) * 0},885 L${430 + i * 140},960 L${500 + i * 140},960 Z`} fill="#fbf4e6" />
				))}
				<path d="M400,960 L880,960 L880,968 L400,968 Z" fill="#c76a2a" />
				{/* тень от зонта */}
				<ellipse cx={640} cy={1340} rx={260} ry={34} fill="#8a4f2a" opacity={0.45} />
				{/* стол с машинкой и мартини */}
				<ellipse cx={640} cy={1220} rx={120} ry={18} fill="#f4efe4" />
				<rect x={634} y={1222} width={12} height={110} fill="#d8cfbc" />
				<rect x={600} y={1186} width={70} height={30} rx={4} fill="#2c2c30" />
				<rect x={606} y={1178} width={58} height={10} fill="#f9f6ee" />
				<g transform={`translate(${type} 0)`}>
					<rect x={608} y={1192} width={6} height={4} fill="#9a9a9a" />
				</g>
				<path d="M700,1176 L724,1176 L712,1192 Z" fill="#cfe7ef" opacity={0.9} />
				<line x1={712} y1={1192} x2={712} y2={1210} stroke="#cfe7ef" strokeWidth={2} />
				<circle cx={708} cy={1182} r={3} fill="#6a8a2a" />
				{/* Мардж за столом — поворачивается к Тому */}
				<g fill="#e9e1d0">
					<rect x={500} y={1262} width={64} height={7} rx={3} />
					<rect x={504} y={1180} width={6} height={86} />
					<rect x={504} y={1268} width={5} height={64} />
					<rect x={556} y={1268} width={5} height={64} />
				</g>
				<Person x={560} y={1330} h={260} facing={1} look={MARGE} pose={sitPose({armL: 70, elbowL: 20, armR: 60, elbowR: 30, lean: 10 - look * 14, head: -look * 24})} />
				{/* Дики в шезлонге */}
				<path d="M140,1330 L360,1290 L420,1180 L400,1172 L340,1276 L130,1316 Z" fill="#f4efe4" />
				<path d="M150,1318 L344,1282 L398,1180" stroke="#2f7fbf" strokeWidth={10} fill="none" strokeDasharray="22 14" />
				<line x1={160} y1={1326} x2={180} y2={1380} stroke="#9a7a52" strokeWidth={6} />
				<line x1={360} y1={1294} x2={330} y2={1380} stroke="#9a7a52" strokeWidth={6} />
				<g transform="rotate(-14 330 1300)">
					<Person x={330} y={1300} h={270} facing={-1} look={DICKIE} pose={sitPose({thighL: 82, thighR: 76, kneeL: 20, kneeR: 30, armL: 60 + sip * 0.6, elbowL: 95, armR: 20, lean: -22})} />
				</g>
				{/* Том у перил */}
				<Person x={900} y={1350} h={330} facing={-1} look={TOM} rim={{color: '#fff0c8', side: 1, strength: 0.5}} pose={{armL: 8, armR: -6, head: 4}} shadow={0.3} />
			</Layer>
			<Particles frame={frame} count={25} kind="dust" seed="tdust" area={[0, 900, W, 500]} opacity={0.4} color="#fff6d8" />
		</>
	);
};

/* ======================= 6. Гардероб: чужие рубашки ======================= */
const Wardrobe: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const adjust = Math.sin(frame / 14) * 8;
	const shirts = ['#f4f1ea', '#bcd7ea', '#f2e2b8', '#e8c3b0', '#f4f1ea', '#9cc0d8', '#efe9d8'];
	return (
		<>
			<Sky id="sky-ward" stops={['#6a4a34', '#8a6446', '#9c7452', '#5a3a28']} />
			<Layer p={p} depth={0.15} pan={[0, 0]}>
				{/* ставни: полосы света */}
				<g opacity={0.9}>
					{Array.from({length: 7}).map((_, i) => (
						<path key={i} d={`M${980 - i * 16},${650 + i * 60} L${1180},${640 + i * 60} L${720 + i * 10},${1900} L${560 + i * 10},${1900} Z`} fill="#ffd79a" opacity={0.1} />
					))}
				</g>
				<rect x={-100} y={1460} width={W + 200} height={600} fill="#7a4a2c" />
				<rect x={-100} y={1452} width={W + 200} height={10} fill="#5a3420" />
				{Array.from({length: 7}).map((_, i) => (
					<path key={i} d={`M${640 + i * 50},1460 L${720 + i * 50},1460 L${600 + i * 70},1920 L${520 + i * 70},1920 Z`} fill="#ffcf8a" opacity={0.13} />
				))}
			</Layer>
			<Layer p={p} depth={0.45} pan={[30, 0]} zoom={0.14}>
				{/* открытый шкаф */}
				<rect x={30} y={640} width={430} height={820} fill="#4a2c1a" />
				<rect x={50} y={660} width={390} height={780} fill="#2a180e" />
				<path d="M30,640 L-80,600 L-80,1500 L30,1460 Z" fill="#5a3622" />
				<line x1={60} y1={720} x2={430} y2={720} stroke="#b8925a" strokeWidth={6} />
				{shirts.map((c, i) => {
					const x = 90 + i * 50;
					const sway = Math.sin(frame / 30 + i) * 2;
					return (
						<g key={i} transform={`rotate(${sway} ${x} 720)`}>
							<path d={`M${x},720 l0,10`} stroke="#b8925a" strokeWidth={3} />
							<path d={`M${x - 26},740 L${x},730 L${x + 26},740 L${x + 30},1040 L${x - 30},1040 Z`} fill={c} />
							<path d={`M${x - 26},740 L${x - 38},880 L${x - 28},882 Z`} fill={c} opacity={0.85} />
							<line x1={x} y1={740} x2={x} y2={1040} stroke="#00000022" strokeWidth={2} />
						</g>
					);
				})}
				{/* ящики внизу */}
				<rect x={60} y={1160} width={370} height={130} fill="#3a2214" />
				<rect x={60} y={1300} width={370} height={130} fill="#3a2214" />
				<rect x={220} y={1220} width={50} height={8} fill="#b8925a" />
				<rect x={220} y={1360} width={50} height={8} fill="#b8925a" />
				{/* напольное зеркало */}
				<rect x={690} y={680} width={230} height={780} rx={20} fill="#8a6a3a" />
				<rect x={705} y={695} width={200} height={750} rx={14} fill="#a4b4b4" />
				<defs>
					<clipPath id="ward-mirror">
						<rect x={705} y={695} width={200} height={750} rx={14} />
					</clipPath>
				</defs>
				<g clipPath="url(#ward-mirror)">
					<rect x={705} y={695} width={200} height={750} fill="#5d4a3a" opacity={0.6} />
					<Person x={810} y={1500} h={620} facing={-1} look={TOM_LINEN} tint={{color: '#5d4a3a', amount: 0.25}} pose={{armL: 35, elbowL: 125 + adjust, armR: 25, elbowR: 132 - adjust, head: -6}} />
					<path d="M720,700 L780,700 L705,1100 L705,900 Z" fill="#ffffff" opacity={0.08} />
				</g>
			</Layer>
			<Layer p={p} depth={0.75} pan={[50, 0]} zoom={0.14}>
				{/* Том в рубашке Дики */}
				<Person x={540} y={1580} h={640} facing={1} look={TOM_LINEN} rim={{color: '#ffd79a', side: 1, strength: 0.6}} pose={{armL: 35, elbowL: 125 + adjust, armR: 25, elbowR: 132 - adjust, head: 6}} shadow={0.3} />
			</Layer>
			<Particles frame={frame} count={60} kind="dust" seed="wdust" area={[450, 600, 600, 1000]} opacity={0.7} />
		</>
	);
};

/* ======================= 7. Лодка на закате ======================= */
const Boat: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const rock = Math.sin(frame / 26) * 2.4;
	const bob = Math.sin(frame / 20) * 5;
	const sunY = interpolate(frame, [0, frames], [1010, 1050]);
	return (
		<>
			<Sky id="sky-boat" stops={['#3a3a6a', '#7a4a7a', '#d0607a', '#f39a5a', '#ffd08a']} />
			<Layer p={p} depth={0.05} pan={[0, 10]}>
				<circle cx={560} cy={sunY} r={460} fill="url(#sun)" opacity={0.8} />
				<circle cx={560} cy={sunY} r={80} fill="#ffe2a0" />
				<Clouds frame={frame} seed="bc" y={780} count={3} color="#8a4a6a" lit="#ffb27a" speed={0.1} scale={0.7} opacity={0.8} />
			</Layer>
			<Layer p={p} depth={0.2} pan={[0, 0]}>
				<path d="M-100,1080 Q100,1020 260,1050 Q340,1040 400,1080 Z" fill="#4a2a44" />
				<path d="M760,1080 Q900,1000 1180,1040 L1180,1080 Z" fill="#4a2a44" />
				<Sea frame={frame} y={1080} top="#d9706a" bottom="#3a2a5a" glint="#ffe0a0" seed="bsea" count={160} glow={560} />
			</Layer>
			<Layer p={p} depth={0.6} pan={[0, 0]} zoom={0.1}>
				<g transform={`translate(0 ${bob}) rotate(${rock} 560 1320)`}>
					{/* корпус лодки */}
					<path d="M250,1290 L880,1290 Q860,1370 760,1380 L330,1380 Q260,1350 250,1290 Z" fill="#1c1420" />
					<path d="M250,1290 L880,1290 L876,1302 L254,1302 Z" fill="#f2b06a" opacity={0.7} />
					<rect x={540} y={1260} width={60} height={30} fill="#1c1420" />
					{/* Том на корме */}
					<Person x={340} y={1300} h={240} facing={1} look={TOM_LINEN} tint={{color: '#1a1020', amount: 0.7}} rim={{color: '#ffc27a', side: 1, strength: 0.75}} pose={sitPose({armL: 34, elbowL: 30, armR: 26, elbowR: 36, lean: 16})} />
					{/* Дики на носу, спиной к Тому */}
					<Person x={790} y={1300} h={240} facing={1} look={DICKIE} tint={{color: '#2a1e30', amount: 0.6}} rim={{color: '#ffd8a0', side: -1, strength: 0.65}} pose={sitPose({armL: 40, elbowL: 30, armR: 30, elbowR: 20, lean: 18, head: -10})} />
				</g>
				{/* отражение лодки */}
				<path d={`M260,${1390 + bob} L870,${1390 + bob} L820,${1440 + bob} L320,${1440 + bob} Z`} fill="#1c1420" opacity={0.35} />
				<Birds frame={frame} seed="bb" count={3} x={150} y={900} vx={0.7} vy={-0.15} size={14} color="#2a1a2a" />
			</Layer>
		</>
	);
};

/* ======================= 8. Ночная лестница ======================= */
const Stairs: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const creep = interpolate(frame, [0, frames], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const flick = 0.85 + 0.15 * Math.sin(frame / 3) * Math.sin(frame / 7);
	const steps = 12;
	return (
		<>
			<Sky id="sky-stairs" stops={['#0b1430', '#13214a', '#1a2a52', '#0d1328']} />
			<Stars frame={frame} count={50} maxY={760} seed="sst" opacity={0.7} />
			<Layer p={p} depth={0.3} pan={[0, -40]} zoom={0.15}>
				{/* стены переулка */}
				<path d="M-100,560 L380,640 L380,1920 L-100,1920 Z" fill="#3a3242" />
				<path d="M1180,520 L700,620 L700,1920 L1180,1920 Z" fill="#2c2738" />
				{/* арка вверху */}
				<path d="M380,780 Q540,660 700,780 L700,640 L380,640 Z" fill="#241f2e" />
				<rect x={380} y={780} width={320} height={1140} fill="#1c1a2a" />
				{/* ступени */}
				{Array.from({length: steps}).map((_, i) => {
					const t = i / steps;
					const y = 1500 - i * 58;
					const inset = t * 60;
					return (
						<g key={i}>
							<rect x={380 + inset} y={y} width={320 - inset * 2} height={58} fill={i % 2 ? '#4a4052' : '#544a5c'} />
							<rect x={380 + inset} y={y} width={320 - inset * 2} height={6} fill="#ffcf8a" opacity={0.25 * (1 - Math.abs(t - 0.45) * 1.4) * flick} />
						</g>
					);
				})}
				{/* фонарь на стене */}
				<rect x={690} y={980} width={24} height={8} fill="#0c0a10" />
				<path d="M700,988 L740,988 L736,1040 L704,1040 Z" fill="#0c0a10" />
				<rect x={708} y={994} width={24} height={40} fill="#ffd38a" opacity={flick} />
				<circle cx={720} cy={1014} r={320} fill="url(#lamp)" opacity={0.6 * flick} />
				{/* окна */}
				<rect x={120} y={860} width={70} height={110} fill="#ffc56a" opacity={0.5} />
				<rect x={120} y={860} width={70} height={110} fill="none" stroke="#1a1520" strokeWidth={6} />
				<rect x={860} y={760} width={70} height={110} fill="#1a1520" />
				{/* длинная тень поднимается по стене */}
				<g transform={`translate(${-60 + creep * 40} ${-creep * 260}) matrix(1 0 -0.35 1 0 0)`} opacity={0.42}>
					<Figure x={640} y={1600} h={760} facing={-1} color="#05040a" hat pose={walkPose(frame / 9, 0.6)} />
				</g>
				{/* бельё на верёвке */}
				<path d="M380,700 Q540,740 700,690" stroke="#0c0a10" strokeWidth={2} fill="none" />
				{[430, 500, 580, 640].map((x, i) => (
					<rect key={i} x={x} y={712 + Math.sin((x - 380) / 100) * 10} width={36} height={50 + (i % 2) * 20} fill={['#d8c8b0', '#9cb0c8', '#c8a8a0', '#d8d0c0'][i]} opacity={0.6} transform={`rotate(${Math.sin(frame / 25 + i) * 4} ${x + 18} 712)`} />
				))}
			</Layer>
			<Fog y={1500} frame={frame} seed="sfg" opacity={0.18} color="5d6b82" />
		</>
	);
};

/* ======================= 9. Ночное море и вилла ======================= */
const NightSea: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const glow = 0.8 + 0.2 * Math.sin(frame / 20);
	return (
		<>
			<Sky id="sky-nsea" stops={['#070b1e', '#0e1838', '#1a2a55', '#2a3d6a']} />
			<Stars frame={frame} count={110} maxY={1000} seed="nst" />
			<Layer p={p} depth={0.05} pan={[-20, 0]}>
				<circle cx={760} cy={780} r={280} fill="url(#moon)" />
				<circle cx={760} cy={780} r={52} fill="#f6efd8" />
			</Layer>
			<Layer p={p} depth={0.2} pan={[-30, 0]}>
				<Sea frame={frame} y={1120} top="#1c2c58" bottom="#060a1c" glint="#f6efd8" seed="nsea" count={170} glow={760} />
			</Layer>
			<Layer p={p} depth={0.4} pan={[-50, 0]} zoom={0.1}>
				{/* скала с виллой */}
				<Cliff d="M-100,980 Q80,940 200,990 Q300,1010 380,1080 Q460,1150 520,1180 L520,1420 L-100,1420 Z" color="#141a2a" green="#0e1420" seed="ncl" bushes={[[60, 980], [300, 1050]]} />
				<Town seed="nt" x0={20} x1={380} base={1150} rows={3} slope={0.14} palette={['#2a3048', '#323852', '#262c44']} lit={glow} scale={0.8} />
				{/* отражения окон */}
				{Array.from({length: 10}).map((_, i) => (
					<rect key={i} x={60 + i * 34} y={1200 + Math.sin(frame / 10 + i) * 6} width={6} height={60} fill="#ffc56a" opacity={0.25 * glow} />
				))}
				<Cypress x={420} y={1130} h={150} color="#080c18" frame={frame} />
			</Layer>
			<Layer p={p} depth={0.8} pan={[-20, 0]} zoom={0.12}>
				{/* Том на камнях смотрит на виллу */}
				<path d="M560,1560 Q700,1480 860,1500 Q1000,1510 1180,1460 L1180,2000 L560,2000 Z" fill="#05070f" />
				<Person x={790} y={1500} h={360} facing={-1} look={TOM} tint={{color: '#04060c', amount: 0.82}} rim={{color: '#cfd8f0', side: 1, strength: 0.7}} pose={{armL: 6, armR: -6, head: 4}} />
			</Layer>
		</>
	);
};

export const RIPLEY_SETS = {
	mirror: Mirror,
	nyroom: NyRoom,
	liner: Liner,
	atrani: Atrani,
	terrace: Terrace,
	wardrobe: Wardrobe,
	boat: Boat,
	stairs: Stairs,
	nightsea: NightSea,
} as const;

export const RIPLEY_CAMERA: Record<keyof typeof RIPLEY_SETS, [number, number, number]> = {
	mirror: [1.05, 560, 1150],
	nyroom: [1.1, 520, 1150],
	liner: [1.1, 500, 1250],
	atrani: [1.15, 520, 1150],
	terrace: [1.1, 600, 1250],
	wardrobe: [1.05, 540, 1150],
	boat: [1.2, 560, 1250],
	stairs: [1.0, 540, 1150],
	nightsea: [1.1, 600, 1250],
};
