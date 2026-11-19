// Procedural canvas textures: facades, asphalt, plates, signs, sky, water.
// All art is generated here at runtime — no borrowed images, no network.
import * as THREE from 'three';
import { makeRng, range, rangeInt, pick } from './random.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, repeat) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// Golden-hour equirect sky: mauve top, pink band, burnt-orange horizon, low sun glow.
export function makeSkyTexture() {
  const [c, g] = canvas(1024, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#6d4f80');
  grad.addColorStop(0.32, '#985fa2');
  grad.addColorStop(0.52, '#c8758a');
  grad.addColorStop(0.66, '#e77f25');
  grad.addColorStop(0.74, '#f2a54a');
  grad.addColorStop(0.78, '#8a6a52');
  grad.addColorStop(1.0, '#5c4638');
  g.fillStyle = grad; g.fillRect(0, 0, 1024, 512);
  // low sun glow, slightly west of centre
  const sun = g.createRadialGradient(430, 350, 4, 430, 350, 150);
  sun.addColorStop(0, 'rgba(255,226,170,0.95)');
  sun.addColorStop(0.25, 'rgba(255,178,96,0.55)');
  sun.addColorStop(1, 'rgba(255,158,74,0)');
  g.fillStyle = sun; g.fillRect(0, 0, 1024, 512);
  // thin warm clouds
  const rng = makeRng(77);
  for (let i = 0; i < 26; i++) {
    const y = 120 + rng() * 180, x = rng() * 1024, w = 90 + rng() * 220;
    const cg = g.createLinearGradient(x, y, x + w, y);
    cg.addColorStop(0, 'rgba(255,190,160,0)');
    cg.addColorStop(0.5, `rgba(255,190,160,${0.10 + rng() * 0.14})`);
    cg.addColorStop(1, 'rgba(255,190,160,0)');
    g.fillStyle = cg;
    g.fillRect(x, y, w, 5 + rng() * 7);
  }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Building facade: warm base, window grid (some windows lit amber), ground-floor
// shop front with a sign, subtle grime. Returns a texture sized for one face.
export function makeFacadeTexture(seed, opts = {}) {
  const rng = makeRng(seed);
  const base = opts.base || '#e8ddd2';
  const floors = opts.floors || rangeInt(rng, 3, 7);
  const cols = opts.cols || rangeInt(rng, 4, 7);
  const [c, g] = canvas(256, 256);
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  // tonal variation per floor band
  for (let f = 0; f < floors; f++) {
    g.fillStyle = `rgba(120,90,60,${0.03 + rng() * 0.05})`;
    g.fillRect(0, (256 / floors) * f, 256, 256 / floors);
  }
  // window grid
  const ww = 256 / cols, wh = 256 / floors;
  for (let f = 0; f < floors; f++) {
    for (let col = 0; col < cols; col++) {
      const x = col * ww + ww * 0.22, y = f * wh + wh * 0.24;
      const w = ww * 0.56, h = wh * 0.52;
      const lit = rng() < 0.42;
      g.fillStyle = '#3a2f2a'; g.fillRect(x - 2, y - 2, w + 4, h + 4);
      if (lit) {
        const lg = g.createLinearGradient(x, y, x, y + h);
        lg.addColorStop(0, '#ffd98a'); lg.addColorStop(1, '#e89a4a');
        g.fillStyle = lg;
      } else {
        g.fillStyle = rng() < 0.5 ? '#4a5560' : '#5d6a72';
      }
      g.fillRect(x, y, w, h);
      // window cross frame
      g.fillStyle = 'rgba(40,30,25,0.55)';
      g.fillRect(x + w / 2 - 1, y, 2, h);
      g.fillRect(x, y + h / 2 - 1, w, 2);
      // occasional balcony slab under a window
      if (rng() < 0.22 && f > 0) {
        g.fillStyle = 'rgba(60,45,38,0.85)';
        g.fillRect(x - 4, y + h + 2, w + 8, 5);
      }
    }
  }
  // ground-floor shop front
  g.fillStyle = '#2e2620'; g.fillRect(0, 256 - 34, 256, 34);
  g.fillStyle = '#7a5a40'; g.fillRect(0, 256 - 36, 256, 3);
  if (opts.sign) {
    g.fillStyle = opts.signBg || '#20303a';
    g.fillRect(8, 256 - 30, 240, 22);
    g.fillStyle = opts.signFg || '#ffd98a';
    g.font = 'bold 13px Georgia, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(opts.sign, 128, 256 - 19);
  } else {
    g.fillStyle = '#c9a06a';
    for (let x = 10; x < 250; x += 26) g.fillRect(x, 256 - 28, 16, 22);
  }
  return tex(c);
}

// Asphalt with tonal patches, cracks, stains and a faint centre wear band.
// Lane markings are geometry, not texture, so they stay crisp.
export function makeRoadTexture(seed) {
  const rng = makeRng(seed);
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#6f6156'; g.fillRect(0, 0, 512, 512);
  // large tonal patches — the road is NOT one flat orange
  for (let i = 0; i < 60; i++) {
    const x = rng() * 512, y = rng() * 512, r = 20 + rng() * 70;
    const tones = ['#7d6e61', '#5d4f45', '#857468', '#66584d', '#77685c'];
    g.fillStyle = pick(rng, tones);
    g.globalAlpha = 0.10 + rng() * 0.16;
    g.beginPath(); g.ellipse(x, y, r, r * (0.4 + rng() * 0.6), rng() * 3, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  // cracks
  g.strokeStyle = 'rgba(40,32,26,0.5)'; g.lineWidth = 1.2;
  for (let i = 0; i < 22; i++) {
    let x = rng() * 512, y = rng() * 512;
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 5; s++) { x += range(rng, -28, 28); y += range(rng, -28, 28); g.lineTo(x, y); }
    g.stroke();
  }
  // speckle
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = rng() < 0.5 ? 'rgba(30,24,20,0.25)' : 'rgba(210,190,170,0.18)';
    g.fillRect(rng() * 512, rng() * 512, 1.6, 1.6);
  }
  // damp darker band (old rain) along one side
  g.fillStyle = 'rgba(52,44,40,0.28)';
  g.fillRect(0, 380, 512, 60);
  return tex(c, [4, 4]);
}

export function makeSidewalkTexture(seed) {
  const rng = makeRng(seed);
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#b39a80'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(90,70,55,0.6)'; g.lineWidth = 2;
  for (let y = 0; y <= 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  for (let x = 0; x <= 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = rng() < 0.5 ? 'rgba(80,60,45,0.2)' : 'rgba(230,210,190,0.2)';
    g.fillRect(rng() * 256, rng() * 256, 2, 2);
  }
  return tex(c, [6, 6]);
}

// Licence plate, e.g. "BNH·4821".
export function makePlateTexture(text) {
  const [c, g] = canvas(128, 32);
  g.fillStyle = '#f2ede4'; g.fillRect(0, 0, 128, 32);
  g.strokeStyle = '#2a2a2a'; g.lineWidth = 3; g.strokeRect(1, 1, 126, 30);
  g.fillStyle = '#1c2733'; g.font = 'bold 20px monospace';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 64, 17);
  return tex(c);
}

// Shop / garage sign board.
export function makeSignTexture(text, bg, fg, sub) {
  const [c, g] = canvas(512, 128);
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(6, 6, 500, 116);
  g.fillStyle = fg; g.font = 'bold 44px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, sub ? 52 : 64);
  if (sub) {
    g.font = '18px Georgia, serif'; g.fillStyle = fg;
    g.fillText(sub, 256, 96);
  }
  return tex(c);
}

// Subtle noise used as a moving map on the water surface.
export function makeWaterTexture(seed) {
  const rng = makeRng(seed);
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#2e6f7e'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 340; i++) {
    g.strokeStyle = `rgba(190,230,235,${0.05 + rng() * 0.12})`;
    g.lineWidth = 1 + rng() * 2;
    const x = rng() * 256, y = rng() * 256, len = 12 + rng() * 42;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + range(rng, -4, 4)); g.stroke();
  }
  return tex(c, [10, 10]);
}

// Dark brick for the garage interior.
export function makeBrickTexture(seed) {
  const rng = makeRng(seed);
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#4a3630'; g.fillRect(0, 0, 256, 256);
  const bh = 16, bw = 42;
  for (let y = 0; y < 256; y += bh) {
    const off = (y / bh) % 2 ? bw / 2 : 0;
    for (let x = -bw; x < 256 + bw; x += bw) {
      const tone = 58 + rng() * 26;
      g.fillStyle = `rgb(${tone + 18},${tone * 0.72 | 0},${tone * 0.6 | 0})`;
      g.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
    }
  }
  return tex(c, [4, 2]);
}

// Oily concrete floor for the garage.
export function makeConcreteTexture(seed) {
  const rng = makeRng(seed);
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#5a5650'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(30,28,26,${0.08 + rng() * 0.18})`;
    g.beginPath(); g.ellipse(rng() * 256, rng() * 256, 12 + rng() * 40, 8 + rng() * 26, rng() * 3, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 1200; i++) {
    g.fillStyle = rng() < 0.5 ? 'rgba(20,18,16,0.25)' : 'rgba(200,190,180,0.15)';
    g.fillRect(rng() * 256, rng() * 256, 1.5, 1.5);
  }
  return tex(c, [3, 3]);
}
