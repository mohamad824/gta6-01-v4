// Brinehaven island: street grid, facades, palms, lamps, water, mudflats.
// The same street list feeds the 3D roads, the minimap and the full map.
import * as THREE from 'three';
import { STREETS, SHOP_SIGNS, PALETTE } from './config.js';
import { makeRng, pick, range, rangeInt } from './random.js';
import {
  makeFacadeTexture, makeRoadTexture, makeSidewalkTexture, makeWaterTexture,
} from './textures.js';

const BUILDING_COLORS = ['#ebe3dc', '#d9b48f', '#c98f6a', '#b7c4c9', '#e5c9a8', '#d8c3b0'];
const LAMP_COLOR = 0xffc27a;

export function buildCity(scene, seed = 1, opts = {}) {
  const rng = makeRng(seed);
  const group = new THREE.Group();
  group.name = 'brinehaven-city';
  const streetSegments = []; // {x1,z1,x2,z2} for minimap + full map
  const driftGlass = [];
  const tideHigh = opts.tideHigh !== false;

  // --- ground: island base, then sea around it ---
  const islandMat = new THREE.MeshStandardMaterial({ color: 0x8f7d63, roughness: 1 });
  const island = new THREE.Mesh(new THREE.PlaneGeometry(430, 310), islandMat);
  island.rotation.x = -Math.PI / 2; island.position.set(0, -0.05, 0);
  island.receiveShadow = true; group.add(island);

  const seaTex = makeWaterTexture(11);
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(2400, 2400),
    new THREE.MeshStandardMaterial({
      color: 0x2e6f7e, roughness: 0.18, metalness: 0.55,
      map: seaTex, transparent: true, opacity: 0.94, envMapIntensity: 1.4,
    }),
  );
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.55; sea.name = 'sea';
  group.add(sea);

  // --- roads: asphalt planes + sidewalks + lane markings + wet patches ---
  const roadTex = makeRoadTexture(5);
  const walkTex = makeSidewalkTexture(6);
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85, metalness: 0.05 });
  const walkMat = new THREE.MeshStandardMaterial({ map: walkTex, roughness: 0.9, metalness: 0.02 });
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xd8cdb8, roughness: 0.7 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xc9b060, roughness: 0.7 });
  const wetMat = new THREE.MeshStandardMaterial({
    color: 0x3d332c, roughness: 0.06, metalness: 0.75, envMapIntensity: 1.8,
  });

  function roadStrip(x1, z1, x2, z2, width) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const horizontal = Math.abs(z2 - z1) < 0.01;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(len, width), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
    if (!horizontal) road.rotation.z = Math.PI / 2;
    road.receiveShadow = true; group.add(road);
    // sidewalks both sides
    for (const s of [-1, 1]) {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(len, 3.2), walkMat);
      sw.rotation.x = -Math.PI / 2;
      const off = width / 2 + 1.6;
      sw.position.set(
        (x1 + x2) / 2 + (horizontal ? 0 : s * off),
        0.06,
        (z1 + z2) / 2 + (horizontal ? s * off : 0),
      );
      if (!horizontal) sw.rotation.z = Math.PI / 2;
      sw.receiveShadow = true; group.add(sw);
    }
    // centre dashes (amber, worn) — one dashed line down the middle
    const dashLen = 3, gap = 4.5, n = Math.floor(len / (dashLen + gap));
    for (let i = 0; i < n; i++) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(dashLen, 0.28), dashMat);
      d.rotation.x = -Math.PI / 2;
      const t = (i + 0.5) * (dashLen + gap) - len / 2;
      if (horizontal) { d.position.set((x1 + x2) / 2 + t, 0.045, (z1 + z2) / 2); }
      else { d.rotation.z = Math.PI / 2; d.position.set((x1 + x2) / 2, 0.045, (z1 + z2) / 2 + t); }
      group.add(d);
    }
    // wet reflective patches — darker, glossy, catching the sky
    for (let i = 0; i < 3; i++) {
      const w = range(rng, 4, 9), l = range(rng, 6, 14);
      const wet = new THREE.Mesh(new THREE.PlaneGeometry(l, w), wetMat);
      wet.rotation.x = -Math.PI / 2;
      const t = range(rng, -len / 2 + 8, len / 2 - 8);
      const lat = range(rng, -width / 2 + 2, width / 2 - 2);
      if (horizontal) wet.position.set((x1 + x2) / 2 + t, 0.05, (z1 + z2) / 2 + lat);
      else wet.position.set((x1 + x2) / 2 + lat, 0.05, (z1 + z2) / 2 + t);
      group.add(wet);
    }
    streetSegments.push({ x1, z1, x2, z2 });
  }

  for (const z of STREETS.avenues) roadStrip(STREETS.avenueSpan[0], z, STREETS.avenueSpan[1], z, STREETS.roadWidth);
  for (const x of STREETS.streets) roadStrip(x, STREETS.streetSpan[0], x, STREETS.streetSpan[1], STREETS.roadWidth);

  // --- the causeway: a low road out over the water, south of the island ---
  const cw = STREETS.causeway;
  const cwRoad = new THREE.Mesh(new THREE.PlaneGeometry(cw.z1 - cw.z0, cw.width), roadMat);
  cwRoad.rotation.x = -Math.PI / 2; cwRoad.rotation.z = Math.PI / 2;
  cwRoad.position.set(cw.x, 0.35, (cw.z0 + cw.z1) / 2);
  cwRoad.receiveShadow = true; group.add(cwRoad);
  // causeway side barriers
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0x9a8a76, roughness: 0.8 });
  for (const s of [-1, 1]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, cw.z1 - cw.z0), barrierMat);
    bar.position.set(cw.x + s * (cw.width / 2 + 0.4), 0.8, (cw.z0 + cw.z1) / 2);
    bar.castShadow = true; group.add(bar);
  }
  streetSegments.push({ x1: cw.x, z1: cw.z0, x2: cw.x, z2: cw.z1 });
  // causeway lamps
  for (let z = cw.z0 + 12; z < cw.z1; z += 24) {
    group.add(makeLamp(z % 48 === 0 ? -1 : 1, z, 4.6));
  }

  // --- flood water over the causeway at high tide; mudflat at low tide ---
  const flood = new THREE.Mesh(
    new THREE.PlaneGeometry(cw.width + 2, cw.z1 - cw.z0),
    new THREE.MeshStandardMaterial({
      color: 0x3a7d8c, roughness: 0.08, metalness: 0.7, transparent: true, opacity: 0.82,
      map: seaTex, envMapIntensity: 1.8,
    }),
  );
  flood.rotation.x = -Math.PI / 2; flood.rotation.z = Math.PI / 2;
  flood.position.set(cw.x, 0.42, (cw.z0 + cw.z1) / 2);
  flood.name = 'causeway-flood'; flood.visible = tideHigh; group.add(flood);

  // mudflat shortcut along the east shore, exposed at low tide
  const mud = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 190),
    new THREE.MeshStandardMaterial({ color: 0xb98d5f, roughness: 0.95, metalness: 0 }),
  );
  mud.rotation.x = -Math.PI / 2; mud.position.set(218, -0.3, 0);
  mud.name = 'mudflat'; mud.visible = !tideHigh; group.add(mud);
  // puddles on the mudflat
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(
      new THREE.CircleGeometry(range(rng, 2, 5), 18),
      new THREE.MeshStandardMaterial({ color: 0x4a7d8c, roughness: 0.1, metalness: 0.6, envMapIntensity: 1.5 }),
    );
    p.rotation.x = -Math.PI / 2; p.position.set(range(rng, 208, 228), -0.25, range(rng, -85, 85));
    p.visible = !tideHigh; group.add(p);
  }

  // --- buildings: blocks between the streets, varied heights and facades ---
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 1 });
  const signIdx = { i: 0 };
  function building(x, z, w, d, h, base, sign) {
    const facade = makeFacadeTexture(rangeInt(rng, 1, 99999), {
      base, floors: Math.max(2, Math.round(h / 4.2)), cols: Math.max(3, Math.round(w / 5)),
      sign, signBg: '#20303a', signFg: '#ffd98a',
    });
    const mats = [facade, facade, roofMat, roofMat, facade, facade].map((m) =>
      m instanceof THREE.Texture
        ? new THREE.MeshStandardMaterial({ map: m, roughness: 0.9 })
        : m);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    b.position.set(x, h / 2, z);
    b.castShadow = true; b.receiveShadow = true;
    group.add(b);
    // rooftop plant: AC box + water tank on taller blocks
    if (h > 16 && rng() < 0.7) {
      const ac = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x8a8f94, roughness: 0.7, metalness: 0.5 }));
      ac.position.set(x + w * 0.2, h + 0.55, z); ac.castShadow = true; group.add(ac);
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.4, 10),
        new THREE.MeshStandardMaterial({ color: 0x7a6a58, roughness: 0.9 }));
      tank.position.set(x - w * 0.25, h + 1.2, z + d * 0.2); tank.castShadow = true; group.add(tank);
    }
    // balconies on the avenue face for mid-rise blocks
    if (h > 10 && rng() < 0.55) {
      const bal = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 0.25, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x6a5a4c, roughness: 0.9 }));
      bal.position.set(x, h * 0.55, z + d / 2 + 0.6); bal.castShadow = true; group.add(bal);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 0.9, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x3a3230, roughness: 0.6, metalness: 0.6 }));
      rail.position.set(x, h * 0.55 + 0.55, z + d / 2 + 1.25); group.add(rail);
    }
    return b;
  }

  const xs = STREETS.streets, zs = STREETS.avenues;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < zs.length - 1; j++) {
      const x0 = xs[i] + 11, x1 = xs[i + 1] - 11;
      const z0 = zs[j] + 11, z1 = zs[j + 1] - 11;
      const bw = x1 - x0, bd = z1 - z0;
      if (bw < 14 || bd < 14) continue;
      // Low Quay waterfront block becomes a small plaza, not a building wall
      if (i === xs.length - 2 && j === 1) continue;
      const sign = SHOP_SIGNS[signIdx.i++ % SHOP_SIGNS.length];
      const tall = rng() < 0.3;
      if (bw > 34 && rng() < 0.6) {
        building(x0 + bw * 0.25, (z0 + z1) / 2, bw * 0.42, bd * 0.8,
          range(rng, 10, tall ? 46 : 24), pick(rng, BUILDING_COLORS), sign);
        building(x0 + bw * 0.75, (z0 + z1) / 2, bw * 0.42, bd * 0.8,
          range(rng, 9, tall ? 38 : 20), pick(rng, BUILDING_COLORS), null);
      } else {
        building((x0 + x1) / 2, (z0 + z1) / 2, bw * 0.86, bd * 0.82,
          range(rng, 9, tall ? 48 : 26), pick(rng, BUILDING_COLORS), rng() < 0.7 ? sign : null);
      }
    }
  }

  // --- Low Quay pier + moored boats on the east shore ---
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x6a5138, roughness: 0.95 });
  const pier = new THREE.Mesh(new THREE.BoxGeometry(34, 0.5, 10), pierMat);
  pier.position.set(222, -0.1, -30); pier.castShadow = true; pier.receiveShadow = true; group.add(pier);
  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.4, 8), pierMat);
    post.position.set(210 + i * 9, 0.4, -25); group.add(post);
  }

  // --- palms along the main boulevard (z = 0) and the quay ---
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a6248, roughness: 1 });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 0.9, side: THREE.DoubleSide });
  const frondGeo = new THREE.PlaneGeometry(3.4, 0.9);
  function palm(x, z, h = 7) {
    const p = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, h, 7), trunkMat);
    trunk.position.y = h / 2; trunk.castShadow = true; p.add(trunk);
    // fronds: each in its own yawed holder, drooping outward-down from the crown
    for (let i = 0; i < 6; i++) {
      const holder = new THREE.Group();
      holder.position.y = h + 0.1;
      holder.rotation.y = (i / 6) * Math.PI * 2;
      const f = new THREE.Mesh(frondGeo, frondMat);
      f.position.set(1.5, -0.25, 0);
      f.rotation.z = -0.62; // droop
      f.castShadow = true;
      holder.add(f); p.add(holder);
    }
    // second, steeper layer for a full crown
    for (let i = 0; i < 4; i++) {
      const holder = new THREE.Group();
      holder.position.y = h + 0.35;
      holder.rotation.y = (i / 4) * Math.PI * 2 + 0.4;
      const f = new THREE.Mesh(frondGeo, frondMat);
      f.scale.set(0.8, 0.8, 1);
      f.position.set(1.15, -0.45, 0);
      f.rotation.z = -1.0;
      f.castShadow = true;
      holder.add(f); p.add(holder);
    }
    p.position.set(x, 0, z);
    return p;
  }
  for (let x = -190; x <= 190; x += 19) {
    group.add(palm(x, -9.5, range(rng, 6, 8.5)));
    if (rng() < 0.85) group.add(palm(x + 9, 9.5, range(rng, 6, 8)));
  }
  for (let z = -110; z <= 110; z += 24) group.add(palm(196, z, range(rng, 6, 8)));

  // --- street lamps along the boulevard ---
  function makeLamp(x, z, h = 5.4) {
    const g = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2e2a28, roughness: 0.6, metalness: 0.6 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, h, 8), poleMat);
    pole.position.y = h / 2; pole.castShadow = true; g.add(pole);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), poleMat);
    arm.rotation.z = Math.PI / 2; arm.position.set(x >= 0 ? -0.7 : 0.7, h, 0); g.add(arm);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: LAMP_COLOR, emissiveIntensity: 2.2 }));
    lamp.position.set(x >= 0 ? -1.4 : 1.4, h - 0.1, 0); g.add(lamp);
    g.position.set(x, 0, z);
    return g;
  }
  for (let x = -180; x <= 180; x += 36) {
    group.add(makeLamp(x, -9.2));
    group.add(makeLamp(x + 18, 9.2));
  }

  // --- Drift Glass pickups: small glowing shards SITTING ON the road surface ---
  const shardGeo = new THREE.OctahedronGeometry(0.55);
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0x9fe8d8, emissive: 0x4fd8c0, emissiveIntensity: 1.4, roughness: 0.15, metalness: 0.2,
  });
  const ringGeo = new THREE.RingGeometry(0.7, 1.0, 20);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x7fe8d8, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const shardSpots = [
    [18, -3.2], [42, 3.4], [-58, -3.4], [88, 3.2], [-120, 3.4], [150, -3.2],
    [6, -63], [-84, 63], [96, -63],
  ];
  for (const [x, z] of shardSpots) {
    const s = new THREE.Mesh(shardGeo, shardMat);
    s.scale.y = 0.45; // squat, resting on the asphalt
    s.position.set(x, 0.28, z); s.rotation.y = rng() * Math.PI;
    group.add(s);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.07, z); group.add(ring);
    driftGlass.push(s);
  }

  // --- a few street props: bins, crates, a bench near the quay ---
  const propMat = new THREE.MeshStandardMaterial({ color: 0x4a5a52, roughness: 0.9 });
  for (let i = 0; i < 10; i++) {
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 1.0, 10), propMat);
    bin.position.set(range(rng, -190, 190), 0.5, pick(rng, [-9.8, 9.8]));
    bin.castShadow = true; group.add(bin);
  }

  scene.add(group);
  return { group, streetSegments, driftGlass, flood, mud, seaTex };
}
