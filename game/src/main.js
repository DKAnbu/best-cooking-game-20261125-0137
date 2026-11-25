// Warung Rush — main: loop permainan, mesin state (judul / main / jeda /
// selesai), dan penghubung input → dapur → order → skor. Satu-satunya
// file yang tahu soal waktu shift dan kapan order disajikan.
import { COMBO_MAX, SHIFT_SECONDS, VIEW } from './config.js';
import { attachInput, endFrameInput, getMousePos, keys, takeClick } from './input.js';
import { createKitchen, interact, moveChef, nearestStation, pantryBoxes, standPoint, stationAt, stepTowardTarget, takeIngredient, trashHands, updateKitchen } from './kitchen.js';
import { createOrderState, findMatchingOrder, tipFor, updateOrders } from './orders.js';
import { render, SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { isMuted, playBurnt, playFail, playServe, toggleMute, unlockAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

export function createGame() {
  return {
    kitchen: createKitchen(),
    orders: createOrderState(),
    screen: SCREEN_TITLE,
    score: 0,
    coins: 0,
    combo: 1,
    bestCombo: 1,
    served: 0,
    missed: 0,
    timeLeft: SHIFT_SECONDS,
    message: '',
    messageUntil: 0,
    muted: false,
    holdingInteract: false,
    clickAction: null, // { station } yang dituju klik mouse
    elapsed: 0,
  };
}

const game = createGame();

// Hook debug untuk playtest otomatis (tidak memengaruhi permainan).
window.__warung = game;

function showMessage(text, seconds = 2.2) {
  game.message = text;
  game.messageUntil = performance.now() + seconds * 1000;
}

function startShift() {
  const fresh = createGame();
  Object.assign(game, fresh, { screen: SCREEN_PLAY });
  showMessage('Shift dimulai! Order pertama datang… 🍜');
}

function servePlate() {
  const plate = game.kitchen.plate;
  if (plate.length === 0) {
    showMessage('Piring masih kosong — rakit dulu di stasiun PIRING.');
    return 'empty';
  }
  const order = findMatchingOrder(game.orders.active, plate);
  if (!order) {
    showMessage('Tidak ada order yang cocok dengan piring ini. Cek resep di tiket!');
    playFail();
    return 'nomatch';
  }
  const tip = tipFor(order);
  const earned = Math.round((100 + tip) * game.combo);
  game.score += earned;
  game.coins += earned;
  game.served += 1;
  game.combo = Math.min(COMBO_MAX, game.combo + 1);
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.orders.active.splice(game.orders.active.indexOf(order), 1);
  game.kitchen.plate = [];
  playServe();
  showMessage(`Disajikan! +${earned} poin (kombo x${game.combo - 1} → x${game.combo}) 🎉`);
  return 'served';
}

function onExpired(order) {
  game.missed += 1;
  game.combo = 1;
  playFail();
  showMessage('Pelanggan kabur, order hangus! Kombo putus. 💨');
}

function togglePause() {
  if (game.screen === SCREEN_PLAY) {
    game.screen = SCREEN_PAUSE;
  } else if (game.screen === SCREEN_PAUSE) {
    game.screen = SCREEN_PLAY;
  }
}

function toggleMuteHandler() {
  game.muted = toggleMute();
  showMessage(game.muted ? 'Suara dimatikan 🔇' : 'Suara dinyalakan 🔊');
}

attachInput(
  canvas,
  () => unlockAudio(),
  togglePause,
  toggleMuteHandler,
);

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyR' && game.screen === SCREEN_OVER) startShift();
  if ((event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyE') && game.screen === SCREEN_TITLE) startShift();
});

/** Klik mouse: pilih bahan pantry, atau jalan ke stasiun lalu pakai. */
function handleClick(click) {
  if (game.screen === SCREEN_TITLE) {
    startShift();
    return;
  }
  if (game.screen !== SCREEN_PLAY) return;
  // Klik bahan di rak pantry: ambil langsung.
  for (const box of pantryBoxes()) {
    if (click.x >= box.x && click.x <= box.x + box.w && click.y >= box.y && click.y <= box.y + box.h) {
      if (game.kitchen.hands) {
        showMessage('Tangan sudah penuh — antar/buang dulu.');
        return;
      }
      takeIngredient(game.kitchen, box.id);
      showMessage(`Ambil ${box.id}.`);
      return;
    }
  }
  const station = stationAt(click.x, click.y);
  if (station) {
    game.clickAction = { station };
    game.kitchen.moveTarget = standPoint(station);
  } else if (click.y > 230) {
    // Klik lantai kosong: jalan ke sana.
    game.clickAction = null;
    game.kitchen.moveTarget = { x: click.x, y: click.y };
  }
}

/** Jalankan aksi konteks stasiun terdekat (tombol E / klik tiba). */
function doInteract() {
  const station = nearestStation(game.kitchen);
  if (!station) {
    showMessage('Dekati stasiun dulu — panah kuning menandai stasiun terdekat.');
    return;
  }
  if (station === 'serve') {
    servePlate();
    return;
  }
  const result = interact(game.kitchen, station, null);
  const messages = {
    took: 'Bahan diambil.',
    chopping: 'Potong! Tahan E sampai selesai ✂',
    cooking: 'Masuk wajan/panggangan… angkat pas hijau! 🍳',
    'took-cooked': 'Matang! Taruh di piring.',
    perfect: 'PERFECT! ★ Masakan sempurna.',
    burnt: 'Gosong! Buang ke sampah. 🔥',
    plated: 'Ditaruh di piring 🍽️',
    'took-plate': 'Diambil lagi dari piring.',
    trashed: 'Dibuang ke sampah.',
  };
  if (result && messages[result]) {
    if (result === 'burnt') playBurnt();
    showMessage(messages[result]);
  } else if (result === null) {
    // Petunjuk kontekstual saat E tidak bisa dipakai di sini.
    const hints = {
      pantry: 'Tangan penuh, atau klik bahan di rak.',
      chop: 'Bawa bahan yang bisa dipotong (ayam/sayur/tahu/pisang).',
      wok: 'Bawa bahan untuk wajan (nasi/mie/telur/pisang potong).',
      grill: 'Bawa ayam yang sudah dipotong.',
      plate: 'Bawa bahan matang/potong untuk dirakit.',
      trash: 'Tidak ada yang bisa dibuang.',
    };
    showMessage(hints[station] ?? 'Tidak bisa di sini.');
  }
}

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  const click = takeClick();
  if (click) handleClick(click);

  if (game.screen === SCREEN_PLAY) {
    game.elapsed += dt;
    game.timeLeft -= dt;
    if (game.timeLeft <= 0) {
      game.timeLeft = 0;
      game.screen = SCREEN_OVER;
      showMessage('');
    } else {
      updateOrders(game.orders, dt, onExpired);
      // Gerak keyboard.
      let dx = 0;
      let dy = 0;
      if (keys.up) dy -= 1;
      if (keys.down) dy += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;
      if (dx !== 0 || dy !== 0) {
        game.kitchen.moveTarget = null;
        game.clickAction = null;
        moveChef(game.kitchen, dx, dy, dt);
      } else if (game.kitchen.moveTarget) {
        const arrived = stepTowardTarget(game.kitchen, dt);
        if (arrived && game.clickAction) {
          const station = game.clickAction.station;
          game.clickAction = null;
          if (station === 'serve') {
            servePlate();
          } else {
            const r = interact(game.kitchen, station, null);
            if (r === 'burnt') playBurnt();
          }
        }
      }
      game.holdingInteract = keys.interact;
      if (keys.interactPressed) doInteract();
      updateKitchen(game.kitchen, dt, keys.interact, nearestStation(game.kitchen));
      if (game.message && now > game.messageUntil) game.message = '';
    }
  } else if (game.screen === SCREEN_OVER) {
    // Biarkan dapur tetap terlihat di balik overlay akhir.
    updateKitchen(game.kitchen, 0, false, null);
  }

  render(ctx, game);
  endFrameInput();
  requestAnimationFrame(frame);
}

// Mode screenshot deterministik (?shot=cover|play|rush|end) untuk shots.json.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  const staged = stageShot(shot, game);
  game.screen = staged.screen;
  game.score = staged.score;
  game.coins = staged.score;
  game.timeLeft = staged.timeLeft;
  game.combo = staged.combo;
  game.served = staged.served;
  game.bestCombo = staged.combo;
  showMessage(staged.message);
  // Gambar sekali lalu berhenti — Playwright memotret frame statis ini.
  render(ctx, game);
} else {
  requestAnimationFrame(frame);
}
