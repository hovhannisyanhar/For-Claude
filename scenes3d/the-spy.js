// «Разведчик» (The Spy, 2019): 10 планов в стиле Пиксар.
// ?shot=banquet|shop|briefing|farewell|buenos-aires|embrace|radio|signal|stickers|mirror&dur=
import { THREE, P, scene, root, rnd, canvasTex, mat, add, sphere, box, capsule, limb, lathe, shade, woodTex, person, fire, flick, ease, softTex, run } from './core.js';

const SHOT = P.get('shot') || 'banquet';
const HR = 0.15;
const breathe = (o, t, k = 1) => { o.scale.y = 1 + Math.sin(t * 2.2 * k) * 0.008; };
// спрайты-ореолы GTAO рисует серыми квадратами, поэтому свечение даёт только bloom от эмиссивных материалов
const glowSprite = (pos) => ({ position: new THREE.Vector3(...pos), material: { opacity: 0 } });
const shadowed = (l, size = 2048, r = 5) => { l.castShadow = true; l.shadow.mapSize.set(size, size); l.shadow.bias = -0.0005; l.shadow.radius = r; return l; };

// ---------- герои 1960-х ----------
// kind: kamel (белый костюм, усы), eli (рубашка), general (форма, фуражка), suit (тёмный костюм), nadia, handler (седой, очки)
function man(kind, o = {}) {
  const C = {
    kamel: { robe: '#e9e1cf', robe2: '#d8cfba', hair: '#17110d', tie: '#5a1e1a', stache: true },
    eli: { robe: '#f1ede4', robe2: '#3a3a40', hair: '#1c1510', tie: null },
    general: { robe: '#4f5a3a', robe2: '#3c452c', hair: '#1a1410', tie: '#3a4128', cap: true, stache: o.stache ?? true },
    suit: { robe: '#25262c', robe2: '#1c1c22', hair: '#15110e', tie: '#101014', shades: true },
    handler: { robe: '#3a3a42', robe2: '#2a2a30', hair: '#b8b4ac', tie: '#5a2a24', glasses: true },
    hat: { robe: '#2a2622', robe2: '#1e1b18', hair: '#15110e', tie: null, fedora: true },
    guest: { robe: o.robe || '#5a3a3a', robe2: '#2a2226', hair: '#2a1c14', tie: '#c8a050' },
  }[kind] || {};
  const c = { ...C, ...o };
  const g = person({ pose: 'stand', trousers: kind !== 'nadia', robe: c.robe, robe2: c.robe2, hair: c.hair, skin: c.skin || '#dca07a', iris: '#2a1a10', hands: c.hands || 'down', frown: c.frown ?? 0.1, lips: c.lips });
  const head = g.userData.head, sY = g.userData.shoulderY;
  const hairM = mat(c.hair, { physical: true, rough: 0.4, clearcoat: 0.5 });
  if (kind === 'nadia') {
    add(sphere(HR * 1.1), hairM, [0, 0.02, -0.03], { parent: head, scale: [1.08, 1.02, 1] });
    [-1, 1].forEach(s => add(sphere(0.085), hairM, [s * 0.12, -0.07, -0.02], { parent: head, scale: [0.7, 1.1, 1] }));
    add(sphere(0.07), hairM, [0.03, 0.12, 0.07], { parent: head, scale: [1.6, 0.5, 0.9], rot: [0.5, 0, -0.3] });
  } else {
    add(sphere(HR * 1.05), hairM, [0, 0.035, -0.035], { parent: head, scale: [1.04, 0.9, 1] }); // гладко зачёсанные
    add(sphere(0.09), hairM, [0.02, 0.115, 0.03], { parent: head, scale: [1.45, 0.5, 1.15], rot: [0.25, 0, -0.1] }); // кок
  }
  if (c.stache) add(capsule(0.014, 0.06), hairM, [0, -0.046, HR * 0.95], { parent: head, rot: [0, 0, Math.PI / 2] });
  if (c.smile) add(new THREE.TorusGeometry(0.03, 0.008, 8, 20, Math.PI), mat('#5a1e1a', { rough: 0.4 }), [0, -0.062, HR * 0.9], { parent: head, rot: [0, 0, Math.PI] });
  if (c.glasses) [-1, 1].forEach(s => add(new THREE.TorusGeometry(0.032, 0.004, 8, 24), mat('#1a1a1a', { metal: 0.5, rough: 0.3 }), [s * 0.055, 0.005, HR * 0.9 + 0.03], { parent: head }));
  if (c.shades) [-1, 1].forEach(s => add(sphere(0.034), mat('#0c0c0e', { physical: true, rough: 0.1, clearcoat: 1 }), [s * 0.055, 0.008, HR * 0.9 + 0.012], { parent: head, scale: [1.15, 0.8, 0.4] }));
  if (c.cap) {
    const olive = mat('#4a5636', { rough: 0.7 });
    add(new THREE.CylinderGeometry(0.168, 0.155, 0.07, 32), mat('#2a2e20', { rough: 0.6 }), [0, 0.15, -0.01], { parent: head });
    add(new THREE.CylinderGeometry(0.19, 0.17, 0.05, 32), olive, [0, 0.205, -0.01], { parent: head, scale: [1, 1, 1.05] });
    add(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 32, 1, false, 0, Math.PI), mat('#141410', { physical: true, rough: 0.2, clearcoat: 1 }), [0, 0.12, 0.08], { parent: head, rot: [0.25, -Math.PI / 2, 0] });
    add(sphere(0.022), mat('#d9b45a', { metal: 0.9, rough: 0.3 }), [0, 0.165, 0.165], { parent: head, scale: [1, 1, 0.5] });
    [-1, 1].forEach(s => add(box(0.1, 0.022, 0.12, 0.008), mat('#c9a24a', { metal: 0.7, rough: 0.35 }), [s * 0.13, sY + 0.005, 0], { parent: g }));
    [0, 1, 2].forEach(i => add(box(0.022, 0.03, 0.012, 0.003), mat(['#c8322a', '#2a5ac8', '#d9b45a'][i], { rough: 0.4 }), [-0.06 + i * 0.026, sY - 0.1, 0.152], { parent: g }));
  }
  if (c.fedora) {
    const felt = mat('#1e1c1a', { rough: 0.8 });
    add(new THREE.CylinderGeometry(0.13, 0.15, 0.11, 32), felt, [0, 0.15, -0.01], { parent: head });
    add(new THREE.CylinderGeometry(0.25, 0.25, 0.012, 40), felt, [0, 0.1, -0.01], { parent: head });
  }
  if (c.tie !== null && c.tie) {
    add(box(0.085, 0.11, 0.02, 0.005), mat('#f4f2ec', { rough: 0.6 }), [0, sY - 0.05, 0.135], { parent: g, rot: [-0.25, 0, 0] });
    add(box(0.034, 0.2, 0.018, 0.006), mat(c.tie, { physical: true, rough: 0.5, sheen: 0.5 }), [0, sY - 0.13, 0.152], { parent: g, rot: [-0.08, 0, 0] });
  } else if (kind !== 'nadia') {
    add(box(0.13, 0.05, 0.03, 0.01), mat(c.robe, { rough: 0.8 }), [0, sY + 0.005, 0.1], { parent: g, rot: [-0.4, 0, 0] }); // воротник
  }
  return g;
}
function glass(parent, pos, wine = '#7a1420') {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  add(lathe([[0, 0], [0.025, 0], [0.004, 0.006], [0.004, 0.05], [0.028, 0.07], [0.032, 0.11], [0.03, 0.12]], 24), mat('#dfe8f0', { physical: true, rough: 0.05, opacity: 0.35, clearcoat: 1 }), [0, 0, 0], { parent: g, cast: false });
  add(new THREE.CylinderGeometry(0.027, 0.02, 0.03, 20), mat(wine, { rough: 0.2, emissive: wine, ei: 0.3 }), [0, 0.08, 0], { parent: g, cast: false });
  return g;
}
const holdGlass = (p) => glass(p, [p.userData.hands[1][0], p.userData.hands[1][1] + 0.02, p.userData.hands[1][2]]);
function floor(color, o = {}) { return add(new THREE.PlaneGeometry(o.w || 10, o.d || 10), mat(color, { map: o.map, rough: o.rough ?? 0.6, physical: !!o.cc, clearcoat: o.cc ?? 0 }), [0, 0, o.z ?? -2], { rot: [-Math.PI / 2, 0, 0], cast: false }); }
function wall(color, z, o = {}) { return add(new THREE.PlaneGeometry(o.w || 10, o.h || 5), mat(color, { map: o.map, rough: 0.9 }), [o.x || 0, (o.h || 5) / 2, z], { cast: false, rot: o.rot }); }
const wallpaper = (base, line) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.strokeStyle = line; g.lineWidth = 3; for (let x = 16; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.fillStyle = line; for (let y = 32; y < h; y += 64) for (let x = 48; x < w; x += 64) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); } }, [4, 2]);
const dusk = (top, mid, low) => canvasTex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.6, mid); gr.addColorStop(1, low); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,${200 + rnd() * 40},140,${0.5 + rnd() * 0.5})`; g.fillRect(rnd() * w, h * 0.72 + rnd() * h * 0.26, 4, 6); } });
function windowFrame(x, y, z, w, h, tex, o = {}) {
  add(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [x, y, z], { cast: false, recv: false });
  const fr = mat(o.frame || '#e8e0d0', { rough: 0.6 });
  add(box(w + 0.08, 0.05, 0.06), fr, [x, y - h / 2, z + 0.02]); add(box(w + 0.08, 0.05, 0.06), fr, [x, y + h / 2, z + 0.02]);
  [-1, 1, 0].forEach(s => add(box(s ? 0.05 : 0.03, h, 0.05), fr, [x + s * w / 2, y, z + 0.02]));
  add(box(w, 0.03, 0.05), fr, [x, y + h * 0.15, z + 0.02]);
}
function hemi(sky, ground, i) { scene.add(new THREE.HemisphereLight(sky, ground, i)); }

// ---------- 1. Банкет в Дамаске: генералы поднимают бокалы, во главе стола Камель ----------
function banquet(T) {
  scene.background = new THREE.Color('#0b0a10');
  floor('#3a2214', { map: woodTex, rough: 0.5, cc: 0.4 });
  wall('#3a2a22', -3.2, { map: wallpaper('#4a2e24', '#5e3c2c') });
  windowFrame(0, 1.35, -3.18, 1.1, 1.5, dusk('#0a1430', '#1a2a50', '#2a3058'), { frame: '#5a3a24' });
  const cloth = mat('#f2ece0', { physical: true, rough: 0.8, sheen: 0.6 });
  add(box(0.8, 0.05, 3.0, 0.01), cloth, [0, 0.42, -1.25]);
  add(box(0.82, 0.36, 3.02, 0.01), cloth, [0, 0.22, -1.25]);
  const people = [];
  [-0.15, -0.85, -1.55].forEach((z, i) => [-1, 1].forEach((s) => {
    const p = man('general', { hands: (i + (s > 0)) % 2 ? 'toast' : 'lap', frown: -0.1, stache: (i + s) % 2 === 0 });
    p.position.set(s * 0.58, -0.26, z); p.rotation.y = -s * Math.PI / 2 + s * 0.25; root.add(p);
    if ((i + (s > 0)) % 2) holdGlass(p);
    people.push(p);
  }));
  const kam = man('kamel', { hands: 'toast', smile: true, frown: -0.2 });
  kam.position.set(0, -0.2, -2.45); root.add(kam); holdGlass(kam);
  // приборы и свечи
  [-0.15, -0.85, -1.55].forEach(z => [-1, 1].forEach(s => { add(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 32), mat('#ffffff', { rough: 0.3 }), [s * 0.25, 0.45, z]); glass(root, [s * 0.3, 0.445, z - 0.14], '#c89030'); }));
  const flames = [-0.5, -1.2, -1.9].map(z => {
    add(new THREE.CylinderGeometry(0.014, 0.016, 0.12, 12), mat('#f6eedc', { rough: 0.5 }), [0, 0.51, z]);
    add(sphere(0.014, 12, 8), mat('#ffd080', { emissive: '#ffb040', ei: 6 }), [0, 0.59, z], { cast: false, scale: [1, 1.6, 1] });
    return glowSprite([0, 0.66, z], '#ffb050', 0.22, 0.9);
  });
  // люстры
  const lights = [-0.5, -1.8].map((z, i) => {
    const g = new THREE.Group(); g.position.set(0, 1.85, z); root.add(g);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; add(sphere(0.035, 16, 12), mat('#ffe2a8', { emissive: '#ffc070', ei: 3 }), [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], { parent: g, cast: false }); }
    add(new THREE.TorusGeometry(0.2, 0.01, 8, 40), mat('#c9a24a', { metal: 0.9, rough: 0.3 }), [0, -0.02, 0], { parent: g, rot: [Math.PI / 2, 0, 0], cast: false });
    glowSprite([0, 1.85, z], '#ffc070', 0.9, 0.5);
    const l = new THREE.PointLight('#ffc27a', 3.2, 4.5, 1.4); l.position.set(0, 1.7, z); if (i === 0) shadowed(l, 1024, 6); scene.add(l); return l;
  });
  hemi('#3a3a5a', '#1a0c06', 0.35);
  const moon = new THREE.DirectionalLight('#7a9ad8', 1.4); moon.position.set(0, 2, -6); moon.target.position.set(0, 0.7, -2); scene.add(moon, moon.target);
  return {
    cam: { from: [0.55, 1.3, 0.75], to: [0.4, 1.2, 0.3], lookFrom: [-0.05, 0.62, -1.7], lookTo: [-0.05, 0.6, -1.7], fov: 42 },
    focus: [0, 0.7, -2.45], aperture: 0.008, bloom: 0.55,
    update(t) {
      flames.forEach((f, i) => f.material.opacity = 0.7 + 0.25 * flick(t + i));
      people.forEach((p, i) => { breathe(p, t, 1 + i * 0.07); p.userData.head.rotation.y = Math.sin(t * 0.5 + i) * 0.12 + (p.position.x > 0 ? -0.25 : 0.25); });
      kam.userData.head.rotation.y = Math.sin(t * 0.6) * 0.15; kam.position.y = -0.2 + Math.sin(t * 1.5) * 0.005;
    },
  };
}

// ---------- 2. Лавка в Тель-Авиве: продавец Эли, в дверях — человек в шляпе ----------
function shop(T) {
  scene.background = new THREE.Color('#2a2016');
  floor('#8a6a4a', { map: woodTex, rough: 0.7 });
  wall('#d8c8a8', -1.7, { map: wallpaper('#d8c6a0', '#c8b48c') });
  wall('#cdbd9a', -2, { rot: [0, Math.PI / 2, 0], x: -1.4 });
  // дверь справа: яркая улица
  const street = canvasTex(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff6dc'); gr.addColorStop(0.6, '#f4dca8'); gr.addColorStop(1, '#d8b47a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(200,170,120,0.6)'; g.fillRect(0, h * 0.2, w * 0.35, h * 0.55); });
  add(new THREE.PlaneGeometry(0.55, 1.15), new THREE.MeshBasicMaterial({ map: street, toneMapped: false }), [0.62, 0.575, -1.69], { cast: false, recv: false });
  const fr = mat('#5a3a24', { rough: 0.6 });
  add(box(0.06, 1.2, 0.08), fr, [0.32, 0.6, -1.66]); add(box(0.06, 1.2, 0.08), fr, [0.92, 0.6, -1.66]); add(box(0.66, 0.06, 0.08), fr, [0.62, 1.2, -1.66]);
  // полки с товаром
  const shelfM = mat('#6a4a30', { map: woodTex, rough: 0.6 });
  const cols = ['#c8463c', '#3c78a8', '#e8c050', '#5a9a5a', '#e8e0d0', '#a85a8a'];
  [0.55, 0.9, 1.25].forEach((y, r) => {
    add(box(1.3, 0.03, 0.25, 0.005), shelfM, [-0.55, y, -1.57]);
    for (let i = 0; i < 7; i++) {
      const x = -1.12 + i * 0.165, c = cols[(i + r * 2) % cols.length];
      if ((i + r) % 3 === 0) add(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 20), mat(c, { physical: true, rough: 0.2, clearcoat: 1, opacity: 0.85 }), [x, y + 0.085, -1.55]);
      else add(box(0.12, 0.12 + (i % 2) * 0.05, 0.12, 0.01), mat(c, { rough: 0.7 }), [x, y + 0.08 + (i % 2) * 0.025, -1.55]);
    }
  });
  // прилавок
  add(box(1.5, 0.5, 0.45, 0.02), mat('#7a5232', { map: woodTex, rough: 0.5 }), [-0.3, 0.25, -0.55]);
  add(box(1.56, 0.04, 0.5, 0.01), mat('#4a2e1c', { physical: true, rough: 0.3, clearcoat: 0.6 }), [-0.3, 0.52, -0.55]);
  add(box(0.3, 0.16, 0.2, 0.02), mat('#2a2a2e', { metal: 0.6, rough: 0.35 }), [-0.75, 0.62, -0.6]); // касса
  const eli = man('eli', { hands: 'desk', frown: 0.05 }); eli.position.set(-0.3, 0, -1.05); root.add(eli);
  const stranger = man('hat', { hands: 'down' }); stranger.position.set(0.8, 0, -1.52); stranger.rotation.y = -0.25; root.add(stranger);
  stranger.traverse(m => { if (m.isMesh) m.material = mat('#141210', { rough: 0.9 }); });
  hemi('#fff0d8', '#5a4030', 0.6);
  const sun = shadowed(new THREE.SpotLight('#ffe2b0', 9, 6, 0.55, 0.6, 1.2)); sun.position.set(0.9, 1.6, -2.6); sun.target.position.set(0.3, 0, -0.4); scene.add(sun, sun.target);
  const key = shadowed(new THREE.SpotLight('#ffe8c8', 3, 6, 0.5, 0.8, 1.3)); key.position.set(-1.2, 2.0, 1.2); key.target.position.set(-0.3, 0.6, -1); scene.add(key, key.target);
  return {
    cam: { from: [-0.1, 1.1, 1.75], to: [0.0, 1.05, 1.3], lookFrom: [0.15, 0.62, -1.3], lookTo: [0.2, 0.6, -1.3], fov: 44 },
    focus: [-0.3, 0.8, -1.05], aperture: 0.006,
    update(t) {
      const u = ease(t / (T * 0.6));
      stranger.position.x = 0.8 - u * 0.2;
      eli.userData.head.rotation.y = ease((t - T * 0.35) / (T * 0.3)) * 0.65; breathe(eli, t);
    },
  };
}

// ---------- 3. Кабинет Моссада: лампа, папка с фото Эли, карта Сирии ----------
function syriaMap() {
  return canvasTex(1024, 768, (g, w, h) => {
    g.fillStyle = '#e6d8b4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#9cc0c8'; g.beginPath(); g.moveTo(0, 0); g.lineTo(230, 0); g.bezierCurveTo(210, 200, 260, 330, 200, 460); g.bezierCurveTo(170, 560, 220, 680, 180, h); g.lineTo(0, h); g.fill();
    g.strokeStyle = '#8a5a3a'; g.lineWidth = 5; g.setLineDash([18, 10]);
    g.beginPath(); g.moveTo(240, 40); g.lineTo(560, 70); g.lineTo(900, 30); g.lineTo(980, 260); g.lineTo(760, 520); g.lineTo(520, 640); g.lineTo(330, 560); g.lineTo(300, 420); g.lineTo(250, 300); g.closePath(); g.stroke();
    g.setLineDash([]); g.fillStyle = 'rgba(200,150,90,0.18)'; g.fill();
    g.strokeStyle = 'rgba(80,60,40,0.25)'; g.lineWidth = 1; for (let x = 0; x < w; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#4a3020'; g.font = 'bold 64px serif'; g.fillText('СИРИЯ', 560, 300);
    g.font = 'bold 34px serif'; g.fillText('ДАМАСК', 360, 500);
    g.strokeStyle = '#c8241c'; g.lineWidth = 7; g.beginPath(); g.arc(330, 470, 46, 0, 7); g.stroke();
  });
}
function photoTex() {
  return canvasTex(256, 320, (g, w, h) => {
    g.fillStyle = '#f2ece0'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a6a66'; g.fillRect(16, 16, w - 32, h - 70);
    g.fillStyle = '#c8c4bc'; g.beginPath(); g.ellipse(128, 130, 56, 70, 0, 0, 7); g.fill();
    g.fillStyle = '#2a2622'; g.beginPath(); g.ellipse(128, 82, 60, 32, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#2a2622'; g.beginPath(); g.arc(106, 128, 7, 0, 7); g.arc(150, 128, 7, 0, 7); g.fill();
    g.fillRect(108, 170, 40, 5); g.fillStyle = '#e8e4dc'; g.fillRect(40, 206, 176, 30);
    g.fillStyle = '#2a2622'; g.font = 'bold 26px monospace'; g.fillText('Э. КОЭН', 70, 290);
  });
}
function briefing(T) {
  scene.background = new THREE.Color('#06080c');
  floor('#2a2420', { rough: 0.8 });
  wall('#3a3e44', -1.75, { map: wallpaper('#3a3e44', '#44484e') });
  const map = syriaMap();
  add(new THREE.PlaneGeometry(1.3, 0.97), mat('#ffffff', { map, rough: 0.8 }), [-0.15, 1.12, -1.73], { cast: false });
  add(box(1.36, 1.03, 0.02), mat('#3a2618', { rough: 0.6 }), [-0.15, 1.12, -1.745]);
  const pin = add(sphere(0.022), mat('#e02a20', { emissive: '#ff3020', ei: 2 }), [-0.15 - 0.65 + 330 / 1024 * 1.3, 1.12 + 0.485 - 470 / 768 * 0.97, -1.71]);
  const pinGlow = glowSprite(pin.position.toArray(), '#ff4030', 0.25, 0.5);
  // стол, лампа, папка
  add(box(1.3, 0.05, 0.75, 0.01), mat('#4a2e1c', { map: woodTex, physical: true, rough: 0.35, clearcoat: 0.5 }), [0, 0.5, -0.55]);
  add(box(1.26, 0.48, 0.7, 0.01), mat('#3a2416', { map: woodTex, rough: 0.6 }), [0, 0.25, -0.55]);
  add(box(0.42, 0.012, 0.3, 0.004), mat('#c8a870', { rough: 0.8 }), [0.05, 0.532, -0.45], { rot: [0, 0.15, 0] });
  add(new THREE.PlaneGeometry(0.15, 0.19), mat('#ffffff', { map: photoTex(), rough: 0.7 }), [0.0, 0.54, -0.45], { rot: [-Math.PI / 2, 0, 0.25], cast: false });
  add(box(0.18, 0.004, 0.24, 0.002), mat('#f4efe4', { rough: 0.9 }), [0.17, 0.54, -0.42], { rot: [0, -0.1, 0] });
  const lamp = new THREE.Group(); lamp.position.set(-0.42, 0.525, -0.7); root.add(lamp);
  add(new THREE.CylinderGeometry(0.07, 0.08, 0.025, 24), mat('#b8963a', { metal: 0.9, rough: 0.3 }), [0, 0.012, 0], { parent: lamp });
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 10), mat('#b8963a', { metal: 0.9, rough: 0.3 }), [0, 0.15, 0], { parent: lamp });
  add(new THREE.SphereGeometry(0.11, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat('#1f5a3a', { physical: true, rough: 0.2, clearcoat: 1, side: THREE.DoubleSide }), [0, 0.27, 0], { parent: lamp, scale: [1.3, 0.7, 1] });
  add(new THREE.CircleGeometry(0.1, 24), mat('#fff0c8', { emissive: '#ffe0a0', ei: 3 }), [0, 0.268, 0], { parent: lamp, rot: [Math.PI / 2, 0, 0], cast: false });
  const lampL = shadowed(new THREE.SpotLight('#ffd89a', 6, 2.5, 0.9, 0.7, 1.3), 1024); lampL.position.set(-0.42, 0.78, -0.7); lampL.target.position.set(-0.05, 0.5, -0.45); scene.add(lampL, lampL.target);
  // куратор у карты, Эли спиной к нам
  const h = man('handler', { hands: 'point', frown: 0.4 }); h.position.set(0.38, 0, -1.3); h.rotation.y = -0.6; root.add(h);
  const eli = man('eli', { hands: 'desk' }); eli.position.set(0.05, -0.27, 0.05); eli.rotation.y = Math.PI; root.add(eli);
  hemi('#2a3a5a', '#0a0806', 0.25);
  const mapL = new THREE.SpotLight('#cfe0ff', 4, 4, 0.5, 0.7, 1.3); mapL.position.set(0.6, 2.2, -0.6); mapL.target.position.set(-0.15, 1.1, -1.7); scene.add(mapL, mapL.target);
  const rim = new THREE.DirectionalLight('#6a8ac8', 0.8); rim.position.set(1, 2, -3); scene.add(rim);
  return {
    cam: { from: [0.3, 1.15, 1.25], to: [0.22, 1.1, 0.9], lookFrom: [0.0, 0.72, -1.4], lookTo: [0.0, 0.7, -1.4], fov: 44 },
    focus: [-0.1, 1.0, -1.6], aperture: 0.005, bloom: 0.5,
    update(t) { const k = 0.6 + 0.4 * Math.abs(Math.sin(t * 2.4)); pin.material.emissiveIntensity = 1 + 2 * k; pinGlow.material.opacity = 0.3 + 0.4 * k; h.userData.head.rotation.y = Math.sin(t * 0.7) * 0.1; breathe(h, t); eli.userData.head.rotation.x = -0.05; },
  };
}

// ---------- 4. Прощание: Надя с ребёнком у окна, Эли с чемоданом в дверях ----------
function farewell(T) {
  scene.background = new THREE.Color('#0a0e18');
  floor('#5a4232', { map: woodTex, rough: 0.6 });
  wall('#c8b494', -1.6, { map: wallpaper('#b8a07e', '#a88e6c') });
  windowFrame(-0.55, 1.15, -1.58, 0.75, 0.95, dusk('#1a2050', '#5a4a8a', '#e8906a'));
  // дверь: проём в тёмный подъезд
  add(new THREE.PlaneGeometry(0.55, 1.2), mat('#141c2c', { rough: 0.9 }), [0.75, 0.6, -1.59], { cast: false });
  const fr = mat('#e0d6c4', { rough: 0.6 });
  add(box(0.05, 1.25, 0.06), fr, [0.47, 0.62, -1.57]); add(box(0.05, 1.25, 0.06), fr, [1.03, 0.62, -1.57]); add(box(0.6, 0.05, 0.06), fr, [0.75, 1.24, -1.57]);
  add(box(0.5, 1.15, 0.04, 0.01), mat('#7a5232', { map: woodTex, rough: 0.6 }), [1.12, 0.58, -1.35], { rot: [0, -1.2, 0] });
  // стол с лампой
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 32), mat('#6a4a30', { map: woodTex, rough: 0.5 }), [-0.75, 0.45, -0.5]);
  add(new THREE.CylinderGeometry(0.03, 0.04, 0.44, 12), mat('#4a3220', { rough: 0.6 }), [-0.75, 0.22, -0.5]);
  add(new THREE.ConeGeometry(0.16, 0.12, 32, 1, true), mat('#e8a050', { emissive: '#ff9a40', ei: 0.8, side: THREE.DoubleSide }), [-0.15, 1.35, -0.75], { cast: false });
  add(new THREE.CylinderGeometry(0.004, 0.004, 0.6, 6), mat('#222', {}), [-0.15, 1.7, -0.75], { cast: false });
  glowSprite([-0.15, 1.32, -0.75], '#ffb060', 0.5, 0.6);
  const lampL = shadowed(new THREE.PointLight('#ffb070', 3.2, 3.5, 1.4), 1024); lampL.position.set(-0.15, 1.25, -0.75); scene.add(lampL);
  const nadia = man('nadia', { robe: '#4a6a8a', hair: '#2a1a12', hands: 'hold', lips: '#a83a3a', skin: '#e2aa86', frown: -0.25 });
  nadia.position.set(-0.3, 0, -1.05); nadia.rotation.y = 0.4; root.add(nadia);
  const baby = new THREE.Group(); baby.position.set(0, nadia.userData.shoulderY - 0.13, 0.2); nadia.add(baby);
  add(sphere(0.08), mat('#f4efe6', { physical: true, rough: 0.8, sheen: 0.8 }), [0, 0, 0], { parent: baby, scale: [1.5, 0.9, 1] });
  add(sphere(0.05), mat('#eab896', { physical: true, rough: 0.5 }), [-0.07, 0.04, 0.02], { parent: baby });
  const eli = man('eli', { robe: '#b8a888', robe2: '#4a4238', tie: '#3a2a20', hands: 'down', frown: 0.35 });
  eli.position.set(0.33, 0, -0.9); eli.rotation.y = -0.5; root.add(eli);
  add(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 28), mat('#3a3028', { rough: 0.8 }), [0, 0.15, -0.01], { parent: eli.userData.head });
  add(new THREE.CylinderGeometry(0.22, 0.22, 0.012, 32), mat('#3a3028', { rough: 0.8 }), [0, 0.1, -0.01], { parent: eli.userData.head });
  const rh = eli.userData.hands[1];
  add(box(0.36, 0.26, 0.11, 0.02), mat('#7a4a2a', { rough: 0.55 }), [rh[0] + 0.02, rh[1] - 0.17, rh[2]], { parent: eli });
  add(new THREE.TorusGeometry(0.035, 0.008, 8, 16, Math.PI), mat('#3a2418', {}), [rh[0] + 0.02, rh[1] - 0.04, rh[2]], { parent: eli });
  hemi('#3a4a8a', '#2a1a10', 0.45);
  const duskL = new THREE.DirectionalLight('#8aa0e0', 1.3); duskL.position.set(-1, 1.5, -3); duskL.target.position.set(0, 0.6, -0.8); scene.add(duskL, duskL.target);
  return {
    cam: { from: [0.02, 1.05, 1.75], to: [0.04, 1.0, 1.35], lookFrom: [0.04, 0.6, -1.0], lookTo: [0.04, 0.6, -1.0], fov: 42 },
    focus: [0.0, 0.8, -1.0], aperture: 0.005,
    update(t) {
      lampL.intensity = 3.2 * (0.95 + 0.05 * Math.sin(t * 3));
      nadia.userData.head.rotation.y = 0.35 + Math.sin(t * 0.5) * 0.05; breathe(nadia, t);
      eli.userData.head.rotation.y = -0.5 + ease((t - T * 0.5) / (T * 0.3)) * 0.4; breathe(eli, t, 1.2);
      baby.rotation.z = Math.sin(t * 1.4) * 0.05;
    },
  };
}

// ---------- 5. Буэнос-Айрес: Камель сорит деньгами, в глубине — генерал ----------
function buenosAires(T) {
  scene.background = new THREE.Color('#12060a');
  const tiles = canvasTex(512, 512, (g, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#1a1410' : '#d8ccb4'; g.fillRect(i * 64, j * 64, 64, 64); } }, [6, 6]);
  floor('#ffffff', { map: tiles, rough: 0.25, cc: 0.6 });
  wall('#5a1418', -2.6, { map: wallpaper('#5a1418', '#6a1c20') });
  // гирлянды
  const bulbs = [];
  [1.75, 1.55].forEach((y0, r) => { for (let i = 0; i < 16; i++) { const x = -1.4 + i * 0.19; const y = y0 - Math.sin(i / 15 * Math.PI) * 0.18; bulbs.push(add(sphere(0.022, 12, 8), mat('#ffe0a0', { emissive: '#ffc060', ei: 4 }), [x, y, -2.45 + r * 0.6], { cast: false })); } });
  glowSprite([0, 1.6, -2.3], '#ffa050', 2.5, 0.25);
  const tbl = (x, z, s = 1) => { add(new THREE.CylinderGeometry(0.35 * s, 0.35 * s, 0.04, 32), mat('#f2e8d8', { physical: true, rough: 0.8, sheen: 0.5 }), [x, 0.44, z]); add(new THREE.CylinderGeometry(0.36 * s, 0.4 * s, 0.4, 32, 1, true), mat('#f2e8d8', { rough: 0.85, side: THREE.DoubleSide }), [x, 0.22, z]); };
  tbl(0, -0.45);
  tbl(-0.55, -1.9, 0.8);
  const kam = man('kamel', { hands: 'throw', smile: true, frown: -0.3 }); kam.position.set(0, 0, -0.85); root.add(kam);
  const g1 = man('guest', { robe: '#2a3a5a', hands: 'toast', smile: true, frown: -0.3 }); g1.position.set(-0.5, -0.24, -0.5); g1.rotation.y = 1.1; root.add(g1); holdGlass(g1);
  const g2 = man('nadia', { robe: '#a82a3a', hair: '#e0b060', hands: 'lap', lips: '#c0303a', frown: -0.3 }); g2.position.set(0.48, -0.24, -0.55); g2.rotation.y = -1.0; root.add(g2);
  const gen = man('general', { hands: 'lap', frown: 0.3 }); gen.position.set(-0.55, -0.2, -2.2); gen.rotation.y = 0.35; root.add(gen);
  const guards = [-1.05, -0.05].map(x => { const p = man('suit', { hands: 'down', frown: 0.4 }); p.position.set(x, 0, -2.35); p.rotation.y = 0.2; root.add(p); return p; });
  glass(root, [0.15, 0.46, -0.35], '#c89030'); glass(root, [-0.12, 0.46, -0.3]);
  // купюры
  const noteTex = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#9ab48a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4a6a3a'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#4a6a3a'; g.beginPath(); g.arc(w / 2, h / 2, 14, 0, 7); g.fill(); g.font = 'bold 18px serif'; g.fillText('100', 8, 24); });
  const noteM = mat('#ffffff', { map: noteTex, rough: 0.8, side: THREE.DoubleSide });
  const hand = kam.userData.hands[1], hx = kam.position.x + hand[0], hy = hand[1], hz = kam.position.z + hand[2];
  const notes = Array.from({ length: 28 }, (_, i) => ({ m: add(new THREE.PlaneGeometry(0.09, 0.045), noteM, [hx, hy, hz], { cast: false }), dx: (rnd() - 0.5) * 1.3, dz: rnd() * 0.7, sp: 0.5 + rnd() * 0.6, ph: rnd() * 6, off: rnd() }));
  hemi('#8a3a3a', '#1a0a06', 0.45);
  const key = shadowed(new THREE.SpotLight('#ffcf8a', 6, 6, 0.55, 0.7, 1.3)); key.position.set(0.9, 2.2, 0.8); key.target.position.set(0, 0.7, -0.8); scene.add(key, key.target);
  const back = new THREE.PointLight('#ff7a40', 3, 4, 1.4); back.position.set(-0.4, 1.4, -2.0); scene.add(back);
  const rim = new THREE.DirectionalLight('#ff5a6a', 1.0); rim.position.set(-1, 1.5, -3); scene.add(rim);
  return {
    cam: { from: [0.3, 1.05, 1.55], to: [0.12, 1.0, 1.05], lookFrom: [-0.1, 0.85, -1.3], lookTo: [-0.15, 0.85, -1.3], fov: 42 },
    focus: [0, 0.8, -0.85], aperture: 0.008, bloom: 0.6,
    update(t) {
      bulbs.forEach((b, i) => b.material.emissiveIntensity = 3 + Math.sin(t * 2 + i) * 0.8);
      notes.forEach(n => {
        const u = ((t * 0.35 * n.sp) + n.off) % 1;
        n.m.position.set(hx + n.dx * u + Math.sin(u * 6 + n.ph) * 0.06, hy + 0.25 + u * 0.15 - u * u * 1.4, hz + n.dz * u);
        n.m.rotation.set(t * 3 * n.sp + n.ph, t * 2 + n.ph, t * n.sp);
      });
      [g1, g2].forEach((g, i) => { g.userData.head.rotation.z = Math.sin(t * 6 + i) * 0.05; breathe(g, t, 1.3); });
      kam.userData.head.rotation.z = Math.sin(t * 5) * 0.04;
      gen.userData.head.rotation.y = 0.2 + Math.sin(t * 0.5) * 0.1;
    },
  };
}

// ---------- 6. Терраса на закате: генерал обнимает Камеля, внизу Дамаск ----------
function embrace(T) {
  scene.background = new THREE.Color('#e88a5a'); scene.fog = new THREE.Fog('#e89a6a', 4, 16);
  const sky = canvasTex(512, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1a4a'); gr.addColorStop(0.35, '#8a3a5a'); gr.addColorStop(0.62, '#f08a4a'); gr.addColorStop(0.78, '#ffd28a'); gr.addColorStop(1, '#e89a6a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const s = g.createRadialGradient(w * 0.7, h * 0.74, 4, w * 0.7, h * 0.74, 140); s.addColorStop(0, 'rgba(255,250,220,1)'); s.addColorStop(0.3, 'rgba(255,210,140,0.7)'); s.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = s; g.fillRect(0, 0, w, h);
  });
  add(new THREE.PlaneGeometry(30, 40), new THREE.MeshBasicMaterial({ map: sky, fog: false }), [0, 6, -16], { cast: false, recv: false });
  // силуэт старого города
  const cityM = mat('#6a3a3a', { rough: 0.9 });
  for (let i = 0; i < 40; i++) { const x = -5 + i * 0.26 + rnd() * 0.1, z = -6 - rnd() * 4, h = 0.3 + rnd() * 0.5; add(box(0.24, h, 0.24, 0.02), cityM, [x, -0.6 + h / 2, z], { cast: false }); }
  [[-1.6, -7, 0.45], [1.2, -8, 0.6], [2.6, -6.5, 0.35], [-3.0, -8.5, 0.5]].forEach(([x, z, r]) => { add(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), cityM, [x, -0.1, z], { cast: false }); add(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.5, 24), cityM, [x, -0.35, z], { cast: false }); });
  [[-0.9, -7.5], [0.4, -9], [2.0, -7.8], [-2.4, -6.8]].forEach(([x, z]) => { add(new THREE.CylinderGeometry(0.05, 0.07, 1.8, 12), cityM, [x, 0.3, z], { cast: false }); add(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12), cityM, [x, 0.95, z], { cast: false }); add(new THREE.ConeGeometry(0.06, 0.25, 12), cityM, [x, 1.32, z], { cast: false }); });
  // терраса
  floor('#c8a888', { rough: 0.8, d: 3, z: -0.2 });
  const stone = mat('#d8c0a0', { rough: 0.85 });
  add(box(3, 0.05, 0.12, 0.01), stone, [0, 0.52, -0.95]); add(box(3, 0.06, 0.14, 0.01), stone, [0, 0.03, -0.95]);
  for (let i = 0; i < 18; i++) add(lathe([[0.03, 0], [0.045, 0.08], [0.03, 0.2], [0.05, 0.36], [0.03, 0.48], [0, 0.48]], 16), stone, [-1.5 + i * 0.18, 0.04, -0.95]);
  const gen = man('general', { hands: 'hug', frown: -0.2, smile: true }); gen.position.set(-0.17, 0, -0.32); gen.rotation.y = 0.08; root.add(gen);
  const kam = man('kamel', { hands: 'down', smile: true, frown: -0.15 }); kam.position.set(0.18, 0, -0.2); kam.rotation.y = -0.08; root.add(kam);
  hemi('#ffb48a', '#4a2a2a', 0.8);
  const sun = shadowed(new THREE.DirectionalLight('#ffb070', 2.6)); sun.position.set(2.5, 2.0, -5); sun.target.position.set(0, 0.6, 0);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 15 }); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#a0a8e0', 0.9); fill.position.set(-1.5, 1.5, 3); scene.add(fill);
  return {
    cam: { from: [-0.2, 0.95, 1.7], to: [0.18, 0.93, 1.5], lookFrom: [0, 0.55, -1], lookTo: [0, 0.55, -1], fov: 42 },
    focus: [0, 0.85, -0.25], aperture: 0.007, bloom: 0.5,
    update(t) { breathe(gen, t); breathe(kam, t, 1.1); gen.userData.head.rotation.y = 0.35 + Math.sin(t * 1.1) * 0.05; gen.userData.head.rotation.z = Math.sin(t * 3) * 0.03; kam.userData.head.rotation.y = -0.2 + Math.sin(t * 0.7) * 0.06; },
  };
}

// ---------- 7. Ночь: Камель у передатчика, за окном машина с антенной ----------
function radioSet(parent, pos) {
  const g = new THREE.Group(); g.position.set(...pos); parent.add(g);
  add(box(0.42, 0.22, 0.24, 0.015), mat('#3a3e3a', { metal: 0.4, rough: 0.5 }), [0, 0.11, 0], { parent: g });
  add(new THREE.PlaneGeometry(0.38, 0.18), mat('#22261f', { rough: 0.6 }), [0, 0.12, 0.121], { parent: g, cast: false });
  [-0.12, 0, 0.12].forEach((x, i) => add(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 20), mat('#c8c0a8', { metal: 0.6, rough: 0.3 }), [x, 0.07, 0.13], { parent: g, rot: [Math.PI / 2, 0, 0] }));
  const meter = add(new THREE.CircleGeometry(0.035, 24), mat('#c8f0b0', { emissive: '#7aff7a', ei: 1.5 }), [-0.09, 0.16, 0.123], { parent: g, cast: false });
  const led = add(sphere(0.012), mat('#7aff6a', { emissive: '#4aff4a', ei: 4 }), [0.12, 0.17, 0.125], { parent: g, cast: false });
  return { g, meter, led };
}
function morseKey(parent, pos, s = 1) {
  const g = new THREE.Group(); g.position.set(...pos); g.scale.setScalar(s); parent.add(g);
  add(box(0.09, 0.015, 0.16, 0.004), mat('#1a1410', { physical: true, rough: 0.3, clearcoat: 0.8 }), [0, 0.0075, 0], { parent: g });
  add(box(0.02, 0.03, 0.02, 0.003), mat('#b8963a', { metal: 0.9, rough: 0.3 }), [0, 0.03, -0.05], { parent: g });
  const lever = new THREE.Group(); lever.position.set(0, 0.04, -0.05); g.add(lever);
  add(box(0.014, 0.008, 0.13, 0.002), mat('#c8a040', { metal: 0.9, rough: 0.25 }), [0, 0, 0.065], { parent: lever });
  add(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 24), mat('#101010', { physical: true, rough: 0.2, clearcoat: 1 }), [0, 0.01, 0.12], { parent: lever });
  add(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 10), mat('#b8963a', { metal: 0.9, rough: 0.3 }), [0, 0.018, 0.04], { parent: g });
  return lever;
}
const morse = (t) => { const pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0]; const i = Math.floor(t * 7) % pat.length; return pat[i]; };
function radio(T) {
  scene.background = new THREE.Color('#04060c');
  floor('#2a2420', { rough: 0.8 });
  // стена с окном (проём 0.7×0.9 по центру x=0.55, y=1.15)
  const wpm = mat('#ffffff', { map: wallpaper('#262c3a', '#2e3446'), rough: 0.9 });
  add(new THREE.PlaneGeometry(6, 3), wpm, [0, 1.6 + 1.5, -1.5], { cast: false });
  add(new THREE.PlaneGeometry(6, 0.7), wpm, [0, 0.35, -1.5], { cast: false });
  add(new THREE.PlaneGeometry(2.8, 0.9), wpm, [0.2 - 1.4, 1.15, -1.5], { cast: false });
  add(new THREE.PlaneGeometry(2.1, 0.9), wpm, [0.9 + 1.05, 1.15, -1.5], { cast: false });
  add(new THREE.PlaneGeometry(8, 4), mat('#0c1222', { rough: 1 }), [0, 2, -5.5], { cast: false });
  const fr = mat('#4a4038', { rough: 0.7 });
  add(box(0.78, 0.05, 0.08), fr, [0.55, 0.7, -1.48]); add(box(0.78, 0.05, 0.08), fr, [0.55, 1.6, -1.48]); [0.16, 0.55, 0.94].forEach(x => add(box(0.04, 0.9, 0.06), fr, [x, 1.15, -1.48]));
  add(box(0.08, 0.05, 0.02), fr, [0.55, 1.15, -1.48], { scale: [9, 0.6, 1] });
  // улица за окном
  floor('#1a1e26', { z: -4, w: 6, d: 4 });
  const van = new THREE.Group(); van.position.set(0.9, 0.42, -3.6); van.scale.setScalar(1.3); root.add(van);
  add(box(0.9, 0.45, 0.42, 0.08), mat('#4a5a5a', { metal: 0.3, rough: 0.5 }), [0, 0.22, 0], { parent: van });
  add(box(0.3, 0.18, 0.4, 0.05), mat('#9ab0c0', { physical: true, rough: 0.1, clearcoat: 1, emissive: '#203040', ei: 1 }), [0.32, 0.38, 0], { parent: van });
  [[-0.28, 1], [0.28, 1], [-0.28, -1], [0.28, -1]].forEach(([x, s]) => add(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 20), mat('#101010', { rough: 0.8 }), [x, 0.0, s * 0.21], { parent: van, rot: [Math.PI / 2, 0, 0] }));
  const ant = new THREE.Group(); ant.position.set(-0.1, 0.5, 0); van.add(ant);
  add(new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8), mat('#888', { metal: 0.8 }), [0, 0.07, 0], { parent: ant });
  add(new THREE.TorusGeometry(0.09, 0.012, 8, 32), mat('#c8c8c8', { metal: 0.9, rough: 0.3 }), [0, 0.22, 0], { parent: ant });
  const lampPost = new THREE.PointLight('#a8c0ff', 3, 3.5, 1.2); lampPost.position.set(0.5, 1.6, -3.2); scene.add(lampPost);
  add(new THREE.CylinderGeometry(0.02, 0.025, 1.6, 10), mat('#222', {}), [0.2, 0.8, -3.3]); glowSprite([0.3, 1.6, -3.25], '#bcd0ff', 0.5, 0.7);
  // стол, передатчик, Камель в наушниках
  add(box(1.2, 0.05, 0.6, 0.01), mat('#3a2618', { map: woodTex, rough: 0.5 }), [-0.15, 0.5, -0.55]);
  add(box(1.16, 0.48, 0.56, 0.01), mat('#2a1a10', { rough: 0.7 }), [-0.15, 0.25, -0.55]);
  const R = radioSet(root, [-0.42, 0.525, -0.6]);
  morseKey(root, [0.0, 0.525, -0.4]);
  const kam = man('kamel', { robe: '#e8e4da', robe2: '#3a3a40', tie: null, hands: 'desk', frown: 0.45 });
  kam.position.set(0.0, -0.17, -0.95); root.add(kam);
  const hd = kam.userData.head;
  add(new THREE.TorusGeometry(0.165, 0.012, 8, 32, Math.PI), mat('#2a2a2a', { metal: 0.5, rough: 0.4 }), [0, 0.02, -0.01], { parent: hd });
  [-1, 1].forEach(s => add(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 24), mat('#1a1a1a', { rough: 0.4 }), [s * 0.165, 0.0, 0], { parent: hd, rot: [0, 0, Math.PI / 2] }));
  const green = new THREE.PointLight('#5aff7a', 1.6, 1.6, 1.5); green.position.set(-0.3, 0.75, -0.35); scene.add(green);
  hemi('#2a3a6a', '#060404', 0.45);
  const face = new THREE.SpotLight('#ffcf9a', 2.5, 3, 0.5, 0.8, 1.4); face.position.set(0.6, 1.3, 0.3); face.target.position.set(0, 0.8, -0.95); scene.add(face, face.target);
  const moon = shadowed(new THREE.DirectionalLight('#6a8ad0', 1.6)); moon.position.set(1.2, 2.2, -3); moon.target.position.set(-0.1, 0.6, -0.8); scene.add(moon, moon.target);
  const desk = new THREE.PointLight('#ffb070', 1.2, 1.6, 1.6); desk.position.set(-0.7, 0.9, -0.3); scene.add(desk);
  return {
    cam: { from: [0.28, 1.0, 1.1], to: [0.2, 0.97, 0.8], lookFrom: [0.12, 0.62, -1.3], lookTo: [0.12, 0.62, -1.3], fov: 44 },
    focus: [0, 0.8, -0.95], aperture: 0.006, bloom: 0.7,
    update(t) {
      const on = morse(t); R.led.material.emissiveIntensity = on ? 6 : 0.6; green.intensity = on ? 2.0 : 1.2;
      R.meter.material.emissiveIntensity = 1.2 + on * 0.8;
      ant.rotation.y = t * 1.2; hd.rotation.x = 0.1; breathe(kam, t, 1.3);
    },
  };
}

// ---------- 8. Крупно: палец на телеграфном ключе, по стене скользит луч фонаря ----------
function signal(T) {
  scene.background = new THREE.Color('#020306');
  floor('#3a2618', { map: woodTex, rough: 0.45, w: 4, d: 4, z: 0 });
  wall('#1c2230', -0.6, { map: wallpaper('#1c2230', '#222838') });
  const lever = morseKey(root, [0, 0, -0.05], 1.3);
  const arm = new THREE.Group(); root.add(arm);
  const sleeve = mat('#e8e4da', { physical: true, rough: 0.8, sheen: 0.6 }), skin = mat('#dca07a', { physical: true, rough: 0.45, sheen: 0.5, sheenColor: '#ff9f86' });
  limb([0, 0, 0], [0.05, 0.08, 0.45], 0.055, sleeve, arm);
  add(sphere(0.055), skin, [0, 0, -0.05], { parent: arm, scale: [1, 0.55, 1.25] });
  limb([0.0, 0.0, -0.1], [0, -0.03, -0.14], 0.014, skin, arm);
  limb([-0.03, -0.005, -0.08], [-0.035, -0.035, -0.12], 0.012, skin, arm);
  add(sphere(0.012), skin, [0.04, -0.02, -0.06], { parent: arm });
  const drop = add(sphere(0.008, 16, 12), mat('#ffffff', { physical: true, rough: 0.02, clearcoat: 1, opacity: 0.7 }), [0.015, 0.03, -0.03], { parent: arm, scale: [1, 1.3, 1], cast: false });
  const R = radioSet(root, [-0.32, 0, -0.35]); R.g.scale.setScalar(1.1);
  root.updateMatrixWorld(true); const knob = new THREE.Vector3(0, 0.01, 0.12); lever.localToWorld(knob);
  const green = new THREE.PointLight('#5aff7a', 1.0, 1.2, 1.5); green.position.set(-0.25, 0.25, -0.15); scene.add(green);
  const beam = shadowed(new THREE.SpotLight('#e8f0ff', 14, 4, 0.16, 0.5, 1.2), 1024); beam.position.set(1.4, 0.6, 1.2); scene.add(beam, beam.target);
  hemi('#1a2a4a', '#060404', 0.12);
  const key = new THREE.SpotLight('#ffcf9a', 2.0, 2, 0.6, 0.8, 1.4); key.position.set(-0.4, 0.6, 0.4); key.target.position.set(0, 0.05, -0.05); scene.add(key, key.target);
  return {
    cam: { from: [0.34, 0.34, 0.62], to: [0.26, 0.28, 0.5], lookFrom: [-0.04, 0.02, -0.12], lookTo: [-0.04, 0.0, -0.12], fov: 40 },
    focus: [0, 0.07, 0.06], aperture: 0.04, bloom: 0.6, env: 0.05,
    update(t) {
      const on = morse(t); lever.rotation.x = on ? 0.06 : 0;
      arm.position.set(knob.x + 0.005, knob.y + 0.055 - on * 0.01, knob.z + 0.11); arm.rotation.x = -0.25;
      R.led.material.emissiveIntensity = on ? 6 : 0.5; green.intensity = on ? 1.4 : 0.7;
      const u = t / T; beam.target.position.set(1.1 - u * 2.6, 0.35, -0.6);
      drop.position.y = 0.03 - ease(u) * 0.02;
    },
  };
}

// ---------- 9. Фото-стикеры: Борат и Камель под лучом прожектора ----------
const loadTex = (f) => new THREE.TextureLoader().loadAsync(`/public/assets/the-spy/${f}`).then(t => { t.colorSpace = THREE.SRGBColorSpace; return t; }).catch(() => null);
const STK = { borat: await loadTex('borat-cut.png'), spy: await loadTex('spy-cut.png') };
// at — секунда появления от начала плана: AUDIO_DELAY (4 кадра) + время слова («Бората» 1,49 с, «Золотой» 4,66 с)
const STICKERS = [
  { k: 'borat', x: -0.15, y: 0.83, h: 0.5, at: 4 / 30 + 1.49, tilt: -0.07, z: 0.3 },
  { k: 'spy', x: 0.15, y: 0.62, h: 0.48, at: 4 / 30 + 4.66, tilt: 0.05, z: 0.4 },
];
function stickers(T) {
  scene.background = new THREE.Color('#0a0408');
  const velvet = canvasTex(512, 512, (g, w, h) => { for (let x = 0; x < w; x++) { const v = 0.55 + 0.45 * Math.sin(x / w * Math.PI * 14) ** 2; g.fillStyle = `rgb(${Math.round(110 * v)},${Math.round(18 * v)},${Math.round(26 * v)})`; g.fillRect(x, 0, 1, h); } }, [2, 1]);
  wall('#ffffff', -0.8, { map: velvet });
  floor('#1a1012', { rough: 0.3, cc: 0.8 });
  const spot = shadowed(new THREE.SpotLight('#ffe2b8', 12, 5, 0.42, 0.5, 1.2)); spot.position.set(0, 2.4, -0.2); spot.target.position.set(0, 0, -0.2); scene.add(spot, spot.target);
  hemi('#3a1a2a', '#0a0406', 0.3);
  const cards = STICKERS.map(s => {
    const tx = STK[s.k]; const asp = tx ? tx.image.width / tx.image.height : 0.7;
    const m = add(new THREE.PlaneGeometry(s.h * asp, s.h), new THREE.MeshBasicMaterial({ map: tx, transparent: true, toneMapped: false, depthWrite: false }), [s.x, s.y, s.z], { cast: false, recv: false });
    m.visible = false; return { s, m };
  });
  return {
    cam: { from: [0, 0.88, 2.25], to: [0, 0.86, 2.05], lookFrom: [0, 0.86, 0], lookTo: [0, 0.86, 0], fov: 40 },
    focus: [0, 0.8, 0.35], aperture: 0.002, bloom: 0.4,
    update(t) {
      cards.forEach(({ s, m }, i) => {
        const dt = t - s.at; m.visible = dt >= 0;
        if (dt < 0) return;
        const f = dt * 30, pop = f < 6 ? 0.2 + 0.92 * f / 6 : f < 10 ? 1.12 - 0.16 * (f - 6) / 4 : f < 14 ? 0.96 + 0.04 * (f - 10) / 4 : 1;
        m.scale.setScalar(pop); m.material.opacity = Math.min(1, f / 3);
        m.rotation.z = s.tilt + Math.sin(t * 2.2 + i * 2) * 0.04; m.position.y = s.y + Math.sin(t * 1.6 + i * 1.3) * 0.012;
      });
    },
  };
}

// ---------- 10. Зеркало: Камель снимает галстук, в отражении — Эли ----------
function mirror(T) {
  scene.background = new THREE.Color('#0a0806');
  floor('#3a2618', { map: woodTex, rough: 0.5 });
  // стена с проёмом-зеркалом (за ним — «отражённая» комната)
  const wp = wallpaper('#4a3428', '#56402e'), wm = mat('#ffffff', { map: wp, rough: 0.9 });
  const MW = 0.62, MH = 0.86, MY = 0.98, WZ = -0.95;
  add(new THREE.PlaneGeometry(5, 5), wm, [0, MY + MH / 2 + 2.5, WZ], { cast: false });
  add(new THREE.PlaneGeometry(5, MY - MH / 2), wm, [0, (MY - MH / 2) / 2, WZ], { cast: false });
  add(new THREE.PlaneGeometry(2.5 - MW / 2, MH), wm, [-(MW / 2 + (2.5 - MW / 2) / 2), MY, WZ], { cast: false });
  add(new THREE.PlaneGeometry(2.5 - MW / 2, MH), wm, [MW / 2 + (2.5 - MW / 2) / 2, MY, WZ], { cast: false });
  const gold = mat('#c9a24a', { metal: 0.9, rough: 0.3 });
  add(box(MW + 0.1, 0.05, 0.05, 0.015), gold, [0, MY + MH / 2 + 0.02, WZ + 0.02]); add(box(MW + 0.1, 0.05, 0.05, 0.015), gold, [0, MY - MH / 2 - 0.02, WZ + 0.02]);
  [-1, 1].forEach(s => add(box(0.05, MH + 0.1, 0.05, 0.015), gold, [s * (MW / 2 + 0.02), MY, WZ + 0.02]));
  add(sphere(0.04), gold, [0, MY + MH / 2 + 0.07, WZ + 0.02], { scale: [1.6, 1, 0.6] });
  add(new THREE.PlaneGeometry(MW, MH), new THREE.MeshPhysicalMaterial({ color: '#cfd8e0', roughness: 0.05, transparent: true, opacity: 0.08, clearcoat: 1 }), [0, MY, WZ], { cast: false, recv: false });
  // отражённая комната
  const mz = WZ * 2;
  add(new THREE.PlaneGeometry(4, 4), mat('#ffffff', { map: wp, rough: 0.9 }), [0, 2, mz - 0.8], { cast: false });
  add(new THREE.PlaneGeometry(4, 3), mat('#3a2618', { map: woodTex, rough: 0.5 }), [0, 0, mz], { rot: [-Math.PI / 2, 0, 0], cast: false });
  const eli = man('eli', { hands: 'collar', frown: 0.3 }); eli.position.set(0.04, 0, mz + 0.45); root.add(eli);
  const mL = new THREE.PointLight('#ffc890', 2.0, 2.5, 1.4); mL.position.set(0.5, 1.4, mz + 0.9); scene.add(mL);
  // столик с лампой и Камель спиной к нам
  add(box(0.9, 0.04, 0.35, 0.01), mat('#4a2e1c', { map: woodTex, physical: true, rough: 0.35, clearcoat: 0.5 }), [0, 0.52, -0.75]);
  add(box(0.86, 0.5, 0.3, 0.01), mat('#3a2416', { map: woodTex, rough: 0.6 }), [0, 0.25, -0.77]);
  add(new THREE.CylinderGeometry(0.008, 0.012, 0.12, 12), mat('#e8e0d0', { rough: 0.4 }), [0.32, 0.6, -0.75]);
  const kam = man('kamel', { hands: 'collar', frown: 0.3 }); kam.position.set(-0.24, 0, -0.4); kam.rotation.y = Math.PI; root.add(kam);
  const lamp = shadowed(new THREE.PointLight('#ffb070', 3.0, 3, 1.4), 1024); lamp.position.set(-0.45, 1.3, -0.3); scene.add(lamp);
  glowSprite([-0.42, 0.7, -0.75], '#ffb060', 0.4, 0.5);
  add(new THREE.CylinderGeometry(0.06, 0.09, 0.14, 24, 1, true), mat('#f0d8b0', { emissive: '#ffb060', ei: 1.5, side: THREE.DoubleSide }), [-0.42, 0.7, -0.75], { cast: false });
  hemi('#3a3050', '#1a0c06', 0.3);
  const rim = new THREE.DirectionalLight('#7a9ad8', 0.9); rim.position.set(1, 2, 2); scene.add(rim);
  return {
    cam: { from: [0.32, 1.12, 1.3], to: [0.24, 1.08, 0.95], lookFrom: [0.0, 0.72, -1.6], lookTo: [0.0, 0.7, -1.6], fov: 40 },
    focus: [0, 0.95, mz + 0.42], aperture: 0.005, bloom: 0.45,
    update(t) { breathe(kam, t); breathe(eli, t); kam.userData.head.rotation.x = 0.06; eli.userData.head.rotation.x = 0.06 + Math.sin(t * 0.6) * 0.02; mL.intensity = 2.0 + 0.1 * Math.sin(t); },
  };
}

run({ banquet, shop, briefing, farewell, 'buenos-aires': buenosAires, embrace, radio, signal, stickers, mirror }[SHOT]);
