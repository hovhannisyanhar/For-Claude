// «Жизнь прекрасна» (1997) — 9 сцен в 2D-векторе. Имя плана = set сцены в videos/life-is-beautiful/script.json.
import { run, person, setProportions, V, R, grad, glow, silFilter, mtn, stars, moon, smoke, dust, rnd, shade, lerp, ease, clamp, wave } from './core.js';

// герои: пропорции между «Переводчиком» (большие головы) и реалистичными
setProportions({ head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 });
const GUIDO = { shirt: '#8a6a4a', pants: '#5e4a38', scarf: '#efe6d4', skin: '#e8b998', hair: '#2a1c14', iris: '#4a2e1a', beard: false, frown: -0.2, fedora: '#7a5232' };
const GUIDO_CAMP = { shirt: '#8a93a3', pants: '#7a8292', stripes: '#3a4256', skin: '#dcae8c', hair: '#2a1c14', iris: '#4a2e1a', beard: false, frown: 0, cap: '#5d6576' };
const DORA = { robe: '#2a3654', shirt: '#2a3654', skin: '#f0c4a4', hair: '#8a4526', iris: '#3a2a1a', beard: false, longHair: true, frown: 0 };
const BRIDE = { ...DORA, robe: '#f4ece0', shirt: '#f4ece0' };
const SON = { shirt: '#efe3c8', pants: '#3d5a8a', scarf: '#3d5a8a', skin: '#f2c8a8', hair: '#5a3620', iris: '#4a2e1a', beard: false, frown: -0.3 };
const SON_CAMP = { shirt: '#8a93a3', pants: '#7a8292', stripes: '#3a4256', skin: '#eac0a0', hair: '#5a3620', iris: '#4a2e1a', beard: false, frown: -0.1 };
const GUEST = (c, h) => ({ shirt: c, pants: shade(c, -0.3), skin: '#e2b494', hair: h, beard: false, frown: 0 });

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const ground = (y, c, k = 0.1, d = 0.4) => `<path d="M0,${y} L1080,${y} L1080,1920 L0,1920 Z" fill="${V(c, k, d)}"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;

// ---- конь в профиль (смотрит вправо), копыта на y, s=1 — рост ~520 ----
function horse(x, y, s, t, c, mane, o = {}) {
  const ph = t * 2 * Math.PI * (o.speed ?? 2.2);
  const by = y - 300 * s + Math.cos(ph) * 10 * s; // линия спины
  const leg = (hx, a, back) => {
    const r = (d) => (d * Math.PI) / 180;
    const kx = hx + Math.sin(r(a)) * 120 * s, ky = by + 120 * s + Math.cos(r(a)) * 120 * s;
    const fx = kx + Math.sin(r(a * 0.4)) * 120 * s, fy = Math.min(y, ky + Math.cos(r(a * 0.4)) * 120 * s);
    const col = back ? shade(c, -0.3) : c;
    return `<path d="M${hx},${by + 90 * s} L${kx},${ky} L${fx},${fy}" stroke="${col}" stroke-width="${36 * s}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="${fx + 6 * s}" cy="${fy}" rx="${24 * s}" ry="${12 * s}" fill="#241a12"/>`;
  };
  const sw = Math.sin(ph);
  let g = `<ellipse cx="${x}" cy="${y + 6 * s}" rx="${260 * s}" ry="${22 * s}" fill="#000" opacity="0.25"/>`;
  g += leg(x - 150 * s, 25 * sw, true) + leg(x + 150 * s, -25 * sw, true);
  g += `<path d="M${x - 220 * s},${by + 20 * s} Q${x - 330 * s},${by + 40 * s + sw * 20 * s} ${x - 300 * s},${by + 220 * s} Q${x - 260 * s},${by + 80 * s} ${x - 210 * s},${by + 60 * s} Z" fill="${V(mane, 0.15, 0.2)}"/>`;
  g += `<ellipse cx="${x}" cy="${by + 70 * s}" rx="${240 * s}" ry="${110 * s}" fill="${V(c, 0.25, 0.3)}"/>`;
  g += `<path d="M${x + 140 * s},${by + 10 * s} Q${x + 190 * s},${by - 150 * s} ${x + 250 * s},${by - 230 * s} L${x + 330 * s},${by - 180 * s} Q${x + 270 * s},${by - 60 * s} ${x + 230 * s},${by + 110 * s} Z" fill="${V(c, 0.25, 0.25)}"/>`;
  g += `<path d="M${x + 240 * s},${by - 250 * s} Q${x + 300 * s},${by - 280 * s} ${x + 340 * s},${by - 220 * s} L${x + 400 * s},${by - 120 * s} Q${x + 405 * s},${by - 80 * s} ${x + 360 * s},${by - 85 * s} L${x + 290 * s},${by - 150 * s} Z" fill="${V(c, 0.3, 0.2)}"/>`;
  g += `<path d="M${x + 250 * s},${by - 255 * s} L${x + 262 * s},${by - 320 * s} L${x + 285 * s},${by - 262 * s} Z" fill="${c}"/>`;
  g += `<ellipse cx="${x + 322 * s}" cy="${by - 200 * s}" rx="${14 * s}" ry="${16 * s}" fill="#fbfaf3"/><circle cx="${x + 326 * s}" cy="${by - 198 * s}" r="${9 * s}" fill="#1a120c"/><circle cx="${x + 330 * s}" cy="${by - 203 * s}" r="${3.5 * s}" fill="#fff"/>`;
  g += `<path d="M${x + 245 * s},${by - 250 * s} Q${x + 170 * s},${by - 150 * s} ${x + 120 * s},${by + 20 * s} Q${x + 170 * s},${by - 90 * s} ${x + 200 * s},${by - 120 * s} Q${x + 180 * s},${by - 60 * s} ${x + 160 * s},${by} Q${x + 230 * s},${by - 150 * s} ${x + 262 * s},${by - 235 * s} Z" fill="${V(mane, 0.2, 0.2)}"/>`;
  if (o.scrawl) g += `<g stroke="${o.scrawl}" stroke-width="${9 * s}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.92"><path d="M${x - 170 * s},${by + 30 * s} q20,-40 40,0 t40,0 t40,0 M${x - 40 * s},${by + 10 * s} l0,50 M${x - 10 * s},${by + 10 * s} q30,0 30,22 q0,22 -30,22 M${x + 40 * s},${by + 30 * s} q25,-35 50,0 t40,0"/><path d="M${x - 140 * s},${by + 100 * s} l150,-6 M${x - 60 * s},${by + 130 * s} q40,-30 80,0 q30,20 60,-10"/></g>`;
  g += leg(x - 120 * s, 22 * Math.sin(ph + 2.2) + 6, false) + leg(x + 170 * s, -22 * Math.sin(ph + 2.2) - 6, false);
  g += `<path d="M${x - 150 * s},${by - 30 * s} Q${x},${by - 50 * s} ${x + 150 * s},${by - 20 * s}" stroke="${shade(c, 0.4)}" stroke-width="${10 * s}" fill="none" stroke-linecap="round" opacity="0.5"/>`;
  return { svg: `<g filter="url(#soft)">${g}</g>`, back: by };
}

// игрушечный танк; draw 0..1 — сколько контура нарисовано
function tank(x, y, s, draw = 1, o = {}) {
  const L = 1600, st = o.stroke || '#ffd98a';
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${o.fill || 'none'}" stroke="${st}" stroke-width="${(o.sw || 6) / s}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - draw)}">
    <path d="M-120,0 Q-132,-20 -112,-32 L112,-32 Q132,-20 120,0 Q108,20 88,20 L-88,20 Q-108,20 -120,0 Z"/><path d="M-92,-32 L-80,-68 L80,-68 L92,-32"/><path d="M-40,-68 Q-36,-104 8,-104 Q44,-104 48,-68"/><path d="M40,-88 L148,-100"/>
    ${[-80, -40, 0, 40, 80].map((cx) => `<circle cx="${cx}" cy="-6" r="12"/>`).join('')}</g>`;
}

function fence(y, h, gap, c, x0 = -40, x1 = 1120) {
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
function barrack(x, y, w, h, c, roof, lit = 0) {
  let g = `<path d="M${x - 14},${y - h} L${x + w / 2},${y - h * 1.5} L${x + w + 14},${y - h} Z" fill="${roof}"/><rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}"/>`;
  for (let i = 0; i < Math.floor(w / 80); i++) { const on = lit > 0 && rnd() > 0.55; g += `<rect x="${x + 28 + i * 80}" y="${y - h * 0.62}" width="26" height="20" fill="${on ? '#ffc56a' : '#0b0e16'}" opacity="${on ? lit : 0.9}"/>`; if (on) g += glow(x + 41 + i * 80, y - h * 0.52, 50, '#ffb050', 0.4 * lit); }
  return g;
}
function house(x, y, w, h, wall, roof, shutter, lit = 0, night = false) {
  let g = `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${V(wall, 0.1, 0.25)}"/><path d="M${x - 14},${y - h} L${x + w + 14},${y - h} L${x + w + 4},${y - h - 22} L${x - 4},${y - h - 22} Z" fill="${roof}"/>`;
  const cols = Math.max(1, Math.floor(w / 90)), rows = Math.max(1, Math.floor(h / 120));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const wx = x + ((c + 0.5) * w) / cols - 16, wy = y - h + 34 + r * 120, on = lit > 0 && rnd() < 0.5;
    g += `<path d="M${wx},${wy + 60} L${wx},${wy + 14} Q${wx + 16},${wy - 4} ${wx + 32},${wy + 14} L${wx + 32},${wy + 60} Z" fill="${on ? '#ffcf7a' : night ? '#141826' : '#3a2e2a'}"/>`;
    if (on) g += glow(wx + 16, wy + 36, 80, '#ffb050', 0.35 * lit); else g += `<rect x="${wx - 12}" y="${wy + 10}" width="10" height="50" fill="${shutter}"/><rect x="${wx + 34}" y="${wy + 10}" width="10" height="50" fill="${shutter}"/>`;
  }
  return g;
}
function statue(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-30" y="-34" width="60" height="34" fill="${V('#3a2a1a')}"/><rect x="-22" y="-46" width="44" height="12" fill="#c9a048"/><path d="M-9,-46 L-7,-140 Q-14,-152 -9,-164 Q0,-176 9,-164 Q14,-152 7,-140 L9,-46 Z" fill="${V('#f0c868', 0.3, 0.25)}"/><circle cx="0" cy="-180" r="12" fill="${R('#f0c868')}"/></g>`;
}
function palm(x, y, s) {
  let g = `<path d="M0,0 Q-10,-120 10,-240" stroke="#d6ad52" stroke-width="7" fill="none"/>`;
  for (let i = 0; i < 9; i++) g += `<path d="M${i * 1.2},${-20 - i * 25} q-38,-6 -50,-32 q28,4 50,26" fill="#e8bd5c"/><path d="M${2 + i * 1.2},${-32 - i * 25} q38,-6 48,-32 q-28,4 -48,26" fill="#e8bd5c"/>`;
  return `<g transform="translate(${x} ${y}) rotate(-22) scale(${s})">${g}</g>`;
}

const shots = {
  // 1. Лагерь ночью: отец присел к сыну, в небе прорисовывается золотой танк
  camp(t, T) {
    const k = ease(t / T), draw = ease(clamp((t - T * 0.35) / (T * 0.5)));
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k) },
      els: [
        sky([[0, '#04060d'], [0.55, '#111a32'], [0.85, '#24304e']], 1350) + stars(160, 900, t),
        glow(640, 1000, 340, '#ffcf6e', 0.35 * draw), tank(640, 1030, 1.15, draw, { sw: 7 }),
        tower(150, 1260, 430, '#0a0e1a', 14 + 26 * wave(t, 0.12)),
        barrack(300, 1290, 500, 110, '#121a2c', '#0b1120', 0.8), barrack(780, 1310, 380, 90, '#101727', '#0a101e', 0.6),
        ground(1290, '#141b2c', 0.05, 0.4),
        fence(1440, 300, 220, '#05070d'),
        `<ellipse cx="540" cy="1790" rx="400" ry="34" fill="#000" opacity="0.3"/>`,
        person(390, 1800, 1.05, { ...GUIDO_CAMP, pose: 'crouch', look: 1, nod: wave(t, 0.9), smile: true, blink: blink(t, 0.4) }),
        person(720, 1790, 0.72, { ...SON_CAMP, look: -1, lookUp: draw, blink: blink(t, 1.9) }),
        glow(560, 1500, 520, '#9fb4e8', 0.12),
        topShade(900, 0.55),
      ],
    };
  },

  // 2. Помолвка: Гвидо на коне врывается в зал, гости в шоке, невеста встаёт
  wedding(t, T) {
    const k = ease(t / T), ride = ease(clamp((t - T * 0.15) / (T * 0.6)));
    const hx = lerp(-260, 420, ride);
    const h = horse(hx, 1760, 0.95, t, '#8a5a3a', '#2a1a10');
    let garl = '';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) { const f = j / 6, x = i * 300 - 60 + 300 * f, y = 760 + 110 * f * (1 - f) * 2; garl += glow(x, y, 34, '#ffbf66', 0.6) + `<circle cx="${x}" cy="${y}" r="7" fill="#ffe2a0"/>`; }
    return {
      cam: { z: lerp(1.0, 1.08, k), x: lerp(0, -20, k) },
      els: [
        sky([[0, '#3a1c12'], [0.5, '#6e3b20'], [1, '#4a2614']], 1920),
        [150, 540, 930].map((cx, i) => `<path d="M${cx - 130},1300 L${cx - 130},880 Q${cx},720 ${cx + 130},880 L${cx + 130},1300 Z" fill="${i === 0 ? V('#5d7fb0', 0.2, 0.2) : '#4a2616'}"/><path d="M${cx - 144},1300 L${cx - 144},880 Q${cx},704 ${cx + 144},880 L${cx + 144},1300" stroke="#c99a52" stroke-width="12" fill="none"/>`).join(''),
        garl,
        ground(1300, '#3a1e10', 0.05, 0.4),
        // стол и гости за ним
        person(600, 1430, 0.5, { ...GUEST('#3b2f4a', '#2a1c14'), look: -1, frown: -0.5 + ride * 0.9, blink: blink(t, 0.3) }),
        person(760, 1430, 0.5, { ...GUEST('#5a2a2a', '#6a4a2a'), longHair: true, look: -1, frown: -0.5 + ride * 0.9, blink: blink(t, 2.1) }),
        person(920, 1430, 0.5, { ...GUEST('#2f3c4a', '#3a2a1c'), look: -1, frown: -0.5 + ride * 0.9, moustache: true, blink: blink(t, 1.1) }),
        `<path d="M480,1400 L1100,1400 L1100,1500 L460,1500 Z" fill="${V('#f4ead8', 0.1, 0.15)}"/>${[560, 700, 840, 980].map((x) => glow(x, 1380, 60, '#ffbf66', 0.7) + `<rect x="${x - 4}" y="1360" width="8" height="40" fill="#efe6d4"/><circle cx="${x}" cy="1356" r="6" fill="#ffd27a"/>`).join('')}`,
        `<ellipse cx="900" cy="1820" rx="200" ry="24" fill="#000" opacity="0.25"/>`,
        person(900, 1830, 0.95, { ...BRIDE, look: -1, frown: -0.4, blink: blink(t, 1.3) }),
        h.svg,
        person(hx + 30, h.back + 30, 0.78, { ...GUIDO, pose: 'sit', arms: 'raise', look: 1, smile: true, blink: blink(t, 0.7) }),
        topShade(900, 0.5),
        dust(t, 26, '#ffe2a0', 700, 1600),
      ],
    };
  },

  // 3. Ночное Ареццо: скачка на зелёном коне с надписью
  greenhorse(t, T) {
    const k = ease(t / T), sc = t * 260;
    let hs = '';
    for (let i = 0; i < 7; i++) { const x = ((i * 300 - sc * 0.35) % 2100 + 2100) % 2100 - 300; hs += house(x, 1330, 270, 360 + (i % 3) * 70, ['#4a3e5e', '#54406a', '#3e3a58'][i % 3], '#2a2240', '#2e3a4a', 0.9, true); }
    let lamps = '';
    for (let i = 0; i < 3; i++) { const x = ((i * 700 - sc * 0.7) % 2100 + 2100) % 2100 - 300; lamps += `<rect x="${x - 5}" y="1050" width="10" height="320" fill="#120e1c"/>${glow(x, 1040, 160, '#ffb050', 0.7)}<rect x="${x - 16}" y="1020" width="32" height="40" rx="4" fill="#ffd38a"/>`; }
    const h = horse(470, 1780, 1.0, t, '#3fbf4f', '#1f6a2a', { scrawl: '#f6f1e4', speed: 2.6 });
    return {
      cam: { z: lerp(1.0, 1.06, k) },
      els: [
        sky([[0, '#0b1230'], [0.5, '#1b2350'], [0.85, '#3a306a']], 1400) + stars(140, 1000, t) + moon(860, 760, 58),
        hs, ground(1330, '#241c36', 0.05, 0.35), lamps,
        glow(500, 1420, 520, '#5fd36a', 0.25),
        h.svg,
        person(330, h.back + 34, 0.7, { ...BRIDE, pose: 'sit', arms: 'hold', look: 1, smile: true, blink: blink(t, 1.6) }),
        person(520, h.back + 30, 0.78, { ...GUIDO, pose: 'sit', arms: 'raise', look: 1, smile: true, blink: blink(t, 0.5) }),
        topShade(900, 0.5),
      ],
    };
  },

  // 4. Книжная лавка: смех → холодный свет, листок в витрине, тени в форме
  shop(t, T) {
    const k = ease(t / T), cold = ease(clamp((t - T * 0.55) / (T * 0.35)));
    const jump = Math.max(0, wave(t, 1.6)) * 26 * (1 - cold);
    let books = '';
    for (let r = 0; r < 3; r++) for (let i = 0; i < 15; i++) { const hh = 70 + rnd() * 40; books += `<rect x="${172 + i * 32}" y="${1020 + r * 112 - hh}" width="26" height="${hh}" fill="${['#a8432a', '#2f5a7a', '#d9a441', '#3f7a5a', '#7a3a5a', '#e8dcc0'][Math.floor(rnd() * 6)]}"/>`; }
    const shadowX = lerp(1250, 700, cold);
    const shadow = (dx) => `<g transform="translate(${shadowX + dx} 1700) skewX(-40) scale(1 0.55)" opacity="${0.7 * cold}"><rect x="-40" y="-760" width="80" height="420" rx="30" fill="#0e1220"/><circle cx="0" cy="-820" r="56" fill="#0e1220"/><ellipse cx="0" cy="-860" rx="80" ry="22" fill="#0e1220"/><rect x="-36" y="-360" width="30" height="360" fill="#0e1220"/><rect x="6" y="-360" width="30" height="360" fill="#0e1220"/></g>`;
    return {
      cam: { z: lerp(1.0, 1.08, k) },
      els: [
        sky([[0, '#9cc6e0'], [0.6, '#f3e2bc'], [1, '#e9c690']], 700),
        glow(900, 600, 420, '#fff0c8', 0.8 * (1 - cold)),
        `<rect x="40" y="580" width="1000" height="920" fill="${V('#d9a46a', 0.15, 0.2)}"/>`,
        `<rect x="240" y="660" width="600" height="96" rx="10" fill="${V('#2f4a3a', 0.2, 0.25)}"/><rect x="258" y="676" width="564" height="64" rx="8" fill="none" stroke="#e8c87a" stroke-width="3"/>${[0, 1, 2].map((i) => `<rect x="${330 + i * 160}" y="702" width="100" height="10" rx="5" fill="#e8c87a"/>`).join('')}`,
        `<path d="M110,790 L970,790 L1010,890 L70,890 Z" fill="#f2e8d2"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${110 + i * 86},790 L${153 + i * 86},790 L${157 + i * 94},890 L${114 + i * 94},890 Z" fill="#3f7a5a"/>`).join('')}`,
        `<rect x="150" y="920" width="540" height="420" fill="#3a2a22"/>${books}${[1020, 1132, 1244].map((y) => `<rect x="160" y="${y}" width="520" height="8" fill="#5a3a24"/>`).join('')}`,
        `<g opacity="${cold}" transform="rotate(-3 600 1000)"><rect x="520" y="940" width="160" height="120" fill="#f4f0e4"/>${[0, 1, 2, 3].map((i) => `<path d="M538,${962 + i * 24} l${118 - i * 14},0" stroke="#1a1410" stroke-width="7" stroke-linecap="round"/>`).join('')}</g>`,
        `<rect x="740" y="920" width="230" height="420" fill="${V('#2f4a3a', 0.2, 0.3)}"/><rect x="760" y="940" width="190" height="180" fill="#f6e6c4" opacity="0.35"/><circle cx="944" cy="1160" r="9" fill="#e8c87a"/>`,
        ground(1340, '#c4a27a', 0.1, 0.35),
        shadow(0), shadow(220),
        `<ellipse cx="560" cy="1820" rx="420" ry="34" fill="#000" opacity="0.18"/>`,
        person(400, 1830, 1.05, { ...GUIDO, arms: 'raise', look: 1, smile: cold < 0.5, closed: cold < 0.5 && wave(t, 0.8) > 0.3, frown: lerp(-0.3, 0.5, cold), worried: cold > 0.5, blink: blink(t) }),
        person(760, 1830 - jump, 0.72, { ...SON, arms: 'raise', look: -1, smile: cold < 0.5, worried: cold >= 0.5, frown: lerp(-0.4, 0.4, cold), blink: blink(t, 1.2) }),
        `<rect width="1080" height="1920" fill="#1c2a4a" opacity="${0.45 * cold}"/>`,
        topShade(820, 0.45),
      ],
    };
  },

  // 5. Перрон в тумане: люди уходят в товарный вагон, Дора идёт к поезду
  train(t, T) {
    const k = ease(t / T), walk = ease(t / T);
    const sil = silFilter('#2a2d36');
    let crowd = '';
    for (let i = 0; i < 5; i++) { const x = 330 + i * 70 - ((t * 40 + i * 50) % 200); crowd += person(x, 1400, 0.42, { shirt: '#555', look: -1, sil, step: wave(t, 1.4, i) }); }
    return {
      cam: { z: lerp(1.0, 1.1, k), x: lerp(0, 30, k) },
      els: [
        sky([[0, '#4e5868'], [0.6, '#8a929e'], [1, '#b5b8bc']], 1400),
        [0, 1, 2].map((i) => { const s = 1 - i * 0.25, x = 760 + i * 170; return `<g transform="translate(${x} ${1150 - i * 40}) scale(${s})" opacity="${0.8 - i * 0.2}"><rect x="-200" y="-300" width="360" height="300" fill="#5a3a2c"/><path d="M-210,-300 Q-20,-340 170,-300 Z" fill="#3a2a22"/></g>`; }).join(''),
        `<g filter="url(#blur20)">${Array.from({ length: 8 }, () => `<ellipse cx="${(rnd() * 1300 + t * 20) % 1300 - 100}" cy="${1000 + rnd() * 300}" rx="${220 + rnd() * 200}" ry="${50 + rnd() * 40}" fill="#d8dde4" opacity="0.5"/>`).join('')}</g>`,
        `<g filter="url(#soft)"><rect x="-40" y="860" width="700" height="500" fill="${V('#6a4232', 0.15, 0.3)}"/>${Array.from({ length: 18 }, (_, j) => `<rect x="${-36 + j * 40}" y="864" width="3" height="492" fill="#4a2c20"/>`).join('')}<path d="M-60,860 Q300,810 680,860 Z" fill="#3a2a22"/><rect x="200" y="940" width="220" height="420" fill="#0a0806"/><rect x="430" y="930" width="230" height="440" fill="${V('#5a3628', 0.1, 0.3)}"/>${[60, 200, 460, 600].map((x) => `<circle cx="${x}" cy="1390" r="32" fill="#141010"/>`).join('')}</g>`,
        smoke(720, 860, 0.8, t, 6, '#d8d4cc'),
        ground(1400, '#4a4c52', 0.1, 0.4),
        crowd,
        `<ellipse cx="${lerp(900, 720, walk)}" cy="1830" rx="200" ry="24" fill="#000" opacity="0.25"/>`,
        person(lerp(900, 720, walk), 1840, 1.1, { ...DORA, look: -1, frown: 0.45, step: wave(t, 1.3), blink: blink(t, 0.8) }),
        glow(1000, 1300, 400, '#ffcf8a', 0.2),
        topShade(820, 0.5),
      ],
    };
  },

  // 6. Барак: Гвидо подмигивает, у сына — бумажный танк
  barrack(t, T) {
    const k = ease(t / T), g = ease(clamp((t - T * 0.2) / (T * 0.5)));
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -60, k) },
      els: [
        sky([[0, '#0d0f16'], [1, '#1c2230']], 1920),
        [0, 1, 2].map((r) => `<path d="M-40,${820 + r * 220} L300,${880 + r * 190} L300,${910 + r * 190} L-40,${860 + r * 220} Z" fill="#3a2c22"/><path d="M1120,${820 + r * 220} L780,${880 + r * 190} L780,${910 + r * 190} L1120,${860 + r * 220} Z" fill="#3a2c22"/>`).join(''),
        `<rect x="294" y="840" width="12" height="700" fill="#2a2018"/><rect x="774" y="840" width="12" height="700" fill="#2a2018"/>`,
        ground(1460, '#14110e', 0.1, 0.3),
        `<path d="M700,660 L770,660 L620,1600 L300,1600 Z" fill="${grad([[0, '#ffe2a8', 0.5], [1, '#ffe2a8', 0]])}"/><rect x="690" y="644" width="90" height="16" fill="#ffe2a8" opacity="0.85"/>`,
        dust(t, 40, '#ffe7b8', 700, 1500),
        `<ellipse cx="540" cy="1790" rx="420" ry="32" fill="#000" opacity="0.3"/>`,
        person(380, 1800, 1.1, { ...GUIDO_CAMP, pose: 'crouch', look: 1, wink: (t % 2.4) > 1.2 && (t % 2.4) < 1.6, smile: true, nod: wave(t, 0.8) }),
        person(740, 1790, 0.75, { ...SON_CAMP, arms: 'hold', look: -1, lookUp: 0.5, frown: -0.4, smile: g > 0.6, blink: blink(t, 1.7) }),
        glow(740, 1530, 220, '#ffcf6e', 0.7 * g), tank(740, 1545, 0.42, 1, { fill: '#e9d2a0', stroke: '#7a5a2a', sw: 3 }),
        topShade(820, 0.55),
      ],
    };
  },

  // 7. Прятки: глаза в щели ящика, луч фонаря, сапоги солдата
  hide(t, T) {
    const k = ease(t / T), bx = lerp(1100, 160, ease(t / T));
    const near = Math.max(0, 1 - Math.abs(bx - 400) / 300);
    const stepX = lerp(980, 780, k), ph = t * 1.4;
    const boot = (x, lift) => `<rect x="${x - 55}" y="${-200}" width="110" height="${1500 - lift}" rx="40" fill="${V('#33382e', 0.15, 0.3)}"/><path d="M${x - 64},${1300 - lift} L${x + 60},${1300 - lift} L${x + 60},${1420 - lift} L${x - 130},${1420 - lift} Q${x - 140},${1370 - lift} ${x - 64},${1350 - lift} Z" fill="${V('#141512', 0.25, 0.2)}"/>`;
    return {
      cam: { z: lerp(1.0, 1.08, k) },
      els: [
        sky([[0, '#06080d'], [1, '#10141e']], 1920),
        Array.from({ length: 14 }, (_, i) => `<rect x="${i * 80 - 20}" y="560" width="76" height="1000" fill="${i % 2 ? '#141820' : '#11141b'}"/>`).join(''),
        ground(1460, '#0d0f14', 0.05, 0.3),
        `<path d="M1300,950 L${bx - 200},1380 L${bx + 140},1620 Z" fill="${grad([[0, '#fff2c8', 0], [1, '#fff2c8', 0.5]], false)}" opacity="0.6"/><ellipse cx="${bx}" cy="1520" rx="240" ry="90" fill="#fff2c8" opacity="0.25"/>`,
        `<g filter="url(#soft)"><rect x="170" y="1180" width="380" height="360" fill="${V('#5a3e2a', 0.2, 0.35)}"/>${[0, 1, 2, 3].map((i) => `<rect x="170" y="${1180 + i * 90}" width="380" height="7" fill="#2a1c12"/>`).join('')}<rect x="170" y="1180" width="380" height="360" fill="#fff2c8" opacity="${near * 0.25}"/><rect x="262" y="1270" width="196" height="40" fill="#030304"/></g>`,
        ((t % 3.1) < 0.12 ? '' : `<ellipse cx="320" cy="1290" rx="15" ry="13" fill="#f4efe4"/><ellipse cx="400" cy="1290" rx="15" ry="13" fill="#f4efe4"/><circle cx="${326 + 4 * wave(t, 0.3)}" cy="1292" r="8" fill="#2a1a10"/><circle cx="${406 + 4 * wave(t, 0.3)}" cy="1292" r="8" fill="#2a1a10"/><circle cx="${329 + 4 * wave(t, 0.3)}" cy="1288" r="3" fill="#fff"/><circle cx="${409 + 4 * wave(t, 0.3)}" cy="1288" r="3" fill="#fff"/>`),
        `<g transform="translate(0 ${200})">${boot(stepX + 160, Math.max(0, Math.sin(ph)) * 40)}${boot(stepX, Math.max(0, -Math.sin(ph)) * 40)}</g>`,
        `<path d="M${stepX - 140},-100 L${stepX + 300},-100 L${stepX + 330},${980 + 10 * wave(t, 0.7)} L${stepX - 170},${980 + 10 * wave(t, 0.7, 1)} Z" fill="${V('#3c4236', 0.2, 0.35)}" filter="url(#soft)"/><path d="M${stepX + 80},-100 L${stepX + 80},970" stroke="#23271f" stroke-width="6"/>${[300, 520, 740].map((y) => `<circle cx="${stepX + 110}" cy="${y}" r="12" fill="#b8a46a"/>`).join('')}`,
        topShade(900, 0.6),
      ],
    };
  },

  // 8. Реальная история: фото отца в рамке, лампа, награды
  father(t, T) {
    const k = ease(t / T), aw = ease(clamp((t - T * 0.45) / (T * 0.3)));
    const sep = silFilter('#4a3220');
    return {
      cam: { z: lerp(1.0, 1.1, k), y: lerp(0, -40, k) },
      els: [
        sky([[0, '#2a1e14'], [0.6, '#4a3422'], [1, '#1e150e']], 1920),
        glow(820, 820, 560, '#ffd9a0', 0.55),
        `<path d="M760,880 L900,880 L950,990 L710,990 Z" fill="${V('#2f4a3a', 0.25, 0.3)}"/><rect x="824" y="990" width="12" height="400" fill="#6a5030"/><ellipse cx="830" cy="1390" rx="64" ry="13" fill="#6a5030"/>`,
        ground(1390, '#3a2414', 0.1, 0.35), `<rect x="0" y="1390" width="1080" height="14" fill="#5a3a22"/>`,
        `<g transform="rotate(-4 360 1080)" filter="url(#soft)"><rect x="140" y="760" width="440" height="600" fill="${V('#7a5530', 0.2, 0.3)}"/><rect x="162" y="782" width="396" height="556" fill="#e7d3ae"/><rect x="184" y="804" width="352" height="470" fill="${V('#b8946a', 0.15, 0.2)}"/>
          ${person(360, 1260, 0.62, { shirt: '#6a4a30', pants: '#5a3a24', skin: '#c79a74', hair: '#3a2614', beard: false, moustache: true, cap: '#4a3220', frown: -0.2, smile: true })}
          <rect x="184" y="804" width="352" height="470" fill="#a87a4a" opacity="0.35"/></g>`,
        `<g opacity="${aw}" transform="translate(0 ${(1 - aw) * 30})">${glow(780, 1200, 280, '#ffcf6e', 0.45)}${statue(640, 1400, 2.1)}${statue(790, 1400, 2.3)}${statue(940, 1400, 2.1)}${palm(1030, 1400, 1.5)}</g>`,
        `<rect width="1080" height="1920" fill="#7a5530" opacity="0.12"/>`,
        dust(t, 26, '#ffe2a8', 800, 1400),
        topShade(820, 0.5),
      ],
    };
  },

  // 9. Рассвет: сын на плечах у отца тянется к солнцу
  sunrise(t, T) {
    const k = ease(t / T), sun = lerp(1220, 1120, k);
    let rays = '';
    for (let i = 0; i < 12; i++) { const a = ((-170 + i * 15) * Math.PI) / 180; rays += `<path d="M540,${sun} L${540 + Math.cos(a - 0.03) * 1500},${sun + Math.sin(a - 0.03) * 1500} L${540 + Math.cos(a + 0.03) * 1500},${sun + Math.sin(a + 0.03) * 1500} Z" fill="#fff1c4" opacity="${0.07 + 0.04 * wave(t, 0.3, i)}"/>`; }
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -30, k) },
      els: [
        sky([[0, '#3a4a7a'], [0.45, '#c97a5a'], [0.65, '#f2b46a'], [0.75, '#ffe0a0']], 1400),
        rays, glow(540, sun, 520, '#ffe9b0', 0.9), `<circle cx="540" cy="${sun}" r="110" fill="#fff4cc"/>`,
        `<path d="M-100,1300 Q240,1190 540,1260 Q820,1320 1180,1210 L1180,1920 L-100,1920 Z" fill="${V('#a8604a', 0.1, 0.3)}"/>`,
        `<g opacity="0.25">${fence(1310, 130, 170, '#5a2e2a')}</g>`,
        `<g filter="url(#blur20)">${Array.from({ length: 7 }, () => `<ellipse cx="${(rnd() * 1300 + t * 15) % 1300 - 100}" cy="${1260 + rnd() * 120}" rx="${240 + rnd() * 200}" ry="${40 + rnd() * 30}" fill="#f6d2a8" opacity="0.5"/>`).join('')}</g>`,
        `<path d="M-100,1640 Q300,1540 600,1590 Q900,1640 1180,1570 L1180,1920 L-100,1920 Z" fill="${V('#4a2a24', 0.1, 0.3)}"/>`,
        `<ellipse cx="540" cy="1800" rx="300" ry="28" fill="#000" opacity="0.3"/>`,
        person(540, 1250 - 20 * k, 0.66, { ...SON_CAMP, pose: 'sit', arms: 'raise', look: 0, lookUp: 1, smile: true, blink: blink(t, 0.9) }),
        person(540, 1810, 1.05, { ...GUIDO_CAMP, arms: 'hold', look: 0, lookUp: 1, smile: true, blink: blink(t, 2.2) }),
        glow(540, 1400, 500, '#ffcf8a', 0.18),
        dust(t, 30, '#fff1d0', 900, 1700),
        topShade(820, 0.45),
      ],
    };
  },
};

run(shots);
