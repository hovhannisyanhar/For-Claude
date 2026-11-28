// ЭКСПЕРИМЕНТ (не регламент): «Зависнуть в Палм-Спрингс» по методике Claude — риг v2, разные крупности, монтаж в ритм слов,
// переходы-рывки. Фоны и предметы скопированы из scenes2d/palm-springs.js. Сценарий — videos/palm-springs-x/script.json.
// Пустыня Калифорнии: бирюза бассейнов, белые курортные домики середины века, пальмы, розово-лиловые горы, гирлянды свадьбы ночью.
import { figure as fig2, head as head2, mixExpr } from './rig.js';
import { def } from './core.js';
import { run, person, setProportions, V, R, grad, glow, rnd, reseed, shade, lerp, clamp, wave } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// ---------- персонажи ----------
// Найлз: тёмные взъерошенные кудри, щетина, красная гавайская рубашка с цветами нараспашку, плавки
const NIL = { shirt: '#d8443a', pants: '#2a6a8a', skin: '#e2b08a', hair: '#2a1e18', iris: '#4a3422', beard: false, frown: 0.15, nil: true };
// Сара: тёмные волосы до плеч, розовое платье подружки невесты, золотые серёжки
const SAR = { shirt: '#d9789a', robe: '#d9789a', skin: '#f0c6a6', hair: '#3a2418', iris: '#5a3a24', beard: false, frown: 0.1, longHair: true, sar: true };

const D = 0.13; // AUDIO_DELAY
const io = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const at = (t, a, d = 0.5) => io((t - D - a) / d);
const blink = (t, ph = 0) => ((t + ph) % 3.4) < 0.12;
const sky = (stops, h = 1920) => `<rect x="-1200" y="-600" width="3480" height="${h + 600}" fill="${grad(stops)}"/>`;
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const topShade = (h = 800, a = 0.5) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const layer = (op, inner) => op <= 0.001 ? '' : `<g opacity="${op.toFixed(3)}">${inner}</g>`;
const par = (dx, dy, svg) => `<g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})">${svg}</g>`;
const label = (x, y, txt, size = 16, c = '#2a2a2a', op = 0.8, anchor = 'middle', font = 'Arial', weight = 700) => `<text x="${x}" y="${y}" font-family="${font}" font-weight="${weight}" font-size="${size}" fill="${c}" opacity="${op}" text-anchor="${anchor}">${txt}</text>`;

function geo(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const pose = o.pose || 'stand';
  const legH = (pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  const headY = top - hr * 0.8 + (o.nod || 0) * 6 * hs;
  return { hs, hr, top, ty, headY, ey: headY + 2 * hs };
}
function hibiscus(cx, cy, r, c) {
  return [0, 72, 144, 216, 288].map((a) => `<circle cx="${cx + Math.cos(a * Math.PI / 180) * r * 0.7}" cy="${cy + Math.sin(a * Math.PI / 180) * r * 0.7}" r="${r * 0.55}" fill="${c}"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="${r * 0.28}" fill="#8a1a22"/>`;
}
function dress(x, y, s, o) {
  const { hr, hs, top, ty, headY, ey } = geo(x, y, s, o);
  let b = '', front = '';
  if (o.nil) {
    // открытый ворот, загорелая грудь, цветы и листья на рубашке
    reseed(7);
    for (let i = 0; i < 22; i++) {
      const py = top + 20 * s + rnd() * (ty - top - 30 * s), px = x + (rnd() - 0.5) * 170 * s;
      b += `<ellipse cx="${px + 14 * s}" cy="${py + 10 * s}" rx="${12 * s}" ry="${5 * s}" fill="#2a8a7a" transform="rotate(${rnd() * 180} ${px} ${py})"/>`;
      b += hibiscus(px, py, 10 * s, i % 3 ? '#ffd24a' : '#fff0dc');
    }
    b += `<path d="M${x - 36 * s},${top - 6 * s} L${x},${top + 110 * s} L${x + 36 * s},${top - 6 * s} Z" fill="${V(shade(o.skin, -0.05), 0.1, 0.12)}"/>`;
    b += `<path d="M${x - 64 * s},${top - 12 * s} L${x - 8 * s},${top + 100 * s} L${x - 40 * s},${top + 40 * s} Z M${x + 64 * s},${top - 12 * s} L${x + 8 * s},${top + 100 * s} L${x + 40 * s},${top + 40 * s} Z" fill="${shade('#d8443a', 0.15)}"/>`;
    // взъерошенные кудри
    front += `<g fill="${V('#3a2a20', 0.12, 0.2)}">${[[-0.8, -0.6, 0.32], [-0.5, -0.92, 0.36], [-0.1, -1.04, 0.36], [0.32, -0.98, 0.35], [0.72, -0.72, 0.32], [0.9, -0.35, 0.22], [-0.9, -0.3, 0.22], [0.1, -0.78, 0.3], [-0.3, -0.72, 0.26]].map(([dx, dy, r]) => `<circle cx="${x + dx * hr}" cy="${headY + dy * hr}" r="${r * hr}"/>`).join('')}</g>`;
    front += `<path d="M${x - hr * 0.3},${headY - hr * 0.62} q${hr * 0.1},${hr * 0.22} ${hr * 0.02},${hr * 0.38}" stroke="#2a1e18" stroke-width="${7 * hs}" fill="none" stroke-linecap="round"/>`;
    // щетина
    front += `<path d="M${x - hr * 0.82},${headY + hr * 0.2} Q${x - hr * 0.7},${headY + hr * 1.02} ${x},${headY + hr * 1.02} Q${x + hr * 0.7},${headY + hr * 1.02} ${x + hr * 0.82},${headY + hr * 0.2} Q${x + hr * 0.5},${headY + hr * 0.6} ${x},${headY + hr * 0.6} Q${x - hr * 0.5},${headY + hr * 0.6} ${x - hr * 0.82},${headY + hr * 0.2} Z" fill="#4a3a30" opacity="0.22"/>`;
    // ухмылка уголком
    if (o.smirk) front += `<path d="M${x - 18 * hs},${ey + 58 * hs} Q${x + 4 * hs},${ey + 64 * hs} ${x + 26 * hs},${ey + 46 * hs}" stroke="#7a3a30" stroke-width="${5.5 * hs}" fill="none" stroke-linecap="round"/>`;
    // тёмные очки: на глазах или подняты на лоб
    if (o.shades) {
      const sy = o.shades === 'up' ? headY - hr * 0.5 : ey;
      front += `<g filter="url(#soft)">${[-1, 1].map((sd) => `<rect x="${x + sd * 36 * hs - 27 * hs}" y="${sy - 18 * hs}" width="${54 * hs}" height="${38 * hs}" rx="${14 * hs}" fill="${V('#1a1a22', 0.3, 0.2)}"/><path d="M${x + sd * 36 * hs - 16 * hs},${sy - 8 * hs} l${14 * hs},${-4 * hs}" stroke="#fff" stroke-width="${4 * hs}" opacity="0.5"/>`).join('')}<path d="M${x - 9 * hs},${sy - 6 * hs} q${9 * hs},${-6 * hs} ${18 * hs},0" stroke="#1a1a22" stroke-width="${5 * hs}" fill="none"/></g>`;
    }
  }
  if (o.sar) {
    // вырез платья, ключицы, тонкая цепочка
    b += `<path d="M${x - 70 * s},${top - 8 * s} Q${x},${top + 90 * s} ${x + 70 * s},${top - 8 * s} Q${x},${top - 30 * s} ${x - 70 * s},${top - 8 * s} Z" fill="${V(o.skin, 0.05, 0.1)}"/>`;
    b += `<path d="M${x - 40 * s},${top + 22 * s} Q${x},${top + 60 * s} ${x + 40 * s},${top + 22 * s}" stroke="#e8c060" stroke-width="${2.5 * s}" fill="none"/>`;
    b += `<path d="M${x - 70 * s},${top + 90 * s} Q${x},${top + 130 * s} ${x + 70 * s},${top + 90 * s}" stroke="${shade('#d9789a', -0.2)}" stroke-width="${4 * s}" fill="none" opacity="0.6"/>`;
    // чёлка с пробором, серёжки, помада
    front += `<path d="M${x - hr * 0.95},${headY + hr * 0.1} Q${x - hr * 0.9},${headY - hr * 1.02} ${x + hr * 0.1},${headY - hr * 0.98} Q${x - hr * 0.25},${headY - hr * 0.55} ${x - hr * 0.8},${headY + hr * 0.25} Z" fill="${V('#4a2e1e', 0.15, 0.2)}"/>`;
    front += `<path d="M${x + hr * 0.1},${headY - hr * 0.98} Q${x + hr * 0.95},${headY - hr * 0.9} ${x + hr * 0.95},${headY + hr * 0.15} Q${x + hr * 0.7},${headY - hr * 0.55} ${x + hr * 0.1},${headY - hr * 0.98} Z" fill="${V('#4a2e1e', 0.15, 0.2)}"/>`;
    front += [-1, 1].map((sd) => `<circle cx="${x + sd * hr * 0.96}" cy="${headY + 40 * hs}" r="${7 * hs}" fill="${R('#f0c850', 0.3, 0.3)}"/>`).join('');
    if (o.angry) front += `<path d="M${x - 18 * hs},${ey + 60 * hs} Q${x},${ey + 50 * hs} ${x + 18 * hs},${ey + 60 * hs}" stroke="#a03a44" stroke-width="${6 * hs}" fill="none" stroke-linecap="round"/>`;
    else if (o.gasp) front += `<ellipse cx="${x}" cy="${ey + 60 * hs}" rx="${12 * hs}" ry="${16 * hs}" fill="#7a2a2e"/>`;
    else if (!o.smile) front += `<path d="M${x - 18 * hs},${ey + 56 * hs} Q${x},${ey + (o.soft ? 66 : 62) * hs} ${x + 18 * hs},${ey + 56 * hs}" stroke="#c0505a" stroke-width="${6 * hs}" fill="none" stroke-linecap="round"/>`;
  }
  return { b, front };
}
function figure(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b });
  if (!front || o.sil) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}>${front}</g>`;
}
const nil = (x, y, s, o = {}) => figure(x, y, s, { ...NIL, ...o });
const sar = (x, y, s, o = {}) => figure(x, y, s, { ...SAR, ...o });
// банка пива в руке (x,y — центр)
const can = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#soft)"><rect x="-22" y="-40" width="44" height="80" rx="8" fill="${V('#e8403a', 0.3, 0.3)}"/><rect x="-22" y="-12" width="44" height="22" fill="#f4ece0"/><rect x="-18" y="-46" width="36" height="8" rx="3" fill="#c8c8c8"/><rect x="-14" y="-34" width="6" height="64" fill="#fff" opacity="0.35"/></g>`;

// ---------- пустыня и курорт ----------
function mountains(y, t = 0, o = {}) {
  const c1 = o.far || '#c8a0b8', c2 = o.mid || '#a87a98', c3 = o.near || '#8a6a6a';
  return `<path d="M-100,${y} L-40,${y - 260} L120,${y - 380} L260,${y - 300} L420,${y - 460} L600,${y - 330} L760,${y - 420} L920,${y - 280} L1180,${y - 360} L1180,${y} Z" fill="${V(c1, 0.1, 0.1)}" opacity="0.85"/>`
    + `<path d="M-100,${y} L80,${y - 170} L240,${y - 120} L420,${y - 220} L620,${y - 140} L820,${y - 230} L1000,${y - 120} L1180,${y - 180} L1180,${y} Z" fill="${V(c2, 0.08, 0.15)}"/>`
    + `<path d="M-100,${y} L200,${y - 60} L500,${y - 30} L800,${y - 80} L1180,${y - 40} L1180,${y + 6} L-100,${y + 6} Z" fill="${c3}" opacity="0.8"/>`;
}
function palm(x, base, h = 700, t = 0, ph = 0, c = '#2e7a4a') {
  const sw = wave(t, 0.22, ph) * 14, tx = x + sw + h * 0.08, ty = base - h;
  let g = `<path d="M${x - 16},${base} Q${x + h * 0.02},${base - h * 0.5} ${tx - 8},${ty} L${tx + 8},${ty} Q${x + h * 0.05},${base - h * 0.5} ${x + 16},${base} Z" fill="${V('#8a6a4a', 0.15, 0.3)}"/>`;
  for (let i = 1; i < 12; i++) { const k = i / 12; g += `<path d="M${lerp(x, tx, k) - 14 * (1 - k * 0.5)},${lerp(base, ty, k)} l${28 * (1 - k * 0.5)},4" stroke="#6a4a32" stroke-width="3" opacity="0.6"/>`; }
  for (let i = 0; i < 9; i++) {
    const a = -170 + i * 42 + wave(t, 0.3, ph + i) * 4, r = h * (0.32 + (i % 2) * 0.06);
    const ex = tx + Math.cos(a * Math.PI / 180) * r, ey = ty + Math.sin(a * Math.PI / 180) * r * 0.55 + r * 0.35;
    const mx = tx + Math.cos(a * Math.PI / 180) * r * 0.5, my = ty + Math.sin(a * Math.PI / 180) * r * 0.5 - r * 0.12;
    g += `<path d="M${tx},${ty} Q${mx},${my - 30} ${ex},${ey} Q${mx},${my + 20} ${tx},${ty} Z" fill="${shade(c, (i % 3) * 0.08 - 0.08)}"/>`;
  }
  return g + `<circle cx="${tx}" cy="${ty + 10}" r="${h * 0.025}" fill="#5a4a2a"/>`;
}
// дерево Джошуа: колючие ветки с пучками на концах
function joshua(x, base, s = 1, c = '#5a6a3a') {
  const br = [[0, -200, -60, -300], [0, -200, 70, -280], [-60, -300, -110, -360], [70, -280, 120, -380], [0, -150, 0, -260]];
  let g = `<path d="M${x - 10 * s},${base} L${x - 8 * s},${base - 200 * s} L${x + 8 * s},${base - 200 * s} L${x + 10 * s},${base} Z" fill="#6a5a44"/>`;
  br.forEach(([x0, y0, x1, y1]) => { g += `<path d="M${x + x0 * s},${base + y0 * s} L${x + x1 * s},${base + y1 * s}" stroke="#6a5a44" stroke-width="${12 * s}" stroke-linecap="round"/><circle cx="${x + x1 * s}" cy="${base + y1 * s - 10 * s}" r="${24 * s}" fill="${c}"/>`; });
  return g;
}
function cactus(x, base, s = 1) { return `<g fill="${V('#4a8a4a', 0.15, 0.25)}"><rect x="${x - 16 * s}" y="${base - 150 * s}" width="${32 * s}" height="${150 * s}" rx="${16 * s}"/><rect x="${x - 56 * s}" y="${base - 110 * s}" width="${22 * s}" height="${60 * s}" rx="${11 * s}"/><rect x="${x - 56 * s}" y="${base - 66 * s}" width="${50 * s}" height="${18 * s}" rx="${9 * s}"/><rect x="${x + 34 * s}" y="${base - 130 * s}" width="${22 * s}" height="${70 * s}" rx="${11 * s}"/><rect x="${x + 6 * s}" y="${base - 76 * s}" width="${50 * s}" height="${18 * s}" rx="${9 * s}"/></g>`; }
// курортный домик середины века: плоская крыша с выносом, стекло, бирюзовая дверь
function bungalow(x, base, w = 380, o = {}) {
  const h = o.h || 220, top = base - h;
  let g = `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${V(o.c || '#f4efe4', 0.06, 0.12)}"/>`;
  g += `<rect x="${x - 30}" y="${top - 26}" width="${w + 60}" height="28" fill="${V('#e8e2d4', 0.1, 0.25)}"/><rect x="${x - 30}" y="${top + 2}" width="${w + 60}" height="10" fill="#000" opacity="0.12"/>`;
  g += `<rect x="${x + w * 0.08}" y="${top + h * 0.25}" width="${w * 0.45}" height="${h * 0.5}" fill="${o.lit ? '#ffcf7a' : '#5a8aa0'}"/><path d="M${x + w * 0.3},${top + h * 0.25} v${h * 0.5}" stroke="#f4efe4" stroke-width="4"/>`;
  if (o.lit) g += glow(x + w * 0.3, top + h * 0.5, w * 0.4, '#ffb050', 0.4);
  g += `<rect x="${x + w * 0.66}" y="${top + h * 0.3}" width="${w * 0.18}" height="${h * 0.7}" fill="${o.door || '#2aa0a8'}"/>`;
  g += Array.from({ length: 6 }, (_, i) => `<rect x="${x + w * 0.56 + (i % 2) * 14}" y="${top + h * 0.2 + i * h * 0.12}" width="10" height="${h * 0.08}" fill="#e0d8c8"/>`).join('');
  return g;
}
// бассейн: бирюза с бегущими бликами
function pool(x0, y0, x1, y1, t, o = {}) {
  const c = o.c || '#2cc8d8';
  let g = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${grad([[0, shade(c, 0.25)], [0.5, c], [1, shade(c, -0.25)]])}"/>`;
  for (let i = 0; i < 16; i++) {
    const yy = y0 + (i + 0.5) * (y1 - y0) / 16, a = 6 + i * 0.9;
    let d = `M${x0},${yy}`;
    for (let x = x0; x <= x1; x += 40) d += ` L${x},${yy + Math.sin(x * 0.02 + t * 2.2 + i * 1.7) * a}`;
    g += `<path d="${d}" stroke="${o.night ? '#9af4ff' : '#e8ffff'}" stroke-width="${2 + i * 0.25}" fill="none" opacity="${o.night ? 0.25 : 0.35}"/>`;
  }
  return g;
}
// надувной круг: задняя и передняя половины (между ними — человек и вода)
const ring = (x, y, rx, ry, c, part) => {
  const th = ry * 0.75;
  if (part === 'back') return `<path d="M${x - rx},${y} A${rx} ${ry} 0 0 1 ${x + rx},${y}" stroke="${shade(c, -0.15)}" stroke-width="${th}" fill="none"/>`;
  return `<g filter="url(#soft)"><path d="M${x - rx},${y} A${rx} ${ry} 0 0 0 ${x + rx},${y}" stroke="${c}" stroke-width="${th}" fill="none"/><path d="M${x - rx * 0.8},${y + ry * 0.5} A${rx * 0.9} ${ry * 0.9} 0 0 0 ${x + rx * 0.2},${y + ry * 0.95}" stroke="#fff" stroke-width="${th * 0.18}" fill="none" opacity="0.5" stroke-linecap="round"/></g>`;
};
// гирлянда лампочек провисает между двумя точками
function lights(x0, y0, x1, y1, sag, n, t = 0, on = 1) {
  let g = `<path d="M${x0},${y0} Q${(x0 + x1) / 2},${(y0 + y1) / 2 + sag * 2} ${x1},${y1}" stroke="#2a2420" stroke-width="3" fill="none"/>`;
  for (let i = 1; i < n; i++) {
    const k = i / n, x = (1 - k) * (1 - k) * x0 + 2 * k * (1 - k) * (x0 + x1) / 2 + k * k * x1;
    const y = (1 - k) * (1 - k) * y0 + 2 * k * (1 - k) * ((y0 + y1) / 2 + sag * 2) + k * k * y1;
    const fl = 0.85 + 0.15 * wave(t, 0.7, i);
    g += glow(x, y + 10, 34, '#ffc870', 0.55 * on * fl) + `<circle cx="${x}" cy="${y + 10}" r="7" fill="${on ? '#fff0c0' : '#c8c0b0'}"/>`;
  }
  return g;
}
function clouds(t, y = 300, c = '#fff', op = 0.8, seed = 21) { let g = ''; reseed(seed); for (let i = 0; i < 4; i++) { const cx = (rnd() * 1400 + t * (10 + i * 4)) % 1500 - 200, cy = y + rnd() * 220, s = 0.6 + rnd() * 0.7; g += `<g opacity="${op}" fill="${c}">${[[0, 0, 60], [70, -20, 80], [150, 0, 60], [80, 20, 70]].map(([dx, dy, r]) => `<circle cx="${cx + dx * s}" cy="${cy + dy * s}" r="${r * s}"/>`).join('')}</g>`; } return `<g filter="url(#blur4)">${g}</g>`; }
function stars(n, h, t, op = 1, seed = 5) { let g = ''; reseed(seed); for (let i = 0; i < n; i++) g += `<circle cx="${rnd() * 1080}" cy="${rnd() * h}" r="${rnd() < 0.1 ? 2.6 : 1.3}" fill="#fff" opacity="${op * (0.3 + 0.6 * rnd()) * (0.7 + 0.3 * wave(t, 0.4 + rnd() * 0.4, i))}"/>`; return g; }
// гость свадьбы (маленькая фигура)
const guest = (x, y, s, i, t, o = {}) => person(x, y, s, { shirt: ['#e8d8b0', '#7a9ac8', '#c8708a', '#5a7a5a', '#f0f0e8', '#3a4a6a'][i % 6], pants: '#3a3a44', skin: ['#e8b896', '#c88a64', '#f0c8a8', '#a8704a'][i % 4], hair: ['#2a1e18', '#8a6a3a', '#1a1414', '#c8a060'][i % 4], beard: false, longHair: i % 3 === 1, robe: i % 3 === 1 ? ['#e8a0b8', '#a8c8e8', '#f0d890'][i % 3] : undefined, nod: wave(t, 0.6, i) * 2, smile: o.smile, arms: o.arms, look: wave(t, 0.2, i * 2) * 0.6, blink: blink(t, i * 0.7), lean: o.lean ? o.lean * wave(t, 1.1, i) : 0 });
// фейерверк: шар искр раскрывается и гаснет
function firework(x, y, t, t0, c, r = 260) {
  const k = (t - t0) / 1.6; if (k < 0 || k > 1) return '';
  const e = 1 - Math.pow(1 - k, 3), op = 1 - k;
  let g = glow(x, y, r * 1.2 * e, c, 0.35 * op);
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, rr = r * e, x1 = x + Math.cos(a) * rr, y1 = y + Math.sin(a) * rr + k * k * 60; g += `<path d="M${x + Math.cos(a) * rr * 0.7},${y + Math.sin(a) * rr * 0.7 + k * k * 50} L${x1},${y1}" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity="${op}"/><circle cx="${x1}" cy="${y1}" r="5" fill="#fff" opacity="${op}"/>`; }
  return g;
}


// ================= методика v2 =================
const VIS = (T) => T - 24 / 30; // конец видимой части клипа (дальше — запас под растворение)
const ws = (s) => D + s; // время слова в клипе
const seg = (t, a, b) => t >= a && t < b;
const rad = (a) => a * Math.PI / 180, deg = (a) => a * 180 / Math.PI;
const ease3 = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
// рывок камеры: уход в конце клипа и приход в начале (размытие в движении)
const whipOut = (t, T, dir = 1) => { const k = clamp((t - (VIS(T) - 0.2)) / 0.2), e = k * k; return { x: -dir * e * 1400, blur: e * 70 }; };
const whipIn = (t, dir = 1) => { const k = clamp(t / 0.22), e = (1 - k) * (1 - k); return { x: dir * e * 1400, blur: e * 70 }; };
const camMix = (c, ...w) => ({ ...c, x: (c.x || 0) + w.reduce((a, b) => a + b.x, 0), blur: Math.max(c.blur || 0, ...w.map((b) => b.blur)) });
const flashRect = (op, c = '#fff8e8') => op > 0.001 ? `<rect x="-2000" y="-2000" width="5080" height="5920" fill="${c}" opacity="${clamp(op).toFixed(3)}"/>` : '';
const nightTint = (op, c = '#1a1f5a') => op > 0.001 ? `<rect x="-2000" y="-2000" width="5080" height="5920" fill="${c}" opacity="${op.toFixed(3)}" style="mix-blend-mode:multiply"/>` : '';
// камера, наведённая на точку (px, py) мира так, чтобы она оказалась на экране в (sx, sy)
const aim = (z, px, py, sx = 540, sy = 1120) => ({ z, x: sx - 540 - z * (px - 540), y: sy - 960 - z * (py - 960) });
const lerpCam = (a, b, k) => ({ z: lerp(a.z, b.z, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });
// голова фигуры (для предметов у рта, наведения камеры)
const headAt = (x, y, s, pose = 'stand', legs = 0.85) => { const hr = 96 * s * 1.3, legL = pose === 'stand' ? 430 * s * legs : 0; return { x, y: y - legL - 300 * s - hr * 1.18, r: hr }; };

// группа с собственной камерой (для плавной смены планов внутри сцены)
let satN = 0;
const camG = (c, els) => {
  let g = `<g transform="translate(${540 + (c.x || 0)} ${960 + (c.y || 0)}) scale(${c.z ?? 1}) rotate(${c.rot || 0}) translate(-540 -960)">${els.join('')}</g>`;
  if (c.sat != null && c.sat < 0.999) { const id = 'sat' + (satN++); def(`<filter id="${id}"><feColorMatrix type="saturate" values="${Math.max(0, c.sat).toFixed(3)}"/></filter>`); g = `<g filter="url(#${id})">${g}</g>`; }
  return g;
};
// смена плана внутри сцены — мягким растворением: новый план проявляется поверх последнего кадра прежнего
const smooth = (fn, bounds, fade = 0.4) => (t, T) => {
  const cur = fn(t, T);
  for (const b of bounds) if (t >= b && t < b + fade) {
    const prev = fn(b - 0.001, T), w = ease3((t - b) / fade);
    return { cam: { z: 1, x: 0, y: 0 }, els: [camG(prev.cam, prev.els), `<g opacity="${w.toFixed(3)}">${camG(cur.cam, cur.els)}</g>`] };
  }
  return cur;
};

const shirtPat = (px, sy, hy2, sc) => { reseed(7); let g = ''; for (let j = 0; j < 26; j++) { const yy = sy + rnd() * (hy2 - sy), xx = px + (rnd() - 0.5) * 240 * sc; g += `<ellipse cx="${xx + 16 * sc}" cy="${yy + 10 * sc}" rx="${14 * sc}" ry="${6 * sc}" fill="#2a8a7a" transform="rotate(${rnd() * 180} ${xx} ${yy})"/>` + hibiscus(xx, yy, 12 * sc, j % 3 ? '#ffd24a' : '#fff0dc'); } return g; };
const NX = { skin: '#e2b08a', hair: '#2a1e18', hairStyle: 'curly', shirt: '#d8443a', pants: '#2a6a8a', collar: 'open', sleeves: 'short', stubble: true, pattern: shirtPat, iris: '#4a3422' };
const SX = { skin: '#f0c6a6', hair: '#3a2418', hairStyle: 'bob', shirt: '#d9789a', skirt: '#d9789a', pants: '#f0c6a6', collar: 'round', sleeves: 'short', earrings: '#f0c850', lips: '#c0505a', iris: '#5a3a24', shoes: '#b85a7a' };
const N2 = (x, y, s, o = {}) => fig2(x, y, s, { ...NX, ...o });
const S2 = (x, y, s, o = {}) => fig2(x, y, s, { ...SX, ...o });
const GUESTS = [
  { shirt: '#e8d8b0', pants: '#3a3a44', skin: '#e8b896', hair: '#2a1e18', hairStyle: 'short' },
  { shirt: '#a8c8e8', skirt: '#a8c8e8', pants: '#c88a64', skin: '#c88a64', hair: '#1a1414', hairStyle: 'bob' },
  { shirt: '#3a4a6a', pants: '#2a2a34', skin: '#f0c8a8', hair: '#8a6a3a', hairStyle: 'short' },
  { shirt: '#f0d890', skirt: '#f0d890', pants: '#a8704a', skin: '#a8704a', hair: '#2a1e18', hairStyle: 'bob' },
  { shirt: '#5a7a5a', pants: '#3a3a44', skin: '#e8b896', hair: '#c8a060', hairStyle: 'short' },
  { shirt: '#e8a0b8', skirt: '#e8a0b8', pants: '#f0c8a8', skin: '#f0c8a8', hair: '#6a3a24', hairStyle: 'bob' },
];
const G2 = (i, x, y, s, o = {}) => fig2(x, y, s, { collar: 'round', sleeves: i % 2 ? 'short' : 'long', ...GUESTS[i % GUESTS.length], ...o });
const canItem = (k) => `<g transform="scale(${k * 0.9})"><rect x="-22" y="-40" width="44" height="80" rx="8" fill="${V('#e8403a', 0.3, 0.3)}"/><rect x="-22" y="-12" width="44" height="22" fill="#f4ece0"/><rect x="-18" y="-46" width="36" height="8" rx="3" fill="#c8c8c8"/><rect x="-14" y="-34" width="6" height="64" fill="#fff" opacity="0.35"/></g>`;
const glassItem = (k) => `<g transform="scale(${k})"><path d="M-16,-80 L16,-80 L8,-20 L-8,-20 Z" fill="#fff8d0" opacity="0.85"/><path d="M-12,-74 L12,-74 L7,-40 L-7,-40 Z" fill="#ffd86a" opacity="0.8"/><rect x="-2.5" y="-20" width="5" height="34" fill="#fff" opacity="0.85"/></g>`;
const micItem = (k) => `<g transform="scale(${k})"><rect x="-9" y="-10" width="18" height="70" rx="6" fill="#2a2a2e"/><ellipse cx="0" cy="-26" rx="20" ry="24" fill="${R('#6a6a70', 0.3, 0.3)}"/></g>`;
// сутки: цвета неба по фазе 0..1 (день → закат → ночь → рассвет → день)
function dayCycle(cyc) {
  const KEYS = [[0, ['#3f9ee6', '#9ad4f4', '#f4e0c8'], 0], [0.28, ['#2a2a6a', '#e8607a', '#ffb060'], 0.25], [0.5, ['#060a24', '#141a44', '#2a2a5a'], 0.62], [0.74, ['#5a78c8', '#f0a8a0', '#ffd8a8'], 0.2], [1, ['#3f9ee6', '#9ad4f4', '#f4e0c8'], 0]];
  let i = 0; while (i < KEYS.length - 2 && cyc > KEYS[i + 1][0]) i++;
  const [k0, c0, n0] = KEYS[i], [k1, c1, n1] = KEYS[i + 1], kk = clamp((cyc - k0) / (k1 - k0));
  return { sky: c0.map((c, j) => mixC(c, c1[j], kk)), night: lerp(n0, n1, kk) };
}
function mixC(a, b, k) { const p = (h) => [1, 3, 5].map((j) => parseInt(h.slice(j, j + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, j) => Math.round(lerp(v, B[j], k)).toString(16).padStart(2, '0')).join(''); }
// телефон на тумбочке крупно: время и дата
function phone(x, y, s, t, time, buzz = 0) {
  const r = buzz * Math.sin(t * 60) * 2.5;
  return `<g transform="translate(${x} ${y}) rotate(${-6 + r}) scale(${s})" filter="url(#soft)"><rect x="-130" y="-80" width="260" height="160" rx="24" fill="#151518"/><rect x="-118" y="-68" width="236" height="136" rx="16" fill="${V('#2a3a6a', 0.2, 0.2)}"/>${label(0, -6, time, 56, '#fff', 0.97, 'middle', 'Arial', 800)}${label(0, 40, '9 ноября', 26, '#cfe0ff', 0.92)}</g>` + glow(x, y, 260 * s, '#8ab0ff', 0.3 + buzz * 0.25);
}
// спальня отеля (мир 1080×1920), кровать с подушкой; who — голова на подушке рисуется снаружи
function bedroom2(t, o = {}) {
  let g = `<rect x="-400" y="-400" width="1880" height="2720" fill="${V(o.wall || '#f2e6d0', 0.05, 0.15)}"/>`;
  g += `<rect x="560" y="300" width="440" height="560" fill="#ffe8b0"/>` + Array.from({ length: 14 }, (_, i) => `<rect x="560" y="${300 + i * 40}" width="440" height="${24 + 6 * wave(t, 0.2, i)}" fill="#e8d4b0"/>`).join('');
  g += `<g opacity="0.2">${Array.from({ length: 7 }, (_, i) => `<path d="M560,${330 + i * 80} L1000,${330 + i * 80} L860,${1500 + i * 80} L100,${1500 + i * 80} Z" fill="#fff4c8"/>`).join('')}</g>`;
  g += `<rect x="120" y="380" width="300" height="220" fill="#2aa0a8" opacity="0.6"/><rect x="134" y="394" width="272" height="192" fill="${V('#f0a868', 0.2, 0.2)}"/><circle cx="270" cy="500" r="50" fill="#fff0c0" opacity="0.8"/>`;
  g += `<rect x="40" y="900" width="760" height="300" rx="30" fill="${V('#c8a878', 0.15, 0.25)}"/>`;
  g += `<rect x="0" y="1150" width="840" height="800" rx="40" fill="${V('#f8f6f0', 0.05, 0.15)}"/>`;
  g += `<ellipse cx="260" cy="1180" rx="210" ry="80" fill="${V('#ffffff', 0, 0.14)}"/>`;
  g += `<rect x="790" y="1240" width="300" height="420" fill="${V('#a8784a', 0.15, 0.3)}"/><rect x="790" y="1240" width="300" height="24" fill="${shade('#a8784a', 0.15)}"/>`;
  g += `<g transform="translate(980 1170)"><path d="M-50,60 L50,60 L30,-40 L-30,-40 Z" fill="#f4e8d0"/>${glow(0, 0, 140, '#ffe0a0', 0.2)}<rect x="-6" y="60" width="12" height="20" fill="#8a6a4a"/></g>`;
  return g;
}
const blanket = (y0 = 1330, c = '#ffffff') => `<path d="M-60,${y0 + 40} Q300,${y0 - 40} 860,${y0 + 20} L860,2000 L-60,2000 Z" fill="${V(c, 0, 0.16)}"/><path d="M-60,${y0 + 40} Q300,${y0 - 40} 860,${y0 + 20}" stroke="#e4e0d8" stroke-width="10" fill="none"/>`;

const shotsRaw = {
  // 1. Хук: прокрутка суток вокруг невозмутимого Найлза → наезд → «кем работал?» → ухмылка и салют банкой; уход рывком
  hook(t, T) {
    const w = (a) => t - D - a;
    const cyc = io(clamp(w(0.62) / 1.15));
    const { sky: skyC, night } = dayCycle(cyc);
    const sa = Math.PI * (1 - clamp(cyc / 0.45)), sunX = 540 + Math.cos(sa) * 520, sunY = 760 - Math.sin(sa) * 520;
    const moonK = clamp((cyc - 0.35) / 0.3) * (1 - clamp((cyc - 0.68) / 0.12));
    const push = io(clamp(w(1.75) / 1.5));
    const bob = wave(t, 0.35) * 12, bobV = Math.cos(t * 0.35 * Math.PI * 2);
    const thinkK = io(clamp(w(2.3) / 0.45)), smugK = io(clamp(w(3.15) / 0.3));
    let e = mixExpr('tired', 'think', thinkK); e = mixExpr(e, 'smirk', smugK);
    const toast = io(clamp(w(3.2) / 0.4));
    const X = 560, Y = 1860 + bob, s = 1.62;
    const H = headAt(X, Y, s, 'sit');
    const tu = lerp(0.35, 0.2, thinkK) + wave(t, 0.18) * 0.04;
    const rHand = { x: lerp(X + 330, X + 300, toast), y: lerp(1610 + bob, 1180 + bob, toast), pose: 'hold', item: canItem, rot: lerp(0, -20, toast) };
    const lHand = { x: X - 340, y: 1615 + bob + wave(t, 0.5) * 6, pose: 'open', rot: 70 };
    const fig = N2(X, Y, s, { pose: 'sit', shades: 'up', turn: tu, tilt: lerp(-4, 3, thinkK) + wave(t, 0.3) * 1.5, breathe: (wave(t, 0.25) + 1) / 2, hairLag: -bobV * 0.4,
      expr: e, look: { x: lerp(0.2, 0.7, thinkK) - smugK * 0.9, y: lerp(0, 0.8, thinkK) * (1 - smugK) }, blink: (t < D + 0.55) || blink(t, 1.1), hands: { l: lHand, r: rHand }, rim: { c: '#ffe2b8', dx: 9, dy: -5, op: 1 - night } });
    const fx = X + tu * 12 * s + tu * 0.26 * H.r;
    const els = [
      sky([[0, skyC[0]], [0.42, skyC[1]], [0.56, skyC[2]]]),
      stars(80, 900, t, night * 1.3),
      cyc < 0.47 ? glow(sunX, sunY, 260, '#fff2c0', 0.7) + `<circle cx="${sunX}" cy="${sunY}" r="58" fill="#fff6d8"/>` : '',
      moonK > 0 ? `<g opacity="${moonK}">${glow(780, 330, 220, '#c8d4ff', 0.5)}<circle cx="780" cy="330" r="52" fill="#f2f0e6"/></g>` : '',
      layer(1 - night * 1.5, clouds(t * (1 + cyc * 30), 300, '#fff', 0.85)),
      par(-push * 9, push * 40, mountains(1020, t)),
      par(-push * 18, push * 20, bungalow(-60, 1080, 360, { h: 180, lit: night > 0.3 }) + bungalow(760, 1090, 400, { h: 190, door: '#f08a5a', lit: night > 0.3 }) + palm(330, 1090, 620, t, 0) + palm(700, 1100, 520, t, 1.4) + palm(980, 1080, 700, t, 2.6)),
      layer(night * 1.4, lights(-40, 820, 1120, 860, 50, 14, t)),
      `<rect x="0" y="1060" width="1080" height="40" fill="#f2ece0"/>`,
      pool(0, 1095, 1080, 1920, t),
      `<ellipse cx="${X + 60}" cy="${1720 + bob}" rx="480" ry="120" fill="#06505a" opacity="0.25" filter="url(#blur20)"/>`,
      ring(X, 1690 + bob, 430, 170, '#ff5fa2', 'back'),
      fig,
      `<rect x="0" y="${1655 + bob}" width="1080" height="400" fill="#2cc8d8" opacity="0.5"/>`,
      ring(X, 1690 + bob, 430, 170, '#ff5fa2', 'front'),
      nightTint(night * 0.55),
      grade('#ffd8a0', 0.25 * (1 - night)),
      topShade(620, 0.45),
    ];
    const z = lerp(1.0, 1.3, push);
    const cam = { z, x: lerp(0, -(fx - 540) * 1.3, push), y: lerp(0, -(H.y - 960) * 1.3 + 120, push) };
    return { cam, els };
  },

  // 2. Свадьба в пустыне: Найлз зевает в последнем ряду → наезд в солнце, вспышка → телефон крупно 6:59 → 7:00 → отъезд: он снова в кровати, «заново» — глаза открываются
  morning(t, T) {
    const tA = ws(2.73), tB = ws(3.55);
    const els = [];
    let cam;
    if (t < tA) {
      const k = io(clamp(t / tA));
      const yawn = clamp((t - ws(1.1)) / 0.25) * (1 - clamp((t - ws(1.75)) / 0.3));
      const X = 820, Y = 1560, s = 0.82;
      const H = headAt(X, Y, s, 'sit');
      const chairs = (y, sc, xs) => xs.map((x) => `<g filter="url(#soft)"><rect x="${x - 46 * sc}" y="${y - 170 * sc}" width="${92 * sc}" height="${130 * sc}" rx="${10 * sc}" fill="#f8f6f0" stroke="#d8d0c0" stroke-width="3"/><rect x="${x - 50 * sc}" y="${y - 50 * sc}" width="${100 * sc}" height="${18 * sc}" fill="#f0ece4"/><rect x="${x - 44 * sc}" y="${y - 34 * sc}" width="${8 * sc}" height="${60 * sc}" fill="#d8d0c0"/><rect x="${x + 36 * sc}" y="${y - 34 * sc}" width="${8 * sc}" height="${60 * sc}" fill="#d8d0c0"/></g>`).join('');
      const arch = `<path d="M400,1130 L400,830 Q570,650 740,830 L740,1130" stroke="#f4f0e8" stroke-width="18" fill="none"/>` + Array.from({ length: 26 }, (_, i) => { const a = Math.PI * (i / 25); const r = 170; return `<circle cx="${570 - Math.cos(a) * r}" cy="${850 - Math.sin(a) * r * 1.05}" r="${22 + (i % 3) * 5}" fill="${['#ffffff', '#f4b8c8', '#ff8aa8', '#a8d890'][i % 4]}"/>`; }).join('');
      const couple = G2(2, 530, 1130, 0.24, { turn: 0.3, expr: 'smile' }) + G2(5, 610, 1130, 0.24, { turn: -0.3, expr: 'smile', shirt: '#fbf8f0', skirt: '#fbf8f0', flare: 2 });
      const backRow = [[160, 1300, 0], [300, 1300, 1], [740, 1300, 2], [880, 1300, 3], [220, 1420, 4], [380, 1420, 5], [700, 1420, 0]].map(([x, y, i]) => G2(i, x, y, 0.42, { pose: 'sit', back: true, tilt: wave(t, 0.4, i) * 3 })).join('');
      els.push(
        sky([[0, '#5ab0ec'], [0.45, '#bfe4f8'], [0.6, '#f6e2c8']]), clouds(t, 280, '#fff', 0.8, 9),
        glow(760, 300, 300, '#fff8d0', 0.8), `<circle cx="760" cy="300" r="64" fill="#fffbe8"/>`,
        par(k * 20, 0, mountains(1080, t)),
        par(k * 40, 0, palm(60, 1150, 640, t, 0.4) + palm(1060, 1150, 720, t, 2) + joshua(900, 1130, 0.8)),
        `<rect x="-400" y="1110" width="1900" height="1000" fill="${V('#e8dcc0', 0.05, 0.12)}"/><path d="M500,1120 L640,1120 L980,1920 L160,1920 Z" fill="#f8f4ec" opacity="0.8"/>`,
        arch, couple, chairs(1300, 0.6, [160, 300, 440, 700, 840, 980]), backRow, chairs(1430, 0.7, [220, 380, 540]),
        // Найлз в последнем ряду, с краю, подпёр щёку кулаком; банка на стуле рядом
        `<g filter="url(#soft)"><rect x="${X - 70}" y="${Y - 150}" width="140" height="160" rx="12" fill="#f8f6f0" stroke="#d8d0c0" stroke-width="3"/></g>`,
        N2(X, Y, s, { pose: 'sit', legsDown: 150, shades: 'up', turn: -0.35, tilt: -10 + wave(t, 0.3) * 2, expr: yawn > 0.3 ? { brows: [0.3, 0.3], browTilt: -0.3, lid: 0.85, mouth: 'o' } : 'tired', talk: yawn, look: { x: -0.5, y: 0.1 }, blink: blink(t, 0.7), breathe: (wave(t, 0.25) + 1) / 2,
          hands: { r: { x: H.x - 60, y: H.y + H.r * 1.05, pose: 'fist', rot: -60 }, l: { x: X - 60, y: Y + 30, pose: 'open', rot: 30 } } }),
        `<g transform="translate(${X + 150} ${Y + 40})">${canItem(1.0)}</g>`,
        grade('#ffe0b0', 0.22),
      );
      // камера: общий → к Найлзу; в конце — рывок к солнцу и вспышка
      cam = lerpCam({ z: 1, x: 0, y: 0 }, aim(1.25, X - 40, H.y + 80, 540, 1150), io(clamp((t - 0.2) / 2.4)));
    } else {
      const ph = phone(940, 1210, 1, t, t < ws(3.38) ? '6:59' : '7:00', t > ws(3.38) ? 1 - clamp((t - ws(3.38)) / 1.2) : 0);
      const wake = clamp((t - ws(4.5)) / 0.12);
      const e = wake > 0 ? mixExpr('surprised', 'tired', clamp((t - ws(4.9)) / 0.5)) : 'neutral';
      // лежит на спине: фигура повёрнута на 90°, голова на подушке, тело под одеялом, рука поверх
      const body = `<g transform="rotate(-90 230 1150)">${N2(230, 1150 + 812 * 0.74, 0.74, { shades: false, expr: e, blink: wake < 1, turn: 0.1, look: { x: 0, y: 0.6 }, breathe: (wave(t, 0.25) + 1) / 2, shadow: false, hands: { l: { x: 230 - 30, y: 1150 + 330, pose: 'open', rot: 90 } } })}</g>`;
      const bump = `<path d="M440,1250 Q470,1060 600,1070 Q740,1080 860,1100 L860,1460 L440,1460 Z" fill="${V('#fdfcf8', 0, 0.14)}"/><path d="M440,1250 Q470,1060 600,1070 Q740,1080 860,1100" stroke="#e4e0d8" stroke-width="8" fill="none"/>`;
      els.push(bedroom2(t), body, bump, blanket(1360, '#fdfcf8'), ph, grade('#ffd8a0', 0.22));
      const out = io(clamp((t - tB) / 1.0));
      cam = lerpCam(aim(2.2, 940, 1210, 540, 1150), aim(1.0, 540, 1180, 540, 1180), out);
    }
    els.push(topShade(620, 0.45));
    return { cam, els };
  },
  // 3. Вечеринка в ритм слов: «смирился» — пожал плечами под гирляндами → «пиво в бассейне» — вид сверху на круг →
  // «танцы» — нижний ракурс → «тосты» — крупно с микрофоном, гости в шоке → «никто не вспомнит» — стоп-кадр, цвет уходит
  party(t, T) {
    const els = [];
    let cam;
    const dusk = (pan = 0) => sky([[0, '#1a1840'], [0.35, '#6a3a7a'], [0.5, '#f08a6a'], [0.62, '#2a2040']]) + stars(30, 500, t, 0.6)
      + par(-pan * 0.2, 0, mountains(1050, t, { far: '#5a3a6a', mid: '#3a2a4a', near: '#2a1e34' }))
      + par(-pan * 0.4, 0, palm(-40, 1150, 640, t, 0, '#1a2a2a') + palm(1100, 1150, 700, t, 1, '#1a2a2a'))
      + `<rect x="-600" y="1120" width="2400" height="1000" fill="${V('#3a2a3a', 0.05, 0.3)}"/>`;
    const bulbs = (on) => lights(-200, 760, 560, 830, 60, 10, t, 1) + lights(560, 830, 1300, 760, 70, 10, t, 1);
    if (t < ws(1.43)) { // А: пожал плечами
      const sh = io(clamp((t - ws(0.45)) / 0.35));
      const X = 540, Y = 1900, s = 1.25, H = headAt(X, Y, s);
      const on = clamp((t - 0.1) / 1.0);
      els.push(dusk(), layer(on, bulbs()),
        [[150, 1500, 0], [300, 1460, 1], [800, 1470, 2], [950, 1510, 3]].map(([x, y, i]) => G2(i, x, y, 0.5, { turn: wave(t, 0.5, i) * 0.4, expr: 'smile', hands: { r: { x: x + 60, y: y - 380 + wave(t, 1.2, i) * 20, pose: 'wave' } }, knees: [wave(t, 1.2, i) * 0.3, -wave(t, 1.2, i) * 0.3] })).join(''),
        N2(X, Y, s, { shades: 'up', turn: 0.15, tilt: sh * 6, expr: sh > 0.4 ? 'smirk' : 'tired', blink: blink(t, 0.4), breathe: (wave(t, 0.3) + 1) / 2,
          hands: { l: { x: lerp(X - 160, X - 260, sh), y: lerp(Y - 500, H.y + 160, sh), pose: 'open', rot: lerp(0, -40, sh) }, r: { x: lerp(X + 170, X + 280, sh), y: lerp(Y - 480, H.y + 170, sh), pose: sh > 0.3 ? 'open' : 'hold', item: sh > 0.3 ? null : canItem, rot: lerp(0, 40, sh) } } }),
        grade('#ff9ad0', 0.15));
      cam = lerpCam({ z: 1.0, x: 0, y: 0 }, aim(1.08, X, H.y + 300, 540, 1150), io(clamp(t / 1.5)));
    } else if (t < ws(2.43)) { // Б: вид сверху — Найлз раскинулся на круге, банку к камере
      const k = clamp((t - ws(1.43)) / 1.0), rot = lerp(-8, 10, k);
      const X = 540, Y = 1150;
      let g = `<rect x="-800" y="-800" width="2680" height="3520" fill="${grad([[0, '#1ab8d0'], [1, '#0a7aa0']])}"/>`;
      for (let i = 0; i < 18; i++) { reseed(i + 70); const cx = rnd() * 1080, cy = rnd() * 1920; g += `<path d="M${cx - 80},${cy} q40,${-20 + wave(t, 0.6, i) * 15} 80,0 t80,0" stroke="#bff8ff" stroke-width="4" fill="none" opacity="0.4"/>`; }
      g += `<g transform="rotate(${rot} ${X} ${Y})">` + `<circle cx="${X}" cy="${Y}" r="${560 + k * 60}" fill="none" stroke="#e8ffff" stroke-width="5" opacity="${0.4 * (1 - k)}"/>`
        + `<ellipse cx="${X + 30}" cy="${Y + 40}" rx="330" ry="330" fill="#06405a" opacity="0.3" filter="url(#blur20)"/><circle cx="${X}" cy="${Y}" r="270" fill="none" stroke="${V('#ff5fa2', 0.25, 0.2)}" stroke-width="150"/><path d="M${X - 230},${Y - 150} A270 270 0 0 1 ${X + 60},${Y - 268}" stroke="#fff" stroke-width="22" opacity="0.45" fill="none" stroke-linecap="round"/>`
        + N2(X, Y + 440, 0.75, { shades: 'on', expr: 'grin', turn: 0, hands: { l: { x: X - 330, y: Y - 260, pose: 'open', rot: -40 }, r: { x: X + 260, y: Y - 380 - k * 60, pose: 'hold', item: canItem } }, knees: [-0.4, 0.4], shadow: false })
        + `</g>`;
      els.push(g);
      cam = { z: lerp(1.15, 1.0, io(k)), x: 0, y: 0, rot: 0 };
    } else if (t < ws(3.08)) { // В: танцы, нижний ракурс
      const k = clamp((t - ws(2.43)) / 0.65), beat = wave(t, 2.0);
      const X = 540, Y = 2050, s = 1.3;
      els.push(sky([[0, '#140c30'], [0.5, '#3a1a5a'], [0.8, '#6a2a6a']]),
        ...[0, 1, 2].map((i) => `<path d="M${200 + i * 340},0 L${100 + i * 340 + beat * 120},1900 L${300 + i * 340 + beat * 120},1900 Z" fill="${['#ff5fa2', '#4ae0e8', '#ffd24a'][i]}" opacity="0.18"/>`),
        lights(-200, 600, 560, 700, 60, 10, t) + lights(560, 700, 1300, 600, 70, 10, t),
        [[120, 1700, 1], [960, 1720, 3], [300, 1600, 0], [800, 1620, 4]].map(([x, y, i]) => G2(i, x, y, 0.55, { turn: x < 540 ? 0.5 : -0.5, expr: 'laugh', hands: { l: { x: x - 20, y: y - 300 + Math.abs(beat) * 20, pose: 'open', rot: 90 }, r: { x: x + 20, y: y - 300 + Math.abs(beat) * 20, pose: 'open', rot: -90 } } })).join(''),
        N2(X, Y, s, { shades: 'on', expr: 'grin', turn: beat * 0.4, tilt: beat * 8, lean: beat * 6, hairLag: -beat, knees: [Math.max(0, beat) * 0.6, Math.max(0, -beat) * 0.6],
          hands: { l: { x: X - 260, y: 820 + beat * 120, pose: 'wave' }, r: { x: X + 270, y: 820 - beat * 120, pose: 'hold', item: canItem } } }),
        grade('#ff5fa2', 0.12));
      cam = { z: 1.05, x: 0, y: 0, rot: beat * 1.2 };
    } else { // Г+Д: тост крупно → стоп-кадр, цвет уходит
      const tf = Math.min(t, ws(4.3)); // после «ведь» всё замирает
      const talk = t < ws(4.2) ? Math.abs(Math.sin(t * 13)) * 0.8 : 0;
      const X = 600, Y = 2150, s = 1.5, H = headAt(X, Y, s);
      const freeze = io(clamp((t - ws(4.3)) / 1.0));
      const guestsShock = [[160, 1500, 1, 0.6], [330, 1440, 3, 0.6], [880, 1470, 5, -0.5]].map(([x, y, i, tu]) => G2(i, x, y, 0.55, { turn: tu, expr: 'surprised', look: { x: tu > 0 ? 0.8 : -0.8, y: 0.2 }, blink: blink(tf, i), hands: i === 1 ? { l: { x: x + 10, y: y - 470, pose: 'open', rot: -90 } } : undefined })).join('');
      els.push(dusk(), bulbs(),
        `<g filter="url(#blur4)">${guestsShock}</g>`,
        `<rect x="1580" y="1240" width="200" height="140" fill="#f8f4ec"/>`,
        N2(X, Y, s, { shades: 'up', turn: -0.3, tilt: wave(tf, 0.7) * 3, expr: 'smirk', talk, look: { x: -0.6, y: 0.1 }, blink: blink(tf, 0.6),
          hands: { r: { x: X + 280, y: H.y - 60 + wave(tf, 0.8) * 20, pose: 'hold', item: glassItem }, l: { x: H.x - 150, y: H.y + H.r * 0.9, pose: 'hold', item: micItem, rot: -70 } } }),
        grade('#ff9ad0', 0.15));
      cam = { ...aim(lerp(1.05, 0.95, freeze), X, H.y + 260, 540, 1180), sat: 1 - freeze * 0.85 };
    }
    els.push(topShade(620, 0.5));
    return { cam, els };
  },

  // 4. Ночь: Найлз (со спины) уходит к светящейся расщелине → встречный план: Сара идёт следом, он оборачивается «Не ходи!» →
  // вспышка → утро: Сара рывком садится в кровати, наезд на её лицо
  cave(t, T) {
    const els = [];
    let cam;
    const pulse = 0.75 + 0.25 * wave(t, 0.9);
    const night = (k) => sky([[0, '#060a20'], [0.5, '#1a1a40'], [0.65, '#3a2a4a']]) + stars(90, 900, t)
      + glow(860, 360, 300, '#c8d4ff', 0.35) + `<circle cx="860" cy="360" r="46" fill="#f2f0e6"/>`
      + par(-k * 20, 0, mountains(1080, t, { far: '#2a2a4a', mid: '#1e1e36', near: '#16162a' }))
      + par(-k * 50, 0, joshua(120, 1260, 1.4, '#2a3a2a') + joshua(980, 1240, 1.1, '#2a3a2a'));
    const rock = (cx) => `<path d="M${cx - 310},1500 L${cx - 270},1000 Q${cx - 170},860 ${cx + 10},900 Q${cx + 190},940 ${cx + 250},1100 L${cx + 310},1500 Z" fill="${V('#5a4048', 0.12, 0.35)}"/><path d="M${cx - 70},1500 L${cx - 40},1180 Q${cx - 10},1120 ${cx + 10},1180 L${cx + 50},1500 Z" fill="#1a0e0a"/>`
      + glow(cx, 1340, 380 * pulse, '#ff8a30', 0.6) + `<path d="M${cx - 50},1500 L${cx - 30},1220 Q${cx},1170 ${cx + 20},1230 L${cx + 40},1500 Z" fill="${V('#ffb050', 0.3, 0.2)}" opacity="${0.8 * pulse}"/>`;
    const ground = `<rect x="-600" y="1480" width="2400" height="700" fill="${V('#3a2a2a', 0.05, 0.4)}"/>`;
    const fin = clamp(1 - t / 0.25); // приход из темноты
    if (t < ws(2.4)) { // А: со спины, идёт к пещере
      const k = io(clamp(t / ws(2.4)));
      const s = lerp(1.25, 0.55, k), y = lerp(2150, 1560, k);
      els.push(night(k), rock(690), ground, glow(690, 1350, 500, '#ff8a30', 0.15 * pulse),
        N2(lerp(420, 640, k), y, s, { back: true, knees: [wave(t, 1.4) * 0.5, -wave(t, 1.4) * 0.5], tilt: wave(t, 1.4) * 2, hairLag: wave(t, 1.4) * 0.3, rim: { c: '#ffb070', dx: -8, dy: -4 } }));
      cam = { z: lerp(1.0, 1.12, k), x: 0, y: lerp(0, -40, k) };
    } else if (t < ws(4.45)) { // Б: встречный план — Сара идёт следом; Найлз у входа оборачивается
      const k = clamp((t - ws(2.4)) / (ws(4.45) - ws(2.4))), walk = io(clamp(k * 1.6));
      const sx = lerp(-80, 330, walk), SY = 1900, ss = 1.15, HS = headAt(sx, SY, ss);
      const stop = io(clamp((t - ws(2.75)) / 0.3));
      els.push(night(0.5), rock(800), ground,
        N2(820, 1520, 0.6, { turn: -0.5, expr: stop > 0.5 ? 'surprised' : 'neutral', talk: t > ws(2.9) && t < ws(3.6) ? Math.abs(Math.sin(t * 12)) : 0, look: { x: -0.9, y: 0 }, rim: { c: '#ffb070', dx: 8, dy: -4 }, hands: { l: { x: 700, y: lerp(1300, 1060, stop), pose: 'open', rot: -80 } } }),
        S2(sx, SY, ss, { turn: 0.45, expr: mixExpr('think', 'angry', clamp((k - 0.4) / 0.3)), look: { x: 0.9, y: 0.25 }, knees: walk < 0.98 ? [wave(t, 1.6) * 0.5, -wave(t, 1.6) * 0.5] : [0, 0], tilt: wave(t, 1.6) * 2 * (1 - walk), hairLag: wave(t, 1.6) * 0.4, blink: blink(t, 0.4), rim: { c: '#ffb070', dx: 10, dy: -4 } }),
        glow(sx + 80, HS.y, 280, '#ff8a30', 0.22));
      cam = lerpCam({ z: 1.0, x: 0, y: 0 }, aim(1.18, sx + 60, HS.y + 260, 540, 1100), io(clamp((t - ws(3.2)) / 1.0)));
    } else { // В: вспышка → утро, Сара садится
      const k = clamp((t - ws(4.55)) / 0.4), up = io(k);
      const X = 380, Y = 1640, s = 1.2, H = headAt(X, Y, s, 'sit');
      els.push(bedroom2(t, { wall: '#f4e8dc' }),
        S2(X, Y, s, { pose: 'sit', lean: lerp(-75, 0, up), expr: up > 0.5 ? mixExpr('surprised', { brows: [0.6, 0.6], browTilt: -0.2, lid: 0.0, mouth: 'o' }, clamp((t - ws(5.2)) / 0.4)) : { brows: [0, 0], browTilt: 0, lid: 1, mouth: 'flat' }, look: { x: lerp(0, 0.7, clamp((t - ws(5.5)) / 0.4)), y: 0 }, hairLag: (1 - up) * 1.5, shirt: '#f4f0ea', collar: 'round', earrings: false,
          hands: { l: { x: X - 100, y: 1420, pose: 'fist' }, r: { x: X + 110, y: 1420, pose: 'fist' } } }),
        blanket(1340, '#fdfcf8'), phone(940, 1210, 0.8, t, '7:00', 0));
      cam = lerpCam(aim(1.0, 540, 1150, 540, 1150), aim(1.25, X + 60, H.y + 200, 540, 1120), io(clamp((t - ws(5.4)) / 1.0)));
    }
    const fl = Math.max(0, 1 - Math.abs(t - ws(4.5)) / 0.5);
    els.push(flashRect(ease3(fl) * 1.15, '#fff4d8'), topShade(620, 0.5));
    return { cam, els };
  },

  // 5. Дорога: двое в кабриолете → «выхода нет» — сверху: шоссе замкнуто в кольцо → Сара крупно, газ в пол → проезд к Найлзу: пиво и ухмылка
  road(t, T) {
    const els = [];
    let cam;
    const hy = 1020, vx = 540;
    const spd = t > ws(2.6) ? 1.8 : 1;
    const roadside = () => {
      let side = ''; reseed(31);
      const items = Array.from({ length: 9 }, (_, i) => ({ ph: i / 9, side: i % 2 ? 1 : -1, kind: i % 3 }));
      const zz = (o) => (t * 0.35 * spd + o.ph) % 1;
      items.sort((a, b) => zz(a) - zz(b));
      items.forEach((o) => { const z = zz(o), s = 0.15 + Math.pow(z, 2.2) * 2.2, x = vx + o.side * (120 + Math.pow(z, 2.2) * 1100), y = hy + Math.pow(z, 2.2) * 900; side += o.kind === 0 ? joshua(x, y, s) : o.kind === 1 ? cactus(x, y, s) : `<rect x="${x - 6 * s}" y="${y - 520 * s}" width="${12 * s}" height="${520 * s}" fill="#6a5040"/><rect x="${x - 60 * s}" y="${y - 500 * s}" width="${120 * s}" height="${10 * s}" fill="#6a5040"/>`; });
      return side;
    };
    const dashes = Array.from({ length: 10 }, (_, i) => { const z = (t * 0.9 * spd + i / 10) % 1, z2 = Math.min(1, z + 0.04), y0 = hy + Math.pow(z, 2.5) * 900, y1 = hy + Math.pow(z2, 2.5) * 900; const w0 = 4 + Math.pow(z, 2.5) * 40, w1 = 4 + Math.pow(z2, 2.5) * 40; return `<path d="M${vx - w0 / 2},${y0} L${vx + w0 / 2},${y0} L${vx + w1 / 2},${y1} L${vx - w1 / 2},${y1} Z" fill="#f4d04a"/>`; }).join('');
    const angry = io(clamp((t - ws(2.2)) / 0.3));
    const wheelA = wave(t, 0.7) * 8 + angry * wave(t, 2.2) * 10;
    const wx = 330, wy = 1450;
    const car = (o = {}) => {
      const sway = wave(t, 0.5) * 6;
      const hs = headAt(330, 1700, 1.15, 'sit'), hn = headAt(740, 1710, 1.15, 'sit');
      const sip = io(clamp((t - ws(3.95)) / 0.35));
      return `<g transform="translate(${sway} ${wave(t, 1.3) * 3})">`
        + `<rect x="40" y="1300" width="1000" height="150" rx="40" fill="${V('#5ad0d0', 0.25, 0.25)}"/><rect x="60" y="1330" width="960" height="300" fill="#1e2a30"/>`
        + S2(330, 1700, 1.15, { pose: 'sit', turn: 0.1, expr: mixExpr('neutral', 'angry', angry), lid: 0.2 + angry * 0.2, look: { x: 0, y: 0.1 }, hairLag: -1 - wave(t, 3) * 0.3, blink: blink(t, 1.1), tilt: wave(t, 0.8) * 2 - angry * 4,
            hands: { l: { x: wx - 120 * Math.cos(rad(wheelA)), y: wy - 40 - 120 * Math.sin(rad(wheelA)), pose: 'fist' }, r: { x: wx + 120 * Math.cos(rad(wheelA)), y: wy - 40 + 120 * Math.sin(rad(wheelA)), pose: 'fist' } } })
        + N2(740, 1710, 1.15, { pose: 'sit', turn: -0.25, shades: 'on', expr: sip > 0.5 ? 'smirk' : 'smile', look: { x: -0.6, y: 0 }, hairLag: -1 - wave(t, 3, 1) * 0.3, tilt: 5 + wave(t, 0.3) * 2,
            hands: { r: { x: 1010, y: 1330, pose: 'open', rot: 80 }, l: { x: lerp(620, hn.x - 40, sip), y: lerp(1420, hn.y + hn.r * 0.7, sip), pose: 'hold', item: canItem } } })
        + `<g transform="rotate(${wheelA} ${wx} ${wy})" filter="url(#soft)"><ellipse cx="${wx}" cy="${wy}" rx="130" ry="44" fill="none" stroke="#1a1a1c" stroke-width="22"/><rect x="${wx - 14}" y="${wy}" width="28" height="60" fill="#1a1a1c"/></g>`
        + `<path d="M100,1320 L170,1060 L910,1060 L980,1320" stroke="#c8d0d4" stroke-width="16" fill="none"/><path d="M170,1060 L910,1060 L980,1320 L100,1320 Z" fill="#cfe8f0" opacity="0.12"/><path d="M260,1080 L340,1080 L250,1300 L170,1300 Z" fill="#fff" opacity="0.16"/>`
        + `<path d="M-20,1440 Q540,1390 1100,1440 L1100,2000 L-20,2000 Z" fill="${V('#4ac0c4', 0.3, 0.35)}"/><path d="M60,1490 Q540,1450 1020,1490" stroke="#fff" stroke-width="6" opacity="0.35" fill="none"/>`
        + `<rect x="300" y="1740" width="480" height="70" rx="14" fill="${V('#d8dcdc', 0.3, 0.3)}"/>${Array.from({ length: 11 }, (_, i) => `<rect x="${320 + i * 42}" y="1750" width="20" height="50" fill="#6a7070"/>`).join('')}`
        + [[150, 1660], [930, 1660]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="70" fill="${R('#fff8e0', 0.2, 0.2)}" stroke="#c8d0d0" stroke-width="12"/>`).join('')
        + `<rect x="430" y="1840" width="220" height="60" rx="6" fill="#f4f0e4" stroke="#2a3a5a" stroke-width="4"/>${label(540, 1880, 'kinoplot.film', 22, '#2a3a5a', 0.85)}`
        + `</g>`;
    };
    const desert = sky([[0, '#3a9ae8'], [0.4, '#a8d8f4'], [0.53, '#f8e4c8']]) + clouds(t, 340, '#fff', 0.85, 4) + glow(820, 640, 280, '#fff8d0', 0.6)
      + mountains(hy, t, { far: '#c8a0b0', mid: '#b08890', near: '#a07a6a' }) + `<rect x="-600" y="${hy}" width="2300" height="${1100}" fill="${V('#e8c898', 0.05, 0.15)}"/>`
      + `<path d="M${vx - 20},${hy} L${vx + 20},${hy} L1500,2100 L-420,2100 Z" fill="${V('#5a5458', 0.05, 0.2)}"/>`;
    if (t >= ws(1.2) && t < ws(2.15)) { // сверху: дорога-кольцо, крошечная машинка бежит по кругу
      const k = clamp((t - ws(1.2)) / 0.95);
      const a = -Math.PI / 2 + k * Math.PI * 1.2;
      let g = `<rect x="-800" y="-800" width="2680" height="3520" fill="${V('#e4c494', 0.05, 0.1)}"/>`;
      reseed(51); for (let i = 0; i < 40; i++) { const x = rnd() * 1080, y = rnd() * 1920; g += rnd() < 0.5 ? `<circle cx="${x}" cy="${y}" r="${10 + rnd() * 14}" fill="#7a9a5a" opacity="0.8"/>` : `<circle cx="${x}" cy="${y}" r="${4 + rnd() * 6}" fill="#b89a74"/>`; }
      g += `<ellipse cx="540" cy="1150" rx="380" ry="380" fill="none" stroke="#5a5458" stroke-width="90"/><ellipse cx="540" cy="1150" rx="380" ry="380" fill="none" stroke="#f4d04a" stroke-width="5" stroke-dasharray="30 30"/>`;
      g += `<path d="M380,1100 l60,-60 l60,60 Z M560,1180 l50,-50 l50,50 Z" fill="#a07a6a"/>` + bungalow(470, 1260, 140, { h: 60 });
      const cx = 540 + Math.cos(a) * 380, cy = 1150 + Math.sin(a) * 380;
      g += `<g transform="translate(${cx} ${cy}) rotate(${deg(a) + 90})"><rect x="-22" y="-40" width="44" height="80" rx="12" fill="#5ad0d0"/><rect x="-18" y="-14" width="36" height="30" fill="#1e2a30"/><circle cx="-8" cy="0" r="7" fill="#d9789a"/><circle cx="8" cy="2" r="7" fill="#2a1e18"/></g>`;
      els.push(g);
      cam = { z: 1.05, x: 0, y: 0, rot: lerp(-4, 4, k) };
    } else {
      els.push(desert, dashes, roadside(), car());
      if (t < ws(1.2)) cam = lerpCam({ z: 1.0, x: 0, y: 0 }, { z: 1.08, x: 0, y: -40 }, io(clamp(t / 1.3)));
      else if (t < ws(3.65)) cam = aim(1.25, 380, 1320, 540, 1160);
      else cam = lerpCam(aim(1.25, 380, 1320, 540, 1160), aim(1.25, 700, 1320, 540, 1160), io(clamp((t - ws(3.65)) / 0.6)));
      if (t > ws(2.6)) els.push(...Array.from({ length: 14 }, (_, i) => { reseed(i + 900); const y = 900 + rnd() * 900, l = (t * 2000 + rnd() * 1080) % 1500; return `<path d="M${rnd() < 0.5 ? -100 + l * 0.2 : 1180 - l * 0.2},${y} l${rnd() < 0.5 ? 160 : -160},${(y - 1020) * 0.2}" stroke="#fff" stroke-width="3" opacity="0.35"/>`; }));
    }
    els.push(grade('#ffd8a0', 0.22), topShade(620, 0.45));
    return { cam, els };
  },

  // 6. Мелькающие кадры (голос их не называет): сверху двое на кругах → бар с неоном kinoplot.film → стрела рядом с Найлзом →
  // ночь: Найлз один на краю бассейна, ноги в воде, отражение; медленный наезд
  hiding(t, T) {
    const els = [];
    let cam;
    if (t < ws(0.95)) {
      const k = clamp(t / ws(0.95)), rot = lerp(-12, 12, k);
      let g = `<rect x="-800" y="-800" width="2680" height="3520" fill="${grad([[0, '#1ab8d0'], [1, '#0a7aa0']])}"/>`;
      for (let i = 0; i < 18; i++) { reseed(i + 70); const cx = rnd() * 1080, cy = rnd() * 1920; g += `<path d="M${cx - 80},${cy} q40,${-20 + wave(t, 0.6, i) * 15} 80,0 t80,0" stroke="#bff8ff" stroke-width="4" fill="none" opacity="0.4"/>`; }
      g += `<g transform="rotate(${rot} 540 1150)">` + [[330, 1000, '#ffd24a', 'S'], [760, 1300, '#ff5fa2', 'N']].map(([x, y, c, who]) => `<circle cx="${x}" cy="${y}" r="190" fill="none" stroke="${V(c, 0.25, 0.2)}" stroke-width="100"/>` + (who === 'S' ? S2(x, y + 300, 0.5, { expr: 'laugh', turn: 0.3, hands: { r: { x: x + 260, y: y - 110, pose: 'open' }, l: { x: x - 200, y: y - 200, pose: 'open' } }, shadow: false }) : N2(x, y + 300, 0.5, { shades: 'on', expr: 'grin', turn: -0.3, hands: { l: { x: x - 260, y: y - 110, pose: 'open' }, r: { x: x + 200, y: y - 200, pose: 'hold', item: canItem } }, shadow: false }))).join('') + `</g>`;
      els.push(g); cam = { z: lerp(1.1, 1.0, k), x: 0, y: 0 };
    } else if (t < ws(1.75)) {
      const beat = wave(t, 2.0);
      els.push(`<rect x="-800" y="-800" width="2680" height="3520" fill="${V('#2a1a24', 0.1, 0.3)}"/>` + Array.from({ length: 9 }, (_, i) => `<rect x="${i * 130}" y="0" width="8" height="1920" fill="#1a0e14" opacity="0.6"/>`).join(''),
        `<text x="540" y="860" font-family="'Brush Script MT', cursive" font-size="110" fill="#ff7ac0" text-anchor="middle" opacity="${0.85 + 0.15 * wave(t, 3)}">kinoplot.film</text>` + glow(540, 830, 420, '#ff5fa2', 0.35),
        `<rect x="-200" y="1150" width="1480" height="60" fill="#5a3a24"/>` + Array.from({ length: 12 }, (_, i) => `<rect x="${40 + i * 88}" y="${1060 + (i % 3) * 10}" width="26" height="${90 - (i % 3) * 10}" rx="6" fill="${['#3a8a5a', '#8a3a2a', '#c8a03a', '#4a6a9a'][i % 4]}" opacity="0.8"/>`).join(''),
        `<rect x="-200" y="1500" width="1480" height="600" fill="${V('#4a2a20', 0.1, 0.3)}"/>`,
        S2(380, 1900, 0.9, { turn: 0.5, expr: 'laugh', tilt: beat * 6, lean: beat * 5, knees: [Math.max(0, beat) * 0.5, Math.max(0, -beat) * 0.5], hairLag: -beat, hands: { l: { x: 200, y: 1000 + beat * 60, pose: 'wave' }, r: { x: 560, y: 1050 - beat * 60, pose: 'open' } } }),
        N2(720, 1900, 0.9, { turn: -0.5, expr: 'grin', tilt: -beat * 6, lean: -beat * 5, knees: [Math.max(0, -beat) * 0.5, Math.max(0, beat) * 0.5], hands: { r: { x: 900, y: 1000 - beat * 60, pose: 'wave' }, l: { x: 540, y: 1060 + beat * 60, pose: 'open' } } }),
        `<rect x="-800" y="-800" width="2680" height="3520" fill="#ff5fa2" opacity="0.08"/>`);
      cam = { z: 1.05, x: 0, y: 0, rot: beat * 2 };
    } else if (t < ws(2.45)) {
      const hit = clamp((t - ws(1.95)) / 0.12);
      const X = 470, Y = 2300, s = 1.5, H = headAt(X, Y, s);
      els.push(sky([[0, '#e8a868'], [0.5, '#f4d4a8']]), mountains(1100, t, { far: '#c89088', mid: '#a87068', near: '#8a5a50' }),
        `<rect x="-600" y="1090" width="2300" height="1000" fill="${V('#d8b088', 0.05, 0.2)}"/>`, joshua(120, 1300, 1.4),
        `<rect x="800" y="400" width="60" height="1600" fill="${V('#7a5a3a', 0.1, 0.3)}"/>`,
        N2(X, Y, s, { turn: 0.5, expr: hit > 0 ? 'surprised' : 'neutral', look: { x: 1, y: 0.2 }, lean: -hit * 6, shades: 'up', hands: { l: { x: X - 200, y: H.y + 300, pose: 'open', rot: -60 } } }),
        `<g transform="translate(${lerp(1500, 840, hit)} ${H.y - 20}) rotate(-4)"><rect x="0" y="-5" width="280" height="10" fill="#4a3a2a"/><path d="M-26,0 L4,-14 L4,14 Z" fill="#8a8a8a"/><path d="M240,-5 L285,-26 L276,0 L285,26 L240,5 Z" fill="#c83a3a"/></g>`,
        hit >= 1 ? `<path d="M830,${H.y - 50} l-40,-25 M830,${H.y + 10} l-40,25 M825,${H.y - 20} l-50,0" stroke="#5a3a2a" stroke-width="6"/>` : '');
      cam = aim(1.0, 600, H.y + 200, 540, 1150);
    } else {
      const k = io(clamp((t - ws(2.45)) / (VIS(T) - ws(2.45))));
      const X = 540, Y = 1330, s = 1.05, H = headAt(X, Y, s, 'sit');
      const away = io(clamp((t - ws(3.95)) / 0.5));
      const fig = (o = {}) => N2(X, Y, s, { pose: 'sit', legsDown: 210, noFeet: true, turn: lerp(0, -0.35, away), expr: 'sad', look: { x: lerp(0, -0.8, away), y: -0.6 }, blink: blink(t, 1.4), tilt: lerp(8, 3, away), breathe: (wave(t, 0.2) + 1) / 2, footSwing: wave(t, 0.4),
        hands: { l: { x: X - 200, y: Y + 10, pose: 'open', rot: 90 }, r: { x: X + 200, y: Y + 10, pose: 'open', rot: -90 } }, rim: { c: '#7ae0ff', dx: -8, dy: -4 }, ...o });
      els.push(`<rect x="-800" y="-800" width="2680" height="3520" fill="${V('#0a1030', 0.05, 0.2)}"/>`, stars(60, 700, t), palm(80, 1150, 600, t, 0, '#0e1a22') + palm(1000, 1150, 640, t, 1.5, '#0e1a22'),
        bungalow(330, 1150, 420, { h: 190, lit: true, c: '#3a3a50' }), `<rect x="-600" y="1150" width="2300" height="200" fill="#3a3a48"/>`,
        pool(-200, 1340, 1280, 2100, t, { c: '#1290b8', night: true }), glow(540, 1650, 600, '#30d8ff', 0.3),
        `<g transform="translate(0 ${2 * 1340}) scale(1 -1)" opacity="0.22" filter="url(#blur8)">${fig({ rim: false })}</g>`,
        fig(), `<rect x="-200" y="1470" width="1480" height="500" fill="#1290b8" opacity="0.55"/>`, `<rect x="-200" y="1338" width="1480" height="26" fill="${V('#d8d4cc', 0.15, 0.3)}"/>`,
        ...[0, 1].map((i) => { const r = ((t * 0.6 + i * 0.5) % 1); return `<ellipse cx="540" cy="1480" rx="${120 + r * 300}" ry="${20 + r * 50}" fill="none" stroke="#bff8ff" stroke-width="3" opacity="${(1 - r) * 0.5}"/>`; }),
        glow(540, 1100, 300, '#40c8ff', 0.15));
      cam = lerpCam(aim(1.0, 540, 1200, 540, 1200), aim(1.15, X, H.y + 260, 540, 1150), k);
    }
    els.push(grade('#9ad0ff', 0.12), topShade(620, 0.5));
    return { cam, els };
  },

  // 7. Фейерверк: «две» — два золотых залпа над ними → «Золотой глобус» — огромный золотой шар → «лучшая комедия» — разбег и прыжок в бассейн, всплеск, выныривают со смехом
  globes(t, T) {
    const els = [];
    let cam;
    const tt = t - D;
    const nightSky = sky([[0, '#050820'], [0.5, '#141a40'], [0.65, '#2a2040']]) + stars(60, 900, t);
    const fw = firework(300, 520, tt, 0.65, '#ffd24a', 260) + firework(780, 460, tt, 0.85, '#ffd24a', 280) + firework(540, 380, tt, 1.6, '#ffe48a', 420)
      + firework(200, 420, tt, 2.6, '#ff5fa2', 220) + firework(880, 560, tt, 3.1, '#4ae0e8', 240) + firework(480, 420, tt, 3.8, '#ffffff', 240);
    const glowC = Math.max(...[0.65, 0.85, 1.6, 2.6, 3.1, 3.8].map((a) => clamp(1 - Math.abs(tt - a - 0.2) / 0.6)));
    if (t < ws(2.5)) {
      const k = clamp(t / ws(2.5)), up = io(clamp((t - ws(1.4)) / 0.6));
      const lookUp = io(clamp((t - ws(0.5)) / 0.4));
      els.push(nightSky, fw, palm(40, 1300, 620, t, 0, '#0e1a22') + palm(1040, 1300, 680, t, 2, '#0e1a22'), lights(-50, 1080, 540, 1130, 50, 10, t) + lights(540, 1130, 1130, 1080, 50, 10, t),
        `<rect x="-600" y="1280" width="2300" height="900" fill="${V('#3a2e3a', 0.1, 0.3)}"/>`,
        S2(400, 2050, 0.95, { turn: 0.3, expr: lookUp > 0.5 ? (glowC > 0.4 ? 'surprised' : 'smile') : 'neutral', look: { x: 0.2, y: lookUp }, tilt: -lookUp * 6, rim: { c: '#ffe08a', dx: 6, dy: -8, op: 0.4 + glowC * 0.6 } }),
        N2(690, 2060, 0.95, { turn: -0.3, expr: lookUp > 0.5 ? 'grin' : 'smirk', look: { x: -0.2, y: lookUp }, tilt: lookUp * 6, shades: 'up', rim: { c: '#ffe08a', dx: -6, dy: -8, op: 0.4 + glowC * 0.6 }, hands: { r: { x: 870, y: lerp(1500, 1180, lookUp), pose: 'point' } } }),
        `<rect x="-2000" y="-2000" width="5080" height="5920" fill="#ffd060" opacity="${(glowC * 0.12).toFixed(3)}" style="mix-blend-mode:screen"/>`);
      cam = lerpCam({ z: 1.0, x: 0, y: 0 }, { z: 1.05, x: 0, y: 380 }, up);
      els.push(grade('#ff9ad0', 0.12));
    } else {
      const k = clamp((t - ws(2.5)) / (VIS(T) - ws(2.5)));
      const jump = clamp((t - ws(2.9)) / 1.0), splash = clamp((t - ws(3.9)) / 0.8), surf = io(clamp((t - ws(4.2)) / 0.5));
      const arc = (x0, x1) => ({ x: lerp(x0, x1, jump), y: 1500 - Math.sin(jump * Math.PI) * 420 + jump * 320 });
      const run = 1 - clamp((t - ws(2.9)) / 0.1);
      const a = jump > 0 ? arc(260, 430) : { x: lerp(60, 260, clamp((t - ws(2.5)) / 0.4)), y: 1500 }, b = jump > 0 ? arc(470, 690) : { x: lerp(300, 470, clamp((t - ws(2.5)) / 0.4)), y: 1500 };
      let figs = '';
      if (jump < 0.95) figs = S2(a.x, a.y, 0.62, { turn: 0.3, expr: 'laugh', lean: lerp(0, 20, jump), knees: run > 0 ? [wave(t, 2) * 0.6, -wave(t, 2) * 0.6] : [0.6, 0.6], hands: { l: { x: a.x - 130, y: a.y - 620, pose: 'open' }, r: { x: a.x + 130, y: a.y - 620, pose: 'open' } } })
        + N2(b.x, b.y, 0.62, { turn: -0.3, expr: 'grin', lean: lerp(0, 20, jump), shades: 'up', knees: run > 0 ? [-wave(t, 2) * 0.6, wave(t, 2) * 0.6] : [0.6, 0.6], hands: { l: { x: b.x - 140, y: b.y - 620, pose: 'open' }, r: { x: b.x + 150, y: b.y - 600, pose: 'hold', item: canItem } } });
      const sp = splash > 0 && splash < 1 ? Array.from({ length: 40 }, (_, i) => { reseed(i + 400); const ang = -Math.PI * (0.1 + rnd() * 0.8), v = 300 + rnd() * 450, x = 570 + (rnd() - 0.5) * 220 + Math.cos(ang) * v * splash, y = 1660 + Math.sin(ang) * v * splash + 700 * splash * splash; return `<circle cx="${x}" cy="${y}" r="${8 + rnd() * 14}" fill="#c8f8ff" opacity="${1 - splash}"/>`; }).join('') + `<ellipse cx="570" cy="1660" rx="${200 + splash * 240}" ry="${40 + splash * 40}" fill="none" stroke="#e8ffff" stroke-width="10" opacity="${1 - splash}"/>` : '';
      const heads = surf > 0 ? head2(450, lerp(1900, 1560, surf) + wave(t, 0.5) * 8, 70, { ...SX, hair: '#24160e', expr: 'laugh', turn: 0.4 }) + head2(690, lerp(1900, 1570, surf) + wave(t, 0.5, 1) * 8, 72, { ...NX, hair: '#1a120e', expr: 'laugh', turn: -0.4 }) : '';
      els.push(nightSky, fw, palm(40, 1300, 620, t, 0, '#0e1a22') + palm(1040, 1300, 680, t, 2, '#0e1a22'), lights(-50, 1080, 540, 1130, 50, 10, t) + lights(540, 1130, 1130, 1080, 50, 10, t),
        `<rect x="-600" y="1300" width="2300" height="220" fill="${V('#3a2e3a', 0.1, 0.3)}"/>`,
        [[880, 1500, 0], [990, 1510, 2], [100, 1500, 5]].map(([x, y, i]) => G2(i, x, y, 0.42, { expr: 'laugh', turn: x > 540 ? -0.4 : 0.4, hands: { l: { x: x - 60, y: y - 420, pose: 'wave' }, r: { x: x + 60, y: y - 420, pose: 'wave' } } })).join(''),
        pool(-200, 1500, 1280, 2100, t, { c: '#18a8c8', night: true }), glow(540, 1700, 600, '#30e0ff', 0.3),
        heads, `<rect x="-200" y="1600" width="1480" height="500" fill="#18a8c8" opacity="${surf > 0 ? 0.55 : 0}"/>`, figs, sp, grade('#ff9ad0', 0.12));
      cam = lerpCam({ z: 1.0, x: 0, y: -60 }, aim(1.1, 570, 1450, 540, 1150), io(clamp((t - ws(4.1)) / 0.8)));
    }
    els.push(topShade(560, 0.35));
    return { cam, els };
  },

  // 8. Закат: со спины двое на гребне, внизу огни свадьбы («вечный праздник») → спереди: поворачиваются друг к другу («одну жизнь… по-настоящему»)
  question(t, T) {
    const els = [];
    let cam;
    const sunset = (k) => sky([[0, '#2a1e50'], [0.3, '#8a3a7a'], [0.5, '#ff7a5a'], [0.6, '#ffc070']]) + stars(60, 700, t, clamp((t - 2) / 4))
      + glow(540, 1110, 420, '#ffd080', 0.7) + `<circle cx="540" cy="${1110 + k * 40}" r="90" fill="#ffe0a0"/>`
      + mountains(1160, t, { far: '#8a4a6a', mid: '#5a3050', near: '#3a2040' }) + `<rect x="-600" y="1160" width="2300" height="1000" fill="${V('#3a2438', 0.05, 0.3)}"/>`
      + Array.from({ length: 30 }, (_, i) => { reseed(i + 600); return `<circle cx="${180 + rnd() * 420}" cy="${1250 + rnd() * 70}" r="${3 + rnd() * 3}" fill="#ffd890" opacity="${0.5 + 0.5 * wave(t, 0.9, i)}"/>`; }).join('') + glow(390, 1290, 240, '#ffc870', 0.45);
    if (t < ws(2.75)) {
      const k = clamp(t / ws(2.75));
      els.push(sunset(k * 0.4),
        `<path d="M-300,1640 Q300,1540 540,1570 Q800,1600 1400,1520 L1400,2100 L-300,2100 Z" fill="${V('#2a1a24', 0.08, 0.3)}"/>`, joshua(960, 1560, 1.2, '#2a3024'),
        S2(410, 1700, 0.85, { pose: 'sit', back: true, tilt: -6 + wave(t, 0.3) * 2, rim: { c: '#ffb070', dx: 0, dy: -6 } }),
        N2(640, 1710, 0.88, { pose: 'sit', back: true, tilt: 4 + wave(t, 0.3, 1) * 2, rim: { c: '#ffb070', dx: 0, dy: -6 } }));
      cam = lerpCam({ z: 1.04, x: 0, y: 40 }, { z: 1.0, x: 0, y: 0 }, io(k));
    } else {
      const k = clamp((t - ws(2.75)) / (T - ws(2.75)));
      const turnN = io(clamp((t - ws(3.0)) / 0.8)), turnS = io(clamp((t - ws(3.6)) / 0.8));
      els.push(`<g transform="translate(0 -120)">${sunset(0.6)}</g>`,
        `<path d="M-300,1560 Q300,1500 540,1520 Q800,1540 1400,1480 L1400,2100 L-300,2100 Z" fill="${V('#2a1a24', 0.08, 0.3)}"/>`,
        S2(360, 1900, 1.05, { pose: 'sit', turn: lerp(0.15, 0.3, turnS), expr: mixExpr('neutral', 'smile', turnS * 0.7), look: { x: lerp(-0.1, 0.8, turnS), y: 0 }, blink: blink(t, 0.5), tilt: lerp(0, 2, turnS), rim: { c: '#ffb070', dx: 10, dy: -6 }, hands: { l: { x: 300, y: 2080, pose: 'open' }, r: { x: 440, y: 2080, pose: 'open' } } }),
        N2(720, 1910, 1.08, { pose: 'sit', turn: lerp(-0.15, -0.3, turnN), expr: mixExpr('tired', 'smile', turnN * 0.7), look: { x: lerp(0.1, -0.8, turnN), y: 0 }, blink: blink(t, 1.6), tilt: lerp(0, -2, turnN), shades: 'up', rim: { c: '#ffb070', dx: -10, dy: -6 }, hands: { r: { x: 800, y: 2090, pose: 'open' }, l: { x: 640, y: 2090, pose: 'open' } } }),
        grade('#ffb070', 0.18));
      cam = { z: 1.06, x: 0, y: -80 };
    }
    els.push(topShade(560, 0.45));
    return { cam, els };
  },
};
const shotsX = {
  hook: shotsRaw.hook,
  morning: smooth(shotsRaw.morning, [ws(2.73)], 0.45),
  party: smooth(shotsRaw.party, [ws(1.43), ws(2.43), ws(3.08)]),
  cave: smooth(shotsRaw.cave, [ws(2.4)], 0.45),
  road: smooth(shotsRaw.road, [ws(1.2), ws(2.15)]),
  hiding: smooth(shotsRaw.hiding, [ws(0.95), ws(1.75), ws(2.45)]),
  globes: smooth(shotsRaw.globes, [ws(2.5)], 0.45),
  question: smooth(shotsRaw.question, [ws(2.75)], 0.6),
};
run(shotsX);
