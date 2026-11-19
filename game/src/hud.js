// DOM HUD: fixed-corner grammar — mission banner, wanted stars, cash,
// weapon slots, police roster, tide banner, circular minimap with a real
// street grid, dialogue, radio, vehicle card, controls strip, score popups.
import { STREETS, DISTRICTS, STORY, TIDE } from './config.js';
import { chapterTitle } from './missions.js';
import { makeRoster } from './police.js';

const $ = (id) => document.getElementById(id);
const money = (n) => '$' + n.toLocaleString('en-US');

export function buildHUD() {
  $('hud').innerHTML = `
  <div id="mission-banner" class="panel">
    <div class="mb-chapter"></div>
    <div class="mb-title"></div>
    <div class="mb-objective"></div>
    <div class="mb-target"></div>
    <div class="mb-pips"></div>
    <div class="mb-next"></div>
  </div>
  <div id="wanted"><div class="w-title">WANTED</div><div class="w-stars"></div></div>
  <div id="cash-block">
    <div class="cash-day"></div>
    <div class="cash-value"></div>
    <div class="cash-stars"></div>
  </div>
  <div id="weapons"></div>
  <div id="roster" class="panel">
    <div class="roster-head"><span class="roster-title">▲ HARBOUR WARDENS — RESPONSE</span><span class="roster-count"></span></div>
    <div class="roster-rows"></div>
    <div class="roster-foot"></div>
  </div>
  <div id="tide-banner" class="panel">
    <div class="tide-label"></div>
    <div class="tide-note"></div>
    <div class="tide-bar"><i></i></div>
  </div>
  <div id="insight-strip">IN SIGHT · search zone follows you</div>
  <div id="minimap-wrap">
    <canvas id="minimap" width="200" height="200"></canvas>
    <div id="district-label"></div>
    <div class="bars">
      <div class="bar-row"><span>HEALTH</span><div class="bar"><i id="bar-health"></i></div><b id="val-health"></b></div>
      <div class="bar-row"><span>ARMOUR</span><div class="bar"><i id="bar-armour"></i></div><b id="val-armour"></b></div>
      <div class="bar-row"><span>REP</span><div class="bar rep"><i id="bar-rep"></i></div><b id="val-rep"></b></div>
      <div class="bar-row"><span>DRIFT<br>GLASS</span><div class="bar glass"><i id="bar-glass"></i></div><b id="val-glass"></b></div>
    </div>
  </div>
  <div id="dialogue" class="panel">
    <div class="dlg-portrait"></div>
    <div class="dlg-body"><div class="dlg-name"></div><div class="dlg-line"></div></div>
  </div>
  <div id="radio" class="panel"><div class="radio-station"></div><div class="radio-track"></div></div>
  <div id="vehicle-card" class="panel">
    <div class="vc-name"></div>
    <div class="vc-cond"></div>
    <div class="vc-bar"><i></i></div>
    <div class="vc-speed"><span class="vc-num"></span><span class="vc-unit">km/h</span><span class="vc-gear"></span></div>
  </div>
  <div id="popups"></div>
  <div id="steal-prompt">E — STEAL CAR</div>
  <div id="controls">WASD drive / walk &nbsp;·&nbsp; <b>E</b> enter · steal car &nbsp;·&nbsp; <b>SPACE</b> brake &nbsp;·&nbsp; <b>F</b> shoot &nbsp;·&nbsp; <b>SHIFT</b> nitro &nbsp;·&nbsp; <b>M</b> map &nbsp;·&nbsp; <b>G</b> garage &nbsp;·&nbsp; <b>P</b> pause &nbsp;·&nbsp; mouse: look</div>
  <div id="mission-passed" class="panel">
    <div class="mp-title">MISSION PASSED</div>
    <div class="mp-reward">+$800 &nbsp;·&nbsp; +250 REP</div>
    <div class="mp-sub">MISSION 6 UNLOCKED · ODIE’S GARAGE UNLOCKED</div>
  </div>
  <div id="upgrade-panel" class="panel">
    <div class="up-head">Odie’s Spray &amp; Tune</div>
    <div class="up-sub">FERRYMAN GT “GULLWING” · LAMPERS’ ROW</div>
    <div class="up-stats"></div>
    <div class="up-rows"></div>
    <div class="up-foot">Number keys or click to buy · Esc to leave · Cash $9,180</div>
  </div>`;
}

const WEAPONS = [
  { n: 1, name: 'FISTS', ammo: '∞' },
  { n: 2, name: 'PISTOL', ammo: '48' },
  { n: 3, name: 'WRENCH', ammo: '—' },
  { n: 4, name: 'MOLOTOV', ammo: '3' },
  { n: 5, name: 'SMG', ammo: 'LOCKED' },
];

const STATUS_CLASS = { GROUNDED: 'st-grounded', PURSUIT: 'st-pursuit', ROADBLOCK: 'st-roadblock', SPOTLIGHT: 'st-spotlight', DOCKED: 'st-docked' };

export function updateHUD(state, shot) {
  const ch = state.chapter;
  $('mission-banner').querySelector('.mb-chapter').textContent = `CH. ${ch} / 7 — ${chapterTitle(ch)}`;
  $('mission-banner').querySelector('.mb-title').textContent = chapterTitle(ch);
  $('mission-banner').querySelector('.mb-objective').textContent =
    `${state.objective} · stage ${state.stage} of ${state.stages}`;
  $('mission-banner').querySelector('.mb-target').textContent = state.target;
  const pips = $('mission-banner').querySelector('.mb-pips');
  pips.innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="pip${i < 3 ? ' on' : ''}"></span>`).join('');
  $('mission-banner').querySelector('.mb-next').textContent = `NEXT: ${state.next}`;

  const stars = $('wanted').querySelector('.w-stars');
  stars.innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="star${i < state.wanted ? ' on' : ''}">★</span>`).join('');
  $('wanted').style.opacity = state.wanted === 0 ? 0.45 : 1;

  $('cash-block').querySelector('.cash-day').textContent =
    `DAY ${state.day} · ${state.clock} · BRINEHAVEN`;
  $('cash-block').querySelector('.cash-value').textContent = money(state.cash);
  $('cash-block').querySelector('.cash-stars').innerHTML =
    Array.from({ length: 5 }, (_, i) =>
      `<span class="star${i < state.wanted ? ' on' : ''}">★</span>`).join('');

  $('weapons').innerHTML = WEAPONS.map((w) =>
    `<div class="wslot${w.name === 'SMG' ? ' locked' : ''}"><span class="w-num">${w.n}</span><span class="w-name">${w.name}</span><span class="w-ammo">${w.ammo}</span></div>`).join('');

  // Roster: count sits INSIDE the header with real padding — never overlapping.
  const roster = makeRoster(state.tideHigh);
  $('roster').querySelector('.roster-count').textContent = `${roster.total} UNITS`;
  $('roster').querySelector('.roster-rows').innerHTML = roster.units.map((u) => `
    <div class="r-row">
      <span class="r-dot ${u.type === 'BOAT' ? 'boat' : u.type === 'AIR' ? 'air' : 'car'}"></span>
      <span class="r-name">${u.id}</span>
      <span class="r-type">${u.type}</span>
      <span class="r-dist">${u.dist}m</span>
      <span class="r-status ${STATUS_CLASS[u.status]}">${u.status}</span>
    </div>`).join('');
  $('roster').querySelector('.roster-foot').textContent = roster.footnote;

  const tide = $('tide-banner');
  tide.querySelector('.tide-label').textContent = state.tideLabel;
  tide.querySelector('.tide-note').textContent = state.tideHigh ? TIDE.chaseNote : TIDE.lowNote;
  tide.querySelector('.tide-bar i').style.width = state.tideHigh ? '86%' : '18%';
  $('insight-strip').style.display = shot === 'chase' ? 'block' : 'none';

  $('district-label').textContent = `${state.district} · BRINEHAVEN · ${state.clock}`;
  $('bar-health').style.width = `${state.health}%`;
  $('bar-armour').style.width = `${state.armour}%`;
  $('bar-rep').style.width = `${Math.min(100, state.rep / 15)}%`;
  $('bar-glass').style.width = `${(state.driftGlass / STORY.collectible.total) * 100}%`;
  $('val-health').textContent = state.health;
  $('val-armour').textContent = state.armour;
  $('val-rep').textContent = state.rep;
  $('val-glass').textContent = `${state.driftGlass}/24`;

  const d = state.dialogue;
  $('dialogue').querySelector('.dlg-portrait').textContent = d.initial;
  $('dialogue').querySelector('.dlg-name').textContent = `${d.name} — ${d.role}`;
  $('dialogue').querySelector('.dlg-line').textContent = d.line;

  $('radio').querySelector('.radio-station').innerHTML = `♪ ${STORY.radio.station}`;
  $('radio').querySelector('.radio-track').textContent = STORY.radio.track;

  $('vehicle-card').querySelector('.vc-name').textContent = STORY.vehicle.name;
  $('vehicle-card').querySelector('.vc-cond').textContent =
    `CONDITION ${state.condition}% · FUEL ${state.fuel}%`;
  $('vehicle-card').querySelector('.vc-bar i').style.width = `${state.condition}%`;
  $('vehicle-card').querySelector('.vc-num').textContent = state.speedKmh;
  $('vehicle-card').querySelector('.vc-gear').textContent = state.gear;

  $('popups').innerHTML = state.popups.map((p) => `<div class="popup">${p}</div>`).join('');
  $('steal-prompt').style.display = shot === 'onfoot' ? 'block' : 'none';

  // Garage-only panels
  $('mission-passed').style.display = shot === 'garage' ? 'block' : 'none';
  const up = $('upgrade-panel');
  up.style.display = shot === 'garage' ? 'block' : 'none';
  if (shot === 'garage') {
    up.querySelector('.up-stats').innerHTML = [
      ['TOP SPEED', 82], ['ACCELERATION', 74], ['ARMOUR', 52], ['HANDLING', 88],
    ].map(([label, v]) => `
      <div class="up-stat"><span>${label}</span><div class="up-bar"><i style="width:${v}%"></i></div></div>`).join('');
    up.querySelector('.up-rows').innerHTML = STORY.upgrades.map((u) => `
      <div class="up-row">
        <span class="up-key">${u.key}</span>
        <span class="up-name">${u.name}<small>${u.desc}</small></span>
        <span class="up-dots">${'●'.repeat(u.dots)}${'○'.repeat(3 - u.dots)}</span>
        <span class="up-price">${money(u.price)}</span>
      </div>`).join('');
  }
}

// Circular minimap with a REAL street grid: roads, causeway, district labels,
// player arrow, police dots, drift-glass markers, mission star.
export function drawMinimap(player, units, shot) {
  const cv = $('minimap');
  if (!cv) return;
  const g = cv.getContext('2d');
  const S = 200, C = S / 2;
  g.clearRect(0, 0, S, S);
  // water background
  g.fillStyle = '#12333d'; g.fillRect(0, 0, S, S);
  // land mass (island), player-centred, ~235 m across
  const scale = S / 235;
  const px = (x) => C + (x - player.x) * scale;
  const py = (z) => C + (z - player.z) * scale;
  g.fillStyle = '#1d3a42';
  g.fillRect(px(-205), py(-145), 410 * scale, 290 * scale);
  // causeway (flooded blue at high tide, grey at low)
  const cw = STREETS.causeway;
  g.strokeStyle = player.tideHigh ? '#3a8fa8' : '#8a7a62';
  g.lineWidth = 5;
  g.beginPath(); g.moveTo(px(cw.x), py(cw.z0)); g.lineTo(px(cw.x), py(cw.z1)); g.stroke();
  // streets: warm outline then bright core — legible at 200 px
  function street(x1, z1, x2, z2) {
    g.strokeStyle = '#7a6a52'; g.lineWidth = 5.5;
    g.beginPath(); g.moveTo(px(x1), py(z1)); g.lineTo(px(x2), py(z2)); g.stroke();
    g.strokeStyle = '#e8dcc0'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(px(x1), py(z1)); g.lineTo(px(x2), py(z2)); g.stroke();
  }
  for (const z of STREETS.avenues) street(STREETS.avenueSpan[0], z, STREETS.avenueSpan[1], z);
  for (const x of STREETS.streets) street(x, STREETS.streetSpan[0], x, STREETS.streetSpan[1]);
  // district labels (only those in view)
  g.font = 'bold 7.5px Verdana, sans-serif'; g.textAlign = 'center';
  g.fillStyle = '#f0e6d0';
  for (const d of DISTRICTS) {
    const x = px(d.x), y = py(d.z);
    if (x < 12 || x > S - 12 || y < 10 || y > S - 10) continue;
    g.fillText(d.name, x, y);
  }
  // drift glass diamonds
  g.fillStyle = '#7fe8d8';
  for (const [x, z] of [[18, -3], [42, 3], [-58, -3], [88, 3]]) {
    const X = px(x), Y = py(z);
    g.beginPath(); g.moveTo(X, Y - 3); g.lineTo(X + 3, Y); g.lineTo(X, Y + 3); g.lineTo(X - 3, Y); g.fill();
  }
  // police dots
  const unitPos = { 'WARDEN-4': [-8, -4], 'WARDEN-7': [26, 4], 'SKIFF-2': [190, -40], 'CUTTER-9': [196, 30], 'TERN-1': [30, -25] };
  for (const u of units) {
    const p = unitPos[u.id]; if (!p) continue;
    const X = px(p[0]), Y = py(p[1]);
    if (X < 4 || X > S - 4 || Y < 4 || Y > S - 4) continue;
    g.fillStyle = u.type === 'BOAT' ? '#4fa8d8' : u.type === 'AIR' ? '#ffb84d' : '#ff5a4d';
    g.beginPath(); g.arc(X, Y, 3.4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.stroke();
  }
  // mission star
  g.fillStyle = '#ffb84d';
  const mx = px(47), my = py(0);
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 2.5 : 5.5, a = (i * Math.PI) / 5 - Math.PI / 2;
    g[i ? 'lineTo' : 'moveTo'](mx + Math.cos(a) * r, my + Math.sin(a) * r);
  }
  g.closePath(); g.fill();
  // player arrow (centre), white with dark outline
  g.save();
  g.translate(C, C); g.rotate(player.heading || 0);
  g.fillStyle = '#ffffff'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, -8); g.lineTo(5.5, 6); g.lineTo(0, 3); g.lineTo(-5.5, 6); g.closePath();
  g.fill(); g.stroke(); g.restore();
  // north tick
  g.fillStyle = '#e8dcc0'; g.font = 'bold 9px Verdana, sans-serif'; g.textAlign = 'center';
  g.fillText('N', C, 12);
}
