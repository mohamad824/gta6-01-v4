// Tiny WebAudio ambience: engine hum that follows speed, and a soft
// BRINE FM pad. Starts only after a user gesture; silent in shot mode.
export function createAudio() {
  let ctx = null, engineOsc = null, engineGain = null, radioGain = null, started = false;
  function ensure() {
    if (started) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 55;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
      engineGain = ctx.createGain(); engineGain.gain.value = 0;
      engineOsc.connect(lp); lp.connect(engineGain); engineGain.connect(ctx.destination);
      engineOsc.start();
      // radio pad: two detuned triangles, slow swell
      const pad = ctx.createOscillator(); pad.type = 'triangle'; pad.frequency.value = 220;
      const pad2 = ctx.createOscillator(); pad2.type = 'triangle'; pad2.frequency.value = 277.18;
      radioGain = ctx.createGain(); radioGain.gain.value = 0.015;
      const padLp = ctx.createBiquadFilter(); padLp.type = 'lowpass'; padLp.frequency.value = 900;
      pad.connect(padLp); pad2.connect(padLp); padLp.connect(radioGain); radioGain.connect(ctx.destination);
      pad.start(); pad2.start();
      started = true;
    } catch { /* audio is decoration; never break the game */ }
  }
  return {
    unlock: ensure,
    setSpeed: (kmh) => {
      if (!started) return;
      engineOsc.frequency.value = 48 + kmh * 0.9;
      engineGain.gain.value = kmh > 1 ? 0.035 : 0.012;
    },
    setRadio: (on) => { if (started && radioGain) radioGain.gain.value = on ? 0.02 : 0; },
  };
}
