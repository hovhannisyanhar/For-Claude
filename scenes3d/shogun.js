// «Сёгун» (2024): 8 планов в стиле Пиксар. ?shot=pit|shore|hold|hall|mariko|garden|emmy|shogi&dur=
import { THREE, P, scene, root, rnd, canvasTex, mat, add, sphere, box, capsule, limb, lathe, shade, jitter, woodTex, person, katanaStand, fire, steam, flick, ease, softTex, run } from './core.js';

const SHOT = P.get('shot') || 'hall';
const darkWood = () => mat('#2a170d', { map: woodTex, rough: 0.5, physical: true, clearcoat: 0.3 });
const sway = (o, t, a = 0.015, k = 1) => { o.rotation.z = Math.sin(t * 1.3 * k) * a; };
const breathe = (o, t, k = 1) => { const b = 1 + Math.sin(t * 2.2 * k) * 0.008; o.scale.set(1, b, 1); };

// ---------- 1. Яма: команда внизу, сверху решётка, факел и котёл с паром ----------
function pit(T) {
  scene.background = new THREE.Color('#05070d');
  scene.fog = new THREE.Fog('#05070d', 4, 9);
  const earth = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#3a2a1e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${20 + rnd() * 50},${15 + rnd() * 30},${10 + rnd() * 20},0.5)`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 2 + rnd() * 4); } }, [3, 3]);
  const ground = mat('#6b5644', { map: earth, rough: 1 });
  const wallM = mat('#4a3a2c', { map: earth, rough: 1, side: THREE.BackSide });
  // земля вокруг ямы (рамка из 4 плит)
  const HW = 0.9, HD = 0.7, PZ = -0.6;
  [[0, PZ - HD - 2, 8, 4], [0, PZ + HD + 2, 8, 4], [-HW - 2, PZ, 4, HD * 2], [HW + 2, PZ, 4, HD * 2]].forEach(([x, z, w, d]) => add(new THREE.PlaneGeometry(w, d), ground, [x, 0, z], { rot: [-Math.PI / 2, 0, 0], cast: false }));
  // стенки и дно
  add(new THREE.BoxGeometry(HW * 2, 1.5, HD * 2), wallM, [0, -0.75, PZ], { cast: false });
  add(new THREE.PlaneGeometry(HW * 2, HD * 2), mat('#2a1f16', { rough: 1 }), [0, -1.49, PZ], { rot: [-Math.PI / 2, 0, 0], cast: false });
  // моряки на дне, смотрят вверх
  const sailors = [
    person({ pose: 'stand', trousers: true, robe: '#c9bfa6', robe2: '#3a3430', hairStyle: 'sailor', hair: '#4a3020', beard: true, hands: 'down', frown: -0.2 }),
    person({ pose: 'stand', trousers: true, robe: '#8a7a64', robe2: '#2c2a28', hairStyle: 'blond', hair: '#a07a40', iris: '#3b6a8a', hands: 'down', frown: -0.2 }),
    person({ pose: 'stand', trousers: true, robe: '#6a7480', robe2: '#2a2622', hairStyle: 'sailor', hair: '#1e1612', hands: 'down', frown: -0.25 }),
  ];
  [[-0.45, PZ - 0.2, 0.4], [0.05, PZ + 0.15, 0], [0.48, PZ - 0.25, -0.5]].forEach(([x, z, r], i) => { const s = sailors[i]; s.position.set(x, -1.5, z); s.rotation.y = r; root.add(s); s.userData.head.rotation.x = -0.75; });
  // бамбуковая решётка
  const bam = mat('#9a8250', { rough: 0.6 });
  for (let i = -5; i <= 5; i++) add(new THREE.CylinderGeometry(0.025, 0.025, HD * 2 + 0.4, 10), bam, [i * 0.17, 0.03, PZ], { rot: [Math.PI / 2, 0, 0] });
  for (let j = -2; j <= 2; j++) add(new THREE.CylinderGeometry(0.02, 0.02, HW * 2 + 0.4, 10), bam, [0, 0.06, PZ + j * 0.3], { rot: [0, 0, Math.PI / 2] });
  // котёл на огне + самурай рядом
  const cz = PZ - HD - 0.5, cx = 0.95;
  const pot = add(new THREE.SphereGeometry(0.42, 40, 24, 0, Math.PI * 2, Math.PI / 2.4, Math.PI / 1.8), mat('#1c1a18', { metal: 0.7, rough: 0.45, side: THREE.DoubleSide }), [cx, 0.62, cz]);
  add(new THREE.TorusGeometry(0.34, 0.03, 10, 40), mat('#2a2622', { metal: 0.7, rough: 0.4 }), [cx, 0.86, cz], { rot: [Math.PI / 2, 0, 0] });
  add(new THREE.CircleGeometry(0.33, 32), mat('#6a5a48', { rough: 0.2, physical: true, clearcoat: 1 }), [cx, 0.82, cz], { rot: [-Math.PI / 2, 0, 0] });
  [[-1, -1], [1, -1], [0, 1]].forEach(([a, b]) => add(box(0.12, 0.3, 0.12, 0.03), mat('#2b2622', { rough: 0.9 }), [cx + a * 0.3, 0.12, cz + b * 0.25]));
  const potFire = fire([cx, 0.02, cz], 1.3, 3.5);
  const potSteam = steam([cx, 0.85, cz], 0.9, 22);
  const sam = person({ pose: 'stand', robe: '#3a2420', robe2: '#1e1210', kataginu: '#5a1e18', hairStyle: 'topknot', frown: 0.45, squint: true, swords: true, hands: 'down' });
  sam.position.set(cx + 0.65, 0, cz + 0.15); sam.rotation.y = -0.9; root.add(sam);
  // факел слева
  add(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 10), mat('#3a2618', { rough: 0.8 }), [-1.1, 0.6, PZ - HD - 0.3]);
  const torch = fire([-1.1, 1.18, PZ - HD - 0.3], 0.7, 2.2);
  const pitL = new THREE.PointLight('#ff8a40', 2.2, 3, 1.4); pitL.position.set(0.2, -0.3, PZ - 0.3); scene.add(pitL);
  // луна
  scene.add(new THREE.HemisphereLight('#4a5a8a', '#120c08', 0.35));
  const moon = new THREE.DirectionalLight('#8aa0d8', 0.8); moon.position.set(-2, 6, -3); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); scene.add(moon);
  return {
    cam: { from: [0.1, 3.1, 0.9], to: [0.05, 2.6, 0.55], lookFrom: [0.25, -0.5, -1.2], lookTo: [0.2, -0.6, -1.1], fov: 50 },
    focus: [0, -0.9, PZ], aperture: 0.006, bloom: 0.6,
    update(t) { potFire(t); torch(t + 3); potSteam(t); pitL.intensity = 2.2 * flick(t + 1, 0.5); sailors.forEach((s, i) => { s.userData.head.rotation.y = Math.sin(t * 0.6 + i * 2) * 0.15; breathe(s, t, 1 + i * 0.1); }); },
  };
}

// ---------- 2. Берег: корабль на скалах, Блэкторн, крестьяне с копьями ----------
let sailMesh;
function shipModel(parent, o = {}) {
  const ship = new THREE.Group(); parent.add(ship);
  const hullG = new THREE.BoxGeometry(2.8, 0.75, 0.9, 40, 10, 10);
  { const p = hullG.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const t = (y + 0.375) / 0.75; z *= 0.45 + 0.55 * Math.sqrt(t); if (x > 0.8) z *= Math.max(0.05, 1 - ((x - 0.8) / 0.6) ** 2); if (x > 0.8) y += (x - 0.8) * 0.18 * t; p.setXYZ(i, x, y, z); } hullG.computeVertexNormals(); }
  const hullM = mat('#b08a66', { map: woodTex, rough: 0.7 });
  add(hullG, hullM, [0, 0.38, 0], { parent: ship });
  add(box(0.7, 0.45, 0.78, 0.02), hullM, [-1.05, 0.95, 0], { parent: ship });
  add(box(2.2, 0.04, 0.6, 0.01), mat('#6b4a33', { rough: 0.8 }), [0, 0.74, 0], { parent: ship });
  const mastM = mat('#3a2618', { rough: 0.7 });
  add(new THREE.CylinderGeometry(0.035, 0.045, 2.2, 12), mastM, [0.3, 1.8, 0], { parent: ship });
  if (o.broken) add(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 12), mastM, [-0.6, 1.15, 0], { parent: ship, rot: [0, 0, 0.2] });
  else add(new THREE.CylinderGeometry(0.03, 0.04, 1.6, 12), mastM, [-0.6, 1.5, 0], { parent: ship });
  add(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), mastM, [0.3, 2.55, 0], { parent: ship, rot: [0, 0, Math.PI / 2 - 0.1] });
  const sailG = new THREE.PlaneGeometry(1.0, 0.9, 20, 20);
  sailG.userData.base = sailG.attributes.position.array.slice();
  const sail = add(sailG, mat('#cfc4a8', { rough: 0.95, side: THREE.DoubleSide }), [0.32, 2.05, 0.06], { parent: ship, rot: [0, Math.PI / 2, 0] });
  [[0.3, 2.9, 0, 1.35, 0.8, 0], [0.3, 2.9, 0, -1.3, 1.1, 0], [0.3, 2.4, 0, 0.9, 0.8, 0.4]].forEach(([a, b, c, d, e, f]) => limb([a, b, c], [d, e, f], 0.006, mat('#2a2018', { rough: 0.9 }), ship));
  return { ship, sail, torn: !!o.broken };
}
function flutter(sail, t, torn) {
  const g = sail.geometry, p = g.attributes.position, b = g.userData.base;
  for (let i = 0; i < p.count; i++) {
    const x = b[i * 3], y = b[i * 3 + 1];
    let yy = y; if (torn && y < -0.2 && x > 0.1 && Math.sin(x * 23) > 0.2) yy = -0.2 + (y + 0.2) * 0.3;
    p.setXYZ(i, x, yy, Math.sin((y + 0.45) * 2.5) * 0.12 + Math.sin(x * 7 + t * 3) * 0.02 * (0.5 - y) + Math.sin(t * 1.7 + y * 3) * 0.03);
  }
  p.needsUpdate = true; g.computeVertexNormals();
}
function sea(w, d, z, color = '#3e5761', o = {}) {
  const g = new THREE.PlaneGeometry(w, d, 160, 120); g.userData.base = g.attributes.position.array.slice();
  const m = add(g, mat(color, { physical: true, rough: o.rough ?? 0.18, clearcoat: o.clearcoat ?? 0.8 }), [0, 0.02, z], { rot: [-Math.PI / 2, 0, 0], cast: false });
  return (t) => { const p = g.attributes.position, b = g.userData.base; for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; p.setZ(i, Math.sin(x * 2.1 + y * 1.3 + t * 1.2) * 0.04 + Math.sin(x * 5.3 - y * 3.7 + t * 2) * 0.015 + Math.sin(y * 0.9 + t * 0.7) * 0.05); } p.needsUpdate = true; g.computeVertexNormals(); };
}
function shore(T) {
  const fogC = '#8e9ba3';
  scene.fog = new THREE.Fog(fogC, 5, 16); scene.background = new THREE.Color(fogC);
  const sky = canvasTex(512, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3b4652'); gr.addColorStop(0.55, '#7d8b94'); gr.addColorStop(0.75, '#c9c3b2'); gr.addColorStop(1, '#8e9ba3');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.filter = 'blur(18px)';
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${40 + rnd() * 40},${50 + rnd() * 40},${60 + rnd() * 40},0.35)`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h * 0.55, 80 + rnd() * 120, 20 + rnd() * 30, 0, 0, 7); g.fill(); }
    const sun = g.createRadialGradient(w * 0.3, h * 0.62, 5, w * 0.3, h * 0.62, 180); sun.addColorStop(0, 'rgba(255,230,190,0.9)'); sun.addColorStop(1, 'rgba(255,230,190,0)'); g.fillStyle = sun; g.fillRect(0, 0, w, h);
  });
  add(new THREE.PlaneGeometry(26, 40), new THREE.MeshBasicMaterial({ map: sky, fog: false }), [0, 6, -18], { cast: false, recv: false });
  const waves = sea(40, 30, -14);
  const sandG = new THREE.PlaneGeometry(40, 9, 120, 60);
  { const p = sandG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, (y + 4.5) * 0.025 + Math.sin(x * 3 + y * 2) * 0.02); } sandG.computeVertexNormals(); }
  add(sandG, mat('#b8a47e', { rough: 0.95 }), [0, 0, -0.2], { rot: [-Math.PI / 2, 0, 0], cast: false });
  const foam = []; for (let i = 0; i < 26; i++) foam.push(add(sphere(0.12, 16, 10), mat('#e8ecea', { rough: 0.6 }), [-3.4 + i * 0.27 + rnd() * 0.1, 0.03, -1.45 - rnd() * 0.12], { scale: [1.8, 0.08, 0.4], cast: false }));
  const rockM = mat('#3a3c3e', { rough: 0.9 });
  [[1.3, -3.4, 0.7], [2.1, -3.0, 0.45], [0.6, -3.7, 0.4], [2.6, -3.9, 0.8], [-2.4, -2.6, 0.35]].forEach(([x, z, s]) => add(jitter(new THREE.IcosahedronGeometry(s, 2), 0.25, 2), rockM, [x, s * 0.35, z], { rot: [rnd(), rnd() * 3, 0] }));
  const { ship, sail } = shipModel(root, { broken: true });
  ship.position.set(1.2, 0.15, -3.6); ship.rotation.set(0.05, -0.35, 0.2);
  const houseM = mat('#5a4a3a', { rough: 0.9 }), roofM = mat('#8c7a50', { rough: 1 });
  [[-2.6, -2.3, 0.9], [-3.3, -3.6, 1.1], [-1.9, -4.4, 0.8]].forEach(([x, z, s]) => {
    add(box(0.9 * s, 0.55 * s, 0.7 * s, 0.02), houseM, [x, 0.27 * s, z]);
    add(new THREE.ConeGeometry(0.75 * s, 0.55 * s, 4), roofM, [x, 0.81 * s, z], { rot: [0, Math.PI / 4, 0], scale: [1.05, 1, 0.8] });
  });
  [[-1.4, -1.0, 0.4], [-0.9, -1.3, -0.2]].forEach(([x, z, r]) => add(new THREE.SphereGeometry(0.35, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#5b4330', { rough: 0.8, side: THREE.DoubleSide }), [x, 0.12, z], { scale: [1.7, 0.4, 0.55], rot: [Math.PI, r, 0] }));
  const bt = person({ pose: 'stand', trousers: true, robe: '#d8d0bd', robe2: '#3a3430', skin: '#efb995', hair: '#a07a40', hairStyle: 'blond', iris: '#3b6a8a', frown: -0.15, hands: 'down' });
  bt.position.set(-0.05, 0.05, -0.5); bt.rotation.y = 0.15; root.add(bt);
  const v1 = person({ pose: 'stand', robe: '#4b5a6a', hairStyle: 'topknot', hat: true, spear: true, hands: 'spear', frown: 0.35 });
  v1.position.set(-0.75, 0.04, -1.15); v1.rotation.y = 0.55; root.add(v1);
  const v2 = person({ pose: 'stand', robe: '#6a5a40', hairStyle: 'topknot', hat: true, spear: true, hands: 'spear', frown: 0.35 });
  v2.position.set(0.68, 0.04, -1.25); v2.rotation.y = -0.7; root.add(v2);
  scene.add(new THREE.HemisphereLight('#aab8c4', '#5a4e40', 1.1));
  const sun = new THREE.DirectionalLight('#ffe2b8', 2.3); sun.position.set(-4, 5, -6); sun.target.position.set(0, 0, -1);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.radius = 5;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 }); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#b8c8d8', 0.9); fill.position.set(2, 2, 4); scene.add(fill);
  return {
    cam: { from: [-0.25, 1.2, 3.9], to: [-0.05, 1.1, 3.1], lookFrom: [0.3, 1.05, -3], lookTo: [0.2, 1.0, -3], fov: 40 },
    focus: [0, 0.7, -0.5],
    update(t) {
      waves(t); flutter(sail, t, true);
      foam.forEach((f, i) => { f.position.z = -1.45 - 0.06 - Math.sin(t * 1.1 + i * 0.4) * 0.06; });
      [v1, v2].forEach((v, i) => sway(v, t, 0.012, 1 + i * 0.3));
      bt.userData.head.rotation.y = Math.sin(t * 0.5) * 0.35; breathe(bt, t);
    },
  };
}

// ---------- 3. Трюм: мушкеты, бочки, пушка, луч из люка, карта с печатью ----------
function hold(T) {
  scene.background = new THREE.Color('#0a0705');
  const plank = canvasTex(512, 512, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(${24 + rnd() * 6},${35 + rnd() * 10}%,${14 + rnd() * 6}%)`; g.fillRect(0, i * 64, w, 62); g.fillStyle = '#0a0604'; g.fillRect(0, i * 64 + 62, w, 2); } }, [2, 2]);
  const wood = mat('#ffffff', { map: plank, rough: 0.75 });
  add(new THREE.PlaneGeometry(4, 6), wood, [0, 0, -1.5], { rot: [-Math.PI / 2, 0, 0], cast: false });
  // борта-рёбра
  for (let i = 0; i < 6; i++) {
    const z = 0.6 - i * 0.75;
    add(new THREE.TorusGeometry(1.5, 0.06, 10, 40, Math.PI), darkWood(), [0, 0, z], { rot: [0, 0, 0] });
  }
  add(new THREE.CylinderGeometry(1.52, 1.52, 4.6, 40, 1, true, -Math.PI / 2, Math.PI), mat('#ffffff', { map: plank, rough: 0.8, side: THREE.BackSide }), [0, 0, -1.3], { rot: [Math.PI / 2, 0, 0], cast: false });
  // стойка с мушкетами
  const rack = new THREE.Group(); rack.position.set(-0.75, 0, -1.1); rack.rotation.y = 0.5; root.add(rack);
  add(box(1.5, 0.06, 0.12, 0.01), darkWood(), [0, 0.55, -0.05], { parent: rack });
  add(box(1.5, 0.06, 0.2, 0.01), darkWood(), [0, 0.04, 0.05], { parent: rack });
  const steel = mat('#6c6a66', { metal: 0.85, rough: 0.35 }), stock = mat('#6b3f22', { physical: true, rough: 0.35, clearcoat: 0.6 });
  for (let i = 0; i < 9; i++) {
    const x = -0.66 + i * 0.165, m = new THREE.Group(); m.position.set(x, 0.05, 0.05); m.rotation.x = -0.12; rack.add(m);
    add(box(0.05, 0.36, 0.08, 0.015), stock, [0, 0.18, 0], { parent: m });
    add(new THREE.CylinderGeometry(0.012, 0.014, 0.85, 10), steel, [0, 0.78, -0.01], { parent: m });
    add(box(0.03, 0.05, 0.05, 0.008), steel, [0, 0.38, 0.02], { parent: m });
  }
  // бочки
  const barrel = (x, z, r = 0) => { const b = add(lathe([[0, 0], [0.2, 0], [0.24, 0.25], [0.2, 0.5], [0, 0.5]]), mat('#7a4e2c', { map: woodTex, rough: 0.6 }), [x, 0, z], { rot: [0, r, 0] }); [0.06, 0.25, 0.44].forEach(y => add(new THREE.TorusGeometry(y === 0.25 ? 0.24 : 0.215, 0.012, 8, 32), mat('#2a2622', { metal: 0.7, rough: 0.4 }), [x, y, z], { rot: [Math.PI / 2, 0, 0] })); };
  barrel(0.75, -1.6); barrel(1.05, -1.25, 1); barrel(0.85, -2.1, 2);
  // пушка
  const can = new THREE.Group(); can.position.set(0.55, 0, -2.8); can.rotation.y = -0.7; root.add(can);
  add(box(0.5, 0.18, 0.7, 0.03), darkWood(), [0, 0.18, 0], { parent: can });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 20), darkWood(), [a * 0.27, 0.09, b * 0.25], { parent: can, rot: [0, 0, Math.PI / 2] }));
  add(new THREE.CylinderGeometry(0.08, 0.12, 1.1, 24), mat('#24221f', { metal: 0.8, rough: 0.35 }), [0, 0.38, 0.25], { parent: can, rot: [Math.PI / 2 - 0.05, 0, 0] });
  // ящик с картой и печатью
  add(box(0.6, 0.4, 0.42, 0.02), mat('#6b4a33', { map: woodTex, rough: 0.7 }), [0.55, 0.2, -0.45]);
  const map = canvasTex(512, 384, (g, w, h) => {
    g.fillStyle = '#e8d8b0'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,60,30,0.6)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(60, 300); g.bezierCurveTo(140, 200, 120, 120, 220, 90); g.bezierCurveTo(300, 70, 330, 160, 420, 120); g.stroke();
    g.beginPath(); g.moveTo(300, 330); g.bezierCurveTo(330, 260, 380, 250, 440, 210); g.stroke();
    for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(256, 192); const a = i / 14 * Math.PI * 2; g.lineTo(256 + Math.cos(a) * 300, 192 + Math.sin(a) * 300); g.strokeStyle = 'rgba(90,60,30,0.15)'; g.lineWidth = 1; g.stroke(); }
    g.font = 'italic 34px serif'; g.fillStyle = 'rgba(70,40,20,0.8)'; g.fillText('Iapam', 300, 170);
  });
  add(new THREE.PlaneGeometry(0.5, 0.36), mat('#ffffff', { map, rough: 0.9 }), [0.55, 0.405, -0.45], { rot: [-Math.PI / 2, 0, 0.15], cast: false });
  const seal = add(new THREE.CylinderGeometry(0.045, 0.05, 0.015, 24), mat('#a3201a', { physical: true, rough: 0.3, clearcoat: 0.8 }), [0.71, 0.415, -0.37]);
  // луч из люка
  const shaft = new THREE.SpotLight('#ffe2b0', 30, 6, 0.32, 0.5, 1.2); shaft.position.set(-0.1, 2.6, -1.3); shaft.target.position.set(-0.3, 0, -1.1); shaft.castShadow = true; shaft.shadow.mapSize.set(2048, 2048); shaft.shadow.bias = -0.0005; scene.add(shaft, shaft.target);
  const beam = add(new THREE.CylinderGeometry(0.2, 0.45, 2.6, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#ffdca0', transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [-0.2, 1.3, -1.2], { cast: false, recv: false });
  scene.add(new THREE.HemisphereLight('#3a3040', '#1a0e08', 0.4));
  const lamp = new THREE.PointLight('#ff9a48', 1.2, 3, 1.6); lamp.position.set(0.6, 0.9, -0.3); scene.add(lamp);
  return {
    cam: { from: [1.0, 1.1, 1.9], to: [0.75, 0.9, 1.0], lookFrom: [-0.45, 0.6, -1.3], lookTo: [0.35, 0.45, -0.6], fov: 44 },
    focus: (t) => new THREE.Vector3().lerpVectors(new THREE.Vector3(-0.6, 0.6, -1.2), new THREE.Vector3(0.6, 0.42, -0.45), ease(t / T)),
    aperture: 0.014,
    update(t) { beam.visible = false; lamp.intensity = 1.2 * flick(t, 0.6); },
  };
}

// ---------- 4. Зал: Торанага и тени четырёх регентов за сёдзи ----------
function shojiTex(regents, warm = true) {
  return canvasTex(1024, 640, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, warm ? '#d9b47a' : '#e6e0d0'); gr.addColorStop(1, warm ? '#f0cf91' : '#f3eee2');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (regents) {
      regents.forEach(x => { const r = g.createRadialGradient(x + 60, h * 0.62, 5, x + 60, h * 0.62, 170); r.addColorStop(0, 'rgba(255,200,110,0.95)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
      g.filter = 'blur(5px)'; g.fillStyle = 'rgba(30,12,4,0.82)';
      regents.forEach((x, i) => {
        const y0 = h * 0.93;
        g.beginPath(); g.ellipse(x, y0 - 30, 85, 40, 0, 0, 7); g.fill();
        g.beginPath(); g.moveTo(x - 62, y0 - 40); g.lineTo(x - 95, y0 - 200); g.lineTo(x + 95, y0 - 200); g.lineTo(x + 62, y0 - 40); g.fill();
        g.beginPath(); g.moveTo(x - 115, y0 - 190); g.lineTo(x + 115, y0 - 190); g.lineTo(x + 70, y0 - 225); g.lineTo(x - 70, y0 - 225); g.fill();
        g.beginPath(); g.arc(x, y0 - 265, 42, 0, 7); g.fill();
        g.beginPath(); g.ellipse(x + (i % 2 ? 6 : -6), y0 - 310, 9, 20, 0.2, 0, 7); g.fill();
        g.save(); g.translate(x - 70, y0 - 110); g.rotate(i % 2 ? -0.35 : -0.25); g.fillRect(-130, -6, 200, 12); g.restore();
      });
      g.filter = 'none';
    }
    g.fillStyle = '#2b1a10';
    for (let x = 0; x <= w; x += w / 8) g.fillRect(x - 4, 0, 8, h);
    for (let y = 0; y <= h; y += h / 5) g.fillRect(0, y - 4, w, 8);
    g.fillRect(0, 0, w, 18); g.fillRect(0, h - 22, w, 22);
  });
}
const tatamiTex = () => canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#b9a466'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(${90 + rnd() * 40},${80 + rnd() * 30},30,${0.12 + rnd() * 0.1})`; g.fillRect(0, y, w, 1.5); }
  g.fillStyle = '#20281e'; g.fillRect(0, 0, w, 22); g.fillRect(0, h / 2 - 11, w, 22); g.fillRect(w / 2 - 11, 0, 22, h / 2); g.fillRect(0, h / 2, 22, h / 2);
}, [2, 2]);
function andon(x, z, power = 2.4) {
  const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
  const paper = add(box(0.24, 0.42, 0.24, 0.01), mat('#ffd9a0', { emissive: '#ffb860', ei: 1.8, rough: 0.9 }), [0, 0.42, 0], { parent: g, cast: false });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(box(0.025, 0.66, 0.025, 0.005), darkWood(), [a * 0.125, 0.33, b * 0.125], { parent: g }));
  add(box(0.28, 0.025, 0.28, 0.005), darkWood(), [0, 0.64, 0], { parent: g });
  const l = new THREE.PointLight('#ffad55', power, 3.2, 1.6); l.position.set(x, 0.45, z); l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.radius = 6; l.shadow.bias = -0.002; scene.add(l);
  return (t) => { const f = flick(t, 0.35); l.intensity = power * (0.9 + (f - 0.82) * 0.6); paper.material.emissiveIntensity = 1.8 * (0.9 + (f - 0.82) * 0.6); };
}
function hall(T) {
  add(new THREE.PlaneGeometry(6, 6), mat('#ffffff', { map: tatamiTex(), rough: 0.85 }), [0, 0, -1], { rot: [-Math.PI / 2, 0, 0], cast: false });
  const backTex = shojiTex([170, 400, 630, 860]);
  const back = add(new THREE.PlaneGeometry(4, 2.5), mat('#ffffff', { map: backTex, emissiveMap: backTex, emissive: '#ffffff', ei: 0.95, rough: 0.9 }), [0, 1.25, -2.4], { cast: false });
  [-2, 2].forEach(x => add(box(0.16, 2.6, 0.16), darkWood(), [x, 1.3, -2.35]));
  add(box(4.2, 0.18, 0.18), darkWood(), [0, 2.55, -2.35]); add(box(4.2, 0.08, 0.12), darkWood(), [0, 0.04, -2.33]);
  const a1 = andon(-0.62, -1.35), a2 = andon(0.64, -1.0);
  const tora = person({ pose: 'seiza', robe: '#3a2a1e', robe2: '#241812', kataginu: '#5b3b1c', mon: '#d9b45a', hairStyle: 'topknot', grey: true, frown: 0.3, squint: true, swords: true });
  tora.position.set(0, 0, -1.25); root.add(tora);
  katanaStand(root, [0.42, 0, -1.55]);
  scene.add(new THREE.HemisphereLight('#6d5a8a', '#2a1a10', 0.35));
  const backGlow = new THREE.SpotLight('#ffb466', 5, 6, 0.8, 0.9, 1.2); backGlow.position.set(0, 1.4, -2.3); backGlow.target.position.set(0, 0.6, -1.2); scene.add(backGlow, backGlow.target);
  const key = new THREE.SpotLight('#ffd7a8', 2.2, 6, 0.4, 0.8, 1.4); key.position.set(-1.2, 1.9, 0.6); key.target.position.set(0, 0.6, -1.25); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005; scene.add(key, key.target);
  scene.background = new THREE.Color('#0d0806');
  return {
    cam: { from: [0.15, 1.0, 2.3], to: [0.05, 0.92, 1.55], lookFrom: [0, 0.98, -1.8], lookTo: [0, 0.9, -1.6], fov: 40 },
    focus: [0, 0.6, -1.25],
    update(t) { a1(t); a2(t + 2); breathe(tora, t, 0.8); tora.userData.head.rotation.y = Math.sin(t * 0.4) * 0.08; backTex.offset.x = Math.sin(t * 0.3) * 0.003; },
  };
}

// ---------- 5. Марико между Торанагой и Блэкторном ----------
function mariko(T) {
  add(new THREE.PlaneGeometry(6, 6), mat('#ffffff', { map: tatamiTex(), rough: 0.85 }), [0, 0, -1], { rot: [-Math.PI / 2, 0, 0], cast: false });
  const wall = shojiTex(null, false);
  add(new THREE.PlaneGeometry(4, 2.5), mat('#ffffff', { map: wall, emissiveMap: wall, emissive: '#ffffff', ei: 0.4, rough: 0.9 }), [0, 1.25, -2.4], { cast: false });
  [-2, 2].forEach(x => add(box(0.16, 2.6, 0.16), darkWood(), [x, 1.3, -2.35]));
  add(box(4.2, 0.18, 0.18), darkWood(), [0, 2.55, -2.35]);
  // токонома: свиток и ваза
  const scroll = canvasTex(128, 512, (g, w, h) => { g.fillStyle = '#efe6d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1410'; g.font = 'bold 70px serif'; ['将', '軍'].forEach((c, i) => g.fillText(c, 28, 170 + i * 110)); g.fillStyle = '#b8322a'; g.fillRect(70, 420, 26, 26); });
  add(new THREE.PlaneGeometry(0.3, 1.0), mat('#ffffff', { map: scroll, rough: 0.9 }), [1.1, 1.25, -2.38], { cast: false });
  const mar = person({ pose: 'seiza', robe: '#7a5a8c', robe2: '#4a3256', hairStyle: 'bun', hair: '#120c0a', lips: '#b8323a', frown: -0.05, skin: '#f0c4a4' });
  mar.position.set(0, 0, -1.35); root.add(mar);
  add(box(0.36, 0.04, 0.3, 0.01), mat('#c9a24a', { physical: true, rough: 0.6, sheen: 0.6 }), [0, 0.2, -1.33], { cast: false }); // оби
  const tora = person({ pose: 'seiza', robe: '#3a2a1e', robe2: '#241812', kataginu: '#5b3b1c', mon: '#d9b45a', hairStyle: 'topknot', grey: true, frown: 0.3, squint: true });
  tora.position.set(-0.62, 0, -1.15); tora.rotation.y = 0.8; root.add(tora);
  const bt = person({ pose: 'seiza', robe: '#d8d0bd', robe2: '#3a3430', skin: '#efb995', hair: '#a07a40', hairStyle: 'blond', iris: '#3b6a8a', frown: -0.1 });
  bt.position.set(0.64, 0, -1.1); bt.rotation.y = -0.85; root.add(bt);
  scene.add(new THREE.HemisphereLight('#e8dcc8', '#4a3a2a', 0.35));
  const soft = new THREE.SpotLight('#fff0d8', 2.5, 7, 0.9, 1, 1.2); soft.position.set(0, 1.8, -2.2); soft.target.position.set(0, 0.5, -1); scene.add(soft, soft.target);
  const key = new THREE.SpotLight('#ffe8cc', 3, 7, 0.5, 0.8, 1.3); key.position.set(1.3, 2.1, 0.8); key.target.position.set(0, 0.6, -1.2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005; scene.add(key, key.target);
  scene.background = new THREE.Color('#1a140e');
  return {
    cam: { from: [-0.4, 1.15, 2.9], to: [0.35, 1.1, 2.5], lookFrom: [0, 0.8, -1.3], lookTo: [0, 0.8, -1.3], fov: 40 },
    focus: [0, 0.65, -1.35], env: 0.1,
    update(t) {
      const look = Math.sin(t * 0.9) * 0.45; mar.userData.head.rotation.y = look; // переводит то одному, то другому
      breathe(mar, t); breathe(tora, t, 0.8); breathe(bt, t, 1.1);
      tora.userData.head.rotation.y = 0.15 * Math.sin(t * 0.5); bt.userData.head.rotation.x = -0.05 + 0.04 * Math.sin(t * 1.3);
    },
  };
}

// ---------- 6. Сад на закате: клён, каменный фонарь, белая подушка с коротким мечом, поклон ----------
function garden(T) {
  scene.background = new THREE.Color('#3a0e0a'); scene.fog = new THREE.Fog('#7a2a18', 5, 14);
  const sky = canvasTex(512, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a0a10'); gr.addColorStop(0.45, '#8c2418'); gr.addColorStop(0.7, '#e2602a'); gr.addColorStop(0.85, '#f6b25a'); gr.addColorStop(1, '#7a2a18');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const s = g.createRadialGradient(w * 0.62, h * 0.74, 5, w * 0.62, h * 0.74, 120); s.addColorStop(0, 'rgba(255,240,200,1)'); s.addColorStop(0.3, 'rgba(255,200,120,0.8)'); s.addColorStop(1, 'rgba(255,150,80,0)'); g.fillStyle = s; g.fillRect(0, 0, w, h);
    g.filter = 'blur(10px)'; for (let i = 0; i < 16; i++) { g.fillStyle = `rgba(60,10,10,${0.25 + rnd() * 0.25})`; g.beginPath(); g.ellipse(rnd() * w, h * 0.2 + rnd() * h * 0.45, 100 + rnd() * 120, 10 + rnd() * 16, 0, 0, 7); g.fill(); }
  });
  add(new THREE.PlaneGeometry(22, 34), new THREE.MeshBasicMaterial({ map: sky, fog: false }), [0, 5, -12], { cast: false, recv: false });
  // гравий с граблевыми волнами
  const gravel = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#b8ad9c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,70,60,0.35)'; g.lineWidth = 4; for (let y = 0; y < h; y += 26) { g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 80) * 8); g.stroke(); } }, [3, 3]);
  add(new THREE.PlaneGeometry(14, 10), mat('#ffffff', { map: gravel, rough: 1 }), [0, 0, -2], { rot: [-Math.PI / 2, 0, 0], cast: false });
  // каменный фонарь
  const stone = mat('#7a7468', { rough: 0.95 });
  const L = new THREE.Group(); L.position.set(-0.7, 0, -1.9); root.add(L);
  add(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 6), stone, [0, 0.06, 0], { parent: L });
  add(new THREE.CylinderGeometry(0.07, 0.09, 0.6, 12), stone, [0, 0.42, 0], { parent: L });
  add(new THREE.CylinderGeometry(0.2, 0.16, 0.1, 6), stone, [0, 0.77, 0], { parent: L });
  add(box(0.24, 0.22, 0.24, 0.02), mat('#8a8274', { rough: 0.9, emissive: '#ff9a40', ei: 0.4 }), [0, 0.93, 0], { parent: L });
  add(new THREE.ConeGeometry(0.3, 0.18, 6), stone, [0, 1.13, 0], { parent: L });
  add(sphere(0.04), stone, [0, 1.24, 0], { parent: L });
  // клён
  const trunk = mat('#2a1810', { rough: 0.9 });
  const TZ = -1.4; limb([1.0, 0, -2.2 + TZ], [0.9, 1.0, -2.2 + TZ], 0.07, trunk); limb([0.9, 1.0, -2.2 + TZ], [0.55, 1.6, -2.0 + TZ], 0.05, trunk); limb([0.9, 1.0, -2.2 + TZ], [1.3, 1.5, -2.3 + TZ], 0.045, trunk);
  const leafM = mat('#c8301e', { physical: true, rough: 0.6, sheen: 0.6, sheenColor: '#ff8050' });
  const leafM2 = mat('#e2602a', { physical: true, rough: 0.6 });
  [[0.55, 1.7, -2.0, 0.35], [1.3, 1.6, -2.3, 0.4], [0.95, 1.95, -2.2, 0.38], [0.3, 1.55, -1.9, 0.25], [1.55, 1.75, -2.1, 0.25]].forEach(([x, y, z, r], i) => add(jitter(new THREE.IcosahedronGeometry(r, 3), 0.18, 4), i % 2 ? leafM2 : leafM, [x, y, z + TZ]));
  // падающие листья
  const leafG = new THREE.CircleGeometry(0.03, 5);
  const leaves = Array.from({ length: 26 }, () => ({ m: add(leafG, rnd() < 0.5 ? leafM : leafM2, [0, 0, 0], { cast: false }), x: -0.4 + rnd() * 2, z: -2.4 + rnd() * 2.2, off: rnd(), sp: 0.12 + rnd() * 0.1 }));
  leaves.forEach(l => l.m.material.side = THREE.DoubleSide);
  // белый помост с коротким мечом на подставке
  add(box(0.9, 0.06, 0.9, 0.01), mat('#efeae0', { physical: true, rough: 0.8, sheen: 0.5 }), [0.1, 0.03, -0.9], { cast: false });
  const sanbo = new THREE.Group(); sanbo.position.set(0.1, 0.06, -0.62); root.add(sanbo);
  add(box(0.3, 0.12, 0.3, 0.01), mat('#d8c8a0', { map: woodTex, rough: 0.6 }), [0, 0.06, 0], { parent: sanbo });
  add(box(0.34, 0.025, 0.34, 0.005), mat('#e6d8b4', { rough: 0.6 }), [0, 0.13, 0], { parent: sanbo });
  add(box(0.3, 0.012, 0.06, 0.004), mat('#f6f2e8', { rough: 0.8 }), [0, 0.15, 0], { parent: sanbo }); // бумага
  add(box(0.26, 0.018, 0.035, 0.006), mat('#140a08', { physical: true, rough: 0.2, clearcoat: 1 }), [0, 0.165, 0], { parent: sanbo });
  // самурай в поклоне
  const sam = person({ pose: 'seiza', robe: '#f2efe8', robe2: '#e6e1d6', hairStyle: 'topknot', frown: 0.1, squint: true });
  sam.position.set(0.1, 0.06, -1.05); root.add(sam);
  scene.add(new THREE.HemisphereLight('#ff9a6a', '#3a1a10', 0.7));
  const sun = new THREE.DirectionalLight('#ffb070', 3.2); sun.position.set(1.5, 2.2, -6); sun.target.position.set(0, 0, -1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005;
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 14 }); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#8a6aa0', 0.6); fill.position.set(-2, 2, 3); scene.add(fill);
  return {
    cam: { from: [0.55, 1.05, 2.7], to: [0.4, 0.85, 1.9], lookFrom: [0.0, 0.85, -1.8], lookTo: [0.05, 0.6, -1.3], fov: 40 },
    focus: [0.1, 0.4, -0.9], bloom: 0.55,
    update(t, T2) {
      const bow = ease((t - 0.6) / 2.2) * 0.42; sam.rotation.x = bow; sam.position.z = -1.05 + bow * 0.08;
      leaves.forEach(l => { const u = (t * l.sp + l.off) % 1; l.m.position.set(l.x + Math.sin(u * 9 + l.off * 5) * 0.15, 2.0 - u * 2.0, l.z - 0.6); l.m.rotation.set(u * 12, u * 7, u * 5); });
    },
  };
}

// ---------- 7. Рекорд: золотой час, замок на скале, корабль на горизонте ----------
function emmy(T) {
  scene.background = new THREE.Color('#d88a3a'); scene.fog = new THREE.Fog('#d88a50', 25, 80);
  const sky = canvasTex(512, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1a3a'); gr.addColorStop(0.4, '#9a4a3a'); gr.addColorStop(0.65, '#f0a050'); gr.addColorStop(0.78, '#ffe0a0'); gr.addColorStop(1, '#e8a058');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const s = g.createRadialGradient(w * 0.42, h * 0.76, 4, w * 0.42, h * 0.76, 150); s.addColorStop(0, 'rgba(255,250,220,1)'); s.addColorStop(0.25, 'rgba(255,220,150,0.8)'); s.addColorStop(1, 'rgba(255,180,90,0)'); g.fillStyle = s; g.fillRect(0, 0, w, h);
    g.filter = 'blur(8px)'; for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(120,50,50,${0.2 + rnd() * 0.2})`; g.beginPath(); g.ellipse(rnd() * w, h * 0.25 + rnd() * h * 0.4, 90 + rnd() * 120, 8 + rnd() * 12, 0, 0, 7); g.fill(); }
  });
  add(new THREE.PlaneGeometry(40, 50), new THREE.MeshBasicMaterial({ map: sky, fog: false }), [0, 8, -24], { cast: false, recv: false });
  const waves = sea(60, 40, -14, '#6a4236', { rough: 0.85, clearcoat: 0.05 });
  // скала справа и замок
  const rock = add(jitter(new THREE.IcosahedronGeometry(2.2, 3), 0.18, 1.5), mat('#3a2e2a', { rough: 0.95 }), [2.1, -0.6, -7], { scale: [1, 1.1, 1] });
  const wallM = mat('#efe6d6', { rough: 0.8 }), roofM = mat('#2a2a30', { physical: true, rough: 0.4, clearcoat: 0.5 }), goldM = mat('#d9b45a', { metal: 0.8, rough: 0.3 });
  const castle = new THREE.Group(); castle.position.set(1.6, 1.45, -7.2); root.add(castle);
  add(box(1.3, 0.35, 1.0, 0.02), mat('#5a5048', { rough: 0.95 }), [0, -0.05, 0], { parent: castle });
  [[1.0, 0.35, 0.8], [0.8, 0.3, 0.65], [0.6, 0.28, 0.5], [0.42, 0.25, 0.36]].reduce((y, [w, h, d]) => {
    add(box(w, h, d, 0.01), wallM, [0, y + h / 2, 0], { parent: castle });
    add(new THREE.ConeGeometry(w * 0.85, 0.2, 4, 1), roofM, [0, y + h + 0.06, 0], { parent: castle, rot: [0, Math.PI / 4, 0], scale: [1, 1, d / w] });
    return y + h + 0.12;
  }, 0.12);
  add(box(0.05, 0.08, 0.02), goldM, [0.12, 1.65, 0], { parent: castle }); add(box(0.05, 0.08, 0.02), goldM, [-0.12, 1.65, 0], { parent: castle });
  // сосна на скале слева
  const pine = new THREE.Group(); pine.position.set(-1.6, 0, -3.5); root.add(pine);
  add(jitter(new THREE.IcosahedronGeometry(0.9, 2), 0.2, 2), mat('#2e2422', { rough: 0.95 }), [0, -0.3, 0], { parent: pine, scale: [1.3, 0.8, 1] });
  const trunk = mat('#2a1810', { rough: 0.9 });
  limb([-1.6, 0.3, -3.5], [-1.4, 1.2, -3.4], 0.06, trunk); limb([-1.4, 1.2, -3.4], [-0.8, 1.6, -3.3], 0.045, trunk);
  [[-1.4, 1.35, -3.4, 0.35], [-0.75, 1.65, -3.3, 0.3], [-1.1, 1.6, -3.35, 0.25]].forEach(([x, y, z, r]) => add(jitter(new THREE.IcosahedronGeometry(r, 2), 0.15, 4), mat('#2c3a26', { rough: 0.8 }), [x, y, z], { scale: [1.6, 0.45, 1.1] }));
  // корабль на горизонте
  const { ship, sail } = shipModel(root, {}); ship.position.set(-0.6, 0.0, -10); ship.rotation.y = 0.3; ship.scale.setScalar(0.6);
  scene.add(new THREE.HemisphereLight('#ffc890', '#4a2a20', 0.9));
  const sun = new THREE.DirectionalLight('#ffb070', 1.4); sun.position.set(-1, 2, -10); sun.target.position.set(0, 0, -4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); scene.add(sun, sun.target);
  const glint = add(new THREE.PlaneGeometry(3, 12), new THREE.MeshBasicMaterial({ map: softTex, color: '#ffe0a0', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), [-0.4, 0.06, -12], { rot: [-Math.PI / 2, 0, 0], cast: false, recv: false });
  return {
    cam: { from: [0.1, 1.3, 2.6], to: [0.1, 1.45, 1.6], lookFrom: [0.3, 1.4, -8], lookTo: [0.5, 1.5, -8], fov: 42 },
    focus: [0, 1, -8], aperture: 0.004, bloom: 0.4, env: 0.08,
    update(t) { waves(t); flutter(sail, t, false); ship.position.x = -0.6 + t * 0.06; glint.material.opacity = 0.12 + 0.04 * Math.sin(t * 2); },
  };
}

// ---------- 8. Сёги при свече: рука ставит фигуру, в конце — темнота ----------
function shogi(T) {
  scene.background = new THREE.Color('#050302');
  add(new THREE.PlaneGeometry(6, 6), mat('#3a2418', { map: woodTex, rough: 0.6 }), [0, 0, -1], { rot: [-Math.PI / 2, 0, 0], cast: false });
  const grid = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#d8a860'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(140,90,40,${0.1 + rnd() * 0.15})`; g.lineWidth = 2 + rnd() * 4; g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 20, w * 0.6, y - 20, w, y + 10); g.stroke(); }
    g.strokeStyle = '#2a1a0c'; g.lineWidth = 4; const m = 60, c = (w - 2 * m) / 9;
    for (let i = 0; i <= 9; i++) { g.beginPath(); g.moveTo(m + i * c, m); g.lineTo(m + i * c, h - m); g.stroke(); g.beginPath(); g.moveTo(m, m + i * c); g.lineTo(w - m, m + i * c); g.stroke(); }
  });
  const board = new THREE.Group(); board.position.set(0, 0, -0.9); root.add(board);
  add(box(0.9, 0.16, 0.95, 0.01), mat('#c89450', { rough: 0.5 }), [0, 0.2, 0], { parent: board });
  add(new THREE.PlaneGeometry(0.88, 0.93), mat('#ffffff', { map: grid, rough: 0.5 }), [0, 0.281, 0], { parent: board, rot: [-Math.PI / 2, 0, 0], cast: false });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(sphere(0.06), mat('#a87840', { rough: 0.5 }), [a * 0.36, 0.08, b * 0.38], { parent: board, scale: [1, 1.3, 1] }));
  // фигуры-пятиугольники с иероглифами
  const kanji = ['王', '金', '銀', '桂', '香', '飛', '角', '歩'];
  const pieceTex = kanji.map(k => canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#e8c890'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a0e08'; g.font = 'bold 72px serif'; g.textAlign = 'center'; g.fillText(k, 64, 90); }));
  const shape = new THREE.Shape(); shape.moveTo(-0.032, -0.036); shape.lineTo(0.032, -0.036); shape.lineTo(0.026, 0.02); shape.lineTo(0, 0.04); shape.lineTo(-0.026, 0.02); shape.closePath();
  const pg = new THREE.ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 });
  pg.rotateX(-Math.PI / 2);
  const pieceSide = mat('#d8b070', { rough: 0.5 });
  const piece = (k, x, z, flip = false) => {
    const g = new THREE.Group(); g.position.set(x, 0.282, z); g.rotation.y = flip ? Math.PI : 0; board.add(g);
    add(pg, pieceSide, [0, 0, 0], { parent: g });
    add(new THREE.PlaneGeometry(0.05, 0.05), mat('#ffffff', { map: pieceTex[k], rough: 0.5 }), [0, 0.0175, 0.0], { parent: g, rot: [-Math.PI / 2, 0, 0], cast: false });
    return g;
  };
  const c = 0.0855, gx = (i) => -0.385 + c * (i + 0.5), gz = (j) => -0.41 + c * (j + 0.5) + 0.02;
  [[0, 0, 4], [3, 0, 3], [2, 1, 1], [7, 2, 4], [7, 2, 6], [6, 1, 2], [0, 8, 4], [1, 8, 3], [7, 6, 5], [5, 7, 7], [7, 6, 2]].forEach(([k, j, i]) => piece(k, gx(i), gz(j), j < 4));
  const moving = piece(5, 0, 0);
  // рука в рукаве
  const arm = new THREE.Group(); root.add(arm);
  const sleeve = mat('#6a2018', { physical: true, rough: 0.8, sheen: 0.8, sheenColor: '#ff9070' });
  limb([0.0, 0.0, 0.0], [0.0, 0.05, 0.42], 0.05, sleeve, arm);
  const skin = mat('#e9b08a', { physical: true, rough: 0.5, sheen: 0.5, sheenColor: '#ff9f86' });
  add(sphere(0.05), skin, [0, -0.01, -0.06], { parent: arm, scale: [1, 0.6, 1.2] });
  limb([-0.02, -0.02, -0.1], [-0.015, -0.05, -0.15], 0.012, skin, arm); limb([0.02, -0.02, -0.1], [0.02, -0.05, -0.15], 0.012, skin, arm);
  // свеча
  add(new THREE.CylinderGeometry(0.03, 0.032, 0.22, 20), mat('#f2e8d4', { physical: true, rough: 0.4, transmission: 0.2 }), [-0.5, 0.11, -1.2]);
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 20), mat('#3a2a1a', { metal: 0.6, rough: 0.4 }), [-0.5, 0.01, -1.2]);
  const flame = fire([-0.5, 0.2, -1.2], 0.25, 2.2);
  scene.add(new THREE.HemisphereLight('#3a2a40', '#0a0604', 0.15));
  const from = new THREE.Vector3(0.18, 0.55, 0.1), to = new THREE.Vector3(gx(4), 0.3, gz(5)), hand = new THREE.Vector3();
  return {
    cam: { from: [0.45, 0.85, 0.15], to: [0.25, 0.62, -0.25], lookFrom: [0.0, 0.25, -0.95], lookTo: [0.02, 0.28, -0.88], fov: 40 },
    focus: (t) => new THREE.Vector3(gx(4), 0.3, -0.9 + gz(5)), aperture: 0.02, bloom: 0.6, env: 0.04,
    update(t) {
      flame(t);
      const u = ease((t - 0.1 * T) / (0.4 * T)), back = ease((t - 0.62 * T) / (0.2 * T));
      const target = new THREE.Vector3(gx(4), 0.332, gz(5) - 0.9);
      hand.lerpVectors(from, target, u);
      if (back > 0) hand.lerp(new THREE.Vector3(0.25, 0.6, 0.3), back);
      arm.position.set(hand.x, hand.y + 0.03, hand.z + 0.12); arm.rotation.x = -0.35;
      if (back <= 0) moving.position.set(hand.x, hand.y - 0.05, hand.z + 0.9 - 0.04);
      else moving.position.set(gx(4), 0.282, gz(5));
    },
  };
}

run({ pit, shore, hold, hall, mariko, garden, emmy, shogi }[SHOT]);
