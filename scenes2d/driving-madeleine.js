// «Великолепная поездка» (Une belle course / Driving Madeleine, 2022) — 8 планов в 2D-векторе. Имя плана = set сцены в videos/driving-madeleine/script.json.
// Париж: кремовый камень османовских домов, серые цинковые крыши, кованые балконы; утро — мягкий голубой, вечер — золото, ночь — синий с огнями.
import { run, person, setProportions, V, R, grad, glow, rnd, reseed, shade, lerp, clamp, wave, def } from './core.js';

const PROPS = { head: 0.64, legs: 1.35, torso: 1.15, slim: 0.84, hand: 0.72 };
setProportions(PROPS);

// ---------- персонажи ----------
// Мадлен: белые пышные волосы, тёмно-синий жакет, блузка в горошек, голубой шарф, жемчуг
const MAD = { shirt: '#28324e', pants: '#28324e', skin: '#f0c8b0', hair: '#eeebe4', iris: '#5a7aa8', beard: false, frown: 0.05, smile: false, mad: true };
// Шарль: короткие тёмные волосы, седая щетина и бородка, коричневая замшевая куртка, синяя рубашка
const CHA = { shirt: '#4a3a2e', pants: '#2a2a30', skin: '#d8a482', hair: '#2a2420', iris: '#4a3422', beard: false, frown: 0.45, cha: true };

const D = 0.13; // AUDIO_DELAY
const io = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const at = (t, a, d = 0.5) => io((t - D - a) / d);
const blink = (t, ph = 0) => ((t + ph) % 3.4) < 0.12;
const sky = (stops, h = 1920) => `<rect width="1080" height="${h}" fill="${grad(stops)}"/>`;
const grade = (c, op) => `<rect width="1080" height="1920" fill="${c}" opacity="${op}" style="mix-blend-mode:soft-light"/>`;
const topShade = (h = 800, a = 0.5) => `<rect width="1080" height="${h}" fill="${grad([[0, '#000', a], [0.6, '#000', a * 0.4], [1, '#000', 0]])}"/>`;
const layer = (op, inner) => op <= 0.001 ? '' : `<g opacity="${op.toFixed(3)}">${inner}</g>`;
const par = (dx, dy, svg) => `<g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})">${svg}</g>`;
const label = (x, y, txt, size = 16, c = '#2a2a2a', op = 0.8, anchor = 'middle', font = "Georgia, serif", weight = 700) => `<text x="${x}" y="${y}" font-family="${font}" font-weight="${weight}" font-size="${size}" fill="${c}" opacity="${op}" text-anchor="${anchor}">${txt}</text>`;

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
  let b = '', front = '';
  if (o.mad) {
    // блузка в горошек в вырезе жакета, голубой шарф вдоль лацканов, жемчужная подвеска
    b += `<path d="M${x - 56 * s},${top - 6 * s} L${x},${top + 190 * s} L${x + 56 * s},${top - 6 * s} Z" fill="#ecebef"/>`;
    reseed(3);
    for (let i = 0; i < 26; i++) { const py = top + rnd() * 180 * s, w = 54 * s * (1 - (py - top) / (190 * s)); b += `<circle cx="${x + (rnd() - 0.5) * 2 * w}" cy="${py}" r="${3 * s}" fill="#2a2a34"/>`; }
    b += `<path d="M${x - 30 * s},${top - 2 * s} Q${x},${top + 60 * s} ${x + 30 * s},${top - 2 * s}" stroke="#e8e2d0" stroke-width="${2 * s}" fill="none"/><circle cx="${x}" cy="${top + 58 * s}" r="${6 * s}" fill="${R('#fffaf0', 0.2, 0.2)}"/>`;
    b += `<path d="M${x - 70 * s},${top - 14 * s} L${x - 46 * s},${top - 4 * s} L${x - 30 * s},${ty} L${x - 66 * s},${ty} Z M${x + 70 * s},${top - 14 * s} L${x + 46 * s},${top - 4 * s} L${x + 34 * s},${ty} L${x + 70 * s},${ty} Z" fill="${V('#6a9ae6', 0.2, 0.15)}"/>`;
    b += `<path d="M${x - 64 * s},${top + 20 * s} Q${x - 50 * s},${top + 120 * s} ${x - 58 * s},${ty}" stroke="#9cc0f4" stroke-width="${4 * s}" fill="none" opacity="0.6"/>`;
    b += `<path d="M${x - 96 * s},${top + 40 * s} L${x - 72 * s},${top + 10 * s} L${x - 60 * s},${top + 150 * s} Z M${x + 96 * s},${top + 40 * s} L${x + 72 * s},${top + 10 * s} L${x + 62 * s},${top + 150 * s} Z" fill="${shade('#28324e', 0.12)}"/>`;
    // пышная белая укладка, морщинки, серьги-жемчуг, помада
    front += `<g fill="${V('#f6f4ee', 0.1, 0.12)}">${[[-0.8, -0.55, 0.42], [-0.45, -0.88, 0.45], [0, -0.98, 0.46], [0.45, -0.88, 0.45], [0.8, -0.55, 0.42], [-0.98, -0.15, 0.3], [0.98, -0.15, 0.3], [-0.2, -0.75, 0.38], [0.25, -0.72, 0.36]].map(([dx, dy, r]) => `<circle cx="${x + dx * hr}" cy="${headY + dy * hr}" r="${r * hr}"/>`).join('')}</g>`;
    front += `<path d="M${x - hr * 0.62},${headY - hr * 0.62} q${hr * 0.18},${-hr * 0.1} ${hr * 0.32},0 M${x + hr * 0.05},${headY - hr * 0.78} q${hr * 0.2},${-hr * 0.08} ${hr * 0.36},${hr * 0.04}" stroke="#d8d2c6" stroke-width="${3 * hs}" fill="none"/>`;
    front += [-1, 1].map((sd) => `<path d="M${x + sd * 58 * hs},${ey - 4 * hs} l${sd * 12 * hs},${-5 * hs} M${x + sd * 58 * hs},${ey + 4 * hs} l${sd * 13 * hs},${2 * hs}" stroke="${shade(o.skin, -0.25)}" stroke-width="${2.5 * hs}" stroke-linecap="round"/><path d="M${x + sd * 22 * hs},${ey + 34 * hs} Q${x + sd * 34 * hs},${ey + 50 * hs} ${x + sd * 30 * hs},${ey + 64 * hs}" stroke="${shade(o.skin, -0.2)}" stroke-width="${3 * hs}" fill="none" stroke-linecap="round"/><circle cx="${x + sd * hr * 0.98}" cy="${headY + 34 * hs}" r="${8 * hs}" fill="${R('#fffaf0', 0.2, 0.25)}"/>`).join('');
    front += `<path d="M${x - 20 * hs},${ey + 55 * hs} Q${x},${ey + (o.smileK ? 70 : 62) * hs} ${x + 20 * hs},${ey + 55 * hs}" stroke="#c0505a" stroke-width="${6 * hs}" fill="none" stroke-linecap="round"/>`;
  }
  if (o.cha) {
    // синяя рубашка с расстёгнутым воротом под замшевой курткой
    b += `<path d="M${x - 62 * s},${top - 8 * s} L${x},${top + 70 * s} L${x + 62 * s},${top - 8 * s} L${x + 50 * s},${ty} L${x - 50 * s},${ty} Z" fill="${V('#2f56b0', 0.15, 0.25)}"/>`;
    b += `<path d="M${x - 24 * s},${top - 4 * s} L${x},${top + 40 * s} L${x + 24 * s},${top - 4 * s} Z" fill="${shade(o.skin, -0.1)}"/>`;
    b += `<path d="M${x - 50 * s},${top - 10 * s} L${x - 6 * s},${top + 46 * s} L${x - 36 * s},${top + 40 * s} Z M${x + 50 * s},${top - 10 * s} L${x + 6 * s},${top + 46 * s} L${x + 36 * s},${top + 40 * s} Z" fill="#3a62c0"/>`;
    b += [0, 1, 2].map((i) => `<circle cx="${x + 2 * s}" cy="${top + (80 + i * 45) * s}" r="${4 * s}" fill="#1c3474"/>`).join('');
    b += `<path d="M${x - 100 * s},${top + 30 * s} L${x - 62 * s},${top - 10 * s} L${x - 48 * s},${ty} L${x - 98 * s},${ty} Z M${x + 100 * s},${top + 30 * s} L${x + 62 * s},${top - 10 * s} L${x + 48 * s},${ty} L${x + 98 * s},${ty} Z" fill="${V('#5a4636', 0.15, 0.25)}"/>`;
    b += `<path d="M${x - 52 * s},${top + 10 * s} L${x - 50 * s},${ty} M${x + 52 * s},${top + 10 * s} L${x + 50 * s},${ty}" stroke="#a8a098" stroke-width="${3 * s}" stroke-dasharray="${8 * s} ${6 * s}"/>`;
    // седая щетина, бородка, морщины уставшего лба
    front += `<path d="M${x - hr * 0.82},${headY + hr * 0.2} Q${x - hr * 0.7},${headY + hr * 1.02} ${x},${headY + hr * 1.02} Q${x + hr * 0.7},${headY + hr * 1.02} ${x + hr * 0.82},${headY + hr * 0.2} Q${x + hr * 0.5},${headY + hr * 0.6} ${x},${headY + hr * 0.6} Q${x - hr * 0.5},${headY + hr * 0.6} ${x - hr * 0.82},${headY + hr * 0.2} Z" fill="#5a5048" opacity="0.28"/>`;
    front += `<path d="M${x - 22 * hs},${ey + 66 * hs} Q${x},${ey + 96 * hs} ${x + 22 * hs},${ey + 66 * hs} Q${x},${ey + 74 * hs} ${x - 22 * hs},${ey + 66 * hs} Z" fill="#8a8078" opacity="0.8"/><path d="M${x - 30 * hs},${ey + 46 * hs} Q${x},${ey + 38 * hs} ${x + 30 * hs},${ey + 46 * hs}" stroke="#6a6058" stroke-width="${6 * hs}" fill="none" stroke-linecap="round" opacity="0.7"/>`;
    front += `<path d="M${x - 30 * hs},${headY - hr * 0.42} q${30 * hs},${-6 * hs} ${60 * hs},0 M${x - 22 * hs},${headY - hr * 0.3} q${22 * hs},${-5 * hs} ${44 * hs},0" stroke="${shade(o.skin, -0.2)}" stroke-width="${2.5 * hs}" fill="none" opacity="0.7"/>`;
    if (o.grin) front += `<path d="M${x - 22 * hs},${ey + 54 * hs} Q${x},${ey + 66 * hs} ${x + 26 * hs},${ey + 50 * hs}" stroke="#7a3a30" stroke-width="${5 * hs}" fill="none" stroke-linecap="round"/>`;
  }
  return { b, front };
}
function figure(x, y, s, o) {
  const { b, front } = dress(x, y, s, o);
  const body = person(x, y, s, { ...o, overlay: b, smile: false });
  if (!front || o.sil) return body;
  const tr = [o.lean ? `rotate(${o.lean} ${x} ${y})` : '', o.rot ? `rotate(${o.rot} ${o.rx ?? x} ${o.ry ?? y})` : ''].filter(Boolean).join(' ');
  return `${body}<g${tr ? ` transform="${tr}"` : ''}>${front}</g>`;
}
const mad = (x, y, s, o = {}) => figure(x, y, s, { ...MAD, ...o });
const cha = (x, y, s, o = {}) => figure(x, y, s, { ...CHA, ...o });

// ---------- Париж ----------
// османовский дом: камень, высокие окна, кованые балконы на 2 и 5 этажах, цинковая мансарда со слуховыми окнами, трубы
function haus(x, base, w, fl = 6, o = {}) {
  const c = o.c || '#e4d6bc', fh = o.fh || 120, h = fl * fh, top = base - h, lit = o.lit || 0, cols = Math.max(2, Math.round(w / 110));
  let g = `<rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${V(c, 0.08, 0.18)}"/>`;
  g += `<rect x="${x}" y="${base - fh}" width="${w}" height="${fh}" fill="${shade(c, -0.12)}"/>`;
  for (let f = 0; f < fl; f++) g += `<rect x="${x}" y="${top + f * fh}" width="${w}" height="4" fill="${shade(c, -0.2)}" opacity="0.6"/>`;
  reseed(Math.round(x * 7 + w));
  const cw = w / cols;
  for (let f = 0; f < fl; f++) for (let i = 0; i < cols; i++) {
    const wx = x + i * cw + cw * 0.28, wy = top + f * fh + fh * 0.2, ww = cw * 0.44, wh = fh * (f === fl - 1 ? 0.55 : 0.62);
    if (f === fl - 1) { // витрины первого этажа
      const on = rnd() < 0.5 + lit * 0.5;
      g += `<rect x="${x + i * cw + cw * 0.1}" y="${wy}" width="${cw * 0.8}" height="${fh * 0.75}" fill="${on && lit ? '#ffcf7a' : shade(c, -0.55)}" opacity="${on && lit ? 0.9 : 1}"/>`;
      continue;
    }
    const on = lit && rnd() < 0.45 * lit;
    g += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="${on ? '#ffd78a' : (o.glass || '#5a6a80')}"/><path d="M${wx + ww / 2},${wy} v${wh} M${wx},${wy + wh * 0.45} h${ww}" stroke="${shade(c, 0.1)}" stroke-width="3"/>`;
    if (on) g += glow(wx + ww / 2, wy + wh / 2, ww * 1.4, '#ffbf60', 0.35);
    g += `<rect x="${wx - 6}" y="${wy - 10}" width="${ww + 12}" height="8" fill="${shade(c, 0.12)}"/>`;
    if (f === 1 || f === fl - 2) g += `<rect x="${wx - 10}" y="${wy + wh - 22}" width="${ww + 20}" height="22" fill="none" stroke="#2a2a2e" stroke-width="3"/>` + Array.from({ length: 6 }, (_, k) => `<path d="M${wx - 10 + (k + 0.5) * (ww + 20) / 6},${wy + wh - 22} v22" stroke="#2a2a2e" stroke-width="2"/>`).join('');
    if (o.flowers && f === 1 && rnd() < 0.7) g += Array.from({ length: 5 }, (_, k) => `<circle cx="${wx - 6 + k * (ww + 12) / 4}" cy="${wy + wh - 24 - rnd() * 8}" r="${7 + rnd() * 4}" fill="${['#e0405a', '#f08a3a', '#e85a9a', '#5aa04a'][Math.floor(rnd() * 4)]}"/>`).join('');
  }
  if (fl > 3 && fl === (o.balc || fl)) g += `<rect x="${x}" y="${top + fh * 1.62}" width="${w}" height="6" fill="#2a2a2e"/>`;
  // мансарда
  const mt = top - fh * 0.9;
  g += `<path d="M${x - 6},${top} L${x + 30},${mt} L${x + w - 30},${mt} L${x + w + 6},${top} Z" fill="${V(o.roof || '#7c8694', 0.12, 0.2)}"/>`;
  for (let i = 0; i < cols; i++) { const dx = x + i * cw + cw * 0.32; g += `<path d="M${dx},${top - 6} v-${fh * 0.45} q${cw * 0.18},-${fh * 0.22} ${cw * 0.36},0 v${fh * 0.45} Z" fill="${shade(c, 0.05)}"/><rect x="${dx + cw * 0.08}" y="${top - fh * 0.42}" width="${cw * 0.2}" height="${fh * 0.3}" fill="${lit && rnd() < 0.4 ? '#ffd78a' : '#3a4250'}"/>`; }
  g += `<rect x="${x + w * 0.2}" y="${mt - 40}" width="34" height="44" fill="${shade(c, -0.25)}"/><rect x="${x + w * 0.7}" y="${mt - 52}" width="40" height="56" fill="${shade(c, -0.25)}"/>` + [0, 1, 2].map((k) => `<rect x="${x + w * 0.7 + 4 + k * 12}" y="${mt - 64}" width="8" height="14" fill="#b8643a"/>`).join('');
  return g;
}
function street(x0, base, n, t = 0, o = {}) {
  let g = '', x = x0; reseed(o.seed || 7);
  const pal = ['#e6d8be', '#ddcdb0', '#eadfc8', '#d6c4a4', '#e2cfb2'];
  for (let i = 0; i < n; i++) { const w = 300 + rnd() * 120; g += haus(x, base, w, o.fl || 6, { ...o, c: pal[i % pal.length] }); x += w; }
  return g;
}
function lamp(x, base, h = 420, on = 0) {
  let g = `<rect x="${x - 7}" y="${base - h}" width="14" height="${h}" fill="${V('#2a2e2a', 0.2, 0.3)}"/><rect x="${x - 16}" y="${base - 30}" width="32" height="30" fill="#2a2e2a"/>`;
  g += `<path d="M${x - 26},${base - h - 70} L${x + 26},${base - h - 70} L${x + 18},${base - h} L${x - 18},${base - h} Z" fill="${on ? '#ffe2a0' : '#c8d0d0'}" stroke="#1e221e" stroke-width="5"/><path d="M${x - 32},${base - h - 70} L${x},${base - h - 96} L${x + 32},${base - h - 70} Z" fill="#1e221e"/>`;
  if (on) g += glow(x, base - h - 36, 180, '#ffc870', 0.55 * on);
  return g;
}
function tree(x, base, s = 1, c = '#4a7a3a') { return `<rect x="${x - 10 * s}" y="${base - 260 * s}" width="${20 * s}" height="${260 * s}" fill="#4a3a2a"/>` + [[0, -330, 120], [-80, -280, 90], [80, -270, 95], [-30, -400, 90], [50, -380, 80]].map(([dx, dy, r]) => `<circle cx="${x + dx * s}" cy="${base + dy * s}" r="${r * s}" fill="${R(c, 0.15, 0.25)}"/>`).join(''); }
function eiffel(x, base, h = 900, lit = 0) {
  const w = h * 0.36, c = lit ? '#e8a84a' : '#6a5a4a';
  let g = `<path d="M${x - w / 2},${base} Q${x - w * 0.16},${base - h * 0.35} ${x - w * 0.07},${base - h * 0.72} L${x - 6},${base - h} L${x + 6},${base - h} L${x + w * 0.07},${base - h * 0.72} Q${x + w * 0.16},${base - h * 0.35} ${x + w / 2},${base} L${x + w * 0.3},${base} Q${x},${base - h * 0.2} ${x - w * 0.3},${base} Z" fill="${c}"/>`;
  g += `<rect x="${x - w * 0.24}" y="${base - h * 0.3}" width="${w * 0.48}" height="${h * 0.02}" fill="${c}"/><rect x="${x - w * 0.13}" y="${base - h * 0.6}" width="${w * 0.26}" height="${h * 0.015}" fill="${c}"/>`;
  if (lit) { reseed(4); for (let i = 0; i < 40; i++) { const k = rnd(), yy = base - k * h * 0.98, half = lerp(w / 2, 6, Math.pow(k, 0.6)) * (rnd() * 2 - 1); g += `<circle cx="${x + half}" cy="${yy}" r="${2 + rnd() * 2}" fill="#fff6d0" opacity="${0.5 + 0.5 * rnd()}"/>`; } g = glow(x, base - h * 0.5, h * 0.6, '#ffb050', 0.25 * lit) + g; }
  return g;
}
// такси сбоку (x — центр, y — земля), колёса крутятся, на крыше «TAXI PARISIEN»
function taxi(x, y, s, t = 0, o = {}) {
  const c = o.c || '#1c1e22', spin = (t * 600) % 360, dir = o.dir || 1;
  let g = `<g transform="translate(${x} ${y}) scale(${s * dir} ${s})">`;
  g += `<ellipse cx="0" cy="0" rx="330" ry="24" fill="#000" opacity="0.35"/>`;
  g += `<path d="M-330,-40 Q-336,-120 -280,-140 L-170,-160 Q-110,-250 -20,-256 L120,-256 Q190,-252 240,-170 L310,-150 Q345,-140 340,-60 L336,-40 Z" fill="${V(c, 0.3, 0.3)}"/>`;
  g += `<path d="M-150,-166 Q-100,-238 -24,-240 L40,-240 L40,-166 Z" fill="${o.win || '#8aa0b8'}" opacity="0.85"/><path d="M58,-240 L118,-240 Q176,-236 214,-166 L58,-166 Z" fill="${o.win || '#8aa0b8'}" opacity="0.85"/>`;
  g += `<path d="M-130,-174 L-60,-232" stroke="#fff" stroke-width="10" opacity="0.25"/>`;
  g += `<path d="M-300,-110 L320,-108" stroke="${shade(c, 0.35)}" stroke-width="4" opacity="0.6"/><rect x="-40" y="-140" width="30" height="8" rx="3" fill="#888"/><rect x="130" y="-140" width="30" height="8" rx="3" fill="#888"/>`;
  g += `<rect x="318" y="-118" width="24" height="22" rx="6" fill="${o.night ? '#fff4c8' : '#e8e8e0'}"/><rect x="-336" y="-116" width="18" height="22" rx="5" fill="#c8202a"/>`;
  if (o.night) g += glow(380, -100, 120, '#fff0c0', 0.5) + glow(-350, -100, 80, '#ff3030', 0.5);
  g += `<rect x="-40" y="-292" width="120" height="36" rx="8" fill="${o.night ? '#f0f0e8' : '#dcdcd4'}"/><text x="20" y="-268" font-family="Arial" font-weight="700" font-size="18" text-anchor="middle" fill="#1a1a1a">TAXI PARISIEN</text>`;
  if (o.night) g += glow(20, -274, 90, '#c8ffd0', 0.35);
  [-210, 210].forEach((wx) => { g += `<circle cx="${wx}" cy="-30" r="62" fill="#111"/><circle cx="${wx}" cy="-30" r="34" fill="${V('#b8bcc0', 0.2, 0.3)}"/><g transform="rotate(${spin} ${wx} -30)">${[0, 72, 144, 216, 288].map((a) => `<rect x="${wx - 4}" y="-62" width="8" height="30" fill="#6a6e72" transform="rotate(${a} ${wx} -30)"/>`).join('')}</g>`; });
  if (o.inside) g += o.inside;
  return g + `</g>`;
}
// булыжная мостовая в перспективе
function cobbles(y0, y1, c = '#8a8278', vx = 540) {
  let g = `<rect x="0" y="${y0}" width="1080" height="${y1 - y0}" fill="${V(c, 0.05, 0.25)}"/>`;
  for (let r = 0, y = y0; y < y1; r++) { const h = 6 + r * 3; for (let x = -200 + (r % 2) * 20; x < 1280; x += 30 + r * 6) { const px = vx + (x - vx) * (1 + r * 0.04); g += `<rect x="${px}" y="${y}" width="${24 + r * 5}" height="${h - 2}" rx="3" fill="${shade(c, ((x * 13 + r * 7) % 9) / 60 - 0.05)}"/>`; } y += h; }
  return g;
}
function clouds(t, y = 300, c = '#fff', op = 0.8) { let g = ''; reseed(21); for (let i = 0; i < 5; i++) { const cx = (rnd() * 1400 + t * (10 + i * 4)) % 1500 - 200, cy = y + rnd() * 260, s = 0.7 + rnd() * 0.8; g += `<g opacity="${op}" fill="${c}">${[[0, 0, 70], [70, -20, 90], [150, 0, 70], [80, 20, 80]].map(([dx, dy, r]) => `<circle cx="${cx + dx * s}" cy="${cy + dy * s}" r="${r * s}"/>`).join('')}</g>`; } return `<g filter="url(#blur4)">${g}</g>`; }
function bokeh(t, n = 40, y0 = 500, y1 = 1500, seed = 9) { let g = ''; reseed(seed); const cols = ['#ffd27a', '#ff9a5a', '#7ac8ff', '#ff6a8a', '#fff0c0', '#9affc8']; for (let i = 0; i < n; i++) { const x = (rnd() * 1300 - 110 + t * (8 + rnd() * 20)) % 1300 - 110, y = y0 + rnd() * (y1 - y0), r = 20 + rnd() * 50; g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${cols[Math.floor(rnd() * cols.length)]}" opacity="${0.25 + rnd() * 0.4}"/>`; } return `<g filter="url(#blur4)">${g}</g>`; }

// стены узкой улочки в перспективе: окна, ставни, балконы с цветами
function laneWalls() {
  // точка стены: f — глубина (0 у камеры, 1 у дальнего края), v — высота (0 земля .. 1 крыша)
  const P = (side, f, v) => { const g = Math.pow(f, 0.7); const x = lerp(0, 420, g), yb = lerp(1920, 1300, g), yt = lerp(-200, 560, g); const px = side < 0 ? x : 1080 - x; return [px, lerp(yb, yt, v)]; };
  const quad = (side, f0, f1, v0, v1, fill, extra = '') => { const a = P(side, f0, v0), b = P(side, f1, v0), c = P(side, f1, v1), d = P(side, f0, v1); return `<path d="M${a} L${b} L${c} L${d} Z" fill="${fill}" ${extra}/>`; };
  let g = '';
  const flowers = ['#e0405a', '#f08a3a', '#e85a9a', '#f4d04a'];
  [-1, 1].forEach((side) => {
    g += quad(side, 0, 1, 0.92, 1.1, side < 0 ? '#7c8694' : '#6c7684');
    for (let i = 0; i < 9; i++) {
      const f0 = i / 9 + 0.02, f1 = f0 + 0.05;
      for (let r = 0; r < 5; r++) {
        const v0 = 0.22 + r * 0.14, v1 = v0 + 0.09;
        g += quad(side, f0, f1, v0, v1, '#4a5a70') + quad(side, f0 - 0.012, f0, v0, v1, '#6a9ac8') + quad(side, f1, f1 + 0.012, v0, v1, '#6a9ac8');
        if (r === 1 || r === 3) { g += quad(side, f0 - 0.012, f1 + 0.012, v0 - 0.012, v0, '#2a2a2e'); const [fx, fy] = P(side, (f0 + f1) / 2, v0); g += [0, 1, 2].map((q) => `<circle cx="${fx + (q - 1) * 14 * (1 - f0)}" cy="${fy - 6}" r="${11 * (1 - f0 * 0.8)}" fill="${flowers[(i + q + r) % 4]}"/>`).join(''); }
      }
      g += quad(side, f0 - 0.02, f1 + 0.02, 0.0, 0.16, i % 3 === 0 ? '#5a3a2a' : '#3a3a40');
    }
  });
  return g;
}

// ---------- салон: двойной план через лобовое стекло ----------
// снаружи видно водителя (справа, левый руль) и Мадлен сзади слева
function windshieldShot(t, o) {
  const { outside, mood = 'day', chaO = {}, madO = {}, madX = 330, chaX = 720, rays = 0 } = o;
  const glassTint = mood === 'night' ? '#0a1020' : mood === 'gold' ? '#3a2410' : '#1a2430';
  let g = outside;
  // салон за стеклом
  g += `<rect x="90" y="560" width="900" height="860" fill="${glassTint}" opacity="0.55"/>`;
  g += `<rect x="${madX - 230}" y="760" width="460" height="700" rx="60" fill="#1a1a1e" opacity="0.6"/>`; // заднее сиденье
  g += mad(madX, 1440, 1.5, { pose: 'sit', ...madO });
  g += `<rect x="${chaX - 200}" y="880" width="400" height="640" rx="70" fill="${V('#202024', 0.1, 0.3)}"/>`; // спинка водителя
  g += cha(chaX, 1590, 2.0, { pose: 'sit', arms: 'hold', ...chaO });
  // руль
  g += `<g filter="url(#soft)"><ellipse cx="${chaX}" cy="1400" rx="210" ry="70" fill="none" stroke="#1a1a1c" stroke-width="30"/><rect x="${chaX - 26}" y="1400" width="52" height="80" fill="#1a1a1c"/></g>`;
  // зеркало заднего вида
  g += `<rect x="470" y="600" width="170" height="50" rx="16" fill="#1a1a1c"/><rect x="480" y="608" width="150" height="34" rx="12" fill="${mood === 'night' ? '#2a3450' : '#8a98a8'}"/><rect x="548" y="560" width="14" height="44" fill="#1a1a1c"/>`;
  if (o.mirrorEyes) g += `<g clip-path="none"><ellipse cx="535" cy="626" rx="9" ry="7" fill="#fbfaf3"/><ellipse cx="575" cy="626" rx="9" ry="7" fill="#fbfaf3"/><circle cx="${535 + o.mirrorEyes.x * 4}" cy="${626 + o.mirrorEyes.y * 4}" r="4.5" fill="#3a2414"/><circle cx="${575 + o.mirrorEyes.x * 4}" cy="${626 + o.mirrorEyes.y * 4}" r="4.5" fill="#3a2414"/><path d="M522,612 l24,${o.mirrorEyes.brow || 0} M588,612 l-24,${o.mirrorEyes.brow || 0}" stroke="#2a2420" stroke-width="4"/></g>`;
  // отражения на стекле
  g += `<g opacity="${mood === 'night' ? 0.12 : 0.22}"><path d="M${120 + rays * 200},560 L${300 + rays * 200},560 L${120 + rays * 200},1420 L${-60 + rays * 200},1420 Z" fill="#fff"/><path d="M${640 + rays * 160},560 L${700 + rays * 160},560 L${560 + rays * 160},1420 L${500 + rays * 160},1420 Z" fill="#fff"/></g>`;
  // рама, крыша, капот
  g += `<path d="M0,480 L1080,480 L1080,600 L990,560 L90,560 L0,600 Z" fill="${V('#1c1e22', 0.25, 0.3)}"/><path d="M40,1420 L90,560 L130,560 L90,1420 Z M1040,1420 L990,560 L950,560 L990,1420 Z" fill="#141518"/>`;
  g += `<path d="M-20,1420 L1100,1420 L1100,1960 L-20,1960 Z" fill="${V('#1c1e22', 0.3, 0.35)}"/><path d="M-20,1420 Q540,1380 1100,1420 L1100,1470 Q540,1440 -20,1470 Z" fill="${shade('#1c1e22', 0.25)}"/>`;
  g += `<path d="M200,1520 Q540,1490 880,1520" stroke="#fff" stroke-width="5" opacity="0.12" fill="none"/>`;
  return g;
}

// ---------- планы ----------
const shots = {
  // 1. Хук: Мадлен крупно на заднем сиденье, за окном плывёт утренний Париж
  hook(t, T) {
    const k = io(t / T), pan = t * 160;
    const outside = sky([[0, '#9cc4e8'], [0.5, '#d8e6f0'], [1, '#f0e8da']]) + clouds(t, 220, '#fff', 0.7)
      + par(-pan * 0.35, 0, street(-200, 1500, 9, t, { seed: 3, fl: 7, flowers: true, fh: 110 }))
      + par(-pan, 0, [-100, 500, 1100, 1700, 2300].map((x) => lamp(x, 1550, 520) + tree(x + 300, 1560, 1.2)).join(''));
    const smile = at(t, 3.1, 0.6);
    const scene = [
      `<rect width="1080" height="1920" fill="#16181c"/>`,
      // окно двери
      `<clipPath id="win1"><path d="M110,520 L980,520 Q1010,520 1010,560 L1010,1380 L70,1380 L70,600 Q70,520 110,520 Z"/></clipPath>`,
      `<g clip-path="url(#win1)">${outside}<rect width="1080" height="1920" fill="#2a3a50" opacity="0.12"/></g>`,
      `<path d="M110,520 L980,520 Q1010,520 1010,560 L1010,1380 L70,1380 L70,600 Q70,520 110,520 Z" fill="none" stroke="#0e0f12" stroke-width="30"/>`,
      `<rect x="520" y="500" width="22" height="900" fill="#0e0f12"/>`,
      // Мадлен: крупно, лицо 3/4 к окну, тёплый свет с окна
      glow(560, 1050, 520, '#fff2d8', 0.35),
      mad(560, 1990, 3.2, { pose: 'sit', look: lerp(-0.9, 0.2, at(t, 1.2, 1.4)), lookUp: 0.2, blink: blink(t, 0.7), nod: wave(t, 0.25) * 0.8, smileK: smile > 0.5, frown: lerp(0.15, -0.05, smile), lean: wave(t, 0.3) * 0.8 }),
      // ремень безопасности и дверь
      `<rect x="-20" y="1700" width="1120" height="260" fill="${V('#202226', 0.15, 0.3)}"/>`,
      `<g opacity="0.18"><path d="M${200 + k * 300},520 L${330 + k * 300},520 L${180 + k * 300},1380 L${50 + k * 300},1380 Z" fill="#fff"/></g>`,
      grade('#ffcf9a', 0.25),
      topShade(560, 0.55),
    ];
    return { cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -40, k), x: lerp(0, -10, k) }, els: scene };
  },

  // 2. Утро в пригороде: дом со ставнями, чемодан, такси; Мадлен оглядывается на дом
  home(t, T) {
    const k = io(t / T), look = at(t, 1.9, 0.8);
    const els = [
      sky([[0, '#8ab8e0'], [0.45, '#cfe0ee'], [0.7, '#f4e6cc'], [1, '#e8d8b8']]),
      glow(860, 420, 420, '#fff2c8', 0.6),
      clouds(t, 260, '#fff', 0.85),
      par(-k * 30, 0, `<path d="M-100,1150 Q300,1080 700,1120 T1300,1100 L1300,1300 L-100,1300 Z" fill="#8aa878" opacity="0.7"/>` + tree(80, 1200, 1.3, '#5a8a4a') + tree(980, 1180, 1.5, '#4a7a3a')),
      // дом: кремовые стены, черепица, закрытые голубые ставни, плющ
      par(-k * 60, 0, `<rect x="180" y="760" width="660" height="520" fill="${V('#efe4cc', 0.1, 0.2)}"/><path d="M140,780 L510,520 L880,780 Z" fill="${V('#b8583a', 0.15, 0.3)}"/><rect x="660" y="560" width="60" height="140" fill="#8a4a32"/>`
        + [[250, 850], [630, 850], [250, 1050]].map(([x, y]) => `<rect x="${x}" y="${y}" width="130" height="150" fill="#3a4a5a"/><rect x="${x - 6}" y="${y}" width="68" height="150" fill="${V('#6a9ac8', 0.15, 0.25)}"/><rect x="${x + 68}" y="${y}" width="68" height="150" fill="${V('#6a9ac8', 0.15, 0.25)}"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${x},${y + 20 + i * 28} h136" stroke="#4a7aa8" stroke-width="4"/>`).join('')}`).join('')
        + `<rect x="470" y="1040" width="140" height="240" rx="6" fill="${V('#5a3a2a', 0.15, 0.3)}"/><circle cx="590" cy="1170" r="7" fill="#d8b44a"/>`
        + Array.from({ length: 40 }, (_, i) => { reseed(i + 50); return `<circle cx="${180 + rnd() * 90}" cy="${780 + rnd() * 480}" r="${12 + rnd() * 14}" fill="${shade('#4a7a3a', rnd() * 0.3 - 0.15)}"/>`; }).join('')),
      // ограда с калиткой, дорожка
      par(-k * 90, 0, `<path d="M-50,1290 L1150,1290 L1150,1920 L-50,1920 Z" fill="${V('#7a9a5a', 0.05, 0.3)}"/><path d="M470,1290 L610,1290 L760,1920 L320,1920 Z" fill="${V('#cbbfa6', 0.05, 0.2)}"/>`
        + Array.from({ length: 22 }, (_, i) => i > 8 && i < 13 ? '' : `<rect x="${-40 + i * 56}" y="1250" width="16" height="120" fill="#f4f0e6"/>`).join('') + `<rect x="-40" y="1280" width="500" height="12" fill="#f4f0e6"/><rect x="640" y="1280" width="560" height="12" fill="#f4f0e6"/>`
        + Array.from({ length: 30 }, (_, i) => { reseed(i + 90); return `<path d="M${rnd() * 1080},${1400 + rnd() * 500} l-6,-26 M${rnd() * 1080},${1400 + rnd() * 500} l5,-22" stroke="#5a7a3a" stroke-width="4"/>`; }).join('')),
      // такси у калитки
      par(-k * 120, 0, taxi(870, 1560, 0.95, 0, { c: '#2a2c30' })),
      // чемодан и Мадлен (спиной к нам → оглядывается на дом)
      par(-k * 150, 0, `<g filter="url(#soft)"><rect x="330" y="1530" width="150" height="200" rx="16" fill="${V('#8a3a2e', 0.2, 0.3)}"/><path d="M370,1530 v-30 h70 v30" stroke="#3a2a22" stroke-width="10" fill="none"/><rect x="345" y="1590" width="120" height="10" fill="#5a2a22"/></g>`
        + mad(560, 1780, 1.05, { look: lerp(0.4, -1, look), lookUp: 0.6 * look, blink: blink(t, 1.3), step: 0, nod: wave(t, 0.4) * 0.6, frown: lerp(0.05, 0.3, look), arms: 'down' })),
      grade('#ffe0b0', 0.25),
      topShade(700, 0.45),
    ];
    return { cam: { z: lerp(1.18, 1.0, k), y: lerp(-60, 0, k) }, els };
  },

  // 3. Шарль за рулём: счета на панели, кофе, навигатор; пробка и стоп-сигналы
  charles(t, T) {
    const k = io(t / T), crawl = t * 40, angry = at(t, 1.7, 0.4);
    const out = sky([[0, '#a8bcd0'], [1, '#d8d4c8']]) + par(-crawl * 0.4, 0, street(-100, 1100, 6, t, { seed: 11, fl: 6, fh: 95 }))
      + `<rect x="0" y="1060" width="1080" height="300" fill="#6a6a6e"/>`
      + par(-crawl * 0.1, 0, [[220, 1180, 0.7], [700, 1150, 0.55], [480, 1110, 0.4]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-200" y="-140" width="400" height="150" rx="40" fill="${['#8a2a2a', '#3a4a6a', '#e0e0d8'][Math.round(s * 10) % 3]}"/><rect x="-170" y="-90" width="70" height="30" rx="8" fill="#ff2a2a"/><rect x="100" y="-90" width="70" height="30" rx="8" fill="#ff2a2a"/></g>` + glow(x - 95 * s, y - 75 * s, 90 * s, '#ff3a3a', 0.7) + glow(x + 135 * s, y - 75 * s, 90 * s, '#ff3a3a', 0.7)).join(''));
    const els = [
      windshieldShot(t, { outside: out, mood: 'day', madX: -600, chaX: 560, rays: k,
        chaO: { look: lerp(0.3, -0.4, angry), frown: lerp(0.4, 0.8, angry), squint: true, blink: blink(t, 0.4), nod: wave(t, 0.5) * 0.5, lean: wave(t, 0.7) * 1.5 } }),
      // приборная панель: счета, кофе, навигатор
      `<g filter="url(#soft)"><rect x="140" y="1440" width="200" height="130" rx="6" fill="#f4f0e4" transform="rotate(-8 240 1500)"/><rect x="160" y="1470" width="140" height="10" fill="#c83a3a" transform="rotate(-8 240 1500)"/>${label(236, 1530, 'À PAYER', 26, '#c83a3a', 0.9, 'middle', 'Arial')}<rect x="300" y="1460" width="190" height="120" rx="6" fill="#ece6d6" transform="rotate(6 390 1520)"/>${label(392, 1535, 'FACTURE', 24, '#3a3a3a', 0.8, 'middle', 'Arial')}</g>`,
      `<g filter="url(#soft)"><path d="M820,1400 L900,1400 L890,1520 L830,1520 Z" fill="${V('#f2ece0', 0.1, 0.2)}"/><rect x="814" y="1390" width="92" height="18" rx="6" fill="#5a3a2a"/><path d="M${850 + wave(t, 0.4) * 6},1380 q-14,-40 6,-80" stroke="#fff" stroke-width="5" opacity="0.25" fill="none"/></g>`,
      `<rect x="620" y="1440" width="160" height="100" rx="12" fill="#121316"/><rect x="630" y="1450" width="140" height="80" rx="6" fill="#2a5a8a"/><path d="M640,1515 Q690,1470 760,1460" stroke="#5aa0ff" stroke-width="8" fill="none"/><circle cx="${650 + k * 80}" cy="${1510 - k * 40}" r="7" fill="#fff"/>`,
      grade('#a8c0d8', 0.2),
      topShade(560, 0.5),
    ];
    return { cam: { z: lerp(1.08, 1.18, k), y: lerp(0, -60, k), x: lerp(10, -10, k) }, els };
  },

  // 4. «Сверни»: Мадлен показывает рукой, Шарль закатывает глаза → такси въезжает в старую улочку, кафе с красным тентом
  detour(t, T) {
    const k = io(t / T), sw = at(t, 1.7, 0.6);
    const pan = t * 120;
    const out1 = sky([[0, '#9cc4e8'], [1, '#e8e4d8']]) + par(-pan * 0.5, 0, street(-80, 1200, 8, t, { seed: 5, fl: 7, fh: 100, flowers: true }));
    const scene1 = windshieldShot(t, { outside: out1, mood: 'day', rays: k,
      madO: { arms: at(t, 0.7, 0.3) > 0.5 ? 'point' : 'down', look: 0.8, lookUp: 0.3, frown: -0.1, smileK: true, blink: blink(t, 0.9), lean: lerp(0, 6, at(t, 0.6, 0.4)) },
      chaO: { look: -0.2, lookUp: lerp(0, 1.4, at(t, 0.95, 0.3)), frown: 0.6, nod: wave(t, 0.6) * 0.5 },
      mirrorEyes: { x: 0, y: -lerp(0, 1, at(t, 0.95, 0.3)), brow: 6 } });
    // старая улочка в перспективе: балконы с цветами, кафе kinoplot.film, такси сзади въезжает
    const drive = at(t, 1.8, T - 2);
    const lane = sky([[0, '#a8cce8'], [1, '#f2e8d4']]) + glow(540, 700, 380, '#fff4d0', 0.6)
      + `<path d="M0,0 L420,780 L420,1300 L0,1920 Z" fill="${V('#e2d2b4', 0.1, 0.25)}"/><path d="M1080,0 L660,780 L660,1300 L1080,1920 Z" fill="${V('#d8c6a6', 0.1, 0.3)}"/>`
      + laneWalls()
      // кафе: красный тент + вывеска (пасхалка)
      + `<path d="M0,1180 L250,1060 L250,1130 L0,1290 Z" fill="${V('#c8303a', 0.2, 0.3)}"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${i * 50},${1180 - i * 24} L${i * 50 + 25},${1168 - i * 24} L${i * 50 + 25},${1220 - i * 32} L${i * 50},${1235 - i * 32} Z" fill="#f4ece0" opacity="0.8"/>`).join('')}`
      + `<g transform="translate(140 1010) skewY(-25)"><rect x="-120" y="-40" width="240" height="54" rx="6" fill="#1e3a2e"/>${label(0, -4, 'kinoplot.film', 26, '#e8d8a8', 0.9, 'middle', 'Georgia, serif', 400)}</g>`
      + `<g filter="url(#soft)"><circle cx="120" cy="1430" r="40" fill="#e8e4dc"/><rect x="116" y="1440" width="8" height="120" fill="#3a3a3a"/><circle cx="230" cy="1390" r="30" fill="#e8e4dc"/></g>`
      + cobbles(1300, 1920, '#8a8278') + `<path d="M420,1300 L660,1300 L1080,1920 L0,1920 Z" fill="#000" opacity="0.06"/>`
      + lamp(780, 1500, 460, 0)
      + `<g transform="translate(540 ${lerp(1880, 1400, drive)}) scale(${lerp(1.0, 0.55, drive)})"><g filter="url(#soft)"><path d="M-300,0 L-300,-210 Q-280,-300 -200,-330 L200,-330 Q280,-300 300,-210 L300,0 Z" fill="${V('#1c1e22', 0.3, 0.3)}"/><path d="M-220,-320 L220,-320 L180,-430 Q0,-450 -180,-430 Z" fill="${V('#2a2c30', 0.2, 0.2)}"/><path d="M-200,-330 L-170,-420 L170,-420 L200,-330 Z" fill="#6a7a8a"/><rect x="-60" y="-470" width="120" height="36" rx="8" fill="#dcdcd4"/>${label(0, -444, 'TAXI', 26, '#1a1a1a', 1, 'middle', 'Arial')}<rect x="-280" y="-200" width="90" height="40" rx="10" fill="#c8202a"/><rect x="190" y="-200" width="90" height="40" rx="10" fill="#c8202a"/><rect x="-80" y="-140" width="160" height="40" fill="#f0f0e8"/><rect x="-310" y="-30" width="80" height="40" fill="#111"/><rect x="230" y="-30" width="80" height="40" fill="#111"/></g>${glow(-235, -180, 90, '#ff3030', 0.5)}${glow(235, -180, 90, '#ff3030', 0.5)}</g>`;
    return {
      cam: { z: lerp(1.05, 1.15, k), y: lerp(0, -40, k) },
      els: [layer(1 - sw, scene1 + grade('#ffd8a0', 0.2)), layer(sw, lane + grade('#ffd8a0', 0.3)), topShade(620, 0.5)],
    };
  },

  // 5. Счётчик крутится → день уходит в золото, Шарль сдаётся и смотрит в зеркало с полуулыбкой
  meter(t, T) {
    const k = io(t / T), sw = at(t, 1.2, 0.8), gold = at(t, 1.3, 1.6);
    const fare = (23.4 + t * 9.7).toFixed(2).replace('.', ',');
    const meter = `<rect width="1080" height="1920" fill="#101114"/>${glow(540, 1000, 600, '#3a6aff', 0.15)}`
      + `<g transform="translate(540 1050) rotate(-4) scale(${lerp(1.0, 1.1, k)})" filter="url(#soft)"><rect x="-380" y="-200" width="760" height="400" rx="40" fill="${V('#2a2c30', 0.2, 0.4)}"/><rect x="-330" y="-140" width="660" height="200" rx="16" fill="#0a0c0a"/>`
      + `<text x="0" y="20" font-family="'Courier New', monospace" font-weight="700" font-size="140" fill="#ff4a3a" text-anchor="middle">${fare} €</text>${glow(0, -40, 380, '#ff3a2a', 0.25)}`
      + `${label(-250, 120, 'TARIF A', 30, '#c8c8c0', 0.8, 'middle', 'Arial')}${label(250, 120, 'kinoplot.film', 22, '#8a8a84', 0.55, 'middle', 'Arial', 400)}<circle cx="0" cy="130" r="20" fill="#3aff6a" opacity="${0.6 + 0.4 * wave(t, 1)}"/></g>`
      + Array.from({ length: 6 }, (_, i) => `<rect x="${((i * 230 - t * 600) % 1400 + 1400) % 1400 - 160}" y="${1500 + i * 30}" width="160" height="6" fill="#ffd27a" opacity="0.4" filter="url(#blur4)"/>`).join('');
    const out = sky([[0, lerp(0, 1, gold) > 0.5 ? '#f0a860' : '#b8cce0'], [0.6, '#f4c890'], [1, '#e8a868']]) + glow(820, 900, 500, '#ffb050', 0.4 + 0.4 * gold)
      + par(-t * 70, 0, street(-150, 1250, 8, t, { seed: 17, fl: 7, fh: 100, c: '#e8cfa0' }));
    const scene2 = windshieldShot(t, { outside: out, mood: 'gold', rays: k,
      madO: { look: 0.5, frown: -0.05, smileK: true, blink: blink(t, 1.6), nod: wave(t, 0.35) * 0.8 },
      chaO: { look: lerp(0, -0.6, at(t, 2.5, 0.5)), lookUp: lerp(0, 0.6, at(t, 2.5, 0.5)), frown: lerp(0.6, 0.15, at(t, 3.3, 0.6)), grin: at(t, 3.5, 0.3) > 0.5, blink: blink(t, 0.3), nod: lerp(0, 2, at(t, 2.3, 0.4)) * (1 - at(t, 2.9, 0.4)) },
      mirrorEyes: { x: -0.5, y: 0.2, brow: lerp(6, -2, at(t, 3.3, 0.6)) } });
    return {
      cam: { z: lerp(1.0, 1.12, k), y: lerp(0, -30, k) },
      els: [layer(1 - sw, meter), layer(sw, scene2 + `<rect width="1080" height="1920" fill="#ff9a3a" opacity="${0.12 * gold}" style="mix-blend-mode:soft-light"/>`), grade('#ffb870', 0.25 * gold), topShade(600, 0.5)],
    };
  },

  // 6. Вечерний Париж: Сена, мосты с фонарями, башня в огнях (мелькающие кадры) → в салоне Шарль обернулся и слушает
  paris(t, T) {
    const k = io(t / T), a = at(t, 1.7, 0.6), b = at(t, 3.6, 0.6);
    const pan = t * 90;
    const seine = sky([[0, '#1a2450'], [0.45, '#7a5a8a'], [0.62, '#f0a070'], [1, '#2a2a4a']])
      + glow(300, 1000, 500, '#ff9a5a', 0.35)
      + par(-pan * 0.2, 0, eiffel(720, 1180, 900, 1))
      + par(-pan * 0.4, 0, street(-200, 1180, 9, t, { seed: 31, fl: 5, fh: 80, lit: 0.9, c: '#c8b49a' }))
      + `<rect x="0" y="1180" width="1080" height="740" fill="${V('#1a2448', 0.1, 0.4)}"/>`
      + Array.from({ length: 14 }, (_, i) => `<rect x="${((i * 140 - t * 30) % 1200 + 1200) % 1200 - 60}" y="${1220 + (i % 5) * 70}" width="${60 + (i % 3) * 30}" height="5" fill="#ffc870" opacity="${0.35 + 0.25 * wave(t, 0.8, i)}"/>`).join('')
      + par(-pan * 0.7, 0, taxi(760, 1170, 0.4, t, { night: true, c: '#1a1c20', win: '#ffd890' }))
      + par(-pan * 0.9, 0, [100, 520, 940, 1360].map((x) => lamp(x, 1600, 380, 1)).join('') + `<rect x="-300" y="1560" width="2000" height="40" fill="#3a3640"/>` + Array.from({ length: 30 }, (_, i) => `<rect x="${-300 + i * 70}" y="1500" width="12" height="60" fill="#3a3640"/>`).join('') + `<rect x="-300" y="1495" width="2000" height="12" fill="#4a4650"/>`);
    const bridge = sky([[0, '#0e1430'], [1, '#2a2a50']]) + bokeh(t, 30, 600, 1200, 12)
      + `<path d="M-100,1300 Q540,1080 1180,1300 L1180,1360 L-100,1360 Z" fill="#3a3448"/>` + [0.15, 0.35, 0.5, 0.65, 0.85].map((f) => lamp(f * 1080, 1300 - Math.sin(f * Math.PI) * 220 + 10, 220, 1)).join('')
      + `<rect x="0" y="1360" width="1080" height="560" fill="${V('#121a38', 0.1, 0.4)}"/>` + [0.15, 0.35, 0.5, 0.65, 0.85].map((f) => `<rect x="${f * 1080 - 10}" y="1380" width="20" height="${220 + 60 * wave(t, 0.6, f * 9)}" fill="#ffc870" opacity="0.35" filter="url(#blur4)"/>`).join('')
      + `<path d="M260,1360 Q540,1180 820,1360 Z" fill="#0a0e20"/>`;
    const out = sky([[0, '#0e1430'], [1, '#2a2240']]) + bokeh(t, 36, 600, 1400, 5);
    const cab = windshieldShot(t, { outside: out, mood: 'night', rays: k,
      madO: { look: 0.6, lookUp: 0.1, frown: 0.2, blink: blink(t, 0.9), nod: wave(t, 0.5) * 1.2, arms: 'hold' },
      chaO: { look: -1, lookUp: 0.4, frown: 0.05, rot: -8, rx: 720, ry: 1500, blink: blink(t, 2.1), nod: wave(t, 0.3) * 0.6 } });
    return {
      cam: { z: lerp(1.0, 1.1, k), x: lerp(20, -20, k) },
      els: [layer(1 - a, seine + grade('#ff9a6a', 0.2)), layer(a * (1 - b), bridge), layer(b, cab + glow(330, 1000, 300, '#ffc070', 0.18)), topShade(600, 0.55)],
    };
  },

  // 7. Актёры: фото-стикер Лин Рено и Дани Буна поверх ночной улицы в огнях
  star(t, T) {
    const k = io(t / T);
    const els = [
      sky([[0, '#06081a'], [0.5, '#141a3a'], [1, '#0a0c1a']]),
      par(-t * 20, 0, bokeh(t, 60, 300, 1700, 33)),
      `<g filter="url(#blur8)" opacity="0.6">${par(-t * 10, 0, street(-100, 1500, 6, t, { seed: 41, fl: 7, fh: 120, lit: 1, c: '#8a7a6a' }))}</g>`,
      `<rect width="1080" height="1920" fill="#060818" opacity="0.35"/>`,
      sticker(t),
      topShade(560, 0.5),
    ];
    return { cam: { z: lerp(1.0, 1.06, k) }, els };
  },

  // 8. Ночь: одно такси на пустой улице под фонарями, камера поднимается над крышами
  question(t, T) {
    const k = io(t / T), rise = io(clamp((t - 0.6) / (T - 0.6)));
    const els = [
      sky([[0, '#05081a'], [0.5, '#121a40'], [1, '#2a2a50']]),
      Array.from({ length: 50 }, (_, i) => { reseed(i + 200); return `<circle cx="${rnd() * 1080}" cy="${rnd() * 700}" r="${rnd() < 0.1 ? 2.5 : 1.3}" fill="#fff" opacity="${0.3 + 0.5 * rnd()}"/>`; }).join(''),
      par(0, rise * 140, eiffel(800, 1000, 760, 1)),
      par(0, rise * 260, street(-120, 1150, 6, t, { seed: 51, fl: 6, fh: 100, lit: 0.6, c: '#a8987e' }) + cobbles(1150, 1920, '#3a3a44')
        + [120, 540, 960].map((x) => lamp(x, 1300, 380, 1)).join('')
        + taxi(lerp(80, 820, k), 1420, 0.75, t, { night: true, c: '#1a1c20', win: '#ffd890', inside: `<circle cx="-120" cy="-200" r="22" fill="#f0c8b0"/><circle cx="-120" cy="-214" r="22" fill="#eeebe4"/>` })),
      `<rect width="1080" height="1920" fill="#0a1030" opacity="0.15"/>`,
      topShade(640, 0.5),
    ];
    return { cam: { z: lerp(1.15, 1.0, k), y: lerp(40, -60, rise) }, els };
  },
};

// ---- фото-стикер героев: грузим заранее в data URL ----
const IMG = {};
try {
  const b = await (await fetch('/public/assets/driving-madeleine/heroes-cut.png')).blob();
  IMG.heroes = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
} catch { IMG.heroes = ''; }
function sticker(t) {
  const s = { x: 540, y: 1180, w: 900, h: 900, at: D + 0.87, tilt: -3 };
  const dt = t - s.at;
  if (dt < 0 || !IMG.heroes) return '';
  const f = dt * 30;
  const pop = f < 6 ? lerp(0.2, 1.12, f / 6) : f < 10 ? lerp(1.12, 0.96, (f - 6) / 4) : f < 14 ? lerp(0.96, 1, (f - 10) / 4) : 1;
  const wob = wave(t, 0.35) * 2.0, bob = wave(t, 0.25) * 7;
  def(`<filter id="stk" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="10" result="dil"/><feFlood flood-color="#ffffff"/><feComposite in2="dil" operator="in" result="outline"/><feGaussianBlur in="dil" stdDeviation="12" result="blur"/><feOffset in="blur" dx="8" dy="16" result="sh"/><feFlood flood-color="#000" flood-opacity="0.55"/><feComposite in2="sh" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  return `<g transform="translate(${s.x} ${s.y + bob}) rotate(${s.tilt + wob}) scale(${pop})" opacity="${clamp(f / 3)}"><image href="${IMG.heroes}" x="${-s.w / 2}" y="${-s.h / 2}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid meet" filter="url(#stk)"/></g>`;
}

run(shots);
