// «Битва за битвой» (One Battle After Another, 2025) — 7 сцен в 2D-векторе. Имя плана = set сцены в videos/one-battle-after-another/script.json.
// Калифорния наших дней: деревянный домик в глуши, тёплый закат и ночь с неоном, синие мигалки, пустынная дорога-«горки» через холмы.
import { run, person, setProportions, V, R, grad, glow, silFilter, rnd, reseed, shade, lerp, ease, clamp, wave, def } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// Боб: растрёпанные волосы до плеч, борода и усы, красный клетчатый халат-куртка поверх серой футболки, джинсы
const BOB = { shirt: '#a8443a', pants: '#3e4a62', skin: '#d39a74', hair: '#6a4a30', iris: '#4a6a7a', frown: 0.4, plaid: true, messy: true };
// молодой Боб (пролог): усы без бороды, тёмная куртка, шапка-бини
const YOUNG = { shirt: '#2e3038', pants: '#2a2a30', skin: '#d8a27c', hair: '#5a3a24', iris: '#4a6a7a', beard: false, moustache: true, cap: '#3a3a3c', frown: 0.2 };
// полковник Локджо: седой ёжик, камуфляжная кепка, камуфляж, бронежилет
const LOCK = { worried: true, shirt: '#6e6c50', pants: '#5a5a42', skin: '#d8a088', hair: '#c8c4bc', iris: '#6a8a9a', beard: false, frown: 0.75, squint: true, camoCap: true, plate: true, boots: true };

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const D = 4 / 30; // AUDIO_DELAY
const camG = (cam, els, op = 1) => `<g opacity="${op}" transform="translate(${540 + (cam.x || 0)} ${960 + (cam.y || 0)}) scale(${cam.z || 1}) translate(-540 -960)">${els.join('\n')}</g>`;

// ---------- персонажи ----------
function geo(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const pose = o.pose || 'stand';
  const legH = (pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  return { hs, hr, top, ty, legH, headY: top - hr * 0.8 + (o.nod || 0) * 6 * hs, sl: p.slim ?? 1, pose };
}
function plaidFill(s) {
  const z = Math.max(18, Math.round(46 * s)), id = 'pl' + z;
  def(`<pattern id="${id}" width="${z}" height="${z}" patternUnits="userSpaceOnUse"><rect width="${z}" height="${z}" fill="#a8443a"/><rect y="${z * 0.1}" width="${z}" height="${z * 0.32}" fill="#3a4a34" opacity="0.55"/><rect x="${z * 0.1}" width="${z * 0.32}" height="${z}" fill="#3a4a34" opacity="0.45"/><rect y="${z * 0.66}" width="${z}" height="${z * 0.06}" fill="#e8b0a0" opacity="0.4"/><rect x="${z * 0.66}" width="${z * 0.06}" height="${z}" fill="#e8b0a0" opacity="0.35"/><rect y="${z * 0.85}" width="${z}" height="${z * 0.04}" fill="#1a1a14" opacity="0.4"/></pattern>`);
  return `url(#${id})`;
}
function dress(x, y, s, o) {
  const { hr, top, ty, legH, headY, pose, hs } = geo(x, y, s, o);
  let b = '', front = '';
  if (o.plaid) {
    // серая футболка в вырезе, полы халата до середины бедра (развеваются), карман, отвороты, пояс висит
    const pf = plaidFill(s), fl = o.flap || 0, hem = ty + legH * s * (pose === 'sit' ? 0 : 0.5);
    b += `<rect x="${x - 98 * s}" y="${top + 10 * s}" width="${196 * s}" height="${ty - top}" fill="${pf}"/>`;
    b += `<path d="M${x - 34 * s},${top - 2 * s} L${x + 34 * s},${top - 2 * s} L${x + 40 * s},${ty + 4 * s} L${x - 40 * s},${ty + 4 * s} Z" fill="${V('#7e7a6e', 0.15, 0.25)}"/>`;
    b += `<path d="M${x - 28 * s},${top} Q${x},${top + 26 * s} ${x + 28 * s},${top}" stroke="#5a564a" stroke-width="${5 * s}" fill="none"/>`;
    if (pose !== 'sit') [-1, 1].forEach((sd) => {
      const dx = sd * fl * 40 * s;
      b += `<path d="M${x + sd * 40 * s},${ty - 4 * s} L${x + sd * 102 * s},${ty - 4 * s} L${x + sd * 110 * s + dx},${hem + Math.abs(fl) * 10 * s} L${x + sd * 36 * s + dx * 0.6},${hem} Z" fill="${pf}"/><path d="M${x + sd * 40 * s},${ty - 4 * s} L${x + sd * 36 * s + dx * 0.6},${hem} L${x + sd * 110 * s + dx},${hem + Math.abs(fl) * 10 * s}" stroke="#000" stroke-width="${3 * s}" fill="none" opacity="0.25"/>`;
    });
    [-1, 1].forEach((sd) => { b += `<path d="M${x + sd * 34 * s},${top - 2 * s} L${x + sd * 70 * s},${top + 4 * s} L${x + sd * 52 * s},${top + 130 * s} L${x + sd * 40 * s},${ty} Z" fill="${pf}" stroke="#4a1a14" stroke-width="${3 * s}" opacity="0.95"/>`; });
    b += `<path d="M${x + 50 * s},${top + 150 * s} l${40 * s},0 l0,${40 * s} l${-40 * s},0 Z" fill="none" stroke="#3a1410" stroke-width="${3 * s}" opacity="0.6"/>`;
    b += `<rect x="${x - 98 * s}" y="${top + 10 * s}" width="${196 * s}" height="${ty - top}" fill="${grad([[0, '#fff', 0.12], [0.5, '#000', 0], [1, '#000', 0.3]], false)}"/>`;
  }
  if (o.plate) {
    // бронежилет с подсумками, лямки, нашивка-флаг
    b += `<path d="M${x - 86 * s},${top + 40 * s} L${x - 70 * s},${top - 4 * s} L${x - 30 * s},${top - 4 * s} L${x - 24 * s},${top + 40 * s} L${x + 24 * s},${top + 40 * s} L${x + 30 * s},${top - 4 * s} L${x + 70 * s},${top - 4 * s} L${x + 86 * s},${top + 40 * s} L${x + 90 * s},${ty - 20 * s} L${x - 90 * s},${ty - 20 * s} Z" fill="${V('#4e4d3a', 0.15, 0.3)}"/>`;
    [-56, 0, 56].forEach((dx) => { b += `<rect x="${x + (dx - 24) * s}" y="${ty - 110 * s}" width="${48 * s}" height="${70 * s}" rx="${6 * s}" fill="${V('#5a5944', 0.2, 0.25)}" stroke="#2e2d22" stroke-width="${2 * s}"/><rect x="${x + (dx - 24) * s}" y="${ty - 110 * s}" width="${48 * s}" height="${16 * s}" rx="${4 * s}" fill="#3e3d2e"/>`; });
    b += `<rect x="${x - 44 * s}" y="${top + 60 * s}" width="${88 * s}" height="${34 * s}" rx="${4 * s}" fill="#2a2a24"/>`;
    b += `<rect x="${x - 120 * s}" y="${top + 60 * s}" width="${30 * s}" height="${20 * s}" fill="#5a6070" opacity="0.8"/>`;
  }
  if (o.camoShirt !== false && o.plate) { reseed(5); for (let i = 0; i < 10; i++) b += `<ellipse cx="${x + (rnd() * 2 - 1) * 100 * s}" cy="${top + rnd() * 50 * s}" rx="${(10 + rnd() * 12) * s}" ry="${(6 + rnd() * 6) * s}" fill="${rnd() < 0.5 ? '#8a8668' : '#4a4a34'}" opacity="0.7"/>`; }
  if (o.boots && pose === 'stand') b += [-1, 1].map((sd) => `<path d="M${x + sd * 36 * s - 32 * s},${y - 110 * s} L${x + sd * 36 * s + 32 * s},${y - 110 * s} L${x + sd * 36 * s + 36 * s},${y - 4 * s} L${x + sd * 36 * s - 36 * s},${y - 4 * s} Z" fill="${V('#5a4a36', 0.2, 0.3)}"/>`).join('');
  if (o.messy) {
    // пряди на лбу
    front += `<path d="M${x - hr * 0.9},${headY - hr * 0.35} Q${x - hr * 0.5},${headY - hr * 1.2} ${x + hr * 0.2},${headY - hr * 1.05} Q${x + hr * 0.95},${headY - hr * 0.95} ${x + hr * 0.98},${headY - hr * 0.25} Q${x + hr * 0.6},${headY - hr * 0.62} ${x + hr * 0.25},${headY - hr * 0.55} Q${x + hr * 0.05},${headY - hr * 0.3} ${x - hr * 0.12},${headY - hr * 0.5} Q${x - hr * 0.5},${headY - hr * 0.55} ${x - hr * 0.9},${headY - hr * 0.35} Z" fill="${V(o.hair, 0.25, 0.2)}"/>`;
    front += `<path d="M${x - hr * 0.1},${headY - hr * 0.55} Q${x - hr * 0.3},${headY - hr * 0.2} ${x - hr * 0.42},${headY - hr * 0.18}" stroke="${o.hair}" stroke-width="${hr * 0.07}" fill="none" stroke-linecap="round"/>`;
    front += [-0.6, -0.2, 0.3, 0.7].map((k) => `<path d="M${x + hr * k},${headY - hr * 0.95} q${hr * 0.08},${hr * 0.2} ${hr * 0.02},${hr * 0.4}" stroke="#fff" stroke-width="${hr * 0.025}" fill="none" opacity="0.15"/>`).join('');
  }
  if (o.plaid && (o.arms === 'down' || o.arms === 'pull' || !o.arms)) {
    const pf = plaidFill(s), sy = top + 40 * s, sl = geo(x, y, s, o).sl;
    let sv = '';
    [-1, 1].forEach((side) => {
      const sx = x + side * 108 * s;
      let hx = x + side * 128 * s, hy = sy + 250 * s, ex = x + side * 125 * s, ey = sy + 120 * s;
      if (o.arms === 'pull') { hx = x + side * 150 * s; hy = sy + 210 * s; ex = x + side * 140 * s; ey = sy + 100 * s; }
      if (o.swing) { hy += side * o.swing * 40 * s; hx += side * o.swing * 10 * s; }
      sv += `<path d="M${sx},${sy} Q${ex},${ey} ${hx},${hy}" stroke="#4a1a14" stroke-width="${64 * s}" fill="none" stroke-linecap="round"/><path d="M${sx},${sy} Q${ex},${ey} ${hx},${hy}" stroke="${pf}" stroke-width="${58 * s}" fill="none" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="${27 * s * 0.72}" fill="${R(o.skin)}"/>`;
    });
    front = `<g transform="translate(${x} 0) scale(${sl} 1) translate(${-x} 0)">${sv}</g>` + front;
  }
  if (o.camoCap) {
    reseed(9);
    let sp = ''; for (let i = 0; i < 9; i++) sp += `<ellipse cx="${x + (rnd() * 1.6 - 0.8) * hr}" cy="${headY - hr * (0.65 + rnd() * 0.4)}" rx="${hr * (0.1 + rnd() * 0.1)}" ry="${hr * 0.06}" fill="${rnd() < 0.5 ? '#9a987a' : '#4a4a36'}" opacity="0.75"/>`;
    front += `<path d="M${x - hr * 0.98},${headY - hr * 0.42} L${x - hr * 0.9},${headY - hr * 1.2} L${x + hr * 0.9},${headY - hr * 1.2} L${x + hr * 0.98},${headY - hr * 0.42} Z" fill="${V('#7a7858', 0.15, 0.25)}"/>${sp}`;
    front += `<path d="M${x - hr * 1.0},${headY - hr * 0.42} Q${x},${headY - hr * 0.62} ${x + hr * 1.0},${headY - hr * 0.42} Q${x + hr * 0.6},${headY - hr * 0.12} ${x},${headY - hr * 0.16} Q${x - hr * 0.6},${headY - hr * 0.12} ${x - hr * 1.0},${headY - hr * 0.42} Z" fill="${V('#6a6848', 0.1, 0.35)}"/>`;
    // жёсткая челюсть и морщины
    front += `<path d="M${x - hr * 0.7},${headY + hr * 0.55} Q${x},${headY + hr * 1.1} ${x + hr * 0.7},${headY + hr * 0.55}" stroke="${shade(o.skin, -0.25)}" stroke-width="${hr * 0.04}" fill="none" opacity="0.6"/><path d="M${x - hr * 0.62},${headY + hr * 0.1} q${hr * 0.1},${hr * 0.25} ${hr * 0.05},${hr * 0.45} M${x + hr * 0.62},${headY + hr * 0.1} q${-hr * 0.1},${hr * 0.25} ${-hr * 0.05},${hr * 0.45}" stroke="${shade(o.skin, -0.2)}" stroke-width="${hr * 0.018}" fill="none" opacity="0.5"/>`;
  }
  return { b, front };
}
function man(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b, longHair: !!o.messy, cap: o.camoCap ? undefined : o.cap });
  if (!front) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}${o.sil ? ` filter="${o.sil}"` : ''}>${front}</g>`;
}

// ---------- окружение ----------
function clouds(y, h, c1, c2, t = 0, n = 10, sd = 31) {
  reseed(sd);
  def('<filter id="cl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>');
  let g = '';
  for (let i = 0; i < n; i++) {
    const cx = ((rnd() * 1500 + t * (5 + rnd() * 6)) % 1500) - 210, cy = y + rnd() * h, rx = 200 + rnd() * 260, ry = 26 + rnd() * 40;
    g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c2}" opacity="0.5"/><ellipse cx="${cx - 30}" cy="${cy - ry * 0.5}" rx="${rx * 0.7}" ry="${ry * 0.5}" fill="${c1}" opacity="0.55"/>`;
  }
  return `<g filter="url(#cl)">${g}</g>`;
}
function hills(y, c, amp, sd, op = 1) {
  reseed(sd);
  let p = `M-40,${y}`;
  for (let x = -40; x <= 1120; x += 120) p += ` Q${x + 60},${y - amp * (0.4 + rnd() * 0.8)} ${x + 120},${y - amp * rnd() * 0.3}`;
  return `<path d="${p} L1120,1920 L-40,1920 Z" fill="${V(c, 0.12, 0.3)}" opacity="${op}"/>`;
}
function poles(pts, c = '#2a2018') {
  let g = '';
  pts.forEach(([x, y, h]) => { g += `<rect x="${x - h * 0.02}" y="${y - h}" width="${h * 0.04}" height="${h}" fill="${c}"/><rect x="${x - h * 0.16}" y="${y - h * 0.92}" width="${h * 0.32}" height="${h * 0.025}" fill="${c}"/>`; });
  for (const dx of [-0.13, 0.13]) { let d = ''; pts.forEach(([x, y, h], i) => { const px = x + dx * h, py = y - h * 0.92; if (!i) d += `M${px},${py}`; else { const [x0, y0, h0] = pts[i - 1]; d += ` Q${(x0 + dx * h0 + px) / 2},${(y0 - h0 * 0.92 + py) / 2 + 20} ${px},${py}`; } }); g += `<path d="${d}" stroke="${c}" stroke-width="1.5" fill="none"/>`; }
  return g;
}
function palm(x, y, h, t, ph = 0, c = '#1a1a1e') {
  const sw = wave(t, 0.25, ph) * 6;
  let g = `<path d="M${x},${y} Q${x + 14},${y - h * 0.5} ${x + 8 + sw},${y - h}" stroke="${c}" stroke-width="${h * 0.03}" fill="none"/>`;
  for (let i = 0; i < 11; i++) { const a = -Math.PI + (i * Math.PI) / 10, l = h * 0.22; const cx = x + 8 + sw, cy = y - h; g += `<path d="M${cx},${cy} Q${cx + Math.cos(a) * l * 0.6},${cy - l * 0.3} ${cx + Math.cos(a) * l},${cy + Math.sin(a) * l * 0.35 + l * 0.35}" stroke="${c}" stroke-width="${h * 0.018}" fill="none" stroke-linecap="round"/>`; }
  return g;
}
function stones(y0, y1, n, sd = 8, c = '#8a6a4a') { reseed(sd); let g = ''; for (let i = 0; i < n; i++) { const y = y0 + rnd() * (y1 - y0), k = 0.3 + ((y - y0) / (y1 - y0)) * 1.4; g += `<ellipse cx="${rnd() * 1080}" cy="${y}" rx="${(6 + rnd() * 14) * k}" ry="${(3 + rnd() * 6) * k}" fill="${shade(c, rnd() * 0.2 - 0.1)}"/>`; } return g; }
function brush(y0, y1, n, sd = 4, c = '#6a6a3a') { reseed(sd); let g = ''; for (let i = 0; i < n; i++) { const y = y0 + rnd() * (y1 - y0), k = 0.3 + ((y - y0) / (y1 - y0)) * 1.2, x = rnd() * 1080; for (let j = 0; j < 4; j++) g += `<ellipse cx="${x + (j - 1.5) * 14 * k}" cy="${y - (j % 2) * 10 * k}" rx="${22 * k}" ry="${13 * k}" fill="${shade(c, j * 0.05 - 0.1)}"/>`; } return g; }
function bird(x, y, s, t, ph = 0) { const f = wave(t, 1.6, ph) * 10; return `<path d="M${x - 30 * s},${y + f * s} Q${x - 12 * s},${y - 10 * s} ${x},${y} Q${x + 12 * s},${y - 10 * s} ${x + 30 * s},${y + f * s}" stroke="#1a1410" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>`; }

// военный грузовик сбоку: кабина, кузов под тентом, колёса, солдаты-силуэты
function truck(x, y, s, t = 0) {
  const c = '#4e5236', dk = shade(c, -0.35), hb = Math.abs(wave(t, 2.2)) * 2;
  let g = `<g transform="translate(${x} ${y - hb}) scale(${-s} ${s})" filter="url(#soft)">`;
  g += `<ellipse cx="0" cy="${8 + hb}" rx="320" ry="22" fill="#000" opacity="0.3"/>`;
  g += `<path d="M-300,-60 L-300,-250 Q-300,-272 -280,-272 L90,-272 Q110,-272 110,-250 L110,-60 Z" fill="${V('#6a6a48', 0.15, 0.3)}"/>`;
  for (let i = 0; i < 5; i++) g += `<path d="M${-260 + i * 80},-272 L${-260 + i * 80},-70" stroke="${dk}" stroke-width="4" opacity="0.5"/>`;
  g += `<rect x="-300" y="-80" width="410" height="26" fill="${dk}"/>`;
  g += `<path d="M120,-60 L120,-220 L230,-220 L270,-140 L310,-130 L310,-60 Z" fill="${V(c, 0.2, 0.3)}"/><path d="M134,-208 L222,-208 L250,-150 L134,-150 Z" fill="${grad([[0, '#f0c890'], [1, '#6a5a48']])}"/>`;
  g += `<rect x="300" y="-120" width="20" height="40" fill="#2a2a1e"/><circle cx="312" cy="-100" r="10" fill="#ffe8a8"/>`;
  [-210, -60, 220].forEach((wx) => { g += `<circle cx="${wx}" cy="-30" r="52" fill="#141412"/><circle cx="${wx}" cy="-30" r="24" fill="#4a4a3a"/><circle cx="${wx}" cy="-30" r="7" fill="#7a7a6a"/>`; });
  g += `<rect x="150" y="-250" width="8" height="34" fill="#2a2a1e"/>`;
  g += `</g>`;
  return g;
}
// патрульная машина спереди-издали с мигалками
function cruiser(x, y, s, t) {
  const on = Math.floor(t * 6) % 2;
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-120" y="-90" width="240" height="70" rx="14" fill="#1a1c22"/><path d="M-80,-90 L-56,-140 L56,-140 L80,-90 Z" fill="#2a2e38"/><path d="M-64,-96 L-48,-130 L48,-130 L64,-96 Z" fill="#5a6a80" opacity="0.6"/><rect x="-60" y="-152" width="120" height="16" rx="5" fill="#222"/><rect x="-58" y="-150" width="56" height="12" rx="4" fill="${on ? '#ff3030' : '#6a1a1a'}"/><rect x="2" y="-150" width="56" height="12" rx="4" fill="${on ? '#2a3a8a' : '#3a7aff'}"/><circle cx="-90" cy="-56" r="15" fill="#fff6d8"/><circle cx="90" cy="-56" r="15" fill="#fff6d8"/><rect x="-110" y="-20" width="40" height="24" rx="6" fill="#0c0c0e"/><rect x="70" y="-20" width="40" height="24" rx="6" fill="#0c0c0e"/></g>${glow(x - 30 * s, y - 144 * s, 260 * s, '#ff3030', on ? 0.6 : 0.15)}${glow(x + 30 * s, y - 144 * s, 260 * s, '#3a7aff', on ? 0.15 : 0.6)}${glow(x - 90 * s, y - 56 * s, 90 * s, '#fff6d8', 0.6)}${glow(x + 90 * s, y - 56 * s, 90 * s, '#fff6d8', 0.6)}`;
}
// машина сзади на дороге (уезжает/едет к камере), со шлейфом пыли
function car(x, y, s, c, t, ph) {
  const dust = [...Array(5)].map((_, i) => `<circle cx="${x + Math.sin(t * 3 + i + ph) * 20 * s}" cy="${y - (40 + i * 40) * s}" r="${(30 + i * 18) * s}" fill="#e8d0a8" opacity="${0.35 - i * 0.06}"/>`).join('');
  return `<g filter="url(#blur4)">${dust}</g><g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="6" rx="110" ry="14" fill="#000" opacity="0.3"/><rect x="-100" y="-60" width="200" height="56" rx="12" fill="${V(c, 0.25, 0.3)}"/><path d="M-66,-60 L-48,-104 L48,-104 L66,-60 Z" fill="${shade(c, -0.1)}"/><path d="M-54,-64 L-40,-96 L40,-96 L54,-64 Z" fill="#9ab0c0" opacity="0.8"/><circle cx="-78" cy="-34" r="11" fill="#fff6d8"/><circle cx="78" cy="-34" r="11" fill="#fff6d8"/><rect x="-96" y="-8" width="34" height="18" rx="5" fill="#141414"/><rect x="62" y="-8" width="34" height="18" rx="5" fill="#141414"/></g>`;
}
// неоновая вывеска
function neon(x, y, txt, c, size, t, ph = 0, flick = false) {
  const on = !flick || ((t * 7 + ph) % 5) > 0.4;
  return `${glow(x, y - size * 0.35, size * txt.length * 0.55, c, on ? 0.35 : 0.08)}<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="${size}" fill="none" stroke="${c}" stroke-width="${size * 0.09}" opacity="${on ? 1 : 0.3}">${txt}</text><text x="${x}" y="${y}" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="${size}" fill="none" stroke="#fff" stroke-width="${size * 0.025}" opacity="${on ? 0.9 : 0.2}">${txt}</text>`;
}
// золотая статуэтка-награда (стилизованная)
function statuette(x, y, h, rot = 0) {
  const k = h / 300;
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})" filter="url(#stk)"><rect x="-46" y="-40" width="92" height="40" rx="6" fill="${V('#2a2620', 0.25, 0.3)}"/><rect x="-36" y="-72" width="72" height="34" rx="6" fill="${V('#d8b04a', 0.45, 0.35)}"/><path d="M-18,-72 L-16,-150 Q-24,-200 -22,-210 L22,-210 Q24,-200 16,-150 L18,-72 Z" fill="${V('#e0bc58', 0.45, 0.4)}"/><path d="M-22,-206 Q-30,-238 -14,-252 L14,-252 Q30,-238 22,-206 Z" fill="${V('#e8c460', 0.4, 0.35)}"/><path d="M-26,-224 Q0,-200 26,-224" stroke="#9a7420" stroke-width="5" fill="none"/><circle cx="0" cy="-270" r="20" fill="${R('#ecc864', 0.4, 0.35)}"/><ellipse cx="-8" cy="-240" rx="5" ry="20" fill="#fff" opacity="0.35"/></g>`;
}

// ---- комната Боба: деревянные панели, окно с жалюзи, лампа, полка с кассетами, телевизор ----
function room(t, o = {}) {
  let g = `<rect width="1080" height="1920" fill="${V('#4a3022', 0.08, 0.4)}"/>`;
  for (let i = 0; i < 14; i++) g += `<rect x="${i * 80}" y="0" width="3" height="1920" fill="#2a1a10" opacity="0.5"/>`;
  g += `<rect x="0" y="1480" width="1080" height="440" fill="${V('#3a2a1e', 0.05, 0.4)}"/><rect x="0" y="1470" width="1080" height="16" fill="#2a1a10"/>`;
  // окно с жалюзи и свет фар, ползущий по ламелям
  const wx = o.winX ?? 80, wy = 420, ww = 380, wh = 560;
  def(`<clipPath id="win"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></clipPath>`);
  g += `<rect x="${wx - 20}" y="${wy - 20}" width="${ww + 40}" height="${wh + 40}" fill="#2a1a10"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="#0c1424"/>`;
  const sweep = o.sweep ?? -1;
  if (sweep >= 0) g += `<g clip-path="url(#win)">${glow(lerp(wx - 200, wx + ww + 200, sweep), wy + wh * 0.6, 340, '#fff2c8', 0.95)}</g>`;
  for (let i = 0; i < 22; i++) g += `<rect x="${wx}" y="${wy + i * (wh / 22)}" width="${ww}" height="${wh / 22 - 8}" fill="${V('#c8b89a', 0.15, 0.3)}" opacity="0.92"/>`;
  if (sweep >= 0) {
    // полосы света от фар на стене
    const sx = lerp(-300, 1300, sweep);
    for (let i = 0; i < 9; i++) g += `<path d="M${sx + i * 26},${300 + i * 70} L${sx + 260 + i * 26},${300 + i * 70} L${sx + 300 + i * 26},${330 + i * 70} L${sx + 40 + i * 26},${330 + i * 70} Z" fill="#fff2c8" opacity="${0.22 * (1 - Math.abs(sweep - 0.5) * 1.2)}"/>`;
  }
  // полка с VHS-кассетами (пасхалка kinoplot.film на одном корешке)
  if (o.shelf) {
    const sx = o.shelf, sy = 520;
    g += `<rect x="${sx}" y="${sy}" width="380" height="14" fill="#2a1a10"/><rect x="${sx}" y="${sy + 200}" width="380" height="14" fill="#2a1a10"/>`;
    const cols = ['#1a1a1a', '#2a2a3a', '#1e2a22', '#3a1e1a', '#1a1a1a', '#2a2620', '#1a1e2a', '#2a1a1a', '#1a1a1a', '#222'];
    cols.forEach((c, i) => { g += `<rect x="${sx + 10 + i * 36}" y="${sy - 130}" width="32" height="130" rx="2" fill="${c}"/><rect x="${sx + 14 + i * 36}" y="${sy - 110}" width="24" height="70" fill="${['#d8d0b8', '#c84a3a', '#e8c870', '#8ab0c8'][i % 4]}" opacity="0.55"/>`; });
    g += `<text transform="translate(${sx + 10 + 3 * 36 + 21} ${sy - 12}) rotate(-90)" font-family="Arial" font-weight="700" font-size="15" fill="#e8dcc0" opacity="0.8">kinoplot.film</text>`;
    for (let i = 0; i < 7; i++) g += `<rect x="${sx + 20 + i * 50}" y="${sy + 200 - 40 - (i % 3) * 20}" width="40" height="${40 + (i % 3) * 20}" rx="3" fill="${['#6a4a2a', '#3a5a4a', '#8a6a3a'][i % 3]}"/>`;
  }
  // торшер
  if (o.lamp) { const lx = o.lamp; g += glow(lx, 600, 420, '#ffb860', 0.45) + `<rect x="${lx - 4}" y="620" width="8" height="860" fill="#1a120a"/><path d="M${lx - 80},620 L${lx + 80},620 L${lx + 50},500 L${lx - 50},500 Z" fill="${V('#e8a860', 0.3, 0.3)}"/><ellipse cx="${lx}" cy="1478" rx="70" ry="12" fill="#1a120a"/>`; }
  return g;
}
// тень дочери на стене: кудрявая голова и плечи
function daughterShadow(x, y, s, op) {
  let cur = '';
  reseed(23);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; cur += `<circle cx="${x + Math.cos(a) * 80 * s}" cy="${y - 20 * s + Math.sin(a) * 90 * s}" r="${(30 + rnd() * 16) * s}"/>`; }
  return `<g fill="#120a06" opacity="${op}" filter="url(#blur8)">${cur}<ellipse cx="${x}" cy="${y}" rx="${80 * s}" ry="${96 * s}"/><path d="M${x - 60 * s},${y + 90 * s} L${x - 220 * s},${y + 200 * s} L${x - 240 * s},${y + 600 * s} L${x + 240 * s},${y + 600 * s} L${x + 220 * s},${y + 200 * s} L${x + 60 * s},${y + 90 * s} Z"/></g>`;
}

// ---- фото-стикеры ----
const STICKER_SRC = { dicaprio: 'dicaprio-cut.png', penn: 'penn-cut.png' };
const IMG = {};
await Promise.all(Object.entries(STICKER_SRC).map(async ([k, f]) => {
  try {
    const b = await (await fetch(`/public/assets/one-battle-after-another/${f}`)).blob();
    IMG[k] = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  } catch { IMG[k] = ''; }
}));
const STICKER_FILTER = `<filter id="stk" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="10" result="dil"/><feFlood flood-color="#ffffff"/><feComposite in2="dil" operator="in" result="outline"/><feGaussianBlur in="dil" stdDeviation="12" result="blur"/><feOffset in="blur" dx="8" dy="16" result="sh"/><feFlood flood-color="#000" flood-opacity="0.55"/><feComposite in2="sh" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const popScale = (f) => (f < 6 ? lerp(0.2, 1.12, f / 6) : f < 10 ? lerp(1.12, 0.96, (f - 6) / 4) : f < 14 ? lerp(0.96, 1, (f - 10) / 4) : 1);
const STICKERS = [
  { k: 'dicaprio', x: 300, y: 1060, w: 440, h: 622, at: D + 0.0, tilt: -5 },
  { k: 'penn', x: 760, y: 1250, w: 500, h: 498, at: D + 2.73, tilt: 4 },
];
function sticker(s, t, i) {
  const dt = t - s.at;
  if (dt < 0 || !IMG[s.k]) return '';
  const f = dt * 30;
  const wob = wave(t, 0.35, i * 2) * 2.4, bob = wave(t, 0.25, i * 1.3) * 7;
  return `<g transform="translate(${s.x} ${s.y + bob}) rotate(${s.tilt + wob}) scale(${popScale(f)})" opacity="${clamp(f / 3)}"><image href="${IMG[s.k]}" x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid meet" filter="url(#stk)"/></g>`;
}
const popIn = (x, y, at, t, body) => { const dt = t - at; if (dt < 0) return ''; const f = dt * 30; return `<g transform="translate(${x} ${y}) scale(${popScale(f)}) translate(${-x} ${-y})" opacity="${clamp(f / 3)}">${body}</g>`; };

const DUSK = [[0, '#2a2a5a'], [0.45, '#b85a4a'], [0.8, '#f0a050'], [1, '#f8d890']];
const DAWN = [[0, '#3a4a7a'], [0.5, '#c88a8a'], [0.82, '#f6c08a'], [1, '#fbe2b0']];

const shots = {
  // 1. Хук: крупно Боб в халате у окна, по жалюзи ползёт свет фар; на «дочерью» на стене тень дочери
  hook(t, T) {
    const k = ease(t / T), sw = clamp((t - 0.2) / 3.6), dau = ease(clamp((t - (D + 4.2)) / 0.5));
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k) },
      els: [
        room(t, { sweep: sw, lamp: 980 }),
        daughterShadow(900, 880, 1.0, 0.55 * dau),
        glow(560, 1100, 640, '#ffcf90', 0.18),
        man(560, 2780, 3.0, { ...BOB, arms: 'down', look: lerp(-1, 0.4, ease(clamp((t - D - 4.1) / 0.3))), frown: 0.7, worried: true, blink: blink(t, 1.1), nod: wave(t, 0.4) * 0.6 }),
        glow(lerp(-200, 1300, sw), 1000, 260, '#fff2c8', 0.18),
        grade('#ffb070', 0.2),
        topShade(820, 0.5),
      ],
    };
  },

  // 2. Пролог: ночь, молодой Боб у ящика динамита, на горизонте вспышка → растворение → тот же Боб постаревший на диване, звонит телефон
  past(t, T) {
    const cut = D + 2.1, mix = ease(clamp((t - cut) / 0.5));
    const kA = ease(clamp(t / (cut + 0.5))), boom = ease(clamp((t - D - 0.5) / 0.6));
    const A = [
      sky([[0, '#05060e'], [0.7, '#141a2e'], [1, '#2a2030']], 1300),
      glow(760, 1150, lerp(60, 620, boom), '#ff8a30', 0.9 * boom),
      glow(760, 1150, lerp(20, 240, boom), '#fff0b0', boom),
      `<g filter="url(#blur8)">${[...Array(6)].map((_, i) => `<circle cx="${760 + Math.sin(i * 2) * 120 * boom}" cy="${1120 - i * 70 * boom}" r="${(60 + i * 30) * boom}" fill="#3a2420" opacity="${0.5 * boom}"/>`).join('')}</g>`,
      poles([[40, 1300, 300], [260, 1220, 170], [400, 1180, 100], [500, 1162, 60]], '#0a0a10'),
      hills(1170, '#141018', 40, 3),
      `<rect x="0" y="1160" width="1080" height="760" fill="${V('#1e1a1e', 0.05, 0.4)}"/>`,
      `<rect x="0" y="1160" width="1080" height="760" fill="${grad([[0, '#ff8a30', 0.25 * boom], [0.5, '#ff8a30', 0]])}"/>`,
      // ящик с динамитом и бикфордов шнур
      `<g filter="url(#soft)"><rect x="560" y="1470" width="300" height="170" rx="8" fill="${V('#7a5a34', 0.2, 0.3)}"/><text x="710" y="1580" text-anchor="middle" font-family="Arial Black,Arial" font-size="54" fill="#3a2410" opacity="0.7">TNT</text>${[0, 1, 2, 3, 4].map((i) => `<rect x="${580 + i * 52}" y="1420" width="44" height="70" rx="20" fill="${V('#c8322a', 0.3, 0.3)}"/>`).join('')}</g>`,
      `<path d="M700,1420 Q760,1300 900,1360 T1080,1300" stroke="#e8d0a0" stroke-width="5" fill="none" stroke-dasharray="10 6"/>`,
      glow(lerp(700, 1080, clamp(t / 2.4)), 1400 - 60 * Math.sin(clamp(t / 2.4) * 3), 50, '#ffd060', 1),
      man(330, 1750, 1.15, { ...YOUNG, pose: 'crouch', arms: 'hold', look: 1, frown: 0.25, blink: blink(t, 0.6) }),
      grade('#ff9040', 0.25 * boom),
      topShade(820, 0.5),
    ];
    const tb = Math.max(0, t - cut), kB = ease(tb / Math.max(0.1, T - cut)), ring = t > D + 5.75, rg = ring ? wave(t, 9) : 0;
    const jump = ease(clamp((t - D - 5.8) / 0.2));
    const B = [
      room(t, { shelf: 640, lamp: 140, winX: 210 }),
      // телевизор с голубым мерцанием
      `<g filter="url(#soft)"><rect x="660" y="1180" width="320" height="300" rx="16" fill="#2a2420"/><rect x="684" y="1200" width="250" height="200" rx="20" fill="${grad([[0, '#6a9ac8'], [1, '#2a4a6a']])}"/></g>`,
      glow(800, 1300, 360, '#7ab0ff', 0.28 + 0.06 * wave(t, 1.7)),
      // диван
      `<g filter="url(#soft)"><rect x="40" y="1300" width="620" height="200" rx="40" fill="${V('#6a5a3a', 0.2, 0.3)}"/><rect x="60" y="1440" width="580" height="140" rx="30" fill="${V('#7a6a44', 0.2, 0.3)}"/></g>`,
      man(350, 1520, 1.15, { ...BOB, pose: 'sit', arms: 'down', look: lerp(0.8, -1, jump), frown: lerp(0.3, 0.8, jump), worried: jump > 0.5, lean: -6 * jump, blink: blink(t, 0.4) && !jump }),
      `<g filter="url(#soft)"><rect x="0" y="1360" width="90" height="240" rx="30" fill="${V('#6a5a3a', 0.2, 0.35)}"/><rect x="610" y="1360" width="90" height="240" rx="30" fill="${V('#6a5a3a', 0.2, 0.35)}"/></g>`,
      // столик и красный дисковый телефон
      `<rect x="40" y="1600" width="260" height="20" fill="#3a2414"/><g transform="translate(${170 + rg * 6} 1600) rotate(${rg * 4})" filter="url(#soft)"><path d="M-80,0 L-60,-70 L60,-70 L80,0 Z" fill="${V('#c8322a', 0.3, 0.3)}"/><circle cx="0" cy="-38" r="26" fill="#f0e4d0"/><circle cx="0" cy="-38" r="10" fill="#c8322a"/><rect x="-86" y="${-96 - (ring ? Math.abs(rg) * 10 : 0)}" width="172" height="30" rx="15" fill="${V('#b02a22', 0.3, 0.3)}"/></g>`,
      ring ? [1, 2, 3].map((i) => `<path d="M${70 - i * 22},${1500 - i * 6} q-14,-40 0,-80 M${270 + i * 22},${1500 - i * 6} q14,-40 0,-80" stroke="#fff0c0" stroke-width="5" fill="none" opacity="${0.8 - i * 0.2}"/>`).join('') : '',
      grade('#ffb070', 0.2),
      topShade(820, 0.5),
    ];
    return {
      cam: { z: 1 },
      els: [
        camG({ z: lerp(1.0, 1.08, kB), y: lerp(0, -30, kB) }, B),
        mix < 1 ? camG({ z: lerp(1.0, 1.12, kA), x: lerp(0, -40, kA) }, A, 1 - mix) : '',
      ],
    };
  },

  // 3. Нижний ракурс: на закате в городок въезжает колонна грузовиков, на переднем плане — полковник Локджо
  convoy(t, T) {
    const k = ease(t / T), kc = ease(clamp((t - D - 2.4) / 1.4));
    return {
      cam: { z: lerp(1.0, 1.14, kc), x: lerp(120, -60, kc), y: lerp(0, -50, kc) },
      els: [
        sky(DUSK, 1400),
        glow(260, 1180, 420, '#ffe0a0', 0.9), `<circle cx="260" cy="1190" r="80" fill="#fff0c8"/>`,
        clouds(500, 400, '#ffc890', '#8a4a6a', t, 9, 43),
        // городок: плоские крыши, вывески, пальмы, столбы
        ...[[-40, 260, 300, '#6a3a3a'], [230, 220, 340, '#5a4a5a'], [460, 280, 260, '#6a4a3a'], [740, 240, 380, '#4a3a4a'], [990, 200, 300, '#5a3a3a']].map(([x, w, h, c]) => `<rect x="${x}" y="${1320 - h}" width="${w}" height="${h}" fill="${V(c, 0.1, 0.35)}"/><rect x="${x + 20}" y="${1320 - h + 40}" width="${w - 40}" height="40" fill="#2a1a1a" opacity="0.6"/>${[0, 1, 2].map((i) => `<rect x="${x + 24 + i * (w - 48) / 3}" y="${1320 - h + 110}" width="${(w - 80) / 3}" height="${h * 0.3}" fill="#ffd890" opacity="${0.35 + 0.2 * (i % 2)}"/>`).join('')}`),
        `<text x="365" y="${1320 - 340 + 70}" text-anchor="middle" font-family="Arial Black,Arial" font-size="30" fill="#f0c070" opacity="0.8">DINER</text><text x="590" y="${1320 - 260 + 70}" text-anchor="middle" font-family="Arial Black,Arial" font-size="26" fill="#e0e0c0" opacity="0.7">TOOLS</text>`,
        ...[[120, 1330, 520, 0], [650, 1330, 600, 1.4], [960, 1330, 480, 2.6]].map(([x, y, h, ph]) => palm(x, y, h, t, ph, '#1e1418')),
        poles([[60, 1340, 300], [400, 1330, 280], [740, 1330, 290], [1060, 1340, 300]], '#1e1418'),
        `<rect x="0" y="1320" width="1080" height="600" fill="${V('#5a3a34', 0.06, 0.45)}"/>`,
        `<rect x="0" y="1330" width="1080" height="160" fill="${V('#3a2a2a', 0.1, 0.3)}"/>`,
        [...Array(8)].map((_, i) => `<rect x="${((i * 160 - t * 40) % 1280 + 1280) % 1280 - 100}" y="1404" width="70" height="8" fill="#e8d890" opacity="0.6"/>`).join(''),
        // колонна грузовиков едет справа налево
        ...[0, 1, 2].map((i) => truck(((1300 + i * 640 - t * 210) % 1920 + 1920) % 1920 - 420, 1500, 0.72, t + i)),
        `<g filter="url(#blur20)">${[...Array(8)].map((_, i) => `<ellipse cx="${(i * 180 - t * 120 + 2000) % 1400 - 160}" cy="${1460 - (i % 3) * 30}" rx="160" ry="40" fill="#d8a878" opacity="0.35"/>`).join('')}</g>`,
        // Локджо снизу
        glow(770, 1100, 520, '#ffb070', 0.2),
        man(770, 2500, 2.0, { ...LOCK, arms: 'down', look: -0.5, blink: blink(t, 1.6), nod: -1 }),
        grade('#ff9a60', 0.25),
        topShade(820, 0.5),
      ],
    };
  },

  // 4. Ночь, мокрая улица с неоном: Боб в халате бежит к камере, сзади мигалки
  run(t, T) {
    const k = ease(t / T), ph = t * 2.6, bob = Math.abs(Math.sin(ph * Math.PI)) * 26;
    const vx = 540, vy = 1060;
    const lamps = [0, 1, 2, 3, 4].map((i) => { const p = ((i / 5 + t * 0.32) % 1), q = p * p; return { q, side: i % 2 ? 1 : -1 }; }).sort((a, b) => a.q - b.q);
    return {
      cam: { z: lerp(1.04, 1.12, k), x: wave(t, 0.3) * 10 },
      els: [
        sky([[0, '#05060c'], [0.8, '#14182a'], [1, '#2a2440']], 1100),
        // дома по сторонам в перспективе
        `<path d="M0,300 L${vx - 90},${vy - 200} L${vx - 90},${vy} L0,1500 Z" fill="${V('#1e1a26', 0.08, 0.3)}"/><path d="M1080,300 L${vx + 90},${vy - 200} L${vx + 90},${vy} L1080,1500 Z" fill="${V('#221c28', 0.08, 0.3)}"/>`,
        ...[[0.25, -1], [0.55, -1], [0.35, 1], [0.7, 1]].map(([f, sd]) => { const x0 = vx + sd * (90 + f * 450), y0 = vy - 200 - f * 700 * 0.55; return `<rect x="${sd < 0 ? x0 - 60 * (0.3 + f) : x0}" y="${y0 + 150}" width="${60 * (0.3 + f)}" height="${120 * (0.3 + f)}" fill="#ffd890" opacity="0.4"/>`; }),
        neon(250, 640, 'MOTEL', '#ff4a8a', 70, t, 0, true),
        neon(840, 720, 'LIQUOR', '#4af0ff', 60, t, 2),
        neon(830, 820, 'OPEN', '#ff8a30', 40, t, 1),
        // дорога, лужи с отражениями неона
        `<path d="M${vx - 90},${vy} L${vx + 90},${vy} L1080,1500 L1080,1920 L0,1920 L0,1500 Z" fill="${V('#1a1a22', 0.05, 0.3)}"/>`,
        `<g filter="url(#blur8)"><rect x="200" y="1300" width="140" height="300" fill="#ff4a8a" opacity="0.22"/><rect x="760" y="1300" width="120" height="340" fill="#4af0ff" opacity="0.2"/><rect x="${vx - 60}" y="1150" width="120" height="360" fill="#ff3030" opacity="${0.12 + 0.1 * (Math.floor(t * 6) % 2)}"/></g>`,
        [...Array(7)].map((_, i) => { const p = ((i / 7 + t * 0.5) % 1), q = p * p; return `<rect x="${vx - 3 - q * 10}" y="${vy + q * 860}" width="${6 + q * 20}" height="${6 + q * 70}" fill="#d8d0a0" opacity="0.55"/>`; }).join(''),
        cruiser(vx, vy + 20, 0.55, t),
        // фонари проносятся мимо (параллакс)
        ...lamps.map(({ q, side }) => { const x = vx + side * (110 + q * 900), yb = vy + q * 860, h = 60 + q * 1300; return `<rect x="${x - 2 - q * 6}" y="${yb - h}" width="${4 + q * 12}" height="${h}" fill="#0a0a10"/>${glow(x, yb - h, 40 + q * 160, '#ffcf80', 0.7)}`; }),
        `<g transform="translate(0 ${-bob})">${man(540, 2080, 1.7, { ...BOB, arms: 'pull', step: Math.sin(ph * Math.PI), flap: Math.sin(ph * Math.PI * 0.5) * 0.8, lean: 3, look: 0, frown: 0.8, worried: true })}</g>`,
        glow(540, 1150, 400, '#ff3030', 0.08 + 0.08 * (Math.floor(t * 6) % 2)),
        grade('#6a5aff', 0.15),
        topShade(820, 0.55),
      ],
    };
  },

  // 5. Фото-стикеры: ДиКаприо и Шон Пенн под имена, на «Оскар» — статуэтка у Пенна
  actors(t, T) {
    def(STICKER_FILTER);
    return {
      cam: { z: lerp(1.0, 1.04, ease(t / T)) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#0a0a14'], [0.6, '#1a1424'], [1, '#2a1a20']])}"/>`,
        // размытый ночной городок: боке неона и мигалок
        `<g filter="url(#blur20)">${(() => { reseed(5); let g = ''; for (let i = 0; i < 26; i++) g += `<circle cx="${(rnd() * 1200 + t * 12 * (rnd() - 0.5)) - 60}" cy="${300 + rnd() * 1300}" r="${30 + rnd() * 70}" fill="${['#ff4a8a', '#4af0ff', '#ffcf80', '#ff3030', '#3a7aff'][i % 5]}" opacity="${0.18 + rnd() * 0.2}"/>`; return g; })()}</g>`,
        ...STICKERS.map((s, i) => sticker(s, t, i)),
        glow(930, 1530, 200 * clamp((t - D - 4.25) * 4), '#ffe08a', 0.4),
        popIn(930, 1560, D + 4.25, t, statuette(930, 1560, 300, 6 + wave(t, 0.4) * 2)),
        topShade(700, 0.4),
      ],
    };
  },

  // 6. Сверху: дорога-«горки» через холмы, машины ныряют за гребни; на «шесть "Оскаров"» выпрыгивают статуэтки
  hills(t, T) {
    def(STICKER_FILTER);
    const k = ease(t / T);
    const rows = [[960, 1000], [1000, 1060], [1060, 1150], [1150, 1280], [1280, 1460], [1460, 1700], [1700, 1980]];
    const hw = (y) => 14 + (y - 940) * 0.42;
    let land = '';
    rows.forEach(([y0, y1], i) => {
      const bump = (y1 - y0) * 0.35, c = shade('#c89a68', (i % 2 ? -0.06 : 0.04) - i * 0.015);
      land += `<path d="M-60,${y1} L-60,${y0 + bump * 0.6} Q270,${y0 - bump * 0.4} 540,${y0} Q810,${y0 - bump * 0.4} 1140,${y0 + bump * 0.6} L1140,${y1} Z" fill="${V(c, 0.14, 0.2)}"/>`;
      land += `<path d="M${540 - hw(y0)},${y0 + 2} L${540 + hw(y0)},${y0 + 2} L${540 + hw(y1)},${y1} L${540 - hw(y1)},${y1} Z" fill="${V('#5a524c', 0.12, 0.2)}"/>`;
      land += `<path d="M540,${y0 + 4} L540,${y1}" stroke="#f0d060" stroke-width="${2 + i * 1.6}" stroke-dasharray="${10 + i * 8} ${8 + i * 6}"/>`;
      land += brush(y0 + 10, y1, 3 + i, 30 + i, '#7a7a44');
      // машина на этом холме: съезжает от гребня вниз (к камере)
      [[0.0, '#c8322a'], [0.45, '#1a1a1a']].forEach(([off, c2], j) => {
        if ((i + j) % 2) return;
        const p = ((t * 0.55 + off + i * 0.13) % 1), y = lerp(y0 + 6, y1 - 4, p);
        land += car(540 + (j ? 1 : -1) * hw(y) * 0.45, y, 0.12 + (y - 940) * 0.0011, c2, t, i);
      });
    });
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -60, k) },
      els: [
        sky([[0, '#6a9ac8'], [0.6, '#c8dce8'], [1, '#f4e6cc']], 1000),
        glow(820, 520, 300, '#fffbe8', 0.7),
        clouds(560, 260, '#ffffff', '#c8d8e8', t, 7, 47),
        hills(960, '#b08a6a', 70, 4, 0.8),
        land,
        ...[0, 1, 2, 3, 4, 5].map((i) => { const x = 140 + i * 160, at = D + 3.0 + i * 0.09; return glow(x, 1380, 110 * clamp((t - at) * 4), '#ffe08a', 0.3) + popIn(x, 1470, at, t, statuette(x, 1470, 220, (i - 2.5) * 2 + wave(t, 0.4, i) * 2)); }),
        grade('#ffd8a0', 0.2),
        topShade(820, 0.45),
      ],
    };
  },

  // 7. Общий план: рассвет, Боб один на гребне холма, халат треплет ветер, внизу петляет дорога
  dawn(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.16, 1.0, k), y: lerp(-40, 0, k) },
      els: [
        sky(DAWN, 1300),
        glow(800, 1120, 520, '#ffe0a0', 0.9), `<circle cx="800" cy="${1140 - k * 30}" r="90" fill="#fff2c8"/>`,
        clouds(520, 420, '#ffd8b8', '#9a7090', t, 9, 61),
        ...[0, 1, 2].map((i) => bird(300 + i * 90 + t * 30, 560 + i * 30 + Math.sin(t + i) * 10, 0.8 - i * 0.15, t, i)),
        hills(1150, '#8a5a5a', 90, 7, 0.8),
        hills(1230, '#6a4048', 110, 11, 0.95),
        `<path d="M1080,1250 Q820,1290 900,1340 Q980,1390 700,1420 Q420,1450 600,1520 L640,1540 Q500,1460 760,1430 Q1030,1395 940,1340 Q860,1295 1080,1270 Z" fill="#c8a080" opacity="0.7"/>`,
        hills(1420, '#4a2a30', 140, 13),
        `<path d="M-40,1500 Q260,1330 560,1380 Q820,1420 1120,1540 L1120,1920 L-40,1920 Z" fill="${V('#3a2228', 0.08, 0.4)}"/>`,
        brush(1430, 1700, 10, 9, '#4a3a2a'),
        shadow(420, 1395, 110, 0.35),
        man(420, 1395, 0.62, { ...BOB, arms: 'down', look: 1, frown: 0.5, flap: wave(t, 0.8) * 0.9, blink: blink(t, 0.7) }),
        grade('#ffb080', 0.3),
        topShade(820, 0.45),
      ],
    };
  },
};

run(shots);
