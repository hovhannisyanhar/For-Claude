// Детальные персонажи: профиль лица, причёска, одежда разных цветов, кисти, обувь.
// Та же система поз, что у Figure (people.tsx): 100 единиц роста, ноги в (0,0), взгляд — вправо.
import React from 'react';
import type {Pose} from './people';

export type Look = {
	kind?: 'man' | 'woman';
	skin: string;
	hair: string;
	hairStyle?: 'slick' | 'wavy' | 'bob';
	/** Пиджак/рубашка (у женщины — платье) */
	top: string;
	/** Видна рубашка у ворота (пиджак) */
	shirt?: string;
	tie?: string;
	bottom: string;
	shoes: string;
	hat?: string;
	/** Рукава закатаны (видны предплечья) */
	rolled?: boolean;
};

const rad = (d: number) => (d * Math.PI) / 180;
const limb = (x: number, y: number, ang: number, len: number) => [x + Math.sin(rad(ang)) * len, y + Math.cos(rad(ang)) * len] as [number, number];

const hex = (c: string) => {
	const h = c.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
export const mix = (a: string, b: string, t: number) => {
	const A = hex(a);
	const B = hex(b);
	return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
};

/** Сужающийся сегмент конечности: капсула от a (ширина w1) к b (ширина w2) */
const Seg: React.FC<{a: [number, number]; b: [number, number]; w1: number; w2: number; fill: string}> = ({a, b, w1, w2, fill}) => {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const L = Math.hypot(dx, dy) || 1;
	const nx = -dy / L;
	const ny = dx / L;
	const p = (pt: [number, number], w: number, s: number) => `${pt[0] + nx * w * s * 0.5},${pt[1] + ny * w * s * 0.5}`;
	return (
		<g fill={fill}>
			<path d={`M${p(a, w1, 1)} L${p(b, w2, 1)} L${p(b, w2, -1)} L${p(a, w1, -1)} Z`} />
			<circle cx={a[0]} cy={a[1]} r={w1 / 2} />
			<circle cx={b[0]} cy={b[1]} r={w2 / 2} />
		</g>
	);
};

const Body: React.FC<{look: Look; pose: Pose; c0: (s: string) => string; cs: (s: string) => string; flat?: string}> = ({look, pose, c0, cs, flat}) => {
	const c = (s: string) => (s === look.skin ? cs(s) : c0(s));
	const F = (s: string) => (flat ? flat : c(s));
	const woman = look.kind === 'woman';
	const lean = pose.lean ?? 0;
	const bob = pose.bob ?? 0;
	const hipY = -48 + bob;
	const shY = (woman ? -79 : -81) + bob;
	const S = limb(0, hipY, 180 - lean, hipY - shY);
	const H: [number, number] = [0, hipY];
	const ux = (S[0] - H[0]) / (hipY - shY);
	const uy = (S[1] - H[1]) / (hipY - shY);
	const nx = -uy; // вперёд
	const ny = ux;
	const at = (base: [number, number], along: number, side: number): [number, number] => [base[0] + ux * along + nx * side, base[1] + uy * along + ny * side];

	const far = (s: string) => (flat ? flat : mix(c(s), '#000000', 0.28));
	const skin = look.skin;

	const leg = (t: number, k: number, back: boolean) => {
		const knee = limb(H[0], H[1], t, 24);
		const foot = limb(knee[0], knee[1], t - k, 23);
		const col = back ? far : F;
		const toe: [number, number] = [foot[0] + 8, foot[1] - 0.5];
		return (
			<g>
				<Seg a={H} b={knee} w1={woman ? 7 : 11.5} w2={woman ? 5.4 : 8.6} fill={woman ? col(skin) : col(look.bottom)} />
				<Seg a={knee} b={foot} w1={woman ? 5.4 : 8.4} w2={woman ? 3.6 : 6.8} fill={woman ? col(skin) : col(look.bottom)} />
				<path d={`M${foot[0] - 3.5},${foot[1] + 1.2} Q${foot[0] - 3.5},${foot[1] - 3.6} ${foot[0] + 1},${foot[1] - 3.4} Q${toe[0] + 1.5},${toe[1] - 1.5} ${toe[0] + 1.5},${toe[1] + 1.2} Z`} fill={col(look.shoes)} />
			</g>
		);
	};
	const arm = (a: number, e: number, back: boolean) => {
		const sh = at(S, -2.5, back ? -2 : 1);
		const el = limb(sh[0], sh[1], a, 17);
		const hand = limb(el[0], el[1], a + e, 15.5);
		const col = back ? far : F;
		const sleeve = look.rolled ? limb(el[0], el[1], a + e, 5) : hand;
		return (
			<g>
				<Seg a={sh} b={el} w1={woman ? 6 : 8} w2={woman ? 4.6 : 6.6} fill={col(woman ? skin : look.top)} />
				<Seg a={el} b={hand} w1={woman ? 4.4 : 6.4} w2={woman ? 3.4 : 5} fill={col(woman || look.rolled ? skin : look.top)} />
				{look.rolled && !woman && <Seg a={el} b={sleeve} w1={7.2} w2={7} fill={col(look.top)} />}
				<circle cx={hand[0]} cy={hand[1]} r={woman ? 2.3 : 2.9} fill={col(skin)} />
			</g>
		);
	};

	// корпус
	const shoulderB = at(S, 0, -6);
	const shoulderF = at(S, -1, 6.5);
	const chestF = at(S, -9, woman ? 8 : 7.5);
	const waistF = at(H, 10, woman ? 4.6 : 6.4);
	const waistB = at(H, 10, woman ? -4.6 : -6.6);
	const hemF = at(H, woman ? 0 : -6, woman ? 6 : 8);
	const hemB = at(H, woman ? 0 : -6, woman ? -6 : -8);
	const backTop = at(S, -4, -8.5);
	const torso = `M${shoulderB[0]},${shoulderB[1]} Q${S[0]},${S[1] - 1.5} ${shoulderF[0]},${shoulderF[1]} Q${chestF[0] + nx},${chestF[1] + ny} ${waistF[0]},${waistF[1]} L${hemF[0]},${hemF[1]} L${hemB[0]},${hemB[1]} L${waistB[0]},${waistB[1]} Q${backTop[0]},${backTop[1]} ${shoulderB[0]},${shoulderB[1]} Z`;

	// юбка: от талии к коленям
	const kneeL = limb(H[0], H[1], pose.thighL ?? 0, 24);
	const kneeR = limb(H[0], H[1], pose.thighR ?? 0, 24);
	const kneeMid: [number, number] = [(kneeL[0] + kneeR[0]) / 2, (kneeL[1] + kneeR[1]) / 2 + 2];

	// голова
	const neckBase = at(S, 0.5, 0.5);
	const headAng = 180 - lean - (pose.head ?? 0);
	const hc = limb(neckBase[0], neckBase[1], headAng, 10.5);
	const tilt = -(lean + (pose.head ?? 0)) * 0.6;
	const hx = 0;
	const hy = 0;
	const hairPath =
		look.hairStyle === 'bob'
			? `M${hx - 7.2},${hy + 6.6} C${hx - 9},${hy - 2} ${hx - 6},${hy - 9.4} ${hx + 0.5},${hy - 9} C${hx + 5.5},${hy - 8.8} ${hx + 7.4},${hy - 5.5} ${hx + 6.6},${hy - 2.6} C${hx + 3.5},${hy - 4.4} ${hx},${hy - 4} ${hx - 1.5},${hy - 1.5} C${hx - 2.5},${hy + 2} ${hx - 2},${hy + 5} ${hx - 3.5},${hy + 7.4} Z`
			: look.hairStyle === 'wavy'
				? `M${hx - 6.4},${hy + 3} C${hx - 8.8},${hy - 2} ${hx - 7},${hy - 9.6} ${hx - 2},${hy - 9.2} Q${hx + 0.5},${hy - 10.6} ${hx + 3},${hy - 9} Q${hx + 6.8},${hy - 8.6} ${hx + 6.4},${hy - 4} Q${hx + 4.6},${hy - 6} ${hx + 2.2},${hy - 5.2} Q${hx - 0.5},${hy - 4.6} ${hx - 2.2},${hy - 2} Q${hx - 3.8},${hy + 0.5} ${hx - 4.6},${hy + 3.6} Z`
				: `M${hx - 6.4},${hy + 2.4} C${hx - 8.2},${hy - 4} ${hx - 5},${hy - 8.8} ${hx + 1},${hy - 8.4} C${hx + 5},${hy - 8.2} ${hx + 6.6},${hy - 6} ${hx + 6},${hy - 3.8} C${hx + 3},${hy - 5.6} ${hx - 1},${hy - 5} ${hx - 3},${hy - 2.2} Q${hx - 4.4},${hy - 0.2} ${hx - 5},${hy + 3} Z`;
	const face = `M${hx - 5.2},${hy + 5.6} C${hx - 8},${hy + 1} ${hx - 7},${hy - 7.2} ${hx - 1},${hy - 7.6} C${hx + 4},${hy - 7.8} ${hx + 6},${hy - 5} ${hx + 6},${hy - 2.2} L${hx + 8},${hy + 1.6} L${hx + 6.2},${hy + 2.8} Q${hx + 6.9},${hy + 3.7} ${hx + 6.2},${hy + 4.4} Q${hx + 6.4},${hy + 6.8} ${hx + 4.2},${hy + 7.2} Q${hx + 1},${hy + 7.6} ${hx - 1.2},${hy + 5.8} Z`;

	return (
		<g>
			{woman ? (
				<>
					{leg(pose.thighR ?? 0, pose.kneeR ?? 0, true)}
					{leg(pose.thighL ?? 0, pose.kneeL ?? 0, false)}
				</>
			) : (
				<>
					{leg(pose.thighR ?? 0, pose.kneeR ?? 0, true)}
				</>
			)}
			{arm(pose.armR ?? -6, pose.elbowR ?? 12, true)}
			{!woman && leg(pose.thighL ?? 0, pose.kneeL ?? 0, false)}
			{/* шея */}
			<Seg a={neckBase} b={limb(neckBase[0], neckBase[1], headAng, 6)} w1={woman ? 4 : 5.4} w2={woman ? 3.6 : 5} fill={F(skin)} />
			<path d={torso} fill={F(look.top)} />
			{woman && <Seg a={at(H, 8, 0)} b={kneeMid} w1={12} w2={22} fill={F(look.top)} />}
			{woman && !flat && <path d={`M${at(H, 8.5, -4.8)[0]},${at(H, 8.5, -4.8)[1]} L${at(H, 8.5, 4.8)[0]},${at(H, 8.5, 4.8)[1]}`} stroke={mix(c(look.top), '#000000', 0.3)} strokeWidth={1.3} />}
			{/* воротник, лацкан, галстук, ремень */}
			{!woman && !flat && (
				<g>
					{look.shirt && <path d={`M${at(S, 1.5, 1)[0]},${at(S, 1.5, 1)[1]} L${at(S, -1, 6.8)[0]},${at(S, -1, 6.8)[1]} L${at(S, -8, 6.4)[0]},${at(S, -8, 6.4)[1]} Z`} fill={F(look.shirt)} />}
					{look.tie && <Seg a={at(S, -1.5, 6.2)} b={at(S, -14, 6.6)} w1={2.2} w2={2.8} fill={F(look.tie)} />}
					{look.shirt && <path d={`M${at(S, -1, 3)[0]},${at(S, -1, 3)[1]} L${at(S, -16, 7.2)[0]},${at(S, -16, 7.2)[1]}`} stroke={mix(c(look.top), '#000000', 0.3)} strokeWidth={0.9} fill="none" />}
					{!look.shirt && <path d={`M${at(S, 0.5, 2)[0]},${at(S, 0.5, 2)[1]} L${at(S, -3, 6.6)[0]},${at(S, -3, 6.6)[1]} L${at(S, -1, 4)[0]},${at(S, -1, 4)[1]} Z`} fill={mix(c(look.top), '#ffffff', 0.35)} />}
					<path d={`M${at(H, 1, -6.8)[0]},${at(H, 1, -6.8)[1]} L${at(H, 1, 6.6)[0]},${at(H, 1, 6.6)[1]}`} stroke={mix(c(look.bottom), '#000000', 0.4)} strokeWidth={1.4} />
				</g>
			)}
			{/* голова */}
			<g transform={`translate(${hc[0]} ${hc[1]}) rotate(${tilt})`}>
				<path d={face} fill={F(skin)} />
				{!flat && (
					<g>
						<ellipse cx={hx - 1.4} cy={hy + 0.8} rx={1.3} ry={2} fill={mix(c(skin), '#000000', 0.18)} />
						<path d={`M${hx + 3},${hy - 2.4} Q${hx + 4.6},${hy - 3.2} ${hx + 6},${hy - 2.4}`} stroke={c(mix(look.hair, '#000000', 0.2))} strokeWidth={0.7} fill="none" />
						<ellipse cx={hx + 4.6} cy={hy - 0.7} rx={0.75} ry={0.55} fill={c('#1a1210')} />
						<path d={`M${hx + 5.4},${hy + 4.7} L${hx + 6.4},${hy + 4.6}`} stroke={mix(c(skin), '#7a2a20', 0.35)} strokeWidth={0.6} />
					</g>
				)}
				<path d={hairPath} fill={F(look.hair)} />
				{look.hat && (
					<g fill={F(look.hat)}>
						<path d={`M${hx - 10},${hy - 4.6} Q${hx},${hy - 7.4} ${hx + 11},${hy - 4.4} Q${hx},${hy - 5.8} ${hx - 10},${hy - 4.6} Z`} />
						<path d={`M${hx - 6.6},${hy - 5.2} Q${hx - 6.4},${hy - 12.4} ${hx},${hy - 12} Q${hx + 6.6},${hy - 12.4} ${hx + 6.8},${hy - 5.2} Z`} />
						<rect x={hx - 6.8} y={hy - 7.2} width={13.6} height={1.6} fill={mix(c(look.hat), '#000000', 0.45)} />
					</g>
				)}
			</g>
			{arm(pose.armL ?? 8, pose.elbowL ?? 10, false)}
		</g>
	);
};

/**
 * Персонаж с одеждой и лицом. tint — приглушить цвета к цвету ночи/сумерек (0..1).
 * flat — нарисовать одним цветом (тень/контур).
 */
export const Person: React.FC<{
	x: number;
	y: number;
	h: number;
	look: Look;
	facing?: 1 | -1;
	pose?: Pose;
	tint?: {color: string; amount: number};
	rim?: {color: string; side: 1 | -1; strength?: number};
	shadow?: number;
}> = ({x, y, h, look, facing = 1, pose = {}, tint, rim, shadow = 0}) => {
	const k = h / 100;
	const c = (s: string) => (tint ? mix(s, tint.color, tint.amount) : s);
	const cs = (s: string) => (tint ? mix(s, tint.color, tint.amount * 0.35) : s);
	return (
		<g transform={`translate(${x} ${y}) scale(${facing * k} ${k})`}>
			{shadow > 0 && <ellipse cx={2} cy={0.5} rx={24} ry={3.2} fill="#000000" opacity={shadow} />}
			{rim && (
				<g transform={`translate(${rim.side * facing * 1.1} -0.5)`} opacity={rim.strength ?? 0.85}>
					<Body look={look} pose={pose} c0={c} cs={cs} flat={rim.color} />
				</g>
			)}
			<Body look={look} pose={pose} c0={c} cs={cs} />
		</g>
	);
};

/* ---------- образы героев ---------- */
export const TOM: Look = {skin: '#e9c6a6', hair: '#2a1c14', hairStyle: 'slick', top: '#5d6673', shirt: '#f1eee6', tie: '#2a3346', bottom: '#4a525e', shoes: '#1a1412'};
export const TOM_HAT: Look = {...TOM, hat: '#3a3f48'};
export const TOM_LINEN: Look = {skin: '#e9c6a6', hair: '#2a1c14', hairStyle: 'slick', top: '#bcd6ea', bottom: '#e8dcc4', shoes: '#8a5a36', rolled: true};
export const DICKIE: Look = {skin: '#d9a179', hair: '#b88a52', hairStyle: 'wavy', top: '#f5f0e4', bottom: '#e9ddc5', shoes: '#8a5a36', rolled: true};
export const MARGE: Look = {kind: 'woman', skin: '#ebbf9c', hair: '#8a5530', hairStyle: 'bob', top: '#2f86b0', bottom: '#2f86b0', shoes: '#c9a27a'};
