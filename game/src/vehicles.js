// Cars with real proportions and detail: wheel arches, glasshouse, lights,
// mirrors, plates, bumpers, reflections. No flat boxes with a dark rear.
import * as THREE from 'three';
import { makePlateTexture } from './textures.js';

const PLATES = ['BNH·4821', 'BNH·3097', 'BNH·7740', 'BNH·1185', 'BNH·5523', 'BNH·9064', 'BNH·2210'];

function std(color, roughness = 0.35, metalness = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 1.3 });
}

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true;
  return m;
}

// A wheel with a dark tyre, light alloy hub and a dark arch behind it.
function makeWheel(r = 0.36) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.24, 18),
    new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.9 }));
  tyre.rotation.z = Math.PI / 2; tyre.castShadow = true; g.add(tyre);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.26, 12),
    new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.3, metalness: 0.9 }));
  hub.rotation.z = Math.PI / 2; g.add(hub);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.28, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.4, metalness: 0.7 }));
  cap.rotation.z = Math.PI / 2; g.add(cap);
  return g;
}

// Dark arch liner behind each wheel so the wheel sits in a real arch.
function makeArch(r = 0.46) {
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, 0.3, 14, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.95 }),
  );
  arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2;
  return arch;
}

export function buildCar(opts = {}) {
  const {
    color = 0xff8d4c, kind = 'sedan', plate = 'BNH·4821', police = false, length = 4.5,
  } = opts;
  const car = new THREE.Group();
  car.name = opts.name || 'car';
  const W = 1.9, L = length;
  const paint = std(color, kind === 'sport' ? 0.22 : 0.32, 0.9);
  const glass = new THREE.MeshStandardMaterial({
    color: 0x8a9aa8, roughness: 0.15, metalness: 0.4, envMapIntensity: 1.5,
  });
  const trim = new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.5, metalness: 0.4 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.15, metalness: 1 });

  // lower body — long, low, with a slight shoulder line
  const body = box(L, 0.62, W, paint, 0, 0.62, 0); car.add(body);
  // bonnet + boot deck shaping: a thinner upper slab set back from the nose
  const deck = box(L * 0.82, 0.22, W * 0.94, paint, -L * 0.03, 1.0, 0); car.add(deck);
  // glasshouse: raked windscreen + roof + rear window, dark reflective glass
  const cabin = box(L * 0.48, 0.42, W * 0.82, glass, -L * 0.04, 1.26, 0); car.add(cabin);
  const roof = box(L * 0.4, 0.06, W * 0.78, paint, -L * 0.04, 1.5, 0); car.add(roof);
  // pillars (thin, body-coloured) so the glass reads as windows, not a slab
  for (const s of [-1, 1]) {
    car.add(box(0.09, 0.42, 0.1, paint, L * 0.18, 1.26, s * (W * 0.4)));
    car.add(box(0.09, 0.42, 0.1, paint, -L * 0.26, 1.26, s * (W * 0.4)));
  }
  // bumpers, front and rear
  car.add(box(0.22, 0.26, W * 0.96, trim, L / 2 + 0.02, 0.42, 0));
  car.add(box(0.22, 0.26, W * 0.96, trim, -L / 2 - 0.02, 0.42, 0));
  // grille + front air intake
  car.add(box(0.06, 0.16, W * 0.55, trim, L / 2 + 0.12, 0.62, 0));
  car.add(box(0.05, 0.08, W * 0.3, chrome, L / 2 + 0.13, 0.82, 0));
  // headlights: warm white, with a hint of lens
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff2cf, emissive: 0xffe9b0, emissiveIntensity: 1.6, roughness: 0.2, metalness: 0.4,
  });
  for (const s of [-1, 1]) {
    car.add(box(0.08, 0.16, 0.42, headMat, L / 2 + 0.1, 0.82, s * (W * 0.32)));
  }
  // taillights: full-width red strip + separate lamp blocks + bumper
  // reflectors (the rear is NOT a slab)
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xb02020, emissive: 0xd21f1f, emissiveIntensity: 1.8, roughness: 0.25,
  });
  car.add(box(0.06, 0.17, W * 0.82, tailMat, -L / 2 - 0.12, 0.88, 0));
  for (const s of [-1, 1]) {
    car.add(box(0.05, 0.15, 0.3, tailMat, -L / 2 - 0.12, 0.62, s * (W * 0.34)));
    car.add(box(0.05, 0.07, 0.34, tailMat, -L / 2 - 0.12, 0.32, s * (W * 0.3)));
  }
  // side character line + door shut lines so the flanks are not flat slabs
  for (const s of [-1, 1]) {
    car.add(box(L * 0.8, 0.035, 0.03, chrome, 0, 0.98, s * (W / 2 + 0.012)));
    car.add(box(0.03, 0.5, 0.02, trim, L * 0.2, 0.78, s * (W / 2 + 0.008)));
    car.add(box(0.03, 0.5, 0.02, trim, -L * 0.14, 0.78, s * (W / 2 + 0.008)));
  }
  // exhaust pipe
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10), chrome);
  exhaust.rotation.z = Math.PI / 2; exhaust.position.set(-L / 2 - 0.12, 0.3, W * 0.28);
  car.add(exhaust);
  // mirrors on stalks
  for (const s of [-1, 1]) {
    car.add(box(0.06, 0.05, 0.16, trim, L * 0.16, 1.18, s * (W / 2 + 0.06)));
    car.add(box(0.14, 0.1, 0.06, paint, L * 0.16, 1.2, s * (W / 2 + 0.14)));
  }
  // door handles + side skirt
  for (const s of [-1, 1]) {
    car.add(box(0.22, 0.04, 0.03, chrome, L * 0.12, 0.98, s * (W / 2 + 0.01)));
    car.add(box(0.22, 0.04, 0.03, chrome, -L * 0.16, 0.98, s * (W / 2 + 0.01)));
    car.add(box(L * 0.7, 0.1, 0.04, trim, 0, 0.36, s * (W / 2 + 0.005)));
  }
  // wheels + arches
  const wheelY = 0.36, wheelX = L * 0.32, wheelZ = W / 2 - 0.02;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = makeWheel(0.36);
    w.position.set(sx * wheelX, wheelY, sz * wheelZ);
    car.add(w);
    const arch = makeArch(0.47);
    arch.position.set(sx * wheelX, wheelY, sz * (W / 2 - 0.06));
    car.add(arch);
  }
  // licence plates, front and rear
  const plateTex = makePlateTexture(plate);
  const plateMat = new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.4 });
  const plateF = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.18), plateMat);
  plateF.position.set(L / 2 + 0.14, 0.42, 0); plateF.rotation.y = 0; car.add(plateF);
  const plateR = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.18), plateMat);
  plateR.position.set(-L / 2 - 0.14, 0.42, 0); plateR.rotation.y = Math.PI; car.add(plateR);
  // sport spoiler on the hero car
  if (kind === 'sport') {
    car.add(box(0.3, 0.05, W * 0.8, paint, -L / 2 + 0.15, 1.28, 0));
    car.add(box(0.06, 0.22, 0.06, trim, -L / 2 + 0.1, 1.14, W * 0.3));
    car.add(box(0.06, 0.22, 0.06, trim, -L / 2 + 0.1, 1.14, -W * 0.3));
  }
  // police livery: teal stripe, light bar, door badge
  if (police) {
    const stripe = new THREE.MeshStandardMaterial({ color: 0x1f6f7e, roughness: 0.4, metalness: 0.3 });
    car.add(box(L * 0.9, 0.14, W + 0.02, stripe, 0, 0.72, 0));
    const barBase = box(0.5, 0.1, 0.9, trim, -L * 0.04, 1.68, 0); car.add(barBase);
    const red = new THREE.MeshStandardMaterial({ color: 0xc02020, emissive: 0xff2020, emissiveIntensity: 2.4 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x2050c0, emissive: 0x2060ff, emissiveIntensity: 2.4 });
    car.add(box(0.44, 0.12, 0.4, red, -L * 0.04, 1.78, 0.22));
    car.add(box(0.44, 0.12, 0.4, blue, -L * 0.04, 1.78, -0.22));
    car.userData.lightBar = { red: car.children[car.children.length - 2], blue: car.children[car.children.length - 1] };
  }
  car.userData.plate = plate;
  return car;
}

export function heroCar() {
  return buildCar({ color: 0xff8d4c, kind: 'sport', plate: 'BNH·4821', name: 'gullwing', length: 4.6 });
}

export function policeCruiser(name) {
  return buildCar({ color: 0xe8e4dc, kind: 'sedan', plate: 'WRD·114', police: true, name, length: 4.6 });
}

export function trafficCar(rng, i) {
  const colors = [0xc8b8a8, 0x5a6a72, 0x8a2f2a, 0x3a4a5a, 0xd8c98a, 0x6a5a4a, 0x9ab8a0, 0x2e2e34];
  const kinds = ['sedan', 'sedan', 'hatch', 'sedan'];
  return buildCar({
    color: colors[i % colors.length],
    kind: kinds[i % kinds.length],
    plate: PLATES[i % PLATES.length],
    name: `traffic-${i}`,
    length: kinds[i % kinds.length] === 'hatch' ? 4.0 : 4.5,
  });
}

// Simple harbour boat for high-tide police (hull, cabin, outboard, light mast).
export function policeBoat(name) {
  const g = new THREE.Group(); g.name = name;
  const hullMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.4, metalness: 0.3 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.9, 2.0), hullMat);
  hull.position.y = 0.6; hull.castShadow = true; g.add(hull);
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 1.0, 1.6, 4), hullMat);
  bow.rotation.z = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, 1.9);
  bow.position.set(3.3, 0.6, 0); g.add(bow);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x1f6f7e, roughness: 0.4 }));
  cabin.position.set(-0.4, 1.45, 0); cabin.castShadow = true; g.add(cabin);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x1a2530, roughness: 0.1, metalness: 0.9, envMapIntensity: 2 }));
  glass.position.set(0.6, 1.4, 0); g.add(glass);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x2e2a28, roughness: 0.5, metalness: 0.6 }));
  mast.position.set(-0.4, 2.5, 0); g.add(mast);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff3040, emissive: 0xff2020, emissiveIntensity: 2.5 }));
  lamp.position.set(-0.4, 3.2, 0); g.add(lamp);
  const motor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.5, metalness: 0.5 }));
  motor.position.set(-2.8, 0.5, 0); g.add(motor);
  return g;
}
