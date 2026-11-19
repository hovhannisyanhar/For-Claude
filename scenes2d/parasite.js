// «Паразиты» (2019) — 10 сцен в 2D-векторе. Имя плана = set сцены в videos/parasite/script.json.
// Два мира: светлый особняк (бетон, стекло, зелёный газон, солнце) и тесный полуподвал (жёлто-зелёная лампа).
// Сцена 8 — фото-стикер Пон Джун Хо. Текст кинетики сверху (y≈290–800), главное в кадре — ниже.
import { run, person, setProportions, V, R, grad, glow, rnd, shade, lerp, ease, clamp, wave } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// семья Ким
const FATHER = { shirt: '#3a4658', pants: '#2a3038', skin: '#dcaa86', hair: '#1c1816', iris: '#2a1a12', beard: false, frown: 0.15 };
const MOTHER = { shirt: '#8a5a48', pants: '#4a3a34', skin: '#e0b090', hair: '#2a1e18', iris: '#2a1a12', beard: false, frown: 0.25 };
const SON = { shirt: '#6a86a6', pants: '#3a4250', skin: '#e6b896', hair: '#16120f', iris: '#2a1a12', beard: false, frown: 0 };
const SISTER = { shirt: '#26262c', pants: '#1e1e24', skin: '#ecc0a0', hair: '#141012', iris: '#2a1a12', beard: false, longHair: true, frown: 0.1 };
// семья Пак
const MADAM = { shirt: '#f2ece0', robe: '#efe7d8', skin: '#f2cdb2', hair: '#3a2418', iris: '#3a2414', beard: false, longHair: true, frown: -0.3 };
const BOY = { shirt: '#e0a43a', pants: '#3a5a8a', skin: '#f0c4a2', hair: '#1a1410', iris: '#2a1a12', beard: false, frown: -0.2 };
const MRPARK = { shirt: '#22262e', pants: '#1c2028', skin: '#e8bc9c', hair: '#141210', iris: '#2a1a12', beard: false, frown: 0.1 };

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const ground = (y, c, k = 0.1, d = 0.4) => `<path d="M0,${y} L1080,${y} L1080,1920 L0,1920 Z" fill="${V(c, k, d)}"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const pop = (t, at, d = 0.25) => ease(clamp((t - at) / d));

// ---- реквизит ----
function bush(x, y, r, c = '#3f6a3a') {
  return `<g filter="url(#soft)"><circle cx="${x - r * 0.55}" cy="${y + r * 0.15}" r="${r * 0.7}" fill="${R(shade(c, -0.08), 0.2, 0.3)}"/><circle cx="${x + r * 0.55}" cy="${y + r * 0.2}" r="${r * 0.65}" fill="${R(shade(c, -0.05), 0.2, 0.3)}"/><circle cx="${x}" cy="${y - r * 0.2}" r="${r * 0.8}" fill="${R(c, 0.22, 0.3)}"/></g>`;
}
function pine(x, y, s, c = '#2f5232') { // садовая сосна-бонсай, как в саду Паков
  let g = `<path d="M${x},${y} Q${x - 20 * s},${y - 160 * s} ${x + 10 * s},${y - 300 * s}" stroke="#4a3426" stroke-width="${18 * s}" fill="none"/>`;
  [[-70, -150, 90], [60, -220, 80], [-20, -300, 70]].forEach(([dx, dy, r]) => g += `<ellipse cx="${x + dx * s}" cy="${y + dy * s}" rx="${r * 1.4 * s}" ry="${r * 0.55 * s}" fill="${R(c, 0.25, 0.3)}"/>`);
  return `<g filter="url(#soft)">${g}</g>`;
}
// модерновый особняк: бетонные плиты + стекло
function mansion(x, y, s, lit = 0, glassC = '#9fc4c8') {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">
    <rect x="-420" y="-300" width="840" height="300" fill="${V('#d4d0c6', 0.08, 0.25)}"/>
    <rect x="-380" y="-260" width="560" height="240" fill="${grad([[0, shade(glassC, 0.3)], [1, shade(glassC, -0.3)]])}"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${-380 + i * 140}" y="-260" width="6" height="240" fill="#3a3e40"/>`).join('')}
    <rect x="-380" y="-260" width="560" height="240" fill="#ffd890" opacity="${lit * 0.7}"/>
    <rect x="-480" y="-330" width="960" height="40" fill="${V('#e8e4da', 0.1, 0.3)}"/>
    <rect x="-260" y="-540" width="560" height="210" fill="${V('#c8c4ba', 0.08, 0.3)}"/>
    <rect x="-230" y="-510" width="300" height="150" fill="${grad([[0, shade(glassC, 0.2)], [1, shade(glassC, -0.35)]])}"/>
    <rect x="-230" y="-510" width="300" height="150" fill="#ffd890" opacity="${lit * 0.6}"/>
    <rect x="-300" y="-570" width="640" height="34" fill="${V('#e8e4da', 0.1, 0.3)}"/>
    <rect x="240" y="-300" width="120" height="300" fill="${V('#b4b0a6', 0.05, 0.3)}"/></g>`;
}
function sofa(x, y, s, c = '#e6dccb') {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-300" y="-170" width="600" height="110" rx="30" fill="${V(c, 0.1, 0.2)}"/><rect x="-320" y="-80" width="640" height="80" rx="24" fill="${V(shade(c, -0.05), 0.1, 0.25)}"/><rect x="-340" y="-150" width="70" height="150" rx="26" fill="${V(c, 0.12, 0.25)}"/><rect x="270" y="-150" width="70" height="150" rx="26" fill="${V(c, 0.12, 0.25)}"/></g>`;
}
function phoneGlow(x, y, s = 1) { return glow(x, y, 120 * s, '#bfe4ff', 0.5); }
function socks(x0, x1, y, t) {
  let g = `<path d="M${x0},${y} Q${(x0 + x1) / 2},${y + 40} ${x1},${y}" stroke="#5a5240" stroke-width="3" fill="none"/>`;
  const cs = ['#c8c0a8', '#6a6a7a', '#a8584a', '#d8d0bc', '#4a5a6a', '#8a7a5a'];
  cs.forEach((c, i) => {
    const k = (i + 0.5) / cs.length, x = lerp(x0, x1, k), yy = y + Math.sin(k * Math.PI) * 40 + 6, sw = wave(t, 0.4, i) * 3;
    g += `<g transform="rotate(${sw} ${x} ${yy})"><path d="M${x - 14},${yy} L${x + 14},${yy} L${x + 14},${yy + 70} L${x + 34},${yy + 84} Q${x + 36},${yy + 104} ${x + 12},${yy + 102} L${x - 14},${yy + 90} Z" fill="${V(c, 0.15, 0.25)}"/><rect x="${x - 4}" y="${yy - 8}" width="8" height="14" fill="#b8a050"/></g>`;
  });
  return g;
}
function bulb(x, y, len, c = '#fff0b0', op = 0.9) {
  return `<line x1="${x}" y1="${y - len}" x2="${x}" y2="${y}" stroke="#141414" stroke-width="4"/>${glow(x, y + 20, 360, '#e8d890', 0.45 * op)}<circle cx="${x}" cy="${y + 20}" r="20" fill="${c}"/>`;
}
function diploma(x, y, s, stamp = 0, write = 1) {
  let lines = '';
  for (let i = 0; i < 5; i++) { const w = (i === 0 ? 200 : 260 - (i % 2) * 60) * clamp(write * 5 - i); lines += `<rect x="${-w / 2}" y="${-90 + i * 34 + (i === 0 ? -20 : 0)}" width="${w}" height="${i === 0 ? 18 : 9}" rx="4" fill="#4a3a2a" opacity="${i === 0 ? 0.85 : 0.5}"/>`; }
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-4)" filter="url(#soft)"><rect x="-200" y="-150" width="400" height="290" rx="6" fill="${V('#f6efdc', 0.05, 0.12)}"/><rect x="-184" y="-134" width="368" height="258" fill="none" stroke="#b89a5a" stroke-width="5"/>${lines}
    <g transform="translate(120 82) scale(${lerp(1.6, 1, stamp)})" opacity="${stamp}"><circle r="40" fill="none" stroke="#b8262a" stroke-width="7"/><circle r="26" fill="none" stroke="#b8262a" stroke-width="4"/><rect x="-14" y="-4" width="28" height="8" fill="#b8262a"/></g></g>`;
}
function oscar(x, y, s, shine = 0) {
  const gold = '#d8a83a';
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">${glow(0, -170, 190, '#ffd77a', 0.35 + shine * 0.4)}
    <rect x="-46" y="-40" width="92" height="40" rx="5" fill="${V('#2a2622', 0.2, 0.3)}"/><rect x="-36" y="-64" width="72" height="26" rx="4" fill="${V(gold, 0.3, 0.3)}"/>
    <path d="M-16,-64 L-18,-140 Q-30,-200 -22,-240 L22,-240 Q30,-200 18,-140 L16,-64 Z" fill="${V(gold, 0.35, 0.35)}"/>
    <path d="M-22,-238 L-30,-280 L30,-280 L22,-238 Z" fill="${V(gold, 0.3, 0.3)}"/><circle cy="-300" r="24" fill="${R(gold, 0.35, 0.3)}"/>
    <rect x="-6" y="-236" width="4" height="150" fill="#fff6d0" opacity="0.45"/></g>`;
}
function curtain(side, t) {
  let g = '';
  for (let i = 0; i < 6; i++) { const x = side < 0 ? i * 46 - 40 : 1080 - i * 46 + 40 - 60; g += `<rect x="${x}" y="0" width="60" height="1920" fill="${V(i % 2 ? '#6a1418' : '#8a1c20', 0.15, 0.4)}"/>`; }
  return g;
}
function rain(t, n = 90, op = 0.45) {
  let g = '';
  for (let i = 0; i < n; i++) { const x = rnd() * 1180 - 50, sp = 1400 + rnd() * 600, y = ((rnd() * 2200 + t * sp) % 2200) - 200, l = 50 + rnd() * 50; g += `<line x1="${x}" y1="${y}" x2="${x - l * 0.18}" y2="${y + l}" stroke="#cfe0f0" stroke-width="${1.5 + rnd() * 1.5}" opacity="${op * (0.4 + rnd() * 0.6)}"/>`; }
  return g;
}
function car(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)">
    <path d="M-420,-60 L-400,-150 Q-390,-170 -360,-172 L-250,-176 L-160,-270 Q-140,-286 -110,-286 L170,-286 Q200,-286 220,-268 L320,-176 L400,-168 Q430,-164 432,-130 L432,-60 Z" fill="${V('#1a1c22', 0.25, 0.3)}"/>
    <path d="M-140,-262 L-50,-262 L-50,-180 L-230,-180 Z" fill="${grad([[0, '#a8c4d4'], [1, '#5a7484']])}"/><path d="M-30,-262 L160,-262 Q178,-262 192,-248 L262,-180 L-30,-180 Z" fill="${grad([[0, '#a8c4d4'], [1, '#5a7484']])}"/>
    <rect x="-420" y="-80" width="852" height="14" fill="#c8ccd2" opacity="0.5"/>
    ${[-260, 260].map((wx) => `<circle cx="${wx}" cy="-56" r="62" fill="#0e0e10"/><circle cx="${wx}" cy="-56" r="30" fill="${R('#9a9ea6')}"/>`).join('')}</g>`;
}
function stove(x, y, s, t) {
  const steam = [0, 1, 2].map((i) => { const k = (t * 0.4 + i / 3) % 1; return `<circle cx="${x + 30 * s + Math.sin(k * 5 + i) * 18}" cy="${y - 240 * s - k * 220}" r="${(22 + k * 40) * s}" fill="#fff" opacity="${0.35 * (1 - k)}"/>`; }).join('');
  return `<g filter="url(#soft)"><rect x="${x - 220 * s}" y="${y - 170 * s}" width="${440 * s}" height="${170 * s}" fill="${V('#e8e4dc', 0.05, 0.2)}"/><rect x="${x - 230 * s}" y="${y - 186 * s}" width="${460 * s}" height="20" fill="#3a3a3e"/><path d="M${x - 20 * s},${y - 186 * s} L${x - 30 * s},${y - 260 * s} L${x + 90 * s},${y - 260 * s} L${x + 80 * s},${y - 186 * s} Z" fill="${V('#9aa2aa', 0.3, 0.3)}"/></g><g filter="url(#blur8)">${steam}</g>`;
}
function easel(x, y, s, prog) {
  return `<g filter="url(#soft)"><path d="M${x - 90 * s},${y} L${x},${y - 520 * s} L${x + 90 * s},${y}" stroke="#7a5a3a" stroke-width="${12 * s}" fill="none"/><rect x="${x - 130 * s}" y="${y - 470 * s}" width="${260 * s}" height="${300 * s}" fill="#fbf8f0"/>
    <path d="M${x - 90 * s},${y - 260 * s} q40,-${100 * s * prog} 80,-20 t80,-40" stroke="#e0583a" stroke-width="${10 * s}" fill="none" opacity="${prog}"/><circle cx="${x + 60 * s}" cy="${y - 400 * s}" r="${30 * s * prog}" fill="#f2c04a"/></g>`;
}
// плашка-врезка для триптиха
function panel(y, h, k, inner) {
  const off = (1 - k) * 1100;
  return `<g transform="translate(${off} 0)" opacity="${clamp(k * 2)}"><clipPath id="cp${y}"><rect x="40" y="${y}" width="1000" height="${h}" rx="22"/></clipPath><g clip-path="url(#cp${y})">${inner}</g><rect x="40" y="${y}" width="1000" height="${h}" rx="22" fill="none" stroke="#f6f0e2" stroke-width="10"/></g>`;
}

// ---- фото-стикер Пон Джун Хо ----
const IMG = {};
await Promise.all(Object.entries({ bong: 'bong-cut.png' }).map(async ([k, f]) => {
  try {
    const b = await (await fetch(`/public/assets/parasite/${f}`)).blob();
    IMG[k] = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  } catch { IMG[k] = ''; }
}));
// at: AUDIO_DELAY (4 кадра) + время слова «Пон» (0,5 с)
const STICKERS = [{ k: 'bong', x: 540, y: 1280, w: 400, h: 884, at: 4 / 30 + 0.5, tilt: -3 }];
const STICKER_FILTER = `<filter id="stk" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="10" result="dil"/><feFlood flood-color="#ffffff"/><feComposite in2="dil" operator="in" result="outline"/><feGaussianBlur in="dil" stdDeviation="12" result="blur"/><feOffset in="blur" dx="8" dy="16" result="sh"/><feFlood flood-color="#000" flood-opacity="0.55"/><feComposite in2="sh" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
function sticker(s, t, i) {
  const dt = t - s.at;
  if (dt < 0 || !IMG[s.k]) return '';
  const f = dt * 30;
  const p = f < 6 ? lerp(0.2, 1.12, f / 6) : f < 10 ? lerp(1.12, 0.96, (f - 6) / 4) : f < 14 ? lerp(0.96, 1, (f - 10) / 4) : 1;
  const wob = wave(t, 0.35, i * 2) * 2.4, bob = wave(t, 0.25, i * 1.3) * 7;
  return `<g transform="translate(${s.x} ${s.y + bob}) rotate(${s.tilt + wob}) scale(${p})" opacity="${clamp(f / 3)}"><image href="${IMG[s.k]}" x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid meet" filter="url(#stk)"/></g>`;
}

const DAY_SKY = [[0, '#5a8ab0'], [0.6, '#9cc4dc'], [1, '#d8ecf0']];

const shots = {
  // 1. Ворота особняка: четверо Кимов в ряд, будто незнакомы
  gate(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -30, k) },
      els: [
        sky(DAY_SKY, 1200),
        glow(860, 300, 500, '#fff6d8', 0.5),
        mansion(560, 1010, 0.9),
        pine(150, 1040, 1.1), bush(960, 980, 120),
        // стена и ворота
        `<rect x="0" y="960" width="1080" height="560" fill="${V('#b8b2a6', 0.08, 0.3)}" filter="url(#soft)"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${i * 160}" y="960" width="4" height="560" fill="#8a857a" opacity="0.5"/>`).join('')}`,
        `<rect x="380" y="1000" width="320" height="520" fill="${V('#2c2e30', 0.15, 0.3)}"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${396 + i * 38}" y="1000" width="14" height="520" fill="#4a4c50"/>`).join('')}<rect x="720" y="1150" width="46" height="60" rx="6" fill="#3a3c40"/><circle cx="743" cy="1176" r="9" fill="#9adfff"/>`,
        ground(1520, '#7a7672', 0.08, 0.35),
        [170, 410, 670, 910].map((x) => shadow(x, 1790, 120, 0.3)).join(''),
        person(170, 1790, 0.86, { ...FATHER, look: -0.8, blink: blink(t, 0.3) }),
        person(410, 1790, 0.86, { ...MOTHER, look: 0.9, frown: 0.35, blink: blink(t, 1.6) }),
        person(670, 1790, 0.86, { ...SON, look: -1, blink: blink(t, 2.4) }),
        person(910, 1790, 0.86, { ...SISTER, look: 0.8, blink: blink(t, 0.9) }),
        topShade(900, 0.55),
      ],
    };
  },

  // 2. Полуподвал: окно на уровне асфальта, носки сушатся, сыну приходит предложение
  'semi-basement'(t, T) {
    const k = ease(t / T), ph = pop(t, T * 0.5, 0.4);
    const feet = [0, 1].map((i) => { const x = ((t * 160 + i * 520) % 1300) - 150, st = wave(t, 1.6, i) * 18; return `<rect x="${x - 26 + st}" y="${720}" width="40" height="120" rx="12" fill="#3a3430"/><rect x="${x + 22 - st}" y="${720}" width="40" height="120" rx="12" fill="#2e2a26"/>`; }).join('');
    return {
      cam: { z: lerp(1.04, 1.12, k), y: lerp(0, -40, k) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#5a5638', 0.05, 0.4)}"/>`,
        // окно под потолком: улица снаружи
        `<rect x="160" y="620" width="760" height="300" fill="${grad([[0, '#c8d4c8'], [0.7, '#a8b2a0'], [0.71, '#5a5852'], [1, '#4a4842']])}"/>${feet}<rect x="160" y="620" width="760" height="300" fill="none" stroke="#2e2c22" stroke-width="22"/>${[350, 540, 730].map((x) => `<rect x="${x - 6}" y="620" width="12" height="300" fill="#2e2c22"/>`).join('')}`,
        glow(540, 760, 520, '#e8f0d8', 0.3),
        socks(60, 1020, 960, t),
        bulb(780, 1040, 140),
        // стена с подтёками и пол
        `<rect x="0" y="1180" width="1080" height="20" fill="#3a3624" opacity="0.6"/>`,
        ground(1560, '#4a3e2c', 0.05, 0.35),
        `<rect x="300" y="1560" width="480" height="40" rx="10" fill="${V('#7a5a3a', 0.2, 0.3)}" filter="url(#soft)"/><rect x="330" y="1600" width="20" height="90" fill="#5a422a"/><rect x="730" y="1600" width="20" height="90" fill="#5a422a"/>`,
        // коробки для пиццы стопкой
        `<g filter="url(#soft)">${[0, 1, 2, 3].map((i) => `<rect x="${60 + i * 4}" y="${1700 - i * 46}" width="200" height="40" fill="${V('#c8a26a', 0.15, 0.25)}"/>`).join('')}</g>`,
        person(220, 1820, 0.82, { ...FATHER, pose: 'sit', arms: 'table', look: 1, frown: 0, blink: blink(t, 0.7) }),
        person(860, 1820, 0.82, { ...MOTHER, pose: 'sit', arms: 'table', look: -1, frown: 0.3, blink: blink(t, 2.1) }),
        person(380, 1840, 0.9, { ...SISTER, pose: 'sit', arms: 'table', look: 1, blink: blink(t, 1.3) }),
        phoneGlow(690, 1590, 0.6 + 0.6 * ph),
        person(600, 1860, 0.95, { ...SON, pose: 'sit', arms: 'phone', look: 0.6, lookUp: 0.6, frown: -0.3 * ph, smile: ph > 0.6, blink: blink(t, 2.9) }),
        topShade(900, 0.6),
      ],
    };
  },

  // 3. Ночь, лампа: сестра рисует диплом, брат смотрит через плечо, печать — шлёп
  diploma(t, T) {
    const k = ease(t / T), wr = clamp(t / (T * 0.55)), st = pop(t, T * 0.62, 0.15);
    return {
      cam: { z: lerp(1.02, 1.12, k), y: lerp(0, -50, k) },
      els: [
        `<rect width="1080" height="1920" fill="#14140f"/>`,
        `<rect x="0" y="700" width="1080" height="900" fill="${V('#2e2c1e', 0.05, 0.4)}"/>`,
        glow(540, 1360, 700, '#ffcf7a', 0.45),
        // лампа слева над столом
        `<path d="M120,1450 L170,1120 L250,1060" stroke="#2a2a2a" stroke-width="12" fill="none"/><path d="M220,1010 L360,1010 L330,1090 L250,1090 Z" fill="${V('#3a5a4a', 0.2, 0.3)}"/>${glow(290, 1110, 260, '#ffe2a0', 0.7)}<rect x="70" y="1436" width="110" height="20" rx="6" fill="#2a2a2a"/>`,
        person(760, 1500, 0.92, { ...SON, arms: 'down', look: -1, lookUp: -0.4, nod: 1, frown: -0.2, blink: blink(t, 1.4), lean: -6 }),
        person(380, 1640, 1.0, { ...SISTER, pose: 'sit', arms: 'table', look: 0.4, nod: 1.2, frown: 0.3, blink: blink(t, 2.2) }),
        // стол поверх
        `<path d="M-20,1440 L1100,1440 L1100,1920 L-20,1920 Z" fill="${V('#5a4630', 0.15, 0.4)}"/><rect x="-20" y="1440" width="1120" height="14" fill="#7a6040"/>`,
        diploma(540, 1600, 1.15, st, wr),
        glow(660, 1690, 160, '#ff4a3a', 0.25 * st),
        topShade(900, 0.6),
      ],
    };
  },

  // 4. Светлая гостиная-аквариум: хозяйка улыбается, сын оглядывается и задумывает
  'glass-house'(t, T) {
    const k = ease(t / T), think = pop(t, T * 0.55, 0.5);
    return {
      cam: { z: lerp(1.0, 1.12, k), x: lerp(0, -60, k), y: lerp(0, -30, k) },
      els: [
        `<rect width="1080" height="1920" fill="#e8e2d4"/>`,
        // панорамное окно в сад
        `<rect x="0" y="560" width="1080" height="900" fill="${grad([[0, '#9cc8e0'], [0.5, '#c8e4ec'], [0.55, '#6a9a52'], [1, '#4a7a3a']])}"/>`,
        glow(820, 700, 480, '#fff8dc', 0.7),
        pine(240, 1260, 1.1), bush(820, 1240, 110, '#4a7a40'), bush(620, 1290, 70, '#3f6a3a'),
        `<rect x="0" y="560" width="1080" height="900" fill="none" stroke="#3a3c3c" stroke-width="18"/><rect x="530" y="560" width="14" height="900" fill="#3a3c3c"/>`,
        `<path d="M0,1460 L1080,1460 L1080,1920 L0,1920 Z" fill="${V('#cbbfa8', 0.1, 0.3)}"/>`,
        `<path d="M200,1460 L900,1460 L1080,1920 L0,1920 Z" fill="#fff6d8" opacity="0.18"/>`,
        sofa(340, 1700, 0.95),
        person(340, 1650, 0.88, { ...MADAM, pose: 'sit', arms: 'table', look: 1, smile: true, frown: -0.4, blink: blink(t, 1.2) }),
        shadow(800, 1860, 140, 0.25),
        person(800, 1860, 0.95, { ...SON, arms: 'down', look: lerp(-1, 0.8, think), lookUp: think * 0.5, frown: lerp(0, 0.35, think), blink: blink(t, 2.6) }),
        topShade(880, 0.5),
      ],
    };
  },

  // 5. Триптих одного дома: сестра у мольберта, отец за рулём, мать на кухне — каждый под своё слово
  infiltrate(t, T) {
    const a = pop(t, 0.05, 0.35), b = pop(t, 4 / 30 + 2.4, 0.35), c = pop(t, 4 / 30 + 3.9, 0.35);
    return {
      cam: { z: lerp(1.0, 1.04, ease(t / T)) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#1e2a24', 0.1, 0.3)}"/>`,
        glow(540, 1300, 800, '#c9b26a', 0.15),
        // три врезки подняты и чуть уменьшены: от y≈700 до ≈1530 (ниже — интерфейс соцсети и каше)
        `<g transform="translate(540 700) scale(0.85) translate(-540 -820)">`,
        panel(820, 340, a,
          `<rect x="40" y="820" width="1000" height="340" fill="${grad([[0, '#f2ece0'], [1, '#d8cfbe']])}"/>${glow(900, 860, 300, '#fff6d8', 0.6)}` +
          easel(760, 1150, 0.6, clamp(t / 2.5)) +
          person(280, 1170, 0.5, { ...SISTER, arms: 'point', look: 1, blink: blink(t, 1) }) +
          person(520, 1170, 0.34, { ...BOY, look: 1, lookUp: 0.3, blink: blink(t, 2) })),
        panel(1180, 300, b,
          `<rect x="40" y="1180" width="1000" height="300" fill="${grad([[0, '#8aa8b8'], [0.6, '#b8c8c8'], [0.61, '#4a4a4a'], [1, '#3a3a3a']])}"/>` +
          `<g transform="translate(${-((t * 90) % 300)} 0)">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${i * 300}" y="1420" width="120" height="10" fill="#e8e0c8"/>`).join('')}</g>` +
          car(540, 1470, 0.62) +
          person(460, 1400, 0.28, { ...FATHER, pose: 'sit', arms: 'table', look: 1, cap: '#1e2228', blink: blink(t, 0.5) }) +
          person(620, 1400, 0.26, { ...MRPARK, pose: 'sit', arms: 'table', look: -1, blink: blink(t, 1.7) })),
        panel(1500, 300, c,
          `<rect x="40" y="1500" width="1000" height="300" fill="${grad([[0, '#e4e8e6'], [1, '#c4c8c4']])}"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${80 + i * 200}" y="1520" width="160" height="70" rx="6" fill="#d2d6d2" stroke="#b4b8b4" stroke-width="3"/>`).join('')}` +
          stove(720, 1800, 0.6, t) +
          person(420, 1800, 0.4, { ...MOTHER, arms: 'hold', look: 1, frown: -0.1, blink: blink(t, 2.3) })),
        `</g>`,
        topShade(820, 0.55),
      ],
    };
  },

  // 6. Золотой вечер на лужайке: семья Кимов на хозяйском газоне
  lawn(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -40, k) },
      els: [
        sky([[0, '#3a4a6a'], [0.45, '#c88a6a'], [0.8, '#f2b878'], [1, '#ffd9a0']], 1300),
        glow(860, 1000, 520, '#ffd9a0', 0.75),
        mansion(560, 1220, 0.95, 0.85),
        pine(110, 1240, 1.0, '#2a4a2e'), bush(1000, 1200, 110, '#3a5a34'),
        ground(1220, '#5f8a3e', 0.15, 0.35),
        `<path d="M0,1220 L1080,1220 L1080,1300 L0,1300 Z" fill="#ffd9a0" opacity="0.18"/>`,
        // бокалы и бутылка на траве
        `<rect x="520" y="1680" width="30" height="90" rx="10" fill="${V('#3a5a2a', 0.3, 0.3)}"/><rect x="528" y="1650" width="14" height="36" fill="#3a5a2a"/>`,
        [[180, 1800, 0.78, FATHER, 1, 0.3], [380, 1760, 0.72, MOTHER, -1, 1.2], [700, 1770, 0.74, SON, 1, 2.0], [900, 1810, 0.78, SISTER, -1, 2.7]].map(([x, y, s, o, lk, ph]) =>
          shadow(x, y, 140, 0.25) + person(x, y, s, { ...o, pose: 'sit', arms: 'table', look: lk * 0.6, smile: true, frown: -0.3, nod: wave(t, 0.5, ph) * 0.8, blink: blink(t, ph) })).join(''),
        [[180, 1640], [380, 1610], [700, 1615], [900, 1650]].map(([x, y]) => `<path d="M${x - 14},${y} L${x + 14},${y} L${x + 8},${y + 34} L${x - 8},${y + 34} Z" fill="#e8c4a0" opacity="0.85"/>`).join(''),
        glow(540, 1500, 600, '#ffb06a', 0.12),
        topShade(880, 0.5),
      ],
    };
  },

  // 7. Ночь: лестница вниз, полоска света из-под двери, холодный синий
  stairs(t, T) {
    const k = ease(t / T);
    let steps = '';
    for (let i = 0; i < 9; i++) { const y = 900 + i * 90, inset = i * 26; steps += `<rect x="${200 + inset}" y="${y}" width="${680 - inset * 2}" height="90" fill="${V(shade('#2a3448', -i * 0.06), 0.12, 0.3)}"/><rect x="${200 + inset}" y="${y}" width="${680 - inset * 2}" height="10" fill="#6a7a9a" opacity="${0.35 - i * 0.03}"/>`; }
    return {
      cam: { z: lerp(1.0, 1.22, k), y: lerp(0, 120, k) },
      els: [
        `<rect width="1080" height="1920" fill="#06080e"/>`,
        `<path d="M0,0 L200,900 L200,1730 L0,1920 Z" fill="${V('#141a28', 0.08, 0.3)}"/><path d="M1080,0 L880,900 L880,1730 L1080,1920 Z" fill="${V('#10141e', 0.08, 0.3)}"/>`,
        steps,
        // дверь внизу
        `<rect x="420" y="1440" width="240" height="300" fill="#05060a"/><rect x="420" y="1726" width="240" height="14" fill="#fff2c8" opacity="0.85"/>`,
        glow(540, 1740, 240, '#ffe6a8', 0.45),
        `<path d="M420,1740 L660,1740 L760,1920 L320,1920 Z" fill="#ffe6a8" opacity="0.12"/>`,
        glow(540, 700, 600, '#5a7ab8', 0.25),
        topShade(900, 0.5),
      ],
    };
  },

  // 8. Пон Джун Хо — фото-стикер поверх особняка в сумерках
  director(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.0, 1.05, k) },
      els: [
        `<defs>${STICKER_FILTER}</defs>`,
        sky([[0, '#141a2e'], [0.5, '#2a3456'], [0.8, '#5a4a6a'], [1, '#8a6a6a']], 1920),
        glow(540, 1200, 700, '#c9b26a', 0.25),
        `<g opacity="0.55">${mansion(540, 1500, 1.0, 0.9, '#5a7a8a')}</g>`,
        ground(1500, '#2a3a2a', 0.1, 0.4),
        STICKERS.map((s, i) => sticker(s, t, i)).join(''),
        topShade(880, 0.5),
      ],
    };
  },

  // 9. Четыре золотые статуэтки по одной под голос, прожектор, занавес
  oscars(t, T) {
    const k = ease(t / T), d = 4 / 30;
    const at = [0.53, 0.73, 0.93, 1.13].map((x) => x + d), main = pop(t, d + 2.0, 0.4);
    const xs = [240, 440, 640, 840];
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -30, k) },
      els: [
        `<rect width="1080" height="1920" fill="#0c0808"/>`,
        curtain(-1, t), curtain(1, t),
        `<path d="M400,0 L680,0 L1000,1800 L80,1800 Z" fill="${grad([[0, '#fff2d0', 0.28], [1, '#fff2d0', 0.04]])}"/>`,
        ground(1700, '#2a1a14', 0.1, 0.4),
        `<ellipse cx="540" cy="1720" rx="460" ry="60" fill="#fff2d0" opacity="0.12"/>`,
        xs.map((x, i) => { const p = pop(t, at[i], 0.2), s = (i === 1 || i === 2 ? 1.05 : 0.95) * lerp(0.3, 1, p) * (1 + 0.04 * Math.sin(clamp((t - at[i]) / 0.3) * Math.PI)); return p > 0 ? `<g opacity="${p}">${oscar(x, 1700, s, i === 1 ? main : 0)}</g>` : ''; }).join(''),
        topShade(880, 0.55),
      ],
    };
  },

  // 10. Ливень: ступени вниз от особняка к огням города, маленькие фигуры спускаются
  rain(t, T) {
    const k = ease(t / T);
    let steps = '';
    for (let i = 0; i < 12; i++) { const y = 1000 + i * 70; steps += `<rect x="${380 - i * 16}" y="${y}" width="${320 + i * 32}" height="70" fill="${V('#3a4250', 0.12, 0.35)}"/><rect x="${380 - i * 16}" y="${y}" width="${320 + i * 32}" height="6" fill="#9ab0c8" opacity="0.4"/>`; }
    let lights = '';
    for (let i = 0; i < 40; i++) lights += `<circle cx="${rnd() * 1080}" cy="${1780 + rnd() * 120}" r="${3 + rnd() * 5}" fill="${rnd() < 0.5 ? '#ffcf7a' : '#ff9a5a'}" opacity="${0.5 + rnd() * 0.5}"/>`;
    const walk = lerp(0, 160, k);
        return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -60, k) },
      els: [
        sky([[0, '#0a0e18'], [0.6, '#1a2234'], [1, '#2a3040']], 1920),
        `<g opacity="0.85">${mansion(540, 990, 0.7, 1, '#4a6a7a')}</g>`,
        glow(540, 900, 380, '#ffd890', 0.25),
        `<path d="M0,1000 L380,1000 L190,1840 L0,1840 Z" fill="#141a24"/><path d="M1080,1000 L700,1000 L890,1840 L1080,1840 Z" fill="#121822"/>`,
        steps,
        lights, glow(540, 1860, 600, '#ffb060', 0.3),
        [[480, 1260, 0.3, FATHER], [560, 1280, 0.28, MOTHER], [430, 1320, 0.27, SON], [620, 1330, 0.26, SISTER]].map(([x, y, s, o], i) =>
          person(x + wave(t, 0.8, i) * 4, y + walk, s, { ...o, step: wave(t, 1.6, i), look: 0, nod: 1, frown: 0.5 })).join(''),
        `<g opacity="0.9">${rain(t, 110)}</g>`,
        `<rect width="1080" height="1920" fill="#1a2840" opacity="0.18"/>`,
        topShade(880, 0.55),
      ],
    };
  },
};

run(shots);
