// Пробные кадры «Переводчика» в 3D: ?style=pixar&shot=base|cart&w=&h=
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HorizontalTiltShiftShader } from 'three/addons/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/addons/shaders/VerticalTiltShiftShader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const P = new URLSearchParams(location.search);
const STYLE = P.get('style') || 'pixar';
const SHOT = P.get('shot') || 'base';
const W = +(P.get('w') || 1080), H = +(P.get('h') || 1920);
const DIO = STYLE === 'diorama';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 80);

// ---------- помощники ----------
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function mat(color, o = {}) {
  const c = new THREE.Color(color);
  if (o.basic) return new THREE.MeshBasicMaterial({ color: c, map: o.map || null, transparent: o.opacity != null, opacity: o.opacity ?? 1, toneMapped: o.toneMapped ?? true, side: o.side ?? THREE.FrontSide });
  if (o.physical) return new THREE.MeshPhysicalMaterial({ color: c, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, map: o.map || null, sheen: o.sheen ?? 0, sheenColor: new THREE.Color(o.sheenColor || '#ffffff'), sheenRoughness: 0.5, clearcoat: o.clearcoat ?? 0, emissive: new THREE.Color(o.emissive || '#000'), emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide });
  return new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, map: o.map || null, emissive: new THREE.Color(o.emissive || '#000'), emissiveMap: o.emissiveMap || null, emissiveIntensity: o.ei ?? 1, transparent: o.opacity != null, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide });
}
const root = new THREE.Group(); scene.add(root);
function add(geo, m, pos = [0, 0, 0], o = {}) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(...pos);
  if (o.rot) mesh.rotation.set(...o.rot);
  if (o.scale) mesh.scale.set(...(Array.isArray(o.scale) ? o.scale : [o.scale, o.scale, o.scale]));
  mesh.castShadow = o.cast ?? true; mesh.receiveShadow = o.recv ?? true;
  (o.parent || root).add(mesh);
  return mesh;
}
const sphere = (r, a = 40, b = 28) => new THREE.SphereGeometry(r, a, b);
const box = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
const capsule = (r, l) => new THREE.CapsuleGeometry(r, l, 8, 20);
function limb(a, b, r, m, parent) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const mesh = add(capsule(r, A.distanceTo(B)), m, [0, 0, 0], { parent });
  mesh.position.copy(A).add(B).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return mesh;
}
const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
function shade(hex, k) {
  const c = new THREE.Color(hex); const t = k > 0 ? 1 : 0, a = Math.abs(k);
  c.r += (t - c.r) * a; c.g += (t - c.g) * a; c.b += (t - c.b) * a; return '#' + c.getHexString();
}
function jitter(geo, k, s = 3) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * s * 3.1 + y * 1.7) * Math.sin(y * s * 2.3 + z * 1.3) * Math.sin(z * s * 2.9 + x * 0.7);
    const d = 1 + n * k; p.setXYZ(i, x * d, y * d, z * d);
  }
  geo.computeVertexNormals(); return geo;
}


const woodTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#5a3520'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `hsl(${20 + rnd() * 6},${40 + rnd() * 10}%,${18 + rnd() * 7}%)`; g.fillRect(0, i * 64, w, 62);
    g.strokeStyle = 'rgba(20,10,5,0.3)'; g.lineWidth = 1.5;
    for (let k = 0; k < 6; k++) { g.beginPath(); const y = i * 64 + rnd() * 60; g.moveTo(0, y); for (let x = 0; x < w; x += 32) g.lineTo(x, y + Math.sin(x / 60 + k) * 3); g.stroke(); }
  }
}, [1, 1]);

// ---------- солдат / переводчик (стилизованный, крупная голова) ----------
function soldier(o) {
  const g = new THREE.Group();
  const HR = 0.15;
  const skin = mat(o.skin || '#d9a07a', { physical: true, rough: 0.5, sheen: 0.5, sheenColor: '#ff9f86', emissive: '#2a0a04', ei: 1 });
  const shirt = mat(o.shirt, { physical: true, rough: 0.85, sheen: 0.6, sheenColor: shade(o.shirt, 0.4) });
  const pants = mat(o.pants || shade(o.shirt, -0.15), { physical: true, rough: 0.85, sheen: 0.5, sheenColor: shade(o.shirt, 0.3) });
  const hairM = mat(o.hair || '#1e1814', { physical: true, rough: 0.5, clearcoat: 0.2 });
  const bootM = mat('#3a2a1c', { rough: 0.7 });
  const step = o.step || 0;
  // ноги
  [[-1, step], [1, -step]].forEach(([s, f]) => {
    limb([s * 0.07, 0.04, f * 0.12], [s * 0.07, 0.36, 0], 0.062, pants, g);
    add(box(0.11, 0.07, 0.17, 0.02), bootM, [s * 0.07, 0.035, f * 0.12 + 0.03], { parent: g });
  });
  // корпус (наклоняется вперёд целиком)
  const up = new THREE.Group(); up.position.set(0, 0.34, 0); up.rotation.x = o.lean || 0; g.add(up);
  add(lathe([[0, 0], [0.15, 0], [0.155, 0.12], [0.15, 0.22], [0.1, 0.3], [0, 0.31]]), shirt, [0, 0, 0], { parent: up });
  if (o.vest) {
    const vm = mat(o.vest, { physical: true, rough: 0.75, sheen: 0.3 });
    add(box(0.33, 0.23, 0.25, 0.04), vm, [0, 0.14, 0], { parent: up });
    [-0.09, 0, 0.09].forEach(x => add(box(0.07, 0.08, 0.04, 0.012), vm, [x, 0.09, 0.135], { parent: up }));
    add(box(0.05, 0.035, 0.01, 0.005), mat('#6a6450', { rough: 0.8 }), [-0.17, 0.22, 0.02], { parent: up, rot: [0, -1.4, 0] }); // нашивка
  }
  if (o.scarf) add(new THREE.TorusGeometry(0.1, 0.045, 14, 28), mat(o.scarf, { physical: true, rough: 0.9, sheen: 0.6 }), [0, 0.3, 0.01], { parent: up, rot: [Math.PI / 2 - 0.15, 0, 0] });
  const shY = 0.26;
  [-1, 1].forEach(s => {
    const sh = [s * 0.155, shY, 0];
    let hand = [s * 0.19, -0.02, 0.04];
    if (o.arms === 'pull') hand = [s * 0.2, -0.02, -0.2];
    if (o.arms === 'point' && s === 1) hand = [0.2, 0.2, 0.24];
    if (o.arms === 'rifle') hand = s === 1 ? [0.1, 0.08, 0.2] : [-0.05, 0.12, 0.25];
    limb(sh, hand, 0.058, shirt, up);
    add(sphere(0.04), skin, hand, { parent: up, scale: [1, 0.85, 1.1] });
  });
  if (o.arms === 'rifle') {
    const r = new THREE.Group(); r.position.set(0.02, 0.1, 0.22); r.rotation.set(0.5, 0.3, 0.9); up.add(r);
    const gm = mat('#1c1d1c', { rough: 0.4, metal: 0.4 });
    add(box(0.05, 0.42, 0.06, 0.01), gm, [0, 0, 0], { parent: r });
    add(box(0.04, 0.08, 0.05, 0.01), gm, [0, -0.06, 0.05], { parent: r });
  }
  // голова
  const head = new THREE.Group(); head.position.set(0, 0.31 + 0.03 + HR, 0); head.rotation.y = o.look || 0; up.add(head);
  add(sphere(HR, 48, 32), skin, [0, 0, 0], { parent: head, scale: [1, 1.04, 0.96] });
  add(sphere(0.03), skin, [-HR, -0.01, 0], { parent: head, scale: [0.5, 1, 0.8] });
  add(sphere(0.03), skin, [HR, -0.01, 0], { parent: head, scale: [0.5, 1, 0.8] });
  const eyeW = mat('#fbfbf6', { physical: true, rough: 0.15, clearcoat: 1 });
  const iris = mat(o.iris || '#3a2414', { rough: 0.2 }), pupil = mat('#0c0806', { rough: 0.1 });
  const spark = mat('#ffffff', { basic: true, toneMapped: false });
  if (!o.closed) [-1, 1].forEach(s => {
    const ex = s * 0.055, ey = 0.005, ez = HR * 0.86;
    add(sphere(0.03), eyeW, [ex, ey, ez], { parent: head, scale: [1, o.squint ? 0.7 : 1.0, 0.55] });
    add(sphere(0.02), iris, [ex, ey - 0.002, ez + 0.012], { parent: head, scale: [1, o.squint ? 0.75 : 1.0, 0.5] });
    add(sphere(0.011), pupil, [ex, ey - 0.002, ez + 0.019], { parent: head, scale: [1, 1, 0.4] });
    add(sphere(0.005), spark, [ex + 0.008, ey + 0.009, ez + 0.024], { parent: head, cast: false });
  });
  else [-1, 1].forEach(s => add(capsule(0.006, 0.03), mat(shade(o.skin || '#d9a07a', -0.4)), [s * 0.055, 0.0, HR * 0.95], { parent: head, rot: [0, 0, Math.PI / 2] }));
  [-1, 1].forEach(s => add(capsule(0.009, 0.035), hairM, [s * 0.058, 0.055, HR * 0.9], { parent: head, rot: [0, 0, Math.PI / 2 + s * (o.frown ?? 0.25)] }));
  add(sphere(0.02), skin, [0, -0.028, HR * 0.97], { parent: head, scale: [0.9, 1.1, 1] });
  // борода и усы
  add(sphere(0.12), hairM, [0, -0.07, 0.04], { parent: head, scale: [1.12, 0.78, 0.95] });
  add(capsule(0.013, 0.06), hairM, [0, -0.06, HR * 0.95], { parent: head, rot: [0, 0, Math.PI / 2] });
  add(capsule(0.008, 0.03), mat('#6a2a24', { rough: 0.5 }), [0, -0.085, HR * 0.97], { parent: head, rot: [0, 0, Math.PI / 2] });
  if (o.helmet) {
    const hm = mat(o.helmet, { physical: true, rough: 0.6, clearcoat: 0.2 });
    add(new THREE.SphereGeometry(HR * 1.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), hm, [0, 0.02, -0.01], { parent: head, scale: [1, 0.95, 1.05] });
    add(new THREE.TorusGeometry(HR * 1.18, 0.012, 8, 40), hm, [0, 0.02, -0.01], { parent: head, rot: [Math.PI / 2, 0, 0] });
    add(box(0.05, 0.03, 0.03, 0.008), mat('#2a2a28', { rough: 0.5 }), [0, 0.13, 0.15], { parent: head }); // крепление ПНВ
  } else {
    add(sphere(HR * 1.05), hairM, [0, 0.035, -0.03], { parent: head, scale: [1.03, 0.85, 0.98] });
  }
  return g;
}

function rockMat(c) { return mat(c, { rough: 0.95 }); }
function mountains(list, m) { list.forEach(([x, z, r, h]) => add(jitter(new THREE.ConeGeometry(r, h, 9, 6), 0.12, 1.2), m, [x, h / 2 - 0.05, z], { rot: [0, rnd() * 3, 0], cast: false })); }
function skyPlane(draw, pos = [0, 6, -30], size = [60, 40]) {
  const t = canvasTex(512, 1024, draw);
  add(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ map: t, fog: false }), pos, { cast: false, recv: false });
}
function ground(c, size, bump = 0.03, z = -4) {
  const geo = new THREE.PlaneGeometry(size, size, 140, 140);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 1.7 + y * 0.9) * bump + Math.sin(x * 5.1 - y * 3.3) * bump * 0.3); }
  geo.computeVertexNormals();
  add(geo, mat(c, { rough: 0.97 }), [0, 0, z], { rot: [-Math.PI / 2, 0, 0], cast: false });
}

// ---------- БАЗА НА РАССВЕТЕ: Кинли знакомится с Ахмедом ----------
function buildBase() {
  const fogC = '#d9b48a';
  scene.fog = new THREE.Fog(fogC, 6, 30);
  skyPlane((g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5d6d84'); gr.addColorStop(0.45, '#c79a7c'); gr.addColorStop(0.62, '#f2c08a'); gr.addColorStop(0.7, '#ffdcaa'); gr.addColorStop(1, '#d9b48a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.filter = 'blur(14px)';
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${150 + rnd() * 60},${110 + rnd() * 40},${110 + rnd() * 40},0.35)`; g.beginPath(); g.ellipse(rnd() * w, h * 0.15 + rnd() * h * 0.42, 90 + rnd() * 120, 12 + rnd() * 18, 0, 0, 7); g.fill(); }
    const sun = g.createRadialGradient(w * 0.72, h * 0.66, 4, w * 0.72, h * 0.66, 200); sun.addColorStop(0, 'rgba(255,240,200,1)'); sun.addColorStop(0.15, 'rgba(255,215,150,0.8)'); sun.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = sun; g.fillRect(0, 0, w, h);
  });
  ground('#b8956a', 70, 0.04);
  mountains([[-9, -22, 5, 4.2], [-3, -26, 6, 5.5], [5, -24, 5.5, 4.6], [11, -21, 4.5, 3.6], [0, -18, 3, 2.2], [-14, -18, 4, 3]], rockMat('#8a6f5c'));
  // HESCO-барьеры
  const hesco = mat('#a88d64', { rough: 0.95 });
  for (let i = 0; i < 9; i++) add(box(0.62, 0.62, 0.62, 0.03), hesco, [-3.4 + i * 0.64, 0.31, -4.2], { });
  for (let i = 0; i < 5; i++) add(box(0.62, 0.62, 0.62, 0.03), hesco, [2.6 + i * 0.64, 0.31, -6.4]);
  // бронемашина
  const mr = new THREE.Group(); mr.position.set(-1.25, 0, -1.7); mr.rotation.y = 0.55; root.add(mr);
  const tan = mat('#9c8664', { physical: true, rough: 0.7, clearcoat: 0.15 });
  add(box(1.0, 0.55, 2.1, 0.08), tan, [0, 0.72, 0], { parent: mr });
  add(box(0.92, 0.42, 1.2, 0.1), tan, [0, 1.18, -0.3], { parent: mr });
  add(box(0.86, 0.2, 0.5, 0.05), tan, [0, 1.0, 0.75], { parent: mr, rot: [0.35, 0, 0] });
  add(box(0.7, 0.18, 0.02, 0.02), mat('#2a3640', { physical: true, rough: 0.1, clearcoat: 1 }), [0, 1.2, 0.31], { parent: mr, rot: [-0.25, 0, 0] });
  add(new THREE.CylinderGeometry(0.15, 0.17, 0.14, 20), tan, [0, 1.46, -0.35], { parent: mr });
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 10), mat('#202020', { metal: 0.5, rough: 0.4 }), [0, 1.52, -0.1], { parent: mr, rot: [Math.PI / 2, 0, 0] });
  const tyre = mat('#1d1b19', { rough: 0.85 });
  [[-0.52, 0.7], [0.52, 0.7], [-0.52, -0.7], [0.52, -0.7]].forEach(([x, z]) => add(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 28), tyre, [x, 0.3, z], { parent: mr, rot: [0, 0, Math.PI / 2] }));
  // вертолёт вдали на фоне солнца
  const heli = new THREE.Group(); heli.position.set(3.2, 3.2, -12); heli.rotation.y = -0.3; root.add(heli);
  const dk = mat('#2c2a26', { rough: 0.6 });
  add(sphere(0.5, 24, 16), dk, [0, 0, 0], { parent: heli, scale: [1.6, 0.8, 0.8] });
  add(box(1.5, 0.12, 0.12, 0.04), dk, [-1.2, 0.15, 0], { parent: heli });
  add(box(0.06, 0.4, 0.05, 0.02), dk, [-1.95, 0.3, 0], { parent: heli });
  add(new THREE.CylinderGeometry(1.7, 1.7, 0.01, 40), mat('#2c2a26', { opacity: 0.35 }), [0, 0.45, 0], { parent: heli, cast: false });
  // прожектор-мачта
  add(new THREE.CylinderGeometry(0.03, 0.04, 3.2, 10), mat('#3a3834', { metal: 0.5, rough: 0.5 }), [2.0, 1.6, -3.4]);
  add(box(0.5, 0.18, 0.12, 0.02), mat('#3a3834', { emissive: '#ffe9c0', ei: 0.4 }), [2.0, 3.2, -3.4]);
  // герои: Кинли (слева, в шлеме) и Ахмед (справа, платок)
  const kinley = soldier({ shirt: '#8a7a5e', pants: '#7a6b52', vest: '#6b6448', helmet: '#7a6e55', skin: '#e2ae8a', hair: '#3a2a1c', iris: '#5a4430', frown: 0.2, arms: 'rifle', look: 0.25 });
  kinley.position.set(-0.4, 0, -0.45); kinley.rotation.y = 0.5; root.add(kinley);
  const ahmed = soldier({ shirt: '#7c6a55', pants: '#5a4d3e', vest: '#4f4a3c', scarf: '#8f8170', skin: '#c48b62', hair: '#17110d', iris: '#2a1a10', frown: 0.35, squint: true, arms: 'down', look: -0.2 });
  ahmed.position.set(0.42, 0, -0.6); ahmed.rotation.y = -0.6; root.add(ahmed);
  // свет: низкое солнце сзади-справа + тёплое заполнение
  scene.add(new THREE.HemisphereLight('#9fb0c8', '#8a6a4a', 0.9));
  const sun = new THREE.DirectionalLight('#ffd09a', 3.0); sun.position.set(6, 3.2, -10); sun.target.position.set(0, 0, -0.5);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.radius = 5;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 });
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#ffc9a0', 1.1); fill.position.set(-2, 2, 5); scene.add(fill);
  scene.background = new THREE.Color(fogC);
  camera.fov = 40; camera.position.set(0.05, 0.85, 3.0); camera.lookAt(0.0, 0.78, -2.0);
  return new THREE.Vector3(0, 0.75, -0.45);
}

// ---------- НОЧЬ В ГОРАХ: Ахмед тянет тележку с Кинли ----------
function buildCart() {
  const fogC = '#1a2438';
  scene.fog = new THREE.Fog(fogC, 5, 24);
  skyPlane((g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070f'); gr.addColorStop(0.5, '#101a30'); gr.addColorStop(0.75, '#26324c'); gr.addColorStop(1, '#1a2438');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.7})`; const r = rnd() < 0.08 ? 1.6 : 0.8; g.beginPath(); g.arc(rnd() * w, rnd() * h * 0.6, r, 0, 7); g.fill(); }
    const m = g.createRadialGradient(w * 0.28, h * 0.22, 2, w * 0.28, h * 0.22, 120); m.addColorStop(0, 'rgba(220,230,255,0.55)'); m.addColorStop(1, 'rgba(160,180,230,0)'); g.fillStyle = m; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f0e6'; g.beginPath(); g.arc(w * 0.28, h * 0.22, 26, 0, 7); g.fill();
  });
  ground('#4a4a50', 60, 0.08);
  // склон: тропа уходит вверх вправо
  const slope = mat('#55535a', { rough: 0.95 });
  add(jitter(new THREE.BoxGeometry(14, 1.2, 4, 60, 8, 20), 0.05, 2), slope, [6.5, -0.2, -2.8], { rot: [0, 0, 0.16], cast: false });
  mountains([[-8, -16, 5, 5.5], [-1, -20, 7, 7.5], [7, -17, 5, 6], [13, -14, 4, 4.5], [-13, -12, 4, 3.6]], rockMat('#3a3f4c'));
  // гребень с огнями преследователей
  const ridge = new THREE.Group(); root.add(ridge);
  add(jitter(new THREE.BoxGeometry(12, 1.6, 1.5, 50, 6, 6), 0.08, 1.6), rockMat('#2c303a'), [-1.5, 0.5, -8.5], { rot: [0, 0.1, 0.04], cast: false });
  [[-4.4, 1.45, -8.5], [-3.7, 1.42, -8.6], [-2.9, 1.4, -8.5], [-0.8, 1.34, -8.7]].forEach(([x, y, z]) => {
    add(sphere(0.05, 12, 8), mat('#ffb050', { basic: true, toneMapped: false }), [x, y, z], { cast: false });
    const l = new THREE.PointLight('#ff9a40', 1.6, 2.2, 1.6); l.position.set(x, y, z + 0.1); scene.add(l);
    add(capsule(0.06, 0.18), mat('#141418', { rough: 1 }), [x + 0.1, y - 0.12, z], { cast: false }); // фигурка
  });
  // камни на тропе
  const rk = rockMat('#5d5b62');
  [[-1.6, -0.2, 0.22], [1.8, 0.1, 0.18], [-0.9, -1.4, 0.3], [2.4, -1.2, 0.25], [-2.2, 0.6, 0.15]].forEach(([x, z, s]) => add(jitter(new THREE.IcosahedronGeometry(s, 2), 0.25, 3), rk, [x, s * 0.4, z], { rot: [rnd(), rnd() * 3, 0] }));
  // тележка
  const cart = new THREE.Group(); cart.position.set(0, 0, -1.25); cart.rotation.y = -Math.PI / 2; root.add(cart);
  const wood = mat('#8a6040', { map: woodTex, rough: 0.75 });
  add(box(1.0, 0.05, 0.55, 0.01), wood, [0, 0.36, 0], { parent: cart });
  [-1, 1].forEach(s => add(box(1.0, 0.1, 0.03, 0.01), wood, [0, 0.42, s * 0.27], { parent: cart }));
  [-1, 1].forEach(s => {
    add(new THREE.TorusGeometry(0.22, 0.03, 10, 28), wood, [0.0, 0.22, s * 0.33], { parent: cart });
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), wood, [0.0, 0.22, s * 0.33], { parent: cart, rot: [Math.PI / 2, 0, 0] });
    for (let k = 0; k < 6; k++) add(box(0.012, 0.42, 0.015, 0.004), wood, [0, 0.22, s * 0.33], { parent: cart, rot: [0, 0, (k * Math.PI) / 6] });
    limb([0.45, 0.38, s * 0.2], [1.08, 0.5, s * 0.2], 0.02, wood, cart); // оглобли
  });
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.66, 8), wood, [0, 0.22, 0], { parent: cart, rot: [Math.PI / 2, 0, 0] });
  // Кинли на тележке
  const kin = soldier({ shirt: '#8a7a5e', pants: '#7a6b52', vest: '#6b6448', skin: '#e2ae8a', hair: '#3a2a1c', closed: true, arms: 'down' });
  const kinW = new THREE.Group(); kinW.rotation.x = -Math.PI / 2; kinW.position.set(-0.42, 0.5, 0); cart.add(kinW);
  kin.rotation.z = -Math.PI / 2; kin.scale.setScalar(0.85); kinW.add(kin);
  add(new THREE.PlaneGeometry(0.8, 0.5, 10, 10), mat('#5a5040', { rough: 1, side: THREE.DoubleSide }), [0.05, 0.6, 0.0], { parent: cart, rot: [-Math.PI / 2 + 0.05, 0, 0] }); // одеяло
  // Ахмед впрягся и тянет вверх по склону
  const ahmed = soldier({ shirt: '#6c5e4c', pants: '#4a4034', scarf: '#7f7364', skin: '#c48b62', hair: '#17110d', frown: 0.45, squint: true, arms: 'pull', lean: 0.3, step: 1, look: 0 });
  ahmed.position.set(0, 0.02, 0.02); ahmed.rotation.y = 0; root.add(ahmed);
  // свет: холодная луна + тёплый отсвет от огней
  scene.add(new THREE.HemisphereLight('#4a5c88', '#141018', 0.7));
  const moon = new THREE.DirectionalLight('#b8c8ff', 2.4); moon.position.set(-5, 6, -6); moon.target.position.set(0, 0, -0.5);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -0.0005; moon.shadow.radius = 5;
  Object.assign(moon.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 25 });
  scene.add(moon, moon.target);
  const rim = new THREE.DirectionalLight('#ffb070', 0.8); rim.position.set(-2, 1.5, -6); scene.add(rim);
  const fill = new THREE.DirectionalLight('#6a7cb0', 0.5); fill.position.set(2, 1.5, 4); scene.add(fill);
  scene.background = new THREE.Color(fogC);
  camera.fov = 42; camera.position.set(0.45, 1.2, 3.1); camera.lookAt(-0.05, 0.62, -0.7);
  add(sphere(0.55, 32, 20), mat('#f2f0e6', { basic: true, toneMapped: false }), [-3.2, 7.5, -16], { cast: false });
  return new THREE.Vector3(0, 0.7, 0);
}

const focus = SHOT === 'base' ? buildBase() : buildCart();
camera.aspect = W / H; camera.updateProjectionMatrix();
if (STYLE === 'pixar') {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.15;
}

// ---------- постобработка ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const ao = new GTAOPass(scene, camera, W, H);
ao.updateGtaoMaterial({ radius: 0.25, distanceExponent: 1, thickness: 1, scale: 1, samples: 16 }); ao.blendIntensity = 0.8;
composer.addPass(ao);
if (STYLE === 'pixar') composer.addPass(new BokehPass(scene, camera, { focus: camera.position.distanceTo(focus), aperture: 0.012, maxblur: 0.01 }));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.5, 0.9));
if (DIO) {
  const h = new ShaderPass(HorizontalTiltShiftShader), v = new ShaderPass(VerticalTiltShiftShader);
  h.uniforms.h.value = 2.2 / W; v.uniforms.v.value = 2.2 / H; h.uniforms.r.value = v.uniforms.r.value = 0.5;
  composer.addPass(h); composer.addPass(v);
}
composer.addPass(new OutputPass());
composer.addPass(new ShaderPass({
  uniforms: { tDiffuse: { value: null }, vig: { value: 0.38 }, grain: { value: 0.025 } },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, grain; varying vec2 vUv;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){ vec4 c=texture2D(tDiffuse,vUv); vec2 d=vUv-0.5; d.x*=0.7;
    c.rgb*= 1.0 - vig*smoothstep(0.2,0.75,length(d)); c.rgb += (h(vUv*1000.0)-0.5)*grain; gl_FragColor=c; }`,
}));
composer.render();
window.__done = true;
