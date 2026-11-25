// «Предложение» (The Offer, 2022) — 8 сцен в 2D-векторе. Имя плана = set сцены в videos/the-offer/script.json.
// Голливуд и Нью-Йорк 1970–71: янтарь и сигарный дым в кабинетах, ночной неон и мокрый асфальт, красные скатерти.
import { run, person, setProportions, V, R, grad, glow, silFilter, smoke, rnd, reseed, shade, lerp, ease, clamp, wave } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// ---------- персонажи ----------
const RUDDY = { shirt: '#c7b089', pants: '#a8916a', skin: '#e8b896', hair: '#4a2e1c', iris: '#4a3624', beard: false, frown: 0.1, suit: true, tie: '#a4542a', burns: true, shades: true };
const COLOMBO = { shirt: '#23242b', pants: '#1c1d22', skin: '#d8a482', hair: '#2a2420', iris: '#2a1a12', beard: false, frown: 0.55, suit: true, tie: '#5a1a1e', grey: true, ring: true };
const EVANS = { shirt: '#3a3e48', pants: '#2c3038', skin: '#c88e64', hair: '#1c1612', iris: '#2a1a12', beard: false, frown: 0.2, suit: true, tie: '#7a2a1e', glasses: '#5a3a1a' };
const BOSS = (c, h, tie) => ({ shirt: c, pants: shade(c, -0.15), skin: '#dcae8c', hair: h, beard: false, frown: 0.45, suit: true, tie, grey: true });
const COPPOLA = { shirt: '#6a6a3c', pants: '#5a5a34', skin: '#e2b08c', hair: '#2a1e16', iris: '#2a1a12', beard: true, frown: 0.4, glasses: '#1a1a1a', jacket: true };
const GOON = { shirt: '#1a1b20', pants: '#141418', skin: '#cfa080', hair: '#1a1614', beard: false, frown: 0.6, suit: true, tie: '#1a1a1a', fedora: '#202126' };

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const D = 0.13; // AUDIO_DELAY
const fade = (t, a, d = 0.35) => ease(clamp((t - a - D) / d));
const io = (k) => ease(clamp(k));
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;

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
  const sh = o.shirt, dk = shade(sh, -0.4), lt = shade(sh, 0.22);
  let b = '', front = '';
  if (o.suit) {
    // рубашка, широкий галстук 70-х, широкие лацканы
    b += `<path d="M${x - 44 * s},${top - 6 * s} L${x},${top + 135 * s} L${x + 44 * s},${top - 6 * s} Z" fill="${o.tie === '#1a1a1a' ? '#3a3a40' : '#efe8da'}"/>`;
    b += `<path d="M${x - 16 * s},${top + 8 * s} L${x + 16 * s},${top + 8 * s} L${x + 24 * s},${top + 112 * s} L${x},${top + 136 * s} L${x - 24 * s},${top + 112 * s} Z" fill="${V(o.tie, 0.25, 0.25)}"/><path d="M${x - 16 * s},${top - 2 * s} L${x + 16 * s},${top - 2 * s} L${x + 10 * s},${top + 16 * s} L${x - 10 * s},${top + 16 * s} Z" fill="${shade(o.tie, -0.2)}"/>`;
    b += `<path d="M${x - 66 * s},${top - 10 * s} L${x - 4 * s},${top + 145 * s} L${x - 36 * s},${top + 152 * s} L${x - 108 * s},${top + 36 * s} Z M${x + 66 * s},${top - 10 * s} L${x + 4 * s},${top + 145 * s} L${x + 36 * s},${top + 152 * s} L${x + 108 * s},${top + 36 * s} Z" fill="${V(lt, 0.15, 0.25)}"/>`;
    b += `<path d="M${x},${top + 145 * s} L${x},${ty}" stroke="${dk}" stroke-width="${3 * s}"/>` + [0, 1].map((i) => `<circle cx="${x + 8 * s}" cy="${top + (178 + i * 40) * s}" r="${6 * s}" fill="${dk}"/>`).join('');
    b += `<path d="M${x + 46 * s},${top + 92 * s} L${x + 86 * s},${top + 88 * s}" stroke="${dk}" stroke-width="${3 * s}"/><path d="M${x + 52 * s},${top + 88 * s} l${10 * s},${-14 * s} l${8 * s},${10 * s} l${10 * s},${-10 * s} l${4 * s},${14 * s} Z" fill="${o.ring ? '#8a1e22' : '#efe8da'}"/>`;
  }
  if (o.jacket) {
    // полевая куртка с карманами, клетчатая рубашка
    b += `<path d="M${x - 44 * s},${top - 6 * s} L${x},${top + 120 * s} L${x + 44 * s},${top - 6 * s} Z" fill="#c8c0a8"/>` + [0, 1, 2].map((i) => `<path d="M${x - 30 * s + i * 20 * s},${top} L${x - 10 * s + i * 10 * s},${top + 90 * s}" stroke="#8a6a4a" stroke-width="${3 * s}"/>`).join('');
    [-1, 1].forEach((sd) => b += `<rect x="${x + sd * 60 * s - 28 * s}" y="${top + 70 * s}" width="${56 * s}" height="${50 * s}" rx="${6 * s}" fill="${shade(sh, -0.12)}" stroke="${dk}" stroke-width="${2 * s}"/><rect x="${x + sd * 60 * s - 28 * s}" y="${top + 160 * s}" width="${56 * s}" height="${56 * s}" rx="${6 * s}" fill="${shade(sh, -0.12)}" stroke="${dk}" stroke-width="${2 * s}"/>`);
  }
  if (o.burns) front += [-1, 1].map((sd) => `<path d="M${x + sd * hr * 0.92},${headY - hr * 0.35} Q${x + sd * hr * 0.98},${headY + hr * 0.3} ${x + sd * hr * 0.8},${headY + hr * 0.55} L${x + sd * hr * 0.7},${headY + hr * 0.3} Q${x + sd * hr * 0.78},${headY} ${x + sd * hr * 0.76},${headY - hr * 0.35} Z" fill="${o.hair}"/>`).join('');
  if (o.burns) front += `<path d="M${x - hr * 0.9},${headY - hr * 0.5} Q${x - hr * 0.2},${headY - hr * 1.25} ${x + hr * 0.95},${headY - hr * 0.55} Q${x + hr * 0.3},${headY - hr * 0.8} ${x - hr * 0.9},${headY - hr * 0.5} Z" fill="${shade(o.hair, 0.1)}"/>`;
  if (o.grey) front += [-1, 1].map((sd) => `<path d="M${x + sd * hr * 0.96},${headY - hr * 0.45} L${x + sd * hr * 0.9},${headY + hr * 0.1}" stroke="#b8b2a8" stroke-width="${hr * 0.1}" stroke-linecap="round"/>`).join('');
  const lk = o.look || 0;
  if (o.shades) {
    // тёмные очки подняты на лоб
    front += [-1, 1].map((sd) => `<ellipse cx="${x + sd * 34 * hs}" cy="${headY - hr * 0.62}" rx="${26 * hs}" ry="${18 * hs}" fill="${grad([[0, '#3a2a1a'], [1, '#120c08']])}" stroke="#c8a050" stroke-width="${3 * hs}"/>`).join('') + `<path d="M${x - 10 * hs},${headY - hr * 0.66} Q${x},${headY - hr * 0.72} ${x + 10 * hs},${headY - hr * 0.66}" stroke="#c8a050" stroke-width="${3 * hs}" fill="none"/>`;
  }
  if (o.glasses) {
    const c = o.glasses;
    [-1, 1].forEach((sd) => { const ex = x + sd * 34 * hs + lk * 8 * hs; front += `<rect x="${ex - 26 * hs}" y="${ey - 21 * hs}" width="${52 * hs}" height="${42 * hs}" rx="${10 * hs}" fill="${c}" fill-opacity="${c === '#1a1a1a' ? 0.08 : 0.35}" stroke="${c === '#1a1a1a' ? c : '#c8a050'}" stroke-width="${5 * hs}"/>`; });
    front += `<path d="M${x - 9 * hs + lk * 8 * hs},${ey - 6 * hs} Q${x + lk * 8 * hs},${ey - 14 * hs} ${x + 9 * hs + lk * 8 * hs},${ey - 6 * hs}" stroke="${c === '#1a1a1a' ? c : '#c8a050'}" stroke-width="${4 * hs}" fill="none"/>`;
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
const ruddy = (x, y, s, o = {}) => figure(x, y, s, { ...RUDDY, ...o });
const goonSil = (x, y, s, c = '#050507') => figure(x, y, s, { ...GOON, sil: silFilter(c) });

// ---------- реквизит ----------
// киносъёмочная камера 70-х: корпус, бленда, две бобины сверху, штатив
function filmCamera(x, y, s, spin = 0, tripod = true) {
  const reel = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="82" fill="${V('#2a2a2e', 0.25, 0.3)}"/><circle cx="${cx}" cy="${cy}" r="66" fill="#1a1a1e"/>` + [0, 1, 2].map((i) => `<path d="M${cx},${cy} L${cx + 60 * Math.cos(spin + i * 2.09)},${cy + 60 * Math.sin(spin + i * 2.09)}" stroke="#3a3a40" stroke-width="16"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="14" fill="#8a8a90"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">
    ${tripod ? `<path d="M0,40 L-170,520 M0,40 L170,520 M0,40 L0,520" stroke="${V('#3a3026', 0.2, 0.3)}" stroke-width="22" stroke-linecap="round"/><rect x="-60" y="20" width="120" height="40" rx="8" fill="#26262a"/>` : ''}
    ${reel(-70, -250)}${reel(90, -250)}
    <rect x="-160" y="-170" width="300" height="200" rx="18" fill="${V('#3a3c42', 0.25, 0.35)}"/>
    <rect x="-140" y="-150" width="110" height="70" rx="8" fill="#26272c"/><circle cx="60" cy="-70" r="30" fill="#1e1f24" stroke="#5a5c62" stroke-width="6"/>
    <rect x="140" y="-130" width="80" height="120" rx="10" fill="${V('#2a2b30', 0.2, 0.3)}"/>
    <path d="M220,-140 L330,-170 L330,20 L220,-10 Z" fill="${V('#1e1f22', 0.2, 0.3)}"/>
    <ellipse cx="330" cy="-75" rx="22" ry="95" fill="#0c0c10"/><ellipse cx="326" cy="-75" rx="12" ry="60" fill="${grad([[0, '#6a8ab0'], [1, '#1a2230']])}"/>
    <rect x="-230" y="-120" width="70" height="40" rx="10" fill="#2a2b30"/><circle cx="-232" cy="-100" r="26" fill="#1a1a1e"/>
  </g>`;
}
// хлопушка с надписью мелом
function clapper(x, y, s, rot = 0, open = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#soft)">
    <rect x="-150" y="-100" width="300" height="200" rx="8" fill="${V('#1e1e22', 0.15, 0.3)}"/>
    <g transform="rotate(${-open * 24} -150 -100)"><rect x="-150" y="-148" width="300" height="46" rx="4" fill="#f0ece2"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${-130 + i * 60},-148 l30,0 l-20,46 l-30,0 Z" fill="#141418"/>`).join('')}</g>
    <rect x="-150" y="-96" width="300" height="40" fill="#f0ece2"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${-130 + i * 60},-96 l30,0 l20,40 l-30,0 Z" fill="#141418"/>`).join('')}
    <line x1="-140" y1="-10" x2="140" y2="-10" stroke="#d8d4cc" stroke-width="3" opacity="0.7"/><line x1="0" y1="-10" x2="0" y2="90" stroke="#d8d4cc" stroke-width="3" opacity="0.7"/>
    <text x="0" y="-22" font-family="'Comic Sans MS', 'Segoe Print', cursive" font-size="26" fill="#e8e4da" text-anchor="middle" opacity="0.8">kinoplot.film</text>
    <text x="-70" y="45" font-family="cursive" font-size="32" fill="#e8e4da" text-anchor="middle" opacity="0.75">1</text><text x="70" y="45" font-family="cursive" font-size="32" fill="#e8e4da" text-anchor="middle" opacity="0.75">7</text>
  </g>`;
}
// софит на стойке
function spot(x, y, s, aim = 0, on = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">
    <path d="M0,0 L-90,420 M0,0 L90,420 M0,0 L0,420" stroke="#2a2a2e" stroke-width="12"/>
    <g transform="rotate(${aim})"><rect x="-80" y="-150" width="160" height="130" rx="20" fill="${V('#2e2f34', 0.2, 0.35)}"/><ellipse cx="0" cy="-20" rx="76" ry="22" fill="${on ? '#fff4d8' : '#3a3a40'}"/>${on ? glow(0, 0, 160, '#ffe2a8', 0.6 * on) : ''}</g></g>`;
}
function lightCone(x, y, w0, w1, h, c = '#ffe2a8', op = 0.35) {
  return `<path d="M${x - w0},${y} L${x - w1},${y + h} L${x + w1},${y + h} L${x + w0},${y} Z" fill="${grad([[0, c, op], [1, c, 0]])}"/>`;
}
function hangLamp(x, y, s, on = 1) {
  return `<line x1="${x}" y1="-20" x2="${x}" y2="${y}" stroke="#0a0a0c" stroke-width="5"/>` + lightCone(x, y + 30 * s, 50 * s, 520, 1300, '#ffd9a0', 0.42 * on) + `<path d="M${x - 80 * s},${y + 40 * s} Q${x},${y - 34 * s} ${x + 80 * s},${y + 40 * s} Z" fill="${V('#2a2a24', 0.25, 0.3)}"/>${glow(x, y + 46 * s, 220 * s, '#ffc77a', 0.8 * on)}<ellipse cx="${x}" cy="${y + 40 * s}" rx="${38 * s}" ry="${9 * s}" fill="#fff0c8"/>`;
}
function palm(x, y, h, sw = 0, c = '#1e3a2a') {
  let g = `<path d="M${x},${y} Q${x + 18},${y - h * 0.5} ${x + 10 + sw * 6},${y - h}" stroke="${shade(c, -0.1)}" stroke-width="${h * 0.04}" fill="none"/>`;
  for (let i = 0; i < 8; i++) { const a = -Math.PI + i * Math.PI / 7 + sw * 0.05, l = h * 0.32; const ex = x + 10 + sw * 6 + Math.cos(a) * l, ey = y - h + Math.sin(a) * l * 0.5 + l * 0.35; g += `<path d="M${x + 10 + sw * 6},${y - h} Q${(x + 10 + ex) / 2},${y - h - l * 0.25} ${ex},${ey}" stroke="${c}" stroke-width="${h * 0.035}" fill="none" stroke-linecap="round"/>`; }
  return g;
}
function waterTower(x, y, s, c = '#c8b898') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60,0 L-40,-160 M60,0 L40,-160 M-50,-80 L50,-80 M-55,-40 L45,-120" stroke="${shade(c, -0.35)}" stroke-width="7"/><rect x="-70" y="-260" width="140" height="110" rx="8" fill="${V(c, 0.15, 0.3)}"/><path d="M-80,-260 L0,-310 L80,-260 Z" fill="${shade(c, -0.25)}"/></g>`;
}
// логотип студии: гора в кольце звёзд и подпись
function paramount(x, y, s, op = 1) {
  let st = '';
  for (let i = 0; i < 22; i++) { const a = Math.PI * (1.05 + i * 0.9 / 21), r = 230; const sx = Math.cos(a) * r, sy = Math.sin(a) * r * 0.7 + 30; st += `<path d="M${sx},${sy - 12} L${sx + 4},${sy - 3} L${sx + 13},${sy - 3} L${sx + 6},${sy + 3} L${sx + 9},${sy + 12} L${sx},${sy + 6} L${sx - 9},${sy + 12} L${sx - 6},${sy + 3} L${sx - 13},${sy - 3} L${sx - 4},${sy - 3} Z" fill="#f4e8c8"/>`; }
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}">${glow(0, 0, 320, '#ffe2a8', 0.25)}
    <path d="M-220,110 L-90,-90 L-40,-30 L10,-150 L120,-10 L150,-40 L220,110 Z" fill="${V('#6a7ca0', 0.3, 0.3)}"/><path d="M10,-150 L-20,-80 L20,-60 L45,-110 Z" fill="#e8eef8" opacity="0.8"/>${st}
    <text x="0" y="200" font-family="'Brush Script MT', 'Segoe Script', cursive" font-style="italic" font-size="96" fill="#f8f2e0" text-anchor="middle" stroke="#2a2a3a" stroke-width="2">Paramount</text></g>`;
}
// узнаваемая обложка романа: чёрная, рука кукловода с нитями, белое название
function godfatherBook(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#soft)">
    <rect x="-150" y="-220" width="300" height="440" rx="6" fill="#0c0c0e"/><rect x="-150" y="-220" width="20" height="440" fill="#1e1e22"/>
    <text x="10" y="-140" font-family="'Times New Roman', serif" font-size="58" fill="#f2f0ea" text-anchor="middle" letter-spacing="2">THE</text>
    <text x="10" y="-80" font-family="'Times New Roman', serif" font-size="46" fill="#f2f0ea" text-anchor="middle" letter-spacing="3">GODFATHER</text>
    <path d="M-60,-40 Q-20,-62 30,-48 Q70,-40 80,-20 L60,-14 Q30,-30 0,-26 L-20,0 Q-40,10 -60,-10 Z" fill="#f2f0ea"/>
    ${[-50, -20, 10, 40, 66].map((dx, i) => `<line x1="${dx}" y1="${-30 + (i % 2) * 6}" x2="${dx + (i - 2) * 10}" y2="150" stroke="#f2f0ea" stroke-width="2"/>`).join('')}
    <path d="M-10,150 l20,0 l-6,40 l-8,0 Z" fill="#f2f0ea"/>
    <text x="10" y="205" font-family="'Times New Roman', serif" font-size="26" fill="#c8c4bc" text-anchor="middle" letter-spacing="4">MARIO PUZO</text></g>`;
}
function typewriter(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><path d="M-150,0 L-120,-110 L120,-110 L150,0 Z" fill="${V('#2a3a34', 0.25, 0.3)}"/>${[0, 1, 2].map((r) => [...Array(9)].map((_, i) => `<circle cx="${-100 + i * 25 + r * 6}" cy="${-30 - r * 26}" r="9" fill="#e8e4d8"/>`).join('')).join('')}<rect x="-170" y="-150" width="340" height="40" rx="18" fill="#1a1e1c"/><rect x="-110" y="-290" width="220" height="150" fill="#f6f2e6"/>${[0, 1, 2, 3].map((i) => `<rect x="-90" y="${-270 + i * 22}" width="${140 - i * 18}" height="6" fill="#4a4a4a" opacity="0.6"/>`).join('')}</g>`;
}
function phoneDesk(x, y, s, c = '#1a1a1c') {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><path d="M-80,0 L-60,-70 L60,-70 L80,0 Z" fill="${V(c, 0.25, 0.3)}"/><circle cx="0" cy="-40" r="26" fill="#e8e4d8"/><path d="M-90,-80 Q-90,-110 -60,-105 L60,-105 Q90,-110 90,-80 L70,-74 L-70,-74 Z" fill="${V(c, 0.3, 0.3)}"/></g>`;
}
// чёрный седан 70-х сбоку, едет вправо
function sedan(x, y, s, lights = 0, who = 0) {
  const wheel = (wx) => `<circle cx="${wx}" cy="-30" r="52" fill="#0c0c0e"/><circle cx="${wx}" cy="-30" r="28" fill="${R('#9a9aa0', 0.3, 0.4)}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">
    <path d="M-420,-40 L-420,-130 Q-410,-150 -360,-155 L-230,-160 L-150,-250 Q-130,-268 -90,-268 L120,-268 Q160,-268 180,-245 L260,-160 L400,-150 Q440,-145 440,-110 L440,-40 Z" fill="${V('#16171c', 0.35, 0.3)}"/>
    <path d="M-210,-170 L-140,-245 L-10,-245 L-10,-170 Z M10,-170 L10,-245 L120,-245 Q150,-245 165,-225 L225,-170 Z" fill="${grad([[0, '#3a4a64'], [1, '#0e121a']])}"/>
    ${who ? `<g opacity="${who}"><circle cx="70" cy="-200" r="30" fill="#0a0a0c"/><ellipse cx="70" cy="-226" rx="44" ry="9" fill="#0a0a0c"/><rect x="45" y="-262" width="50" height="36" rx="10" fill="#0a0a0c"/></g>` : ''}
    <path d="M-420,-110 L440,-110" stroke="#c8ccd8" stroke-width="5" opacity="0.5"/><rect x="420" y="-90" width="30" height="40" rx="6" fill="#c8ccd8"/><rect x="-430" y="-90" width="30" height="40" rx="6" fill="#c8ccd8"/>
    <rect x="410" y="-140" width="26" height="24" rx="6" fill="${lights ? '#fff4c8' : '#3a3a40'}"/>${lights ? glow(440, -128, 160, '#fff4c8', 0.7 * lights) : ''}
    <rect x="-428" y="-140" width="18" height="24" rx="4" fill="#5a0a0a"/>
    ${wheel(-250)}${wheel(270)}</g>`;
}
function neon(x, y, txt, c, t, ph = 0, size = 70) {
  const on = 0.75 + 0.25 * wave(t, 0.4, ph);
  return `<g opacity="${on}">${glow(x, y - size * 0.35, size * 3, c, 0.35)}<text x="${x}" y="${y}" font-family="'Arial Black', sans-serif" font-size="${size}" fill="${shade(c, 0.5)}" stroke="${c}" stroke-width="4" text-anchor="middle" letter-spacing="6">${txt}</text></g>`;
}
function cigar(x, y, s, t, ph = 0) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-60" y="-8" width="120" height="16" rx="8" fill="#5a3a22"/><circle cx="60" cy="0" r="9" fill="#ff7a3a"/>${glow(60, 0, 26, '#ff8a4a', 0.6)}</g>` + smoke(x + 60 * s, y - 10 * s, s * 0.8, t, 5, '#bcb0a0');
}
function candleBottle(x, y, s, t) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><ellipse cx="0" cy="-60" rx="70" ry="80" fill="${V('#2a4a2a', 0.3, 0.3)}"/><path d="M-70,-40 Q0,10 70,-40 L70,-20 Q0,30 -70,-20 Z" fill="${V('#c8a060', 0.2, 0.3)}"/><rect x="-16" y="-200" width="32" height="80" fill="#2a4a2a"/><rect x="-14" y="-280" width="28" height="90" rx="4" fill="#f2ead8"/><path d="M0,-285 q-14,-30 0,-60 q14,30 0,60 Z" fill="#ffd27a" transform="rotate(${wave(t, 1.3) * 4} 0 -285)"/>${glow(0, -310, 140, '#ffc070', 0.7)}</g>`;
}
function wineGlass(x, y, s, fill = '#6a0e16') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-40,-200 Q-44,-120 0,-110 Q44,-120 40,-200 Z" fill="#fff" opacity="0.18" stroke="#fff" stroke-opacity="0.4" stroke-width="3"/><path d="M-38,-160 Q-40,-118 0,-112 Q40,-118 38,-160 Z" fill="${fill}" opacity="0.85"/><rect x="-3" y="-110" width="6" height="100" fill="#fff" opacity="0.35"/><ellipse cx="0" cy="-8" rx="36" ry="8" fill="#fff" opacity="0.3"/></g>`;
}
// крупная рука (для ракурсов на предметы)
function bigHand(x, y, s, rot = 0, c = '#d8a482', sleeve = '#23242b', ring = false, glove = false) {
  const skin = glove ? '#0e0e10' : c;
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" filter="url(#soft)">
    <path d="M-400,-70 L-120,-80 L-120,80 L-400,70 Z" fill="${V(sleeve, 0.2, 0.3)}"/><rect x="-140" y="-74" width="34" height="148" rx="6" fill="#efe8da"/>
    <path d="M-110,-70 Q20,-90 90,-60 Q130,-40 120,-10 L40,0 Q60,40 30,70 L-110,70 Z" fill="${glove ? V(skin, 0.2, 0.3) : R(skin, 0.15, 0.2)}"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="20" y="${-58 + i * 30}" width="${120 - i * 8}" height="30" rx="15" fill="${glove ? shade(skin, 0.1) : shade(skin, -0.04)}"/>`).join('')}
    ${ring ? `<rect x="70" y="-30" width="18" height="34" rx="4" fill="#d8b44a"/><rect x="66" y="-26" width="26" height="18" rx="5" fill="#8a1e22"/>` : ''}</g>`;
}
function tableTop(y, c, h = 500) { return `<path d="M-60,${y} L1140,${y} L1140,${y + h} L-60,${y + h} Z" fill="${V(c, 0.12, 0.35)}"/><rect x="-60" y="${y}" width="1200" height="10" fill="${shade(c, 0.25)}"/>`; }

const NIGHT = [[0, '#05070f'], [0.6, '#121a34'], [1, '#2a3050']];

const shots = {
  // 1. Хук: пустой павильон, Радди крупно у камеры; рука в чёрной перчатке закрывает объектив
  hook(t, T) {
    const k = ease(t / T), hand = io((t - D - 2.2) / 0.8), turn = io((t - D - 2.6) / 0.5);
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, 50, k), x: lerp(-20, 20, k) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#0a0806'], [0.5, '#1c1410'], [1, '#0a0806']])}"/>`,
        // фермы под потолком и декорационные щиты
        ...[0, 1, 2, 3].map((i) => `<rect x="${-40 + i * 300}" y="300" width="260" height="900" fill="${V('#2a2018', 0.1, 0.5)}" opacity="0.7"/><rect x="${-30 + i * 300}" y="320" width="10" height="860" fill="#3a2c20" opacity="0.6"/>`),
        `<path d="M0,180 L1080,180 M0,230 L1080,230" stroke="#2a221a" stroke-width="10"/>` + [...Array(12)].map((_, i) => `<path d="M${i * 100},180 L${i * 100 + 50},230 L${i * 100 + 100},180" stroke="#2a221a" stroke-width="6" fill="none"/>`).join(''),
        // дверь павильона: в проёме силуэты в шляпах
        `<rect x="700" y="640" width="300" height="620" fill="${grad([[0, '#c89a5a'], [1, '#5a3a20']])}" opacity="${0.35 + 0.4 * hand}"/>`,
        `<g opacity="${hand}">${goonSil(790, 1250, 0.42)}${goonSil(920, 1250, 0.4)}</g>`,
        `<rect x="690" y="630" width="320" height="640" fill="none" stroke="#0a0806" stroke-width="22"/>`,
        lightCone(420, 0, 60, 640, 1900, '#ffe2a8', 0.32),
        spot(140, 1150, 0.9, 20, 1),
        `<rect x="0" y="1500" width="1080" height="420" fill="${V('#2a2018', 0.1, 0.4)}"/>`,
        shadow(540, 1880, 420, 0.4),
        // Радди
        glow(640, 1250, 620, '#ffe0b0', 0.22),
        ruddy(720, 2330, 2.0, { look: lerp(-0.7, -1, turn), frown: lerp(0.05, 0.65, turn), arms: 'down', blink: blink(t, 0.6), nod: -turn * 2 }),
        // камера на переднем плане слева
        filmCamera(lerp(170, 180, k), 1120, 1.0, t * 2.2),
        // рука в перчатке с перстнем закрывает объектив
        hand > 0 ? `<g style="filter:drop-shadow(0 0 6px #ffcf8a)">${bigHand(lerp(-160, 405, hand), 1045, 1.0, lerp(-20, -6, hand), '#0e0e10', '#16161a', true, true)}</g>` : '',
        clapper(200, 1560, 0.8, -14, 0),
        grade('#ffb070', 0.22),
        topShade(820, 0.65),
      ],
    };
  },

  // 2. Тесный офис в Лос-Анджелесе: машинка, афиша телекомедии, пальмы и водонапорная башня за окном; мечта о большом кино
  nobody(t, T) {
    const k = ease(t / T), dream = fade(t, 3.8, 1.0);
    return {
      cam: { z: lerp(1.0, 1.1, k), x: lerp(30, -30, k) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#8a6a48', 0.1, 0.4)}"/>`,
        // окно с видом
        `<rect x="420" y="280" width="600" height="760" fill="${grad([[0, lerp(0, 1, dream) > 0.5 ? '#2a2050' : '#e8a868'], [0.6, '#f4c890'], [1, '#f8e0b0']])}"/>`,
        `<rect x="420" y="280" width="600" height="760" fill="${grad([[0, '#14103a'], [0.7, '#4a2a5a'], [1, '#c87a5a']])}" opacity="${dream}"/>`,
        // прожекторы премьеры
        ...[0, 1, 2].map((i) => `<path d="M${600 + i * 150},1000 L${600 + i * 150 + Math.sin(t * 0.9 + i * 1.7) * 260 - 30},290 L${600 + i * 150 + Math.sin(t * 0.9 + i * 1.7) * 260 + 30},290 Z" fill="#fff4d0" opacity="${0.35 * dream}"/>`),
        `<path d="M420,860 Q560,760 720,820 Q860,740 1020,800 L1020,1040 L420,1040 Z" fill="${V('#a87a5a', 0.1, 0.3)}" opacity="0.8"/>`,
        waterTower(880, 980, 0.9),
        palm(520, 1040, 520, wave(t, 0.3)), palm(980, 1040, 600, wave(t, 0.25, 1)),
        `<rect x="410" y="270" width="620" height="780" fill="none" stroke="#3a2a1c" stroke-width="22"/><rect x="714" y="280" width="12" height="760" fill="#3a2a1c"/>`,
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="430" y="${300 + i * 92}" width="580" height="10" fill="#3a2a1c" opacity="0.35"/>`),
        // афиша телекомедии
        `<g transform="rotate(-3 210 560)"><rect x="70" y="380" width="280" height="380" fill="#f2e2b0"/><rect x="90" y="400" width="240" height="190" rx="30" fill="#2a3a4a"/><rect x="108" y="418" width="204" height="154" rx="22" fill="${grad([[0, '#8ac0e0'], [1, '#4a7aa0']])}"/>${[0, 1, 2].map((i) => `<circle cx="${150 + i * 60}" cy="${500 + (i % 2) * 10}" r="20" fill="#f4d0a8"/><rect x="${136 + i * 60}" y="${516 + (i % 2) * 10}" width="28" height="40" rx="6" fill="#5a6a3a"/>`).join('')}<text x="210" y="650" font-family="'Arial Black', sans-serif" font-size="44" fill="#c8302a" text-anchor="middle">TV</text><text x="210" y="705" font-family="'Arial Black', sans-serif" font-size="36" fill="#2a2a2a" text-anchor="middle">COMEDY</text><text x="210" y="740" font-family="sans-serif" font-size="18" fill="#4a4a4a" text-anchor="middle">EVERY FRIDAY</text></g>`,
        // полка с папками: на корешке kinoplot.film
        `<rect x="60" y="860" width="320" height="16" fill="#4a321e"/>` + [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${80 + i * 48}" y="${740 + (i % 3) * 6}" width="40" height="${120 - (i % 3) * 6}" fill="${['#8a2a22', '#2a4a6a', '#c8a050', '#3a5a3a', '#6a4a2a', '#2a2a3a'][i]}"/>`).join('') + `<text transform="translate(${80 + 2 * 48 + 26} 850) rotate(-90)" font-family="sans-serif" font-size="15" fill="#3a2a1a" opacity="0.75">kinoplot.film</text>`,
        // стол
        `<rect x="0" y="1460" width="1080" height="460" fill="${V('#5a3a24', 0.15, 0.4)}"/>`,
        // Радди сидит, откинувшись, мечтательно смотрит в окно
        glow(460, 1250, 500, '#ffd8a0', 0.2),
        ruddy(470, 1640, 1.45, { pose: 'sit', arms: 'table', look: 0.8, lookUp: lerp(0, 1, dream), frown: -0.1, smile: dream > 0.4, blink: blink(t, 1.2), lean: lerp(-3, -6, k), nod: -1 }),
        tableTop(1560, '#6a4428', 400),
        typewriter(250, 1720, 0.95), phoneDesk(820, 1700, 1.0),
        `<g transform="translate(620 1760) rotate(-8)"><rect x="-90" y="-60" width="180" height="120" fill="#f4eedc"/>${[0, 1, 2, 3].map((i) => `<rect x="-70" y="${-40 + i * 24}" width="${140 - i * 20}" height="6" fill="#5a5a5a" opacity="0.5"/>`).join('')}</g>`,
        `<g transform="translate(980 1640)"><rect x="-40" y="-20" width="80" height="20" rx="4" fill="#3a3a3a"/>${cigar(0, -30, 0.5, t, 1)}</g>`,
        grade('#ffb060', 0.25),
        topShade(760, 0.55),
      ],
    };
  },

  // 3. Кабинет босса студии: логотип на стене, дым сигар; роман скользит по столу к Радди
  offer(t, T) {
    const k = ease(t / T), slide = io((t - D - 1.3) / 2.6), lift = io((t - D - 4.0) / 0.7);
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(-30, 60, k) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#2a1c14'], [0.5, '#4a3020'], [1, '#1a120c']])}"/>`,
        // панели дерева и панорамное окно с холмами Голливуда в дымке
        ...[0, 1, 2, 3, 4].map((i) => `<rect x="${i * 220 + 8}" y="120" width="204" height="1000" fill="${V('#5a3a24', 0.12, 0.35)}"/>`),
        `<rect x="120" y="200" width="840" height="560" fill="${grad([[0, '#f0b070'], [1, '#f8dca8']])}"/><path d="M120,640 Q300,560 500,610 Q700,540 960,600 L960,760 L120,760 Z" fill="#b8865a" opacity="0.7"/>${palm(220, 760, 300, wave(t, 0.3))}${palm(870, 760, 340, wave(t, 0.3, 2))}`,
        `<rect x="110" y="190" width="860" height="580" fill="none" stroke="#2a1a10" stroke-width="20"/>`,
        paramount(540, 470, 0.95),
        // босс в тонированных очках за дальним концом стола
        figure(540, 1330, 0.62, { ...EVANS, arms: slide < 0.2 ? 'table' : 'point', look: 0.2, blink: blink(t, 0.4) }),
        cigar(680, 1110, 0.5, t, 0),
        // длинный стол в перспективе
        `<path d="M380,1120 L700,1120 L1100,1920 L-20,1920 Z" fill="${V('#3a2214', 0.25, 0.45)}"/><path d="M380,1120 L700,1120 L702,1132 L378,1132 Z" fill="#8a5a34"/>`,
        `<path d="M520,1120 L560,1120 L620,1920 L460,1920 Z" fill="#fff" opacity="0.06"/>`,
        ...[[300, 1350], [780, 1350]].map(([x, y]) => `<g opacity="0.6">${figure(x, y + 160, 0.5, { ...BOSS(x < 540 ? '#2e323c' : '#3c3428', '#3a2a20', '#2a3a5a'), arms: 'table', look: x < 540 ? 0.7 : -0.7, blink: blink(t, x / 300) })}</g>`),
        // роман едет к зрителю
        godfatherBook(lerp(540, 520, slide), lerp(1180, 1620, slide) - lift * 120, lerp(0.22, 1.15, slide) + lift * 0.1, lerp(80, 4, slide) - lift * 4),
        // руки Радди ловят книгу
        `<g opacity="${io((t - D - 3.2) / 0.5)}">${bigHand(lerp(-120, 150, slide), 1820 - lift * 120, 1.0, -30, '#e8b896', '#c7b089')}<g transform="translate(1080 0) scale(-1 1)">${bigHand(lerp(-120, 150, slide), 1820 - lift * 120, 1.0, -30, '#e8b896', '#c7b089')}</g></g>`,
        smoke(300, 1100, 1.2, t, 6, '#c8b8a0'),
        grade('#ffb070', 0.25),
        topShade(300, 0.5),
      ],
    };
  },

  // 4. Три плана плавным проездом: боссы считают деньги → режиссёр с фотографиями актёров → ночной Нью-Йорк, за Радди едет седан
  pressure(t, T) {
    const tt = t - D;
    const p1 = io((tt - 1.75) / 0.6), p2 = io((tt - 3.9) / 0.7);
    const px = -(p1 + p2) * 1080 - io(tt / T) * 40;
    const carK = io((tt - 4.3) / (T - 4.6));
    // A: боссы
    const A = `<g>
      <rect x="0" y="0" width="1080" height="1920" fill="${grad([[0, '#1e1610'], [1, '#3a2818']])}"/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${i * 220 + 8}" y="150" width="204" height="950" fill="${V('#4a3020', 0.12, 0.35)}"/>`).join('')}
      <g transform="translate(540 520)"><rect x="-260" y="-200" width="520" height="340" fill="#f2ead8"/><path d="M-220,80 L-120,20 L-20,40 L80,-60 L200,-140" stroke="#2a6a3a" stroke-width="12" fill="none"/><text x="-200" y="-140" font-family="'Arial Black', sans-serif" font-size="52" fill="#2a6a3a">$</text><text x="0" y="120" font-family="sans-serif" font-size="30" fill="#4a4a4a" text-anchor="middle">BUDGET 1971</text></g>
      ${[[250, '#2e323c', '#c8c4bc', '#6a1e22'], [540, '#3c3428', '#1c1612', '#2a3a5a'], [830, '#2a2e2a', '#8a8a86', '#5a4a2a']].map(([x, c, h, tie], i) => figure(x, 1560, 0.85, { ...BOSS(c, h, tie), arms: i === 1 ? 'point' : 'table', look: [0.6, 0, -0.6][i], frown: 0.55, blink: blink(t, i * 1.3) })).join('')}
      ${tableTop(1500, '#3a2214', 420)}
      ${cigar(250, 1520, 0.8, t, 0)}${cigar(860, 1530, 0.8, t, 2)}
      <g transform="translate(560 1660) rotate(-6)"><rect x="-110" y="-80" width="220" height="160" rx="14" fill="${V('#d8d0c0', 0.1, 0.3)}"/><rect x="-90" y="-62" width="180" height="40" fill="#1e2a1e"/><text x="80" y="-32" font-family="monospace" font-size="32" fill="#7aff8a" text-anchor="end">${Math.max(0, Math.round(2500000 - clamp(tt / 1.7) * 1000000)).toLocaleString('en-US')}</text>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${-88 + c * 46}" y="${-6 + r * 28}" width="38" height="22" rx="4" fill="#3a3a3a"/>`).join('')).join('')}</g>
      ${smoke(540, 1300, 1.4, t, 7, '#b8a890')}
    </g>`;
    // B: режиссёр спорит, раскладывает фото актёров
    const B = `<g transform="translate(1080 0)">
      <rect x="0" y="0" width="1080" height="1920" fill="${grad([[0, '#2a2418'], [1, '#4a3a24']])}"/>
      <rect x="60" y="260" width="960" height="760" fill="#d8c8a0" opacity="0.25"/>
      ${[...Array(12)].map((_, i) => { const x = 140 + (i % 4) * 220, y = 340 + Math.floor(i / 4) * 230; return `<g transform="rotate(${(i % 3 - 1) * 4} ${x} ${y})"><rect x="${x - 70}" y="${y - 90}" width="140" height="180" fill="#f4f0e6"/><rect x="${x - 60}" y="${y - 80}" width="120" height="130" fill="${grad([[0, '#6a6a6a'], [1, '#2a2a2a']])}"/><circle cx="${x}" cy="${y - 30}" r="30" fill="#9a9a9a"/><rect x="${x - 34}" y="${y + 4}" width="68" height="46" rx="20" fill="#7a7a7a"/>${i === 5 ? `<path d="M${x - 70},${y - 90} L${x + 70},${y + 90} M${x + 70},${y - 90} L${x - 70},${y + 90}" stroke="#c8302a" stroke-width="8"/>` : ''}${i === 6 ? `<circle cx="${x}" cy="${y}" r="92" fill="none" stroke="#d9a441" stroke-width="8"/>` : ''}</g>`; }).join('')}
      ${figure(330, 1720, 1.05, { ...COPPOLA, arms: wave(t, 1.6) > 0 ? 'raise' : 'point', look: 0.6, blink: blink(t, 0.3) })}
      ${ruddy(800, 1760, 1.0, { arms: 'down', look: -0.7, frown: 0.45, blink: blink(t, 1.9) })}
      ${tableTop(1640, '#4a3020', 300)}
      ${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${360 + i * 90 + wave(t, 0.5, i) * 6} ${1700 + (i % 2) * 20}) rotate(${(i - 2) * 9})"><rect x="-50" y="-66" width="100" height="132" fill="#f4f0e6"/><rect x="-42" y="-58" width="84" height="94" fill="#4a4a4a"/><circle cx="0" cy="-22" r="20" fill="#9a9a9a"/></g>`).join('')}
    </g>`;
    // C: ночной Нью-Йорк
    const C = `<g transform="translate(2160 0)">
      ${sky(NIGHT, 1300)}
      ${(() => { reseed(5); let g = ''; for (let x = -40; x < 1120;) { const w = 120 + rnd() * 160, h = 500 + rnd() * 500; g += `<rect x="${x}" y="${1300 - h}" width="${w}" height="${h}" fill="${V('#1a1e2c', 0.1, 0.3)}"/>`; for (let wy = 1300 - h + 30; wy < 1260; wy += 50) for (let wx = x + 16; wx < x + w - 20; wx += 34) if (rnd() < 0.4) g += `<rect x="${wx}" y="${wy}" width="16" height="22" fill="#ffd890" opacity="${0.3 + rnd() * 0.5}"/>`; x += w + 10; } return g; })()}
      ${neon(260, 980, 'BAR', '#ff4a6a', t, 0, 90)}${neon(800, 900, 'HOTEL', '#4ac8ff', t, 1.5, 70)}${neon(560, 1120, 'PIZZA', '#ffb03a', t, 3, 56)}
      <rect x="0" y="1300" width="1080" height="620" fill="${grad([[0, '#14161e'], [1, '#08090c']])}"/>
      <rect x="0" y="1300" width="1080" height="12" fill="#3a3e4a"/>
      ${[[260, '#ff4a6a'], [800, '#4ac8ff'], [560, '#ffb03a']].map(([x, c]) => `<rect x="${x - 50}" y="1320" width="100" height="520" fill="${grad([[0, c, 0.4], [1, c, 0]])}"/>`).join('')}
      ${[200, 880].map((x) => `<rect x="${x - 6}" y="900" width="12" height="420" fill="#1a1a1e"/>${glow(x, 900, 120, '#ffe0a0', 0.7)}<circle cx="${x}" cy="900" r="16" fill="#fff0c8"/>`).join('')}
      ${shadow(lerp(640, 760, carK), 1720, 160, 0.5)}
      ${ruddy(lerp(640, 760, carK), 1720, 0.95, { arms: 'down', step: wave(t, 1.6), look: carK > 0.6 ? -1 : 0.3, frown: lerp(0.2, 0.7, carK), blink: blink(t, 0.7) })}
      <g transform="translate(${lerp(-460, 180, carK)} 0)">${sedan(0, 1870, 0.95, 0, 1)}</g>
      <rect x="0" y="1860" width="1080" height="60" fill="#000" opacity="0.4"/>
    </g>`;
    return {
      cam: { z: 1.02 },
      els: [`<g transform="translate(${px} 0)">${A}${B}${C}</g>`, grade('#ffb070', 0.15), topShade(820, 0.55)],
    };
  },

  // 5. Ресторан ночью: Коломбо напротив Радди кладёт ладонь с перстнем на сценарий
  colombo(t, T) {
    const k = ease(t / T), hand = io((t - D - 0.5) / 1.0);
    return {
      cam: { z: lerp(1.0, 1.16, k), y: lerp(0, 90, k) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#1a0c0a'], [0.6, '#3a1612'], [1, '#140806']])}"/>`,
        // стена: обои, рамы с фото, бра
        ...[...Array(9)].map((_, i) => `<rect x="${i * 130}" y="100" width="6" height="1100" fill="#5a2a1c" opacity="0.5"/>`),
        ...[[180, 520], [900, 520], [180, 820], [900, 820]].map(([x, y]) => `<rect x="${x - 80}" y="${y - 100}" width="160" height="200" fill="#c8a050"/><rect x="${x - 66}" y="${y - 86}" width="132" height="172" fill="${grad([[0, '#8a7a60'], [1, '#3a3024']])}"/><circle cx="${x}" cy="${y - 20}" r="34" fill="#5a4a3a"/>`),
        ...[340, 740].map((x) => `${glow(x, 420, 200, '#ffb060', 0.7)}<path d="M${x - 40},440 L${x + 40},440 L${x + 25},390 L${x - 25},390 Z" fill="#f4d090"/>`),
        // охрана у двери
        `<rect x="380" y="560" width="320" height="640" fill="${grad([[0, '#6a3a1a'], [1, '#2a1208']])}"/>`,
        figure(320, 1260, 0.6, { ...GOON, arms: 'hold', look: 0.4, blink: blink(t, 0.9) }),
        figure(770, 1260, 0.6, { ...GOON, arms: 'hold', look: -0.4, blink: blink(t, 2.1) }),
        // Коломбо
        glow(540, 1150, 520, '#ffc080', 0.25),
        figure(540, 2120, 1.5, { ...COLOMBO, arms: 'table', look: 0, frown: lerp(0.4, 0.7, hand), blink: blink(t, 1.4) }),
        // стол: красная скатерть, бутылка со свечой, бокалы
        `<path d="M-60,1520 L1140,1520 L1140,1920 L-60,1920 Z" fill="${V('#9a1e1a', 0.2, 0.35)}"/>` + [...Array(10)].map((_, i) => `<rect x="${i * 120 - 30}" y="1520" width="60" height="400" fill="#fff" opacity="0.06"/>`).join('') + `<rect x="-60" y="1520" width="1200" height="8" fill="#c8302a"/>`,
        candleBottle(170, 1640, 0.8, t),
        wineGlass(860, 1680, 1.0), wineGlass(940, 1700, 0.9, '#4a0a10'),
        // сценарий и рука Коломбо
        `<g transform="translate(540 1720) rotate(-4)"><rect x="-190" y="-110" width="380" height="240" fill="#f2ecdc"/><rect x="-190" y="-110" width="380" height="20" fill="#2a2a2a"/><text x="0" y="-30" font-family="'Courier New', monospace" font-size="30" fill="#2a2a2a" text-anchor="middle">THE GODFATHER</text><text x="0" y="10" font-family="'Courier New', monospace" font-size="20" fill="#5a5a5a" text-anchor="middle">SCREENPLAY</text></g>`,
        bigHand(lerp(-60, 470, hand), lerp(1620, 1700, hand), 0.9, lerp(-30, 6, hand), COLOMBO.skin, COLOMBO.shirt, true),
        // затылок Радди на переднем плане справа
        `<g filter="url(#soft)"><path d="M760,1920 Q780,1700 960,1680 Q1140,1700 1160,1920 Z" fill="${V('#c7b089', 0.15, 0.35)}"/><ellipse cx="960" cy="1580" rx="140" ry="160" fill="${V('#4a2e1c', 0.2, 0.4)}"/></g>`,
        grade('#ff9060', 0.28),
        topShade(760, 0.6),
      ],
    };
  },

  // 6. Враги без контекста, сменяются растворением: кулак босса → певец у микрофона → гангстеры у машины → тени тянутся к Радди
  enemies(t, T) {
    const tt = t - D;
    const w = (a, b, d = 0.3) => io((tt - a) / d) * (1 - io((tt - b) / d));
    const a0 = 1 - io((tt - 1.8) / 0.3), a1 = w(1.8, 2.5), a2 = w(2.5, 3.2), a3 = w(3.2, 4.0), a4 = io((tt - 4.0) / 0.35);
    const shadowsK = io((tt - 4.0) / 2.2);
    const ruddyScene = (op, sh) => `<g opacity="${op}">
      <rect width="1080" height="1920" fill="${grad([[0, '#0a0808'], [1, '#1e1410']])}"/>
      ${lightCone(540, 0, 80, 520, 1900, '#ffe2a8', 0.32)}
      <ellipse cx="540" cy="1820" rx="420" ry="60" fill="#ffe2a8" opacity="0.12"/>
      ${[...Array(6)].map((_, i) => { const a = -Math.PI * 0.95 + i * Math.PI * 0.18; const r0 = lerp(1100, 380, sh), x0 = 540 + Math.cos(a) * 1200, y0 = 1700 + Math.sin(a) * 700; const x1 = 540 + Math.cos(a) * r0, y1 = 1700 + Math.sin(a) * r0 * 0.6; return `<path d="M${x0},${y0} Q${(x0 + x1) / 2 + 60},${(y0 + y1) / 2} ${x1},${y1}" stroke="#000" stroke-width="${90 - i * 6}" stroke-linecap="round" fill="none" opacity="0.7"/><circle cx="${x1}" cy="${y1}" r="58" fill="#000" opacity="0.7"/>`; }).join('')}
      ${ruddy(540, 2200, 1.45, { arms: 'down', look: wave(t, 0.4) * 0.8, frown: lerp(0.3, 0.75, sh), blink: blink(t, 0.5) })}
    </g>`;
    return {
      cam: { z: lerp(1.0, 1.08, ease(t / T)) },
      els: [
        ruddyScene(Math.max(a0, a4), shadowsK),
        // кулак по столу, бумаги подлетают
        `<g opacity="${a1}"><rect width="1080" height="1920" fill="${grad([[0, '#2a1c12'], [1, '#4a3020']])}"/>${paramount(540, 520, 0.7, 0.6)}${tableTop(1300, '#3a2214', 700)}${[0, 1, 2, 3].map((i) => { const j = io((tt - 2.0) / 0.25) * (1 - io((tt - 2.3) / 0.4)); return `<g transform="translate(${300 + i * 160} ${1360 - j * (80 + i * 30)}) rotate(${(i - 1.5) * 10 * (1 + j)})"><rect x="-80" y="-50" width="160" height="100" fill="#f4eedc"/></g>`; }).join('')}${bigHand(lerp(80, 360, io((tt - 1.8) / 0.3)), lerp(1100, 1330, io((tt - 1.9) / 0.15)), 1.6, 70, '#dcae8c', '#2e323c')}</g>`,
        // певец у микрофона, силуэт без лица
        `<g opacity="${a2}"><rect width="1080" height="1920" fill="#06070c"/>${lightCone(540, 0, 50, 380, 1900, '#cfe0ff', 0.42)}${glow(540, 900, 420, '#8ab0ff', 0.3)}${figure(540, 1820, 1.25, { ...GOON, fedora: '#0a0a0c', sil: silFilter('#020204'), arms: 'hold' })}<rect x="532" y="1040" width="16" height="800" fill="#0a0a0c"/><ellipse cx="540" cy="1030" rx="30" ry="44" fill="#1a1a1e"/><ellipse cx="540" cy="1840" rx="300" ry="40" fill="#cfe0ff" opacity="0.12"/></g>`,
        // гангстеры у машины ночью
        `<g opacity="${a3}">${sky(NIGHT, 1920)}${glow(540, 1200, 600, '#ffd890', 0.25)}${sedan(540, 1660, 1.0, 1)}${[260, 540, 820].map((x, i) => figure(x, 1700, 0.62, { ...GOON, arms: i === 1 ? 'hold' : 'down', look: [0.4, 0, -0.4][i], blink: blink(t, i) })).join('')}<rect x="0" y="1700" width="1080" height="220" fill="#0a0b10"/></g>`,
        grade('#ff9a60', 0.18),
        topShade(800, 0.55),
      ],
    };
  },

  // 7. Съёмочная площадка 70-х: камера едет по рельсам, софиты загораются, Радди-продюсер у камеры со сценарием
  real(t, T) {
    const k = ease(t / T), lights = (i) => io((t - D - 0.4 - i * 0.5) / 0.4), cast = fade(t, 2.9, 0.5);
    return {
      cam: { z: lerp(1.04, 1.12, k), x: lerp(60, -60, k) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#100c08'], [0.6, '#2a1e14'], [1, '#120c08']])}"/>`,
        // декорация «гостиная 40-х» на заднем плане
        `<rect x="140" y="420" width="800" height="760" fill="${V('#6a4a30', 0.15, 0.35)}"/><rect x="200" y="480" width="220" height="300" fill="${grad([[0, '#2a3a5a'], [1, '#6a7a9a']])}"/><rect x="660" y="480" width="220" height="300" fill="${grad([[0, '#2a3a5a'], [1, '#6a7a9a']])}"/>${[310, 770].map((x) => `<rect x="${x - 4}" y="480" width="8" height="300" fill="#3a2a1a"/>`).join('')}<rect x="420" y="560" width="240" height="320" fill="#3a2414"/><circle cx="540" cy="700" r="70" fill="none" stroke="#c8a050" stroke-width="8" opacity="0.6"/>`,
        `<rect x="140" y="1000" width="800" height="180" fill="${V('#5a2a1e', 0.2, 0.3)}"/>`,
        ...[0, 1, 2].map((i) => lightCone(160 + i * 380, 0, 40, 340, 1400, '#ffe2a8', 0.25 * lights(i))),
        spot(120, 1080, 0.85, 25, lights(0)), spot(960, 1080, 0.85, -25, lights(2)),
        // рельсы
        `<rect x="0" y="1420" width="1080" height="500" fill="${V('#2a2018', 0.1, 0.4)}"/>`,
        `<path d="M-40,1560 L1120,1520 M-40,1640 L1120,1600" stroke="#8a8a90" stroke-width="10"/>` + [...Array(12)].map((_, i) => `<rect x="${-20 + i * 100}" y="${1540 - i * 3}" width="22" height="120" fill="#4a3424"/>`).join(''),
        // тележка с камерой и оператором
        `<g transform="translate(${lerp(-40, 120, k)} 0)">${filmCamera(330, 1260, 0.75, t * 2.5)}<rect x="170" y="1500" width="320" height="70" rx="10" fill="${V('#3a3a40', 0.2, 0.3)}"/>${[200, 460].map((x) => `<circle cx="${x}" cy="1580" r="26" fill="#1a1a1e"/>`).join('')}${figure(170, 1500, 0.55, { ...GOON, fedora: undefined, cap: '#2a2a2e', suit: false, shirt: '#4a4a3a', arms: 'hold', look: 1, blink: blink(t, 0.2) })}</g>`,
        // режиссёрское кресло продюсера
        `<g transform="translate(860 1560)" filter="url(#soft)"><path d="M-80,0 L80,-200 M80,0 L-80,-200" stroke="#a87a4a" stroke-width="14"/><rect x="-90" y="-210" width="180" height="20" fill="#a87a4a"/><rect x="-90" y="-330" width="180" height="70" fill="#2a2a2e"/><text x="0" y="-284" font-family="'Arial Black', sans-serif" font-size="26" fill="#e8e0cc" text-anchor="middle">PRODUCER</text><path d="M-90,-330 L-90,-200 M90,-330 L90,-200" stroke="#a87a4a" stroke-width="12"/></g>`,
        // Радди со сценарием
        glow(640, 1350, 420, '#ffe0b0', 0.25 + 0.15 * cast),
        ruddy(640, 1880, 1.15, { arms: 'hold', look: lerp(-0.4, 0.3, k), smile: cast > 0.5, frown: -0.1, blink: blink(t, 1.6) }),
        `<g transform="translate(640 ${1880 - 1.15 * (210 * 1.35 + 210 * 1.15) + 1.15 * 210})"><rect x="-60" y="-80" width="120" height="150" fill="#f2ecdc" transform="rotate(-8)"/><text x="0" y="-30" font-family="'Courier New', monospace" font-size="14" fill="#2a2a2a" text-anchor="middle" transform="rotate(-8)">SCRIPT</text></g>`,
        clapper(240, 1780, 0.7, 10, 0.5 + 0.5 * wave(t, 0.6)),
        grade('#ffb070', 0.22),
        topShade(760, 0.55),
      ],
    };
  },

  // 8. Радди один в пустом павильоне под лампой, с хлопушкой; в воротах силуэты в шляпах и фары
  question(t, T) {
    const k = ease(t / T), lights = fade(t, 1.4, 0.6);
    return {
      cam: { z: lerp(1.18, 1.0, k), y: lerp(60, 0, k) },
      els: [
        `<rect width="1080" height="1920" fill="${grad([[0, '#070606'], [1, '#141010']])}"/>`,
        // огромные ворота павильона, за ними ночь и фары
        `<rect x="240" y="420" width="600" height="900" fill="${grad([[0, '#0e1220'], [1, '#2a2a34']])}"/>`,
        `<g opacity="${lights}">${glow(390, 1180, 240, '#fff4c8', 0.8)}${glow(690, 1180, 240, '#fff4c8', 0.8)}<circle cx="390" cy="1180" r="34" fill="#fff8e0"/><circle cx="690" cy="1180" r="34" fill="#fff8e0"/><path d="M390,1180 L-100,1920 L500,1920 Z M690,1180 L580,1920 L1180,1920 Z" fill="#fff4c8" opacity="0.08"/></g>`,
        goonSil(330, 1320, 0.42), goonSil(540, 1330, 0.46), goonSil(750, 1320, 0.42),
        `<rect x="220" y="400" width="640" height="940" fill="none" stroke="#1a1612" stroke-width="40"/>`,
        `<rect x="0" y="1320" width="1080" height="600" fill="${V('#2a221c', 0.1, 0.45)}"/>`,
        hangLamp(540, 260, 1.1, 1),
        `<ellipse cx="540" cy="1780" rx="360" ry="70" fill="#ffd9a0" opacity="0.18"/>`,
        shadow(540, 1800, 200, 0.5),
        ruddy(540, 1800, 1.05, { arms: 'hold', look: 0, frown: 0.55, blink: blink(t, 0.9), worried: true }),
        clapper(540, 1800 - 1.05 * 210 * 1.35 + 30, 0.42, -4, 0),
        grade('#ffb070', 0.18),
        topShade(700, 0.55),
      ],
    };
  },
};

run(shots);
