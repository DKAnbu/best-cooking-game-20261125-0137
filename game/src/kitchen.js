// Warung Rush — kitchen: stasiun, barang bawaan koki, talenan, wajan,
// panggangan, piring rakitan, dan sampah. Semua aturan "apa yang terjadi
// saat E ditekan di stasiun X" tinggal di sini.
import { CHOP_SECONDS, FLOOR, INGREDIENTS, PANTRY_ORDER, PLAYER, STATIONS } from './config.js';
import { playChop, playDing, playFail, playPick, playPlace, playSizzle } from './audio.js';

export function createKitchen() {
  return {
    // Barang di tangan koki: null atau { id, chopped, cooked, perfect, burnt }
    hands: null,
    // Isi piring rakitan (maks 4): daftar item seperti di tangan.
    plate: [],
    // Proses potong yang sedang berjalan: { item, progress } atau null.
    chopping: null,
    // Masakan di wajan / panggangan: { station, item, elapsed } atau null.
    cooking: { wok: null, grill: null },
    // Efek singkat untuk render: { kind, x, y, until }
    effects: [],
    // Posisi koki.
    chef: { x: 640, y: 480 },
    // Tujuan jalan klik mouse (null = diam).
    moveTarget: null,
  };
}

/** Item bahan baru dari pantry. */
export function freshItem(id) {
  return { id, chopped: false, cooked: false, perfect: false, burnt: false };
}

function addEffect(kitchen, kind, x, y) {
  kitchen.effects.push({ kind, x, y, until: performance.now() + 600 });
  if (kitchen.effects.length > 12) kitchen.effects.shift();
}

/** Stasiun terdekat dari koki (dalam jangkauan sentuh), atau null. */
export function nearestStation(kitchen) {
  const { x, y } = kitchen.chef;
  let best = null;
  let bestDist = 78;
  for (const [name, s] of Object.entries(STATIONS)) {
    const cx = Math.max(s.x - s.w / 2, Math.min(x, s.x + s.w / 2));
    const cy = Math.max(s.y - s.h / 2, Math.min(y, s.y + s.h / 2));
    const d = Math.hypot(x - cx, y - cy);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return best;
}

/** Stasiun yang memuat titik (x, y) — dipakai klik mouse. */
export function stationAt(x, y) {
  for (const [name, s] of Object.entries(STATIONS)) {
    if (Math.abs(x - s.x) <= s.w / 2 && Math.abs(y - s.y) <= s.h / 2) return name;
  }
  return null;
}

/** Kotak klik tiap bahan di rak pantry (dipakai render + klik mouse). */
export function pantryBoxes() {
  const s = STATIONS.pantry;
  const boxes = [];
  const cols = 2;
  const cw = (s.w - 24) / cols;
  const ch = 40;
  PANTRY_ORDER.forEach((id, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    boxes.push({
      id,
      x: s.x - s.w / 2 + 8 + col * cw,
      y: s.y - s.h / 2 + 34 + row * ch,
      w: cw - 6,
      h: ch - 6,
    });
  });
  return boxes;
}

/** Ambil bahan dari pantry ke tangan (tangan harus kosong). */
export function takeIngredient(kitchen, id) {
  if (kitchen.hands) return false;
  kitchen.hands = freshItem(id);
  playPick();
  addEffect(kitchen, 'pick', kitchen.chef.x, kitchen.chef.y - 30);
  return true;
}

/** Buang isi tangan ke sampah. */
export function trashHands(kitchen) {
  if (!kitchen.hands) return false;
  kitchen.hands = null;
  kitchen.chopping = null;
  playFail();
  return true;
}

/**
 * Aksi konteks saat E ditekan di stasiun. Kembalikan string aksi untuk HUD:
 * 'took', 'chopped', 'cooking', 'took-cooked', 'plated', 'took-plate',
 * 'served?' (serve ditangani main.js), 'trashed', atau null.
 */
export function interact(kitchen, station, serveCallback) {
  const hands = kitchen.hands;
  if (station === 'pantry') {
    // Tanpa klik bahan spesifik: ambil bahan berikutnya dari rak (siklus).
    if (hands) return null;
    const id = PANTRY_ORDER[Math.floor(performance.now() / 900) % PANTRY_ORDER.length];
    takeIngredient(kitchen, id);
    return 'took';
  }
  if (station === 'trash') {
    if (trashHands(kitchen)) return 'trashed';
    if (kitchen.plate.length > 0) {
      kitchen.plate = [];
      playFail();
      return 'trashed';
    }
    return null;
  }
  if (station === 'chop') {
    if (kitchen.chopping) return null;
    if (!hands) return null;
    if (!INGREDIENTS[hands.id].chop || hands.chopped) return null;
    kitchen.chopping = { item: hands, progress: 0 };
    kitchen.hands = null;
    return 'chopping';
  }
  if (station === 'wok' || station === 'grill') {
    const slot = kitchen.cooking[station];
    if (slot) {
      // Angkat masakan: nilai dari timing bar (perfect / ok / gosong).
      const def = INGREDIENTS[slot.item.id];
      const t = slot.elapsed;
      kitchen.cooking[station] = null;
      if (hands) {
        // Tangan penuh: masakan jatuh kembali — jangan hanguskan, kembalikan.
        kitchen.cooking[station] = slot;
        return null;
      }
      if (t >= def.burnSeconds) {
        const burnt = { ...slot.item, burnt: true };
        kitchen.hands = burnt;
        playFail();
        return 'burnt';
      }
      const perfect = t >= def.cookSeconds * 0.8 && t <= def.cookSeconds * 1.25;
      kitchen.hands = { ...slot.item, cooked: true, perfect };
      if (perfect) playDing();
      else playPlace();
      return perfect ? 'perfect' : 'took-cooked';
    }
    if (!hands) return null;
    const def = INGREDIENTS[hands.id];
    if (def.cook !== station) return null;
    if (def.chop && !hands.chopped) return null;
    kitchen.cooking[station] = { station, item: hands, elapsed: 0 };
    kitchen.hands = null;
    playSizzle();
    return 'cooking';
  }
  if (station === 'plate') {
    if (hands) {
      if (kitchen.plate.length >= 4) return null;
      kitchen.plate.push(hands);
      kitchen.hands = null;
      playPlace();
      addEffect(kitchen, 'plate', STATIONS.plate.x, STATIONS.plate.y - 40);
      return 'plated';
    }
    if (kitchen.plate.length > 0) {
      kitchen.hands = kitchen.plate.pop();
      playPick();
      return 'took-plate';
    }
    return null;
  }
  if (station === 'serve') {
    if (serveCallback) return serveCallback();
    return null;
  }
  return null;
}

/** Maju proses potong (tahan E) dan masakan (timer wajan/panggangan). */
export function updateKitchen(kitchen, dt, holdingInteract, nearStation) {
  // Potong: hanya maju saat koki menahan E di dekat talenan.
  if (kitchen.chopping) {
    if (holdingInteract && nearStation === 'chop') {
      kitchen.chopping.progress += dt / CHOP_SECONDS;
      if (Math.random() < dt * 6) playChop();
      if (kitchen.chopping.progress >= 1) {
        kitchen.hands = { ...kitchen.chopping.item, chopped: true };
        kitchen.chopping = null;
        playPlace();
        addEffect(kitchen, 'chopped', STATIONS.chop.x, STATIONS.chop.y - 40);
      }
    }
  }
  for (const key of ['wok', 'grill']) {
    const slot = kitchen.cooking[key];
    if (slot) {
      slot.elapsed += dt;
      const def = INGREDIENTS[slot.item.id];
      if (slot.elapsed >= def.burnSeconds && !slot.burntNotified) {
        slot.burntNotified = true;
      }
    }
  }
  kitchen.effects = kitchen.effects.filter((e) => e.until > performance.now());
}

/** Gerakkan koki (keyboard atau menuju target klik), dibatasi lantai. */
export function moveChef(kitchen, dx, dy, dt) {
  const chef = kitchen.chef;
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    chef.x += (dx / len) * PLAYER.speed * dt;
    chef.y += (dy / len) * PLAYER.speed * dt;
  }
  chef.x = Math.max(FLOOR.x + 14, Math.min(FLOOR.x + FLOOR.w - 14, chef.x));
  chef.y = Math.max(FLOOR.y + 14, Math.min(FLOOR.y + FLOOR.h - 14, chef.y));
}

/** Jalan menuju target klik; true bila sudah sampai. */
export function stepTowardTarget(kitchen, dt) {
  if (!kitchen.moveTarget) return true;
  const dx = kitchen.moveTarget.x - kitchen.chef.x;
  const dy = kitchen.moveTarget.y - kitchen.chef.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 14) {
    kitchen.moveTarget = null;
    return true;
  }
  moveChef(kitchen, dx, dy, dt);
  return false;
}

/** Titik berdiri di depan stasiun (tempat koki berhenti saat klik stasiun). */
export function standPoint(station) {
  const s = STATIONS[station];
  if (station === 'pantry') return { x: s.x + s.w / 2 + 34, y: s.y };
  if (station === 'serve') return { x: s.x - s.w / 2 - 34, y: s.y };
  if (station === 'trash') return { x: s.x + s.w / 2 + 34, y: s.y };
  return { x: s.x, y: s.y + s.h / 2 + 34 };
}
