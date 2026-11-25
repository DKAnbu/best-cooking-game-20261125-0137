// Warung Rush — render: semua gambar digambar dengan Canvas 2D (bentuk +
// emoji, tanpa aset luar). Satu frame = dapur, order board, pelanggan,
// stasiun, koki, HUD timer/skor/kombo, dan layar judul / jeda / akhir.
import { CUSTOMER_SLOTS, FLOOR, INGREDIENTS, PANTRY_ORDER, RECIPE_BY_ID, SHIFT_SECONDS, STATIONS, VIEW } from './config.js';
import { customerPos } from './orders.js';
import { pantryBoxes } from './kitchen.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';

const FONT = "'Trebuchet MS', 'Segoe UI', sans-serif";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function itemEmoji(item) {
  const base = INGREDIENTS[item.id].emoji;
  if (item.burnt) return '🔥';
  return base;
}

function itemLabel(item) {
  const def = INGREDIENTS[item.id];
  let label = def.name;
  if (item.burnt) label += ' gosong';
  else if (item.cooked) label += item.perfect ? ' ★' : ' matang';
  else if (item.chopped) label += ' potong';
  return label;
}

/** Bar kesabaran / masak / potong generik. */
function bar(ctx, x, y, w, h, fraction, fill, bg = 'rgba(0,0,0,0.25)') {
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const f = Math.max(0, Math.min(1, fraction));
  if (f > 0) {
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, w * f, h, h / 2);
    ctx.fill();
  }
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = RECIPE_BY_ID[order.recipeId];
  const frac = Math.max(0, order.patience / order.patienceMax);
  const urgent = frac < 0.35;
  ctx.fillStyle = urgent && Math.floor(performance.now() / 300) % 2 === 0 ? '#ffe3e3' : '#fff8e7';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#e05252' : '#d9a441';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, recipe.emoji, x + 13, y + 13, 16, '#333');
  text(ctx, recipe.name, x + 28, y + 13, recipe.name.length > 11 ? 10 : 11, '#333', 'left');
  const needs = recipe.needs.map((n) => {
    const ing = INGREDIENTS[n.id];
    const mark = n.olah === 'raw' ? '' : n.olah === 'chopped' ? ' ✂' : n.olah === 'perfect' ? ' ★' : ' 🍳';
    return `${ing.emoji}${mark}`;
  }).join(' ');
  text(ctx, needs, x + 8, y + 32, 12, '#555', 'left');
  bar(ctx, x + 8, y + h - 11, w - 16, 7, frac, frac < 0.35 ? '#e05252' : frac < 0.6 ? '#f2a541' : '#7bc96f');
}

function drawCustomer(ctx, order) {
  const pos = customerPos(order);
  const frac = Math.max(0, order.patience / order.patienceMax);
  ctx.font = '34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(order.face, pos.x, pos.y);
  // Gelembung order kecil di atas kepala pelanggan.
  const recipe = RECIPE_BY_ID[order.recipeId];
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, pos.x + 16, pos.y - 34, 44, 30, 8);
  ctx.fill();
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, recipe.emoji, pos.x + 38, pos.y - 18, 20, '#333');
  bar(ctx, pos.x - 26, pos.y + 26, 52, 6, frac, frac < 0.35 ? '#e05252' : '#7bc96f');
}

function drawStation(ctx, name, kitchen, nearest) {
  const s = STATIONS[name];
  const active = nearest === name;
  ctx.fillStyle = active ? '#8a5a2b' : '#6b4423';
  roundRect(ctx, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = active ? '#b07a3e' : '#96682f';
  roundRect(ctx, s.x - s.w / 2, s.y - s.h / 2, s.w, 14, 10);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  roundRect(ctx, s.x - s.w / 2 + 4, s.y - s.h / 2 + 18, s.w - 8, s.h - 26, 8);
  ctx.fill();
  text(ctx, s.label, s.x, s.y - s.h / 2 + 8, 13, '#fff3d6');
  // Stasiun dengan isi gambar sendiri (talenan/wajan/panggangan/piring)
  // tidak memakai sub-label, supaya teksnya tidak bertumpuk.
  if (name !== 'chop' && name !== 'wok' && name !== 'grill' && name !== 'plate') {
    text(ctx, s.sub, s.x, s.y + s.h / 2 - 12, 10, '#d9c9a8');
  }
  if (active) {
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 3;
    roundRect(ctx, s.x - s.w / 2 - 3, s.y - s.h / 2 - 3, s.w + 6, s.h + 6, 12);
    ctx.stroke();
  }
}

function drawPantry(ctx, kitchen) {
  drawStation(ctx, 'pantry', kitchen, null);
  for (const box of pantryBoxes()) {
    const def = INGREDIENTS[box.id];
    ctx.fillStyle = '#fdf6e3';
    roundRect(ctx, box.x, box.y, box.w, box.h, 6);
    ctx.fill();
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, def.emoji, box.x + box.w / 2, box.y + 11, 16, '#333');
    text(ctx, def.name, box.x + box.w / 2, box.y + 26, 10, '#5a4632');
  }
}

function drawCookSlot(ctx, station, kitchen) {
  const s = STATIONS[station];
  const slot = kitchen.cooking[station];
  if (!slot) {
    text(ctx, station === 'wok' ? '🍳' : '🔥', s.x, s.y - 8, 30, '#333');
    text(ctx, 'kosong', s.x, s.y + 26, 11, '#8a7a5f');
    return;
  }
  const def = INGREDIENTS[slot.item.id];
  const t = slot.elapsed;
  const burnt = t >= def.burnSeconds;
  const perfect = t >= def.cookSeconds * 0.8 && t <= def.cookSeconds * 1.25;
  text(ctx, burnt ? '🔥' : def.emoji, s.x, s.y - 14, 30, '#333');
  // Timing bar: hijau = zona perfect, kuning = matang, merah = gosong.
  const w = s.w - 24;
  const x0 = s.x - w / 2;
  const y0 = s.y + 14;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  roundRect(ctx, x0, y0, w, 10, 5);
  ctx.fill();
  const greenStart = (def.cookSeconds * 0.8 / def.burnSeconds) * w;
  const greenEnd = (def.cookSeconds * 1.25 / def.burnSeconds) * w;
  ctx.fillStyle = '#7bc96f';
  ctx.fillRect(x0 + greenStart, y0, greenEnd - greenStart, 10);
  ctx.fillStyle = '#f2c94c';
  ctx.fillRect(x0 + greenEnd, y0, w - greenEnd, 10);
  const px = x0 + Math.min(1, t / def.burnSeconds) * w;
  ctx.fillStyle = burnt ? '#e05252' : perfect ? '#2f9e44' : '#333';
  ctx.fillRect(px - 2, y0 - 3, 4, 16);
  text(ctx, burnt ? 'GOSONG!' : perfect ? 'PERFECT!' : 'masak…', s.x, y0 + 15, 11, burnt ? '#c0392b' : '#5a4632');
}

function drawChop(ctx, kitchen) {
  const s = STATIONS.chop;
  if (kitchen.chopping) {
    text(ctx, INGREDIENTS[kitchen.chopping.item.id].emoji, s.x, s.y - 12, 30, '#333');
    bar(ctx, s.x - 55, s.y + 16, 110, 12, kitchen.chopping.progress, '#e07a5f');
    text(ctx, 'potong… tahan E ✂', s.x, s.y + 36, 11, '#5a4632');
  } else {
    text(ctx, '🔪', s.x, s.y - 8, 30, '#333');
    text(ctx, 'talenan kosong', s.x, s.y + 26, 11, '#8a7a5f');
  }
}

function drawPlate(ctx, kitchen) {
  const s = STATIONS.plate;
  // Piring putih besar.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - 4, 58, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (kitchen.plate.length === 0) {
    text(ctx, 'piring kosong', s.x, s.y - 4, 11, '#a89a7f');
  } else {
    kitchen.plate.forEach((item, i) => {
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(itemEmoji(item), s.x - 36 + i * 26, s.y - 8);
    });
  }
}

function drawServe(ctx, kitchen, orders) {
  const s = STATIONS.serve;
  text(ctx, '🛎️', s.x, s.y - 30, 34, '#333');
  text(ctx, 'JENDELA', s.x, s.y + 8, 12, '#5a4632');
  text(ctx, 'ANTAR', s.x, s.y + 26, 12, '#5a4632');
  const ready = orders.active.length > 0 && kitchen.plate.length > 0;
  if (ready) {
    text(ctx, '✦ SIAP ANTAR ✦', s.x, s.y + 42, 11, '#2f9e44');
  }
}

function drawChef(ctx, kitchen, holding) {
  const c = kitchen.chef;
  // Bayangan.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Badan + celemek.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, c.x - 16, c.y - 6, 32, 34, 10);
  ctx.fill();
  ctx.fillStyle = '#e05252';
  roundRect(ctx, c.x - 12, c.y + 2, 24, 22, 6);
  ctx.fill();
  // Kepala + topi koki.
  ctx.fillStyle = '#f2c49b';
  ctx.beginPath();
  ctx.arc(c.x, c.y - 16, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(c.x - 6, c.y - 26, 7, 0, Math.PI * 2);
  ctx.arc(c.x + 6, c.y - 26, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(c.x - 5, c.y - 16, 1.8, 0, Math.PI * 2);
  ctx.arc(c.x + 5, c.y - 16, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Barang di tangan, di atas kepala.
  if (kitchen.hands) {
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(itemEmoji(kitchen.hands), c.x, c.y - 44);
    text(ctx, itemLabel(kitchen.hands), c.x, c.y - 60, 10, '#fff', 'center');
  }
  if (holding) {
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 30, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Gambar seluruh permainan untuk satu frame. */
export function render(ctx, game) {
  const { kitchen, orders, score, coins, combo, timeLeft, screen, message, muted, bestCombo, served, missed } = game;
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  // Dinding + lantai warung.
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(0, 0, VIEW.width, 230);
  ctx.fillStyle = '#8a5a35';
  for (let x = 0; x < VIEW.width; x += 90) {
    ctx.fillRect(x, 0, 4, 230);
  }
  text(ctx, '🍜  WARUNG RUSH  🍛', VIEW.width / 2, 26, 26, '#ffe9b0');
  text(ctx, 'dapur street-food — masak cepat, antar sebelum pelanggan kabur!', VIEW.width / 2, 52, 13, '#f2d8a7');
  // Lantai ubin.
  ctx.fillStyle = '#c9a06a';
  ctx.fillRect(0, 230, VIEW.width, VIEW.height - 230);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW.width; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 230); ctx.lineTo(x, VIEW.height); ctx.stroke();
  }
  for (let y = 230; y <= VIEW.height; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
  }

  // Order board (kiri atas, di bawah judul) + pelanggan.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, 28, 66, 250, 150, 10);
  ctx.fill();
  text(ctx, '📋 ORDER BOARD', 153, 84, 15, '#ffe9b0');
  if (orders.active.length === 0) {
    text(ctx, 'belum ada order…', 153, 140, 13, '#f2d8a7');
  }
  orders.active.forEach((order, i) => {
    drawOrderTicket(ctx, order, 36 + (i % 2) * 122, 96 + Math.floor(i / 2) * 58, 114, 52);
    drawCustomer(ctx, order);
  });
  // Slot pelanggan kosong: kursi kosong.
  for (let slot = 0; slot < 4; slot += 1) {
    if (!orders.active.some((o) => o.slot === slot)) {
      const pos = CUSTOMER_SLOTS[slot];
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🪑', pos.x, pos.y);
    }
  }

  // HUD kanan atas: timer besar, skor, koin, kombo.
  const mins = Math.max(0, Math.floor(timeLeft / 60));
  const secs = Math.max(0, Math.floor(timeLeft % 60));
  const timerText = `${mins}:${String(secs).padStart(2, '0')}`;
  const lowTime = timeLeft <= 30;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(ctx, 1050, 66, 202, 150, 10);
  ctx.fill();
  text(ctx, '⏱ SHIFT', 1151, 84, 13, '#ffe9b0');
  text(ctx, timerText, 1151, 118, 38, lowTime && Math.floor(performance.now() / 400) % 2 === 0 ? '#ff6b6b' : '#ffffff');
  bar(ctx, 1066, 142, 170, 8, Math.max(0, timeLeft / SHIFT_SECONDS), lowTime ? '#e05252' : '#7bc96f');
  text(ctx, `⭐ Skor ${score}   🪙 ${coins}`, 1151, 164, 14, '#ffe9b0');
  text(ctx, combo > 1 ? `🔥 KOMBO x${combo}` : 'kombo x1 — antar beruntun!', 1151, 188, 13, combo > 1 ? '#ffe066' : '#d9c9a8');
  if (timeLeft <= 60 && timeLeft > 0) {
    text(ctx, '⚡ RUSH HOUR!', 1151, 206, 12, '#ffb703');
  }

  // Stasiun dapur (pantry digambar sendiri karena berisi rak bahan).
  drawPantry(ctx, kitchen);
  const nearest = nearestStationName(kitchen);
  for (const name of ['chop', 'wok', 'grill', 'plate', 'serve', 'trash']) {
    drawStation(ctx, name, kitchen, nearest === name ? name : null);
  }
  drawChop(ctx, kitchen);
  drawCookSlot(ctx, 'wok', kitchen);
  drawCookSlot(ctx, 'grill', kitchen);
  drawPlate(ctx, kitchen);
  drawServe(ctx, kitchen, orders);

  // Koki + efek.
  drawChef(ctx, kitchen, game.holdingInteract);
  for (const e of kitchen.effects) {
    const label = e.kind === 'pick' ? '👋 ambil!' : e.kind === 'plate' ? '🍽️ di piring!' : '✂️ potong!';
    text(ctx, label, e.x, e.y - 14, 13, '#fff');
  }

  // Pesan aksi singkat di bawah layar.
  if (message) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, VIEW.width / 2 - 220, VIEW.height - 44, 440, 30, 15);
    ctx.fill();
    text(ctx, message, VIEW.width / 2, VIEW.height - 28, 14, '#ffe9b0');
  }

  // Petunjuk kontrol.
  text(ctx, 'WASD/panah gerak • E/Spasi interaksi (tahan untuk potong) • klik stasiun/bahan • P jeda • M suara', VIEW.width / 2, VIEW.height - 8, 11, 'rgba(255,255,255,0.75)');
  text(ctx, muted ? '🔇 bisu (M)' : '🔊 suara (M)', 60, VIEW.height - 8, 11, 'rgba(255,255,255,0.75)', 'left');

  if (screen === SCREEN_TITLE) drawTitle(ctx);
  if (screen === SCREEN_PAUSE) drawPause(ctx);
  if (screen === SCREEN_OVER) drawOver(ctx, { score, coins, served, missed, bestCombo });
}

function nearestStationName(kitchen) {
  // Dipakai render untuk sorot stasiun terdekat; dihitung dari posisi koki.
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

function overlay(ctx) {
  ctx.fillStyle = 'rgba(20,10,5,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawTitle(ctx) {
  overlay(ctx);
  text(ctx, '🍜 WARUNG RUSH 🍛', VIEW.width / 2, 210, 54, '#ffe9b0');
  text(ctx, 'Kamu koki di warung street-food. Pelanggan lapar, waktu jalan terus!', VIEW.width / 2, 268, 18, '#ffffff');
  text(ctx, 'Ambil bahan → potong di talenan → masak di wajan/panggangan (angkat pas hijau!)', VIEW.width / 2, 306, 16, '#ffe9b0');
  text(ctx, 'Rakit di piring sesuai resep → antar ke jendela sebelum kesabaran habis.', VIEW.width / 2, 332, 16, '#ffe9b0');
  text(ctx, '6 resep • kombo beruntun • rush hour di menit terakhir • shift 3 menit', VIEW.width / 2, 368, 15, '#d9c9a8');
  ctx.fillStyle = '#e05252';
  roundRect(ctx, VIEW.width / 2 - 190, 400, 380, 56, 12);
  ctx.fill();
  text(ctx, '▶  MULAI SHIFT  (tekan E / klik)', VIEW.width / 2, 429, 20, '#ffffff');
  text(ctx, 'WASD / panah: gerak   •   E / Spasi: interaksi   •   klik: jalan + pakai stasiun', VIEW.width / 2, 490, 14, '#ffffff');
  text(ctx, 'P: jeda   •   M: suara', VIEW.width / 2, 516, 14, '#ffffff');
}

function drawPause(ctx) {
  overlay(ctx);
  text(ctx, '⏸ JEDA', VIEW.width / 2, 300, 48, '#ffe9b0');
  text(ctx, 'Tekan P lagi untuk lanjut masak.', VIEW.width / 2, 360, 18, '#ffffff');
}

function drawOver(ctx, stats) {
  overlay(ctx);
  text(ctx, '🏁 SHIFT SELESAI!', VIEW.width / 2, 200, 48, '#ffe9b0');
  text(ctx, `⭐ Skor akhir: ${stats.score}      🪙 Koin: ${stats.coins}`, VIEW.width / 2, 272, 24, '#ffffff');
  text(ctx, `🍜 Pesanan diantar: ${stats.served}    💨 Hangus/lewat: ${stats.missed}    🔥 Kombo terbaik: x${stats.bestCombo}`, VIEW.width / 2, 316, 18, '#ffe9b0');
  const verdict = stats.score >= 600 ? 'Warungmu LEGENDARIS! 🏆' : stats.score >= 350 ? 'Koki andal — pelanggan pulang senang!' : stats.score >= 150 ? 'Lumayan! Latihan lagi, koki!' : 'Warung sepi… coba lagi, koki!';
  text(ctx, verdict, VIEW.width / 2, 360, 20, '#ffffff');
  text(ctx, 'Tekan R untuk main lagi', VIEW.width / 2, 420, 16, '#ffe9b0');
}
