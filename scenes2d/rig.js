// Риг персонажа v2 для 2D-вектора: суставы (локти, колени), кисти с большим пальцем, поворот головы и тела на 3/4,
// мимика (брови, веки, формы рта, разговор), контровой свет и падающая тень. Старый person() из core.js не трогаем —
// он нужен для пересборки прошлых роликов.
//
// figure(x, y, s, o) — x,y: середина низа фигуры (стопы; для pose 'sit' — таз), s — масштаб (рост стоя ≈ 900*s).
// o: skin, hair, hairStyle ('curly'|'bob'|'short'|'bald'), shirt, pants, shoes, collar ('open'|'round'|'none'),
//    sleeves ('short'|'long'), pattern(clipId) → svg узора поверх рубашки (обрезается по торсу),
//    turn (-1..1: поворот тела, + вправо), headTurn (поворот головы, по умолчанию = turn), tilt (наклон головы, °),
//    lean (наклон корпуса, °), breathe (0..1), pose ('stand'|'sit'|'bust'), knees ([l, r] сгиб ног для шага),
//    hands: {l: {x, y, pose, item, rot}, r: {...}} — абсолютные цели кистей (иначе руки опущены); pose: 'open'|'fist'|'hold'|'point'|'wave',
//    expr: имя ('neutral'|'smirk'|'tired'|'think'|'smile'|'grin'|'surprised'|'angry'|'sad'|'laugh') или объект с полями ниже,
//    brows:[л,п] подъём −1..1, browTilt (+ злые/− грустные), lid 0..1 (закрыто), mouth ('flat'|'smile'|'smirk'|'grin'|'o'|'frown'|'laugh'),
//    talk 0..1 (рот открыт под речь), look {x, y} −1..1, blink (bool), stubble, earrings, lips,
//    rim {c, dx, dy, op} — контровой свет (по умолчанию справа-сверху тёплый), shadow (тень на полу), hairLag (−1..1: волосы отстают при движении).
import { V, R, grad, glow, shade, clamp, lerp, def } from './core.js';

let cid = 0;
const clip = (d) => { const id = 'rc' + (cid++); def(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return id; };
const rad = (a) => a * Math.PI / 180, deg = (a) => a * 180 / Math.PI;
const f = (n) => +n.toFixed(1);

// форма с контровым светом: заливка + светящийся серп по краю со стороны света
function lit(d, fill, rim, extra = '') {
  if (!rim) return `<path d="${d}" fill="${fill}" ${extra}/>`;
  const id = clip(d);
  return `<path d="${d}" fill="${rim.c}" opacity="${rim.op ?? 1}" ${extra}/><g clip-path="url(#${id})"><path d="${d}" fill="${fill}" transform="translate(${-rim.dx} ${-rim.dy})"/></g>`;
}

const EXPR = {
  neutral: { brows: [0, 0], browTilt: 0, lid: 0.12, mouth: 'flat' },
  smirk: { brows: [0.35, -0.1], browTilt: 0.05, lid: 0.38, mouth: 'smirk' },
  tired: { brows: [-0.05, -0.05], browTilt: -0.35, lid: 0.48, mouth: 'flat' },
  think: { brows: [0.55, -0.25], browTilt: 0.1, lid: 0.3, mouth: 'pursed', look: { x: 0.6, y: 0.7 } },
  smile: { brows: [0.15, 0.15], browTilt: -0.1, lid: 0.15, mouth: 'smile' },
  grin: { brows: [0.3, 0.3], browTilt: -0.1, lid: 0.25, mouth: 'grin' },
  laugh: { brows: [0.35, 0.35], browTilt: -0.2, lid: 0.7, mouth: 'laugh' },
  surprised: { brows: [0.8, 0.8], browTilt: -0.1, lid: 0, mouth: 'o' },
  angry: { brows: [-0.35, -0.35], browTilt: 0.8, lid: 0.25, mouth: 'frown' },
  sad: { brows: [0.25, 0.25], browTilt: -0.8, lid: 0.35, mouth: 'frown' },
};
// плавный переход между двумя выражениями (числа смешиваются, рот — по порогу)
export function mixExpr(a, b, k) {
  const A = typeof a === 'string' ? EXPR[a] : a, B = typeof b === 'string' ? EXPR[b] : b;
  k = clamp(k);
  const la = A.look || { x: 0, y: 0 }, lb = B.look || { x: 0, y: 0 };
  return {
    brows: [lerp(A.brows[0], B.brows[0], k), lerp(A.brows[1], B.brows[1], k)], browTilt: lerp(A.browTilt, B.browTilt, k),
    lid: lerp(A.lid, B.lid, k), mouth: k < 0.5 ? A.mouth : B.mouth, look: { x: lerp(la.x, lb.x, k), y: lerp(la.y, lb.y, k) },
  };
}

// двухзвенная конечность: от корня к цели, сгиб в сторону bend (±1)
function ik(ax, ay, tx, ty, l1, l2, bend, pref) {
  if (pref) { // pref = [px, py]: выбрать сгиб, при котором сустав ближе к этому направлению
    const A = ik(ax, ay, tx, ty, l1, l2, 1), B = ik(ax, ay, tx, ty, l1, l2, -1);
    const sc = (J) => (J.ex - ax) * pref[0] + (J.ey - ay) * pref[1];
    return sc(A) >= sc(B) ? A : B;
  }
  let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy);
  const max = (l1 + l2) * 0.995;
  if (d > max) { tx = ax + dx / d * max; ty = ay + dy / d * max; dx = tx - ax; dy = ty - ay; d = max; }
  const a = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const a1 = a + bend * Math.acos(c);
  const ex = ax + Math.cos(a1) * l1, ey = ay + Math.sin(a1) * l1;
  return { ex, ey, tx, ty, ang: Math.atan2(ty - ey, tx - ex) };
}
// конечность — плавная «трубка» через сустав
const limb = (ax, ay, ex, ey, tx, ty, w1, w2, c) =>
  `<path d="M${f(ax)},${f(ay)} L${f(ex)},${f(ey)}" stroke="${c}" stroke-width="${f(w1 * 2)}" stroke-linecap="round"/><path d="M${f(ex)},${f(ey)} L${f(tx)},${f(ty)}" stroke="${c}" stroke-width="${f((w1 + w2))}" stroke-linecap="round"/>`;

// кисть-варежка: ладонь с пальцами одним мягким контуром + большой палец; item — предмет в руке (между ладонью и пальцами)
function hand(x, y, ang, s, skin, side, o = {}) {
  const pose = o.pose || 'open', k = s;
  const dark = shade(skin, -0.2), fill = R(skin, 0.12, 0.15);
  let g = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg(ang) + (o.rot || 0))}) scale(1 ${side})">`;
  const thumb = (cx, cy, a) => `<ellipse cx="${f(cx * k)}" cy="${f(cy * k)}" rx="${f(13 * k)}" ry="${f(8.5 * k)}" fill="${fill}" transform="rotate(${a} ${f(cx * k)} ${f(cy * k)})"/>`;
  if (pose === 'fist' || pose === 'hold') {
    g += `<ellipse cx="${f(16 * k)}" cy="0" rx="${f(24 * k)}" ry="${f(21 * k)}" fill="${fill}"/>`;
    if (o.item) g += typeof o.item === 'function' ? `<g transform="translate(${18 * k} 0) scale(1 ${side}) rotate(${f(-(deg(ang) + (o.rot || 0)) * side)})">${o.item(k)}</g>` : o.item;
    g += `<path d="M${f(20 * k)},${f(-18 * k)} q${f(20 * k)},${f(4 * k)} ${f(19 * k)},${f(18 * k)} q0,${f(15 * k)} ${f(-19 * k)},${f(18 * k)}" fill="${fill}" stroke="${dark}" stroke-width="${f(1.6 * k)}"/>`;
    g += thumb(22, -17, -25);
  } else if (pose === 'point') {
    g += `<ellipse cx="${f(16 * k)}" cy="${f(2 * k)}" rx="${f(23 * k)}" ry="${f(19 * k)}" fill="${fill}"/>`;
    g += `<rect x="${f(26 * k)}" y="${f(-14 * k)}" width="${f(38 * k)}" height="${f(13 * k)}" rx="${f(6.5 * k)}" fill="${fill}"/>`;
    g += thumb(18, -18, -30);
  } else { // open / wave: варежка, лёгкие линии между пальцами
    const sp = pose === 'wave' ? 1.25 : 1;
    g += `<path d="M${f(-2 * k)},${f(-17 * k)} Q${f(30 * k)},${f(-24 * k * sp)} ${f(50 * k)},${f(-8 * k * sp)} Q${f(60 * k)},0 ${f(50 * k)},${f(8 * k * sp)} Q${f(30 * k)},${f(24 * k * sp)} ${f(-2 * k)},${f(17 * k)} Z" fill="${fill}"/>`;
    g += [-6, 2, 9].map((d) => `<path d="M${f(34 * k)},${f(d * k * sp)} L${f(50 * k)},${f(d * 1.25 * k * sp)}" stroke="${dark}" stroke-width="${f(1.5 * k)}" stroke-linecap="round" opacity="0.55"/>`).join('');
    g += thumb(14, -19, -40);
    if (o.item) g += typeof o.item === 'function' ? `<g transform="translate(${18 * k} 0) scale(1 ${side}) rotate(${f(-(deg(ang) + (o.rot || 0)) * side)})">${o.item(k)}</g>` : o.item;
  }
  return g + '</g>';
}

// ---------- голова ----------
// hx,hy — центр головы; hr — «радиус»; turn −1..1
export function head(hx, hy, hr, o) {
  const tu = clamp(o.headTurn ?? o.turn ?? 0, -1, 1), skin = o.skin || '#e2b08a', hairC = o.hair || '#2a1e18';
  const e = { ...EXPR.neutral, ...(typeof o.expr === 'string' ? EXPR[o.expr] : o.expr || {}) };
  if (o.lid != null) e.lid = o.lid;
  const look = { x: 0, y: 0, ...(e.look || {}), ...(o.look || {}) };
  const rim = o.rim === false ? null : { c: shade(skin, 0.45), dx: 9 * hr / 90, dy: -4 * hr / 90, op: 0.95, ...(o.rim || {}) };
  const fx = hx + tu * 0.26 * hr; // центр лица смещается в сторону поворота
  let g = '';
  if (o.back) { // вид со спины: затылок, уши, волосы
    g += `<path d="M${hx - 0.34 * hr},${hy + 0.5 * hr} L${hx - 0.32 * hr},${hy + 1.45 * hr} L${hx + 0.32 * hr},${hy + 1.45 * hr} L${hx + 0.34 * hr},${hy + 0.5 * hr} Z" fill="${shade(skin, -0.2)}"/>`;
    [-1, 1].forEach((sd) => g += `<ellipse cx="${hx + sd * 0.9 * hr}" cy="${hy + 0.08 * hr}" rx="${0.14 * hr}" ry="${0.22 * hr}" fill="${shade(skin, -0.12)}"/>`);
    g += `<ellipse cx="${hx}" cy="${hy}" rx="${0.92 * hr}" ry="${1.02 * hr}" fill="${shade(skin, -0.1)}"/>`;
    if (o.hairStyle === 'curly') { const cs = [[-0.7, -0.6, 0.36], [-0.25, -0.9, 0.4], [0.25, -0.9, 0.4], [0.7, -0.6, 0.36], [-0.8, -0.1, 0.32], [0.8, -0.1, 0.32], [-0.4, -0.3, 0.42], [0.4, -0.3, 0.42], [0, -0.5, 0.42], [-0.45, 0.25, 0.34], [0.45, 0.25, 0.34], [0, 0.2, 0.38]]; g += cs.map(([dx, dy, r]) => `<circle cx="${f(hx + dx * hr)}" cy="${f(hy + dy * hr)}" r="${f(r * hr)}" fill="${R(shade(hairC, 0.05), 0.18, 0.3)}"/>`).join(''); }
    else g += `<path d="M${hx - 1.02 * hr},${hy + (o.hairStyle === 'bob' ? 0.95 : 0.35) * hr} Q${hx - 1.1 * hr},${hy - 1.15 * hr} ${hx},${hy - 1.12 * hr} Q${hx + 1.1 * hr},${hy - 1.15 * hr} ${hx + 1.02 * hr},${hy + (o.hairStyle === 'bob' ? 0.95 : 0.35) * hr} Q${hx},${hy + (o.hairStyle === 'bob' ? 1.08 : 0.55) * hr} ${hx - 1.02 * hr},${hy + (o.hairStyle === 'bob' ? 0.95 : 0.35) * hr} Z" fill="${V(hairC, 0.15, 0.25)}"/>`;
    return g;
  }
  // задние волосы
  if (o.hairStyle === 'bob') g += `<path d="M${hx - 1.08 * hr},${hy + 0.9 * hr} Q${hx - 1.25 * hr},${hy - 1.25 * hr} ${hx},${hy - 1.18 * hr} Q${hx + 1.25 * hr},${hy - 1.25 * hr} ${hx + 1.08 * hr},${hy + 0.9 * hr} Q${hx},${hy + 1.05 * hr} ${hx - 1.08 * hr},${hy + 0.9 * hr} Z" fill="${V(hairC, 0.12, 0.25)}"/>`;
  // шея
  g += `<path d="M${hx - 0.34 * hr},${hy + 0.6 * hr} L${hx - 0.32 * hr},${hy + 1.45 * hr} L${hx + 0.32 * hr},${hy + 1.45 * hr} L${hx + 0.34 * hr},${hy + 0.6 * hr} Z" fill="${shade(skin, -0.14)}"/>`;
  // уши (дальнее прячется при повороте)
  [-1, 1].forEach((sd) => {
    const vis = 1 - clamp(sd * tu * 2.2 - 0.3);
    if (vis <= 0.05 || o.hairStyle === 'bob') return;
    const ex = hx + sd * 0.9 * hr - tu * 0.18 * hr;
    g += `<ellipse cx="${f(ex)}" cy="${hy + 0.08 * hr}" rx="${f(0.16 * hr * vis)}" ry="${0.24 * hr}" fill="${shade(skin, -0.06)}"/><path d="M${f(ex + sd * 0.04 * hr)},${hy - 0.04 * hr} q${f(sd * 0.06 * hr)},${0.12 * hr} 0,${0.22 * hr}" stroke="${shade(skin, -0.3)}" stroke-width="${0.03 * hr}" fill="none" opacity="${vis}"/>`;
  });
  // овал лица: лоб шире, мягкая скула, подбородок смещается с поворотом
  const cx = hx + tu * 0.12 * hr;
  const d = `M${hx - 0.9 * hr},${hy - 0.15 * hr} C${hx - 0.94 * hr},${hy - 1.18 * hr} ${hx + 0.94 * hr},${hy - 1.18 * hr} ${hx + 0.9 * hr},${hy - 0.15 * hr} C${hx + 0.9 * hr - tu * 0.1 * hr},${hy + 0.5 * hr} ${cx + 0.5 * hr},${hy + 1.02 * hr} ${cx},${hy + 1.04 * hr} C${cx - 0.5 * hr},${hy + 1.02 * hr} ${hx - 0.9 * hr - tu * 0.1 * hr},${hy + 0.5 * hr} ${hx - 0.9 * hr},${hy - 0.15 * hr} Z`;
  const shadeGrad = grad([[0, shade(skin, rim ? -0.16 : -0.05)], [0.5, skin], [1, shade(skin, 0.08)]], false);
  g += lit(d, shadeGrad, rim);
  const faceClip = clip(d);
  // мягкая тень под скулой с дальней стороны и румянец
  g += `<g clip-path="url(#${faceClip})">` + glow(hx - (tu >= 0 ? 1 : -1) * 0.85 * hr, hy + 0.45 * hr, 0.6 * hr, shade(skin, -0.35), 0.35);
  if (o.stubble) g += `<path d="M${hx - 0.95 * hr},${hy + 0.25 * hr} Q${cx},${hy + 0.75 * hr} ${hx + 0.95 * hr},${hy + 0.25 * hr} L${hx + hr},${hy + 1.2 * hr} L${hx - hr},${hy + 1.2 * hr} Z" fill="${o.stubble === true ? '#4a3a30' : o.stubble}" opacity="0.1"/>`;
  g += `</g>`;
  [-1, 1].forEach((sd) => g += `<ellipse cx="${f(fx + sd * 0.52 * hr * (1 - sd * tu * 0.3))}" cy="${hy + 0.38 * hr}" rx="${0.17 * hr}" ry="${0.09 * hr}" fill="#ff7c74" opacity="0.22"/>`);
  // глаза
  const ey = hy + 0.02 * hr - (look.y || 0) * 0.01 * hr;
  const lid = o.blink ? 1 : clamp(e.lid);
  [-1, 1].forEach((sd) => {
    const sq = 1 - clamp(-sd * tu) * 0.32; // дальний глаз уже
    const ex = fx + sd * 0.36 * hr * (1 - sd * tu * 0.25), rx = 0.235 * hr * sq, ry = 0.2 * hr;
    const eye = `M${f(ex - rx)},${f(ey)} Q${f(ex)},${f(ey - ry * 1.35)} ${f(ex + rx)},${f(ey)} Q${f(ex)},${f(ey + ry * 1.1)} ${f(ex - rx)},${f(ey)} Z`;
    const ec = clip(eye);
    const px = ex + (look.x || 0) * rx * 0.45 + tu * rx * 0.2, py = ey - (look.y || 0) * ry * 0.35 + ry * 0.05;
    g += `<path d="${eye}" fill="#fbfaf3"/><g clip-path="url(#${ec})"><circle cx="${f(px)}" cy="${f(py)}" r="${f(ry * 0.78)}" fill="${o.iris || '#4a3422'}"/><circle cx="${f(px)}" cy="${f(py)}" r="${f(ry * 0.4)}" fill="#120a06"/><circle cx="${f(px + ry * 0.25)}" cy="${f(py - ry * 0.3)}" r="${f(ry * 0.18)}" fill="#fff"/>`;
    // веко сверху: кожа опускается по lid
    const ly = ey - ry * 1.35 + lid * ry * 2.5;
    g += `<rect x="${f(ex - rx - 2)}" y="${f(ey - ry * 2)}" width="${f(rx * 2 + 4)}" height="${f(Math.max(0, ly - (ey - ry * 2)))}" fill="${shade(skin, -0.08)}"/>`;
    g += `<path d="M${f(ex - rx - 2)},${f(ly)} L${f(ex + rx + 2)},${f(ly)}" stroke="${shade(skin, -0.4)}" stroke-width="${f(0.035 * hr)}" opacity="${lid > 0.05 ? 1 : 0}"/></g>`;
    // ресничная линия
    if (lid < 0.95) g += `<path d="M${f(ex - rx * 1.05)},${f(ey + 0.01 * hr)} Q${f(ex)},${f(Math.max(ey - ry * 1.4, ly - ry * 0.12))} ${f(ex + rx * 1.08)},${f(ey - 0.02 * hr)}" stroke="#2a1a14" stroke-width="${f(0.045 * hr)}" fill="none" stroke-linecap="round"/>`;
    else g += `<path d="M${f(ex - rx)},${f(ey + 0.02 * hr)} Q${f(ex)},${f(ey + ry * 0.6)} ${f(ex + rx)},${f(ey + 0.02 * hr)}" stroke="#2a1a14" stroke-width="${f(0.045 * hr)}" fill="none" stroke-linecap="round"/>`;
    // бровь: подъём и наклон (внутренний край вниз = злость)
    const up = e.brows[sd < 0 ? 0 : 1] * 0.16 * hr, tilt = e.browTilt * 0.08 * hr;
    const bx0 = ex - sd * rx * 1.05, bx1 = ex + sd * rx * 1.2, by = ey - 0.36 * hr - up;
    g += `<path d="M${f(bx0)},${f(by + tilt)} Q${f(ex)},${f(by - 0.07 * hr - tilt * 0.3)} ${f(bx1)},${f(by - tilt * 0.4 + 0.02 * hr)}" stroke="${o.browC || hairC}" stroke-width="${f(0.085 * hr * sq)}" fill="none" stroke-linecap="round"/>`;
  });
  // нос: выступает сильнее при повороте
  const nx = fx + tu * 0.1 * hr, ny = hy + 0.3 * hr;
  g += `<path d="M${f(nx - tu * 0.02 * hr)},${f(hy + 0.02 * hr)} Q${f(nx + tu * 0.16 * hr + 0.01 * hr)},${f(ny)} ${f(nx + tu * 0.05 * hr)},${f(ny + 0.05 * hr)}" stroke="${shade(skin, -0.25)}" stroke-width="${f(0.035 * hr)}" fill="none" stroke-linecap="round" opacity="${0.4 + Math.abs(tu) * 0.5}"/>`;
  g += `<ellipse cx="${f(nx)}" cy="${f(ny + 0.03 * hr)}" rx="${0.11 * hr}" ry="${0.07 * hr}" fill="${shade(skin, -0.16)}"/><ellipse cx="${f(nx - 0.02 * hr)}" cy="${f(ny - 0.01 * hr)}" rx="${0.04 * hr}" ry="${0.025 * hr}" fill="#fff" opacity="0.3"/>`;
  // рот
  const mx = fx + tu * 0.06 * hr, my = hy + 0.6 * hr, mw = 0.29 * hr * (1 - Math.abs(tu) * 0.15), talk = clamp(o.talk || 0);
  const lipC = o.lips || shade(skin, -0.38), inside = '#6a2226';
  const m = e.mouth;
  if (talk > 0.05 || m === 'o' || m === 'grin' || m === 'laugh') {
    const open = m === 'laugh' ? 0.75 : m === 'grin' ? 0.35 : m === 'o' ? 0.6 : 0;
    const op = Math.max(open, talk * 0.7), w = m === 'o' ? mw * 0.55 : m === 'laugh' || m === 'grin' ? mw * 1.25 : mw * (0.8 - talk * 0.2);
    const cy0 = my - (m === 'grin' || m === 'laugh' ? 0.04 * hr : 0), hgt = 0.06 * hr + op * 0.22 * hr;
    const up = m === 'grin' || m === 'laugh' ? -0.06 * hr : 0;
    const md = `M${f(mx - w)},${f(cy0 + up)} Q${f(mx)},${f(cy0 - hgt * 0.25)} ${f(mx + w)},${f(cy0 + up)} Q${f(mx)},${f(cy0 + hgt * 1.4)} ${f(mx - w)},${f(cy0 + up)} Z`;
    const mc = clip(md);
    g += `<path d="${md}" fill="${inside}"/><g clip-path="url(#${mc})"><rect x="${f(mx - w)}" y="${f(cy0 - hgt)}" width="${f(w * 2)}" height="${f(hgt * 0.85)}" fill="#fbf6ee"/><ellipse cx="${f(mx)}" cy="${f(cy0 + hgt * 1.1)}" rx="${f(w * 0.6)}" ry="${f(hgt * 0.5)}" fill="#c0505a"/></g>`;
    g += `<path d="${md}" fill="none" stroke="${lipC}" stroke-width="${f(0.03 * hr)}"/>`;
  } else {
    const c = m === 'smile' ? 0.1 : m === 'frown' ? -0.08 : m === 'pursed' ? 0.02 : 0.025;
    const lx = mx - (m === 'pursed' ? mw * 0.5 : mw), rx2 = mx + (m === 'pursed' ? mw * 0.3 : mw);
    const ly = my - (m === 'smirk' ? -0.02 : c * 0.6) * hr, ry2 = my - (m === 'smirk' ? 0.1 : c * 0.6) * hr;
    g += `<path d="M${f(lx)},${f(ly)} Q${f(mx)},${f(my + c * hr)} ${f(rx2)},${f(ry2)}" stroke="${lipC}" stroke-width="${f(0.05 * hr)}" fill="none" stroke-linecap="round"/>`;
    if (m === 'smirk') g += `<path d="M${f(rx2 + 0.02 * hr)},${f(ry2 - 0.04 * hr)} q${f(0.04 * hr)},${f(0.04 * hr)} ${f(0.01 * hr)},${f(0.1 * hr)}" stroke="${shade(skin, -0.25)}" stroke-width="${f(0.025 * hr)}" fill="none" stroke-linecap="round"/>`;
    if (o.lips) g += `<path d="M${f(lx + 0.04 * hr)},${f(ly + 0.02 * hr)} Q${f(mx)},${f(my + c * hr + 0.07 * hr)} ${f(rx2 - 0.04 * hr)},${f(ry2 + 0.02 * hr)}" stroke="${o.lips}" stroke-width="${f(0.04 * hr)}" fill="none" stroke-linecap="round" opacity="0.6"/>`;
  }
  // серьги
  if (o.earrings) [-1, 1].forEach((sd) => { if (sd * tu < 0.5) g += `<circle cx="${f(hx + sd * 0.9 * hr - tu * 0.15 * hr)}" cy="${hy + 0.42 * hr}" r="${0.07 * hr}" fill="${R(o.earrings, 0.35, 0.3)}"/>`; });
  // передние волосы
  const lag = (o.hairLag || 0) * 0.08 * hr;
  if (o.hairStyle === 'curly') {
    const curls = [[-0.85, -0.45, 0.3], [-0.62, -0.85, 0.34], [-0.22, -1.05, 0.36], [0.2, -1.07, 0.36], [0.6, -0.9, 0.34], [0.86, -0.5, 0.28], [0.95, -0.12, 0.2], [-0.95, -0.12, 0.2], [-0.35, -0.72, 0.28], [0.15, -0.75, 0.28], [0.5, -0.65, 0.22], [-0.65, -0.55, 0.22]];
    const base = shade(hairC, 0.05);
    g += `<g>${curls.map(([dx, dy, r], i) => { const x = hx + dx * hr + tu * 0.12 * hr + lag * (1 + dy), y = hy + dy * hr; return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * hr)}" fill="${R(base, 0.18, 0.3)}"/>`; }).join('')}`;
    // блики-завитки со стороны света
    g += curls.slice(0, 7).map(([dx, dy, r]) => `<path d="M${f(hx + dx * hr + tu * 0.12 * hr + r * hr * 0.1 + lag)},${f(hy + dy * hr - r * hr * 0.45)} a${f(r * hr * 0.5)} ${f(r * hr * 0.5)} 0 0 1 ${f(r * hr * 0.45)} ${f(r * hr * 0.35)}" stroke="${shade(hairC, 0.45)}" stroke-width="${f(0.03 * hr)}" fill="none" stroke-linecap="round" opacity="0.7"/>`).join('');
    // прядь на лоб
    g += `<path d="M${f(hx - 0.15 * hr + tu * 0.2 * hr + lag)},${f(hy - 0.72 * hr)} q${f(0.12 * hr)},${f(0.22 * hr)} ${f(0.0)},${f(0.4 * hr)} q${f(-0.05 * hr)},${f(0.04 * hr)} ${f(-0.06 * hr)},0" stroke="${hairC}" stroke-width="${f(0.07 * hr)}" fill="none" stroke-linecap="round"/></g>`;
  } else if (o.hairStyle === 'bob') {
    const part = hx + tu * 0.2 * hr + 0.15 * hr;
    g += `<path d="M${hx - 0.98 * hr},${hy + 0.5 * hr} Q${hx - 1.05 * hr},${hy - 1.1 * hr} ${f(part)},${hy - 1.02 * hr} Q${f(part - 0.35 * hr + lag)},${hy - 0.55 * hr} ${hx - 0.82 * hr},${hy + 0.1 * hr} Z" fill="${V(hairC, 0.18, 0.15)}"/>`;
    g += `<path d="M${f(part)},${hy - 1.02 * hr} Q${hx + 1.05 * hr},${hy - 1.0 * hr} ${hx + 0.98 * hr},${hy + 0.5 * hr} L${hx + 0.84 * hr},${hy + 0.05 * hr} Q${f(part + 0.4 * hr + lag)},${hy - 0.6 * hr} ${f(part)},${hy - 1.02 * hr} Z" fill="${V(hairC, 0.18, 0.15)}"/>`;
    g += `<path d="M${f(part - 0.4 * hr)},${hy - 0.88 * hr} Q${f(part)},${hy - 1.0 * hr} ${f(part + 0.45 * hr)},${hy - 0.86 * hr}" stroke="${shade(hairC, 0.45)}" stroke-width="${0.04 * hr}" fill="none" stroke-linecap="round" opacity="0.6"/>`;
  } else if (o.hairStyle !== 'bald') {
    g += `<path d="M${hx - 0.93 * hr},${hy - 0.1 * hr} Q${hx - 0.95 * hr},${hy - 1.15 * hr} ${hx},${hy - 1.12 * hr} Q${hx + 0.95 * hr},${hy - 1.15 * hr} ${hx + 0.93 * hr},${hy - 0.1 * hr} Q${hx + 0.75 * hr},${hy - 0.6 * hr} ${f(hx + tu * 0.2 * hr + lag)},${hy - 0.62 * hr} Q${hx - 0.75 * hr},${hy - 0.6 * hr} ${hx - 0.93 * hr},${hy - 0.1 * hr} Z" fill="${V(hairC, 0.15, 0.2)}"/>`;
  }
  // тёмные очки: 'up' — подняты на лоб, 'on' — на глазах
  if (o.shades) {
    const sy = o.shades === 'up' ? hy - 0.86 * hr : ey - 0.05 * hr;
    g += [-1, 1].map((sd) => { const ex = fx + sd * 0.36 * hr * (1 - sd * tu * 0.25), w = 0.3 * hr * (1 - clamp(-sd * tu) * 0.3); return `<rect x="${f(ex - w)}" y="${f(sy - 0.17 * hr)}" width="${f(w * 2)}" height="${f(0.36 * hr)}" rx="${f(0.14 * hr)}" fill="${V('#1a1a22', 0.3, 0.2)}"/><path d="M${f(ex - w * 0.5)},${f(sy - 0.08 * hr)} l${f(0.14 * hr)},${f(-0.04 * hr)}" stroke="#fff" stroke-width="${f(0.04 * hr)}" opacity="0.5"/>`; }).join('');
    g += `<path d="M${f(fx - 0.09 * hr)},${f(sy - 0.06 * hr)} q${f(0.09 * hr)},${f(-0.06 * hr)} ${f(0.18 * hr)},0" stroke="#1a1a22" stroke-width="${f(0.05 * hr)}" fill="none"/>`;
  }
  return g;
}

// ---------- фигура ----------
export function figure(x, y, s, o = {}) {
  const tu = clamp(o.turn ?? 0, -1, 1), skin = o.skin || '#e2b08a', sh = o.shirt || '#5a7aa8', pants = o.pants || '#2a3040';
  const pose = o.pose || 'stand', br = (o.breathe ?? 0) * 6 * s;
  const rim = o.rim === false ? null : { c: shade(sh, 0.4), dx: 10 * s, dy: -4 * s, op: 1, ...(o.rim || {}) };
  const legL = pose === 'stand' ? 430 * s * (o.legs ?? 0.85) : 0;
  const hipY = y - legL, shY = hipY - 300 * s - br, sw = 112 * s, ww = 92 * s;
  const hr = 96 * s * (o.head ?? 1.3);
  let back = '', body = '', front = '';
  // падающая тень
  if (o.shadow !== false && pose === 'stand') back += `<ellipse cx="${x + 40 * s}" cy="${y + 6 * s}" rx="${170 * s}" ry="${26 * s}" fill="#000" opacity="${o.shadowOp ?? 0.22}" filter="url(#blur4)"/>`;
  // ноги с коленями
  if (pose === 'stand') {
    const kn = o.knees || [0, 0];
    [-1, 1].forEach((sd, i) => {
      const hx = x + sd * 44 * s + tu * 10 * s, fx = hx + kn[i] * 40 * s, fy = y - 30 * s - Math.max(0, kn[i]) * 30 * s;
      const L = ik(hx, hipY, fx, fy, 201 * s * (o.legs ?? 0.85), 201 * s * (o.legs ?? 0.85), 0, [sd * 0.3 + kn[i], -0.2]);
      body += limb(hx, hipY, L.ex, L.ey, L.tx, L.ty, 34 * s, 26 * s, shade(pants, -0.05));
      body += `<path d="M${f(L.tx - 28 * s)},${f(L.ty + 4 * s)} q0,${-26 * s} ${30 * s},${-26 * s} l${18 * s},0 q${44 * s},0 ${44 * s},${30 * s} l0,${8 * s} l${-92 * s},0 Z" fill="${V(o.shoes || '#3a2a1c', 0.2, 0.2)}" transform="translate(${tu * 10 * s} 0)"/>`;
    });
  }
  if (o.skirt && pose === 'stand') { const sl = 300 * s * (o.legs ?? 0.85), fl = (o.flare ?? 0) * 30 * s; body += `<path d="M${f(x - ww)},${f(hipY - 10 * s)} L${f(x - ww * 1.55 - fl)},${f(hipY + sl)} Q${f(x)},${f(hipY + sl + 26 * s)} ${f(x + ww * 1.55 + fl)},${f(hipY + sl)} L${f(x + ww)},${f(hipY - 10 * s)} Z" fill="${V(o.skirt, 0.15, 0.3)}"/>`; }
  if (o.skirt && pose === 'sit') { body += `<path d="M${f(x - ww * 1.1)},${f(hipY - 10 * s)} L${f(x - ww * 1.7)},${f(hipY + 60 * s)} L${f(x + ww * 1.7)},${f(hipY + 60 * s)} L${f(x + ww * 1.1)},${f(hipY - 10 * s)} Z" fill="${V(o.skirt, 0.15, 0.3)}"/>`; }
  // сидя: голени вниз (стул, край бассейна); legsDown — длина до стопы в единицах s
  if (pose === 'sit' && o.legsDown) {
    [-1, 1].forEach((sd) => {
      const hx = x + sd * 46 * s, kx = x + sd * 56 * s, ky = hipY + 30 * s, fx = x + sd * 60 * s + (o.footSwing ? o.footSwing * sd * 20 * s : 0), fy = hipY + o.legsDown * s;
      body += `<path d="M${f(hx)},${f(hipY - 10 * s)} L${f(kx)},${f(ky)} L${f(fx)},${f(fy - 20 * s)}" stroke="${o.skirt ? shade(skin, -0.06) : shade(pants, -0.05)}" stroke-width="${f(54 * s)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
      if (!o.noFeet) body += `<ellipse cx="${f(fx + sd * 6 * s)}" cy="${f(fy)}" rx="${f(40 * s)}" ry="${f(20 * s)}" fill="${V(o.shoes || '#3a2a1c', 0.2, 0.2)}"/>`;
    });
  }
  // торс: плечи, талия; шов-планка смещается с поворотом
  const tx = x + tu * 8 * s;
  const torso = `M${f(tx - sw)},${f(shY + 40 * s)} Q${f(tx - sw)},${f(shY)} ${f(tx - sw + 50 * s)},${f(shY - 6 * s)} L${f(tx + sw - 50 * s)},${f(shY - 6 * s)} Q${f(tx + sw)},${f(shY)} ${f(tx + sw)},${f(shY + 40 * s)} L${f(x + ww)},${f(hipY + 10 * s)} Q${f(x)},${f(hipY + 24 * s)} ${f(x - ww)},${f(hipY + 10 * s)} Z`;
  body += lit(torso, grad([[0, shade(sh, -0.18)], [0.55, sh], [1, shade(sh, 0.1)]], false), rim);
  const tc = clip(torso);
  const px = x + tu * 40 * s; // планка/центр груди
  body += `<g clip-path="url(#${tc})">`;
  if (o.pattern) body += o.pattern(px, shY, hipY, s);
  if (o.collar === 'open' && !o.back) body += `<path d="M${f(px - 46 * s)},${f(shY - 8 * s)} L${f(px)},${f(shY + 120 * s)} L${f(px + 46 * s)},${f(shY - 8 * s)} Z" fill="${V(shade(skin, -0.04), 0.06, 0.12)}"/>`;
  if (o.collar === 'round' && !o.back) body += `<path d="M${f(px - 52 * s)},${f(shY - 8 * s)} Q${f(px)},${f(shY + 80 * s)} ${f(px + 52 * s)},${f(shY - 8 * s)} Z" fill="${V(shade(skin, -0.04), 0.06, 0.12)}"/>`;
  // складки ткани
  body += `<path d="M${f(px - 70 * s)},${f(hipY - 60 * s)} q${30 * s},${-20 * s} ${60 * s},${-6 * s} M${f(px + 30 * s)},${f(hipY - 40 * s)} q${30 * s},${-14 * s} ${50 * s},0" stroke="${shade(sh, -0.3)}" stroke-width="${3 * s}" fill="none" opacity="0.5"/>`;
  // тень от головы на груди
  body += `<ellipse cx="${f(px)}" cy="${f(shY + 4 * s)}" rx="${70 * s}" ry="${22 * s}" fill="#000" opacity="0.18" filter="url(#blur4)"/></g>`;
  if (o.collar === 'open' && !o.back) body += `<path d="M${f(px - 70 * s)},${f(shY - 12 * s)} L${f(px - 6 * s)},${f(shY + 110 * s)} L${f(px - 44 * s)},${f(shY + 40 * s)} L${f(px - 30 * s)},${f(shY - 8 * s)} Z M${f(px + 70 * s)},${f(shY - 12 * s)} L${f(px + 6 * s)},${f(shY + 110 * s)} L${f(px + 44 * s)},${f(shY + 40 * s)} L${f(px + 30 * s)},${f(shY - 8 * s)} Z" fill="${V(shade(sh, 0.12), 0.15, 0.2)}"/>`;
  if (pose === 'sit' && o.legsDown) body += `<ellipse cx="${f(x)}" cy="${f(hipY + 14 * s)}" rx="${f(ww * 1.25)}" ry="${f(40 * s)}" fill="${V(o.skirt || pants, 0.12, 0.2)}"/>`;
  // руки: плечо → локоть → кисть (IK), рукав до локтя или до кисти
  // плечо → кисть одной плавной дугой; локоть всегда смотрит наружу-вниз (полюс), поэтому не перескакивает
  const L1 = 158 * s, L2 = 150 * s;
  const arm = (sd) => {
    const ax = tx + sd * (sw - 18 * s), ay = shY + 30 * s, h = (o.hands || {})[sd < 0 ? 'l' : 'r'];
    const tgt = h ? [h.x, h.y] : [ax + sd * 22 * s, ay + 300 * s];
    const A = ik(ax, ay, tgt[0], tgt[1], L1, L2, 1), B = ik(ax, ay, tgt[0], tgt[1], L1, L2, -1);
    const px = ax + sd * 500 * s, py = ay + 420 * s; // полюс локтя
    const L = Math.hypot(A.ex - px, A.ey - py) <= Math.hypot(B.ex - px, B.ey - py) ? A : B;
    // кривая через локоть: контрольная точка = 2·локоть − середина
    const cx = 2 * L.ex - (ax + L.tx) / 2, cy = 2 * L.ey - (ay + L.ty) / 2;
    const q = (t) => [(1 - t) ** 2 * ax + 2 * t * (1 - t) * cx + t * t * L.tx, (1 - t) ** 2 * ay + 2 * t * (1 - t) * cy + t * t * L.ty];
    const part = (t0) => { const p1 = [lerp(ax, cx, t0), lerp(ay, cy, t0)], p2 = q(t0); return `M${f(ax)},${f(ay)} Q${f(p1[0])},${f(p1[1])} ${f(p2[0])},${f(p2[1])}`; };
    const full = `M${f(ax)},${f(ay)} Q${f(cx)},${f(cy)} ${f(L.tx)},${f(L.ty)}`;
    const endAng = Math.atan2(L.ty - cy, L.tx - cx);
    let a = '';
    if (o.sleeves === 'short') {
      a += `<path d="${full}" stroke="${shade(skin, -0.06)}" stroke-width="${f(40 * s)}" stroke-linecap="round" fill="none"/>`;
      a += `<path d="${part(0.42)}" stroke="${sh}" stroke-width="${f(58 * s)}" stroke-linecap="round" fill="none"/>`;
    } else {
      a += `<path d="${full}" stroke="${shade(sh, -0.05)}" stroke-width="${f(50 * s)}" stroke-linecap="round" fill="none"/>`;
      a += `<path d="${part(0.85)}" stroke="${shade(sh, 0.12)}" stroke-width="${f(14 * s)}" stroke-linecap="round" fill="none" opacity="0.3" transform="translate(${f(-sd * 8 * s)} ${f(-5 * s)})"/>`;
    }
    a += hand(L.tx, L.ty, endAng, s * 1.05, skin, sd < 0 ? -1 : 1, h || {});
    return { a, front: h?.front };
  };
  const AL = arm(-1), AR = arm(1);
  // голова поверх торса, руки поверх (или под — если рука за спиной)
  const hy = shY - hr * 1.18;
  const tilt = o.tilt || 0;
  const hd = `<g transform="rotate(${f(tilt)} ${f(x)} ${f(shY)})">${head(x + tu * 12 * s, hy, hr, { ...o, rim: o.rim === false ? false : { c: shade(skin, 0.45), dx: 9 * hr / 90, dy: -4 * hr / 90 } })}</g>`;
  const armsBehind = o.armsBehind ? AL.a + AR.a : '';
  const armsFront = o.armsBehind ? '' : (AL.front ? '' : AL.a) + (AR.front ? '' : AR.a);
  const armsTop = (AL.front ? AL.a : '') + (AR.front ? AR.a : '');
  const rot = o.lean ? ` transform="rotate(${f(o.lean)} ${f(x)} ${f(y)})"` : '';
  return `<g${rot} filter="url(#soft)">${back}${armsBehind}${body}${hd}${armsFront}${front}${armsTop}</g>`;
}
