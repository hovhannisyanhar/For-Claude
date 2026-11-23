// «Старикам тут не место» (No Country for Old Men, 2007) — 8 сцен в 2D-векторе. Имя плана = set сцены в videos/no-country-for-old-men/script.json.
// Западный Техас, 1980: выжженная охра, красные столовые горы, креозот и юкка, колючая проволока на столбах, пикапы 70-х,
// алюминиевый трейлер, ночная заправка и мотель под натриевым светом.
import { run, person, setProportions, V, R, grad, glow, silFilter, rnd, reseed, shade, lerp, ease, clamp, wave, def } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// Мосс: усы, тёмные волосы, голубая рубашка на кнопках, джинсы, сапоги
const MOSS = { shirt: '#7f9bb4', pants: '#3e5878', skin: '#c98e64', hair: '#2a1c14', iris: '#3a2414', beard: false, moustache: true, frown: 0.35, snaps: true, belt: true, boots: true };
// Чигур: каре с чёлкой, тёмная джинсовая куртка, коричневая рубашка, бледная кожа
const CHIGURH = { shirt: '#2a3342', pants: '#1a1d24', skin: '#d8b49a', hair: '#1a1410', iris: '#120a06', beard: false, frown: 0.25, bob: true, denim: true, boots: true };
// Шериф Белл: светлая шляпа, бежевая рубашка, звезда, седые виски
const BELL = { shirt: '#b8a27a', pants: '#5a4a38', skin: '#d4a07c', hair: '#9a948a', iris: '#4a3a2a', beard: false, frown: 0.45, hat: '#d8c8a2', star: true, belt: true, boots: true, grey: true };

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const fade = (t, a, d = 0.35) => ease(clamp((t - a) / d));

// ---------- персонажи ----------
function geo(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const pose = o.pose || 'stand';
  const legH = (pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  return { hs, hr, top, ty, headY: top - hr * 0.8 + (o.nod || 0) * 6 * hs, sl: p.slim ?? 1, pose, sy: top + 40 * s };
}
// ковбойская шляпа: широкие поля с загнутыми краями, тулья с заломом, лента
function cowboyHat(x, hy, hr, c) {
  return `<path d="M${x - hr * 0.82},${hy - hr * 0.66} Q${x - hr * 0.95},${hy - hr * 1.62} ${x - hr * 0.3},${hy - hr * 1.66} Q${x},${hy - hr * 1.46} ${x + hr * 0.3},${hy - hr * 1.66} Q${x + hr * 0.95},${hy - hr * 1.62} ${x + hr * 0.82},${hy - hr * 0.66} Z" fill="${V(c, 0.2, 0.3)}"/>
  <path d="M${x - hr * 0.84},${hy - hr * 0.84} Q${x},${hy - hr * 0.7} ${x + hr * 0.84},${hy - hr * 0.84} L${x + hr * 0.83},${hy - hr * 0.68} Q${x},${hy - hr * 0.56} ${x - hr * 0.83},${hy - hr * 0.68} Z" fill="${shade(c, -0.5)}"/>
  <path d="M${x - hr * 1.75},${hy - hr * 0.88} Q${x - hr * 1.55},${hy - hr * 0.55} ${x - hr * 0.9},${hy - hr * 0.62} Q${x},${hy - hr * 0.42} ${x + hr * 0.9},${hy - hr * 0.62} Q${x + hr * 1.55},${hy - hr * 0.55} ${x + hr * 1.75},${hy - hr * 0.88} Q${x + hr * 1.6},${hy - hr * 0.3} ${x},${hy - hr * 0.28} Q${x - hr * 1.6},${hy - hr * 0.3} ${x - hr * 1.75},${hy - hr * 0.88} Z" fill="${V(c, 0.15, 0.35)}"/>
  <path d="M${x - hr * 1.2},${hy - hr * 0.45} Q${x},${hy - hr * 0.3} ${x + hr * 1.2},${hy - hr * 0.45}" stroke="${shade(c, -0.35)}" stroke-width="${hr * 0.05}" fill="none" opacity="0.6"/>`;
}
function dress(x, y, s, o) {
  const { hr, top, ty, headY, pose, hs } = geo(x, y, s, o);
  const sh = o.shirt, dk = shade(sh, -0.3);
  let b = '', front = '';
  const stand = pose === 'stand';
  if (o.boots && stand) b += [-1, 1].map((sd) => `<path d="M${x + sd * 36 * s - 30 * s},${y - 120 * s} L${x + sd * 36 * s + 30 * s},${y - 120 * s} L${x + sd * 36 * s + 32 * s},${y - 6 * s} L${x + sd * 36 * s - 32 * s},${y - 6 * s} Z" fill="${V('#6a4428', 0.25, 0.3)}"/><path d="M${x + sd * 36 * s - 30 * s},${y - 120 * s} q${30 * s},${14 * s} ${60 * s},0" stroke="#3a2414" stroke-width="${4 * s}" fill="none"/><path d="M${x + sd * 36 * s - 12 * s},${y - 100 * s} q${12 * s},${30 * s} 0,${60 * s} M${x + sd * 36 * s + 12 * s},${y - 100 * s} q${-12 * s},${30 * s} 0,${60 * s}" stroke="#a87a4a" stroke-width="${3 * s}" fill="none"/>`).join('');
  if (o.snaps) {
    // рубашка на кнопках: кокетка, карманы с клапанами, перламутровые кнопки
    b += `<path d="M${x - 100 * s},${top + 40 * s} Q${x - 50 * s},${top + 70 * s} ${x},${top + 46 * s} Q${x + 50 * s},${top + 70 * s} ${x + 100 * s},${top + 40 * s}" stroke="${dk}" stroke-width="${3 * s}" fill="none"/>`;
    b += `<path d="M${x - 40 * s},${top - 6 * s} L${x},${top + 34 * s} L${x + 40 * s},${top - 6 * s} L${x + 30 * s},${top + 24 * s} L${x},${top + 46 * s} L${x - 30 * s},${top + 24 * s} Z" fill="${shade(sh, 0.12)}"/><path d="M${x - 12 * s},${top + 4 * s} L${x},${top + 34 * s} L${x + 12 * s},${top + 4 * s} Z" fill="${shade(o.skin, -0.08)}"/>`;
    b += `<path d="M${x},${top + 46 * s} L${x},${ty - 40 * s}" stroke="${dk}" stroke-width="${3 * s}"/>`;
    for (let i = 0; i < 5; i++) b += `<circle cx="${x + 8 * s}" cy="${top + (64 + i * 30) * s}" r="${5 * s}" fill="#eef2f2"/>`;
    [-1, 1].forEach((sd) => { const cx = x + sd * 52 * s, cy = top + 80 * s; b += `<path d="M${cx - 26 * s},${cy} L${cx + 26 * s},${cy} L${cx + 22 * s},${cy + 20 * s} L${cx},${cy + 28 * s} L${cx - 22 * s},${cy + 20 * s} Z" fill="${V(sh, 0.2, 0.15)}" stroke="${dk}" stroke-width="${2.5 * s}"/><circle cx="${cx}" cy="${cy + 18 * s}" r="${4 * s}" fill="#eef2f2"/>`; });
  }
  if (o.denim) {
    // джинсовая куртка поверх коричневой рубашки: воротник, двойная строчка, карманы с клапанами, медные пуговицы
    b += `<path d="M${x - 34 * s},${top - 4 * s} L${x},${top + 90 * s} L${x + 34 * s},${top - 4 * s} Z" fill="${V('#6a4426', 0.15, 0.25)}"/>`;
    b += `<path d="M${x - 60 * s},${top - 10 * s} L${x - 14 * s},${top + 70 * s} L${x - 40 * s},${top + 82 * s} L${x - 92 * s},${top + 20 * s} Z M${x + 60 * s},${top - 10 * s} L${x + 14 * s},${top + 70 * s} L${x + 40 * s},${top + 82 * s} L${x + 92 * s},${top + 20 * s} Z" fill="${V(shade(sh, 0.08), 0.2, 0.2)}"/>`;
    b += `<path d="M${x - 12 * s},${top + 80 * s} L${x - 12 * s},${ty + 10 * s} M${x + 12 * s},${top + 80 * s} L${x + 12 * s},${ty + 10 * s}" stroke="#b07a3a" stroke-width="${2 * s}" stroke-dasharray="${6 * s} ${5 * s}"/>`;
    for (let i = 0; i < 5; i++) b += `<circle cx="${x - 22 * s}" cy="${top + (100 + i * 34) * s}" r="${5 * s}" fill="#b8884a"/>`;
    [-1, 1].forEach((sd) => { const cx = x + sd * 56 * s, cy = top + 92 * s; b += `<path d="M${cx - 28 * s},${cy} L${cx + 28 * s},${cy} L${cx + 28 * s},${cy + 24 * s} L${cx},${cy + 34 * s} L${cx - 28 * s},${cy + 24 * s} Z" fill="${V(sh, 0.18, 0.2)}" stroke="#b07a3a" stroke-width="${2 * s}" stroke-dasharray="${5 * s} ${4 * s}"/><circle cx="${cx}" cy="${cy + 22 * s}" r="${4.5 * s}" fill="#b8884a"/>`; });
    b += `<rect x="${x - 100 * s}" y="${ty - 30 * s}" width="${200 * s}" height="${34 * s}" fill="${V(shade(sh, 0.05), 0.15, 0.2)}"/>`;
  }
  if (o.star) {
    const cx = x - 52 * s, cy = top + 96 * s, r1 = 26 * s, r2 = 11 * s;
    let p = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? r2 : r1; p += `${i ? 'L' : 'M'}${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`; }
    b += `<path d="${p}Z" fill="${V('#e0c070', 0.3, 0.25)}" stroke="#8a6a2a" stroke-width="${2 * s}"/><circle cx="${cx}" cy="${cy}" r="${7 * s}" fill="#c8a24a"/>`;
    b += [-1, 1].map((sd) => `<rect x="${x + sd * 52 * s - 24 * s}" y="${top + 120 * s}" width="${48 * s}" height="${6 * s}" fill="${dk}" opacity="0.6"/>`).join('');
    b += `<path d="M${x},${top + 20 * s} L${x},${ty - 40 * s}" stroke="${dk}" stroke-width="${3 * s}"/>`;
  }
  if (o.belt) b += `<rect x="${x - 98 * s}" y="${ty - 40 * s}" width="${196 * s}" height="${20 * s}" fill="${V('#4a2e1a', 0.2, 0.25)}"/><rect x="${x - 22 * s}" y="${ty - 46 * s}" width="${44 * s}" height="${32 * s}" rx="${8 * s}" fill="${V('#d8c48a', 0.35, 0.25)}" stroke="#7a5a2a" stroke-width="${2 * s}"/>`;
  if (o.bob) {
    // каре: волосы до челюсти, прямая чёлка над бровями
    front += `<path d="M${x - hr * 1.02},${headY + hr * 0.5} Q${x - hr * 1.06},${headY - hr * 1.16} ${x},${headY - hr * 1.14} Q${x + hr * 1.06},${headY - hr * 1.12} ${x + hr * 1.02},${headY + hr * 0.5} L${x + hr * 0.8},${headY + hr * 0.52} L${x + hr * 0.8},${headY - hr * 0.36} L${x - hr * 0.8},${headY - hr * 0.36} L${x - hr * 0.8},${headY + hr * 0.52} Z" fill="${V(o.hair, 0.22, 0.2)}"/>`;
    front += `<path d="M${x - hr * 0.6},${headY - hr * 0.9} Q${x},${headY - hr * 1.02} ${x + hr * 0.5},${headY - hr * 0.88}" stroke="#fff" stroke-width="${hr * 0.05}" fill="none" opacity="0.18"/>`;
  }
  if (o.grey) front += [-1, 1].map((sd) => `<path d="M${x + sd * hr * 0.98},${headY - hr * 0.5} L${x + sd * hr * 0.9},${headY + hr * 0.15}" stroke="#d8d4cc" stroke-width="${hr * 0.12}" stroke-linecap="round"/>`).join('') + `<path d="M${x - hr * 0.5},${headY + hr * 0.28} q${hr * 0.1},${hr * 0.08} ${hr * 0.22},0 M${x + hr * 0.28},${headY + hr * 0.28} q${hr * 0.1},${hr * 0.08} ${hr * 0.22},0" stroke="${shade(o.skin, -0.3)}" stroke-width="${hr * 0.025}" fill="none"/>`;
  if (o.hat) front += cowboyHat(x, headY, hr, o.hat);
  if (o.sweat) front += [[-0.62, -0.3], [0.7, -0.15], [0.45, 0.2]].map(([dx, dy], i) => { const f = (o.sweat + i * 0.33) % 1; return `<path d="M${x + hr * dx},${headY + hr * dy + f * hr * 0.4} q${hr * 0.05},${hr * 0.1} 0,${hr * 0.14} q${-hr * 0.05},${-hr * 0.04} 0,${-hr * 0.14} Z" fill="#e8f4ff" opacity="${0.8 * (1 - f)}"/>`; }).join('');
  return { b, front };
}
function man(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b, longHair: false });
  if (!front) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}${o.sil ? ` filter="${o.sil}"` : ''}>${front}</g>`;
}
// положение кисти правой/левой руки при arms 'down' (с учётом slim)
const handPos = (x, y, s, side, o = {}) => { const g = geo(x, y, s, o); return [x + side * 128 * s * g.sl, g.sy + 250 * s]; };

// ---------- предметы ----------
function satchel(x, y, w, o = {}) {
  const h = w * 0.72;
  let g = `<g filter="url(#soft)"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>`;
  g += `<path d="M${x - w * 0.18},${y - h * 0.5} Q${x - w * 0.18},${y - h * 0.82} ${x},${y - h * 0.82} Q${x + w * 0.18},${y - h * 0.82} ${x + w * 0.18},${y - h * 0.5}" stroke="#3a2010" stroke-width="${w * 0.06}" fill="none"/>`;
  g += `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${w * 0.08}" fill="${V('#7a4a24', 0.25, 0.35)}"/>`;
  g += `<path d="M${x - w / 2},${y - h * 0.18} L${x + w / 2},${y - h * 0.18}" stroke="#4a2a14" stroke-width="${w * 0.02}"/>`;
  g += `<rect x="${x - w / 2 + w * 0.04}" y="${y - h / 2 + w * 0.04}" width="${w - w * 0.08}" height="${h - w * 0.08}" rx="${w * 0.05}" fill="none" stroke="#c89a5a" stroke-width="${w * 0.01}" stroke-dasharray="${w * 0.03} ${w * 0.02}" opacity="0.7"/>`;
  g += [-1, 1].map((sd) => `<rect x="${x + sd * w * 0.3 - w * 0.05}" y="${y - h * 0.26}" width="${w * 0.1}" height="${w * 0.08}" rx="${w * 0.015}" fill="${V('#e0c070', 0.3, 0.3)}"/>`).join('');
  g += `</g>`;
  return g;
}
function bundle(x, y, w, rot = 0) {
  const h = w * 0.45;
  return `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="4" fill="${V('#9ab08a', 0.2, 0.25)}" stroke="#4a5a40" stroke-width="2"/><rect x="${x - w * 0.4}" y="${y - h * 0.32}" width="${w * 0.8}" height="${h * 0.64}" rx="3" fill="none" stroke="#5a6e50" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="${h * 0.26}" ry="${h * 0.3}" fill="#7a9070"/><rect x="${x - w * 0.08}" y="${y - h / 2 - 1}" width="${w * 0.16}" height="${h + 2}" fill="#e8dcb8"/><text x="${x - w * 0.36}" y="${y + h * 0.12}" font-size="${h * 0.34}" font-family="serif" fill="#3a4a30">100</text></g>`;
}
// пикап 70-х сбоку: капот, кабина, кузов, хром, фары; holes — пулевые отверстия
function pickup(x, y, s, o = {}) {
  const c = o.c || '#8a3a2a', dk = shade(c, -0.35);
  const sx = o.flip ? -1 : 1;
  let g = `<g transform="translate(${x} ${y}) scale(${sx * s} ${s})" filter="url(#soft)">`;
  g += `<ellipse cx="0" cy="8" rx="300" ry="22" fill="#000" opacity="0.3"/>`;
  g += `<path d="M-290,-40 L-290,-120 L-60,-120 L-30,-200 L110,-200 L150,-120 L290,-112 L300,-40 Z" fill="${V(c, 0.2, 0.3)}"/>`;
  g += `<path d="M-20,-192 L100,-192 L132,-124 L-44,-124 Z" fill="${grad([[0, '#c8d8e0'], [1, '#6a7e88']])}"/><rect x="40" y="-192" width="8" height="70" fill="${dk}"/>`;
  g += `<path d="M-290,-120 L-60,-120" stroke="${shade(c, 0.25)}" stroke-width="6"/><rect x="-290" y="-80" width="590" height="10" fill="${shade(c, 0.3)}" opacity="0.5"/>`;
  g += `<rect x="-306" y="-52" width="24" height="26" rx="4" fill="#c8ccd0"/><rect x="286" y="-56" width="26" height="30" rx="4" fill="#c8ccd0"/><rect x="284" y="-108" width="14" height="40" fill="#d8d8c8"/><circle cx="292" cy="-96" r="9" fill="#fff8d8"/>`;
  g += `<path d="M-60,-120 L-60,-40 M150,-120 L150,-40" stroke="${dk}" stroke-width="4"/><rect x="100" y="-108" width="30" height="8" rx="3" fill="#c8ccd0"/>`;
  [-180, 190].forEach((wx) => { g += `<path d="M${wx - 80},-40 A80,80 0 0 1 ${wx + 80},-40 Z" fill="#1a1612"/><circle cx="${wx}" cy="-30" r="62" fill="#18181a"/><circle cx="${wx}" cy="-30" r="34" fill="${V('#b8bcc0', 0.3, 0.3)}"/><circle cx="${wx}" cy="-30" r="10" fill="#6a6e72"/>`; });
  if (o.holes) { reseed(o.holes); for (let i = 0; i < 14; i++) g += `<circle cx="${-260 + rnd() * 520}" cy="${-190 + rnd() * 140}" r="${4 + rnd() * 3}" fill="#120c08"/>`; g += `<path d="M10,-180 l30,40 l-20,10 l40,30 M60,-160 l-30,20" stroke="#f0f4f4" stroke-width="2" fill="none" opacity="0.8"/>`; }
  if (o.door) g += `<path d="M-60,-120 L-130,-150 L-130,-50 L-60,-40 Z" fill="${V(c, 0.1, 0.35)}"/>`;
  g += `</g>`;
  return g;
}
// алюминиевый трейлер-«дом» с полосой, окнами, ступеньками и антенной
function trailer(x, y, w, h, lit = 0) {
  let g = `<g filter="url(#soft)"><rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="${h * 0.18}" fill="${V('#c8c4b8', 0.2, 0.35)}"/>`;
  for (let i = 1; i < 14; i++) g += `<rect x="${x + (i * w) / 14}" y="${y - h + 6}" width="2" height="${h - 12}" fill="#9a968a" opacity="0.5"/>`;
  g += `<rect x="${x}" y="${y - h * 0.5}" width="${w}" height="${h * 0.12}" fill="#3a7a8a"/>`;
  [0.15, 0.6, 0.8].forEach((k) => { g += `<rect x="${x + w * k}" y="${y - h * 0.82}" width="${w * 0.11}" height="${h * 0.26}" rx="4" fill="${lit ? '#ffcf7a' : '#5a6a74'}" opacity="${lit ? 0.9 : 1}"/>`; });
  g += `<rect x="${x + w * 0.36}" y="${y - h * 0.86}" width="${w * 0.1}" height="${h * 0.82}" rx="4" fill="#8a867a"/><rect x="${x + w * 0.33}" y="${y - 6}" width="${w * 0.16}" height="10" fill="#5a564a"/><rect x="${x + w * 0.35}" y="${y + 4}" width="${w * 0.12}" height="10" fill="#4a463a"/>`;
  g += `<path d="M${x + w * 0.8},${y - h} L${x + w * 0.8},${y - h - 70} M${x + w * 0.72},${y - h - 60} L${x + w * 0.88},${y - h - 60} M${x + w * 0.74},${y - h - 44} L${x + w * 0.86},${y - h - 44}" stroke="#3a3a3a" stroke-width="3"/>`;
  g += `</g>`;
  if (lit) [0.15, 0.6, 0.8].forEach((k) => { g += glow(x + w * k + w * 0.055, y - h * 0.7, 80, '#ffb860', 0.35); });
  return g;
}
// столовые горы на горизонте
function mesas(y, c, op = 1, sd = 1) {
  reseed(sd);
  let p = `M-20,${y}`;
  let x = -20;
  while (x < 1100) {
    const w = 120 + rnd() * 240, h = 40 + rnd() * 140, flat = rnd() < 0.7;
    if (flat) p += ` L${x + w * 0.15},${y - h} L${x + w * 0.85},${y - h} L${x + w},${y}`;
    else p += ` Q${x + w * 0.5},${y - h * 0.8} ${x + w},${y}`;
    x += w + rnd() * 60; p += ` L${x},${y}`;
  }
  return `<path d="${p} L1100,${y + 40} L-20,${y + 40} Z" fill="${c}" opacity="${op}"/>`;
}
function creosote(x, y, s, c = '#5a6a3a') {
  let g = '';
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28; g += `<path d="M${x},${y} Q${x + Math.cos(a) * 30 * s},${y + Math.sin(a) * 40 * s} ${x + Math.cos(a) * 70 * s},${y + Math.sin(a) * 80 * s}" stroke="#4a3a2a" stroke-width="${2.5 * s}" fill="none"/><ellipse cx="${x + Math.cos(a) * 66 * s}" cy="${y + Math.sin(a) * 76 * s}" rx="${22 * s}" ry="${14 * s}" fill="${shade(c, (i % 3) * 0.08)}"/>`; }
  return g;
}
function yucca(x, y, s) {
  let g = `<rect x="${x - 5 * s}" y="${y - 70 * s}" width="${10 * s}" height="${70 * s}" fill="#5a4a32"/>`;
  for (let i = 0; i < 13; i++) { const a = -Math.PI / 2 + (i - 6) * 0.22; g += `<path d="M${x},${y - 70 * s} L${x + Math.cos(a) * 80 * s},${y - 70 * s + Math.sin(a) * 80 * s}" stroke="${i % 2 ? '#6a7a4a' : '#7a8a52'}" stroke-width="${6 * s}" stroke-linecap="round"/>`; }
  return g;
}
function scrub(y0, y1, n, sd = 4, c = '#5a6a3a') { reseed(sd); let g = ''; for (let i = 0; i < n; i++) { const y = y0 + rnd() * (y1 - y0), k = (y - y0) / (y1 - y0); g += creosote(rnd() * 1080, y, 0.3 + k * 1.1, c); } return g; }
function stones(y0, y1, n, sd = 8, c = '#8a6a4a') { reseed(sd); let g = ''; for (let i = 0; i < n; i++) { const y = y0 + rnd() * (y1 - y0), k = 0.3 + ((y - y0) / (y1 - y0)) * 1.4; g += `<ellipse cx="${rnd() * 1080}" cy="${y}" rx="${(6 + rnd() * 14) * k}" ry="${(3 + rnd() * 6) * k}" fill="${shade(c, rnd() * 0.2 - 0.1)}"/>`; } return g; }
// столбы с колючей проволокой
function fence(pts, c = '#3a2a1c') {
  let g = '';
  pts.forEach(([x, y, h]) => { g += `<rect x="${x - h * 0.025}" y="${y - h}" width="${h * 0.05}" height="${h}" fill="${c}"/>`; });
  for (let k = 0; k < 3; k++) { let d = ''; pts.forEach(([x, y, h], i) => { d += `${i ? 'L' : 'M'}${x},${y - h * (0.35 + k * 0.25)}`; }); g += `<path d="${d}" stroke="${c}" stroke-width="1.6" fill="none"/>`; }
  return g;
}
function poles(pts, c = '#2a2018') {
  let g = '';
  pts.forEach(([x, y, h]) => { g += `<rect x="${x - h * 0.02}" y="${y - h}" width="${h * 0.04}" height="${h}" fill="${c}"/><rect x="${x - h * 0.16}" y="${y - h * 0.92}" width="${h * 0.32}" height="${h * 0.025}" fill="${c}"/>`; });
  for (const dx of [-0.13, 0.13]) { let d = ''; pts.forEach(([x, y, h], i) => { const px = x + dx * h, py = y - h * 0.92; if (!i) d += `M${px},${py}`; else { const [x0, y0, h0] = pts[i - 1]; d += ` Q${(x0 + dx * h0 + px) / 2},${(y0 - h0 * 0.92 + py) / 2 + 20} ${px},${py}`; } }); g += `<path d="${d}" stroke="${c}" stroke-width="1.5" fill="none"/>`; }
  return g;
}
function antelope(x, y, s, t = 0, ph = 0, c = '#b07a44') {
  const hb = wave(t, 0.5, ph) * 3 * s;
  return `<g transform="translate(${x} ${y + hb}) scale(${s})"><ellipse cx="0" cy="-60" rx="46" ry="22" fill="${c}"/><ellipse cx="0" cy="-50" rx="38" ry="12" fill="#f0e8d8"/><path d="M30,-70 L52,-110 L62,-106 L44,-66 Z" fill="${c}"/><ellipse cx="62" cy="-112" rx="14" ry="9" fill="${c}"/><path d="M58,-120 l-4,-22 M64,-120 l4,-20" stroke="#1a1410" stroke-width="4"/>${[-30, -18, 22, 34].map((lx) => `<rect x="${lx}" y="-50" width="5" height="50" fill="${shade(c, -0.3)}"/>`).join('')}<ellipse cx="-44" cy="-62" rx="8" ry="10" fill="#f0e8d8"/></g>`;
}
function vulture(x, y, s, t, ph = 0) {
  const f = wave(t, 0.8, ph) * 12;
  return `<path d="M${x - 60 * s},${y + f * s} Q${x - 28 * s},${y - 18 * s} ${x},${y} Q${x + 28 * s},${y - 18 * s} ${x + 60 * s},${y + f * s} Q${x + 30 * s},${y - 6 * s} ${x},${y + 8 * s} Q${x - 30 * s},${y - 6 * s} ${x - 60 * s},${y + f * s} Z" fill="#1a1410" opacity="0.85"/>`;
}
function dog(x, y, s, c = '#8a6a44') {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><ellipse cx="0" cy="-60" rx="60" ry="26" fill="${V(c, 0.2, 0.3)}"/><path d="M44,-72 L74,-104 L96,-96 L84,-66 Z" fill="${c}"/><ellipse cx="94" cy="-98" rx="22" ry="15" fill="${c}"/><path d="M84,-112 l8,-18 l8,16 Z" fill="${shade(c, -0.3)}"/><circle cx="100" cy="-102" r="3" fill="#120a06"/>${[-40, -26, 30, 44].map((lx, i) => `<rect x="${lx}" y="-44" width="9" height="${i === 2 ? 30 : 44}" rx="4" fill="${shade(c, -0.2)}"/>`).join('')}<path d="M-58,-66 Q-84,-84 -92,-62" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round"/></g>`;
}
// тело на земле — тёмный силуэт без подробностей
function fallen(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity="0.92"><ellipse cx="0" cy="0" rx="90" ry="20" fill="#2a2018"/><circle cx="-100" cy="-6" r="20" fill="#2a2018"/><path d="M-20,-8 L40,-40 M30,6 L90,24" stroke="#2a2018" stroke-width="16" stroke-linecap="round"/><ellipse cx="-110" cy="10" rx="34" ry="8" fill="#3a2a18" opacity="0.6"/></g>`;
}
function mesquite(x, y, s) {
  let g = `<path d="M${x - 10 * s},${y} Q${x - 20 * s},${y - 120 * s} ${x - 60 * s},${y - 200 * s} M${x},${y} Q${x + 10 * s},${y - 140 * s} ${x + 70 * s},${y - 230 * s} M${x},${y - 80 * s} Q${x + 40 * s},${y - 120 * s} ${x + 110 * s},${y - 150 * s}" stroke="${V('#4a3424', 0.1, 0.3)}" stroke-width="${18 * s}" fill="none" stroke-linecap="round"/>`;
  reseed(17);
  for (let i = 0; i < 22; i++) g += `<ellipse cx="${x - 120 * s + rnd() * 260 * s}" cy="${y - 170 * s - rnd() * 110 * s}" rx="${(40 + rnd() * 40) * s}" ry="${(18 + rnd() * 14) * s}" fill="${shade('#6a7a40', rnd() * 0.2 - 0.12)}"/>`;
  return g;
}
function heat(t, y, h, op = 0.25) {
  let g = '';
  for (let i = 0; i < 6; i++) g += `<path d="M-20,${y + i * (h / 6) + wave(t, 1.3, i) * 4} Q270,${y + i * (h / 6) - 6} 540,${y + i * (h / 6) + 4} T1100,${y + i * (h / 6)}" stroke="#fff6e0" stroke-width="3" fill="none" opacity="${op * (0.5 + 0.5 * wave(t, 0.9, i))}"/>`;
  return `<g filter="url(#blur4)">${g}</g>`;
}
function coin(x, y, r, spin = 0, op = 1) {
  const sx = Math.max(0.06, Math.abs(Math.cos(spin)));
  const face = Math.cos(spin) >= 0;
  return `<g transform="translate(${x} ${y}) scale(${sx} 1)" opacity="${op}"><circle r="${r * 1.04}" fill="#7a6a4a"/><circle r="${r}" fill="${R(face ? '#d8c08a' : '#c8b07a', 0.35, 0.35)}"/><circle r="${r * 0.82}" fill="none" stroke="#8a744a" stroke-width="${r * 0.05}"/>${face ? `<ellipse cx="${-r * 0.05}" cy="${-r * 0.05}" rx="${r * 0.36}" ry="${r * 0.44}" fill="#b0985e"/><path d="M${-r * 0.3},${r * 0.2} Q0,${r * 0.6} ${r * 0.3},${r * 0.2}" fill="#b0985e"/>` : `<path d="M${-r * 0.45},${r * 0.1} Q0,${-r * 0.5} ${r * 0.45},${r * 0.1} L${r * 0.3},${r * 0.35} L${-r * 0.3},${r * 0.35} Z" fill="#b0985e"/>`}<ellipse cx="${-r * 0.35}" cy="${-r * 0.4}" rx="${r * 0.3}" ry="${r * 0.14}" fill="#fff" opacity="0.4"/></g>`;
}
// баллон с красным шлангом и пистолетом для забоя скота
function airTank(x, y, s, hx, hy) {
  return `<g filter="url(#soft)"><rect x="${x - 34 * s}" y="${y - 300 * s}" width="${68 * s}" height="${300 * s}" rx="${30 * s}" fill="${V('#b8bcc0', 0.35, 0.35)}"/><rect x="${x - 20 * s}" y="${y - 290 * s}" width="${10 * s}" height="${270 * s}" rx="${5 * s}" fill="#fff" opacity="0.35"/><rect x="${x - 12 * s}" y="${y - 336 * s}" width="${24 * s}" height="${40 * s}" fill="#6a6e72"/><circle cx="${x}" cy="${y - 340 * s}" r="${14 * s}" fill="#4a4e52"/><path d="M${x},${y - 340 * s} Q${x + 80 * s},${y - 420 * s} ${hx},${hy}" stroke="#b02a22" stroke-width="${9 * s}" fill="none"/></g>`;
}
function boltGun(x, y, s) {
  return `<g transform="translate(${x} ${y}) rotate(80) scale(${s})"><rect x="-10" y="-20" width="110" height="30" rx="8" fill="${V('#8a8e92', 0.3, 0.3)}"/><rect x="90" y="-14" width="40" height="18" rx="4" fill="#5a5e62"/></g>`;
}
// золотая статуэтка-награда (стилизованная), с белой обводкой стикера
function statuette(x, y, h, rot = 0) {
  const k = h / 300;
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})" filter="url(#stk)"><rect x="-46" y="-40" width="92" height="40" rx="6" fill="${V('#2a2620', 0.25, 0.3)}"/><rect x="-36" y="-72" width="72" height="34" rx="6" fill="${V('#d8b04a', 0.45, 0.35)}"/><path d="M-18,-72 L-16,-150 Q-24,-200 -22,-210 L22,-210 Q24,-200 16,-150 L18,-72 Z" fill="${V('#e0bc58', 0.45, 0.4)}"/><path d="M-22,-206 Q-30,-238 -14,-252 L14,-252 Q30,-238 22,-206 Z" fill="${V('#e8c460', 0.4, 0.35)}"/><path d="M-26,-224 Q0,-200 26,-224" stroke="#9a7420" stroke-width="5" fill="none"/><rect x="-3" y="-240" width="6" height="100" fill="#b08a2a" opacity="0.7"/><circle cx="0" cy="-270" r="20" fill="${R('#ecc864', 0.4, 0.35)}"/><path d="M-8,-160 L-8,-74 M8,-160 L8,-74" stroke="#a8842a" stroke-width="3" opacity="0.6"/><ellipse cx="-8" cy="-240" rx="5" ry="20" fill="#fff" opacity="0.35"/></g>`;
}

// ---- фото-стикеры: картинки грузим заранее в data URL ----
const STICKER_SRC = { bardem: 'bardem-cut.png', chigurh: 'chigurh-cut.png' };
const IMG = {};
await Promise.all(Object.entries(STICKER_SRC).map(async ([k, f]) => {
  try {
    const b = await (await fetch(`/public/assets/no-country-for-old-men/${f}`)).blob();
    IMG[k] = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  } catch { IMG[k] = ''; }
}));
const STICKER_FILTER = `<filter id="stk" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="10" result="dil"/><feFlood flood-color="#ffffff"/><feComposite in2="dil" operator="in" result="outline"/><feGaussianBlur in="dil" stdDeviation="12" result="blur"/><feOffset in="blur" dx="8" dy="16" result="sh"/><feFlood flood-color="#000" flood-opacity="0.55"/><feComposite in2="sh" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const popScale = (f) => (f < 6 ? lerp(0.2, 1.12, f / 6) : f < 10 ? lerp(1.12, 0.96, (f - 6) / 4) : f < 14 ? lerp(0.96, 1, (f - 10) / 4) : 1);
// at — секунда появления от начала плана (AUDIO_DELAY 4 кадра + время слова)
const D = 4 / 30;
const STICKERS = [
  { k: 'bardem', x: 300, y: 1010, w: 450, h: 540, at: D + 0.0, tilt: -5 },
  { k: 'chigurh', x: 790, y: 1020, w: 360, h: 640, at: D + 0.73, tilt: 4 },
];
function sticker(s, t, i) {
  const dt = t - s.at;
  if (dt < 0 || !IMG[s.k]) return '';
  const f = dt * 30;
  const wob = wave(t, 0.35, i * 2) * 2.4, bob = wave(t, 0.25, i * 1.3) * 7;
  return `<g transform="translate(${s.x} ${s.y + bob}) rotate(${s.tilt + wob}) scale(${popScale(f)})" opacity="${clamp(f / 3)}"><image href="${IMG[s.k]}" x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid meet" filter="url(#stk)"/></g>`;
}
// четыре статуэтки под «четыре статуэтки, включая главную»: последняя — крупнее, с сиянием
const AWARDS = [
  { x: 170, y: 1500, h: 300, at: D + 4.9, tilt: -6 },
  { x: 405, y: 1510, h: 310, at: D + 5.25, tilt: -2 },
  { x: 650, y: 1510, h: 310, at: D + 5.6, tilt: 2 },
  { x: 895, y: 1500, h: 380, at: D + 6.27, tilt: 6, main: true },
];

const DESERT_NOON = [[0, '#6a9ac8'], [0.55, '#b8d0e0'], [1, '#f0e4c8']];
const DESERT_DUSK = [[0, '#2a3a6a'], [0.45, '#c86a4a'], [0.8, '#f0a850'], [1, '#f8d890']];

const shots = {
  // 1. Хук: Мосс крупно прижимает сумку и оглядывается; за ним в мареве над дорогой тёмная фигура
  'satchel-run'(t, T) {
    const k = ease(t / T), near = lerp(0.55, 0.8, k);
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k) },
      els: [
        sky(DESERT_NOON, 1300),
        glow(860, 300, 360, '#fffbe8', 0.8), `<circle cx="860" cy="300" r="60" fill="#fffdf2"/>`,
        mesas(1130, '#b88a6a', 0.55, 2),
        mesas(1170, '#a86a48', 0.85, 5),
        `<rect x="0" y="1160" width="1080" height="760" fill="${V('#d0a874', 0.06, 0.4)}"/>`,
        // дорога к горизонту
        `<path d="M520,1162 L600,1162 L1080,1700 L1080,1920 L120,1920 Z" fill="${V('#5a524a', 0.1, 0.3)}"/>`,
        [...Array(7)].map((_, i) => { const f = i / 7, y = 1170 + f * f * 760; return `<rect x="${560 + f * f * 380 - 3 - f * 8}" y="${y}" width="${6 + f * 16}" height="${10 + f * 60}" fill="#e8d88a" opacity="0.8"/>`; }).join(''),
        poles([[1040, 1500, 440], [900, 1320, 230], [810, 1240, 130], [750, 1200, 76], [710, 1184, 44]]),
        fence([[0, 1420, 120], [140, 1340, 80], [260, 1280, 54], [360, 1240, 36], [440, 1214, 24], [500, 1196, 16]]),
        scrub(1180, 1500, 26, 3),
        // далёкая фигура в мареве
        `<g opacity="${near}" transform="translate(${630 + wave(t, 0.7) * 3} 0)"><g filter="url(#blur4)">${man(0, 1210, 0.16 + 0.05 * k, { ...CHIGURH, arms: 'down', sil: silFilter('#1a1410') })}</g></g>`,
        heat(t, 1150, 90, 0.35),
        stones(1300, 1900, 50, 9),
        yucca(140, 1720, 1.6),
        // Мосс
        glow(470, 1500, 520, '#fff4d8', 0.18),
        man(470, 2150, 1.7, { ...MOSS, arms: 'hold', look: 1, frown: 0.65, worried: true, blink: blink(t, 0.9), sweat: (t * 0.6) % 1 }),
        satchel(470, 1590, 300, { rot: -4 }),
        `<circle cx="318" cy="1610" r="30" fill="${R('#c98e64')}"/><circle cx="622" cy="1590" r="30" fill="${R('#c98e64')}"/>`,
        grade('#ffd8a0', 0.25),
        topShade(900, 0.55),
      ],
    };
  },

  // 2. Закат: Мосс на скале с винтовкой, вдали антилопы; внизу его трейлер, пикап и столбы
  hunt(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.0, 1.1, k), x: lerp(0, -30, k) },
      els: [
        sky(DESERT_DUSK, 1300),
        glow(300, 1100, 420, '#ffe0a0', 0.9), `<circle cx="300" cy="1110" r="80" fill="#fff0c8"/>`,
        `<g opacity="0.7">${[0, 1, 2].map((i) => `<ellipse cx="${200 + i * 320}" cy="${420 + i * 110}" rx="${260}" ry="18" fill="#f0a070" opacity="0.5"/>`).join('')}</g>`,
        mesas(1130, '#7a3a3a', 0.8, 7),
        `<rect x="0" y="1120" width="1080" height="800" fill="${V('#a8643a', 0.05, 0.45)}"/>`,
        ...[[180, 1190, 0.36, 0], [260, 1200, 0.4, 1], [330, 1186, 0.32, 2], [420, 1196, 0.36, 3]].map(([x, y, s, ph]) => antelope(x, y, s, t, ph, '#8a5030')),
        scrub(1160, 1340, 18, 6, '#4a4a2a'),
        poles([[60, 1420, 250], [220, 1330, 150], [330, 1280, 96], [410, 1254, 64]]),
        trailer(80, 1400, 380, 120, 1),
        pickup(600, 1405, 0.35, { c: '#4a6a7a' }),
        `<path d="M480,1410 Q700,1400 1080,1450" stroke="#7a4a2a" stroke-width="20" fill="none" opacity="0.6"/>`,
        // скала на переднем плане
        `<path d="M380,1920 L420,1700 Q520,1620 700,1640 Q900,1600 1100,1680 L1100,1920 Z" fill="${V('#6a3424', 0.15, 0.45)}"/><path d="M460,1720 Q600,1680 760,1700 M820,1660 Q940,1650 1080,1700" stroke="#8a4a30" stroke-width="6" fill="none" opacity="0.6"/>`,
        creosote(440, 1720, 1.2, '#4a4a2a'),
        shadow(800, 1690, 150, 0.35),
        man(800, 1690, 0.95, { ...MOSS, arms: 'rifle', look: -1, frown: 0.3, blink: blink(t, 1.3) }),
        grade('#ffb070', 0.3),
        topShade(900, 0.55),
      ],
    };
  },

  // 3. Полукруг изрешечённых пикапов, тела-силуэты, раненая собака; Мосс с винтовкой; под деревом сумка
  massacre(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -30, k) },
      els: [
        sky(DESERT_NOON, 1300),
        glow(200, 280, 300, '#fffbe8', 0.7),
        ...[0, 1, 2].map((i) => vulture(560 + i * 150 + Math.cos(t * 0.6 + i * 2) * 90, 380 + i * 50 + Math.sin(t * 0.6 + i * 2) * 30, 0.8 - i * 0.15, t, i)),
        mesas(1120, '#b88a6a', 0.6, 9),
        `<rect x="0" y="1110" width="1080" height="810" fill="${V('#c89c68', 0.06, 0.42)}"/>`,
        scrub(1120, 1300, 16, 11),
        mesquite(150, 1340, 1.0),
        satchel(170, 1330, 90),
        pickup(700, 1250, 0.42, { c: '#6a6a5a', holes: 3, door: true, flip: true }),
        pickup(420, 1290, 0.5, { c: '#8a3a2a', holes: 5 }),
        pickup(860, 1340, 0.55, { c: '#c8b48a', holes: 7, door: true }),
        fallen(540, 1360, 0.6, 8), fallen(330, 1400, 0.55, -12), fallen(760, 1420, 0.65, 4),
        dog(980, 1460, 0.6),
        stones(1300, 1900, 60, 12),
        creosote(80, 1780, 1.5), creosote(1010, 1840, 1.7),
        shadow(560, 1880, 170, 0.35),
        man(560, 1880, 1.12, { ...MOSS, arms: 'rifle', look: -0.6, frown: 0.6, worried: true, step: wave(t, 0.6) * 0.6, blink: blink(t, 2.1) }),
        grade('#ffd8a0', 0.25),
        topShade(900, 0.55),
      ],
    };
  },

  // 4. Руки открывают сумку — пачки денег; затем Мосс уходит с ней на закат, за спиной машины и грифы
  money(t, T) {
    const cut = D + 1.07;
    if (t < cut) {
      const k = ease(t / cut), open = ease(clamp(t / 0.6));
      return {
        cam: { z: lerp(1.0, 1.06, k) },
        els: [
          `<rect width="1080" height="1920" fill="${V('#b88a5a', 0.1, 0.35)}"/>`,
          stones(0, 1920, 80, 21, '#8a6a44'),
          `<g filter="url(#soft)"><rect x="140" y="760" width="800" height="700" rx="50" fill="${V('#6a3e1c', 0.2, 0.35)}"/><rect x="180" y="800" width="720" height="620" rx="30" fill="#2a1a0e"/></g>`,
          ...[...Array(12)].map((_, i) => bundle(300 + (i % 3) * 240, 900 + Math.floor(i / 3) * 140, 220, ((i * 37) % 9) - 4)),
          `<path d="M140,${lerp(1100, 760, open)} L940,${lerp(1100, 760, open)} L980,${lerp(1100, 560, open)} L100,${lerp(1100, 560, open)} Z" fill="${V('#7a4a24', 0.25, 0.35)}"/><rect x="480" y="${lerp(1080, 600, open)}" width="120" height="40" rx="10" fill="${V('#e0c070', 0.3, 0.3)}"/>`,
          `<path d="M-40,1700 Q120,1500 250,1430" stroke="${V('#7f9bb4', 0.2, 0.2)}" stroke-width="130" fill="none" stroke-linecap="round"/><ellipse cx="270" cy="1410" rx="80" ry="66" fill="${R('#c98e64')}"/>`,
          `<path d="M1120,1700 Q960,1500 830,1430" stroke="${V('#7f9bb4', 0.2, 0.2)}" stroke-width="130" fill="none" stroke-linecap="round"/><ellipse cx="810" cy="1410" rx="80" ry="66" fill="${R('#c98e64')}"/>`,
          grade('#ffd8a0', 0.25),
          topShade(900, 0.55),
        ],
      };
    }
    const tt = t - cut, k = ease(tt / (T - cut));
    return {
      cam: { z: lerp(1.02, 1.1, k) },
      els: [
        sky(DESERT_DUSK, 1300),
        glow(760, 1080, 460, '#ffe0a0', 0.9), `<circle cx="760" cy="1090" r="90" fill="#fff0c8"/>`,
        ...[0, 1, 2, 3].map((i) => vulture(300 + i * 160 + Math.cos(t * 0.5 + i * 2) * 70, 360 + i * 40 + Math.sin(t * 0.5 + i) * 30, 0.7 - i * 0.1, t, i)),
        mesas(1120, '#5a2a2a', 0.9, 9),
        `<rect x="0" y="1110" width="1080" height="810" fill="${V('#8a4a2a', 0.04, 0.5)}"/>`,
        pickup(260, 1230, 0.3, { c: '#2a1a14', holes: 2, door: true }), pickup(500, 1236, 0.3, { c: '#2a1a14', flip: true }),
        scrub(1130, 1500, 20, 14, '#3a3a22'),
        `<path d="M${560 + 300 * k},1880 L${640 + 400 * k},1880" stroke="#000" stroke-width="0"/>`,
        `<path d="M480,1900 L1080,1500 L1080,1560 L560,1920 Z" fill="#000" opacity="0.25"/>`,
        stones(1400, 1900, 30, 15, '#6a3a22'),
        shadow(lerp(520, 640, k), 1840, 150, 0.35),
        man(lerp(520, 640, k), 1840, 1.05, { ...MOSS, arms: 'down', step: wave(t, 1.1), look: -1, frown: 0.5, worried: true, blink: blink(t, 0.4) }),
        (() => { const [hx, hy] = handPos(lerp(520, 640, k), 1840, 1.05, 1); return satchel(hx + 10, hy + 80, 170, { rot: 4 }); })(),
        grade('#ff9a50', 0.3),
        topShade(900, 0.55),
      ],
    };
  },

  // 5. Ночь, заправка в пустыне: Чигур с баллоном и шлангом; на «монетку» — крупно летящая монета
  chigurh(t, T) {
    const k = ease(t / T), ca = D + 5.29, c = fade(t, ca, 0.25);
    const [hx, hy] = handPos(540, 1900, 1.3, -1, CHIGURH);
    const tossY = lerp(1300, 860, ease(clamp((t - ca) / 0.7)));
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k) },
      els: [
        sky([[0, '#05070e'], [0.7, '#141a2c'], [1, '#2a2a38']], 1300),
        `<g>${[...Array(40)].map((_, i) => { reseed(100 + i); return `<circle cx="${rnd() * 1080}" cy="${rnd() * 900}" r="${rnd() < 0.15 ? 2.2 : 1.2}" fill="#fff" opacity="${0.3 + rnd() * 0.5}"/>`; }).join('')}</g>`,
        mesas(1150, '#0c0e16', 1, 4),
        `<rect x="0" y="1140" width="1080" height="780" fill="${V('#1e1a18', 0.05, 0.5)}"/>`,
        // заправка: навес, колонки, лавка с окнами, вывеска
        glow(330, 1180, 520, '#ffc870', 0.45),
        `<g filter="url(#soft)"><rect x="40" y="1000" width="440" height="230" fill="${V('#cfc2a2', 0.1, 0.35)}"/><rect x="40" y="980" width="440" height="30" fill="#8a2a22"/><rect x="80" y="1060" width="150" height="110" fill="#ffd890" opacity="0.92"/><rect x="270" y="1060" width="80" height="170" fill="#ffd890" opacity="0.85"/><rect x="380" y="1060" width="70" height="110" fill="#ffd890" opacity="0.9"/>${[0, 1, 2].map((i) => `<rect x="${92 + i * 46}" y="1080" width="30" height="80" fill="#a8783a" opacity="0.5"/>`).join('')}</g>`,
        `<rect x="40" y="930" width="760" height="40" fill="${V('#e8e0c8', 0.2, 0.3)}"/><rect x="40" y="966" width="760" height="10" fill="#8a2a22"/><rect x="620" y="970" width="16" height="270" fill="#5a5a5a"/>`,
        `<path d="M40,976 L800,976 L900,1300 L-60,1300 Z" fill="${grad([[0, '#fff0c0', 0.25], [1, '#fff0c0', 0]])}"/>`,
        ...[540, 720].map((x) => `<g filter="url(#soft)"><rect x="${x - 30}" y="1090" width="60" height="140" rx="8" fill="${V('#c8d0c8', 0.25, 0.35)}"/><rect x="${x - 22}" y="1104" width="44" height="34" fill="#2a2a2a"/><rect x="${x - 18}" y="1150" width="36" height="20" fill="#8a2a22"/></g>`),
        `<g><rect x="880" y="760" width="12" height="480" fill="#2a2a2a"/><rect x="820" y="700" width="140" height="100" rx="8" fill="#a8322a"/><text x="890" y="768" font-family="Arial Black,Arial" font-weight="900" font-size="44" fill="#fff4d8" text-anchor="middle">GAS</text></g>`,
        glow(890, 750, 160, '#ff6a50', 0.3),
        stones(1260, 1900, 30, 31, '#3a3230'),
        // Чигур
        shadow(540, 1900, 190, 0.45),
        man(540, 1900, 1.3, { ...CHIGURH, arms: 'down', look: 0, frown: 0.2, blink: blink(t, 2.2) }),
        airTank(hx - 10, 1890, 1.1, hx + 340, hy - 10),
        boltGun(hx + 320, hy - 40, 0.9),
        glow(560, 1300, 420, '#ffc870', 0.12),
        // монетка
        c > 0 ? glow(780, tossY, 240, '#ffe8a0', 0.4 * c) + coin(780, tossY, 105, t * 14, c) : '',
        grade('#ffc870', 0.15),
        topShade(900, 0.55),
      ],
    };
  },

  // 6. Мотель ночью: Мосс у окна с сумкой, по шторе скользят фары; на «а старый шериф» — рассвет, Белл над следами шин
  chase(t, T) {
    const cut = D + 2.93;
    if (t < cut) {
      const k = ease(t / cut), sweep = ((t * 0.7) % 1);
      return {
        cam: { z: lerp(1.0, 1.08, k) },
        els: [
          `<rect width="1080" height="1920" fill="${V('#3a3a4a', 0.05, 0.4)}"/>`,
          [...Array(12)].map((_, i) => `<rect x="${i * 92}" y="0" width="4" height="1500" fill="#2a2a38" opacity="0.6"/>`).join(''),
          // окно со шторами
          `<rect x="520" y="600" width="480" height="640" fill="#0e1420"/><rect x="520" y="600" width="480" height="640" fill="none" stroke="#5a4a3a" stroke-width="18"/>`,
          `<rect x="520" y="600" width="480" height="640" fill="${grad([[0, '#ffe8b0', 0], [Math.max(0, sweep - 0.15), '#ffe8b0', 0], [sweep, '#ffe8b0', 0.75], [Math.min(1, sweep + 0.15), '#ffe8b0', 0], [1, '#ffe8b0', 0]], false)}"/>`,
          `<path d="M520,600 Q560,900 540,1240 L700,1240 Q720,900 680,600 Z" fill="${V('#8a6a3a', 0.15, 0.35)}"/><path d="M1000,600 Q960,900 990,1240 L900,1240 Q860,900 880,600 Z" fill="${V('#8a6a3a', 0.15, 0.35)}"/>`,
          glow(800, 900, 240, '#ffe8b0', 0.4 * (sweep > 0.3 && sweep < 0.7 ? 1 : 0.3)),
          `<rect x="0" y="1480" width="1080" height="440" fill="${V('#4a3a2a', 0.08, 0.45)}"/>`,
          // кровать, сумка, лампа на тумбочке
          `<g filter="url(#soft)"><rect x="-40" y="1360" width="520" height="200" rx="20" fill="${V('#7a5a4a', 0.2, 0.35)}"/><rect x="-40" y="1340" width="520" height="60" rx="20" fill="${V('#c8b8a0', 0.2, 0.3)}"/><rect x="-40" y="1280" width="40" height="300" fill="#4a3424"/></g>`,
          satchel(260, 1330, 200, { rot: -8 }),
          `<rect x="900" y="1400" width="160" height="160" fill="${V('#5a4030', 0.2, 0.35)}"/><path d="M940,1400 L1020,1400 L1000,1320 L960,1320 Z" fill="#e8d8b0"/>${glow(980, 1360, 200, '#ffcf8a', 0.4)}`,
          man(620, 2200, 1.65, { ...MOSS, arms: 'down', look: 1, frown: 0.7, worried: true, blink: blink(t, 0.5) }),
          grade('#8090c0', 0.2),
          topShade(900, 0.55),
        ],
      };
    }
    const tt = t - cut, k = ease(tt / (T - cut));
    return {
      cam: { z: lerp(1.04, 1.12, k), y: lerp(0, -30, k) },
      els: [
        sky([[0, '#3a4a7a'], [0.5, '#c88a7a'], [0.85, '#f0c090'], [1, '#f8e0b0']], 1300),
        glow(800, 1140, 400, '#ffe8b8', 0.8),
        mesas(1140, '#5a4a5a', 0.85, 13),
        `<rect x="0" y="1130" width="1080" height="790" fill="${V('#b08a68', 0.06, 0.42)}"/>`,
        // следы шин уходят к горизонту
        ...[-1, 1].map((sd) => `<path d="M${560 + sd * 260},1920 Q${560 + sd * 100},1500 ${600 + sd * 12},1150" stroke="#6a4a30" stroke-width="44" fill="none" opacity="0.5" stroke-dasharray="14 10"/>`),
        poles([[60, 1500, 360], [220, 1330, 190], [320, 1250, 110], [390, 1210, 66]]),
        fence([[1080, 1460, 110], [950, 1360, 76], [860, 1290, 52], [800, 1250, 36], [760, 1222, 24]]),
        scrub(1140, 1400, 18, 22),
        `<g filter="url(#soft)">${pickup(880, 1260, 0.4, { c: '#e8e4d8', flip: true })}</g><rect x="${880 - 30}" y="${1260 - 92}" width="60" height="14" rx="4" fill="#a8322a"/><rect x="${880 - 30}" y="${1260 - 92}" width="30" height="14" rx="4" fill="#3a5aa8"/>`,
        stones(1300, 1900, 40, 23),
        shadow(520, 1900, 200, 0.35),
        man(520, 1900, 1.6, { ...BELL, pose: 'crouch', arms: 'hold', look: 0.5, frown: 0.55, blink: blink(t, 1.4) }),
        grade('#ffd0a0', 0.25),
        topShade(900, 0.55),
      ],
    };
  },

  // 7. Стикеры: Бардем и Бардем-Чигур под имена, затем четыре статуэтки по одной
  oscars(t, T) {
    def(STICKER_FILTER);
    return {
      cam: { z: 1, y: 0 },
      els: [
        sky([[0, '#0a0806'], [0.5, '#1e140c'], [0.8, '#2a1a10'], [1, '#3a2010']], 1920),
        glow(540, 1500, 700, '#d9a441', 0.3), glow(200, 700, 500, '#8a3a2a', 0.25),
        [-1, 1].map((s) => `<path d="M${540 + s * 720},300 L${540 + s * 60},1800 L${540 + s * 280},1800 Z" fill="#fff4d8" opacity="${0.05 + 0.02 * wave(t, 0.3, s)}"/>`).join(''),
        `<path d="M0,1660 Q540,1600 1080,1660 L1080,1920 L0,1920 Z" fill="#1a100a"/>`,
        STICKERS.map((s, i) => sticker(s, t, i)).join(''),
        AWARDS.map((a, i) => {
          const dt = t - a.at; if (dt < 0) return '';
          const f = dt * 30, wob = wave(t, 0.4, i) * 2;
          return (a.main ? glow(a.x, a.y - a.h * 0.5, 260, '#ffe08a', 0.5 * clamp(f / 6)) : '') + `<g transform="translate(${a.x} ${a.y}) scale(${popScale(f)}) translate(${-a.x} ${-a.y})" opacity="${clamp(f / 3)}">${statuette(a.x, a.y, a.h, a.tilt + wob)}</g>`;
        }).join(''),
        topShade(900, 0.5),
      ],
    };
  },

  // 8. Прилавок заправки под лампой: монетка крутится, ладонь накрывает её на «орёл или решка»
  coin(t, T) {
    const k = ease(t / T), cover = D + 2.75, h = ease(clamp((t - cover) / 0.35));
    const spinSpeed = lerp(16, 3, ease(clamp(t / cover)));
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k) },
      els: [
        `<rect width="1080" height="1920" fill="#120e0a"/>`,
        // полки с товарами в полумраке
        [...Array(4)].map((_, r) => `<rect x="0" y="${300 + r * 220}" width="1080" height="14" fill="#2a2018"/>` + [...Array(10)].map((_, i) => { reseed(r * 20 + i); return `<rect x="${20 + i * 106}" y="${300 + r * 220 - 60 - rnd() * 80}" width="${60 + rnd() * 30}" height="${60 + rnd() * 80}" rx="6" fill="${['#5a2a22', '#2a4a5a', '#6a5a2a', '#3a4a2a'][i % 4]}" opacity="0.45"/>`; }).join('')).join(''),
        glow(540, 900, 700, '#ffc870', 0.3),
        `<rect x="0" y="1180" width="1080" height="740" fill="${V('#7a5030', 0.15, 0.5)}"/><rect x="0" y="1180" width="1080" height="20" fill="#3a2414"/>`,
        [...Array(6)].map((_, i) => `<path d="M0,${1240 + i * 110} Q540,${1220 + i * 110} 1080,${1240 + i * 110}" stroke="#5a3820" stroke-width="3" fill="none" opacity="0.5"/>`).join(''),
        // кассовый аппарат и банка с орехами
        `<g filter="url(#soft)"><path d="M720,1180 L1000,1180 L980,940 L760,940 Z" fill="${V('#8a8e90', 0.25, 0.35)}"/><rect x="780" y="960" width="180" height="60" fill="#1a2a1a"/><text x="870" y="1004" font-family="monospace" font-size="34" fill="#7aff8a" text-anchor="middle">0.69</text>${[...Array(3)].map((_, r) => [...Array(4)].map((_, c) => `<rect x="${786 + c * 44}" y="${1040 + r * 40}" width="36" height="30" rx="5" fill="#d8d4c8"/>`).join('')).join('')}</g>`,
        `<g filter="url(#soft)"><rect x="110" y="1000" width="140" height="190" rx="14" fill="#c8d4d8" opacity="0.35"/><rect x="104" y="980" width="152" height="30" rx="8" fill="#a8322a"/>${[...Array(12)].map((_, i) => `<ellipse cx="${130 + (i % 4) * 32}" cy="${1060 + Math.floor(i / 4) * 40}" rx="14" ry="10" fill="#a87a4a"/>`).join('')}</g>`,
        // монета и тень
        `<ellipse cx="540" cy="1470" rx="140" ry="22" fill="#000" opacity="0.35"/>`,
        h < 1 ? coin(540, 1400, 110, t * spinSpeed) : '',
        glow(540, 1400, 220, '#ffe8a0', 0.25 * (1 - h)),
        // ладонь накрывает монету
        `<g transform="translate(0 ${lerp(-420, 0, h)})" opacity="${h > 0 ? 1 : 0}"><path d="M1180,1180 Q900,1260 720,1360" stroke="${V('#2a3342', 0.2, 0.2)}" stroke-width="150" fill="none" stroke-linecap="round"/><path d="M700,1300 Q540,1280 420,1370 Q400,1440 470,1460 Q620,1480 740,1440 Q790,1380 700,1300 Z" fill="${R('#d8b49a', 0.15, 0.25)}"/>${[0, 1, 2, 3].map((i) => `<path d="M${450 + i * 6},${1360 + i * 24} L${400 - i * 4},${1380 + i * 24}" stroke="${shade('#d8b49a', -0.2)}" stroke-width="3"/>`).join('')}</g>`,
        grade('#ffc870', 0.15),
        topShade(900, 0.55),
      ],
    };
  },
};

run(shots);
