// BRINEHAVEN — story, HUD copy and tuning constants for gta6-01 v4.
// Everything here is original: our city, our people, our numbers.
export const STORY = {
  city: 'BRINEHAVEN',
  tagline: 'A tidal island city. The causeway floods twice a day — and so do the odds.',
  protagonist: { name: 'Nadia Ferro', role: 'PROTAGONIST · ex-ferry pilot', debt: 12400 },
  fixer: { name: 'Bram Okafor', role: 'FIXER · the seven jobs' },
  detective: { name: 'Anselm Greer', role: 'DETECTIVE · Harbour Wardens' },
  crew: [
    { name: 'Nadia Ferro', role: 'PROTAGONIST · ex-ferry pilot' },
    { name: 'Bram Okafor', role: 'FIXER · the seven jobs' },
    { name: 'Tess Lumen', role: 'GETAWAY DRIVER' },
    { name: 'Odie Strand', role: 'MECHANIC · Lampers’ Row garage' },
    { name: 'Pip Halden', role: 'INFORMANT · Saltmarket' },
    { name: 'Anselm Greer', role: 'DETECTIVE · Harbour Wardens' },
  ],
  chapters: [
    { n: 1, title: 'First Crossing', pay: 800, state: 'DONE' },
    { n: 2, title: 'Mudflat Run', pay: 1200, state: 'DONE' },
    { n: 3, title: 'The Salt Ledger', pay: 1500, state: 'DONE' },
    { n: 4, title: 'High Water', pay: 800, state: 'ACTIVE' },
    { n: 5, title: 'Causeway Lights', pay: 2000, state: 'LOCKED' },
    { n: 6, title: 'The Long Night', pay: 2600, state: 'LOCKED' },
    { n: 7, title: 'Ebb Tide', pay: 3400, state: 'LOCKED' },
  ],
  repLadder: ['DECKHAND', 'FERRYHAND', 'TIDE RUNNER', 'HARBOUR GHOST'],
  radio: { station: 'BRINE FM 91.4', track: '“Low Tide” — The Salt Choir' },
  vehicle: { name: 'FERRYMAN GT “GULLWING”', condition: 87, fuel: 71 },
  collectible: { name: 'DRIFT GLASS', found: 4, total: 24 },
  upgrades: [
    { key: '1', name: 'ENGINE', desc: 'Top speed +30% · unlocks at REP 5', price: 5000, dots: 0 },
    { key: '2', name: 'ARMOUR PLATING', desc: 'Takes twice the hits', price: 1800, dots: 0 },
    { key: '3', name: 'NITRO', desc: 'SHIFT boost, longer burn', price: 3000, dots: 0 },
    { key: '4', name: 'REPAIR', desc: 'Condition back to 100%', price: 250, dots: 3 },
    { key: '5', name: 'RESPRAY', desc: 'New colour, clears wanted level', price: 100, dots: 3 },
  ],
};

// Cash arc across the four frames (distinct, moves, never a kit default).
export const CASH = { onfoot: 2760, chase: 5940, map: 5940, garage: 9180 };

// Golden-hour palette, sampled from the brief: warm but natural, never monochrome.
export const PALETTE = {
  skyTop: '#7d5a8e', skyMid: '#c8758a', skyHorizon: '#e77f25',
  sunCore: '#ffd9a0', sunDisc: '#ff9e4a',
  roadSunlit: '#df7c40', asphalt: '#6f6156', asphaltDark: '#574a41', asphaltLight: '#8a7a6c',
  sidewalk: '#b39a80', curb: '#8f7a68',
  heroCar: '#ff8d4c', cashGreen: '#87e397',
  buildingPale: '#ebe3dc', buildingSand: '#d9b48f', buildingBrick: '#c98f6a', buildingTeal: '#b7c4c9',
  waterSea: '#2e6f7e', waterFlood: '#3a7d8c', mudflat: '#b98d5f',
  fog: '#cf9468',
};

export const TIDE = {
  // tide phase in [0,1): 0 = low, 0.5 = high. Chase is high tide, on-foot is low.
  highAt: 0.5, lowAt: 0.0,
  chaseLabel: 'HIGH TIDE 18:42',
  chaseNote: 'CAUSEWAY FLOODED — boats out, cruisers grounded',
  lowLabel: 'LOW TIDE 17:45',
  lowNote: 'MUDFLATS OPEN — smuggler’s shortcut marked on the map',
  nextHighMin: 342,
};

export const DISTRICTS = [
  { name: 'SALTMARKET', x: -130, z: -95 },
  { name: 'GULLGATE', x: -10, z: -95 },
  { name: 'LOW QUAY', x: 135, z: -95 },
  { name: 'LAMPERS’ ROW', x: -130, z: 95 },
  { name: 'FERRY ROW', x: 120, z: 95 },
  { name: 'THE CAUSEWAY', x: 0, z: 175 },
];

// Street grid shared by the 3D city, the minimap and the full map (metres).
export const STREETS = {
  avenues: [-120, -60, 0, 60, 120], // east–west roads, z = const, x from -200..200
  streets: [-180, -120, -60, 0, 60, 120, 180], // north–south roads, x = const, z from -140..140
  avenueSpan: [-200, 200],
  streetSpan: [-140, 140],
  roadWidth: 14,
  causeway: { x: 0, z0: 120, z1: 232, width: 12 },
  island: { x0: -205, x1: 205, z0: -145, z1: 145 },
};

export const SHOP_SIGNS = [
  'SALT & ANCHOR', 'GULLWING MOTORS', 'BRINE FM', 'FERRY OFFICE', 'TIDE TACKLE',
  'LAMPERS’ DELI', 'THE DRIFT INN', 'HALDEN’S MAPS', 'QUAY BAIT CO.', 'FERRO FERRIES',
  'LOW TIDE CAFÉ', 'WARDEN OUTPOST', 'GLASS & GULL', 'NIGHT FERRY BAR',
];
