// Full island map / pause screen (fix c): a proper island street grid with
// labelled districts, tide chart, 7 chapters, crew and real stats — modelled
// on the v2 island-grid cartography.
import { STREETS, DISTRICTS, STORY, TIDE } from './config.js';

const $ = (id) => document.getElementById(id);
const money = (n) => '$' + n.toLocaleString('en-US');

export function buildMapOverlay() {
  $('map-overlay').innerHTML = `
  <div id="map-panel" class="panel">
    <div class="map-title">BRINE<span>HAVEN</span></div>
    <div class="map-sub">ISLAND MAP · TIDE CHART · SEVEN JOBS · CREW · SAVE SLOT 1 · DAY 2 · 18:42 · $5,940</div>
    <div class="map-cols">
      <div class="map-left">
        <canvas id="island-map" width="640" height="300"></canvas>
        <canvas id="tide-chart" width="640" height="86"></canvas>
        <div class="map-legend">LEGEND — ● You &nbsp; ▲ Wardens &nbsp; ◆ Drift Glass &nbsp; ★ Mission &nbsp; ▦ Garage &nbsp;·&nbsp; blue water = flooded causeway &nbsp;·&nbsp; amber = mudflat shortcut, open at low tide</div>
        <button id="map-close" type="button">CLOSE MAP (M)</button>
      </div>
      <div class="map-right">
        <div class="map-sec">CHAPTERS — 7 TIDES</div>
        <div class="map-chapters"></div>
        <div class="map-sec">CREW</div>
        <div class="map-crew"></div>
        <div class="map-sec">STATS</div>
        <div class="map-stats"></div>
      </div>
    </div>
  </div>`;
}

function drawIslandMap() {
  const cv = $('island-map');
  const g = cv.getContext('2d');
  const W = 640, H = 300;
  g.clearRect(0, 0, W, H);
  // sea
  g.fillStyle = '#17434f'; g.fillRect(0, 0, W, H);
  // island landmass: rounded shape
  const ix0 = 28, ix1 = 612, iz0 = 18, iz1 = 282;
  const X = (x) => ix0 + ((x + 205) / 410) * (ix1 - ix0);
  const Z = (z) => iz0 + ((z + 145) / 290) * (iz1 - iz0);
  g.fillStyle = '#2a4a52';
  roundRect(g, ix0, iz0, ix1 - ix0, iz1 - iz0, 26); g.fill();
  // beach rim
  g.strokeStyle = '#8a7a5e'; g.lineWidth = 3;
  roundRect(g, ix0, iz0, ix1 - ix0, iz1 - iz0, 26); g.stroke();
  // mudflat strip on the east shore (amber)
  g.fillStyle = '#b98d5f';
  g.fillRect(X(196), Z(-120), X(205) - X(196), Z(120) - Z(-120));
  // street grid: dark groove then pale core
  function street(x1, z1, x2, z2) {
    g.strokeStyle = '#16282e'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(X(x1), Z(z1)); g.lineTo(X(x2), Z(z2)); g.stroke();
    g.strokeStyle = '#d8c9a8'; g.lineWidth = 4.5;
    g.beginPath(); g.moveTo(X(x1), Z(z1)); g.lineTo(X(x2), Z(z2)); g.stroke();
  }
  for (const z of STREETS.avenues) street(STREETS.avenueSpan[0], z, STREETS.avenueSpan[1], z);
  for (const x of STREETS.streets) street(x, STREETS.streetSpan[0], x, STREETS.streetSpan[1]);
  // causeway south, into the water, flooded blue at high tide
  const cw = STREETS.causeway;
  g.strokeStyle = '#3a8fa8'; g.lineWidth = 10;
  g.beginPath(); g.moveTo(X(cw.x), Z(cw.z0)); g.lineTo(X(cw.x), Z(300)); g.stroke();
  g.strokeStyle = '#d8c9a8'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(X(cw.x), Z(cw.z0)); g.lineTo(X(cw.x), Z(300)); g.stroke();
  g.fillStyle = '#7fd0e8'; g.font = 'bold 10px Verdana, sans-serif'; g.textAlign = 'left';
  g.fillText('THE CAUSEWAY · FLOODED', X(cw.x) + 12, 292);
  // district labels
  g.font = 'bold 13px Verdana, sans-serif'; g.fillStyle = '#f0e6d0';
  g.textAlign = 'center';
  for (const d of DISTRICTS) {
    if (d.name === 'THE CAUSEWAY') continue;
    g.fillText(d.name, X(d.x), Z(d.z));
  }
  g.fillStyle = '#ffb84d'; g.font = 'bold 11px Verdana, sans-serif';
  // (THE CAUSEWAY label sits beside the causeway at the canvas bottom edge)
  // markers
  marker(g, X(0), Z(0), 'you');
  marker(g, X(-8), Z(-4), 'warden');
  marker(g, X(26), Z(4), 'warden');
  marker(g, X(18), Z(-3), 'glass');
  marker(g, X(47), Z(0), 'mission');
  marker(g, X(-130), Z(95), 'garage');
  g.fillStyle = '#ffffff'; g.font = 'bold 10px Verdana, sans-serif'; g.textAlign = 'left';
  g.fillText('▼ YOU — NADIA', X(4), Z(14));
  g.fillStyle = '#ffd98a'; g.fillText('▦ ODIE’S GARAGE', X(-158), Z(112));
}

function marker(g, x, y, kind) {
  g.save(); g.translate(x, y);
  if (kind === 'you') {
    g.fillStyle = '#ffffff'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(0, 0, 2.5, 0, Math.PI * 2); g.fill();
  } else if (kind === 'warden') {
    g.fillStyle = '#ff5a4d';
    g.beginPath(); g.moveTo(0, -6); g.lineTo(5, 5); g.lineTo(-5, 5); g.closePath(); g.fill();
  } else if (kind === 'glass') {
    g.fillStyle = '#7fe8d8';
    g.beginPath(); g.moveTo(0, -5); g.lineTo(5, 0); g.lineTo(0, 5); g.lineTo(-5, 0); g.closePath(); g.fill();
  } else if (kind === 'mission') {
    g.fillStyle = '#ffb84d';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 3 : 7, a = (i * Math.PI) / 5 - Math.PI / 2;
      g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill();
  } else if (kind === 'garage') {
    g.fillStyle = '#ff7ad9'; g.fillRect(-5, -5, 10, 10);
    g.fillStyle = '#1c1420'; g.font = 'bold 8px Verdana'; g.textAlign = 'center'; g.fillText('G', 0, 3);
  }
  g.restore();
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function drawTideChart() {
  const cv = $('tide-chart');
  const g = cv.getContext('2d');
  const W = 640, H = 86;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#12262e'; g.fillRect(0, 0, W, H);
  // flood line
  g.strokeStyle = '#c9a06a'; g.setLineDash([6, 4]); g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, 26); g.lineTo(W, 26); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#c9a06a'; g.font = 'bold 9px Verdana, sans-serif'; g.textAlign = 'left';
  g.fillText('CAUSEWAY FLOODS ABOVE THIS LINE', 8, 20);
  // tide curve: two full cycles over 24 h
  g.strokeStyle = '#9fd8e8'; g.lineWidth = 2.5;
  g.beginPath();
  for (let x = 0; x <= W; x++) {
    const t = x / W; // 0..1 = 00:00..24:00
    const y = 48 - Math.sin(t * Math.PI * 4 - Math.PI / 2 + 0.6) * 22;
    g[x ? 'lineTo' : 'moveTo'](x, y);
  }
  g.stroke();
  // NOW marker at 18:42 (t = 0.779)
  const nx = 0.779 * W;
  const ny = 48 - Math.sin(0.779 * Math.PI * 4 - Math.PI / 2 + 0.6) * 22;
  g.fillStyle = '#ffb84d';
  g.beginPath(); g.arc(nx, ny, 5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = '#ffffff'; g.font = 'bold 10px Verdana, sans-serif'; g.textAlign = 'right';
  g.fillText(`NOW · HIGH TIDE · next high tide in ${TIDE.nextHighMin} min`, W - 8, 14);
  // hour ticks
  g.fillStyle = '#8a9a9e'; g.font = '9px Verdana, sans-serif'; g.textAlign = 'center';
  for (const [label, t] of [['00:00', 0], ['06:00', 0.25], ['12:00', 0.5], ['18:00', 0.75], ['24:00', 1]]) {
    g.fillText(label, t * W, H - 6);
  }
}

export function showMapOverlay(state) {
  buildMapOverlay();
  drawIslandMap();
  drawTideChart();
  const ch = document.querySelector('.map-chapters');
  ch.innerHTML = STORY.chapters.map((c) => `
    <div class="map-ch-row ${c.state === 'ACTIVE' ? 'active' : ''}">
      <span>CH.${c.n} — ${c.title}</span>
      <span class="map-ch-state ${c.state.toLowerCase()}">${c.state} · ${money(c.pay)}</span>
    </div>`).join('');
  document.querySelector('.map-crew').innerHTML = STORY.crew.map((m) => `
    <div class="map-crew-row"><span>${m.name}</span><span>${m.role}</span></div>`).join('');
  document.querySelector('.map-stats').innerHTML = [
    ['Cash', money(state.cash)],
    ['REP', `${state.repName} · ${state.rep}`],
    ['Missions done', '3/7'],
    ['Completion', '43%'],
    ['Cars stolen', String(state.carsStolen)],
    ['Escapes', String(state.escapes)],
    ['Shooting accuracy', `${state.accuracy}%`],
    ['Drift Glass', `${state.driftGlass}/24`],
    ['Debt left', money(state.debtLeft)],
    ['Time played', `${state.timePlayedMin} min`],
  ].map(([k, v]) => `<div class="map-stat-row"><span>${k}</span><b>${v}</b></div>`).join('');
  $('map-overlay').style.display = 'flex';
  $('map-close').addEventListener('click', () => { $('map-overlay').style.display = 'none'; });
}

export function hideMapOverlay() {
  $('map-overlay').style.display = 'none';
}
