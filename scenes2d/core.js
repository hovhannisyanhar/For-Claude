// Ядро 2D-векторных сцен «Кино» (SVG): градиенты, свечение, персонажи, камера, виньетка.
// Сцена фильма — модуль scenes2d/<slug>.js: run({имя: (t, T) => ({els: [...svg], cam: {z, x, y}})}).
// Страница: scenes2d/index.html?film=<slug>&shot=<имя>&dur=<сек>&t=<сек>  → window.renderAt(t), window.__done
export const P = new URLSearchParams(location.search);
export const W = +(P.get('w') || 1080), H = +(P.get('h') || 1920);

// детерминированный случайный генератор: каждый кадр начинается с того же зерна
let seed = 11;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const reseed = (s = 11) => { seed = s; };

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = (k) => (k = clamp(k), k * k * (3 - 2 * k));
export const wave = (t, f = 1, ph = 0) => Math.sin(t * f * Math.PI * 2 + ph);

export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = k > 0 ? 255 : 0, a = Math.abs(k);
  r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

let defs = [], gid = 0;
const BASE_DEFS = `<filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter><filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter><filter id="blur20"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="soft"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.35"/></filter>
<radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>`;
export function def(s) { defs.push(s); }
// вертикальный градиент: светлее сверху
export function V(c, k = 0.18, d = 0.28) { const id = 'v' + gid++; defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, k)}"/><stop offset="1" stop-color="${shade(c, -d)}"/></linearGradient>`); return `url(#${id})`; }
export function R(c, k = 0.2, d = 0.3) { const id = 'r' + gid++; defs.push(`<radialGradient id="${id}" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="${shade(c, k)}"/><stop offset="0.6" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -d)}"/></radialGradient>`); return `url(#${id})`; }
export function grad(stops, vertical = true) { const id = 'l' + gid++; defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`); return `url(#${id})`; }
export function glow(cx, cy, r, c, op = 1) { const id = 'g' + gid++; defs.push(`<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${op}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`); return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`; }
// силуэт одним цветом (контровой свет)
export function silFilter(c) { const id = 's' + gid++; defs.push(`<filter id="${id}"><feFlood flood-color="${c}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`); return `url(#${id})`; }

// ---- горы, звёзды, огонь, дым ----
export const mtn = (pts, fill, op = 1) => `<path d="M${pts}" fill="${fill}" opacity="${op}"/>`;
export function stars(n, h, t = 0) { let s = ''; for (let i = 0; i < n; i++) { const tw = 0.6 + 0.4 * wave(t, 0.3 + rnd() * 0.5, rnd() * 6); s += `<circle cx="${rnd() * 1080}" cy="${rnd() * h}" r="${rnd() < 0.1 ? 2.6 : 1.3}" fill="#fff" opacity="${(0.3 + rnd() * 0.6) * tw}"/>`; } return s; }
export function moon(x, y, r = 62) { return glow(x, y, r * 5, '#c8d4ff', 0.5) + `<circle cx="${x}" cy="${y}" r="${r}" fill="#f2f0e6"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.25}" r="${r * 0.2}" fill="#dcd8cc"/><circle cx="${x + r * 0.35}" cy="${y + r * 0.3}" r="${r * 0.13}" fill="#dcd8cc"/>`; }
export function flame(x, y, s, t, ph = 0) {
  const f = (k) => 1 + 0.12 * wave(t, 2.3 + k, ph + k * 2) + 0.08 * wave(t, 5.1, ph + k);
  const tongue = (c, w, h, k) => `<path d="M${x - w * s},${y} Q${x - w * 0.9 * s},${y - h * 0.5 * s * f(k)} ${x + wave(t, 1.7, ph + k) * 12 * s},${y - h * s * f(k)} Q${x + w * 0.9 * s},${y - h * 0.5 * s * f(k + 1)} ${x + w * s},${y} Z" fill="${c}"/>`;
  return glow(x, y - 60 * s, 260 * s * f(0), '#ff8a30', 0.55) + tongue('#c2361a', 70, 230, 0) + tongue('#ff7a1a', 50, 170, 1) + tongue('#ffd060', 28, 100, 2);
}
export function smoke(x, y, s, t, n = 7, c = '#3a3230') {
  let o = '';
  for (let i = 0; i < n; i++) { const k = ((t * 0.18 + i / n) % 1); o += `<circle cx="${x + Math.sin(k * 4 + i) * 40 * s + k * 120 * s}" cy="${y - k * 700 * s}" r="${(50 + k * 150) * s}" fill="${c}" opacity="${0.55 * (1 - k)}"/>`; }
  return `<g filter="url(#blur8)">${o}</g>`;
}
export function dust(t, n = 30, c = '#fff1d0', y0 = 600, y1 = 1600) { let o = ''; for (let i = 0; i < n; i++) { const x = (rnd() * 1080 + t * (20 + rnd() * 30)) % 1080, y = y0 + rnd() * (y1 - y0) + wave(t, 0.2 + rnd() * 0.2, rnd() * 6) * 20; o += `<circle cx="${x}" cy="${y}" r="${1.5 + rnd() * 2.5}" fill="${c}" opacity="${0.15 + rnd() * 0.3}"/>`; } return o; }

// ---- персонаж: солдат / переводчик / женщина ----
// x,y — середина низа фигуры; s — масштаб (голова r=90*s)
// o: shirt, pants, vest, helmet, scarf, skin, hair, iris, frown, squint, closed, look (-1..1), beard (true),
//    arms: down|rifle|pull|raise|phone|hold|point, pose: stand|crouch|sit, veil, robe (длинная одежда), blink
export function person(x, y, s, o) {
  const hr = 90 * s, skin = o.skin || '#d9a07a', sh = o.shirt, pants = o.pants || shade(sh, -0.2);
  const hairC = o.hair || '#1e1814';
  let b = '';
  const pose = o.pose || 'stand';
  const legH = pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210;
  const ty = y - legH * s, top = ty - 210 * s;
  // ноги
  if (o.robe) {
    b += `<path d="M${x - 110 * s},${y} L${x - 96 * s},${ty} L${x + 96 * s},${ty} L${x + 110 * s},${y} Q${x},${y + 14 * s} ${x - 110 * s},${y} Z" fill="${V(o.robe, 0.15, 0.3)}"/>`;
  } else if (pose === 'crouch') {
    [-1, 1].forEach(side => b += `<path d="M${x + side * 40 * s},${ty} L${x + side * 95 * s},${y - 60 * s} L${x + side * 60 * s},${y}" stroke="${V(pants)}" stroke-width="${56 * s}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="${x + side * 70 * s}" cy="${y - 6 * s}" rx="${40 * s}" ry="${16 * s}" fill="#3a2a1c"/>`);
  } else if (pose === 'stand') {
    const st = o.step || 0;
    b += `<rect x="${x - 64 * s}" y="${ty - 10 * s + Math.max(0, st) * 14 * s}" width="${56 * s}" height="${legH * s}" rx="${20 * s}" fill="${V(pants)}"/><rect x="${x + 8 * s}" y="${ty - 10 * s + Math.max(0, -st) * 14 * s}" width="${56 * s}" height="${legH * s}" rx="${20 * s}" fill="${V(pants)}"/>`;
    b += `<ellipse cx="${x - 36 * s}" cy="${y - 8 * s - Math.max(0, st) * 0 * s}" rx="${42 * s}" ry="${18 * s}" fill="#3a2a1c"/><ellipse cx="${x + 36 * s}" cy="${y - 8 * s}" rx="${42 * s}" ry="${18 * s}" fill="#3a2a1c"/>`;
  }
  // торс
  b += `<path d="M${x - 98 * s},${ty} L${x - 108 * s},${top + 30 * s} Q${x},${top - 10 * s} ${x + 108 * s},${top + 30 * s} L${x + 98 * s},${ty} Z" fill="${V(o.robe || sh, 0.25, 0.2)}"/>`;
  if (o.vest) {
    b += `<path d="M${x - 92 * s},${ty + 10 * s} L${x - 98 * s},${top + 55 * s} L${x + 98 * s},${top + 55 * s} L${x + 92 * s},${ty + 10 * s} Z" fill="${V(o.vest, 0.15, 0.25)}"/>`;
    [-60, 0, 60].forEach(dx => b += `<rect x="${x + (dx - 24) * s}" y="${ty - 95 * s}" width="${48 * s}" height="${62 * s}" rx="${8 * s}" fill="${V(shade(o.vest, 0.08), 0.2, 0.2)}" stroke="${shade(o.vest, -0.3)}" stroke-width="${2 * s}"/>`);
    b += `<rect x="${x - 70 * s}" y="${top + 72 * s}" width="${40 * s}" height="${26 * s}" rx="${4 * s}" fill="#5c5a48"/>`;
  }
  // руки
  const sy = top + 40 * s;
  const hand = (hx, hy) => `<circle cx="${hx}" cy="${hy}" r="${27 * s}" fill="${R(skin)}"/>`;
  const sleeve = (sx, ex, ey, hx, hy) => `<path d="M${sx},${sy} Q${ex},${ey} ${hx},${hy}" stroke="${V(o.robe || sh, 0.25, 0.2)}" stroke-width="${60 * s}" fill="none" stroke-linecap="round"/>`;
  const arm = (side) => {
    const sx = x + side * 108 * s, mode = o.arms || 'down';
    let hx = x + side * 128 * s, hy = sy + 250 * s, ex = x + side * 125 * s, ey = sy + 120 * s;
    if (mode === 'pull') { hx = x + side * 150 * s; hy = sy + 210 * s; ex = x + side * 140 * s; ey = sy + 100 * s; }
    if (mode === 'rifle') { hx = side < 0 ? x - 60 * s : x + 30 * s; hy = side < 0 ? sy + 210 * s : sy + 150 * s; ex = x + side * 120 * s; ey = sy + 150 * s; }
    if (mode === 'hold') { hx = x + side * 40 * s; hy = sy + 170 * s; ex = x + side * 130 * s; ey = sy + 140 * s; }
    if ((mode === 'raise' || mode === 'point') && side === 1) { hx = x + 210 * s; hy = sy - (mode === 'raise' ? 230 : 40) * s; ex = x + 190 * s; ey = sy - (mode === 'raise' ? 60 : 10) * s; }
    if (mode === 'phone' && side === 1) { hx = x + 95 * s; hy = top - hr * 0.7; ex = x + 190 * s; ey = sy + 60 * s; }
    if (mode === 'table') { hx = x + side * 70 * s; hy = sy + 175 * s; ex = x + side * 150 * s; ey = sy + 130 * s; }
    let r = sleeve(sx, ex, ey, hx, hy) + hand(hx, hy);
    if (mode === 'phone' && side === 1) { phoneArm = r + `<rect x="${hx - 34 * s}" y="${hy - 70 * s}" width="${36 * s}" height="${84 * s}" rx="${8 * s}" fill="#151515"/>` + hand(hx, hy); return ''; }
    return r;
  };
  let phoneArm = '';
  b += arm(-1) + arm(1);
  if (o.arms === 'rifle') b += `<g transform="rotate(-28 ${x} ${top + 210 * s})"><rect x="${x - 190 * s}" y="${top + 195 * s}" width="${380 * s}" height="${28 * s}" rx="${8 * s}" fill="#1c1d1c"/><rect x="${x - 20 * s}" y="${top + 215 * s}" width="${28 * s}" height="${70 * s}" rx="4" fill="#1c1d1c"/><rect x="${x + 40 * s}" y="${top + 172 * s}" width="${70 * s}" height="${24 * s}" rx="5" fill="#2a2c2a"/></g>` + hand(x + 30 * s, top + 190 * s) + hand(x - 60 * s, top + 250 * s);
  if (o.baby) b += `<ellipse cx="${x}" cy="${sy + 140 * s}" rx="${95 * s}" ry="${55 * s}" fill="${V('#d8cdb8', 0.2, 0.2)}" transform="rotate(-15 ${x} ${sy + 140 * s})"/><circle cx="${x - 55 * s}" cy="${sy + 120 * s}" r="${34 * s}" fill="${R('#c99a74')}"/><path d="M${x - 66 * s},${sy + 118 * s} q5,4 10,0 M${x - 50 * s},${sy + 118 * s} q5,4 10,0" stroke="#5a3a28" stroke-width="${3 * s}" fill="none"/>` + hand(x - 40 * s, sy + 175 * s) + hand(x + 40 * s, sy + 160 * s);
  if (o.scarf) b += `<path d="M${x - 80 * s},${top + 10 * s} Q${x},${top + 70 * s} ${x + 80 * s},${top + 10 * s} Q${x + 60 * s},${top - 30 * s} ${x},${top - 20 * s} Q${x - 60 * s},${top - 30 * s} ${x - 80 * s},${top + 10 * s} Z" fill="${V(o.scarf, 0.2, 0.2)}"/>`;
  // голова
  const headY = top - hr * 0.8 + (o.nod || 0) * 6 * s;
  let hd = '';
  if (o.veil) hd += `<path d="M${x - hr * 1.25},${top + 60 * s} Q${x - hr * 1.35},${headY - hr * 1.4} ${x},${headY - hr * 1.3} Q${x + hr * 1.35},${headY - hr * 1.4} ${x + hr * 1.25},${top + 60 * s} Z" fill="${V(o.veil, 0.15, 0.25)}"/>`;
  else if (!o.helmet) hd += `<ellipse cx="${x}" cy="${headY - 18 * s}" rx="${hr * 1.02}" ry="${hr * 0.92}" fill="${hairC}"/>`;
  if (!o.veil) hd += `<ellipse cx="${x - hr}" cy="${headY + 10 * s}" rx="${16 * s}" ry="${24 * s}" fill="${shade(skin, -0.1)}"/><ellipse cx="${x + hr}" cy="${headY + 10 * s}" rx="${16 * s}" ry="${24 * s}" fill="${shade(skin, -0.1)}"/>`;
  hd += `<ellipse cx="${x}" cy="${headY}" rx="${hr * 0.95}" ry="${hr}" fill="${R(skin, 0.15, 0.18)}"/>`;
  if (!o.helmet && !o.veil) hd += `<path d="M${x - hr * 0.95},${headY - 5 * s} Q${x - hr * 0.6},${headY - hr * 1.15} ${x + hr * 0.3},${headY - hr * 0.95} Q${x + hr * 0.95},${headY - hr * 0.7} ${x + hr * 0.95},${headY - 5 * s} Q${x + hr * 0.5},${headY - hr * 0.5} ${x},${headY - hr * 0.55} Q${x - hr * 0.6},${headY - hr * 0.5} ${x - hr * 0.95},${headY - 5 * s} Z" fill="${hairC}"/>`;
  if (o.veil) hd += `<path d="M${x - hr * 0.98},${headY + 20 * s} Q${x - hr},${headY - hr * 1.05} ${x},${headY - hr * 1.02} Q${x + hr},${headY - hr * 1.05} ${x + hr * 0.98},${headY + 20 * s} Q${x + hr * 0.8},${headY - hr * 0.62} ${x},${headY - hr * 0.68} Q${x - hr * 0.8},${headY - hr * 0.62} ${x - hr * 0.98},${headY + 20 * s} Z" fill="${V(o.veil, 0.25, 0.1)}"/>`;
  if (o.beard !== false) hd += `<path d="M${x - hr * 0.88},${headY + 5 * s} Q${x - hr * 0.85},${headY + hr * 1.25} ${x},${headY + hr * 1.22} Q${x + hr * 0.85},${headY + hr * 1.25} ${x + hr * 0.88},${headY + 5 * s} Q${x + hr * 0.6},${headY + hr * 0.45} ${x},${headY + hr * 0.5} Q${x - hr * 0.6},${headY + hr * 0.45} ${x - hr * 0.88},${headY + 5 * s} Z" fill="${hairC}"/>`;
  const ey = headY + 2 * s, lk = o.look || 0;
  const closed = o.closed || o.blink;
  [-1, 1].forEach(side => {
    const ex = x + side * 34 * s + lk * 8 * s;
    if (closed) hd += `<path d="M${ex - 14 * s},${ey + 2 * s} Q${ex},${ey + 9 * s} ${ex + 14 * s},${ey + 2 * s}" stroke="${shade(skin, -0.45)}" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>`;
    else hd += `<ellipse cx="${ex}" cy="${ey}" rx="${17 * s}" ry="${(o.squint ? 12 : 17) * s}" fill="#fbfaf3"/><ellipse cx="${ex + lk * 5 * s}" cy="${ey + 2 * s + (o.lookUp || 0) * -5 * s}" rx="${11 * s}" ry="${(o.squint ? 9 : 12) * s}" fill="${o.iris || '#3a2414'}"/><circle cx="${ex + lk * 5 * s}" cy="${ey + 2 * s + (o.lookUp || 0) * -5 * s}" r="${6 * s}" fill="#120a06"/><circle cx="${ex + 4 * s + lk * 5 * s}" cy="${ey - 4 * s}" r="${3.5 * s}" fill="#fff"/>`;
    const fr = o.frown ?? 0.3;
    hd += `<path d="M${ex + side * 22 * s},${ey - 28 * s - fr * 15 * s} L${ex - side * 18 * s},${ey - 28 * s + fr * 15 * s}" stroke="${o.veil ? '#2a1a12' : hairC}" stroke-width="${(o.veil ? 5 : 8) * s}" stroke-linecap="round"/>`;
  });
  hd += `<ellipse cx="${x}" cy="${ey + 30 * s}" rx="${10 * s}" ry="${8 * s}" fill="${shade(skin, -0.15)}"/>`;
  if (o.beard !== false) hd += `<path d="M${x - 28 * s},${ey + 50 * s} Q${x},${ey + 40 * s} ${x + 28 * s},${ey + 50 * s}" stroke="${shade(hairC, 0.1)}" stroke-width="${11 * s}" fill="none" stroke-linecap="round"/>`;
  else hd += `<path d="M${x - 16 * s},${ey + 56 * s} Q${x},${ey + (o.worried ? 50 : 62) * s} ${x + 16 * s},${ey + 56 * s}" stroke="#8a3a30" stroke-width="${5 * s}" fill="none" stroke-linecap="round"/><ellipse cx="${x - 55 * s}" cy="${ey + 32 * s}" rx="${16 * s}" ry="${9 * s}" fill="#ff7c74" opacity="0.25"/><ellipse cx="${x + 55 * s}" cy="${ey + 32 * s}" rx="${16 * s}" ry="${9 * s}" fill="#ff7c74" opacity="0.25"/>`;
  if (o.helmet) {
    hd += `<path d="M${x - hr * 1.18},${headY - 8 * s} Q${x - hr * 1.2},${headY - hr * 1.35} ${x},${headY - hr * 1.38} Q${x + hr * 1.2},${headY - hr * 1.35} ${x + hr * 1.18},${headY - 8 * s} L${x + hr * 1.05},${headY + 10 * s} Q${x},${headY - hr * 0.6} ${x - hr * 1.05},${headY + 10 * s} Z" fill="${V(o.helmet, 0.25, 0.3)}"/>`;
    hd += `<rect x="${x - 22 * s}" y="${headY - hr * 1.15}" width="${44 * s}" height="${26 * s}" rx="${5 * s}" fill="#2a2a28"/>`;
    hd += `<path d="M${x - hr * 0.95},${headY + 15 * s} L${x - hr * 0.7},${headY + hr * 0.9}" stroke="#2a2a28" stroke-width="${6 * s}"/><path d="M${x + hr * 0.95},${headY + 15 * s} L${x + hr * 0.7},${headY + hr * 0.9}" stroke="#2a2a28" stroke-width="${6 * s}"/>`;
  }
  if (o.bandage) hd += `<path d="M${x - hr * 0.95},${headY - hr * 0.35} Q${x},${headY - hr * 0.75} ${x + hr * 0.95},${headY - hr * 0.35}" stroke="#f0ece2" stroke-width="${22 * s}" fill="none"/><circle cx="${x + hr * 0.3}" cy="${headY - hr * 0.55}" r="${8 * s}" fill="#a3302a" opacity="0.8"/>`;
  hd += phoneArm;
  const tr = [];
  if (o.lean) tr.push(`rotate(${o.lean} ${x} ${y})`);
  if (o.rot) tr.push(`rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})`);
  const filt = o.sil ? `filter="${o.sil}"` : 'filter="url(#soft)"';
  return `<g ${filt}${tr.length ? ` transform="${tr.join(' ')}"` : ''}>${b}${hd}</g>`;
}

// ---- запуск сцены ----
export function run(shots) {
  const name = P.get('shot');
  const T = +(P.get('dur') || 6);
  const shot = shots[name];
  const root = document.getElementById('root');
  window.TOTAL = T;
  window.renderAt = (t) => {
    defs = []; gid = 0; reseed(11);
    if (!shot) { root.innerHTML = `<svg width="${W}" height="${H}"><rect width="100%" height="100%" fill="#300"/><text x="40" y="200" fill="#fff" font-size="60">нет сцены «${name}»</text></svg>`; return; }
    const { els, cam = {} } = shot(t, T);
    const z = cam.z ?? 1, cx = cam.x ?? 0, cy = cam.y ?? 0;
    const body = `<g transform="translate(${540 + cx} ${960 + cy}) scale(${z}) translate(-540 -960)">${els.join('\n')}</g>`;
    root.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1080 1920"><defs>${BASE_DEFS}${defs.join('')}</defs>${body}<rect width="1080" height="1920" fill="url(#vig)"/></svg>`;
  };
  window.renderAt(+(P.get('t') || 0));
  window.__done = true;
}
