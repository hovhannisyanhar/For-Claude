// «Зависнуть в Палм-Спрингс» (Palm Springs, 2020) — 8 планов в 2D-векторе. Имя плана = set сцены в videos/palm-springs/script.json.
// Пустыня Калифорнии: бирюза бассейнов, белые курортные домики середины века, пальмы, розово-лиловые горы, гирлянды свадьбы ночью.
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
const sky = (stops, h = 1920) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
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

// ---------- спальня отеля: утро, жалюзи, телефон «9 ноября» ----------
function bedroom(t, who, t0, o = {}) {
  const up = io((t - t0) / 0.9); // садится в кровати
  let g = `<rect width="1080" height="1920" fill="${V('#f2e6d0', 0.05, 0.15)}"/>`;
  // окно с жалюзи и лучами
  g += `<rect x="560" y="300" width="440" height="560" fill="#ffe8b0"/>` + Array.from({ length: 14 }, (_, i) => `<rect x="560" y="${300 + i * 40}" width="440" height="${24 + 6 * wave(t, 0.2, i)}" fill="#e8d4b0"/>`).join('');
  g += `<g opacity="0.22">${Array.from({ length: 7 }, (_, i) => `<path d="M560,${330 + i * 80} L1000,${330 + i * 80} L${560 + 300},${1500 + i * 80} L${100},${1500 + i * 80} Z" fill="#fff4c8"/>`).join('')}</g>`;
  g += `<rect x="150" y="380" width="300" height="220" fill="#2aa0a8" opacity="0.6"/><rect x="164" y="394" width="272" height="192" fill="${V('#f0a868', 0.2, 0.2)}"/><circle cx="300" cy="500" r="50" fill="#fff0c0" opacity="0.8"/>`;
  // изголовье, кровать
  g += `<rect x="80" y="980" width="920" height="220" rx="30" fill="${V('#c8a878', 0.15, 0.25)}"/>`;
  g += `<rect x="40" y="1250" width="1000" height="700" rx="40" fill="${V('#f8f6f0', 0.05, 0.15)}"/>`;
  g += `<ellipse cx="${who === 'nil' ? 360 : 640}" cy="1170" rx="190" ry="70" fill="${V('#ffffff', 0, 0.12)}"/>`;
  const x = who === 'nil' ? 400 : 560;
  const fig = who === 'nil'
    ? nil(x, 1520, 1.9, { pose: 'sit', rot: lerp(-62, 0, up), rx: x, ry: 1520, look: lerp(0, o.lookTo ?? 0.8, io((t - t0 - 1.0) / 0.5)), blink: up < 0.5 || blink(t, 0.3), frown: lerp(0.1, 0.35, up), nod: wave(t, 0.5) * 0.6, shirt: '#f0ece4', pants: '#f0ece4', nil: false })
    : sar(x, 1520, 1.9, { pose: 'sit', rot: lerp(-62, 0, up), rx: x, ry: 1520, look: lerp(-0.9, 0.9, clamp((t - t0 - 0.9) / 1.4)), frown: lerp(0, -0.45, up), gasp: up > 0.6, blink: up < 0.4, shirt: '#f0ece4', robe: '#f0ece4', sar: true });
  g += fig;
  // одеяло поверх ног
  g += `<path d="M20,1440 Q540,1380 1060,1440 L1060,1960 L20,1960 Z" fill="${V('#ffffff', 0, 0.16)}"/><path d="M20,1440 Q540,1380 1060,1440" stroke="#e4e0d8" stroke-width="10" fill="none"/>`;
  // тумбочка и телефон
  const ph = io((t - t0 - 0.6) / 0.5);
  g += `<rect x="${who === 'nil' ? 790 : 40}" y="1260" width="250" height="300" fill="${V('#a8784a', 0.15, 0.3)}"/>`;
  const px = who === 'nil' ? 915 : 165;
  g += `<g transform="translate(${px} 1210) rotate(${who === 'nil' ? -8 : 8})" filter="url(#soft)"><rect x="-80" y="-60" width="160" height="100" rx="16" fill="#151518"/><rect x="-70" y="-52" width="140" height="84" rx="10" fill="${ph > 0.5 ? '#2a3a5a' : '#202024'}"/>${ph > 0.5 ? label(0, -16, '6:59', 30, '#fff', 0.95) + label(0, 18, '9 ноября', 22, '#cfe0ff', 0.9) : ''}</g>`;
  if (ph > 0.5) g += glow(px, 1200, 160, '#8ab0ff', 0.35 * ph);
  return g;
}

// ---------- планы ----------
const shots = {
  // 1. Хук: Найлз крупно на розовом круге в бассейне отеля, пиво, очки на лбу, усталая ухмылка
  hook(t, T) {
    const k = io(t / T), bob = wave(t, 0.4) * 10, sip = at(t, 2.3, 0.4) * (1 - at(t, 3.2, 0.4));
    const els = [
      sky([[0, '#4aa8e8'], [0.4, '#9ad4f4'], [0.55, '#f4e0c8']]),
      clouds(t, 300, '#fff', 0.85),
      par(-k * 20, 0, mountains(1020, t)),
      par(-k * 40, 0, bungalow(-60, 1080, 360, { h: 180 }) + bungalow(760, 1090, 400, { h: 190, door: '#f08a5a' }) + palm(330, 1090, 620, t, 0) + palm(700, 1100, 520, t, 1.4) + palm(980, 1080, 700, t, 2.6)),
      `<rect x="0" y="1060" width="1080" height="40" fill="#f2ece0"/>`,
      pool(0, 1095, 1080, 1920, t),
      ring(540, 1690 + bob, 430, 170, '#ff5fa2', 'back'),
      nil(540, 1700 + bob, 2.9, { pose: 'sit', arms: 'hold', shades: 'up', smirk: at(t, 0.9, 0.5) > 0.5, look: lerp(0.5, -0.1, at(t, 0.6, 0.8)), lookUp: 0.1, blink: blink(t, 0.6), frown: 0.25, nod: wave(t, 0.3) * 0.8 - sip * 2, lean: wave(t, 0.35) * 1.5 }),
      can(lerp(650, 610, sip), lerp(1340, 1200, sip) + bob, 1.6, lerp(10, -35, sip)),
      `<rect x="0" y="${1640 + bob}" width="1080" height="400" fill="#2cc8d8" opacity="0.55"/>`,
      ring(540, 1690 + bob, 430, 170, '#ff5fa2', 'front'),
      grade('#ffd8a0', 0.25),
      topShade(620, 0.45),
    ];
    return { cam: { z: lerp(1.0, 1.14, k), y: lerp(0, -70, k) }, els };
  },

  // 2. Свадьба в пустыне (Найлз скучает у арки) → утро: он снова просыпается, на телефоне «9 ноября»
  morning(t, T) {
    const k = io(t / T), sw = at(t, 2.5, 0.6);
    const pan = io(clamp(t / 2.9)) * 140;
    const wed = sky([[0, '#5ab0ec'], [0.45, '#bfe4f8'], [0.6, '#f6e2c8']]) + clouds(t, 280, '#fff', 0.8, 9)
      + par(-pan * 0.2, 0, mountains(1060, t))
      + par(-pan * 0.5, 0, palm(60, 1150, 640, t, 0.4) + palm(1080, 1150, 720, t, 2) + `<rect x="-200" y="1120" width="1600" height="900" fill="${V('#e8dcc0', 0.05, 0.12)}"/><path d="M380,1150 L760,1150 L1100,1920 L40,1920 Z" fill="#f4f0e8" opacity="0.7"/>`)
      // цветочная арка
      + par(-pan * 0.6, 0, `<path d="M380,1180 L380,820 Q570,620 760,820 L760,1180" stroke="#f4f0e8" stroke-width="22" fill="none"/>` + Array.from({ length: 26 }, (_, i) => { const a = Math.PI * (i / 25); const r = 190; const cx = 570 - Math.cos(a) * r, cy = 840 - Math.sin(a) * r * 1.05; return `<circle cx="${cx}" cy="${cy}" r="${26 + (i % 3) * 6}" fill="${['#ffffff', '#f4b8c8', '#ff8aa8', '#a8d890'][i % 4]}"/>`; }).join('') + Array.from({ length: 8 }, (_, i) => `<circle cx="${i < 4 ? 380 : 760}" cy="${900 + (i % 4) * 70}" r="24" fill="${['#ffffff', '#f4b8c8', '#a8d890'][i % 3]}"/>`).join(''))
      // ряды стульев и гости
      + par(-pan * 0.8, 0, Array.from({ length: 2 }, (_, r) => Array.from({ length: 7 }, (_, i) => { const x = (i < 3 ? 140 + i * 100 : 640 + (i - 3) * 100) + r * 20, y = 1300 + r * 110; return `<rect x="${x - 34}" y="${y - 90}" width="68" height="90" rx="6" fill="#f8f6f0" stroke="#d8d0c0" stroke-width="3"/>`; }).join('')).join('') + [[240, 1320, 0], [740, 1320, 1], [460, 1430, 2], [860, 1430, 3], [140, 1430, 4]].map(([x, y, i]) => guest(x, y, 0.62, i, t)).join(''))
      + par(-pan, 0, nil(640, 1900, 1.55, { look: lerp(-0.6, 0.6, at(t, 0.8, 1.4)), lookUp: 0.2, frown: 0.35, blink: blink(t, 0.9), nod: wave(t, 0.4) * 0.8, shades: 'up', step: 0, arms: 'down' }) + can(820, 1520, 1.2, 8));
    const bed = bedroom(t, 'nil', D + 2.7);
    return {
      cam: { z: lerp(1.04, 1.12, k), y: lerp(0, -40, k) },
      els: [layer(1 - sw, wed + grade('#ffe0b0', 0.25)), layer(sw, bed + grade('#ffd8a0', 0.25)), topShade(620, 0.45)],
    };
  },

  // 3. Вечеринка: гирлянды, бассейн с подсветкой, Найлз танцует → тост с бокалом
  party(t, T) {
    const k = io(t / T), pan = lerp(0, 760, io(clamp((t - D - 0.5) / 3.2)));
    const toast = at(t, 3.1, 0.4), dance = 1 - toast;
    const world = `<rect x="-300" width="2700" height="1920" fill="${grad([[0, '#1a1840'], [0.35, '#6a3a7a'], [0.5, '#f08a6a'], [0.6, '#2a2040']])}"/>`
      + stars(30, 500, t, 0.6) + par(1080, 0, stars(30, 500, t, 0.6, 8))
      + mountains(1050, t, { far: '#5a3a6a', mid: '#3a2a4a', near: '#2a1e34' }) + par(1180, 0, mountains(1050, t, { far: '#5a3a6a', mid: '#3a2a4a', near: '#2a1e34' }))
      + palm(-40, 1150, 640, t, 0, '#1a2a2a') + palm(1500, 1150, 700, t, 1, '#1a2a2a') + palm(1950, 1150, 600, t, 2, '#1a2a2a')
      + `<rect x="-200" y="1120" width="2400" height="900" fill="${V('#3a2a3a', 0.05, 0.3)}"/>`
      + pool(-200, 1300, 700, 1920, t, { c: '#18a8c8', night: true }) + glow(250, 1600, 500, '#30e0ff', 0.25)
      + ring(260, 1560, 170, 60, '#ffd24a', 'back') + ring(260, 1560, 170, 60, '#ffd24a', 'front') + can(420, 1500, 0.9, 70)
      + lights(-200, 760, 600, 820, 60, 10, t) + lights(600, 820, 1400, 760, 70, 10, t) + lights(1400, 760, 2200, 820, 60, 10, t)
      + `<rect x="700" y="1260" width="1500" height="700" fill="${V('#6a4a3a', 0.1, 0.3)}"/>` + Array.from({ length: 12 }, (_, i) => `<path d="M${700 + i * 130},1260 l-40,700" stroke="#4a3228" stroke-width="4"/>`).join('')
      + [[860, 1500, 0], [1060, 1450, 1], [1700, 1450, 2], [1880, 1520, 3], [1240, 1440, 4]].map(([x, y, i]) => guest(x, y, 0.85, i, t, { arms: i % 2 ? 'raise' : 'down', smile: true, lean: 6 })).join('')
      + `<rect x="1580" y="1240" width="200" height="140" fill="#f8f4ec"/><rect x="1610" y="1150" width="140" height="90" fill="#f4ece0"/><rect x="1640" y="1090" width="80" height="60" fill="#fff8f0"/>${glow(1680, 1200, 200, '#ffd890', 0.25)}`
      + nil(1400, 1900, 1.7, { arms: toast > 0.5 || wave(t, 1.1) > 0 ? 'cheers' : 'hold', lean: dance * wave(t, 1.1) * 9, step: dance * wave(t, 2.2), look: toast > 0.5 ? -0.4 : wave(t, 0.6) * 0.6, frown: -0.1, smirk: true, blink: blink(t, 0.5), nod: wave(t, 2.2) * 2 * dance, shades: 'eyes' })
      + (toast > 0.5 ? `<g transform="translate(${1400 + 160 * 1.7 * 0.84} ${1075 - 130 * 1.7 - 30})"><path d="M-22,-70 L22,-70 L10,-10 L-10,-10 Z" fill="#fff8d0" opacity="0.8"/><rect x="-3" y="-10" width="6" height="50" fill="#fff" opacity="0.8"/><rect x="-18" y="38" width="36" height="6" fill="#fff" opacity="0.8"/></g>${glow(1628, 800, 120, '#fff0b0', 0.4 * toast)}` : '')
      + `<g filter="url(#soft)"><rect x="1172" y="1220" width="10" height="300" fill="#2a2a2a"/><circle cx="1177" cy="1210" r="20" fill="#3a3a3a"/></g>`;
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -30, k) },
      els: [par(-pan, 0, world), grade('#ff9ad0', 0.18), topShade(620, 0.5)],
    };
  },

  // 4. Ночь, светящаяся расщелина в скале; Найлз оборачивается, Сара идёт следом → вспышка → Сара просыпается в том же утре
  cave(t, T) {
    const k = io(t / T), walk = at(t, 1.6, 1.8), flash = Math.max(0, 1 - Math.abs(t - D - 4.2) / 0.45), sw = at(t, 4.25, 0.3);
    const pulse = 0.75 + 0.25 * wave(t, 0.9);
    const night = sky([[0, '#060a20'], [0.5, '#1a1a40'], [0.65, '#3a2a4a']]) + stars(80, 900, t)
      + glow(860, 360, 300, '#c8d4ff', 0.35) + `<circle cx="860" cy="360" r="46" fill="#f2f0e6"/>`
      + par(-k * 20, 0, mountains(1080, t, { far: '#2a2a4a', mid: '#1e1e36', near: '#16162a' }))
      + par(-k * 50, 0, joshua(120, 1260, 1.4, '#2a3a2a') + joshua(980, 1240, 1.1, '#2a3a2a'))
      // скала с расщелиной
      + par(-k * 70, 0, `<path d="M380,1500 L420,1000 Q520,860 700,900 Q880,940 940,1100 L1000,1500 Z" fill="${V('#5a4048', 0.12, 0.35)}"/><path d="M620,1500 L650,1180 Q680,1120 700,1180 L740,1500 Z" fill="#1a0e0a"/>`
        + glow(690, 1340, 360 * pulse, '#ff8a30', 0.6) + `<path d="M640,1500 L660,1220 Q690,1170 710,1230 L730,1500 Z" fill="${V('#ffb050', 0.3, 0.2)}" opacity="${0.75 * pulse}"/>`)
      + `<rect x="0" y="1480" width="1080" height="500" fill="${V('#3a2a2a', 0.05, 0.4)}"/>`
      + par(-k * 90, 0, nil(820, 1820, 1.3, { look: -1, lookUp: 0.1, arms: at(t, 2.4, 0.3) > 0.5 ? 'raise' : 'down', frown: -0.3, blink: blink(t, 1.2), nod: wave(t, 0.5) * 0.8, lean: -4 }) + glow(820, 1300, 300, '#ff8a30', 0.2)
        + sar(lerp(-120, 330, walk), 1860, 1.35, { step: walk < 0.98 ? wave(t, 1.6) : 0, look: 0.9, lookUp: 0.2, frown: 0.35, blink: blink(t, 0.4), nod: wave(t, 1.6) * 1.2, soft: true }));
    const bed = bedroom(t, 'sar', D + 4.4);
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -40, k) },
      els: [layer(1 - sw, night + grade('#ff9a5a', 0.15)), layer(sw, bed + grade('#ffd8a0', 0.25)), `<rect width="1080" height="1920" fill="#fff4d8" opacity="${flash.toFixed(3)}"/>`, topShade(620, 0.5)],
    };
  },

  // 5. Пустынное шоссе: Сара в ярости гонит кабриолет, Найлз рядом невозмутимо пьёт пиво
  road(t, T) {
    const k = io(t / T), sway = wave(t, 0.5) * 6, vx = 540;
    const hy = 1020; // горизонт
    let side = '';
    // предметы у дороги летят на камеру (из точки схода к краю)
    reseed(31);
    const items = Array.from({ length: 9 }, (_, i) => ({ ph: i / 9, side: i % 2 ? 1 : -1, kind: i % 3 }));
    items.sort((a, b) => ((t * 0.35 + a.ph) % 1) - ((t * 0.35 + b.ph) % 1));
    items.forEach((o) => {
      const z = (t * 0.35 + o.ph) % 1, s = 0.15 + Math.pow(z, 2.2) * 2.2, x = vx + o.side * (120 + Math.pow(z, 2.2) * 1100), y = hy + Math.pow(z, 2.2) * 900;
      side += o.kind === 0 ? joshua(x, y, s) : o.kind === 1 ? cactus(x, y, s) : `<rect x="${x - 6 * s}" y="${y - 520 * s}" width="${12 * s}" height="${520 * s}" fill="#6a5040"/><rect x="${x - 60 * s}" y="${y - 500 * s}" width="${120 * s}" height="${10 * s}" fill="#6a5040"/>`;
    });
    const sign = (() => { const z = clamp((t - D - 0.3) / 3.2), s = 0.2 + Math.pow(z, 2.2) * 2.4, x = vx - 140 - Math.pow(z, 2.2) * 1200, y = hy + Math.pow(z, 2.2) * 900; return `<rect x="${x - 5 * s}" y="${y - 300 * s}" width="${10 * s}" height="${300 * s}" fill="#8a8a8a"/><g transform="translate(${x} ${y - 330 * s}) rotate(45) scale(${s})"><rect x="-60" y="-60" width="120" height="120" rx="8" fill="#f4c81a" stroke="#1a1a1a" stroke-width="8"/></g><g transform="translate(${x} ${y - 330 * s}) scale(${s})"><ellipse cx="0" cy="0" rx="26" ry="16" fill="#1a1a1a"/><circle cx="24" cy="-12" r="11" fill="#1a1a1a"/><path d="M28,-20 q12,-8 6,10" stroke="#1a1a1a" stroke-width="5" fill="none"/><rect x="-18" y="8" width="5" height="20" fill="#1a1a1a"/><rect x="12" y="8" width="5" height="20" fill="#1a1a1a"/></g>`; })();
    const dashes = Array.from({ length: 10 }, (_, i) => { const z = (t * 0.9 + i / 10) % 1, z2 = Math.min(1, z + 0.04), y0 = hy + Math.pow(z, 2.5) * 900, y1 = hy + Math.pow(z2, 2.5) * 900; const w0 = 4 + Math.pow(z, 2.5) * 40, w1 = 4 + Math.pow(z2, 2.5) * 40; return `<path d="M${vx - w0 / 2},${y0} L${vx + w0 / 2},${y0} L${vx + w1 / 2},${y1} L${vx - w1 / 2},${y1} Z" fill="#f4d04a"/>`; }).join('');
    const angry = at(t, 2.0, 0.4);
    const els = [
      sky([[0, '#3a9ae8'], [0.4, '#a8d8f4'], [0.53, '#f8e4c8']]),
      clouds(t, 340, '#fff', 0.85, 4),
      glow(820, 640, 280, '#fff8d0', 0.6),
      mountains(hy, t, { far: '#c8a0b0', mid: '#b08890', near: '#a07a6a' }),
      `<rect x="0" y="${hy}" width="1080" height="${1920 - hy}" fill="${V('#e8c898', 0.05, 0.15)}"/>`,
      `<path d="M${vx - 20},${hy} L${vx + 20},${hy} L1400,1920 L-320,1920 Z" fill="${V('#5a5458', 0.05, 0.2)}"/>`,
      dashes, side, sign,
      // кабриолет навстречу камере (камера едет перед машиной)
      `<g transform="translate(${sway} ${wave(t, 1.3) * 3})">`
        + `<rect x="60" y="1300" width="960" height="140" rx="40" fill="${V('#5ad0d0', 0.25, 0.25)}"/>`
        + `<rect x="80" y="1330" width="920" height="300" fill="#1e2a30"/>`
        + sar(370, 1640, 1.45, { pose: 'sit', arms: 'hold', angry: true, frown: lerp(0.55, 0.9, angry), squint: angry > 0.5, look: wave(t, 0.4) * 0.3, blink: blink(t, 1.1), nod: wave(t, 0.8) * 1.2, lean: lerp(0, -3, angry) })
        + nil(720, 1650, 1.45, { pose: 'sit', arms: 'hold', shades: 'eyes', smirk: true, look: -0.3, frown: 0, nod: wave(t, 0.3) * 0.8, lean: 5 })
        + can(760, lerp(1360, 1230, at(t, 3.4, 0.4)), 1.0, lerp(0, -30, at(t, 3.4, 0.4)))
        + `<g filter="url(#soft)"><ellipse cx="370" cy="1430" rx="150" ry="46" fill="none" stroke="#1a1a1c" stroke-width="22"/><rect x="356" y="1430" width="28" height="60" fill="#1a1a1c"/></g>`
        + `<path d="M120,1320 L180,1080 L900,1080 L960,1320" stroke="#c8d0d4" stroke-width="16" fill="none"/><path d="M180,1080 L900,1080 L960,1320 L120,1320 Z" fill="#cfe8f0" opacity="0.15"/><path d="M260,1100 L340,1100 L250,1300 L170,1300 Z" fill="#fff" opacity="0.18"/>`
        + `<path d="M0,1420 Q540,1370 1080,1420 L1080,1960 L0,1960 Z" fill="${V('#4ac0c4', 0.3, 0.35)}"/><path d="M60,1470 Q540,1430 1020,1470" stroke="#fff" stroke-width="6" opacity="0.35" fill="none"/>`
        + `<rect x="300" y="1720" width="480" height="70" rx="14" fill="${V('#d8dcdc', 0.3, 0.3)}"/>${Array.from({ length: 11 }, (_, i) => `<rect x="${320 + i * 42}" y="1730" width="20" height="50" fill="#6a7070"/>`).join('')}`
        + [[150, 1640], [930, 1640]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="70" fill="${R('#fff8e0', 0.2, 0.2)}" stroke="#c8d0d0" stroke-width="12"/>`).join('')
        + `<rect x="430" y="1820" width="220" height="60" rx="6" fill="#f4f0e4" stroke="#2a3a5a" stroke-width="4"/>${label(540, 1860, 'kinoplot.film', 22, '#2a3a5a', 0.85)}`
        + `</g>`,
      grade('#ffd8a0', 0.25),
      topShade(620, 0.45),
    ];
    return { cam: { z: lerp(1.04, 1.12, k), y: lerp(-20, -50, k) }, els };
  },

  // 6. Мелькающие кадры без контекста → ночь: Найлз один у бассейна смотрит на своё отражение
  hiding(t, T) {
    const tt = t - D;
    const w = (a, b) => clamp((tt - a) / 0.18) * (1 - clamp((tt - b) / 0.18));
    const fA = w(-1, 0.75), fB = w(0.75, 1.5), fC = w(1.5, 2.3), fD = clamp((tt - 2.3) / 0.25);
    // А: двое на кругах в бассейне, солнце
    const A = sky([[0, '#4aa8e8'], [0.45, '#bfe4f8']]) + mountains(900, t) + palm(100, 980, 560, t, 0) + palm(960, 990, 600, t, 2)
      + pool(0, 960, 1080, 1920, t)
      + [[330, '#ffd24a', 'sar'], [760, '#ff5fa2', 'nil']].map(([x, c, who], i) => { const b = wave(t, 0.4, i * 2) * 10; return ring(x, 1560 + b, 260, 100, c, 'back') + (who === 'sar' ? sar(x, 1570 + b, 1.6, { pose: 'sit', arms: 'hold', soft: true, look: 0.6, blink: blink(t, 0.3) }) : nil(x, 1570 + b, 1.6, { pose: 'sit', arms: 'hold', shades: 'eyes', smirk: true, look: -0.6 })) + `<rect x="${x - 300}" y="${1530 + b}" width="600" height="200" fill="#2cc8d8" opacity="0.5"/>` + ring(x, 1560 + b, 260, 100, c, 'front'); }).join('');
    // Б: танец в придорожном баре, неон kinoplot.film (пасхалка)
    const B = `<rect width="1080" height="1920" fill="${V('#2a1a24', 0.1, 0.3)}"/>` + Array.from({ length: 9 }, (_, i) => `<rect x="${i * 130}" y="0" width="8" height="1920" fill="#1a0e14" opacity="0.6"/>`).join('')
      + `<g><text x="540" y="860" font-family="'Brush Script MT', cursive" font-size="110" fill="#ff7ac0" text-anchor="middle" opacity="${0.85 + 0.15 * wave(t, 3)}">kinoplot.film</text></g>` + glow(540, 830, 420, '#ff5fa2', 0.35)
      + `<rect x="0" y="1150" width="1080" height="60" fill="#5a3a24"/>` + Array.from({ length: 12 }, (_, i) => `<rect x="${40 + i * 88}" y="${1060 + (i % 3) * 10}" width="26" height="${90 - (i % 3) * 10}" rx="6" fill="${['#3a8a5a', '#8a3a2a', '#c8a03a', '#4a6a9a'][i % 4]}" opacity="0.8"/>`).join('')
      + `<rect x="0" y="1500" width="1080" height="500" fill="${V('#4a2a20', 0.1, 0.3)}"/>`
      + sar(360, 1820, 1.45, { arms: wave(t, 1.2) > 0 ? 'cheers' : 'hold', lean: wave(t, 1.2) * 8, step: wave(t, 2.4), soft: true, look: 0.5, nod: wave(t, 2.4) * 2 })
      + nil(720, 1820, 1.45, { arms: wave(t, 1.2) > 0 ? 'cheers' : 'hold', lean: wave(t, 1.2) * 8, step: wave(t, 2.4), smirk: true, look: -0.5, nod: wave(t, 2.4) * 2 })
      + `<rect width="1080" height="1920" fill="#ff5fa2" opacity="0.08"/>`;
    // В: стрела вонзается в столб рядом с Найлзом
    const hit = clamp((tt - 1.7) / 0.18);
    const C = sky([[0, '#e8a868'], [0.5, '#f4d4a8']]) + mountains(1100, t, { far: '#c89088', mid: '#a87068', near: '#8a5a50' })
      + `<rect x="0" y="1090" width="1080" height="900" fill="${V('#d8b088', 0.05, 0.2)}"/>` + joshua(200, 1300, 1.6)
      + `<rect x="760" y="760" width="40" height="900" fill="${V('#7a5a3a', 0.1, 0.3)}"/>`
      + nil(560, 1860, 1.6, { look: 0.9, frown: -0.5, lean: lerp(0, -8, hit), blink: false, shades: 'up' })
      + `<g transform="translate(${lerp(1400, 790, hit)} 1020)"><rect x="0" y="-4" width="260" height="8" fill="#4a3a2a"/><path d="M-20,0 L4,-12 L4,12 Z" fill="#8a8a8a"/><path d="M230,-4 L270,-22 L262,0 L270,22 L230,4 Z" fill="#c83a3a"/></g>`
      + (hit >= 1 ? `<path d="M780,1000 l-30,-20 M780,1040 l-30,20" stroke="#5a3a2a" stroke-width="5"/>` : '');
    // Г: ночь, Найлз один у бассейна; отражение в воде
    const dz = io(clamp((tt - 2.3) / (T - 2.4)));
    const Dn = `<rect width="1080" height="1920" fill="${V('#0a1030', 0.05, 0.2)}"/>` + stars(60, 700, t) + palm(80, 1150, 600, t, 0, '#0e1a22') + palm(1000, 1150, 640, t, 1.5, '#0e1a22')
      + bungalow(330, 1150, 420, { h: 190, lit: true, c: '#3a3a50' })
      + `<rect x="0" y="1150" width="1080" height="120" fill="#3a3a48"/>`
      + pool(0, 1270, 1080, 1920, t, { c: '#1290b8', night: true }) + glow(540, 1600, 600, '#30d8ff', 0.3)
      + `<path d="M480,1290 L470,1440 M600,1290 L610,1440" stroke="#2a5a7a" stroke-width="54" stroke-linecap="round" opacity="0.75"/>` + [470, 610].map((x) => `<ellipse cx="${x}" cy="1300" rx="${50 + 8 * wave(t, 0.8, x)}" ry="12" fill="none" stroke="#bff4ff" stroke-width="3" opacity="0.5"/>`).join('') + `<g transform="translate(0 2540) scale(1 -1)" opacity="0.12" filter="url(#blur8)">${nil(540, 1270, 1.5, { pose: 'sit', look: 0, frown: 0.4, sil: '' })}</g>`
      + nil(540, 1270, 1.5, { pose: 'sit', arms: 'hold', look: 0, lookUp: -1.2, frown: 0.45, blink: blink(t, 1.4), nod: 1.5 + wave(t, 0.3) * 0.6 })
      + `<rect x="0" y="1262" width="1080" height="26" fill="${V('#d8d4c8', 0.1, 0.3)}"/><rect x="0" y="1288" width="1080" height="6" fill="#000" opacity="0.25"/>`
      + glow(540, 1100, 300, '#40c8ff', 0.18);
    return {
      cam: { z: lerp(1.0, 1.06, clamp(tt / 2.3)) * (fD > 0 ? lerp(1.0, 1.12, dz) : 1), y: fD > 0 ? lerp(0, -60, dz) : 0 },
      els: [layer(fA * (1 - fD), A), layer(fB * (1 - fD), B), layer(fC * (1 - fD), C), layer(fD, Dn), grade('#9ad0ff', 0.15), topShade(620, 0.5)],
    };
  },

  // 7. Ночь, фейерверк над бассейном: Найлз и Сара со смехом прыгают в воду прямо в одежде
  globes(t, T) {
    const k = io(t / T), tt = t - D;
    const jump = clamp((tt - 0.2) / 1.2), splash = clamp((tt - 1.4) / 0.9), up = io((tt - 2.0) / 0.6);
    const arc = (x0, x1) => ({ x: lerp(x0, x1, jump), y: 1380 - Math.sin(jump * Math.PI) * 380 + jump * 160 });
    const a = arc(160, 440), b = arc(420, 700);
    let fig = '';
    if (jump < 1) fig = sar(a.x, a.y, 1.25, { arms: 'raise', lean: lerp(-5, 25, jump), smile: true, soft: true, look: 0.8 }) + nil(b.x, b.y, 1.25, { arms: 'raise', lean: lerp(-5, 25, jump), smirk: true, look: -0.6 });
    const sp = splash > 0 && splash < 1 ? Array.from({ length: 34 }, (_, i) => { reseed(i + 400); const ang = -Math.PI * (0.1 + rnd() * 0.8), v = 300 + rnd() * 400, x = 570 + (rnd() - 0.5) * 200 + Math.cos(ang) * v * splash, y = 1560 + Math.sin(ang) * v * splash + 600 * splash * splash; return `<circle cx="${x}" cy="${y}" r="${8 + rnd() * 12}" fill="#c8f8ff" opacity="${1 - splash}"/>`; }).join('') + `<ellipse cx="570" cy="1560" rx="${200 + splash * 220}" ry="${40 + splash * 40}" fill="none" stroke="#e8ffff" stroke-width="10" opacity="${1 - splash}"/>` : '';
    const heads = up > 0 ? [[440, 'sar'], [700, 'nil']].map(([x, who]) => { const y = lerp(1900, 1700, up) + wave(t, 0.5, x) * 8; return who === 'sar' ? sar(x, y, 1.3, { pose: 'sit', smile: true, look: 0.7, hair: '#24160e' }) : nil(x, y, 1.3, { pose: 'sit', smile: true, look: -0.7, hair: '#1a120e' }); }).join('') + `<rect x="0" y="1640" width="1080" height="300" fill="#18a8c8" opacity="0.6"/>` : '';
    const els = [
      sky([[0, '#050820'], [0.5, '#141a40'], [0.65, '#2a2040']]),
      stars(50, 800, t),
      firework(300, 520, tt, -0.4, '#ff5fa2', 240), firework(780, 440, tt, 0.4, '#ffd24a', 280), firework(520, 640, tt, 1.3, '#4ae0e8', 220), firework(220, 400, tt, 2.2, '#ffd24a', 200), firework(860, 600, tt, 3.0, '#ff5fa2', 260), firework(480, 420, tt, 3.8, '#ffffff', 240),
      palm(40, 1200, 620, t, 0, '#0e1a22') + palm(1040, 1200, 680, t, 2, '#0e1a22'),
      lights(-50, 980, 540, 1030, 50, 10, t) + lights(540, 1030, 1130, 980, 50, 10, t),
      `<rect x="0" y="1180" width="1080" height="180" fill="${V('#3a2e3a', 0.1, 0.3)}"/>`,
      [[880, 1350, 0], [990, 1360, 2], [60, 1350, 5]].map(([x, y, i]) => guest(x, y, 0.7, i, t, { arms: 'raise', smile: true })).join(''),
      pool(0, 1360, 1080, 1920, t, { c: '#18a8c8', night: true }), glow(540, 1600, 600, '#30e0ff', 0.3),
      heads, fig, sp,
      grade('#ff9ad0', 0.15),
      topShade(560, 0.35),
    ];
    return { cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k) }, els };
  },

  // 8. Закат над пустыней: Найлз и Сара рядом на склоне, внизу огни свадьбы; камера отъезжает и поднимается
  question(t, T) {
    const k = io(t / T), tt = t - D;
    const lookN = at(t, 2.8, 0.5), lookS = at(t, 3.7, 0.5);
    const els = [
      sky([[0, '#2a1e50'], [0.3, '#8a3a7a'], [0.5, '#ff7a5a'], [0.6, '#ffc070']]),
      stars(60, 700, t, clamp(tt / 4)),
      glow(540, 1110, 420, '#ffd080', 0.7), `<circle cx="540" cy="${1110 + k * 40}" r="90" fill="#ffe0a0"/>`,
      mountains(1160, t, { far: '#8a4a6a', mid: '#5a3050', near: '#3a2040' }),
      `<rect x="0" y="1160" width="1080" height="800" fill="${V('#3a2438', 0.05, 0.3)}"/>`,
      // огни свадьбы в долине
      Array.from({ length: 24 }, (_, i) => { reseed(i + 600); return `<circle cx="${180 + rnd() * 380}" cy="${1250 + rnd() * 60}" r="4" fill="#ffd890" opacity="${0.6 + 0.4 * wave(t, 0.8, i)}"/>`; }).join('') + glow(370, 1280, 220, '#ffc870', 0.4),
      // склон-гребень, на котором они сидят
      `<path d="M-50,1600 Q300,1500 540,1530 Q800,1560 1130,1480 L1130,1960 L-50,1960 Z" fill="${V('#2a1a24', 0.08, 0.3)}"/>` + joshua(940, 1520, 1.2, '#2a3024'),
      sar(400, 1700, 1.5, { pose: 'sit', soft: true, look: lerp(-0.3, 0.9, lookS), lookUp: 0.2, blink: blink(t, 0.5), nod: wave(t, 0.3) * 0.6, frown: lerp(0.15, -0.05, lookS) }),
      nil(680, 1710, 1.55, { pose: 'sit', look: lerp(-0.2, -0.95, lookN), lookUp: 0.2, smirk: lookS > 0.5, blink: blink(t, 1.6), nod: wave(t, 0.3, 1) * 0.6, frown: 0.1 }),
      glow(540, 1300, 500, '#ff9a5a', 0.12),
      grade('#ffb070', 0.2),
      topShade(560, 0.45),
    ];
    return { cam: { z: lerp(1.2, 1.0, k), y: lerp(60, -40, k) }, els };
  },
};

run(shots);
