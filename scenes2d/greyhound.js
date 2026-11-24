// «Грейхаунд» (Greyhound, 2020) — 8 сцен в 2D-векторе.
// Имя плана = set сцены в videos/greyhound/script.json.
// Северная Атлантика, февраль 1942: свинцовое море, низкие тучи, снег; ночью — красный боевой свет на мостике.
// Краузе: тёмно-синий бушлат с двумя рядами золотых пуговиц, фуражка с золотым ремешком и кокардой, бинокль на груди.
// Динамика (правило пользователя): непрерывная плавная камера, параллакс планов, всё время движение, события под слова.
import { run, person, setProportions, V, R, grad, glow, rnd, reseed, shade, lerp, clamp, wave } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

const D = 0.13; // голос начинается через 4 кадра
const io = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const sine = (k) => -(Math.cos(Math.PI * clamp(k)) - 1) / 2;
const at = (t, a, d = 0.5) => io((t - D - a) / d); // 0→1 начиная со слова (время слова в озвучке)
const blink = (t, ph = 0) => ((t + ph) % 3.6) < 0.12;
const par = (dx, dy, svg) => `<g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})">${svg}</g>`;
const grade = (c, op) => `<rect x="-400" y="-400" width="1880" height="2720" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const topShade = (h = 820, a = 0.6) => `<rect x="-400" y="-300" width="1880" height="${h + 300}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const label = (x, y, txt, size = 15, c = '#3a4a44', op = 0.55, rot = 0, font = 'Montserrat, Manrope, sans-serif') => `<text x="${x}" y="${y}" font-family="${font}" font-weight="700" font-size="${size}" letter-spacing="2" fill="${c}" opacity="${op}" text-anchor="middle"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}>${txt}</text>`;
const STICKER_FILTER = `<filter id="stk" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="10" result="dil"/><feFlood flood-color="#ffffff"/><feComposite in2="dil" operator="in" result="outline"/><feGaussianBlur in="dil" stdDeviation="12" result="blur"/><feOffset in="blur" dx="8" dy="16" result="sh"/><feFlood flood-color="#000" flood-opacity="0.55"/><feComposite in2="sh" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

const IMG = {};
try {
  const b = await (await fetch('/public/assets/greyhound/hanks-cut.png')).blob();
  IMG.hanks = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
} catch { IMG.hanks = ''; }
function sticker(s, t, i) {
  const dt = t - s.at;
  if (dt < 0 || !IMG[s.k]) return '';
  const f = dt * 30;
  const pop = f < 6 ? lerp(0.2, 1.12, f / 6) : f < 10 ? lerp(1.12, 0.96, (f - 6) / 4) : f < 14 ? lerp(0.96, 1, (f - 10) / 4) : 1;
  const out = s.out != null ? 1 - io((t - s.out) / 0.5) : 1;
  const wob = wave(t, 0.35, i * 2) * 2.4, bob = wave(t, 0.25, i * 1.3) * 7;
  return `<defs>${STICKER_FILTER}</defs><g transform="translate(${s.x - (1 - out) * 700} ${s.y + bob}) rotate(${s.tilt + wob}) scale(${pop})" opacity="${clamp(f / 3) * clamp(out * 1.5)}"><image href="${IMG[s.k]}" x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid meet" filter="url(#stk)"/></g>`;
}

// ---------- персонажи ----------
const KRAUSE = { shirt: '#1c2636', pants: '#161e2a', skin: '#e0ab8a', hair: '#6a5a4c', iris: '#4a5a6a', beard: false, frown: 0.45, krause: true };
const SAILOR = [
  { shirt: '#2a3446', pants: '#1e2632', skin: '#e2b494', hair: '#3a2618', beard: false, frown: 0.5, helmet: '#5a6670', sailor: true },
  { shirt: '#30394a', pants: '#222a36', skin: '#d0a07c', hair: '#1a1410', beard: false, frown: 0.6, worried: true, cap: '#2a3446', sailor: true },
  { shirt: '#283244', pants: '#1c2430', skin: '#c48a64', hair: '#141010', beard: false, frown: 0.4, helmet: '#5a6670', sailor: true },
];

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
  if (o.krause || o.sailor) {
    // бушлат: высокий воротник, лацканы, двубортная застёжка, карманы, ремень бинокля
    b += [-1, 1].map((sd) => `<path d="M${x + sd * 8 * s},${top + 4 * s} L${x + sd * 92 * s},${top - 6 * s} L${x + sd * 70 * s},${top + 110 * s} L${x + sd * 12 * s},${top + 150 * s} Z" fill="${V(shade(o.shirt, 0.12), 0.25, 0.2)}" stroke="${shade(o.shirt, -0.35)}" stroke-width="${3 * s}"/>`).join('');
    b += `<path d="M${x - 30 * s},${top - 2 * s} L${x},${top + 50 * s} L${x + 30 * s},${top - 2 * s} Z" fill="${o.krause ? '#e8e4da' : '#c8c0b0'}"/>`;
    if (o.krause) b += `<path d="M${x - 10 * s},${top + 8 * s} L${x},${top + 46 * s} L${x + 10 * s},${top + 8 * s} Z" fill="#141a24"/>`;
    const gold = o.krause ? '#e0b850' : '#8a8a80';
    for (let i = 0; i < 3; i++) [-34, 34].forEach((dx) => b += `<circle cx="${x + dx * s}" cy="${top + (150 + i * 46) * s}" r="${7 * s}" fill="${R(gold, 0.3, 0.3)}"/>`);
    [-1, 1].forEach((sd) => b += `<path d="M${x + sd * 50 * s},${ty - 70 * s} l${sd * 40 * s},0" stroke="${shade(o.shirt, -0.4)}" stroke-width="${5 * s}"/>`);
    if (o.krause && !o.noBino) {
      b += `<path d="M${x - 60 * s},${top + 2 * s} Q${x - 30 * s},${top + 110 * s} ${x - 20 * s},${top + 140 * s} M${x + 60 * s},${top + 2 * s} Q${x + 30 * s},${top + 110 * s} ${x + 20 * s},${top + 140 * s}" stroke="#2a1e14" stroke-width="${5 * s}" fill="none"/>`;
      [-1, 1].forEach((sd) => b += `<rect x="${x + sd * 24 * s - 18 * s}" y="${top + 130 * s}" width="${36 * s}" height="${64 * s}" rx="${10 * s}" fill="${V('#20201e', 0.25, 0.3)}"/><ellipse cx="${x + sd * 24 * s}" cy="${top + 190 * s}" rx="${16 * s}" ry="${7 * s}" fill="#5a7080"/>`);
      b += `<rect x="${x - 8 * s}" y="${top + 140 * s}" width="${16 * s}" height="${22 * s}" fill="#30302c"/>`;
    }
    if (o.snow) b += [-1, 1].map((sd) => `<path d="M${x + sd * 40 * s},${top - 2 * s} Q${x + sd * 80 * s},${top - 14 * s} ${x + sd * 110 * s},${top + 22 * s}" stroke="#eef2f6" stroke-width="${10 * s}" fill="none" stroke-linecap="round" opacity="0.85"/>`).join('');
  }
  if (o.krause) {
    // фуражка: тулья, околыш, золотой ремешок, кокарда, чёрный козырёк
    const cy = headY - hr * 0.45;
    front += `<path d="M${x - hr * 1.02},${cy - hr * 0.3} Q${x - hr * 1.42},${headY - hr * 1.32} ${x},${headY - hr * 1.36} Q${x + hr * 1.42},${headY - hr * 1.32} ${x + hr * 1.02},${cy - hr * 0.3} Z" fill="${V('#1a2232', 0.3, 0.3)}"/>`;
    front += `<path d="M${x - hr * 1.02},${cy - hr * 0.32} L${x + hr * 1.02},${cy - hr * 0.32} L${x + hr * 0.98},${cy} L${x - hr * 0.98},${cy} Z" fill="#0e131c"/>`;
    front += `<path d="M${x - hr * 0.98},${cy - hr * 0.08} L${x + hr * 0.98},${cy - hr * 0.08}" stroke="${R('#e0b850', 0.3, 0.2)}" stroke-width="${9 * hs}"/>`;
    front += `<circle cx="${x}" cy="${cy - hr * 0.62}" r="${hr * 0.2}" fill="${R('#e8c060', 0.35, 0.3)}"/><path d="M${x - hr * 0.3},${cy - hr * 0.7} Q${x},${cy - hr * 0.5} ${x + hr * 0.3},${cy - hr * 0.7}" stroke="#c89a38" stroke-width="${4 * hs}" fill="none"/>`;
    front += `<path d="M${x - hr * 0.96},${cy} Q${x},${cy + hr * 0.42} ${x + hr * 0.96},${cy} Q${x},${cy + hr * 0.16} ${x - hr * 0.96},${cy} Z" fill="${V('#0a0c10', 0.4, 0.1)}"/>`;
    // седина на висках, морщины, тень усталости под глазами
    front += [-1, 1].map((sd) => `<path d="M${x + sd * hr * 0.95},${cy + hr * 0.05} q${sd * hr * 0.08},${hr * 0.25} ${-sd * hr * 0.02},${hr * 0.5}"  stroke="#a89e94" stroke-width="${hr * 0.07}" opacity="0.8" fill="none" stroke-linecap="round"/>`).join('');
    const ey = headY + 2 * hs;
    front += [-1, 1].map((sd) => `<path d="M${x + sd * 34 * hs - 14 * hs},${ey + 20 * hs} Q${x + sd * 34 * hs},${ey + 27 * hs} ${x + sd * 34 * hs + 14 * hs},${ey + 20 * hs}" stroke="#a06a50" stroke-width="${3 * hs}" fill="none" opacity="${0.35 + (o.tired || 0) * 0.4}"/>`).join('');
    front += `<path d="M${x - 26 * hs},${ey - 52 * hs} Q${x},${ey - 58 * hs} ${x + 26 * hs},${ey - 52 * hs}" stroke="#b07a5a" stroke-width="${3 * hs}" fill="none" opacity="0.5"/>`;
  }
  if (o.phones) front += `<path d="M${x - hr * 1.02},${headY} Q${x},${headY - hr * 1.5} ${x + hr * 1.02},${headY}" stroke="#2a2a28" stroke-width="${8 * hs}" fill="none"/>` + [-1, 1].map((sd) => `<ellipse cx="${x + sd * hr}" cy="${headY + 6 * hs}" rx="${22 * hs}" ry="${30 * hs}" fill="${R('#3a3a36', 0.2, 0.3)}"/>`).join('');
  return { b, front };
}
function figure(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b });
  if (!front) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g filter="url(#soft)"${tr ? ` transform="${tr}"` : ''}>${front}</g>`;
}
const krause = (x, y, s, o = {}) => figure(x, y, s, { ...KRAUSE, ...o });
const sailor = (i, x, y, s, o = {}) => figure(x, y, s, { ...SAILOR[i % SAILOR.length], ...o });

// ---------- море, небо, погода ----------
function sky(c0, c1, c2) { return `<rect x="-300" y="-200" width="1680" height="2400" fill="${grad([[0, c0], [0.5, c1], [1, c2]])}"/>`; }
function clouds(t, y, c, op, n = 9, drift = 12, seed = 5) {
  reseed(seed); let g = '';
  for (let i = 0; i < n; i++) { const x = ((rnd() * 1600 + t * drift * (0.6 + rnd())) % 1700) - 300, yy = y + rnd() * 260, r = 90 + rnd() * 140; g += `<ellipse cx="${x}" cy="${yy}" rx="${r * 2.2}" ry="${r * 0.55}" fill="${c}" opacity="${op * (0.5 + rnd() * 0.5)}"/>`; }
  return `<g filter="url(#blur20)">${g}</g>`;
}
// море: горизонт y0, ряды волн с перспективой; c — основной цвет, f — цвет гребней
function sea(t, y0, c, f, rough = 1, y1 = 2100) {
  let g = `<rect x="-300" y="${y0}" width="1680" height="${y1 - y0 + 200}" fill="${grad([[0, shade(c, 0.12)], [0.35, c], [1, shade(c, -0.35)]])}"/>`;
  for (let r = 0; r < 26; r++) {
    const k = r / 25, y = y0 + Math.pow(k, 1.7) * (y1 - y0), amp = (3 + k * 26) * rough, len = 60 + k * 260, sp = 20 + k * 60;
    let d = `M-300,${y}`;
    for (let x = -300; x <= 1380; x += len / 4) d += ` L${x},${y + Math.sin((x + t * sp + r * 97) / len * Math.PI * 2) * amp}`;
    g += `<path d="${d}" stroke="${shade(c, -0.25)}" stroke-width="${2 + k * 8}" fill="none" opacity="0.45"/>`;
    // барашки
    reseed(100 + r);
    for (let i = 0; i < 3 + k * 4; i++) { const fx = ((rnd() * 1700 + t * sp * 0.8) % 1700) - 300, fw = (18 + k * 110) * (0.5 + rnd()); g += `<path d="M${fx - fw},${y - amp * 0.4} Q${fx},${y - amp * 1.3} ${fx + fw},${y - amp * 0.4}" stroke="${f}" stroke-width="${1.5 + k * 6}" fill="none" stroke-linecap="round" opacity="${(0.25 + rnd() * 0.45) * rough}"/>`; }
  }
  return g;
}
function snow(t, n = 70, op = 0.7, speed = 1, seed = 41) {
  reseed(seed); let g = '';
  for (let i = 0; i < n; i++) { const z = 0.4 + rnd() * 1.2, x = ((rnd() * 1300 + t * 60 * z * speed + wave(t, 0.3, i) * 20) % 1300) - 110, y = ((rnd() * 2100 + t * 140 * z * speed) % 2100) - 90; g += `<circle cx="${x}" cy="${y}" r="${1.5 * z + 1}" fill="#fff" opacity="${op * (0.3 + 0.5 * z / 1.6)}"/>`; }
  return g;
}
function smokeTrail(x, y, s, t, c = '#5a5e64', op = 0.5, seed = 3) {
  reseed(seed); let g = '';
  for (let i = 0; i < 6; i++) { const k = (t * 0.12 + i / 6) % 1; g += `<ellipse cx="${x - k * 260 * s}" cy="${y - k * 90 * s - rnd() * 10}" rx="${(20 + k * 90) * s}" ry="${(12 + k * 40) * s}" fill="${c}" opacity="${op * (1 - k)}"/>`; }
  return `<g filter="url(#blur8)">${g}</g>`;
}

// ---------- корабли и техника ----------
// эсминец сбоку, нос вправо; x,y — ватерлиния по центру; o: num, flags, dark, wake
function destroyer(x, y, s, t, o = {}) {
  const hull = o.dark ? '#20262e' : '#6c7680', sup = o.dark ? '#262c34' : '#8a949e';
  let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  g += `<path d="M-520,-40 L560,-50 Q600,-48 640,-90 L600,10 Q560,40 500,42 L-470,40 Q-520,30 -530,0 Z" fill="${V(hull, 0.12, 0.35)}"/>`;
  g += `<path d="M-520,-40 L560,-50 Q600,-48 640,-90" stroke="${shade(hull, 0.3)}" stroke-width="5" fill="none"/>`;
  g += `<rect x="-525" y="2" width="1130" height="38" fill="${o.dark ? '#141a20' : '#3a3030'}" opacity="0.8"/>`;
  // надстройка, мостик, мачта, трубы, орудия
  g += `<path d="M160,-50 L170,-150 L330,-150 L360,-50 Z" fill="${V(sup, 0.12, 0.3)}"/><path d="M190,-200 L200,-150 L320,-150 L330,-200 Z" fill="${V(sup, 0.18, 0.25)}"/>`;
  for (let i = 0; i < 5; i++) g += `<rect x="${206 + i * 22}" y="-190" width="14" height="12" fill="${o.lit ? '#ffcf80' : '#1a2028'}"/>`;
  g += `<rect x="248" y="-360" width="8" height="160" fill="${sup}"/><path d="M200,-320 L300,-320 M215,-280 L290,-280" stroke="${sup}" stroke-width="5"/><path d="M252,-360 L-120,-60 M252,-360 L560,-56" stroke="${shade(sup, -0.3)}" stroke-width="1.6" opacity="0.6"/>`;
  [[20, 0], [-120, 1]].forEach(([fx]) => g += `<path d="M${fx - 34},-50 L${fx - 28},-170 L${fx + 28},-170 L${fx + 34},-50 Z" fill="${V(sup, 0.15, 0.3)}"/><rect x="${fx - 30}" y="-180" width="60" height="14" fill="#2a2e32"/>`);
  [[430, -1], [-300, 1], [-430, 1]].forEach(([gx, d]) => g += `<path d="M${gx - 40},-50 L${gx - 34},-90 L${gx + 34},-90 L${gx + 40},-50 Z" fill="${V(sup, 0.15, 0.3)}"/><rect x="${d < 0 ? gx : gx - 90}" y="-80" width="90" height="10" rx="4" fill="${shade(sup, -0.3)}"/>`);
  for (let i = 0; i < 14; i++) g += `<rect x="${-500 + i * 75}" y="-62" width="3" height="14" fill="${shade(hull, 0.25)}"/>`;
  g += `<path d="M-500,-60 L560,-64" stroke="${shade(hull, 0.25)}" stroke-width="2"/>`;
  if (o.num) g += `<text x="470" y="-8" font-family="Montserrat, sans-serif" font-weight="800" font-size="46" fill="#e8ecef" opacity="0.85" text-anchor="middle">${o.num}</text>`;
  if (o.flags) { const pts = [[-520, -50], [252, -360], [640, -90]]; for (let sgi = 0; sgi < 2; sgi++) { const [a, b2] = [pts[sgi], pts[sgi + 1]]; for (let i = 1; i < 12; i++) { const k = i / 12, fx = lerp(a[0], b2[0], k), fy = lerp(a[1], b2[1], k) + Math.sin(k * Math.PI) * 30; g += `<path d="M${fx},${fy} l12,${4 + wave(t, 1.2, i) * 3} l-4,22 l-14,-6 Z" fill="${['#c8302a', '#f0d040', '#2a5aa8', '#f4f2ec'][(i + sgi) % 4]}"/>`; } } }
  if (o.wake) g += `<path d="M600,20 Q680,0 720,30 Q660,40 600,36 Z" fill="#e8f0f4" opacity="0.7"/><path d="M-520,30 Q-700,${40 + wave(t, 0.8) * 6} -900,30" stroke="#e8f0f4" stroke-width="14" opacity="0.4" fill="none"/>`;
  return g + `</g>`;
}
// транспорт конвоя: корпус, надстройка посередине, труба с дымом, мачты со стрелами
function freighter(x, y, s, t, c = '#4a3a34', seed = 1, dark = false) {
  let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  const hc = dark ? '#14181e' : c;
  g += `<path d="M-400,-70 L420,-80 L460,-130 L430,30 L-380,30 Q-420,0 -400,-70 Z" fill="${V(hc, 0.1, 0.35)}"/>`;
  g += `<rect x="-60" y="-170" width="160" height="100" fill="${V(dark ? '#1c2028' : '#c8c0b0', 0.1, 0.3)}"/><rect x="-40" y="-200" width="120" height="34" fill="${V(dark ? '#1c2028' : '#d8d0c0', 0.1, 0.3)}"/>`;
  g += `<rect x="40" y="-260" width="44" height="90" fill="${dark ? '#1a1e24' : '#2a2a2a'}"/><rect x="40" y="-250" width="44" height="14" fill="${dark ? '#20242a' : '#a83a2a'}"/>`;
  [-260, 280].forEach((mx) => g += `<rect x="${mx}" y="-280" width="9" height="210" fill="${dark ? '#1a1e24' : '#3a3a36'}"/><path d="M${mx + 4},-260 L${mx + (mx < 0 ? 110 : -110)},-90" stroke="${dark ? '#1a1e24' : '#3a3a36'}" stroke-width="5"/>`);
  [-200, 200, 330].forEach((hx) => g += `<rect x="${hx - 50}" y="-96" width="100" height="24" fill="${shade(hc, -0.2)}"/>`);
  g += `</g>`;
  return (dark ? '' : smokeTrail(x + 62 * s, y - 270 * s, s, t, '#4a4e54', 0.45, seed)) + g;
}
function plane(x, y, s, roll = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${roll}) scale(${s})"><path d="M-260,0 L260,-6 L262,8 L-260,14 Z" fill="${V('#5a6470', 0.2, 0.3)}"/><path d="M-40,-8 Q0,-30 60,-10 L60,22 Q0,40 -40,24 Z" fill="${V('#6a7480', 0.2, 0.3)}"/><path d="M-60,4 L-150,4 L-140,-18 Z" fill="#4a5460"/>${[-130, 130].map((ex) => `<ellipse cx="${ex}" cy="10" rx="34" ry="12" fill="#3a424c"/>`).join('')}</g>`;
}
function uboat(x, y, s, c = '#0c1a1a', op = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}"><path d="M-420,0 Q-380,-40 -200,-44 L300,-40 Q420,-30 460,0 Q420,30 300,36 L-200,40 Q-380,38 -420,0 Z" fill="${c}"/><path d="M-60,-44 L-40,-130 L80,-130 L110,-44 Z" fill="${c}"/><rect x="10" y="-200" width="10" height="72" fill="${c}"/><path d="M-470,0 L-430,-14 L-430,14 Z" fill="${c}"/></g>`;
}
function periscope(x, y, h, t, op = 1) {
  return `<g opacity="${op}"><rect x="${x - 7}" y="${y - h}" width="14" height="${h}" fill="#1a1e22"/><rect x="${x - 7}" y="${y - h}" width="26" height="16" rx="4" fill="#22282e"/><path d="M${x - 40},${y} Q${x},${y - 14 - wave(t, 2) * 3} ${x + 40},${y}" stroke="#dfe8ee" stroke-width="5" fill="none" opacity="0.7"/></g>`;
}
function railing(y, c = '#5a646e', pad = 300, dodger = true) {
  let g = '';
  if (dodger) g += `<rect x="${-pad}" y="${y}" width="${1080 + 2 * pad}" height="${2000 - y}" fill="${V('#4c565e', 0.1, 0.4)}"/><rect x="${-pad}" y="${y}" width="${1080 + 2 * pad}" height="18" fill="${shade(c, 0.25)}"/>`;
  for (let x = -pad; x < 1080 + pad; x += 120) g += `<rect x="${x}" y="${y + 18}" width="6" height="${2000 - y}" fill="${shade(c, -0.2)}" opacity="0.5"/>`;
  return g;
}

// ---------- сцены ----------
const shots = {
  // 1. Ночной мостик в красном свете: крупно Краузе, рядом радист; из рации идут волны на «враг», лицо мрачнеет к «не доживут»
  radio(t, T) {
    const k = sine(t / T);
    const camX = lerp(30, -30, k);
    const call = at(t, 1.7, 0.4), enemy = at(t, 2.5, 0.3), doom = at(t, 4.6, 0.5);
    const ring = (i) => { const p = ((t - D - 2.5) * 0.9 + i / 3) % 1; return t - D < 2.5 ? '' : `<circle cx="210" cy="1060" r="${40 + p * 260}" fill="none" stroke="#ff6a4a" stroke-width="${6 - p * 4}" opacity="${0.6 * (1 - p) * enemy}"/>`; };
    return {
      cam: { z: lerp(1.0, 1.14, k), y: lerp(0, -50, k) },
      els: [
        `<rect width="1080" height="1920" fill="#07090e"/>`,
        // за стеклом: чёрный океан, луч прожектора со снегом
        par(camX * 0.2, 0, sky('#05070c', '#0a1018', '#0c1420') + sea(t * 0.6, 900, '#0e1824', '#5a7088', 0.6) + `<path d="M1080,640 L-100,820 L-100,1000 Z" fill="${grad([[0, '#d8e4ee', 0.18], [1, '#d8e4ee', 0]], false)}"/>` + `<g opacity="0.8">${snow(t, 60, 0.6, 0.8, 7)}</g>`),
        // рамы окон мостика
        par(camX * 0.45, 0, `<path d="M-200,0 L1280,0 L1280,560 L-200,560 Z M-200,1180 L1280,1180 L1280,1920 L-200,1920 Z" fill="${V('#2a1614', 0.1, 0.4)}"/>` + [-60, 300, 680, 1040].map((x) => `<rect x="${x}" y="500" width="70" height="720" fill="${V('#301a16', 0.15, 0.3)}"/>`).join('') + `<rect x="-200" y="1150" width="1480" height="40" fill="#3a201a"/>`),
        // радист в наушниках и рация с волнами
        par(camX * 0.6, 0, `<rect x="90" y="980" width="240" height="190" rx="12" fill="${V('#3a2420', 0.15, 0.35)}"/><circle cx="210" cy="1060" r="52" fill="#1a0e0c"/>${[0, 1, 2].map((i) => `<circle cx="210" cy="1060" r="${18 + i * 12}" fill="none" stroke="#3a2420" stroke-width="4"/>`).join('')}<rect x="120" y="1130" width="80" height="20" rx="4" fill="${enemy ? '#ff8a5a' : '#5a3020'}"/>` + glow(210, 1060, 150 * (0.6 + enemy * 0.6), '#ff5a3a', 0.35 * (0.3 + enemy * 0.7)) + ring(0) + ring(1) + ring(2) +
          sailor(0, 860, 1700, 0.85, { phones: true, helmet: undefined, cap: undefined, look: -0.7, frown: 0.7, worried: true, blink: blink(t, 1.3), nod: wave(t, 0.4) * 0.5 })),
        // Краузе крупно
        par(camX, 0, krause(lerp(560, 540, k), 2700, 2.9, { look: lerp(0.1, -0.75, call) + wave(t, 0.2) * 0.05, frown: lerp(0.45, 0.9, doom), worried: true, blink: blink(t, 0.7), nod: wave(t, 0.5) * 0.5 - doom * 1.5, tired: 0.4 })),
        `<rect x="-400" y="-400" width="1880" height="2720" fill="#ff2a14" opacity="0.14" style="mix-blend-mode:color"/>`,
        glow(560, 1000, 420, '#ffb090', 0.18),
        glow(540, 1500, 900, '#ff3a1a', 0.16),
        topShade(820, 0.6),
      ],
    };
  },

  // 2. Утро: Краузе на крыле мостика; камера отъезжает, за кормой открываются колонны транспортов до горизонта
  convoy(t, T) {
    const k = sine(t / T), reveal = io((t - D - 1.6) / 3.6);
    const camX = lerp(-20, 30, k);
    let ships = '';
    const rows = [[860, 0.16, 6, 0.3], [930, 0.24, 5, 0.18], [1030, 0.36, 4, 0.05]];
    rows.forEach(([y, s, n, fade], ri) => { for (let i = 0; i < n; i++) ships += `<g opacity="${clamp(reveal * 1.6 - i * 0.12)}">${freighter(-60 + i * (1200 / n) + ri * 70 + t * 6, y, s, t, ['#4a3a34', '#3a4248', '#5a4a3a', '#44403a'][(i + ri) % 4], i + ri * 7)}</g>`; ships += `<rect x="-300" y="${y - 260 * s}" width="1680" height="${300 * s}" fill="#b8c4cc" opacity="${fade}"/>`; });
    return {
      cam: { z: lerp(1.45, 1.0, io((t - D) / (T * 0.85))), y: lerp(-260, 0, io((t - D) / (T * 0.85))), x: lerp(60, 0, k) },
      els: [
        sky('#7a8a98', '#aab6c0', '#c4ccd2') + clouds(t, 160, '#e2e8ec', 0.7, 10, 14),
        glow(820, 520, 360, '#fff4e0', 0.35),
        par(camX * 0.15, 0, sea(t, 820, '#4a5c6a', '#e8eef2', 0.8)),
        par(camX * 0.25, 0, ships),
        // чайки по дугам
        par(camX * 0.4, 0, [0, 1, 2].map((i) => { const gx = ((t * (70 + i * 20) + i * 400) % 1400) - 160, gy = 620 + i * 70 + Math.sin(t * 0.8 + i) * 40, f = wave(t, 2.2, i) * 14; return `<path d="M${gx - 24},${gy + f} Q${gx - 10},${gy - 8} ${gx},${gy} Q${gx + 10},${gy - 8} ${gx + 24},${gy + f}" stroke="#f4f6f8" stroke-width="5" fill="none" stroke-linecap="round"/>`; }).join('')),
        // крыло мостика: поручень, брезентовый обвес
        par(camX * 0.8, 0, krause(330, 2330, 1.75, { look: lerp(0.2, 0.9, at(t, 3.9, 1.0)), frown: 0.3, smile: false, blink: blink(t, 0.4), nod: wave(t, 0.4) * 0.6, lean: lerp(0, 2, k) }) + railing(1520, '#5a646e', 300) + `<rect x="-300" y="1560" width="1680" height="400" fill="${grad([[0, '#3a444c'], [1, '#1e242a']])}"/>` + label(540, 1640, 'DD-548', 30, '#e8ecef', 0.25)),
        grade('#9ab0c8', 0.25),
        topShade(760, 0.5),
      ],
    };
  },

  // 3. Штурманский стол: на карте посреди океана растекается «Чёрная яма», пять отметок суток; потом последний самолёт качает крыльями и уходит
  gap(t, T) {
    const k = sine(t / T);
    const pit = at(t, 0.6, 1.0), days = (i) => at(t, 1.8 + i * 0.12, 0.25), sw = io((t - D - 2.7) / 0.7);
    const route = clamp((t - D) / 2.6);
    // карта
    let map = `<rect x="80" y="760" width="920" height="1060" rx="6" fill="${V('#d8ccaa', 0.1, 0.25)}"/>`;
    for (let i = 0; i < 9; i++) map += `<path d="M80,${800 + i * 120} L1000,${800 + i * 120}" stroke="#8a7a5a" stroke-width="1.2" opacity="0.4"/><path d="M${120 + i * 110},760 L${120 + i * 110},1820" stroke="#8a7a5a" stroke-width="1.2" opacity="0.4"/>`;
    map += `<path d="M80,1000 Q170,1020 200,1120 Q240,1200 180,1300 Q150,1380 80,1420 Z" fill="${V('#9a8a62', 0.1, 0.2)}"/>`; // Ньюфаундленд
    map += `<path d="M300,760 Q420,780 480,840 Q440,900 380,880 Q320,850 300,760 Z" fill="${V('#e8e4da', 0.05, 0.15)}"/>`; // Гренландия
    map += `<path d="M1000,960 Q900,990 880,1070 Q900,1140 950,1160 Q910,1220 940,1280 L1000,1290 Z" fill="${V('#9a8a62', 0.1, 0.2)}"/>`; // Британия
    // зоны прикрытия с воздуха — сжимаются, между ними чернеет яма
    map += `<circle cx="150" cy="1220" r="${lerp(330, 300, pit)}" fill="#3a7a5a" opacity="0.13"/><circle cx="950" cy="1130" r="${lerp(330, 300, pit)}" fill="#3a7a5a" opacity="0.13"/>`;
    map += `<g filter="url(#blur8)"><ellipse cx="545" cy="1180" rx="${200 * pit + wave(t, 0.3) * 6}" ry="${260 * pit}" fill="#0a0c10" opacity="${0.8 * pit}"/></g>`;
    map += label(545, 1190, 'BLACK PIT', 24, '#e8dcc0', 0.6 * pit);
    // маршрут и конвой
    map += `<path d="M190,1250 Q545,1120 900,1150" stroke="#8a2a20" stroke-width="5" fill="none" stroke-dasharray="16 12" opacity="0.8"/>`;
    for (let i = 0; i < 5; i++) { const kk = 0.28 + i * 0.11, px = lerp(190, 900, kk), py = 1250 - Math.sin(kk * Math.PI) * 100 + kk * -60 + 30; map += `<g opacity="${days(i)}"><path d="M${px},${py - 26} l0,52" stroke="#8a2a20" stroke-width="5"/>${label(px, py - 36, ['I', 'II', 'III', 'IV', 'V'][i], 20, '#8a2a20', 0.9)}</g>`; }
    const cxr = lerp(190, 900, route * 0.3), cyr = 1250 - Math.sin(route * 0.3 * Math.PI) * 100;
    map += `<path d="M${cxr - 16},${cyr} L${cxr + 18},${cyr} L${cxr + 6},${cyr - 12} Z" fill="#1a1a1a"/>`;
    map += label(960, 1800, 'kinoplot.film', 13, '#6a5a3a', 0.45, -90);
    // циркуль качается по дуге
    const ca = lerp(-30, 10, sine(t / 3));
    map += `<g transform="rotate(${ca} 700 900)"><path d="M700,900 L640,1180 M700,900 L760,1170" stroke="#9aa0a6" stroke-width="7" stroke-linecap="round"/><circle cx="700" cy="900" r="14" fill="#c8a860"/></g>`;
    const table = `<rect x="-200" y="560" width="1480" height="1500" fill="${V('#4a3020', 0.1, 0.35)}"/>` + map + glow(540, 1050, 700, '#ffcf80', 0.25) + `<path d="M540,0 L540,560" stroke="#222" stroke-width="6"/><path d="M430,600 Q540,520 650,600 Z" fill="#2a3a2e"/>`;
    // небо с самолётом
    const pl = clamp((t - D - 2.8) / 3.0), wag = Math.sin((t - D - 2.8) * 6) * 16 * clamp(1 - Math.abs(pl - 0.45) * 3);
    const px2 = lerp(1250, -250, sine(pl)), py2 = lerp(1050, 820, pl) - Math.sin(pl * Math.PI) * 90;
    const skyG = sky('#5a6876', '#8a98a4', '#a8b2ba') + clouds(t, 600, '#d8dfe4', 0.6, 9, 20, 9) + sea(t, 1300, '#3a4a58', '#dde6ec', 0.9) +
      [0, 1, 2, 3].map((i) => freighter(140 + i * 250 + (i % 2) * 40, 1370 + (i % 2) * 70, 0.17 + (i % 2) * 0.05, t, '#3a3a3a', i)).join('') +
      plane(px2, py2, 1.05, wag + pl * 12);
    return {
      cam: { z: lerp(1.05, 1.15, k), y: lerp(20, -30, k) },
      els: [
        `<g opacity="${1 - sw}" transform="translate(0 ${-sw * 120})">${table}</g>`,
        `<g opacity="${sw}">${skyG}</g>`,
        grade('#c8a070', 0.15 * (1 - sw)),
        topShade(800, 0.5),
      ],
    };
  },

  // 4. Под водой: под днищами конвоя скользят подлодки; на «бьют» — ночная поверхность, перископ, след торпеды; на «исчезают» перископ уходит
  wolves(t, T) {
    const sw = io((t - D - 1.45) / 0.45);
    const k = sine(t / T);
    // подводный мир
    let under = `<rect x="-200" y="-100" width="1480" height="2200" fill="${grad([[0, '#2a5a5a'], [0.35, '#123232'], [1, '#040c0e']])}"/>`;
    under += `<rect x="-200" y="0" width="1480" height="240" fill="${grad([[0, '#8ac0b8', 0.6], [1, '#8ac0b8', 0]])}"/>`;
    for (let i = 0; i < 7; i++) under += `<path d="M${i * 180 - 100 + wave(t, 0.2, i) * 30},0 L${i * 180 - 40 + wave(t, 0.2, i) * 30},0 L${i * 180 + 160},1400 L${i * 180},1400 Z" fill="${grad([[0, '#bfe8e0', 0.08], [1, '#bfe8e0', 0]])}"/>`;
    [[-80, 0.5], [360, 0.42], [780, 0.5]].forEach(([fx, s]) => under += `<path d="M${fx - 440 * s},140 L${fx + 480 * s},140 Q${fx + 420 * s},${140 + 120 * s} ${fx + 300 * s},${140 + 150 * s} L${fx - 300 * s},${140 + 150 * s} Q${fx - 420 * s},${140 + 110 * s} ${fx - 440 * s},140 Z" fill="#0a1618" opacity="0.9"/>`);
    under += uboat(lerp(380, 640, k), 1250, 0.95, '#061214');
    under += uboat(lerp(900, 640, k), 860, 0.55, '#0c2224', 0.85);
    under += uboat(lerp(150, 420, k), 600, 0.35, '#14302e', 0.6);
    reseed(3); for (let i = 0; i < 40; i++) { const bx = rnd() * 1080, by = (rnd() * 1900 - t * (40 + rnd() * 60) + 1900) % 1900; under += `<circle cx="${bx}" cy="${by}" r="${1 + rnd() * 3}" fill="#bfe8e0" opacity="${0.15 + rnd() * 0.25}"/>`; }
    // ночная поверхность
    const up = at(t, 1.5, 0.5), down = at(t, 2.5, 0.8), torp = clamp((t - D - 1.9) / 1.6);
    let surf = sky('#04060a', '#0a1018', '#101a26') + clouds(t, 300, '#1a2230', 0.6, 8, 10, 3) + sea(t, 980, '#0c1620', '#4a6278', 0.7);
    surf += freighter(lerp(760, 720, k), 1000, 0.42, t, '#141a20', 2, true);
    surf += `<path d="M${lerp(300, 700, torp * 0.9)},${lerp(1500, 1060, torp * 0.9)} L300,1500" stroke="#e8f2f8" stroke-width="${lerp(14, 6, torp)}" opacity="${0.75 * clamp(torp * 4) * (1 - clamp((torp - 0.85) * 6))}" stroke-linecap="round"/>`;
    surf += periscope(300, 1500, 280 * up * (1 - down), t, clamp(up * 3) * (1 - down * 0.8));
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k), x: lerp(20, -20, k) },
      els: [
        `<g opacity="${1 - sw}">${under}</g>`,
        `<g opacity="${sw}">${surf}</g>`,
        topShade(760, 0.55),
      ],
    };
  },

  // 5. Мостик днём в шторм: офицеры ждут приказа, брызги в стекло, кофе стынет; на «команда» Краузе указывает, камера подходит
  bridge(t, T) {
    const k = sine(t / T), roll = wave(t, 0.12) * 3.5;
    const cmd = at(t, 2.3, 0.5), push = io((t - D - 3.0) / 2.2), err = at(t, 4.4, 0.4);
    const spray = (seed) => { reseed(seed); let g = ''; for (let i = 0; i < 26; i++) { const x = rnd() * 1080, y = 560 + rnd() * 560, r = 3 + rnd() * 10; g += `<circle cx="${x}" cy="${y + ((t * 30 * rnd()) % 80)}" r="${r}" fill="#dfe8ee" opacity="${0.18 + rnd() * 0.2}"/>`; } return g; };
    return {
      cam: { z: lerp(1.0, 1.28, push), y: lerp(0, -170, push), x: lerp(-20, 0, k) },
      els: [
        `<rect width="1080" height="1920" fill="#1a1f26"/>`,
        // за стеклом: шторм, горизонт плавно качается
        `<g transform="rotate(${roll} 540 900)">${sky('#4a5560', '#6a7680', '#7a8690')}${clouds(t, 520, '#9aa4ac', 0.6, 10, 30, 4)}${sea(t * 1.4, 880, '#33414c', '#e0e8ee', 1.4)}${freighter(800, 900, 0.16, t, '#3a3a3a', 5)}</g>`,
        spray(9),
        // рамы
        `<path d="M-200,0 L1280,0 L1280,540 L-200,540 Z M-200,1160 L1280,1160 L1280,1920 L-200,1920 Z" fill="${V('#5a646c', 0.1, 0.45)}"/>` + [-40, 330, 710, 1060].map((x) => `<rect x="${x}" y="500" width="60" height="700" fill="${V('#4a545c', 0.2, 0.3)}"/>`).join(''),
        // переговорные трубы и машинный телеграф справа
        `<g transform="translate(900 1220)"><rect x="-14" y="0" width="28" height="500" fill="${V('#8a7040', 0.2, 0.3)}"/><circle cx="0" cy="0" r="80" fill="${R('#c8a050', 0.3, 0.35)}"/><circle cx="0" cy="0" r="60" fill="#f0ead8"/><path d="M0,0 L${Math.cos(-1.2 - cmd * 1.6) * 52},${Math.sin(-1.2 - cmd * 1.6) * 52}" stroke="#2a2a2a" stroke-width="7" stroke-linecap="round"/></g>`,
        // ящик с трафаретом (пасхалка)
        `<rect x="40" y="1540" width="240" height="150" fill="${V('#5a6650', 0.1, 0.3)}"/><rect x="40" y="1540" width="240" height="14" fill="#4a5640"/>` + label(160, 1625, 'kinoplot.film', 20, '#d8dcc8', 0.35, 0, 'Courier New, monospace'),
        // офицеры смотрят на капитана
        sailor(1, 170, 1990, 0.95, { look: 0.8, blink: blink(t, 2.1), nod: wave(t, 0.5, 1) * 0.6, lean: roll * 0.4 }),
        sailor(2, 930, 2010, 0.95, { look: -0.8, blink: blink(t, 0.9), nod: wave(t, 0.45, 2) * 0.6, lean: roll * 0.4 }),
        krause(540, 2030, 1.25, { arms: cmd > 0.3 ? 'point' : 'down', look: lerp(-0.2, 0.3, cmd) + wave(t, 0.25) * 0.15, frown: lerp(0.5, 0.95, err), worried: err > 0.5, blink: blink(t, 0.2), nod: wave(t, 0.4) * 0.5, lean: roll * 0.5, tired: 0.6 }),
        // кофе на поручне — пар, нетронутый
        `<rect x="680" y="1700" width="400" height="22" fill="#3a4048"/><path d="M800,1640 L812,1700 L868,1700 L880,1640 Z" fill="${V('#e8e4da', 0.1, 0.25)}"/><path d="M880,1655 q22,6 0,30" stroke="#d8d4ca" stroke-width="7" fill="none"/>` + [0, 1].map((i) => `<path d="M${830 + i * 20},1630 q${wave(t, 0.6, i) * 14},-30 0,-60 q${-wave(t, 0.6, i) * 14},-30 0,-60" stroke="#fff" stroke-width="4" fill="none" opacity="0.25"/>`).join(''),
        grade('#8aa0b8', 0.25),
        topShade(800, 0.55),
      ],
    };
  },

  // 6. Выбор: экран гидролокатора с отметкой → плот с людьми в ледяной воде → вид в перископ: эсминец в перекрестье
  dilemma(t, T) {
    const pan = io((t - D - 1.2) / 0.6), scope = io((t - D - 3.4) / 0.6);
    const sweep = ((t - D) * 2.2) % (Math.PI * 2);
    // гидролокатор
    let sonar = `<rect x="-400" y="-200" width="1480" height="2300" fill="#0a0e0c"/><circle cx="540" cy="1100" r="400" fill="${R('#0e3a24', 0.15, 0.4)}"/>`;
    for (let r = 100; r <= 400; r += 100) sonar += `<circle cx="540" cy="1100" r="${r}" fill="none" stroke="#3aff9a" stroke-width="2" opacity="0.25"/>`;
    sonar += `<path d="M540,1100 L${540 + Math.cos(sweep) * 400},${1100 + Math.sin(sweep) * 400}" stroke="#7affc0" stroke-width="5" opacity="0.8"/>`;
    sonar += `<path d="M540,1100 L${540 + Math.cos(sweep) * 400},${1100 + Math.sin(sweep) * 400} A400,400 0 0 0 ${540 + Math.cos(sweep - 0.6) * 400},${1100 + Math.sin(sweep - 0.6) * 400} Z" fill="#3aff9a" opacity="0.18"/>`;
    const blip = 0.5 + 0.5 * Math.sin((t - D) * 6);
    sonar += glow(700, 930, 60, '#7affc0', 0.9 * blip) + `<circle cx="700" cy="930" r="12" fill="#c8ffe4" opacity="${0.6 + 0.4 * blip}"/>`;
    sonar += `<rect x="130" y="680" width="820" height="840" rx="40" fill="none" stroke="${V('#3a403c', 0.2, 0.3)}" stroke-width="40"/>`;
    // плот в ледяной воде
    let raft = sky('#56626e', '#7a8692', '#9aa4ac') + sea(t, 760, '#2e3c48', '#e6eef2', 1.1);
    const by = 1300 + wave(t, 0.5) * 18, rr = wave(t, 0.4) * 4;
    raft += `<g transform="rotate(${rr} 540 ${by})"><ellipse cx="540" cy="${by}" rx="330" ry="70" fill="${V('#c86a2a', 0.2, 0.3)}"/><ellipse cx="540" cy="${by - 10}" rx="270" ry="44" fill="#6a3a1a"/>`;
    raft += [[400, 0], [540, 1], [680, 2]].map(([x, i]) => figure(x, by + 20, 0.55, { ...SAILOR[i], helmet: undefined, cap: undefined, shirt: '#3a3a3a', pose: 'crouch', arms: (i === 1 ? 'raise' : 'down'), worried: true, frown: 0.8, look: 0, blink: blink(t, i), nod: wave(t, 1.2, i) * 0.8, rot: i === 1 ? wave(t, 1.6) * 6 : 0 })).join('');
    raft += `</g>` + sea(t + 3, by + 40, '#2e3c48', '#e6eef2', 0.8).replace(/<rect[^>]*\/>/, '');
    raft += `<g opacity="0.8">${snow(t, 50, 0.6, 1, 13)}</g>`;
    // вид в перископ
    let scopeV = sky('#3a4450', '#5a6672', '#6a7682') + sea(t, 1000, '#2a3844', '#d8e2e8', 0.9) + destroyer(540, 1020, 0.62, t, { num: '548', dark: false });
    scopeV = `<g>${scopeV}</g><path d="M-400,-800 L1480,-800 L1480,2200 L-400,2200 Z M540,620 m-430,0 a430,430 0 1 0 860,0 a430,430 0 1 0 -860,0" fill="#05070a" fill-rule="evenodd" transform="translate(0 ${400})"/>` +
      `<g transform="translate(0 400)" stroke="#000" stroke-width="3" opacity="0.8"><path d="M110,620 L970,620 M540,190 L540,1050"/>${[-3, -2, -1, 1, 2, 3].map((i) => `<path d="M${540 + i * 100},605 L${540 + i * 100},635"/>`).join('')}</g>`;
    return {
      cam: { z: lerp(1.0, 1.06, sine(t / T)) },
      els: [
        `<g transform="translate(${-pan * 1080} 0)"><g transform="translate(1080 0)">${raft}</g>${sonar}</g>`,
        `<g opacity="${scope}" transform="scale(${lerp(1.15, 1, scope)}) translate(${lerp(-80, 0, scope)} 0)">${scopeV}</g>`,
        topShade(780, 0.5),
      ],
    };
  },

  // 7. Музейный эсминец у причала на реке, флаги расцвечивания; фото-стикер Хэнкса под имя; на «настоящем эсминце» камера идёт вдоль борта
  real(t, T) {
    const k = sine(t / T), glide = io((t - D - 2.3) / 3.8);
    return {
      cam: { z: lerp(1.0, 1.3, glide), x: lerp(0, -260, glide), y: lerp(0, -40, glide) },
      els: [
        sky('#5a8ac0', '#9ec2e0', '#d8e6ee') + clouds(t, 220, '#ffffff', 0.7, 8, 10, 12),
        glow(880, 360, 300, '#fff6d8', 0.6),
        // дальний берег: деревья, мост, город
        par(lerp(0, 40, k), 0, `<path d="M-300,1120 L1380,1120 L1380,1030 Q1200,980 1000,1010 Q820,960 640,1000 Q420,970 220,1010 Q40,985 -300,1020 Z" fill="${V('#5a7a5a', 0.1, 0.3)}"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${600 + i * 60}" y="${940 - (i % 3) * 40}" width="46" height="${80 + (i % 3) * 40}" fill="#8a9aa8" opacity="0.6"/>`).join('')),
        // река
        par(lerp(0, 60, k), 0, `<rect x="-300" y="1120" width="1680" height="900" fill="${grad([[0, '#6a7a70'], [1, '#3a4a44']])}"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${-200 + ((i * 230 + t * 30) % 1500)},${1180 + i * 70} l${120 + i * 20},0" stroke="#c8d4d0" stroke-width="4" opacity="0.3"/>`).join('')),
        // эсминец-музей и причал
        par(lerp(0, 120, k), 0, destroyer(600, 1330, 1.25, t, { num: '661', flags: true }) + `<rect x="-300" y="1380" width="1680" height="40" fill="${V('#8a7a66', 0.2, 0.3)}"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${-260 + i * 200}" y="1400" width="22" height="200" fill="#5a4a3a"/>`).join('') + `<rect x="-300" y="1600" width="1680" height="400" fill="${grad([[0, '#5a6a64'], [1, '#2a3632']])}"/>`),
        sticker({ k: 'hanks', at: D + 1.2, out: D + 2.4, x: 330, y: 1240, w: 470, h: 540, tilt: -4 }, t, 0),
        grade('#ffd8a0', 0.15),
        topShade(760, 0.45),
      ],
    };
  },

  // 8. Рассвет: Краузе один на крыле мостика, снег на плечах, бинокль опущен; вдали дымы конвоя
  dawn(t, T) {
    const k = sine(t / T);
    return {
      cam: { z: lerp(1.0, 1.15, k), y: lerp(0, -80, k), x: lerp(-30, 10, k) },
      els: [
        sky('#2a3448', '#8a7a88', '#e8a878'),
        glow(780, 1000, 520, '#ffc890', 0.55),
        clouds(t, 380, '#5a5a70', 0.6, 9, 8, 21),
        par(lerp(-20, 20, k), 0, sea(t * 0.8, 1000, '#3a4658', '#f0d0b0', 0.7) + [0, 1, 2, 3, 4].map((i) => freighter(80 + i * 220, 1010 + (i % 2) * 10, 0.1, t, '#2a2a30', i + 3)).join('')),
        par(lerp(-40, 40, k), 0, krause(400, 2560, 2.3, { look: lerp(0.6, 0.15, at(t, 1.5, 1.2)), frown: 0.6, worried: true, snow: true, blink: blink(t, 1.1), nod: wave(t, 0.35) * 0.6 + 0.5, tired: 1 }) + railing(1640, '#5a646e', 300)),
        `<g opacity="0.9">${snow(t, 80, 0.7, 0.6, 29)}</g>`,
        grade('#ffb080', 0.25),
        topShade(780, 0.5),
      ],
    };
  },
};

run(shots);
