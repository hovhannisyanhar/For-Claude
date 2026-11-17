// Пробные кадры «Сёгуна» в 3D: ?style=pixar|diorama&shot=hall|shore&w=&h=
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
const SHOT = P.get('shot') || 'hall';
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
  add(capsule(0.007, 0.03), mat('#6a2a24', { rough: 0.5 }), [0, -0.075, HR * 0.9], { parent: head, rot: [0, 0, Math.PI / 2] });
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

// ---------- ЗАЛ: Торанага и четыре тени регентов ----------
function buildHall() {
  const tatami = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#b9a466'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(${90 + rnd() * 40},${80 + rnd() * 30},30,${0.12 + rnd() * 0.1})`; g.fillRect(0, y, w, 1.5); }
    g.fillStyle = '#20281e'; // кайма
    g.fillRect(0, 0, w, 22); g.fillRect(0, h / 2 - 11, w, 22); g.fillRect(w / 2 - 11, 0, 22, h / 2); g.fillRect(0, h / 2, 22, h / 2);
  }, [2, 2]);
  const floorM = mat('#ffffff', { map: tatami, rough: 0.85 });
  add(new THREE.PlaneGeometry(6, 6), floorM, [0, 0, -1], { rot: [-Math.PI / 2, 0, 0], cast: false });
  const shojiTex = (regents) => canvasTex(1024, 640, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d9b47a'); gr.addColorStop(1, '#f0cf91');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (regents) {
      // фонари за бумагой
      regents.forEach(x => { const r = g.createRadialGradient(x + 60, h * 0.62, 5, x + 60, h * 0.62, 170); r.addColorStop(0, 'rgba(255,200,110,0.95)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
      // тени сидящих регентов
      g.filter = 'blur(5px)'; g.fillStyle = 'rgba(30,12,4,0.82)';
      regents.forEach((x, i) => {
        const y0 = h * 0.93, s = 1;
        g.beginPath(); g.ellipse(x, y0 - 30, 85, 40, 0, 0, 7); g.fill(); // колени
        g.beginPath(); g.moveTo(x - 62, y0 - 40); g.lineTo(x - 95, y0 - 200); g.lineTo(x + 95, y0 - 200); g.lineTo(x + 62, y0 - 40); g.fill(); // торс
        g.beginPath(); g.moveTo(x - 115, y0 - 190); g.lineTo(x + 115, y0 - 190); g.lineTo(x + 70, y0 - 225); g.lineTo(x - 70, y0 - 225); g.fill(); // катагину
        g.beginPath(); g.arc(x, y0 - 265, 42, 0, 7); g.fill(); // голова
        g.beginPath(); g.ellipse(x + (i % 2 ? 6 : -6), y0 - 310, 9, 20, 0.2, 0, 7); g.fill(); // пучок
        g.save(); g.translate(x - 70, y0 - 110); g.rotate(i % 2 ? -0.35 : -0.25); g.fillRect(-130, -6, 200, 12); g.restore(); // меч
      });
      g.filter = 'none';
    }
    // решётка
    g.fillStyle = '#2b1a10';
    for (let x = 0; x <= w; x += w / 8) g.fillRect(x - 4, 0, 8, h);
    for (let y = 0; y <= h; y += h / 5) g.fillRect(0, y - 4, w, 8);
    g.fillRect(0, 0, w, 18); g.fillRect(0, h - 22, w, 22);
  });
  const backTex = shojiTex([170, 400, 630, 860]);
  const back = add(new THREE.PlaneGeometry(4, 2.5), mat('#ffffff', { map: backTex, emissiveMap: backTex, emissive: '#ffffff', ei: 0.95, rough: 0.9 }), [0, 1.25, -2.4], { cast: false });
  if (DIO) {
    const sideTex = shojiTex(null);
    add(new THREE.PlaneGeometry(3.4, 2.5), mat('#ffffff', { map: sideTex, emissiveMap: sideTex, emissive: '#ffffff', ei: 0.6, rough: 0.9 }), [-2, 1.25, -0.7], { rot: [0, Math.PI / 2, 0], cast: false });
  }
  // столбы и балка
  const dark = mat('#2a170d', { map: woodTex, rough: 0.5, physical: true, clearcoat: 0.3 });
  [-2, 2].forEach(x => add(box(0.16, 2.6, 0.16), dark, [x, 1.3, -2.35]));
  add(box(4.2, 0.18, 0.18), dark, [0, 2.55, -2.35]);
  add(box(4.2, 0.08, 0.12), dark, [0, 0.04, -2.33]);
  // фонари-андон
  const andon = (x, z) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    add(box(0.24, 0.42, 0.24, 0.01), mat('#ffd9a0', { emissive: '#ffb860', ei: 1.8, rough: 0.9 }), [0, 0.42, 0], { parent: g, cast: false });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(box(0.025, 0.66, 0.025, 0.005), dark, [a * 0.125, 0.33, b * 0.125], { parent: g }));
    add(box(0.28, 0.025, 0.28, 0.005), dark, [0, 0.64, 0], { parent: g });
    const l = new THREE.PointLight('#ffad55', 2.4, 3.2, 1.6); l.position.set(x, 0.45, z); l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.radius = 6; l.shadow.bias = -0.002; scene.add(l);
  };
  andon(-0.62, -1.35); andon(0.64, -1.0);
  // Торанага
  const tora = person({ pose: 'seiza', robe: '#3a2a1e', robe2: '#241812', kataginu: '#5b3b1c', mon: '#d9b45a', hairStyle: 'topknot', grey: true, frown: 0.3, squint: true, swords: true });
  tora.position.set(0, 0, -1.25); root.add(tora);
  katanaStand(root, [0.42, 0, -1.55]);
  // свет
  scene.add(new THREE.HemisphereLight('#6d5a8a', '#2a1a10', 0.35));
  const backGlow = new THREE.SpotLight('#ffb466', 5, 6, 0.8, 0.9, 1.2); backGlow.position.set(0, 1.4, -2.3); backGlow.target.position.set(0, 0.6, -1.2); scene.add(backGlow, backGlow.target);
  const key = new THREE.SpotLight('#ffd7a8', 2.2, 6, 0.4, 0.8, 1.4); key.position.set(-1.2, 1.9, 0.6); key.target.position.set(0, 0.6, -1.25); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005; scene.add(key, key.target);
  scene.background = new THREE.Color('#0d0806');
  if (DIO) {
    camera.fov = 40; camera.position.set(2.6, 3.6, 3.4); camera.lookAt(-0.1, 0.55, -1.2);
    add(box(4.6, 0.3, 3.8, 0.06), mat('#24150d', { map: woodTex, rough: 0.5 }), [0, -0.16, -0.65], { cast: false });
    root.children.find(m => m.geometry?.type === 'PlaneGeometry' && m.rotation.x < 0).geometry = new THREE.PlaneGeometry(4, 3.4);
    root.children.find(m => m.geometry?.type === 'PlaneGeometry' && m.rotation.x < 0).position.set(0, 0.001, -0.7);
    scene.background = new THREE.Color('#120c10');
  } else {
    camera.fov = 40; camera.position.set(0.1, 0.95, 1.9); camera.lookAt(0, 0.95, -1.8);
  }
  return new THREE.Vector3(0, 0.6, -1.25);
}

// ---------- БЕРЕГ: корабль на скалах, Блэкторн, крестьяне ----------
function buildShore() {
  const fogC = '#8e9ba3';
  scene.fog = new THREE.Fog(fogC, DIO ? 9 : 5, DIO ? 22 : 16);
  // небо
  if (!DIO) {
    const sky = canvasTex(512, 1024, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3b4652'); gr.addColorStop(0.55, '#7d8b94'); gr.addColorStop(0.75, '#c9c3b2'); gr.addColorStop(1, '#8e9ba3');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.filter = 'blur(18px)';
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${40 + rnd() * 40},${50 + rnd() * 40},${60 + rnd() * 40},0.35)`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h * 0.55, 80 + rnd() * 120, 20 + rnd() * 30, 0, 0, 7); g.fill(); }
      const sun = g.createRadialGradient(w * 0.3, h * 0.62, 5, w * 0.3, h * 0.62, 180); sun.addColorStop(0, 'rgba(255,230,190,0.9)'); sun.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = sun; g.fillRect(0, 0, w, h);
    });
    const skyM = new THREE.MeshBasicMaterial({ map: sky, fog: false, toneMapped: true });
    add(new THREE.PlaneGeometry(26, 40), skyM, [0, 6, -18], { cast: false, recv: false });
  }
  // море
  const seaG = new THREE.PlaneGeometry(DIO ? 7 : 40, DIO ? 2.8 : 30, 160, 120);
  { const p = seaG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 2.1 + y * 1.3) * 0.04 + Math.sin(x * 5.3 - y * 3.7) * 0.015 + Math.sin(y * 0.9) * 0.05); } seaG.computeVertexNormals(); }
  add(seaG, mat('#3e5761', { physical: true, rough: 0.18, clearcoat: 0.8 }), [0, DIO ? 0.12 : 0.02, DIO ? -3.7 : -14], { rot: [-Math.PI / 2, 0, 0], cast: false });
  // песок
  const sandG = new THREE.PlaneGeometry(DIO ? 7 : 40, DIO ? 4.6 : 9, 120, 60);
  { const p = sandG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, (DIO ? 0.03 : (y + 4.5) * 0.025) + Math.sin(x * 3 + y * 2) * 0.02); } sandG.computeVertexNormals(); }
  add(sandG, mat('#b8a47e', { rough: 0.95 }), [0, 0, DIO ? -0.2 : -0.2], { rot: [-Math.PI / 2, 0, 0], cast: false });
  // пена у кромки
  for (let i = 0; i < 26; i++) add(sphere(0.12, 16, 10), mat('#e8ecea', { rough: 0.6 }), [-3.4 + i * 0.27 + rnd() * 0.1, 0.04, (DIO ? -2.5 : -1.45) - rnd() * 0.12], { scale: [1.8, 0.08, 0.4], cast: false });
  // скалы
  const rockM = mat('#3a3c3e', { rough: 0.9 });
  [[1.3, -3.4, 0.7], [2.1, -3.0, 0.45], [0.6, -3.7, 0.4], [2.6, -3.9, 0.8], [-2.4, -2.6, 0.35]].forEach(([x, z, s]) => add(jitter(new THREE.IcosahedronGeometry(s, 2), 0.25, 2), rockM, [x, s * 0.35, z], { rot: [rnd(), rnd() * 3, 0] }));
  // корабль
  const ship = new THREE.Group(); ship.position.set(1.2, 0.15, -3.6); ship.rotation.set(0.05, -0.35, 0.2); root.add(ship);
  const hullG = new THREE.BoxGeometry(2.8, 0.75, 0.9, 40, 10, 10);
  { const p = hullG.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const t = (y + 0.375) / 0.75; z *= 0.45 + 0.55 * Math.sqrt(t); if (x > 0.8) z *= Math.max(0.05, 1 - ((x - 0.8) / 0.6) ** 2); if (x > 0.8) y += (x - 0.8) * 0.18 * t; p.setXYZ(i, x, y, z); } hullG.computeVertexNormals(); }
  const hullM = mat('#b08a66', { map: woodTex, rough: 0.7 });
  add(hullG, hullM, [0, 0.38, 0], { parent: ship });
  add(box(0.7, 0.45, 0.78, 0.02), hullM, [-1.05, 0.95, 0], { parent: ship }); // корма
  add(box(2.2, 0.04, 0.6, 0.01), mat('#6b4a33', { rough: 0.8 }), [0, 0.74, 0], { parent: ship });
  const mastM = mat('#3a2618', { rough: 0.7 });
  add(new THREE.CylinderGeometry(0.035, 0.045, 2.2, 12), mastM, [0.3, 1.8, 0], { parent: ship });
  add(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 12), mastM, [-0.6, 1.15, 0], { parent: ship, rot: [0, 0, 0.2] }); // сломанная мачта
  add(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), mastM, [0.3, 2.55, 0], { parent: ship, rot: [0, 0, Math.PI / 2 - 0.1] });
  const sailG = new THREE.PlaneGeometry(1.0, 0.9, 20, 20);
  { const p = sailG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin((y + 0.45) * 2.5) * 0.12 + Math.sin(x * 7) * 0.02); if (y < -0.2 && x > 0.1 && Math.sin(x * 23) > 0.2) p.setY(i, -0.2 + (y + 0.2) * 0.3); } sailG.computeVertexNormals(); }
  add(sailG, mat('#cfc4a8', { rough: 0.95, side: THREE.DoubleSide }), [0.32, 2.05, 0.06], { parent: ship, rot: [0, Math.PI / 2, 0] });
  // верёвки
  [[0.3, 2.9, 0, 1.35, 0.8, 0], [0.3, 2.9, 0, -1.3, 1.1, 0], [0.3, 2.4, 0, 0.9, 0.8, 0.4]].forEach(([a, b, c, d, e, f]) => limb([a, b, c], [d, e, f], 0.006, mat('#2a2018', { rough: 0.9 }), ship));
  // деревня слева
  const houseM = mat('#5a4a3a', { rough: 0.9 }), roofM = mat('#8c7a50', { rough: 1 });
  (DIO ? [[-2.6, -1.6, 0.8], [-2.7, -0.4, 0.9], [-1.7, -2.0, 0.7]] : [[-2.6, -2.3, 0.9], [-3.3, -3.6, 1.1], [-1.9, -4.4, 0.8]]).forEach(([x, z, s]) => {
    add(box(0.9 * s, 0.55 * s, 0.7 * s, 0.02), houseM, [x, 0.27 * s, z]);
    add(new THREE.ConeGeometry(0.75 * s, 0.55 * s, 4), roofM, [x, 0.55 * s + 0.26 * s, z], { rot: [0, Math.PI / 4, 0], scale: [1.05, 1, 0.8] });
  });
  // лодки на песке
  [[-1.4, -1.0, 0.4], [-0.9, -1.3, -0.2]].forEach(([x, z, r]) => add(new THREE.SphereGeometry(0.35, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#5b4330', { rough: 0.8, side: THREE.DoubleSide }), [x, 0.12, z], { scale: [1.7, 0.4, 0.55], rot: [Math.PI, r, 0] }));
  // люди
  const bt = person({ pose: 'stand', trousers: true, robe: '#d8d0bd', robe2: '#3a3430', skin: '#efb995', hair: '#a07a40', hairStyle: 'blond', iris: '#3b6a8a', frown: -0.15, hands: 'down' });
  bt.position.set(-0.05, 0.05, -0.5); bt.rotation.y = 0.15; root.add(bt);
  const v1 = person({ pose: 'stand', robe: '#4b5a6a', hairStyle: 'topknot', hat: true, spear: true, hands: 'spear', frown: 0.35 });
  v1.position.set(-0.75, 0.04, -1.15); v1.rotation.y = 0.55; root.add(v1);
  const v2 = person({ pose: 'stand', robe: '#6a5a40', hairStyle: 'topknot', hat: true, spear: true, hands: 'spear', frown: 0.35 });
  v2.position.set(0.68, 0.04, -1.25); v2.rotation.y = -0.7; root.add(v2);
  // свет: серое утро, луч сквозь облака
  scene.add(new THREE.HemisphereLight('#aab8c4', '#5a4e40', 1.1));
  const sun = new THREE.DirectionalLight('#ffe2b8', 2.3); sun.position.set(-4, 5, -6); sun.target.position.set(0, 0, -1);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.radius = 5;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 });
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#b8c8d8', 0.9); fill.position.set(2, 2, 4); scene.add(fill);
  scene.background = new THREE.Color(fogC);
  if (DIO) {
    camera.fov = 52; camera.position.set(3.4, 6.6, 5.2); camera.lookAt(-0.1, 0.4, -2.2);
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
    const base = add(box(7.2, 0.6, 7.6, 0.08), mat('#3b2c22', { rough: 0.8 }), [0, -0.31, -1.3], { cast: false });
    scene.background = new THREE.Color('#2b333b'); scene.fog = null;
  } else {
    camera.fov = 40; camera.position.set(-0.1, 1.15, 3.5); camera.lookAt(0.3, 1.05, -3);
  }
  return new THREE.Vector3(0, 0.7, -0.5);
}

const focus = SHOT === 'hall' ? buildHall() : buildShore();
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
