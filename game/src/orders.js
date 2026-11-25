// Warung Rush — orders: pelanggan datang, tiket order, kesabaran, tip.
// Satu order = satu resep + satu pelanggan di satu slot. Piring yang cocok
// dengan resep (bahan + olahan) bisa disajikan; kesabaran habis = order hangus.
import { CUSTOMER_SLOTS, MAX_ORDERS, PATIENCE_EASY, PATIENCE_RUSH, RECIPES, RECIPE_BY_ID, RUSH_AFTER_SECONDS, SPAWN_EASY_SECONDS, SPAWN_RUSH_SECONDS } from './config.js';

const CUSTOMER_FACES = ['🧑🏽', '👩🏽', '🧔🏽', '👵🏽', '👨🏽', '🧕🏽', '👱🏽', '🧓🏽'];
const CUSTOMER_COLORS = ['#f4a259', '#e07a5f', '#81b29a', '#f2cc8f', '#90be6d', '#f28482', '#84a59d', '#b5838d'];

let nextOrderId = 1;

/** Buat order baru untuk resep acak; slot = indeks pelanggan (0..3). */
export function makeOrder(recipe, slot, patience, now) {
  return {
    id: nextOrderId,
    recipeId: recipe.id,
    slot,
    face: CUSTOMER_FACES[(nextOrderId + slot) % CUSTOMER_FACES.length],
    color: CUSTOMER_COLORS[(nextOrderId * 3 + slot) % CUSTOMER_COLORS.length],
    patience,
    patienceMax: patience,
    bornAt: now,
  };
}

/** State order: daftar aktif + timer spawn berikutnya. */
export function createOrderState() {
  return { active: [], spawnIn: 6, elapsed: 0 };
}

/** Pilih resep acak, utamakan yang belum dipesan saat ini. */
function pickRecipe(active) {
  const used = new Set(active.map((o) => o.recipeId));
  const fresh = RECIPES.filter((r) => !used.has(r.id));
  const pool = fresh.length > 0 ? fresh : RECIPES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Maju satu langkah waktu. Kembalikan daftar order yang kesabarannya habis
 * (dipakai main.js untuk memutus combo + bunyi gagal).
 */
export function updateOrders(state, dt, onExpired) {
  state.elapsed += dt;
  const rush = state.elapsed >= RUSH_AFTER_SECONDS;
  const patience = rush ? PATIENCE_RUSH : PATIENCE_EASY;
  const spawnEvery = rush ? SPAWN_RUSH_SECONDS : SPAWN_EASY_SECONDS;

  const expired = [];
  for (const order of state.active) {
    order.patience -= dt;
    if (order.patience <= 0) expired.push(order);
  }
  for (const order of expired) {
    state.active.splice(state.active.indexOf(order), 1);
    if (onExpired) onExpired(order);
  }

  if (state.active.length < MAX_ORDERS) {
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      const taken = new Set(state.active.map((o) => o.slot));
      let slot = 0;
      while (taken.has(slot) && slot < MAX_ORDERS) slot += 1;
      if (slot < MAX_ORDERS) {
        const order = makeOrder(pickRecipe(state.active), slot, patience, state.elapsed);
        state.active.push(order);
      }
      state.spawnIn = spawnEvery * (0.85 + Math.random() * 0.3);
    }
  }
  return expired;
}

/** Apakah isi piring (daftar item) memenuhi resep order ini? */
export function plateMatchesOrder(plateItems, order) {
  const recipe = RECIPE_BY_ID[order.recipeId];
  if (plateItems.length !== recipe.needs.length) return false;
  const remaining = recipe.needs.map((n) => ({ ...n }));
  for (const item of plateItems) {
    const index = remaining.findIndex((n) => n.id === item.id && olahMatches(n.olah, item));
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return remaining.length === 0;
}

/** Cocokkan syarat olahan resep dengan keadaan bahan di piring. */
export function olahMatches(need, item) {
  if (item.burnt) return false;
  if (need === 'raw') return !item.chopped && !item.cooked;
  if (need === 'chopped') return item.chopped && !item.cooked;
  if (need === 'cooked') return item.cooked;
  if (need === 'perfect') return item.cooked && item.perfect;
  return false;
}

/** Order pertama (paling lama menunggu) yang cocok dengan isi piring. */
export function findMatchingOrder(active, plateItems) {
  const sorted = [...active].sort((a, b) => a.patience - b.patience);
  return sorted.find((o) => plateMatchesOrder(plateItems, o)) ?? null;
}

/** Tip dari sisa kesabaran: sampai +50 saat pelanggan masih sangat sabar. */
export function tipFor(order) {
  const fraction = Math.max(0, order.patience / order.patienceMax);
  return Math.round(50 * fraction);
}

/** Posisi pelanggan untuk slot order ini (dipakai render). */
export function customerPos(order) {
  return CUSTOMER_SLOTS[order.slot];
}
