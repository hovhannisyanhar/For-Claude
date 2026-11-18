// «Переводчик» (2023) — 13 сцен в 2D-векторе. Имя плана = set сцены в videos/the-covenant/script.json.
import { run, person, V, R, grad, glow, def, silFilter, mtn, stars, moon, flame, smoke, dust, rnd, shade, lerp, ease, clamp, wave } from './core.js';

const KIN = { shirt: '#8a7a5e', pants: '#7a6b52', vest: '#6b6448', helmet: '#7a6e55', skin: '#e2ae8a', hair: '#3a2a1c', iris: '#5a4430', frown: 0.15 };
const AHM = { shirt: '#7c6a55', pants: '#5a4d3e', vest: '#4f4a3c', scarf: '#8f8170', skin: '#c48b62', hair: '#17110d', iris: '#2a1a10', squint: true, frown: 0.4 };
const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const ground = (y, c, k = 0.1, d = 0.4) => `<path d="M0,${y} L1080,${y} L1080,1920 L0,1920 Z" fill="${V(c, k, d)}"/>`;
const rocks = (list, c) => `<g fill="${V(c, 0.2, 0.35)}">${list.map(([x, y, w, h]) => `<path d="M${x - w / 2},${y} Q${x - w * 0.4},${y - h} ${x},${y - h} Q${x + w * 0.45},${y - h * 0.9} ${x + w / 2},${y} Z"/>`).join('')}</g>`;

function mrap(x, y, s, c = '#a08a66') {
  return `<g filter="url(#soft)" transform="translate(${x} ${y}) scale(${s})"><rect x="-60" y="-270" width="470" height="260" rx="30" fill="${V(c, 0.18, 0.3)}"/><rect x="-40" y="-370" width="330" height="140" rx="26" fill="${V(c, 0.25, 0.25)}"/><rect x="0" y="-340" width="240" height="60" rx="10" fill="${V('#33424e', 0.3, 0.2)}"/><rect x="110" y="-410" width="80" height="44" rx="10" fill="${V(shade(c, -0.1))}"/><rect x="180" y="-398" width="140" height="14" rx="6" fill="#222"/><circle cx="60" cy="0" r="78" fill="#1d1b19"/><circle cx="60" cy="0" r="34" fill="#4a4540"/><circle cx="320" cy="0" r="78" fill="#1d1b19"/><circle cx="320" cy="0" r="34" fill="#4a4540"/></g>`;
}
function heli(x, y, s, t, c = '#2c2a26', rot = -6) {
  const blade = 150 + 150 * Math.abs(wave(t, 3));
  return `<g fill="${c}" transform="translate(${x} ${y}) scale(${s}) rotate(${rot})"><ellipse cx="0" cy="0" rx="70" ry="30"/><rect x="-170" y="-12" width="130" height="14" rx="6"/><rect x="-175" y="-40" width="12" height="40"/><rect x="${-blade}" y="-36" width="${blade * 2}" height="5" rx="2" opacity="0.6"/><rect x="-30" y="26" width="80" height="5"/><circle cx="-169" cy="-20" r="${18 + 6 * wave(t, 4)}" opacity="0.25"/></g>`;
}
function pickup(x, y, s, c = '#5a5a52', lights = false) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#soft)"><rect x="-150" y="-110" width="300" height="80" rx="14" fill="${V(c, 0.2, 0.3)}"/><path d="M-120,-110 L-90,-170 L20,-170 L40,-110 Z" fill="${V(c, 0.25, 0.25)}"/><path d="M-100,-115 L-80,-158 L10,-158 L25,-115 Z" fill="#2a3440"/><circle cx="-90" cy="-25" r="34" fill="#1b1a18"/><circle cx="95" cy="-25" r="34" fill="#1b1a18"/>${lights ? `<circle cx="146" cy="-80" r="10" fill="#fff6d0"/>` : ''}</g>`;
}
function hesco(y, n = 10, x0 = -10, c = '#b39670') { let s = ''; for (let i = 0; i < n; i++) s += `<rect x="${x0 + i * 110}" y="${y}" width="104" height="104" rx="6" fill="${V(c, 0.15, 0.25)}"/><path d="M${x0 + i * 110 + 20},${y + 10} v90 M${x0 + i * 110 + 50},${y + 10} v90 M${x0 + i * 110 + 80},${y + 10} v90" stroke="${shade(c, -0.25)}" stroke-width="3" opacity="0.6"/>`; return s; }
function cart(x, y, s, t, kinley = true) {
  const a = t * 40;
  const wheel = (cx) => `<g transform="rotate(${a} ${cx} 1440)"><circle cx="${cx}" cy="1440" r="98" fill="none" stroke="#6a4630" stroke-width="18"/><circle cx="${cx}" cy="1440" r="16" fill="#6a4630"/><path d="M${cx},1342 V1538 M${cx - 98},1440 H${cx + 98} M${cx - 69},1371 L${cx + 69},1509 M${cx + 69},1371 L${cx - 69},1509" stroke="#6a4630" stroke-width="8"/></g>`;
  const k = kinley ? `<rect x="360" y="1200" width="330" height="84" rx="40" fill="${V('#7a6b52', 0.2, 0.25)}"/><rect x="430" y="1196" width="200" height="60" rx="26" fill="${V('#5a5040', 0.25, 0.2)}"/><ellipse cx="680" cy="1236" rx="30" ry="22" fill="#3a2a1c"/>
    <ellipse cx="350" cy="1205" rx="62" ry="58" fill="#3a2a1c"/><ellipse cx="352" cy="1210" rx="54" ry="54" fill="${R('#e2ae8a', 0.15, 0.2)}"/>
    <path d="M300,1215 Q300,1272 352,1272 Q404,1272 404,1215 Q380,1245 352,1243 Q324,1245 300,1215 Z" fill="#3a2a1c"/>
    <path d="M322,1202 q10,7 20,0 M362,1202 q10,7 20,0" stroke="#6a3a28" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M302,1180 Q352,1150 402,1180" stroke="#f0ece2" stroke-width="16" fill="none"/><circle cx="380" cy="1176" r="7" fill="#a3302a" opacity="0.8"/>` : '';
  return `<g filter="url(#soft)" transform="translate(${x} ${y}) scale(${s}) translate(-540 -1440)"><rect x="320" y="1240" width="440" height="200" rx="10" fill="${V('#7a5236', 0.2, 0.3)}"/><path d="M330,1270 h420 M330,1320 h420 M330,1370 h420" stroke="#4a3020" stroke-width="5"/>${k}${wheel(300)}${wheel(780)}<path d="M380,1430 L420,1640 M700,1430 L660,1640" stroke="#7a5236" stroke-width="18" stroke-linecap="round"/></g>`;
}
function nightSky(t, moonX = 270, moonY = 330) {
  return sky([[0, '#04060d'], [0.55, '#121c34'], [0.8, '#2a3654']]) + stars(200, 820, t) + moon(moonX, moonY);
}
function torches(list, t) {
  return list.map(([x, y], i) => glow(x, y - 30, 60 + 8 * wave(t, 1.3, i), '#ffa040', 0.9) + `<circle cx="${x}" cy="${y - 34}" r="6" fill="#ffd28a"/><rect x="${x + 4}" y="${y - 30}" width="12" height="30" rx="5" fill="#0b0d14"/>`).join('');
}
const leaflet = (x, y, s, t) => {
  const sk = 3 * wave(t, 0.5);
  return `<g transform="translate(${x} ${y}) scale(${s}) skewY(${sk})" filter="url(#soft)">
    <rect x="-150" y="-200" width="300" height="400" fill="${V('#ece2c8', 0.1, 0.15)}"/>
    <rect x="-110" y="-160" width="220" height="210" fill="#c9bea2"/>
    <ellipse cx="0" cy="-70" rx="62" ry="68" fill="#3a3026"/><path d="M-110,50 Q-100,-20 0,-10 Q100,-20 110,50 Z" fill="#3a3026"/>
    <path d="M-52,-55 Q-52,10 0,10 Q52,10 52,-55 Q30,-25 0,-25 Q-30,-25 -52,-55 Z" fill="#1c1610"/>
    <path d="M-100,90 h200 M-100,120 h150 M-100,150 h180" stroke="#5a4a38" stroke-width="10" stroke-linecap="round"/>
    <circle cx="0" cy="-185" r="9" fill="#555"/></g>`;
};

const shots = {
  // 1. Ночь, деревня: на глиняной стене листовка с силуэтом, качается фонарь
  'poster-wall'(t, T) {
    const k = ease(t / T), sw = 8 * wave(t, 0.45);
    return {
      cam: { z: lerp(1.0, 1.32, k), x: 0, y: lerp(0, -80, k) },
      els: [
        nightSky(t, 820, 260),
        mtn('0,800 L200,640 L380,720 L560,600 L760,740 L940,640 L1080,700 L1080,900 L0,900 Z', '#1a2238'),
        `<rect x="0" y="720" width="1080" height="1200" fill="${V('#8a6a4a', 0.05, 0.45)}"/>`,
        `<g stroke="#5a4430" stroke-width="5" fill="none" opacity="0.6"><path d="M120,900 l40,60 l-20,50 M820,1500 l-40,70 l30,40 M300,1650 l60,30 M900,950 l-30,40"/></g>`,
        `<rect x="0" y="700" width="1080" height="40" fill="${V('#6a4e36', 0.1, 0.3)}"/>`,
        `<g fill="${V('#3a2a1c', 0.1, 0.2)}"><rect x="60" y="1180" width="260" height="560" rx="8"/></g><rect x="80" y="1200" width="220" height="520" fill="none" stroke="#24180f" stroke-width="10"/>`,
        // фонарь
        `<g transform="rotate(${sw} 760 760)"><line x1="760" y1="760" x2="760" y2="930" stroke="#2a2018" stroke-width="5"/>${glow(760, 990, 330, '#ffb050', 0.75)}<rect x="725" y="930" width="70" height="110" rx="12" fill="${V('#ffe2a0', 0.2, 0.2)}" stroke="#2a2018" stroke-width="8"/></g>`,
        glow(560, 1240, 420, '#ffb050', 0.25 + 0.04 * wave(t, 1.7)),
        leaflet(560, 1240, 1.15, t),
        `<rect x="0" y="1760" width="1080" height="160" fill="${V('#4a3626', 0.05, 0.4)}"/>`,
        dust(t, 18, '#ffd9a0', 800, 1700),
      ],
    };
  },

  // 2. База на рассвете: Кинли и новый переводчик
  base(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -40, k) },
      els: [
        sky([[0, '#4f5f7a'], [0.45, '#c39a80'], [0.62, '#f6c48c'], [0.7, '#ffdcaa']], 1250),
        glow(780, 900, 520, '#fff0c8', 0.95), `<circle cx="780" cy="900" r="70" fill="#fff6dc"/>`,
        `<g filter="url(#blur8)">${Array.from({ length: 14 }, () => `<ellipse cx="${(rnd() * 1080 + t * 8) % 1200}" cy="${150 + rnd() * 600}" rx="${150 + rnd() * 200}" ry="${16 + rnd() * 26}" fill="#e4a88a" opacity="0.45"/>`).join('')}</g>`,
        mtn('0,1000 L120,860 L260,930 L420,780 L560,900 L700,820 L860,940 L1000,850 L1080,900 L1080,1100 L0,1100 Z', '#c7977c', 0.85),
        mtn('0,1060 L180,960 L340,1020 L520,930 L680,1010 L880,950 L1080,1020 L1080,1150 L0,1150 Z', '#a87a62', 0.95),
        heli(lerp(560, 860, t / T), 760 - 20 * k, 1, t),
        hesco(1020),
        ground(1120, '#c8a272', 0.1, 0.35),
        mrap(-150, 1130, 0.85),
        `<rect x="930" y="640" width="12" height="440" fill="#3a3834"/><rect x="895" y="620" width="82" height="34" rx="6" fill="#3a3834"/>`, glow(936, 660, 90, '#fff2cc', 0.6),
        glow(540, 1650, 520, '#ffcf90', 0.25),
        `<ellipse cx="560" cy="1720" rx="420" ry="34" fill="#000" opacity="0.15"/>`,
        person(330, 1730, 1.0, { ...KIN, arms: 'rifle', look: 1, blink: blink(t) }),
        person(lerp(840, 770, ease(t / (T * 0.5))), 1700, 0.97, { ...AHM, look: -1, step: wave(t, 1.2) * (t < T * 0.5 ? 1 : 0), blink: blink(t, 1.5) }),
        `<rect width="1080" height="950" fill="${grad([[0, '#000', 0.6], [0.6, '#000', 0.25], [1, '#000', 0]])}"/>`,
        dust(t, 30, '#fff1d0', 700, 1700),
      ],
    };
  },

  // 3. Спор при всех: крупно, Ахмед жестикулирует, Кинли хмурится
  argue(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.05, 1.18, k), x: lerp(20, -20, k), y: -60 },
      els: [
        sky([[0, '#8fb0c8'], [0.6, '#e8d8b8'], [1, '#e8d0a8']], 1200),
        mtn('0,980 L160,820 L330,900 L520,760 L700,880 L900,800 L1080,880 L1080,1100 L0,1100 Z', '#bfa58a', 0.9),
        ground(1080, '#d2b07c', 0.12, 0.35),
        mrap(500, 1180, 0.9, '#9c8664'),
        // солдаты на заднем плане переглядываются
        person(210, 1240, 0.45, { ...KIN, helmet: '#6e6450', vest: '#5d5842', look: 1 }),
        person(880, 1250, 0.45, { ...KIN, helmet: '#6e6450', shirt: '#7e7058', look: -1 }),
        `<ellipse cx="540" cy="1860" rx="480" ry="40" fill="#000" opacity="0.15"/>`,
        person(290, 1900, 1.25, { ...KIN, frown: lerp(0.1, 0.55, k), look: 1, blink: blink(t, 0.6) }),
        person(800, 1900, 1.25, { ...AHM, arms: 'point', look: -1, frown: 0.5, nod: wave(t, 1.6), blink: blink(t, 2.1) }),
        `<rect width="1080" height="950" fill="${grad([[0, '#000', 0.6], [0.6, '#000', 0.25], [1, '#000', 0]])}"/>`,
        dust(t, 20, '#fff6e0', 600, 1700),
      ],
    };
  },

  // 4. Блокпост на горной дороге: Ахмед поднимает руку и останавливает колонну
  checkpoint(t, T) {
    const k = ease(t / T);
    const stop = clamp((t - 0.6) / 0.8);
    const glint = clamp(1 - Math.abs(t - T * 0.7) * 3);
    return {
      cam: { z: lerp(1.0, 1.25, k), x: lerp(0, 160, k), y: lerp(0, 60, k) },
      els: [
        sky([[0, '#7fa6c8'], [0.7, '#f0e2c0']], 1100),
        glow(900, 260, 300, '#fffbe8', 0.9),
        mtn('0,900 L180,620 L330,760 L520,560 L700,780 L880,600 L1080,720 L1080,1100 L0,1100 Z', '#a88a6a'),
        mtn('0,1000 L240,860 L460,960 L720,880 L1080,980 L1080,1150 L0,1150 Z', '#8c6e52'),
        ground(1080, '#c4a070', 0.12, 0.35),
        // дорога, уходящая вдаль
        `<path d="M380,1920 L520,1090 L600,1090 L900,1920 Z" fill="${V('#a88a62', 0.05, 0.2)}"/>`,
        `<path d="M560,1095 L590,1300 M600,1400 L630,1600 M650,1700 L680,1920" stroke="#e8d8b0" stroke-width="8" opacity="0.5"/>`,
        // подозрительный пикап и люди у обочины
        pickup(720, 1140, 0.45, '#6a6458'),
        `<g fill="#3a3028"><rect x="790" y="1080" width="14" height="44" rx="6"/><circle cx="797" cy="1072" r="9"/><rect x="820" y="1084" width="14" height="40" rx="6"/><circle cx="827" cy="1076" r="9"/></g>`,
        glow(808, 1100, 40, '#ffffff', glint * 0.9),
        // колонна
        mrap(330, 1360 + 10 * (1 - stop) * wave(t, 2), 0.42, '#9c8664'),
        mrap(150, 1560, 0.6, '#9c8664'),
        `<ellipse cx="760" cy="1850" rx="260" ry="30" fill="#000" opacity="0.18"/>`,
        person(760, 1840, 1.05, { ...AHM, arms: stop > 0.3 ? 'raise' : 'down', look: -0.6, lookUp: 0.3, frown: 0.6, blink: blink(t, 0.9) }),
        `<rect width="1080" height="950" fill="${grad([[0, '#000', 0.6], [0.6, '#000', 0.25], [1, '#000', 0]])}"/>`,
        dust(t, 25, '#fff1d0', 900, 1700),
      ],
    };
  },

  // 5. Засада: ущелье в сумерках, горящая машина, вспышки на склонах
  ambush(t, T) {
    const k = ease(t / T);
    const flashes = [[160, 820], [300, 760], [880, 800], [960, 880], [720, 720], [420, 860]].map(([x, y], i) => {
      const on = ((t * 2.3 + i * 0.37) % 1) < 0.12;
      return on ? glow(x, y, 70, '#fff0b0', 1) + `<circle cx="${x}" cy="${y}" r="9" fill="#fffbe0"/>` : '';
    }).join('');
    return {
      cam: { z: lerp(1.25, 1.0, k), y: lerp(-60, 0, k) },
      els: [
        sky([[0, '#2a2438'], [0.5, '#6a3a3a'], [0.8, '#c06a3a']], 1100),
        `<path d="M0,0 L0,1300 L120,1100 L180,900 L260,760 L340,700 L300,500 L380,300 L320,0 Z" fill="${V('#3a2a26', 0.1, 0.3)}"/>`,
        `<path d="M1080,0 L1080,1300 L960,1120 L900,920 L820,780 L760,700 L800,480 L720,280 L780,0 Z" fill="${V('#3a2a26', 0.1, 0.3)}"/>`,
        flashes,
        ground(1150, '#5a443a', 0.1, 0.5),
        rocks([[150, 1500, 260, 160], [960, 1560, 280, 180], [300, 1820, 300, 140]], '#4a3a34'),
        smoke(540, 1080, 1.1, t, 8),
        `<g filter="url(#soft)" transform="translate(300 1420) rotate(6)"><rect x="0" y="-220" width="520" height="220" rx="26" fill="${V('#6a5644', 0.1, 0.35)}" stroke="#ff8a3a" stroke-width="5"/><rect x="60" y="-350" width="330" height="150" rx="22" fill="${V('#5a4836', 0.1, 0.3)}" stroke="#ff8a3a" stroke-width="5"/><rect x="100" y="-320" width="240" height="70" rx="8" fill="#1a1410"/><rect x="200" y="-400" width="70" height="50" rx="8" fill="#2a221a"/><circle cx="100" cy="0" r="80" fill="#141210"/><circle cx="420" cy="0" r="80" fill="#141210"/></g>`,
        flame(520, 1120, 1.2, t), flame(420, 1150, 0.7, t, 1.3), flame(650, 1140, 0.8, t, 2.4),
        glow(560, 1300, 700, '#ff7a2a', 0.18 + 0.05 * wave(t, 3.1)),
        dust(t, 30, '#ffb070', 900, 1700),
      ],
    };
  },

  // 6. Ночь среди скал: Кинли ранен, Ахмед пригнулся, на гребне огни погони
  'night-rocks'(t, T) {
    const k = ease(t / T), dx = -40 * (t / T);
    return {
      cam: { z: lerp(1.0, 1.15, k), y: lerp(0, -50, k) },
      els: [
        nightSky(t, 820, 300),
        mtn('0,900 L160,700 L320,800 L480,640 L640,820 L840,660 L1080,780 L1080,1100 L0,1100 Z', '#1d2438'),
        mtn('0,1040 L220,980 L460,1000 L700,950 L900,990 L1080,960 L1080,1200 L0,1200 Z', '#141a28'),
        torches([[260 + dx, 990], [330 + dx, 986], [420 + dx, 992], [640 + dx, 960], [700 + dx, 965]], t),
        ground(1150, '#3a3c48', 0.1, 0.5),
        rocks([[180, 1500, 380, 300], [880, 1460, 420, 340]], '#4a4c58'),
        `<ellipse cx="560" cy="1660" rx="360" ry="34" fill="#000" opacity="0.3"/>`,
        // Кинли лежит, голова слева
        `<g transform="translate(110 -40)">${person(560, 1640, 0.85, { ...KIN, helmet: null, vest: '#6b6448', closed: true, bandage: true, rot: -90 })}</g>`,
        person(830, 1780, 0.95, { ...AHM, pose: 'crouch', look: -0.4, lookUp: 1, frown: 0.6, blink: blink(t, 1.1) }),
        `<rect width="1080" height="1920" fill="#2a3a70" opacity="0.15"/>`,
      ],
    };
  },

  // 7. Он не бросает: Ахмед тянет тележку с Кинли через перевал
  cart(t, T) {
    const k = ease(t / T), walk = wave(t, 1.1);
    const pause = clamp((t - T * 0.45) / (T * 0.1));
    return {
      cam: { z: lerp(1.2, 1.0, k), y: lerp(-60, 0, k) },
      els: [
        nightSky(t),
        mtn('0,900 L160,640 L300,760 L470,560 L640,780 L820,600 L1000,760 L1080,700 L1080,1100 L0,1100 Z', '#232b42'),
        `<path d="M470,560 L520,620 L490,640 L455,600 Z M820,600 L870,660 L835,670 L800,640 Z" fill="#8a96b8" opacity="0.6"/>`,
        `<rect y="860" width="1080" height="200" fill="#2a3654" opacity="0.45" filter="url(#blur20)"/>`,
        mtn('0,1060 L200,990 L420,1010 L640,960 L860,1000 L1080,970 L1080,1200 L0,1200 Z', '#161b2a'),
        torches([[160, 995], [230, 990], [300, 998], [520, 985], [600, 972]], t),
        `<path d="M0,1180 Q540,1120 1080,1170 L1080,1920 L0,1920 Z" fill="${V('#4a4c58', 0.1, 0.45)}"/>`,
        `<path d="M380,1180 Q520,1400 300,1920 L800,1920 Q620,1420 640,1180 Z" fill="#5a5c68" opacity="0.6"/>`,
        rocks([[140, 1530, 200, 110], [960, 1590, 220, 120], [190, 1840, 140, 80]], '#5d5b66'),
        cart(540, 1440 + 4 * walk * pause, 1, t * pause),
        `<ellipse cx="540" cy="1855" rx="230" ry="26" fill="#000" opacity="0.35"/>`,
        person(540, 1850 + Math.abs(walk) * 8 * pause, 0.92, { ...AHM, vest: null, arms: 'pull', step: walk * pause, frown: lerp(0.3, 0.6, pause), look: lerp(0.8, 0, pause), blink: blink(t, 0.4) }),
        `<rect width="1080" height="1920" fill="#2a3a70" opacity="0.15"/>`,
        glow(540, 1500, 600, '#ffb070', 0.06),
      ],
    };
  },

  // 8. Дом в Америке: ночь, Кинли не спит на кухне
  home(t, T) {
    const k = ease(t / T);
    const steam = Array.from({ length: 4 }, (_, i) => { const q = (t * 0.4 + i / 4) % 1; return `<circle cx="${700 + Math.sin(q * 6 + i) * 12}" cy="${1430 - q * 160}" r="${10 + q * 18}" fill="#fff" opacity="${0.25 * (1 - q)}"/>`; }).join('');
    return {
      cam: { z: lerp(1.0, 1.2, k), y: lerp(0, -70, k) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#3a3046', 0.05, 0.4)}"/>`,
        // окно: ночь, газон, забор
        `<rect x="140" y="520" width="520" height="560" fill="${grad([[0, '#0d1528'], [0.7, '#22324e'], [1, '#2c4a3a']])}"/>`,
        `<g opacity="0.9">${stars(30, 200, t).replace(/cy="(\d+(\.\d+)?)"/g, (m, v) => `cy="${540 + +v}"`).replace(/cx="(\d+(\.\d+)?)"/g, (m, v) => `cx="${150 + (+v) * 0.46}"`)}</g>`,
        `<path d="M140,980 h520" stroke="#e8e0d0" stroke-width="6" opacity="0.4"/><g fill="#d8d0c0" opacity="0.35">${Array.from({ length: 12 }, (_, i) => `<rect x="${150 + i * 42}" y="950" width="18" height="70"/>`).join('')}</g>`,
        `<rect x="130" y="510" width="540" height="580" fill="none" stroke="#e8dcc8" stroke-width="22"/><path d="M400,510 V1090 M130,800 H670" stroke="#e8dcc8" stroke-width="14"/>`,
        // лампа над столом
        `<line x1="700" y1="0" x2="700" y2="760" stroke="#1a1410" stroke-width="5"/>`, glow(700, 900, 620, '#ffcf80', 0.55),
        `<path d="M600,760 L800,760 L760,700 L640,700 Z" fill="${V('#c88a3a', 0.3, 0.2)}"/>`,
        // часы
        `<circle cx="900" cy="520" r="70" fill="#f0e8d8"/><circle cx="900" cy="520" r="70" fill="none" stroke="#3a2a20" stroke-width="10"/><line x1="900" y1="520" x2="900" y2="472" stroke="#222" stroke-width="7"/><line x1="900" y1="520" x2="${900 + 40 * Math.sin(1.3 + t * 0.05)}" y2="${520 - 40 * Math.cos(1.3 + t * 0.05)}" stroke="#222" stroke-width="5"/>`,
        person(560, 1500, 1.05, { ...KIN, helmet: null, vest: null, shirt: '#5d6a7a', pose: 'sit', arms: 'table', look: -0.3, lookUp: 0.2, frown: 0.35, squint: false, blink: blink(t, 2.2) }),
        // стол
        `<rect x="40" y="1430" width="1000" height="40" rx="8" fill="${V('#7a5236', 0.2, 0.2)}"/><rect x="60" y="1470" width="960" height="460" fill="${V('#5a3a26', 0.05, 0.4)}"/>`,
        `<rect x="670" y="1370" width="60" height="64" rx="10" fill="${V('#e8e0d0', 0.1, 0.2)}"/><path d="M730,1385 q30,0 30,20 q0,20 -30,20" stroke="#e8e0d0" stroke-width="8" fill="none"/>`, steam,
        glow(560, 1300, 500, '#ffcf80', 0.15),
      ],
    };
  },

  // 9. Звонки в ведомства: телефон у уха, бумаги, ответа нет
  phone(t, T) {
    const k = ease(t / T);
    const dots = [0, 1, 2].map(i => `<circle cx="${850 + i * 34}" cy="760" r="11" fill="#fff" opacity="${0.25 + 0.75 * (Math.floor(t * 3) % 3 === i ? 1 : 0)}"/>`).join('');
    return {
      cam: { z: lerp(1.05, 1.25, k), x: lerp(0, -40, k), y: -40 },
      els: [
        `<rect width="1080" height="1920" fill="${V('#26283a', 0.05, 0.4)}"/>`,
        glow(300, 1250, 650, '#7aa0ff', 0.25),
        `<rect x="740" y="500" width="300" height="420" rx="12" fill="${V('#2e3248', 0.1, 0.2)}"/><rect x="760" y="520" width="260" height="380" fill="#1c2034"/>`,
        `<g opacity="0.85"><rect x="790" y="560" width="200" height="22" rx="6" fill="#3d4566"/><rect x="790" y="600" width="150" height="22" rx="6" fill="#3d4566"/></g>`, dots,
        person(480, 1600, 1.15, { ...KIN, helmet: null, vest: null, shirt: '#4a5260', pose: 'sit', arms: 'phone', look: 0.5, lookUp: -0.3, frown: lerp(0.2, 0.6, k), squint: false, blink: blink(t, 0.3) }),
        `<rect x="0" y="1500" width="1080" height="60" fill="${V('#5a4030', 0.2, 0.2)}"/><rect x="0" y="1560" width="1080" height="400" fill="${V('#3a2a20', 0.05, 0.4)}"/>`,
        `<g transform="rotate(-6 250 1480)"><rect x="120" y="1430" width="260" height="90" fill="#efe8d8"/><path d="M140,1455 h200 M140,1480 h160" stroke="#9a9080" stroke-width="6"/></g><g transform="rotate(5 760 1480)"><rect x="640" y="1440" width="260" height="80" fill="#e6dfcd"/><path d="M660,1465 h180 M660,1490 h140" stroke="#9a9080" stroke-width="6"/><circle cx="860" cy="1490" r="22" fill="none" stroke="#a3302a" stroke-width="6" opacity="0.8"/></g>`,
      ],
    };
  },

  // 10. Укрытие: Ахмед у окна, жена с младенцем, по улице ползут фары
  hideout(t, T) {
    const k = ease(t / T);
    const beam = lerp(-300, 1200, t / T);
    return {
      cam: { z: lerp(1.0, 1.15, k), y: lerp(0, -40, k) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#3a2c22', 0.05, 0.45)}"/>`,
        // окно с решёткой, на улице проезжает пикап
        `<rect x="560" y="560" width="380" height="460" fill="${grad([[0, '#0b1020'], [1, '#1e2638']])}"/>`,
        `<g clip-path="url(#win)">${pickup(lerp(1100, 380, t / T), 980, 0.55, '#3a3a36', true)}${glow(lerp(1100, 380, t / T) + 90, 940, 160, '#fff2c0', 0.7)}</g>`,
        `<path d="M560,560 h380 v460 h-380 Z M686,560 V1020 M812,560 V1020 M560,713 H940 M560,866 H940" stroke="#1a120c" stroke-width="16" fill="none"/>`,
        // луч фар по стене
        `<g filter="url(#blur20)"><path d="M${beam},500 L${beam + 220},500 L${beam + 120},1500 L${beam - 140},1500 Z" fill="#fff2c0" opacity="0.18"/></g>`,
        glow(180, 1300, 300, '#ffb050', 0.35 + 0.05 * wave(t, 1.9)),
        `<rect x="150" y="1300" width="60" height="80" rx="10" fill="${V('#ffe2a0', 0.2, 0.2)}"/>`,
        `<rect x="0" y="1600" width="1080" height="320" fill="${V('#2a1e16', 0.05, 0.4)}"/>`,
        // ковёр
        `<path d="M80,1700 L1000,1700 L1060,1900 L20,1900 Z" fill="${V('#6a2a24', 0.15, 0.3)}"/><path d="M120,1730 L960,1730 L1000,1870 L80,1870 Z" fill="none" stroke="#c89a50" stroke-width="8" opacity="0.6"/>`,
        person(330, 1760, 1.0, { robe: '#3a3a5a', shirt: '#3a3a5a', veil: '#5a4a6a', skin: '#c99068', beard: false, arms: 'hold', baby: true, look: 0.8, worried: true, frown: -0.2, squint: false, blink: blink(t, 0.7) }),
        person(760, 1780, 1.0, { ...AHM, vest: null, look: 0.2, lookUp: 0.5, frown: 0.6, blink: blink(t, 2.5) }),
      ],
      defsClip: true,
    };
  },

  // 11. Рассвет в прихожей: Кинли у двери, у ног собранная сумка
  door(t, T) {
    const k = ease(t / T);
    return {
      cam: { z: lerp(1.0, 1.22, k), y: lerp(0, -80, k) },
      els: [
        `<rect width="1080" height="1920" fill="${V('#4a3e3a', 0.05, 0.4)}"/>`,
        // дверь со стеклом
        `<rect x="560" y="420" width="400" height="1300" fill="${V('#6a4a32', 0.15, 0.3)}"/><rect x="620" y="480" width="280" height="420" fill="${grad([[0, '#ffd8a0'], [1, '#ffb070']])}"/>`,
        `<path d="M760,480 V900 M620,690 H900" stroke="#6a4a32" stroke-width="12"/><circle cx="600" cy="1100" r="18" fill="#c9a24a"/>`,
        // лучи рассвета
        `<g filter="url(#blur20)" opacity="${0.35 + 0.1 * wave(t, 0.4)}"><path d="M620,480 L900,480 L560,1800 L-100,1800 Z" fill="#ffd8a0"/></g>`,
        glow(760, 690, 420, '#ffd8a0', 0.5),
        `<rect x="0" y="1700" width="1080" height="220" fill="${V('#3a2a22', 0.05, 0.4)}"/>`,
        // вешалка с курткой
        `<rect x="120" y="560" width="16" height="400" fill="#2a1e16"/><path d="M90,700 Q130,640 170,700 L190,980 L70,980 Z" fill="${V('#6b6448', 0.2, 0.3)}"/>`,
        `<ellipse cx="420" cy="1830" rx="300" ry="30" fill="#000" opacity="0.2"/>`,
        person(400, 1820, 1.05, { ...KIN, helmet: null, vest: null, shirt: '#6b6448', look: 0.9, frown: 0.35, squint: true, blink: blink(t, 1.7) }),
        // военная сумка
        `<g filter="url(#soft)"><rect x="560" y="1660" width="340" height="170" rx="80" fill="${V('#6b6448', 0.2, 0.3)}"/><path d="M600,1690 Q730,1580 860,1690" stroke="#3a3628" stroke-width="16" fill="none"/><rect x="700" y="1680" width="60" height="140" fill="#5a5440"/></g>`,
      ],
    };
  },

  // 12. Гай Ричи без шуток: вертолёт над ущельем на закате → колонна в пыли
  helicopter(t, T) {
    const half = T * 0.48, B = t > half;
    const k = ease(B ? (t - half) / (T - half) : t / half);
    if (!B) return {
      cam: { z: lerp(1.15, 1.0, k) },
      els: [
        sky([[0, '#3a2a44'], [0.45, '#c05a3a'], [0.7, '#ffb060']], 1300),
        glow(540, 1000, 500, '#ffd080', 0.9),
        `<path d="M0,0 L0,1920 L260,1920 L200,1500 L300,1200 L240,900 L330,600 L280,300 L360,0 Z" fill="${V('#3a2224', 0.05, 0.3)}"/>`,
        `<path d="M1080,0 L1080,1920 L820,1920 L880,1500 L780,1250 L860,900 L760,620 L830,300 L740,0 Z" fill="${V('#3a2224', 0.05, 0.3)}"/>`,
        mtn('260,1300 L400,1150 L540,1250 L680,1120 L820,1300 L820,1920 L260,1920 Z', '#5a3030'),
        `<path d="M480,1920 Q560,1600 520,1300" stroke="#c08060" stroke-width="30" fill="none" opacity="0.5"/>`,
        heli(lerp(-100, 1180, t / half), lerp(1100, 950, k), 1.6, t, '#1a1414', -10),
      ],
    };
    return {
      cam: { z: lerp(1.0, 1.15, k), x: lerp(0, -60, k) },
      els: [
        sky([[0, '#4a3048'], [0.55, '#d06a3a'], [0.8, '#ffb060']], 1200),
        glow(800, 1000, 380, '#ffe0a0', 0.9), `<circle cx="800" cy="1000" r="80" fill="#fff0c8"/>`,
        mtn('0,1060 L200,980 L420,1040 L640,960 L880,1030 L1080,980 L1080,1200 L0,1200 Z', '#6a3a30'),
        ground(1100, '#9a5a3a', 0.1, 0.45),
        `<path d="M1080,1150 L700,1150 L-200,1920 L1080,1920 Z" fill="#7a4a30" opacity="0.5"/>`,
        smoke(900, 1200, 1.2, t, 9, '#c88a5a'),
        `<g filter="${silFilter('#1a1210')}">${mrap(lerp(880, 820, k), 1210, 0.3)}${mrap(lerp(640, 560, k), 1330, 0.45)}${mrap(lerp(300, 200, k), 1560, 0.7)}</g>`,
        dust(t, 40, '#ffc890', 1100, 1800),
      ],
    };
  },

  // 13. Финал: силуэты Кинли и Ахмеда на гребне против рассвета → общий план
  ridge(t, T) {
    const half = T * 0.5, B = t > half;
    const k = ease(B ? (t - half) / (T - half) : t / half);
    const sil = silFilter('#120e14');
    const sunY = lerp(1120, 1020, t / T);
    const bg = [
      sky([[0, '#2a3050'], [0.5, '#c87a6a'], [0.75, '#ffc890']], 1500),
      glow(540, sunY, 600, '#ffe2a0', 0.95), `<circle cx="540" cy="${sunY}" r="95" fill="#fff4d8"/>`,
      `<g filter="url(#blur8)" opacity="0.8">${Array.from({ length: 10 }, () => `<ellipse cx="${(rnd() * 1200 + t * 10) % 1300 - 100}" cy="${1150 + rnd() * 250}" rx="${200 + rnd() * 200}" ry="${30 + rnd() * 30}" fill="#f6d8c8"/>`).join('')}</g>`,
    ];
    if (!B) return {
      cam: { z: lerp(1.1, 1.0, k) },
      els: [...bg,
        `<path d="M0,1560 Q300,1500 540,1520 Q800,1500 1080,1560 L1080,1920 L0,1920 Z" fill="#120e14"/>`,
        person(400, 1580, 1.0, { ...KIN, sil }), person(690, 1580, 1.0, { ...AHM, sil }),
      ],
    };
    return {
      cam: { z: lerp(1.0, 0.95, k) },
      els: [...bg,
        `<path d="M0,1500 L300,1380 L540,1330 L780,1390 L1080,1500 L1080,1920 L0,1920 Z" fill="#120e14"/>`,
        person(505, 1340, 0.28, { ...KIN, sil }), person(580, 1340, 0.28, { ...AHM, sil }),
      ],
    };
  },
};

// окно в «hideout» обрезает проезжающую машину
def(`<clipPath id="win"><rect x="560" y="560" width="380" height="460"/></clipPath>`);
const origHide = shots.hideout;
shots.hideout = (t, T) => { def(`<clipPath id="win"><rect x="560" y="560" width="380" height="460"/></clipPath>`); return origHide(t, T); };

run(shots);
