// Odie's Spray & Tune — night garage interior. The Gullwing sits on the lift
// on the LEFT of the frame, fully visible front-to-rear, lit warm; the DOM
// banner and upgrade panel own the RIGHT. Nothing overlaps the car.
import * as THREE from 'three';
import { heroCar, trafficCar } from './vehicles.js';
import { makeBrickTexture, makeConcreteTexture, makeSignTexture } from './textures.js';
import { makeRng } from './random.js';

export function buildGarage(scene) {
  const rng = makeRng(41);
  const group = new THREE.Group();
  group.name = 'odies-garage';
  const brick = makeBrickTexture(3);
  const concrete = makeConcreteTexture(4);

  // floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 16),
    new THREE.MeshStandardMaterial({ map: concrete, color: 0x8f8a84, roughness: 0.55, metalness: 0.15, envMapIntensity: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; group.add(floor);
  // oil stains
  for (let i = 0; i < 6; i++) {
    const stain = new THREE.Mesh(new THREE.CircleGeometry(0.5 + rng() * 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.25, metalness: 0.4 }));
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(-6 + rng() * 12, 0.01, -3 + rng() * 7);
    group.add(stain);
  }
  // walls: back + sides, dark brick
  const wallMat = new THREE.MeshStandardMaterial({ map: brick, roughness: 0.95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(26, 7), wallMat);
  back.position.set(0, 3.5, -6); back.receiveShadow = true; group.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
  left.rotation.y = Math.PI / 2; left.position.set(-13, 3.5, 0); group.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
  right.rotation.y = -Math.PI / 2; right.position.set(13, 3.5, 0); group.add(right);
  // high windows on the back wall, night-blue glow
  for (const x of [-8, -4, 4, 8]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x2a3a55, emissive: 0x33455f, emissiveIntensity: 0.9, roughness: 0.2 }));
    win.position.set(x, 5.2, -5.95); group.add(win);
  }
  // neon sign
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.9),
    new THREE.MeshStandardMaterial({
      map: makeSignTexture('ODIE’S SPRAY & TUNE', '#1c1420', '#ff7ad9', 'LAMPERS’ ROW · EST. 1987'),
      emissive: 0xffffff, emissiveMap: makeSignTexture('ODIE’S SPRAY & TUNE', '#1c1420', '#ff7ad9', 'LAMPERS’ ROW · EST. 1987'),
      emissiveIntensity: 0.55, roughness: 0.4,
    }));
  sign.position.set(-2.5, 3.5, -5.9); group.add(sign);

  // --- the lift, centre-left of the room: FOUR posts at the corners so no
  // post ever stands in front of the car's middle ---
  const liftMat = new THREE.MeshStandardMaterial({ color: 0x8a8f94, roughness: 0.4, metalness: 0.8 });
  const liftDark = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.5, metalness: 0.6 });
  const liftX = -2.5;
  for (const sx of [-2.4, 2.4]) for (const sz of [-1.15, 1.15]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.4, 0.45), liftMat);
    post.position.set(liftX + sx, 1.7, sz); post.castShadow = true; group.add(post);
  }
  const platform = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 2.0), liftMat);
  platform.position.set(liftX, 0.85, 0); platform.castShadow = true; platform.receiveShadow = true; group.add(platform);
  // hydraulic ram under the platform
  const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.8, 12), liftDark);
  ram.position.set(liftX, 0.4, 0); group.add(ram);

  // --- the hero car, ON the lift, fully visible ---
  const car = heroCar();
  car.position.set(liftX, 1.06, 0);
  car.rotation.y = 0; // nose to the right (+x), whole car side-on to camera
  group.add(car);

  // --- a second car parked at the back-left, for depth ---
  const spare = trafficCar(rng, 2);
  spare.position.set(-9.5, 0, -3.8); spare.rotation.y = Math.PI * 0.12;
  group.add(spare);

  // --- roof: blocks the golden-hour sun so the night garage is lit by its
  // own warm lamps, not washed out by daylight ---
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(26, 16),
    new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 1 }));
  roof.rotation.x = Math.PI / 2; roof.position.set(0, 7, 0);
  roof.castShadow = true; group.add(roof);

  // --- workbench + tool wall on the right ---
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.85 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.0), benchMat);
  bench.position.set(9.5, 0.95, -5.2); bench.castShadow = true; group.add(bench);
  for (const s of [-1.6, 1.6]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.95, 0.9), liftDark);
    leg.position.set(9.5 + s, 0.48, -5.2); group.add(leg);
  }
  // tools on the bench: small boxes + a wrench shape
  const toolMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.3, metalness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.3 + rng() * 0.3, 0.06, 0.1), toolMat);
    t.position.set(8.4 + i * 0.55, 1.04, -5.2 + (rng() - 0.5) * 0.4);
    t.rotation.y = rng() * 0.6; group.add(t);
  }
  // tyre stack
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.18, 10, 18), tyreMat);
    tyre.rotation.x = Math.PI / 2; tyre.position.set(-10.5, 0.2 + i * 0.38, -4.6);
    tyre.castShadow = true; group.add(tyre);
  }
  // hanging lamp row: warm pools of light over the car
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffc27a, emissiveIntensity: 2.6 });
  for (const x of [-5, -2.5, 0]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), liftDark);
    cord.position.set(x, 6.2, 0); group.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.45, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x2e4a3a, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }));
    shade.position.set(x, 5.35, 0); group.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), lampMat);
    bulb.position.set(x, 5.2, 0); group.add(bulb);
    const light = new THREE.PointLight(0xffc27a, 60, 14, 1.6);
    light.position.set(x, 4.9, 0); group.add(light);
  }
  // pink neon strip along the back wall base
  const neon = new THREE.Mesh(new THREE.BoxGeometry(12, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xff7ad9, emissive: 0xff4fc0, emissiveIntensity: 2.2 }));
  neon.position.set(-2, 0.25, -5.85); group.add(neon);

  scene.add(group);
  return { group, car, liftX };
}
