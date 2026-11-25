// Warung Rush — input: keyboard (WASD/panah + E/Spasi) dan mouse (klik).
// Modul ini hanya mencatat keadaan tombol; logika permainan yang menafsirkan.
export const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false, // E atau Spasi, ditahan
  interactPressed: false, // benar hanya pada frame tombol baru ditekan
};

let mouseClick = null; // { x, y } dalam koordinat canvas, dikonsumsi sekali
let mousePos = { x: 0, y: 0 };

const KEY_MAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  KeyE: 'interact',
  Space: 'interact',
};

export function attachInput(canvas, onFirstGesture, onPause, onMute) {
  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyP' || event.code === 'Escape') {
      onPause();
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyM') {
      onMute();
      return;
    }
    const name = KEY_MAP[event.code];
    if (!name) return;
    if (name === 'interact' && !keys.interact) keys.interactPressed = true;
    keys[name] = true;
    onFirstGesture();
    if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    const name = KEY_MAP[event.code];
    if (name) keys[name] = false;
  });
  window.addEventListener('blur', () => {
    keys.up = keys.down = keys.left = keys.right = keys.interact = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    mouseClick = { x, y };
    mousePos = { x, y };
    onFirstGesture();
  });
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mousePos = {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  });
}

/** Ambil klik yang menunggu (sekali pakai) lalu kosongkan. */
export function takeClick() {
  const click = mouseClick;
  mouseClick = null;
  return click;
}

export function getMousePos() {
  return mousePos;
}

/** Dipanggil tiap frame setelah logika membaca interactPressed. */
export function endFrameInput() {
  keys.interactPressed = false;
}
