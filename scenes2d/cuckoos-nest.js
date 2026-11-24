// «Пролетая над гнездом кукушки» (One Flew Over the Cuckoo's Nest, 1975) — 8 сцен в 2D-векторе.
// Имя плана = set сцены в videos/cuckoos-nest/script.json.
// Орегон, начало 60-х: казённый мятно-зелёный кафель, белые халаты, окна с сеткой, дождливое небо.
// Макмёрфи: вязаная шапка, коричневая кожаная куртка поверх серой футболки, щетина, наглая ухмылка.
// Рэтчед: белоснежная форма с шапочкой, тёмные волосы уложены валиками, ровная улыбка.
// Динамика (правило пользователя): непрерывная плавная камера, параллакс планов, всё время движение, события под слова.
import { run, person, setProportions, V, R, grad, glow, silFilter, rnd, reseed, shade, lerp, ease, clamp, wave } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

const D = 0.13; // голос начинается через 4 кадра
// мягкое ускорение/торможение для камеры и движений
const io = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const sine = (k) => -(Math.cos(Math.PI * clamp(k)) - 1) / 2;
const at = (t, a, d = 0.5) => io((t - D - a) / d); // 0→1 начиная со слова (время слова в озвучке)
const blink = (t, ph = 0) => ((t + ph) % 3.4) < 0.12;
const par = (dx, dy, svg) => `<g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})">${svg}</g>`;
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const topShade = (h = 820, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const label = (x, y, txt, size = 15, c = '#3a4a44', op = 0.55, rot = 0) => `<text x="${x}" y="${y}" font-family="Montserrat, Manrope, sans-serif" font-weight="600" font-size="${size}" letter-spacing="1" fill="${c}" opacity="${op}" text-anchor="middle"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}>${txt}</text>`;

// ---------- персонажи ----------
const MAC = { shirt: '#6a4024', pants: '#2e3440', skin: '#e2b08e', hair: '#3a2618', iris: '#4a6a7a', beard: false, frown: -0.1, mac: true };
const RATCHED = { shirt: '#f4f2ec', pants: '#f4f2ec', skin: '#f0cdb6', hair: '#2a1e1a', iris: '#3a4a5a', beard: false, frown: 0.05, nurse: true, slim: 0.78, robe: '#f4f2ec' };
const PAT = [
  { shirt: '#b8c8cc', pants: '#a8b8bc', skin: '#e0b494', hair: '#6a4a30', beard: false, frown: 0.6, worried: true, pj: true },
  { shirt: '#c8c0b0', pants: '#b8b0a0', skin: '#d8a888', hair: '#c8c0b0', beard: false, frown: 0.4, pj: true, glasses: true },
  { shirt: '#a8bcc8', pants: '#98acb8', skin: '#e8c0a0', hair: '#1a1410', beard: false, frown: 0.7, worried: true, pj: true },
  { shirt: '#c4ccb8', pants: '#b4bca8', skin: '#c89474', hair: '#8a6a4a', beard: false, frown: 0.3, pj: true, bald: true },
];
const CHIEF = { shirt: '#9aa8a0', pants: '#8a9890', skin: '#a8704c', hair: '#141010', iris: '#2a1a10', beard: false, frown: 0.5, longHair: true, pj: true };

function geo(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const pose = o.pose || 'stand';
  const legH = (pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  return { hs, hr, top, ty, headY: top - hr * 0.8 + (o.nod || 0) * 6 * hs };
}
function dress(x, y, s, o) {
  const { hr, hs, top, ty, headY } = geo(x, y, s, o);
  let b = '', front = '';
  if (o.mac) {
    // серая футболка в распахнутой кожаной куртке: воротник, молния, карманы, строчка
    b += `<path d="M${x - 58 * s},${top - 4 * s} Q${x},${top + 26 * s} ${x + 58 * s},${top - 4 * s} L${x + 44 * s},${ty} L${x - 44 * s},${ty} Z" fill="${V('#8a8e92', 0.2, 0.25)}"/>`;
    b += `<path d="M${x - 40 * s},${top} Q${x},${top + 30 * s} ${x + 40 * s},${top}" stroke="#6a6e72" stroke-width="${6 * s}" fill="none"/>`;
    [-1, 1].forEach((sd) => {
      b += `<path d="M${x + sd * 50 * s},${top - 14 * s} L${x + sd * 112 * s},${top + 16 * s} L${x + sd * 84 * s},${top + 92 * s} L${x + sd * 54 * s},${top + 40 * s} Z" fill="${V('#7a4a2a', 0.3, 0.2)}"/>`;
      b += `<path d="M${x + sd * 50 * s},${top + 40 * s} L${x + sd * 46 * s},${ty}" stroke="#c8a070" stroke-width="${4 * s}"/>`;
      b += `<rect x="${x + (sd > 0 ? 58 : -96) * s}" y="${ty - 110 * s}" width="${38 * s}" height="${8 * s}" rx="${3 * s}" fill="#3a2010"/>`;
    });
    b += `<path d="M${x - 92 * s},${ty - 10 * s} L${x + 92 * s},${ty - 10 * s}" stroke="#3a2212" stroke-width="${14 * s}" opacity="0.6"/>`;
    if (o.cuffs) {
      // наручники на сведённых руках
      const cy = top + 40 * s + 172 * s;
      b += [-1, 1].map((sd) => `<circle cx="${x + sd * 40 * s}" cy="${cy}" r="${24 * s}" fill="none" stroke="#c8ccd0" stroke-width="${7 * s}"/>`).join('') + `<path d="M${x - 16 * s},${cy} Q${x},${cy + 14 * s} ${x + 16 * s},${cy}" stroke="#a8acb0" stroke-width="${5 * s}" fill="none"/>`;
    }
  }
  if (o.nurse) {
    // белая форма: отложной воротник, пуговицы, кармашек с ручкой, часы-кулон
    b += [-1, 1].map((sd) => `<path d="M${x},${top + 2 * s} L${x + sd * 62 * s},${top - 8 * s} L${x + sd * 56 * s},${top + 46 * s} Z" fill="#ffffff" stroke="#d8d6d0" stroke-width="${2 * s}"/>`).join('');
    b += [0, 1, 2, 3].map((i) => `<circle cx="${x}" cy="${top + (70 + i * 46) * s}" r="${6 * s}" fill="#d8d6d0"/>`).join('');
    b += `<rect x="${x - 82 * s}" y="${top + 80 * s}" width="${44 * s}" height="${40 * s}" rx="${4 * s}" fill="none" stroke="#d8d6d0" stroke-width="${3 * s}"/><rect x="${x - 70 * s}" y="${top + 66 * s}" width="${7 * s}" height="${30 * s}" fill="#2a3a6a"/>`;
    b += `<circle cx="${x + 62 * s}" cy="${top + 96 * s}" r="${14 * s}" fill="${R('#d8c070')}"/>`;
    b += `<path d="M${x - 92 * s},${ty - 40 * s} Q${x},${ty - 20 * s} ${x + 92 * s},${ty - 40 * s}" stroke="#e0ded8" stroke-width="${10 * s}" fill="none"/>`;
  }
  if (o.pj) {
    // больничная пижама: вырез, планка, полоска
    b += `<path d="M${x - 34 * s},${top - 4 * s} L${x},${top + 60 * s} L${x + 34 * s},${top - 4 * s} Z" fill="${shade(o.skin, -0.05)}"/>`;
    b += `<path d="M${x},${top + 60 * s} L${x},${ty}" stroke="${shade(o.shirt, -0.25)}" stroke-width="${4 * s}"/>`;
    b += [0, 1, 2].map((i) => `<circle cx="${x + 8 * s}" cy="${top + (90 + i * 50) * s}" r="${5 * s}" fill="${shade(o.shirt, -0.3)}"/>`).join('');
    b += `<rect x="${x + 36 * s}" y="${top + 70 * s}" width="${42 * s}" height="${36 * s}" rx="${4 * s}" fill="none" stroke="${shade(o.shirt, -0.2)}" stroke-width="${3 * s}"/>`;
  }
  if (o.mac) {
    // вязаная шапка с отворотом и торчащие из-под неё вихры, щетина
    const cy = headY - hr * 0.35;
    front += [-1, 1].map((sd) => `<path d="M${x + sd * hr * 0.92},${cy} q${sd * hr * 0.25},${hr * 0.2} ${sd * hr * 0.05},${hr * 0.45} q${sd * hr * 0.18},${hr * 0.05} ${-sd * hr * 0.02},${hr * 0.3}" fill="${o.hair}"/>`).join('');
    front += `<path d="M${x - hr * 1.02},${cy + hr * 0.05} Q${x - hr * 1.08},${headY - hr * 1.5} ${x},${headY - hr * 1.48} Q${x + hr * 1.08},${headY - hr * 1.5} ${x + hr * 1.02},${cy + hr * 0.05} Z" fill="${V('#2a3448', 0.25, 0.3)}"/>`;
    front += `<path d="M${x - hr * 1.06},${cy - hr * 0.22} Q${x},${cy - hr * 0.42} ${x + hr * 1.06},${cy - hr * 0.22} L${x + hr * 1.04},${cy + hr * 0.08} Q${x},${cy - hr * 0.1} ${x - hr * 1.04},${cy + hr * 0.08} Z" fill="${V('#34405a', 0.2, 0.25)}"/>`;
    for (let i = -8; i <= 8; i++) front += `<path d="M${x + i * hr * 0.12},${cy - hr * 0.3 + Math.abs(i) * hr * 0.008} l0,${hr * 0.3}" stroke="#1e2636" stroke-width="${2.5 * hs}" opacity="0.6"/>`;
    for (let i = -5; i <= 5; i++) front += `<path d="M${x + i * hr * 0.16},${cy - hr * 0.45 - (25 - i * i) * hr * 0.018} l0,${-hr * 0.25}" stroke="#1e2636" stroke-width="${2 * hs}" opacity="0.35"/>`;
    const ey = headY + 2 * hs;
    front += `<path d="M${x - hr * 0.78},${ey + 20 * hs} Q${x - hr * 0.7},${headY + hr * 0.98} ${x},${headY + hr * 0.98} Q${x + hr * 0.7},${headY + hr * 0.98} ${x + hr * 0.78},${ey + 20 * hs}" fill="none" stroke="#5a3a28" stroke-width="${hr * 0.28}" opacity="0.13"/>`;
    if (o.grin) front += `<path d="M${x - 34 * hs},${ey + 46 * hs} Q${x + 6 * hs},${ey + 82 * hs} ${x + 40 * hs},${ey + 40 * hs} Q${x + 4 * hs},${ey + 56 * hs} ${x - 34 * hs},${ey + 46 * hs} Z" fill="#6a2a22"/><path d="M${x - 26 * hs},${ey + 50 * hs} Q${x + 4 * hs},${ey + 58 * hs} ${x + 32 * hs},${ey + 46 * hs}" stroke="#fff" stroke-width="${5 * hs}" fill="none"/>`;
  }
  if (o.nurse) {
    // волосы валиками по бокам, белая шапочка
    front += [-1, 1].map((sd) => `<ellipse cx="${x + sd * hr * 0.88}" cy="${headY - hr * 0.42}" rx="${hr * 0.32}" ry="${hr * 0.4}" fill="${V(o.hair, 0.2, 0.2)}"/>`).join('');
    front += `<path d="M${x - hr * 0.86},${headY - hr * 0.5} Q${x - hr * 0.5},${headY - hr * 1.18} ${x},${headY - hr * 1.12} Q${x + hr * 0.5},${headY - hr * 1.18} ${x + hr * 0.86},${headY - hr * 0.5} Q${x + hr * 0.3},${headY - hr * 0.72} ${x - hr * 0.1},${headY - hr * 0.62} Q${x - hr * 0.5},${headY - hr * 0.7} ${x - hr * 0.86},${headY - hr * 0.5} Z" fill="${o.hair}"/>`;
    front += `<path d="M${x - hr * 0.55},${headY - hr * 1.02} L${x - hr * 0.42},${headY - hr * 1.42} L${x + hr * 0.42},${headY - hr * 1.42} L${x + hr * 0.55},${headY - hr * 1.02} Q${x},${headY - hr * 1.12} ${x - hr * 0.55},${headY - hr * 1.02} Z" fill="${V('#ffffff', 0, 0.1)}" stroke="#d8d6d0" stroke-width="${2 * hs}"/>`;
    front += `<path d="M${x - hr * 0.44},${headY - hr * 1.3} L${x + hr * 0.44},${headY - hr * 1.3}" stroke="#2a2a2a" stroke-width="${5 * hs}"/>`;
    const ey = headY + 2 * hs;
    front += `<path d="M${x - 20 * hs},${ey + 55 * hs} Q${x},${ey + (52 + (o.smile ? 10 : 0)) * hs} ${x + 20 * hs},${ey + 55 * hs}" stroke="#b03a3a" stroke-width="${6 * hs}" fill="none" stroke-linecap="round"/>`;
  }
  if (o.glasses) front += [-1, 1].map((sd) => `<circle cx="${x + sd * 34 * hs}" cy="${headY + 2 * hs}" r="${24 * hs}" fill="none" stroke="#2a2a2a" stroke-width="${4 * hs}"/>`).join('') + `<path d="M${x - 10 * hs},${headY} L${x + 10 * hs},${headY}" stroke="#2a2a2a" stroke-width="${4 * hs}"/>`;
  if (o.bald) front += `<ellipse cx="${x}" cy="${headY - hr * 0.5}" rx="${hr * 0.8}" ry="${hr * 0.5}" fill="${R(o.skin, 0.15, 0.1)}"/>`;
  if (o.braids) front += [-1, 1].map((sd) => `<path d="M${x + sd * hr * 0.9},${headY} Q${x + sd * hr * 1.05},${headY + hr * 1.2} ${x + sd * hr * 0.8},${headY + hr * 2.1}" stroke="${o.hair}" stroke-width="${hr * 0.22}" fill="none" stroke-linecap="round"/>`).join('');
  return { b, front };
}
function figure(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b, smile: o.smile && !o.nurse && !o.grin, robe: o.nurse ? undefined : o.robe });
  if (!front || o.sil) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}>${front}</g>`;
}
const mac = (x, y, s, o = {}) => figure(x, y, s, { ...MAC, ...o });
const ratched = (x, y, s, o = {}) => figure(x, y, s, { ...RATCHED, ...o });
const pat = (i, x, y, s, o = {}) => figure(x, y, s, { ...PAT[i % PAT.length], ...o });

// ---------- окружение ----------
const TILE = '#9cc4b0';
function wardWall(y0 = 0, y1 = 1300, c = TILE, pad = 200) {
  let g = `<rect x="${-pad}" y="${y0}" width="${1080 + 2 * pad}" height="${y1 - y0}" fill="${V(c, 0.05, 0.3)}"/>`;
  const dado = y0 + (y1 - y0) * 0.62;
  g += `<rect x="${-pad}" y="${dado}" width="${1080 + 2 * pad}" height="${y1 - dado}" fill="${V(shade(c, -0.15), 0.05, 0.25)}"/>`;
  for (let y = dado + 40; y < y1; y += 40) g += `<rect x="${-pad}" y="${y}" width="${1080 + 2 * pad}" height="2" fill="#000" opacity="0.08"/>`;
  for (let x = -pad; x < 1080 + pad; x += 40) g += `<rect x="${x}" y="${dado}" width="2" height="${y1 - dado}" fill="#000" opacity="0.06"/>`;
  g += `<rect x="${-pad}" y="${dado - 10}" width="${1080 + 2 * pad}" height="14" fill="${shade(c, -0.3)}"/>`;
  return g;
}
function meshWindow(x, y, w, h, light = '#e8f0f0', t = 0, rain = 0) {
  let g = `<rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" fill="${V('#e8e4da', 0.1, 0.3)}"/>`;
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${grad([[0, light], [1, shade(light, -0.25)]])}"/>`;
  g += glow(x + w / 2, y + h / 2, Math.max(w, h) * 0.8, light, 0.35);
  if (rain) { reseed(31); for (let i = 0; i < 26; i++) { const rx = x + rnd() * w, ry = y + ((rnd() * h + t * 600 * (0.8 + rnd() * 0.4)) % h); g += `<path d="M${rx},${ry} l-6,26" stroke="#fff" stroke-width="2" opacity="${0.35 * rain}"/>`; } }
  for (let i = 1; i < 6; i++) g += `<path d="M${x + (w * i) / 6},${y} L${x + (w * i) / 6},${y + h}" stroke="#3a4040" stroke-width="5" opacity="0.7"/>`;
  for (let i = 1; i < 8; i++) g += `<path d="M${x},${y + (h * i) / 8} L${x + w},${y + (h * i) / 8}" stroke="#3a4040" stroke-width="5" opacity="0.7"/>`;
  g += `<path d="M${x},${y} L${x + w},${y + h} M${x + w},${y} L${x},${y + h}" stroke="#3a4040" stroke-width="1" opacity="0.15"/>`;
  return g;
}
function hospital(x, y, s, lit = 0) {
  // кирпичный корпус: два этажа окон с белыми наличниками и решётками, фронтон, крыльцо, флагшток
  let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  g += `<rect x="-620" y="-760" width="1240" height="760" fill="${V('#9a4a36', 0.1, 0.3)}"/>`;
  for (let r = -750; r < 0; r += 22) g += `<rect x="-620" y="${r}" width="1240" height="2" fill="#5a2a1c" opacity="0.3"/>`;
  g += `<path d="M-200,-760 L0,-900 L200,-760 Z" fill="${V('#8a4030', 0.1, 0.25)}"/><circle cx="0" cy="-805" r="34" fill="#e8e2d4"/><circle cx="0" cy="-805" r="26" fill="#3a3a3a"/>`;
  g += `<rect x="-640" y="-780" width="1280" height="26" fill="#e8e2d4"/>`;
  [-1, 1].forEach(() => {});
  for (const row of [-700, -380]) for (let i = 0; i < 8; i++) {
    const wx = -560 + i * 150;
    if (Math.abs(wx + 45) < 120 && row === -380) continue;
    g += `<rect x="${wx - 8}" y="${row - 8}" width="106" height="206" fill="#e8e2d4"/><rect x="${wx}" y="${row}" width="90" height="190" fill="${lit ? '#ffd890' : '#2a3438'}" opacity="${lit ? 0.4 + 0.5 * ((i * 7 + row) % 3) / 3 : 1}"/>`;
    for (let k = 1; k < 5; k++) g += `<rect x="${wx + k * 18 - 2}" y="${row}" width="4" height="190" fill="#1a1e20"/>`;
    g += `<rect x="${wx}" y="${row + 92}" width="90" height="6" fill="#e8e2d4"/>`;
  }
  g += `<rect x="-120" y="-280" width="240" height="280" fill="#e8e2d4"/><rect x="-90" y="-250" width="180" height="250" fill="${V('#3a2a20', 0.1, 0.2)}"/><rect x="-4" y="-250" width="8" height="250" fill="#1a120c"/>`;
  g += `<rect x="-170" y="-20" width="340" height="20" fill="#cfc8b8"/><rect x="-200" y="0" width="400" height="20" fill="#bdb6a6"/>`;
  return g + `</g>`;
}
function policeCar(x, y, s, door = 0, t = 0) {
  // седан начала 60-х: чёрный низ, белые двери, мигалка, хром, круглые фары
  let g = `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">`;
  g += `<path d="M-420,-40 L-410,-150 Q-300,-170 -220,-170 L-150,-270 Q0,-290 150,-270 L230,-170 Q360,-165 420,-140 L430,-40 Z" fill="${V('#16181c', 0.25, 0.2)}"/>`;
  g += `<path d="M-200,-165 L-140,-255 Q0,-272 140,-255 L210,-165 Z" fill="${V('#9ab0c0', 0.3, 0.2)}"/><rect x="-6" y="-262" width="12" height="98" fill="#16181c"/>`;
  g += `<path d="M-220,-160 L220,-160 L230,-60 L-230,-60 Z" fill="${V('#f0eee8', 0.05, 0.2)}"/>`;
  g += label(-110, -100, 'POLICE', 26, '#16181c', 0.85);
  g += `<rect x="-430" y="-60" width="860" height="22" rx="8" fill="${V('#d8dce0', 0.4, 0.3)}"/>`;
  g += `<circle cx="-415" cy="-110" r="22" fill="#fff6d8"/>${glow(-415, -110, 70, '#fff2c0', 0.5)}`;
  const flash = wave(t, 1.6) > 0 ? 1 : 0.3;
  g += `<rect x="-30" y="-312" width="60" height="30" rx="8" fill="#c82a2a" opacity="${0.6 + 0.4 * flash}"/>${glow(0, -300, 120, '#ff3a30', 0.5 * flash)}`;
  [-270, 270].forEach((wx) => g += `<circle cx="${wx}" cy="-30" r="70" fill="#0c0c0e"/><circle cx="${wx}" cy="-30" r="34" fill="${R('#c8ccd0', 0.3, 0.3)}"/>`);
  // открывающаяся задняя дверь
  if (door > 0) g += `<path d="M10,-160 L${10 + 180 * door},-${160 + 20 * door} L${10 + 180 * door},-${50 - 10 * door} L10,-60 Z" fill="${V('#f0eee8', 0.1, 0.35)}" stroke="#16181c" stroke-width="5"/>`;
  return g + `</g>`;
}
function gate(x, y, w, h, close = 1) {
  // кованые ворота: две створки сходятся к центру
  let g = '';
  [-1, 1].forEach((sd) => {
    const cx = x + sd * (w / 2) * (1 - close * 0.5) - (sd > 0 ? 0 : w / 2), gw = w / 2;
    const ox = sd < 0 ? x - w / 2 - (1 - close) * gw * 0.9 : x + (1 - close) * gw * 0.9;
    g += `<g transform="translate(${ox} 0)"><rect x="0" y="${y - h}" width="${gw}" height="10" fill="#1a1c1e"/><rect x="0" y="${y - 20}" width="${gw}" height="10" fill="#1a1c1e"/>`;
    for (let i = 0; i <= 9; i++) g += `<rect x="${(gw * i) / 9 - 4}" y="${y - h - 30}" width="8" height="${h + 30}" fill="#1a1c1e"/><path d="M${(gw * i) / 9 - 8},${y - h - 30} L${(gw * i) / 9},${y - h - 50} L${(gw * i) / 9 + 8},${y - h - 30} Z" fill="#1a1c1e"/>`;
    g += `</g>`;
    void cx;
  });
  return g;
}
function table(x, y, w, c = '#8a6a48') {
  return `<rect x="${x - w / 2}" y="${y}" width="${w}" height="34" rx="6" fill="${V(c, 0.25, 0.3)}"/><rect x="${x - w / 2 + 30}" y="${y + 34}" width="20" height="280" fill="${shade(c, -0.35)}"/><rect x="${x + w / 2 - 50}" y="${y + 34}" width="20" height="280" fill="${shade(c, -0.35)}"/><rect x="${x - w / 2}" y="${y + 34}" width="${w}" height="10" fill="#000" opacity="0.2"/>`;
}
function card(x, y, s, rot, face = true) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><rect x="-26" y="-36" width="52" height="72" rx="6" fill="${face ? '#fbfaf5' : '#a8282a'}" stroke="#2a2a2a" stroke-width="2"/>${face ? `<text x="-14" y="-12" font-size="20" font-family="serif" fill="#b8282a">♥</text><text x="4" y="28" font-size="22" font-family="serif" fill="#1a1a1a">A</text>` : `<rect x="-20" y="-30" width="40" height="60" rx="4" fill="none" stroke="#f0d8c8" stroke-width="2"/>`}</g>`;
}
function cigs(x, y, n, s = 1) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  for (let i = 0; i < n; i++) g += `<g transform="translate(${(i % 3) * 30 - 30} ${-Math.floor(i / 3) * 16})"><rect x="-26" y="-12" width="52" height="14" rx="3" fill="#f0ece2"/><rect x="16" y="-12" width="12" height="14" rx="2" fill="#d89a5a"/></g>`;
  return g + `</g>`;
}
function tv(x, y, s, on = 0, t = 0) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-150" y="-230" width="300" height="230" rx="14" fill="${V('#6a4a2c', 0.25, 0.35)}"/><rect x="-120" y="-205" width="190" height="160" rx="24" fill="${on ? '#a8c0d0' : '#1c2424'}"/>`;
  if (on) g += [0, 1, 2, 3, 4, 5].map((i) => `<rect x="-120" y="${-205 + ((i * 30 + t * 120) % 160)}" width="190" height="4" fill="#fff" opacity="0.3"/>`).join('');
  else g += `<path d="M-100,-190 Q-60,-200 -40,-170" stroke="#fff" stroke-width="6" opacity="0.15" fill="none"/>`;
  g += `<circle cx="110" cy="-170" r="14" fill="#2a1a10"/><circle cx="110" cy="-120" r="14" fill="#2a1a10"/><rect x="90" y="-90" width="40" height="50" fill="#3a2a1a"/>`;
  g += `<rect x="-130" y="0" width="12" height="80" fill="#2a1a10"/><rect x="118" y="0" width="12" height="80" fill="#2a1a10"/>`;
  return g + `</g>`;
}
function plant(x, y, s, t = 0) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-50,0 L50,0 L40,-90 L-40,-90 Z" fill="${V('#8a5a3a', 0.2, 0.3)}"/>`;
  for (let i = 0; i < 7; i++) { const a = -150 + i * 20 + wave(t, 0.3, i) * 3; g += `<path d="M0,-90 Q${Math.cos((a * Math.PI) / 180) * 80},${-170} ${Math.cos((a * Math.PI) / 180) * 150},${-90 + Math.sin((a * Math.PI) / 180) * 160}" stroke="${V('#4a8a4a', 0.2, 0.2)}" stroke-width="18" fill="none" stroke-linecap="round"/>`; }
  return g + `</g>`;
}
function turntable(x, y, s, t) {
  const a = (t * 200) % 360;
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-90" y="-20" width="180" height="40" rx="6" fill="${V('#4a3424', 0.2, 0.3)}"/><ellipse cx="-10" cy="-22" rx="70" ry="20" fill="#121212"/><g transform="translate(-10 -22) scale(1 0.29) rotate(${a})"><path d="M0,-66 L0,-20" stroke="#fff" stroke-width="5" opacity="0.25"/><circle r="22" fill="#b83a2a"/></g><path d="M70,-30 L30,-26" stroke="#c8ccd0" stroke-width="5"/></g>`;
}
function medCabinet(x, y, s) {
  // шкафчик со склянками; на этикетке нижней полки — пасхалка kinoplot.film
  let g = `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-120" y="-300" width="240" height="300" fill="${V('#e8ece8', 0.05, 0.2)}" stroke="#a8b0ac" stroke-width="4"/>`;
  [-200, -100].forEach((sy) => g += `<rect x="-112" y="${sy}" width="224" height="6" fill="#a8b0ac"/>`);
  const cols = ['#c87a3a', '#4a7a9a', '#8a3a3a', '#e8e4d8', '#4a8a5a', '#c8a84a'];
  [-290, -190, -90].forEach((sy, r) => { for (let i = 0; i < 6; i++) { const bx = -96 + i * 38, h = 50 + ((i + r) % 3) * 14; g += `<rect x="${bx}" y="${sy + 86 - h}" width="28" height="${h}" rx="5" fill="${V(cols[(i + r * 2) % 6], 0.3, 0.25)}" opacity="0.9"/><rect x="${bx + 4}" y="${sy + 86 - h - 10}" width="20" height="12" rx="2" fill="#3a3a3a"/>`; } });
  g += `<rect x="-60" y="-24" width="120" height="18" rx="2" fill="#f4f0e4"/>` + label(0, -11, 'kinoplot.film', 11, '#4a5a54', 0.7);
  g += `<path d="M-120,-300 L-10,-300 L-10,0 L-120,0 Z" fill="#cfe0e8" opacity="0.18"/>`;
  return g + `</g>`;
}
function paperCup(x, y, s, pills = 2) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-26,-44 L26,-44 L18,0 L-18,0 Z" fill="${V('#fbfaf5', 0.05, 0.2)}"/>`;
  for (let i = -3; i <= 3; i++) g += `<path d="M${i * 7},-44 L${i * 5},0" stroke="#d8d4c8" stroke-width="1.5"/>`;
  g += `<ellipse cx="0" cy="-44" rx="26" ry="6" fill="#e8e4d8"/>`;
  const pc = ['#e84a4a', '#f0d040', '#5a9ad8'];
  for (let i = 0; i < pills; i++) g += `<ellipse cx="${-10 + i * 12}" cy="${-46 - (i % 2) * 4}" rx="7" ry="4" fill="${pc[i % 3]}"/>`;
  return g + `</g>`;
}
function chair(x, y, s, c = '#6a7a80') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-60" y="-200" width="120" height="20" rx="6" fill="${shade(c, 0.1)}"/><rect x="-56" y="-180" width="10" height="100" fill="${c}"/><rect x="46" y="-180" width="10" height="100" fill="${c}"/><rect x="-66" y="-90" width="132" height="18" rx="5" fill="${V(c, 0.2, 0.3)}"/><rect x="-60" y="-72" width="10" height="72" fill="${shade(c, -0.3)}"/><rect x="50" y="-72" width="10" height="72" fill="${shade(c, -0.3)}"/></g>`;
}
function chainFence(x0, x1, y0, y1, op = 0.5) {
  let g = `<g opacity="${op}">`;
  for (let x = x0 - (y1 - y0); x < x1; x += 34) g += `<path d="M${x},${y1} L${x + (y1 - y0)},${y0}" stroke="#c8ccd0" stroke-width="2.5"/><path d="M${x},${y0} L${x + (y1 - y0)},${y1}" stroke="#c8ccd0" stroke-width="2.5"/>`;
  g += `<rect x="${x0}" y="${y0 - 6}" width="${x1 - x0}" height="10" fill="#8a8e92"/>`;
  for (let x = x0; x <= x1; x += 260) g += `<rect x="${x - 6}" y="${y0 - 10}" width="12" height="${y1 - y0 + 10}" fill="#7a7e82"/>`;
  return g + `</g>`;
}
function hoop(x, y, s) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-10" y="0" width="20" height="600" fill="#5a5e62"/><rect x="-110" y="-160" width="220" height="150" fill="${V('#f0eee8', 0.05, 0.2)}" stroke="#3a3e42" stroke-width="6"/><rect x="-36" y="-110" width="72" height="56" fill="none" stroke="#c83a2a" stroke-width="6"/>`;
  g += `<ellipse cx="0" cy="-30" rx="62" ry="12" fill="none" stroke="#e05a2a" stroke-width="8"/>`;
  for (let i = -4; i <= 4; i++) g += `<path d="M${i * 15},-28 L${i * 8},40" stroke="#f0f0f0" stroke-width="2.5" opacity="0.8"/>`;
  return g + `</g>`;
}
function ball(x, y, r, rot = 0) { return `<g transform="translate(${x} ${y}) rotate(${rot})"><circle r="${r}" fill="${R('#e0702a', 0.25, 0.3)}"/><path d="M${-r},0 L${r},0 M0,${-r} L0,${r}" stroke="#3a1a0a" stroke-width="${r * 0.08}"/><path d="M${-r * 0.7},${-r * 0.7} Q0,0 ${-r * 0.7},${r * 0.7} M${r * 0.7},${-r * 0.7} Q0,0 ${r * 0.7},${r * 0.7}" stroke="#3a1a0a" stroke-width="${r * 0.07}" fill="none"/></g>`; }
function oscar(x, y, s, lit = 1) {
  let g = glow(x, y - 120 * s, 170 * s, '#ffd870', 0.5 * lit) + `<g transform="translate(${x} ${y}) scale(${s})" opacity="${lit}"><rect x="-34" y="-40" width="68" height="40" rx="4" fill="${V('#3a2a1a', 0.2, 0.3)}"/><rect x="-24" y="-56" width="48" height="16" fill="${V('#c8a040', 0.4, 0.3)}"/>`;
  g += `<path d="M-14,-56 L-10,-150 Q-24,-170 -8,-186 Q-16,-200 0,-214 Q16,-200 8,-186 Q24,-170 10,-150 L14,-56 Z" fill="${V('#f0c850', 0.45, 0.35)}"/><circle cx="0" cy="-226" r="15" fill="${R('#f8d860', 0.4, 0.3)}"/>`;
  g += `<path d="M-6,-150 L6,-150 M-4,-120 L-4,-70 M4,-120 L4,-70" stroke="#a07820" stroke-width="2"/></g>`;
  return g;
}
function filmCamera(x, y, s) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><path d="M0,0 L-80,260 M0,0 L80,260 M0,0 L0,270" stroke="#2a2a2a" stroke-width="10"/>`;
  g += `<rect x="-90" y="-110" width="180" height="110" rx="10" fill="${V('#2a2c30', 0.3, 0.3)}"/><circle cx="-40" cy="-160" r="56" fill="#1a1c20" stroke="#3a3c40" stroke-width="6"/><circle cx="40" cy="-160" r="56" fill="#1a1c20" stroke="#3a3c40" stroke-width="6"/><rect x="90" y="-90" width="80" height="60" rx="6" fill="#1c1c1e"/><circle cx="175" cy="-60" r="26" fill="#0a0a0c" stroke="#4a4c50" stroke-width="5"/>`;
  return g + `</g>`;
}
function spotlight(x, y, s, ang, t) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0,0 L-20,260 M0,0 L20,260" stroke="#2a2a2a" stroke-width="8"/><g transform="rotate(${ang})"><path d="M-10,-30 L-900,-600 L-900,-250 Z" fill="#fff6d8" opacity="${0.08 + 0.03 * wave(t, 0.5)}"/><rect x="-50" y="-60" width="100" height="70" rx="10" fill="#3a3a3a"/><circle cx="-50" cy="-25" r="30" fill="#fff6d8"/>${glow(-50, -25, 90, '#fff6d8', 0.6)}</g></g>`;
}
function birds(t, x0, y0, sp, n = 7, s = 1) {
  let g = '';
  for (let i = 0; i < n; i++) { const row = Math.ceil(i / 2) * (i % 2 ? 1 : -1); const bx = x0 + t * sp - Math.abs(row) * 50 * s, by = y0 + row * 34 * s + wave(t, 0.4, i) * 8; const f = wave(t, 2.4, i * 0.8) * 16 * s; g += `<path d="M${bx - 26 * s},${by - f} Q${bx - 12 * s},${by - 6 * s} ${bx},${by} Q${bx + 12 * s},${by - 6 * s} ${bx + 26 * s},${by - f}" stroke="#2a2a30" stroke-width="${5 * s}" fill="none" stroke-linecap="round"/>`; }
  return g;
}
function rain(t, n = 80, op = 0.3, sd = 3) { reseed(sd); let g = ''; for (let i = 0; i < n; i++) { const x = rnd() * 1200 - 60, y = (rnd() * 2000 + t * 1400 * (0.8 + rnd() * 0.4)) % 2000 - 40; g += `<path d="M${x},${y} l-10,46" stroke="#d8e4f0" stroke-width="2" opacity="${op * (0.5 + rnd() * 0.5)}"/>`; } return g; }
function clouds(t, y, c = '#c8ccd0', op = 0.7, sp = 10) { return `<g filter="url(#blur8)">${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${((i * 300 + t * sp) % 1500) - 200}" cy="${y + (i % 3) * 60}" rx="${220 + (i % 2) * 80}" ry="${50 + (i % 3) * 14}" fill="${c}" opacity="${op}"/>`).join('')}</g>`; }

// ---------- сцены ----------
const shots = {
  // 1. Хук: полицейская машина подъезжает к больнице, Макмёрфи в наручниках выходит и идёт на нас с ухмылкой; за спиной закрываются ворота
  arrival(t, T) {
    const k = sine(t / T);
    const car = io(t / 1.1), door = at(t, 0.2, 0.5), walk = io((t - D - 0.4) / 3.2), shut = at(t, 4.5, 0.9);
    const camX = lerp(40, -30, k);
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(10, -40, k) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#6a747c'], [0.5, '#9aa4a8'], [1, '#b8bcb8']])}"/>`,
        par(camX * 0.2, 0, clouds(t, 150, '#dfe3e4', 0.65, 14)),
        par(camX * 0.35, 0, hospital(540, 1180, 0.82) + `<rect x="${540 + 560 * 0.82}" y="${1180 - 1100}" width="10" height="1100" fill="#d8dce0"/>` + `<path d="M${545 + 560 * 0.82},${100} l80,${10 + wave(t, 0.5) * 6} l0,60 l-80,-10 Z" fill="#a83a3a"/>`),
        par(camX * 0.5, 0, `<rect x="-200" y="1180" width="1480" height="740" fill="${V('#4a5054', 0.1, 0.3)}"/>` + `<rect x="-200" y="1180" width="1480" height="6" fill="#8a9094"/>` + [0, 1, 2, 3].map((i) => `<ellipse cx="${200 + i * 260}" cy="${1300 + i * 90}" rx="${120 + i * 30}" ry="14" fill="#c8d0d8" opacity="0.18"/>`).join('')),
        // ворота за спиной героя (закрываются на «не уходят»)
        par(camX * 0.55, 0, `<rect x="40" y="880" width="40" height="320" fill="#7a3a2a"/><rect x="1000" y="880" width="40" height="320" fill="#7a3a2a"/>` + gate(540, 1200, 920, 260, shut)),
        par(camX * 0.7, 0, policeCar(lerp(1500, 760, car), 1400, 0.85, door, t)),
        // охранник у машины
        par(camX * 0.7, 0, `<g opacity="${car}">${figure(lerp(1300, 940, car), 1440, 0.5, { shirt: '#2a3446', pants: '#1e2632', skin: '#d8a888', hair: '#3a2a1a', beard: false, cap: '#1e2632', frown: 0.6, blink: blink(t, 1) })}</g>`),
        // Макмёрфи идёт на камеру
        par(camX, 0, shadow(lerp(700, 520, walk), lerp(1480, 1960, walk), lerp(90, 240, walk), 0.3) +
          mac(lerp(720, 520, walk), lerp(1480, 2280, walk), lerp(0.5, 1.6, walk), { arms: 'hold', cuffs: true, grin: t > D + 0.6, look: lerp(-0.6, 0.2, walk), wink: t > D + 1.0 && t < D + 1.35, step: wave(t, 1.1) * (1 - walk * 0.7), nod: wave(t, 2.2) * 0.6, blink: blink(t, 0.3) })),
        par(camX * 1.3, 0, rain(t, 50, 0.18)),
        grade('#a8c0d0', 0.25),
        topShade(800, 0.55),
      ],
    };
  },

  // 2. Общая комната: камера плывёт вдоль стола; Макмёрфи качается на стуле, раздаёт карты дугами; на «курортом» закидывает руки за голову
  cards(t, T) {
    const k = sine(t / T), relax = at(t, 5.4, 0.6);
    const camX = lerp(120, -80, k);
    const deal = (i) => { const st = D + 1.9 + i * 0.45, f = io((t - st) / 0.5); return { f, on: t > st }; };
    const targets = [[230, 1500], [380, 1530], [700, 1530], [860, 1500]];
    return {
      cam: { z: lerp(1.32, 1.2, k), y: 240 - 490 * lerp(1.32, 1.2, k) },
      els: [
        par(camX * 0.3, 0, wardWall(0, 1300)),
        par(camX * 0.3, 0, meshWindow(80, 300, 300, 460, '#fff2d0', t) + meshWindow(700, 300, 300, 460, '#fff2d0', t) + glow(540, 700, 700, '#ffe4a8', 0.25)),
        par(camX * 0.3, 0, `<path d="M380,300 L640,1500 L260,1500 L80,760 Z" fill="#fff4d0" opacity="0.07"/>`),
        par(camX * 0.45, 0, tv(950, 1180, 0.8, 1, t) + plant(120, 1240, 0.9, t)),
        par(camX * 0.5, 0, `<rect x="-200" y="1300" width="1480" height="1200" fill="${V('#8a9a8a', 0.05, 0.35)}"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="-200" y="${1330 + i * 90}" width="1480" height="3" fill="#000" opacity="0.08"/>`).join('')),
        // пациенты за столом
        par(camX * 0.6, 0, [[230, 1590, 0], [380, 1600, 1], [700, 1600, 2], [860, 1590, 3]].map(([x, y, i]) => pat(i, x, y, 0.62, { pose: 'sit', arms: 'table', look: (540 - x) / 400, nod: wave(t, 0.6, i) * 0.8, blink: blink(t, i * 0.7), smile: t > D + 4.4 && i % 2 === 0 })).join('')),
        // Макмёрфи качается на стуле
        par(camX * 0.65, 0, `<g transform="rotate(${-4 + wave(t, 0.5) * 3 - relax * 3} 540 1800)">${chair(540, 1700, 0.95, '#6a5a4a')}${mac(540, 1605, 0.78, { pose: 'sit', arms: relax > 0.5 ? 'salute' : 'table', grin: true, look: wave(t, 0.25) * 0.5, closed: relax > 0.7, blink: blink(t, 0.2), nod: wave(t, 1) })}</g>`),
        par(camX * 0.7, 0, table(540, 1520, 980) + label(680, 1512, 'kinoplot.film', 10, '#5a4030', 0.45) +
          cigs(330, 1515, 4, 0.8) + cigs(790, 1515, 3, 0.8) +
          `<g transform="translate(640 1505)"><rect x="-40" y="-26" width="80" height="26" rx="3" fill="#a8282a"/>${label(0, -9, 'kinoplot.film', 9, '#f0d8c8', 0.55)}</g>`),
        // летящие карты по дугам
        par(camX * 0.7, 0, targets.map(([x, y], i) => { const { f, on } = deal(i); if (!on) return ''; const px = lerp(560, x, f), py = lerp(1440, y, f) - Math.sin(f * Math.PI) * 220; return card(px, py, 0.9, lerp(0, 720 + i * 30, f), f > 0.95); }).join('')),
        grade('#ffd8a0', 0.3),
        topShade(800, 0.55),
      ],
    };
  },

  // 3. Стеклянный пост: камера медленно наезжает; по стеклу ползут блики; Рэтчед поворачивается к нам на «Рэтчед»
  station(t, T) {
    const k = sine(t / T), turn = at(t, 1.8, 0.7), cold = at(t, 4.4, 0.8);
    const camX = lerp(-60, 40, k);
    const sweep = ((t * 0.25) % 1.4) - 0.2;
    return {
      cam: { z: lerp(1.0, 1.18, k), y: lerp(40, -60, k) },
      els: [
        par(camX * 0.3, 0, wardWall(0, 1400, '#a8cbbc')),
        // внутри поста
        par(camX * 0.4, 0, `<rect x="120" y="500" width="840" height="900" fill="${V('#cfe0d8', 0.1, 0.3)}"/>` + medCabinet(810, 1060, 1.0) + `<rect x="160" y="600" width="260" height="140" fill="#e8e4d8"/>` + [0, 1, 2, 3].map((i) => `<rect x="${180 + i * 60}" y="620" width="46" height="100" fill="${['#f0d070', '#c8e0e8', '#f0b0a0', '#d8e8c0'][i]}" opacity="0.8"/>`).join('') + glow(540, 640, 420, '#ffffff', 0.25)),
        // Рэтчед
        par(camX * 0.6, 0, ratched(500, 2060, 1.4, { arms: 'table', look: lerp(-1, 0, turn), rot: lerp(-6, 0, turn), rx: 500, ry: 1500, smile: cold > 0.3, blink: blink(t, 1.3), nod: wave(t, 0.3) * 0.4 })),
        par(camX * 0.65, 0, `<rect x="80" y="1500" width="920" height="440" fill="${V('#8a7a64', 0.15, 0.4)}"/><rect x="80" y="1500" width="920" height="16" fill="#b8a88c"/>` + [0, 1, 2].map((i) => `<rect x="${130 + i * 6}" y="${1470 - i * 8}" width="200" height="34" fill="${['#e8e4d8', '#d8d0c0', '#f0ece2'][i]}" transform="rotate(${-4 + i * 3} 230 1490)"/>`).join('') + turntable(330, 1500, 1.1, t) + `<g transform="translate(720 1500)"><rect x="-6" y="-120" width="12" height="120" fill="#2a2a2a"/><rect x="-24" y="-170" width="48" height="60" rx="20" fill="${V('#5a5e62', 0.3, 0.3)}"/></g>` + paperCup(860, 1500, 1.1, 3) + paperCup(930, 1506, 1.0, 2) + `<rect x="560" y="1440" width="90" height="60" rx="4" fill="#3a2a1c"/>`),
        // стекло и блики
        par(camX * 0.8, 0, `<rect x="60" y="440" width="960" height="1060" fill="#e0f4f0" opacity="0.1"/><rect x="60" y="440" width="960" height="1060" fill="none" stroke="#e8e4da" stroke-width="26"/><rect x="530" y="440" width="20" height="1060" fill="#e8e4da"/>` +
          `<path d="M${lerp(-200, 1200, sweep)},440 L${lerp(-200, 1200, sweep) + 160},440 L${lerp(-200, 1200, sweep) - 160},1500 L${lerp(-200, 1200, sweep) - 320},1500 Z" fill="#fff" opacity="0.12"/>` +
          `<path d="M${lerp(-200, 1200, sweep) + 220},440 L${lerp(-200, 1200, sweep) + 260},440 L${lerp(-200, 1200, sweep) - 60},1500 L${lerp(-200, 1200, sweep) - 100},1500 Z" fill="#fff" opacity="0.08"/>` +
          `<rect x="60" y="1420" width="300" height="70" fill="#e8e4da"/>` + label(210, 1465, 'NURSES', 26, '#2a3a34', 0.7)),
        grade('#a8d8e8', 0.25 + 0.2 * cold),
        topShade(820, 0.55),
      ],
    };
  },

  // 4. Очередь за таблетками скользит к окошку → камера плавно уходит вправо к кругу стульев на собрании
  meds(t, T) {
    const pan = io((t - D - 2.6) / 1.4), k = sine(t / T);
    const camX = lerp(0, -1080, pan), drift = lerp(60, -60, k);
    const step = (i) => io(((t * 0.9 + i * 0.25) % 1.6) / 1.6);
    return {
      cam: { z: lerp(1.04, 1.0, k) },
      els: [
        par(camX + drift * 0.3, 0, wardWall(0, 1350)),
        par(camX + 1080 + drift * 0.5, 0, wardWall(0, 1350)),
        // окошко выдачи: рука Рэтчед двигает стаканчики
        par(camX + drift * 0.7, 0, `<rect x="660" y="700" width="380" height="520" fill="${V('#d8e8e0', 0.1, 0.3)}" stroke="#e8e4da" stroke-width="22"/>` + `<g opacity="0.95">${ratched(860, 1500, 0.62, { arms: 'table', look: -1, blink: blink(t, 0.6) })}</g>` + `<rect x="640" y="1140" width="420" height="40" fill="${V('#e0dcd0', 0.2, 0.3)}"/>` + [0, 1, 2].map((i) => paperCup(lerp(980, 780 - i * 70, io(((t + i * 0.6) % 1.8) / 0.8)), 1142, 0.9, 2 + (i % 2))).join('') + turntable(980, 1140, 0.6, t) + glow(900, 1050, 260, '#ffffff', 0.15)),
        // очередь пациентов, шаг вперёд
        par(camX + drift * 0.8, 0, `<rect x="-200" y="1350" width="2600" height="600" fill="${V('#8a9a8c', 0.05, 0.35)}"/>` + [0, 1, 2, 3].map((i) => { const x = 520 - i * 150 + step(i) * 26; return pat(i, x, 1820 - i * 10, 0.82 - i * 0.04, { arms: i === 0 ? 'hold' : 'down', look: 1, nod: -1 + wave(t, 0.5, i) * 0.5, step: wave(t, 0.9, i) * 0.6, worried: true, blink: blink(t, i) }); }).reverse().join('')),
        // крупный стаканчик на «таблетками»
        `<g opacity="${at(t, 2.7, 0.3) * (1 - pan)}">${paperCup(lerp(420, 400, k), 1260, 2.4, 3)}</g>`,
        // круг стульев на собрании (справа)
        par(camX + 1080 + drift * 0.5, 0, chair(160, 1500, 0.9, '#7a8a90') + [[300, 1620, 0], [540, 1660, 1], [780, 1620, 2], [940, 1500, 3]].map(([x, y, i]) => chair(x, y, 1.0, '#7a8a90') + pat(i, x, y - 80, 0.66, { pose: 'sit', arms: 'down', look: (160 - x) / 600, nod: lerp(0, -1.5, at(t, 4.1, 0.6)), worried: true, blink: blink(t, i + 1) })).join('') +
          ratched(160, 1560, 0.72, { arms: 'hold', look: 1, smile: true, blink: blink(t, 2.1) }) + `<rect x="150" y="1300" width="80" height="100" rx="4" fill="#3a2a1c" transform="rotate(-10 190 1350)"/>`),
        grade('#bfe0d8', 0.25),
        topShade(820, 0.55),
      ],
    };
  },

  // 5. Пари: хлопок по рукам, ставки сыплются на стол, кивок в сторону поста, веер карт, смех
  bet(t, T) {
    const k = sine(t / T), slap = at(t, 0.5, 0.35), pile = at(t, 1.5, 0.9), nodTo = at(t, 2.0, 0.5) * (1 - at(t, 3.3, 0.5)), fan = at(t, 4.0, 0.5), laugh = t > D + 4.5;
    const camX = lerp(-50, 50, k);
    return {
      cam: { z: lerp(1.08, 1.25, k), y: 200 - 450 * lerp(1.08, 1.25, k), x: lerp(0, -20, k) },
      els: [
        par(camX * 0.3, 0, wardWall(0, 1300)),
        // пост медсестёр вдали, в нём Рэтчед; подсвечивается на кивок
        par(camX * 0.35, 0, `<rect x="700" y="560" width="340" height="460" fill="${V('#d8ece4', 0.1, 0.3)}" stroke="#e8e4da" stroke-width="16"/>` + ratched(870, 1160, 0.42, { arms: 'table', look: -1, blink: blink(t, 0.9) }) + glow(870, 800, 260, '#ffffff', 0.15 + 0.4 * nodTo)),
        par(camX * 0.5, 0, `<rect x="-200" y="1300" width="1480" height="1200" fill="${V('#8a9a8a', 0.05, 0.35)}"/>`),
        par(camX * 0.6, 0, pat(1, 200, 1660, 0.8, { pose: 'sit', arms: 'table', look: 1, smile: laugh, nod: wave(t, 0.7) * 0.6, blink: blink(t, 0.4) }) + pat(2, 880, 1665, 0.8, { pose: 'sit', arms: 'table', look: -1, worried: !laugh, smile: laugh, nod: wave(t, 0.8, 1) * 0.6, blink: blink(t, 1.5) })),
        par(camX * 0.65, 0, mac(540, 1740, 1.1, { pose: 'sit', arms: 'table', grin: !laugh, smile: laugh, closed: laugh && t < D + 5.1, wink: t > D + 5.2, look: lerp(0, 1, nodTo), nod: laugh ? wave(t, 3) * 1.2 : nodTo * -2, blink: blink(t, 2.2) })),
        par(camX * 0.75, 0, table(540, 1560, 1100, '#7a5a3c') +
          // ставки
          cigs(520, 1560 - (1 - pile) * 160, Math.round(2 + 7 * pile), 1.0) + [0, 1, 2, 3].map((i) => `<circle cx="${620 + i * 22}" cy="${1548 - (1 - at(t, 1.7 + i * 0.12, 0.35)) * 200}" r="14" fill="${R('#c8c8c0', 0.3, 0.3)}" opacity="${at(t, 1.7 + i * 0.12, 0.1)}"/>`).join('') +
          // веер карт
          [0, 1, 2, 3, 4].map((i) => card(300 + fan * 20, 1540, 1.0, lerp(0, -30 + i * 15, fan), true)).join('') +
          // хлопок по рукам над столом
          `<g opacity="${1 - at(t, 1.6, 0.4)}"><circle cx="${lerp(380, 520, slap)}" cy="1440" r="30" fill="${R('#e2b08e')}"/><circle cx="${lerp(700, 560, slap)}" cy="1440" r="30" fill="${R('#d8a888')}"/>${glow(540, 1440, 120 * slap, '#fff', 0.5 * slap * (1 - at(t, 1.0, 0.3)))}</g>`),
        grade('#ffd0a0', 0.3),
        topShade(800, 0.55),
      ],
    };
  },

  // 6. Бунт: пациенты кричат у телевизора → плавный сдвиг во двор: мяч дугой в кольцо, Вождь → наезд на Рэтчед за стеклом, она улыбается
  uproar(t, T) {
    const p1 = io((t - D - 1.4) / 0.9), p2 = io((t - D - 3.3) / 0.9), k = sine(t / T);
    const camX = -1080 * p1 - 1080 * p2, drift = lerp(60, -60, k);
    const jump = (i) => Math.max(0, wave(t, 1.6, i * 1.3)) * 40;
    const bf = clamp((t - D - 1.8) / 1.3);
    return {
      cam: { z: lerp(1.0, 1.1, p2) },
      els: [
        // А: телевизор и вопящие пациенты
        par(camX + drift * 0.6, 0, wardWall(0, 1350) + tv(540, 1150, 1.2, 0, t) + `<rect x="-200" y="1350" width="1480" height="1000" fill="${V('#8a9a8a', 0.05, 0.35)}"/>`),
        par(camX + drift * 0.8, 0, [[200, 1800, 0], [400, 1760, 2], [680, 1760, 3], [880, 1800, 1]].map(([x, y, i]) => pat(i, x, y - jump(i), 0.78, { arms: i % 2 ? 'raise' : 'point', smile: true, look: (540 - x) / 400, blink: false })).join('') + mac(540, 1960 - jump(5), 0.95, { arms: 'raise', smile: true, closed: true })),
        // Б: двор, сетка, кольцо, мяч, Вождь
        par(camX + 1080 + drift * 0.5, 0, `<rect x="-200" width="1480" height="1300" fill="${grad([[0, '#8a98a0'], [1, '#c8d0d0']])}"/>` + clouds(t, 200, '#e8ecec', 0.6, 16) + hospital(540, 1150, 0.6) + `<rect x="-200" y="1150" width="1480" height="1200" fill="${V('#6a6e6a', 0.05, 0.3)}"/>` + chainFence(-200, 1280, 950, 1300, 0.55)),
        par(camX + 1080 + drift * 0.5, 0, hoop(760, 900, 1.0) + figure(780, 1820, 1.05, { ...CHIEF, arms: 'raise', braids: true, look: -0.3, blink: blink(t, 0.8) }) + mac(330, 1830, 0.8, { arms: 'point', grin: true, look: 1 }) +
          (t > D + 1.6 ? ball(lerp(420, 760, bf), lerp(1350, 870, bf) - Math.sin(bf * Math.PI) * 360 + (bf >= 1 ? 120 * io((t - D - 3.1) / 0.4) : 0), 34, t * 400) : '')),
        // В: Рэтчед за стеклом
        par(camX + 2160 + drift * 0.5, 0, wardWall(0, 1400, '#a8cbbc', 40) + `<rect x="-40" y="1400" width="1160" height="1000" fill="${V('#7a8a80', 0.05, 0.35)}"/>` + `<rect x="140" y="500" width="800" height="900" fill="${V('#cfe0d8', 0.1, 0.3)}"/>` + medCabinet(820, 1050, 0.9)),
        par(camX + 2160 + drift * 0.5, 0, ratched(520, 2060, 1.4, { arms: 'table', look: 0, smile: t > D + 4.5, blink: blink(t, 0.6) }) + `<rect x="100" y="1500" width="880" height="500" fill="${V('#8a7a64', 0.15, 0.4)}"/><rect x="100" y="1500" width="880" height="16" fill="#b8a88c"/>` + paperCup(800, 1500, 1.1, 3) + `<rect x="100" y="460" width="880" height="1040" fill="#e0f4f0" opacity="0.1"/><rect x="100" y="460" width="880" height="1040" fill="none" stroke="#e8e4da" stroke-width="24"/>` + `<path d="M${200 + ((t * 120) % 900)},460 l140,0 l-200,1040 l-140,0 Z" fill="#fff" opacity="0.08"/>`),
        grade(p2 > 0.5 ? '#a8d8e8' : '#ffd8a0', 0.25),
        topShade(800, 0.55),
      ],
    };
  },

  // 7. Настоящая больница: кран камеры поднимается от съёмочной группы к фасаду; лучи прожекторов; на «пять» встают пять «Оскаров»
  real(t, T) {
    const k = sine(t / T), crane = io((t - D) / 3.2);
    const os = (i) => at(t, 4.25 + i * 0.12, 0.45);
    return {
      cam: { z: lerp(1.15, 1.0, crane), y: lerp(-160, 40, crane) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#1a2230'], [0.6, '#3a4250'], [1, '#2a2a30']])}"/>`,
        par(lerp(30, -30, k) * 0.3, 0, clouds(t, 160, '#5a6270', 0.5, 12)),
        par(lerp(30, -30, k) * 0.4, 0, hospital(540, 1250, 0.85, 1)),
        par(lerp(30, -30, k) * 0.6, 0, `<rect x="-200" y="1250" width="1480" height="700" fill="${V('#3a3a3e', 0.05, 0.3)}"/>` + spotlight(110, 1500, 1.0, -20 + wave(t, 0.15) * 8, t) + `<g transform="translate(1080 0) scale(-1 1)">${spotlight(110, 1500, 1.0, -24 + wave(t, 0.15, 2) * 8, t)}</g>`),
        par(lerp(30, -30, k) * 0.8, 0, filmCamera(420, 1520, 1.0) + `<g transform="translate(700 1700)"><rect x="-70" y="-120" width="140" height="20" fill="#2a2a2a"/><rect x="-70" y="-200" width="140" height="80" fill="#c8a868"/>${label(0, -150, 'DIRECTOR', 18, '#2a1a0a', 0.8)}<path d="M-70,-100 L-90,0 M70,-100 L90,0 M-70,-100 L90,0 M70,-100 L-90,0" stroke="#2a2a2a" stroke-width="8"/></g>` + figure(560, 1800, 0.62, { shirt: '#5a4a3a', pants: '#2a2a30', skin: '#e0b090', hair: '#2a1a10', beard: true, arms: 'point', look: 1, blink: blink(t, 0.5) })),
        // пять «Оскаров»
        `<g transform="translate(0 ${lerp(0, 0, k)})">${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(0 ${(1 - os(i)) * 140})">${oscar(220 + i * 160, 1420 - (i % 2) * 40, 1.0, os(i))}</g>`).join('')}</g>`,
        grade('#ffd890', 0.2 + 0.2 * os(4)),
        topShade(800, 0.6),
      ],
    };
  },

  // 8. Макмёрфи у окна с решёткой: камера подъезжает из-за плеча; дождь стихает, выходит свет, пролетает стая; в стекле — отражение Рэтчед
  window(t, T) {
    const k = sine(t / T), clear = at(t, 0.9, 1.6), refl = at(t, 2.5, 0.8);
    return {
      cam: { z: lerp(1.0, 1.16, k), y: lerp(40, -40, k), x: lerp(30, -10, k) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#5a6a64', 0.05, 0.4)}"/>`,
        // окно: небо светлеет, стая птиц
        `<rect x="190" y="320" width="700" height="1000" fill="${grad([[0, lerp(0, 1, clear) > 0.5 ? '#f0e0b0' : '#7a8a94'], [1, '#c8ccc8']])}"/>`,
        `<rect x="190" y="320" width="700" height="1000" fill="${grad([[0, '#7a8a94'], [1, '#a8b0b4']])}" opacity="${1 - clear}"/>`,
        glow(640, 520, 520, '#fff0c0', 0.6 * clear),
        `<g opacity="${0.7}">${clouds(t, 520, '#e8ecec', 0.5 * (1 - clear * 0.5), 20)}</g>`,
        `<rect x="190" y="1000" width="700" height="320" fill="${V('#4a6a4a', 0.1, 0.3)}"/>` + `<path d="M190,1040 Q400,980 640,1030 T890,1010 L890,1320 L190,1320 Z" fill="#3a5a3a"/>`,
        birds(t - D - 1.0, 120, 640, 260, 9, 1.2),
        `<g opacity="${1 - clear}">${rain(t, 40, 0.35, 5)}</g>`,
        // отражение Рэтчед в стекле
        `<g opacity="${0.22 * refl}">${ratched(380, 1500, 0.9, { arms: 'hold', look: 1, smile: true, sil: silFilter('#f8fbff') })}</g>`,
        // решётка и рама
        `<rect x="190" y="320" width="700" height="1000" fill="none" stroke="#e8e4da" stroke-width="40"/>` + [1, 2, 3, 4, 5].map((i) => `<rect x="${190 + i * 116 - 7}" y="320" width="14" height="1000" fill="${V('#2a2e30', 0.3, 0.3)}"/>`).join('') + [1, 2, 3].map((i) => `<rect x="190" y="${320 + i * 250 - 7}" width="700" height="14" fill="${V('#2a2e30', 0.3, 0.3)}"/>`).join(''),
        `<rect x="130" y="1320" width="820" height="40" fill="${V('#e8e4da', 0.1, 0.3)}"/>`,
        `<path d="M190,320 L890,320 L1080,1920 L0,1920 Z" fill="#fff0c0" opacity="${0.06 * clear}"/>`,
        // Макмёрфи у окна, руки на решётке, оглядывается на «система»
        mac(lerp(560, 540, k), 2280, 1.5, { arms: 'down', look: lerp(0, -0.6, refl), lookUp: 1 - refl, grin: false, frown: lerp(-0.2, 0.4, refl), blink: blink(t, 0.4), nod: wave(t, 0.4) * 0.5 }),
        grade(clear > 0.5 ? '#ffe0a8' : '#a8c0d0', 0.25),
        topShade(820, 0.55),
      ],
    };
  },
};

run(shots);
