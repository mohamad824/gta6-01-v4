// People with real proportions and readable clothing: jacket, shirt, trousers,
// shoes, hair, and a weapon actually held in the hand. No flat colour blocks.
import * as THREE from 'three';

function std(color, roughness = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
}

function limb(r, len, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, len, 8), mat);
  m.position.set(x, y, z); m.castShadow = true;
  return m;
}

// height ~1.78 m. Head is ~1/7.5 of height — a person, not a mascot.
export function buildPerson(opts = {}) {
  const {
    jacket = 0x2e6f6a, shirt = 0xe8e2d4, trousers = 0x2a2e38, shoes = 0x1c1a18,
    skin = 0xc98d64, hair = 0x241a12, weapon = null, name = 'person',
    female = false,
  } = opts;
  const p = new THREE.Group(); p.name = name;
  const jacketMat = std(jacket, 0.8);
  const shirtMat = std(shirt, 0.9);
  const trouserMat = std(trousers, 0.9);
  const skinMat = std(skin, 0.7);
  const hairMat = std(hair, 0.6);

  // legs: two trouser cylinders + shoes
  for (const s of [-1, 1]) {
    p.add(limb(0.085, 0.78, trouserMat, s * 0.11, 0.42, 0));
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.3), std(shoes, 0.6));
    shoe.position.set(s * 0.11, 0.045, 0.05); shoe.castShadow = true; p.add(shoe);
  }
  // torso: jacket, with a shirt V at the chest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.62, 0.26), jacketMat);
  torso.position.y = 1.13; torso.castShadow = true; p.add(torso);
  const shirtPanel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.4, 0.03), shirtMat);
  shirtPanel.position.set(0, 1.18, 0.14); p.add(shirtPanel);
  // jacket collar + zip line
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.05), std(0x1c1a18, 0.7));
  collar.position.set(0, 1.44, 0.14); p.add(collar);
  // belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.05, 0.27), std(0x1c1a18, 0.6));
  belt.position.y = 0.83; p.add(belt);
  // arms: jacket sleeves, skin hands, slightly bent at the elbow
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.27, 1.38, 0);
    arm.add(limb(0.06, 0.56, jacketMat, 0, -0.28, 0));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinMat);
    hand.position.set(0, -0.6, 0); arm.add(hand);
    arm.rotation.z = s * 0.12;
    p.add(arm);
    if (s === 1) p.userData.rightArm = arm;
    else p.userData.leftArm = arm;
  }
  // head + hair + face hint
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 12), skinMat);
  head.position.y = 1.62; head.castShadow = true; p.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hairCap.position.y = 1.64; p.add(hairCap);
  if (female) {
    // ponytail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.34, 8), hairMat);
    tail.position.set(0, 1.5, -0.14); tail.rotation.x = 0.35; p.add(tail);
  }
  // weapon held in the right hand, pointing forward
  if (weapon === 'pistol') {
    const gun = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.06), std(0x1a1c20, 0.4));
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), std(0x1a1c20, 0.4));
    grip.position.set(-0.06, -0.07, 0);
    gun.add(barrel); gun.add(grip);
    gun.position.set(0, -0.62, 0.08);
    gun.rotation.x = 0; // held forward
    p.userData.rightArm.add(gun);
    p.userData.rightArm.rotation.x = -1.25; // arm raised, aiming forward
    p.userData.weapon = gun;
  } else if (weapon === 'rifle') {
    const gun = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 0.08), std(0x23262c, 0.45));
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), std(0x111214, 0.4));
    barrel.rotation.z = Math.PI / 2; barrel.position.set(0.42, 0, 0);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.08), std(0x3a2a1c, 0.7));
    stock.position.set(-0.34, -0.02, 0);
    gun.add(body); gun.add(barrel); gun.add(stock);
    gun.position.set(0, -0.6, 0.1);
    p.userData.rightArm.add(gun);
    p.userData.rightArm.rotation.x = -1.2;
    p.userData.leftArm.rotation.x = -0.9; // left hand steadies the rifle
    p.userData.weapon = gun;
  }
  return p;
}

export function nadia() {
  return buildPerson({
    jacket: 0x2e6f6a, shirt: 0xe8e2d4, trousers: 0x2a2e38, skin: 0xc98d64,
    hair: 0x241a12, weapon: 'pistol', female: true, name: 'nadia-ferro',
  });
}

export function saltjack(rng, i) {
  return buildPerson({
    jacket: 0x7a2a26, shirt: 0x2a2a2e, trousers: 0x23211e, skin: 0xb57a52,
    hair: 0x14100c, weapon: i % 2 ? 'rifle' : 'pistol', name: `saltjack-${i}`,
  });
}

export function pedestrian(rng, i) {
  const outfits = [
    { jacket: 0x8a6a4a, shirt: 0xe8e2d4, trousers: 0x3a3a42 },
    { jacket: 0x4a5a7a, shirt: 0xd8d2c4, trousers: 0x2a2e38 },
    { jacket: 0xc9a06a, shirt: 0x2a2a2e, trousers: 0x4a3a2e },
    { jacket: 0x5a7a4a, shirt: 0xe8e2d4, trousers: 0x33302a },
    { jacket: 0x9a4a5a, shirt: 0xf0e8d8, trousers: 0x2e2a30 },
  ];
  const o = outfits[i % outfits.length];
  return buildPerson({
    jacket: o.jacket, shirt: o.shirt, trousers: o.trousers,
    skin: [0xc98d64, 0xa06a44, 0xe0b090][i % 3],
    hair: [0x241a12, 0x4a3a28, 0x6a6a6a][i % 3],
    female: i % 3 === 0, name: `pedestrian-${i}`,
  });
}
