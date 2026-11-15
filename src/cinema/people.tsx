// Шарнирные силуэты людей. Фигура рисуется в системе 100 единиц роста, ноги в (0,0).
// Углы конечностей в градусах: 0 — вниз, 90 — вперёд (по направлению взгляда), 180 — вверх.
import React from 'react';

export type Pose = {
	thighL?: number;
	thighR?: number;
	kneeL?: number; // сгиб колена (назад), градусы
	kneeR?: number;
	armL?: number;
	armR?: number;
	elbowL?: number; // сгиб локтя (вперёд)
	elbowR?: number;
	lean?: number; // наклон корпуса вперёд
	head?: number; // наклон головы
	bob?: number; // вертикальное смещение тела
};

type Kind = 'man' | 'boy' | 'woman';

const rad = (d: number) => (d * Math.PI) / 180;
const limb = (x: number, y: number, ang: number, len: number) => [x + Math.sin(rad(ang)) * len, y + Math.cos(rad(ang)) * len] as const;

const Body: React.FC<{
	kind: Kind;
	pose: Pose;
	color: string;
	hat?: boolean;
	axe?: 'hands' | 'shoulder' | null;
	bundle?: boolean;
	far?: boolean; // дальняя сторона (руки/ноги за корпусом)
}> = ({kind, pose, color, hat = true, axe = null, bundle = false}) => {
	const boy = kind === 'boy';
	const woman = kind === 'woman';
	const lean = pose.lean ?? 0;
	const bob = pose.bob ?? 0;
	const hipY = -48 + bob;
	const thigh = boy ? 21 : 24;
	const shin = boy ? 20 : 24;
	const shY = (boy ? -76 : -80) + bob;
	const shoulder = limb(0, hipY, 180 - lean, hipY - shY); // плечи над бёдрами с наклоном вперёд
	const headR = boy ? 8.5 : 6.6;
	const neck = limb(shoulder[0], shoulder[1], 180 - lean - (pose.head ?? 0), 4 + headR);
	const legW = boy ? 6 : 7;
	const armW = boy ? 4.6 : 5.6;

	const leg = (t: number, k: number) => {
		const knee = limb(0, hipY, t, thigh);
		const foot = limb(knee[0], knee[1], t - k, shin);
		return (
			<g>
				<path d={`M0,${hipY} L${knee[0]},${knee[1]} L${foot[0]},${foot[1]}`} stroke={color} strokeWidth={legW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
				<ellipse cx={foot[0] + 3} cy={foot[1] - 1} rx={6} ry={3} fill={color}  />
			</g>
		);
	};
	const arm = (a: number, e: number) => {
		const el = limb(shoulder[0], shoulder[1], a, boy ? 15 : 18);
		const hand = limb(el[0], el[1], a + e, boy ? 14 : 17);
		return {el, hand, ang: a + e};
	};
	const aL = arm(pose.armL ?? 8, pose.elbowL ?? 10);
	const aR = arm(pose.armR ?? -6, pose.elbowR ?? 12);
	const armPath = (a: ReturnType<typeof arm>) => (
		<path d={`M${shoulder[0]},${shoulder[1]} L${a.el[0]},${a.el[1]} L${a.hand[0]},${a.hand[1]}`} stroke={color} strokeWidth={armW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
	);
	// топор в руках: продолжение предплечья правой руки
	const axeEl = (() => {
		if (axe === 'hands') {
			const end = limb(aL.hand[0], aL.hand[1], aL.ang, 30);
			const bl = limb(end[0], end[1], aL.ang + 90, 6);
			const br = limb(end[0], end[1], aL.ang - 90, 9);
			const tip = limb(end[0], end[1], aL.ang, 5);
			return (
				<g>
					<line x1={aL.hand[0]} y1={aL.hand[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth={2.6} strokeLinecap="round" />
					<path d={`M${bl[0]},${bl[1]} L${tip[0]},${tip[1]} L${br[0]},${br[1]} Z`} fill={color} />
				</g>
			);
		}
		if (axe === 'shoulder') {
			const a = shoulder;
			return (
				<g>
					<line x1={a[0] - 16} y1={a[1] + 8} x2={a[0] + 20} y2={a[1] - 10} stroke={color} strokeWidth={2.6} strokeLinecap="round" />
					<path d={`M${a[0] - 16},${a[1] + 8} l-4,-9 l-6,4 l4,11 Z`} fill={color} />
				</g>
			);
		}
		return null;
	})();

	const torsoTopW = boy ? 9 : 11;
	const coat = woman
		? `M${shoulder[0] - 9},${shoulder[1]} L${shoulder[0] + 9},${shoulder[1]} L${7},${hipY - 4} L${16},${0} L${-15},${0} L${-7},${hipY - 4} Z`
		: `M${shoulder[0] - torsoTopW},${shoulder[1] + 5} Q${shoulder[0] - torsoTopW},${shoulder[1]} ${shoulder[0] - torsoTopW + 5},${shoulder[1] - 1} L${shoulder[0] + torsoTopW - 5},${shoulder[1] - 1} Q${shoulder[0] + torsoTopW},${shoulder[1]} ${shoulder[0] + torsoTopW},${shoulder[1] + 5} L${8},${hipY - 4} L${12},${hipY + 10} L${-12},${hipY + 10} L${-8},${hipY - 4} Z`;
	return (
		<g>
			{!woman && leg(pose.thighR ?? 0, pose.kneeR ?? 0)}
			{armPath(aR)}
			{!woman && leg(pose.thighL ?? 0, pose.kneeL ?? 0)}
			<path d={coat} fill={color} />
			{/* голова */}
			<circle cx={neck[0]} cy={neck[1]} r={headR} fill={color} />
			{woman && <circle cx={neck[0] - 6} cy={neck[1] - 2} r={4.2} fill={color} />}
			{hat && !woman && !boy && (
				<g>
					<ellipse cx={neck[0]} cy={neck[1] - headR * 0.55} rx={12} ry={2.4} fill={color} />
					<rect x={neck[0] - 6.5} y={neck[1] - headR - 6} width={13} height={8} rx={3} fill={color} />
				</g>
			)}
			{boy && hat && <path d={`M${neck[0] - 9},${neck[1] - 3} Q${neck[0]},${neck[1] - 15} ${neck[0] + 9},${neck[1] - 3} L${neck[0] + 14},${neck[1] - 2} Z`} fill={color} />}
			{armPath(aL)}
			{axeEl}
			{bundle && (
				<g>
					<circle cx={aL.hand[0] + 2} cy={aL.hand[1] + 7} r={8} fill={color} />
					<path d={`M${aL.hand[0] - 3},${aL.hand[1] + 1} l3,-4 l3,4 Z`} fill={color} />
				</g>
			)}
		</g>
	);
};

export const Figure: React.FC<{
	x: number;
	y: number;
	h: number;
	facing?: 1 | -1;
	kind?: Kind;
	pose?: Pose;
	color?: string;
	/** Контровой свет: цвет и сторона (-1 слева, 1 справа) */
	rim?: {color: string; side: 1 | -1; strength?: number};
	hat?: boolean;
	axe?: 'hands' | 'shoulder' | null;
	bundle?: boolean;
}> = ({x, y, h, facing = 1, kind = 'man', pose = {}, color = '#07080b', rim, hat, axe, bundle}) => {
	const k = h / 100;
	const props = {kind, pose, hat, axe, bundle};
	return (
		<g transform={`translate(${x} ${y}) scale(${facing * k} ${k})`}>
			{rim && (
				<g transform={`translate(${rim.side * facing * 1.4} -0.6)`} opacity={rim.strength ?? 0.85}>
					<Body {...props} color={rim.color} />
				</g>
			)}
			<Body {...props} color={color} />
		</g>
	);
};

/** Цикл ходьбы: phase в радианах */
export const walkPose = (phase: number, amp = 1): Pose => ({
	thighL: 24 * Math.sin(phase) * amp,
	thighR: -24 * Math.sin(phase) * amp,
	kneeL: Math.max(0, 34 * Math.sin(phase - 1.2)) * amp,
	kneeR: Math.max(0, 34 * Math.sin(phase + Math.PI - 1.2)) * amp,
	armL: -20 * Math.sin(phase) * amp,
	armR: 20 * Math.sin(phase) * amp,
	elbowL: 15,
	elbowR: 15,
	lean: 4,
	bob: -1.6 * Math.abs(Math.cos(phase)) * amp,
});

/** Поза сидя (на ступеньке/бревне) */
export const sitPose = (extra: Pose = {}): Pose => ({
	thighL: 85,
	thighR: 80,
	kneeL: 95,
	kneeR: 85,
	armL: 40,
	armR: 30,
	elbowL: 30,
	elbowR: 40,
	lean: 8,
	bob: 22,
	...extra,
});

/** Рубка: t ∈ [0,1) цикла; удар в t=0.7. Возвращает позу и угол топора */
export const chopPose = (t: number): Pose => {
	let a: number;
	if (t < 0.55) a = 95 + (205 - 95) * Math.sin(((t / 0.55) * Math.PI) / 2);
	else if (t < 0.7) a = 205 - (205 - 85) * ((t - 0.55) / 0.15) ** 1.6;
	else if (t < 0.85) a = 85;
	else a = 85 + 10 * ((t - 0.85) / 0.15);
	const lean = t < 0.55 ? -4 : t < 0.75 ? 14 : 10;
	return {armL: a, armR: a - 8, elbowL: 8, elbowR: 14, thighL: 18, thighR: -14, kneeL: 8, kneeR: 4, lean, bob: t > 0.6 && t < 0.85 ? 1.5 : 0};
};
