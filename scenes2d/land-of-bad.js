// «Территория зла» (Land of Bad, 2023) — 8 планов в 2D-векторе. Имя плана = set сцены в videos/land-of-bad/script.json.
// Джунгли Филиппин: влажная зелёная дымка, лучи сквозь кроны. Кабина дрона в Неваде: темнота, голубые мониторы, закат в двери.
import { run, person, setProportions, V, R, grad, glow, silFilter, smoke, rnd, reseed, shade, lerp, ease, clamp, wave } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// ---------- персонажи ----------
const KINNEY = { shirt: '#8c8664', pants: '#7c7556', vest: '#6a664a', helmet: '#706a4e', skin: '#e6b08c', hair: '#5a3e28', iris: '#4a5a6a', beard: false, frown: 0.25, multicam: true, headset: true };
const OP = (o = {}) => ({ shirt: '#7e785a', pants: '#6e684c', vest: '#5a5640', skin: '#d8a07a', hair: '#2a1e16', iris: '#2a1a12', beard: true, frown: 0.35, multicam: true, cap: '#5a5844', ...o });
const REAPER = { shirt: '#4d5644', pants: '#454d3c', skin: '#e2a888', hair: '#5a544e', iris: '#5a86a0', beard: true, beardC: '#c8c0b4', frown: 0.2, flight: true, aviators: true, headphones: true };
const FIGHTER = { shirt: '#2a2a26', pants: '#22221e', skin: '#b07a54', hair: '#141210', beard: true, frown: 0.5, cap: '#1e1e1a' };

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const D = 0.13; // AUDIO_DELAY
const at = (t, a, d = 0.35) => ease(clamp((t - a - D) / d));
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const layer = (op, inner) => op <= 0.001 ? '' : `<g opacity="${op.toFixed(3)}">${inner}</g>`;

function geo(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const pose = o.pose || 'stand';
  const legH = (pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  const headY = top - hr * 0.8 + (o.nod || 0) * 6 * hs;
  return { hs, hr, top, ty, headY, ey: headY + 2 * hs };
}
// одежда и снаряжение поверх базовой фигуры
function dress(x, y, s, o) {
  const { hr, hs, top, ty, headY, ey } = geo(x, y, s, o);
  const sh = o.shirt, dk = shade(sh, -0.4);
  let b = '', front = '';
  if (o.multicam) {
    // камуфляж мультикам: пятна на торсе
    reseed(31);
    for (let i = 0; i < 14; i++) { const px = x + (rnd() - 0.5) * 170 * s, py = top + 20 * s + rnd() * (ty - top - 20 * s); b += `<ellipse cx="${px}" cy="${py}" rx="${(14 + rnd() * 16) * s}" ry="${(8 + rnd() * 10) * s}" fill="${rnd() < 0.5 ? '#5e5a40' : '#a69c74'}" opacity="0.55" transform="rotate(${rnd() * 60 - 30} ${px} ${py})"/>`; }
    // бронежилет с подсумками
    b += `<path d="M${x - 84 * s},${ty + 4 * s} L${x - 92 * s},${top + 46 * s} Q${x},${top + 20 * s} ${x + 92 * s},${top + 46 * s} L${x + 84 * s},${ty + 4 * s} Z" fill="${V(o.vest || '#5a5640', 0.15, 0.25)}"/>`;
    [-56, 0, 56].forEach((dx) => b += `<rect x="${x + (dx - 24) * s}" y="${ty - 100 * s}" width="${48 * s}" height="${70 * s}" rx="${7 * s}" fill="${V(shade(o.vest || '#5a5640', 0.12), 0.2, 0.2)}" stroke="${shade(o.vest || '#5a5640', -0.35)}" stroke-width="${2 * s}"/><rect x="${x + (dx - 24) * s}" y="${ty - 100 * s}" width="${48 * s}" height="${16 * s}" rx="${5 * s}" fill="${shade(o.vest || '#5a5640', -0.15)}"/>`);
    b += `<rect x="${x - 96 * s}" y="${ty - 18 * s}" width="${192 * s}" height="${22 * s}" rx="${5 * s}" fill="#3a3828"/><rect x="${x - 14 * s}" y="${ty - 20 * s}" width="${28 * s}" height="${26 * s}" rx="${3 * s}" fill="#8a8670"/>`;
    // лямки и рация на груди
    b += `<rect x="${x + 30 * s}" y="${top + 50 * s}" width="${30 * s}" height="${56 * s}" rx="${5 * s}" fill="#24241e"/><rect x="${x + 40 * s}" y="${top + 12 * s}" width="${6 * s}" height="${40 * s}" fill="#1a1a16"/>`;
  }
  if (o.flight) {
    // лётный комбинезон: гавайская рубашка в вороте, нашивки, молния
    b += `<path d="M${x - 50 * s},${top - 6 * s} L${x},${top + 118 * s} L${x + 50 * s},${top - 6 * s} Z" fill="#e08a4a"/>`;
    reseed(17);
    for (let i = 0; i < 9; i++) { const px = x + (rnd() - 0.5) * 70 * s, py = top + rnd() * 90 * s; b += `<circle cx="${px}" cy="${py}" r="${(5 + rnd() * 7) * s}" fill="${['#f4d06a', '#2e7a5a', '#c8452e', '#f6efe0'][i % 4]}" opacity="0.9"/>`; }
    b += `<path d="M${x - 70 * s},${top - 10 * s} L${x - 6 * s},${top + 130 * s} L${x - 40 * s},${top + 136 * s} L${x - 104 * s},${top + 30 * s} Z M${x + 70 * s},${top - 10 * s} L${x + 6 * s},${top + 130 * s} L${x + 40 * s},${top + 136 * s} L${x + 104 * s},${top + 30 * s} Z" fill="${V(shade(sh, 0.12), 0.15, 0.25)}"/>`;
    b += `<path d="M${x},${top + 130 * s} L${x},${ty}" stroke="${dk}" stroke-width="${3 * s}"/>`;
    b += `<rect x="${x + 40 * s}" y="${top + 70 * s}" width="${50 * s}" height="${32 * s}" rx="${4 * s}" fill="#2a2e44"/><path d="M${x + 44 * s},${top + 74 * s} h${42 * s} M${x + 44 * s},${top + 82 * s} h${42 * s} M${x + 44 * s},${top + 90 * s} h${42 * s}" stroke="#b83a34" stroke-width="${3 * s}"/>`;
    b += `<rect x="${x - 88 * s}" y="${top + 72 * s}" width="${46 * s}" height="${30 * s}" rx="${4 * s}" fill="#2a2a26"/>`;
  }
  if (o.beardC) front += `<path d="M${x - hr * 0.88},${headY + 5 * hs} Q${x - hr * 0.85},${headY + hr * 1.25} ${x},${headY + hr * 1.22} Q${x + hr * 0.85},${headY + hr * 1.25} ${x + hr * 0.88},${headY + 5 * hs} Q${x + hr * 0.6},${headY + hr * 0.45} ${x},${headY + hr * 0.5} Q${x - hr * 0.6},${headY + hr * 0.45} ${x - hr * 0.88},${headY + 5 * hs} Z" fill="${o.beardC}"/><path d="M${x - 28 * hs},${ey + 50 * hs} Q${x},${ey + 40 * hs} ${x + 28 * hs},${ey + 50 * hs}" stroke="${shade(o.beardC, -0.1)}" stroke-width="${11 * hs}" fill="none" stroke-linecap="round"/>`;
  if (o.yawn) front += `<ellipse cx="${x}" cy="${ey + 58 * hs}" rx="${16 * hs}" ry="${22 * hs * o.yawn}" fill="#5a2420"/>`;
  if (o.headphones) {
    // зелёные лётные наушники с микрофоном
    front += `<path d="M${x - hr * 1.05},${headY} Q${x - hr * 1.1},${headY - hr * 1.35} ${x},${headY - hr * 1.32} Q${x + hr * 1.1},${headY - hr * 1.35} ${x + hr * 1.05},${headY}" stroke="#2a2c2a" stroke-width="${12 * hs}" fill="none"/>`;
    [-1, 1].forEach((sd) => front += `<rect x="${x + sd * hr * 1.02 - 22 * hs}" y="${headY - 34 * hs}" width="${44 * hs}" height="${76 * hs}" rx="${18 * hs}" fill="${V('#5f9a78', 0.25, 0.3)}"/><rect x="${x + sd * hr * 1.02 - 6 * hs}" y="${headY - 20 * hs}" width="${12 * hs}" height="${44 * hs}" rx="${4 * hs}" fill="#d8e0d4" opacity="0.7"/>`);
    front += `<path d="M${x - hr * 1.0},${headY + 30 * hs} Q${x - hr * 0.9},${headY + hr * 0.95} ${x - 30 * hs},${headY + hr * 0.82}" stroke="#1e1e1e" stroke-width="${6 * hs}" fill="none"/><ellipse cx="${x - 22 * hs}" cy="${headY + hr * 0.8}" rx="${16 * hs}" ry="${10 * hs}" fill="#141414"/>`;
  }
  if (o.headset) {
    // гарнитура поверх каски
    [-1, 1].forEach((sd) => front += `<rect x="${x + sd * hr * 1.0 - 18 * hs}" y="${headY - 20 * hs}" width="${36 * hs}" height="${58 * hs}" rx="${14 * hs}" fill="${V('#4a4a3c', 0.2, 0.3)}"/>`);
    front += `<path d="M${x + hr * 1.0},${headY + 30 * hs} Q${x + hr * 0.85},${headY + hr * 0.9} ${x + 34 * hs},${headY + hr * 0.78}" stroke="#1e1e1a" stroke-width="${5 * hs}" fill="none"/><circle cx="${x + 30 * hs}" cy="${headY + hr * 0.78}" r="${8 * hs}" fill="#1a1a16"/>`;
  }
  if (o.dirt) front += `<path d="M${x - hr * 0.6},${headY + hr * 0.2} q${20 * hs},${10 * hs} ${36 * hs},${-4 * hs} M${x + hr * 0.3},${headY - hr * 0.3} q${18 * hs},${8 * hs} ${30 * hs},${2 * hs}" stroke="#5a4630" stroke-width="${7 * hs}" stroke-linecap="round" opacity="0.6"/><ellipse cx="${x + hr * 0.5}" cy="${headY + hr * 0.45}" rx="${18 * hs}" ry="${9 * hs}" fill="#6a5238" opacity="0.4"/>`;
  if (o.sweat) front += [0.4, -0.55].map((k, i) => `<ellipse cx="${x + k * hr}" cy="${headY - hr * 0.15 + ((o.sweat * 40 + i * 20) % 40) * hs}" rx="${4 * hs}" ry="${7 * hs}" fill="#dff2ff" opacity="0.7"/>`).join('');
  if (o.aviators) {
    const lk = o.look || 0;
    [-1, 1].forEach((sd) => { const ex = x + sd * 34 * hs + lk * 8 * hs; front += `<path d="M${ex - 28 * hs},${ey - 18 * hs} L${ex + 28 * hs},${ey - 18 * hs} Q${ex + 30 * hs},${ey + 22 * hs} ${ex + sd * 4 * hs},${ey + 24 * hs} Q${ex - 30 * hs},${ey + 20 * hs} ${ex - 28 * hs},${ey - 18 * hs} Z" fill="#cfe6f0" fill-opacity="0.18" stroke="#d4ac58" stroke-width="${3.5 * hs}"/>`; });
    front += `<path d="M${x - 8 * hs + lk * 8 * hs},${ey - 16 * hs} L${x + 8 * hs + lk * 8 * hs},${ey - 16 * hs} M${x - 8 * hs + lk * 8 * hs},${ey - 8 * hs} Q${x + lk * 8 * hs},${ey - 14 * hs} ${x + 8 * hs + lk * 8 * hs},${ey - 8 * hs}" stroke="#d4ac58" stroke-width="${3 * hs}" fill="none"/>`;
  }
  return { b, front };
}
function figure(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, beard: o.beardC ? false : o.beard, overlay: b });
  if (!front || o.sil) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}>${front}</g>`;
}
// антенна рации за спиной (рисовать до фигуры)
function antenna(x, y, s, o = {}, sway = 0) {
  const { top } = geo(x, y, s, o);
  const bx = x - 70 * s, by = top + 40 * s;
  return `<path d="M${bx},${by} Q${bx - 20 * s + sway * 10},${by - 220 * s} ${bx - 50 * s + sway * 30},${by - 430 * s}" stroke="#1a1a16" stroke-width="${6 * s}" fill="none" stroke-linecap="round"/><rect x="${bx - 40 * s}" y="${by}" width="${80 * s}" height="${120 * s}" rx="${10 * s}" fill="${V('#4a4a3a', 0.2, 0.3)}"/>`;
}
const kinney = (x, y, s, o = {}) => figure(x, y, s, { ...KINNEY, ...o });
const reaper = (x, y, s, o = {}) => figure(x, y, s, { ...REAPER, ...o });

// ---------- джунгли ----------
function fern(x, y, s, c = '#2e5a32', sw = 0) {
  let g = '';
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.95 + i * Math.PI * 0.9 / 6 + sw * 0.06, l = (150 + (i % 3) * 40) * s;
    const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l * 0.8;
    g += `<path d="M${x},${y} Q${(x + ex) / 2},${ey - 40 * s} ${ex},${ey}" stroke="${c}" stroke-width="${16 * s}" fill="none" stroke-linecap="round"/>`;
    for (let k = 1; k < 6; k++) { const f = k / 6, px = lerp(x, ex, f), py = lerp(y, ey, f) - Math.sin(f * Math.PI) * 30 * s; g += `<ellipse cx="${px}" cy="${py}" rx="${22 * s * (1 - f * 0.5)}" ry="${8 * s}" fill="${shade(c, 0.12)}" transform="rotate(${(a * 180) / Math.PI + 60} ${px} ${py})"/>`; }
  }
  return g;
}
function bigLeaf(x, y, s, rot, c = '#1f4a2a') {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0,0 Q120,-90 300,-20 Q140,60 0,0 Z" fill="${V(c, 0.2, 0.3)}"/><path d="M0,0 Q150,-20 290,-20" stroke="${shade(c, 0.25)}" stroke-width="4" fill="none"/></g>`;
}
function trunk(x, w, c = '#3a3224', top = -100, bottom = 1920, lean = 0) {
  return `<path d="M${x - w / 2},${bottom} L${x - w * 0.42 + lean},${top} L${x + w * 0.42 + lean},${top} L${x + w / 2},${bottom} Z" fill="${V(c, 0.1, 0.35)}"/><path d="M${x - w * 0.2},${bottom} L${x - w * 0.15 + lean},${top}" stroke="${shade(c, 0.15)}" stroke-width="${w * 0.08}" opacity="0.5"/>`;
}
function vine(x, y0, len, t, ph = 0, c = '#2c4a26') {
  const sw = wave(t, 0.25, ph) * 14;
  return `<path d="M${x},${y0} Q${x + sw},${y0 + len * 0.5} ${x + sw * 0.4},${y0 + len}" stroke="${c}" stroke-width="7" fill="none"/>` + [0.3, 0.55, 0.8].map((k) => `<ellipse cx="${x + sw * k}" cy="${y0 + len * k}" rx="16" ry="8" fill="${shade(c, 0.1)}" transform="rotate(30 ${x + sw * k} ${y0 + len * k})"/>`).join('');
}
function rays(x, y, n, t, c = '#fff4c8', op = 0.16) {
  let g = '';
  for (let i = 0; i < n; i++) { const dx = (i - n / 2) * 140, w = 40 + (i % 3) * 30; g += `<path d="M${x + dx},${y} L${x + dx + w},${y} L${x + dx + 420 + w * 2},${y + 1700} L${x + dx + 320},${y + 1700} Z" fill="${grad([[0, c, op * (0.7 + 0.3 * wave(t, 0.15, i))], [1, c, 0]])}"/>`; }
  return `<g filter="url(#blur8)">${g}</g>`;
}
function mist(y, t, c = '#cfe2cc', op = 0.35, n = 6) {
  reseed(7);
  let g = '';
  for (let i = 0; i < n; i++) g += `<ellipse cx="${(rnd() * 1300 + t * (10 + rnd() * 14)) % 1400 - 160}" cy="${y + rnd() * 160}" rx="${260 + rnd() * 200}" ry="${40 + rnd() * 40}" fill="${c}" opacity="${op * (0.5 + rnd() * 0.5)}"/>`;
  return `<g filter="url(#blur20)">${g}</g>`;
}
function canopy(y, c, t, seed = 3, h = 120) {
  reseed(seed);
  let g = `<rect x="0" y="${y + h * 0.4}" width="1080" height="${1920 - y}" fill="${shade(c, -0.15)}"/>`;
  for (let i = 0; i < 18; i++) { const cx = -60 + i * 70 + rnd() * 40, r = h * (0.6 + rnd() * 0.6); g += `<circle cx="${cx}" cy="${y + rnd() * h * 0.6 + wave(t, 0.2, i) * 3}" r="${r}" fill="${V(c, 0.18, 0.3)}"/>`; }
  return g;
}
function palm(x, y, h, sw = 0, c = '#1e3a2a') {
  let g = `<path d="M${x},${y} Q${x + 18},${y - h * 0.5} ${x + 10 + sw * 6},${y - h}" stroke="${shade(c, -0.1)}" stroke-width="${h * 0.035}" fill="none"/>`;
  for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8 + sw * 0.05, l = h * 0.34; const ex = x + 10 + sw * 6 + Math.cos(a) * l, ey = y - h + Math.sin(a) * l * 0.5 + l * 0.38; g += `<path d="M${x + 10 + sw * 6},${y - h} Q${(x + 10 + ex) / 2},${y - h - l * 0.25} ${ex},${ey}" stroke="${c}" stroke-width="${h * 0.03}" fill="none" stroke-linecap="round"/>`; }
  return g;
}
// геликония: красно-оранжевые «клювы» на стебле
function heliconia(x, y, s, sw = 0) {
  let g = `<path d="M${x},${y} Q${x + sw * 8},${y - 120 * s} ${x + sw * 14},${y - 220 * s}" stroke="#2e5a2a" stroke-width="${7 * s}" fill="none"/>`;
  for (let i = 0; i < 4; i++) { const yy = y - (90 + i * 36) * s, sd = i % 2 ? 1 : -1, xx = x + sw * (4 + i * 3); g += `<path d="M${xx},${yy} L${xx + sd * 46 * s},${yy - 12 * s} L${xx + sd * 8 * s},${yy + 14 * s} Z" fill="${V(i % 2 ? '#e2452e' : '#f08a3c', 0.25, 0.2)}"/><path d="M${xx + sd * 40 * s},${yy - 10 * s} l${sd * 6 * s},${-2 * s}" stroke="#f4d040" stroke-width="${4 * s}"/>`; }
  return g;
}
// подлесок: широкие листья у земли
function bush(x, y, s, c, t, ph = 0) {
  let g = '';
  for (let i = 0; i < 6; i++) g += bigLeaf(x, y, s * (0.6 + (i % 3) * 0.15), -170 + i * 32 + wave(t, 0.3, ph + i) * 3, shade(c, (i % 2) * 0.08));
  return g;
}
function jungleBack(t, tone = 'day') {
  const day = tone === 'day';
  const fog = day ? '#a8c4a8' : '#2a4234';
  return [
    sky(day ? [[0, '#8fb8a0'], [0.5, '#c8dcc0'], [1, '#e8e4c4']] : [[0, '#0c1a14'], [0.6, '#1e3226'], [1, '#2c4430']], 1920),
    canopy(140, day ? '#4a7a52' : '#1a3020', t, 3, 160),
    // дальний ряд стволов и пальм в дымке
    `<g opacity="0.45">${[80, 330, 520, 760, 1000].map((x, i) => trunk(x, 26 + (i % 2) * 10, shade(fog, -0.25), 200, 1200, (i % 3 - 1) * 8)).join('')}</g>`,
    palm(230, 1100, 520, wave(t, 0.2), fog), palm(860, 1080, 480, wave(t, 0.2, 1), fog),
    mist(480, t, day ? '#e8f0dc' : '#3a5444', 0.5),
    trunk(140, 60, day ? '#5a5a46' : '#1c2218', -100, 1920, 10), trunk(880, 80, day ? '#55543e' : '#1a2016', -100, 1920, -14), trunk(620, 44, day ? '#6a6a52' : '#202820', -100, 1920),
    vine(200, 0, 900, t, 0.5, day ? '#2c4a26' : '#0e1e12'), vine(700, 0, 760, t, 2, day ? '#2c4a26' : '#0e1e12'),
    canopy(700, day ? '#3e6a44' : '#16281a', t, 5, 200),
    mist(960, t, day ? '#dcead0' : '#2c4636', 0.45),
    palm(80, 1500, 600, wave(t, 0.25, 2), day ? '#2a5434' : '#122418'), palm(1010, 1480, 560, wave(t, 0.25, 3), day ? '#2a5434' : '#122418'),
    bush(160, 1520, 1.0, day ? '#2e5e36' : '#132a1a', t, 0), bush(920, 1500, 1.1, day ? '#2a5832' : '#112616', t, 2),
    day ? heliconia(330, 1560, 1.1, wave(t, 0.3)) + heliconia(780, 1540, 0.9, wave(t, 0.3, 1)) : '',
  ].join('');
}

// ---------- техника ----------
// MQ-9: вид сбоку — тонкий фюзеляж, длинное крыло, V-хвост, винт сзади, шар камеры под носом
function drone(x, y, s, t, c = '#8a9096') {
  const prop = 60 * Math.abs(wave(t, 6));
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">
    <path d="M-260,0 Q-250,-34 -160,-38 L220,-22 Q260,-18 262,0 Q240,16 -180,18 Q-262,16 -260,0 Z" fill="${V(c, 0.25, 0.3)}"/>
    <path d="M-40,-16 L40,-16 L120,-6 L-60,-6 Z" fill="${shade(c, -0.25)}"/>
    <path d="M-60,-8 L-420,10 L-410,22 L-40,8 Z M40,-8 L420,10 L410,22 L60,8 Z" fill="${V(shade(c, 0.05), 0.2, 0.3)}" opacity="0.9"/>
    <path d="M200,-18 L280,-90 L298,-86 L240,-14 Z M200,10 L280,70 L296,64 L240,6 Z" fill="${shade(c, -0.1)}"/>
    <circle cx="-200" cy="26" r="20" fill="#2a2e34"/><circle cx="-206" cy="22" r="8" fill="#6aa0c8"/>
    <rect x="262" y="-${prop}" width="8" height="${prop * 2}" rx="4" fill="#3a3e44" opacity="0.55"/>
    <rect x="-120" y="20" width="40" height="18" rx="6" fill="#4a4e54"/><rect x="60" y="20" width="40" height="18" rx="6" fill="#4a4e54"/>
  </g>`;
}
// «Блэк Хоук»
function heli(x, y, s, t, c = '#1e2420', rot = -4) {
  const blade = 300 + 120 * Math.abs(wave(t, 3));
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${rot})"><path d="M-140,-20 Q-150,-70 -60,-74 L80,-70 Q140,-60 150,-10 Q150,30 80,36 L-120,36 Q-150,30 -140,-20 Z" fill="${V(c, 0.15, 0.3)}"/><path d="M-120,-56 L-40,-58 L-40,-12 L-130,-12 Z" fill="#3e5a66" opacity="0.8"/><path d="M140,-30 L360,-46 L362,-30 L150,4 Z" fill="${c}"/><path d="M350,-48 L380,-110 L396,-108 L372,-36 Z" fill="${c}"/><rect x="-20" y="-96" width="70" height="26" rx="8" fill="${c}"/><rect x="${-blade}" y="-104" width="${blade * 2}" height="7" rx="3" fill="${c}" opacity="0.55"/><circle cx="382" cy="-80" r="${36 + 8 * wave(t, 5)}" fill="${c}" opacity="0.2"/><path d="M-100,40 v24 h170 v-24" stroke="${c}" stroke-width="7" fill="none"/></g>`;
}
// пульт управления: монитор с картинкой
function monitor(x, y, w, h, inner, bezel = '#14161a') {
  return `<g filter="url(#soft)"><rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" rx="12" fill="${V(bezel, 0.15, 0.3)}"/><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${inner}</svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${grad([[0, '#fff', 0.08], [0.5, '#fff', 0], [1, '#fff', 0.03]])}"/></g>`;
}
// тепловизор сверху: кроны серым, белые точки — люди, перекрестие, телеметрия
function thermal(w, h, t, o = {}) {
  reseed(o.seed || 9);
  let g = `<rect width="${w}" height="${h}" fill="${grad([[0, '#2c322e'], [1, '#1a1e1c']])}"/>`;
  for (let i = 0; i < 70; i++) { const cx = rnd() * w, cy = rnd() * h, r = 30 + rnd() * 70; g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${rnd() < 0.5 ? '#3c4440' : '#262c28'}" opacity="0.8"/>`; }
  g += `<path d="M${-20},${h * 0.7} Q${w * 0.3},${h * 0.55} ${w * 0.5},${h * 0.62} T${w + 20},${h * 0.45}" stroke="#4e5852" stroke-width="18" fill="none" opacity="0.7"/>`;
  const hx = o.hx ?? w / 2, hy = o.hy ?? h / 2;
  (o.enemies || []).forEach(([ex, ey]) => { g += glow(ex, ey, 26, '#ff5a46', 0.9) + `<circle cx="${ex}" cy="${ey}" r="7" fill="#ffd2c8"/><rect x="${ex - 16}" y="${ey - 16}" width="32" height="32" fill="none" stroke="#ff5a46" stroke-width="3"/>`; });
  g += glow(hx, hy, 40, '#ffffff', 0.95) + `<circle cx="${hx}" cy="${hy}" r="9" fill="#fff"/>`;
  const cs = o.cross ?? 1;
  g += `<g stroke="#cfe8d8" stroke-width="3" opacity="0.9" fill="none"><path d="M${hx - 140 * cs},${hy} h${100 * cs} M${hx + 40 * cs},${hy} h${100 * cs} M${hx},${hy - 140 * cs} v${100 * cs} M${hx},${hy + 40 * cs} v${100 * cs}"/><rect x="${hx - 70 * cs}" y="${hy - 70 * cs}" width="${140 * cs}" height="${140 * cs}" stroke-dasharray="24 92"/></g>`;
  g += `<g font-family="'Courier New', monospace" font-size="${Math.round(w / 34)}" fill="#cfe8d8" opacity="0.85"><text x="${w * 0.04}" y="${h * (o.hudY ?? 0.07)}">MQ-9  ALT 18500</text><text x="${w * 0.04}" y="${h * ((o.hudY ?? 0.07) + 0.05)}">WHT HOT  ${(12.4 + t * 0.07).toFixed(2)}</text><text x="${w * 0.62}" y="${h * (o.hudY ?? 0.07)}">N 06°02'</text><text x="${w * 0.62}" y="${h * ((o.hudY ?? 0.07) + 0.05)}">E 121°0${Math.floor(t) % 10}'</text><text x="${w * 0.04}" y="${h * 0.95}">REC ●</text></g>`;
  g += `<rect width="${w}" height="${h}" fill="url(#scan)" opacity="0.35"/>`;
  return g;
}
function defsScan() { return `<defs><pattern id="scan" width="4" height="6" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000"/></pattern></defs>`; }
// пустыня Невады на закате (в двери/за окном)
function desert(x, y, w, h, t) {
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice"><rect width="400" height="600" fill="${grad([[0, '#3a2a5a'], [0.45, '#e2744a'], [0.62, '#f8c27a']])}"/>${glow(260, 360, 160, '#ffe2a8', 0.9)}<circle cx="260" cy="360" r="40" fill="#fff0c8"/><path d="M0,380 L60,330 L120,360 L200,300 L280,350 L340,320 L400,350 L400,600 L0,600 Z" fill="#6a3a4a"/><path d="M0,430 L400,420 L400,600 L0,600 Z" fill="${grad([[0, '#c87a4a'], [1, '#7a4430']])}"/><rect x="60" y="370" width="6" height="70" fill="#2a1e24"/><path d="M40,370 h46" stroke="#2a1e24" stroke-width="5"/><circle cx="${300 + t * 4}" cy="200" r="3" fill="#2a1e24"/></svg>`;
}
// красная кнопка / джойстик
function joystick(x, y, s, tilt = 0) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-70" y="-10" width="140" height="40" rx="10" fill="${V('#22252a', 0.2, 0.3)}"/><g transform="rotate(${tilt} 0 0)"><rect x="-16" y="-150" width="32" height="150" rx="14" fill="${V('#2a2d32', 0.25, 0.3)}"/><rect x="-24" y="-190" width="48" height="70" rx="20" fill="${V('#1c1e22', 0.25, 0.3)}"/><circle cx="0" cy="-178" r="9" fill="#d83a2e"/></g></g>`;
}
function mug(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-40" y="-90" width="80" height="90" rx="10" fill="${V('#e8e2d4', 0.15, 0.25)}"/><path d="M40,-70 q34,0 34,26 q0,26 -34,26" stroke="#d8d2c4" stroke-width="12" fill="none"/><text x="0" y="-40" font-family="'Courier New', monospace" font-size="11" fill="#5a5a5a" text-anchor="middle" opacity="0.75">kinoplot</text><text x="0" y="-26" font-family="'Courier New', monospace" font-size="11" fill="#5a5a5a" text-anchor="middle" opacity="0.75">.film</text><ellipse cx="0" cy="-90" rx="40" ry="9" fill="#5a3a24"/></g>`;
}
// вспышка разрыва за деревьями
function blast(x, y, k, s = 1) {
  if (k <= 0) return '';
  const r = (80 + 320 * k) * s, op = k < 0.25 ? k / 0.25 : 1 - (k - 0.25) / 0.75;
  return smoke(x, y - 40, s * 0.7, k * 5, 6, '#7a7468') + glow(x, y, r * 2.4, '#ff9a40', 0.95 * op) + glow(x, y, r * 1.1, '#ffd890', op) + `<circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#fff6dc" opacity="${op}"/>`;
}
function tracer(x0, y0, x1, y1, k, c = '#ffb24a') {
  if (k <= 0 || k >= 1) return '';
  const px = lerp(x0, x1, k), py = lerp(y0, y1, k), qx = lerp(x0, x1, Math.max(0, k - 0.18)), qy = lerp(y0, y1, Math.max(0, k - 0.18));
  return `<path d="M${qx},${qy} L${px},${py}" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="0.95"/>` + glow(px, py, 24, c, 0.8);
}
function muzzle(x, y, on, s = 1) { return on ? glow(x, y, 70 * s, '#ffcf70', 0.9) + `<path d="M${x - 30 * s},${y} L${x},${y - 10 * s} L${x + 34 * s},${y} L${x},${y + 10 * s} Z" fill="#fff4d0"/>` : ''; }
function torch(x, y, t, ph, dir = -1) {
  const sw = wave(t, 0.4, ph) * 10;
  const st = dir > 0 ? [[0, '#fff2c8', 0.3], [1, '#fff2c8', 0]] : [[0, '#fff2c8', 0], [1, '#fff2c8', 0.3]];
  return `<path d="M${x},${y} L${x + dir * 380},${y + 140 + sw * 6} L${x + dir * 380},${y - 50 + sw * 6} Z" fill="${grad(st, false)}" filter="url(#blur4)"/>` + glow(x, y, 40, '#fff2c8', 0.9) + `<circle cx="${x}" cy="${y}" r="7" fill="#fffbe8"/>`;
}
const fighterSil = (x, y, s, c = '#0a0f0b') => figure(x, y, s, { ...FIGHTER, sil: silFilter(c) });

// ---------- фото-стикеры ----------
const STICKER_SRC = { crowe: 'crowe-cut.png', hemsworth: 'hemsworth-cut.png' };
const IMG = {};
await Promise.all(Object.entries(STICKER_SRC).map(async ([k, f]) => {
  try {
    const b = await (await fetch(`/public/assets/land-of-bad/${f}`)).blob();
    IMG[k] = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  } catch { IMG[k] = ''; }
}));
const STICKERS = [
  { k: 'crowe', x: 380, y: 1000, w: 600, h: 400, at: 0.0 + D, tilt: -4 },
  { k: 'hemsworth', x: 720, y: 1420, w: 460, h: 611, at: 0.73 + D, tilt: 3 },
];
const STICKER_FILTER = `<defs><filter id="stk" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="9" result="dil"/><feFlood flood-color="#ffffff"/><feComposite in2="dil" operator="in" result="outline"/><feGaussianBlur in="dil" stdDeviation="12" result="blur"/><feOffset in="blur" dx="8" dy="16" result="sh"/><feFlood flood-color="#000" flood-opacity="0.55"/><feComposite in2="sh" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
function sticker(s, t, i) {
  const dt = t - s.at;
  if (dt < 0 || !IMG[s.k]) return '';
  const f = dt * 30;
  const pop = f < 6 ? lerp(0.2, 1.12, f / 6) : f < 10 ? lerp(1.12, 0.96, (f - 6) / 4) : f < 14 ? lerp(0.96, 1, (f - 10) / 4) : 1;
  const wob = wave(t, 0.35, i * 2) * 2.4, bob = wave(t, 0.25, i * 1.3) * 7;
  return `<g transform="translate(${s.x} ${s.y + bob}) rotate(${s.tilt + wob}) scale(${pop})" opacity="${clamp(f / 3)}"><image href="${IMG[s.k]}" x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid meet" filter="url(#stk)"/></g>`;
}

const shots = {
  // 1. Крупно Кинни у ствола, в дымке фонари → камера взмывает, кадр становится тепловизором дрона
  hook(t, T) {
    const up = at(t, 2.45, 1.1), k = ease(t / T);
    const jungle = [
      jungleBack(t, 'night'),
      rays(380, 0, 5, t, '#cfe8ff', 0.08),
      torch(250, 1080, t, 0, -1), torch(860, 1120, t, 1.7, 1), fighterSil(250, 1250, 0.4), fighterSil(860, 1290, 0.42),
      mist(1150, t, '#3a5444', 0.5),
      trunk(540, 330, '#2a2a1e', -100, 1920, 0),
      `<g transform="translate(${wave(t, 0.5) * 4} 0)">${antenna(560, 2260, 1.9, KINNEY, wave(t, 0.4))}${kinney(560, 2260, 1.9, { arms: 'phone', look: lerp(-0.6, 0.4, clamp(t / 2)), frown: 0.55, worried: true, dirt: true, sweat: t, blink: blink(t, 0.4), nod: wave(t, 0.9) * 0.5 })}</g>`,
      fern(80, 1900, 1.4, '#16301c', wave(t, 0.3)), fern(1000, 1920, 1.5, '#142a18', wave(t, 0.3, 2)),
      bigLeaf(-40, 1560, 1.5, -20, '#123018'),
      grade('#3a8a6a', 0.25),
    ].join('');
    // камера «взмывает»: джунгли уезжают вниз и уменьшаются, поверх проступает тепловизор
    const jz = lerp(1.0, 1.06, k) * (1 - 0.18 * up), jy = lerp(0, -40, k) + up * 420;
    const scr = `<svg width="1080" height="1920" viewBox="0 0 1080 1920">${thermal(1080, 1920, t, { hx: 560, hy: 1180, cross: lerp(1.8, 1, up), seed: 4, hudY: 0.74 })}</svg>`;
    return {
      cam: { z: lerp(1.08, 1.0, up) },
      els: [defsScan(), `<rect width="1080" height="1920" fill="#0c1a14"/>`, `<g transform="translate(${540} ${960 + jy}) scale(${jz}) translate(-540 -960)">${jungle}</g>`, layer(up, scr), topShade(800, 0.55)],
    };
  },

  // 2. Кабина управления в Неваде: Жнец в кресле, мониторы с джунглями, кружка, закат в двери
  reaper(t, T) {
    const k = ease(t / T), yawn = clamp(1 - Math.abs(t - (5.9 + D)) / 0.7) ** 0.7;
    return {
      cam: { z: lerp(1.0, 1.14, k), x: lerp(30, -20, k), y: lerp(0, -50, k) },
      els: [
        defsScan(),
        `<rect width="1080" height="1920" fill="${grad([[0, '#0a0e16'], [1, '#141a24']])}"/>`,
        // дверь трейлера в пустыню
        desert(70, 520, 260, 720, t), `<rect x="60" y="510" width="280" height="740" fill="none" stroke="#1c2028" stroke-width="22"/>`,
        `<path d="M70,1250 L330,1250 L520,1920 L-200,1920 Z" fill="${grad([[0, '#f8b070', 0.3], [1, '#f8b070', 0]])}"/>`,
        // стойка с мониторами справа
        monitor(560, 470, 440, 300, thermal(440, 300, t, { seed: 2, hx: 220 + wave(t, 0.2) * 20, hy: 150 })),
        monitor(560, 820, 440, 260, `<rect width="440" height="260" fill="#0c2a3a"/><g stroke="#4ac0e8" stroke-width="2" fill="none" opacity="0.7"><path d="M20,200 L80,150 L140,170 L200,90 L260,120 L320,60 L420,80"/><circle cx="220" cy="130" r="60"/><circle cx="220" cy="130" r="${20 + (t * 30) % 40}"/></g><text x="20" y="40" font-family="'Courier New', monospace" font-size="18" fill="#4ac0e8">SAT LINK  OK</text>`),
        glow(780, 760, 520, '#4aa8e8', 0.28),
        `<text x="580" y="455" font-family="'Courier New', monospace" font-size="16" fill="#6a7a8a">CREECH  GCS-2</text>`,
        // Жнец в кресле (крупно), перед ним пульт закрывает низ фигуры
        `<path d="M200,1000 Q200,820 360,820 L600,820 Q760,820 760,1000 L760,1700 L200,1700 Z" fill="${V('#2a2c32', 0.2, 0.3)}"/>`,
        reaper(480, 1700, 1.7, { pose: 'sit', arms: 'table', look: lerp(0.9, 0.4, k), nod: wave(t, 0.4) * 0.5, closed: yawn > 0.3 || blink(t, 1.3), yawn: yawn > 0.05 ? yawn : 0 }),
        `<path d="M-40,1560 L1120,1480 L1120,1920 L-40,1920 Z" fill="${V('#20242c', 0.12, 0.35)}"/><path d="M-40,1560 L1120,1480 L1120,1504 L-40,1586 Z" fill="#3a404c"/>`,
        `<g opacity="0.85">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${60 + i * 70}" y="${1590 - i * 5}" width="50" height="18" rx="4" fill="${i === 5 ? '#e8a23a' : i === 2 ? '#3aa86a' : '#4a5260'}"/>`).join('')}</g>`,
        `<rect x="${300}" y="1640" width="360" height="120" rx="10" fill="#14181e"/><g fill="#2a303a">${Array.from({ length: 24 }, (_, i) => `<rect x="${312 + (i % 12) * 29}" y="${1652 + Math.floor(i / 12) * 50}" width="24" height="40" rx="4"/>`).join('')}</g>`,
        joystick(800, 1600, 1.1, wave(t, 0.6) * 8),
        `<path d="M620,1370 Q730,1470 ${790 + wave(t, 0.6) * 18},1430" stroke="${V('#4d5644', 0.2, 0.25)}" stroke-width="78" fill="none" stroke-linecap="round"/><circle cx="${800 + wave(t, 0.6) * 18}" cy="${1420}" r="36" fill="${R('#e2a888')}"/>`,
        mug(180, 1600, 1.1),
        glow(560, 1000, 360, '#6ab8ff', 0.15),
        grade('#4a7ab0', 0.18),
        topShade(760, 0.5),
      ],
    };
  },

  // 3. Рассвет над морем крон: вертолёт → камера опускается в джунгли, отряд гуськом, последним Кинни с антенной
  team(t, T) {
    const down = ease(clamp((t - 0.6) / 2.4)), k = ease(t / T);
    const walk = (i) => wave(t, 1.1, i * 1.3);
    const px = (i) => lerp(60, 200, k) + (i + 1.15) * 220;
    const top = [
      sky([[0, '#f6b878'], [0.35, '#f8d8a8'], [0.6, '#cfe0c8']], 1920),
      glow(780, 520, 600, '#fff0c8', 0.9), `<circle cx="780" cy="520" r="70" fill="#fff6dc"/>`,
      canopy(880, '#5a8a58', t, 11, 140), mist(860, t, '#fff0dc', 0.55),
      canopy(1100, '#3e6e44', t, 12, 180),
      heli(lerp(-200, 1250, clamp(t / 3.4)), lerp(720, 640, clamp(t / 3.4)), 0.9, t),
    ].join('');
    const bottom = [
      jungleBack(t, 'day'),
      rays(300, -100, 6, t, '#fff2c8', 0.2),
      vine(300, 0, 700, t, 0), vine(760, 0, 560, t, 1.4), vine(980, 0, 820, t, 2.2),
      `<path d="M-100,1720 Q540,1640 1180,1700 L1180,1920 L-100,1920 Z" fill="${V('#4a4a2c', 0.1, 0.4)}"/>`,
      ...[0, 1, 2].map((i) => figure(px(i), 1760 - i * 6, 0.82, OP({ arms: 'rifle', step: walk(i), look: 1, cap: i === 1 ? undefined : '#5a5844', helmet: i === 1 ? '#5e5a44' : undefined, blink: blink(t, i) }))),
      antenna(px(-1.15), 1770, 0.86, KINNEY, wave(t, 0.8)),
      kinney(px(-1.15), 1770, 0.86, { arms: 'rifle', step: walk(3), look: lerp(1, -0.2, at(t, 6.2, 0.5)), blink: blink(t, 2.2) }),
      glow(px(-1.15), 1400, 260, '#fff2c8', 0.35 * at(t, 6.3, 0.4)),
      fern(lerp(120, -60, k), 1930, 1.5, '#1e4426', wave(t, 0.3)), fern(lerp(980, 800, k), 1940, 1.6, '#1a3e22', wave(t, 0.3, 1.5)),
      bigLeaf(lerp(-80, -200, k), 1560, 1.6, -15, '#1a4024'),
    ].join('');
    return {
      cam: { z: 1.0 + 0.04 * k, y: 0 },
      els: [`<g transform="translate(0 ${-down * 1920})">${top}<g transform="translate(0 1920)">${bottom}</g></g>`, grade('#f8c890', 0.15), topShade(760, 0.45)],
    };
  },

  // 4. Кинни говорит в рацию → пунктир сигнала к дрону над облаками → ракета → вспышка за деревьями
  link(t, T) {
    const sig = at(t, 0.6, 0.9), fire = clamp((t - 2.95 - D) / 0.45), boom = clamp((t - 3.35 - D) / 1.0);
    const k = ease(t / T);
    const dX = 820, dY = 420;
    return {
      cam: { z: lerp(1.0, 1.06, k), x: boom > 0 ? 0 : 0, y: lerp(0, 20, k) },
      els: [
        sky([[0, '#5a7a9a'], [0.5, '#a8c4c8'], [0.8, '#d8e4d0']], 1920),
        `<g filter="url(#blur8)">${[0, 1, 2, 3].map((i) => `<ellipse cx="${(200 + i * 300 + t * 20) % 1300 - 100}" cy="${560 + (i % 2) * 70}" rx="260" ry="50" fill="#f4f4ee" opacity="0.8"/>`).join('')}</g>`,
        drone(dX + wave(t, 0.3) * 20, dY + wave(t, 0.4) * 8, 0.85, t),
        canopy(980, '#4a7a50', t, 21, 160), mist(1000, t, '#e8f0dc', 0.45),
        canopy(1180, '#2e5a36', t, 22, 200),
        blast(600, 1150, boom, 1.0),
        // сигнал: пунктир от антенны к дрону
        `<path d="M300,1240 Q520,820 ${dX - 160},${dY + 40}" stroke="#ffd9a0" stroke-width="5" fill="none" stroke-dasharray="14 18" stroke-dashoffset="${-t * 80}" opacity="${0.85 * sig}" pathLength="1000" style="stroke-dasharray:${sig * 1000} 1000"/>`,
        ...[0.25, 0.55, 0.85].map((f, i) => { const q = (t * 0.9 + f) % 1; return sig > 0.9 ? `<circle cx="${lerp(300, dX - 160, q)}" cy="${lerp(1240, dY + 40, q) - Math.sin(q * Math.PI) * 120}" r="9" fill="#ffe2b0" opacity="${0.8 * (1 - Math.abs(q - 0.5))}"/>` : ''; }),
        // ракета от дрона к цели
        tracer(dX - 120, dY + 40, 600, 1150, fire, '#ffe2a0'),
        antenna(300, 1880, 1.15, KINNEY, wave(t, 0.5)),
        kinney(300, 1880, 1.15, { pose: 'crouch', arms: 'phone', look: lerp(0.4, 1, at(t, 2.8, 0.5)), lookUp: 1, frown: 0.4, dirt: true, blink: blink(t, 0.8) }),
        // рация с пасхалкой
        `<g transform="translate(560 1640) rotate(-8)" filter="url(#soft)"><rect x="-70" y="-120" width="140" height="240" rx="16" fill="${V('#3e3e32', 0.2, 0.3)}"/><rect x="-50" y="-96" width="100" height="56" rx="6" fill="#9ac8a0"/><text x="0" y="-62" font-family="'Courier New', monospace" font-size="15" fill="#1e3a24" text-anchor="middle">CH 7  SAT</text><text x="0" y="70" font-family="'Courier New', monospace" font-size="15" fill="#c8c4b0" text-anchor="middle" opacity="0.7">kinoplot.film</text><rect x="40" y="-200" width="12" height="90" rx="5" fill="#1e1e18"/>${[0, 1, 2].map((i) => `<circle cx="${-30 + i * 30}" cy="20" r="10" fill="#2a2a22"/>`).join('')}</g>`,
        fern(980, 1940, 1.5, '#183a20', wave(t, 0.3)),
        grade('#80b090', 0.15),
        topShade(760, 0.5),
      ],
    };
  },

  // 5. Засада: вспышки из листвы, трассеры, Кинни ныряет за бревно → дым над пустой тропой, брошенная каска
  ambush(t, T) {
    const after = at(t, 1.15, 0.5), dive = ease(clamp((t - 0.25) / 0.5));
    const fireOn = (i) => ((t * 7 + i * 1.7) % 1) < 0.35 && after < 0.9;
    const scene1 = [
      jungleBack(t, 'day'),
      grade('#203a28', 0.5),
      ...[[160, 1050], [420, 980], [880, 1020], [980, 1180]].map(([x, y], i) => muzzle(x, y, fireOn(i), 1.2)),
      tracer(160, 1050, 760, 1620, (t * 2.2) % 1), tracer(880, 1020, 300, 1580, (t * 2.4 + 0.4) % 1), tracer(420, 980, 640, 1700, (t * 2 + 0.7) % 1),
      `<path d="M-100,1700 Q540,1620 1180,1690 L1180,1920 L-100,1920 Z" fill="${V('#3e3c26', 0.1, 0.4)}"/>`,
      antenna(560, 1820 + dive * 230, 1.15, KINNEY),
      kinney(560, 1820 + dive * 230, 1.15, { lean: -dive * 10, arms: 'rifle', look: -1, frown: 0.7, worried: true, dirt: true, blink: false }),
      ...[0, 1, 2, 3, 4, 5].map((i) => { const q = (t * 0.7 + i / 6) % 1; return bigLeaf(lerp(200 + i * 130, 120 + i * 160, q), lerp(900, 1700, q), 0.25, q * 540 + i * 40, '#3e6a36'); }),
      // поваленное бревно
      `<g filter="url(#soft)"><path d="M-40,1690 Q540,1610 1120,1700 L1120,1800 Q540,1720 -40,1800 Z" fill="${V('#5a4630', 0.15, 0.35)}"/><ellipse cx="1110" cy="1750" rx="34" ry="54" fill="#8a6a46"/><path d="M200,1700 q60,-14 120,0 M600,1680 q60,-12 120,0" stroke="#3a2c1e" stroke-width="6" fill="none"/></g>`,
      fern(100, 1880, 1.3, '#1e4426', wave(t, 0.4)),
    ].join('');
    const scene2 = [
      jungleBack(t, 'day'), grade('#203a28', 0.55),
      smoke(540, 1500, 1.4, t, 8, '#8a9488'), smoke(260, 1600, 1.0, t + 2, 6, '#6a7468'),
      `<path d="M-100,1700 Q540,1620 1180,1690 L1180,1920 L-100,1920 Z" fill="${V('#3e3c26', 0.1, 0.4)}"/>`,
      `<g filter="url(#soft)" transform="translate(560 1730) rotate(-14)"><path d="M-90,0 Q-92,-90 0,-96 Q92,-90 90,0 Z" fill="${V('#5e5a44', 0.25, 0.3)}"/><rect x="-100" y="-6" width="200" height="16" rx="6" fill="#3a3828"/><rect x="-18" y="-86" width="36" height="22" rx="4" fill="#222"/></g>`,
      fern(100, 1880, 1.3, '#1e4426', wave(t, 0.2)), fern(980, 1900, 1.4, '#1a3e22', wave(t, 0.2, 1)),
    ].join('');
    return {
      cam: { z: lerp(1.06, 1.0, after) + 0.02 * wave(t, 0.5), x: 0, y: 0 },
      els: [layer(1 - after, scene1), layer(after, scene2), topShade(760, 0.55)],
    };
  },

  // 6. Кинни крадётся по ручью, выше цепочка фонарей → растворение в монитор Жнеца: белая точка, к ней сходятся красные метки
  alone(t, T) {
    const scr = at(t, 3.9, 0.9), k = ease(t / T);
    const conv = ease(clamp((t - 4.2) / 3));
    const kx = lerp(380, 600, ease(clamp(t / 4.5)));
    const scene1 = [
      jungleBack(t, 'night'),
      ...[0, 1, 2, 3].map((i) => { const x = lerp(1000, 300, clamp(t / 6)) + i * 170; return torch(x, 1000 + i * 18, t, i, -1) + fighterSil(x, 1170 + i * 18, 0.36); }),
      mist(1100, t, '#2c4636', 0.55),
      `<path d="M-100,1560 Q300,1500 540,1540 Q800,1580 1180,1520 L1180,1920 L-100,1920 Z" fill="${grad([[0, '#2a4a52'], [1, '#14262c']])}"/>`,
      `<g opacity="0.5">${[0, 1, 2, 3].map((i) => `<path d="M${(i * 300 + t * 40) % 1300 - 100},${1600 + i * 60} q60,-8 120,0" stroke="#8ab8c0" stroke-width="4" fill="none"/>`).join('')}</g>`,
      antenna(kx, 1700, 1.25, { ...KINNEY, pose: 'crouch' }, wave(t, 0.6)),
      kinney(kx, 1700, 1.25, { pose: 'crouch', arms: 'rifle', look: -0.6, lookUp: 1, frown: 0.6, worried: true, dirt: true, sweat: t, blink: blink(t, 1.1) }),
      `<ellipse cx="${kx}" cy="1710" rx="200" ry="20" fill="#9ac8d0" opacity="${0.2 + 0.1 * wave(t, 1)}"/>`,
      fern(60, 1900, 1.4, '#102818', wave(t, 0.3)), bigLeaf(1120, 1500, 1.5, 195, '#0e2414'),
      grade('#2a6a6a', 0.25),
    ].join('');
    const enemies = [[180, 260], [880, 300], [820, 1560], [140, 1420], [520, 120]].map(([x, y]) => [lerp(x, lerp(x, 540, 0.55), conv), lerp(y, lerp(y, 860, 0.55), conv)]);
    const scene2 = `<rect width="1080" height="1920" fill="#06080c"/>` + monitor(60, 300, 960, 1320, thermal(960, 1320, t, { seed: 14, hx: 480, hy: 620, enemies: enemies.map(([x, y]) => [x * 960 / 1080, (y - 0) * 1320 / 1920 + 20]) })) + glow(540, 960, 700, '#9ad8c0', 0.12) +
      // плечо и голова Жнеца со спины в нижнем углу
      `<g filter="url(#soft)"><ellipse cx="170" cy="1990" rx="320" ry="280" fill="${V('#3e4636', 0.15, 0.4)}"/><ellipse cx="150" cy="1640" rx="118" ry="128" fill="${V('#5a544e', 0.2, 0.35)}"/><path d="M40,1600 Q150,1450 260,1600" stroke="#2a2c2a" stroke-width="16" fill="none"/><rect x="18" y="1590" width="46" height="96" rx="20" fill="${V('#5f9a78', 0.25, 0.3)}"/><rect x="238" y="1590" width="46" height="96" rx="20" fill="${V('#5f9a78', 0.25, 0.3)}"/><path d="M60,1760 Q150,1720 250,1760" stroke="#d4ac58" stroke-width="4" fill="none" opacity="0"/></g>` + glow(260, 1520, 160, '#9ad8c0', 0.2);
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -30, k) },
      els: [defsScan(), layer(1 - scr, scene1), layer(scr, scene2), topShade(700, 0.5)],
    };
  },

  // 7. Фото-стикеры Кроу и Хемсворта; фон — слева пустыня и антенны базы, справа джунгли, между ними бежит радиоволна
  actors(t, T) {
    const k = ease(t / T);
    const wavePath = Array.from({ length: 61 }, (_, i) => { const x = i * 18; return `${i ? 'L' : 'M'}${x},${1180 + Math.sin(x / 50 - t * 6) * 40 * Math.sin((x / 1080) * Math.PI)}`; }).join(' ');
    return {
      cam: { z: lerp(1.02, 1.08, k), x: lerp(-20, 20, k) },
      els: [
        STICKER_FILTER,
        `<svg x="0" y="0" width="540" height="1920" viewBox="0 0 540 1920" preserveAspectRatio="xMidYMid slice">${`<rect width="540" height="1920" fill="${grad([[0, '#2a2050'], [0.45, '#d86a46'], [0.6, '#f6b06a'], [1, '#6a3a30']])}"/>`}${glow(300, 1080, 300, '#ffe2a8', 0.8)}<path d="M0,1180 L120,1100 L260,1150 L400,1080 L540,1130 L540,1920 L0,1920 Z" fill="#5a3040"/><path d="M0,1300 L540,1280 L540,1920 L0,1920 Z" fill="#8a4a34"/><g stroke="#2a1820" stroke-width="6" fill="none"><path d="M120,1290 L140,960 L160,1290 M126,1200 L154,1200 M130,1120 L150,1120 M134,1040 L146,1040 M126,1200 L150,1120 M130,1120 L146,1040"/><path d="M380,1280 V1060"/></g><path d="M330,1080 Q380,990 440,1060 Z" fill="#2a1820"/><circle cx="140" cy="955" r="6" fill="#ff5a46"/><path d="M200,1240 h160 v50 h-160 Z" fill="#c8b8a8"/><g fill="#2a1820"><path d="M40,1300 L40,1230 L180,1230 L180,1300 Z"/><ellipse cx="460" cy="1180" rx="46" ry="18" transform="rotate(-30 460 1180)"/><rect x="456" y="1186" width="8" height="100"/></g>${drone(380 + t * 20, 760, 0.35, t, '#3a2a3a')}${glow(110, 1250, 30, '#ffd070', 0.9)}</svg>`,
        `<svg x="540" y="0" width="540" height="1920" viewBox="0 0 540 1920" preserveAspectRatio="xMidYMid slice"><rect width="540" height="1920" fill="${grad([[0, '#1e3a2a'], [0.5, '#4a7a52'], [1, '#14261a']])}"/>${trunk(120, 60, '#2a3424')}${trunk(420, 80, '#26301e')}${palm(300, 1100, 520, wave(t, 0.2), '#1e3a26')}${canopy(1060, '#2e5a36', t, 41, 180)}${heliconia(80, 1500, 1.2, wave(t, 0.3))}${bush(460, 1600, 1.0, '#1e4426', t)}${fern(300, 1900, 1.3, '#16301c', wave(t, 0.3))}</svg>`,
        `<rect x="520" y="0" width="40" height="1920" fill="${grad([[0, '#000', 0], [0.5, '#000', 0.35], [1, '#000', 0]], false)}"/>`,
        `<path d="${wavePath}" stroke="#ffd9a0" stroke-width="6" fill="none" opacity="0.85"/>` + glow(540, 1180, 200, '#ffd9a0', 0.25),
        grade('#000', 0.1),
        topShade(760, 0.55),
        ...STICKERS.map((s, i) => sticker(s, t, i)),
      ],
    };
  },

  // 8. Сквозь стекло монитора: лицо Жнеца в голубом свете, ладонь у экрана, на стекле отражение маленькой белой фигурки
  question(t, T) {
    const k = ease(t / T), reach = ease(clamp((t - 0.2) / 1.6));
    const hx = 820, hy = lerp(2000, 1560, reach);
    const palm = `<g transform="translate(${hx} ${hy}) rotate(8) scale(1.05)" filter="url(#soft)"><ellipse cx="0" cy="0" rx="120" ry="140" fill="${R('#d89a78', 0.15, 0.25)}"/>${[-80, -28, 24, 74].map((dx, i) => `<rect x="${dx - 22}" y="${-260 + Math.abs(i - 1.5) * 26}" width="44" height="${170 - Math.abs(i - 1.5) * 20}" rx="22" fill="${R('#dca07e', 0.15, 0.2)}"/><ellipse cx="${dx}" cy="${-244 + Math.abs(i - 1.5) * 26}" rx="14" ry="10" fill="#f2c8b0" opacity="0.6"/>`).join('')}<rect x="-170" y="-60" width="60" height="140" rx="30" fill="${R('#d89a78', 0.15, 0.25)}" transform="rotate(-30 -140 0)"/></g>`;
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, 30, k) },
      els: [
        defsScan(),
        `<rect width="1080" height="1920" fill="${grad([[0, '#05070c'], [1, '#0c1220']])}"/>`,
        glow(540, 1100, 800, '#4aa0e8', 0.35),
        reaper(500, 1640, 2.0, { pose: 'sit', arms: 'down', look: 0.5, lookUp: -0.4, frown: lerp(0.2, 0.6, k), worried: true, blink: blink(t, 2) }),
        `<path d="M-40,1700 L1120,1660 L1120,1920 L-40,1920 Z" fill="${V('#161a22', 0.1, 0.35)}"/><path d="M-40,1700 L1120,1660" stroke="#4a8ad0" stroke-width="5" opacity="0.6"/>`,
        grade('#3a7ad8', 0.45),
        `<path d="M680,1250 Q${hx - 40},${hy + 320} ${hx - 10},${hy + 190}" stroke="${V('#4d5644', 0.2, 0.3)}" stroke-width="120" fill="none" stroke-linecap="round"/>`,
        palm,
        // стекло: отражение тепловизора и маленькая белая фигурка
        `<g opacity="0.28">${`<svg width="1080" height="1920" viewBox="0 0 1080 1920">${thermal(1080, 1920, t, { seed: 6, hx: 820, hy: 1220, cross: 1.2, hudY: 2 })}</svg>`}</g>`,
        glow(820, 1220, 120, '#ffffff', 0.5),
        `<rect width="1080" height="1920" fill="${grad([[0, '#fff', 0.06], [0.45, '#fff', 0], [0.5, '#fff', 0.05], [0.55, '#fff', 0]], false)}"/>`,
        topShade(760, 0.55),
      ],
    };
  },
};

run(shots);
