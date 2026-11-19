// BRINEHAVEN — a tidal island city crime game. Three.js open world:
// drive, walk, steal cars, outrun the Harbour Wardens, work seven tides
// for fixer Bram Okafor, clear Nadia Ferro's $12,400 debt.
import * as THREE from 'three';
import { PALETTE } from './config.js';
import { makeSkyTexture } from './textures.js';
import { buildCity } from './city.js';
import { heroCar, trafficCar } from './vehicles.js';
import { nadia, saltjack, pedestrian } from './people.js';
import { buildHelicopter } from './helicopter.js';
import { spawnPolice } from './police.js';
import { buildGarage } from './garage.js';
import { buildHUD, updateHUD, drawMinimap } from './hud.js';
import { showMapOverlay, hideMapOverlay } from './mapview.js';
import { applyShot } from './scenes.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { initialState, repNameFor, saveGame, loadGame } from './missions.js';
import { makeRng } from './random.js';
import { makeRoster } from './police.js';

window.__shotReady = false;
window.__shotErrors = [];
window.addEventListener('error', (e) => window.__shotErrors.push(String(e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => window.__shotErrors.push(String(e.reason)));

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot'); // chase | onfoot | map | garage
const SEED = Number(params.get('seed') || 1);
const SHOT_MODE = !!SHOT;

// --- renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('game') });
renderer.setSize(1280, 720, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcf9468, 160, 780);
const camera = new THREE.PerspectiveCamera(55, 1280 / 720, 0.1, 2000);

// golden-hour sky dome + environment reflections for paint, glass, water
const skyTex = makeSkyTexture();
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(900, 32, 20),
  new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }),
);
scene.add(sky);
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(skyTex).texture;
}

// --- lighting: one low warm sun, mauve sky fill, warm haze ---
const sun = new THREE.DirectionalLight(0xffb36b, 3.0);
sun.position.set(-120, 75, -60); // low warm sun in the west, long shadows east
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
sun.shadow.camera.far = 500; sun.shadow.bias = -0.0004;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x8a6fa8, 0xa8764a, 1.0));
const bounce = new THREE.DirectionalLight(0xff9e6a, 0.5);
bounce.position.set(120, 30, 80); scene.add(bounce);

// --- world ---
const city = buildCity(scene, SEED, { tideHigh: true });
const cityGroup = city.group;
const garageBuilt = buildGarage(scene);
const garageGroup = garageBuilt.group;
garageGroup.visible = false;

const hero = heroCar(); scene.add(hero);
const nadiaMesh = nadia(); nadiaMesh.visible = false; scene.add(nadiaMesh);

const rng = makeRng(SEED * 31 + 7);
const traffic = [];
for (let i = 0; i < 8; i++) { const c = trafficCar(rng, i); scene.add(c); traffic.push(c); }
const pedestrians = [];
for (let i = 0; i < 10; i++) { const p = pedestrian(rng, i); scene.add(p); pedestrians.push(p); }
const enemies = [];
for (let i = 0; i < 4; i++) { const e = saltjack(rng, i); e.visible = false; scene.add(e); enemies.push(e); }

const heli = buildHelicopter(); scene.add(heli);
const policeGroup = new THREE.Group(); policeGroup.name = 'police-units';
scene.add(policeGroup);
const policeUnits = spawnPolice(policeGroup, true);

// muzzle flash: a small glowing ball + point light, so it reads as a
// flash from any angle (a flat plane goes edge-on from the side)
const flash = new THREE.Group();
const flashBall = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8),
  new THREE.MeshBasicMaterial({ color: 0xffe9b0 }));
flash.add(flashBall);
const flashHalo = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8),
  new THREE.MeshBasicMaterial({ color: 0xffb050, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
flash.add(flashHalo);
const flashLight = new THREE.PointLight(0xffb050, 40, 12, 1.8);
flash.add(flashLight);
flash.visible = false;
scene.add(flash);

// --- HUD + state ---
buildHUD();
const input = createInput();
const audio = createAudio();
let state = initialState();
const saved = loadGame();
if (saved && !SHOT_MODE) Object.assign(state, saved);

const world = {
  scene, camera, cityGroup, garageGroup, heroCar: hero, nadia: nadiaMesh,
  traffic, pedestrians, enemies, heli, policeGroup, city, flash, state,
};

// driving / walking state
const drive = { speed: 0, heading: 0, x: 0, z: 0, nitro: 1 };
const walk = { x: 0, z: 0, heading: Math.PI / 2 };
let mode = 'title'; // title | play | map | garage | paused
let camYaw = 0, camPitch = 0.12;
let framesRendered = 0;

function showTitle() {
  document.getElementById('start-screen').style.display = 'flex';
  document.getElementById('hud').style.display = 'none';
}
function hideTitle() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
}

function enterPlay() {
  hideTitle();
  mode = 'play';
  audio.unlock();
  updateHUD(state, state.onFoot ? 'onfoot' : 'chase');
  drawMinimap({ x: drive.x, z: drive.z, heading: drive.heading, tideHigh: state.tideHigh }, makeRoster(state.tideHigh).units, 'chase');
}

function toggleMap() {
  if (mode === 'map') { hideMapOverlay(); mode = 'play'; }
  else if (mode === 'play') { showMapOverlay(state); mode = 'map'; }
}
function toggleGarage() {
  if (mode === 'garage') {
    garageGroup.visible = false; cityGroup.visible = true; mode = 'play';
    document.getElementById('hud').classList.remove('garage-mode');
    document.getElementById('mission-passed').style.display = 'none';
    document.getElementById('upgrade-panel').style.display = 'none';
  } else if (mode === 'play') {
    cityGroup.visible = false; garageGroup.visible = true; mode = 'garage';
    state.inGarage = true;
    updateHUD(state, 'garage');
    document.getElementById('hud').classList.add('garage-mode');
    camera.position.set(-2.5, 1.6, 5.8);
    camera.lookAt(new THREE.Vector3(-1.0, 1.0, 0));
  }
}

// --- per-frame updates (frozen in shot mode so the frame is deterministic) ---
const clock = new THREE.Clock();
function update(dt) {
  // helicopter rotor + beacon always spin (deterministic per frame in shot mode)
  heli.userData.rotor.rotation.y += dt * 14;
  heli.userData.tailRotor.rotation.x += dt * 22;
  heli.userData.beacon.material.emissiveIntensity = 2 + Math.sin(clock.elapsedTime * 6) * 1.5;
  if (policeUnits.cruiserA && policeUnits.cruiserA.userData.lightBar) {
    const on = Math.sin(clock.elapsedTime * 9) > 0;
    policeUnits.cruiserA.userData.lightBar.red.material.emissiveIntensity = on ? 2.6 : 0.4;
    policeUnits.cruiserA.userData.lightBar.blue.material.emissiveIntensity = on ? 0.4 : 2.6;
  }
  if (SHOT_MODE) return;
  // water shimmer
  city.seaTex.offset.x += dt * 0.004;
  city.seaTex.offset.y += dt * 0.002;
  // traffic lanes
  traffic.forEach((car, i) => {
    if (!car.visible) return;
    const dir = car.rotation.y === 0 ? 1 : -1;
    car.position.x += dir * dt * (9 + (i % 3) * 2);
    if (car.position.x > 205) car.position.x = -205;
    if (car.position.x < -205) car.position.x = 205;
  });
  pedestrians.forEach((p, i) => {
    if (!p.visible) return;
    p.position.x += (i % 2 ? 1 : -1) * dt * 1.1;
    if (p.position.x > 195) p.position.x = -195;
    if (p.position.x < -195) p.position.x = 195;
    p.position.y = Math.abs(Math.sin(clock.elapsedTime * 5 + i)) * 0.04; // walk bob
  });
  if (mode !== 'play') return;
  const ax = input.axis();
  // --- driving ---
  if (!state.onFoot) {
    const accel = ax.throttle * 26 * (ax.nitro && drive.nitro > 0 ? 1.6 : 1);
    if (ax.nitro && ax.throttle > 0) drive.nitro = Math.max(0, drive.nitro - dt * 0.3);
    else drive.nitro = Math.min(1, drive.nitro + dt * 0.05);
    drive.speed += accel * dt;
    if (ax.brake) drive.speed -= 34 * dt;
    drive.speed -= drive.speed * 0.55 * dt; // drag
    drive.speed = Math.max(-8, Math.min(42, drive.speed));
    drive.heading += ax.steer * dt * (0.9 + Math.abs(drive.speed) * 0.02) * (drive.speed >= 0 ? 1 : -1);
    drive.x += Math.sin(drive.heading) * drive.speed * dt;
    drive.z += Math.cos(drive.heading) * drive.speed * dt;
    drive.x = Math.max(-198, Math.min(198, drive.x));
    drive.z = Math.max(-138, Math.min(228, drive.z));
    hero.position.set(drive.x, 0, drive.z);
    hero.rotation.y = drive.heading;
    state.speedKmh = Math.round(Math.abs(drive.speed) * 3.6);
    state.gear = drive.speed > 28 ? 'G5' : drive.speed > 16 ? 'G4' : drive.speed > 6 ? 'G3' : drive.speed > 0.5 ? 'G2' : 'GN';
    state.district = districtAt(drive.x, drive.z);
    // chase camera
    const look = input.consumeLook();
    camYaw += look.dx * 0.003; camPitch = Math.max(-0.1, Math.min(0.5, camPitch + look.dy * 0.002));
    const back = 9.5, height = 3.6 + camPitch * 6;
    const bx = drive.x - Math.sin(drive.heading + camYaw) * back;
    const bz = drive.z - Math.cos(drive.heading + camYaw) * back;
    camera.position.set(bx, height, bz);
    camera.lookAt(drive.x + Math.sin(drive.heading) * 10, 1.4, drive.z + Math.cos(drive.heading) * 10);
    // drift: hard steer at speed pays
    if (ax.brake && Math.abs(drive.speed) > 18 && Math.random() < dt * 0.5) {
      state.cash += 120; state.popups = ['DRIFT +$120'];
    }
    audio.setSpeed(state.speedKmh);
    // police cruisers close in
    if (policeUnits.cruiserA) {
      const c = policeUnits.cruiserA;
      const dx = drive.x - c.position.x, dz = drive.z - c.position.z;
      const d = Math.hypot(dx, dz) || 1;
      c.position.x += (dx / d) * dt * 11;
      c.position.z += (dz / d) * dt * 11;
      c.rotation.y = Math.atan2(dx, dz);
    }
  } else {
    // --- on foot ---
    const sp = 4.2;
    walk.x += Math.sin(walk.heading) * ax.throttle * sp * dt;
    walk.z += Math.cos(walk.heading) * ax.throttle * sp * dt;
    walk.heading += ax.steer * dt * 1.8;
    nadiaMesh.position.set(walk.x, 0, walk.z);
    nadiaMesh.rotation.y = walk.heading;
    state.speedKmh = 0; state.gear = '—';
    const look = input.consumeLook();
    camYaw += look.dx * 0.003;
    camera.position.set(
      walk.x - Math.sin(walk.heading + camYaw) * 4.6,
      2.6, walk.z - Math.cos(walk.heading + camYaw) * 4.6);
    camera.lookAt(walk.x + Math.sin(walk.heading) * 6, 1.2, walk.z + Math.cos(walk.heading) * 6);
    // shooting: nearest Saltjack in front falls
    if (input.wasPressed('KeyF') || ax.shoot) {
      flash.position.set(walk.x + Math.sin(walk.heading) * 1.2, 1.35, walk.z + Math.cos(walk.heading) * 1.2);
      flash.visible = true;
      setTimeout(() => { flash.visible = false; }, 90);
      const target = enemies.find((e) => e.visible && e.position.distanceTo(nadiaMesh.position) < 26);
      if (target) {
        target.visible = false;
        state.cash += 120;
        state.popups = ['GUNMAN DOWN +$120'];
        state.accuracy = Math.min(99, state.accuracy + 1);
      }
    }
  }
  // --- keys ---
  if (input.wasPressed('KeyE')) {
    if (state.onFoot) {
      const near = traffic.find((c) => c.visible && c.position.distanceTo(nadiaMesh.position) < 6);
      if (near) {
        state.onFoot = false; nadiaMesh.visible = false; hero.visible = true;
        drive.x = near.position.x; drive.z = near.position.z; drive.heading = near.rotation.y;
        state.carsStolen += 1;
        updateHUD(state, 'chase');
      }
    } else if (Math.abs(drive.speed) < 1) {
      state.onFoot = true; walk.x = drive.x + 2; walk.z = drive.z + 2; walk.heading = drive.heading;
      nadiaMesh.visible = true; hero.visible = false;
      updateHUD(state, 'onfoot');
    }
  }
  if (input.wasPressed('KeyM')) toggleMap();
  if (input.wasPressed('KeyG')) toggleGarage();
  if (input.wasPressed('KeyP')) { mode = mode === 'paused' ? 'play' : 'paused'; }
  if (input.wasPressed('Enter') && mode === 'title') enterPlay();
  if (mode === 'play') {
    updateHUD(state, state.onFoot ? 'onfoot' : 'chase');
    drawMinimap({ x: state.onFoot ? walk.x : drive.x, z: state.onFoot ? walk.z : drive.z, heading: state.onFoot ? walk.heading : drive.heading, tideHigh: state.tideHigh }, makeRoster(state.tideHigh).units, 'chase');
  }
}

function districtAt(x, z) {
  if (z > 140) return 'THE CAUSEWAY';
  if (x < -60 && z < 0) return 'SALTMARKET';
  if (x >= -60 && x < 60 && z < 0) return 'GULLGATE';
  if (x >= 60 && z < 0) return 'LOW QUAY';
  if (x < 0 && z >= 0) return 'LAMPERS’ ROW';
  return 'FERRY ROW';
}

// --- shot mode: scripted frames, then signal ready ---
if (SHOT_MODE) {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  state = applyShot(world, SHOT);
  world.state = state;
  // garage shot needs the garage camera kept, city hidden — applyShot did it
} else {
  showTitle();
  // default backdrop behind the title: the chase boulevard
  state = applyShot(world, 'chase');
  world.state = state;
  state = initialState();
  updateHUD(state, 'chase');
  drawMinimap({ x: 0, z: 0, heading: Math.PI / 2, tideHigh: true }, makeRoster(true).units, 'chase');
}

window.addEventListener('beforeunload', () => saveGame(state));

// --- main loop ---
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  update(dt);
  renderer.render(scene, camera);
  framesRendered += 1;
  if (SHOT_MODE && framesRendered === 3) {
    window.__shotReady = true;
    document.title = 'READY';
  }
}
frame();
