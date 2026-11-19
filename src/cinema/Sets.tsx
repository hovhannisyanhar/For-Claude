// «Декорации» стиля «Кино»: детальные анимированные сцены (SVG).
// frame — кадр сцены (с началом растворения), frames — полная длительность плана.
import React, {useMemo} from 'react';
import {Easing, interpolate, interpolateColors} from 'remotion';
import {
	Birds,
	Clouds,
	Defs,
	Fog,
	Grass,
	H,
	Layer,
	LeafTree,
	Mountains,
	Particles,
	Ridge,
	Sky,
	Smoke,
	Stars,
	Train,
	W,
	clamp,
	pinePath,
	rnd,
} from './kit';
import {Figure, chopPose, sitPose, walkPose} from './people';
import {RIPLEY_CAMERA, RIPLEY_SETS} from './SetsRipley';
import {LIFE_CAMERA, LIFE_SETS} from './SetsLife';
import {IRISH_CAMERA, IRISH_SETS} from './SetsIrish';
import type {CinemaSet} from './types';

type SetProps = {frame: number; frames: number};
const ease = Easing.inOut(Easing.cubic);

/* ======================= 1. Полустанок на рассвете ======================= */
const Station: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const arrive = interpolate(frame, [0, 170], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const lx = interpolate(arrive, [0, 1], [1500, 600]);
	const dist = 1500 - lx;
	const rail = 1352;
	const plat = 1300;
	const lanternSwing = Math.sin(frame / 18) * 4;
	const birdsFly = interpolate(frame, [70, 200], [0, 1], clamp);
	return (
		<>
			<Sky id="sky-station" stops={['#141c2e', '#2b3550', '#5d5a70', '#b8846e', '#efb27c', '#f6cf98']} />
			<Layer p={p} depth={0.05} pan={[30, 0]}>
				<circle cx={230} cy={1120} r={620} fill="url(#sun)" opacity={0.55} />
				<circle cx={230} cy={1130} r={70} fill="#ffe2b0" opacity={0.85} />
				<Clouds frame={frame} seed="stc" y={760} count={4} color="#4d4a5e" lit="#f2b98a" speed={0.12} scale={0.9} />
				<Clouds frame={frame} seed="stc2" y={980} count={3} color="#6e5f6a" lit="#ffd2a0" speed={0.2} scale={0.6} opacity={0.8} />
			</Layer>
			<Layer p={p} depth={0.2} pan={[40, 0]}>
				<Mountains seed="stm" base={1180} peak={330} color="#5a5770" snow="#ddd0d4" lit="#f3bf8e" />
				<Fog y={1150} frame={frame} seed="stf0" opacity={0.35} height={160} color="e2c9a6" />
				<Ridge seed="st1" base={1200} amp={40} treeH={[50, 110]} count={80} color="#3e3a4c" />
				<Fog y={1210} frame={frame} seed="stf1" opacity={0.4} color="f0c79a" />
			</Layer>
			<Layer p={p} depth={0.45} pan={[60, 0]}>
				<Ridge seed="st2" base={1290} amp={20} treeH={[160, 300]} count={14} color="#26222d" hill={false} x0={700} x1={1300} rim="#f0b07a" />
				{/* водонапорная башня */}
				<g fill="#17151b">
					<rect x={880} y={1050} width={120} height={95} rx={8} />
					<path d="M870,1052 L940,1010 L1010,1052 Z" />
					{[890, 925, 960, 990].map((x) => (
						<rect key={x} x={x} y={1140} width={7} height={160} />
					))}
					<line x1={890} y1={1180} x2={997} y2={1260} stroke="#17151b" strokeWidth={4} />
					<line x1={997} y1={1180} x2={890} y2={1260} stroke="#17151b" strokeWidth={4} />
					<rect x={872} y={1095} width={30} height={6} />
				</g>
				{/* телеграфные столбы и провода */}
				{[[60, 1000], [520, 1020], [1060, 1010]].map(([x, top], i) => (
					<g key={i} fill="#120f14">
						<rect x={x - 5} y={top} width={10} height={1300 - top} />
						<rect x={x - 38} y={top + 18} width={76} height={7} />
					</g>
				))}
				{[0, 1].map((k) => (
					<path key={k} d={`M${60 - 30 + k * 60},${1022 + k} Q290,${1080 + k} ${520 - 30 + k * 60},${1042 + k} Q790,${1100 + k} ${1060 - 30 + k * 60},${1032 + k}`} stroke="#120f14" strokeWidth={2} fill="none" />
				))}
				{/* птицы на проводах взлетают при подходе поезда */}
				<g opacity={1 - birdsFly}>
					{[180, 215, 250, 330, 640, 700].map((x, i) => (
						<ellipse key={i} cx={x} cy={1052 + (x > 520 ? 20 : 0) + Math.abs(x - 290) * 0.08} rx={7} ry={6} fill="#120f14" />
					))}
				</g>
				{birdsFly > 0 && <Birds frame={frame - 70} seed="stb" count={6} x={300} y={1000 - birdsFly * 300} vx={-1.2} vy={-0.8} size={13} color="#120f14" />}
			</Layer>
			<Layer p={p} depth={0.7} pan={[80, 10]}>
				{/* станция */}
				<g>
					<rect x={-60} y={1060} width={420} height={240} fill="#151319" />
					{Array.from({length: 11}).map((_, i) => (
						<line key={i} x1={-60} y1={1072 + i * 21} x2={360} y2={1072 + i * 21} stroke="#221e27" strokeWidth={3} />
					))}
					<path d="M-90,1066 L150,960 L400,1066 L380,1078 L150,976 L-70,1078 Z" fill="#0f0d12" />
					<path d="M-90,1066 L150,960 L400,1066" stroke="#e8a46c" strokeWidth={3} fill="none" opacity={0.6} />
					<rect x={190} y={1170} width={70} height={130} fill="#0b0a0d" />
					<rect x={196} y={1176} width={58} height={118} fill="#f0a958" opacity={0.25} />
					{[[20, 1130], [100, 1130]].map(([x, y], i) => (
						<g key={i}>
							<rect x={x} y={y} width={56} height={70} fill="#f2ad5e" opacity={0.85 + 0.1 * Math.sin(frame / 6 + i)} />
							<line x1={x + 28} y1={y} x2={x + 28} y2={y + 70} stroke="#151319" strokeWidth={4} />
							<line x1={x} y1={y + 35} x2={x + 56} y2={y + 35} stroke="#151319" strokeWidth={4} />
						</g>
					))}
					<rect x={40} y={1090} width={180} height={30} fill="#0f0d12" />
					{/* навес */}
					<path d="M330,1100 L470,1120 L470,1132 L330,1116 Z" fill="#0f0d12" />
					<rect x={455} y={1128} width={8} height={172} fill="#0f0d12" />
					{/* скамья */}
					<rect x={260} y={1262} width={90} height={8} fill="#0b0a0d" />
					<rect x={268} y={1268} width={6} height={32} fill="#0b0a0d" />
					<rect x={336} y={1268} width={6} height={32} fill="#0b0a0d" />
					{/* фонарь качается */}
					<g transform={`rotate(${lanternSwing} 420 1124)`}>
						<line x1={420} y1={1124} x2={420} y2={1150} stroke="#0b0a0d" strokeWidth={3} />
						<rect x={408} y={1150} width={24} height={30} rx={4} fill="#0b0a0d" />
						<rect x={412} y={1156} width={16} height={18} fill="#ffd38a" />
						<circle cx={420} cy={1165} r={150} fill="url(#warm)" opacity={0.7 + 0.15 * Math.sin(frame / 5)} />
					</g>
				</g>
				{/* перрон */}
				<rect x={-80} y={plat} width={W + 160} height={34} fill="#100e12" />
				<line x1={-80} y1={plat} x2={W + 80} y2={plat} stroke="#e9b07c" strokeWidth={2} opacity={0.4} />
				{Array.from({length: 30}).map((_, i) => (
					<line key={i} x1={i * 40 - 60} y1={plat + 4} x2={i * 40 - 64} y2={plat + 34} stroke="#1c1920" strokeWidth={2} />
				))}
				{/* мальчик с узелком */}
				<Figure
					x={520}
					y={plat + 2}
					h={150}
					kind="boy"
					facing={1}
					bundle
					hat
					color="#0a090c"
					rim={{color: '#f3b27a', side: -1, strength: 0.7}}
					pose={{armL: 4, elbowL: 8, armR: -4, elbowR: 6, head: interpolate(frame, [120, 170], [0, -8], clamp), bob: Math.sin(frame / 20) * 0.4}}
				/>
				{/* рельсы и поезд */}
				<rect x={-80} y={rail} width={W + 160} height={7} fill="#2c2830" />
				<Smoke frame={frame} x={lx + 66} y={rail - 164} seed="sts" color="d8d4cc" rate={5} life={130} drift={1.2 + (1 - arrive) * 3.5} rise={1.3} size={34} opacity={0.6} />
				<Train x={lx} y={rail} s={1} dist={dist} frame={frame} cars={2} color="#09080b" hi="#9a7e78" />
				{/* пар из цилиндров при остановке */}
				<Smoke frame={frame} x={lx + 70} y={rail - 30} seed="stv" color="e9d2b4" rate={8} life={80} drift={-1.4} rise={0.25} size={30} opacity={0.45 * interpolate(frame, [110, 170, 260], [0, 1, 0.5], clamp)} />
				<rect x={-80} y={rail + 7} width={W + 160} height={H} fill="#0a090b" />
			</Layer>
			<Layer p={p} depth={1} pan={[100, 20]}>
				<Grass frame={frame} seed="stg" y={1620} count={140} h={[40, 120]} color="#060507" />
				<rect x={-80} y={1660} width={W + 160} height={400} fill="#060507" />
			</Layer>
		</>
	);
};

/* ======================= 2. Ночная долина, далёкий поезд ======================= */
const Valley: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const tx = interpolate(frame, [0, frames], [900, 120]);
	const bridgeY = 1196;
	return (
		<>
			<Sky id="sky-valley" stops={['#03050c', '#08112a', '#16244a', '#2b3a5e']} />
			<Layer p={p} depth={0.05} pan={[0, 20]}>
				<Stars frame={frame} count={220} maxY={1050} seed="vs" />
				<circle cx={790} cy={760} r={330} fill="url(#moon)" />
				<circle cx={790} cy={760} r={46} fill="#f2e8cf" />
				<circle cx={777} cy={752} r={9} fill="#d9ccab" opacity={0.6} />
				<circle cx={800} cy={772} r={6} fill="#d9ccab" opacity={0.5} />
				<Clouds frame={frame} seed="vc" y={880} count={3} color="#141d33" lit="#8d9cc0" speed={0.25} scale={0.7} />
			</Layer>
			<Layer p={p} depth={0.2} pan={[0, 30]}>
				<Mountains seed="vm" base={1150} peak={360} color="#1a2440" snow="#b5c2dc" lit="#8292b8" />
				<Fog y={1130} frame={frame} seed="vf0" opacity={0.3} height={150} color="5d6b82" />
				<Ridge seed="v1" base={1180} amp={30} treeH={[40, 80]} count={90} color="#141d33" />
			</Layer>
			<Layer p={p} depth={0.4} pan={[0, 40]}>
				{/* река в долине */}
				<path d={`M470,${bridgeY + 10} Q520,1260 430,1330 Q300,1440 380,1560 L760,1560 Q620,1430 690,1330 Q760,1250 640,${bridgeY + 10} Z`} fill="#20304f" />
				{Array.from({length: 18}).map((_, i) => (
					<rect key={i} x={480 + rnd(`vr${i}`) * 140 + Math.sin(frame / 9 + i) * 8} y={1220 + i * 18} width={20 + rnd(`vw${i}`) * 40} height={2} fill="#dfe6f5" opacity={0.25 + 0.35 * Math.abs(Math.sin(frame / 7 + i))} />
				))}
				{/* мост через реку */}
				<rect x={300} y={bridgeY - 6} width={480} height={6} fill="#0a0f1c" />
				{Array.from({length: 11}).map((_, i) => (
					<g key={i}>
						<line x1={300 + i * 48} y1={bridgeY} x2={300 + i * 48} y2={bridgeY + 70 - Math.abs(i - 5) * 4} stroke="#0a0f1c" strokeWidth={3} />
						<line x1={300 + i * 48} y1={bridgeY + 4} x2={348 + i * 48} y2={bridgeY + 50} stroke="#0a0f1c" strokeWidth={1.5} />
					</g>
				))}
				<Smoke frame={frame} x={tx + 18} y={bridgeY - 52} seed="vsm" color="9c9a98" rate={5} life={160} drift={1.3} rise={0.5} size={14} opacity={0.5} />
				<Train x={tx} y={bridgeY - 6} s={0.3} dist={frame * 6} frame={frame} cars={4} color="#05070d" hi="#3a4664" />
				<Fog y={1260} frame={frame} seed="vf1" speed={0.6} opacity={0.3} height={120} color="8b97a8" />
				<Ridge seed="v2" base={1330} amp={50} treeH={[120, 220]} count={40} color="#0c1222" rim="#6d7ca3" />
			</Layer>
			<Layer p={p} depth={0.8} pan={[0, 60]}>
				<Ridge seed="v3" base={1600} amp={60} treeH={[420, 700]} count={6} color="#04060c" hill={false} x0={-200} x1={260} />
				<Ridge seed="v4" base={1640} amp={60} treeH={[460, 760]} count={6} color="#04060c" hill={false} x0={840} x1={1300} />
				<path d="M-80,1600 Q300,1540 560,1580 T1160,1560 L1160,2000 L-80,2000 Z" fill="#04060c" />
				<Grass frame={frame} seed="vg" y={1585} count={120} h={[30, 90]} color="#04060c" />
			</Layer>
		</>
	);
};

/* ======================= 3. Лесоруб и вековые сосны ======================= */
const CHOP_PERIOD = 42; // кадры; удары на 27, 69, 111, 153, 195 (= sfx at 0.9 + 1.4k)
const CHOP_FIRST = 27;
const CHOPS = 5;
const FALL_AT = 210;

const Logging: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const k = Math.floor((frame - CHOP_FIRST + 0.7 * CHOP_PERIOD) / CHOP_PERIOD);
	const chopping = k < CHOPS;
	const t = (((frame - CHOP_FIRST + 0.7 * CHOP_PERIOD) % CHOP_PERIOD) + CHOP_PERIOD) % CHOP_PERIOD / CHOP_PERIOD;
	const impacts = Array.from({length: CHOPS}, (_, i) => CHOP_FIRST + i * CHOP_PERIOD);
	const since = impacts.filter((f) => f <= frame).map((f) => frame - f);
	const last = since.length ? Math.min(...since) : 99;
	const shake: [number, number] = last < 6 ? [Math.sin(last * 3) * (6 - last) * 0.8, Math.cos(last * 4) * (6 - last) * 0.6] : [0, 0];
	const notch = Math.min(CHOPS, since.length);
	const fall = interpolate(frame, [FALL_AT, FALL_AT + 50], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const dust = interpolate(frame, [FALL_AT + 48, FALL_AT + 100], [0, 1], clamp);
	const trunks = useMemo(
		() =>
			Array.from({length: 12}).map((_, i) => ({
				x: -80 + i * 110 + (rnd(`lt${i}`) - 0.5) * 70,
				w: 40 + rnd(`lw${i}`) * 70,
				d: rnd(`ld${i}`),
			})),
		[],
	);
	const treeX = 860;
	const cutY = 1330;
	const pose = chopping ? chopPose(t) : {armL: 40, armR: 30, elbowL: 20, elbowR: 30, lean: 6, thighL: 10, thighR: -6};
	return (
		<>
			<Sky id="sky-log" stops={['#c9b98a', '#9fa47c', '#5f7356', '#3a4c3a', '#1f2a20']} />
			<Layer p={p} depth={0.1} pan={[0, -30]} shake={shake}>
				<Ridge seed="lg0" base={1250} amp={30} treeH={[500, 800]} count={40} color="#7d8b6a" />
				<Fog y={1100} frame={frame} seed="lf0" opacity={0.5} height={380} color="f0c79a" />
				{/* падающее вдали дерево */}
				<g transform={`rotate(${-fall * 80} 300 1250)`}>
					<path d={pinePath(300, 1250, 820, 220, 'fallt')} fill="#59684e" />
				</g>
				<Smoke frame={frame - FALL_AT - 48} x={60} y={1240} seed="ldust" color="e9d2b4" rate={3} life={80} drift={0.6} rise={0.6} size={60} opacity={0.5 * dust * (1 - dust * 0.4)} />
				<Ridge seed="lg1" base={1300} amp={20} treeH={[300, 600]} count={16} color="#56654a" hill={false} />
			</Layer>
			{/* лучи солнца */}
			<g style={{mixBlendMode: 'screen'}}>
				{[0, 1, 2, 3, 4].map((i) => {
					const x = 980 - i * 150;
					const o = 0.32 + 0.22 * Math.sin(frame / 40 + i * 1.7);
					return <path key={i} d={`M${x},-40 L${x + 70 + i * 12},-40 L${x - 380 + i * 30},${H} L${x - 560 + i * 20},${H} Z`} fill="url(#ray)" opacity={o} />;
				})}
			</g>
			{trunks
				.slice()
				.sort((a, b) => a.d - b.d)
				.map((tr, i) => (
					<Layer key={i} p={p} depth={0.3 + tr.d * 0.4} pan={[0, -60]} shake={shake}>
						<path
							d={`M${tr.x - tr.w / 2},-100 L${tr.x + tr.w / 2},-100 L${tr.x + tr.w * 0.6},${1340} L${tr.x - tr.w * 0.6},${1340} Z`}
							fill={interpolateColors(tr.d, [0, 1], ['#55624a', '#1d2619'])}
						/>
						{[0, 1, 2].map((b) => (
							<line key={b} x1={tr.x - tr.w * 0.2 + b * tr.w * 0.18} y1={-100} x2={tr.x - tr.w * 0.25 + b * tr.w * 0.2} y2={1340} stroke="#000" strokeWidth={2} opacity={0.12} />
						))}
					</Layer>
				))}
			<Particles frame={frame} count={70} kind="dust" seed="ldm" area={[0, 200, W, 1400]} />
			<Layer p={p} depth={0.85} pan={[0, -40]} shake={shake}>
				{/* земля, папоротники, пень */}
				<path d="M-80,1380 Q300,1330 600,1370 T1160,1360 L1160,2000 L-80,2000 Z" fill="#141b12" />
				{Array.from({length: 16}).map((_, i) => {
					const fx = rnd(`fx${i}`) * W;
					const fy = 1400 + rnd(`fy${i}`) * 150;
					const s = 0.6 + rnd(`fs${i}`) * 0.8;
					const sw = Math.sin(frame / 30 + i) * 3;
					return (
						<g key={i} transform={`translate(${fx} ${fy}) scale(${s}) rotate(${sw})`} fill="#0d130b">
							{[-60, -30, 0, 30, 60].map((a) => (
								<ellipse key={a} cx={0} cy={-40} rx={10} ry={46} transform={`rotate(${a} 0 0)`} />
							))}
						</g>
					);
				})}
				<rect x={120} y={1370} width={130} height={60} rx={8} fill="#1d1712" />
				<ellipse cx={185} cy={1370} rx={65} ry={14} fill="#6a5640" />
				<ellipse cx={185} cy={1370} rx={40} ry={8} fill="#8a7050" opacity={0.6} />
				{/* огромная сосна, которую рубят */}
				<path d={`M${treeX - 120},-100 L${treeX + 120},-100 L${treeX + 150},1400 L${treeX - 160},1400 Z`} fill="#22190f" />
				{Array.from({length: 9}).map((_, i) => {
					const bx = treeX - 110 + i * 28;
					return <path key={i} d={`M${bx},-100 Q${bx + 10},600 ${bx - 6},1400`} stroke="#120d08" strokeWidth={5} fill="none" opacity={0.7} />;
				})}
				<path d={`M${treeX - 120},-100 L${treeX - 160},1400`} stroke="#d9b277" strokeWidth={6} opacity={0.35} />
				{/* зарубка растёт с каждым ударом */}
				{notch > 0 && (
					<path d={`M${treeX - 155},${cutY - 10 - notch * 6} L${treeX - 155 + notch * 22},${cutY} L${treeX - 155},${cutY + 8 + notch * 3} Z`} fill="#e3c08a" />
				)}
				{/* щепки */}
				{impacts.map((fi, ii) => {
					const age = frame - fi;
					if (age < 0 || age > 34) return null;
					return Array.from({length: 7}).map((__, c) => {
						const vx = -(4 + rnd(`cv${ii}${c}`) * 9);
						const vy = -(6 + rnd(`cy${ii}${c}`) * 8);
						const x = treeX - 150 + vx * age;
						const y = cutY + vy * age + 0.55 * age * age;
						return <rect key={`${ii}${c}`} x={x} y={y} width={9} height={4} fill="#e8c890" transform={`rotate(${age * 25 + c * 40} ${x} ${y})`} opacity={1 - age / 34} />;
					});
				})}
				<Figure x={640} y={1440} h={340} facing={1} axe="hands" color="#0b0907" rim={{color: '#f0c27c', side: -1, strength: 0.8}} pose={pose} />
			</Layer>
		</>
	);
};

/* ======================= 4. Стройка моста на закате ======================= */
const Bridge: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const deck = 1090;
	const built = 720;
	const ground = (x: number) => Math.min(deck + 520, Math.max(deck + 60, deck + 520 - Math.abs(x - 520) * 0.9));
	const bents = useMemo(() => {
		const out: React.ReactNode[] = [];
		for (let x = -40; x <= W + 60; x += 80) {
			const g = ground(x);
			const done = x < built;
			const top = done ? deck : deck + 140 + (x - built) * 0.5;
			if (top > g - 20) continue;
			out.push(<line key={`v${x}`} x1={x} y1={top} x2={x - 10} y2={g} stroke="#0e0708" strokeWidth={6} />);
			out.push(<line key={`w${x}`} x1={x + 26} y1={top} x2={x + 36} y2={g} stroke="#0e0708" strokeWidth={6} />);
			for (let y = top + 20; y < g - 40; y += 80) {
				const y2 = Math.min(g, y + 80);
				out.push(<line key={`a${x}${y}`} x1={x} y1={y} x2={x + 80} y2={y2} stroke="#0e0708" strokeWidth={2.5} />);
				if (done) out.push(<line key={`b${x}${y}`} x1={x + 80} y1={y} x2={x} y2={y2} stroke="#0e0708" strokeWidth={2.5} />);
				out.push(<line key={`h${x}${y}`} x1={x - 6} y1={y2} x2={x + 86} y2={y2} stroke="#0e0708" strokeWidth={3} />);
			}
		}
		return out;
	}, []);
	const swing = Math.sin(frame / 25) * 6;
	const workers = [
		{x: 180, ph: 0},
		{x: 420, ph: 1.7},
		{x: 690, ph: 3.1},
	];
	return (
		<>
			<Sky id="sky-bridge" stops={['#170c12', '#36161c', '#6e2a22', '#b4512b', '#e2874a', '#f0b26a']} />
			<Layer p={p} depth={0.05} pan={[0, 20]}>
				<circle cx={640} cy={1060} r={700} fill="url(#sun)" opacity={0.55} />
				<circle cx={640} cy={1080} r={110} fill="#ffcf8a" opacity={0.9} />
				<Clouds frame={frame} seed="bc" y={720} count={4} color="#3a1a1e" lit="#f08a4a" speed={0.3} scale={1} />
				<Clouds frame={frame} seed="bc2" y={930} count={3} color="#5a2622" lit="#ffb070" speed={0.45} scale={0.6} />
			</Layer>
			<Layer p={p} depth={0.15} pan={[0, 30]}>
				<Birds frame={frame} seed="bcrow" count={9} x={560} y={820} vx={0} circle={240} size={15} color="#120607" />
				<Mountains seed="bm" base={1140} peak={250} color="#4a1d1f" lit="#e07a40" />
				<Ridge seed="b1" base={1150} amp={30} treeH={[50, 100]} count={70} color="#2d1214" />
			</Layer>
			<Layer p={p} depth={0.45} pan={[0, 50]}>
				{/* ущелье */}
				<path d={`M-80,${deck + 40} L250,${deck + 80} L470,${deck + 520} L590,${deck + 520} L820,${deck + 90} L${W + 80},${deck + 30} L${W + 80},${H} L-80,${H} Z`} fill="#170a0b" />
				<path d={`M450,${deck + 525} Q520,${deck + 505} 610,${deck + 525} L640,${deck + 600} L430,${deck + 600} Z`} fill="#8a3a22" opacity={0.6} />
				<Fog y={deck + 420} frame={frame} seed="bf" opacity={0.3} height={180} color="f0c79a" />
				{bents}
				<rect x={-80} y={deck - 12} width={built + 110} height={14} fill="#0e0708" />
				{/* кран-деррик */}
				<g stroke="#0e0708" strokeWidth={6} fill="none">
					<line x1={640} y1={deck - 12} x2={640} y2={deck - 330} />
					<line x1={640} y1={deck - 300} x2={860} y2={deck - 200} />
					<line x1={640} y1={deck - 330} x2={560} y2={deck - 12} strokeWidth={3} />
				</g>
				<g transform={`rotate(${swing} 860 ${deck - 200})`}>
					<line x1={860} y1={deck - 200} x2={860} y2={deck - 60} stroke="#0e0708" strokeWidth={2} />
					<rect x={800} y={deck - 62} width={120} height={14} fill="#0e0708" />
				</g>
				{/* фонари */}
				{[90, 360, 600].map((x, i) => (
					<g key={i}>
						<rect x={x} y={deck - 70} width={4} height={58} fill="#0e0708" />
						<circle cx={x + 2} cy={deck - 74} r={70} fill="url(#warm)" opacity={0.6 + 0.2 * Math.sin(frame / 4 + i)} />
						<circle cx={x + 2} cy={deck - 74} r={5} fill="#ffd38a" />
					</g>
				))}
				{/* рабочие стучат молотами */}
				{workers.map((w, i) => {
					const hit = Math.sin(frame / 6 + w.ph);
					return (
						<Figure
							key={i}
							x={w.x}
							y={deck - 12}
							h={64}
							facing={i % 2 ? -1 : 1}
							axe="hands"
							color="#0e0708"
							pose={{armL: 110 + hit * 70, armR: 100 + hit * 70, elbowL: 10, elbowR: 15, lean: 25, thighL: 25, thighR: -10, kneeL: 30}}
						/>
					);
				})}
				<Figure x={interpolate(frame, [0, frames], [260, 330])} y={deck - 12} h={64} facing={1} color="#0e0708" pose={{...walkPose(frame / 6, 0.8), armL: 160, armR: 160, elbowL: 20, elbowR: 20}} />
				<rect x={interpolate(frame, [0, frames], [210, 280])} y={deck - 86} width={110} height={8} fill="#0e0708" />
			</Layer>
			<Layer p={p} depth={0.9} pan={[0, 70]}>
				{/* уступ и Роберт смотрит */}
				<path d="M-80,1580 L120,1540 L330,1560 L470,1620 L560,1700 L560,2000 L-80,2000 Z" fill="#090404" />
				<Grass frame={frame * 2} seed="bg" y={1560} count={60} h={[30, 80]} color="#090404" x0={-60} x1={480} />
				<Figure x={260} y={1556} h={360} facing={1} color="#090404" rim={{color: '#ff9a55', side: 1, strength: 0.75}} pose={{armL: 4, armR: -2, elbowL: 4, elbowR: 6, head: -4, thighL: 4, thighR: -4}} hat />
			</Layer>
		</>
	);
};

/* ======================= 5. Дом у реки ======================= */
const Cabin: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const cx = 560;
	const by = 1290;
	const flick = 0.85 + 0.15 * Math.sin(frame / 4) * Math.sin(frame / 11);
	const lean = interpolate(frame, [30, 90], [0, 1], {...clamp, easing: ease});
	return (
		<>
			<Sky id="sky-cabin" stops={['#0a1024', '#18244a', '#34406a', '#6c6584', '#b78c80', '#d8a68a']} />
			<Layer p={p} depth={0.05} pan={[0, 20]}>
				<Stars frame={frame} count={120} maxY={800} seed="cs" opacity={0.8} />
				<circle cx={250} cy={880} r={260} fill="url(#moon)" opacity={0.8} />
				<circle cx={250} cy={880} r={40} fill="#f4ead2" />
				<Clouds frame={frame} seed="cc" y={960} count={3} color="#3a3d5c" lit="#e0a88a" speed={0.12} scale={0.6} />
			</Layer>
			<Layer p={p} depth={0.2} pan={[0, 30]}>
				<Mountains seed="cm" base={1170} peak={260} color="#353a5a" snow="#c8c4d4" lit="#d39a88" />
				<Ridge seed="c1" base={1190} amp={40} treeH={[80, 150]} count={70} color="#1c2240" rim="#c79a8c" />
				<Fog y={1200} frame={frame} seed="cf1" opacity={0.3} color="8b97a8" />
			</Layer>
			<Layer p={p} depth={0.55} pan={[0, 45]}>
				<Ridge seed="c2" base={by + 10} amp={20} treeH={[280, 460]} count={9} color="#0b0f1e" hill={false} x0={-200} x1={300} />
				<Ridge seed="c3" base={by + 10} amp={20} treeH={[300, 480]} count={8} color="#0b0f1e" hill={false} x0={860} x1={1300} />
				<rect x={-80} y={by} width={W + 160} height={70} fill="#0b0f1e" />
				<Smoke frame={frame} x={cx + 150} y={by - 330} seed="csm" color="9c9a98" rate={9} life={160} drift={0.6} size={24} opacity={0.4} />
				<circle cx={cx} cy={by - 110} r={380} fill="url(#warm)" opacity={0.28 * flick} />
				{/* сруб */}
				<g>
					<rect x={cx - 230} y={by - 200} width={460} height={200} fill="#140f10" />
					{Array.from({length: 9}).map((_, i) => (
						<g key={i}>
							<rect x={cx - 236} y={by - 200 + i * 22} width={472} height={20} rx={10} fill="#1c1514" />
							<circle cx={cx - 236} cy={by - 190 + i * 22} r={10} fill="#3a2c24" />
							<circle cx={cx + 236} cy={by - 190 + i * 22} r={10} fill="#3a2c24" />
						</g>
					))}
					<path d={`M${cx - 280},${by - 192} L${cx},${by - 350} L${cx + 280},${by - 192} Z`} fill="#0f0b0c" />
					{Array.from({length: 6}).map((_, i) => (
						<line key={i} x1={cx - 270 + i * 18} y1={by - 198 - i * 26} x2={cx + 270 - i * 18} y2={by - 198 - i * 26} stroke="#1f1819" strokeWidth={3} />
					))}
					{/* каменная труба */}
					<rect x={cx + 130} y={by - 340} width={44} height={150} fill="#1a1617" />
					{Array.from({length: 6}).map((_, i) => (
						<line key={i} x1={cx + 130} y1={by - 330 + i * 24} x2={cx + 174} y2={by - 330 + i * 24} stroke="#2a2526" strokeWidth={2} />
					))}
					{/* окна */}
					{[cx - 170, cx + 90].map((x, i) => (
						<g key={i}>
							<rect x={x} y={by - 150} width={80} height={66} fill="#ffb35c" opacity={flick * (i ? 0.9 : 1)} />
							<path d={`M${x},${by - 150} Q${x + 20},${by - 110} ${x + 8},${by - 84} L${x},${by - 84} Z`} fill="#c06a2a" opacity={0.6} />
							<line x1={x + 40} y1={by - 150} x2={x + 40} y2={by - 84} stroke="#140f10" strokeWidth={4} />
							<line x1={x} y1={by - 117} x2={x + 80} y2={by - 117} stroke="#140f10" strokeWidth={4} />
							<circle cx={x + 40} cy={by - 117} r={130} fill="url(#warm)" opacity={0.5 * flick} />
						</g>
					))}
					{/* открытая дверь */}
					<rect x={cx - 40} y={by - 160} width={78} height={160} fill="#ffbf6e" opacity={0.9 * flick} />
					<rect x={cx - 52} y={by - 160} width={14} height={160} fill="#0f0b0c" />
					{/* крыльцо */}
					<rect x={cx - 250} y={by - 205} width={500} height={10} fill="#0f0b0c" />
					{[cx - 240, cx + 230].map((x) => (
						<rect key={x} x={x} y={by - 200} width={10} height={200} fill="#0f0b0c" />
					))}
					<rect x={cx - 120} y={by - 20} width={240} height={20} fill="#120d0d" />
					<path d={`M${cx - 40},${by} L${cx + 38},${by} L${cx + 140},${by + 70} L${cx - 150},${by + 70} Z`} fill="url(#spill)" opacity={0.8 * flick} />
				</g>
				{/* поленница и топор в колоде */}
				<g fill="#0d0a0b">
					{Array.from({length: 12}).map((_, i) => (
						<circle key={i} cx={cx - 340 + (i % 4) * 26} cy={by - 14 - Math.floor(i / 4) * 24} r={12} />
					))}
					<rect x={cx + 300} y={by - 40} width={50} height={40} />
					<line x1={cx + 320} y1={by - 40} x2={cx + 350} y2={by - 90} stroke="#0d0a0b" strokeWidth={5} />
					<path d={`M${cx + 312},${by - 46} l14,-10 l6,10 Z`} />
				</g>
				{/* они сидят на ступеньке */}
				<Figure x={cx - 50} y={by + 2} h={150} facing={1} color="#0a0708" rim={{color: '#ffb35c', side: 1, strength: 0.75}} pose={sitPose({armL: 60, elbowL: 50})} hat={false} />
				<Figure
					x={cx + 2}
					y={by + 2}
					h={140}
					kind="woman"
					facing={-1}
					color="#0a0708"
					rim={{color: '#ffb35c', side: -1, strength: 0.75}}
					pose={sitPose({lean: 8 + lean * 10, head: lean * 14, armL: 50, elbowL: 40})}
				/>
			</Layer>
			<Layer p={p} depth={0.85} pan={[0, 60]}>
				{/* река с отражениями */}
				<rect x={-80} y={by + 70} width={W + 160} height={H} fill="#0c1428" />
				<path d={`M-80,${by + 70} Q540,${by + 50} ${W + 80},${by + 75} L${W + 80},${by + 100} L-80,${by + 100} Z`} fill="#0b0f1e" />
				{Array.from({length: 30}).map((_, i) => {
					const y = by + 120 + i * 18;
					const warm = i % 3 !== 0;
					const x = (warm ? cx - 160 + rnd(`cr${i}`) * 300 : 150 + rnd(`cr${i}`) * 200) + 16 * Math.sin(frame / 10 + i);
					return (
						<rect
							key={i}
							x={x}
							y={y}
							width={30 + rnd(`cw${i}`) * 80}
							height={3}
							fill={warm ? '#ffb35c' : '#dfe6f5'}
							opacity={(warm ? 0.55 : 0.35) * (0.5 + 0.5 * Math.sin(frame / 7 + i * 1.3)) * (1 - i / 34)}
						/>
					);
				})}
				<Particles frame={frame} count={18} kind="firefly" seed="cfly" area={[40, by - 260, 1000, 380]} />
				<Grass frame={frame} seed="creed" y={1720} count={80} h={[80, 220]} color="#04060c" x0={-60} x1={360} />
				<Grass frame={frame} seed="creed2" y={1740} count={60} h={[60, 180]} color="#04060c" x0={760} x1={1140} />
			</Layer>
		</>
	);
};

/* ======================= 6. Смена сезонов ======================= */
const Seasons: React.FC<SetProps> = ({frame, frames}) => {
	const k = frame / frames;
	const off = frame * 3.2;
	const gy = 1380;
	const sky0 = interpolateColors(k, [0, 0.3, 0.45, 0.7, 0.85, 1], ['#3a2a2e', '#3a2a30', '#3c4456', '#465264', '#3c5060', '#4c6070']);
	const sky1 = interpolateColors(k, [0, 0.3, 0.45, 0.7, 0.85, 1], ['#e0965a', '#c98256', '#a7b0bc', '#bcc4cc', '#c8c88e', '#e8d89a']);
	const groundC = interpolateColors(k, [0, 0.33, 0.45, 0.7, 0.82, 1], ['#4a2e18', '#3f2a1a', '#cfd5dd', '#c4cbd4', '#3c4a24', '#40552a']);
	const leafC = interpolateColors(k, [0, 0.25, 0.75, 0.9], ['#d0752e', '#b04a22', '#7da04a', '#5f8a3a']);
	const leafO = interpolate(k, [0, 0.3, 0.4, 0.72, 0.85], [1, 0.8, 0, 0, 1], clamp);
	const snow = interpolate(k, [0.36, 0.45, 0.7, 0.78], [0, 1, 1, 0], clamp);
	const leafFall = interpolate(k, [0, 0.3, 0.38], [1, 1, 0], clamp);
	const snowFall = interpolate(k, [0.34, 0.42, 0.68, 0.76], [0, 1, 1, 0], clamp);
	const pollen = interpolate(k, [0.78, 0.9], [0, 1], clamp);
	const tile = 300;
	const n = 6;
	const trees = Array.from({length: n}).map((_, i) => {
		const x = ((((i * tile - off) % (n * tile)) + n * tile) % (n * tile)) - 260;
		return <LeafTree key={i} x={x} base={gy} h={560 + rnd(`sth${i}`) * 200} seed={`stt${i}`} trunk="#1a120e" leaf={leafC} leafOpacity={leafO} snow={snow} frame={frame} />;
	});
	const breath = snow > 0.5 ? (frame % 40) / 40 : -1;
	return (
		<>
			<defs>
				<linearGradient id="sky-seasons" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={sky0} />
					<stop offset="100%" stopColor={sky1} />
				</linearGradient>
			</defs>
			<rect x={-100} y={-100} width={W + 200} height={H + 200} fill="url(#sky-seasons)" />
			<circle cx={760} cy={1080} r={520} fill="url(#sun)" opacity={0.5 * (1 - snow * 0.7)} />
			<g transform={`translate(${-(off * 0.1) % 400} 0)`}>
				<Mountains seed="sm" base={1180} peak={300} color={interpolateColors(k, [0, 0.45, 0.8], ['#6a4a48', '#8a94a6', '#5a6e70'])} snow="#eef2f7" x0={-200} x1={W + 600} />
			</g>
			<g transform={`translate(${-(off * 0.25) % 600} 0)`}>
				<Ridge seed="sr" base={1250} amp={30} treeH={[90, 170]} count={90} color={interpolateColors(k, [0, 0.45, 0.8], ['#3a2620', '#6c7686', '#2e4030'])} x0={-200} x1={W + 800} />
			</g>
			<Fog y={1260} frame={frame} seed="sf" opacity={0.3 + snow * 0.2} color="e2c9a6" />
			<rect x={-100} y={gy - 10} width={W + 200} height={H} fill={groundC} />
			{trees}
			{/* тропа и следы на снегу */}
			<rect x={-100} y={gy + 40} width={W + 200} height={30} fill="#000" opacity={0.15} />
			{snow > 0 &&
				Array.from({length: 12}).map((_, i) => {
					const x = ((((i * 46 - off) % 560) + 560) % 560) - 120;
					return x < 430 ? <ellipse key={i} cx={x} cy={gy + 52 + (i % 2) * 8} rx={10} ry={4} fill="#8a96a6" opacity={snow * 0.6} /> : null;
				})}
			<Figure
				x={460}
				y={gy + 60}
				h={380}
				facing={1}
				axe="shoulder"
				color="#0b0908"
				rim={{color: interpolateColors(k, [0, 0.45, 0.85], ['#ffb070', '#e0e8f2', '#ffe0a0']), side: 1, strength: 0.6}}
				pose={{...walkPose(frame / 5.5), armL: 150, elbowL: 80}}
			/>
			{breath >= 0 && <Smoke frame={frame} x={530} y={gy - 270} seed="br" color="e9d2b4" rate={40} life={30} drift={1.6} rise={0.3} size={10} opacity={0.6 * snow} />}
			<Particles frame={frame} count={50} kind="leaf" seed="sl" opacity={leafFall} />
			<Particles frame={frame} count={160} kind="snow" seed="sn" opacity={snowFall} />
			<Particles frame={frame} count={70} kind="dust" seed="sp" opacity={pollen} />
			<Grass frame={frame} seed="sg" y={1760} count={120} h={[60, 160]} color={interpolateColors(k, [0, 0.4, 0.75, 0.9], ['#2a1a10', '#9aa4b2', '#9aa4b2', '#1e2a14'])} />
			<rect x={-100} y={1800} width={W + 200} height={300} fill={interpolateColors(k, [0, 0.4, 0.75, 0.9], ['#2a1a10', '#9aa4b2', '#9aa4b2', '#1e2a14'])} />
		</>
	);
};

/* ======================= 7. Лагерь лесорубов у костра ======================= */
const Campfire: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const fx = 540;
	const fy = 1390;
	const glow = 0.85 + 0.15 * Math.sin(frame / 3) * Math.sin(frame / 8);
	const flame = (i: number, h: number, w: number, col: string) => {
		const sway = Math.sin(frame / 3.3 + i * 1.7) * 14 + Math.sin(frame / 7.1 + i) * 8;
		const hh = h * (0.85 + 0.2 * Math.sin(frame / 2.7 + i * 2.3));
		const x = fx + (i - 2) * 20;
		return (
			<path
				key={`${col}${i}`}
				d={`M${x - w},${fy} C${x - w * 1.1},${fy - hh * 0.45} ${x + sway - w * 0.4},${fy - hh * 0.7} ${x + sway},${fy - hh} C${x + sway + w * 0.5},${fy - hh * 0.65} ${x + w * 1.1},${fy - hh * 0.4} ${x + w},${fy} Z`}
				fill={col}
			/>
		);
	};
	const sip = Math.max(0, Math.sin(frame / 40));
	const poke = Math.sin(frame / 14) * 8;
	return (
		<>
			<Sky id="sky-fire" stops={['#020306', '#060a14', '#0d1220', '#171420']} />
			<Layer p={p} depth={0.05}>
				<Stars frame={frame} count={180} maxY={1000} seed="fs" />
			</Layer>
			<Layer p={p} depth={0.3} pan={[0, 20]}>
				<Ridge seed="fr1" base={1260} amp={40} treeH={[300, 600]} count={34} color="#0a0d15" rim="#c0602a" />
				<circle cx={fx} cy={fy - 160} r={820} fill="url(#fire)" opacity={0.42 * glow} />
			</Layer>
			<Layer p={p} depth={0.6} pan={[0, 30]}>
				<rect x={-80} y={1300} width={W + 160} height={H} fill="#0c0806" />
				<ellipse cx={fx} cy={fy + 10} rx={520} ry={110} fill="#6a3416" opacity={0.42 * glow} />
				{/* палатки */}
				<g>
					<path d="M60,1320 L200,1150 L340,1320 Z" fill="#3a2414" />
					<path d="M60,1320 L200,1150 L340,1320 Z" fill="#ffb060" opacity={0.35 * glow} />
					<path d="M170,1320 L200,1200 L230,1320 Z" fill="#ffcf80" opacity={0.75 * glow} />
					<line x1={200} y1={1150} x2={200} y2={1130} stroke="#1a0f08" strokeWidth={4} />
					<path d="M760,1310 L880,1170 L1000,1310 Z" fill="#1d130c" />
					<path d="M760,1310 L880,1170" stroke="#ff9a50" strokeWidth={3} opacity={0.5 * glow} />
				</g>
				{/* топоры у бревна */}
				<rect x={700} y={1356} width={180} height={26} rx={12} fill="#1a100a" />
				<line x1={720} y1={1360} x2={760} y2={1260} stroke="#1a100a" strokeWidth={5} />
				<path d="M752,1270 l18,-8 l4,16 Z" fill="#1a100a" />
				<Ridge seed="fr2" base={1420} amp={20} treeH={[700, 1000]} count={3} color="#040303" hill={false} x0={-260} x1={160} />
				<Ridge seed="fr3" base={1420} amp={20} treeH={[700, 1000]} count={3} color="#040303" hill={false} x0={940} x1={1340} />
			</Layer>
			<Layer p={p} depth={0.8} pan={[0, 40]}>
				{/* тренога с котелком */}
				<g stroke="#140b06" strokeWidth={5}>
					<line x1={fx - 90} y1={fy + 10} x2={fx} y2={fy - 230} />
					<line x1={fx + 90} y1={fy + 10} x2={fx} y2={fy - 230} />
				</g>
				<line x1={fx} y1={fy - 230} x2={fx} y2={fy - 150} stroke="#140b06" strokeWidth={2} />
				<path d={`M${fx - 30},${fy - 150} L${fx + 30},${fy - 150} L${fx + 24},${fy - 110} Q${fx},${fy - 100} ${fx - 24},${fy - 110} Z`} fill="#140b06" />
				<Smoke frame={frame} x={fx} y={fy - 160} seed="kst" color="e9d2b4" rate={10} life={70} drift={0.3} rise={1} size={10} opacity={0.35} />
				<g fill="#1a0f08">
					<rect x={fx - 130} y={fy - 14} width={260} height={28} rx={13} transform={`rotate(-10 ${fx} ${fy})`} />
					<rect x={fx - 130} y={fy - 14} width={260} height={28} rx={13} transform={`rotate(12 ${fx} ${fy})`} />
				</g>
				<g style={{mixBlendMode: 'screen'}}>
					{[0, 1, 2, 3, 4].map((i) => flame(i, 210 - Math.abs(i - 2) * 46, 42, '#d2471a'))}
					{[0, 1, 2, 3, 4].map((i) => flame(i, 155 - Math.abs(i - 2) * 36, 28, '#f08a2a'))}
					{[1, 2, 3].map((i) => flame(i, 100 - Math.abs(i - 2) * 26, 16, '#ffd27a'))}
				</g>
				<Smoke frame={frame} x={fx} y={fy - 260} seed="fsm" color="5a5658" rate={7} life={140} drift={0.5} rise={1.4} size={30} opacity={0.4} />
				<Particles frame={frame} count={55} kind="ember" seed="fe" area={[fx - 300, fy - 1000, 600, 1000]} />
				{/* лесорубы вокруг огня */}
				<Figure x={300} y={fy + 40} h={210} facing={1} color="#080504" rim={{color: '#ff9a3c', side: 1, strength: 0.9 * glow}} pose={sitPose({armL: 70 + poke, elbowL: 10, lean: 16})} />
				<line x1={300 + 52 + poke} y1={fy - 110} x2={fx - 60 + poke} y2={fy - 10} stroke="#080504" strokeWidth={4} />
				<Figure x={790} y={fy + 40} h={210} facing={-1} color="#080504" rim={{color: '#ff9a3c', side: 1, strength: 0.9 * glow}} pose={sitPose({armL: 60 + sip * 90, elbowL: 40 + sip * 60, head: -sip * 12})} />
				<Figure x={650} y={fy - 40} h={150} facing={-1} color="#080504" rim={{color: '#ff9a3c', side: -1, strength: 0.8 * glow}} pose={sitPose({armL: 30, armR: 20, lean: 20})} />
			</Layer>
		</>
	);
};

/* ======================= 8. Ночное озеро, гудок вдалеке ======================= */
const Lake: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const shore = 1140;
	const tx = interpolate(frame, [0, frames], [1150, -420]);
	const whistle = interpolate(frame, [102, 108, 150, 190], [0, 1, 1, 0], clamp);
	const far = (refl: boolean) => (
		<g>
			<Mountains seed="lm" base={shore} peak={320} color="#121a2e" snow="#8f9cb8" lit="#5a6a90" />
			<Ridge seed="l1" base={shore} amp={24} treeH={[40, 110]} count={110} color="#0a1020" />
			{!refl && <Smoke frame={frame} x={tx + 15} y={shore - 48} seed="lsm" color="9c9a98" rate={5} life={150} drift={1.5} rise={0.4} size={12} opacity={0.5} />}
			{!refl && <Smoke frame={frame} x={tx + 15} y={shore - 52} seed="lwh" color="d8d4cc" rate={3} life={40} drift={0.4} rise={1.4} size={9} opacity={0.8 * whistle} />}
			<Train x={tx} y={shore - 4} s={0.28} dist={frame * 6} frame={frame} cars={5} color="#04060c" hi="#2a3550" />
		</g>
	);
	return (
		<>
			<Sky id="sky-lake" stops={['#02040a', '#061026', '#122044', '#1e2c52']} />
			<Layer p={p} depth={0.05} pan={[0, 10]}>
				<Stars frame={frame} count={240} maxY={1080} seed="ls" />
				<circle cx={300} cy={820} r={300} fill="url(#moon)" />
				<circle cx={300} cy={820} r={44} fill="#f2e8cf" />
			</Layer>
			<Layer p={p} depth={0.25} pan={[0, 20]}>
				{far(false)}
				{/* озеро и отражения */}
				<rect x={-100} y={shore} width={W + 200} height={H} fill="#0a1328" />
				<g transform={`translate(0 ${shore * 2}) scale(1 -1)`} opacity={0.38}>
					{far(true)}
				</g>
				{Array.from({length: 40}).map((_, i) => (
					<rect key={i} x={-100} y={shore + 6 + i * 16} width={W + 200} height={3} fill="#0a1328" opacity={0.55} transform={`translate(${Math.sin(frame / 12 + i) * 6} 0)`} />
				))}
				{/* лунная дорожка */}
				{Array.from({length: 26}).map((_, i) => (
					<rect key={i} x={300 - 20 - i * 3 + Math.sin(frame / 8 + i) * 10 + rnd(`lmr${i}`) * 20} y={shore + 20 + i * 22} width={40 + i * 5} height={3} fill="#f2e8cf" opacity={(0.5 - i * 0.015) * (0.6 + 0.4 * Math.sin(frame / 6 + i))} />
				))}
				<Fog y={shore + 30} frame={frame} seed="lf1" opacity={0.35} height={120} color="8b97a8" />
				<Fog y={shore + 200} frame={frame} seed="lf2" speed={0.5} opacity={0.25} height={160} color="5d6b82" />
			</Layer>
			<Layer p={p} depth={0.8} pan={[0, 40]}>
				{/* мостки и Роберт на краю */}
				<path d="M620,1470 L1180,1560 L1180,1640 L620,1500 Z" fill="#06080e" />
				{[660, 780, 900, 1020].map((x) => (
					<rect key={x} x={x} y={1480 + (x - 620) * 0.16} width={10} height={120} fill="#06080e" />
				))}
				{Array.from({length: 14}).map((_, i) => (
					<line key={i} x1={640 + i * 38} y1={1474 + i * 6} x2={640 + i * 38} y2={1504 + i * 7} stroke="#111522" strokeWidth={2} />
				))}
				<Figure x={680} y={1490} h={190} facing={-1} color="#05070c" rim={{color: '#aab8d8', side: -1, strength: 0.6}} pose={sitPose({thighL: 88, thighR: 86, kneeL: 92, kneeR: 98, armL: 20, elbowL: 20, head: -6})} />
				<Grass frame={frame} seed="lreed" y={1700} count={90} h={[120, 300]} color="#03050a" x0={-60} x1={420} />
				<rect x={-100} y={1720} width={W + 200} height={400} fill="#03050a" />
			</Layer>
		</>
	);
};

/* ======================= 9. Рассвет над долиной ======================= */
const Dawn: React.FC<SetProps> = ({frame, frames}) => {
	const p = frame / frames;
	const k = interpolate(frame, [0, frames * 0.8], [0, 1], {...clamp, easing: ease});
	const sunY = interpolate(k, [0, 1], [1210, 1040]);
	const top = interpolateColors(k, [0, 1], ['#0e1530', '#2a3a62']);
	const mid = interpolateColors(k, [0, 1], ['#3a3a5e', '#a06e70']);
	const low = interpolateColors(k, [0, 1], ['#a86a5a', '#f6c48a']);
	return (
		<>
			<defs>
				<linearGradient id="sky-dawn" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={top} />
					<stop offset="55%" stopColor={mid} />
					<stop offset="100%" stopColor={low} />
				</linearGradient>
			</defs>
			<rect x={-100} y={-100} width={W + 200} height={H + 200} fill="url(#sky-dawn)" />
			<Layer p={p} depth={0.05} pan={[0, 10]}>
				<Stars frame={frame} count={80} maxY={700} seed="ds" opacity={1 - k} />
				<circle cx={620} cy={sunY} r={760} fill="url(#sun)" opacity={0.35 + 0.4 * k} />
				<circle cx={620} cy={sunY} r={84} fill="#ffe6b8" opacity={0.9} />
				<g style={{mixBlendMode: 'screen'}} opacity={0.55 * k}>
					{Array.from({length: 9}).map((_, i) => {
						const a = ((-70 + i * 17.5) * Math.PI) / 180;
						const len = 1400;
						const x2 = 620 + Math.sin(a) * len;
						const y2 = sunY - Math.cos(a) * len;
						const o = 0.25 + 0.2 * Math.sin(frame / 30 + i);
						return <path key={i} d={`M620,${sunY} L${x2 - 60},${y2} L${x2 + 60},${y2} Z`} fill="#ffe2a8" opacity={o} />;
					})}
				</g>
				<Clouds frame={frame} seed="dc" y={820} count={4} color={interpolateColors(k, [0, 1], ['#2a2c48', '#8a5a62'])} lit="#ffcf98" speed={0.15} scale={0.8} />
				<Birds frame={frame} seed="dbird" count={5} x={-100} y={900} vx={2.2} vy={-0.3} size={12} color="#1a1420" />
			</Layer>
			<Layer p={p} depth={0.2} pan={[0, 20]}>
				<Mountains seed="dm" base={1180} peak={340} color={interpolateColors(k, [0, 1], ['#1e2240', '#5a4a62'])} snow="#f6dcc4" lit="#ffc690" />
				<Fog y={1190} frame={frame} seed="df0" opacity={0.4 + 0.2 * k} height={200} color="f0c79a" />
				<Ridge seed="d1" base={1230} amp={40} treeH={[60, 120]} count={90} color={interpolateColors(k, [0, 1], ['#151a30', '#3e3448'])} rim="#ffc690" />
			</Layer>
			<Layer p={p} depth={0.45} pan={[0, 30]}>
				{/* река и маленький дом вдали */}
				<path d="M560,1260 Q500,1320 600,1380 Q720,1450 640,1560 L860,1560 Q900,1440 780,1370 Q660,1320 660,1260 Z" fill={interpolateColors(k, [0, 1], ['#2a3150', '#e8b888'])} opacity={0.85} />
				<Ridge seed="d2" base={1330} amp={30} treeH={[120, 220]} count={36} color={interpolateColors(k, [0, 1], ['#0e1226', '#2a2232'])} />
				<g fill={interpolateColors(k, [0, 1], ['#0e1226', '#2a2232'])}>
					<rect x={360} y={1290} width={70} height={40} />
					<path d="M350,1292 L395,1262 L440,1292 Z" />
				</g>
				<rect x={378} y={1302} width={14} height={12} fill="#ffb35c" opacity={0.9 - k * 0.6} />
				<Smoke frame={frame} x={420} y={1262} seed="dsm" color="d8d4cc" rate={10} life={140} drift={0.5} size={10} opacity={0.4} />
				<Fog y={1340} frame={frame} seed="df1" speed={0.5} opacity={0.35} height={140} color="f0c79a" />
			</Layer>
			<Layer p={p} depth={0.85} pan={[0, 50]}>
				{/* холм и Роберт на пне смотрит на рассвет */}
				<path d="M380,1700 Q620,1560 820,1580 Q980,1590 1180,1520 L1180,2000 L380,2000 Z" fill="#07060a" />
				<Grass frame={frame} seed="dg" y={1600} count={80} h={[30, 90]} color="#07060a" x0={480} x1={1140} lit="#7a4a3a" />
				<rect x={780} y={1540} width={70} height={46} rx={6} fill="#07060a" />
				<Figure x={815} y={1588} h={250} facing={-1} color="#07060a" rim={{color: '#ffc690', side: -1, strength: 0.85 * k + 0.2}} pose={sitPose({armL: 22, elbowL: 58, armR: 14, elbowR: 64, lean: 14, head: -4})} hat />
				<Ridge seed="d3" base={1760} amp={30} treeH={[500, 800]} count={4} color="#050408" hill={false} x0={-200} x1={250} />
				<rect x={-100} y={1760} width={600} height={400} fill="#050408" />
			</Layer>
		</>
	);
};

const SETS: Record<CinemaSet, React.FC<SetProps>> = {
	station: Station,
	valley: Valley,
	logging: Logging,
	bridge: Bridge,
	cabin: Cabin,
	seasons: Seasons,
	campfire: Campfire,
	lake: Lake,
	dawn: Dawn,
	// старые имена
	night: Valley,
	forest: Logging,
	reel: Campfire,
	outro: Lake,
	...RIPLEY_SETS,
	...LIFE_SETS,
	...IRISH_SETS,
};

/** Кадрирование: камера ближе к действию (масштаб, точка фокуса) */
const CAMERA: Partial<Record<CinemaSet, [number, number, number]>> = {
	station: [1.32, 600, 1260],
	valley: [1.15, 540, 1200],
	bridge: [1.2, 480, 1200],
	cabin: [1.5, 560, 1250],
	seasons: [1.08, 460, 1300],
	campfire: [1.35, 540, 1330],
	lake: [1.2, 620, 1330],
	dawn: [1.1, 640, 1300],
	...RIPLEY_CAMERA,
	...LIFE_CAMERA,
	...IRISH_CAMERA,
};

export const SetView: React.FC<{set: CinemaSet; frame: number; frames: number}> = ({set, frame, frames}) => {
	const C = SETS[set] ?? Valley;
	const [s, fx, fy] = CAMERA[set] ?? [1, W / 2, H / 2];
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
			<Defs />
			<g transform={`translate(${fx} ${fy}) scale(${s}) translate(${-fx} ${-fy})`}>
				<C frame={frame} frames={frames} />
			</g>
		</svg>
	);
};
