// «Капитан» (Der Hauptmann, 2017) — 8 сцен в 2D-векторе. Имя плана = set сцены в videos/the-captain/script.json.
// Апрель 1945, Эмсланд (север Германии): торфяные болота со штабелями торфа, еловые опушки, фахверковые фермы,
// ветряная мельница, телеграфные столбы, колеи с лужами. Холодный серый свет, редкие тёплые пятна.
import { run, person, setProportions, V, R, grad, glow, silFilter, smoke, rnd, reseed, shade, lerp, ease, clamp, wave, def } from './core.js';

// пропорции как в «Жизнь прекрасна» / «Ирландце»
const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// Вилли-беглец: грязная шинель; Вилли-капитан: китель люфтваффе (велик — рукава до пальцев)
const WILLI_RAGS = { robe: '#5b5c4a', shirt: '#5b5c4a', skin: '#d8aa8a', hair: '#8a6a44', iris: '#4a5a6a', beard: false, frown: 0.5, worried: true, coat: true };
const WILLI_RUN = { shirt: '#5b5c4a', pants: '#45463a', skin: '#d8aa8a', hair: '#8a6a44', iris: '#4a5a6a', beard: false, frown: 0.6, worried: true, coatShort: true };
const WILLI_CAPT = { shirt: '#66717f', pants: '#525b68', skin: '#e6bc9c', hair: '#8a6a44', iris: '#4a5a6a', beard: false, frown: 0.15, hand: 0.5, slim: 0.8, tunic: true, tabs: '#c9a43a', boards: '#c8ccd0', holster: true, boots: true, officerCap: '#5e6878' };
const OFFICER = { shirt: '#6a6c5a', pants: '#585a4c', skin: '#e0b494', hair: '#3a2a1e', iris: '#3a3a3a', beard: false, frown: 0, tunic: true, tabs: '#d8d8d0', boards: '#b8bcc0', holster: true, boots: true, officerCap: '#686a5a' };
const SOLDIER = { shirt: '#6c6e5c', pants: '#5a5c4c', helmet: '#555a4c', skin: '#dcae8e', hair: '#3a2a1e', iris: '#3a3a3a', beard: false, frown: 0, tunic: true, kit: true, boots: true };

const blink = (t, ph = 0) => ((t + ph) % 3.7) < 0.13;
const sky = (stops, h = 1300) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const topShade = (h = 950, a = 0.6) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const shadow = (x, y, rx = 160, op = 0.3) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.12}" fill="#000" opacity="${op}"/>`;
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;

// ---------- персонажи ----------
function geo(x, y, s, o = {}) {
  const p = { ...PROPS, ...o };
  const hs = s * p.head, hr = 90 * hs;
  const pose = o.pose || 'stand';
  const legH = (pose === 'crouch' ? 90 : pose === 'sit' ? 0 : 210) * p.legs;
  const ty = y - legH * s, top = ty - 210 * s * p.torso;
  return { hs, hr, top, ty, headY: top - hr * 0.8 + (o.nod || 0) * 6 * hs, sl: p.slim ?? 1, pose };
}
// фуражка: тулья с «седлом», тёмный околыш, лакированный козырёк, серебряный шнур и кокарда
function officerCap(x, headY, hr, c = '#5e6878') {
  return `<path d="M${x - hr * 1.22},${headY - hr * 0.95} Q${x - hr * 1.38},${headY - hr * 1.58} ${x - hr * 0.2},${headY - hr * 1.66} Q${x + hr * 0.2},${headY - hr * 1.5} ${x + hr * 0.4},${headY - hr * 1.66} Q${x + hr * 1.38},${headY - hr * 1.58} ${x + hr * 1.22},${headY - hr * 0.95} Z" fill="${V(c, 0.22, 0.32)}"/>
  <path d="M${x - hr * 1.1},${headY - hr * 1.3} Q${x},${headY - hr * 1.45} ${x + hr * 1.1},${headY - hr * 1.3}" stroke="${shade(c, 0.25)}" stroke-width="${hr * 0.04}" fill="none" opacity="0.7"/>
  <rect x="${x - hr * 1.0}" y="${headY - hr * 1.02}" width="${hr * 2}" height="${hr * 0.34}" rx="${hr * 0.06}" fill="${V('#26282c', 0.15, 0.3)}"/>
  <path d="M${x - hr * 0.98},${headY - hr * 0.68} Q${x},${headY - hr * 0.36} ${x + hr * 0.98},${headY - hr * 0.68} Q${x},${headY - hr * 0.56} ${x - hr * 0.98},${headY - hr * 0.68} Z" fill="${V('#121316', 0.3, 0.2)}"/>
  <path d="M${x - hr * 0.6},${headY - hr * 0.6} Q${x},${headY - hr * 0.5} ${x + hr * 0.5},${headY - hr * 0.58}" stroke="#fff" stroke-width="${hr * 0.03}" fill="none" opacity="0.35"/>
  <path d="M${x - hr * 0.92},${headY - hr * 0.74} Q${x},${headY - hr * 0.62} ${x + hr * 0.92},${headY - hr * 0.74}" stroke="#d0d4d8" stroke-width="${hr * 0.05}" fill="none"/>
  <circle cx="${x - hr * 0.88}" cy="${headY - hr * 0.73}" r="${hr * 0.05}" fill="#e0e4e8"/><circle cx="${x + hr * 0.88}" cy="${headY - hr * 0.73}" r="${hr * 0.05}" fill="#e0e4e8"/>
  <path d="M${x - hr * 0.34},${headY - hr * 1.28} Q${x - hr * 0.15},${headY - hr * 1.2} ${x},${headY - hr * 1.32} Q${x + hr * 0.15},${headY - hr * 1.2} ${x + hr * 0.34},${headY - hr * 1.28} L${x + hr * 0.1},${headY - hr * 1.16} L${x - hr * 0.1},${headY - hr * 1.16} Z" fill="#d4d8dc"/>
  <circle cx="${x}" cy="${headY - hr * 0.86}" r="${hr * 0.09}" fill="#d4d8dc"/><circle cx="${x}" cy="${headY - hr * 0.86}" r="${hr * 0.045}" fill="#8a2a24"/>`;
}
// одежда поверх person(): китель (воротник, петлицы, пуговицы, 4 кармана, ремень, кобура), галифе, сапоги; шинель; снаряжение солдата
function dress(x, y, s, o) {
  const { hr, top, ty, headY, pose } = geo(x, y, s, o);
  const sh = o.shirt, dk = shade(sh, -0.28), lt = shade(sh, 0.18);
  let b = '', front = '';
  const stand = pose === 'stand';
  if (o.tunic) {
    if (stand) {
      b += [-1, 1].map((sd) => `<ellipse cx="${x + sd * 44 * s}" cy="${ty + 70 * s}" rx="${44 * s}" ry="${62 * s}" fill="${V(o.pants, 0.15, 0.2)}"/>`).join('');
      if (o.boots) b += [-1, 1].map((sd) => `<rect x="${x + sd * 36 * s - 31 * s}" y="${y - 175 * s}" width="${62 * s}" height="${168 * s}" rx="${14 * s}" fill="${V('#1c1c1e', 0.28, 0.2)}"/><rect x="${x + sd * 36 * s - 18 * s}" y="${y - 165 * s}" width="${8 * s}" height="${140 * s}" rx="${4 * s}" fill="#fff" opacity="0.18"/>`).join('');
    }
    // подол кителя
    b += `<path d="M${x - 100 * s},${ty - 40 * s} L${x - 108 * s},${ty + 46 * s} Q${x},${ty + 58 * s} ${x + 108 * s},${ty + 46 * s} L${x + 100 * s},${ty - 40 * s} Z" fill="${V(sh, 0.12, 0.25)}"/>`;
    // воротник и петлицы
    b += `<path d="M${x - 46 * s},${top - 4 * s} L${x},${top + 46 * s} L${x + 46 * s},${top - 4 * s} L${x + 40 * s},${top + 22 * s} L${x},${top + 62 * s} L${x - 40 * s},${top + 22 * s} Z" fill="${dk}"/>`;
    if (o.tabs) b += [-1, 1].map((sd) => `<path d="M${x + sd * 14 * s},${top + 26 * s} L${x + sd * 40 * s},${top + 4 * s} L${x + sd * 42 * s},${top + 20 * s} L${x + sd * 18 * s},${top + 40 * s} Z" fill="${o.tabs}"/>`).join('');
    // пуговицы
    for (let i = 0; i < 4; i++) b += `<circle cx="${x}" cy="${top + (70 + i * 34) * s}" r="${5.5 * s}" fill="#c8ccd0"/><circle cx="${x - 1.5 * s}" cy="${top + (68.5 + i * 34) * s}" r="${2 * s}" fill="#fff"/>`;
    // нагрудные и нижние карманы с клапанами
    const pocket = (cx, cy, w, h) => `<rect x="${cx - w / 2}" y="${cy}" width="${w}" height="${h}" rx="${5 * s}" fill="${V(sh, 0.18, 0.18)}" stroke="${dk}" stroke-width="${2.5 * s}"/><path d="M${cx - w / 2 - 3 * s},${cy - 2 * s} L${cx + w / 2 + 3 * s},${cy - 2 * s} L${cx + w / 2},${cy + 18 * s} Q${cx},${cy + 26 * s} ${cx - w / 2},${cy + 18 * s} Z" fill="${V(sh, 0.25, 0.15)}" stroke="${dk}" stroke-width="${2.5 * s}"/><circle cx="${cx}" cy="${cy + 14 * s}" r="${4 * s}" fill="#c8ccd0"/>`;
    b += pocket(x - 52 * s, top + 62 * s, 52 * s, 48 * s) + pocket(x + 52 * s, top + 62 * s, 52 * s, 48 * s);
    b += pocket(x - 56 * s, ty - 14 * s, 58 * s, 54 * s) + pocket(x + 56 * s, ty - 14 * s, 58 * s, 54 * s);
    // ремень, пряжка
    b += `<rect x="${x - 98 * s}" y="${ty - 44 * s}" width="${196 * s}" height="${22 * s}" fill="${V('#2a2620', 0.2, 0.2)}"/><rect x="${x - 15 * s}" y="${ty - 48 * s}" width="${30 * s}" height="${30 * s}" rx="${4 * s}" fill="${V('#b8bcc0', 0.3, 0.2)}"/>`;
    if (o.holster) b += `<path d="M${x + 58 * s},${ty - 26 * s} L${x + 96 * s},${ty - 26 * s} L${x + 92 * s},${ty + 34 * s} Q${x + 74 * s},${ty + 44 * s} ${x + 60 * s},${ty + 30 * s} Z" fill="${V('#4a3220', 0.25, 0.3)}"/><rect x="${x + 62 * s}" y="${ty - 22 * s}" width="${30 * s}" height="${14 * s}" rx="${4 * s}" fill="#3a2616"/>`;
    if (o.kit) {
      b += [-1, 1].map((sd) => [0, 1, 2].map((k) => `<rect x="${x + sd * (24 + k * 22) * s - 10 * s}" y="${ty - 40 * s}" width="${20 * s}" height="${30 * s}" rx="${4 * s}" fill="${V('#3a3428', 0.2, 0.3)}"/>`).join('')).join('');
      b += [-1, 1].map((sd) => `<path d="M${x + sd * 70 * s},${top + 8 * s} L${x + sd * 40 * s},${ty - 44 * s}" stroke="#2a2620" stroke-width="${9 * s}"/>`).join('');
      b += `<rect x="${x - 104 * s}" y="${ty - 20 * s}" width="${44 * s}" height="${56 * s}" rx="${8 * s}" fill="${V('#5a5a44', 0.2, 0.3)}"/>`;
    }
  }
  if (o.coat) {
    // шинель: лацканы, два ряда пуговиц, грязь на подоле, прорехи
    b += `<path d="M${x - 56 * s},${top - 6 * s} L${x},${top + 80 * s} L${x + 56 * s},${top - 6 * s} L${x + 72 * s},${top + 40 * s} L${x + 20 * s},${top + 110 * s} L${x},${top + 96 * s} L${x - 20 * s},${top + 110 * s} L${x - 72 * s},${top + 40 * s} Z" fill="${V(dk, 0.1, 0.2)}"/>`;
    for (let i = 0; i < 5; i++) b += [-1, 1].map((sd) => `<circle cx="${x + sd * 30 * s}" cy="${top + (126 + i * 44) * s}" r="${5 * s}" fill="#3a3a30"/>`).join('');
    b += `<path d="M${x},${top + 110 * s} L${x},${y - 10 * s}" stroke="${dk}" stroke-width="${3 * s}"/>`;
    reseed(5);
    for (let i = 0; i < 14; i++) b += `<ellipse cx="${x + (rnd() * 200 - 100) * s}" cy="${y - (10 + rnd() * 120) * s}" rx="${(8 + rnd() * 18) * s}" ry="${(5 + rnd() * 10) * s}" fill="#3a2c1c" opacity="${0.35 + rnd() * 0.3}"/>`;
    b += `<path d="M${x - 110 * s},${y} l${20 * s},${-26 * s} l${16 * s},${20 * s} l${22 * s},${-30 * s} l${14 * s},${28 * s}" fill="${shade(dk, -0.2)}"/>`;
    b += `<path d="M${x + 40 * s},${top + 200 * s} l${18 * s},${8 * s} l${-8 * s},${20 * s} l${-14 * s},${-6 * s} Z" fill="#2a281e"/>`;
  }
  if (o.coatShort) {
    b += `<path d="M${x - 46 * s},${top - 4 * s} L${x},${top + 60 * s} L${x + 46 * s},${top - 4 * s} L${x + 60 * s},${top + 30 * s} L${x},${top + 90 * s} L${x - 60 * s},${top + 30 * s} Z" fill="${dk}"/>`;
    for (let i = 0; i < 4; i++) b += `<circle cx="${x}" cy="${top + (100 + i * 32) * s}" r="${5 * s}" fill="#3a3a30"/>`;
    b += `<rect x="${x - 98 * s}" y="${ty - 40 * s}" width="${196 * s}" height="${18 * s}" fill="#2a2620"/>`;
    reseed(7);
    for (let i = 0; i < 10; i++) b += `<ellipse cx="${x + (rnd() * 180 - 90) * s}" cy="${ty + (rnd() * 180) * s}" rx="${(8 + rnd() * 14) * s}" ry="${(5 + rnd() * 8) * s}" fill="#3a2c1c" opacity="0.5"/>`;
  }
  if (o.boards) front += [-1, 1].map((sd) => `<rect x="${x + sd * 84 * s - 26 * s}" y="${top + 8 * s}" width="${52 * s}" height="${18 * s}" rx="${6 * s}" fill="${o.boards}" stroke="${shade(o.boards, -0.4)}" stroke-width="${2 * s}" transform="rotate(${sd * 12} ${x + sd * 84 * s} ${top + 17 * s})"/>`).join('');
  if (o.officerCap) front += officerCap(x, headY, hr, o.officerCap);
  if (o.breath) front += `<g filter="url(#blur8)">${[0, 1, 2].map((k) => { const f = (o.breath + k / 3) % 1; return `<ellipse cx="${x + (20 + f * 90) * s}" cy="${headY + hr * 0.6 - f * 30 * s}" rx="${(14 + f * 30) * s}" ry="${(10 + f * 16) * s}" fill="#eef2f2" opacity="${0.45 * (1 - f)}"/>`; }).join('')}</g>`;
  return { b, front };
}
// человек + одежда: китель/шинель кладутся между торсом и руками (o.overlay ядра), фуражка и пар — поверх головы
function man(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b });
  if (!front) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}${o.sil ? ` filter="${o.sil}"` : ''}>${front}</g>`;
}

// ---------- окружение ----------
function clouds(y, h, c1, c2, t = 0, n = 12) {
  reseed(31);
  def('<filter id="cl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="38"/></filter>');
  let g = '';
  for (let i = 0; i < n; i++) {
    const cx = ((rnd() * 1500 + t * (5 + rnd() * 6)) % 1500) - 210, cy = y + rnd() * h, rx = 320 + rnd() * 320, ry = 40 + rnd() * 50;
    g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c2}" opacity="0.45"/><ellipse cx="${cx - 30}" cy="${cy - ry * 0.5}" rx="${rx * 0.7}" ry="${ry * 0.45}" fill="${c1}" opacity="0.35"/>`;
  }
  return `<g filter="url(#cl)">${g}</g>`;
}
function spruce(x, y, h, c) {
  const w = h * 0.32;
  let g = `<rect x="${x - 3}" y="${y - h * 0.15}" width="6" height="${h * 0.15}" fill="${shade(c, -0.3)}"/>`;
  for (let i = 0; i < 6; i++) { const yy = y - h * 0.1 - i * h * 0.15, ww = w * (1 - i * 0.14); g += `<path d="M${x - ww},${yy} Q${x - ww * 0.4},${yy - h * 0.06} ${x},${yy - h * 0.28} Q${x + ww * 0.4},${yy - h * 0.06} ${x + ww},${yy} Q${x},${yy - h * 0.04} ${x - ww},${yy} Z" fill="${c}"/>`; }
  return g;
}
function treeline(y, c, x0 = -40, x1 = 1120, hmin = 80, hmax = 170, sd = 3) {
  reseed(sd);
  let g = `<rect x="${x0}" y="${y - 20}" width="${x1 - x0}" height="40" fill="${c}"/>`;
  for (let x = x0; x < x1; x += 22 + rnd() * 26) g += spruce(x, y + 4, hmin + rnd() * (hmax - hmin), c);
  return g;
}
// фахверковый дом торцом: красный кирпич, тёмные балки, крутая крыша, ворота-арка
function farmhouse(x, y, w, h, o = {}) {
  const wall = o.wall || '#7e4a3a', beam = o.beam || '#2a201a', roof = o.roof || '#3a2c28', rh = h * 1.1;
  let g = `<path d="M${x - 14},${y - h} L${x + w / 2},${y - h - rh} L${x + w + 14},${y - h} Z" fill="${V(roof, 0.12, 0.3)}"/>`;
  g += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${V(wall, 0.1, 0.25)}"/>`;
  g += `<path d="M${x + 12},${y - h} L${x + w / 2},${y - h - rh + 30} L${x + w - 12},${y - h} Z" fill="${V(wall, 0.12, 0.2)}"/>`;
  // балки
  const cols = 6;
  for (let i = 0; i <= cols; i++) g += `<rect x="${x + (i * w) / cols - 5}" y="${y - h}" width="10" height="${h}" fill="${beam}"/>`;
  g += `<rect x="${x}" y="${y - h - 6}" width="${w}" height="12" fill="${beam}"/><rect x="${x}" y="${y - h * 0.5}" width="${w}" height="10" fill="${beam}"/>`;
  for (let i = 0; i < cols; i += 2) g += `<path d="M${x + (i * w) / cols},${y - h * 0.5} L${x + ((i + 1) * w) / cols},${y - h}" stroke="${beam}" stroke-width="8"/>`;
  g += `<path d="M${x + w / 2},${y - h - rh + 30} L${x + w / 2},${y - h}" stroke="${beam}" stroke-width="10"/><path d="M${x + w * 0.2},${y - h} L${x + w / 2},${y - h - rh * 0.55}" stroke="${beam}" stroke-width="8"/><path d="M${x + w * 0.8},${y - h} L${x + w / 2},${y - h - rh * 0.55}" stroke="${beam}" stroke-width="8"/>`;
  // ворота и окна
  g += `<path d="M${x + w * 0.36},${y} L${x + w * 0.36},${y - h * 0.38} Q${x + w / 2},${y - h * 0.52} ${x + w * 0.64},${y - h * 0.38} L${x + w * 0.64},${y} Z" fill="${V('#3a2a1e', 0.15, 0.3)}"/><path d="M${x + w / 2},${y} L${x + w / 2},${y - h * 0.45}" stroke="#1e160f" stroke-width="4"/>`;
  [0.14, 0.78].forEach((f) => { const wx = x + w * f, wy = y - h * 0.82; g += `<rect x="${wx}" y="${wy}" width="${w * 0.1}" height="${h * 0.2}" fill="${o.lit ? '#ffcf7a' : '#1e2428'}" stroke="#e8e2d4" stroke-width="4"/><path d="M${wx + w * 0.05},${wy} L${wx + w * 0.05},${wy + h * 0.2} M${wx},${wy + h * 0.1} L${wx + w * 0.1},${wy + h * 0.1}" stroke="#e8e2d4" stroke-width="3"/>`; if (o.lit) g += glow(wx + w * 0.05, wy + h * 0.1, 70, '#ffb050', 0.5); });
  // коньковые «лошадиные головы»
  g += `<path d="M${x + w / 2},${y - h - rh} l-26,-30 m26,30 l26,-30" stroke="${beam}" stroke-width="7"/>`;
  if (o.burnt) g += `<path d="M${x + w * 0.3},${y - h - rh * 0.5} L${x + w * 0.45},${y - h - rh * 0.8} L${x + w * 0.62},${y - h - rh * 0.45} Z" fill="#0e0c0a"/>`;
  return `<g filter="url(#soft)">${g}</g>`;
}
function windmill(x, y, s, ang, c = '#2e2a26') {
  let g = `<path d="M${x - 70 * s},${y} L${x - 40 * s},${y - 330 * s} L${x + 40 * s},${y - 330 * s} L${x + 70 * s},${y} Z" fill="${V(c, 0.15, 0.25)}"/><path d="M${x - 50 * s},${y - 330 * s} Q${x},${y - 400 * s} ${x + 50 * s},${y - 330 * s} Z" fill="${shade(c, -0.15)}"/>`;
  g += `<rect x="${x - 16 * s}" y="${y - 120 * s}" width="${32 * s}" height="${60 * s}" fill="#14110e"/><rect x="${x - 90 * s}" y="${y - 150 * s}" width="${180 * s}" height="10" fill="${shade(c, -0.2)}"/>`;
  const hx = x, hy = y - 345 * s;
  for (let i = 0; i < 4; i++) {
    const a = ang + (i * Math.PI) / 2, ex = hx + Math.cos(a) * 260 * s, ey = hy + Math.sin(a) * 260 * s;
    const nx = -Math.sin(a) * 34 * s, ny = Math.cos(a) * 34 * s;
    g += `<path d="M${hx},${hy} L${ex},${ey}" stroke="${shade(c, -0.2)}" stroke-width="${7 * s}"/><path d="M${hx + Math.cos(a) * 50 * s},${hy + Math.sin(a) * 50 * s} L${ex},${ey} L${ex + nx},${ey + ny} L${hx + Math.cos(a) * 50 * s + nx},${hy + Math.sin(a) * 50 * s + ny} Z" fill="none" stroke="${shade(c, 0.1)}" stroke-width="${3 * s}"/>`;
    for (let k = 1; k < 6; k++) { const f = 0.2 + k * 0.15; g += `<path d="M${hx + Math.cos(a) * 260 * s * f},${hy + Math.sin(a) * 260 * s * f} l${nx},${ny}" stroke="${shade(c, 0.1)}" stroke-width="${2 * s}"/>`; }
  }
  return g + `<circle cx="${hx}" cy="${hy}" r="${12 * s}" fill="#14110e"/>`;
}
// телеграфные столбы в перспективу и провода
function poles(list, c = '#2a2622') {
  let g = '';
  list.forEach(([x, y, h], i) => {
    g += `<rect x="${x - h * 0.012}" y="${y - h}" width="${h * 0.024}" height="${h}" fill="${c}"/><rect x="${x - h * 0.12}" y="${y - h * 0.94}" width="${h * 0.24}" height="${h * 0.018}" fill="${c}"/>`;
    const n = list[i + 1];
    if (n) [-0.1, 0, 0.1].forEach((f) => { const x1 = x + h * f, y1 = y - h * 0.94, x2 = n[0] + n[2] * f, y2 = n[1] - n[2] * 0.94; g += `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 + Math.abs(x2 - x1) * 0.08} ${x2},${y2}" stroke="${c}" stroke-width="1.6" fill="none" opacity="0.8"/>`; });
  });
  return g;
}
// штабеля торфа на сушке
function peat(x, y, n, s = 1, c = '#3a2a1e') {
  let g = '';
  for (let i = 0; i < n; i++) { const px = x + i * 70 * s; g += `<path d="M${px - 30 * s},${y} L${px - 18 * s},${y - 46 * s} L${px + 18 * s},${y - 46 * s} L${px + 30 * s},${y} Z" fill="${V(c, 0.18, 0.25)}"/><path d="M${px - 24 * s},${y - 22 * s} L${px + 24 * s},${y - 22 * s}" stroke="${shade(c, -0.3)}" stroke-width="${2 * s}"/>`; }
  return g;
}
function puddle(x, y, rx, ry, skyTop, skyBot, op = 0.85) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx + 6}" ry="${ry + 3}" fill="#2a2418" opacity="0.6"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${grad([[0, skyBot], [1, skyTop]])}" opacity="${op}"/><ellipse cx="${x - rx * 0.3}" cy="${y - ry * 0.3}" rx="${rx * 0.4}" ry="${ry * 0.15}" fill="#fff" opacity="0.18"/>`;
}
function ruts(vx, vy, yb, w, c = '#2e281c') {
  return [-1, 1].map((sd) => `<path d="M${vx + sd * 8},${vy} L${540 + sd * w - 28},${yb} L${540 + sd * w + 28},${yb} L${vx + sd * 12},${vy} Z" fill="${c}" opacity="0.55"/>`).join('');
}
function tufts(y0, y1, n, c = '#8a8462', sd = 9) {
  reseed(sd);
  let g = '';
  for (let i = 0; i < n; i++) { const x = rnd() * 1080, y = y0 + rnd() * (y1 - y0), k = 0.4 + ((y - y0) / (y1 - y0)) * 0.9; for (let j = -2; j <= 2; j++) g += `<path d="M${x},${y} q${j * 5 * k},${-14 * k} ${j * 9 * k},${-(24 + rnd() * 14) * k}" stroke="${c}" stroke-width="${2.4 * k}" fill="none"/>`; }
  return g;
}
function crows(t, list) {
  return list.map(([x, y, sp, s], i) => { const f = wave(t, 2.2, i); const cx = x + t * sp, cy = y - t * 12; return `<path d="M${cx - 18 * s},${cy - f * 10 * s} Q${cx - 8 * s},${cy - 4 * s} ${cx},${cy + 2 * s} Q${cx + 8 * s},${cy - 4 * s} ${cx + 18 * s},${cy - f * 10 * s}" stroke="#141414" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>`; }).join('');
}
function rays(x, y, angs, len, c, op) {
  return `<g style="mix-blend-mode:screen">${angs.map((a, i) => { const r1 = (a - 3) * Math.PI / 180, r2 = (a + 3 + i % 2 * 2) * Math.PI / 180; return `<path d="M${x},${y} L${x + Math.cos(r1) * len},${y + Math.sin(r1) * len} L${x + Math.cos(r2) * len},${y + Math.sin(r2) * len} Z" fill="${grad([[0, c, op], [1, c, 0]])}"/>`; }).join('')}</g>`;
}
function mist(t, y, h, op = 0.35, c = '#dfe3e2') {
  let g = '';
  for (let i = 0; i < 5; i++) g += `<ellipse cx="${((i * 300 + t * (14 + i * 4)) % 1500) - 200}" cy="${y + (i % 3) * h * 0.3}" rx="380" ry="${h * 0.4}" fill="${c}" opacity="${op}"/>`;
  return `<g filter="url(#blur20)">${g}</g>`;
}
function sign(x, y, txt, s = 1) {
  return `<g filter="url(#soft)"><rect x="${x - 5 * s}" y="${y - 220 * s}" width="${10 * s}" height="${220 * s}" fill="#3a2e22"/><path d="M${x - 10 * s},${y - 214 * s} L${x + 150 * s},${y - 214 * s} L${x + 172 * s},${y - 194 * s} L${x + 150 * s},${y - 174 * s} L${x - 10 * s},${y - 174 * s} Z" fill="${V('#e8e0c8', 0.1, 0.25)}" stroke="#2a2218" stroke-width="${3 * s}"/><text x="${x + 72 * s}" y="${y - 186 * s}" font-family="Jost, Arial" font-weight="700" font-size="${22 * s}" fill="#1e1a14" text-anchor="middle">${txt}</text></g>`;
}
function sandbags(x, y, n, rows = 3, s = 1) {
  let g = '';
  for (let r = 0; r < rows; r++) for (let i = 0; i < n - r; i++) g += `<ellipse cx="${x + (i + r * 0.5) * 64 * s}" cy="${y - r * 30 * s}" rx="${36 * s}" ry="${18 * s}" fill="${V('#8a7a5a', 0.2, 0.35)}" stroke="#4a3e2a" stroke-width="${2 * s}"/>`;
  return g;
}
function jerrycan(x, y, s = 1, c = '#4a5040') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-34" y="-96" width="68" height="96" rx="6" fill="${V(c, 0.2, 0.3)}"/><path d="M-26,-48 L26,-48 M-26,-30 L26,-74 M-26,-74 L26,-30" stroke="${shade(c, -0.3)}" stroke-width="3"/><rect x="-24" y="-112" width="18" height="16" fill="${shade(c, -0.2)}"/><rect x="2" y="-110" width="24" height="10" rx="3" fill="${shade(c, -0.2)}"/></g>`;
}

// ---------- техника ----------
function wheel(cx, cy, r, c = '#4a4a44') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${R('#1a1a1a', 0.12, 0.2)}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="${V(c, 0.2, 0.3)}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.3}" fill="${V('#c8ccd0', 0.3, 0.3)}"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${cx + Math.cos(i * 1.047) * r * 0.46}" cy="${cy + Math.sin(i * 1.047) * r * 0.46}" r="${r * 0.05}" fill="#2a2a26"/>`).join('')}<path d="M${cx - r * 0.7},${cy - r * 0.5} A${r * 0.86},${r * 0.86} 0 0 1 ${cx + r * 0.2},${cy - r * 0.84}" stroke="#fff" stroke-width="${r * 0.06}" fill="none" opacity="0.2"/>`;
}
// открытая штабная машина в профиль (капот вправо)
function staffCar(x, y, s, o = {}) {
  const c = o.c || '#3a3d36';
  let g = `<g transform="translate(${x} ${y}) rotate(${o.tilt || 0}) scale(${s})">`;
  g += `<ellipse cx="10" cy="4" rx="380" ry="22" fill="#000" opacity="0.35"/>`;
  // сложенный тент и сиденья
  g += `<path d="M-340,-196 Q-330,-262 -240,-258 L-196,-196 Z" fill="${V('#3a3628', 0.15, 0.3)}"/><path d="M-320,-226 L-210,-226 M-312,-210 L-200,-210" stroke="#22201a" stroke-width="5"/>`;
  g += `<rect x="-250" y="-246" width="110" height="60" rx="20" fill="${V('#6a3e26', 0.3, 0.3)}"/><rect x="-60" y="-240" width="100" height="54" rx="18" fill="${V('#6a3e26', 0.3, 0.3)}"/>`;
  if (o.suitcase) g += `<rect x="-246" y="-280" width="120" height="66" rx="8" fill="${V('#7a5a3a', 0.25, 0.3)}" stroke="#3a2a1a" stroke-width="4"/><rect x="-200" y="-292" width="28" height="14" rx="5" fill="none" stroke="#3a2a1a" stroke-width="5"/><rect x="-238" y="-262" width="8" height="30" fill="#c8a24a"/><rect x="-142" y="-262" width="8" height="30" fill="#c8a24a"/>`;
  // кузов-«ванна»
  g += `<path d="M-350,-90 L-352,-170 Q-350,-200 -310,-200 L60,-200 L70,-96 Z" fill="${V(c, 0.22, 0.3)}"/>`;
  g += `<path d="M-350,-180 L60,-180" stroke="${shade(c, 0.25)}" stroke-width="5"/>`;
  // капот с жалюзи
  g += `<path d="M60,-196 L300,-182 Q326,-178 326,-150 L326,-100 L60,-96 Z" fill="${V(c, 0.25, 0.3)}"/><path d="M60,-160 L322,-152" stroke="${shade(c, -0.3)}" stroke-width="3"/>`;
  for (let i = 0; i < 8; i++) g += `<rect x="${110 + i * 20}" y="-146" width="7" height="34" rx="3" fill="${shade(c, -0.35)}"/>`;
  // решётка радиатора
  g += `<path d="M320,-196 Q346,-196 346,-170 L346,-92 L318,-92 Z" fill="${V('#c8ccd0', 0.35, 0.3)}"/>${[0, 1, 2, 3].map((i) => `<path d="M${324 + i * 5},-188 L${324 + i * 5},-96" stroke="#2a2a28" stroke-width="2"/>`).join('')}`;
  // крылья и подножка
  g += `<path d="M-310,-86 Q-300,-150 -210,-156 Q-130,-150 -110,-86 L-110,-70 L-330,-70 Z" fill="${V(shade(c, -0.08), 0.25, 0.35)}"/>`;
  g += `<path d="M110,-70 L110,-90 Q130,-158 214,-160 Q300,-158 340,-100 Q360,-76 360,-70 Z" fill="${V(shade(c, -0.08), 0.25, 0.35)}"/>`;
  g += `<rect x="-120" y="-80" width="240" height="14" rx="4" fill="#1e1e1a"/>`;
  // фара и стекло
  g += `<circle cx="300" cy="-176" r="28" fill="${V('#c8ccd0', 0.4, 0.3)}"/><circle cx="300" cy="-176" r="20" fill="${o.lights ? '#fff4c8' : '#a8b0b4'}"/>`;
  if (o.lights) g += glow(300, -176, 120, '#fff2c0', 0.8);
  g += `<path d="M48,-198 L74,-318 L86,-318 L62,-198 Z" fill="#1a1c1a"/><path d="M76,-316 L100,-316 L74,-200 L62,-200 Z" fill="#c8d4dc" opacity="${o.broken ? 0.15 : 0.35}"/>`;
  if (o.broken) g += `<path d="M80,-300 L88,-270 L78,-250 M88,-270 L96,-262" stroke="#e8eef0" stroke-width="2" fill="none"/>`;
  // дверь
  if (o.door) g += `<path d="M-40,-196 L-40,-92 L-150,-60 L-150,-164 Z" fill="${V(c, 0.3, 0.2)}" stroke="#1a1a18" stroke-width="4"/><rect x="-136" y="-130" width="20" height="6" rx="3" fill="#c8ccd0"/>`;
  else g += `<path d="M-40,-196 L-40,-96 M-150,-196 L-150,-96" stroke="${shade(c, -0.35)}" stroke-width="4"/><rect x="-60" y="-160" width="18" height="6" rx="3" fill="#c8ccd0"/>`;
  // запаска сзади
  g += wheel(-356, -128, 46);
  g += wheel(-210, -62, 62) + wheel(214, -62, 62);
  // грязь
  reseed(13);
  for (let i = 0; i < 18; i++) g += `<circle cx="${-330 + rnd() * 690}" cy="${-70 - rnd() * 40}" r="${3 + rnd() * 6}" fill="#3a2c1c" opacity="0.7"/>`;
  return g + '</g>';
}
// грузовик с тентом (кабина вправо)
function lorry(x, y, s, o = {}) {
  const c = o.c || '#474b40';
  let g = `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="4" rx="380" ry="20" fill="#000" opacity="0.3"/>`;
  g += `<path d="M-330,-120 L-330,-330 Q-330,-372 -280,-372 L90,-372 Q120,-372 120,-330 L120,-120 Z" fill="${V('#6e6c58', 0.15, 0.3)}"/>`;
  [-250, -150, -50, 50].forEach((rx) => (g += `<path d="M${rx},-370 L${rx},-122" stroke="#55543f" stroke-width="5"/>`));
  for (let i = 0; i < 9; i++) g += `<path d="M${-320 + i * 50},-132 L${-300 + i * 50},-150" stroke="#2e2c22" stroke-width="3"/>`;
  g += `<path d="M-330,-150 L120,-150" stroke="#3e3c2e" stroke-width="4"/>`;
  if (o.men) for (let i = 0; i < 3; i++) g += `<circle cx="${-300 + i * 26}" cy="-300" r="16" fill="#d8aa8a"/><path d="M${-318 + i * 26},-304 Q${-300 + i * 26},-336 ${-282 + i * 26},-304 Z" fill="#4a4e40"/>`;
  g += `<rect x="-340" y="-130" width="470" height="50" fill="${V('#4e4a3a', 0.15, 0.3)}"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${-330 + i * 100},-128 L${-330 + i * 100},-82" stroke="#2e2a20" stroke-width="3"/>`).join('')}`;
  g += `<path d="M130,-110 L130,-300 Q130,-310 140,-310 L238,-310 L262,-212 L340,-198 Q356,-196 356,-180 L356,-110 Z" fill="${V(c, 0.22, 0.3)}"/>`;
  g += `<path d="M150,-292 L226,-292 L246,-218 L150,-218 Z" fill="${grad([[0, '#c8d4dc'], [1, '#6a7880']])}" opacity="0.75"/><rect x="146" y="-206" width="100" height="90" fill="none" stroke="${shade(c, -0.3)}" stroke-width="4"/>`;
  g += `<path d="M344,-196 L360,-196 L360,-110 L344,-110 Z" fill="${V('#9aa0a0', 0.3, 0.3)}"/>${[0, 1, 2].map((i) => `<path d="M${347 + i * 5},-190 L${347 + i * 5},-116" stroke="#2a2a26" stroke-width="2"/>`).join('')}`;
  g += `<path d="M248,-110 Q262,-170 320,-170 Q370,-160 376,-110 Z" fill="${V(shade(c, -0.1), 0.2, 0.3)}"/><circle cx="350" cy="-180" r="16" fill="${V('#c8ccd0', 0.4, 0.3)}"/>`;
  g += wheel(-240, -62, 58) + wheel(-140, -62, 58) + wheel(300, -62, 58);
  return g + '</g>';
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
function barrack(x, y, w, h, c, roof, n = '') {
  let g = `<path d="M${x - 14},${y - h} L${x + w / 2},${y - h * 1.45} L${x + w + 14},${y - h} Z" fill="${roof}"/><rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}"/>`;
  for (let i = 0; i < Math.floor(w / 80); i++) g += `<rect x="${x + 28 + i * 80}" y="${y - h * 0.62}" width="26" height="20" fill="#0b0e16"/>`;
  if (n) g += `<text x="${x + w / 2}" y="${y - h * 0.15}" font-family="Jost, Arial" font-weight="700" font-size="40" fill="#e8eef8" opacity="0.6" text-anchor="middle">${n}</text>`;
  return g;
}
function drizzle(t, n = 70, op = 0.25) {
  reseed(17);
  let g = '';
  for (let i = 0; i < n; i++) { const x = (rnd() * 1200 - t * 60 + 1200) % 1200, y = ((rnd() * 1920 + t * 900) % 2000) - 80; g += `<path d="M${x},${y} l-8,40" stroke="#dfe6ea" stroke-width="2" opacity="${op * (0.5 + rnd() * 0.5)}"/>`; }
  return g;
}
const MOOR_SKY = [[0, '#5e666c'], [0.5, '#9aa2a4'], [1, '#c6c8c0']];

const shots = {
  // 1. Деревенская дорога в тумане: юный «капитан», два офицера отдают ему честь; грузовик с солдатами, ферма, столбы
  salute(t, T) {
    const k = ease(t / T), sal = ease(clamp((t - 0.6) / 0.5));
    return {
      cam: { z: lerp(1.0, 1.08, k), y: lerp(0, -40, k) },
      els: [
        sky(MOOR_SKY, 1400),
        clouds(250, 600, '#d8dcd8', '#7a8288', t),
        treeline(1190, '#55605a', -40, 1120, 60, 120, 4),
        farmhouse(700, 1240, 300, 170, {}),
        `<path d="M-100,1210 Q300,1190 640,1215 Q900,1230 1180,1205 L1180,1300 L-100,1300 Z" fill="#6c6e60"/>`,
        poles([[1010, 1330, 330], [880, 1265, 180], [800, 1238, 110], [750, 1225, 70]]),
        `<rect x="0" y="1260" width="1080" height="660" fill="${V('#5a5440', 0.1, 0.45)}"/>`,
        `<path d="M400,1250 L640,1250 L1180,1920 L-120,1920 Z" fill="${V('#6e6852', 0.08, 0.35)}"/>`,
        ruts(520, 1255, 1920, 330),
        puddle(700, 1560, 120, 22, '#9aa2a4', '#c6c8c0') + puddle(330, 1700, 160, 30, '#9aa2a4', '#c6c8c0'),
        tufts(1270, 1900, 70, '#8a8462'),
        lorry(210, 1340, 0.62, { men: true }),
        mist(t, 1240, 220, 0.35),
        shadow(250, 1810, 140), shadow(470, 1780, 140), shadow(790, 1800, 160),
        man(250, 1810, 0.88, { ...OFFICER, arms: sal > 0.5 ? 'salute' : 'down', look: 1, frown: -0.1, blink: blink(t, 0.5) }),
        man(470, 1780, 0.84, { ...OFFICER, hair: '#5a4a3a', moustache: true, arms: sal > 0.5 ? 'salute' : 'down', look: 1, frown: 0, blink: blink(t, 2.1) }),
        man(790, 1800, 0.95, { ...WILLI_CAPT, arms: 'down', look: -0.6, frown: 0.1 - 0.3 * sal, blink: blink(t, 1.3) }),
        grade('#c8d0d8', 0.25),
        topShade(900, 0.55),
      ],
    };
  },

  // 2. Рассвет над торфяным болотом: Вилли бежит, на дамбе патруль и фары машины, вороны
  chase(t, T) {
    const k = ease(t / T), runP = t * 2.6;
    const bob = Math.abs(Math.sin(runP * Math.PI)) * 14;
    const lights = 0.75 + 0.25 * wave(t, 0.4);
    const sil = silFilter('#2a2c2c');
    return {
      cam: { z: lerp(1.04, 1.12, k), x: lerp(10, -20, k) },
      els: [
        sky([[0, '#3e444c'], [0.5, '#8a8a86'], [0.8, '#d6b88e'], [1, '#ecd2a2']], 1350),
        clouds(300, 500, '#e8c898', '#5a5e64', t),
        glow(820, 1170, 420, '#f6d6a0', 0.6), `<circle cx="820" cy="1170" r="46" fill="#fff0d0" opacity="0.85"/>`,
        rays(820, 1170, [200, 215, 230, 250, 290, 310, 330], 1400, '#ffe6b8', 0.08),
        treeline(1200, '#3e4640', -40, 600, 70, 140, 6),
        `<path d="M-100,1200 L1180,1170 L1180,1250 L-100,1270 Z" fill="#4e4c40"/>`, // дамба
        staffCar(930, 1185, 0.3, { lights: true }),
        `<path d="M1020,1132 L1180,1080 L1180,1200 Z" fill="${grad([[0, '#fff2c8', 0.5 * lights], [1, '#fff2c8', 0]], false)}"/>`,
        [560 + t * 12, 640 + t * 14, 720 + t * 10].map((px, i) => `<g opacity="0.92">${man(px, 1200, 0.17, { ...SOLDIER, arms: 'rifle', step: wave(t, 1.2, i), sil })}</g>`).join(''),
        `<rect x="0" y="1250" width="1080" height="670" fill="${V('#4a4232', 0.08, 0.45)}"/>`,
        peat(40, 1330, 6, 0.8) + peat(620, 1300, 6, 0.6, '#34261a'),
        `<path d="M-100,1420 Q400,1380 1180,1440 L1180,1480 Q400,1420 -100,1460 Z" fill="${grad([[0, '#e8c898'], [1, '#8a7a66']], false)}" opacity="0.8"/>`, // канава с отражением рассвета
        puddle(860, 1620, 140, 24, '#8a8a86', '#e8c898') + puddle(200, 1760, 120, 20, '#8a8a86', '#e8c898'),
        tufts(1260, 1900, 90, '#9a8e66', 11),
        crows(t, [[200, 700, 40, 1.2], [260, 760, 46, 1], [330, 690, 38, 0.9], [120, 820, 50, 1.1]]),
        mist(t, 1260, 200, 0.3, '#f0dcc0'),
        shadow(520, 1790, 170, 0.35),
        man(520 + t * 10, 1790 - bob, 1.0, { ...WILLI_RUN, lean: 6, step: Math.sin(runP * Math.PI), arms: 'pull', look: -1, blink: blink(t, 0.4), breath: (t * 0.9) % 1 }),
        grade('#ffcf9a', 0.2),
        topShade(900, 0.6),
      ],
    };
  },

  // 3. Кювет под моросью: Вилли ползёт к разбитой штабной машине, на заднем сиденье — чемодан
  ditch(t, T) {
    const k = ease(t / T), crawl = ease(clamp(t / (T * 0.85)));
    return {
      cam: { z: lerp(1.0, 1.09, k), x: lerp(0, -30, k) },
      els: [
        sky([[0, '#50585e'], [0.7, '#868a88'], [1, '#a4a69e']], 1300),
        clouds(200, 700, '#a8acaa', '#4e5458', t),
        treeline(1170, '#48524c', -40, 1120, 80, 160, 8),
        `<path d="M-100,1170 Q400,1140 1180,1180 L1180,1300 L-100,1300 Z" fill="#62645a"/>`,
        poles([[120, 1260, 260], [330, 1225, 150], [460, 1205, 90]]),
        sign(930, 1290, 'ASCHENDORF 8', 0.9),
        `<path d="M-100,1250 L1180,1228 L1180,1300 L-100,1320 Z" fill="${V('#7a7666', 0.1, 0.3)}"/>`, // насыпь дороги
        `<rect x="0" y="1300" width="1080" height="620" fill="${V('#463e2e', 0.06, 0.5)}"/>`,
        `<path d="M-100,1420 Q540,1560 1180,1420 L1180,1920 L-100,1920 Z" fill="${V('#3a3426', 0.05, 0.5)}"/>`,
        `<path d="M-100,1700 Q540,1770 1180,1690 L1180,1770 Q540,1830 -100,1770 Z" fill="${grad([[0, '#9aa2a6'], [1, '#5a6266']])}" opacity="0.6"/>`, // вода на дне
        staffCar(760, 1570, 0.95, { door: true, tilt: 9, suitcase: true, broken: true }),
        `<g transform="rotate(14 580 1650)"><rect x="560" y="1630" width="60" height="44" fill="#e8e2d0" opacity="0.8"/></g><g transform="rotate(-20 980 1700)"><rect x="960" y="1690" width="50" height="38" fill="#e8e2d0" opacity="0.7"/></g>`,
        jerrycan(1010, 1660, 0.7),
        smoke(1040, 1460, 0.35, t, 5, '#8a8a86'),
        tufts(1300, 1900, 80, '#7a7456', 12),
        shadow(lerp(160, 360, crawl), 1820, 200, 0.35),
        man(lerp(160, 360, crawl), 1820, 0.92, { ...WILLI_RAGS, pose: 'crouch', arms: 'pull', lean: 14, look: 1, frown: 0.7, nod: 1, blink: blink(t, 0.9) }),
        drizzle(t, 70, 0.22),
        grade('#a8b8c8', 0.25),
        topShade(900, 0.6),
      ],
    };
  },

  // 4. Чемодан на подножке: Вилли надевает китель, солдат вытягивается по стойке смирно; мельница вдали
  uniform(t, T) {
    const k = ease(t / T), on = ease(clamp((t - T * 0.3) / 0.6)), att = ease(clamp((t - T * 0.55) / 0.4));
    const sx = lerp(1180, 870, ease(clamp(t / (T * 0.5))));
    return {
      cam: { z: lerp(1.02, 1.1, k), y: lerp(0, -30, k) },
      els: [
        sky([[0, '#5c6268'], [0.7, '#9a9c96'], [1, '#b8b8b0']], 1300),
        clouds(240, 600, '#c8ccc8', '#5e6468', t),
        windmill(840, 1190, 0.7, t * 0.25),
        treeline(1200, '#4e5852', -40, 700, 60, 130, 10),
        `<path d="M-100,1190 Q500,1165 1180,1200 L1180,1300 L-100,1300 Z" fill="#666858"/>`,
        `<rect x="0" y="1260" width="1080" height="660" fill="${V('#58523e', 0.06, 0.45)}"/>`,
        [...Array(8)].map((_, i) => `<rect x="${640 + i * 60}" y="${1230 + i * 4}" width="8" height="${60 + i * 6}" fill="#2e2620"/>`).join('') + `<path d="M640,1250 L1120,1280" stroke="#2e2620" stroke-width="3"/>`,
        staffCar(300, 1430, 0.8, { door: true, tilt: 4 }),
        // раскрытый чемодан: китель, фуражка, коробочка с наградами
        `<g filter="url(#soft)"><path d="M300,1660 L520,1660 L540,1556 L320,1556 Z" fill="${V('#7a5a3a', 0.2, 0.3)}"/><path d="M314,1650 L510,1650 L526,1570 L330,1570 Z" fill="${V('#8a3a32', 0.1, 0.3)}"/><rect x="290" y="1660" width="260" height="90" rx="10" fill="${V('#6a4a2c', 0.15, 0.3)}"/><rect x="306" y="1668" width="228" height="72" rx="6" fill="${V('#66717f', 0.2, 0.2)}"/>${[0, 1, 2].map((i) => `<circle cx="420" cy="${1680 + i * 20}" r="5" fill="#c8ccd0"/>`).join('')}<rect x="440" y="1600" width="56" height="34" rx="4" fill="#1c1c1e"/><circle cx="468" cy="1617" r="9" fill="#c8a24a"/></g>`,
        tufts(1270, 1900, 70, '#8a8462', 14),
        shadow(600, 1820, 170, 0.35),
        `<g opacity="${1 - on}">${man(600, 1820, 0.98, { ...WILLI_RAGS, arms: 'hold', look: 1, frown: 0.3, blink: blink(t, 0.6) })}</g>`,
        `<g opacity="${on}">${man(600, 1820, 0.98, { ...WILLI_CAPT, arms: 'down', look: 1, frown: 0.2 - 0.3 * att, blink: blink(t, 0.6) })}</g>`,
        shadow(sx, 1780, 140, 0.3),
        man(sx, 1780, 0.86, { ...SOLDIER, arms: att > 0.5 ? 'down' : 'rifle', step: att > 0.5 ? 0 : wave(t, 1.4), lean: lerp(-4, 0, att), look: -1, frown: -0.2 * att, blink: blink(t, 1.7) }),
        grade('#c8d0d8', 0.2),
        topShade(900, 0.55),
      ],
    };
  },

  // 5. Ночной пост: Вилли крупно (рукава до пальцев, пустой планшет); шлагбаум, мешки с песком, офицер с фонарём
  checkpoint(t, T) {
    const k = ease(t / T), beam = ease(clamp((t - T * 0.25) / 0.8));
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -60, k) },
      els: [
        sky([[0, '#121a26'], [0.7, '#2e3846'], [1, '#44505e']], 1400),
        clouds(200, 600, '#3e4a5a', '#141c28', t, 7),
        treeline(1200, '#141a22', -40, 1120, 90, 170, 12),
        `<path d="M-100,1220 L1180,1200 L1180,1400 L-100,1400 Z" fill="#20262e"/>`,
        // будка с окном, полевой телефон, шлагбаум
        `<g filter="url(#soft)"><rect x="30" y="960" width="190" height="290" fill="${V('#3a3f46', 0.12, 0.3)}"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${30 + i * 27}" y="960" width="3" height="290" fill="#2a2e34"/>`).join('')}<path d="M10,966 L240,966 L220,918 L30,918 Z" fill="#1c2026"/><rect x="74" y="1020" width="100" height="76" fill="#ffcf7a" opacity="0.85"/><path d="M124,1020 L124,1096 M74,1058 L174,1058" stroke="#2a2218" stroke-width="5"/></g>${glow(124, 1060, 170, '#ffb860', 0.45)}`,
        `<rect x="236" y="1050" width="22" height="200" fill="#1a1c20"/>${[...Array(8)].map((_, i) => `<rect x="${258 + i * 90}" y="1062" width="90" height="26" fill="${i % 2 ? '#e8e4da' : '#a8322a'}"/>`).join('')}<circle cx="247" cy="1074" r="16" fill="#2a2c30"/>`,
        sandbags(640, 1250, 6, 3, 0.8),
        `<rect x="0" y="1230" width="1080" height="700" fill="${V('#2a2824', 0.05, 0.5)}"/>`,
        puddle(860, 1500, 160, 24, '#2e3846', '#44505e', 0.6),
        // настоящий офицер с фонарём
        `<path d="M780,1120 L500,1560 L700,1600 Z" fill="${grad([[0, '#fff4d0', 0.5 * beam], [1, '#fff4d0', 0]])}"/>`,
        shadow(830, 1340, 110, 0.35),
        man(830, 1340, 0.62, { ...OFFICER, arms: 'hold', look: -1, frown: 0.6, blink: blink(t, 2.4) }),
        glow(790, 1125, 70, '#fff4d0', beam), `<circle cx="790" cy="1125" r="12" fill="#fffbe8"/>`,
        // Вилли крупно, глаза косятся на пост
        glow(470, 1500, 500, '#9fb0c8', 0.15),
        man(470, 2150, 1.7, { ...WILLI_CAPT, arms: 'down', look: 0.8, frown: 0.6, worried: true, blink: blink(t, 1.1) }),
        `<g filter="url(#soft)"><rect x="590" y="1740" width="120" height="150" rx="10" fill="${V('#5a3e26', 0.2, 0.3)}" stroke="#2e2014" stroke-width="5"/><rect x="590" y="1740" width="120" height="40" rx="8" fill="#4a3220"/><rect x="640" y="1770" width="20" height="12" rx="3" fill="#b8bcc0"/></g>`,
        glow(560, 1650, 380, '#fff4d0', 0.12 * beam),
        topShade(900, 0.6),
      ],
    };
  },

  // 6. Отряд за Вилли растёт; в конце — мелькающие кадры без контекста: вышка, бараки, проволока
  squad(t, T) {
    const k = ease(t / T);
    const cutAt = T - 2.3;
    if (t >= cutAt) {
      const c = Math.min(2, Math.floor((t - cutAt) / 0.5));
      const ang = 14 + 30 * wave(t, 0.25);
      const frames = [
        () => [sky([[0, '#06080e'], [0.7, '#141a28'], [1, '#1e2638']], 1920), clouds(200, 500, '#2a3448', '#0a0e16', t, 6), tower(760, 1350, 520, '#05070c', ang), treeline(1340, '#080a10', -40, 1120, 80, 140, 15), `<rect x="0" y="1340" width="1080" height="580" fill="#0c1018"/>`, barbed(1600, 420, 230, '#020306')],
        () => [sky([[0, '#0a0d14'], [1, '#222a3a']], 1920), barrack(-40, 1420, 560, 160, '#161c28', '#0d121c', 'III'), barrack(560, 1440, 560, 150, '#141a26', '#0b1018', 'IV'), `<g transform="rotate(${-20 + 10 * wave(t, 0.5)} 900 300)"><path d="M890,300 L520,1900 L1260,1900 L910,300 Z" fill="${grad([[0, '#e8f0ff', 0.45], [1, '#e8f0ff', 0]])}"/></g>`, `<rect x="0" y="1430" width="1080" height="490" fill="#0c1018"/>`, puddle(540, 1700, 300, 40, '#222a3a', '#8a9ab8', 0.5)],
        () => [sky([[0, '#151a24'], [1, '#2a3242']], 1920), glow(540, 900, 600, '#c8d4ff', 0.3), `<g transform="scale(2.2) translate(-250 -300)">${barbed(1100, 500, 260, '#020306')}</g>`, ...[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${150 + i * 160}" cy="${980 + (i % 2) * 70}" r="6" fill="#dfe8ff" opacity="0.7"/>`)],
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
        clouds(240, 600, '#d0d4d0', '#6a7278', t),
        smoke(160, 1150, 0.9, t, 8, '#4a4a48'),
        farmhouse(40, 1200, 220, 120, { burnt: true }),
        treeline(1190, '#55605a', 300, 1120, 60, 130, 18),
        `<path d="M-100,1180 Q500,1160 1180,1185 L1180,1300 L-100,1300 Z" fill="#6c6e60"/>`,
        poles([[1000, 1400, 420], [860, 1290, 230], [770, 1240, 140], [715, 1215, 90], [680, 1205, 56]]),
        `<rect x="0" y="1230" width="1080" height="690" fill="${V('#58533f', 0.06, 0.45)}"/>`,
        `<path d="M470,1200 L610,1200 L1080,1920 L0,1920 Z" fill="${V('#6c6652', 0.06, 0.35)}"/>`,
        ruts(540, 1205, 1920, 300),
        puddle(860, 1500, 110, 20, '#9aa2a4', '#c6c8c0') + puddle(240, 1640, 140, 24, '#9aa2a4', '#c6c8c0'),
        tufts(1240, 1900, 80, '#8a8462', 19),
        mist(t, 1190, 180, 0.3),
        ...men,
        shadow(540, 1860, 160, 0.35),
        man(540, 1860, 1.0, { ...WILLI_CAPT, arms: 'down', step: wave(t, 1.3), look: 0, frown: 0.35 * k, blink: blink(t, 1.0) }),
        grade('#c8d0d8', 0.2),
        topShade(900, 0.55),
      ],
    };
  },

  // 7. Пустой фермерский дом: Вилли у треснувшего зеркала, в отражении — он же в рваной шинели
  mirror(t, T) {
    const k = ease(t / T), morph = ease(clamp((t - T * 0.25) / (T * 0.35)));
    def(`<clipPath id="mir"><rect x="590" y="760" width="400" height="780" rx="14"/></clipPath><pattern id="wp" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#4a4a3e"/><path d="M45,10 q12,18 0,36 q-12,-18 0,-36 Z M0,55 q12,18 0,36 M90,55 q-12,18 0,36" fill="#5a5a4a"/><circle cx="45" cy="70" r="4" fill="#5a5a4a"/></pattern>`);
    return {
      cam: { z: lerp(1.0, 1.08, k), x: lerp(0, -20, k) },
      els: [
        `<rect width="1080" height="1920" fill="url(#wp)"/>`,
        `<rect width="1080" height="1920" fill="${grad([[0, '#000', 0.5], [0.5, '#000', 0.1], [1, '#000', 0.5]], false)}"/>`,
        // ободранные обои и картина криво
        `<path d="M380,300 L470,300 L455,520 L410,470 Z" fill="#6a6450"/><g transform="rotate(-7 260 520)"><rect x="180" y="440" width="160" height="200" fill="${V('#5a4630', 0.2, 0.3)}"/><rect x="196" y="456" width="128" height="168" fill="#2a3a34"/><path d="M196,580 Q260,520 324,590 L324,624 L196,624 Z" fill="#3a4a3a"/></g>`,
        // окно с рваной занавеской и лучом света
        `<rect x="60" y="720" width="300" height="420" fill="${grad([[0, '#dde2de'], [1, '#a8b0ac']])}"/><path d="M210,720 L210,1140 M60,930 L360,930" stroke="#2a2a26" stroke-width="12"/><rect x="60" y="720" width="300" height="420" fill="none" stroke="#2a2a26" stroke-width="16"/><path d="M40,700 Q90,900 70,1180 L40,1180 Z" fill="${V('#8a7a5a', 0.2, 0.3)}"/><path d="M380,700 Q320,820 350,900 Q330,980 360,1060 L380,1060 Z" fill="${V('#8a7a5a', 0.2, 0.3)}"/>`,
        rays(210, 930, [30, 38, 46, 54], 1400, '#f0f2ea', 0.14),
        `<rect x="0" y="1500" width="1080" height="420" fill="${V('#3a2e24', 0.08, 0.45)}"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${i * 220 - 100},1920 L${380 + i * 60},1500" stroke="#2a2018" stroke-width="3"/>`).join('')}`,
        // комод под зеркалом и опрокинутый стул
        `<g filter="url(#soft)"><rect x="560" y="1500" width="460" height="300" fill="${V('#4a3424', 0.15, 0.35)}"/>${[0, 1].map((i) => `<rect x="580" y="${1530 + i * 130}" width="420" height="110" fill="none" stroke="#2a1c12" stroke-width="5"/><circle cx="790" cy="${1585 + i * 130}" r="9" fill="#c8a24a"/>`).join('')}</g>`,
        `<g transform="rotate(70 140 1760)" filter="url(#soft)"><rect x="80" y="1620" width="16" height="200" fill="#4a3424"/><rect x="190" y="1620" width="16" height="200" fill="#4a3424"/><rect x="70" y="1700" width="150" height="20" fill="#5a4030"/></g>`,
        // зеркало в резной раме
        `<rect x="566" y="736" width="448" height="828" rx="24" fill="${V('#7a5a36', 0.25, 0.35)}"/><path d="M640,736 Q790,660 940,736 Z" fill="${V('#7a5a36', 0.25, 0.35)}"/><circle cx="790" cy="706" r="14" fill="#c8a24a"/><rect x="590" y="760" width="400" height="780" rx="14" fill="${grad([[0, '#646c6c'], [1, '#384040']])}"/>`,
        `<g clip-path="url(#mir)"><g opacity="0.85">`,
        `<g opacity="${1 - morph}">${man(790, 1860, 0.95, { ...WILLI_CAPT, arms: 'down', look: -0.8, frown: 0.3, blink: blink(t, 1.6) })}</g>`,
        `<g opacity="${morph}">${man(790, 1860, 0.95, { ...WILLI_RAGS, arms: 'down', look: -0.8, frown: 0.7, blink: blink(t, 1.6) })}</g>`,
        `</g><rect x="590" y="760" width="400" height="780" fill="${grad([[0, '#fff', 0.14], [0.5, '#fff', 0], [1, '#fff', 0.08]], false)}"/></g>`,
        `<path d="M760,760 L800,980 L740,1120 L820,1300 L800,1540 M800,980 L900,1040 L990,990 M740,1120 L620,1180 M820,1300 L940,1360" stroke="#e8eeee" stroke-width="3" fill="none" opacity="0.75"/>`,
        shadow(330, 1880, 170, 0.35),
        man(330, 1880, 1.12, { ...WILLI_CAPT, arms: 'down', look: 1, frown: 0.4, blink: blink(t, 0.8) }),
        grade('#c8d0c8', 0.2),
        topShade(900, 0.6),
      ],
    };
  },

  // 8. Ночь: фуражка на столе среди карты и бумаг, керосиновая лампа, на крючке шинель; свет медленно гаснет
  cap(t, T) {
    const k = ease(t / T), light = lerp(1, 0.35, ease(clamp((t - T * 0.3) / (T * 0.6))));
    const fl = 1 + 0.03 * wave(t, 1.7);
    return {
      cam: { z: lerp(1.0, 1.14, k), y: lerp(0, -70, k) },
      els: [
        `<rect width="1080" height="1920" fill="#0a0b0c"/>`,
        [...Array(9)].map((_, i) => `<rect x="${i * 130}" y="0" width="124" height="1380" fill="#15130f" opacity="0.9"/>`).join(''),
        glow(760, 1150, 900 * fl, '#ffb45a', 0.3 * light),
        // шинель на крючке
        `<g opacity="${0.4 + 0.6 * light}"><circle cx="200" cy="700" r="10" fill="#6a5a3a"/><path d="M200,700 Q120,740 110,900 L90,1300 L310,1300 L290,900 Q280,740 200,700 Z" fill="${V('#4a4c3e', 0.15, 0.35)}"/><path d="M200,712 L170,860 L200,900 L230,860 Z" fill="#33342a"/>${[0, 1, 2, 3].map((i) => `<circle cx="180" cy="${920 + i * 80}" r="6" fill="#2a2a22"/><circle cx="220" cy="${920 + i * 80}" r="6" fill="#2a2a22"/>`).join('')}</g>`,
        `<rect x="0" y="1380" width="1080" height="540" fill="${V('#4a3220', 0.12, 0.5)}"/><rect x="0" y="1380" width="1080" height="14" fill="#2a1c12"/>`,
        glow(700, 1420, 560, '#ffb45a', 0.42 * light),
        // карта и бумаги
        `<g transform="rotate(-6 300 1520)"><rect x="80" y="1420" width="420" height="260" fill="#d8ccaa" opacity="${0.5 + 0.4 * light}"/><path d="M120,1460 Q220,1520 300,1480 Q380,1440 460,1520 M100,1600 Q240,1560 480,1640" stroke="#6a5a3a" stroke-width="3" fill="none"/><circle cx="300" cy="1540" r="14" fill="none" stroke="#a8322a" stroke-width="4"/></g>`,
        `<g transform="rotate(8 760 1560)"><rect x="680" y="1500" width="200" height="140" fill="#e8e2d0" opacity="${0.4 + 0.5 * light}"/>${[0, 1, 2, 3].map((i) => `<rect x="700" y="${1520 + i * 24}" width="${150 - i * 20}" height="5" fill="#6a6250"/>`).join('')}</g>`,
        // стакан и пепельница с дымком
        `<path d="M600,1440 L640,1440 L634,1380 L606,1380 Z" fill="#c8d4d8" opacity="0.35"/><ellipse cx="980" cy="1470" rx="46" ry="12" fill="#3a3a36"/>`, smoke(990, 1460, 0.25, t, 5, '#8a8680'),
        // лампа
        `<rect x="830" y="1300" width="140" height="40" rx="10" fill="${V('#6a5030', 0.2, 0.3)}"/><path d="M846,1300 Q900,1120 954,1300 Z" fill="${V('#c8ccc0', 0.3, 0.2)}" opacity="0.5"/>`,
        glow(900, 1235, 160 * fl, '#ffcf7a', 0.9 * light), `<ellipse cx="900" cy="1240" rx="${12 * fl}" ry="${30 * fl}" fill="#fff0c0" opacity="${0.4 + 0.6 * light}"/>`,
        `<rect x="880" y="1080" width="40" height="70" rx="8" fill="#1e1a14"/>`,
        // фуражка крупно
        `<g filter="url(#soft)"><ellipse cx="480" cy="1470" rx="300" ry="64" fill="#0e0f12"/>${officerCap(480, 1700, 270, '#5e6878')}</g>`,
        `<rect x="0" y="0" width="1080" height="1920" fill="#000" opacity="${0.55 * (1 - light)}"/>`,
        topShade(900, 0.6),
      ],
    };
  },
};

run(shots);
