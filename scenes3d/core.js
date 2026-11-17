// Ядро 3D-сцен «Кино» в стиле Пиксар (three.js): рендерер, материалы, персонажи, постобработка, анимация.
// Сцена фильма — модуль, который вызывает run(shots): shots[name](t) строит план и возвращает {update(t, T)}.
// Страница: scenes3d/index.html?film=<slug>&shot=<name>&dur=<сек>&w=&h=  → window.renderAt(t), window.TOTAL
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

export const P = new URLSearchParams(location.search);
export const W = +(P.get('w') || 1080), H = +(P.get('h') || 1920);
const DIO = false;

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

// ---------- персонаж (стилизованный, крупная голова) ----------
const woodTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#5a3520'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `hsl(${20 + rnd() * 6},${40 + rnd() * 10}%,${18 + rnd() * 7}%)`; g.fillRect(0, i * 64, w, 62);
    g.strokeStyle = 'rgba(20,10,5,0.3)'; g.lineWidth = 1.5;
    for (let k = 0; k < 6; k++) { g.beginPath(); const y = i * 64 + rnd() * 60; g.moveTo(0, y); for (let x = 0; x < w; x += 32) g.lineTo(x, y + Math.sin(x / 60 + k) * 3); g.stroke(); }
  }
}, [1, 1]);

function person(o) {
  const g = new THREE.Group();
  const HR = 0.15;
  const skin = mat(o.skin || '#e9b08a', { physical: true, rough: 0.5, sheen: 0.5, sheenColor: '#ff9f86', emissive: '#2a0a04', ei: 1 });
  const robe = mat(o.robe, { physical: true, rough: 0.85, sheen: 0.7, sheenColor: shade(o.robe, 0.4) });
  const robe2 = mat(o.robe2 || shade(o.robe, -0.35), { physical: true, rough: 0.85, sheen: 0.6, sheenColor: shade(o.robe, 0.2) });
  const hairM = mat(o.hair || '#1e1814', { physical: true, rough: 0.45, clearcoat: 0.3 });
  let headY, shoulderY;
  if (o.pose === 'seiza') {
    add(sphere(0.2), robe2, [0, 0.085, 0.03], { parent: g, scale: [1.25, 0.45, 1.15] }); // сложенные ноги (хакама)
    add(lathe([[0, 0], [0.165, 0], [0.15, 0.14], [0.155, 0.27], [0.15, 0.33], [0.07, 0.37], [0, 0.375]]), robe, [0, 0.11, 0], { parent: g });
    shoulderY = 0.43; headY = 0.11 + 0.37 + 0.03 + HR;
  } else {
    if (o.trousers) {
      limb([-0.07, 0.03, 0], [-0.07, 0.36, 0], 0.06, robe2, g); limb([0.07, 0.03, 0], [0.07, 0.36, 0], 0.06, robe2, g);
      add(box(0.11, 0.06, 0.16), mat('#2a1d15', { rough: 0.7 }), [-0.07, 0.03, 0.03], { parent: g });
      add(box(0.11, 0.06, 0.16), mat('#2a1d15', { rough: 0.7 }), [0.07, 0.03, 0.03], { parent: g });
      add(lathe([[0, 0], [0.15, 0], [0.155, 0.12], [0.15, 0.22], [0.1, 0.3], [0, 0.31]]), robe, [0, 0.34, 0], { parent: g });
      shoulderY = 0.6; headY = 0.34 + 0.31 + 0.03 + HR;
    } else {
      add(lathe([[0, 0], [0.21, 0], [0.2, 0.05], [0.15, 0.3], [0.152, 0.45], [0.11, 0.56], [0, 0.57]]), robe, [0, 0, 0], { parent: g });
      shoulderY = 0.52; headY = 0.57 + 0.03 + HR;
    }
  }
  // плечи-катагину (самурайский жилет)
  if (o.kataginu) {
    const kg = mat(o.kataginu, { physical: true, rough: 0.7, sheen: 0.5 });
    add(box(0.46, 0.03, 0.2, 0.012), kg, [0, shoulderY - 0.015, 0], { parent: g });
    [-1, 1].forEach(s => add(box(0.1, 0.2, 0.02, 0.008), kg, [s * 0.075, shoulderY - 0.12, 0.155], { parent: g, rot: [-0.08, 0, s * 0.12] }));
  }
  if (o.mon) [-1, 1].forEach(s => add(new THREE.CircleGeometry(0.022, 24), mat(o.mon, { metal: 0.6, rough: 0.35 }), [s * 0.075, shoulderY - 0.08, 0.168], { parent: g, cast: false }));
  // руки
  const hands = o.hands || 'lap';
  [-1, 1].forEach(s => {
    const sh = [s * 0.15, shoulderY - 0.03, 0];
    const hand = hands === 'lap' ? [s * 0.08, shoulderY - 0.24, 0.17] : hands === 'spear' && s === 1 ? [0.17, shoulderY - 0.16, 0.12] : [s * 0.19, shoulderY - 0.3, 0.03];
    limb(sh, hand, 0.06, robe, g);
    add(sphere(0.04), skin, hand, { parent: g, scale: [1, 0.85, 1.1] });
  });
  // голова
  const head = new THREE.Group(); head.position.set(0, headY, 0); g.add(head);
  add(sphere(HR, 48, 32), skin, [0, 0, 0], { parent: head, scale: [1, 1.04, 0.96] });
  add(sphere(0.03), skin, [-HR, -0.01, 0], { parent: head, scale: [0.5, 1, 0.8] });
  add(sphere(0.03), skin, [HR, -0.01, 0], { parent: head, scale: [0.5, 1, 0.8] });
  const eyeW = mat('#fbfbf6', { physical: true, rough: 0.15, clearcoat: 1 });
  const iris = mat(o.iris || '#3a2414', { rough: 0.2 }), pupil = mat('#0c0806', { rough: 0.1 });
  const spark = mat('#ffffff', { basic: true, toneMapped: false });
  [-1, 1].forEach(s => {
    const ex = s * 0.055, ey = 0.005, ez = HR * 0.86;
    add(sphere(0.03), eyeW, [ex, ey, ez], { parent: head, scale: [1, o.squint ? 0.7 : 1.05, 0.55] });
    add(sphere(0.02), iris, [ex, ey - 0.002, ez + 0.012], { parent: head, scale: [1, o.squint ? 0.75 : 1.05, 0.5] });
    add(sphere(0.011), pupil, [ex, ey - 0.002, ez + 0.019], { parent: head, scale: [1, 1, 0.4] });
    add(sphere(0.005), spark, [ex + 0.008, ey + 0.009, ez + 0.024], { parent: head, cast: false });
    // брови: у самураев тяжёлые и сведённые
    add(capsule(0.008, 0.035), hairM, [ex * 1.05, ey + 0.05, ez + 0.006], { parent: head, rot: [0, 0, Math.PI / 2 + s * (o.frown ?? 0.25)] });
  });
  add(sphere(0.016), skin, [0, -0.03, HR * 0.97], { parent: head });
  add(capsule(o.lips ? 0.011 : 0.007, 0.03), mat(o.lips || '#6a2a24', { rough: 0.4 }), [0, -0.075, HR * 0.9], { parent: head, rot: [0, 0, Math.PI / 2] });
  if (o.hairStyle === 'bun') { // женская причёска: гладкие волосы, пучок, шпилька-кандзаси
    add(sphere(HR * 1.06), hairM, [0, 0.03, -0.03], { parent: head, scale: [1.04, 0.98, 0.96] });
    add(sphere(0.085), hairM, [0, 0.12, -0.12], { parent: head, scale: [1.3, 0.85, 0.9] });
    add(new THREE.CylinderGeometry(0.006, 0.006, 0.32, 8), mat('#d9b45a', { metal: 0.8, rough: 0.3 }), [0.02, 0.15, -0.12], { parent: head, rot: [0, 0, 1.2] });
    add(sphere(0.022), mat('#c8463c', { rough: 0.4 }), [0.16, 0.2, -0.12], { parent: head });
  }
  if (o.hairStyle === 'sailor') { // растрёпанные тёмные волосы
    add(sphere(HR * 1.05), hairM, [0, 0.035, -0.03], { parent: head, scale: [1.05, 0.92, 1] });
    [[-0.09, 0.13, 0.09, 0.5], [0.06, 0.14, 0.1, -0.3], [-0.15, 0.02, 0.02, 1.3], [0.15, 0.02, 0.02, -1.3]].forEach(([x, y, z, r]) => add(sphere(0.055), hairM, [x, y, z], { parent: head, scale: [1.2, 0.5, 0.8], rot: [0.4, 0, r] }));
    if (o.beard) add(sphere(0.095), hairM, [0, -0.085, 0.065], { parent: head, scale: [1.05, 0.7, 0.7] });
  }
  if (o.hairStyle === 'topknot') {
    add(sphere(HR * 1.06), hairM, [0, -0.02, -0.03], { parent: head, scale: [1.03, 0.92, 0.93] }); // бока и затылок, макушка выбрита
    add(capsule(0.024, 0.09), hairM, [0, HR + 0.012, -0.015], { parent: head, rot: [Math.PI / 2 - 0.15, 0, 0] }); // пучок
    add(new THREE.TorusGeometry(0.026, 0.006, 8, 20), mat('#e8e0d0', { rough: 0.5 }), [0, HR + 0.005, -0.075], { parent: head, rot: [0.2, 0, 0] });
    if (o.grey) add(sphere(HR * 1.045), mat('#8a8580', { rough: 0.6, opacity: 0.35 }), [0, -0.02, -0.05], { parent: head, scale: [1.02, 0.9, 0.95], cast: false });
  }
  if (o.hairStyle === 'blond') {
    add(sphere(HR * 1.05), hairM, [0, 0.04, -0.035], { parent: head, scale: [1.05, 0.9, 1] });
    [[-0.1, 0.12, 0.1, 0.6], [0.02, 0.15, 0.12, 0.1], [0.11, 0.11, 0.09, -0.5], [-0.15, 0.0, 0.03, 1.3], [0.155, 0.0, 0.02, -1.3], [0, 0.02, -0.15, 0]].forEach(([x, y, z, r]) =>
      add(sphere(0.06), hairM, [x, y, z], { parent: head, scale: [1.3, 0.55, 0.8], rot: [0.4, 0, r] }));
    add(sphere(0.1), hairM, [0, -0.085, 0.07], { parent: head, scale: [1.1, 0.75, 0.75] }); // борода
    add(capsule(0.012, 0.05), hairM, [0, -0.055, HR * 0.97], { parent: head, rot: [0, 0, Math.PI / 2] }); // усы
  }
  if (o.hat) {
    add(new THREE.ConeGeometry(0.3, 0.13, 40, 1, true), mat('#b89a5c', { rough: 0.9, side: THREE.DoubleSide }), [0, HR + 0.03, 0], { parent: head });
  }
  if (o.spear) {
    const sp = new THREE.Group(); sp.position.set(0.19, 0, 0.12); g.add(sp);
    add(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 10), mat('#6b4a2a', { rough: 0.6 }), [0, 0.75, 0], { parent: sp });
    add(new THREE.ConeGeometry(0.025, 0.14, 4), mat('#c8ccd0', { metal: 0.9, rough: 0.25 }), [0, 1.57, 0], { parent: sp });
  }
  if (o.swords) { // дайсё за поясом
    add(capsule(0.016, 0.5), mat('#120c0a', { physical: true, rough: 0.25, clearcoat: 1 }), [-0.17, shoulderY - 0.24, 0.05], { parent: g, rot: [1.2, 0, 0.3] });
  }
  g.userData.head = head;
  return g;
}

function katanaStand(parent, pos) {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  const lac = mat('#140a08', { physical: true, rough: 0.2, clearcoat: 1 });
  add(box(0.5, 0.04, 0.14, 0.01), lac, [0, 0.02, 0], { parent: g });
  [-1, 1].forEach(s => add(box(0.04, 0.3, 0.06, 0.01), lac, [s * 0.2, 0.17, 0], { parent: g }));
  [0.2, 0.3].forEach((y, i) => {
    add(capsule(0.016, i ? 0.6 : 0.42), lac, [0, y, 0], { parent: g, rot: [0, 0, Math.PI / 2] });
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 20), mat('#c9a24a', { metal: 0.9, rough: 0.3 }), [i ? -0.12 : -0.08, y, 0], { parent: g, rot: [0, 0, Math.PI / 2] });
  });
}


// ---------- огонь, пар, частицы ----------
export const flick = (t, k = 1) => 0.82 + 0.12 * Math.sin(t * 13 * k) + 0.08 * Math.sin(t * 29 * k + 1.3) + 0.05 * Math.sin(t * 47 * k + 2.1);
const softTex = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.5, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
export function fire(pos, s = 1, light = 2.5) {
  const g = new THREE.Group(); g.position.set(...pos); root.add(g);
  const cols = ['#ff5a14', '#ff9a2a', '#ffe08a'];
  const flames = cols.map((c, i) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s * (1 - i * 0.25), 0.32 * s * (1 - i * 0.2), 16), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.position.y = 0.14 * s; g.add(m); return m;
  });
  const glowS = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: '#ff9a40', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glowS.scale.set(1.1 * s, 1.1 * s, 1); glowS.position.y = 0.15 * s; g.add(glowS);
  const L = new THREE.PointLight('#ff9a48', light, 5 * s, 1.6); L.position.set(pos[0], pos[1] + 0.3 * s, pos[2]); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.002; L.shadow.radius = 6; scene.add(L);
  return (t) => {
    flames.forEach((m, i) => { const f = flick(t + i * 0.37, 1 + i * 0.2); m.scale.set(1 + (f - 1) * 0.5, f * (1 + i * 0.05), 1 + (f - 1) * 0.5); m.rotation.y = t * (1 + i); m.position.x = Math.sin(t * 7 + i) * 0.01 * s; });
    L.intensity = light * flick(t); glowS.material.opacity = 0.45 + 0.15 * flick(t + 0.5);
  };
}
export function steam(pos, s = 1, n = 18, color = '#e8e2d8') {
  const ps = Array.from({ length: n }, (_, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color, transparent: true, opacity: 0, depthWrite: false }));
    root.add(sp); return { sp, off: i / n, x: (rnd() - 0.5) * 0.3 * s, z: (rnd() - 0.5) * 0.3 * s, sw: rnd() * 6 };
  });
  return (t) => ps.forEach(p => {
    const u = (t * 0.35 + p.off) % 1;
    p.sp.position.set(pos[0] + p.x + Math.sin(u * 4 + p.sw) * 0.12 * s, pos[1] + u * 1.4 * s, pos[2] + p.z);
    const k = (0.3 + u * 1.2) * s; p.sp.scale.set(k, k, 1);
    p.sp.material.opacity = Math.sin(u * Math.PI) * 0.35;
  });
}
export const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const V3 = (a) => new THREE.Vector3(...a);

export { THREE, scene, camera, renderer, root, rnd, canvasTex, mat, add, sphere, box, capsule, limb, lathe, shade, jitter, woodTex, person, katanaStand, softTex };

// ---------- запуск: постобработка и анимация ----------
// build() строит сцену и возвращает {cam: {from, to, lookFrom, lookTo, fov}, focus: [x,y,z] | (t)=>Vector3, update?(t, T)}
export function run(build) {
  const T = +(P.get('dur') || 6);
  const plan = build(T) || {};
  const cam = plan.cam;
  camera.fov = cam?.fov ?? 40; camera.aspect = W / H; camera.updateProjectionMatrix();
  const env = new THREE.PMREMGenerator(renderer);
  scene.environment = env.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = plan.env ?? 0.15;
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, W, H);
  ao.updateGtaoMaterial({ radius: 0.25, distanceExponent: 1, thickness: 1, scale: 1, samples: 16 }); ao.blendIntensity = 0.8;
  composer.addPass(ao);
  const bok = new BokehPass(scene, camera, { focus: 3, aperture: plan.aperture ?? 0.01, maxblur: 0.01 });
  composer.addPass(bok);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), plan.bloom ?? 0.45, 0.5, 0.9));
  composer.addPass(new OutputPass());
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null }, vig: { value: 0.4 }, grain: { value: 0.02 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, grain; varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){ vec4 c=texture2D(tDiffuse,vUv); vec2 d=vUv-0.5; d.x*=0.7;
      c.rgb*= 1.0 - vig*smoothstep(0.2,0.75,length(d)); c.rgb += (h(vUv*1000.0)-0.5)*grain; gl_FragColor=c; }`,
  }));
  const look = new THREE.Vector3();
  window.TOTAL = T;
  window.renderAt = (t) => {
    const u = ease(t / T);
    if (cam) {
      camera.position.lerpVectors(V3(cam.from), V3(cam.to ?? cam.from), u);
      look.lerpVectors(V3(cam.lookFrom), V3(cam.lookTo ?? cam.lookFrom), u);
      camera.lookAt(look);
    }
    plan.update?.(t, T);
    const f = typeof plan.focus === 'function' ? plan.focus(t) : V3(plan.focus ?? [0, 1, 0]);
    bok.uniforms.focus.value = camera.position.distanceTo(f);
    composer.render();
  };
  window.renderAt(+(P.get('t') || 0));
  window.__done = true;
}
