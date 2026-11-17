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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const ACTOR = new URLSearchParams(location.search).get('actor');

const params = new URLSearchParams(location.search);
const STYLE = params.get('style') || 'pixar';
const W = +(params.get('w') || 1080), H = +(params.get('h') || 1920);

const LOWPOLY = STYLE === 'lowpoly';
const TOON = STYLE === 'toon' || STYLE === 'comic';
const CLAY = STYLE === 'clay';
const SEG = LOWPOLY ? 0.22 : 1; // множитель сегментов

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = TOON ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 60);

// ---------- текстуры ----------
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const skyTex = canvasTex(1024, 1024, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#0b1636'); gr.addColorStop(0.55, '#1d3466'); gr.addColorStop(1, '#3d4f84');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + rnd() * 0.7})`; const r = rnd() * 1.8 + 0.4; g.beginPath(); g.arc(rnd() * w, rnd() * h * 0.6, r, 0, 7); g.fill(); }
  // луна
  const mx = w * 0.68, my = h * 0.24;
  const halo = g.createRadialGradient(mx, my, 10, mx, my, 220); halo.addColorStop(0, 'rgba(255,240,200,0.55)'); halo.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = halo; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(mx, my, 62, 0, 7); g.fill();
  g.fillStyle = 'rgba(220,205,170,0.5)'; [[-18, -10, 14], [16, 14, 10], [4, -26, 7]].forEach(([x, y, r]) => { g.beginPath(); g.arc(mx + x, my + y, r, 0, 7); g.fill(); });
  // город
  for (let layer = 0; layer < 2; layer++) {
    let x = -10;
    while (x < w) {
      const bw = 40 + rnd() * 90, bh = (layer ? 160 : 260) + rnd() * (layer ? 160 : 200);
      const y = h - bh;
      g.fillStyle = layer ? '#131b33' : '#222d4f'; g.fillRect(x, y, bw, bh);
      if (rnd() < 0.3) { g.fillRect(x + bw * 0.4, y - 40, 6, 40); }
      for (let wy = y + 14; wy < h - 10; wy += 22) for (let wx = x + 8; wx < x + bw - 10; wx += 16)
        if (rnd() < (layer ? 0.35 : 0.2)) { g.fillStyle = rnd() < 0.8 ? '#ffc76b' : '#ffe9b0'; g.fillRect(wx, wy, 8, 11); }
      x += bw + 4;
    }
  }
});

const woodTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#8a5634'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `hsl(${22 + rnd() * 6},${45 + rnd() * 10}%,${30 + rnd() * 8}%)`; g.fillRect(0, i * 64, w, 62);
    g.strokeStyle = 'rgba(40,20,10,0.25)'; g.lineWidth = 1.5;
    for (let k = 0; k < 6; k++) { g.beginPath(); const y = i * 64 + rnd() * 60; g.moveTo(0, y); for (let x = 0; x < w; x += 32) g.lineTo(x, y + Math.sin(x / 60 + k) * 3); g.stroke(); }
    g.fillStyle = 'rgba(30,15,8,0.6)'; g.fillRect(0, i * 64 + 62, w, 2);
  }
}, [2, 2]);

const wallTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#4c6a73'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, 0, 30, h); }
  g.fillStyle = 'rgba(255,230,180,0.10)';
  for (let y = 32; y < h; y += 64) for (let x = 16 + ((y / 64) % 2) * 32; x < w; x += 64) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
}, [3, 3]);

const rugTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#a8413a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e8b25a'; g.lineWidth = 18; g.strokeRect(30, 30, w - 60, h - 60);
  g.strokeStyle = '#3a5f7a'; g.lineWidth = 10; g.strokeRect(70, 70, w - 140, h - 140);
  g.fillStyle = '#e8b25a'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(w / 2, 120 + i * 60); g.lineTo(w / 2 + 40, 150 + i * 60); g.lineTo(w / 2, 180 + i * 60); g.lineTo(w / 2 - 40, 150 + i * 60); g.fill(); }
});

// отпечатки пальцев для пластилина
const clayBump = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * w, y = rnd() * h, r = 6 + rnd() * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const v = rnd() < 0.5 ? 0 : 255; gr.addColorStop(0, `rgba(${v},${v},${v},0.10)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 1.2;
  for (let i = 0; i < 40; i++) { const x = rnd() * w, y = rnd() * h; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(x, y, 6 + k * 4, 4 + k * 3, rnd(), 0, Math.PI * 1.2); g.stroke(); } }
}, [5, 5]);
clayBump.colorSpace = THREE.NoColorSpace;

const toonGrad = (() => {
  const d = new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();

// ---------- материалы ----------
const outlineMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: { thick: { value: 0.006 } },
  vertexShader: `uniform float thick; void main(){ vec3 p = position + normal*thick; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);} `,
  fragmentShader: `void main(){ gl_FragColor = vec4(0.07,0.05,0.09,1.0);} `,
});

function mat(color, o = {}) {
  const c = new THREE.Color(color);
  if (o.basic) return new THREE.MeshBasicMaterial({ color: c, map: o.map || null, transparent: !!o.opacity, opacity: o.opacity ?? 1, toneMapped: o.toneMapped ?? true });
  if (TOON) {
    const m = new THREE.MeshToonMaterial({ color: c, gradientMap: toonGrad, map: o.map || null, transparent: o.opacity != null, opacity: o.opacity ?? 1 });
    if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei ?? 1; }
    return m;
  }
  if (o.physical && !LOWPOLY && !CLAY) {
    return new THREE.MeshPhysicalMaterial({ color: c, roughness: o.rough ?? 0.6, map: o.map || null, sheen: o.sheen ?? 0, sheenColor: new THREE.Color(o.sheenColor || '#ffffff'), sheenRoughness: 0.5, clearcoat: o.clearcoat ?? 0, transparent: o.opacity != null, opacity: o.opacity ?? 1, transmission: o.transmission ?? 0, thickness: 0.1, emissive: new THREE.Color(o.emissive || '#000'), emissiveIntensity: o.ei ?? 1 });
  }
  const m = new THREE.MeshStandardMaterial({
    color: c, roughness: CLAY ? 0.85 : (o.rough ?? 0.6), metalness: o.metal ?? 0,
    map: o.map || null, flatShading: LOWPOLY,
    transparent: o.opacity != null, opacity: o.opacity ?? 1,
    emissive: new THREE.Color(o.emissive || '#000'), emissiveIntensity: o.ei ?? 1,
  });
  if (CLAY && !o.emissive && !o.noBump) { m.bumpMap = clayBump; m.bumpScale = 6; m.color.offsetHSL(0, 0.12, 0.02); }
  return m;
}

const M = {
  skin: mat('#f3a77e', { physical: true, rough: 0.5, sheen: 0.5, sheenColor: '#ff9f86', emissive: '#3a0c04', ei: 1 }),
  blush: mat('#ff7f7a', { opacity: 0.45, rough: 0.6 }),
  hair: mat('#3a2216', { physical: true, rough: 0.45, clearcoat: 0.3 }),
  sweater: mat('#e6a12f', { physical: true, rough: 0.9, sheen: 1, sheenColor: '#ffd98a' }),
  scarf: mat('#2f8c8a', { physical: true, rough: 0.9, sheen: 1 }),
  eyeW: mat('#fbfbf6', { rough: 0.15, physical: true, clearcoat: 1 }),
  iris: mat('#5b3a1e', { rough: 0.2 }),
  pupil: mat('#0c0806', { rough: 0.1 }),
  spark: mat('#ffffff', { basic: true, toneMapped: false }),
  mouth: mat('#5a1e22', { rough: 0.5 }),
  wood: mat('#a76a3f', { map: LOWPOLY || TOON ? null : woodTex, rough: 0.55, physical: true, clearcoat: 0.2 }),
  darkwood: mat('#6b3b22', { rough: 0.6 }),
  wall: mat('#4f6e78', { map: LOWPOLY ? null : wallTex, rough: 0.9, noBump: false }),
  floor: mat('#7c4c30', { map: LOWPOLY || TOON ? null : woodTex, rough: 0.7 }),
  rug: mat('#a8413a', { map: LOWPOLY ? null : rugTex, rough: 1 }),
  frame: mat('#efe6d2', { rough: 0.5 }),
  curtain: mat('#c4523f', { physical: true, rough: 0.95, sheen: 1, sheenColor: '#ff9a80' }),
  chair: mat('#3f6b8f', { rough: 0.5 }),
  glass: mat('#cfe8f0', { opacity: 0.22, rough: 0.05, physical: true, clearcoat: 1 }),
  lid: mat('#b88a3c', { metal: 0.6, rough: 0.35 }),
  fly: mat('#ffe27a', { emissive: '#ffcf4a', ei: 2.2, basic: false }),
  bulb: mat('#ffe9b0', { emissive: '#ffc35a', ei: 1.6 }),
  pot: mat('#c9673e', { rough: 0.7 }),
  leaf: mat('#3f8f4f', { rough: 0.6 }),
  mug: mat('#e8eef2', { rough: 0.3, physical: true, clearcoat: 0.6 }),
  paper: mat('#f3ead8', { rough: 0.9 }),
  books: ['#c0392b', '#2e6f9e', '#e0a43a', '#4b8b5a', '#7d4e9e', '#d9643a'].map(c => mat(c, { rough: 0.7 })),
  sky: new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false }),
};

// ---------- помощники ----------
const root = new THREE.Group(); scene.add(root);
const outlined = [];
function add(geo, m, pos = [0, 0, 0], o = {}) {
  if (CLAY && !m.transparent && geo.attributes.normal) geo = lumpy(geo);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(...pos);
  if (o.rot) mesh.rotation.set(...o.rot);
  if (o.scale) mesh.scale.set(...(Array.isArray(o.scale) ? o.scale : [o.scale, o.scale, o.scale]));
  mesh.castShadow = o.cast ?? true; mesh.receiveShadow = o.recv ?? true;
  (o.parent || root).add(mesh);
  if (TOON && o.outline !== false && !(m.transparent)) outlined.push(mesh);
  return mesh;
}
function lumpy(g) {
  g = g.clone(); const p = g.attributes.position, n = g.attributes.normal;
  const f = (x, y, z) => Math.sin(x * 37.1 + y * 11.3) * Math.sin(y * 29.7 + z * 17.9) * Math.sin(z * 23.3 + x * 13.1);
  for (let i = 0; i < p.count; i++) { const k = 0.0035 * f(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, p.getX(i) + n.getX(i) * k, p.getY(i) + n.getY(i) * k, p.getZ(i) + n.getZ(i) * k); }
  g.computeVertexNormals(); return g;
}
const S = (n) => Math.max(3, Math.round(n * SEG));
const sphere = (r, a = 48, b = 32) => new THREE.SphereGeometry(r, S(a), S(b));
const box = (w, h, d, r = 0.02) => (LOWPOLY ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 4, r));
const capsule = (r, l) => new THREE.CapsuleGeometry(r, l, S(8), S(24));
const cyl = (rt, rb, h, s = 40) => new THREE.CylinderGeometry(rt, rb, h, S(s));

function limb(a, b, r, m, parent) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const mesh = add(capsule(r, len), m, [0, 0, 0], { parent });
  mesh.position.copy(A).add(B).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return mesh;
}

// ---------- комната ----------
const ROOM = { x: 1.35, back: -2.5, front: 0.9, h: 2.9 };
add(new THREE.BoxGeometry(ROOM.x * 2 + 0.2, 0.12, ROOM.front - ROOM.back + 0.1), M.floor, [0, -0.06, (ROOM.front + ROOM.back) / 2], { cast: false });
add(new THREE.CylinderGeometry(0.95, 0.95, 0.012, S(64)), M.rug, [0, 0.006, -1.0], { scale: [1.25, 1, 0.8], cast: false });
// задняя стена с окном
const WIN = { x0: -0.72, x1: 0.72, y0: 1.02, y1: 2.32 };
const wallZ = ROOM.back, wt = 0.12;
const wallPart = (x0, x1, y0, y1) => add(new THREE.BoxGeometry(x1 - x0, y1 - y0, wt), M.wall, [(x0 + x1) / 2, (y0 + y1) / 2, wallZ - wt / 2], { cast: false });
wallPart(-ROOM.x - 0.1, WIN.x0, 0, ROOM.h); wallPart(WIN.x1, ROOM.x + 0.1, 0, ROOM.h);
wallPart(WIN.x0, WIN.x1, 0, WIN.y0); wallPart(WIN.x0, WIN.x1, WIN.y1, ROOM.h);
// боковые стены
add(new THREE.BoxGeometry(wt, ROOM.h, ROOM.front - ROOM.back), M.wall, [-ROOM.x - 0.06, ROOM.h / 2, (ROOM.front + ROOM.back) / 2], { cast: false });
add(new THREE.BoxGeometry(wt, ROOM.h, ROOM.front - ROOM.back), M.wall, [ROOM.x + 0.06, ROOM.h / 2, (ROOM.front + ROOM.back) / 2], { cast: false });
// плинтус
add(box(ROOM.x * 2, 0.1, 0.03, 0.01), M.frame, [0, 0.05, wallZ + 0.015]);
// рама окна
const fr = 0.06;
add(box(WIN.x1 - WIN.x0 + fr * 2, fr, 0.1), M.frame, [0, WIN.y1 + fr / 2, wallZ]);
add(box(WIN.x1 - WIN.x0 + fr * 4, fr * 1.2, 0.26), M.frame, [0, WIN.y0 - fr * 0.4, wallZ + 0.06]);
add(box(fr, WIN.y1 - WIN.y0, 0.1), M.frame, [WIN.x0 - fr / 2, (WIN.y0 + WIN.y1) / 2, wallZ]);
add(box(fr, WIN.y1 - WIN.y0, 0.1), M.frame, [WIN.x1 + fr / 2, (WIN.y0 + WIN.y1) / 2, wallZ]);
add(box(0.035, WIN.y1 - WIN.y0, 0.05), M.frame, [0, (WIN.y0 + WIN.y1) / 2, wallZ - 0.02]);
add(box(WIN.x1 - WIN.x0, 0.035, 0.05), M.frame, [0, WIN.y0 + (WIN.y1 - WIN.y0) * 0.62, wallZ - 0.02]);
// небо за окном
const sky = add(new THREE.PlaneGeometry(9, 9), M.sky, [-0.9, 1.9, -7.5], { cast: false, recv: false, outline: false });
// шторы
function curtain(x, flip) {
  const g = new THREE.PlaneGeometry(0.42, 1.75, S(40), 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / 0.42 + 0.5, v = p.getY(i) / 1.75 + 0.5;
    const gather = 1 - v * 0.35; // к низу шире
    p.setZ(i, Math.sin(u * Math.PI * 7) * 0.045);
    p.setX(i, (u - 0.5) * 0.42 * (0.7 + 0.5 * (1 - v)) * (flip ? -1 : 1) * gather);
  }
  g.computeVertexNormals();
  const m = M.curtain.clone(); m.side = THREE.DoubleSide;
  add(g, m, [x, 1.53, wallZ + 0.1]);
}
curtain(WIN.x0 - 0.06, false); curtain(WIN.x1 + 0.06, true);
add(cyl(0.015, 0.015, 1.9, 12), M.lid, [0, 2.45, wallZ + 0.1], { rot: [0, 0, Math.PI / 2] });
// гирлянда
const bulbs = [];
for (let i = 0; i <= 12; i++) {
  const t = i / 12, x = WIN.x0 - 0.1 + t * (WIN.x1 - WIN.x0 + 0.2);
  const y = 2.36 - Math.sin(t * Math.PI) * 0.16;
  bulbs.push(add(sphere(0.022, 12, 8), M.bulb, [x, y, wallZ + 0.16], { cast: false }));
}
// полка слева
add(box(0.55, 0.04, 0.22, 0.01), M.darkwood, [-1.0, 1.75, wallZ + 0.11]);
let bx = -1.24;
for (let i = 0; i < 6; i++) { const h = 0.2 + rnd() * 0.08, w = 0.045 + rnd() * 0.03; add(box(w, h, 0.17, 0.005), M.books[i % 6], [bx + w / 2, 1.77 + h / 2, wallZ + 0.11], { rot: [0, 0, i === 5 ? -0.3 : 0] }); bx += w + 0.008; }
add(sphere(0.07), M.pot, [-0.82, 1.84, wallZ + 0.11], { scale: [1, 0.9, 1] });
// рамка-картина справа
add(box(0.36, 0.46, 0.03, 0.01), M.darkwood, [1.0, 1.75, wallZ + 0.02]);
add(new THREE.PlaneGeometry(0.29, 0.39), mat('#e7c66a', { map: canvasTex(128, 160, (g, w, h) => { g.fillStyle = '#f1dfae'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f8c8a'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.4, h * 0.45); g.lineTo(w * 0.7, h * 0.7); g.lineTo(w, h * 0.35); g.lineTo(w, h); g.fill(); g.fillStyle = '#e46b3d'; g.beginPath(); g.arc(w * 0.7, h * 0.25, 16, 0, 7); g.fill(); }) }), [1.0, 1.75, wallZ + 0.04], { cast: false });
// растение в горшке на полу справа
add(cyl(0.16, 0.12, 0.32), M.pot, [1.02, 0.16, -2.15]);
for (let i = 0; i < 9; i++) {
  const a = (i / 9) * Math.PI * 2, l = 0.35 + rnd() * 0.25;
  const leaf = add(sphere(0.09, 16, 10), M.leaf, [1.02 + Math.cos(a) * 0.13, 0.42 + l * 0.6, -2.15 + Math.sin(a) * 0.13], { scale: [0.45, 1.6, 0.18] });
  leaf.rotation.set(Math.sin(a) * 0.6, a, -Math.cos(a) * 0.6);
}

// ---------- стол ----------
const DESK = { y: 0.74, z0: -1.58, z1: -0.92, w: 1.5 };
add(box(DESK.w, 0.05, DESK.z1 - DESK.z0, 0.015), M.wood, [0, DESK.y - 0.025, (DESK.z0 + DESK.z1) / 2]);
add(box(DESK.w - 0.06, 0.16, 0.03, 0.01), M.wood, [0, DESK.y - 0.13, DESK.z1 - 0.03]);
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => add(box(0.05, DESK.y - 0.05, 0.05, 0.01), M.wood, [sx * (DESK.w / 2 - 0.05), (DESK.y - 0.05) / 2, sz > 0 ? DESK.z1 - 0.05 : DESK.z0 + 0.05]));
// ящик
add(box(0.5, 0.1, 0.02, 0.008), M.wood, [0.35, DESK.y - 0.13, DESK.z1 - 0.01]);
add(sphere(0.015, 12, 8), M.lid, [0.35, DESK.y - 0.13, DESK.z1 + 0.005]);

// банка со светлячками
const JAR = [0.02, DESK.y, -1.2];
add(cyl(0.085, 0.08, 0.2, 40), M.glass, [JAR[0], JAR[1] + 0.1, JAR[2]], { cast: false, outline: false });
add(cyl(0.07, 0.07, 0.03, 40), M.glass, [JAR[0], JAR[1] + 0.215, JAR[2]], { cast: false, outline: false });
add(cyl(0.075, 0.075, 0.03, 40), M.lid, [JAR[0], JAR[1] + 0.24, JAR[2]]);
for (let i = 0; i < 9; i++) {
  add(sphere(0.011, 10, 8), M.fly, [JAR[0] + (rnd() - 0.5) * 0.12, JAR[1] + 0.04 + rnd() * 0.15, JAR[2] + (rnd() - 0.5) * 0.12], { cast: false, outline: false });
}
// светлячки снаружи банки
[[0.22, 1.12, -1.3], [-0.3, 1.35, -1.45], [0.38, 1.5, -1.6], [-0.16, 0.98, -1.05]].forEach(p => add(sphere(0.012, 10, 8), M.fly, p, { cast: false, outline: false }));

// стопка книг
[[-0.5, 0, '#2e6f9e', 0.2], [-0.49, 1, '#c0392b', -0.1], [-0.51, 2, '#4b8b5a', 0.15]].forEach(([x, i, c, r]) => add(box(0.26, 0.05, 0.19, 0.01), mat(c, { rough: 0.7 }), [x, DESK.y + 0.025 + i * 0.05, -1.32], { rot: [0, r, 0] }));
// кружка
add(cyl(0.05, 0.045, 0.11, 32), M.mug, [0.48, DESK.y + 0.055, -1.12]);
add(new THREE.TorusGeometry(0.03, 0.009, S(10), S(20)), M.mug, [0.535, DESK.y + 0.06, -1.12], { rot: [0, 0, 0] });
add(cyl(0.044, 0.044, 0.005, 32), mat('#5a2e1a', { rough: 0.2 }), [0.48, DESK.y + 0.1, -1.12], { outline: false });
// листок и карандаш
add(new THREE.BoxGeometry(0.2, 0.002, 0.27), M.paper, [0.28, DESK.y + 0.001, -1.0], { rot: [0, -0.25, 0], outline: false });
add(cyl(0.006, 0.006, 0.17, 6), mat('#e6b43a'), [0.3, DESK.y + 0.007, -0.99], { rot: [0, 0.6, Math.PI / 2] });

// ---------- стул ----------
add(box(0.48, 0.05, 0.42, 0.02), M.chair, [0, 0.45, -1.92]);
add(box(0.46, 0.6, 0.05, 0.025), M.chair, [0, 0.82, -2.14], { rot: [-0.08, 0, 0] });

// ---------- персонаж ----------
const kid = new THREE.Group(); root.add(kid);
const KZ = -1.86;
// туловище
add(capsule(0.165, 0.24), M.sweater, [0, 0.78, KZ], { parent: kid, scale: [1.08, 1, 0.85] });
add(new THREE.TorusGeometry(0.085, 0.045, S(16), S(32)), M.scarf, [0, 1.0, KZ + 0.01], { parent: kid, rot: [Math.PI / 2 - 0.15, 0, 0] });
// руки
const sh = [0.17, 0.95, KZ + 0.02], el = [0.25, 0.79, KZ + 0.3], hd = [0.1, 0.84, -1.27];
[-1, 1].forEach(s => {
  limb([s * sh[0], sh[1], sh[2]], [s * el[0], el[1], el[2]], 0.058, M.sweater, kid);
  limb([s * el[0], el[1], el[2]], [s * hd[0], hd[1], hd[2] - 0.04], 0.052, M.sweater, kid);
  add(sphere(0.048, 24, 16), M.skin, [s * (hd[0] - 0.005), hd[1] + 0.01, hd[2]], { parent: kid, scale: [0.85, 1.05, 1] });
  add(capsule(0.016, 0.03), M.skin, [s * (hd[0] - 0.03), hd[1] + 0.05, hd[2] + 0.01], { parent: kid, rot: [0, 0, s * 0.5] });
});
// голова
const head = new THREE.Group(); kid.add(head);
head.position.set(0, 1.27, KZ + 0.02); head.rotation.set(0.2, 0.08, 0.06);
const HR = 0.25;
add(sphere(HR, 64, 48), M.skin, [0, 0, 0], { parent: head, scale: [1, 1.0, 0.95] });
add(sphere(0.12, 32, 24), M.skin, [0, -0.1, 0.06], { parent: head, scale: [1.3, 0.9, 1.2] }); // щёки/подбородок
// уши
[-1, 1].forEach(s => add(sphere(0.06, 24, 16), M.skin, [s * 0.245, -0.01, -0.01], { parent: head, scale: [0.5, 1, 0.8] }));
// нос
add(sphere(0.034, 24, 16), M.skin, [0, -0.045, HR * 0.97], { parent: head, scale: [1.1, 0.9, 1] });
// румянец
[-1, 1].forEach(s => add(sphere(0.045, 24, 16), M.blush, [s * 0.14, -0.075, 0.2], { parent: head, scale: [1, 0.6, 0.3], rot: [0, s * 0.6, 0], cast: false, outline: false }));
// рот — удивлённое «о»
add(sphere(0.026, 24, 16), M.mouth, [0, -0.125, 0.205], { parent: head, scale: [1.1, 1.1, 0.5], rot: [0.5, 0, 0], outline: false });
// глаза
[-1, 1].forEach(s => {
  const eye = new THREE.Group(); head.add(eye);
  eye.position.set(s * 0.093, 0.015, 0.185);
  const ER = 0.072;
  add(sphere(ER, 48, 32), M.eyeW, [0, 0, 0], { parent: eye, scale: [0.9, 1.08, 0.85], cast: false });
  // взгляд вниз на банку
  const look = new THREE.Vector3(-s * 0.06, -0.3, 1).normalize();
  const iris = add(sphere(ER * 0.62, 32, 24), M.iris, look.clone().multiplyScalar(ER * 0.66).toArray(), { parent: eye, scale: [1, 1, 0.45], cast: false, outline: false });
  iris.lookAt(eye.localToWorld(look.clone().multiplyScalar(2)));
  iris.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), look);
  add(sphere(ER * 0.36, 24, 16), M.pupil, look.clone().multiplyScalar(ER * 0.72).toArray(), { parent: eye, scale: [1, 1, 0.4], cast: false, outline: false }).quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), look);
  add(sphere(ER * 0.15, 16, 12), M.spark, [ER * 0.18, ER * 0.0, ER * 0.84], { parent: eye, cast: false, outline: false });
  add(sphere(ER * 0.07, 12, 8), M.spark, [-ER * 0.12, -ER * 0.38, ER * 0.8], { parent: eye, cast: false, outline: false });
  // веко
  const lid = new THREE.SphereGeometry(ER * 1.08, S(40), S(20), 0, Math.PI * 2, 0, Math.PI * 0.3);
  add(lid, M.skin, [0, 0, 0], { parent: eye, rot: [0.2, 0, 0], scale: [0.92, 1.08, 0.88], cast: false });
  // брови
  add(capsule(0.011, 0.07), M.hair, [s * 0.01, 0.105, 0.035], { parent: eye, rot: [0.2, 0, Math.PI / 2 + s * 0.22] });
});
// волосы
add(sphere(HR * 1.05, 48, 32), M.hair, [0, 0.055, -0.045], { parent: head, scale: [1.02, 0.92, 0.98] });
const tufts = [[-0.11, 0.165, 0.15, 0.55, 1.5], [0.03, 0.19, 0.155, 0.25, 1.35], [0.15, 0.15, 0.13, -0.35, 1.1], [-0.215, 0.05, 0.07, 1.2, 1.0], [0.225, 0.05, 0.06, -1.25, 0.9]];
tufts.forEach(([x, y, z, r, l]) => add(sphere(0.085, 40, 24), M.hair, [x, y, z], { parent: head, scale: [l, 0.5, 0.75], rot: [0.35, 0, r] }));
add(capsule(0.025, 0.09), M.hair, [-0.02, 0.29, -0.03], { parent: head, rot: [-0.3, 0, 0.7] });
add(capsule(0.02, 0.06), M.hair, [0.03, 0.3, -0.05], { parent: head, rot: [-0.5, 0, -0.5] });

// ---------- свет ----------
const hemi = new THREE.HemisphereLight('#6f86c4', '#3a2a24', TOON ? 1.2 : 0.55); scene.add(hemi);
const moon = new THREE.DirectionalLight('#9fb8ff', TOON ? 1.6 : 2.2);
moon.position.set(1.2, 4.5, -7); moon.target.position.set(0, 1, -1.5); scene.add(moon, moon.target);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -0.0004; moon.shadow.radius = 6;
Object.assign(moon.shadow.camera, { left: -2.5, right: 2.5, top: 3, bottom: -1, near: 1, far: 15 });
const jarLight = new THREE.PointLight('#ffb54a', TOON ? 1.2 : 1.6, 3.5, 2);
jarLight.position.set(JAR[0], JAR[1] + 0.13, JAR[2]); jarLight.castShadow = true; jarLight.shadow.mapSize.set(1024, 1024); jarLight.shadow.radius = 8; jarLight.shadow.bias = -0.002;
scene.add(jarLight);
// мягкий заполняющий от гирлянды
const garland = new THREE.PointLight('#ffc070', 1.3, 3, 1.5); garland.position.set(0, 2.25, -2.2); scene.add(garland);
// контровой тёплый на волосы слева
const rim = new THREE.SpotLight('#ffd6a0', TOON ? 0 : 6, 6, 0.5, 0.8, 1.2); rim.position.set(-1.2, 2.4, -3.2); rim.target.position.set(0, 1.25, -1.86); scene.add(rim, rim.target);
const key = new THREE.SpotLight('#ffe2c4', TOON ? 2.2 : 3.2, 6, 0.45, 0.9, 1.5); key.position.set(-1.3, 2.3, 0.4); key.target.position.set(0, 1.2, -1.8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0005; scene.add(key, key.target);
if (!TOON && !LOWPOLY) {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.12;
}
scene.background = new THREE.Color('#0c1020');

// ---------- камера и стили ----------
camera.fov = 44; camera.position.set(0.16, 1.42, 0.62);
camera.lookAt(0, 1.13, -1.6);
if (ACTOR) { kid.visible = false; camera.fov = 40; camera.position.set(0.35, 1.5, 2.9); camera.lookAt(-0.1, 1.0, -1.0); }
let focusDist = camera.position.distanceTo(new THREE.Vector3(0, 1.27, -1.7));

if (STYLE === 'diorama') {
  camera.fov = 44; camera.aspect = W / H;
  camera.position.set(1.5, 5.6, 6.2); camera.lookAt(0, 0.85, -0.85);
  scene.background = new THREE.Color('#151a33');
  // убрать левую стену, чтобы был вырез «кукольного домика»? — оставляем обе, камера сверху
  sky.position.set(0.4, 2.2, -4.5); sky.scale.set(0.45, 0.45, 1);
  // подставка
  add(box(ROOM.x * 2 + 0.6, 0.25, ROOM.front - ROOM.back + 0.6, 0.06), mat('#3b2a22', { rough: 0.5 }), [0, -0.25, (ROOM.front + ROOM.back) / 2], { cast: false });
  hemi.intensity = 1.4; jarLight.intensity = 2.5; key.position.set(1.5, 3.5, 1.5);
}
camera.updateProjectionMatrix();

// контуры для toon
if (TOON) {
  outlined.forEach(m => {
    const o = new THREE.Mesh(m.geometry, outlineMat);
    o.castShadow = false; o.receiveShadow = false;
    m.add(o);
  });
}

// ---------- постобработка ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));

if (['pixar', 'clay', 'diorama', 'painterly'].includes(STYLE)) {
  const ao = new GTAOPass(scene, camera, W, H);
  ao.updateGtaoMaterial({ radius: 0.25, distanceExponent: 1, thickness: 1, scale: 1, samples: 16 });
  ao.blendIntensity = STYLE === 'clay' ? 1 : 0.8;
  composer.addPass(ao);
}
if (STYLE === 'pixar' || STYLE === 'clay') {
  var bok = new BokehPass(scene, camera, { focus: focusDist, aperture: STYLE === 'clay' ? 0.02 : 0.016, maxblur: 0.012 });
  composer.addPass(bok);
}
if (!TOON) composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), STYLE === 'lowpoly' ? 0.3 : 0.45, 0.5, 0.92));
if (STYLE === 'diorama') {
  const h = new ShaderPass(HorizontalTiltShiftShader), v = new ShaderPass(VerticalTiltShiftShader);
  h.uniforms.h.value = 2.2 / W; v.uniforms.v.value = 2.2 / H; h.uniforms.r.value = v.uniforms.r.value = 0.48;
  composer.addPass(h); composer.addPass(v);
}
composer.addPass(new OutputPass());

// цветокоррекция + виньетка + зерно (после sRGB)
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, vig: { value: 0.35 }, grain: { value: 0.025 }, warm: { value: 0.03 } },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, grain, warm; varying vec2 vUv;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){ vec4 c=texture2D(tDiffuse,vUv); vec2 d=vUv-0.5; d.x*=0.7;
    c.rgb*= 1.0 - vig*smoothstep(0.2,0.75,length(d));
    c.rgb += vec3(warm,0.0,-warm)*0.5;
    c.rgb += (h(vUv*1000.0)-0.5)*grain;
    gl_FragColor=c; }`,
});

// Кувахара — «живопись маслом»
const KUWA = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(W, H) }, radius: { value: Math.round(W / 1080 * 11) } },
  vertexShader: grade.material.vertexShader,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform int radius; varying vec2 vUv;
  void main(){
    vec3 m[4]; vec3 s[4];
    for(int k=0;k<4;k++){m[k]=vec3(0.0);s[k]=vec3(0.0);}
    int R=radius; float n=float((R+1)*(R+1));
    for(int j=-R;j<=0;j++) for(int i=-R;i<=0;i++){ vec3 c=texture2D(tDiffuse,vUv+vec2(i,j)/res).rgb; m[0]+=c; s[0]+=c*c; }
    for(int j=-R;j<=0;j++) for(int i=0;i<=R;i++){ vec3 c=texture2D(tDiffuse,vUv+vec2(i,j)/res).rgb; m[1]+=c; s[1]+=c*c; }
    for(int j=0;j<=R;j++) for(int i=0;i<=R;i++){ vec3 c=texture2D(tDiffuse,vUv+vec2(i,j)/res).rgb; m[2]+=c; s[2]+=c*c; }
    for(int j=0;j<=R;j++) for(int i=-R;i<=0;i++){ vec3 c=texture2D(tDiffuse,vUv+vec2(i,j)/res).rgb; m[3]+=c; s[3]+=c*c; }
    float best=1e9; vec3 col=vec3(0.0);
    for(int k=0;k<4;k++){ vec3 mu=m[k]/n; vec3 v=abs(s[k]/n-mu*mu); float sg=v.r+v.g+v.b; if(sg<best){best=sg;col=mu;} }
    gl_FragColor=vec4(col,1.0);
  }`,
};
// холст
const CANVAS = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: grade.material.vertexShader,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; varying vec2 vUv;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; vec2 p=vUv*res;
    float weave = 0.5+0.5*sin(p.x*1.6)*sin(p.y*1.6);
    c *= 0.94+0.08*weave; c += (h(floor(p/2.0))-0.5)*0.03;
    gl_FragColor=vec4(c,1.0);} `,
};
// комикс: растр в тенях + сдвиг цветов
const COMIC = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: grade.material.vertexShader,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; varying vec2 vUv;
  void main(){
    vec2 off = vec2(2.5,0.0)/res;
    vec3 c = vec3(texture2D(tDiffuse,vUv+off).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-off).b);
    float L = dot(c, vec3(0.299,0.587,0.114));
    vec2 p = vUv*res; float a = 0.785;
    vec2 q = mat2(cos(a),-sin(a),sin(a),cos(a))*p/9.0;
    float d = length(fract(q)-0.5);
    float dotR = clamp((0.55-L)*1.1, 0.0, 0.5);
    float ink = 1.0 - smoothstep(dotR-0.06, dotR+0.06, d);
    c = mix(c, c*0.35, ink*0.85);
    // лёгкие диагональные штрихи в самых тёмных местах
    float hatch = step(0.5, fract((p.x+p.y)/7.0));
    c = mix(c, c*0.6, (1.0-smoothstep(0.08,0.18,L))*hatch*0.6);
    gl_FragColor = vec4(c,1.0);
  }`,
};

if (STYLE === 'painterly') { composer.addPass(new ShaderPass(KUWA)); composer.addPass(new ShaderPass(CANVAS)); }
if (STYLE === 'comic') composer.addPass(new ShaderPass(COMIC));
if (STYLE === 'toon') { grade.uniforms.grain.value = 0; }
if (STYLE === 'lowpoly') { grade.uniforms.grain.value = 0.0; grade.uniforms.vig.value = 0.25; }
composer.addPass(grade);


if (!ACTOR) { composer.render(); window.__done = true; }
else {
  const gltf = await new GLTFLoader().loadAsync(ACTOR);
  const bot = gltf.scene; root.add(bot);
  bot.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true; o.frustumCulled = false;
    const joints = /joint/i.test(o.material.name);
    o.material = new THREE.MeshPhysicalMaterial({ color: joints ? '#e8892c' : '#f3efe6', roughness: joints ? 0.45 : 0.32, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: joints ? 0 : 0.3 });
  });
  bot.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(bot); const k = 1.62 / (bb.max.y - bb.min.y);
  bot.scale.multiplyScalar(k);
  const mixer = new THREE.AnimationMixer(bot);
  const clip = n => gltf.animations.find(a => a.name === n);
  const walk = mixer.clipAction(clip('walk')), idle = mixer.clipAction(clip('idle')), agree = mixer.clipAction(clip('agree'));
  [walk, idle, agree].forEach(a => { a.play(); a.setEffectiveWeight(0); });
  // скорость шага: как быстро опорная стопа «едет» назад в цикле ходьбы
  walk.setEffectiveWeight(1);
  let foot; bot.traverse(o => { if (/LeftFoot$/.test(o.name)) foot = o; });
  const samples = []; const dur = clip('walk').duration;
  for (let i = 0; i <= 48; i++) { mixer.setTime(i / 48 * dur); bot.updateMatrixWorld(true); const p = new THREE.Vector3(); foot.getWorldPosition(p); samples.push(p); }
  const minY = Math.min(...samples.map(p => p.y));
  let best = 0; for (let i = 1; i < samples.length; i++) if (samples[i].y < minY + 0.03 && samples[i - 1].y < minY + 0.03) best = Math.max(best, Math.abs(samples[i].z - samples[i - 1].z) / (dur / 48));
  const SPEED = best || 1.2; console.log('walk speed', SPEED.toFixed(2));
  // маршрут
  const A = new THREE.Vector2(-1.25, -0.66), B = new THREE.Vector2(0.1, -0.4);
  const KS = 0.8; const len = A.distanceTo(B), tWalk = len / (SPEED * KS), tBlend = 0.45;
  const heading = Math.atan2(B.x - A.x, B.y - A.y);
  const camHeading = Math.atan2(camera.position.x - B.x, camera.position.z - B.y);
  const camA = camera.position.clone(), camB = new THREE.Vector3(0.25, 1.42, 1.9);
  const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  window.TOTAL = tWalk + tBlend + clip('agree').duration * 1.6;
  window.renderAt = (t) => {
    const u = Math.min(t, tWalk) / tWalk;
    const pos = A.clone().lerp(B, Math.min(t, tWalk) / tWalk);
    const b = ease((t - tWalk + 0.15) / tBlend); // переход шаг -> кивок
    bot.position.set(pos.x, 0, pos.y);
    bot.rotation.y = heading + (camHeading - heading) * b;
    walk.setEffectiveWeight(1 - b); agree.setEffectiveWeight(b);
    walk.time = ((t * KS) % dur); agree.time = Math.max(0, t - tWalk) % clip('agree').duration;
    mixer.update(0);
    // камера медленно подъезжает
    const c = ease(t / window.TOTAL);
    camera.position.lerpVectors(camA, camB, c); camera.lookAt(-0.05 + 0.15 * u, 1.0, -0.9 + 0.3 * u);
    const head = new THREE.Vector3(); bot.getWorldPosition(head); head.y = 1.4;
    if (bok) bok.uniforms.focus.value = camera.position.distanceTo(head);
    composer.render();
  };
  window.__ready = true; window.renderAt(tWalk + 0.6); window.__done = true;
}
