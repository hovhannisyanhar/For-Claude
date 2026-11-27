// Лист проверки рига (scenes2d/rig.js): выражения, повороты, руки. Не ролик.
import { run, grad } from './core.js';
import { figure, head } from './rig.js';
const N = { skin: '#e2b08a', hair: '#2a1e18', hairStyle: 'curly', shirt: '#d8443a', pants: '#2a6a8a', collar: 'open', sleeves: 'short', stubble: true };
const S = { skin: '#f0c6a6', hair: '#3a2418', hairStyle: 'bob', shirt: '#d9789a', pants: '#d9789a', collar: 'round', earrings: '#f0c850', lips: '#c0505a' };
run({
  sheet(t) {
    const els = [`<rect width="1080" height="1920" fill="${grad([[0, '#9ad4f4'], [1, '#f4e0c8']])}"/>`];
    const row = [['neutral', 0], ['smirk', 0.4], ['think', -0.4]];
    row.forEach(([e, tu], i) => els.push(figure(200 + i * 340, 900, 0.68, { ...N, expr: e, turn: tu, hands: i === 1 ? { r: { x: 200 + i * 340 + 120, y: 420, pose: 'hold' } } : i === 2 ? { l: { x: 200 + i * 340 - 40, y: 470, pose: 'point' } } : undefined })));
    const row2 = [['surprised', 0.3], ['angry', -0.2], ['laugh', 0]];
    row2.forEach(([e, tu], i) => els.push(figure(200 + i * 340, 1820, 0.68, { ...S, expr: e, turn: tu, hands: i === 2 ? { l: { x: 80 + i * 340 - 40, y: 1250, pose: 'wave' }, r: { x: 320 + i * 340, y: 1250, pose: 'wave' } } : undefined })));
    return { els };
  },
  faces(t) {
    const els = [`<rect width="1080" height="1920" fill="#cfe4ee"/>`];
    const ex = ['neutral', 'smirk', 'tired', 'think', 'smile', 'grin', 'surprised', 'angry', 'sad', 'laugh'];
    ex.forEach((e, i) => { const c = i % 3, r = Math.floor(i / 3); els.push(head(190 + c * 350, 260 + r * 450, 120, { ...(i % 2 ? S : N), expr: e, turn: [-0.5, 0, 0.5][c] })); });
    return { els };
  },
});
