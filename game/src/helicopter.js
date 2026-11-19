// TERN-1, the Harbour Wardens air unit — a LIT helicopter: warm sunlit body,
// pale belly, reflective cockpit glass, lit windows, spinning rotor, and a
// visible searchlight cone. Never a flat dark silhouette.
import * as THREE from 'three';

export function buildHelicopter() {
  const heli = new THREE.Group();
  heli.name = 'tern-1';
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xc8452c, roughness: 0.35, metalness: 0.55, envMapIntensity: 1.4,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xe8ddd2, roughness: 0.4, metalness: 0.4, envMapIntensity: 1.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x2a3a4a, roughness: 0.06, metalness: 0.9, envMapIntensity: 2.2,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.5, metalness: 0.5 });
  const warmMat = new THREE.MeshStandardMaterial({
    color: 0xffd98a, emissive: 0xffc27a, emissiveIntensity: 1.8,
  });

  // fuselage: rounded body, pale belly stripe, lit side windows
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 4.6, 14), bodyMat);
  body.rotation.z = Math.PI / 2; body.castShadow = true; heli.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 12), bodyMat);
  nose.position.set(2.3, 0, 0); nose.scale.set(1.1, 0.95, 0.95); nose.castShadow = true; heli.add(nose);
  const belly = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 1.7), bellyMat);
  belly.position.set(0, -0.95, 0); heli.add(belly);
  // cockpit glass — big, reflective, catching the sunset
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 12), glassMat);
  cockpit.position.set(2.15, 0.25, 0); cockpit.scale.set(1.0, 0.85, 0.95); heli.add(cockpit);
  // cabin windows: warm-lit, one per side
  for (const s of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.06), warmMat);
    win.position.set(0.4, 0.25, s * 1.08); heli.add(win);
    const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.06), warmMat);
    win2.position.set(-0.8, 0.25, s * 1.08); heli.add(win2);
  }
  // tail boom + fin + tail rotor
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 4.4, 10), bodyMat);
  boom.rotation.z = Math.PI / 2; boom.position.set(-4.2, 0.25, 0); boom.castShadow = true; heli.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.5, 1.1), bodyMat);
  fin.position.set(-6.2, 0.8, 0); heli.add(fin);
  const tailRotor = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.12), darkMat);
    b.rotation.x = (i * Math.PI) / 2; tailRotor.add(b);
  }
  tailRotor.position.set(-6.1, 0.4, 0.35); heli.add(tailRotor);
  heli.userData.tailRotor = tailRotor;
  // main rotor: hub + four long blades + a faint spinning disc
  const rotor = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 4.4), darkMat);
    blade.position.z = i % 2 ? 2.2 : -2.2;
    if (i >= 2) blade.rotation.y = Math.PI / 2;
    rotor.add(blade);
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(4.4, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, side: THREE.DoubleSide }));
  disc.rotation.x = -Math.PI / 2; rotor.add(disc);
  rotor.position.set(0, 1.35, 0); heli.add(rotor);
  heli.userData.rotor = rotor;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8), darkMat);
  mast.position.set(0, 1.1, 0); heli.add(mast);
  // skids
  for (const s of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.0, 8), darkMat);
    skid.rotation.z = Math.PI / 2; skid.position.set(0.2, -1.35, s * 0.85); heli.add(skid);
    for (const sx of [-1.2, 1.4]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), darkMat);
      strut.position.set(sx, -1.12, s * 0.85); heli.add(strut);
    }
  }
  // searchlight: warm lens + translucent cone + a real spotlight
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), warmMat);
  lamp.position.set(1.6, -1.0, 0); heli.add(lamp);
  const coneGeo = new THREE.ConeGeometry(3.2, 26, 20, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffe9b0, transparent: true, opacity: 0.16, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(1.6, -12, 0); cone.rotation.z = Math.PI; // apex at the lamp, opening downward
  cone.rotation.x = 0; heli.add(cone);
  heli.userData.cone = cone;
  const spot = new THREE.SpotLight(0xffe2a8, 900, 90, 0.32, 0.5, 1.2);
  spot.position.set(1.6, -1.0, 0);
  spot.target.position.set(1.6, -26, 0);
  heli.add(spot); heli.add(spot.target);
  // red anti-collision beacon
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 3 }));
  beacon.position.set(0, 1.15, 0); heli.add(beacon);
  heli.userData.beacon = beacon;
  return heli;
}
