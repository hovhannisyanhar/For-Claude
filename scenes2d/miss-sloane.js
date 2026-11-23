// «Опасная игра Слоун» (Miss Sloane, 2016) — 8 сцен в 2D-векторе. Имя плана = set сцены в videos/miss-sloane/script.json.
// Вашингтон наших дней: холодный синий стекла, мрамор и тёмное дерево Сената, тёплые лампы, Капитолий в огнях.
// Слоун: медно-рыжее гладкое каре до плеч с косым пробором, бледная кожа, алая помада, чёрный приталенный костюм.
import { run, person, setProportions, V, R, grad, glow, silFilter, rnd, reseed, shade, lerp, ease, clamp, wave, def } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

const SLOANE = { shirt: '#17181c', pants: '#121316', skin: '#f2cdb4', hair: '#b4502a', iris: '#4a6a5a', beard: false, frown: 0.25, longHair: true, sloane: true, slim: 0.76 };
// лоббист оружейного лобби: седые волосы, усы, серый костюм в полоску, бордовый галстук
const GUNMAN = { shirt: '#5a5e66', pants: '#43464c', skin: '#d8a888', hair: '#c8c4bc', iris: '#3a3a3a', beard: false, moustache: true, frown: 0.5, suit: true, tie: '#7a1e22', pin: true };
const suitMan = (shirt, hair, tie, skin = '#d6a482') => ({ shirt, pants: shade(shirt, -0.15), skin, hair, beard: false, frown: 0.45, suit: true, tie });

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const fade = (t, a, d = 0.35) => ease(clamp((t - a) / d));
const D = 0.13; // AUDIO_DELAY: голос начинается через 4 кадра

// ---------- персонажи ----------
function geo(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const pose = o.pose || 'stand';
  const legH = (pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  return { hs, hr, top, ty, headY: top - hr * 0.8 + (o.nod || 0) * 6 * hs, sl: p.slim ?? 1, pose, sy: top + 40 * s };
}
function dress(x, y, s, o) {
  const { hr, hs, top, ty, headY } = geo(x, y, s, o);
  const sh = o.shirt, dk = shade(sh, -0.4), lt = shade(sh, 0.25);
  let b = '', front = '';
  if (o.sloane) {
    // чёрный жакет: глубокий вырез, атласные лацканы, тонкая серебряная цепочка, пуговица на талии
    b += `<path d="M${x - 46 * s},${top - 4 * s} L${x},${top + 120 * s} L${x + 46 * s},${top - 4 * s} Z" fill="${shade(o.skin, -0.06)}"/>`;
    b += `<path d="M${x - 30 * s},${top + 4 * s} Q${x},${top + 52 * s} ${x + 30 * s},${top + 4 * s}" stroke="#d8dce0" stroke-width="${2.5 * s}" fill="none"/><circle cx="${x}" cy="${top + 40 * s}" r="${6 * s}" fill="#e8ecf0"/>`;
    b += `<path d="M${x - 70 * s},${top - 8 * s} L${x - 8 * s},${top + 150 * s} L${x - 34 * s},${top + 160 * s} L${x - 100 * s},${top + 40 * s} Z M${x + 70 * s},${top - 8 * s} L${x + 8 * s},${top + 150 * s} L${x + 34 * s},${top + 160 * s} L${x + 100 * s},${top + 40 * s} Z" fill="${V('#2a2c32', 0.35, 0.2)}"/>`;
    b += `<path d="M${x - 8 * s},${top + 150 * s} L${x},${ty} M${x - 88 * s},${ty - 60 * s} Q${x},${ty - 40 * s} ${x + 88 * s},${ty - 60 * s}" stroke="#000" stroke-width="${3 * s}" fill="none" opacity="0.6"/><circle cx="${x + 6 * s}" cy="${top + 190 * s}" r="${7 * s}" fill="#2e3036"/>`;
  }
  if (o.suit) {
    // мужской костюм: белая рубашка, галстук, лацканы, нагрудный платок/значок
    b += `<path d="M${x - 40 * s},${top - 6 * s} L${x},${top + 130 * s} L${x + 40 * s},${top - 6 * s} Z" fill="#eef0f2"/>`;
    b += `<path d="M${x - 12 * s},${top + 8 * s} L${x + 12 * s},${top + 8 * s} L${x + 16 * s},${top + 110 * s} L${x},${top + 130 * s} L${x - 16 * s},${top + 110 * s} Z" fill="${V(o.tie || '#2a3a6a', 0.25, 0.25)}"/><path d="M${x - 14 * s},${top - 2 * s} L${x + 14 * s},${top - 2 * s} L${x + 9 * s},${top + 14 * s} L${x - 9 * s},${top + 14 * s} Z" fill="${shade(o.tie || '#2a3a6a', -0.2)}"/>`;
    b += `<path d="M${x - 62 * s},${top - 10 * s} L${x - 4 * s},${top + 140 * s} L${x - 30 * s},${top + 150 * s} L${x - 96 * s},${top + 40 * s} Z M${x + 62 * s},${top - 10 * s} L${x + 4 * s},${top + 140 * s} L${x + 30 * s},${top + 150 * s} L${x + 96 * s},${top + 40 * s} Z" fill="${V(lt, 0.15, 0.25)}"/>`;
    b += `<path d="M${x},${top + 140 * s} L${x},${ty}" stroke="${dk}" stroke-width="${3 * s}"/>` + [0, 1].map((i) => `<circle cx="${x + 8 * s}" cy="${top + (175 + i * 40) * s}" r="${6 * s}" fill="${dk}"/>`).join('');
    b += `<path d="M${x + 44 * s},${top + 92 * s} L${x + 84 * s},${top + 88 * s}" stroke="${dk}" stroke-width="${3 * s}"/>`;
    if (o.pin) b += `<path d="M${x - 70 * s},${top + 70 * s} l${10 * s},${-12 * s} l${10 * s},${12 * s} l${-10 * s},${12 * s} Z" fill="#d8b44a"/>`;
    else b += `<path d="M${x + 50 * s},${top + 88 * s} l${10 * s},${-14 * s} l${8 * s},${10 * s} l${10 * s},${-10 * s} l${4 * s},${14 * s} Z" fill="#eef0f2"/>`;
  }
  if (o.sloane) {
    // каре до плеч: пряди у лица закрывают уши, косой пробор, блик
    front += `<path d="M${x - hr * 1.08},${headY + hr * 1.18} Q${x - hr * 1.24},${headY - hr * 0.1} ${x - hr * 0.92},${headY - hr * 0.8} Q${x - hr * 0.5},${headY - hr * 1.2} ${x + hr * 0.1},${headY - hr * 1.14} Q${x - hr * 0.55},${headY - hr * 0.7} ${x - hr * 0.78},${headY + hr * 0.1} Q${x - hr * 0.82},${headY + hr * 0.75} ${x - hr * 0.62},${headY + hr * 1.12} Z" fill="${V(o.hair, 0.25, 0.25)}"/>`;
    front += `<path d="M${x + hr * 1.06},${headY + hr * 1.16} Q${x + hr * 1.22},${headY - hr * 0.2} ${x + hr * 0.86},${headY - hr * 0.82} Q${x + hr * 0.4},${headY - hr * 1.16} ${x - hr * 0.05},${headY - hr * 1.12} Q${x + hr * 0.62},${headY - hr * 0.78} ${x + hr * 0.8},${headY} Q${x + hr * 0.84},${headY + hr * 0.72} ${x + hr * 0.66},${headY + hr * 1.12} Z" fill="${V(o.hair, 0.2, 0.3)}"/>`;
    front += `<path d="M${x - hr * 0.55},${headY - hr * 0.95} Q${x - hr * 0.95},${headY - hr * 0.4} ${x - hr * 0.98},${headY + hr * 0.6}" stroke="#ffd0a0" stroke-width="${hr * 0.06}" fill="none" opacity="0.35"/>`;
    // алая помада поверх рта
    const ey = headY + 2 * hs;
    if (o.smile) front += `<path d="M${x - 32 * hs},${ey + 48 * hs} Q${x},${ey + 86 * hs} ${x + 32 * hs},${ey + 48 * hs} Q${x},${ey + 56 * hs} ${x - 32 * hs},${ey + 48 * hs} Z" fill="#6a1418"/><path d="M${x - 24 * hs},${ey + 52 * hs} Q${x},${ey + 58 * hs} ${x + 24 * hs},${ey + 52 * hs}" stroke="#fff" stroke-width="${5 * hs}" fill="none"/><path d="M${x - 34 * hs},${ey + 47 * hs} Q${x},${ey + 40 * hs} ${x + 34 * hs},${ey + 47 * hs}" stroke="#b81e26" stroke-width="${6 * hs}" fill="none" stroke-linecap="round"/>`;
    else front += `<path d="M${x - 22 * hs},${ey + 56 * hs} Q${x - 10 * hs},${ey + 48 * hs} ${x},${ey + 52 * hs} Q${x + 10 * hs},${ey + 48 * hs} ${x + 22 * hs},${ey + 56 * hs} Q${x},${ey + 68 * hs} ${x - 22 * hs},${ey + 56 * hs} Z" fill="${V('#c0222a', 0.25, 0.2)}"/>`;
    // ресницы/стрелки
    [-1, 1].forEach((sd) => { const ex = x + sd * 34 * hs + (o.look || 0) * 8 * hs; front += `<path d="M${ex - 18 * hs},${ey - 10 * hs} Q${ex},${ey - 20 * hs} ${ex + 18 * hs},${ey - 10 * hs} L${ex + sd * 26 * hs},${ey - 16 * hs}" stroke="#1a1010" stroke-width="${4 * hs}" fill="none" stroke-linecap="round"/>`; });
    front += [-1, 1].map((sd) => `<circle cx="${x + sd * hr * 0.98}" cy="${headY + hr * 0.42}" r="${6 * hs}" fill="#f0f2f4"/>`).join('');
  }
  if (o.suit && o.hair) {
    // короткая мужская стрижка + седые виски
    front += [-1, 1].map((sd) => `<path d="M${x + sd * hr * 0.96},${headY - hr * 0.45} L${x + sd * hr * 0.9},${headY + hr * 0.1}" stroke="${shade(o.hair, 0.2)}" stroke-width="${hr * 0.1}" stroke-linecap="round"/>`).join('');
  }
  return { b, front };
}
function figure(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b, longHair: o.longHair && !o.sil });
  if (!front || o.sil) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}>${front}</g>`;
}
const sloane = (x, y, s, o = {}) => figure(x, y, s, { ...SLOANE, ...o });
// Слоун со спины: каре, чёрный жакет, ноги в брюках, каблуки
function sloaneBack(x, y, s, step = 0) {
  const { hr, top, ty, headY } = geo(x, y, s, SLOANE);
  const w = 98 * s * 0.76;
  let g = `<g filter="url(#soft)">`;
  [-1, 1].forEach((sd, i) => { const lift = (i ? -step : step) * 18 * s; g += `<path d="M${x + sd * 22 * s - 20 * s},${ty} L${x + sd * 22 * s + 20 * s},${ty} L${x + sd * 22 * s + 14 * s},${y - 20 * s + lift} L${x + sd * 22 * s - 14 * s},${y - 20 * s + lift} Z" fill="${V('#121316', 0.15, 0.2)}"/><path d="M${x + sd * 22 * s - 14 * s},${y - 20 * s + lift} L${x + sd * 22 * s + 16 * s},${y - 20 * s + lift} L${x + sd * 22 * s + 10 * s},${y + lift} Z" fill="#0a0a0c"/>`; });
  g += `<path d="M${x - w},${ty + 20 * s} L${x - w * 1.12},${top + 30 * s} Q${x},${top - 12 * s} ${x + w * 1.12},${top + 30 * s} L${x + w},${ty + 20 * s} Q${x},${ty + 40 * s} ${x - w},${ty + 20 * s} Z" fill="${V('#1e2026', 0.3, 0.2)}"/>`;
  g += `<path d="M${x},${top + 60 * s} L${x},${ty + 30 * s}" stroke="#000" stroke-width="${3 * s}" opacity="0.5"/>`;
  [-1, 1].forEach((sd) => g += `<path d="M${x + sd * w * 1.1},${top + 40 * s} Q${x + sd * w * 1.3},${top + 200 * s} ${x + sd * w * 1.2},${ty - 20 * s}" stroke="${V('#1e2026', 0.25, 0.2)}" stroke-width="${46 * s}" fill="none" stroke-linecap="round"/><circle cx="${x + sd * w * 1.2}" cy="${ty - 10 * s}" r="${18 * s}" fill="#e8c2a8"/>`);
  g += `<rect x="${x - 22 * s}" y="${top - 30 * s}" width="${44 * s}" height="${40 * s}" fill="#e0b89e"/>`;
  g += `<path d="M${x - hr * 1.1},${headY + hr * 1.2} Q${x - hr * 1.3},${headY - hr * 1.2} ${x},${headY - hr * 1.15} Q${x + hr * 1.3},${headY - hr * 1.2} ${x + hr * 1.1},${headY + hr * 1.2} Q${x},${headY + hr * 1.35} ${x - hr * 1.1},${headY + hr * 1.2} Z" fill="${V(SLOANE.hair, 0.3, 0.3)}"/>`;
  g += `<path d="M${x - hr * 0.4},${headY - hr * 0.9} Q${x - hr * 0.8},${headY} ${x - hr * 0.7},${headY + hr * 1}" stroke="#ffc890" stroke-width="${hr * 0.07}" fill="none" opacity="0.35"/>`;
  return g + `</g>`;
}
// затылок Слоун на переднем плане (через плечо)
function sloaneOverShoulder(x, y, s) {
  return `<g filter="url(#soft)"><path d="M${x - 300 * s},${y + 400 * s} Q${x - 280 * s},${y + 120 * s} ${x},${y + 90 * s} Q${x + 280 * s},${y + 120 * s} ${x + 300 * s},${y + 400 * s} Z" fill="${V('#1a1b20', 0.2, 0.2)}"/>
  <path d="M${x - 150 * s},${y + 140 * s} Q${x - 190 * s},${y - 210 * s} ${x},${y - 220 * s} Q${x + 190 * s},${y - 210 * s} ${x + 150 * s},${y + 140 * s} Q${x},${y + 170 * s} ${x - 150 * s},${y + 140 * s} Z" fill="${V(SLOANE.hair, 0.3, 0.45)}"/>
  <path d="M${x + 60 * s},${y - 190 * s} Q${x + 150 * s},${y - 60 * s} ${x + 130 * s},${y + 110 * s}" stroke="#ffc890" stroke-width="${10 * s}" fill="none" opacity="0.3"/>
  <path d="M${x + 150 * s},${y - 60 * s} Q${x + 185 * s},${y + 20 * s} ${x + 160 * s},${y + 110 * s} L${x + 135 * s},${y + 100 * s} Q${x + 150 * s},${y} ${x + 135 * s},${y - 50 * s} Z" fill="#e8c0a6"/>
  <path d="M${x + 40 * s},${y - 200 * s} Q${x + 170 * s},${y - 120 * s} ${x + 150 * s},${y + 140 * s}" stroke="${shade(SLOANE.hair, -0.2)}" stroke-width="${8 * s}" fill="none" opacity="0.5"/>
  <path d="M${x - 40 * s},${y - 210 * s} Q${x + 60 * s},${y - 80 * s} ${x + 40 * s},${y + 150 * s}" stroke="${shade(SLOANE.hair, -0.25)}" stroke-width="${6 * s}" fill="none" opacity="0.4"/></g>`;
}

// ---------- окружение ----------
function capitol(x, y, s, lit = 0, c = '#e8e4da') {
  // купол Капитолия: барабан с колоннадой, купол с рёбрами, фонарь со статуей, крылья
  const L = (k) => shade(c, k);
  let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  g += `<rect x="-560" y="-120" width="1120" height="120" fill="${V(c, 0.05, 0.25)}"/>`;
  for (let i = -540; i <= 520; i += 40) g += `<rect x="${i}" y="-112" width="12" height="104" fill="${L(-0.25)}" opacity="0.6"/>`;
  g += `<path d="M-200,-120 L0,-190 L200,-120 Z" fill="${V(c, 0.1, 0.2)}"/>`;
  g += `<rect x="-190" y="-300" width="380" height="180" fill="${V(c, 0.08, 0.22)}"/>`;
  for (let i = -176; i <= 170; i += 24) g += `<rect x="${i}" y="-292" width="10" height="164" fill="${L(-0.3)}" opacity="0.55"/>`;
  g += `<rect x="-205" y="-312" width="410" height="16" fill="${L(0.05)}"/><rect x="-150" y="-370" width="300" height="60" fill="${V(c, 0.08, 0.2)}"/>`;
  for (let i = -140; i <= 130; i += 22) g += `<rect x="${i}" y="-362" width="8" height="44" fill="${L(-0.3)}" opacity="0.5"/>`;
  g += `<path d="M-150,-370 Q-150,-560 0,-580 Q150,-560 150,-370 Z" fill="${V(c, 0.2, 0.25)}"/>`;
  [-110, -60, 0, 60, 110].forEach((dx) => g += `<path d="M${dx * 1.3},-370 Q${dx},-520 0,-578" stroke="${L(-0.25)}" stroke-width="4" fill="none"/>`);
  g += `<rect x="-26" y="-640" width="52" height="64" fill="${V(c, 0.1, 0.2)}"/><path d="M-26,-640 Q0,-670 26,-640 Z" fill="${c}"/><rect x="-4" y="-700" width="8" height="40" fill="${L(-0.3)}"/><circle cx="0" cy="-704" r="8" fill="${L(-0.3)}"/>`;
  if (lit) {
    g += glow(0, -420, 420, '#ffe2a8', 0.5 * lit);
    for (let i = -176; i <= 170; i += 24) g += `<rect x="${i + 10}" y="-288" width="12" height="150" fill="#ffd890" opacity="${0.55 * lit}"/>`;
    for (let i = -520; i <= 520; i += 40) g += `<rect x="${i + 14}" y="-100" width="18" height="70" fill="#ffd080" opacity="${0.45 * lit}"/>`;
  }
  return g + `</g>`;
}
function monument(x, y, h, c = '#d8d2c4') { return `<path d="M${x - h * 0.05},${y} L${x - h * 0.035},${y - h * 0.94} L${x},${y - h} L${x + h * 0.035},${y - h * 0.94} L${x + h * 0.05},${y} Z" fill="${V(c, 0.1, 0.3)}"/>`; }
function skyline(y, c, lit = 0, sd = 5) {
  reseed(sd); let g = '';
  for (let x = -40; x < 1100;) { const w = 60 + rnd() * 110, h = 60 + rnd() * 220; g += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}"/>`; if (lit) for (let wy = y - h + 14; wy < y - 10; wy += 22) for (let wx = x + 8; wx < x + w - 10; wx += 18) if (rnd() < 0.35) g += `<rect x="${wx}" y="${wy}" width="8" height="10" fill="#ffd890" opacity="${0.4 + rnd() * 0.5}"/>`; x += w + 4; }
  return g;
}
function flag(x, y, h, t, ph = 0) {
  const w = h * 0.5, wv = wave(t, 0.4, ph) * 6;
  let g = `<rect x="${x - 3}" y="${y - h}" width="6" height="${h}" fill="${V('#c8a24a', 0.3, 0.3)}"/><circle cx="${x}" cy="${y - h - 6}" r="9" fill="#d8b45a"/>`;
  g += `<g transform="translate(${x + 3} ${y - h + 6})">`;
  for (let i = 0; i < 7; i++) g += `<path d="M0,${i * w * 0.09} Q${w * 0.25},${i * w * 0.09 + wv} ${w * 0.5},${i * w * 0.09} T${w},${i * w * 0.09} L${w},${i * w * 0.09 + w * 0.09} Q${w * 0.75},${i * w * 0.09 + w * 0.09 - wv} ${w * 0.5},${i * w * 0.09 + w * 0.09} T0,${i * w * 0.09 + w * 0.09} Z" fill="${i % 2 ? '#e8e4dc' : '#a82a30'}"/>`;
  g += `<rect x="0" y="0" width="${w * 0.42}" height="${w * 0.36}" fill="#2a3a6a"/>`;
  for (let i = 0; i < 12; i++) g += `<circle cx="${w * 0.05 + (i % 4) * w * 0.1}" cy="${w * 0.06 + Math.floor(i / 4) * w * 0.11}" r="2" fill="#fff"/>`;
  return g + `</g>`;
}
function column(x, y0, y1, w, c = '#d8d0c0') {
  let g = `<rect x="${x - w / 2}" y="${y0}" width="${w}" height="${y1 - y0}" fill="${grad([[0, shade(c, -0.3)], [0.35, shade(c, 0.12)], [0.7, c], [1, shade(c, -0.35)]], false)}"/>`;
  for (let k = -0.3; k <= 0.31; k += 0.15) g += `<rect x="${x + k * w - 2}" y="${y0}" width="4" height="${y1 - y0}" fill="#000" opacity="0.1"/>`;
  g += `<rect x="${x - w * 0.65}" y="${y0 - 20}" width="${w * 1.3}" height="24" fill="${V(c, 0.15, 0.2)}"/><rect x="${x - w * 0.62}" y="${y1}" width="${w * 1.24}" height="26" fill="${V(c, 0.1, 0.3)}"/>`;
  return g;
}
function mic(x, y, s, on = 0) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="40" ry="10" fill="#1a1a1c"/><path d="M0,0 Q-6,-80 30,-150" stroke="#2a2a2e" stroke-width="7" fill="none"/><rect x="22" y="-182" width="22" height="40" rx="10" fill="#1c1c20" transform="rotate(25 33 -162)"/><circle cx="-22" cy="-6" r="6" fill="${on ? '#ff3a30' : '#4a1a18'}"/>${on ? glow(-22, -6, 26, '#ff3a30', 0.8 * on) : ''}</g>`;
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
function desk(y, c = '#4a2a1a', h = 420) {
  return `<rect x="-40" y="${y}" width="1160" height="${h}" fill="${V(c, 0.12, 0.4)}"/><rect x="-40" y="${y}" width="1160" height="14" fill="${shade(c, 0.35)}"/><rect x="-40" y="${y + 14}" width="1160" height="6" fill="#000" opacity="0.3"/>` + [0, 1, 2, 3].map((i) => `<rect x="${60 + i * 260}" y="${y + 60}" width="200" height="${h - 120}" rx="6" fill="none" stroke="${shade(c, -0.3)}" stroke-width="5"/>`).join('');
}
function papers(x, y, s, rot = 0, n = 3) {
  let g = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">`;
  for (let i = 0; i < n; i++) g += `<rect x="${-110 + i * 8}" y="${-70 - i * 6}" width="220" height="140" fill="${shade('#f0ece2', -i * 0.04)}" transform="rotate(${(i - 1) * 4})"/>` + [0, 1, 2, 3, 4].map((k) => `<rect x="${-90 + i * 8}" y="${-50 - i * 6 + k * 22}" width="${150 - k * 12}" height="5" fill="#9a9690" transform="rotate(${(i - 1) * 4})"/>`).join('');
  return g + `</g>`;
}
function coffee(x, y, s) { return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30,-70 L30,-70 L24,0 L-24,0 Z" fill="${V('#f2efe8', 0.1, 0.2)}"/><rect x="-34" y="-82" width="68" height="14" rx="5" fill="#2a2a2a"/><rect x="-30" y="-46" width="60" height="22" fill="#8a5a34"/></g>`; }
function lamp(x, y, s, on = 1) { return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="50" ry="10" fill="#1a1612"/><path d="M0,0 L0,-160 L60,-220" stroke="#2a2420" stroke-width="10" fill="none"/><path d="M30,-250 L110,-200 L80,-170 Z" fill="${V('#1e4a32', 0.3, 0.2)}"/>${on ? glow(95, -175, 220, '#ffd890', 0.6 * on) : ''}</g>`; }
function clock(x, y, r, hrs, min) {
  const a = (v, n) => (v / n) * Math.PI * 2 - Math.PI / 2;
  let g = `<circle cx="${x}" cy="${y}" r="${r}" fill="${R('#f0ece2', 0.1, 0.15)}" stroke="#2a2a2a" stroke-width="${r * 0.08}"/>`;
  for (let i = 0; i < 12; i++) g += `<rect x="${x - 2}" y="${y - r * 0.9}" width="4" height="${r * 0.14}" fill="#2a2a2a" transform="rotate(${i * 30} ${x} ${y})"/>`;
  g += `<path d="M${x},${y} L${x + Math.cos(a(hrs, 12)) * r * 0.5},${y + Math.sin(a(hrs, 12)) * r * 0.5}" stroke="#1a1a1a" stroke-width="${r * 0.08}" stroke-linecap="round"/><path d="M${x},${y} L${x + Math.cos(a(min, 60)) * r * 0.75},${y + Math.sin(a(min, 60)) * r * 0.75}" stroke="#1a1a1a" stroke-width="${r * 0.05}" stroke-linecap="round"/>`;
  return g;
}
function phone(x, y, s, glowOn = 1) { return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-34" y="-62" width="68" height="124" rx="10" fill="#101012"/><rect x="-29" y="-54" width="58" height="104" rx="5" fill="${glowOn ? '#6aa8e8' : '#1a2030'}"/>${glowOn ? glow(0, 0, 90, '#8ac0ff', 0.4) : ''}</g>`; }
function briefcase(x, y, s, open = 0) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-120" y="-90" width="240" height="160" rx="12" fill="${V('#1c1c1e', 0.2, 0.2)}"/><path d="M-40,-90 L-40,-120 L40,-120 L40,-90" stroke="#2a2a2e" stroke-width="12" fill="none"/>`;
  g += `<rect x="-100" y="-80" width="20" height="14" fill="#b8a050"/><rect x="80" y="-80" width="20" height="14" fill="#b8a050"/>`;
  if (open) for (let i = 0; i < 5; i++) g += `<rect x="${-100 + i * 42}" y="-84" width="38" height="20" rx="3" fill="${V('#8aa878', 0.2, 0.25)}" stroke="#4a5a40" stroke-width="2"/>`;
  return g + `</g>`;
}
function rifleRack(x, y, s) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-200" y="-30" width="400" height="30" rx="6" fill="${V('#5a3a22', 0.2, 0.3)}"/><rect x="-200" y="-260" width="400" height="26" rx="6" fill="${V('#5a3a22', 0.2, 0.3)}"/>`;
  [-140, -50, 40, 130].forEach((dx) => g += `<rect x="${dx - 8}" y="-280" width="16" height="250" rx="4" fill="#1c1c1e"/><path d="M${dx - 8},-60 L${dx - 30},-10 L${dx + 10},-10 L${dx + 8},-60 Z" fill="${V('#6a4024', 0.25, 0.3)}"/>`);
  return g + `</g>`;
}
function deerHead(x, y, s) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><path d="M-70,40 L70,40 L60,80 L-60,80 Z" fill="${V('#4a2e1a', 0.2, 0.3)}"/>`;
  g += `<path d="M-40,40 Q-50,-40 0,-60 Q50,-40 40,40 Z" fill="${V('#8a5a34', 0.2, 0.3)}"/><path d="M-14,-10 Q0,50 14,-10 Z" fill="#6a4024"/><circle cx="0" cy="30" r="10" fill="#1a1010"/><circle cx="-20" cy="-30" r="6" fill="#100a08"/><circle cx="20" cy="-30" r="6" fill="#100a08"/>`;
  [-1, 1].forEach((sd) => g += `<path d="M${sd * 20},-55 Q${sd * 50},-130 ${sd * 30},-190 M${sd * 38},-100 L${sd * 80},-130 M${sd * 34},-150 L${sd * 70},-180 M${sd * 26},-80 L${sd * 6},-130" stroke="#d8c8a8" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${sd * 30},-50 L${sd * 70},-70 L${sd * 40},-36 Z" fill="#7a4a2a"/>`);
  return g + `</g>`;
}
function folder(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#soft)"><rect x="-130" y="-90" width="260" height="180" rx="6" fill="${V('#c8b088', 0.15, 0.2)}"/><rect x="-130" y="-104" width="90" height="20" rx="5" fill="#c8b088"/><rect x="-110" y="-60" width="220" height="130" fill="#f0ece2" opacity="0.6"/><rect x="-60" y="-40" width="120" height="44" rx="4" fill="#a82a30"/><circle cx="0" cy="-18" r="14" fill="#f0e4d0"/><path d="M-80,30 L80,30 M-80,50 L60,50" stroke="#8a8478" stroke-width="5"/></g>`;
}
function chessPiece(x, y, s, white, kind = 'pawn') {
  const c = white ? '#efe8da' : '#1c1a1a', e = white ? '#b8ae9c' : '#000';
  let g = `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="34" ry="10" fill="${shade(c, -0.2)}"/><path d="M-30,0 L-20,-24 L20,-24 L30,0 Z" fill="${V(c, 0.2, 0.3)}"/><path d="M-12,-24 L-16,-${kind === 'pawn' ? 60 : 90} L16,-${kind === 'pawn' ? 60 : 90} L12,-24 Z" fill="${V(c, 0.2, 0.3)}"/>`;
  if (kind === 'pawn') g += `<circle cx="0" cy="-74" r="20" fill="${R(c, 0.2, 0.3)}"/>`;
  else if (kind === 'king') g += `<path d="M-22,-90 L22,-90 L16,-120 L-16,-120 Z" fill="${V(c, 0.2, 0.3)}"/><rect x="-4" y="-150" width="8" height="32" fill="${c}"/><rect x="-14" y="-140" width="28" height="8" fill="${c}"/>`;
  else g += `<circle cx="0" cy="-104" r="22" fill="${R(c, 0.2, 0.3)}"/><path d="M-8,-120 L8,-92" stroke="${e}" stroke-width="5"/>`;
  return g + `</g>`;
}
// шахматная доска в перспективе: возвращает {g, pt(i,j)}
function board(cx, cy, w, d, tilt = 0.45) {
  const pt = (i, j) => { const k = j / 8, ww = w * lerp(0.62, 1, k); return [cx - ww / 2 + (i / 8) * ww, cy - d / 2 + k * d]; };
  let g = `<path d="M${pt(0, 0)} L${pt(8, 0)} L${pt(8, 8)} L${pt(0, 8)} Z" fill="#3a2414" transform="translate(0 14)"/>`;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) g += `<path d="M${pt(i, j)} L${pt(i + 1, j)} L${pt(i + 1, j + 1)} L${pt(i, j + 1)} Z" fill="${(i + j) % 2 ? '#2e2018' : '#d8c4a0'}"/>`;
  g += `<path d="M${pt(0, 0)} L${pt(8, 0)} L${pt(8, 8)} L${pt(0, 8)} Z" fill="none" stroke="#6a4424" stroke-width="10"/>`;
  return { g, pt: (i, j) => pt(i + 0.5, j + 0.5) };
}
function newspaper(x, y, s, rot, sd) {
  reseed(sd);
  let g = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#soft)"><rect x="-150" y="-200" width="300" height="400" fill="${V('#ece6d8', 0.05, 0.12)}"/><rect x="-130" y="-180" width="260" height="34" fill="#1a1a1a"/><rect x="-130" y="-130" width="260" height="18" fill="#2a2a2a"/><rect x="-130" y="-104" width="200" height="18" fill="#2a2a2a"/>`;
  g += `<rect x="-130" y="-70" width="140" height="110" fill="#8a8680"/><circle cx="-60" cy="-30" r="28" fill="#5a5650"/><path d="M-110,40 Q-60,0 -10,40 Z" fill="#5a5650"/>`;
  for (let i = 0; i < 9; i++) g += `<rect x="${i < 5 ? 24 : -130}" y="${-70 + (i < 5 ? i : i - 3) * 22}" width="${i < 5 ? 106 : 260}" height="7" fill="#9a968e"/>`;
  return g + `</g>`;
}
function tvCamera(x, y, s, onAir = 0) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><path d="M0,0 L-80,260 M0,0 L80,260 M0,0 L0,270" stroke="#2a2a2e" stroke-width="12"/><rect x="-110" y="-110" width="200" height="110" rx="12" fill="${V('#2a2c32', 0.2, 0.3)}"/><rect x="-180" y="-90" width="80" height="70" rx="8" fill="#1a1a1e"/><circle cx="-180" cy="-55" r="30" fill="#3a4a6a"/><rect x="40" y="-140" width="40" height="30" fill="#ff3a30" opacity="${0.4 + 0.6 * onAir}"/>${onAir ? glow(60, -125, 60, '#ff3a30', 0.7) : ''}</g>`;
}
function spot(x, y, tx, ty, w, c, op) { return `<path d="M${x - 20},${y} L${x + 20},${y} L${tx + w},${ty} L${tx - w},${ty} Z" fill="${grad([[0, c, op], [1, c, 0]])}"/>`; }
function rain(t, n = 70, op = 0.35) { reseed(77); let g = ''; for (let i = 0; i < n; i++) { const x = rnd() * 1200 - 60, sp = 900 + rnd() * 500, y = ((rnd() * 2200 + t * sp) % 2200) - 200; g += `<path d="M${x},${y} l-8,40" stroke="#c8d8f0" stroke-width="2" opacity="${op * (0.4 + rnd() * 0.6)}"/>`; } return g; }

const NIGHT = [[0, '#05070f'], [0.6, '#121a34'], [1, '#2a3050']];
const DAY = [[0, '#5a86b8'], [0.6, '#a8c4dc'], [1, '#e8ecf0']];

const shots = {
  // 1. Хук: крупно Слоун за столом свидетеля в Сенате, вспышки камер, над ней сенаторы и флаги
  hearing(t, T) {
    const k = ease(t / T);
    const micOn = fade(t, D + 3.1, 0.2);
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, 40, k) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#1a1412'], [0.5, '#3a2a20'], [1, '#1a1210']])}"/>`,
        // стена зала: мраморные пилястры и драпировка
        `<rect x="0" y="0" width="1080" height="900" fill="${V('#5a4636', 0.1, 0.4)}"/>`,
        ...[90, 330, 750, 990].map((x) => column(x, 120, 900, 90, '#c8bca8')),
        `<rect x="380" y="140" width="320" height="560" fill="${V('#5a1e22', 0.2, 0.4)}"/>` + [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${400 + i * 55},140 Q${420 + i * 55},420 ${400 + i * 55},700" stroke="#3a1014" stroke-width="10" fill="none" opacity="0.6"/>`).join(''),
        `<circle cx="540" cy="360" r="90" fill="${R('#c8a24a', 0.3, 0.3)}"/><circle cx="540" cy="360" r="66" fill="#3a2a1a"/><path d="M500,360 L540,320 L580,360 L540,400 Z" fill="#c8a24a"/>`,
        flag(250, 880, 420, t, 0), flag(830, 880, 420, t, 2),
        // возвышение сенаторов
        `<path d="M-40,900 L1120,900 L1120,1060 L-40,1060 Z" fill="${V('#4a2c1a', 0.2, 0.4)}"/><rect x="-40" y="890" width="1160" height="16" fill="#8a5a34"/>`,
        ...[[120, 0.32, '#3a3e48', '#b8b4ac'], [300, 0.32, '#2a2e3a', '#4a3a2a'], [780, 0.32, '#4a3a34', '#d8d4cc'], [960, 0.32, '#2e3440', '#2a2018']].map(([x, s, sh, h], i) => `<g opacity="0.85">${figure(x, 1060, s, { ...suitMan(sh, h, ['#6a1e22', '#2a3a6a', '#3a4a2a', '#5a2a5a'][i]), frown: 0.6, blink: blink(t, i) })}</g>`),
        `<rect x="-40" y="980" width="1160" height="80" fill="${V('#5a3420', 0.2, 0.35)}"/>` + [0, 1, 2, 3].map((i) => mic(120 + i * 280 - (i > 1 ? 0 : 0), 985, 0.45)).join(''),
        // публика/фотографы между
        `<rect x="0" y="1060" width="1080" height="200" fill="#120c0a"/>`,
        ...[[80, 1240, 0.75], [240, 1250, 0.7], [860, 1245, 0.75], [1010, 1240, 0.7]].map(([x, y, s], i) => photographer(x, y, s, '#0c0a0c', ((t + i * 0.7) % 1.9) < 0.1 ? 1 : 0)),
        camFlash(t + 0.3, 7, 1040, 1250, 9, 1.4),
        // Слоун крупно
        glow(540, 1180, 560, '#ffe8d0', 0.22),
        sloane(540, 2300, 1.85, { arms: 'table', look: 0, frown: 0.2, blink: blink(t, 1.1) }),
        // стол свидетеля, микрофон, табличка
        desk(1640, '#3a2214', 300),
        `<rect x="330" y="1580" width="420" height="70" rx="4" fill="${V('#e8dcc0', 0.1, 0.25)}"/><rect x="380" y="1604" width="320" height="22" fill="#2a2420" opacity="0.8"/>`,
        mic(560, 1640, 1.0, micOn),
        `<rect x="140" y="1560" width="120" height="80" rx="6" fill="#d8dce0" opacity="0.85"/><rect x="190" y="1520" width="16" height="44" fill="#c8ccd0" opacity="0.8"/>`,
        papers(880, 1700, 0.9, -8),
        grade('#ffcc99', 0.22),
        topShade(820, 0.6),
      ],
    };
  },

  // 2. Ночь, стеклянный офис, Капитолий за окном; Слоун с телефоном, часы показывают 3:07, команда за стеклом
  'office-night'(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.05, 1.15, k), x: lerp(20, -20, k) },
      els: [
        sky(NIGHT, 1400),
        `<g opacity="0.55">${skyline(1120, '#0a0e1c', 1, 3)}</g>`,
        monument(250, 1110, 520, '#a8a4a0'),
        glow(720, 900, 460, '#ffd890', 0.35),
        capitol(720, 1120, 0.85, 1, '#d8d0c0'),
        // оконные рамы
        ...[0, 270, 540, 810, 1080].map((x) => `<rect x="${x - 8}" y="0" width="16" height="1400" fill="#0c0e14"/>`),
        `<rect x="0" y="560" width="1080" height="14" fill="#0c0e14"/>`,
        `<rect width="1080" height="1400" fill="#8ab0e0" opacity="0.06"/>`,
        // отражение лампы в стекле
        `<path d="M600,0 L760,0 L560,1400 L420,1400 Z" fill="#fff" opacity="0.04"/>`,
        // пол офиса и стеклянная перегородка с командой
        `<rect x="0" y="1300" width="1080" height="620" fill="${V('#1c2230', 0.1, 0.4)}"/>`,
        ...[[150, 1420, 0.3, '#2e3a4e', '#2a1a12'], [900, 1420, 0.3, '#3a3040', '#6a4a2a']].map(([x, y, s, sh, h], i) => `<g opacity="0.55">${figure(x, y, s, { ...suitMan(sh, h, '#1a2a4a'), arms: i ? 'phone' : 'down', look: i ? -1 : 1, blink: blink(t, i + 2) })}</g>`),
        `<rect x="0" y="1100" width="1080" height="340" fill="#9ac0f0" opacity="0.07"/><rect x="0" y="1100" width="1080" height="6" fill="#8aa8d0" opacity="0.4"/>`,
        clock(930, 230, 70, 3 + (7 + t * 2) / 60, 7 + t * 2),
        // Слоун
        glow(540, 1250, 520, '#ffe4c8', 0.2),
        sloane(520, 2240, 1.55, { arms: 'phone', look: 0.6, frown: 0.35, blink: blink(t, 0.5) }),
        // стол на переднем плане
        desk(1700, '#22262e', 260),
        papers(220, 1680, 1.0, 8, 4), papers(260, 1640, 0.9, -6, 3),
        coffee(760, 1700, 1.1), coffee(860, 1712, 1.0), coffee(820, 1690, 0.9),
        phone(950, 1760, 0.8, wave(t, 1.2) > 0.3 ? 1 : 0), phone(620, 1770, 0.7, 1),
        lamp(110, 1700, 1.0),
        grade('#7aa0e0', 0.25),
        topShade(800, 0.6),
      ],
    };
  },

  // 3. Переговорная в тёмном дереве: лоббист оружейного лобби двигает папку с законопроектом; ружья и олень на стене
  'lobby-offer'(t, T) {
    const k = ease(t / T), slide = ease(clamp((t - D - 2.0) / 1.2));
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, 30, k) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#3a2214', 0.1, 0.5)}"/>`,
        ...[0, 1, 2, 3, 4].map((i) => `<rect x="${i * 220 + 20}" y="80" width="180" height="900" rx="6" fill="none" stroke="#24140a" stroke-width="10"/><rect x="${i * 220 + 40}" y="100" width="140" height="860" fill="${V('#4a2c18', 0.15, 0.3)}"/>`),
        `<rect x="0" y="980" width="1080" height="24" fill="#6a4024"/>`,
        lamp(120, 1010, 0.9), glow(220, 840, 300, '#ffc070', 0.35),
        deerHead(540, 360, 1.1),
        rifleRack(540, 860, 1.2),
        glow(540, 600, 520, '#ffb060', 0.15),
        // картина в раме / окно с жалюзи
        `<rect x="820" y="180" width="200" height="300" fill="#c8a868" opacity="0.4"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="820" y="${190 + i * 36}" width="200" height="16" fill="#2a1a10" opacity="0.6"/>`).join(''),
        // лоббист за столом
        figure(540, 1720, 1.0, { ...GUNMAN, arms: 'table', look: -0.2, blink: blink(t, 0.8) }),
        `<rect x="-40" y="1340" width="1160" height="600" fill="${V('#2a160c', 0.25, 0.45)}"/><rect x="-40" y="1340" width="1160" height="10" fill="#7a4a2a"/>`,
        `<path d="M0,1400 Q540,1380 1080,1420" stroke="#ffc888" stroke-width="40" opacity="0.06" fill="none"/>`,
        `<circle cx="400" cy="1330" r="27" fill="${R('#d8a888')}"/><circle cx="680" cy="1330" r="27" fill="${R('#d8a888')}"/>`,
        // стаканы с виски
        `<path d="M820,1380 L880,1380 L874,1460 L826,1460 Z" fill="#c8d8e0" opacity="0.5"/><rect x="828" y="1420" width="44" height="38" fill="#c87a2a" opacity="0.8"/>`,
        folder(lerp(560, 600, slide), lerp(1420, 1560, slide), lerp(0.9, 1.35, slide), lerp(0, -6, slide)),
        sloaneOverShoulder(130, 1700, 1.05),
        grade('#ffa060', 0.25),
        topShade(820, 0.6),
      ],
    };
  },

  // 4. Слоун смеётся и уходит по стеклянному коридору, команда поднимается следом; впереди — свет другой фирмы
  walkout(t, T) {
    const k = ease(t / T), go = ease(clamp((t - D - 1.6) / 1.6)), door = fade(t, D + 2.0, 0.8);
    const vp = [540, 900];
    return {
      cam: { z: lerp(1.0, 1.08, k) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#0e1422'], [0.5, '#1c2a40'], [1, '#0c1018']])}"/>`,
        // дальняя дверь со светом
        `<rect x="470" y="780" width="140" height="250" fill="${V('#fff2d8', 0, 0.1)}" opacity="${0.35 + 0.65 * door}"/>`, glow(540, 900, 300 + 300 * door, '#fff0d0', 0.3 + 0.5 * door),
        // стены коридора (стекло) в перспективе
        `<path d="M0,0 L470,780 L470,1030 L0,1920 Z" fill="${V('#20304a', 0.15, 0.3)}" opacity="0.9"/><path d="M1080,0 L610,780 L610,1030 L1080,1920 Z" fill="${V('#20304a', 0.15, 0.3)}" opacity="0.9"/>`,
        ...[0.2, 0.42, 0.62, 0.8].map((f) => `<path d="M${lerp(0, 470, f)},${lerp(0, 780, f)} L${lerp(0, 470, f)},${lerp(1920, 1030, f)}" stroke="#8ab0d8" stroke-width="${10 * (1 - f) + 2}" opacity="0.5"/><path d="M${lerp(1080, 610, f)},${lerp(0, 780, f)} L${lerp(1080, 610, f)},${lerp(1920, 1030, f)}" stroke="#8ab0d8" stroke-width="${10 * (1 - f) + 2}" opacity="0.5"/>`),
        `<path d="M0,1920 L470,1030 L610,1030 L1080,1920 Z" fill="${V('#2a3040', 0.1, 0.35)}"/>`,
        `<path d="M540,1030 L540,1920" stroke="#fff" stroke-width="80" opacity="${0.05 + 0.08 * door}"/>`,
        ...[0.15, 0.35, 0.55].map((f) => `<rect x="${lerp(470, 0, f) + 20}" y="${lerp(780, 0, f)}" width="${lerp(140, 1080, f) - 40}" height="${8 + 10 * f}" fill="#d8e8ff" opacity="0.25"/>`),
        // команда за ней (силуэты, встают)
        ...[[330, 1500, 0.42, '#2a3446', '#3a2a1a'], [760, 1510, 0.42, '#3a3a44', '#1a1410'], [180, 1600, 0.5, '#343a48', '#7a5a30']].map(([x, y, s, sh, h], i) => `<g opacity="0.8" transform="translate(0 ${(1 - ease(clamp((t - D - 1.9 - i * 0.2) / 0.6))) * 120})">${figure(x, y, s, { ...suitMan(sh, h, '#2a2a4a'), look: x > 540 ? -1 : 1, blink: blink(t, i) })}</g>`),
        // Слоун идёт на камеру, смеётся
        shadow(540, lerp(1880, 1960, go), 220, 0.35),
        glow(540, 1200, 520, '#ffe8d0', 0.15),
        sloane(540, lerp(2200, 2320, go), lerp(1.45, 1.6, go), { smile: t < D + 1.9, closed: t > D + 0.55 && t < D + 1.3, look: 0, frown: t < D + 1.9 ? -0.3 : 0.2, blink: blink(t, 1.7), step: wave(t, 1.6) * go }),
        grade('#ffd8b0', 0.15 + 0.15 * door),
        topShade(760, 0.55),
      ],
    };
  },

  // 5. Капитолий днём; табло голосов, где «за» не дотягивает до черты; деньги и силуэты лоббистов, башня бывшей фирмы
  capitol(t, T) {
    const k = ease(t / T), bar = ease(clamp((t - D - 4.8) / 1.3));
    const showMoney = fade(t, D + 1.8, 0.4), showSen = fade(t, D + 2.9, 0.4);
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -30, k) },
      els: [
        sky(DAY, 1400),
        glow(820, 300, 380, '#fff8e8', 0.6),
        `<g filter="url(#blur8)">${[0, 1, 2, 3].map((i) => `<ellipse cx="${(i * 340 + t * 8) % 1400 - 160}" cy="${380 + i * 70}" rx="230" ry="34" fill="#fff" opacity="0.6"/>`).join('')}</g>`,
        // стеклянная башня бывшей фирмы
        `<rect x="800" y="380" width="260" height="900" fill="${grad([[0, '#2a4a6a'], [0.5, '#6a8aaa'], [1, '#1a2a40']], false)}"/>` + [...Array(18)].map((_, i) => `<rect x="800" y="${400 + i * 48}" width="260" height="4" fill="#0e1a2a" opacity="0.6"/>`).join('') + [0, 1, 2, 3].map((i) => `<rect x="${800 + i * 65}" y="380" width="3" height="900" fill="#0e1a2a" opacity="0.5"/>`).join(''),
        `<path d="M800,380 L1060,380 L1000,320 L860,320 Z" fill="#1a2a40"/>`,
        capitol(460, 1290, 1.0, 0, '#ece6da'),
        `<rect x="0" y="1280" width="1080" height="640" fill="${V('#6a8a4a', 0.1, 0.4)}"/>`,
        `<path d="M300,1290 L620,1290 L900,1920 L40,1920 Z" fill="${V('#d8d0c0', 0.1, 0.3)}"/>` + [...Array(8)].map((_, i) => `<path d="M${lerp(300, 40, i / 8)},${1290 + i * 80} L${lerp(620, 900, i / 8)},${1290 + i * 80}" stroke="#a8a090" stroke-width="3"/>`).join(''),
        ...[[60, 1500], [1010, 1520]].map(([x, y]) => `<circle cx="${x}" cy="${y - 150}" r="130" fill="${R('#3a5a2a', 0.2, 0.3)}"/><rect x="${x - 10}" y="${y - 40}" width="20" height="60" fill="#3a2a1a"/>`),
        // силуэты лоббистов с кейсами денег
        `<g opacity="${showMoney}">${[[170, 1880, 0.95], [920, 1900, 1.0]].map(([x, y, s], i) => figure(x, y, s, { ...suitMan('#1a1a1e', '#1a1a1e', '#1a1a1e'), sil: silFilter('#0c0d12') })).join('')}${briefcase(200, 1840 - 10 * showMoney, 0.9, 1)}${briefcase(880, 1850 - 10 * showMoney, 0.9, 1)}</g>`,
        // сенаторы — непробиваемый ряд
        `<g opacity="${showSen}" transform="translate(0 ${(1 - showSen) * 40})">${[[400, 1720], [540, 1740], [680, 1720]].map(([x, y], i) => figure(x, y, 0.55, { ...suitMan(['#3a3e48', '#2e2a2a', '#3a4048'][i], ['#d8d4cc', '#b8b4ac', '#5a4a3a'][i], '#6a1e22'), frown: 0.8, blink: blink(t, i * 0.7) })).join('')}</g>`,
        // табло голосов
        `<g transform="translate(540 1250) scale(0.85)"><rect x="-330" y="-60" width="660" height="120" rx="16" fill="#0c1018" opacity="0.85"/><rect x="-300" y="-24" width="600" height="48" rx="10" fill="#1e2636"/><rect x="-300" y="-24" width="${lerp(220, 520, bar)}" height="48" rx="10" fill="${V('#3a9a5a', 0.25, 0.2)}"/><rect x="${-300 + 600 * 0.6 - 3}" y="-44" width="6" height="88" fill="#ff4a3a"/>${glow(-300 + 600 * 0.6, 0, 50, '#ff4a3a', 0.6)}</g>`,
        grade('#ffe8c0', 0.15),
        topShade(820, 0.65),
      ],
    };
  },

  // 6. Монтаж грязной войны: телестудия → газеты → вспышки камер; Слоун оглядывается, за спиной тени
  'dirty-war'(t, T) {
    const k = ease(t / T), ph = t < D + 1.9 ? 0 : t < D + 3.6 ? 1 : 2;
    const sh = fade(t, D + 3.6, 1.6);
    let bg;
    if (ph === 0) bg = [
      `<rect width="1080" height="1920" fill="${grad([[0, '#060814'], [1, '#1a2040']])}"/>`,
      spot(200, 0, 540, 1500, 360, '#cfe0ff', 0.25), spot(880, 0, 540, 1500, 360, '#cfe0ff', 0.25),
      `<rect x="0" y="700" width="1080" height="500" fill="${grad([[0, '#1a3a8a'], [1, '#0a1a4a']], false)}" opacity="0.6"/>` + [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${60 + i * 170}" y="760" width="140" height="90" fill="#4a8ae8" opacity="${0.25 + 0.2 * wave(t, 2, i)}"/>`).join(''),
      tvCamera(140, 1450, 1.1, 1), tvCamera(960, 1470, 1.0, 0),
    ];
    else if (ph === 1) bg = [
      `<rect width="1080" height="1920" fill="${V('#2a2620', 0.1, 0.4)}"/>`,
      ...[[200, 900, -12, 1], [860, 960, 10, 2], [140, 1500, 8, 3], [940, 1560, -9, 4], [540, 820, 3, 5]].map(([x, y, r, sd], i) => newspaper(x, y + (1 - fade(t, D + 1.9 + i * 0.12, 0.3)) * -300, 1.05, r, sd)),
    ];
    else bg = [
      `<rect width="1080" height="1920" fill="${grad([[0, '#0a0c16'], [1, '#2a2e3c']])}"/>`, capitol(540, 1150, 0.9, 1, '#a8a49c'),
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="-40" y="${1150 + i * 78}" width="1160" height="44" fill="#4a4c58"/><rect x="-40" y="${1150 + i * 78}" width="1160" height="4" fill="#9a9cb0" opacity="0.5"/>`),
      ...[[90, 1700, 0.9], [260, 1640, 0.8], [830, 1650, 0.8], [1000, 1700, 0.9]].map(([x, y, s], i) => photographer(x, y, s, '#22242e', ((t + i * 0.35) % 0.9) < 0.12 ? 1 : 0)),
      camFlash(t, 9, 1000, 1500, 13, 2),
    ];
    return {
      cam: { z: lerp(1.0, 1.12, k) },
      els: [
        ...bg,
        // тени за спиной
        `<g opacity="${0.3 + 0.6 * sh}">${[[300, 1900, 1.25], [800, 1920, 1.3]].map(([x, y, s]) => `<g filter="url(#blur4)">${figure(x + (x < 540 ? -1 : 1) * (1 - sh) * 120, y, s, { ...suitMan('#000', '#000', '#000'), sil: silFilter('#04040a') })}</g>`).join('')}</g>`,
        glow(540, 1250, 480, '#ffe0c8', 0.18),
        sloane(540, 2260, 1.5, { arms: 'down', look: ph === 2 ? -1 : ph === 1 ? 1 : 0, frown: 0.55, worried: ph === 2, blink: blink(t, 0.4) }),
        ph === 0 ? grade('#5a8aff', 0.3) : ph === 1 ? grade('#ffd8a0', 0.2) : grade('#a0b0ff', 0.2),
        topShade(800, 0.6),
      ],
    };
  },

  // 7. Шахматы под лампой: ход как будто ошибочный — фигура падает; камера отъезжает — нити к фото сенаторов на стене
  chess(t, T) {
    const fall = ease(clamp((t - D - 1.5) / 0.4)), reveal = ease(clamp((t - D - 3.2) / 1.5));
    const B = board(540, 1560, 760, 360);
    const piece = (i, j, w, kind = 'pawn', s = 0.9) => { const [x, y] = B.pt(i, j); return chessPiece(x, y, s * lerp(0.75, 1, j / 7), w, kind); };
    const moveK = ease(clamp((t - D - 0.3) / 1.0));
    const [ax, ay] = B.pt(3, 5), [bx, by] = B.pt(3, 3);
    const strings = [[160, 300], [360, 240], [720, 250], [920, 320], [260, 600], [840, 620]];
    return {
      cam: { z: lerp(1.25, 1.0, reveal), y: lerp(-120, 0, reveal) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#20262a', 0.1, 0.5)}"/>`,
        // стена-доска с фото и нитями
        `<rect x="40" y="140" width="1000" height="700" fill="${V('#5a4a3a', 0.1, 0.3)}"/>`,
        ...strings.map(([x, y], i) => `<g transform="rotate(${(i % 2 ? 4 : -3)} ${x} ${y})"><rect x="${x - 60}" y="${y - 74}" width="120" height="150" fill="#f0ece2"/><rect x="${x - 50}" y="${y - 64}" width="100" height="110" fill="#6a6a70"/><circle cx="${x}" cy="${y - 20}" r="24" fill="#3a3a40"/><path d="M${x - 40},${y + 46} Q${x},${y} ${x + 40},${y + 46} Z" fill="#3a3a40"/></g><circle cx="${x}" cy="${y - 82}" r="9" fill="#c82a2a"/>`),
        `<g opacity="${reveal}">${strings.map(([x, y]) => `<path d="M${x},${y - 82} L${bx},${by - 80}" stroke="#c82a2a" stroke-width="3" opacity="0.8"/>`).join('')}</g>`,
        lamp(980, 1240, 1.2), glow(540, 1350, 560, '#ffd890', 0.4),
        // Слоун за доской
        sloane(540, 1720, 1.05, { arms: 'table', look: 0, frown: 0.1 + 0.15 * reveal, blink: blink(t, 0.6) }),
        `<rect x="-40" y="1320" width="1160" height="620" fill="${V('#3a2414', 0.15, 0.5)}"/>`,
        B.g,
        ...[[0, 0, 'rook'], [2, 1], [5, 1], [6, 0, 'king'], [1, 2], [7, 1]].map(([i, j, kd]) => piece(i, j, false, kd || 'pawn')),
        ...[[0, 7, 'rook'], [4, 7, 'king'], [6, 6], [1, 6], [5, 5]].map(([i, j, kd]) => piece(i, j, true, kd || 'pawn')),
        // фигура, которую двигают, и падающая белая
        (() => { const [px, py] = B.pt(5, 4); return `<g transform="rotate(${fall * 80} ${px + 20} ${py})">${chessPiece(px, py, 0.82, true, 'rook')}</g>`; })(),
        chessPiece(lerp(ax, bx, moveK), lerp(ay, by, moveK) - Math.sin(moveK * Math.PI) * 60, lerp(0.9, 0.82, moveK), true, 'rook'),
        `<circle cx="${lerp(ax, bx, moveK) + 40}" cy="${lerp(ay, by, moveK) - 150 - Math.sin(moveK * Math.PI) * 60}" r="${30 * (1 - fade(t, D + 1.4, 0.3))}" fill="${R('#f2cdb4')}"/>`,
        grade('#ffc890', 0.25),
        topShade(760, 0.55),
      ],
    };
  },

  // 8. Ночь, мокрые ступени Капитолия; Слоун поднимается спиной к нам, наверху в контровом свете — тёмная фигура
  steps(t, T) {
    const k = ease(t / T), who = fade(t, D + 3.0, 0.7);
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, 60, k) },
      els: [
        sky(NIGHT, 1100), `<rect x="0" y="840" width="1080" height="1080" fill="#1c1c26"/>`,
        capitol(540, 820, 0.8, 1, '#cfc8ba'),
        glow(540, 700, 520, '#ffe4b0', 0.35 + 0.25 * who),
        // ступени в перспективе
        ...[...Array(16)].map((_, i) => { const f = i / 15, y = lerp(860, 1920, f * f), w = lerp(360, 1300, f); return `<rect x="${540 - w / 2}" y="${y}" width="${w}" height="${lerp(10, 70, f)}" fill="${V('#4a4a56', 0.15, 0.3)}"/><rect x="${540 - w / 2}" y="${y}" width="${w}" height="${lerp(2, 6, f)}" fill="#c8c8d8" opacity="0.45"/>`; }),
        `<path d="M540,860 L640,1920 L440,1920 Z" fill="#ffe4b0" opacity="0.08"/>`,
        ...[[300, 1060], [780, 1060]].map(([x, y]) => `<rect x="${x - 8}" y="${y - 260}" width="16" height="260" fill="#1a1a20"/>${glow(x, y - 270, 90, '#ffd890', 0.8)}<circle cx="${x}" cy="${y - 270}" r="16" fill="#fff2c8"/>`),
        // фигура наверху
        `<g opacity="${who}">${glow(540, 980, 220, '#fff', 0.5 * who)}${figure(540, 1000, 0.26, { ...suitMan('#000', '#000', '#000'), sil: silFilter('#06060a') })}<path d="M540,1000 L480,1300 L600,1300 Z" fill="#000" opacity="${0.3 * who}"/></g>`,
        rain(t, 80, 0.3),
        // Слоун поднимается
        sloaneBack(540, lerp(2000, 1940, k), 1.2, wave(t, 0.9)),
        `<ellipse cx="540" cy="1900" rx="200" ry="30" fill="#ffe4b0" opacity="0.08"/>`,
        grade('#6a8aff', 0.25),
        topShade(760, 0.6),
      ],
    };
  },
};

run(shots);
