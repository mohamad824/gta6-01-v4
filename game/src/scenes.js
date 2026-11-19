// Scripted seeded shots: exact camera, traffic, people and HUD state for
// each of the four frames. Same seed = same frame.
import * as THREE from 'three';
import { stateForShot } from './missions.js';
import { updateHUD, drawMinimap } from './hud.js';
import { showMapOverlay, hideMapOverlay } from './mapview.js';
import { makeRoster } from './police.js';

// Chase camera: low, ~2 car-lengths behind the Gullwing, slightly left,
// looking down the boulevard so the car fills the lower third.
const CHASE_CAM = { pos: [-7.6, 3.5, 3.8], look: [12, 1.2, -2.0] };
const ONFOOT_CAM = { pos: [-4.8, 2.7, 2.0], look: [6, 1.1, -0.3] };
const MAP_CAM = { pos: [0, 150, 105], look: [0, 0, 0] };
const GARAGE_CAM = { pos: [-2.5, 1.6, 5.8], look: [-1.0, 1.0, 0] };

function setCam(world, c) {
  world.camera.position.set(c.pos[0], c.pos[1], c.pos[2]);
  world.camera.lookAt(new THREE.Vector3(c.look[0], c.look[1], c.look[2]));
  world.camera.updateProjectionMatrix();
}

function placeTraffic(world, shot) {
  const t = world.traffic;
  const spots = shot === 'chase' ? [
    { i: 0, x: 18, z: 3.5, rot: 0 }, { i: 1, x: 38, z: 3.5, rot: 0 }, { i: 2, x: 62, z: 3.5, rot: 0 },
    { i: 3, x: 24, z: -3.5, rot: Math.PI }, { i: 4, x: 48, z: -3.5, rot: Math.PI }, { i: 5, x: -32, z: -3.5, rot: Math.PI },
    { i: 6, x: 84, z: -3.5, rot: Math.PI }, { i: 7, x: -60, z: 63.5, rot: Math.PI / 2 },
  ] : [
    { i: 0, x: 7, z: 5.5, rot: Math.PI * 0.08 }, { i: 1, x: 30, z: 3.5, rot: 0 },
    { i: 2, x: -26, z: -3.5, rot: Math.PI }, { i: 3, x: 55, z: -3.5, rot: Math.PI },
  ];
  for (const s of spots) {
    const car = t[s.i];
    if (!car) continue;
    car.position.set(s.x, 0, s.z);
    car.rotation.y = s.rot;
    car.visible = true;
  }
  for (let i = spots.length; i < t.length; i++) t[i].visible = false;
}

function placePedestrians(world, shot) {
  const p = world.pedestrians;
  const spots = shot === 'chase' ? [
    [-14, -9.8], [-6, 9.8], [12, -9.8], [22, 9.8], [34, -9.8], [46, 9.8],
    [58, -9.8], [-26, 9.8], [-40, -9.8], [70, 9.8],
  ] : [
    [9, -9.8], [-12, 9.8], [20, -9.8], [-20, -9.8], [28, 9.8], [-32, 9.8],
  ];
  p.forEach((person, i) => {
    const s = spots[i % spots.length];
    person.position.set(s[0], 0, s[1]);
    person.rotation.y = (i % 2 ? 1 : -1) * (Math.PI / 2) + (i % 3) * 0.2;
    person.visible = true;
  });
}

export function applyShot(world, shot) {
  const state = stateForShot(shot);
  world.state = state;
  hideMapOverlay();
  world.flash.visible = false;

  if (shot === 'garage') {
    world.cityGroup.visible = false;
    world.garageGroup.visible = true;
    world.heroCar.visible = false;
    world.nadia.visible = false;
    world.heli.visible = false;
    world.traffic.forEach((c) => { c.visible = false; });
    world.pedestrians.forEach((p) => { p.visible = false; });
    world.enemies.forEach((e) => { e.visible = false; });
    world.policeGroup.visible = false;
    document.getElementById('hud').classList.add('garage-mode');
    setCam(world, GARAGE_CAM);
    updateHUD(state, 'garage');
    drawMinimap({ x: -130, z: 95, heading: 0, tideHigh: true }, makeRoster(true).units, 'garage');
    document.getElementById('radio').style.display = 'none';
    return state;
  }
  document.getElementById('hud').classList.remove('garage-mode');

  world.cityGroup.visible = true;
  world.garageGroup.visible = false;
  world.policeGroup.visible = true;
  document.getElementById('radio').style.display = 'block';

  if (shot === 'chase') {
    world.city.flood.visible = true;
    world.city.mud.visible = false;
    world.heroCar.visible = true;
    world.heroCar.position.set(0, 0, 0);
    world.heroCar.rotation.y = 0;
    world.nadia.visible = false;
    world.enemies.forEach((e) => { e.visible = false; });
    world.heli.visible = true;
    world.heli.position.set(20, 11, -7);
    world.heli.rotation.y = -0.5;
    placeTraffic(world, 'chase');
    placePedestrians(world, 'chase');
    setCam(world, CHASE_CAM);
    updateHUD(state, 'chase');
    drawMinimap({ x: 0, z: 0, heading: Math.PI / 2, tideHigh: true }, makeRoster(true).units, 'chase');
  } else if (shot === 'onfoot') {
    world.city.flood.visible = false;
    world.city.mud.visible = true;
    world.heroCar.visible = false;
    world.nadia.visible = true;
    world.nadia.position.set(0, 0, 0);
    world.nadia.rotation.y = Math.PI / 2 - 0.4; // facing down the boulevard, gun arm on the camera side
    world.enemies.forEach((e, i) => {
      const spots = [[14, -2], [18, 2.5], [12, 4.5], [21, -4]];
      e.position.set(spots[i][0], 0, spots[i][1]);
      e.rotation.y = -Math.PI / 2; // facing Nadia
      e.visible = true;
    });
    // muzzle flash on the nearest gunman
    world.flash.position.set(13.4, 1.35, -1.2);
    world.flash.visible = true;
    world.heli.visible = true;
    world.heli.position.set(14, 11, -7);
    world.heli.rotation.y = -0.4;
    placeTraffic(world, 'onfoot');
    placePedestrians(world, 'onfoot');
    setCam(world, ONFOOT_CAM);
    updateHUD(state, 'onfoot');
    drawMinimap({ x: 0, z: 0, heading: Math.PI / 2, tideHigh: false }, makeRoster(false).units, 'onfoot');
  } else if (shot === 'map') {
    world.city.flood.visible = true;
    world.city.mud.visible = false;
    world.heroCar.visible = true;
    world.heroCar.position.set(0, 0, 0);
    world.heroCar.rotation.y = 0;
    world.nadia.visible = false;
    world.enemies.forEach((e) => { e.visible = false; });
    world.heli.visible = true;
    world.heli.position.set(18, 13, -9);
    world.heli.rotation.y = -0.5;
    placeTraffic(world, 'map');
    placePedestrians(world, 'map');
    setCam(world, MAP_CAM);
    updateHUD(state, 'map');
    drawMinimap({ x: 0, z: 0, heading: Math.PI / 2, tideHigh: true }, makeRoster(true).units, 'map');
    showMapOverlay(state);
  }
  return state;
}
