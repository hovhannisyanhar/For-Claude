// «Жизнь Дэвида Гейла» (The Life of David Gale, 2003) — 8 планов в 2D-векторе. Имя плана = set сцены в videos/the-life-of-david-gale/script.json.
// Техас: выгоревшее небо, охра и пыль, красный кирпич тюрьмы, белая роба смертника; ночи — густой синий, жёлтые лампы мотеля, мигалки.
import { run, person, setProportions, V, R, grad, glow, smoke, rnd, reseed, shade, lerp, ease, clamp, wave, def } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// ---------- персонажи ----------
// Гейл в тюрьме: белая роба техасского смертника, тёмные волосы с проседью, щетина
const GALE = { shirt: '#ece8dc', pants: '#e2ded2', skin: '#e0ab8a', hair: '#3a2c22', iris: '#4a5a4a', beard: false, frown: 0.35, jumpsuit: true, stubble: true, grey: true };
// Гейл-профессор: твидовый пиджак, галстук
const PROF = { ...GALE, shirt: '#7a5a3c', pants: '#4a3a2c', jumpsuit: false, stubble: false, suit: true, tie: '#6a2a24', tweed: true, frown: 0.1 };
// Битси: светлое каре, серый деловой костюм, белая блузка
const BITSEY = { shirt: '#5c6068', pants: '#4a4e56', skin: '#f0cbb0', hair: '#e0c088', iris: '#4a6a8a', beard: false, frown: 0.2, longHair: true, fem: true, slim: 0.76 };
const WIFE = { shirt: '#7a3a3e', pants: '#3a2a2c', skin: '#e8bc9c', hair: '#5a3422', iris: '#3a2a1a', beard: false, frown: 0.5, worried: true, longHair: true, fem: true, slim: 0.76 };
const SON = { shirt: '#3e6a9a', pants: '#2a3a52', skin: '#ecc0a0', hair: '#6a4a2e', iris: '#3a2a1a', beard: false, frown: 0.4, worried: true };
const GOV = { shirt: '#3a4252', pants: '#2e3442', skin: '#e2b090', hair: '#c8c2b8', iris: '#3a3a3a', beard: false, frown: 0.2, suit: true, tie: '#2a3a7a', pin: true };
const COP = { shirt: '#2a3448', pants: '#1e2636', skin: '#d4a07c', hair: '#2a1e16', iris: '#2a1a10', beard: false, moustache: true, frown: 0.45, cop: true, cap: '#1c2232' };

const D = 0.13; // AUDIO_DELAY: голос начинается через 4 кадра
const io = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const at = (t, a, d = 0.5) => io((t - D - a) / d);
const blink = (t, ph = 0) => ((t + ph) % 3.6) < 0.12;
const sky = (stops, h = 1920) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const topShade = (h = 800, a = 0.55) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const layer = (op, inner) => op <= 0.001 ? '' : `<g opacity="${op.toFixed(3)}">${inner}</g>`;
const par = (dx, dy, svg) => `<g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})">${svg}</g>`;
const label = (x, y, txt, size = 16, c = '#2a2a2a', op = 0.8, anchor = 'middle', font = "'Courier New', monospace") => `<text x="${x}" y="${y}" font-family="${font}" font-weight="700" font-size="${size}" fill="${c}" opacity="${op}" text-anchor="${anchor}">${txt}</text>`;

function geo(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const pose = o.pose || 'stand';
  const legH = (pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  const headY = top - hr * 0.8 + (o.nod || 0) * 6 * hs;
  return { hs, hr, top, ty, headY, ey: headY + 2 * hs };
}
function dress(x, y, s, o) {
  const { hr, hs, top, ty, headY, ey } = geo(x, y, s, o);
  const sh = o.shirt, dk = shade(sh, -0.35), lt = shade(sh, 0.2);
  let b = '', front = '';
  if (o.jumpsuit) {
    // белая роба: отложной воротник, планка с кнопками, нагрудный карман, нашивка с номером
    b += `<path d="M${x - 34 * s},${top - 6 * s} L${x},${top + 60 * s} L${x + 34 * s},${top - 6 * s} Z" fill="${shade(o.skin, -0.08)}"/>`;
    b += `<path d="M${x - 70 * s},${top - 10 * s} L${x - 4 * s},${top + 62 * s} L${x - 40 * s},${top + 74 * s} L${x - 100 * s},${top + 20 * s} Z M${x + 70 * s},${top - 10 * s} L${x + 4 * s},${top + 62 * s} L${x + 40 * s},${top + 74 * s} L${x + 100 * s},${top + 20 * s} Z" fill="${V(lt, 0.1, 0.2)}"/>`;
    b += `<path d="M${x},${top + 62 * s} L${x},${ty}" stroke="${dk}" stroke-width="${3 * s}" opacity="0.5"/>` + [0, 1, 2].map((i) => `<circle cx="${x + 9 * s}" cy="${top + (100 + i * 48) * s}" r="${5 * s}" fill="#b8b4a8"/>`).join('');
    b += `<rect x="${x - 82 * s}" y="${top + 86 * s}" width="${50 * s}" height="${46 * s}" rx="${4 * s}" fill="none" stroke="${dk}" stroke-width="${2.5 * s}" opacity="0.45"/>`;
    b += `<rect x="${x + 30 * s}" y="${top + 90 * s}" width="${58 * s}" height="${20 * s}" rx="${3 * s}" fill="#f6f4ee" stroke="#9a968a" stroke-width="${1.5 * s}"/><path d="M${x + 36 * s},${top + 100 * s} h${46 * s}" stroke="#3a3a3a" stroke-width="${4 * s}" stroke-dasharray="${5 * s} ${3 * s}"/>`;
    b += `<path d="M${x - 96 * s},${ty - 40 * s} Q${x},${ty - 20 * s} ${x + 96 * s},${ty - 40 * s}" stroke="${dk}" stroke-width="${3 * s}" fill="none" opacity="0.35"/>`;
  }
  if (o.suit) {
    b += `<path d="M${x - 40 * s},${top - 6 * s} L${x},${top + 130 * s} L${x + 40 * s},${top - 6 * s} Z" fill="#eeece6"/>`;
    b += `<path d="M${x - 12 * s},${top + 8 * s} L${x + 12 * s},${top + 8 * s} L${x + 16 * s},${top + 110 * s} L${x},${top + 130 * s} L${x - 16 * s},${top + 110 * s} Z" fill="${V(o.tie || '#2a3a6a', 0.25, 0.25)}"/><path d="M${x - 14 * s},${top - 2 * s} L${x + 14 * s},${top - 2 * s} L${x + 9 * s},${top + 14 * s} L${x - 9 * s},${top + 14 * s} Z" fill="${shade(o.tie || '#2a3a6a', -0.2)}"/>`;
    b += `<path d="M${x - 62 * s},${top - 10 * s} L${x - 4 * s},${top + 140 * s} L${x - 30 * s},${top + 150 * s} L${x - 96 * s},${top + 40 * s} Z M${x + 62 * s},${top - 10 * s} L${x + 4 * s},${top + 140 * s} L${x + 30 * s},${top + 150 * s} L${x + 96 * s},${top + 40 * s} Z" fill="${V(lt, 0.15, 0.25)}"/>`;
    b += `<path d="M${x},${top + 140 * s} L${x},${ty}" stroke="${dk}" stroke-width="${3 * s}"/>` + [0, 1].map((i) => `<circle cx="${x + 8 * s}" cy="${top + (175 + i * 40) * s}" r="${6 * s}" fill="${dk}"/>`).join('');
    if (o.tweed) { reseed(5); for (let i = 0; i < 40; i++) { const px = x + (rnd() - 0.5) * 180 * s, py = top + 20 * s + rnd() * (ty - top - 30 * s); b += `<rect x="${px}" y="${py}" width="${8 * s}" height="${2 * s}" fill="${rnd() < 0.5 ? shade(sh, 0.25) : shade(sh, -0.25)}" opacity="0.6" transform="rotate(${rnd() < 0.5 ? 45 : -45} ${px} ${py})"/>`; } b += [-1, 1].map((sd) => `<ellipse cx="${x + sd * 150 * s}" cy="${top + 160 * s}" rx="${14 * s}" ry="${22 * s}" fill="${shade(sh, -0.25)}" opacity="0.5"/>`).join(''); }
    if (o.pin) b += `<path d="M${x - 70 * s},${top + 70 * s} l${10 * s},${-12 * s} l${10 * s},${12 * s} l${-10 * s},${12 * s} Z" fill="#d8b44a"/>`;
    else b += `<path d="M${x + 50 * s},${top + 88 * s} l${10 * s},${-14 * s} l${8 * s},${10 * s} l${10 * s},${-10 * s} l${4 * s},${14 * s} Z" fill="#eef0f2"/>`;
  }
  if (o.fem) {
    // жакет с лацканами поверх блузки
    b += `<path d="M${x - 40 * s},${top - 4 * s} L${x},${top + 100 * s} L${x + 40 * s},${top - 4 * s} Z" fill="${o.blouse || '#f2efe8'}"/>`;
    b += `<path d="M${x - 66 * s},${top - 8 * s} L${x - 6 * s},${top + 140 * s} L${x - 32 * s},${top + 150 * s} L${x - 98 * s},${top + 40 * s} Z M${x + 66 * s},${top - 8 * s} L${x + 6 * s},${top + 140 * s} L${x + 32 * s},${top + 150 * s} L${x + 98 * s},${top + 40 * s} Z" fill="${V(lt, 0.2, 0.2)}"/>`;
    b += `<circle cx="${x + 6 * s}" cy="${top + 180 * s}" r="${6 * s}" fill="${dk}"/>`;
  }
  if (o.cop) {
    b += `<path d="M${x - 30 * s},${top - 4 * s} L${x},${top + 40 * s} L${x + 30 * s},${top - 4 * s} Z" fill="${shade(o.skin, -0.1)}"/>`;
    b += `<path d="M${x - 52 * s},${top + 60 * s} l${16 * s},${-10 * s} l${16 * s},${10 * s} l${-4 * s},${22 * s} l${-24 * s},0 Z" fill="#e8c860"/>`;
    b += [-1, 1].map((sd) => `<rect x="${x + sd * 54 * s - 26 * s}" y="${top + 80 * s}" width="${52 * s}" height="${40 * s}" rx="${4 * s}" fill="none" stroke="${dk}" stroke-width="${2.5 * s}"/>`).join('');
    b += `<rect x="${x - 100 * s}" y="${ty - 26 * s}" width="${200 * s}" height="${26 * s}" fill="#141414"/><rect x="${x - 14 * s}" y="${ty - 26 * s}" width="${28 * s}" height="${26 * s}" fill="#b8a050"/><rect x="${x + 64 * s}" y="${ty - 30 * s}" width="${36 * s}" height="${60 * s}" rx="${6 * s}" fill="#1a1a1a"/>`;
  }
  if (o.longHair && o.fem) {
    // светлое каре: пряди у лица поверх ушей
    front += `<path d="M${x - hr * 1.06},${headY + hr * 1.1} Q${x - hr * 1.22},${headY - hr * 0.1} ${x - hr * 0.9},${headY - hr * 0.8} Q${x - hr * 0.4},${headY - hr * 1.2} ${x + hr * 0.2},${headY - hr * 1.12} Q${x - hr * 0.5},${headY - hr * 0.72} ${x - hr * 0.78},${headY + hr * 0.1} Q${x - hr * 0.8},${headY + hr * 0.7} ${x - hr * 0.62},${headY + hr * 1.08} Z" fill="${V(o.hair, 0.25, 0.25)}"/>`;
    front += `<path d="M${x + hr * 1.06},${headY + hr * 1.1} Q${x + hr * 1.22},${headY - hr * 0.2} ${x + hr * 0.86},${headY - hr * 0.82} Q${x + hr * 0.5},${headY - hr * 1.1} ${x + hr * 0.1},${headY - hr * 1.12} Q${x + hr * 0.62},${headY - hr * 0.76} ${x + hr * 0.8},${headY} Q${x + hr * 0.84},${headY + hr * 0.7} ${x + hr * 0.66},${headY + hr * 1.08} Z" fill="${V(o.hair, 0.2, 0.3)}"/>`;
    front += `<path d="M${x - 20 * hs},${ey + 55 * hs} Q${x},${ey + 64 * hs} ${x + 20 * hs},${ey + 55 * hs}" stroke="#b84a4a" stroke-width="${6 * hs}" fill="none" stroke-linecap="round"/>`;
  }
  if (o.grey) front += [-1, 1].map((sd) => `<path d="M${x + sd * hr * 0.97},${headY - hr * 0.5} L${x + sd * hr * 0.92},${headY + hr * 0.05}" stroke="#a8a49c" stroke-width="${hr * 0.12}" stroke-linecap="round"/>`).join('');
  if (o.stubble) front += `<path d="M${x - hr * 0.8},${headY + hr * 0.25} Q${x - hr * 0.7},${headY + hr * 1.0} ${x},${headY + hr * 1.0} Q${x + hr * 0.7},${headY + hr * 1.0} ${x + hr * 0.8},${headY + hr * 0.25} Q${x + hr * 0.5},${headY + hr * 0.62} ${x},${headY + hr * 0.62} Q${x - hr * 0.5},${headY + hr * 0.62} ${x - hr * 0.8},${headY + hr * 0.25} Z" fill="#3a2c22" opacity="0.22"/>`;
  if (o.cuffs) front += `<g>${[-1, 1].map((sd) => `<ellipse cx="${x + sd * 34 * s}" cy="${ty - 30 * s}" rx="${22 * s}" ry="${12 * s}" fill="none" stroke="#c8ccd0" stroke-width="${6 * s}"/>`).join('')}<path d="M${x - 12 * s},${ty - 30 * s} h${24 * s}" stroke="#c8ccd0" stroke-width="${5 * s}"/></g>`;
  return { b, front };
}
function seatedLegs(x, y, s, floor, pants) {
  const sl = PROPS.slim;
  let g = `<g filter="url(#soft)">`;
  [-1, 1].forEach((sd) => {
    const kx = x + sd * 40 * s * sl;
    g += `<rect x="${kx - 27 * s}" y="${y}" width="${54 * s}" height="${Math.max(10, floor - y - 14 * s)}" rx="${18 * s}" fill="${V(pants, 0.1, 0.3)}"/>`;
    g += `<ellipse cx="${kx}" cy="${y + 16 * s}" rx="${36 * s}" ry="${32 * s}" fill="${R(shade(pants, 0.08), 0.15, 0.25)}"/>`;
    g += `<ellipse cx="${kx + sd * 6 * s}" cy="${floor - 10 * s}" rx="${38 * s}" ry="${16 * s}" fill="#2a1e16"/>`;
  });
  return g + `</g>`;
}
function figure(x, y, s, o) {
  if (o.pose === 'sit' && o.floor) return seatedLegs(x, y, s, o.floor, o.pants || shade(o.shirt, -0.2)) + figure(x, y, s, { ...o, floor: 0 });
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b, smile: o.smile && !o.fem });
  if (!front || o.sil) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}>${front}</g>`;
}
const gale = (x, y, s, o = {}) => figure(x, y, s, { ...GALE, ...o });
const prof = (x, y, s, o = {}) => figure(x, y, s, { ...PROF, ...o });
const bitsey = (x, y, s, o = {}) => figure(x, y, s, { ...BITSEY, ...o });

// ---------- предметы и места ----------
function bricks(x, y, w, h, c = '#9a4a36', id = 'br') {
  def(`<pattern id="${id}" width="64" height="32" patternUnits="userSpaceOnUse"><rect width="64" height="32" fill="${c}"/><path d="M0,0.5 H64 M0,16.5 H64 M0.5,0 V16 M32.5,16 V32" stroke="${shade(c, -0.35)}" stroke-width="2"/><rect x="4" y="4" width="20" height="4" fill="${shade(c, 0.15)}" opacity="0.4"/></pattern>`);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})"/>`;
}
function blocks(x, y, w, h, c = '#b8ae98', id = 'cb') {
  def(`<pattern id="${id}" width="120" height="60" patternUnits="userSpaceOnUse"><rect width="120" height="60" fill="${c}"/><path d="M0,1 H120 M0,31 H120 M1,0 V30 M61,30 V60" stroke="${shade(c, -0.18)}" stroke-width="3"/></pattern>`);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})"/>`;
}
function bars(x0, x1, y0, y1, gap = 110, c = '#3a3a3e', w = 22) {
  let g = '';
  for (let x = x0; x <= x1; x += gap) g += `<rect x="${x - w / 2}" y="${y0}" width="${w}" height="${y1 - y0}" fill="${V(c, 0.35, 0.3)}"/><rect x="${x - w / 2 + 3}" y="${y0}" width="${w * 0.25}" height="${y1 - y0}" fill="#fff" opacity="0.12"/>`;
  [y0 + 60, y0 + (y1 - y0) * 0.55].forEach((yy) => (g += `<rect x="${x0 - 40}" y="${yy}" width="${x1 - x0 + 80}" height="${w * 1.4}" fill="${V(c, 0.3, 0.35)}"/>`));
  return g;
}
function cellBars(xs, y0, y1, c = '#2e2e34', w = 24) {
  let g = '';
  xs.forEach((x) => (g += `<rect x="${x - w / 2}" y="${y0}" width="${w}" height="${y1 - y0}" fill="${V(c, 0.35, 0.3)}"/><rect x="${x - w / 2 + 3}" y="${y0}" width="${w * 0.25}" height="${y1 - y0}" fill="#fff" opacity="0.12"/>`));
  [y0 + 40, y0 + (y1 - y0) * 0.8].forEach((yy) => (g += `<rect x="${xs[0] - 40}" y="${yy}" width="${xs[xs.length - 1] - xs[0] + 80}" height="${w * 1.4}" fill="${V(c, 0.3, 0.35)}"/>`));
  return g;
}
function sedan(x, y, s, o = {}) {
  const c = o.c || '#5a6a7a', dk = shade(c, -0.35), sx = o.flip ? -1 : 1;
  let g = `<g transform="translate(${x} ${y}) scale(${sx * s} ${s})" filter="url(#soft)"><ellipse cx="0" cy="6" rx="330" ry="22" fill="#000" opacity="0.35"/>`;
  g += `<path d="M-320,-40 L-316,-110 Q-250,-128 -170,-132 L-100,-200 Q20,-214 120,-200 L200,-130 Q290,-124 320,-100 L326,-40 Z" fill="${V(c, 0.25, 0.3)}"/>`;
  g += `<path d="M-90,-192 L-150,-132 L-10,-132 L-10,-196 Z M10,-196 L10,-132 L180,-132 L112,-194 Z" fill="${grad([[0, '#c8d8e4'], [1, '#5a6e7c']])}"/>`;
  g += `<rect x="-326" y="-64" width="652" height="16" rx="6" fill="${V('#cfd4d8', 0.4, 0.3)}"/><path d="M-10,-132 L-10,-48" stroke="${dk}" stroke-width="3"/>`;
  g += `<rect x="300" y="-104" width="24" height="18" rx="4" fill="#fff6d0"/>${o.lights ? glow(330, -95, 160, '#fff2c0', 0.6 * o.lights) : ''}<rect x="-324" y="-104" width="18" height="22" rx="4" fill="#c82a24"/>${o.tail ? glow(-330, -93, 120, '#ff3a30', 0.6 * o.tail) : ''}`;
  [-200, 200].forEach((wx) => (g += `<circle cx="${wx}" cy="-34" r="58" fill="#121214"/><circle cx="${wx}" cy="-34" r="28" fill="${R('#b8bcc0', 0.3, 0.3)}"/>`));
  return g + `</g>`;
}
// задняя часть машины, уезжающей по дороге (вид сзади)
function carBack(x, y, s, tail = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><ellipse cx="0" cy="8" rx="190" ry="20" fill="#000" opacity="0.35"/><path d="M-170,-20 L-176,-110 Q-150,-130 -110,-134 L-80,-200 Q0,-214 80,-200 L110,-134 Q150,-130 176,-110 L170,-20 Z" fill="${V('#7a2a24', 0.25, 0.35)}"/><path d="M-70,-192 L70,-192 L96,-138 L-96,-138 Z" fill="${grad([[0, '#f8c890'], [1, '#6a4a3a']])}"/><rect x="-160" y="-96" width="70" height="28" rx="6" fill="#d8302a"/><rect x="90" y="-96" width="70" height="28" rx="6" fill="#d8302a"/>${glow(-125, -82, 90, '#ff4a30', 0.6 * tail)}${glow(125, -82, 90, '#ff4a30', 0.6 * tail)}<rect x="-44" y="-70" width="88" height="26" rx="3" fill="#f0ece0"/><rect x="-176" y="-40" width="352" height="22" rx="6" fill="#c8ccd0"/><rect x="-170" y="-20" width="60" height="30" rx="6" fill="#121212"/><rect x="110" y="-20" width="60" height="30" rx="6" fill="#121212"/></g>`;
}
function house(x, y, s, lit = 1) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">`;
  g += `<path d="M-420,-360 L0,-560 L420,-360 Z" fill="${V('#3a3036', 0.15, 0.3)}"/><rect x="-380" y="-370" width="760" height="370" fill="${V('#c8c0ae', 0.08, 0.4)}"/>`;
  for (let i = 0; i < 10; i++) g += `<rect x="-380" y="${-360 + i * 36}" width="760" height="3" fill="#8a8272" opacity="0.4"/>`;
  [-250, 250].forEach((wx) => (g += `<rect x="${wx - 70}" y="-300" width="140" height="150" fill="${lit ? '#f8d890' : '#2a3040'}"/><path d="M${wx},-300 V-150 M${wx - 70},-225 H${wx + 70}" stroke="#4a3a2a" stroke-width="8"/><rect x="${wx - 90}" y="-310" width="20" height="170" fill="#3a4a5a"/><rect x="${wx + 70}" y="-310" width="20" height="170" fill="#3a4a5a"/>`));
  g += `<rect x="-60" y="-280" width="120" height="280" fill="${V('#5a2e22', 0.15, 0.3)}"/><circle cx="36" cy="-140" r="8" fill="#d8b44a"/>`;
  g += `<path d="M-440,-210 L440,-210 L420,-180 L-420,-180 Z" fill="#4a3a32"/>` + [-400, -140, 140, 400].map((px) => `<rect x="${px - 10}" y="-182" width="20" height="182" fill="#e8e2d4"/>`).join('');
  g += [0, 1, 2].map((i) => `<rect x="${-150 - i * 20}" y="${-i * 26}" width="${300 + i * 40}" height="26" fill="${shade('#9a9080', -i * 0.08)}"/>`).join('');
  g += `<rect x="-30" y="-250" width="60" height="12" fill="#2a2420"/>${lit ? glow(0, -230, 220, '#ffd890', 0.6) : ''}`;
  return g + `</g>`;
}
function tape(x0, y0, x1, y1, t, txt = 'POLICE LINE · DO NOT CROSS · ') {
  const sag = 20 + wave(t, 0.4) * 4;
  const id = 'tp' + Math.round(x0 + y0);
  def(`<path id="${id}" d="M${x0},${y0} Q${(x0 + x1) / 2},${(y0 + y1) / 2 + sag} ${x1},${y1}"/>`);
  return `<path d="M${x0},${y0} Q${(x0 + x1) / 2},${(y0 + y1) / 2 + sag} ${x1},${y1}" stroke="#f2cc2a" stroke-width="30" fill="none"/><text font-family="Arial Black, Arial" font-weight="900" font-size="18" fill="#1a1a1a" dy="6"><textPath href="#${id}">${txt.repeat(4)}</textPath></text>`;
}
function policeCar(x, y, s, t = 0, ph = 0, flip = false) {
  let g = `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})" filter="url(#soft)"><ellipse cx="0" cy="6" rx="330" ry="22" fill="#000" opacity="0.35"/>`;
  g += `<path d="M-320,-40 L-316,-110 Q-250,-128 -170,-132 L-100,-200 Q20,-214 120,-200 L200,-130 Q290,-124 320,-100 L326,-40 Z" fill="${V('#f0eee8', 0.1, 0.3)}"/><path d="M-320,-40 L-318,-84 L326,-84 L326,-40 Z" fill="#1a1c22"/>`;
  g += `<path d="M-90,-192 L-150,-132 L-10,-132 L-10,-196 Z M10,-196 L10,-132 L180,-132 L112,-194 Z" fill="${grad([[0, '#9ab0c0'], [1, '#3a4a5a']])}"/>`;
  g += `<g transform="scale(${flip ? -1 : 1} 1)">${label(flip ? 20 : -20, -96, 'SHERIFF', 26, '#1a1c22', 0.85, 'middle', 'Arial Black, Arial')}</g>`;
  const a = wave(t, 2.2, ph) > 0 ? 1 : 0.15, b2 = 1.15 - a;
  g += `<rect x="-60" y="-222" width="56" height="22" rx="6" fill="#e02a2a" opacity="${0.4 + 0.6 * a}"/><rect x="4" y="-222" width="56" height="22" rx="6" fill="#2a5ae8" opacity="${0.4 + 0.6 * b2}"/>${glow(-32, -212, 200, '#ff3a30', 0.55 * a)}${glow(32, -212, 200, '#3a6aff', 0.55 * b2)}`;
  [-200, 200].forEach((wx) => (g += `<circle cx="${wx}" cy="-34" r="58" fill="#121214"/><circle cx="${wx}" cy="-34" r="28" fill="${R('#b8bcc0', 0.3, 0.3)}"/>`));
  return g + `</g>`;
}
function camFlash(t, n, y0, y1, sd = 7, rate = 1) {
  reseed(sd); let g = '';
  for (let i = 0; i < n; i++) { const x = rnd() * 1080, y = y0 + rnd() * (y1 - y0), per = 0.7 + rnd() * 1.6, ph = rnd() * per; const f = ((t * rate + ph) % per) / per; if (f < 0.08) g += glow(x, y, 160, '#ffffff', 0.9 * (1 - f / 0.08)) + `<circle cx="${x}" cy="${y}" r="10" fill="#fff"/>`; }
  return g;
}
function photographer(x, y, s, c = '#1a1c22', flash = 0) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-70,0 L-80,-180 Q0,-215 80,-180 L70,0 Z" fill="${c}"/><circle cx="0" cy="-230" r="48" fill="${c}"/><rect x="-20" y="-270" width="70" height="46" rx="6" fill="#0c0c0e"/><circle cx="20" cy="-247" r="16" fill="#2a2a30"/><rect x="30" y="-296" width="26" height="22" fill="#1a1a1e"/>`;
  if (flash) g += glow(43, -285, 120, '#fff', flash) + `<rect x="32" y="-294" width="22" height="18" fill="#fff" opacity="${flash}"/>`;
  return g + `</g>`;
}
function newspaper(x, y, s, rot) {
  // пасхалка: название газеты kinoplot.film
  let g = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#soft)"><rect x="-170" y="-220" width="340" height="440" fill="${V('#ece6d8', 0.05, 0.12)}"/>`;
  g += label(0, -186, 'kinoplot.film', 22, '#2a2a2a', 0.75, 'middle', "Georgia, 'Times New Roman', serif") + `<rect x="-150" y="-176" width="300" height="3" fill="#2a2a2a"/>`;
  g += label(0, -132, 'PROFESSOR', 46, '#141414', 0.95, 'middle', 'Arial Black, Arial') + label(0, -86, 'ARRESTED', 46, '#141414', 0.95, 'middle', 'Arial Black, Arial');
  g += `<rect x="-150" y="-62" width="150" height="120" fill="#8a8680"/><circle cx="-75" cy="-20" r="30" fill="#5a5650"/><path d="M-130,58 Q-75,10 -20,58 Z" fill="#5a5650"/>`;
  for (let i = 0; i < 12; i++) g += `<rect x="${i < 6 ? 14 : -150}" y="${-60 + (i < 6 ? i : i - 3) * 20}" width="${i < 6 ? 136 : 300}" height="7" fill="#9a968e"/>`;
  return g + `</g>`;
}
function tvCamera(x, y, s, onAir = 0) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><path d="M0,0 L-80,260 M0,0 L80,260 M0,0 L0,270" stroke="#2a2a2e" stroke-width="12"/><rect x="-110" y="-110" width="200" height="110" rx="12" fill="${V('#2a2c32', 0.2, 0.3)}"/><rect x="-180" y="-90" width="80" height="70" rx="8" fill="#1a1a1e"/><circle cx="-180" cy="-55" r="30" fill="#3a4a6a"/><rect x="40" y="-140" width="40" height="30" fill="#ff3a30" opacity="${0.4 + 0.6 * onAir}"/>${onAir ? glow(60, -125, 60, '#ff3a30', 0.7) : ''}</g>`;
}
function spot(x, y, tx, ty, w, c, op) { return `<path d="M${x - 20},${y} L${x + 20},${y} L${tx + w},${ty} L${tx - w},${ty} Z" fill="${grad([[0, c, op], [1, c, 0]])}"/>`; }
function clock(x, y, r, hrs, min, face = '#f0ece2') {
  const a = (v, n) => (v / n) * Math.PI * 2 - Math.PI / 2;
  let g = `<circle cx="${x}" cy="${y}" r="${r}" fill="${R(face, 0.1, 0.15)}" stroke="#2a2a2a" stroke-width="${r * 0.08}"/>`;
  for (let i = 0; i < 12; i++) g += `<rect x="${x - 2}" y="${y - r * 0.9}" width="4" height="${r * 0.14}" fill="#2a2a2a" transform="rotate(${i * 30} ${x} ${y})"/>`;
  g += `<path d="M${x},${y} L${x + Math.cos(a(hrs, 12)) * r * 0.5},${y + Math.sin(a(hrs, 12)) * r * 0.5}" stroke="#1a1a1a" stroke-width="${r * 0.08}" stroke-linecap="round"/><path d="M${x},${y} L${x + Math.cos(a(min, 60)) * r * 0.75},${y + Math.sin(a(min, 60)) * r * 0.75}" stroke="#1a1a1a" stroke-width="${r * 0.05}" stroke-linecap="round"/>`;
  return g;
}
function secHand(x, y, r, sec, c = '#c82a24') {
  const a = (sec / 60) * Math.PI * 2 - Math.PI / 2;
  return `<path d="M${x - Math.cos(a) * r * 0.15},${y - Math.sin(a) * r * 0.15} L${x + Math.cos(a) * r * 0.85},${y + Math.sin(a) * r * 0.85}" stroke="${c}" stroke-width="${r * 0.025}" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${r * 0.05}" fill="${c}"/>`;
}
function recorder(x, y, s, t, spin = 1) {
  // кассетный диктофон с пасхалкой на наклейке
  let g = `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-130" y="-80" width="260" height="160" rx="16" fill="${V('#2a2a2e', 0.25, 0.3)}"/><rect x="-104" y="-60" width="208" height="92" rx="8" fill="#141416"/><rect x="-90" y="-50" width="180" height="72" rx="6" fill="#d8d0bc"/>`;
  g += label(0, -32, 'kinoplot.film', 14, '#3a3428', 0.75);
  [-46, 46].forEach((cx) => { g += `<circle cx="${cx}" cy="-2" r="20" fill="#f4f0e4"/><circle cx="${cx}" cy="-2" r="13" fill="#3a2e24"/>`; for (let k = 0; k < 6; k++) { const a = t * 6 * spin + (k * Math.PI) / 3; g += `<rect x="${cx - 2}" y="-14" width="4" height="8" fill="#f4f0e4" transform="rotate(${(a * 180) / Math.PI} ${cx} -2)"/>`; } });
  g += [0, 1, 2, 3].map((i) => `<rect x="${-100 + i * 54}" y="44" width="44" height="22" rx="4" fill="${i === 1 ? '#c82a24' : '#4a4a50'}"/>`).join('') + `<circle cx="100" cy="-66" r="6" fill="#ff3a30"/>${glow(100, -66, 30, '#ff3a30', 0.7)}`;
  return g + `</g>`;
}
function briefcase(x, y, s, open = 0) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">`;
  if (open > 0) g += `<path d="M-120,-90 L120,-90 L116,${-90 - 150 * open} L-116,${-90 - 150 * open} Z" fill="${V('#4a3a30', 0.2, 0.3)}"/>`;
  g += `<rect x="-120" y="-90" width="240" height="150" rx="12" fill="${V('#3a2a22', 0.2, 0.25)}"/><rect x="-100" y="-80" width="20" height="14" fill="#b8a050"/><rect x="80" y="-80" width="20" height="14" fill="#b8a050"/>`;
  if (open > 0) for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) g += `<rect x="${-110 + i * 44}" y="${-96 - j * 14 * open}" width="42" height="24" rx="3" fill="${V('#8aa878', 0.2, 0.25)}" stroke="#4a5a40" stroke-width="2"/><rect x="${-100 + i * 44}" y="${-90 - j * 14 * open}" width="24" height="10" fill="#e8e0c8" opacity="0.7"/>`;
  else g += `<path d="M-40,-90 L-40,-118 L40,-118 L40,-90" stroke="#2a201c" stroke-width="12" fill="none"/>`;
  return g + `</g>`;
}
function lamp(x, y, s, on = 1) { return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="50" ry="10" fill="#1a1612"/><path d="M0,0 L0,-160 L60,-220" stroke="#2a2420" stroke-width="10" fill="none"/><path d="M30,-250 L110,-200 L80,-170 Z" fill="${V('#7a4a24', 0.3, 0.2)}"/>${on ? glow(95, -175, 260, '#ffd890', 0.6 * on) : ''}</g>`; }
function papers(x, y, s, rot = 0, n = 3) {
  let g = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">`;
  for (let i = 0; i < n; i++) g += `<rect x="${-110 + i * 8}" y="${-70 - i * 6}" width="220" height="140" fill="${shade('#f0ece2', -i * 0.04)}" transform="rotate(${(i - 1) * 4})"/>` + [0, 1, 2, 3, 4].map((k) => `<rect x="${-90 + i * 8}" y="${-50 - i * 6 + k * 22}" width="${150 - k * 12}" height="5" fill="#9a9690" transform="rotate(${(i - 1) * 4})"/>`).join('');
  return g + `</g>`;
}
function photo(x, y, w, h, rot, c = '#8a8680', pin = '#c82a24') {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#soft)"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#f4f0e6"/><rect x="${-w / 2 + 8}" y="${-h / 2 + 8}" width="${w - 16}" height="${h - 30}" fill="${c}"/><circle cx="0" cy="${-h / 2 + 30}" r="${w * 0.16}" fill="${shade(c, -0.25)}"/><path d="M${-w * 0.3},${h / 2 - 22} Q0,${-h * 0.05} ${w * 0.3},${h / 2 - 22} Z" fill="${shade(c, -0.25)}"/><circle cx="0" cy="${-h / 2 + 4}" r="7" fill="${pin}"/></g>`;
}
function poles(pts, c = '#2a2018') {
  let g = '';
  pts.forEach(([x, y, h]) => { g += `<rect x="${x - h * 0.02}" y="${y - h}" width="${h * 0.04}" height="${h}" fill="${c}"/><rect x="${x - h * 0.16}" y="${y - h * 0.92}" width="${h * 0.32}" height="${h * 0.025}" fill="${c}"/>`; });
  for (const dx of [-0.13, 0.13]) { let d = ''; pts.forEach(([x, y, h], i) => { const px = x + dx * h, py = y - h * 0.92; if (!i) d += `M${px},${py}`; else { const [x0, y0, h0] = pts[i - 1]; d += ` Q${(x0 + dx * h0 + px) / 2},${(y0 - h0 * 0.92 + py) / 2 + 20} ${px},${py}`; } }); g += `<path d="${d}" stroke="${c}" stroke-width="1.5" fill="none"/>`; }
  return g;
}
function pumpjack(x, y, s, t, ph = 0, c = '#1e1612') {
  const a = wave(t, 0.35, ph) * 14;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}" stroke="${c}"><rect x="-90" y="-10" width="200" height="10"/><path d="M-40,0 L0,-140 L40,0" stroke-width="10" fill="none"/><g transform="rotate(${a} 0 -140)"><rect x="-120" y="-152" width="240" height="20" rx="4"/><path d="M110,-160 Q150,-140 110,-100 Z"/><rect x="-128" y="-140" width="10" height="90" rx="3"/></g><rect x="-136" y="-60" width="26" height="60"/></g>`;
}
function mesas(y, c, op = 1, sd = 1) {
  reseed(sd);
  let p = `M-20,${y}`, x = -20;
  while (x < 1100) { const w = 120 + rnd() * 240, h = 30 + rnd() * 110, flat = rnd() < 0.7; if (flat) p += ` L${x + w * 0.15},${y - h} L${x + w * 0.85},${y - h} L${x + w},${y}`; else p += ` Q${x + w * 0.5},${y - h * 0.8} ${x + w},${y}`; x += w + rnd() * 60; p += ` L${x},${y}`; }
  return `<path d="${p} L1100,${y + 40} L-20,${y + 40} Z" fill="${V(c, 0.12, 0.2)}" opacity="${op}"/>`;
}
function creosote(x, y, s, c = '#5a6a3a') {
  let g = '';
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28; g += `<path d="M${x},${y} Q${x + Math.cos(a) * 30 * s},${y + Math.sin(a) * 40 * s} ${x + Math.cos(a) * 70 * s},${y + Math.sin(a) * 80 * s}" stroke="#4a3a2a" stroke-width="${2.5 * s}" fill="none"/><ellipse cx="${x + Math.cos(a) * 66 * s}" cy="${y + Math.sin(a) * 76 * s}" rx="${22 * s}" ry="${14 * s}" fill="${shade(c, (i % 3) * 0.08)}"/>`; }
  return g;
}
function barbed(y, h, gap, c, x0 = -40, x1 = 1120) {
  let g = '';
  const posts = []; for (let x = x0; x <= x1; x += gap) posts.push(x);
  posts.forEach((x) => (g += `<rect x="${x - 6}" y="${y - h}" width="12" height="${h}" fill="${c}"/><path d="M${x},${y - h} l26,-22" stroke="${c}" stroke-width="7"/>`));
  [0.1, 0.4, 0.7].forEach((f) => posts.slice(0, -1).forEach((x) => { const yy = y - h * (1 - f); g += `<path d="M${x},${yy} Q${x + gap / 2},${yy + 12} ${x + gap},${yy}" stroke="${c}" stroke-width="2.5" fill="none"/>`; }));
  // спираль колючей проволоки сверху
  for (let x = x0; x < x1; x += 22) g += `<ellipse cx="${x}" cy="${y - h - 30}" rx="16" ry="22" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.8"/>`;
  return g;
}
function chainLink(x0, x1, y0, y1, c = '#c8ccd0', op = 0.35) {
  def(`<pattern id="cl" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M0,13 L13,0 L26,13 L13,26 Z" fill="none" stroke="${c}" stroke-width="2"/></pattern>`);
  return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="url(#cl)" opacity="${op}"/>`;
}
function watchTower(x, y, h, c, beam = 0, ang = 0) {
  const top = y - h;
  let g = '';
  if (beam) g += `<g transform="rotate(${ang} ${x} ${top - 40})"><path d="M${x - 10},${top - 40} L${x - 240},${top + 1300} L${x + 240},${top + 1300} L${x + 10},${top - 40} Z" fill="${grad([[0, '#eef2ff', 0.45 * beam], [1, '#eef2ff', 0]])}"/></g>`;
  g += `<g stroke="${c}" stroke-width="10"><line x1="${x - 46}" y1="${y}" x2="${x - 30}" y2="${top}"/><line x1="${x + 46}" y1="${y}" x2="${x + 30}" y2="${top}"/><line x1="${x - 40}" y1="${y - h * 0.3}" x2="${x + 40}" y2="${y - h * 0.6}" stroke-width="5"/><line x1="${x + 40}" y1="${y - h * 0.3}" x2="${x - 40}" y2="${y - h * 0.6}" stroke-width="5"/></g>`;
  g += `<rect x="${x - 58}" y="${top - 80}" width="116" height="80" fill="${c}"/><rect x="${x - 46}" y="${top - 66}" width="92" height="30" fill="${beam ? '#f8e8b0' : shade(c, 0.3)}"/><path d="M${x - 76},${top - 78} L${x},${top - 126} L${x + 76},${top - 78} Z" fill="${c}"/>`;
  if (beam) g += glow(x, top - 50, 90, '#eef2ff', 0.8 * beam);
  return g;
}
// Хантсвилл: кирпичные стены тюрьмы с часовой башней
function prison(x, y, s, o = {}) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  g += bricks(-600, -420, 1200, 420, o.c || '#9a4a36', 'pw') + `<rect x="-600" y="-420" width="1200" height="420" fill="${grad([[0, '#000', 0], [1, '#000', 0.35]])}"/>`;
  g += `<rect x="-610" y="-440" width="1220" height="24" fill="${shade(o.c || '#9a4a36', 0.25)}"/>`;
  for (let i = 0; i < 8; i++) g += `<rect x="${-540 + i * 140}" y="-330" width="40" height="90" fill="#1a1412"/>${o.lit ? `<rect x="${-536 + i * 140}" y="-326" width="32" height="82" fill="#f8d890" opacity="${(i * 37) % 3 ? 0.7 : 0.2}"/>` : ''}`;
  // часовая башня
  g += bricks(-120, -720, 240, 300, o.c || '#9a4a36', 'pt') + `<path d="M-140,-720 L0,-820 L140,-720 Z" fill="#5a2a22"/>` + clock(0, -610, 70, o.h ?? 2, o.m ?? 40, o.lit ? '#f8eec8' : '#f0ece2');
  if (o.lit) g += glow(0, -610, 160, '#f8e8b0', 0.5);
  if (o.sec != null) g += secHand(0, -610, 70, o.sec);
  g += `<rect x="-90" y="-200" width="180" height="200" fill="#2a1c18"/><path d="M-90,-200 Q0,-260 90,-200" fill="#2a1c18"/>`;
  return g + `</g>`;
}
function candleCrowd(t, y, n = 16, sd = 21) {
  reseed(sd); let g = '';
  for (let i = 0; i < n; i++) {
    const x = rnd() * 1120 - 20, yy = y + rnd() * 160, s = 0.7 + (yy - y) / 300, fl = 0.8 + 0.2 * wave(t, 2 + rnd(), rnd() * 6);
    g += `<g transform="translate(${x} ${yy}) scale(${s})"><path d="M-60,200 L-66,0 Q0,-30 66,0 L60,200 Z" fill="#141018"/><circle cx="0" cy="-50" r="40" fill="#141018"/>${glow(20, -20, 70 * fl, '#ffc860', 0.55)}<rect x="16" y="-10" width="8" height="34" fill="#f4eee0"/><ellipse cx="20" cy="-18" rx="5" ry="${10 * fl}" fill="#ffe08a"/></g>`;
    if (i % 5 === 2) g += `<g transform="translate(${x + 40} ${yy - 120}) rotate(${wave(t, 0.4, i) * 3})"><rect x="-4" y="0" width="8" height="160" fill="#3a2a1e"/><rect x="-80" y="-80" width="160" height="90" fill="#ece6d8"/><rect x="-62" y="-60" width="124" height="14" fill="#a82a24"/><rect x="-62" y="-36" width="90" height="12" fill="#2a2a2a"/></g>`;
  }
  return g;
}

const DAWN = [[0, '#2a3a5a'], [0.45, '#8a7a8a'], [0.7, '#e8a878'], [1, '#f6d8a8']];
const NIGHT = [[0, '#060a18'], [0.6, '#101a34'], [1, '#1e2a48']];
const NOON = [[0, '#6a9ac8'], [0.55, '#b8d0e0'], [1, '#f0e4c8']];
const DUSK = [[0, '#2a3a6a'], [0.45, '#c86a4a'], [0.8, '#f0a850'], [1, '#f8d890']];

const shots = {
  // 1. Крупно Гейл в камере смертников: луч из узкого окна на лице, тень решётки; камера отъезжает сквозь прутья в коридор
  hook(t, T) {
    const k = io(t / T), back = io(clamp((t - 0.6) / (T - 0.6)));
    const look = at(t, 2.6, 0.6); // «сам ждёт» — опускает взгляд
    const beam = 0.8 + 0.2 * wave(t, 0.3);
    const cell = [
      blocks(-200, 0, 1480, 1920, '#a89c86', 'cw'),
      `<rect width="1080" height="1920" fill="${grad([[0, '#000', 0.5], [0.5, '#000', 0.1], [1, '#000', 0.5]])}"/>`,
      // узкое окно под потолком и луч
      `<rect x="150" y="300" width="230" height="70" fill="#f8f0d8"/><path d="M150,300 h230 v70 h-230 Z M207,300 v70 M265,300 v70 M322,300 v70" stroke="#4a4038" stroke-width="10" fill="none"/>`,
      glow(265, 335, 220, '#fff4d0', 0.6),
      `<g filter="url(#blur8)"><path d="M150,300 L380,300 L${940 + k * 30},1500 L${560 + k * 30},1500 Z" fill="${grad([[0, '#fff2c8', 0.45 * beam], [1, '#fff2c8', 0.05]])}"/></g>`,
      // тень решётки на стене
      `<g opacity="0.25" transform="skewX(-14)">${[0, 1, 2, 3, 4].map((i) => `<rect x="${920 + i * 64}" y="640" width="18" height="700" fill="#000"/>`).join('')}</g>`,
      // койка
      `<rect x="80" y="1460" width="920" height="40" fill="${V('#6a6a6a', 0.2, 0.3)}"/><rect x="90" y="1420" width="900" height="50" rx="10" fill="${V('#8a8a7a', 0.15, 0.3)}"/><rect x="80" y="1500" width="920" height="420" fill="${V('#3a3a3c', 0.1, 0.4)}"/>`,
      `<rect x="120" y="1380" width="220" height="60" rx="24" fill="${V('#e8e4da', 0.1, 0.3)}"/>`,
      gale(560, 1560, 1.75, { pose: 'sit', arms: 'hold', look: lerp(-0.6, 0.15, look), lookUp: lerp(1, -0.5, look), frown: lerp(0.2, 0.55, look), worried: look > 0.5, nod: look * 1.5, blink: blink(t, 0.7) }),
      // свет из окна ложится на лицо
      `<g filter="url(#blur20)"><ellipse cx="${520}" cy="${1000}" rx="140" ry="190" fill="#fff4d8" opacity="${0.22 * beam}"/></g>`,
    ].join('');
    // решётка и коридор появляются по мере отъезда
    const z = lerp(1.0, 0.9, back);
    const front = [
      `<path d="M-200,-200 L1280,-200 L1280,2120 L-200,2120 Z M80,240 L1000,240 L1000,1640 L80,1640 Z" fill="#14161c" fill-rule="evenodd" opacity="${0.92 * back}"/>`,
      layer(back, blocks(-200, 1640, 1480, 500, '#5a5a5c', 'cf') + `<rect x="-200" y="1640" width="1480" height="500" fill="#000" opacity="0.45"/>`),
      layer(back, `<rect x="-200" y="1660" width="1480" height="40" fill="#2a2a2e"/>` + label(150, 1790, 'DEATH ROW', 40, '#e8d8b0', 0.6, 'start', 'Arial Black, Arial') + label(150, 1830, 'HUNTSVILLE · TEXAS', 20, '#e8d8b0', 0.45, 'start')),
      layer(clamp(back * 1.6), cellBars([70, 240, 400, 720, 880, 1010], 240, 1640)),
      // охранник проходит по коридору (силуэт)
      layer(at(t, 2.0, 0.8) * (1 - at(t, 3.6, 0.6)), `<g opacity="0.85">${person(lerp(1300, -200, clamp((t - 2) / 2.6)), 2150, 0.7, { shirt: '#1a1c22', pants: '#14161a', skin: '#1a1c22', hair: '#14161a', beard: false, cap: '#14161a', step: wave(t, 1.4), sil: 'url(#gsil)' })}</g>`),
    ].join('');
    def(`<filter id="gsil"><feFlood flood-color="#0a0c10"/><feComposite in2="SourceAlpha" operator="in"/></filter>`);
    return {
      cam: { z: 1.05, y: 0 },
      els: [`<g transform="translate(540 960) scale(${z}) translate(-540 -960)">${cell}</g>`, `<g transform="translate(540 960) scale(${lerp(1.55, 1.12, back)}) translate(-540 -960)">${front}</g>`, grade('#e8a868', 0.18), topShade(760, 0.5)],
    };
  },

  // 2. Аудитория в Остине, Гейл у доски → плавный сдвиг в телестудию: спор с губернатором под софитами
  professor(t, T) {
    const k = io(t / T), sw = at(t, 4.3, 0.9), crowd = at(t, 3.2, 0.6);
    const pan = lerp(0, -1080, sw);
    const hall = [
      sky([[0, '#3a2a20'], [1, '#6a4a32']]),
      // доска
      `<rect x="80" y="760" width="920" height="460" rx="8" fill="${V('#2e4a3a', 0.1, 0.25)}" stroke="#6a4a2a" stroke-width="18"/>`,
      label(300, 900, 'SOCRATES', 54, '#f0f0e4', 0.75, 'middle', "'Segoe Script','Comic Sans MS',cursive"),
      label(320, 990, '«жизнь без поиска —', 30, '#f0f0e4', 0.55, 'middle', "'Segoe Script','Comic Sans MS',cursive"),
      label(320, 1036, 'не жизнь»', 30, '#f0f0e4', 0.55, 'middle', "'Segoe Script','Comic Sans MS',cursive"),
      `<path d="M620,860 L900,860 M760,860 L760,1100 M640,1100 Q760,1010 880,1100" stroke="#f0f0e4" stroke-width="5" fill="none" opacity="0.55"/>`,
      `<rect x="80" y="1210" width="920" height="22" fill="#5a3a22"/>`,
      // Гейл у доски, жестикулирует
      prof(720, 1560, 1.0, { arms: t % 2.4 < 1.2 ? 'point' : 'raise', look: -0.8, smile: true, beard: false, frown: 0.05, blink: blink(t, 0.4) }),
      // кафедра
      `<path d="M820,1560 L1000,1560 L980,1300 L840,1300 Z" fill="${V('#6a4426', 0.2, 0.35)}"/><rect x="830" y="1290" width="160" height="20" fill="#7a5230"/>`,
      // ряды студентов (затылки), передний план — тёмнее; при «полные аудитории» поднимаются руки
      ...[0, 1, 2].map((r) => { reseed(40 + r); let g = ''; const y = 1600 + r * 130, s = 0.9 + r * 0.25; for (let i = 0; i < 7 - r; i++) { const x = (i + 0.5) * (1080 / (7 - r)) + (rnd() - 0.5) * 40; const hc = ['#2a1e16', '#6a4a2a', '#b88a4a', '#1a1412', '#8a5a3a'][Math.floor(rnd() * 5)], sc = ['#3a4a6a', '#6a3a3a', '#4a5a3a', '#5a5048', '#2a3a4a'][Math.floor(rnd() * 5)]; const up = crowd > 0 && (i + r) % 3 === 0 ? crowd : 0; g += `<g filter="url(#soft)">${up ? `<path d="M${x + 40 * s},${y - 60 * s} L${x + 60 * s},${y - 60 * s - 130 * s * up}" stroke="${sc}" stroke-width="${30 * s}" stroke-linecap="round"/><circle cx="${x + 60 * s}" cy="${y - 70 * s - 130 * s * up}" r="${16 * s}" fill="#d8a888"/>` : ''}<path d="M${x - 70 * s},${y + 120 * s} L${x - 66 * s},${y - 20 * s} Q${x},${y - 50 * s} ${x + 66 * s},${y - 20 * s} L${x + 70 * s},${y + 120 * s} Z" fill="${shade(sc, -r * 0.12)}"/><ellipse cx="${x}" cy="${y - 80 * s}" rx="${44 * s}" ry="${50 * s}" fill="${shade(hc, -r * 0.1)}"/></g>`; } return g; }),
      grade('#e8b878', 0.25),
    ].join('');
    const studio = [
      `<rect width="1080" height="1920" fill="${grad([[0, '#0a0c18'], [1, '#1a1e34']])}"/>`,
      // задник студии: экран с «LIVE» и звёздами Техаса
      `<rect x="120" y="700" width="840" height="420" rx="12" fill="${grad([[0, '#1e3a7a'], [1, '#0e1a3a']])}"/>`,
      `<path d="M540,780 l22,66 h70 l-56,40 l22,66 l-58,-40 l-58,40 l22,-66 l-56,-40 h70 Z" fill="#f0f0f4" opacity="0.25"/>`,
      `<rect x="160" y="740" width="150" height="50" rx="6" fill="#c82a24"/>` + label(235, 777, 'LIVE', 34, '#fff', 0.95, 'middle', 'Arial Black, Arial'),
      label(540, 1080, 'DEBATE · DEATH PENALTY', 28, '#c8d4f0', 0.6, 'middle', 'Arial Black, Arial'),
      spot(260, 600, 330, 1500, 260, '#fff6e0', 0.22), spot(820, 600, 760, 1500, 260, '#fff6e0', 0.22 + 0.12 * at(t, 5.0, 0.4)),
      // Гейл и губернатор за столом
      prof(330, 1560, 1.0, { pose: 'sit', arms: t % 1.6 < 0.8 ? 'point' : 'table', look: 0.9, beard: false, frown: 0.4, blink: blink(t, 1.2) }),
      figure(770, 1560, 1.0, { ...GOV, pose: 'sit', arms: 'table', look: -0.9, smile: at(t, 5.1, 0.4) > 0.5, frown: 0.3, blink: blink(t, 2.1) }),
      `<path d="M60,1420 L1020,1420 L1060,1600 L20,1600 Z" fill="${V('#2a3a6a', 0.25, 0.35)}"/><rect x="20" y="1600" width="1040" height="30" fill="#141a2e"/>`,
      `<rect x="250" y="1380" width="160" height="40" rx="4" fill="#f0ece0"/>` + label(330, 1408, 'Prof. GALE', 22, '#1a1a2a', 0.85) + `<rect x="680" y="1380" width="180" height="40" rx="4" fill="#f0ece0"/>` + label(770, 1408, 'GOV. HARDIN', 22, '#1a1a2a', 0.85),
      tvCamera(940, 1760, 1.1, 1),
      grade('#4a6ae8', 0.15),
    ].join('');
    return {
      cam: { z: lerp(1.0, 1.06, k), y: lerp(0, -20, k) },
      els: [par(pan, 0, hall + `<g transform="translate(1080 0)">${studio}</g>`), topShade(760, 0.5)],
    };
  },

  // 3. Ночь у дома: жена с сыном и чемоданом уезжают; Гейл один на ступеньках с коробкой из кабинета
  fall(t, T) {
    const k = io(t / T), walk = clamp((t - 0.2) / 2.2), drive = at(t, 3.1, 1.6);
    const wx = lerp(520, 200, io(walk)), gone = at(t, 2.3, 0.4);
    return {
      cam: { z: lerp(1.0, 1.1, k), x: lerp(0, -60, k), y: lerp(0, -40, k) },
      els: [
        sky(NIGHT),
        `<g>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<circle cx="${(i * 113) % 1080}" cy="${120 + ((i * 71) % 500)}" r="2" fill="#fff" opacity="${0.4 + 0.3 * wave(t, 0.4, i)}"/>`).join('')}</g>`,
        // соседние дома и дерево
        `<g opacity="0.7"><path d="M-80,1180 L60,1060 L200,1180 Z M880,1160 L1010,1050 L1140,1160 Z" fill="#14182a"/><rect x="-60" y="1180" width="240" height="140" fill="#1a1e30"/><rect x="900" y="1160" width="220" height="160" fill="#1a1e30"/><rect x="40" y="1220" width="40" height="40" fill="#f8d890" opacity="0.6"/></g>`,
        `<path d="M980,1320 Q960,1000 1000,760" stroke="#0e1018" stroke-width="40" fill="none"/>` + [[1000, 760, 200], [900, 860, 150], [1080, 900, 160]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#0e1420"/>`).join(''),
        house(600, 1560, 1.2, 1),
        `<rect x="-100" y="1560" width="1280" height="400" fill="${V('#1e2a1e', 0.05, 0.4)}"/><path d="M-100,1680 L1180,1680 L1180,1740 L-100,1740 Z" fill="#4a4a52"/><path d="M-100,1740 L1180,1740 L1180,1920 L-100,1920 Z" fill="#24242a"/>`,
        // фонарь у тротуара
        `<rect x="140" y="980" width="12" height="600" fill="#1a1a1e"/><path d="M146,980 Q146,950 200,950" stroke="#1a1a1e" stroke-width="10" fill="none"/>` + glow(200, 960, 260, '#ffd890', 0.5) + `<path d="M200,960 L60,1600 L360,1600 Z" fill="${grad([[0, '#ffd890', 0.25], [1, '#ffd890', 0]])}"/>`,
        // машина у тротуара: сначала ждёт, потом уезжает влево
        sedan(lerp(300, -800, drive), 1860, 1.05, { c: '#6a3a32', flip: true, lights: gone, tail: gone }),
        // жена и сын идут к машине
        layer(1 - gone, figure(wx, 1720, 0.72, { ...WIFE, step: wave(t, 1.3), look: -1, arms: 'hold', blink: blink(t, 0.5) }) + figure(wx + 130, 1720, 0.48, { ...SON, step: wave(t, 1.3, 1), look: 1, blink: blink(t, 1.5) }) + `<g filter="url(#soft)"><rect x="${wx - 150}" y="1590" width="90" height="120" rx="10" fill="${V('#5a3a22', 0.2, 0.3)}"/><rect x="${wx - 125}" y="1570" width="40" height="22" rx="6" fill="none" stroke="#3a2416" stroke-width="7"/></g>`),
        // Гейл на ступеньках, коробка с вещами
        gale(700, 1530, 0.9, { ...PROF, pose: 'sit', floor: 1580, arms: 'hold', look: lerp(-0.8, -1, gone), lookUp: 0, frown: 0.6, worried: true, nod: lerp(0, 2, drive), beard: false, blink: blink(t, 1) }),
        `<g filter="url(#soft)" transform="translate(-40 60)"><path d="M890,1500 L1010,1500 L1000,1400 L900,1400 Z" fill="${V('#b8946a', 0.2, 0.3)}"/><path d="M900,1400 L870,1370 M1000,1400 L1030,1370" stroke="#a8845a" stroke-width="10"/><rect x="915" y="1350" width="60" height="70" fill="#7a2a24" transform="rotate(-10 945 1385)"/><rect x="950" y="1360" width="40" height="60" fill="#e8e0c8" transform="rotate(8 970 1390)"/><rect x="920" y="1340" width="18" height="70" fill="#2a3a5a"/></g>`,
        glow(800, 1150, 240, '#ffd890', 0.2),
        grade('#3a4a8a', 0.3),
        topShade(760, 0.55),
      ],
    };
  },

  // 4. Рассвет: жёлтая лента, мигалки, детективы с фонарями → Гейла в наручниках ведут к машине, вспышки, газета (пасхалка)
  evidence(t, T) {
    const k = io(t / T), sw = at(t, 2.6, 0.6);
    const scene1 = [
      sky(DAWN),
      `<rect x="-100" y="1180" width="1280" height="800" fill="${V('#4a4a3a', 0.05, 0.4)}"/>`,
      // одинокий дом за городом
      `<g transform="translate(560 1250) scale(0.7)" filter="url(#soft)"><path d="M-380,-330 L0,-500 L380,-330 Z" fill="#2a2430"/><rect x="-340" y="-340" width="680" height="340" fill="${V('#9a9282', 0.05, 0.4)}"/><rect x="-60" y="-260" width="120" height="260" fill="#1a1410"/><rect x="-260" y="-270" width="120" height="120" fill="#e8d8a8" opacity="0.7"/><rect x="140" y="-270" width="120" height="120" fill="#1e2430"/></g>`,
      // машины шерифа с мигалками
      policeCar(200, 1440, 0.75, t, 0), policeCar(900, 1480, 0.8, t, 1.4, true),
      // детективы с фонарями
      ...[[420, 1560, 0.55, 1], [700, 1600, 0.6, -1]].map(([x, y, s, sd], i) => `<g>${figure(x, y, s, { ...COP, cop: false, cap: undefined, fedora: '#3a3028', shirt: i ? '#5a4a3a' : '#4a4a52', arms: 'point', look: sd, step: wave(t, 0.8, i), blink: blink(t, i) })}<path d="M${x + 130 * s},${y - 560 * s} L${x + sd * 600},${y - 30} L${x + sd * 380},${y + 40} Z" fill="${grad([[0, '#fff8d8', 0.35], [1, '#fff8d8', 0]])}"/></g>`),
      // жёлтые таблички улик
      ...[[360, 1700, '1'], [620, 1740, '2'], [860, 1690, '3']].map(([x, y, n]) => `<g filter="url(#soft)"><path d="M${x - 26},${y} L${x},${y - 50} L${x + 26},${y} Z" fill="#f2cc2a"/>${label(x, y - 8, n, 26, '#1a1a1a', 0.9, 'middle', 'Arial Black, Arial')}</g>`),
      tape(-40, 1640, 1120, 1600, t), tape(-40, 1820, 1120, 1860, t + 1),
      grade('#e8a868', 0.2),
    ].join('');
    const fl = camFlash(t, 7, 1000, 1500, 9, 1.3);
    const walkX = lerp(260, 520, io(clamp((t - 2.6) / 2.2)));
    const scene2 = [
      sky(DAWN),
      `<rect x="-100" y="1240" width="1280" height="800" fill="${V('#3a3a34', 0.05, 0.4)}"/>`,
      policeCar(820, 1500, 0.95, t, 0.7, true),
      ...[[60, 1700, 0.95], [980, 1760, 1.0], [-20, 1880, 1.15]].map(([x, y, s], i) => photographer(x, y, s, '#14161c', ((t * 1.3 + i * 0.37) % 1) < 0.08 ? 1 : 0)),
      figure(walkX - 210, 1700, 0.85, { ...COP, arms: 'hold', look: 1, step: wave(t, 1.2), blink: blink(t, 0.3) }),
      gale(walkX, 1690, 0.85, { ...PROF, arms: 'hold', cuffs: true, look: -0.6, lookUp: -0.3, frown: 0.7, worried: true, step: wave(t, 1.2, 1), blink: blink(t, 0.9) }),
      figure(walkX + 210, 1700, 0.85, { ...COP, arms: 'hold', look: -1, step: wave(t, 1.2, 2), blink: blink(t, 1.6) }),
      fl,
      // газета с заголовком — пасхалка kinoplot.film
      newspaper(lerp(1240, 840, at(t, 3.6, 0.7)), 1640, 0.62, lerp(30, 12, at(t, 3.6, 0.7))),
      grade('#d8a878', 0.2),
    ].join('');
    return {
      cam: { z: lerp(1.0, 1.08, k), x: lerp(20, -20, k) },
      els: [layer(1 - sw, scene1), layer(sw, scene2), topShade(760, 0.5)],
    };
  },

  // 5. Пыльная дорога к тюрьме Хантсвилла → комната свиданий: Гейл за стеклом, у Битси диктофон, чемоданчик с деньгами
  deal(t, T) {
    const k = io(t / T), sw = at(t, 1.6, 0.8), money = at(t, 3.3, 0.6), only = at(t, 5.9, 0.5);
    const car = lerp(-300, 560, io(clamp(t / 1.9)));
    const outside = [
      sky(NOON, 1300), mesas(1080, '#b88a64', 0.6, 4),
      prison(560, 1240, 0.9, { h: 9, m: 10 }),
      watchTower(120, 1300, 420, '#3a3230'), watchTower(980, 1300, 420, '#3a3230'),
      `<rect x="-100" y="1240" width="1280" height="700" fill="${V('#c8a878', 0.08, 0.3)}"/>`,
      chainLink(-40, 1120, 1150, 1330, '#e8e8e8', 0.4), barbed(1330, 180, 160, '#4a4440'),
      `<path d="M440,1920 L500,1340 L620,1340 L760,1920 Z" fill="#a8885e"/>`,
      `<g filter="url(#blur8)">${[0, 1, 2, 3].map((i) => `<ellipse cx="${car - 260 - i * 80}" cy="${1600 - i * 20}" rx="${100 + i * 40}" ry="${40 + i * 10}" fill="#e8d4a8" opacity="${0.5 - i * 0.1}"/>`).join('')}</g>`,
      sedan(car, 1640, 0.8, { c: '#7a2a24' }),
      creosote(80, 1800, 1.3), creosote(1000, 1760, 1.1),
      grade('#f0c080', 0.2),
    ].join('');
    const inside = [
      `<rect width="1080" height="1920" fill="${grad([[0, '#8a9488'], [1, '#5a6258']])}"/>`,
      blocks(0, 300, 1080, 1100, '#9aa496', 'vw'),
      // Гейл за стеклом
      gale(600, 1500, 1.7, { pose: 'sit', arms: only > 0.5 ? 'point' : 'table', look: lerp(-0.3, -0.7, only), frown: lerp(0.3, 0.1, money), smile: only > 0.6, blink: blink(t, 0.6) }),
      // стекло с бликами и рамой
      `<rect x="80" y="420" width="920" height="980" fill="#cfe4e8" opacity="0.14"/><path d="M180,460 L380,460 L160,1300 L80,1300 Z M700,460 L760,460 L560,1360 L500,1360 Z" fill="#fff" opacity="0.1"/><rect x="60" y="400" width="960" height="1020" fill="none" stroke="#4a5248" stroke-width="30"/><rect x="530" y="400" width="20" height="1020" fill="#4a5248" opacity="0"/>`,
      // стойка и телефонная трубка
      `<rect x="-40" y="1400" width="1160" height="560" fill="${V('#6a6e64', 0.15, 0.4)}"/><rect x="-40" y="1400" width="1160" height="18" fill="#8a8e84"/>`,
      `<path d="M140,1480 q-10,120 60,180" stroke="#1a1a1a" stroke-width="8" fill="none"/><rect x="100" y="1440" width="120" height="44" rx="20" fill="#1e1e1e"/>`,
      recorder(420, 1600, 0.85, t, 1),
      briefcase(lerp(1200, 840, at(t, 2.9, 0.6)), 1620, 1.0, money),
      // Битси со спины-плеча, в левом нижнем углу
      bitsey(130, 1930, 1.25, { pose: 'sit', arms: 'table', look: 1, frown: 0.35, blink: blink(t, 1.4) }),
      grade('#a8c8b8', 0.15),
    ].join('');
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -20, k) },
      els: [layer(1 - sw, outside), layer(sw, `<g transform="translate(540 960) scale(${lerp(1.08, 1, sw)}) translate(-540 -960)">${inside}</g>`), topShade(760, 0.5)],
    };
  },

  // 6. Ночной номер мотеля: Битси среди бумаг и вырезок, крутится кассета, тикают часы; мелькает толпа со свечами у ворот тюрьмы
  doubt(t, T) {
    const k = io(t / T), zoomClock = at(t, 3.2, 0.7), flash = at(t, 4.3, 0.25) * (1 - at(t, 5.0, 0.3));
    const sec = Math.floor((t + 0.5) * 1) + 40; // секундная стрелка прыгает раз в секунду
    const neon = wave(t, 0.8) > -0.6 ? 1 : 0.3;
    const room = [
      `<rect width="1080" height="1920" fill="${grad([[0, '#2a2420'], [1, '#3e3428']])}"/>`,
      // обои
      `<g opacity="0.25">${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 90}" y="0" width="40" height="1500" fill="#5a4a36"/>`).join('')}</g>`,
      // окно с неоном мотеля
      `<rect x="80" y="380" width="360" height="460" fill="${grad([[0, '#0a1024'], [1, '#1a2448']])}"/><text x="260" y="620" font-family="'Brush Script MT', cursive" font-size="90" fill="#ff5a6a" opacity="${0.9 * neon}" text-anchor="middle">Motel</text>${glow(260, 600, 220, '#ff4a6a', 0.35 * neon)}<rect x="70" y="370" width="380" height="480" fill="none" stroke="#5a4632" stroke-width="20"/><path d="M80,380 Q160,600 120,840" fill="#8a2a24" opacity="0.8"/>`,
      // стена с вырезками, фото и нитками
      `<rect x="500" y="380" width="520" height="560" fill="#b89a6a" opacity="0.5"/>`,
      photo(600, 470, 130, 150, -6, '#8a7a6a'), photo(800, 450, 130, 150, 5, '#6a7a8a'), photo(940, 600, 110, 130, -4, '#9a8070'), photo(650, 700, 140, 110, 3, '#7a8a7a'),
      papers(840, 780, 0.7, 8, 2),
      `<path d="M600,440 L800,420 L940,570 M600,440 L650,680 L840,760" stroke="#c82a24" stroke-width="4" fill="none"/>`,
      // часы на стене
      clock(860, 1080, 90, 11, 47) + secHand(860, 1080, 90, sec),
      // стол, лампа, бумаги
      `<rect x="-40" y="1480" width="1160" height="460" fill="${V('#5a3a24', 0.15, 0.4)}"/><rect x="-40" y="1480" width="1160" height="14" fill="#7a5232"/>`,
      lamp(120, 1490, 1.1, 1),
      bitsey(560, 1700, 1.15, { pose: 'sit', arms: 'table', look: lerp(-0.2, 0.6, at(t, 1.6, 0.6)), lookUp: at(t, 3.3, 0.4) * 1, frown: lerp(0.2, 0.6, k), worried: k > 0.4, blink: blink(t, 0.8) }),
      papers(300, 1580, 0.9, -12, 3), papers(820, 1620, 0.8, 10, 2),
      recorder(560, 1700, 0.9, t, 1),
      `<rect x="860" y="1520" width="50" height="70" rx="6" fill="#e8e0d0"/><rect x="866" y="1530" width="38" height="20" fill="#8a5a34"/>`,
      glow(240, 1500, 420, '#ffd890', 0.25),
      grade('#e8a058', 0.2),
    ].join('');
    const vigil = [
      sky(NIGHT),
      prison(540, 1300, 0.95, { lit: 1, h: 11, m: 50 }),
      chainLink(-40, 1120, 1200, 1400, '#c8ccd0', 0.35), barbed(1400, 200, 180, '#2a2a30'),
      `<rect x="-100" y="1400" width="1280" height="600" fill="#0e1018"/>`,
      candleCrowd(t, 1420, 18, 21),
      grade('#e8a058', 0.2),
    ].join('');
    return {
      cam: { z: lerp(1.0, 1.04, k) + zoomClock * 0.35 * (1 - flash), x: -zoomClock * 112 * (1 - flash), y: zoomClock * -40 * (1 - flash) },
      els: [layer(1 - flash, room), layer(flash, `<g transform="translate(540 960) scale(0.75) translate(-540 -960)">${vigil}</g>`), topShade(760, 0.5)],
    };
  },

  // 7. Машина Битси мчится по шоссе через прерию на закате: качалки, столбы, указатель «Huntsville»
  road(t, T) {
    const k = io(t / T), v = t * 1.0;
    const poleX = (i) => ((i * 0.33 + v * 0.35) % 1.32);
    const plist = [0, 1, 2, 3].map((i) => { const q = poleX(i); return [lerp(620, 1400, q * q), lerp(1240, 1900, q * q), lerp(70, 900, q * q)]; }).sort((a, b) => a[2] - b[2]);
    const signQ = clamp((t - 1.0) / 2.6), sq = signQ * signQ;
    return {
      cam: { z: lerp(1.0, 1.05, k), x: lerp(0, -30, k) },
      els: [
        sky(DUSK, 1300),
        glow(540, 1180, 520, '#ffe0a0', 0.8), `<circle cx="540" cy="1190" r="70" fill="#fff2c8" opacity="0.9"/>`,
        mesas(1240, '#6a3a40', 0.9, 7),
        `<rect x="-100" y="1240" width="1280" height="700" fill="${grad([[0, '#8a5a3a'], [1, '#3a2418']])}"/>`,
        // качалки на горизонте (силуэты)
        pumpjack(lerp(200, 120, k), 1260, 0.5, t, 0), pumpjack(lerp(860, 940, k), 1262, 0.42, t, 1.4), pumpjack(lerp(960, 1080, k), 1270, 0.6, t, 2.2),
        // шоссе в перспективу
        `<path d="M520,1240 L560,1240 L1000,1920 L80,1920 Z" fill="${grad([[0, '#3a3236'], [1, '#1e1a1c']])}"/>`,
        ...[0, 1, 2, 3, 4, 5].map((i) => { const q = ((i / 6 + v * 0.6) % 1), qq = q * q; return `<path d="M${540 - 2 - qq * 6},${lerp(1240, 1920, qq)} L${540 + 2 + qq * 6},${lerp(1240, 1920, qq)} L${540 + 4 + qq * 12},${lerp(1240, 1920, qq) + 40 * qq} L${540 - 4 - qq * 12},${lerp(1240, 1920, qq) + 40 * qq} Z" fill="#f2cc4a" opacity="0.9"/>`; }),
        `<path d="M528,1240 L120,1920 M552,1240 L960,1920" stroke="#d8d0c0" stroke-width="5" opacity="0.6"/>`,
        poles(plist.map(([x, y, h]) => [x, y, h]), '#1a1210'),
        // указатель Huntsville справа, приближается
        signQ > 0 ? `<g transform="translate(${lerp(640, 1300, sq)} ${lerp(1240, 1500, sq)}) scale(${lerp(0.1, 1.6, sq)})" filter="url(#soft)"><rect x="-6" y="-60" width="12" height="260" fill="#6a6a6a"/><rect x="-170" y="-220" width="340" height="170" rx="14" fill="#1e6a3a" stroke="#f0f0e8" stroke-width="6"/>${label(0, -150, 'HUNTSVILLE', 40, '#f4f4ec', 1, 'middle', 'Arial, sans-serif')}${label(0, -90, '12 mi', 34, '#f4f4ec', 1, 'middle', 'Arial, sans-serif')}</g>` : '',
        // машина Битси — вид сзади, слегка покачивается
        carBack(540 + wave(t, 0.5) * 10, 1650 + wave(t, 1.6) * 2, 1.4, 0.6 + 0.4 * wave(t, 1)),
        `<g filter="url(#blur8)">${[0, 1, 2].map((i) => `<ellipse cx="${540 + (i - 1) * 160}" cy="${1700 + i * 10}" rx="${120 + i * 30}" ry="30" fill="#d8b088" opacity="${0.25 + 0.1 * wave(t, 2, i)}"/>`).join('')}</g>`,
        grade('#f0a050', 0.25),
        topShade(760, 0.5),
      ],
    };
  },

  // 8. Ночь: часы на башне тюрьмы почти полночь, Битси бежит к воротам под прожектором → Гейл в камере поднимает глаза к окну
  question(t, T) {
    const k = io(t / T), sw = at(t, 2.2, 0.8), run = clamp(t / 2.4);
    const scene1 = [
      sky(NIGHT),
      prison(540, 1260, 1.05, { lit: 1, h: 11, m: 56, sec: Math.floor(t + 0.5) * 6 % 60 + 40 }),
      watchTower(110, 1300, 420, '#16141a', 1, lerp(-25, 25, (wave(t, 0.25) + 1) / 2)),
      chainLink(-40, 1120, 1160, 1340, '#c8ccd0', 0.3), barbed(1340, 180, 180, '#2a2a30'),
      `<rect x="-100" y="1260" width="1280" height="700" fill="${V('#1a1a24', 0.05, 0.4)}"/>`,
      `<path d="M400,1340 L680,1340 L1000,1920 L80,1920 Z" fill="#24242e"/>`,
      bitsey(540, lerp(1960, 1700, io(run)), lerp(1.0, 0.75, io(run)), { step: wave(t, 2.4) * 1.6, arms: 'pull', look: 0, lookUp: 1, frown: 0.6, worried: true, lean: wave(t, 2.4) * 5, nod: wave(t, 4.8) * 0.6, blink: false }),
      glow(540, 1500, 300, '#eef2ff', 0.18),
      grade('#3a5ab8', 0.25),
    ].join('');
    const scene2 = [
      blocks(-200, 0, 1480, 1920, '#5a5a6a', 'cw2'),
      `<rect width="1080" height="1920" fill="#060814" opacity="0.6"/>`,
      `<rect x="640" y="420" width="230" height="70" fill="#c8d4f8"/><path d="M640,420 h230 v70 h-230 Z M697,420 v70 M755,420 v70 M812,420 v70" stroke="#2a2a3a" stroke-width="10" fill="none"/>`,
      glow(755, 455, 240, '#c8d8ff', 0.6),
      `<g filter="url(#blur8)"><path d="M640,420 L870,420 L700,1500 L300,1500 Z" fill="${grad([[0, '#c8d8ff', 0.35], [1, '#c8d8ff', 0.03]])}"/></g>`,
      gale(480, 1700, 1.5, { pose: 'sit', arms: 'down', look: lerp(0, 0.9, at(t, 2.6, 1.0)), lookUp: lerp(0, 1, at(t, 2.6, 1.0)), frown: 0.25, blink: blink(t, 0.5) }),
      `<g filter="url(#blur20)"><ellipse cx="520" cy="1060" rx="140" ry="180" fill="#c8d8ff" opacity="0.18"/></g>`,
      `<rect x="-40" y="1700" width="1160" height="260" fill="${V('#2a2a34', 0.1, 0.4)}"/>`,
      grade('#4a6ad8', 0.3),
    ].join('');
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -30, k) },
      els: [layer(1 - sw, scene1), layer(sw, scene2), topShade(760, 0.5)],
    };
  },
};

void smoke; void shadow; void creosote;
run(shots);
