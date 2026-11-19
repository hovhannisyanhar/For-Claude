// «Ирландец» (2019) — 10 сцен в 2D-векторе. Имя плана = set сцены в videos/the-irishman/script.json.
// Нуар: ночной сине-стальной, янтарные лампы, красный акцент «краски». Сцена 9 — фото-стикеры актёров.
import { run, person, setProportions, V, R, grad, glow, silFilter, smoke, dust, rnd, shade, lerp, ease, clamp, wave } from './core.js';

// пропорции как в «Жизнь прекрасна»
const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

const FRANK = { shirt: '#2e3646', pants: '#252c38', skin: '#e6b496', hair: '#3a2a20', iris: '#3a5a7a', beard: false, frown: 0.2, tie: '#8a1e26' };
const DRIVER = { shirt: '#56708a', pants: '#2f3a48', skin: '#e6b496', hair: '#3a2a20', iris: '#3a5a7a', beard: false, frown: 0, cap: '#3a4656' };
const OLD = { shirt: '#4b5466', pants: '#3a404c', skin: '#e0b8a0', hair: '#e8e8e8', iris: '#3a5a7a', beard: false, frown: 0.1, glasses: true, tie: '#5a4a3a' };
const RUSSELL = { shirt: '#1e2128', pants: '#1a1d22', skin: '#dcae92', hair: '#a0a0a0', iris: '#3a3a3a', beard: false, frown: 0, fedora: '#2a2c32', glasses: true, tie: '#44474f' };
const HOFFA = { shirt: '#7e7564', pants: '#5e584c', skin: '#e6b494', hair: '#1c1816', iris: '#2a1a12', beard: false, frown: 0.5, tie: '#8a2a2a' };
const PEGGY = { robe: '#c2905e', shirt: '#c2905e', skin: '#f2c8a8', hair: '#3a2418', iris: '#3a2a1a', beard: false, longHair: true, frown: -0.2 };
const CROWD = (c) => ({ shirt: c, pants: shade(c, -0.3), skin: '#d8a888', hair: '#1e1814', beard: false, frown: 0 });

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const ground = (y, c, k = 0.1, d = 0.4) => `<path d="M0,${y} L1080,${y} L1080,1920 L0,1920 Z" fill="${V(c, k, d)}"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 260, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.11}" fill="#000" opacity="${op}"/>`;

// геометрия головы — повторяет person() из core.js, чтобы дорисовать очки и галстук
function headAt(x, y, s, o) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const legH = ((o.pose || 'stand') === 'crouch' ? 90 : o.pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  const headY = top - hr * 0.8 + (o.nod || 0) * 6 * hs;
  return { hs, hr, top, headY, ey: headY + 2 * hs };
}
// человек + очки/галстук
function man(x, y, s, o) {
  let g = person(x, y, s, o);
  const { hs, top, ey } = headAt(x, y, s, o);
  const lk = o.look || 0;
  let add = '';
  if (o.tie && !o.sil) add += `<path d="M${x - 14 * s},${top + 6 * s} L${x + 14 * s},${top + 6 * s} L${x + 10 * s},${top + 26 * s} L${x + 22 * s},${top + 150 * s} L${x},${top + 176 * s} L${x - 22 * s},${top + 150 * s} L${x - 10 * s},${top + 26 * s} Z" fill="${V(o.tie, 0.2, 0.3)}"/><path d="M${x - 60 * s},${top - 4 * s} L${x},${top + 40 * s} L${x + 60 * s},${top - 4 * s} L${x},${top + 10 * s} Z" fill="#ece6da"/>`;
  if (o.glasses && !o.sil) {
    const c = o.glassesColor || '#141414';
    [-1, 1].forEach((side) => { const ex = x + side * 34 * hs + lk * 8 * hs; add += `<rect x="${ex - 25 * hs}" y="${ey - 20 * hs}" width="${50 * hs}" height="${40 * hs}" rx="${10 * hs}" fill="#ffffff" fill-opacity="0.08" stroke="${c}" stroke-width="${6 * hs}"/>`; });
    add += `<path d="M${x - 9 * hs + lk * 8 * hs},${ey - 6 * hs} Q${x + lk * 8 * hs},${ey - 14 * hs} ${x + 9 * hs + lk * 8 * hs},${ey - 6 * hs}" stroke="${c}" stroke-width="${5 * hs}" fill="none"/>`;
  }
  if (!add) return g;
  // галстук должен лежать под руками, но поверх торса: проще — поверх всего с тем же наклоном
  const tr = [];
  if (o.lean) tr.push(`rotate(${o.lean} ${x} ${y})`);
  return g + `<g${tr.length ? ` transform="${tr.join(' ')}"` : ''}>${add}</g>`;
}

// ---- реквизит ----
function lamp(x, y, len, swing, cone = 1) {
  const lx = x + Math.sin(swing) * len, ly = y + Math.cos(swing) * len;
  return `<path d="M${lx - 40},${ly + 30} L${lx - 460},${ly + 1100} L${lx + 460},${ly + 1100} L${lx + 40},${ly + 30} Z" fill="${grad([[0, '#ffd9a0', 0.45 * cone], [1, '#ffd9a0', 0]])}"/>
  <line x1="${x}" y1="${y - 500}" x2="${lx}" y2="${ly}" stroke="#0a0a0c" stroke-width="5"/>
  <path d="M${lx - 70},${ly + 36} Q${lx},${ly - 30} ${lx + 70},${ly + 36} Z" fill="${V('#2a3a32', 0.25, 0.3)}"/>${glow(lx, ly + 44, 200, '#ffc77a', 0.8 * cone)}<ellipse cx="${lx}" cy="${ly + 36}" rx="34" ry="9" fill="#fff0c8"/>`;
}
function wheelchair(x, y, s, c = '#1a1e28', lit = '#cfe0ff') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="-150" cy="-110" r="110" fill="none" stroke="${c}" stroke-width="16"/><circle cx="150" cy="-110" r="110" fill="none" stroke="${c}" stroke-width="16"/>
    <circle cx="-150" cy="-110" r="110" fill="none" stroke="${lit}" stroke-width="4" opacity="0.4" stroke-dasharray="90 600"/>
    <circle cx="150" cy="-110" r="110" fill="none" stroke="${lit}" stroke-width="4" opacity="0.4" stroke-dasharray="90 600"/>
    <rect x="-170" y="-260" width="340" height="40" rx="12" fill="${c}"/><rect x="-150" y="-560" width="300" height="300" rx="24" fill="${V('#2c3240', 0.15, 0.3)}"/></g>`;
}
function windowFrame(x, y, w, h, skyFill, t = 0, snow = 0) {
  let fl = '';
  for (let i = 0; i < 46 * snow; i++) { const sx = x + ((rnd() * w + t * 12) % w), sy = y + ((rnd() * h + t * (40 + rnd() * 40)) % h); fl += `<circle cx="${sx}" cy="${sy}" r="${2 + rnd() * 4}" fill="#fff" opacity="0.85"/>`; }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${skyFill}"/>${fl}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#262b36" stroke-width="22"/><line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#262b36" stroke-width="14"/><line x1="${x}" y1="${y + h * 0.45}" x2="${x + w}" y2="${y + h * 0.45}" stroke="#262b36" stroke-width="14"/>`;
}
function truck(x, y, s, bonnet = 0) {
  const wheel = (wx) => `<circle cx="${wx}" cy="-40" r="46" fill="#121212"/><circle cx="${wx}" cy="-40" r="20" fill="${R('#8a8a8a')}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">
    <rect x="-440" y="-340" width="540" height="270" rx="16" fill="${V('#dcd6c6', 0.15, 0.25)}"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${-420 + i * 90}" y="-310" width="8" height="215" fill="#000" opacity="0.07"/>`).join('')}
    <rect x="-440" y="-80" width="580" height="22" fill="#2a2a2e"/>
    <path d="M100,-80 L100,-270 Q100,-290 120,-290 L225,-290 Q250,-290 262,-266 L300,-180 L395,-168 Q422,-163 424,-132 L424,-80 Z" fill="${V('#9a2a26', 0.25, 0.3)}"/>
    <path d="M126,-266 L222,-266 Q236,-266 244,-250 L272,-186 L126,-186 Z" fill="${grad([[0, '#c8dcea'], [1, '#7a98b0']])}"/>
    <g transform="rotate(${-bonnet * 50} 300 -180)"><path d="M300,-180 L395,-168 Q422,-163 424,-140 L300,-156 Z" fill="${V('#9a2a26', 0.3, 0.2)}"/></g>
    ${bonnet > 0.3 ? `<rect x="306" y="-160" width="104" height="40" fill="#141414" opacity="0.85"/>${glow(358, -140, 70, '#ff9a4a', 0.35 * bonnet)}` : ''}
    <circle cx="410" cy="-120" r="14" fill="#fff0c0"/>
    ${wheel(-330) + wheel(-200) + wheel(310)}</g>`;
}
function pump(x, y, s, c) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-40" y="-240" width="80" height="240" rx="14" fill="${V(c, 0.25, 0.3)}"/><circle cx="0" cy="-268" r="40" fill="#f4ecd8"/><circle cx="0" cy="-268" r="28" fill="${c}" opacity="0.6"/><rect x="-26" y="-200" width="52" height="48" rx="6" fill="#f4ecd8" opacity="0.9"/><path d="M40,-160 Q84,-140 70,-70" stroke="#1a1a1a" stroke-width="7" fill="none"/></g>`;
}
function drips(x0, x1, y, grow, n = 15, maxLen = 640) {
  let g = `<path d="M${x0},${y} Q${(x0 + x1) / 2},${y - 40} ${x1},${y} L${x1},${y + 50} L${x0},${y + 50} Z" fill="#8e0f16" opacity="${clamp(grow * 2)}"/>`;
  for (let i = 0; i < n; i++) {
    const cx = x0 + ((i + 0.5) / n) * (x1 - x0) + (rnd() - 0.5) * 30, len = maxLen * (0.3 + rnd() * 0.7) * clamp(grow * (0.8 + rnd() * 0.6)), w = 12 + rnd() * 18;
    g += `<rect x="${cx - w / 2}" y="${y + 30}" width="${w}" height="${len}" rx="${w / 2}" fill="#a0121c"/><circle cx="${cx}" cy="${y + 30 + len}" r="${w * 0.78}" fill="#a0121c"/><rect x="${cx - w / 2 + 3}" y="${y + 34}" width="4" height="${len * 0.7}" rx="2" fill="#ff7a6a" opacity="0.35"/>`;
  }
  return g;
}
function crate(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-90" y="-60" width="180" height="120" fill="${V('#9a7448', 0.2, 0.3)}"/><path d="M-80,-50 L80,50 M80,-50 L-80,50" stroke="#6a4e30" stroke-width="10"/><rect x="-90" y="-60" width="180" height="16" fill="#b8905e"/></g>`;
}
function carcass(x, y, s, sw) {
  return `<g transform="rotate(${sw} ${x} ${y}) translate(${x} ${y}) scale(${s})"><line x1="0" y1="-30" x2="0" y2="20" stroke="#a8b2c0" stroke-width="6"/><path d="M0,20 q-70,50 -64,190 q14,110 64,140 q50,-30 64,-140 q6,-140 -64,-190 Z" fill="${V('#c8605e', 0.2, 0.3)}"/><path d="M0,44 q-38,50 -36,150" stroke="#f4dccc" stroke-width="14" fill="none" opacity="0.7"/></g>`;
}
function phoneWall(x, y, s, ring) {
  return `<g transform="translate(${x} ${y}) rotate(${ring}) scale(${s})" filter="url(#soft)"><rect x="-60" y="-110" width="120" height="210" rx="18" fill="${V('#2a2a2a', 0.2, 0.3)}"/><circle cx="0" cy="-20" r="42" fill="#1a1a1a" stroke="#666" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => { const a = (i / 10) * Math.PI * 2; return `<circle cx="${Math.cos(a) * 28}" cy="${-20 + Math.sin(a) * 28}" r="5" fill="#888"/>`; }).join('')}</g>`;
}
function flag(x, y, c, t, ph) {
  const f = wave(t, 0.6, ph) * 14;
  return `<rect x="${x}" y="${y}" width="10" height="520" fill="#2a2a30"/><path d="M${x + 10},${y + 10} q80,${f} 170,0 l0,130 q-90,${-f} -170,0 Z" fill="${V(c, 0.2, 0.25)}"/>`;
}

// ---- фото-стикеры: картинки грузим заранее в data URL, чтобы кадр не ждал сеть ----
const STICKER_SRC = { deniro: 'deniro-cut.png', pacino: 'pacino-cut.png', pesci: 'pesci-cut.png' };
const IMG = {};
await Promise.all(Object.entries(STICKER_SRC).map(async ([k, f]) => {
  try {
    const b = await (await fetch(`/public/assets/the-irishman/${f}`)).blob();
    IMG[k] = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  } catch { IMG[k] = ''; }
}));
// at — секунда появления от начала плана (AUDIO_DELAY 4 кадра + время слова)
const STICKERS = [
  { k: 'deniro', x: 300, y: 1060, w: 400, h: 520, at: 33 / 30, tilt: -6 },
  { k: 'pacino', x: 700, y: 1210, w: 560, h: 398, at: 50 / 30, tilt: 4 },
  { k: 'pesci', x: 410, y: 1420, w: 430, h: 350, at: 69 / 30, tilt: -3 },
];
const STICKER_FILTER = `<filter id="stk" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="10" result="dil"/><feFlood flood-color="#ffffff"/><feComposite in2="dil" operator="in" result="outline"/><feGaussianBlur in="dil" stdDeviation="12" result="blur"/><feOffset in="blur" dx="8" dy="16" result="sh"/><feFlood flood-color="#000" flood-opacity="0.55"/><feComposite in2="sh" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
function sticker(s, t, i) {
  const dt = t - s.at;
  if (dt < 0 || !IMG[s.k]) return '';
  const f = dt * 30;
  const pop = f < 6 ? lerp(0.2, 1.12, f / 6) : f < 10 ? lerp(1.12, 0.96, (f - 6) / 4) : f < 14 ? lerp(0.96, 1, (f - 10) / 4) : 1;
  const wob = wave(t, 0.35, i * 2) * 2.4, bob = wave(t, 0.25, i * 1.3) * 7;
  return `<g transform="translate(${s.x} ${s.y + bob}) rotate(${s.tilt + wob}) scale(${pop})" opacity="${clamp(f / 3)}"><image href="${IMG[s.k]}" x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid meet" filter="url(#stk)"/></g>`;
}

const shots = {
  // 1. Дом престарелых: старик в инвалидном кресле у окна рассказывает
  nursing(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -30, k) },
      els: [
        `<rect width="1080" height="1920" fill="#1c2230"/>`,
        // коридор в перспективе
        `<path d="M-100,560 L380,900 L700,900 L1180,560 Z" fill="#141924"/><path d="M-100,560 L380,900 L380,1340 L-100,1800 Z" fill="${V('#2c3446', 0.1, 0.3)}"/><path d="M1180,560 L700,900 L700,1340 L1180,1800 Z" fill="${V('#252c3a', 0.1, 0.3)}"/><path d="M-100,1800 L380,1340 L700,1340 L1180,1800 L1180,1920 L-100,1920 Z" fill="${V('#3a414e', 0.1, 0.35)}"/>`,
        [0, 1].map((i) => `<path d="M${110 + i * 150},${1080 - i * 70} L${200 + i * 110},${1040 - i * 55} L${200 + i * 110},${1430 - i * 40} L${110 + i * 150},${1520 - i * 70} Z" fill="#1a1f2a"/><path d="M${970 - i * 150},${1080 - i * 70} L${880 - i * 110},${1040 - i * 55} L${880 - i * 110},${1430 - i * 40} L${970 - i * 150},${1520 - i * 70} Z" fill="#161b25"/>`).join(''),
        windowFrame(420, 930, 240, 300, grad([[0, '#e8eef6'], [1, '#b8c8dc']])),
        glow(540, 1080, 420, '#dfeaff', 0.45),
        `<path d="M420,1230 L660,1230 L1000,1920 L80,1920 Z" fill="${grad([[0, '#e8f0ff', 0.3], [1, '#e8f0ff', 0]])}"/>`,
        shadow(540, 1800, 300),
        wheelchair(540, 1800, 1.0),
        man(540, 1640, 1.0, { ...OLD, pose: 'sit', arms: 'table', look: -0.4, nod: wave(t, 0.25) * 0.6, frown: 0.25, blink: blink(t, 0.6) }),
        dust(t, 18, '#e8f0ff', 900, 1500),
        topShade(900, 0.6),
      ],
    };
  },

  // 2. Заправка на закате: грузовик заглох, незнакомец в шляпе молча чинит мотор
  truck(t, T) {
    const k = ease(t / T), bonnet = ease(clamp(t / (T * 0.25)));
    const work = wave(t, 1.3) * 3;
    return {
      cam: { z: lerp(1.0, 1.08, k), x: lerp(0, -30, k) },
      els: [
        sky([[0, '#2a2448'], [0.45, '#6a3a5a'], [0.75, '#d86a46'], [1, '#f6a858']], 1400),
        glow(220, 1230, 520, '#ffcf8a', 0.75), `<circle cx="220" cy="1230" r="95" fill="#ffe2b0"/>`,
        `<path d="M-100,1310 Q220,1240 500,1280 Q820,1320 1180,1250 L1180,1420 L-100,1420 Z" fill="#3a2436"/>`,
        [60, 340, 620, 900].map((px) => `<rect x="${px}" y="1080" width="9" height="250" fill="#1e1424"/><rect x="${px - 32}" y="1100" width="72" height="7" fill="#1e1424"/>`).join(''),
        // здание заправки
        `<rect x="640" y="1040" width="460" height="330" fill="${V('#e8dcc4', 0.05, 0.3)}"/><rect x="620" y="1006" width="500" height="44" fill="${V('#b8322a', 0.2, 0.3)}"/><rect x="680" y="1110" width="150" height="120" fill="#ffd9a0" opacity="0.85"/>${glow(755, 1170, 200, '#ffc070', 0.4)}<rect x="880" y="1110" width="110" height="260" fill="#3a2a2a"/>`,
        ground(1360, '#3e333c', 0.05, 0.45),
        pump(600, 1400, 0.9, '#b8322a'), pump(680, 1400, 0.9, '#2a5a7a'),
        shadow(400, 1700, 460, 0.35),
        truck(330, 1700, 1.05, bonnet),
        // незнакомец склонился над мотором (наклон к капоту)
        man(700, 1760, 0.92, { ...RUSSELL, arms: 'hold', lean: -5 + work * 0.6, look: -1, nod: 1, frown: 0.1, blink: blink(t, 1.2) }),
        // Фрэнк-водитель смотрит
        man(920, 1820, 1.0, { ...DRIVER, arms: 'down', look: -1, frown: -0.2, blink: blink(t, 0.3) }),
        glow(560, 1500, 520, '#ffb06a', 0.12),
        topShade(900, 0.55),
      ],
    };
  },

  // 3. Ресторан: тихий босс мафии за столом
  boss(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.05, 1.15, k), y: lerp(0, -40, k) },
      els: [
        `<rect width="1080" height="1920" fill="#120c0e"/>`,
        `<rect x="0" y="760" width="1080" height="900" fill="${V('#2e1c1a', 0.08, 0.35)}"/>`,
        [0, 1, 2, 3, 4].map((i) => `<rect x="${-40 + i * 250}" y="820" width="200" height="480" rx="8" fill="#36221e" stroke="#1a100e" stroke-width="7"/>`).join(''),
        [160, 920].map((bx) => glow(bx, 930, 230, '#ffc77a', 0.55) + `<path d="M${bx - 28},950 L${bx - 18},906 L${bx + 18},906 L${bx + 28},950 Z" fill="#ffe0b0"/>`).join(''),
        lamp(540, 760, 180, 0, 0.9),
        man(540, 1600, 1.3, { ...RUSSELL, pose: 'sit', arms: 'table', look: 0.2, nod: wave(t, 0.2) * 0.5, frown: -0.1, blink: blink(t, 0.9) }),
        // стол поверх
        `<path d="M40,1500 L1040,1500 L1120,1640 L-40,1640 Z" fill="${V('#ece4d4', 0.05, 0.15)}"/><rect x="-40" y="1640" width="1160" height="300" fill="${V('#cfc4b0', 0.05, 0.4)}"/>`,
        // бокал красного, тарелка, пепельница, перстень
        `<path d="M250,1520 L290,1520 L286,1440 Q270,1410 254,1440 Z" fill="#7a1420" opacity="0.9"/><rect x="266" y="1520" width="8" height="34" fill="#dfe6ee"/><ellipse cx="270" cy="1556" rx="26" ry="6" fill="#dfe6ee"/>`,
        `<ellipse cx="760" cy="1560" rx="110" ry="24" fill="#fff"/><ellipse cx="900" cy="1540" rx="40" ry="11" fill="#4a4a50"/>`,
        glow(612, 1494, 40, '#ffd27a', 0.9 * (0.6 + 0.4 * wave(t, 0.5))), `<circle cx="612" cy="1494" r="8" fill="#f0c860"/>`,
        smoke(900, 1530, 0.5, t, 6, '#9c9a98'),
        topShade(900, 0.6),
      ],
    };
  },

  // 4. Ночь у склада: мясо из кузова уходит налево
  meat(t, T) {
    const k = ease(t / T), carry = ease(clamp((t - T * 0.1) / (T * 0.6)));
    const sw = wave(t, 0.3) * 2;
    return {
      cam: { z: lerp(1.0, 1.08, k), x: lerp(0, 20, k) },
      els: [
        sky([[0, '#05070e'], [0.6, '#0e1628'], [1, '#1a2338']], 1000),
        `<rect x="0" y="880" width="1080" height="560" fill="#141a26"/><rect x="620" y="980" width="360" height="400" fill="#0a0e16"/>${glow(800, 950, 160, '#cfe0ff', 0.6)}<circle cx="800" cy="950" r="18" fill="#eef4ff"/>`,
        ground(1380, '#1c2230', 0.05, 0.4),
        // открытый кузов сзади
        `<rect x="40" y="1020" width="520" height="500" fill="${V('#d8d2c2', 0.1, 0.3)}" filter="url(#soft)"/><rect x="70" y="1050" width="460" height="450" fill="#1e2a36"/>${glow(300, 1250, 300, '#cfe0ff', 0.45)}`,
        carcass(160, 1070, 0.9, sw) + carcass(300, 1070, 0.9, -sw) + carcass(440, 1070, 0.9, sw),
        `<rect x="40" y="1520" width="520" height="34" fill="#2a2a2e"/>`,
        // машина покупателя справа
        `<g transform="translate(720 1640)" filter="url(#soft)"><path d="M0,-130 Q20,-220 130,-230 L310,-230 Q380,-220 410,-130 L470,-120 Q490,-110 490,-70 L490,-24 L-20,-24 L-20,-86 Z" fill="${V('#262a34', 0.15, 0.3)}"/><path d="M64,-140 Q84,-208 146,-210 L268,-210 Q330,-204 350,-140 Z" fill="#0a0c10"/><circle cx="84" cy="-24" r="40" fill="#0a0a0a"/><circle cx="392" cy="-24" r="40" fill="#0a0a0a"/>${glow(480, -86, 120, '#ffe6a8', 0.6)}<circle cx="480" cy="-86" r="16" fill="#fff0c8"/></g>`,
        shadow(lerp(460, 600, carry), 1840, 220),
        man(lerp(460, 600, carry), 1850, 1.0, { ...DRIVER, arms: 'hold', step: wave(t, 1.2) * (1 - carry), look: 1, frown: 0.2, blink: blink(t, 1.6) }),
        crate(lerp(460, 600, carry), 1430, 0.85),
        `<g filter="url(#blur20)">${Array.from({ length: 6 }, () => `<ellipse cx="${(rnd() * 1300 + t * 12) % 1300 - 100}" cy="${1560 + rnd() * 200}" rx="${240 + rnd() * 180}" ry="${40 + rnd() * 20}" fill="#5d6b82" opacity="0.25"/>`).join('')}</g>`,
        topShade(900, 0.6),
      ],
    };
  },

  // 5. Ночная кухня: звонок. «Я слышал, ты красишь дома»
  phone(t, T) {
    const k = ease(t / T), pick = ease(clamp((t - T * 0.18) / (T * 0.12)));
    const ring = t < T * 0.2 ? Math.sin(t * 50) * 3 : 0;
    const red = clamp((t - T * 0.55) / (T * 0.45));
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -40, k) },
      els: [
        `<rect width="1080" height="1920" fill="#1a1e26"/>`,
        `<rect x="0" y="560" width="1080" height="1100" fill="#4a4e44"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${-60 + i * 90}" y="560" width="36" height="1100" fill="#555a4e"/>`).join('')}`,
        windowFrame(660, 860, 300, 380, '#121a2e'), `<rect x="671" y="871" width="278" height="358" fill="#ff2a2a" opacity="${0.2 + red * 0.35}"/>`, glow(810, 1050, 300, '#ff3a3a', 0.25 + red * 0.35),
        lamp(330, 700, 140, 0, 0.75),
        ground(1520, '#2e2a26', 0.05, 0.4),
        phoneWall(170, 1140, 1, ring),
        pick < 0.5 ? `<path d="M110,1010 Q170,970 230,1010 L230,1036 Q170,1000 110,1036 Z" fill="#1a1a1a" transform="rotate(${ring} 170 1140)"/>` : '',
        `<path d="M170,1240 Q${260 + pick * 100},1500 ${lerp(230, 560, pick)},${lerp(1240, 1180, pick)}" stroke="#141414" stroke-width="6" fill="none"/>`,
        shadow(480, 1860, 230),
        man(480, 1870, 1.05, { ...FRANK, arms: pick > 0.5 ? 'phone' : 'down', look: pick > 0.5 ? 0.3 : -1, frown: 0.2 + red * 0.4, blink: blink(t, 0.5) }),
        glow(700, 1300, 460, '#ff4a3a', 0.08 + red * 0.12),
        topShade(900, 0.6),
      ],
    };
  },

  // 6. «Краска — кровь на стенах» → Хоффа и Фрэнк на трибуне, почти братья
  blood(t, T) {
    const k = ease(t / T), grow = ease(clamp(t / (T * 0.4))), cross = ease(clamp((t - T * 0.42) / (T * 0.16)));
    const cheer = Math.max(0, wave(t, 1.4));
    const wall = [
      `<rect width="1080" height="1920" fill="${V('#dcd2be', 0.05, 0.2)}"/>`,
      Array.from({ length: 9 }, (_, i) => `<rect x="${-40 + i * 140}" y="0" width="4" height="1920" fill="#b8ad98" opacity="0.5"/>`).join(''),
      drips(-40, 1120, 860, grow, 16, 640),
      `<rect x="0" y="1560" width="1080" height="360" fill="${V('#3a2e28', 0.1, 0.3)}"/>`,
      `<g filter="url(#soft)"><path d="M700,1590 L880,1590 L856,1790 L724,1790 Z" fill="${V('#7a7a80', 0.25, 0.3)}"/><ellipse cx="790" cy="1590" rx="90" ry="20" fill="#7a0e14"/><rect x="860" y="1500" width="18" height="150" fill="#8a6a44" transform="rotate(30 869 1575)"/></g>`,
      `<rect width="1080" height="1920" fill="#3a0a0c" opacity="0.18"/>`,
    ].join('');
    const rally = [
      sky([[0, '#0c0e18'], [0.6, '#1e2236'], [1, '#3a2a34']], 1920),
      [-1, 1].map((s) => `<path d="M${540 + s * 640},300 L${540 + s * 80},1500 L${540 + s * 240},1500 Z" fill="#fff4d8" opacity="0.08"/>`).join(''),
      flag(120, 820, '#2a4a7a', t, 0) + flag(360, 800, '#d8d4ca', t, 1) + flag(700, 800, '#2a4a7a', t, 2) + flag(920, 820, '#d8d4ca', t, 3),
      glow(540, 1150, 520, '#ffc77a', 0.4),
      `<g filter="url(#soft)"><path d="M300,1440 L780,1440 L740,1760 L340,1760 Z" fill="${V('#2a3448', 0.15, 0.3)}"/><rect x="300" y="1430" width="480" height="22" fill="#d0aa50"/><circle cx="540" cy="1580" r="62" fill="${R('#d0aa50')}"/></g>`,
      man(400, 1500, 0.85, { ...HOFFA, arms: 'raise', look: 0.4, smile: true, frown: -0.3, blink: blink(t, 0.4) }),
      man(690, 1510, 0.88, { ...FRANK, arms: 'down', look: -0.5, smile: cheer > 0.3, frown: -0.2, blink: blink(t, 1.7) }),
      Array.from({ length: 9 }, (_, i) => person(60 + i * 120, 1990 + (i % 2) * 40, 0.62, { ...CROWD(['#2a2e38', '#3a2e2a', '#22303a'][i % 3]), arms: i % 3 === 0 ? 'raise' : 'down', look: 0, lookUp: 1, sil: silFilter('#0a0c12') })).join(''),
    ].join('');
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -20, k) },
      els: [`<g opacity="${1 - cross}">${wall}</g>`, `<g opacity="${cross}">${rally}</g>`, topShade(900, 0.55)],
    };
  },

  // 7. Раскол: Хоффа не уступает мафии, Фрэнк посередине
  rift(t, T) {
    const k = ease(t / T), red = clamp((t - T * 0.3) / (T * 0.7));
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -30, k) },
      els: [
        `<rect width="1080" height="1920" fill="#08090d"/><rect x="0" y="760" width="1080" height="900" fill="#141822"/>`,
        glow(540, 1200, 640, '#ff2a2a', 0.15 + red * 0.3),
        lamp(540, 700, 220, wave(t, 0.18) * 0.07, 0.95),
        // длинный стол
        // босс справа сидит за столом в тени, спокоен
        man(860, 1580, 0.82, { ...RUSSELL, pose: 'sit', arms: 'table', look: -1, frown: 0.1, blink: blink(t, 1.4), sil: red > 0.85 ? silFilter('#1a0a0c') : undefined }),
        `<path d="M100,1500 L980,1500 L1080,1620 L0,1620 Z" fill="${V('#3a2a22', 0.1, 0.3)}"/><rect x="0" y="1620" width="1080" height="34" fill="#24180f"/>`,
        // Хоффа слева, указывает на него
        man(210, 1760, 0.95, { ...HOFFA, arms: 'point', look: 1, frown: 1, blink: blink(t, 0.6) }),
        // Фрэнк посередине, ближе к нам, взгляд мечется
        shadow(540, 1890, 260),
        man(540, 1900, 1.08, { ...FRANK, arms: 'down', look: wave(t, 0.35) > 0 ? 1 : -1, frown: 0.6, worried: true, blink: blink(t, 2.1) }),
        smoke(860, 1440, 0.4, t, 5, '#8a8888'),
        topShade(900, 0.6),
      ],
    };
  },

  // 8. Дочь всё видит
  daughter(t, T) {
    const k = ease(t / T), door = ease(clamp(t / (T * 0.3)));
    return {
      cam: { z: lerp(1.0, 1.1, k), x: lerp(0, -20, k) },
      els: [
        `<rect width="1080" height="1920" fill="#0b0d14"/><rect x="0" y="640" width="1080" height="1100" fill="${V('#161a26', 0.05, 0.3)}"/>`,
        `<rect x="${640 - 170 * door}" y="900" width="${340 * door}" height="720" fill="${grad([[0, '#ffe0a8'], [1, '#ffc070']])}"/>`, glow(640, 1260, 460, '#ffc77a', 0.55 * door),
        `<rect x="${620 - 170 * door}" y="884" width="20" height="752" fill="#2a2016"/>`,
        `<path d="M${640 - 170 * door},1620 L${640 + 170 * door},1620 L${640 + 420 * door},1920 L${640 - 300 * door},1920 Z" fill="#ffcf8a" opacity="0.18"/>`,
        man(640, 1600, 0.6, { ...PEGGY, arms: 'down', look: -0.8, frown: 0.5, worried: true, blink: false }),
        // отец: огромный тёмный силуэт на переднем плане слева
        man(160, 2250, 1.75, { ...FRANK, arms: 'down', look: 1, sil: silFilter('#06070b') }),
        glow(330, 1250, 160, '#ffcf8a', 0.15),
        topShade(900, 0.6),
      ],
    };
  },

  // 9. Актёры: фото-стикеры появляются под имена
  actors(t, T) {
    return {
      cam: { z: 1, y: 0 },
      els: [
        STICKER_FILTER ? `<defs>${STICKER_FILTER}</defs>` : '',
        sky([[0, '#0a0e1a'], [0.5, '#161e34'], [0.8, '#202640'], [1, '#2a1a24']], 1920),
        glow(240, 1560, 640, '#ff2a2a', 0.3), glow(880, 1000, 560, '#cfe0ff', 0.2),
        [-1, 1].map((s) => `<path d="M${540 + s * 720},300 L${540 + s * 60},1800 L${540 + s * 280},1800 Z" fill="#fff4d8" opacity="${0.05 + 0.02 * wave(t, 0.3, s)}"/>`).join(''),
        dust(t, 26, '#fff1d0', 800, 1700),
        STICKERS.map((s, i) => sticker(s, t, i)).join(''),
        topShade(900, 0.5),
      ],
    };
  },

  // 10. Финал: старик у окна, снег
  window(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -20, k) },
      els: [
        `<rect width="1080" height="1920" fill="#1a2030"/><rect x="0" y="560" width="1080" height="1200" fill="${V('#2a3040', 0.05, 0.3)}"/>`,
        windowFrame(300, 820, 480, 600, grad([[0, '#c8d4e4'], [1, '#9eb0c8']]), t, 1),
        glow(540, 1120, 560, '#dfeaff', 0.4),
        `<path d="M300,1420 L780,1420 L1080,1920 L0,1920 Z" fill="${grad([[0, '#e8f0ff', 0.25], [1, '#e8f0ff', 0]])}"/>`,
        ground(1700, '#2e3440', 0.05, 0.3),
        shadow(540, 1860, 300),
        wheelchair(540, 1860, 1.0),
        man(540, 1700, 1.0, { ...OLD, pose: 'sit', arms: 'table', look: 0, lookUp: 0.5, frown: 0.3, blink: blink(t, 1.1) }),
        topShade(900, 0.6),
      ],
    };
  },
};

run(shots);
