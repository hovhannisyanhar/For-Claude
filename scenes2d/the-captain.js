// «Капитан» (Der Hauptmann, 2017) — 8 сцен в 2D-векторе. Имя плана = set сцены в videos/the-captain/script.json.
// Апрель 1945, Эмсланд: серое небо, торфяные болота, грязь, голые берёзы; холодный свет, редкие тёплые пятна.
import { run, person, setProportions, V, R, grad, glow, silFilter, smoke, rnd, shade, lerp, ease, clamp, wave, def } from './core.js';

// пропорции как в «Жизнь прекрасна» / «Ирландце»
const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// Вилли-беглец: грязная солдатская шинель; Вилли-капитан: китель люфтваффе (велик: рукава до пальцев)
const SKIN = '#e6bc9c';
const WILLI_RAGS = { robe: '#5d5e4c', shirt: '#5d5e4c', skin: '#dcae8e', hair: '#8a6a44', iris: '#4a5a6a', beard: false, frown: 0.5, worried: true };
const WILLI_CAPT = { shirt: '#66717f', pants: '#4a525e', skin: SKIN, hair: '#8a6a44', iris: '#4a5a6a', beard: false, frown: 0.15, hand: 0.5, slim: 0.8 };
const OFFICER = { shirt: '#6c6e5c', pants: '#4f5044', skin: '#e0b494', hair: '#3a2a1e', iris: '#3a3a3a', beard: false, frown: 0 };
const SOLDIER = { shirt: '#6e705e', pants: '#55574a', helmet: '#5a5c4e', skin: '#dcae8e', hair: '#3a2a1e', iris: '#3a3a3a', beard: false, frown: 0 };
const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const ground = (y, c, k = 0.1, d = 0.4) => `<path d="M0,${y} L1080,${y} L1080,1920 L0,1920 Z" fill="${V(c, k, d)}"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;

// геометрия головы — повторяет person() из core.js
function headAt(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const legH = ((o.pose || 'stand') === 'crouch' ? 90 : o.pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  const headY = top - hr * 0.8 + (o.nod || 0) * 6 * hs;
  return { hs, hr, top, ty, headY };
}
// фуражка: тулья с седлом, тёмный околыш, лакированный козырёк, серебряный орёл
function officerCap(x, headY, hr, c = '#5e6878') {
  return `<path d="M${x - hr * 1.2},${headY - hr * 0.95} Q${x - hr * 1.35},${headY - hr * 1.55} ${x},${headY - hr * 1.62} Q${x + hr * 1.35},${headY - hr * 1.55} ${x + hr * 1.2},${headY - hr * 0.95} Z" fill="${V(c, 0.2, 0.3)}"/>
  <rect x="${x - hr * 0.98}" y="${headY - hr * 1.0}" width="${hr * 1.96}" height="${hr * 0.34}" rx="${hr * 0.06}" fill="#1c1e22"/>
  <path d="M${x - hr * 0.95},${headY - hr * 0.67} Q${x},${headY - hr * 0.38} ${x + hr * 0.95},${headY - hr * 0.67} Q${x},${headY - hr * 0.55} ${x - hr * 0.95},${headY - hr * 0.67} Z" fill="#0e0f12"/>
  <path d="M${x - hr * 0.9},${headY - hr * 0.72} Q${x},${headY - hr * 0.62} ${x + hr * 0.9},${headY - hr * 0.72}" stroke="#c8ccd0" stroke-width="${hr * 0.05}" fill="none"/>
  <path d="M${x - hr * 0.32},${headY - hr * 1.3} Q${x},${headY - hr * 1.42} ${x + hr * 0.32},${headY - hr * 1.3} L${x},${headY - hr * 1.2} Z" fill="#d4d8dc"/><circle cx="${x}" cy="${headY - hr * 0.84}" r="${hr * 0.09}" fill="#d4d8dc"/>`;
}
// человек + фуражка, погоны, сапоги
function man(x, y, s, o) {
  let g = person(x, y, s, o);
  const { hr, top, ty, headY } = headAt(x, y, s, o);
  let add = '';
  if (o.boots && (o.pose || 'stand') === 'stand') add += [-36, 36].map((dx) => `<rect x="${x + dx * s - 30 * s}" y="${y - 150 * s}" width="${60 * s}" height="${140 * s}" rx="${14 * s}" fill="${V('#1a1a1c', 0.25, 0.2)}"/>`).join('');
  if (o.boards) add += [-1, 1].map((sd) => `<rect x="${x + sd * 86 * s - 26 * s}" y="${top + 10 * s}" width="${52 * s}" height="${18 * s}" rx="${6 * s}" fill="${o.boards}" transform="rotate(${sd * 12} ${x + sd * 86 * s} ${top + 19 * s})"/>`).join('');
  if (o.belt) add += `<rect x="${x - 100 * s}" y="${ty - 46 * s}" width="${200 * s}" height="${22 * s}" fill="#24221e"/><rect x="${x - 16 * s}" y="${ty - 50 * s}" width="${32 * s}" height="${30 * s}" rx="${4 * s}" fill="#b8bcc0"/>`;
  if (o.officerCap) add += officerCap(x, headY, hr, o.officerCap);
  if (!add) return g;
  const tr = o.lean ? ` transform="rotate(${o.lean} ${x} ${y})"` : '';
  return `${g}<g${tr}>${add}</g>`;
}

// ---- окружение ----
function birch(x, y, h, s = 1, c = '#d6d4ca') {
  let g = `<path d="M${x - 12 * s},${y} L${x - 5 * s},${y - h} L${x + 5 * s},${y - h} L${x + 12 * s},${y} Z" fill="${c}"/>`;
  for (let i = 0; i < 7; i++) { const yy = y - h * (0.1 + i * 0.12); g += `<rect x="${x - 10 * s}" y="${yy}" width="${(8 + (i % 3) * 5) * s}" height="${4 * s}" fill="#1c1c1a"/>`; }
  for (let i = 0; i < 6; i++) { const yy = y - h * (0.45 + i * 0.09), sd = i % 2 ? 1 : -1; g += `<path d="M${x},${yy} q${sd * 40 * s},${-30 * s} ${sd * (70 + i * 6) * s},${-90 * s}" stroke="#2a2a28" stroke-width="${2.5 * s}" fill="none"/>`; }
  return g;
}
function mist(t, y, h, op = 0.35, c = '#dfe3e2') {
  let g = '';
  for (let i = 0; i < 5; i++) g += `<ellipse cx="${((i * 300 + t * (14 + i * 4)) % 1500) - 200}" cy="${y + (i % 3) * h * 0.3}" rx="${380}" ry="${h * 0.4}" fill="${c}" opacity="${op}"/>`;
  return `<g filter="url(#blur20)">${g}</g>`;
}
// открытая штабная машина в профиль (капот вправо)
function staffCar(x, y, s, o = {}) {
  const c = o.c || '#3c3f38';
  let g = `<g transform="translate(${x} ${y}) rotate(${o.tilt || 0}) scale(${s})">`;
  g += `<path d="M-330,-80 L-330,-170 Q-320,-190 -290,-192 L-120,-196 L-60,-200 L250,-196 Q330,-190 345,-150 L350,-80 Z" fill="${V(c, 0.18, 0.3)}"/>`;
  g += `<path d="M-280,-40 Q-280,-150 -190,-150 Q-100,-150 -100,-40 Z M120,-40 Q120,-150 210,-150 Q300,-150 300,-40 Z" fill="${shade(c, -0.25)}"/>`;
  g += `<rect x="-310" y="-120" width="640" height="40" fill="${shade(c, -0.1)}"/>`;
  g += `<path d="M40,-196 L70,-320 L82,-320 L58,-196 Z" fill="#1a1c1a"/><path d="M70,-318 L95,-318 L68,-198 L58,-198 Z" fill="#c8d4dc" opacity="0.35"/>`;
  g += `<path d="M-330,-200 Q-300,-250 -220,-240 L-200,-196 Z" fill="#26261f"/>`; // сложенный тент
  if (o.door) g += `<path d="M-70,-190 L-70,-90 L-170,-60 L-170,-170 Z" fill="${V(c, 0.25, 0.2)}" stroke="#1a1a18" stroke-width="4"/>`;
  else g += `<path d="M-90,-190 L-90,-90" stroke="#1a1a18" stroke-width="4"/>`;
  g += `<circle cx="345" cy="-130" r="20" fill="${o.lights ? '#fff2c0' : '#c8ccc0'}"/>`;
  [-190, 210].forEach((wx) => (g += `<circle cx="${wx}" cy="-50" r="62" fill="#141414"/><circle cx="${wx}" cy="-50" r="28" fill="#4a4a46"/>`));
  if (o.suitcase) g += `<rect x="-250" y="-238" width="130" height="70" rx="8" fill="${V('#7a5a3a', 0.2, 0.3)}" stroke="#3a2a1a" stroke-width="4"/>`;
  return g + '</g>';
}
// грузовик с тентом (кабина вправо)
function lorry(x, y, s, c = '#4a4d42') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-320,-110 L-320,-330 Q-320,-360 -280,-360 L80,-360 Q110,-360 110,-330 L110,-110 Z" fill="${V('#6a6a58', 0.15, 0.3)}"/>
  ${[-240, -140, -40, 60].map((rx) => `<path d="M${rx},-358 L${rx},-112" stroke="#4e4e40" stroke-width="5"/>`).join('')}
  <path d="M120,-110 L120,-280 L230,-280 L260,-200 L330,-190 L340,-110 Z" fill="${V(c, 0.2, 0.3)}"/><path d="M140,-265 L215,-265 L238,-205 L140,-205 Z" fill="#9aa6ae" opacity="0.6"/>
  <rect x="-330" y="-120" width="680" height="40" fill="${shade(c, -0.2)}"/>${[-230, -120, 230].map((wx) => `<circle cx="${wx}" cy="-60" r="56" fill="#141414"/><circle cx="${wx}" cy="-60" r="24" fill="#44443e"/>`).join('')}</g>`;
}
function barbed(y, h, gap, c, x0 = -40, x1 = 1120) {
  let g = '';
  const posts = []; for (let x = x0; x <= x1; x += gap) posts.push(x);
  posts.forEach((x) => (g += `<rect x="${x - 7}" y="${y - h}" width="14" height="${h}" fill="${c}"/><path d="M${x},${y - h} l30,-24" stroke="${c}" stroke-width="8"/>`));
  [0.15, 0.38, 0.6, 0.82].forEach((f) => posts.slice(0, -1).forEach((x) => {
    const yy = y - h * (1 - f);
    g += `<path d="M${x},${yy} Q${x + gap / 2},${yy + 14} ${x + gap},${yy}" stroke="${c}" stroke-width="3" fill="none"/>`;
    [0.25, 0.5, 0.75].forEach((k) => { const bx = x + gap * k, by = yy + 7; g += `<path d="M${bx - 6},${by - 6} l12,12 m0,-12 l-12,12" stroke="${c}" stroke-width="2.5"/>`; });
  }));
  return g;
}
function tower(x, y, h, c, ang, beam = 1) {
  const top = y - h;
  return `<g transform="rotate(${ang} ${x} ${top - 50})" opacity="${beam}"><path d="M${x - 10},${top - 50} L${x - 260},${top + 1500} L${x + 260},${top + 1500} L${x + 10},${top - 50} Z" fill="${grad([[0, '#dfe8ff', 0.5], [1, '#dfe8ff', 0]])}"/></g>
  <g stroke="${c}" stroke-width="10"><line x1="${x - 50}" y1="${y}" x2="${x - 32}" y2="${top}"/><line x1="${x + 50}" y1="${y}" x2="${x + 32}" y2="${top}"/><line x1="${x - 44}" y1="${y - h * 0.3}" x2="${x + 44}" y2="${y - h * 0.6}" stroke-width="5"/><line x1="${x + 44}" y1="${y - h * 0.3}" x2="${x - 44}" y2="${y - h * 0.6}" stroke-width="5"/></g>
  <rect x="${x - 58}" y="${top - 86}" width="116" height="86" fill="${c}"/><path d="M${x - 78},${top - 84} L${x},${top - 134} L${x + 78},${top - 84} Z" fill="${c}"/>${glow(x, top - 50, 90, '#e6eeff', 0.9)}<circle cx="${x}" cy="${top - 50}" r="13" fill="#fff8e0"/>`;
}
function barrack(x, y, w, h, c, roof) {
  let g = `<path d="M${x - 14},${y - h} L${x + w / 2},${y - h * 1.45} L${x + w + 14},${y - h} Z" fill="${roof}"/><rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}"/>`;
  for (let i = 0; i < Math.floor(w / 80); i++) g += `<rect x="${x + 28 + i * 80}" y="${y - h * 0.62}" width="26" height="20" fill="#0b0e16"/>`;
  return g;
}
function drizzle(t, n = 70, op = 0.25) {
  let g = '';
  for (let i = 0; i < n; i++) { const x = (rnd() * 1200 - t * 60) % 1200, y = ((rnd() * 1920 + t * 900) % 2000) - 80; g += `<path d="M${x},${y} l-8,40" stroke="#dfe6ea" stroke-width="2" opacity="${op * (0.5 + rnd() * 0.5)}"/>`; }
  return g;
}
const MOOR_SKY = [[0, '#6f777c'], [0.55, '#a7aeae'], [1, '#c9ccc6']];

const shots = {
  // 1. Туманная дорога: юный «капитан» в великоватом кителе, два офицера отдают ему честь
  salute(t, T) {
    const k = ease(t / T), sal = ease(clamp((t - 0.6) / 0.5));
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k) },
      els: [
        sky(MOOR_SKY, 1400),
        `<path d="M-100,1250 Q300,1215 640,1235 Q900,1250 1180,1225 L1180,1400 L-100,1400 Z" fill="#7d8078"/>`,
        birch(80, 1270, 420, 1) + birch(170, 1260, 360, 0.8) + birch(1010, 1265, 460, 1.1),
        lorry(250, 1310, 0.7),
        ground(1290, '#58533f', 0.08, 0.45),
        `<path d="M380,1290 L700,1290 L1080,1920 L0,1920 Z" fill="${V('#6a6450', 0.06, 0.35)}" opacity="0.8"/>`,
        mist(t, 1250, 220, 0.4),
        shadow(250, 1810, 140), shadow(470, 1780, 140), shadow(790, 1800, 160),
        man(250, 1810, 0.88, { ...OFFICER, arms: sal > 0.5 ? 'salute' : 'down', look: 1, frown: -0.1, officerCap: '#6a6c5c', boards: '#b8bcc0', belt: true, boots: true, blink: blink(t, 0.5) }),
        man(470, 1780, 0.84, { ...OFFICER, hair: '#5a4a3a', arms: sal > 0.5 ? 'salute' : 'down', look: 1, frown: 0, officerCap: '#6a6c5c', boards: '#b8bcc0', belt: true, boots: true, blink: blink(t, 2.1) }),
        man(790, 1800, 0.95, { ...WILLI_CAPT, arms: 'down', look: -0.6, frown: 0.1 - 0.3 * sal, officerCap: '#5e6878', boards: '#c8ccd0', belt: true, boots: true, blink: blink(t, 1.3) }),
        topShade(900, 0.55),
      ],
    };
  },

  // 2. Рассвет, раскисшее поле: Вилли бежит, на пригорке патруль и фары машины
  chase(t, T) {
    const k = ease(t / T), run = t * 2.6;
    const bob = Math.abs(Math.sin(run * Math.PI)) * 14;
    const lights = 0.7 + 0.3 * wave(t, 0.4);
    const sil = silFilter('#2a2c2c');
    return {
      cam: { z: lerp(1.04, 1.12, k), x: lerp(10, -20, k) },
      els: [
        sky([[0, '#4a5058'], [0.6, '#9a9a94'], [0.85, '#d8c4a0'], [1, '#e8d2a8']], 1350),
        glow(820, 1180, 380, '#f2d6a6', 0.5),
        `<path d="M-100,1200 Q250,1120 600,1150 Q860,1170 1180,1110 L1180,1350 L-100,1350 Z" fill="#5d5f56"/>`,
        // патруль на гребне и машина с фарами
        staffCar(940, 1150, 0.32, { lights: true }),
        `<path d="M1050,1108 L1180,1060 L1180,1180 Z" fill="${grad([[0, '#fff2c8', 0.45 * lights], [1, '#fff2c8', 0]], false)}"/>`,
        glow(1050, 1108, 60, '#fff2c8', lights),
        [560 + t * 12, 650 + t * 14, 730 + t * 10].map((px, i) => person(px, 1175, 0.28, { ...SOLDIER, arms: 'rifle', sil, step: wave(t, 1.2, i) })).join(''),
        birch(140, 1360, 520, 1.1) + birch(300, 1340, 380, 0.85) + birch(960, 1350, 300, 0.7),
        ground(1330, '#4d4634', 0.08, 0.45),
        [...Array(9)].map((_, i) => `<ellipse cx="${(i * 170 + 60) % 1080}" cy="${1440 + (i * 67) % 380}" rx="${60 + (i % 3) * 30}" ry="${10 + (i % 2) * 6}" fill="#9aa2a4" opacity="0.35"/>`).join(''),
        mist(t, 1250, 200, 0.3),
        shadow(520, 1790, 170, 0.35),
        person(520 + t * 10, 1790 - bob, 1.0, { ...WILLI_RAGS, robe: undefined, pants: '#45463a', lean: 6, step: Math.sin(run * Math.PI), arms: 'pull', look: -1, frown: 0.6, blink: blink(t, 0.4) }),
        topShade(900, 0.6),
      ],
    };
  },

  // 3. Кювет: продрогший Вилли ползёт к брошенной машине
  ditch(t, T) {
    const k = ease(t / T), crawl = ease(clamp(t / (T * 0.85)));
    return {
      cam: { z: lerp(1.0, 1.09, k), x: lerp(0, -30, k) },
      els: [
        sky([[0, '#5c6268'], [0.7, '#8d918e'], [1, '#a8aaa2']], 1300),
        `<path d="M-100,1160 Q400,1130 1180,1170 L1180,1300 L-100,1300 Z" fill="#6a6c62"/>`,
        birch(940, 1200, 440, 0.9) + birch(1040, 1190, 380, 0.8),
        `<path d="M-100,1240 L1180,1220 L1180,1300 L-100,1320 Z" fill="#7a7666"/>`, // насыпь дороги
        ground(1300, '#4a4332', 0.06, 0.5),
        `<path d="M-100,1420 Q540,1560 1180,1420 L1180,1920 L-100,1920 Z" fill="${V('#3e3829', 0.05, 0.5)}"/>`,
        `<path d="M-100,1700 Q540,1760 1180,1690 L1180,1760 Q540,1820 -100,1760 Z" fill="#7c8a90" opacity="0.45"/>`, // вода на дне
        staffCar(760, 1560, 0.95, { door: true, tilt: 9 }),
        smoke(640, 1430, 0.35, t, 5, '#8a8a86'),
        shadow(lerp(160, 360, crawl), 1820, 200, 0.35),
        person(lerp(160, 360, crawl), 1820, 0.92, { ...WILLI_RAGS, pose: 'crouch', arms: 'pull', lean: 14, look: 1, frown: 0.7, nod: 1, blink: blink(t, 0.9) }),
        drizzle(t, 60, 0.22),
        topShade(900, 0.6),
      ],
    };
  },

  // 4. Чемодан с мундиром: Вилли надевает китель, солдат вытягивается по стойке смирно
  uniform(t, T) {
    const k = ease(t / T), on = ease(clamp((t - T * 0.3) / 0.6)), att = ease(clamp((t - T * 0.55) / 0.4));
    const sx = lerp(1180, 860, ease(clamp(t / (T * 0.5))));
    return {
      cam: { z: lerp(1.02, 1.1, k), y: lerp(0, -30, k) },
      els: [
        sky([[0, '#646a70'], [0.7, '#9a9c96'], [1, '#b2b2aa']], 1300),
        `<path d="M-100,1180 Q500,1150 1180,1190 L1180,1300 L-100,1300 Z" fill="#6a6c62"/>`,
        birch(60, 1230, 480, 1.0) + birch(1020, 1220, 360, 0.8),
        ground(1260, '#5a5441', 0.06, 0.45),
        staffCar(300, 1420, 0.8, { door: true, suitcase: true, tilt: 4 }),
        // раскрытый чемодан на земле
        `<g filter="url(#soft)"><path d="M300,1660 L520,1660 L540,1560 L320,1560 Z" fill="${V('#7a5a3a', 0.2, 0.3)}"/><rect x="290" y="1660" width="260" height="90" rx="10" fill="${V('#6a4a2c', 0.15, 0.3)}"/><rect x="310" y="1668" width="220" height="70" fill="${V('#66717f', 0.2, 0.2)}"/><rect x="330" y="1690" width="60" height="16" rx="5" fill="#c8ccd0"/></g>`,
        shadow(560, 1820, 170, 0.35),
        `<g opacity="${1 - on}">${person(560, 1820, 0.98, { ...WILLI_RAGS, arms: 'hold', look: 1, frown: 0.3, blink: blink(t, 0.6) })}</g>`,
        `<g opacity="${on}">${man(560, 1820, 0.98, { ...WILLI_CAPT, arms: 'down', look: 1, frown: 0.2 - 0.3 * att, officerCap: '#5e6878', boards: '#c8ccd0', belt: true, boots: true, blink: blink(t, 0.6) })}</g>`,
        shadow(sx, 1780, 140, 0.3),
        man(sx, 1780, 0.86, { ...SOLDIER, arms: att > 0.5 ? 'down' : 'rifle', step: att > 0.5 ? 0 : wave(t, 1.4), lean: lerp(-4, 0, att), look: -1, frown: -0.2 * att, boots: true, blink: blink(t, 1.7) }),
        topShade(900, 0.55),
      ],
    };
  },

  // 5. Крупно: рукава до пальцев, пустой планшет; за спиной шлагбаум и офицер с фонарём
  checkpoint(t, T) {
    const k = ease(t / T), beam = ease(clamp((t - T * 0.25) / 0.8));
    return {
      cam: { z: lerp(1.0, 1.14, k), y: lerp(0, -60, k) },
      els: [
        sky([[0, '#1a2230'], [0.7, '#36404e'], [1, '#4a5260']], 1400),
        `<path d="M-100,1220 L1180,1200 L1180,1400 L-100,1400 Z" fill="#262c34"/>`,
        // будка и шлагбаум (красно-белый)
        `<rect x="40" y="980" width="170" height="260" fill="${V('#3a3f46', 0.1, 0.3)}"/><path d="M20,985 L230,985 L210,940 L40,940 Z" fill="#22262c"/><rect x="80" y="1040" width="90" height="70" fill="#ffcf7a" opacity="0.8"/>${glow(125, 1075, 140, '#ffb860', 0.4)}`,
        `<rect x="228" y="1060" width="20" height="180" fill="#1a1c20"/>${[...Array(8)].map((_, i) => `<rect x="${248 + i * 90}" y="1070" width="90" height="26" fill="${i % 2 ? '#e8e4da' : '#a8322a'}"/>`).join('')}`,
        ground(1230, '#2e2c28', 0.05, 0.5),
        // настоящий офицер с фонарём и лучом
        `<path d="M780,1120 L520,1500 L700,1560 Z" fill="${grad([[0, '#fff4d0', 0.55 * beam], [1, '#fff4d0', 0]])}"/>`,
        shadow(830, 1340, 110, 0.35),
        man(830, 1340, 0.62, { ...OFFICER, arms: 'hold', look: -1, frown: 0.6, officerCap: '#6a6c5c', boards: '#b8bcc0', belt: true, boots: true, blink: blink(t, 2.4) }),
        glow(790, 1125, 70, '#fff4d0', beam), `<circle cx="790" cy="1125" r="12" fill="#fffbe8"/>`,
        // Вилли крупно: спиной к посту, глаза косятся назад
        man(470, 2150, 1.7, { ...WILLI_CAPT, arms: 'down', look: 0.8, frown: 0.6, worried: true, officerCap: '#5e6878', boards: '#c8ccd0', belt: true, blink: blink(t, 1.1) }),
        `<rect x="580" y="1700" width="110" height="140" rx="10" fill="${V('#5a3e26', 0.2, 0.3)}" stroke="#2e2014" stroke-width="5"/><rect x="580" y="1700" width="110" height="34" rx="8" fill="#4a3220"/>`,
        glow(560, 1650, 380, '#fff4d0', 0.12 * beam),
        topShade(900, 0.6),
      ],
    };
  },

  // 6. Отряд за Вилли растёт; в конце — мелькающие кадры без контекста: проволока, бараки, прожектор
  squad(t, T) {
    const k = ease(t / T);
    const cutAt = T - 2.3; // три быстрых кадра по ~0,5 с
    if (t >= cutAt) {
      const c = Math.min(2, Math.floor((t - cutAt) / 0.5));
      const ang = 14 + 30 * wave(t, 0.25);
      const frames = [
        // проволока и вышка
        () => [sky([[0, '#06080e'], [0.7, '#141a28'], [1, '#1e2638']], 1920), tower(760, 1350, 520, '#05070c', ang), ground(1340, '#10141c', 0.04, 0.4), barbed(1600, 420, 230, '#020306')],
        // ряд бараков в луче
        () => [sky([[0, '#0a0d14'], [1, '#222a3a']], 1920), barrack(-40, 1420, 560, 160, '#161c28', '#0d121c'), barrack(560, 1440, 560, 150, '#141a26', '#0b1018'), `<g transform="rotate(${-20 + 10 * wave(t, 0.5)} 900 300)"><path d="M890,300 L520,1900 L1260,1900 L910,300 Z" fill="${grad([[0, '#e8f0ff', 0.45], [1, '#e8f0ff', 0]])}"/></g>`, ground(1430, '#0c1018', 0.04, 0.4)],
        // колючая проволока крупно
        () => [sky([[0, '#151a24'], [1, '#2a3242']], 1920), glow(540, 900, 600, '#c8d4ff', 0.3), `<g transform="scale(2.2) translate(-250 -300)">${barbed(1100, 500, 260, '#020306')}</g>`],
      ];
      return { cam: { z: 1.04 + 0.04 * ((t - cutAt) % 0.5) }, els: [...frames[c](), topShade(900, 0.5)] };
    }
    const n = 2 + Math.floor(ease(clamp(t / (T * 0.7))) * 7);
    const men = [];
    for (let i = n - 1; i >= 0; i--) {
      const row = Math.floor(i / 2) + 1, side = i % 2 ? 1 : -1;
      const sc = 0.9 / (1 + row * 0.38);
      const appear = ease(clamp((t - (i < 2 ? 0 : (i - 2) * (T * 0.7) / 7)) / 0.5));
      men.push(`<g opacity="${appear}">${man(540 + side * 250 / (1 + row * 0.45), 1760 - row * 85, sc, { ...SOLDIER, arms: 'rifle', step: wave(t, 1.3, i), look: 0, blink: blink(t, i * 0.7) })}</g>`);
    }
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k) },
      els: [
        sky(MOOR_SKY, 1300),
        `<path d="M-100,1180 Q500,1150 1180,1180 L1180,1300 L-100,1300 Z" fill="#7a7c72"/>`,
        birch(70, 1220, 420, 0.9) + birch(1000, 1210, 470, 1.0) + birch(900, 1205, 300, 0.7),
        ground(1200, '#58533f', 0.06, 0.45),
        `<path d="M440,1200 L640,1200 L1080,1920 L0,1920 Z" fill="${V('#6c6652', 0.06, 0.35)}"/>`,
        mist(t, 1190, 180, 0.35),
        ...men,
        shadow(540, 1860, 160, 0.35),
        man(540, 1860, 1.0, { ...WILLI_CAPT, arms: 'down', step: wave(t, 1.3), look: 0, frown: 0.35 * k, officerCap: '#5e6878', boards: '#c8ccd0', belt: true, boots: true, blink: blink(t, 1.0) }),
        topShade(900, 0.55),
      ],
    };
  },

  // 7. Пустой дом: Вилли в мундире у треснувшего зеркала, в отражении — он же в рваной шинели
  mirror(t, T) {
    const k = ease(t / T), morph = ease(clamp((t - T * 0.25) / (T * 0.35)));
    def(`<clipPath id="mir"><rect x="590" y="760" width="400" height="780" rx="14"/></clipPath>`);
    return {
      cam: { z: lerp(1.0, 1.08, k), x: lerp(0, -20, k) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#3a3c3a', 0.06, 0.4)}"/>`,
        // обои с полосами и окно со светом
        [...Array(12)].map((_, i) => `<rect x="${i * 90}" y="0" width="45" height="1500" fill="#000" opacity="0.06"/>`).join(''),
        `<rect x="60" y="640" width="300" height="460" fill="${grad([[0, '#d8dcd8'], [1, '#a8aea8']])}"/><path d="M210,640 L210,1100 M60,870 L360,870" stroke="#2a2a28" stroke-width="12"/><rect x="60" y="640" width="300" height="460" fill="none" stroke="#2a2a28" stroke-width="16"/>`,
        `<path d="M60,1100 L360,1100 L560,1700 L-200,1700 Z" fill="${grad([[0, '#e8ece8', 0.25], [1, '#e8ece8', 0]])}"/>`,
        `<rect x="0" y="1500" width="1080" height="420" fill="${V('#3a2e24', 0.08, 0.4)}"/>`,
        // зеркало
        `<rect x="570" y="740" width="440" height="820" rx="22" fill="${V('#5a4630', 0.2, 0.3)}"/><rect x="590" y="760" width="400" height="780" rx="14" fill="${grad([[0, '#6a7272'], [1, '#3e4444']])}"/>`,
        `<g clip-path="url(#mir)"><g opacity="0.85">`,
        `<g opacity="${1 - morph}">${man(790, 1860, 0.95, { ...WILLI_CAPT, arms: 'down', look: -0.8, frown: 0.3, officerCap: '#5e6878', boards: '#c8ccd0', belt: true, blink: blink(t, 1.6) })}</g>`,
        `<g opacity="${morph}">${person(790, 1860, 0.95, { ...WILLI_RAGS, arms: 'down', look: -0.8, frown: 0.7, blink: blink(t, 1.6) })}</g>`,
        `</g><rect x="590" y="760" width="400" height="780" fill="${grad([[0, '#fff', 0.12], [0.5, '#fff', 0], [1, '#fff', 0.08]], false)}"/></g>`,
        `<path d="M760,760 L800,980 L740,1120 L820,1300 M800,980 L900,1040 L990,990 M740,1120 L620,1180" stroke="#e8eeee" stroke-width="3" fill="none" opacity="0.7"/>`,
        // сам Вилли спиной-вполоборота
        shadow(330, 1880, 170, 0.35),
        man(330, 1880, 1.12, { ...WILLI_CAPT, arms: 'down', look: 1, frown: 0.4, officerCap: '#5e6878', boards: '#c8ccd0', belt: true, blink: blink(t, 0.8) }),
        topShade(900, 0.6),
      ],
    };
  },

  // 8. Ночь: фуражка капитана на столе при керосиновой лампе, свет медленно гаснет
  cap(t, T) {
    const k = ease(t / T), light = lerp(1, 0.35, ease(clamp((t - T * 0.3) / (T * 0.6))));
    const fl = 1 + 0.03 * wave(t, 1.7);
    return {
      cam: { z: lerp(1.0, 1.16, k), y: lerp(0, -70, k) },
      els: [
        `<rect width="1080" height="1920" fill="#08090b"/>`,
        glow(700, 1150, 900 * fl, '#ffb45a', 0.32 * light),
        `<rect x="0" y="1380" width="1080" height="540" fill="${V('#4a3220', 0.12, 0.5)}"/><rect x="0" y="1380" width="1080" height="14" fill="#2a1c12"/>`,
        glow(700, 1400, 520, '#ffb45a', 0.4 * light),
        // лампа
        `<rect x="830" y="1300" width="140" height="40" rx="10" fill="${V('#6a5030', 0.2, 0.3)}"/><path d="M850,1300 Q900,1130 950,1300 Z" fill="${V('#c8ccc0', 0.3, 0.2)}" opacity="0.5"/>`,
        glow(900, 1235, 160 * fl, '#ffcf7a', 0.9 * light), `<ellipse cx="900" cy="1240" rx="${12 * fl}" ry="${30 * fl}" fill="#fff0c0" opacity="${0.4 + 0.6 * light}"/>`,
        `<rect x="880" y="1080" width="40" height="70" rx="8" fill="#1e1a14"/>`,
        // фуражка крупно на столе
        `<g filter="url(#soft)"><ellipse cx="480" cy="1460" rx="300" ry="64" fill="#0e0f12"/>${officerCap(480, 1700, 270, '#5e6878')}</g>`,
        `<rect x="0" y="0" width="1080" height="1920" fill="#000" opacity="${0.55 * (1 - light)}"/>`,
        topShade(900, 0.6),
      ],
    };
  },
};

run(shots);
