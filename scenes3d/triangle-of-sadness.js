// «Треугольник печали» (Triangle of Sadness, 2022): 10 планов в стиле Пиксар.
// ?shot=yacht|date|deck|guests|swim|cabin|storm-dinner|harrelson|awards|dawn&dur=
import { THREE, P, scene, root, rnd, canvasTex, mat, add, sphere, box, capsule, limb, lathe, shade, woodTex, person, flick, ease, softTex, run } from './core.js';

const SHOT = P.get('shot') || 'yacht';
const HR = 0.15;
const breathe = (o, t, k = 1) => { o.scale.y = 1 + Math.sin(t * 2.2 * k) * 0.008; };
const shadowed = (l, size = 2048, r = 5) => { l.castShadow = true; l.shadow.mapSize.set(size, size); l.shadow.bias = -0.0005; l.shadow.radius = r; return l; };
const hemi = (sky, ground, i) => scene.add(new THREE.HemisphereLight(sky, ground, i));
const AD = 4 / 30; // AUDIO_DELAY: голос начинается через 4 кадра после начала плана

// ---------- небо, море ----------
function skyTex(stops, o = {}) {
  return canvasTex(512, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([p, c]) => gr.addColorStop(p, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (o.sun) { const [x, y, r, c] = o.sun; const s = g.createRadialGradient(w * x, h * y, 3, w * x, h * y, r); s.addColorStop(0, c); s.addColorStop(0.25, c.replace(/[\d.]+\)$/, '0.6)')); s.addColorStop(1, c.replace(/[\d.]+\)$/, '0)')); g.fillStyle = s; g.fillRect(0, 0, w, h); }
    g.filter = 'blur(10px)';
    (o.clouds || []).forEach(([x, y, rx, ry, c]) => { for (let k = 0; k < 7; k++) { g.fillStyle = c; g.beginPath(); g.ellipse(w * x + (rnd() - 0.5) * rx, h * y + (rnd() - 0.5) * ry * 0.8, rx * (0.4 + rnd() * 0.5), ry * (0.5 + rnd() * 0.5), 0, 0, 7); g.fill(); } });
    g.filter = 'none';
    if (o.stars) for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.6})`; g.fillRect(rnd() * w, rnd() * h * 0.5, 1.5, 1.5); }
  });
}
function skyPlane(tex, z = -22, w = 40, h = 50, y = 8) { add(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, fog: false }), [0, y, z], { cast: false, recv: false }); }
function sea(w, d, z, color, o = {}) {
  const g = new THREE.PlaneGeometry(w, d, 150, 110); g.userData.base = g.attributes.position.array.slice();
  add(g, mat(color, { physical: true, rough: o.rough ?? 0.15, clearcoat: o.cc ?? 0.9, emissive: color, ei: o.glow ?? 0.35 }), [0, 0, z], { rot: [-Math.PI / 2, 0, 0], cast: false });
  const A = o.amp ?? 1, S = o.speed ?? 1;
  return (t) => { const p = g.attributes.position, b = g.userData.base; for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; p.setZ(i, A * (Math.sin(x * 1.6 + y * 1.1 + t * 1.2 * S) * 0.05 + Math.sin(x * 4.3 - y * 3.1 + t * 2 * S) * 0.015 + Math.sin(y * 0.8 + t * 0.7 * S) * 0.06)); } p.needsUpdate = true; g.computeVertexNormals(); };
}
const glint = (x, z, color, w = 2.5, d = 14, op = 0.3) => add(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: softTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), [x, 0.08, z], { rot: [-Math.PI / 2, 0, 0], cast: false, recv: false });

// ---------- яхта: белый корпус, три палубы, тёмная полоса окон ----------
function yachtModel(parent, o = {}) {
  const y = new THREE.Group(); parent.add(y);
  const white = mat('#f4f2ee', { physical: true, rough: 0.25, clearcoat: 0.8 });
  const dark = mat('#1a2430', { physical: true, rough: 0.08, clearcoat: 1, emissive: o.lit ? '#ffb060' : '#000', ei: o.lit ? 0.5 : 1 });
  const hullG = new THREE.BoxGeometry(3.2, 0.55, 0.8, 40, 6, 8);
  { const p = hullG.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), yy = p.getY(i), z = p.getZ(i); const t = (yy + 0.275) / 0.55; z *= 0.55 + 0.45 * Math.sqrt(Math.max(0, t)); if (x > 0.7) z *= Math.max(0.02, 1 - ((x - 0.7) / 0.9) ** 1.6); if (x > 0.6) yy += (x - 0.6) * 0.12 * t; if (x < -1.4) z *= 0.95; p.setXYZ(i, x, yy, z); } hullG.computeVertexNormals(); }
  add(hullG, white, [0, 0.27, 0], { parent: y });
  add(box(3.0, 0.05, 0.02, 0.01), mat('#1d3a5c', { rough: 0.4 }), [-0.05, 0.12, 0.41], { parent: y }); // ватерлиния
  add(box(3.0, 0.05, 0.02, 0.01), mat('#1d3a5c', { rough: 0.4 }), [-0.05, 0.12, -0.41], { parent: y });
  add(box(2.6, 0.03, 0.74, 0.01), mat('#b48a5a', { map: woodTex, rough: 0.6 }), [-0.15, 0.56, 0], { parent: y }); // тик
  const tiers = [[2.0, 0.28, 0.66, -0.35, 0.57], [1.45, 0.24, 0.56, -0.5, 0.85], [0.85, 0.2, 0.46, -0.6, 1.09]];
  tiers.forEach(([w, h, d, x, yy]) => {
    add(box(w, h, d, 0.04), white, [x, yy + h / 2, 0], { parent: y });
    add(box(w * 0.86, h * 0.42, d + 0.01, 0.02), dark, [x + w * 0.04, yy + h * 0.55, 0], { parent: y });
    add(box(w + 0.12, 0.025, d + 0.08, 0.01), white, [x - 0.04, yy + h + 0.012, 0], { parent: y });
  });
  add(new THREE.CylinderGeometry(0.015, 0.02, 0.45, 8), white, [-0.6, 1.5, 0], { parent: y });
  add(sphere(0.06, 16, 12), white, [-0.6, 1.66, 0], { parent: y, scale: [1, 0.6, 1] });
  // леер на носу
  const rail = mat('#e8e8e8', { metal: 0.8, rough: 0.25 });
  [[0.75, 0.33], [1.15, 0.26], [1.45, 0.16]].forEach(([x, z]) => [-1, 1].forEach(s => add(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), rail, [x, 0.66, s * z], { parent: y, cast: false })));
  return y;
}

// ---------- герои ----------
// kind: carl, yaya, oligarch, oldman, oldlady, crew, captain, lady, guest
function hero(kind, o = {}) {
  const C = {
    carl: { robe: '#f2efe8', robe2: '#26324a', hair: '#7a5a34', skin: '#efc19e', iris: '#3a5a7a' },
    yaya: { robe: '#d9a066', hair: '#3a2218', skin: '#e0a882', iris: '#3a2414', dress: true, lips: '#b04a4a' },
    oligarch: { robe: '#f6f2ea', robe2: '#e8e2d6', hair: '#d8d4cc', skin: '#e8a88a', iris: '#4a3a2a', bald: true, big: true },
    oldman: { robe: '#ece6d8', robe2: '#c8bfa8', hair: '#e6e2da', skin: '#efc4a8', iris: '#5a7a9a', bald: true },
    oldlady: { robe: '#e8dfd2', hair: '#eae6e0', skin: '#f0c8ae', iris: '#5a7a9a', dress: true, bob: true, lips: '#b8605a' },
    crew: { robe: '#f6f6f2', robe2: '#22304a', hair: o.hair || '#2a1c14', skin: o.skin || '#d8a07a', iris: '#2a1a10' },
    captain: { robe: '#f6f4ee', robe2: '#f0ede4', hair: '#b8b0a4', skin: '#e6b090', iris: '#4a6a8a', beard: true, cap: true },
    lady: { robe: '#e86a7a', hair: '#e8c87a', skin: '#f0c4a4', iris: '#4a6a8a', dress: true, hat: true, lips: '#c0404a' },
    guest: { robe: o.robe || '#3a4a6a', robe2: '#22262e', hair: o.hair || '#3a2a1c', skin: o.skin || '#e6b090', iris: '#3a2a1a' },
  }[kind];
  const c = { ...C, ...o };
  const g = person({ pose: o.pose || 'stand', trousers: !c.dress, robe: c.robe, robe2: c.robe2, hair: c.hair, skin: c.skin, iris: c.iris, hands: c.hands || 'down', frown: c.frown ?? 0, lips: c.lips, squint: c.squint });
  if (c.big) g.scale.set(1.18, 1.05, 1.15);
  const head = g.userData.head, sY = g.userData.shoulderY;
  const hairM = mat(c.hair, { physical: true, rough: 0.45, clearcoat: 0.3 });
  if (c.dress && !c.bob) { // длинные волосы
    add(sphere(HR * 1.1), hairM, [0, 0.03, -0.03], { parent: head, scale: [1.07, 1.02, 1] });
    add(capsule(0.1, 0.22), hairM, [0, -0.12, -0.08], { parent: head, scale: [1.35, 1, 0.7] });
    add(sphere(0.08), hairM, [0.04, 0.12, 0.07], { parent: head, scale: [1.6, 0.5, 0.9], rot: [0.5, 0, -0.35] });
  } else if (c.bob) {
    add(sphere(HR * 1.12), hairM, [0, 0.02, -0.02], { parent: head, scale: [1.1, 1, 1.02] });
    [-1, 1].forEach(s => add(sphere(0.08), hairM, [s * 0.13, -0.05, 0], { parent: head, scale: [0.6, 1, 1] }));
  } else if (c.bald) {
    [-1, 1].forEach(s => add(sphere(0.07), hairM, [s * 0.12, -0.0, -0.06], { parent: head, scale: [0.6, 0.8, 1.2] }));
    add(sphere(0.09), hairM, [0, 0.0, -0.11], { parent: head, scale: [1.4, 0.8, 0.6] });
  } else {
    add(sphere(HR * 1.05), hairM, [0, 0.035, -0.035], { parent: head, scale: [1.04, 0.9, 1] });
    add(sphere(0.09), hairM, [0.02, 0.115, 0.04], { parent: head, scale: [1.45, 0.55, 1.15], rot: [0.3, 0, -0.15] });
  }
  if (c.beard) {
    add(sphere(0.1), hairM, [0, -0.085, 0.07], { parent: head, scale: [1.1, 0.75, 0.75] });
    add(capsule(0.013, 0.05), hairM, [0, -0.05, HR * 0.97], { parent: head, rot: [0, 0, Math.PI / 2] });
  }
  if (c.cap) {
    add(new THREE.CylinderGeometry(0.17, 0.158, 0.06, 32), mat('#1a2030', { rough: 0.5 }), [0, 0.14, -0.01], { parent: head });
    add(new THREE.CylinderGeometry(0.19, 0.172, 0.05, 32), mat('#ffffff', { rough: 0.5 }), [0, 0.19, -0.01], { parent: head });
    add(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 32, 1, false, 0, Math.PI), mat('#141418', { physical: true, rough: 0.2, clearcoat: 1 }), [0, 0.115, 0.08], { parent: head, rot: [0.25, -Math.PI / 2, 0] });
    add(sphere(0.022), mat('#d9b45a', { metal: 0.9, rough: 0.3 }), [0, 0.155, 0.165], { parent: head, scale: [1.3, 1, 0.5] });
  }
  if (c.hat) {
    const straw = mat('#efe0b8', { rough: 0.9 });
    add(new THREE.CylinderGeometry(0.33, 0.33, 0.012, 48), straw, [0, 0.12, -0.01], { parent: head, rot: [-0.12, 0, 0.05] });
    add(new THREE.CylinderGeometry(0.13, 0.15, 0.1, 32), straw, [0, 0.17, -0.02], { parent: head, rot: [-0.12, 0, 0.05] });
    add(new THREE.CylinderGeometry(0.152, 0.152, 0.03, 32), mat('#c8304a', { rough: 0.6 }), [0, 0.135, -0.02], { parent: head, rot: [-0.12, 0, 0.05] });
  }
  if (c.smile) add(new THREE.TorusGeometry(0.03, 0.008, 8, 20, Math.PI), mat('#6a2a24', { rough: 0.4 }), [0, -0.06, HR * 0.9], { parent: head, rot: [0, 0, Math.PI] });
  if (kind === 'crew' || kind === 'captain') { // погоны, пуговицы
    [-1, 1].forEach(s => add(box(0.09, 0.02, 0.1, 0.006), mat('#1a2030', { rough: 0.5 }), [s * 0.12, sY + 0.005, 0], { parent: g }));
    [0, 1, 2].forEach(i => add(sphere(0.011, 12, 8), mat('#d9b45a', { metal: 0.9, rough: 0.3 }), [0, sY - 0.06 - i * 0.07, 0.152], { parent: g }));
  }
  if (kind === 'oligarch') add(box(0.06, 0.26, 0.02, 0.01), mat('#e8e0d0', { rough: 0.9 }), [0.03, sY - 0.14, 0.15], { parent: g, rot: [0, 0, 0.35] }); // запах халата
  if (kind === 'carl' || kind === 'guest') add(box(0.13, 0.05, 0.03, 0.01), mat(c.robe, { rough: 0.8 }), [0, sY + 0.005, 0.1], { parent: g, rot: [-0.4, 0, 0] });
  return g;
}
function glass(parent, pos, drink = '#f0d070', s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  add(lathe([[0, 0], [0.025, 0], [0.004, 0.006], [0.004, 0.05], [0.022, 0.07], [0.026, 0.12], [0.024, 0.13]], 24), mat('#e8f0f6', { physical: true, rough: 0.05, opacity: 0.35, clearcoat: 1 }), [0, 0, 0], { parent: g, cast: false });
  add(new THREE.CylinderGeometry(0.023, 0.018, 0.04, 20), mat(drink, { rough: 0.2, emissive: drink, ei: 0.35 }), [0, 0.09, 0], { parent: g, cast: false });
  return g;
}
const holdGlass = (p, drink, k = 1) => glass(p, [p.userData.hands[k][0], p.userData.hands[k][1] + 0.02, p.userData.hands[k][2]], drink);
function floorP(color, o = {}) { return add(new THREE.PlaneGeometry(o.w || 10, o.d || 10), mat(color, { map: o.map, rough: o.rough ?? 0.6, physical: !!o.cc, clearcoat: o.cc ?? 0 }), [o.x || 0, o.y || 0, o.z ?? -2], { rot: [-Math.PI / 2, 0, 0], cast: false }); }
function wallP(color, z, o = {}) { return add(new THREE.PlaneGeometry(o.w || 10, o.h || 5), mat(color, { map: o.map, rough: 0.9 }), [o.x || 0, (o.h || 5) / 2, z], { cast: false, rot: o.rot }); }
const teak = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#b07a48'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = `hsl(${26 + rnd() * 6},${45 + rnd() * 10}%,${42 + rnd() * 8}%)`; g.fillRect(0, i * 32, w, 29); g.fillStyle = '#2a1a10'; g.fillRect(0, i * 32 + 29, w, 3); } }, [3, 3]);
function railing(x0, x1, z, y = 0, h = 0.42) {
  const r = mat('#eef0f2', { metal: 0.85, rough: 0.2 });
  limb([x0, y + h, z], [x1, y + h, z], 0.012, r); limb([x0, y + h * 0.5, z], [x1, y + h * 0.5, z], 0.007, r);
  for (let x = x0; x <= x1 + 0.001; x += 0.45) add(new THREE.CylinderGeometry(0.01, 0.01, h, 8), r, [x, y + h / 2, z]);
}
function lounger(pos, rotY = 0, cushion = '#f4f0e6') {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.y = rotY; root.add(g);
  const wood = mat('#8a5a34', { map: woodTex, rough: 0.5 });
  add(box(0.36, 0.05, 0.9, 0.01), wood, [0, 0.16, 0], { parent: g });
  add(box(0.34, 0.06, 0.6, 0.03), mat(cushion, { physical: true, rough: 0.8, sheen: 0.5 }), [0, 0.21, 0.13], { parent: g });
  add(box(0.34, 0.06, 0.34, 0.03), mat(cushion, { physical: true, rough: 0.8, sheen: 0.5 }), [0, 0.32, -0.27], { parent: g, rot: [0.6, 0, 0] });
  [[-0.15, 0.38], [0.15, 0.38], [-0.15, -0.38], [0.15, -0.38]].forEach(([x, z]) => add(box(0.03, 0.15, 0.03, 0.005), wood, [x, 0.075, z], { parent: g }));
  return g;
}
function lying(pos, rotY, o) { // загорающий на шезлонге
  const p = hero('guest', { ...o, hands: 'down' }); p.rotation.set(-Math.PI / 2 + 0.35, rotY, 0, 'YXZ'); p.position.set(...pos); root.add(p); return p;
}

// ---------- детальная суперъяхта: тёмная полоса борта, иллюминаторы, леера, арка радара, тендер, огни ----------
function superyacht(parent, o = {}) {
  const y = new THREE.Group(); parent.add(y);
  const white = mat('#f6f4f0', { physical: true, rough: 0.22, clearcoat: 1 });
  const navy = mat('#16263e', { physical: true, rough: 0.2, clearcoat: 1 });
  const glassM = mat('#0e1824', { physical: true, rough: 0.05, clearcoat: 1, metal: 0.3 });
  const warm = mat('#ffcf8a', { emissive: '#ffb060', ei: o.lit ? 2.2 : 0, rough: 0.4 });
  const steel = mat('#e8ecef', { metal: 0.9, rough: 0.2 });
  const L = 3.6;
  const hullShape = (x0, x1, w, h, yb, m, bowK = 1) => {
    const g = new THREE.BoxGeometry(x1 - x0, h, w, 48, 8, 10);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), yy = p.getY(i), z = p.getZ(i); const t = Math.max(0, (yy + h / 2) / h);
      const xr = (x + (x1 - x0) / 2) / (x1 - x0); // 0 корма → 1 нос
      z *= 0.6 + 0.4 * Math.sqrt(t);
      if (xr > 0.62) z *= Math.max(0.015, 1 - ((xr - 0.62) / 0.38) ** (1.5 * bowK));
      yy += Math.max(0, xr - 0.55) * 0.35 * h * t; // седловатость к носу
      p.setXYZ(i, x, yy, z);
    }
    g.computeVertexNormals();
    return add(g, m, [(x0 + x1) / 2, yb + h / 2, 0], { parent: y });
  };
  hullShape(-L / 2, L / 2, 0.82, 0.34, 0.0, navy);            // тёмная нижняя часть
  hullShape(-L / 2, L / 2, 0.84, 0.3, 0.3, white);            // белый борт
  add(box(L * 0.95, 0.025, 0.02, 0.008), mat('#c9a24a', { metal: 0.9, rough: 0.3 }), [-0.05, 0.31, 0.405], { parent: y }); // золотая полоса
  // иллюминаторы
  for (let i = 0; i < 16; i++) { const x = -1.45 + i * 0.13; if (x > 1.05) break; [-1, 1].forEach(s => add(new THREE.CircleGeometry(0.018, 16), mat('#0a1420', { physical: true, rough: 0.05, clearcoat: 1, emissive: '#ffc070', ei: o.lit ? 0.9 : 0 }), [x, 0.42, s * 0.415], { parent: y, rot: [0, s > 0 ? 0 : Math.PI, 0], cast: false })); }
  // палуба из тика и кормовая платформа
  add(box(L * 0.82, 0.025, 0.76, 0.01), mat('#ffffff', { map: teak, rough: 0.55 }), [-0.2, 0.62, 0], { parent: y });
  add(box(0.3, 0.04, 0.7, 0.01), mat('#ffffff', { map: teak, rough: 0.55 }), [-L / 2 - 0.1, 0.16, 0], { parent: y });
  // надстройки: каждая с закруглённым носом, тёмным остеклением и навесом
  const tiers = [[2.1, 0.3, 0.7, -0.35, 0.63], [1.55, 0.27, 0.6, -0.48, 0.95], [0.95, 0.24, 0.5, -0.58, 1.24]];
  tiers.forEach(([w, h, d, x, yb], k) => {
    add(box(w, h, d, 0.05), white, [x, yb + h / 2, 0], { parent: y });
    add(new THREE.CylinderGeometry(d / 2, d / 2, h, 32, 1, false, 0, Math.PI), white, [x + w / 2, yb + h / 2, 0], { parent: y });
    add(box(w * 0.92, h * 0.5, d + 0.012, 0.02), glassM, [x + 0.02, yb + h * 0.55, 0], { parent: y });
    add(new THREE.CylinderGeometry(d / 2 + 0.006, d / 2 + 0.006, h * 0.5, 32, 1, false, 0, Math.PI), glassM, [x + w / 2, yb + h * 0.55, 0], { parent: y });
    if (o.lit) for (let j = 0; j < 6 - k; j++) add(box(0.12, h * 0.36, 0.005, 0.004), warm, [x - w / 2 + 0.2 + j * (w - 0.3) / (6 - k), yb + h * 0.55, d / 2 + 0.012], { parent: y, cast: false });
    add(box(w + 0.22, 0.025, d + 0.12, 0.012), white, [x - 0.08, yb + h + 0.012, 0], { parent: y }); // навес-палуба
    // леера по краю верхней палубы
    const yr = yb + h + 0.11, x0 = x - w / 2 - 0.18, x1 = x + w / 2 - 0.05;
    [-1, 1].forEach(s => { limb([x0, yr, s * (d / 2 + 0.05)], [x1, yr, s * (d / 2 + 0.05)], 0.005, steel, y); for (let xx = x0; xx <= x1; xx += 0.14) add(new THREE.CylinderGeometry(0.004, 0.004, 0.1, 6), steel, [xx, yr - 0.05, s * (d / 2 + 0.05)], { parent: y, cast: false }); });
  });
  // леер главной палубы до носа
  [-1, 1].forEach(s => {
    const pts = [[-1.55, 0.36], [0.4, 0.38], [1.0, 0.3], [1.4, 0.16], [1.72, 0.02]];
    for (let i = 0; i < pts.length - 1; i++) limb([pts[i][0], 0.74 + i * 0.012, s * pts[i][1]], [pts[i + 1][0], 0.74 + (i + 1) * 0.012, s * pts[i + 1][1]], 0.005, steel, y);
  });
  // арка радара, купол, мачта с флагом
  const arch = add(new THREE.TorusGeometry(0.22, 0.03, 12, 32, Math.PI), white, [-0.75, 1.5, 0], { parent: y, rot: [0, Math.PI / 2, 0] });
  add(sphere(0.07, 20, 14), white, [-0.65, 1.78, 0], { parent: y, scale: [1, 0.7, 1] });
  const radar = add(box(0.26, 0.02, 0.04, 0.008), mat('#2a2a2e', { rough: 0.4 }), [-0.8, 1.76, 0], { parent: y });
  add(new THREE.CylinderGeometry(0.008, 0.01, 0.4, 8), steel, [-0.85, 1.92, 0], { parent: y });
  const flag = add(new THREE.PlaneGeometry(0.16, 0.1, 8, 4), mat('#c8302a', { rough: 0.8, side: THREE.DoubleSide }), [-1.85, 0.95, 0], { parent: y });
  add(new THREE.CylinderGeometry(0.006, 0.006, 0.35, 6), steel, [-1.77, 0.82, 0], { parent: y });
  // тендер на верхней палубе и спасательные круги
  add(capsule(0.07, 0.3), mat('#f4f2ee', { physical: true, rough: 0.3, clearcoat: 1 }), [-0.95, 1.33, 0.0], { parent: y, rot: [0, 0, Math.PI / 2] });
  add(capsule(0.072, 0.3), navy, [-0.95, 1.31, 0.0], { parent: y, rot: [0, 0, Math.PI / 2], scale: [1, 1, 0.6] });
  [-1.0, 0.1].forEach(x => add(new THREE.TorusGeometry(0.04, 0.014, 8, 20), mat('#ff6a2a', { rough: 0.6 }), [x, 0.78, 0.36], { parent: y }));
  // огоньки по краю навесов
  const bulbs = [];
  if (o.lit) tiers.forEach(([w, h, d, x, yb]) => { for (let xx = x - w / 2 - 0.15; xx < x + w / 2; xx += 0.11) bulbs.push(add(sphere(0.009, 8, 6), mat('#ffe0a0', { emissive: '#ffc060', ei: 4 }), [xx, yb + h - 0.005, d / 2 + 0.07], { parent: y, cast: false })); });
  // фигурки гостей на палубах (по желанию)
  if (o.guests) {
    const pal = ['#f6f2ea', '#e86a7a', '#2a3a5a', '#d9a066', '#f6f2ea'];
    [[0.85, 0.65, 0.18], [1.0, 0.65, -0.05], [0.6, 0.65, 0.22], [-0.1, 1.23, 0.24], [0.2, 1.23, 0.22]].forEach(([x, yy, z], i) => {
      const g = new THREE.Group(); g.position.set(x, yy, z); g.scale.setScalar(0.26); y.add(g);
      add(lathe([[0, 0], [0.16, 0], [0.15, 0.3], [0.12, 0.5], [0, 0.52]]), mat(pal[i], { rough: 0.7 }), [0, 0, 0], { parent: g });
      add(sphere(0.13), mat('#e6b090', { rough: 0.6 }), [0, 0.66, 0], { parent: g });
      add(sphere(0.135), mat(['#3a2218', '#e8c87a', '#c8c4bc', '#2a1c14', '#7a5a34'][i], { rough: 0.5 }), [0, 0.7, -0.02], { parent: g, scale: [1, 0.8, 1] });
    });
  }
  y.userData.tick = (t) => {
    const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 30 - t * 6) * 0.012 * (x + 0.08) * 6); } p.needsUpdate = true;
    radar.rotation.y = t * 2.5; bulbs.forEach((b, i) => b.material.emissiveIntensity = 3.5 + Math.sin(t * 3 + i) * 0.6);
  };
  return y;
}
function island(pos, s, color, haze = false) {
  const g = jitterG(new THREE.IcosahedronGeometry(1, 3), 0.18, 1.4);
  return add(g, mat(color, { rough: 1, emissive: haze ? color : '#000', ei: haze ? 0.35 : 1 }), pos, { scale: [s * 2.2, s * 0.55, s], cast: false });
}
function jitterG(geo, k, s) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = Math.sin(x * s * 3.1 + y * 1.7) * Math.sin(y * s * 2.3 + z * 1.3) * Math.sin(z * s * 2.9 + x * 0.7); const d = 1 + n * k; p.setXYZ(i, x * d, Math.max(0, y) * d, z * d); } geo.computeVertexNormals(); return geo; }
function wake(parent, n = 40, color = '#ffffff') {
  const ps = Array.from({ length: n }, (_, i) => add(sphere(0.06, 10, 6), mat(color, { rough: 0.7, emissive: color, ei: 0.25, opacity: 0.8 }), [0, -1, 0], { parent, cast: false }));
  return (t) => ps.forEach((p, i) => { const u = ((i / n) + t * 0.15) % 1, side = i % 2 ? 1 : -1; p.position.set(-1.9 - u * 3.5, 0.04, side * (0.3 + u * 0.9) + Math.sin(i * 7) * 0.08); p.scale.set(1.6 - u, 0.15, 0.8 - u * 0.5); p.material.opacity = 0.8 * (1 - u); });
}
function gullsF(n, base) {
  return Array.from({ length: n }, (_, i) => { const g = new THREE.Group(); root.add(g); const m = mat('#2a2430', { rough: 0.9 }); [-1, 1].forEach(s => add(box(0.12, 0.006, 0.03, 0.002), m, [s * 0.06, 0, 0], { parent: g, rot: [0, 0, s * 0.3] })); return { g, i }; });
}

// ---------- 1. Яхта на закате: острова, гости на палубах, огни, кильватер; слева идут грозовые тучи ----------
function yacht(T) {
  scene.fog = new THREE.Fog('#e8a070', 16, 46);
  skyPlane(skyTex([[0, '#262650'], [0.3, '#7a4a7a'], [0.58, '#e88a62'], [0.72, '#ffd8a0'], [0.78, '#ffe8c0'], [1, '#f0a070']], {
    sun: [0.7, 0.74, 150, 'rgba(255,240,200,1)'],
    clouds: [[0.12, 0.5, 200, 90, 'rgba(30,28,60,0.7)'], [0.05, 0.62, 170, 60, 'rgba(24,22,50,0.75)'], [0.28, 0.58, 140, 50, 'rgba(50,40,80,0.55)'], [0.18, 0.4, 150, 50, 'rgba(40,36,70,0.5)'],
      [0.82, 0.42, 120, 14, 'rgba(255,200,170,0.5)'], [0.62, 0.36, 90, 10, 'rgba(255,190,170,0.4)'], [0.9, 0.6, 80, 10, 'rgba(255,220,190,0.5)']],
  }), -30, 50, 60, 10);
  // молнии внутри туч слева
  const bolt = add(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: softTex, color: '#c8d0ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }), [-6.5, 7.5, -29], { cast: false, recv: false });
  const waves = sea(70, 50, -14, '#4a80a8', { cc: 1 });
  glint(2.6, -20, '#ffd8a0', 3.5, 22, 0.45);
  island([7, 0, -24], 2.4, '#8a5a7a', true); island([10.5, 0, -27], 3, '#9a6a80', true); island([-9, 0, -26], 2.6, '#5a4a6a', true);
  const y = superyacht(root, { lit: true, guests: true }); y.position.set(0, -0.06, -3.2); y.rotation.y = -1.0;
  const wk = wake(y);
  const gulls = gullsF(3);
  hemi('#ffc8a0', '#2a3a5a', 0.9);
  const sun = shadowed(new THREE.DirectionalLight('#ffc890', 2.8)); sun.position.set(5, 3, -10); sun.target.position.set(0, 0, -3); Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 30 }); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#8aa0d8', 0.9); fill.position.set(-3, 2, 4); scene.add(fill);
  return {
    cam: { from: [-0.5, 0.95, 4.6], to: [-0.3, 0.9, 3.9], lookFrom: [0.1, 1.55, -3.2], lookTo: [0.15, 1.5, -3.2], fov: 42 },
    focus: [0, 0.8, -3.0], aperture: 0.0015, bloom: 0.55, env: 0.12,
    update(t) {
      waves(t); wk(t); y.userData.tick(t);
      y.position.y = -0.06 + Math.sin(t * 1.1) * 0.02; y.rotation.z = Math.sin(t * 0.9) * 0.012;
      const a = t % 2.4; bolt.material.opacity = (a > 1.6 && a < 1.66) || (a > 1.72 && a < 1.76) ? 0.9 : 0;
      gulls.forEach(({ g, i }) => { g.position.set(1.4 - t * 0.2 - i * 0.3, 2.9 + i * 0.12 + Math.sin(t * 2 + i) * 0.04, -4.5 - i * 0.5); g.children.forEach((w, k) => w.rotation.z = (k ? 1 : -1) * (0.3 + Math.sin(t * 6 + i) * 0.35)); });
    },
  };
}

// ---------- 2. Свидание: счёт на блюдце между Карлом и Яей ----------
function date(T) {
  scene.background = new THREE.Color('#120a0c');
  floorP('#3a2214', { map: woodTex, rough: 0.5, cc: 0.4 });
  const wp = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#4a1e22'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a2a2c'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 30, h); }, [4, 2]);
  wallP('#ffffff', -1.6, { map: wp });
  // огоньки боке за спиной
  const bulbs = []; for (let i = 0; i < 14; i++) bulbs.push(add(sphere(0.02, 12, 8), mat('#ffd890', { emissive: '#ffb860', ei: 4 }), [-1.4 + i * 0.22, 1.55 + Math.sin(i * 1.3) * 0.06, -1.5], { cast: false }));
  const cloth = mat('#f4eee4', { physical: true, rough: 0.8, sheen: 0.6 });
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 48), cloth, [0, 0.5, -0.35]);
  add(new THREE.CylinderGeometry(0.31, 0.28, 0.5, 48, 1, true), cloth, [0, 0.25, -0.35]);
  const carl = hero('carl', { hands: 'desk', frown: 0.45 }); carl.position.set(-0.36, -0.17, -0.35); carl.rotation.y = Math.PI / 2 - 0.2; root.add(carl);
  const yaya = hero('yaya', { hands: 'desk', smile: true, frown: -0.2 }); yaya.position.set(0.36, -0.15, -0.35); yaya.rotation.y = -Math.PI / 2 + 0.2; root.add(yaya);
  [carl, yaya].forEach(p => add(box(0.36, 0.5, 0.36, 0.03), mat('#2a1a14', { map: woodTex, rough: 0.6 }), [p.position.x * 1.3, 0.2, -0.35]));
  // тарелки, бокалы, свеча, счёт
  [-1, 1].forEach(s => { add(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), mat('#ffffff', { rough: 0.3 }), [s * 0.17, 0.52, -0.35]); glass(root, [s * 0.15, 0.515, -0.5], '#8a1a2a'); });
  add(new THREE.CylinderGeometry(0.014, 0.016, 0.1, 12), mat('#f6eedc', { rough: 0.5 }), [0, 0.565, -0.55]);
  const flame = add(sphere(0.014, 12, 8), mat('#ffd080', { emissive: '#ffb040', ei: 6 }), [0, 0.63, -0.55], { cast: false, scale: [1, 1.6, 1] });
  const candle = shadowed(new THREE.PointLight('#ffb070', 0.8, 2.2, 1.5), 1024); candle.position.set(0, 0.7, -0.5); scene.add(candle);
  const saucer = new THREE.Group(); saucer.position.set(0, 0.52, -0.2); root.add(saucer);
  add(new THREE.CylinderGeometry(0.07, 0.06, 0.012, 32), mat('#e8e0d0', { rough: 0.3 }), [0, 0, 0], { parent: saucer });
  const bill = canvasTex(128, 256, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#555'; for (let i = 0; i < 8; i++) g.fillRect(12, 20 + i * 22, 50 + (i * 37) % 50, 5); g.fillStyle = '#222'; g.fillRect(12, 210, 104, 9); });
  add(new THREE.PlaneGeometry(0.07, 0.14), mat('#ffffff', { map: bill, rough: 0.8, side: THREE.DoubleSide }), [0, 0.008, 0], { parent: saucer, rot: [-Math.PI / 2, 0, 0.3], cast: false });
  hemi('#4a3048', '#1a0806', 0.35);
  const key = shadowed(new THREE.SpotLight('#ffd0a0', 1.6, 4, 0.55, 0.7, 1.3)); key.position.set(0.6, 2.0, 1.2); key.target.position.set(0, 0.5, -0.35); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#7a8ad8', 1.0); rim.position.set(0, 1.5, -3); scene.add(rim);
  return {
    cam: { from: [0.05, 1.05, 2.5], to: [0.03, 1.0, 2.15], lookFrom: [0, 0.95, -0.4], lookTo: [0, 0.8, -0.35], fov: 42 },
    focus: [0, 0.65, -0.35], aperture: 0.006, bloom: 0.35,
    update(t) {
      flame.scale.y = 1.6 * flick(t); candle.intensity = 0.8 * flick(t);
      breathe(carl, t); breathe(yaya, t, 1.2);
      const u = ease((t - T * 0.25) / (T * 0.4));
      saucer.position.x = -0.06 + Math.sin(t * 1.3) * 0.0 + u * 0.12 - 0.06 * ease((t - T * 0.7) / (T * 0.2)); // счёт двигают друг другу
      carl.userData.head.rotation.y = -0.15 + Math.sin(t * 0.8) * 0.06; yaya.userData.head.rotation.y = 0.1 + Math.sin(t * 0.7) * 0.08;
      bulbs.forEach((b, i) => b.material.emissiveIntensity = 3.5 + Math.sin(t * 2 + i) * 0.5);
    },
  };
}

// ---------- 3. Солнечная палуба: Яя снимает себя, Карл держит бокал, за ними богачи на шезлонгах ----------
function deckBase(o = {}) {
  scene.fog = new THREE.Fog(o.fog || '#bfe2f0', 8, 30);
  skyPlane(skyTex(o.sky || [[0, '#3a8ad0'], [0.55, '#7ac0e8'], [0.75, '#d8f0f8'], [1, '#bfe2f0']], { sun: o.sun || [0.8, 0.2, 120, 'rgba(255,255,235,0.9)'], clouds: o.clouds || [[0.25, 0.58, 90, 20, 'rgba(255,255,255,0.7)'], [0.7, 0.62, 70, 14, 'rgba(255,255,255,0.6)']] }), -24);
  const waves = sea(60, 40, -14, o.seaColor || '#2a8ab0', { cc: 1 });
  add(new THREE.PlaneGeometry(6, 4), mat('#ffffff', { map: teak, rough: 0.55, physical: true, clearcoat: 0.3 }), [0, 0.5, -0.3], { rot: [-Math.PI / 2, 0, 0], cast: false });
  add(box(6, 0.5, 0.1, 0.02), mat('#f4f2ee', { physical: true, rough: 0.3, clearcoat: 0.6 }), [0, 0.25, -2.3]); // борт
  railing(-3, 3, -2.28, 0.5, 0.45);
  return waves;
}
function deck(T) {
  const waves = deckBase();
  const Y = 0.5;
  const yaya = hero('yaya', { hands: 'throw', smile: true, frown: -0.25, robe: '#f0e0c8' }); yaya.position.set(0.12, Y, -0.55); yaya.rotation.y = -0.35; root.add(yaya);
  const ph = yaya.userData.hands[1];
  const phone = add(box(0.05, 0.1, 0.008, 0.008), mat('#151518', { physical: true, rough: 0.2, clearcoat: 1 }), [ph[0] - 0.02, ph[1] + 0.07, ph[2] + 0.02], { parent: yaya, rot: [0.2, -0.8, 0] });
  const flash = add(sphere(0.01, 8, 6), mat('#ffffff', { emissive: '#ffffff', ei: 0 }), [ph[0] - 0.045, ph[1] + 0.1, ph[2] + 0.01], { parent: yaya, cast: false });
  const carl = hero('carl', { hands: 'toast', frown: 0.25, robe: '#9ac0e0' }); carl.position.set(-0.42, Y, -0.85); carl.rotation.y = 0.4; root.add(carl);
  holdGlass(carl, '#f08a4a');
  [[0.95, -1.55, -0.3], [1.55, -1.5, -0.4], [-1.35, -1.6, 0.35]].forEach(([x, z, r], i) => {
    lounger([x, Y, z], r, i % 2 ? '#e8f0f8' : '#f4f0e6');
    lying([x - Math.sin(r) * 0.05, Y + 0.26, z + 0.05], r, { robe: ['#d84a4a', '#2a4a7a', '#e8c040'][i], robe2: '#1e2430', hair: ['#e8d8a0', '#3a2a1c', '#c8c4bc'][i] });
  });
  add(new THREE.CylinderGeometry(0.01, 0.01, 0.9, 8), mat('#ddd', {}), [1.25, Y + 0.45, -1.6]);
  const umb = add(new THREE.ConeGeometry(0.6, 0.22, 10, 1, true), mat('#f6f2ea', { rough: 0.8, side: THREE.DoubleSide }), [1.25, Y + 0.95, -1.6]);
  hemi('#cfe8ff', '#b08050', 1.0);
  const sun = shadowed(new THREE.DirectionalLight('#fff0d0', 3.0)); sun.position.set(3, 5, 2); sun.target.position.set(0, 0.5, -0.8); Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 15 }); scene.add(sun, sun.target);
  return {
    cam: { from: [0.25, 1.45, 2.9], to: [0.15, 1.4, 2.5], lookFrom: [0, 1.3, -1.2], lookTo: [0, 1.28, -1.2], fov: 42 },
    focus: [0.1, 1.1, -0.6], aperture: 0.004, bloom: 0.35, env: 0.12,
    update(t) {
      waves(t); breathe(yaya, t, 1.2); breathe(carl, t);
      const shot = (t % 1.3) < 0.07; flash.material.emissiveIntensity = shot ? 12 : 0;
      yaya.userData.head.rotation.set(-0.08, -0.45 + Math.sin(t * 0.9) * 0.08, Math.sin(t * 1.1) * 0.08);
      carl.userData.head.rotation.y = -0.5 + Math.sin(t * 0.5) * 0.05;
      umb.rotation.y = t * 0.05;
    },
  };
}

// ---------- 4. Гости: олигарх в халате с сигарой и милые старички, на стойке — граната вместо украшения ----------
function guests(T) {
  const waves = deckBase({ sky: [[0, '#4a5aa0'], [0.5, '#e8a070'], [0.75, '#ffd8a0'], [1, '#f0b080']], sun: [0.2, 0.72, 150, 'rgba(255,230,170,1)'], fog: '#f0b080', seaColor: '#3a6a8a', clouds: [[0.6, 0.6, 100, 14, 'rgba(255,200,170,0.5)']] });
  const Y = 0.5;
  // барная стойка
  add(box(1.6, 0.3, 0.35, 0.03), mat('#b07a48', { map: woodTex, rough: 0.4, physical: true, clearcoat: 0.6 }), [0, Y + 0.15, -0.15]);
  add(box(1.7, 0.04, 0.42, 0.01), mat('#f2efe8', { physical: true, rough: 0.15, clearcoat: 1 }), [0, Y + 0.32, -0.15]);
  const oli = hero('oligarch', { hands: 'toast', smile: true, frown: -0.15 }); oli.position.set(-0.3, Y, -0.65); oli.rotation.y = 0.25; root.add(oli);
  const hd = oli.userData.hands[1];
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 10), mat('#5a3a22', { rough: 0.7 }), [hd[0], hd[1] + 0.03, hd[2] + 0.04], { parent: oli, rot: [Math.PI / 2 - 0.3, 0, 0] });
  const ember = add(sphere(0.013, 10, 8), mat('#ff6020', { emissive: '#ff5010', ei: 5 }), [hd[0], hd[1] + 0.05, hd[2] + 0.1], { parent: oli, cast: false });
  const man = hero('oldman', { hands: 'hug', smile: true, frown: -0.3, robe: '#2a3a5a', robe2: '#e8e2d6' }); man.position.set(0.25, Y, -0.62); man.rotation.y = -0.2; root.add(man);
  const lady = hero('oldlady', { hands: 'toast', smile: true, frown: -0.3, robe: '#e88aa0' }); lady.position.set(0.55, Y, -0.7); lady.rotation.y = -0.35; root.add(lady);
  holdGlass(lady, '#e85a7a');
  // коктейли и граната на стойке
  [[-0.25, '#f0c040'], [0.05, '#e85a7a'], [0.45, '#7ad0e0']].forEach(([x, c]) => glass(root, [x, Y + 0.34, -0.05], c));
  const gr = new THREE.Group(); gr.position.set(0.22, Y + 0.4, 0.0); root.add(gr);
  const olive = mat('#4a5a2a', { rough: 0.5, metal: 0.2 });
  add(sphere(0.045, 20, 16), olive, [0, 0, 0], { parent: gr, scale: [1, 1.25, 1] });
  for (let i = 0; i < 4; i++) add(new THREE.TorusGeometry(0.045, 0.004, 6, 20), mat('#3a4820', { rough: 0.6 }), [0, -0.03 + i * 0.02, 0], { parent: gr, rot: [Math.PI / 2, 0, 0], scale: [1 - Math.abs(i - 1.5) * 0.12, 1 - Math.abs(i - 1.5) * 0.12, 1] });
  add(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 12), mat('#8a8a80', { metal: 0.8, rough: 0.3 }), [0, 0.065, 0], { parent: gr });
  add(new THREE.TorusGeometry(0.018, 0.003, 6, 16), mat('#c8c8c0', { metal: 0.9, rough: 0.2 }), [0.022, 0.075, 0], { parent: gr });
  hemi('#ffd0a8', '#5a3a30', 0.8);
  const sun = shadowed(new THREE.DirectionalLight('#ffc888', 2.6)); sun.position.set(-3, 2.5, 1); sun.target.position.set(0, 0.6, -0.5); Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 }); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#a8b8e8', 0.6); fill.position.set(3, 2, 3); scene.add(fill);
  return {
    cam: { from: [0.2, 1.3, 2.75], to: [0.12, 1.25, 2.4], lookFrom: [0.1, 1.25, -0.6], lookTo: [0.1, 1.28, -0.6], fov: 42 },
    focus: [0.1, 1.0, -0.4], aperture: 0.005, bloom: 0.45, env: 0.12,
    update(t) {
      waves(t); breathe(oli, t, 0.8); breathe(man, t); breathe(lady, t, 1.1);
      ember.material.emissiveIntensity = 4 + 2 * Math.sin(t * 3);
      oli.userData.head.rotation.set(-0.1 + Math.sin(t * 2.4) * 0.05, 0.2, 0); // хохочет
      lady.userData.head.rotation.z = Math.sin(t * 1.3) * 0.06; man.userData.head.rotation.y = 0.25 + Math.sin(t * 0.6) * 0.05;
      gr.rotation.y = t * 0.4;
    },
  };
}

// ---------- 5. Каприз: персонал в белом по одному прыгает в море, гостья в шляпе машет ----------
function swim(T) {
  scene.fog = new THREE.Fog('#bfe2f0', 10, 34);
  skyPlane(skyTex([[0, '#3a8ad0'], [0.55, '#7ac0e8'], [0.78, '#d8f0f8'], [1, '#bfe2f0']], { sun: [0.2, 0.15, 120, 'rgba(255,255,235,0.9)'], clouds: [[0.65, 0.6, 100, 20, 'rgba(255,255,255,0.7)']] }), -26);
  const waves = sea(60, 40, -10, '#2a8ab0', { cc: 1 });
  // борт яхты крупно слева: белая стена, палуба сверху
  const white = mat('#f4f2ee', { physical: true, rough: 0.25, clearcoat: 0.8 });
  add(box(5, 1.0, 1.4, 0.06), white, [-0.6, 0.35, -2.2]);
  add(box(5, 0.04, 1.4, 0.01), mat('#ffffff', { map: teak, rough: 0.55 }), [-0.6, 0.87, -2.2]);
  add(box(5, 0.06, 0.02, 0.01), mat('#1d3a5c', { rough: 0.4 }), [-0.6, 0.0, -1.49]);
  railing(-3, 1.9, -1.55, 0.88, 0.4);
  add(box(2.2, 0.55, 1.0, 0.05), white, [-1.2, 1.17, -2.4]); add(box(1.9, 0.2, 1.01, 0.03), mat('#1a2430', { physical: true, rough: 0.08, clearcoat: 1 }), [-1.1, 1.22, -2.4]);
  // ряд стюардов у борта
  const crew = [];
  for (let i = 0; i < 6; i++) {
    const p = hero('crew', { hands: 'down', hair: ['#2a1c14', '#c8a060', '#1a1210', '#6a3a1a', '#2a1c14', '#8a6a3a'][i], skin: ['#d8a07a', '#f0c4a4', '#a0684a', '#e8b090', '#c88a62', '#f0c4a4'][i], frown: -0.1 });
    p.position.set(-1.9 + i * 0.42, 0.89, -1.75); p.scale.setScalar(0.9); root.add(p); crew.push(p);
  }
  // гостья наверху с бокалом машет рукой
  const lady = hero('lady', { hands: 'throw', smile: true, frown: -0.2 }); lady.position.set(-1.6, 1.45, -2.1); lady.rotation.y = 0.5; lady.scale.setScalar(0.9); root.add(lady);
  const drops = []; for (let i = 0; i < 26; i++) drops.push(add(sphere(0.025, 10, 8), mat('#e8f6ff', { physical: true, rough: 0.1, clearcoat: 1 }), [0, -1, 0], { cast: false }));
  hemi('#cfe8ff', '#4a8aa0', 1.0);
  const sun = shadowed(new THREE.DirectionalLight('#fff0d0', 3.0)); sun.position.set(-2, 5, 3); sun.target.position.set(0, 0.5, -1.8); Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 15 }); scene.add(sun, sun.target);
  // прыжки: по одному, через равные промежутки
  const jumps = crew.map((p, i) => ({ p, t0: 0.9 + i * 0.85, x: p.position.x }));
  const rings = crew.map(() => add(new THREE.TorusGeometry(0.2, 0.025, 8, 40), mat('#ffffff', { rough: 0.6, emissive: '#ffffff', ei: 0.3 }), [0, -1, 0], { rot: [-Math.PI / 2, 0, 0], cast: false }));
  return {
    cam: { from: [1.7, 1.05, 4.0], to: [1.5, 1.05, 3.6], lookFrom: [-0.5, 1.05, -1.6], lookTo: [-0.6, 1.05, -1.6], fov: 44 },
    focus: [-0.3, 0.8, -1.7], aperture: 0.003, bloom: 0.35, env: 0.12,
    update(t) {
      waves(t); lady.userData.head.rotation.y = Math.sin(t * 1.5) * 0.15; breathe(lady, t);
      let di = 0;
      jumps.forEach(({ p, t0, x }, ji) => {
        const rs = t - t0 - 0.9, rg = rings[ji]; if (rs > 0 && rs < 1.6) { rg.position.set(x, 0.06, -0.8); rg.scale.setScalar(0.4 + rs * 1.2); rg.material.opacity = 1; } else rg.position.y = -1;
        const u = (t - t0) / 0.9;
        if (u < 0) { p.position.set(x, 0.89, -1.75); p.rotation.set(0, 0, 0); breathe(p, t); return; }
        if (u < 1) {
          p.visible = true; p.position.set(x, 0.89 + Math.sin(u * Math.PI) * 0.35 - u * u * 1.05, -1.75 + u * 0.95); p.rotation.set(u * 1.0, 0, 0);
        } else p.visible = false;
        const s = t - t0 - 0.9; // брызги
        if (s > 0 && s < 0.7) for (let k = 0; k < 4 && di < drops.length; k++, di++) { const a = k * 1.7 + x * 3; drops[di].position.set(x + Math.cos(a) * s * 0.35, 0.05 + Math.sin(s / 0.7 * Math.PI) * (0.25 + k * 0.05), -0.8 + Math.sin(a) * s * 0.3); drops[di].scale.setScalar(1 - s); }
      });
      for (; di < drops.length; di++) drops[di].position.y = -1;
    },
  };
}

// ---------- 6. Каюта капитана: шторы, бутылка, «Не беспокоить», капитан спиной ----------
function cabin(T) {
  scene.background = new THREE.Color('#06070a');
  floorP('#3a2618', { map: woodTex, rough: 0.5 });
  wallP('#2a2a36', -1.3, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#2c3040'; g.fillRect(0, 0, w, h); g.strokeStyle = '#343a4c'; g.lineWidth = 3; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }, [6, 3]) });
  // иллюминатор, задёрнутый шторой; полоска солнца
  add(new THREE.CircleGeometry(0.22, 40), new THREE.MeshBasicMaterial({ color: '#ffe2a8', toneMapped: false }), [0.55, 1.25, -1.29], { cast: false });
  add(new THREE.TorusGeometry(0.23, 0.03, 12, 40), mat('#c9a24a', { metal: 0.9, rough: 0.3 }), [0.55, 1.25, -1.27]);
  const cur = mat('#5a1e22', { physical: true, rough: 0.9, sheen: 0.6, sheenColor: '#a04a4a' });
  const curL = add(box(0.3, 0.7, 0.03, 0.02), cur, [0.4, 1.2, -1.2]), curR = add(box(0.3, 0.7, 0.03, 0.02), cur, [0.72, 1.2, -1.2]);
  const beam = shadowed(new THREE.SpotLight('#ffd890', 10, 4, 0.08, 0.6, 1.2), 1024); beam.position.set(0.56, 1.25, -1.5); beam.target.position.set(-0.2, 0.3, 0.4); scene.add(beam, beam.target);
  // стол: бутылки, стакан
  add(box(0.7, 0.04, 0.45, 0.01), mat('#3a2216', { map: woodTex, physical: true, rough: 0.35, clearcoat: 0.5 }), [0.05, 0.5, -0.65]);
  add(box(0.66, 0.48, 0.4, 0.01), mat('#2a1810', { map: woodTex, rough: 0.6 }), [0.05, 0.25, -0.67]);
  const bottleG = lathe([[0, 0], [0.045, 0], [0.047, 0.15], [0.02, 0.2], [0.015, 0.26], [0, 0.26]], 24);
  add(bottleG, mat('#3a5a2a', { physical: true, rough: 0.05, clearcoat: 1, opacity: 0.85 }), [0.22, 0.52, -0.7]);
  const fallen = add(bottleG, mat('#5a3a1a', { physical: true, rough: 0.05, clearcoat: 1, opacity: 0.85 }), [-0.1, 0.565, -0.6], { rot: [0, 0.4, Math.PI / 2] });
  add(new THREE.CylinderGeometry(0.03, 0.026, 0.07, 20), mat('#e8f0f6', { physical: true, rough: 0.05, opacity: 0.4, clearcoat: 1 }), [0.08, 0.555, -0.55], { cast: false });
  add(new THREE.CylinderGeometry(0.027, 0.024, 0.025, 20), mat('#c88a30', { emissive: '#a06020', ei: 0.4 }), [0.08, 0.535, -0.55], { cast: false });
  // кресло и капитан спиной
  const chair = mat('#4a2a1a', { physical: true, rough: 0.5, sheen: 0.4 });
  add(box(0.55, 0.3, 0.5, 0.06), chair, [-0.15, 0.15, -0.05]);
  add(box(0.6, 0.6, 0.14, 0.06), chair, [-0.15, 0.55, 0.18]);
  [-1, 1].forEach(s => add(box(0.1, 0.24, 0.5, 0.04), chair, [-0.15 + s * 0.3, 0.38, -0.05]));
  const cap = hero('captain', { pose: 'seiza', hands: 'lap', robe: '#e8e4da' }); cap.position.set(-0.15, 0.2, -0.05); cap.rotation.y = Math.PI - 0.2; root.add(cap);
  cap.userData.head.rotation.z = 0.25;
  // дверь с табличкой справа
  add(box(0.55, 1.4, 0.05, 0.02), mat('#4a3020', { map: woodTex, rough: 0.5 }), [0.85, 0.7, -0.75], { rot: [0, -0.9, 0] });
  add(sphere(0.025), mat('#c9a24a', { metal: 0.9, rough: 0.3 }), [0.72, 0.72, -0.55]);
  const sign = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#c8241c'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('НЕ', w / 2, 46); g.fillText('БЕСПОКОИТЬ', w / 2, 96); });
  const tag = add(new THREE.PlaneGeometry(0.17, 0.085), mat('#ffffff', { map: sign, rough: 0.6, emissive: '#400', ei: 0.3 }), [0.7, 0.63, -0.52], { rot: [0, -0.9, 0], cast: false });
  hemi('#4a5070', '#0a0604', 0.7);
  const key = shadowed(new THREE.SpotLight('#ffc890', 6, 4, 0.5, 0.7, 1.3), 1024); key.position.set(0.6, 1.8, 0.9); key.target.position.set(-0.15, 0.6, 0); scene.add(key, key.target);
  const lamp = new THREE.PointLight('#ffb070', 1.6, 2.5, 1.6); lamp.position.set(0.4, 0.9, -0.4); scene.add(lamp);
  return {
    cam: { from: [-0.4, 1.35, 2.7], to: [-0.3, 1.3, 2.4], lookFrom: [0.15, 1.0, -0.5], lookTo: [0.15, 0.98, -0.5], fov: 42 },
    focus: [0, 0.6, -0.3], aperture: 0.008, bloom: 0.6, env: 0.05,
    update(t) {
      curL.position.x = 0.4 + Math.sin(t * 0.8) * 0.01; curR.position.x = 0.72 - Math.sin(t * 0.8) * 0.01;
      tag.rotation.z = Math.sin(t * 1.1) * 0.12; fallen.rotation.y = 0.4 + Math.sin(t * 0.9) * 0.05; // качка
      breathe(cap, t, 0.7); cap.userData.head.rotation.x = 0.15 + Math.sin(t * 0.6) * 0.05;
    },
  };
}

// ---------- 7. Ужин в шторм: зал кренится, люстра качается, лица зеленеют ----------
function stormDinner(T) {
  scene.background = new THREE.Color('#05060a');
  const room = new THREE.Group(); root.add(room);
  const rm = (geo, m, pos, o = {}) => add(geo, m, pos, { ...o, parent: room });
  rm(new THREE.PlaneGeometry(8, 8), mat('#5a1820', { rough: 0.8 }), [0, 0, -2], { rot: [-Math.PI / 2, 0, 0], cast: false });
  const pan = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e8dcc4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8b48c'; g.lineWidth = 6; g.strokeRect(20, 20, w - 40, h - 40); }, [6, 2]);
  rm(new THREE.PlaneGeometry(8, 4), mat('#a89878', { map: pan, rough: 0.8 }), [0, 2, -2.2], { cast: false });
  // иллюминаторы со вспышками молний
  const ports = [-1.2, 0, 1.2].map(x => { rm(new THREE.TorusGeometry(0.2, 0.03, 12, 40), mat('#c9a24a', { metal: 0.9, rough: 0.3 }), [x, 1.5, -2.18]); return rm(new THREE.CircleGeometry(0.19, 40), new THREE.MeshBasicMaterial({ color: '#0a1428', toneMapped: false }), [x, 1.5, -2.19], { cast: false }); });
  const cloth = mat('#d8d0c0', { physical: true, rough: 0.8, sheen: 0.3 });
  rm(box(2.4, 0.04, 0.8, 0.01), cloth, [0, 0.38, -0.9]); rm(box(2.42, 0.34, 0.82, 0.01), cloth, [0, 0.2, -0.9]);
  // гости вдоль дальней стороны стола, лица бледно-зелёные
  const sick = '#c8d0a0';
  const people = [
    hero('oligarch', { hands: 'desk', frown: 0.4, skin: sick }), hero('lady', { hands: 'desk', frown: 0.5, skin: '#d8dcb0' }), hero('carl', { hands: 'desk', frown: 0.5, skin: '#d0d8a8' }),
    hero('yaya', { hands: 'desk', frown: 0.5, skin: '#d4d4a8' }), hero('oldman', { hands: 'desk', frown: 0.3, skin: '#d8dcb8' }), hero('oldlady', { hands: 'desk', frown: 0.3, skin: '#dcdcbc' }),
  ];
  people.forEach((p, i) => { p.position.set(-1.0 + i * 0.4, -0.06, -1.42); room.add(p); rm(box(0.3, 0.5, 0.06, 0.02), mat('#6a2a20', { physical: true, rough: 0.6, sheen: 0.4 }), [-1.0 + i * 0.4, 0.55, -1.62]); });
  const cap = hero('captain', { hands: 'toast', smile: true, frown: -0.2 }); cap.position.set(0.0, 0.05, -1.85); cap.rotation.y = 0; room.add(cap); holdGlass(cap, '#f0d070');
  // скользящие бокалы и тарелки
  const slide = [];
  for (let i = 0; i < 6; i++) {
    const x = -1.0 + i * 0.4;
    rm(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), mat('#ffffff', { rough: 0.3 }), [x, 0.405, -0.95]);
    const gl = glass(room, [x + 0.12, 0.4, -0.78], i % 2 ? '#8a1a2a' : '#f0d070'); slide.push({ gl, x: x + 0.12, k: 0.7 + (i % 3) * 0.2 });
  }
  // люстра
  const ch = new THREE.Group(); ch.position.set(0, 2.2, -0.9); root.add(ch);
  limb([0, 0, 0], [0, -0.45, 0], 0.008, mat('#c9a24a', { metal: 0.9, rough: 0.3 }), ch);
  const crystals = mat('#fff6e0', { emissive: '#ffd890', ei: 3 });
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; add(sphere(0.03, 12, 8), crystals, [Math.cos(a) * 0.22, -0.5, Math.sin(a) * 0.22], { parent: ch, cast: false }); add(new THREE.ConeGeometry(0.012, 0.06, 6), crystals, [Math.cos(a) * 0.22, -0.57, Math.sin(a) * 0.22], { parent: ch, cast: false, rot: [Math.PI, 0, 0] }); }
  add(new THREE.TorusGeometry(0.22, 0.012, 8, 40), mat('#c9a24a', { metal: 0.9, rough: 0.3 }), [0, -0.5, 0], { parent: ch, rot: [Math.PI / 2, 0, 0], cast: false });
  const chL = shadowed(new THREE.PointLight('#ffcf8a', 2.2, 4.5, 1.3), 1024); chL.position.set(0, 1.6, -0.9); scene.add(chL);
  hemi('#3a4a6a', '#1a0806', 0.4);
  const flashL = new THREE.DirectionalLight('#c8d8ff', 0); flashL.position.set(0, 2, -4); flashL.target.position.set(0, 0.6, -0.9); scene.add(flashL, flashL.target);
  const fill = new THREE.DirectionalLight('#ffd8b0', 0.45); fill.position.set(0, 1.5, 3); scene.add(fill);
  const lightning = (t) => { const a = (t % 2.6), b = (t % 3.7); return (a > 1.9 && a < 1.97) || (a > 2.03 && a < 2.08) || (b > 2.8 && b < 2.86) ? 1 : 0; };
  return {
    cam: { from: [0.05, 1.2, 2.6], to: [0.0, 1.15, 2.2], lookFrom: [0, 1.15, -1.0], lookTo: [0, 1.12, -1.0], fov: 44 },
    focus: [0, 0.8, -1.2], aperture: 0.003, bloom: 0.35,
    update(t, TT) {
      const grow = 0.4 + 0.6 * ease(t / (TT * 0.6)); // качка нарастает
      const roll = Math.sin(t * 1.4) * 0.09 * grow;
      room.rotation.z = roll; room.position.y = Math.sin(t * 1.4 + 1) * 0.03 * grow;
      ch.rotation.z = -roll * 2.2; ch.rotation.x = Math.sin(t * 1.1) * 0.08 * grow;
      chL.position.x = Math.sin(-roll * 2.2) * 0.5; chL.intensity = 2.2 * (0.92 + 0.08 * Math.sin(t * 9));
      slide.forEach(({ gl, x, k }) => { gl.position.x = x - Math.sin(t * 1.4 - 0.6) * 0.16 * grow * k; gl.rotation.z = roll * 1.5; });
      people.forEach((p, i) => { p.rotation.z = -roll * 0.6; p.userData.head.rotation.x = 0.15 + Math.sin(t * 1.4 + i) * 0.06; });
      cap.userData.head.rotation.y = Math.sin(t * 0.8) * 0.15;
      const L = lightning(t); flashL.intensity = L * 5; ports.forEach(p => p.material.color.set(L ? '#dfe8ff' : '#0a1428'));
    },
  };
}

// ---------- 8. Фото-стикер Вуди Харрельсона на фоне ночной яхты в волнах ----------
const loadTex = (f) => new THREE.TextureLoader().loadAsync(`/public/assets/triangle-of-sadness/${f}`).then(t => { t.colorSpace = THREE.SRGBColorSpace; return t; }).catch(() => null);
const WOODY = SHOT === 'harrelson' ? await loadTex('woody-cut.png') : null;
function harrelson(T) {
  scene.fog = new THREE.Fog('#0a1424', 8, 30);
  skyPlane(skyTex([[0, '#03050c'], [0.5, '#0a1428'], [0.75, '#1a2a48'], [1, '#0a1424']], { stars: true, sun: [0.75, 0.3, 50, 'rgba(230,240,255,0.9)'], clouds: [[0.3, 0.5, 140, 30, 'rgba(10,16,30,0.7)']] }), -24);
  const waves = sea(60, 40, -12, '#0e2236', { cc: 1, amp: 1.8, speed: 1.4 });
  glint(2.2, -16, '#a8c0ff', 2.5, 16, 0.25);
  const y = superyacht(root, { lit: true }); y.position.set(0.3, -0.05, -6.5); y.rotation.y = 0.5;
  hemi('#3a4a7a', '#04060a', 0.5);
  const moon = new THREE.DirectionalLight('#a8c0ff', 1.6); moon.position.set(4, 4, -10); scene.add(moon);
  const asp = WOODY ? WOODY.image.width / WOODY.image.height : 0.53, h = 1.0;
  const card = add(new THREE.PlaneGeometry(h * asp, h), new THREE.MeshBasicMaterial({ map: WOODY, transparent: true, toneMapped: false, depthWrite: false, fog: false }), [0.0, 0.92, 0.5], { cast: false, recv: false });
  const at = AD + 0.8; // «Вуди»
  return {
    cam: { from: [0, 0.95, 2.4], to: [0, 0.93, 2.15], lookFrom: [0, 0.9, 0], lookTo: [0, 0.9, 0], fov: 42 },
    focus: [0, 0.9, 0.5], aperture: 0.0015, bloom: 0.4, env: 0.05,
    update(t) {
      waves(t); y.position.y = -0.05 + Math.sin(t * 1.3) * 0.05; y.rotation.z = Math.sin(t * 1.1) * 0.05;
      const dt = t - at; card.visible = dt >= 0; if (dt < 0) return;
      const f = dt * 30, pop = f < 6 ? 0.2 + 0.92 * f / 6 : f < 10 ? 1.12 - 0.16 * (f - 6) / 4 : f < 14 ? 0.96 + 0.04 * (f - 10) / 4 : 1;
      card.scale.setScalar(pop); card.material.opacity = Math.min(1, f / 3);
      card.rotation.z = -0.04 + Math.sin(t * 2.0) * 0.035; card.position.y = 0.92 + Math.sin(t * 1.5) * 0.012;
    },
  };
}

// ---------- 9. Награды: золотая пальмовая ветвь, затем три статуэтки по одной ----------
function palm(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  const gold = mat('#e8c060', { physical: true, metal: 1, rough: 0.22, clearcoat: 0.5 });
  const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push(new THREE.Vector3(Math.sin(u * 1.2) * 0.12, u * 0.9, 0)); }
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 8), gold, [0, 0, 0], { parent: g });
  for (let i = 1; i < 18; i++) {
    const u = i / 20, p = pts[i], len = 0.16 * Math.sin(u * Math.PI * 0.95) + 0.03;
    [-1, 1].forEach(side => add(sphere(0.5, 16, 8), gold, [p.x + side * len * 0.45, p.y + len * 0.2, 0], { parent: g, scale: [len, 0.018, 0.035], rot: [0, 0, side * 0.55 + 0.3] }));
  }
  return g;
}
function statuette(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  const gold = mat('#e8c060', { physical: true, metal: 1, rough: 0.2, clearcoat: 0.6 });
  add(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 32), mat('#151515', { physical: true, rough: 0.2, clearcoat: 1 }), [0, 0.06, 0], { parent: g });
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 32), gold, [0, 0.135, 0], { parent: g });
  add(capsule(0.035, 0.32), gold, [0, 0.35, 0], { parent: g, scale: [1, 1, 0.8] });
  add(sphere(0.036, 20, 14), gold, [0, 0.58, 0], { parent: g });
  [-1, 1].forEach(sd => limb([sd * 0.035, 0.46, 0.01], [sd * 0.012, 0.36, 0.04], 0.013, gold, g));
  add(box(0.012, 0.36, 0.012, 0.004), gold, [0, 0.36, 0.045], { parent: g });
  return g;
}
const pop = (dt) => { const f = dt * 30; return f < 0 ? 0 : f < 6 ? 0.2 + 0.92 * f / 6 : f < 10 ? 1.12 - 0.16 * (f - 6) / 4 : f < 14 ? 0.96 + 0.04 * (f - 10) / 4 : 1; };
function awards(T) {
  scene.background = new THREE.Color('#0a0406');
  const velvet = canvasTex(512, 512, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 0.55 + 0.45 * Math.sin(x / w * Math.PI * 14) ** 2; g.fillStyle = `rgb(${Math.round(110 * v)},${Math.round(18 * v)},${Math.round(26 * v)})`; g.fillRect(x, 0, 1, h); } }, [2, 1]);
  wallP('#ffffff', -0.9, { map: velvet });
  floorP('#1a1012', { rough: 0.25, cc: 0.8 });
  add(box(1.6, 0.12, 0.6, 0.02), mat('#1a1416', { physical: true, rough: 0.2, clearcoat: 1 }), [0, 0.06, -0.2]);
  const p = palm(root, [-0.05, 0.8, -0.45], 0.6); p.rotation.z = 0.15;
  const st = [-0.42, 0, 0.42].map((x, i) => statuette(root, [x, 0.12, -0.2 - Math.abs(x) * 0.15], 1.05));
  const spot = shadowed(new THREE.SpotLight('#ffe2b8', 14, 5, 0.5, 0.5, 1.2)); spot.position.set(0, 2.6, 0.6); spot.target.position.set(0, 0.4, -0.2); scene.add(spot, spot.target);
  hemi('#3a1a2a', '#0a0406', 0.3);
  const rim = new THREE.DirectionalLight('#ffd8a0', 1.2); rim.position.set(-2, 1.5, -1); scene.add(rim);
  const tPalm = AD + 2.5, tOsc = [AD + 3.62, AD + 3.95, AD + 4.35];
  return {
    cam: { from: [0, 0.95, 2.6], to: [0, 0.92, 2.3], lookFrom: [0, 0.95, 0], lookTo: [0, 0.93, 0], fov: 40 },
    focus: [0, 0.8, -0.05], aperture: 0.002, bloom: 0.55, env: 0.25,
    update(t) {
      const sp = pop(t - tPalm); p.visible = sp > 0; p.scale.setScalar(0.6 * sp); p.rotation.y = Math.sin(t * 0.8) * 0.25;
      st.forEach((s, i) => { const k = pop(t - tOsc[i]); s.visible = k > 0; s.scale.setScalar(1.05 * k); s.rotation.y = Math.sin(t * 0.6 + i) * 0.3; });
      spot.intensity = 14 * (0.5 + 0.5 * ease((t - tPalm + 0.6) / 0.6));
    },
  };
}

// ---------- 10. Рассвет после шторма: яхта одна на спокойном море, шезлонги опрокинуты, на воде качается бутылка ----------
function dawn(T) {
  scene.fog = new THREE.Fog('#f0c8b8', 14, 60);
  skyPlane(skyTex([[0, '#3a4a88'], [0.38, '#b888a8'], [0.62, '#f8c0a0'], [0.73, '#fff0d0'], [0.78, '#ffe0c0'], [1, '#e8b0a0']], {
    sun: [0.33, 0.75, 130, 'rgba(255,246,224,1)'],
    clouds: [[0.75, 0.52, 150, 22, 'rgba(150,100,140,0.5)'], [0.2, 0.42, 120, 14, 'rgba(200,140,160,0.45)'], [0.55, 0.3, 160, 18, 'rgba(120,100,150,0.35)'], [0.9, 0.65, 90, 10, 'rgba(255,210,200,0.5)']],
  }), -30, 50, 60, 10);
  const waves = sea(70, 50, -14, '#6a80c0', { cc: 1, amp: 0.3, speed: 0.6, glow: 0.25 });
  glint(-1.6, -20, '#ffe8c8', 3.5, 22, 0.5);
  island([-8, 0, -25], 2.6, '#9a7a9a', true); island([-11, 0, -28], 3.2, '#a88aa8', true); island([9, 0, -27], 2.2, '#8a7a9a', true);
  // утренняя дымка над водой
  const mist = [0, 1, 2].map(i => add(new THREE.PlaneGeometry(30, 1.2), new THREE.MeshBasicMaterial({ map: softTex, color: '#ffe8e0', transparent: true, opacity: 0.25, depthWrite: false, fog: false }), [0, 0.3 + i * 0.25, -9 - i * 4], { cast: false, recv: false }));
  const y = superyacht(root, {}); y.position.set(0.1, -0.06, -3.6); y.rotation.y = 0.95;
  // опрокинутые шезлонги и бокал на палубе — следы ночи
  const wood = mat('#8a5a34', { map: woodTex, rough: 0.5 }), cush = mat('#f4f0e6', { rough: 0.8 });
  [[1.0, 0.68, 0.15, 1.4, 0.4], [0.7, 0.68, -0.15, -1.2, 1.3]].forEach(([x, yy, z, rz, ry]) => { const g = new THREE.Group(); g.position.set(x, yy, z); g.rotation.set(0, ry, rz); g.scale.setScalar(0.3); y.add(g); add(box(0.36, 0.05, 0.9, 0.01), wood, [0, 0, 0], { parent: g }); add(box(0.34, 0.06, 0.7, 0.03), cush, [0, 0.05, 0], { parent: g }); });
  // бутылка шампанского качается на воде на переднем плане
  const bottle = new THREE.Group(); root.add(bottle);
  add(lathe([[0, 0], [0.05, 0], [0.052, 0.17], [0.022, 0.23], [0.017, 0.3], [0, 0.3]], 24), mat('#1e3a22', { physical: true, rough: 0.05, clearcoat: 1 }), [0, 0, 0], { parent: bottle, rot: [0, 0, Math.PI / 2 - 0.2] });
  add(new THREE.CylinderGeometry(0.019, 0.019, 0.05, 16), mat('#d9b45a', { metal: 0.9, rough: 0.3 }), [-0.27, 0.06, 0], { parent: bottle, rot: [0, 0, Math.PI / 2 - 0.2] });
  const gulls = gullsF(3);
  hemi('#ffd8c8', '#4a4a6a', 0.95);
  const sun = shadowed(new THREE.DirectionalLight('#ffd8b0', 2.4)); sun.position.set(-5, 2.2, -12); sun.target.position.set(0, 0, -3.5); Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 30 }); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#a8b0e0', 0.9); fill.position.set(3, 2, 4); scene.add(fill);
  return {
    cam: { from: [0.3, 0.65, 3.4], to: [0.1, 0.9, 4.6], lookFrom: [0.0, 1.45, -3.6], lookTo: [0.0, 1.6, -3.6], fov: 42 },
    focus: [0, 0.7, -3.4], aperture: 0.0015, bloom: 0.5, env: 0.12,
    update(t) {
      waves(t); y.userData.tick(t * 0.3); y.position.y = -0.06 + Math.sin(t * 0.7) * 0.01;
      bottle.position.set(0.3 + t * 0.02, 0.05 + Math.sin(t * 1.2) * 0.03, 0.4); bottle.rotation.set(Math.sin(t * 0.9) * 0.2, t * 0.1, Math.sin(t * 1.1) * 0.15);
      mist.forEach((m, i) => { m.position.x = Math.sin(t * 0.1 + i) * 1.5; });
      gulls.forEach(({ g, i }) => { g.position.set(-1.8 + t * 0.25 + i * 0.35, 2.4 + i * 0.15 + Math.sin(t * 2 + i) * 0.03, -4.5 - i * 0.6); g.children.forEach((w, k) => w.rotation.z = (k ? 1 : -1) * (0.3 + Math.sin(t * 6 + i) * 0.3)); });
    },
  };
}


run({ yacht, date, deck, guests, swim, cabin, 'storm-dinner': stormDinner, harrelson, awards, dawn }[SHOT]);
