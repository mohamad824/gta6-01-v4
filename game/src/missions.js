// Missions, progression and save: 7 chapters, REP ladder, cash, drift glass,
// wanted level, tide clock. The game state the HUD reads and the shots set.
import { STORY, CASH } from './config.js';

export function initialState() {
  return {
    chapter: 4, cash: CASH.chase, rep: 720, repName: 'TIDE RUNNER',
    wanted: 4, health: 82, armour: 64, driftGlass: 4,
    day: 2, clock: '18:42', district: 'GULLGATE',
    tideHigh: true, tideLabel: 'HIGH TIDE 18:42',
    speedKmh: 132, gear: 'G4', condition: 87, fuel: 71,
    carsStolen: 3, escapes: 2, accuracy: 61, timePlayedMin: 47, debtLeft: 8900,
    missionsDone: 3, onFoot: false, inGarage: false, mapOpen: false,
    objective: 'Cross the flooded causeway before the tide turns',
    target: 'TARGET 47m · TIDE TURNS IN 5H 41M',
    next: 'Reach the Gullgate safehouse',
    stage: 2, stages: 2,
    dialogue: {
      initial: 'T', name: 'TESS LUMEN', role: 'GETAWAY DRIVER',
      line: '“Hold her steady, Nadia — the water’s up to the lamps and Greer’s boats are faster than they look.”',
    },
    popups: ['DRIFT +$120', 'NEAR MISS +$300'],
  };
}

export function stateForShot(shot) {
  const s = initialState();
  if (shot === 'onfoot') {
    Object.assign(s, {
      chapter: 2, cash: CASH.onfoot, rep: 0, repName: 'DECKHAND', wanted: 2,
      health: 64, armour: 52, day: 1, clock: '17:45', district: 'LOW QUAY',
      tideHigh: false, tideLabel: 'LOW TIDE 17:45', speedKmh: 0, gear: '—',
      onFoot: true, objective: 'Run the mudflat shortcut before the tide turns',
      target: '4/7 DOWN · TARGET 18m', next: 'Lose the Wardens in Saltmarket',
      stage: 2, stages: 2,
      dialogue: {
        initial: 'C', name: 'CUTTER BANE', role: 'SALTJACKS · RIVAL CREW',
        line: '“Brinehaven belongs to the Saltjacks, Ferro. You’re trespassing on our docks.”',
      },
      popups: ['GUNMAN DOWN +$120'],
    });
  } else if (shot === 'map') {
    s.mapOpen = true;
  } else if (shot === 'garage') {
    Object.assign(s, {
      chapter: 5, cash: CASH.garage, rep: 970, repName: 'TIDE RUNNER', wanted: 0,
      health: 82, armour: 64, day: 2, clock: '21:12', district: 'LAMPERS’ ROW',
      tideHigh: true, tideLabel: 'HIGH TIDE 21:12', speedKmh: 0, gear: 'GN',
      inGarage: true, objective: 'Outrun the Wardens under the causeway lamps',
      target: 'TARGET 150m · TIDE TURNS IN 3H 12M', next: 'Lose Greer before the tide turns',
      dialogue: {
        initial: 'O', name: 'ODIE STRAND', role: 'MECHANIC · LAMPERS’ ROW',
        line: '“She’ll do 200 now, Nadia. The Gullwing’s the fastest thing on the causeway — don’t scratch her.”',
      },
      popups: [],
    });
  }
  return s;
}

export function chapterTitle(n) {
  const ch = STORY.chapters.find((c) => c.n === n);
  return ch ? ch.title.toUpperCase() : '';
}

export function repNameFor(rep) {
  if (rep >= 1500) return 'HARBOUR GHOST';
  if (rep >= 700) return 'TIDE RUNNER';
  if (rep >= 250) return 'FERRYHAND';
  return 'DECKHAND';
}

const SAVE_KEY = 'brinehaven-save-v4';
export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      chapter: state.chapter, cash: state.cash, rep: state.rep,
      driftGlass: state.driftGlass, carsStolen: state.carsStolen,
      escapes: state.escapes, accuracy: state.accuracy,
      timePlayedMin: state.timePlayedMin, debtLeft: state.debtLeft,
    }));
    return true;
  } catch { return false; }
}
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
