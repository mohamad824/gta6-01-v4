// Keyboard + mouse input: WASD drive/walk, E enter/steal, SPACE brake,
// F shoot, SHIFT nitro, M map, G garage, P pause. Mouse drag looks around.
export function createInput() {
  const keys = new Set();
  let lookDX = 0, lookDY = 0;
  let dragging = false, lastX = 0, lastY = 0;
  const pressed = new Set(); // edge-triggered keys, consumed by the game

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys.add(e.code);
    pressed.add(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  const canvas = document.getElementById('game');
  if (canvas) {
    canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('mouseup', () => { dragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      lookDX += e.clientX - lastX; lookDY += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
    });
  }
  return {
    down: (code) => keys.has(code),
    wasPressed: (code) => { const p = pressed.has(code); pressed.delete(code); return p; },
    consumeLook: () => { const d = { dx: lookDX, dy: lookDY }; lookDX = 0; lookDY = 0; return d; },
    axis: () => ({
      throttle: (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 0.6 : 0),
      steer: (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) - (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0),
      brake: keys.has('Space'),
      nitro: keys.has('ShiftLeft') || keys.has('ShiftRight'),
      shoot: keys.has('KeyF'),
    }),
  };
}
