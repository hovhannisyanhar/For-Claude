// «Отец» (The Father, 2020) — 8 сцен в 2D-векторе. Имя плана = set сцены в videos/the-father/script.json.
// Лондонская квартира: бирюзовые стены с филёнками, высокие окна-гильотины, книжные полки, кожаное кресло,
// паркет «ёлочкой», лампы с абажурами, картина с девочкой в красном платье. Тёплый свет из окна → к концу холод и ночь.
import { run, person, setProportions, V, R, grad, glow, rnd, reseed, shade, lerp, ease, clamp, wave, def } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// Энтони: седой, лысеющий, голубые глаза; зелёный вязаный кардиган поверх светлой рубашки, бежевые брюки
const ANTHONY = { shirt: '#56603a', pants: '#b8ab88', skin: '#e8b89a', hair: '#e6e3dc', iris: '#6a8cb0', beard: false, frown: 0.2, old: true, cardigan: '#56603a', inner: '#ecebe4' };
const ANNE = { shirt: '#2f5888', pants: '#2a2e3a', skin: '#ecc0a2', hair: '#3a2a20', iris: '#5a4a32', beard: false, frown: 0.1, blouse: true };
const STRANGER = { shirt: '#6e5c4c', pants: '#3a3a40', skin: '#e2b496', hair: '#2a2420', iris: '#3a3a3a', beard: false, frown: -0.1, sweater: true };
const WOMAN2 = { shirt: '#8a4038', pants: '#3a3030', skin: '#e8bc9c', hair: '#a8784a', iris: '#4a6a5a', beard: false, frown: -0.1, longHair: true, blouse: true };
const CARER = { shirt: '#6a5a7a', pants: '#3a3440', skin: '#c8906a', hair: '#1e1814', iris: '#3a2414', beard: false, frown: 0.5, longHair: true, coatLong: '#5a4a68' };

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
function rays(x, y, angs, len, c, op) {
  return `<g style="mix-blend-mode:screen">${angs.map((a, i) => { const r1 = (a - 3) * Math.PI / 180, r2 = (a + 3 + i % 2 * 2) * Math.PI / 180; return `<path d="M${x},${y} L${x + Math.cos(r1) * len},${y + Math.sin(r1) * len} L${x + Math.cos(r2) * len},${y + Math.sin(r2) * len} Z" fill="${grad([[0, c, op], [1, c, 0]])}"/>`; }).join('')}</g>`;
}

// ---------- персонажи ----------
function geo(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const pose = o.pose || 'stand';
  const legH = (pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  return { hs, hr, top, ty, headY: top - hr * 0.8 + (o.nod || 0) * 6 * hs, pose };
}
function dress(x, y, s, o) {
  const { hs, hr, top, ty, headY } = geo(x, y, s, o);
  let b = '', front = '';
  if (o.cardigan) {
    // рубашка в вырезе, воротник, пуговицы; полы кардигана с косами вязки, карманы, ремень
    b += `<path d="M${x - 46 * s},${top - 6 * s} L${x + 46 * s},${top - 6 * s} L${x + 40 * s},${ty + 4 * s} L${x - 40 * s},${ty + 4 * s} Z" fill="${V(o.inner, 0.1, 0.12)}"/>`;
    for (let i = 0; i < 4; i++) b += `<circle cx="${x}" cy="${top + (60 + i * 48) * s}" r="${4 * s}" fill="#cfcabc"/>`;
    b += `<path d="M${x - 50 * s},${top - 8 * s} L${x - 6 * s},${top + 30 * s} L${x - 30 * s},${top + 42 * s} Z M${x + 50 * s},${top - 8 * s} L${x + 6 * s},${top + 30 * s} L${x + 30 * s},${top + 42 * s} Z" fill="#f6f5ef"/>`;
    b += `<rect x="${x - 40 * s}" y="${ty - 18 * s}" width="${80 * s}" height="${16 * s}" fill="#4a3424"/><rect x="${x - 10 * s}" y="${ty - 21 * s}" width="${20 * s}" height="${22 * s}" rx="${3 * s}" fill="none" stroke="#b8b4a8" stroke-width="${3 * s}"/>`;
    const c = o.cardigan;
    [-1, 1].forEach((sd) => {
      b += `<path d="M${x + sd * 40 * s},${top - 10 * s} L${x + sd * 104 * s},${top + 26 * s} L${x + sd * 100 * s},${ty + 40 * s} L${x + sd * 36 * s},${ty + 40 * s} L${x + sd * 34 * s},${top + 90 * s} Z" fill="${V(c, 0.12, 0.25)}"/>`;
      b += `<path d="M${x + sd * 40 * s},${top - 10 * s} L${x + sd * 34 * s},${top + 90 * s} L${x + sd * 36 * s},${ty + 40 * s}" stroke="${shade(c, -0.3)}" stroke-width="${12 * s}" fill="none"/>`;
      for (let k = 0; k < 9; k++) b += `<path d="M${x + sd * 70 * s},${top + (30 + k * 26) * s} q${sd * 8 * s},${10 * s} 0,${20 * s}" stroke="${shade(c, 0.18)}" stroke-width="${4 * s}" fill="none" opacity="0.6"/>`;
      b += `<rect x="${x + sd * 70 * s - 24 * s}" y="${ty - 30 * s}" width="${48 * s}" height="${44 * s}" rx="${6 * s}" fill="${V(c, 0.18, 0.2)}" stroke="${shade(c, -0.3)}" stroke-width="${3 * s}"/>`;
    });
    b += `<rect x="${x - 104 * s}" y="${ty + 26 * s}" width="${66 * s}" height="${16 * s}" fill="${shade(c, -0.15)}"/><rect x="${x + 38 * s}" y="${ty + 26 * s}" width="${66 * s}" height="${16 * s}" fill="${shade(c, -0.15)}"/>`;
  }
  if (o.blouse) {
    b += `<path d="M${x - 40 * s},${top - 6 * s} Q${x},${top + 40 * s} ${x + 40 * s},${top - 6 * s}" stroke="${shade(o.shirt, -0.3)}" stroke-width="${8 * s}" fill="none"/>`;
    for (let i = 0; i < 4; i++) b += `<circle cx="${x}" cy="${top + (50 + i * 40) * s}" r="${4.5 * s}" fill="${shade(o.shirt, -0.35)}"/>`;
  }
  if (o.sweater) {
    b += `<path d="M${x - 44 * s},${top - 4 * s} Q${x},${top + 30 * s} ${x + 44 * s},${top - 4 * s} L${x + 30 * s},${top + 10 * s} Q${x},${top + 36 * s} ${x - 30 * s},${top + 10 * s} Z" fill="#e6e2d8"/>`;
    b += `<rect x="${x - 100 * s}" y="${ty - 24 * s}" width="${200 * s}" height="${24 * s}" fill="${shade(o.shirt, -0.12)}"/>`;
    for (let k = -80; k <= 80; k += 20) b += `<path d="M${x + k * s},${ty - 22 * s} L${x + k * s},${ty - 2 * s}" stroke="${shade(o.shirt, -0.3)}" stroke-width="${3 * s}"/>`;
  }
  if (o.coatLong) {
    const c = o.coatLong;
    b += `<path d="M${x - 104 * s},${top + 20 * s} L${x - 112 * s},${ty + 150 * s} L${x - 20 * s},${ty + 150 * s} L${x - 10 * s},${top + 60 * s} Z M${x + 104 * s},${top + 20 * s} L${x + 112 * s},${ty + 150 * s} L${x + 20 * s},${ty + 150 * s} L${x + 10 * s},${top + 60 * s} Z" fill="${V(c, 0.12, 0.3)}"/>`;
    b += `<path d="M${x - 50 * s},${top - 8 * s} L${x - 12 * s},${top + 70 * s} L${x - 60 * s},${top + 60 * s} Z M${x + 50 * s},${top - 8 * s} L${x + 12 * s},${top + 70 * s} L${x + 60 * s},${top + 60 * s} Z" fill="${shade(c, -0.25)}"/>`;
  }
  if (o.old) {
    // морщины на лбу и у глаз, седые брови кустиками, залысина
    front += `<path d="M${x - hr * 0.95},${headY - hr * 0.1} Q${x - hr * 0.7},${headY - hr * 1.12} ${x},${headY - hr * 1.0} Q${x + hr * 0.7},${headY - hr * 1.12} ${x + hr * 0.95},${headY - hr * 0.1} Q${x + hr * 0.7},${headY - hr * 0.58} ${x},${headY - hr * 0.62} Q${x - hr * 0.7},${headY - hr * 0.58} ${x - hr * 0.95},${headY - hr * 0.1} Z" fill="${R(o.skin, 0.12, 0.1)}"/>`;
    front += `<path d="M${x - hr * 1.0},${headY + hr * 0.1} Q${x - hr * 1.05},${headY - hr * 0.55} ${x - hr * 0.7},${headY - hr * 0.72} L${x - hr * 0.78},${headY - hr * 0.2} Z M${x + hr * 1.0},${headY + hr * 0.1} Q${x + hr * 1.05},${headY - hr * 0.55} ${x + hr * 0.7},${headY - hr * 0.72} L${x + hr * 0.78},${headY - hr * 0.2} Z" fill="${o.hair}"/>`;
    front += `<path d="M${x - hr * 0.62},${headY - hr * 0.95} Q${x - hr * 0.3},${headY - hr * 1.14} ${x + hr * 0.1},${headY - hr * 1.02}" stroke="${o.hair}" stroke-width="${10 * hs}" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 3; i++) front += `<path d="M${x - hr * 0.42},${headY - hr * (0.6 - i * 0.12)} Q${x},${headY - hr * (0.68 - i * 0.12)} ${x + hr * 0.42},${headY - hr * (0.6 - i * 0.12)}" stroke="${shade(o.skin, -0.25)}" stroke-width="${3 * hs}" fill="none" opacity="0.7"/>`;
    [-1, 1].forEach((sd) => { front += `<path d="M${x + sd * hr * 0.62},${headY + hr * 0.02} l${sd * hr * 0.14},${-hr * 0.04} M${x + sd * hr * 0.62},${headY + hr * 0.1} l${sd * hr * 0.14},${hr * 0.03}" stroke="${shade(o.skin, -0.3)}" stroke-width="${2.5 * hs}" opacity="0.7"/><path d="M${x + sd * hr * 0.2},${headY + hr * 0.34} Q${x + sd * hr * 0.3},${headY + hr * 0.6} ${x + sd * hr * 0.24},${headY + hr * 0.76}" stroke="${shade(o.skin, -0.25)}" stroke-width="${3 * hs}" fill="none" opacity="0.6"/>`; });
    const fr = o.frown ?? 0.2;
    [-1, 1].forEach((sd) => { const ex = x + sd * 34 * hs + (o.look || 0) * 8 * hs; front += `<path d="M${ex + sd * 24 * hs},${headY - 26 * hs - fr * 14 * hs} Q${ex},${headY - 34 * hs} ${ex - sd * 20 * hs},${headY - 26 * hs + fr * 14 * hs}" stroke="#d8d4cc" stroke-width="${11 * hs}" fill="none" stroke-linecap="round"/>`; });
  }
  if (o.cup) front += `<g><rect x="${x + 22 * s}" y="${top + 120 * s}" width="${46 * s}" height="${50 * s}" rx="${6 * s}" fill="${V('#f2efe6', 0.2, 0.2)}"/><path d="M${x + 68 * s},${top + 130 * s} q${18 * s},${4 * s} 0,${30 * s}" stroke="#e6e2d8" stroke-width="${6 * s}" fill="none"/><circle cx="${x + 40 * s}" cy="${top + 170 * s}" r="${27 * s * 0.72}" fill="${R(o.skin)}"/></g>`;
  if (o.bag) front += `<g><path d="M${x - 150 * s},${ty - 40 * s} Q${x - 130 * s},${ty - 110 * s} ${x - 100 * s},${ty - 40 * s}" stroke="#2a2420" stroke-width="${7 * s}" fill="none"/><rect x="${x - 190 * s}" y="${ty - 44 * s}" width="${130 * s}" height="${100 * s}" rx="${14 * s}" fill="${V('#7a4a2a', 0.2, 0.3)}"/></g>`;
  return { b, front };
}
function man(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b });
  if (!front) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}>${front}</g>`;
}

// ---------- интерьер ----------
// стена с филёнками, карниз, плинтус и паркет «ёлочкой» в перспективе
function room(o = {}) {
  const wall = o.wall || '#2f5a5a', fy = o.floorY || 1380, vx = o.vx ?? 540;
  let g = `<rect width="1080" height="${fy}" fill="${V(wall, 0.06, 0.3)}"/>`;
  g += `<rect y="150" width="1080" height="26" fill="${shade(wall, 0.18)}"/><rect y="176" width="1080" height="8" fill="${shade(wall, -0.25)}"/>`;
  const dado = fy - 330;
  g += `<rect y="${dado}" width="1080" height="16" fill="${shade(wall, 0.15)}"/><rect y="${dado + 16}" width="1080" height="5" fill="${shade(wall, -0.3)}"/>`;
  (o.panels || [[60, 300, 420], [600, 300, 420]]).forEach(([px, pw, ph]) => {
    g += `<rect x="${px}" y="${dado - ph - 40}" width="${pw}" height="${ph}" fill="none" stroke="${shade(wall, 0.12)}" stroke-width="6"/><rect x="${px + 6}" y="${dado - ph - 34}" width="${pw - 12}" height="${ph - 12}" fill="none" stroke="${shade(wall, -0.22)}" stroke-width="3"/>`;
    g += `<rect x="${px}" y="${dado + 50}" width="${pw}" height="${230}" fill="none" stroke="${shade(wall, 0.1)}" stroke-width="5"/><rect x="${px + 5}" y="${dado + 55}" width="${pw - 10}" height="220" fill="none" stroke="${shade(wall, -0.22)}" stroke-width="3"/>`;
  });
  g += `<rect y="${fy - 40}" width="1080" height="40" fill="${V(shade(wall, -0.1), 0.15, 0.2)}"/>`;
  g += `<rect y="${fy}" width="1080" height="${1920 - fy}" fill="${V(o.floor || '#7a5232', 0.12, 0.4)}"/>`;
  // ёлочка: косые штрихи по рядам, ряды сжимаются к горизонту
  let rows = '', yy = fy, h = 18;
  while (yy < 1920) { for (let xx = -200 + ((yy / h) % 2) * 30; xx < 1300; xx += 60) rows += `<path d="M${vx + (xx - vx) * (1 + (yy - fy) / 500)},${yy} l${30 * (1 + (yy - fy) / 500)},${h}" stroke="#3a2414" stroke-width="2" opacity="0.4"/>`; yy += h; h *= 1.12; }
  g += rows;
  return g;
}
function sashWindow(x, y, w, h, o = {}) {
  const sky = o.night ? grad([[0, '#0c1424'], [1, '#1e2a40']]) : grad([[0, '#fff6dc'], [1, '#e8dcc0']]);
  let g = `<rect x="${x - 26}" y="${y - 26}" width="${w + 52}" height="${h + 52}" fill="${V('#e8e2d4', 0.1, 0.2)}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sky}"/>`;
  if (o.night) {
    // крыши и трубы лондонских домов, окна напротив
    g += `<path d="M${x},${y + h * 0.62} L${x + w * 0.2},${y + h * 0.62} L${x + w * 0.2},${y + h * 0.5} L${x + w * 0.26},${y + h * 0.5} L${x + w * 0.26},${y + h * 0.58} L${x + w * 0.55},${y + h * 0.58} L${x + w * 0.6},${y + h * 0.46} L${x + w * 0.64},${y + h * 0.46} L${x + w * 0.66},${y + h * 0.56} L${x + w},${y + h * 0.56} L${x + w},${y + h} L${x},${y + h} Z" fill="#070a12"/>`;
    [[0.1, 0.7], [0.4, 0.66], [0.75, 0.72], [0.82, 0.86], [0.3, 0.86]].forEach(([a, b], i) => { g += `<rect x="${x + w * a}" y="${y + h * b}" width="${w * 0.07}" height="${h * 0.06}" fill="#ffcf7a" opacity="${i % 2 ? 0.6 : 0.85}"/>`; });
    g += `<circle cx="${x + w * 0.72}" cy="${y + h * 0.2}" r="${w * 0.07}" fill="#eef0e6" opacity="0.85"/>`;
  } else {
    g += `<path d="M${x},${y + h * 0.75} Q${x + w * 0.3},${y + h * 0.66} ${x + w * 0.55},${y + h * 0.72} Q${x + w * 0.8},${y + h * 0.64} ${x + w},${y + h * 0.7} L${x + w},${y + h} L${x},${y + h} Z" fill="#c8c4a0" opacity="0.6"/>`;
    g += `<rect x="${x + w * 0.1}" y="${y + h * 0.66}" width="${w * 0.22}" height="${h * 0.34}" fill="#d4ccb4" opacity="0.6"/><rect x="${x + w * 0.62}" y="${y + h * 0.6}" width="${w * 0.3}" height="${h * 0.4}" fill="#d8d0b8" opacity="0.6"/>`;
  }
  const bar = '#ece6d8';
  g += `<rect x="${x}" y="${y + h / 2 - 9}" width="${w}" height="18" fill="${bar}"/><rect x="${x + w / 2 - 6}" y="${y}" width="12" height="${h}" fill="${bar}"/>`;
  for (const k of [0.25, 0.75]) g += `<rect x="${x}" y="${y + h * k - 3}" width="${w}" height="6" fill="${bar}"/>`;
  g += `<rect x="${x - 40}" y="${y + h + 26}" width="${w + 80}" height="22" fill="${V('#f0ece2', 0.1, 0.2)}"/>`;
  // шторы
  const c = o.curtain || '#c8b89a';
  g += `<path d="M${x - 70},${y - 50} L${x + 20},${y - 50} Q${x - 10},${y + h * 0.5} ${x + 30},${y + h + 60} L${x - 80},${y + h + 60} Z" fill="${V(c, 0.15, 0.3)}"/><path d="M${x + w + 70},${y - 50} L${x + w - 20},${y - 50} Q${x + w + 10},${y + h * 0.5} ${x + w - 30},${y + h + 60} L${x + w + 80},${y + h + 60} Z" fill="${V(c, 0.15, 0.3)}"/>`;
  g += `<rect x="${x - 100}" y="${y - 64}" width="${w + 200}" height="14" rx="7" fill="#8a6a3a"/>`;
  return g;
}
function bookshelf(x, y, w, h, sd = 3) {
  reseed(sd);
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${V('#4a2e1c', 0.12, 0.3)}"/>`;
  const n = Math.floor(h / 150);
  const cols = ['#7a2a24', '#2a4a6a', '#c8a85a', '#3a5a3a', '#e0d8c4', '#5a3a5a', '#a85a2a', '#2a2a2a'];
  for (let r = 0; r < n; r++) {
    const sy = y + 14 + r * (h - 20) / n, sh = (h - 20) / n - 18;
    g += `<rect x="${x + 12}" y="${sy}" width="${w - 24}" height="${sh}" fill="#22150c"/>`;
    for (let bx = x + 16; bx < x + w - 30;) { const bw = 12 + rnd() * 18, bh = sh * (0.65 + rnd() * 0.33); if (rnd() < 0.08) { bx += 24; continue; } g += `<rect x="${bx}" y="${sy + sh - bh}" width="${bw}" height="${bh}" fill="${V(cols[Math.floor(rnd() * cols.length)], 0.15, 0.25)}"/><rect x="${bx + 2}" y="${sy + sh - bh + 10}" width="${bw - 4}" height="3" fill="#e8d8a0" opacity="0.4"/>`; bx += bw + 1; }
    g += `<rect x="${x + 6}" y="${sy + sh}" width="${w - 12}" height="14" fill="${shade('#4a2e1c', 0.15)}"/>`;
  }
  return `<g filter="url(#soft)">${g}</g>`;
}
function wingChair(x, y, s, c = '#4a2018') {
  let g = `<path d="M${x - 150 * s},${y - 120 * s} Q${x - 170 * s},${y - 520 * s} ${x},${y - 540 * s} Q${x + 170 * s},${y - 520 * s} ${x + 150 * s},${y - 120 * s} Z" fill="${V(c, 0.18, 0.35)}"/>`;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) g += `<circle cx="${x + (j - 1) * 70 * s}" cy="${y - (440 - i * 80) * s}" r="${6 * s}" fill="${shade(c, -0.4)}"/>`;
  g += [-1, 1].map((sd) => `<path d="M${x + sd * 150 * s},${y - 420 * s} Q${x + sd * 230 * s},${y - 380 * s} ${x + sd * 210 * s},${y - 250 * s} L${x + sd * 210 * s},${y - 60 * s} L${x + sd * 130 * s},${y - 60 * s} L${x + sd * 130 * s},${y - 260 * s} Z" fill="${V(shade(c, 0.05), 0.2, 0.35)}"/><circle cx="${x + sd * 205 * s}" cy="${y - 250 * s}" r="${30 * s}" fill="${V(shade(c, 0.1), 0.25, 0.3)}"/>`).join('');
  g += `<rect x="${x - 160 * s}" y="${y - 160 * s}" width="${320 * s}" height="${110 * s}" rx="${20 * s}" fill="${V(shade(c, 0.1), 0.2, 0.3)}"/>`;
  g += [-1, 1].map((sd) => `<path d="M${x + sd * 170 * s},${y - 50 * s} L${x + sd * 182 * s},${y}" stroke="#2a1a10" stroke-width="${14 * s}" stroke-linecap="round"/>`).join('');
  return `<g filter="url(#soft)">${g}</g>`;
}
function lamp(x, y, s, on = 1, c = '#d8c08a') {
  return `${glow(x, y - 360 * s, 300 * s, '#ffcf7a', 0.5 * on)}<g filter="url(#soft)"><rect x="${x - 6 * s}" y="${y - 330 * s}" width="${12 * s}" height="${300 * s}" fill="${V('#a88a4a', 0.3, 0.2)}"/><ellipse cx="${x}" cy="${y - 20 * s}" rx="${60 * s}" ry="${18 * s}" fill="#5a4220"/><path d="M${x - 70 * s},${y - 320 * s} L${x - 46 * s},${y - 430 * s} L${x + 46 * s},${y - 430 * s} L${x + 70 * s},${y - 320 * s} Z" fill="${V(c, 0.2, 0.15)}"/><path d="M${x - 70 * s},${y - 320 * s} L${x + 70 * s},${y - 320 * s}" stroke="#a88a4a" stroke-width="${5 * s}"/></g>${glow(x, y - 310 * s, 120 * s, '#fff0c0', 0.6 * on)}`;
}
// картина: девочка в красном платье танцует (как на стене в квартире Энтони)
function dancer(x, y, w, h, op = 1) {
  return `<g opacity="${op}" filter="url(#soft)"><rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" fill="${V('#b8944a', 0.3, 0.3)}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${grad([[0, '#3a6a7a'], [0.7, '#5a8a6a'], [1, '#2a4a3a']])}"/>
  <path d="M${x},${y + h * 0.78} Q${x + w * 0.5},${y + h * 0.7} ${x + w},${y + h * 0.8} L${x + w},${y + h} L${x},${y + h} Z" fill="#3a5a2a"/>
  <path d="M${x + w * 0.5},${y + h * 0.38} L${x + w * 0.3},${y + h * 0.72} Q${x + w * 0.5},${y + h * 0.78} ${x + w * 0.72},${y + h * 0.7} Z" fill="#c8302a"/>
  <circle cx="${x + w * 0.5}" cy="${y + h * 0.33}" r="${w * 0.07}" fill="#e8c0a0"/><path d="M${x + w * 0.47},${y + h * 0.42} L${x + w * 0.22},${y + h * 0.3} M${x + w * 0.53},${y + h * 0.42} L${x + w * 0.78},${y + h * 0.36} M${x + w * 0.44},${y + h * 0.72} L${x + w * 0.4},${y + h * 0.86} M${x + w * 0.56},${y + h * 0.72} L${x + w * 0.68},${y + h * 0.82}" stroke="#e8c0a0" stroke-width="${w * 0.03}" stroke-linecap="round"/></g>`;
}
function door(x, y, w, h, o = {}) {
  let g = `<rect x="${x - 22}" y="${y - h - 22}" width="${w + 44}" height="${h + 22}" fill="${V('#ece6d8', 0.1, 0.2)}"/>`;
  g += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${o.open ? (o.inside || grad([[0, '#d8c8a0'], [1, '#a8946a']])) : V('#e2dccc', 0.1, 0.25)}"/>`;
  if (!o.open) { g += `<rect x="${x + w * 0.12}" y="${y - h * 0.92}" width="${w * 0.76}" height="${h * 0.38}" fill="none" stroke="#c8c0ac" stroke-width="5"/><rect x="${x + w * 0.12}" y="${y - h * 0.46}" width="${w * 0.76}" height="${h * 0.38}" fill="none" stroke="#c8c0ac" stroke-width="5"/><circle cx="${x + w * 0.85}" cy="${y - h * 0.5}" r="10" fill="#b89a5a"/>`; }
  else g += `<path d="M${x},${y - h} L${x - w * 0.35},${y - h - 30} L${x - w * 0.35},${y + 30} L${x},${y} Z" fill="${V('#e2dccc', 0.1, 0.3)}"/>`;
  return `<g filter="url(#soft)">${g}</g>`;
}
function recordPlayer(x, y, s, t) {
  return `<g filter="url(#soft)"><rect x="${x - 130 * s}" y="${y - 20 * s}" width="${260 * s}" height="${180 * s}" fill="${V('#5a3a22', 0.15, 0.3)}"/><rect x="${x - 120 * s}" y="${y - 60 * s}" width="${240 * s}" height="${44 * s}" rx="${6 * s}" fill="${V('#3a2a1e', 0.2, 0.3)}"/><ellipse cx="${x - 10 * s}" cy="${y - 62 * s}" rx="${80 * s}" ry="${18 * s}" fill="#111"/><ellipse cx="${x - 10 * s}" cy="${y - 62 * s}" rx="${22 * s}" ry="${5 * s}" fill="#c8302a"/><path d="M${x + 90 * s},${y - 70 * s} L${x + 30 * s},${y - 64 * s}" stroke="#c8ccd0" stroke-width="${5 * s}"/>${[0, 1, 2].map((i) => { const f = (t * 0.6 + i / 3) % 1; return `<text x="${x + (30 + f * 60) * s}" y="${y - (90 + f * 120) * s}" font-size="${36 * s}" fill="#ffe8b0" opacity="${0.6 * (1 - f)}">♪</text>`; }).join('')}</g>`;
}
function rug(cx, cy, w, h, c = '#7a2a24') {
  return `<path d="M${cx - w * 0.38},${cy - h / 2} L${cx + w * 0.38},${cy - h / 2} L${cx + w / 2},${cy + h / 2} L${cx - w / 2},${cy + h / 2} Z" fill="${V(c, 0.1, 0.3)}"/><path d="M${cx - w * 0.33},${cy - h * 0.4} L${cx + w * 0.33},${cy - h * 0.4} L${cx + w * 0.43},${cy + h * 0.4} L${cx - w * 0.43},${cy + h * 0.4} Z" fill="none" stroke="#c8a85a" stroke-width="6" opacity="0.7"/>`;
}

// ---------- сцены ----------
const shots = {
  // 1. Гостиная, утро: Энтони крупно, растерян; за плечом в дверях незнакомец с чашкой спокойно улыбается
  stranger(t, T) {
    const k = ease(t / T), turn = ease(clamp((t - 1.2) / 0.6));
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -50, k) },
      els: [
        room({ panels: [[40, 240, 380], [820, 240, 380]] }),
        sashWindow(330, 420, 300, 620),
        rays(480, 700, [55, 62, 70, 78], 1500, '#fff4d0', 0.18),
        bookshelf(700, 560, 340, 840, 4),
        dancer(70, 620, 200, 260),
        door(820, 1380, 190, 560, { open: true }),
        shadow(860, 1380, 110, 0.3),
        man(880, 1380, 0.56, { ...STRANGER, arms: 'hold', cup: true, look: -1, smile: true, blink: blink(t, 2.0) }),
        rug(540, 1640, 900, 300),
        wingChair(430, 1960, 1.35),
        glow(420, 1200, 500, '#ffe8b0', 0.18),
        man(420, 2330, 1.95, { ...ANTHONY, arms: 'down', look: lerp(0, 1, turn), lookUp: 0.1, frown: lerp(0.1, 0.65, turn), worried: true, blink: blink(t, 0.8) }),
        grade('#ffd8a0', 0.18),
        topShade(900, 0.55),
      ],
    };
  },

  // 2. Прихожая: Энтони с ухмылкой держит дверь, обиженная сиделка уходит; полки, проигрыватель с пластинкой
  carer(t, T) {
    const k = ease(t / T), go = ease(clamp((t - 0.8) / (T * 0.7)));
    return {
      cam: { z: lerp(1.04, 1.0, k), x: lerp(20, -20, k) },
      els: [
        room({ wall: '#3a5e58', panels: [[40, 260, 380], [380, 260, 380]] }),
        bookshelf(40, 520, 300, 860, 7),
        dancer(400, 640, 180, 230),
        recordPlayer(510, 1360, 0.9, t),
        door(700, 1400, 260, 760, { open: true, inside: grad([[0, '#9aa8a0'], [1, '#5a665e']]) }),
        // лестничная площадка за дверью
        `<rect x="700" y="640" width="260" height="760" fill="${grad([[0, '#b8c0b4'], [1, '#6a7468']])}" opacity="0.6"/><path d="M720,1400 L720,1100 L940,1100" stroke="#3a3a34" stroke-width="8" fill="none" opacity="0.5"/>`,
        `<g opacity="${1 - go * 0.6}">${shadow(lerp(830, 900, go), 1400, 90, 0.3)}${man(lerp(830, 900, go), 1400, lerp(0.6, 0.5, go), { ...CARER, arms: 'down', bag: true, look: -1, frown: 0.6, worried: true, blink: blink(t, 1.4) })}</g>`,
        rug(450, 1640, 700, 220, '#5a2a3a'),
        shadow(420, 1880, 170, 0.35),
        man(420, 1880, 1.1, { ...ANTHONY, arms: 'point', look: 1, frown: -0.2, smile: true, blink: blink(t, 0.4) }),
        grade('#ffd8a0', 0.16),
        topShade(900, 0.55),
      ],
    };
  },

  // 3. Кухня, раскол кадра: слева днём дочь в пальто с чемоданом (открытка с Эйфелевой башней), справа вечером чужая женщина у плиты
  kitchen(t, T) {
    const k = ease(t / T), split = ease(clamp((t - T * 0.42) / 0.7));
    const kit = (dark) => {
      const wall = dark ? '#2a3a40' : '#cfd8cc';
      let g = `<rect width="1080" height="1920" fill="${V(wall, 0.08, 0.3)}"/>`;
      for (let yy = 900; yy < 1180; yy += 40) for (let xx = 0; xx < 1080; xx += 60) g += `<rect x="${xx + ((yy / 40) % 2) * 30}" y="${yy}" width="56" height="36" fill="${dark ? '#34484e' : '#e8ece4'}" stroke="${dark ? '#24323a' : '#b8c0b4'}" stroke-width="2"/>`;
      g += [0, 1, 2, 3, 4].map((i) => `<rect x="${40 + i * 210}" y="420" width="190" height="420" rx="6" fill="${V(dark ? '#3a4a40' : '#6a8a6a', 0.12, 0.25)}"/><rect x="${60 + i * 210}" y="440" width="150" height="380" fill="none" stroke="${dark ? '#2a3830' : '#4a6a4a'}" stroke-width="4"/><rect x="${190 + i * 210}" y="780" width="8" height="40" fill="#c8b07a"/>`).join('');
      g += `<rect x="0" y="1180" width="1080" height="40" fill="${V(dark ? '#4a4038' : '#d8ccb0', 0.2, 0.2)}"/><rect x="0" y="1220" width="1080" height="400" fill="${V(dark ? '#2e3c34' : '#5a7a5a', 0.1, 0.3)}"/>`;
      g += [0, 1, 2, 3, 4].map((i) => `<rect x="${30 + i * 210}" y="1240" width="190" height="360" rx="4" fill="none" stroke="${dark ? '#1e2a24' : '#3a5a3a'}" stroke-width="4"/>`).join('');
      g += `<rect x="0" y="1620" width="1080" height="300" fill="${V(dark ? '#2a2620' : '#8a7a62', 0.1, 0.4)}"/>`;
      for (let xx = 0; xx < 1080; xx += 90) for (let yy = 1620; yy < 1920; yy += 90) g += `<rect x="${xx + ((yy / 90) % 2) * 45}" y="${yy}" width="45" height="45" fill="${dark ? '#1a1814' : '#e8e0cc'}" opacity="0.5"/>`;
      // чайник, банки, плита
      g += `<g filter="url(#soft)"><path d="M720,1180 Q720,1080 790,1080 Q860,1080 860,1180 Z" fill="${V('#c8302a', 0.25, 0.25)}"/><path d="M780,1080 Q790,1050 800,1080" stroke="#222" stroke-width="8" fill="none"/>${[0, 1, 2].map((i) => `<rect x="${200 + i * 70}" y="${1100 - i * 10}" width="54" height="${80 + i * 10}" rx="8" fill="${['#e8d8b0', '#b8c8c0', '#d8b8a0'][i]}"/>`).join('')}</g>`;
      return g;
    };
    def(`<clipPath id="kl"><rect x="0" y="0" width="${lerp(1080, 540, split)}" height="1920"/></clipPath><clipPath id="kr"><rect x="${lerp(1080, 540, split)}" y="0" width="1080" height="1920"/></clipPath>`);
    return {
      cam: { z: lerp(1.0, 1.06, k) },
      els: [
        `<g clip-path="url(#kl)">${kit(false)}
          <g filter="url(#soft)"><rect x="40" y="960" width="200" height="140" fill="#f4efe2" transform="rotate(-5 140 1030)"/><path d="M140,975 L118,1085 M140,975 L162,1085 M124,1040 L156,1040 M130,1010 L150,1010" stroke="#3a3a3a" stroke-width="5" transform="rotate(-5 140 1030)"/><text x="60" y="1090" font-size="22" fill="#a8322a" transform="rotate(-5 140 1030)">PARIS</text></g>
          ${shadow(300, 1820, 150, 0.3)}${man(300, 1820, 1.0, { ...ANNE, coatLong: '#7a6a52', arms: 'down', look: 0.6, smile: true, blink: blink(t, 1.1) })}
          <g filter="url(#soft)"><rect x="420" y="1600" width="110" height="200" rx="14" fill="${V('#8a3a2a', 0.2, 0.3)}"/><rect x="455" y="1570" width="40" height="34" rx="8" fill="none" stroke="#2a1a12" stroke-width="8"/></g>
          ${grade('#fff0d0', 0.2)}</g>`,
        `<g clip-path="url(#kr)">${kit(true)}${glow(800, 900, 500, '#ffb860', 0.35)}
          ${shadow(780, 1800, 150, 0.3)}${man(780, 1800, 0.96, { ...WOMAN2, arms: 'hold', cup: true, look: 1, smile: true, blink: blink(t, 0.3) })}
          ${man(1060, 2200, 1.5, { ...ANTHONY, arms: 'down', look: -1, frown: 0.7, worried: true, blink: blink(t, 2.2) })}
          ${grade('#6080a0', 0.25)}</g>`,
        `<rect x="${lerp(1080, 540, split) - 4}" y="0" width="8" height="1920" fill="#0a0a0a" opacity="${split}"/>`,
        topShade(900, 0.55),
      ],
    };
  },

  // 4. Спальня: Энтони роется в ящике комода, голое запястье крупно; в дверях силуэты смотрят с жалостью
  watch(t, T) {
    const k = ease(t / T), faces = ease(clamp((t - 1.4) / 1.2));
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -40, k) },
      els: [
        room({ wall: '#2c4e54', panels: [[40, 200, 360], [840, 200, 360]] }),
        ...[[300, 0.52, ANNE], [540, 0.5, STRANGER], [780, 0.5, WOMAN2]].map(([dx, sc, who], i) => `${door(dx - 100, 1380, 200, 600, { open: true, inside: grad([[0, '#1a2228'], [1, '#0e1418']]) })}<g opacity="${faces}">${man(dx, 1380, sc, { ...who, arms: 'down', look: 0, frown: -0.5, worried: true, blink: blink(t, i) })}</g>`),
        // комод с выдвинутым ящиком: носки, письма, коробочка без часов
        `<g filter="url(#soft)"><rect x="80" y="1420" width="920" height="500" fill="${V('#6a3e24', 0.15, 0.35)}"/><rect x="60" y="1400" width="960" height="30" fill="${V('#7a4a2c', 0.2, 0.3)}"/><rect x="140" y="1520" width="800" height="200" fill="${V('#5a3420', 0.1, 0.3)}" transform="translate(0 ${lerp(0, 40, k)})"/><rect x="170" y="${1490 + lerp(0, 40, k)}" width="740" height="60" fill="#2a1a10"/>${[0, 1, 2].map((i) => `<ellipse cx="${260 + i * 110}" cy="${1510 + lerp(0, 40, k)}" rx="44" ry="18" fill="${['#c8c0b0', '#3a4a6a', '#8a2a2a'][i]}"/>`).join('')}<rect x="640" y="${1490 + lerp(0, 40, k)}" width="130" height="40" rx="6" fill="#1a3a5a"/><rect x="652" y="${1494 + lerp(0, 40, k)}" width="106" height="30" rx="4" fill="#e8e0c8"/><circle cx="705" cy="${1508 + lerp(0, 40, k)}" r="10" fill="none" stroke="#b8a060" stroke-width="3" stroke-dasharray="4 4"/></g>`,
        // Энтони за комодом
        man(540, 2100, 1.35, { ...ANTHONY, arms: 'table', look: lerp(0.4, -0.4, ease(clamp((t - 2) / 0.6))), lookUp: -0.5, frown: 0.7, worried: true, blink: blink(t, 0.9) }),
        glow(705, 1530 + lerp(0, 40, k), 160, '#ffe0a0', 0.55),
        lamp(960, 1400, 0.8, 0.8),
        grade('#ffd0a0', 0.12),
        topShade(900, 0.55),
      ],
    };
  },

  // 5. Длинный коридор с одинаковыми дверями, холодный свет; Энтони прислушивается у двери, длинная тень
  corridor(t, T) {
    const k = ease(t / T);
    const vx = 540, vy = 1060;
    let doors = '';
    for (let i = 5; i >= 0; i--) {
      const f = 1 / (1 + i * 0.55), w = 220 * f, h = 560 * f, yb = vy + 660 * f;
      [-1, 1].forEach((sd) => {
        const xx = vx + sd * 560 * f;
        doors += `<path d="M${xx},${yb} L${xx},${yb - h} L${xx + sd * -w * 0.35},${yb - h * 0.92} L${xx + sd * -w * 0.35},${yb - 12 * f} Z" fill="${V('#dcd8cc', 0.1, 0.3)}" opacity="${0.6 + 0.4 * f}"/><circle cx="${xx + sd * -w * 0.3}" cy="${yb - h * 0.5}" r="${6 * f}" fill="#9a8a5a"/>`;
      });
      doors += `<rect x="${vx - 560 * f}" y="${vy - 520 * f}" width="${1120 * f}" height="6" fill="#ffffff" opacity="${0.2 * f}"/>`;
      doors += `${glow(vx, vy - 560 * f, 120 * f, '#e8f4ff', 0.5 * f)}<rect x="${vx - 60 * f}" y="${vy - 566 * f}" width="${120 * f}" height="${12 * f}" rx="4" fill="#f4faff"/>`;
    }
    return {
      cam: { z: lerp(1.0, 1.14, k), y: lerp(0, -40, k) },
      els: [
        `<rect width="1080" height="1920" fill="#16242a"/>`,
        `<path d="M0,0 L1080,0 L${vx + 100},${vy - 140} L${vx - 100},${vy - 140} Z" fill="${V('#d8e0dc', 0.05, 0.6)}" opacity="0.5"/>`,
        `<path d="M0,0 L${vx - 100},${vy - 140} L${vx - 100},${vy + 160} L0,1920 Z" fill="${grad([[0, '#2e5258'], [1, '#1a3034']], false)}"/><path d="M1080,0 L${vx + 100},${vy - 140} L${vx + 100},${vy + 160} L1080,1920 Z" fill="${grad([[0, '#1a3034'], [1, '#2e5258']], false)}"/>`,
        `<path d="M0,1920 L${vx - 100},${vy + 160} L${vx + 100},${vy + 160} L1080,1920 Z" fill="${V('#5a4030', 0.05, 0.4)}"/>`,
        [...Array(9)].map((_, i) => `<path d="M${vx},${vy + 160} L${-400 + i * 235},1920" stroke="#2a1a10" stroke-width="3" opacity="0.4"/>`).join(''),
        `<rect x="${vx - 100}" y="${vy - 140}" width="200" height="300" fill="${grad([[0, '#c8e0f0'], [1, '#88a0b0']])}"/>${glow(vx, vy, 260, '#dff0ff', 0.6)}`,
        doors,
        // тень от фигуры тянется к зрителю
        `<path d="M590,1640 L460,1920 L700,1920 Z" fill="#000" opacity="0.35" filter="url(#blur8)"/>`,
        man(660, 1660, 0.82, { ...ANTHONY, arms: 'hold', lean: -6, look: -1, frown: 0.8, worried: true, blink: blink(t, 1.6) }),
        `<g transform="translate(${lerp(-10, 0, k)} 0)">${door(80, 1880, 250, 900, {})}</g>`,
        grade('#80a8c0', 0.3),
        topShade(900, 0.6),
      ],
    };
  },

  // 6. Гостиная «плывёт»: стены меняют цвет, мебель сдвигается, лица на фото размыты; в конце мелькают кадры без контекста
  rooms(t, T) {
    const k = ease(t / T);
    const cutAt = T - 2.1;
    if (t >= cutAt) {
      const c = Math.min(2, Math.floor((t - cutAt) / 0.7));
      const frames = [
        // пустая комната: только прямоугольники от снятых картин на стене
        () => [room({ wall: '#8a9a98', floor: '#9a8a70' }), `<rect x="200" y="560" width="220" height="280" fill="#a8b8b4"/><rect x="620" y="620" width="260" height="200" fill="#a8b8b4"/>`, sashWindow(380, 900, 320, 360, { curtain: '#d8d4c8' }), grade('#e0f0ff', 0.3)],
        // окно в листве
        () => [`<rect width="1080" height="1920" fill="#e8ece4"/>`, `<rect x="140" y="420" width="800" height="1100" fill="${grad([[0, '#a8c890'], [1, '#4a7a4a']])}"/>`, ...[...Array(26)].map((_, i) => { reseed(40 + i); return `<circle cx="${140 + rnd() * 800}" cy="${420 + rnd() * 1100}" r="${60 + rnd() * 90}" fill="${['#3a6a3a', '#5a8a4a', '#7aa860'][i % 3]}" opacity="0.8" filter="url(#blur8)"/>`; }), `<rect x="140" y="420" width="800" height="1100" fill="none" stroke="#f4f4ee" stroke-width="40"/><rect x="530" y="420" width="20" height="1100" fill="#f4f4ee"/><rect x="140" y="960" width="800" height="20" fill="#f4f4ee"/>`, glow(540, 800, 600, '#fffbe0', 0.4)],
        // часы без стрелок крупно
        () => [`<rect width="1080" height="1920" fill="#1a2a2e"/>`, glow(540, 1100, 500, '#e8d8b0', 0.25), `<circle cx="540" cy="1100" r="300" fill="${R('#f0e8d4', 0.1, 0.2)}" stroke="#b8944a" stroke-width="26"/>`, ...[...Array(12)].map((_, i) => { const a = i / 12 * Math.PI * 2; return `<rect x="${540 + Math.sin(a) * 250 - 5}" y="${1100 - Math.cos(a) * 250 - 20}" width="10" height="40" fill="#2a2a2a" transform="rotate(${i * 30} ${540 + Math.sin(a) * 250} ${1100 - Math.cos(a) * 250})"/>`; }), `<circle cx="540" cy="1100" r="14" fill="#2a2a2a"/>`],
      ];
      return { cam: { z: 1.04 + 0.05 * ((t - cutAt) % 0.7) }, els: [...frames[c](), topShade(900, 0.5)] };
    }
    const m = ease(clamp(t / cutAt));
    const wallA = '#2f5a5a', wallB = '#6a3a44';
    const mix = (a, b, f) => '#' + [1, 3, 5].map((i) => Math.round(lerp(parseInt(a.substr(i, 2), 16), parseInt(b.substr(i, 2), 16), f)).toString(16).padStart(2, '0')).join('');
    const wob = (i) => wave(t, 0.4, i) * 30 * m;
    return {
      cam: { z: lerp(1.0, 1.1, k), x: 10 * wave(t, 0.2) },
      els: [
        room({ wall: mix(wallA, wallB, m), panels: [[40, 240, 380], [820, 240, 380]] }),
        `<g transform="translate(${lerp(0, 140, m)} 0)">${sashWindow(330, 420, 300, 620)}</g>`,
        `<g transform="translate(${wob(1)} 0)">${dancer(70, 620, 200, 260, 1 - 0.5 * m)}</g>`,
        // фото в рамках: лица размываются
        ...[[760, 640], [900, 700], [800, 860]].map(([fx, fy], i) => `<g filter="url(#soft)"><rect x="${fx}" y="${fy}" width="110" height="140" fill="#c8a85a"/><rect x="${fx + 10}" y="${fy + 10}" width="90" height="120" fill="#e8e0cc"/><g filter="url(#blur${m > 0.4 ? 8 : 4})"><circle cx="${fx + 55}" cy="${fy + 60}" r="26" fill="#d8a88a"/><rect x="${fx + 25}" y="${fy + 90}" width="60" height="40" fill="${['#2f5888', '#6e5c4c', '#8a4038'][i]}"/></g></g>`),
        `<g transform="translate(${lerp(0, -260, m)} 0)">${bookshelf(700, 1000, 300, 380, 9)}</g>`,
        rug(540, 1640, 900, 300, mix('#7a2a24', '#2a4a5a', m)),
        `<g transform="translate(${lerp(0, 300, m)} ${lerp(0, -40, m)}) rotate(${lerp(0, 8, m)} 300 1700)">${wingChair(300, 1700, 0.7)}</g>`,
        lamp(lerp(900, 160, m), 1460, 0.8, 1),
        shadow(560, 1880, 160, 0.35),
        man(560, 1880, 1.05, { ...ANTHONY, arms: 'down', look: wave(t, 0.5), frown: 0.6, worried: true, blink: blink(t, 0.7) }),
        grade(mix('#ffd8a0', '#8090c0', m), 0.22),
        topShade(900, 0.55),
      ],
    };
  },

  // 7. Тёмная сцена в золотом свете, силуэт статуэтки; фото-стикер Энтони Хопкинса появляется под его имя
  award(t, T) {
    const k = ease(t / T);
    const st = STICKERS[0];
    return {
      cam: { z: lerp(1.0, 1.05, k) },
      els: [
        `<defs>${STICKER_FILTER}</defs>`,
        `<rect width="1080" height="1920" fill="${grad([[0, '#0a0806'], [0.6, '#1e140a'], [1, '#0a0806']])}"/>`,
        // занавес
        ...[...Array(10)].map((_, i) => `<rect x="${i * 108}" y="0" width="108" height="1920" fill="${grad([[0, '#3a0e0e'], [0.5, '#5a1616'], [1, '#2a0808']], false)}" opacity="0.6"/>`),
        ...[-1, 1].map((s) => `<path d="M${540 + s * 640},0 L${540 + s * 40},1900 L${540 + s * 300},1900 Z" fill="#ffe2a0" opacity="${0.07 + 0.02 * wave(t, 0.3, s)}"/>`),
        glow(540, 1300, 700, '#e0a84a', 0.35),
        // статуэтка за стикером
        `<g transform="translate(860 1240) scale(1.25)" filter="url(#soft)"><rect x="-70" y="380" width="140" height="70" fill="${V('#1a1410', 0.2, 0.3)}"/><rect x="-50" y="350" width="100" height="34" fill="${V('#c8a24a', 0.35, 0.35)}"/><path d="M-22,350 L-26,120 Q-46,90 -30,40 L-34,0 Q-20,-30 0,-34 Q20,-30 34,0 L30,40 Q46,90 26,120 L22,350 Z" fill="${V('#e0b85a', 0.4, 0.4)}"/><circle cx="0" cy="-56" r="26" fill="${V('#e8c060', 0.4, 0.3)}"/><path d="M-30,40 L30,40 L-6,70 Z" fill="#a8802a"/></g>`,
        ...[...Array(24)].map((_, i) => { reseed(70 + i); const f = (t * 0.15 + rnd()) % 1; return `<circle cx="${rnd() * 1080}" cy="${1800 - f * 1400}" r="${2 + rnd() * 3}" fill="#ffd98a" opacity="${0.5 * Math.sin(f * Math.PI)}"/>`; }),
        sticker(st, t, 0),
        topShade(900, 0.55),
      ],
    };
  },

  // 8. Ночь: Энтони один у окна, в стекле два размытых отражения; лампа гаснет
  window(t, T) {
    const k = ease(t / T), light = lerp(1, 0.25, ease(clamp((t - T * 0.35) / (T * 0.5))));
    def(`<clipPath id="win"><rect x="200" y="420" width="680" height="980"/></clipPath>`);
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -50, k) },
      els: [
        room({ wall: '#16262c', floor: '#2a1e16', panels: [[20, 120, 360], [940, 120, 360]] }),
        sashWindow(200, 420, 680, 980, { night: true, curtain: '#4a4438' }),
        // отражения в стекле: два силуэта Энтони, расходятся
        `<g clip-path="url(#win)" opacity="${0.22 + 0.1 * (1 - light)}" filter="url(#blur8)">${man(lerp(540, 430, k), 1560, 0.8, { ...ANTHONY, arms: 'down', look: 0, frown: 0.5 })}${man(lerp(540, 660, k), 1560, 0.8, { ...ANTHONY, arms: 'down', look: 0, frown: 0.5 })}</g>`,
        glow(540, 900, 500, '#8aa8d8', 0.2),
        lamp(940, 1600, 0.9, light),
        `<rect x="0" y="1560" width="1080" height="360" fill="#000" opacity="0.25"/>`,
        // Энтони спиной в три четверти: силуэт с подсветкой из окна, лицо в профиль-полуанфас
        man(470, 2240, 1.55, { ...ANTHONY, arms: 'down', look: 0.3, lookUp: 0.2, frown: 0.5, worried: true, blink: blink(t, 1.2) }),
        glow(560, 1200, 260, '#9ab8e8', 0.15),
        `<rect width="1080" height="1920" fill="#000" opacity="${0.4 * (1 - light)}"/>`,
        grade('#6080b0', 0.3),
        topShade(900, 0.6),
      ],
    };
  },
};

// ---- фото-стикер Хопкинса: картинку грузим заранее в data URL ----
const IMG = {};
try {
  const b = await (await fetch('/public/assets/the-father/hopkins-cut.png')).blob();
  IMG.hopkins = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
} catch { IMG.hopkins = ''; }
// at — секунда появления (AUDIO_DELAY 4 кадра + слово «Хопкинс» ≈0,97 с)
const STICKERS = [{ k: 'hopkins', x: 430, y: 1330, w: 600, h: 950, at: (4 + 0.97 * 30) / 30, tilt: -3 }];
const STICKER_FILTER = `<filter id="stk" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="10" result="dil"/><feFlood flood-color="#ffffff"/><feComposite in2="dil" operator="in" result="outline"/><feGaussianBlur in="dil" stdDeviation="12" result="blur"/><feOffset in="blur" dx="8" dy="16" result="sh"/><feFlood flood-color="#000" flood-opacity="0.55"/><feComposite in2="sh" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
function sticker(s, t, i) {
  const dt = t - s.at;
  if (dt < 0 || !IMG[s.k]) return '';
  const f = dt * 30;
  const pop = f < 6 ? lerp(0.2, 1.12, f / 6) : f < 10 ? lerp(1.12, 0.96, (f - 6) / 4) : f < 14 ? lerp(0.96, 1, (f - 10) / 4) : 1;
  const wob = wave(t, 0.35, i * 2) * 2.4, bob = wave(t, 0.25, i * 1.3) * 7;
  return `<g transform="translate(${s.x} ${s.y + bob}) rotate(${s.tilt + wob}) scale(${pop})" opacity="${clamp(f / 3)}"><image href="${IMG[s.k]}" x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid meet" filter="url(#stk)"/></g>`;
}

run(shots);
