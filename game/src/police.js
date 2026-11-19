// Harbour Wardens roster: named units, live distances, status verbs.
// Rules the HUD honours: boats PURSUIT only at high tide and DOCKED at low
// tide; a GROUNDED cruiser is never RAMMING.
import { policeCruiser, policeBoat } from './vehicles.js';

export function makeRoster(tideHigh) {
  // dist in metres, status verbs per unit
  const units = tideHigh ? [
    { id: 'WARDEN-4', type: 'CRUISER', dist: 4, status: 'GROUNDED' },
    { id: 'WARDEN-7', type: 'CRUISER', dist: 17, status: 'GROUNDED' },
    { id: 'SKIFF-2', type: 'BOAT', dist: 32, status: 'PURSUIT' },
    { id: 'CUTTER-9', type: 'BOAT', dist: 39, status: 'ROADBLOCK' },
    { id: 'TERN-1', type: 'AIR', dist: 36, status: 'SPOTLIGHT' },
  ] : [
    { id: 'WARDEN-4', type: 'CRUISER', dist: 66, status: 'PURSUIT' },
    { id: 'WARDEN-7', type: 'CRUISER', dist: 40, status: 'PURSUIT' },
    { id: 'SKIFF-2', type: 'BOAT', dist: 27, status: 'DOCKED' },
    { id: 'CUTTER-9', type: 'BOAT', dist: 48, status: 'DOCKED' },
    { id: 'TERN-1', type: 'AIR', dist: 29, status: 'SPOTLIGHT' },
  ];
  return { units, total: 5, footnote: tideHigh
    ? '+2 more units on the call · 2 officers on foot'
    : '+1 more unit · cruisers on the boulevard' };
}

// Spawn the visible police vehicles for a shot: cruisers on the road,
// boats in the water at high tide, helicopter overhead.
export function spawnPolice(scene, tideHigh) {
  const out = {};
  const cruiserA = policeCruiser('warden-4');
  cruiserA.position.set(-8.5, 0, -4.6); cruiserA.rotation.y = 0;
  scene.add(cruiserA); out.cruiserA = cruiserA;
  const cruiserB = policeCruiser('warden-7');
  cruiserB.position.set(26, 0, 3.6); cruiserB.rotation.y = Math.PI;
  scene.add(cruiserB); out.cruiserB = cruiserB;
  if (tideHigh) {
    const boatA = policeBoat('skiff-2');
    boatA.position.set(190, -0.2, -40); boatA.rotation.y = Math.PI * 0.75;
    scene.add(boatA); out.boatA = boatA;
    const boatB = policeBoat('cutter-9');
    boatB.position.set(196, -0.2, 30); boatB.rotation.y = -Math.PI * 0.6;
    scene.add(boatB); out.boatB = boatB;
  }
  return out;
}
