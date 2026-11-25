// Warung Rush — shots: adegan deterministik untuk screenshot.
// Setiap adegan membangun state permainan yang nyata (order, piring,
// timer, masakan di wajan) lalu mengembalikan layar + skor yang ditampilkan,
// supaya screenshot adalah render asli dari kode game, bukan gambar tempel.
import { RECIPES } from './config.js';
import { makeOrder } from './orders.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { freshItem } from './kitchen.js';

function orderFor(game, recipeId, slot, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const order = makeOrder(recipe, slot, patience, 0);
  order.patienceMax = patience;
  return order;
}

/**
 * Siapkan `game` untuk adegan bernama (cover|play|rush|end) dan kembalikan
 * { screen, score, timeLeft, combo, served, message }.
 */
export function stageShot(name, game) {
  const kitchen = game.kitchen;
  kitchen.chef.x = 560;
  kitchen.chef.y = 480;

  if (name === 'end') {
    game.orders.active = [];
    kitchen.plate = [];
    kitchen.hands = null;
    return {
      screen: SCREEN_OVER,
      score: 740,
      timeLeft: 0,
      combo: 3,
      served: 8,
      message: '',
    };
  }

  if (name === 'rush') {
    game.orders.active = [
      orderFor(game, 'nasi-goreng', 0, 18),
      orderFor(game, 'sate-ayam', 1, 12),
      orderFor(game, 'mie-goreng', 2, 24),
      orderFor(game, 'es-teh', 3, 9),
    ];
    kitchen.plate = [freshItem('nasi'), freshItem('telur')];
    kitchen.plate[0].cooked = true;
    kitchen.plate[1].cooked = true;
    kitchen.hands = freshItem('bumbu');
    kitchen.cooking.wok = { station: 'wok', item: freshItem('mie'), elapsed: 4.6 };
    kitchen.cooking.grill = { station: 'grill', item: freshItem('ayam'), elapsed: 5.2 };
    kitchen.cooking.grill.item.chopped = true;
    return {
      screen: SCREEN_PLAY,
      score: 520,
      timeLeft: 42,
      combo: 3,
      served: 6,
      message: '⚡ RUSH HOUR — order makin cepat!',
    };
  }

  if (name === 'play') {
    game.orders.active = [
      orderFor(game, 'mie-goreng', 0, 48),
      orderFor(game, 'gado-gado', 1, 60),
    ];
    kitchen.plate = [freshItem('mie')];
    kitchen.plate[0].cooked = true;
    kitchen.hands = freshItem('sayur');
    kitchen.hands.chopped = true;
    kitchen.cooking.wok = { station: 'wok', item: freshItem('nasi'), elapsed: 3.1 };
    return {
      screen: SCREEN_PLAY,
      score: 230,
      timeLeft: 121,
      combo: 2,
      served: 3,
      message: 'Mie matang! Taruh di piring.',
    };
  }

  // cover (default): kondisi terbaik — board penuh, piring mid-assembly,
  // satu piring siap saji (di tangan koki: bumbu terakhir), timer besar.
  game.orders.active = [
    orderFor(game, 'nasi-goreng', 0, 52),
    orderFor(game, 'sate-ayam', 1, 38),
    orderFor(game, 'mie-goreng', 2, 61),
    orderFor(game, 'pisang-goreng', 3, 44),
  ];
  kitchen.plate = [freshItem('nasi'), freshItem('telur')];
  kitchen.plate[0].cooked = true;
  kitchen.plate[1].cooked = true;
  kitchen.hands = freshItem('bumbu');
  kitchen.cooking.wok = { station: 'wok', item: freshItem('mie'), elapsed: 4.4 };
  kitchen.cooking.grill = { station: 'grill', item: freshItem('ayam'), elapsed: 5.0 };
  kitchen.cooking.grill.item.chopped = true;
  kitchen.chopping = null;
  return {
    screen: SCREEN_PLAY,
    score: 310,
    timeLeft: 151,
    combo: 2,
    served: 4,
    message: 'Nasi Goreng hampir jadi — taruh bumbu lalu antar! 🍛',
  };
}
